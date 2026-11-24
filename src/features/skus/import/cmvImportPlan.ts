import { isCmvAboveObservedPrice, validateCmvInput } from '@/features/skus/cmv';
import {
  cellAt,
  dataRows,
  type SheetCell,
  type SheetGrid,
  type SheetRow,
} from '@/features/skus/import/spreadsheetSource';
import {
  findByCode,
  findByTitleExact,
  findTitleCandidates,
  normalizeTitle,
  type SkuEntry,
  type SkuIndex,
} from '@/features/skus/import/skuIndex';
import { normalizeSkuCode, type OrderItemAggregate } from '@/features/skus/skuSales';
import { roundToCents } from '@/utils/currency';

/**
 * Transforma a planilha mapeada no plano de importação: o que vai ser gravado,
 * o que precisa de confirmação, o que foi ignorado e por quê.
 *
 * É aqui que a importação decide, e por isso tudo é puro e derivável. Cada
 * linha guarda a classificação automática (`autoStatus`, `autoMatch`) separada
 * do estado efetivo (`status`, `match`): o efetivo é recalculado a partir do
 * automático mais as decisões do usuário, toda vez. Confirmar uma linha não
 * muta nada, recalcula — o que elimina a classe de bug em que o contador do
 * cabeçalho discorda da tabela logo abaixo.
 *
 * Nenhuma escrita acontece neste módulo. O plano é só uma descrição, e é ela
 * que o preview mostra antes de qualquer `PUT`.
 */

/** Similaridade mínima para o candidato entrar na lista de opções. */
export const FUZZY_CANDIDATE_MIN = 0.7;

/** Similaridade mínima para o candidato vir pré-selecionado. */
export const FUZZY_PRESELECT_MIN = 0.85;

/** Folga mínima sobre o segundo colocado para pré-selecionar. */
export const FUZZY_PRESELECT_LEAD = 0.08;

/** Linhas processadas entre cessões ao event loop. */
const CHUNK_SIZE = 250;

const ML_CODE_GLOBAL = /MLB\s*\d{6,}/gi;

export type MatchKind =
  /** Código do anúncio idêntico. */
  | 'code'
  /** Código do anúncio encontrado dentro de um texto maior. */
  | 'code-embedded'
  /** Título idêntico depois de normalizar. */
  | 'title-exact'
  /** Título parecido. Nunca grava sem confirmação. */
  | 'title-fuzzy'
  /** Escolhido pelo usuário no preview. */
  | 'manual';

export type RowStatus =
  /** Pareada com confiança e valor novo: será gravada. */
  | 'ready'
  /** Pareamento incerto ou ambíguo: só grava se o usuário confirmar. */
  | 'needs-confirmation'
  /** Pareada, mas o valor já é o que está gravado: nada a fazer. */
  | 'unchanged'
  /** Coluna de CMV ilegível ou negativa. */
  | 'invalid-value'
  /** Nenhum SKU correspondente. */
  | 'unmatched'
  /** Célula de CMV em branco: ignorada, nunca apaga custo. */
  | 'empty-value'
  /** Outra linha, mais abaixo, pareia com o mesmo SKU. */
  | 'duplicate'
  /** Descartada pelo usuário no preview. */
  | 'ignored';

export type MatchCandidate = {
  skuId: string;
  code: string;
  title: string | null;
  /** CMV gravado hoje, para o preview mostrar o antes e o depois. */
  currentCmv: number | null;
  kind: MatchKind;
  /** 0..1 em `title-fuzzy`; 1 nos pareamentos exatos e na escolha manual. */
  score: number;
};

