import type { SkuResponse } from '@/types/api';
import { normalizeSkuCode, type OrderItemAggregate } from '@/features/skus/skuSales';

/**
 * Índice dos SKUs do lojista para o pareamento da importação.
 *
 * Monta três formas de encontrar um SKU, em ordem decrescente de confiança:
 * código do anúncio, título exato normalizado e título aproximado. As duas
 * primeiras são `Map`; a terceira precisa comparar o texto da planilha com
 * todos os títulos, e é aí que mora o cuidado de desempenho — uma planilha de
 * 20.000 linhas contra um catálogo de 5.000 SKUs daria 100 milhões de
 * comparações se fosse força bruta. Por isso existe o índice invertido por
 * palavra (`byToken`): só entram na comparação os SKUs que dividem ao menos uma
 * palavra com o texto buscado.
 *
 * O título de cada SKU sai de `sku.name` e, quando ele está vazio, do título
 * que veio nos pedidos — a mesma precedência de `selectMainSkus`, para a
 * importação e a listagem nunca discordarem sobre o nome de um produto.
 */

/** Teto de candidatos levados à comparação de similaridade, por linha. */
const MAX_FUZZY_CANDIDATES = 200;

/**
 * Palavra de 1 caractere entra no índice.
 *
 * Tentador descartar, mas em título de anúncio o caractere isolado costuma ser
 * justamente o atributo que diferencia o produto: tamanho (`P`, `M`, `G`),
 * numeração, cor abreviada. Descartar deixaria "Camisa Polo M" e "Camisa Polo
 * G" indistinguíveis no estreitamento de candidatos.
 */
const MIN_TOKEN_LENGTH = 1;

export type SkuEntry = {
  sku: SkuResponse;
  /** Nome exibível. `null` quando nem `sku.name` nem os pedidos têm título. */
  title: string | null;
  /** `''` quando não há título — nunca participa de pareamento por nome. */
  normalizedTitle: string;
  /** Bigramas do título normalizado, pré-computados para o Dice. */
  bigrams: Set<string>;
  tokens: string[];
  /** Palavras que contêm dígito: `500ml`, `300`, `110v`. Ver `numericAgreement`. */
  numericTokens: Set<string>;
};

export type SkuIndex = {
  entries: SkuEntry[];
  /** `sku.id` → SKU. Usado quando o usuário resolve uma linha à mão. */
  byId: Map<string, SkuEntry>;
  /** Código normalizado (trim + maiúsculas) → SKU. */
  byCode: Map<string, SkuEntry>;
  /**
   * Título normalizado → SKUs. É uma lista porque dois anúncios podem ter o
   * mesmo título, e nesse caso a importação precisa perguntar em vez de
   * escolher.
   */
  byTitle: Map<string, SkuEntry[]>;
  byToken: Map<string, number[]>;
};

export type TitleCandidate = {
  entry: SkuEntry;
  /** 0..1. Coeficiente de Dice sobre bigramas do título normalizado. */
  score: number;
};

/* -------------------------------------------------------------------------- *
 * Construção
 * -------------------------------------------------------------------------- */

export function buildSkuIndex(
  skus: readonly SkuResponse[],
  salesIndex: Map<string, OrderItemAggregate>,
): SkuIndex {
  const entries: SkuEntry[] = [];
  const byId = new Map<string, SkuEntry>();
  const byCode = new Map<string, SkuEntry>();
  const byTitle = new Map<string, SkuEntry[]>();
  const byToken = new Map<string, number[]>();

  for (const sku of skus) {
    const code = normalizeSkuCode(sku.code);
    const title = sku.name?.trim() || salesIndex.get(code)?.title?.trim() || null;
    const normalizedTitle = title ? normalizeTitle(title) : '';
    const tokens = normalizedTitle ? tokenize(normalizedTitle) : [];

    const entry: SkuEntry = {
      sku,
      title,
      normalizedTitle,
      bigrams: normalizedTitle ? bigramsOf(normalizedTitle) : new Set(),
      tokens,
      numericTokens: numericTokensOf(normalizedTitle),
    };

    const index = entries.length;
    entries.push(entry);
    byId.set(sku.id, entry);

    // Código duplicado não deveria existir (é chave por usuário no backend);
    // se existir, o primeiro vence e o segundo fica alcançável só por título.
    if (!byCode.has(code)) byCode.set(code, entry);

    if (normalizedTitle) {
      const sameTitle = byTitle.get(normalizedTitle);
      if (sameTitle) sameTitle.push(entry);
      else byTitle.set(normalizedTitle, [entry]);

      for (const token of new Set(tokens)) {
        const bucket = byToken.get(token);
        if (bucket) bucket.push(index);
        else byToken.set(token, [index]);
      }
    }
  }

  return { entries, byId, byCode, byTitle, byToken };
}

