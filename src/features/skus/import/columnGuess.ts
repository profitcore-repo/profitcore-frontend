import { parseBRLInput } from '@/utils/currency';
import {
  cellAt,
  columnNames,
  dataRows,
  type SheetGrid,
  type SheetRow,
} from '@/features/skus/import/spreadsheetSource';

/**
 * Adivinha quais colunas são o identificador do produto e o CMV.
 *
 * É conveniência, não decisão: a etapa de mapeamento sempre mostra os dois
 * selects preenchidos com o palpite e um preview de 5 linhas, para o usuário
 * corrigir. Por isso a heurística pode ser agressiva — o custo de errar é um
 * clique, e o custo de não sugerir nada é o usuário encarar vinte colunas.
 *
 * Duas evidências são combinadas: o nome do cabeçalho e o conteúdo da coluna. O
 * conteúdo é o sinal mais forte, porque cabeçalho de planilha de lojista é
 * imprevisível ("Vlr Cx", "R$ un") mas uma coluna cheia de `MLB…` é
 * inequívoca.
 */

/** Quantas linhas de dados bastam para caracterizar uma coluna. */
const CONTENT_SAMPLE = 50;

const ML_CODE_EXACT = /^MLB\s*\d{6,}$/i;
const ML_CODE_ANYWHERE = /MLB\s*\d{6,}/i;

export type ColumnGuess = {
  /** `null` quando nada passou do mínimo de confiança. */
  keyColumn: number | null;
  cmvColumn: number | null;
};

type Scored = { column: number; score: number };

/* -------------------------------------------------------------------------- *
 * Vocabulário de cabeçalho
 * -------------------------------------------------------------------------- */

/**
 * Pesos por termo no cabeçalho. Maior = mais específico.
 *
 * `codigo`/`sku` valem mais que `titulo`/`produto` porque o pareamento por
 * código é exato e o por título é aproximado: na dúvida entre as duas, sugerir
 * a que dá o resultado mais confiável.
 */
const KEY_TERMS: Array<[pattern: RegExp, weight: number]> = [
  [/\bmlb\b/, 1],
  [/\b(id|codigo|cod)\s*(do\s*)?(anuncio|ml|mercado\s*livre)\b/, 1],
  [/\banuncio\b/, 0.9],
  [/\bsku\b/, 0.85],
  [/\bcodigo\b|\bcod\b/, 0.8],
  [/\bean\b|\bgtin\b|\bcodigo\s*de\s*barras\b/, 0.7],
  [/\breferencia\b|\bref\b/, 0.6],
  [/\btitulo\b/, 0.55],
  [/\bproduto\b|\bdescricao\b|\bitem\b/, 0.5],
  [/\bnome\b/, 0.45],
  [/\bid\b/, 0.4],
];

const CMV_TERMS: Array<[pattern: RegExp, weight: number]> = [
  [/\bcmv\b/, 1],
  [/\bcusto\s*(unitario|unit|un|medio|do\s*produto|da\s*mercadoria)?\b/, 0.95],
  [/\bpreco\s*de\s*custo\b/, 0.95],
  [/\bvalor\s*(de\s*)?(compra|custo)\b/, 0.9],
  [/\bcompra\b/, 0.6],
  [/\bcost\b/, 0.8],
  [/\bvlr\b|\bvalor\b/, 0.35],
];

/**
 * Termos que desqualificam uma coluna como CMV mesmo quando ela é numérica.
 *
 * Escolher "Preço de venda" como custo é o pior erro possível desta tela:
 * produziria margem zero em todo o catálogo e pareceria plausível.
 */
const CMV_BLOCKERS = [
  /\bvenda\b|\bvendas\b/,
  /\bfaturamento\b|\breceita\b/,
  /\bfrete\b/,
  /\bimposto\b|\bicms\b|\btaxa\b|\btarifa\b|\bcomissao\b/,
  /\bmargem\b|\blucro\b/,
  /\bestoque\b|\bquantidade\b|\bqtd\b|\bqtde\b/,
  /\bdesconto\b/,
  /\bean\b|\bgtin\b|\bcodigo\b/,
];

/* -------------------------------------------------------------------------- *
 * API
 * -------------------------------------------------------------------------- */