export type ImportRow = {
  /** Número da linha na planilha, como o Excel mostra. */
  lineNumber: number;
  /** Texto lido da coluna identificadora. */
  rawKey: string;
  /** Texto lido da coluna de CMV. */
  rawCmv: string;
  /** CMV a gravar. `null` quando a célula estava vazia ou ilegível. */
  cmv: number | null;

  /** Classificação automática, imutável depois da montagem. */
  autoStatus: RowStatus;
  autoMatch: MatchCandidate | null;

  /** Estado efetivo: automático + decisão do usuário + duplicatas. */
  status: RowStatus;
  match: MatchCandidate | null;

  /** Opções oferecidas quando o pareamento é incerto. */
  candidates: MatchCandidate[];
  /** Custo acima do preço médio praticado. Avisa, não bloqueia. */
  aboveObservedPrice: boolean;
  /** Explicação pronta para a tela quando o status não basta. */
  reason: string | null;
};

export type ImportCounts = {
  total: number;
  ready: number;
  needsConfirmation: number;
  unchanged: number;
  invalidValue: number;
  unmatched: number;
  emptyValue: number;
  duplicate: number;
  ignored: number;
  /** Quantas linhas o botão de importar vai gravar. */
  willWrite: number;
  /** Quantas das que vão gravar têm custo acima do preço praticado. */
  aboveObservedPrice: number;
};

export type ImportPlan = {
  rows: ImportRow[];
  counts: ImportCounts;
};

/**
 * Decisão do usuário sobre uma linha, indexada pelo número de linha.
 * `skuId: null` significa "ignorar esta linha".
 */
export type RowOverride = { skuId: string | null };
export type RowOverrides = Map<number, RowOverride>;

export type ColumnMapping = {
  keyColumn: number;
  cmvColumn: number;
  hasHeader: boolean;
};

export type PlanContext = {
  index: SkuIndex;
  /** Para o aviso de custo acima do preço praticado. Pode estar vazio. */
  salesIndex: Map<string, OrderItemAggregate>;
};

export type BuildPlanOptions = {
  onProgress?: (processed: number, total: number) => void;
  signal?: AbortSignal;
};

/* -------------------------------------------------------------------------- *
 * Construção
 * -------------------------------------------------------------------------- */

/**
 * Classifica todas as linhas da planilha.
 *
 * Assíncrono porque o pareamento aproximado custa fração de milissegundo por
 * linha, e numa planilha de 20.000 linhas isso somaria segundos de aba
 * congelada. Cede o event loop a cada `CHUNK_SIZE` linhas e reporta progresso.
 */
export async function buildImportPlan(
  grid: SheetGrid,
  mapping: ColumnMapping,
  context: PlanContext,
  options: BuildPlanOptions = {},
): Promise<ImportPlan> {
  const { onProgress, signal } = options;
  const rows = dataRows(grid, mapping.hasHeader);
  const classified: ImportRow[] = [];

  for (let i = 0; i < rows.length; i += 1) {
    if (signal?.aborted) throw new DOMException('Importação cancelada.', 'AbortError');

    classified.push(classifyRow(rows[i], mapping, context));

    if ((i + 1) % CHUNK_SIZE === 0) {
      onProgress?.(i + 1, rows.length);
      await yieldToEventLoop();
    }
  }

  onProgress?.(rows.length, rows.length);

  return derive(classified, context, new Map());
}

/** Recalcula o plano a partir das decisões tomadas no preview. */
export function applyOverrides(
  plan: ImportPlan,
  context: PlanContext,
  overrides: RowOverrides,
): ImportPlan {
  return derive(plan.rows, context, overrides);
}

/**
 * Uma linha grava quando está pronta, tem SKU escolhido e o valor é diferente
 * do gravado.
 *
 * A última condição não é detalhe: numa reimportação da mesma planilha ela é a
 * diferença entre 300 requisições e nenhuma.
 */
export function willWrite(row: ImportRow): boolean {
  return row.status === 'ready' && row.match !== null && row.cmv !== null;
}

/** Linhas que o commit vai gravar, na ordem da planilha. */
export function writableRows(plan: ImportPlan): ImportRow[] {
  return plan.rows.filter(willWrite);
}

/* -------------------------------------------------------------------------- *
 * Classificação de uma linha
 * -------------------------------------------------------------------------- */