/* -------------------------------------------------------------------------- *
 * Normalização
 * -------------------------------------------------------------------------- */

/**
 * Normaliza título para comparação: minúsculas, sem acento, pontuação virando
 * espaço, espaços colapsados.
 *
 * O objetivo é que `"Camisa Polo Azul - M"`, `"camisa polo azul m"` e
 * `"CAMISA POLO AZUL, M"` sejam o mesmo título, porque é exatamente assim que a
 * planilha do lojista difere do anúncio dele.
 */
export function normalizeTitle(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function tokenize(normalized: string): string[] {
  return normalized.split(' ').filter((token) => token.length >= MIN_TOKEN_LENGTH);
}

/**
 * Sequências de dígitos do título: `"Caneca 500ml"` → `{"500"}`.
 *
 * Compara o número, não a palavra que o contém, porque `"500 ml"` e `"500ml"`
 * são o mesmo produto escrito de dois jeitos — e essa diferença de espaço é
 * exatamente o tipo de divergência que separa a planilha do lojista do título
 * do anúncio.
 */
function numericTokensOf(normalized: string): Set<string> {
  if (!normalized) return new Set();
  return new Set(normalized.match(/\d+/g) ?? []);
}

/**
 * Fator de concordância numérica, de 0,5 a 1.
 *
 * Bigramas são cegos para número: "Caneca Térmica 300ml" e "Caneca Térmica
 * 500ml" têm Dice altíssimo, e o pareamento por título escolheria a errada com
 * folga mínima sobre a certa. Como número em título de anúncio quase sempre é
 * o atributo que diferencia o produto (volume, voltagem, tamanho, quantidade na
 * embalagem), divergência numérica derruba a pontuação.
 *
 * Só penaliza quando os dois lados declaram número. Busca sem número ("Caneca
 * Térmica") não deve ser punida por o anúncio ser mais específico — nesse caso
 * o resultado é genuinamente ambíguo e a confirmação do usuário resolve.
 */
function numericAgreement(query: Set<string>, candidate: Set<string>): number {
  if (query.size === 0 || candidate.size === 0) return 1;

  let shared = 0;
  for (const token of query) {
    if (candidate.has(token)) shared += 1;
  }
  const union = query.size + candidate.size - shared;

  return 0.5 + 0.5 * (union === 0 ? 1 : shared / union);
}

function bigramsOf(normalized: string): Set<string> {
  const compact = normalized.replace(/ /g, '');
  const result = new Set<string>();
  for (let i = 0; i < compact.length - 1; i += 1) {
    result.add(compact.slice(i, i + 2));
  }
  // Título de um único caractere não gera bigrama; sem isso o Dice seria 0
  // contra qualquer coisa, inclusive contra ele mesmo.
  if (result.size === 0 && compact.length === 1) result.add(compact);
  return result;
}

/**
 * Coeficiente de Dice sobre conjuntos de bigramas: `2·|A∩B| / (|A|+|B|)`.
 *
 * Escolhido em vez de Levenshtein porque título de anúncio é longo e o que
 * muda entre a planilha e o Mercado Livre normalmente é ordem de palavra ou
 * sufixo ("Camisa Polo Azul M" vs "Camisa Polo Azul Tamanho M"), caso em que
 * similaridade de n-gramas se comporta melhor que distância de edição — e custa
 * O(n+m) em vez de O(n·m).
 */
export function diceCoefficient(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;

  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  let shared = 0;
  for (const gram of small) {
    if (large.has(gram)) shared += 1;
  }

  return (2 * shared) / (a.size + b.size);
}

/* -------------------------------------------------------------------------- *
 * Busca
 * -------------------------------------------------------------------------- */

/** SKUs com exatamente este título. Mais de um = ambíguo, precisa confirmação. */
export function findByTitleExact(index: SkuIndex, normalizedQuery: string): SkuEntry[] {
  if (!normalizedQuery) return [];
  return index.byTitle.get(normalizedQuery) ?? [];
}

export function findByCode(index: SkuIndex, rawCode: string): SkuEntry | null {
  return index.byCode.get(normalizeSkuCode(rawCode)) ?? null;
}

/**
 * Candidatos por similaridade de título, do mais parecido para o menos.
 *
 * `minScore` corta o ruído antes de ordenar. Nunca aplique o primeiro
 * resultado automaticamente: o chamador decide, e a regra do import é sempre
 * pedir confirmação para similaridade.
 */
export function findTitleCandidates(
  index: SkuIndex,
  normalizedQuery: string,
  options: { limit?: number; minScore?: number } = {},
): TitleCandidate[] {
  const { limit = 5, minScore = 0 } = options;
  if (!normalizedQuery) return [];

  const queryBigrams = bigramsOf(normalizedQuery);
  if (queryBigrams.size === 0) return [];

  const queryNumbers = numericTokensOf(normalizedQuery);
  const candidates = narrowCandidates(index, normalizedQuery);
  const scored: TitleCandidate[] = [];

  for (const entryIndex of candidates) {
    const entry = index.entries[entryIndex];
    const score =
      diceCoefficient(queryBigrams, entry.bigrams) *
      numericAgreement(queryNumbers, entry.numericTokens);
    if (score >= minScore) scored.push({ entry, score });
  }

  return scored
    // Desempate por código mantém o resultado estável entre execuções, o que
    // importa porque essa lista vai para a interface.
    .sort((a, b) => b.score - a.score || a.entry.sku.code.localeCompare(b.entry.sku.code))
    .slice(0, limit);
}

/**
 * Reduz o universo de comparação aos SKUs que dividem palavra com a busca.
 *
 * Quando nenhuma palavra bate, não há candidato plausível: devolver o catálogo
 * inteiro aqui é o que transformaria a importação de 20.000 linhas em alguns
 * minutos de processamento travando a aba.
 */
function narrowCandidates(index: SkuIndex, normalizedQuery: string): number[] {
  const tokens = new Set(tokenize(normalizedQuery));

  // Primeira passada ignora palavra presente em metade do catálogo ("kit",
  // "un", o nome da marca): ela não discrimina e gastaria o teto de candidatos
  // com ruído.
  const discriminating = collectOverlap(index, tokens, true);
  if (discriminating.size > 0) return topOverlap(discriminating);

  // Catálogo de uma única linha de produto tem todos os títulos parecidos, e
  // aí *toda* palavra é comum. Sem esta segunda passada, essas buscas voltariam
  // vazias e a importação diria "produto não encontrado" para um produto que
  // está ali — pior do que devolver candidatos e pedir confirmação.
  return topOverlap(collectOverlap(index, tokens, false));
}

function collectOverlap(
  index: SkuIndex,
  tokens: Set<string>,
  skipCommon: boolean,
): Map<number, number> {
  const overlap = new Map<number, number>();

  for (const token of tokens) {
    const bucket = index.byToken.get(token);
    if (!bucket) continue;
    if (skipCommon && bucket.length > index.entries.length * 0.5 && bucket.length > 50) {
      continue;
    }
    for (const entryIndex of bucket) {
      overlap.set(entryIndex, (overlap.get(entryIndex) ?? 0) + 1);
    }
  }

  return overlap;
}

function topOverlap(overlap: Map<number, number>): number[] {
  if (overlap.size <= MAX_FUZZY_CANDIDATES) return [...overlap.keys()];

  return [...overlap.entries()]
    .sort((a, b) => b[1] - a[1] || a[0] - b[0])
    .slice(0, MAX_FUZZY_CANDIDATES)
    .map(([entryIndex]) => entryIndex);
}