export function guessColumns(grid: SheetGrid, hasHeader: boolean): ColumnGuess {
  const names = columnNames(grid, hasHeader).map(normalizeHeader);
  const rows = dataRows(grid, hasHeader).slice(0, CONTENT_SAMPLE);
  const columns = Array.from({ length: grid.columnCount }, (_, index) => index);

  // Sem cabeçalho, `columnNames` devolve "Coluna A" — rótulo sintético que não
  // carrega informação e não deve pontuar.
  const headerUsable = hasHeader;

  const keyScores = rank(columns, (column) =>
    combine(
      headerUsable ? termScore(names[column], KEY_TERMS) : 0,
      keyContentScore(rows, column),
      headerUsable,
    ),
  );

  const cmvScores = rank(columns, (column) => {
    if (headerUsable && CMV_BLOCKERS.some((blocker) => blocker.test(names[column]))) {
      return 0;
    }
    const content = cmvContentScore(rows, column);
    // Coluna sem nenhum número legível não é custo, por mais sugestivo que
    // seja o cabeçalho.
    if (content === 0) return 0;
    return combine(
      headerUsable ? termScore(names[column], CMV_TERMS) : 0,
      content,
      headerUsable,
    );
  });

  const keyColumn = pick(keyScores, []);
  const cmvColumn = pick(cmvScores, keyColumn === null ? [] : [keyColumn]);

  return { keyColumn, cmvColumn };
}

/* -------------------------------------------------------------------------- *
 * Normalização e pontuação
 * -------------------------------------------------------------------------- */

/** Minúsculas, sem acento, pontuação virando espaço, espaços colapsados. */
export function normalizeHeader(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function termScore(header: string, terms: Array<[RegExp, number]>): number {
  if (!header) return 0;
  let best = 0;
  for (const [pattern, weight] of terms) {
    if (weight > best && pattern.test(header)) best = weight;
  }
  return best;
}

/**
 * Cabeçalho pesa mais que conteúdo quando existe, porque é a intenção declarada
 * do usuário; sem cabeçalho, o conteúdo responde sozinho.
 */
function combine(headerScore: number, contentScore: number, headerUsable: boolean): number {
  return headerUsable ? headerScore * 0.6 + contentScore * 0.4 : contentScore;
}

function keyContentScore(rows: SheetRow[], column: number): number {
  const texts = rows.map((row) => cellAt(row, column).text.trim()).filter(Boolean);
  if (texts.length === 0) return 0;

  const exact = fraction(texts, (text) => ML_CODE_EXACT.test(text));
  if (exact >= 0.5) return 1;

  const embedded = fraction(texts, (text) => ML_CODE_ANYWHERE.test(text));
  if (embedded >= 0.5) return 0.85;

  // Texto longo e majoritariamente distinto tem cara de título ou código
  // interno. Coluna numérica não serve de identificador.
  const numeric = fraction(rows, (row) => cellAt(row, column).number !== null);
  if (numeric >= 0.8) return 0.1;

  const distinct = new Set(texts.map((t) => t.toLowerCase())).size / texts.length;
  const longish = fraction(texts, (text) => text.length >= 6);

  return 0.2 + 0.3 * distinct + 0.2 * longish;
}

function cmvContentScore(rows: SheetRow[], column: number): number {
  const cells = rows.map((row) => cellAt(row, column)).filter((cell) => cell.text.trim() !== '');
  if (cells.length === 0) return 0;

  const readable = fraction(
    cells,
    (cell) => cell.number !== null || parseBRLInput(cell.text) !== null,
  );
  if (readable < 0.6) return 0;

  const values = cells
    .map((cell) => cell.number ?? parseBRLInput(cell.text))
    .filter((value): value is number => value !== null);

  // Custo é positivo e tem casa decimal com frequência. Coluna de inteiros
  // (quantidade, estoque, EAN) é custo com menos frequência que uma com
  // centavos, então ganha um pouco menos.
  const nonNegative = fraction(values, (value) => value >= 0);
  const decimals = fraction(values, (value) => !Number.isInteger(value));

  return readable * (0.6 + 0.25 * nonNegative + 0.15 * decimals);
}

function fraction<T>(items: readonly T[], predicate: (item: T) => boolean): number {
  if (items.length === 0) return 0;
  return items.filter(predicate).length / items.length;
}

function rank(columns: number[], score: (column: number) => number): Scored[] {
  return columns
    .map((column) => ({ column, score: score(column) }))
    .sort((a, b) => b.score - a.score || a.column - b.column);
}

/**
 * Melhor coluna ainda livre, desde que passe do mínimo.
 *
 * O piso evita o pior comportamento possível desta heurística: apontar uma
 * coluna qualquer com confiança, o usuário aceitar sem olhar e importar custo
 * errado. Sem candidato bom, o select fica vazio e exige escolha.
 */
function pick(scores: Scored[], taken: number[]): number | null {
  const candidate = scores.find((entry) => !taken.includes(entry.column));
  return candidate && candidate.score >= 0.35 ? candidate.column : null;
}