function classifyRow(
  row: SheetRow,
  mapping: ColumnMapping,
  context: PlanContext,
): ImportRow {
  const rawKey = cellAt(row, mapping.keyColumn).text.trim();
  const cmvCell = cellAt(row, mapping.cmvColumn);
  const rawCmv = cmvCell.text.trim();

  const make = (
    autoStatus: RowStatus,
    extra: Partial<ImportRow> = {},
  ): ImportRow => ({
    lineNumber: row.lineNumber,
    rawKey,
    rawCmv,
    cmv: null,
    autoStatus,
    autoMatch: null,
    status: autoStatus,
    match: null,
    candidates: [],
    aboveObservedPrice: false,
    reason: null,
    ...extra,
  });

  // Vazio vem antes de tudo: numa planilha com a coluna de custo pela metade,
  // o que importa é que essas linhas não toquem no CMV já informado.
  if (rawCmv === '') {
    return make('empty-value', { reason: 'Sem custo preenchido nesta linha.' });
  }

  const parsed = parseCmvCell(cmvCell);
  const match = resolveMatch(rawKey, context.index);

  if (parsed.kind === 'invalid') {
    // Mostra o produto que teria recebido o valor: ajuda o lojista a achar a
    // linha no Excel dele.
    return make('invalid-value', {
      autoMatch: match.selected,
      match: match.selected,
      candidates: match.candidates,
      reason: parsed.error,
    });
  }

  if (rawKey === '') {
    return make('unmatched', {
      cmv: parsed.value,
      reason: 'Esta linha não tem identificador do produto.',
    });
  }

  if (match.candidates.length === 0) {
    return make('unmatched', {
      cmv: parsed.value,
      reason: 'Nenhum produto seu corresponde a este identificador.',
    });
  }

  const autoStatus: RowStatus =
    match.selected === null || match.requiresConfirmation ? 'needs-confirmation' : 'ready';

  return make(autoStatus, {
    cmv: parsed.value,
    autoMatch: match.selected,
    match: match.selected,
    candidates: match.candidates,
    reason: match.reason,
  });
}

type ResolvedMatch = {
  /** Pré-seleção. `null` quando o usuário precisa escolher entre os candidatos. */
  selected: MatchCandidate | null;
  candidates: MatchCandidate[];
  requiresConfirmation: boolean;
  reason: string | null;
};

const NO_MATCH: ResolvedMatch = {
  selected: null,
  candidates: [],
  requiresConfirmation: false,
  reason: null,
};

function resolveMatch(rawKey: string, index: SkuIndex): ResolvedMatch {
  if (rawKey === '') return NO_MATCH;

  // 1. Código do anúncio idêntico.
  const exactCode = findByCode(index, rawKey);
  if (exactCode) return single(exactCode, 'code');

  // 2. Código dentro de um texto maior ("MLB123456789 - Camisa Azul"). Só vale
  //    com uma ocorrência: duas tornam a linha genuinamente ambígua.
  const embedded = rawKey.match(ML_CODE_GLOBAL);
  if (embedded && embedded.length === 1) {
    const entry = findByCode(index, embedded[0].replace(/\s+/g, ''));
    if (entry) return single(entry, 'code-embedded');
  }

  // 3. Título idêntico depois de normalizar.
  const normalized = normalizeTitle(rawKey);
  const exactTitles = findByTitleExact(index, normalized);

  if (exactTitles.length === 1) return single(exactTitles[0], 'title-exact');

  if (exactTitles.length > 1) {
    return {
      selected: null,
      candidates: exactTitles.map((entry) => toCandidate(entry, 'title-exact', 1)),
      requiresConfirmation: true,
      reason:
        `${exactTitles.length} produtos seus têm exatamente este título. ` +
        'Escolha qual receberá o custo.',
    };
  }

  // 4. Título parecido. Nunca grava sozinho.
  const similar = findTitleCandidates(index, normalized, {
    limit: 5,
    minScore: FUZZY_CANDIDATE_MIN,
  });

  if (similar.length === 0) return NO_MATCH;

  const candidates = similar.map(({ entry, score }) => toCandidate(entry, 'title-fuzzy', score));
  const lead = similar[0].score - (similar[1]?.score ?? 0);
  const confident = similar[0].score >= FUZZY_PRESELECT_MIN && lead >= FUZZY_PRESELECT_LEAD;

  return {
    selected: confident ? candidates[0] : null,
    candidates,
    requiresConfirmation: true,
    reason: confident
      ? 'Pareado por semelhança de título. Confirme se é o produto certo.'
      : 'Vários produtos parecidos. Escolha qual receberá o custo.',
  };
}

