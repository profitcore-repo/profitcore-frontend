import {
  MAX_CMV_ITEMS_PER_REQUEST,
  type ProblemDetails,
  type SkuResponse,
  type UpdateSkuCmvItemRequest,
} from '@/types/api';
import { writableRows, type ImportPlan } from '@/features/skus/import/cmvImportPlan';

/**
 * Gravação das linhas aprovadas no preview, sobre o `PUT /skus/cmv`.
 *
 * O endpoint é tudo ou nada: um SKU recusado derruba a transação inteira. A
 * importação precisa do contrário — gravar o que der e apontar o que falhou —,
 * então este módulo isola os itens recusados e reenvia o resto:
 *
 * - **404** traz no `detail` os ids recusados. Eles viram falha e o restante do
 *   bloco é reenviado.
 * - **Outro 4xx**, ou 404 sem ids legíveis, divide o bloco ao meio até chegar ao
 *   item culpado. Com blocos de {@link BLOCK_SIZE} são no máximo ~7 níveis.
 * - **Rede ou 5xx** repete com espera; persistindo, interrompe a importação. O
 *   bloco não foi gravado, então ele e os seguintes voltam como pendentes.
 * - **401/403** interrompe na hora: sessão expirada falharia em todo bloco.
 *
 * Blocos menores que o limite do backend existem só para a barra de progresso
 * andar e para uma divisão custar pouco.
 */

const BLOCK_SIZE = Math.min(100, MAX_CMV_ITEMS_PER_REQUEST);

/** Tentativas extras por requisição, além da primeira. */
const MAX_RETRIES = 2;

const RETRY_DELAYS_MS = [250, 1000];

const NOT_FOUND_MESSAGE =
  'SKU não encontrado. Ele pode ter sido removido ou pertencer a outra conta.';

export type CommitTarget = {
  /** Linha da planilha, para o relatório falar a língua do usuário. */
  lineNumber: number;
  skuId: string;
  code: string;
  title: string | null;
  cmv: number;
};

export type CommitFailure = CommitTarget & { message: string };

export type CommitReport = {
  /** SKUs gravados, como o backend devolveu. Alimenta `applyCmvBatch`. */
  updated: SkuResponse[];
  /** Linhas que o backend recusou, com o motivo. */
  failures: CommitFailure[];
  /** Linhas não gravadas por interrupção; nada nelas foi recusado. */
  skipped: CommitTarget[];
  /** Interrompido pelo usuário. */
  canceled: boolean;
  /** Interrompido porque o servidor ficou indisponível ou recusou a sessão. */
  stoppedByFailures: boolean;
  /** Motivo da interrupção, quando `stoppedByFailures`. */
  stopMessage: string | null;
};

export type SaveCmvBatch = (
  items: readonly UpdateSkuCmvItemRequest[],
) => Promise<SkuResponse[]>;

export type CommitOptions = {
  /**
   * Gravação de um lote. Exigido em vez de ter um default apontando para o
   * `api`: mantém este módulo livre do cliente HTTP e do ambiente, e deixa o
   * ponto de contato com a rede explícito em quem chama.
   */
  save: SaveCmvBatch;
  onProgress?: (done: number, total: number) => void;
  signal?: AbortSignal;
};

/** Converte o plano aprovado na lista de gravações, na ordem da planilha. */
export function commitTargets(plan: ImportPlan): CommitTarget[] {
  return writableRows(plan).map((row) => ({
    lineNumber: row.lineNumber,
    // `willWrite` já garante `match` e `cmv` não nulos.
    skuId: row.match!.skuId,
    code: row.match!.code,
    title: row.match!.title,
    cmv: row.cmv!,
  }));
}

/** Sinaliza que a importação deve parar; o bloco atual volta como pendente. */
class StopCommit extends Error {}