function single(entry: SkuEntry, kind: MatchKind): ResolvedMatch {
  const candidate = toCandidate(entry, kind, 1);
  return {
    selected: candidate,
    candidates: [candidate],
    requiresConfirmation: false,
    reason: null,
  };
}

function toCandidate(entry: SkuEntry, kind: MatchKind, score: number): MatchCandidate {
  return {
    skuId: entry.sku.id,
    code: entry.sku.code,
    title: entry.title,
    currentCmv: entry.sku.cmv,
    kind,
    score,
  };
}

/* -------------------------------------------------------------------------- *
 * Leitura do valor
 * -------------------------------------------------------------------------- */

type CmvParse = { kind: 'ok'; value: number } | { kind: 'invalid'; error: string };

/**
 * Converte a célula de custo em número.
 *
 * Célula numérica usa o número que a planilha já guarda; só célula de texto
 * passa pelo parser de pt-BR. Essa distinção é o que impede o `12,5` do Excel
 * (guardado como `12.5`) de atravessar a heurística de separador decimal e sair
 * como `125`.
 */
function parseCmvCell(cell: SheetCell): CmvParse {
  if (cell.number !== null) {
    if (!Number.isFinite(cell.number)) {
      return { kind: 'invalid', error: 'Valor numérico inválido.' };
    }
    if (cell.number < 0) {
      return { kind: 'invalid', error: 'O CMV não pode ser negativo.' };
    }
    return { kind: 'ok', value: roundToCents(cell.number) };
  }

  const parsed = validateCmvInput(cell.text);
  if (!parsed.ok) return { kind: 'invalid', error: parsed.error };

  // `validateCmvInput` devolve `null` só para texto vazio, caso já tratado
  // antes de chegar aqui.
  if (parsed.value === null) {
    return { kind: 'invalid', error: 'Informe um valor válido.' };
  }

  return { kind: 'ok', value: parsed.value };
}

/* -------------------------------------------------------------------------- *
 * Derivação do estado efetivo
 * -------------------------------------------------------------------------- */

function derive(
  rows: readonly ImportRow[],
  context: PlanContext,
  overrides: RowOverrides,
): ImportPlan {
  // 1. Volta ao automático e aplica a decisão do usuário.
  let next = rows.map((row) =>
    applyOverride(resetToAuto(row), context.index, overrides.get(row.lineNumber)),
  );

  // 2. Valor igual ao gravado não é "pronta", é "nada a fazer". Depende do
  //    SKU escolhido, então só dá para saber depois do override.
  next = next.map(markUnchanged);

  // 3. Duas linhas no mesmo SKU: a de baixo vence.
  next = markDuplicates(next);

  // 4. Aviso de escala, só para o que realmente vai gravar.
  next = next.map((row) => withPriceWarning(row, context.salesIndex));

  return { rows: next, counts: countRows(next) };
}

function resetToAuto(row: ImportRow): ImportRow {
  return { ...row, status: row.autoStatus, match: row.autoMatch };
}

function applyOverride(
  row: ImportRow,
  index: SkuIndex,
  override: RowOverride | undefined,
): ImportRow {
  if (!override) return row;

  if (override.skuId === null) {
    return { ...row, status: 'ignored', match: null, reason: 'Linha descartada por você.' };
  }

  // Valor ilegível ou ausente não passa a ser gravável porque o usuário
  // escolheu o produto: o que falta nessas linhas é o número, não o SKU.
  if (row.autoStatus === 'invalid-value' || row.autoStatus === 'empty-value') return row;

  const entry = index.byId.get(override.skuId);
  if (!entry) return row;

  const candidate = toCandidate(entry, 'manual', 1);

  return {
    ...row,
    status: 'ready',
    match: candidate,
    candidates: row.candidates.some((c) => c.skuId === candidate.skuId)
      ? row.candidates
      : [candidate, ...row.candidates],
    reason: null,
  };
}

function markUnchanged(row: ImportRow): ImportRow {
  if (row.status !== 'ready' || row.match === null || row.cmv === null) return row;
  if (row.cmv !== row.match.currentCmv) return row;

  return { ...row, status: 'unchanged', reason: 'Este produto já está com esse custo.' };
}

/**
 * Resolve duas linhas que apontam para o mesmo SKU: a última vence.
 *
 * É a convenção de planilha — quem corrigiu um valor costuma colar a linha nova
 * abaixo. O que importa é ser determinístico e explicável, e o preview diz qual
 * linha prevaleceu.
 */
function markDuplicates(rows: readonly ImportRow[]): ImportRow[] {
  const lastBySku = new Map<string, number>();

  for (const row of rows) {
    if (willWrite(row) && row.match) lastBySku.set(row.match.skuId, row.lineNumber);
  }

  return rows.map((row) => {
    if (!willWrite(row) || !row.match) return row;
    const winner = lastBySku.get(row.match.skuId);
    if (winner === undefined || winner === row.lineNumber) return row;

    return {
      ...row,
      status: 'duplicate',
      reason: `O mesmo produto aparece na linha ${winner}, que foi usada.`,
    };
  });
}

function withPriceWarning(
  row: ImportRow,
  salesIndex: Map<string, OrderItemAggregate>,
): ImportRow {
  if (!willWrite(row) || !row.match || row.cmv === null) {
    return row.aboveObservedPrice ? { ...row, aboveObservedPrice: false } : row;
  }

  const sales = salesIndex.get(normalizeSkuCode(row.match.code));
  const above = sales
    ? isCmvAboveObservedPrice(row.cmv, sales.realizedRevenue, sales.unitsSold)
    : false;

  return above === row.aboveObservedPrice ? row : { ...row, aboveObservedPrice: above };
}

function countRows(rows: readonly ImportRow[]): ImportCounts {
  const counts: ImportCounts = {
    total: rows.length,
    ready: 0,
    needsConfirmation: 0,
    unchanged: 0,
    invalidValue: 0,
    unmatched: 0,
    emptyValue: 0,
    duplicate: 0,
    ignored: 0,
    willWrite: 0,
    aboveObservedPrice: 0,
  };

  for (const row of rows) {
    switch (row.status) {
      case 'ready':
        counts.ready += 1;
        break;
      case 'needs-confirmation':
        counts.needsConfirmation += 1;
        break;
      case 'unchanged':
        counts.unchanged += 1;
        break;
      case 'invalid-value':
        counts.invalidValue += 1;
        break;
      case 'unmatched':
        counts.unmatched += 1;
        break;
      case 'empty-value':
        counts.emptyValue += 1;
        break;
      case 'duplicate':
        counts.duplicate += 1;
        break;
      case 'ignored':
        counts.ignored += 1;
        break;
    }

    if (willWrite(row)) {
      counts.willWrite += 1;
      if (row.aboveObservedPrice) counts.aboveObservedPrice += 1;
    }
  }

  return counts;
}

/* -------------------------------------------------------------------------- *
 * Utilidades
 * -------------------------------------------------------------------------- */

type SchedulerWithYield = { yield?: () => Promise<void> };

/**
 * Devolve o controle ao navegador para a barra de progresso pintar.
 *
 * `scheduler.yield()` é o mecanismo correto e já existe no Chrome; o
 * `setTimeout(0)` cobre o resto.
 */
function yieldToEventLoop(): Promise<void> {
  const scheduler = (globalThis as { scheduler?: SchedulerWithYield }).scheduler;
  if (typeof scheduler?.yield === 'function') return scheduler.yield();
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}