export async function commitCmvImport(
  targets: readonly CommitTarget[],
  options: CommitOptions,
): Promise<CommitReport> {
  const { save, onProgress, signal } = options;

  const updated: SkuResponse[] = [];
  const failures: CommitFailure[] = [];
  const settledLines = new Set<number>();
  let stopMessage: string | null = null;

  const settle = (lines: readonly CommitTarget[]) => {
    for (const target of lines) settledLines.add(target.lineNumber);
    onProgress?.(settledLines.size, targets.length);
  };

  const fail = (target: CommitTarget, message: string) => {
    failures.push({ ...target, message });
    settle([target]);
  };

  /** Grava `block`, isolando os itens recusados até sobrar só o que passa. */
  async function writeBlock(block: readonly CommitTarget[]): Promise<void> {
    if (block.length === 0) return;
    if (signal?.aborted) throw new StopCommit();

    const result = await send(block, save, signal);

    if (result.kind === 'ok') {
      updated.push(...result.skus);
      settle(block);
      return;
    }

    if (result.kind === 'canceled') throw new StopCommit();

    if (result.kind === 'stop') {
      stopMessage = result.message;
      throw new StopCommit();
    }

    // Recusa por dado: o 404 diz quem foi; senão, divide até achar.
    if (result.status === 404) {
      const rejected = rejectedIds(result.problem);
      const culprits = block.filter((t) => rejected.has(t.skuId.toLowerCase()));
      if (culprits.length > 0) {
        for (const target of culprits) fail(target, NOT_FOUND_MESSAGE);
        await writeBlock(block.filter((t) => !rejected.has(t.skuId.toLowerCase())));
        return;
      }
    }

    if (block.length === 1) {
      fail(block[0], result.status === 404 ? NOT_FOUND_MESSAGE : result.message);
      return;
    }

    const middle = Math.ceil(block.length / 2);
    await writeBlock(block.slice(0, middle));
    await writeBlock(block.slice(middle));
  }

  try {
    for (const block of blocksOf(targets)) {
      await writeBlock(block);
    }
  } catch (err) {
    if (!(err instanceof StopCommit)) throw err;
  }

  const canceled = signal?.aborted === true;

  return {
    updated,
    failures,
    skipped: targets.filter((target) => !settledLines.has(target.lineNumber)),
    canceled,
    stoppedByFailures: stopMessage !== null,
    stopMessage,
  };
}

/**
 * Blocos de até {@link BLOCK_SIZE}, sem `skuId` repetido no mesmo bloco — o
 * backend recusa o lote inteiro com 400 nesse caso. O plano já deduplica; isto
 * só garante que uma regressão lá não vire falha de linhas inocentes.
 */
function blocksOf(targets: readonly CommitTarget[]): CommitTarget[][] {
  const blocks: CommitTarget[][] = [];
  let current: CommitTarget[] = [];
  let ids = new Set<string>();

  for (const target of targets) {
    const id = target.skuId.toLowerCase();
    if (current.length >= BLOCK_SIZE || ids.has(id)) {
      blocks.push(current);
      current = [];
      ids = new Set();
    }
    current.push(target);
    ids.add(id);
  }

  if (current.length > 0) blocks.push(current);
  return blocks;
}

/* -------------------------------------------------------------------------- *
 * Uma requisição, com repetição
 * -------------------------------------------------------------------------- */

type SendResult =
  | { kind: 'ok'; skus: SkuResponse[] }
  | { kind: 'canceled' }
  /** Não adianta seguir: servidor fora ou sessão recusada. */
  | { kind: 'stop'; message: string }
  /** Recusa do backend por causa do conteúdo do bloco. */
  | { kind: 'rejected'; status: number; problem: ProblemDetails; message: string };

async function send(
  block: readonly CommitTarget[],
  save: SaveCmvBatch,
  signal: AbortSignal | undefined,
): Promise<SendResult> {
  const items = block.map(({ skuId, cmv }) => ({ id: skuId, cmv }));

  for (let tryNumber = 0; ; tryNumber += 1) {
    if (signal?.aborted) return { kind: 'canceled' };

    try {
      return { kind: 'ok', skus: await save(items) };
    } catch (err) {
      const problem = problemOf(err);

      if (problem && (problem.status === 401 || problem.status === 403)) {
        return {
          kind: 'stop',
          message:
            'Sua sessão expirou ou não tem permissão para gravar. Entre de novo e tente as linhas pendentes.',
        };
      }

      // 4xx é problema do dado: repetir daria o mesmo erro.
      if (problem && problem.status < 500) {
        return {
          kind: 'rejected',
          status: problem.status,
          problem,
          message: problem.detail || messageOf(err),
        };
      }

      if (tryNumber >= MAX_RETRIES) {
        return {
          kind: 'stop',
          message:
            'O servidor não respondeu depois de várias tentativas — em geral é queda de conexão ou instabilidade. O que já foi gravado está salvo; tente novamente as linhas pendentes.',
        };
      }

      const slept = await sleep(RETRY_DELAYS_MS[tryNumber], signal);
      if (!slept) return { kind: 'canceled' };
    }
  }
}

const GUID_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

/** Ids citados no `detail` do 404 (`SKU(s) não encontrado(s): {id}, {id}.`). */
function rejectedIds(problem: ProblemDetails): Set<string> {
  const matches = problem.detail?.match(GUID_PATTERN) ?? [];
  return new Set(matches.map((id) => id.toLowerCase()));
}

function problemOf(err: unknown): ProblemDetails | undefined {
  return typeof err === 'object' && err !== null
    ? (err as { problem?: ProblemDetails }).problem
    : undefined;
}

function messageOf(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  return 'Falha ao salvar.';
}

/** `false` quando o cancelamento chegou durante a espera. */
function sleep(ms: number, signal: AbortSignal | undefined): Promise<boolean> {
  return new Promise((resolve) => {
    if (signal?.aborted) {
      resolve(false);
      return;
    }

    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve(true);
    }, ms);

    function onAbort() {
      clearTimeout(timer);
      resolve(false);
    }

    signal?.addEventListener('abort', onAbort, { once: true });
  });
}
