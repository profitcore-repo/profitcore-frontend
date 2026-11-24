import type { WorkBook, WorkSheet } from 'xlsx';

/**
 * Leitura de planilha para uma matriz de células, independente do formato de
 * origem (`.xlsx`, `.xls`, `.csv`, texto colado do Excel).
 *
 * Esta camada não interpreta nada: não sabe o que é CMV, não sabe qual coluna é
 * qual, não valida valor. Ela só entrega as linhas com o número de linha
 * correto e, quando a célula é numérica na planilha, o número já pronto —
 * porque reparsear "12.5" com regra de pt-BR é justamente onde se perde um
 * fator de 100 (ver `SheetCell.number`).
 */

export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_ROWS = 20_000;
export const MAX_COLUMNS = 200;

const SPREADSHEET_EXTENSIONS = ['xlsx', 'xlsm', 'xlsb', 'xls', 'csv', 'tsv', 'txt'];
const TEXT_EXTENSIONS = ['csv', 'tsv', 'txt'];

/** Candidatos a separador, na ordem de preferência em caso de empate. */
const DELIMITERS = ['\t', ';', ','] as const;

export type SpreadsheetErrorCode =
  | 'unsupported-type'
  | 'file-too-large'
  | 'too-many-rows'
  | 'password-protected'
  | 'unreadable'
  | 'empty'
  | 'sheet-not-found';

/** Erro com mensagem já pronta para a tela, em pt-BR. */
export class SpreadsheetReadError extends Error {
  readonly code: SpreadsheetErrorCode;

  constructor(code: SpreadsheetErrorCode, message: string) {
    super(message);
    this.name = 'SpreadsheetReadError';
    this.code = code;
  }
}

export type SheetCell = {
  /** Conteúdo como texto. String vazia quando a célula está vazia. */
  text: string;
  /**
   * Valor quando a célula é numérica na planilha, `null` quando é texto.
   *
   * Existe para o import não depender de heurística de separador decimal no
   * caso em que a planilha já sabe que aquilo é número: o Excel guarda `12,5`
   * como o número `12.5`, e passar a representação textual por `parseBRLInput`
   * reintroduz a ambiguidade de ponto (`1.234` é mil duzentos e trinta e quatro
   * ou um e duzentos e trinta e quatro milésimos?).
   */
  number: number | null;
};

export type SheetRow = {
  /** Número da linha como o Excel mostra, 1-based, para o usuário localizar. */
  lineNumber: number;
  cells: SheetCell[];
};

export type SheetGrid = {
  /** `null` quando a origem é texto colado. */
  sheetName: string | null;
  /** Abas do arquivo, para o usuário trocar. Vazio quando a origem é colagem. */
  availableSheets: string[];
  /**
   * Todas as linhas com conteúdo, **incluindo a de cabeçalho quando existe**.
   * Quem decide o que é cabeçalho é a etapa de mapeamento, porque o usuário
   * pode discordar da heurística.
   */
  rows: SheetRow[];
  columnCount: number;
  /** Heurística de cabeçalho; a etapa de mapeamento pré-marca o switch com ela. */
  suggestedHasHeader: boolean;
};

const EMPTY_CELL: SheetCell = { text: '', number: null };

/* -------------------------------------------------------------------------- *
 * Carregamento da lib
 * -------------------------------------------------------------------------- */

let xlsxModule: Promise<typeof import('xlsx')> | null = null;

/**
 * Carrega o SheetJS sob demanda. São ~400 KB que só fazem sentido quando o
 * usuário abre a importação, então ficam fora do bundle inicial.
 */
function loadXlsx(): Promise<typeof import('xlsx')> {
  xlsxModule ??= import('xlsx');
  return xlsxModule;
}

/* -------------------------------------------------------------------------- *
 * Entradas
 * -------------------------------------------------------------------------- */

export function fileExtension(fileName: string): string {
  const dot = fileName.lastIndexOf('.');
  return dot === -1 ? '' : fileName.slice(dot + 1).toLowerCase();
}

export function isSupportedSpreadsheet(fileName: string): boolean {
  return SPREADSHEET_EXTENSIONS.includes(fileExtension(fileName));
}

/**
 * Lê um arquivo de planilha.
 *
 * `sheetName` permite reler o mesmo arquivo em outra aba sem o usuário subir de
 * novo; sem ele, usa a primeira aba que tenha conteúdo.
 */
export async function readSpreadsheetFile(
  file: File,
  sheetName?: string,
): Promise<SheetGrid> {
  const extension = fileExtension(file.name);

  if (!SPREADSHEET_EXTENSIONS.includes(extension)) {
    throw new SpreadsheetReadError(
      'unsupported-type',
      'Formato não suportado. Envie um arquivo .xlsx, .xls ou .csv.',
    );
  }

  if (file.size > MAX_FILE_BYTES) {
    throw new SpreadsheetReadError(
      'file-too-large',
      `Arquivo muito grande (limite de ${Math.round(MAX_FILE_BYTES / 1024 / 1024)} MB). ` +
        'Se a planilha tem outras abas ou imagens, salve só a aba de custos e tente de novo.',
    );
  }

  const buffer = await file.arrayBuffer();
  const XLSX = await loadXlsx();

  const workbook = TEXT_EXTENSIONS.includes(extension)
    ? readTextWorkbook(XLSX, decodeText(buffer))
    : readBinaryWorkbook(XLSX, buffer);

  return workbookToGrid(XLSX, workbook, sheetName);
}

/**
 * Lê o que o usuário colou. O clipboard do Excel chega como TSV, mas aceitamos
 * `;` e `,` porque colar de um CSV aberto no Notepad é comum.
 */
export async function readPastedText(text: string): Promise<SheetGrid> {
  const content = stripBom(text).trim();
  if (!content) {
    throw new SpreadsheetReadError('empty', 'Cole as colunas da sua planilha para continuar.');
  }

  const XLSX = await loadXlsx();
  const grid = workbookToGrid(XLSX, readTextWorkbook(XLSX, content), undefined);

  // Colagem não tem aba, e o nome sintético que o SheetJS dá ("Sheet1") só
  // confundiria na interface.
  return { ...grid, sheetName: null, availableSheets: [] };
}

/* -------------------------------------------------------------------------- *
 * Leitura
 * -------------------------------------------------------------------------- */

function readBinaryWorkbook(XLSX: typeof import('xlsx'), buffer: ArrayBuffer): WorkBook {
  try {
    return XLSX.read(buffer, { type: 'array', cellDates: true, cellText: false });
  } catch (err) {
    throw toReadError(err);
  }
}

function readTextWorkbook(XLSX: typeof import('xlsx'), text: string): WorkBook {
  try {
    return XLSX.read(text, {
      type: 'string',
      raw: true,
      cellDates: true,
      FS: detectDelimiter(text),
    });
  } catch (err) {
    throw toReadError(err);
  }
}

function toReadError(err: unknown): SpreadsheetReadError {
  const message = err instanceof Error ? err.message : String(err);

  // O SheetJS Community Edition não abre arquivo criptografado. A mensagem
  // genérica deixaria o usuário tentando de novo sem entender o motivo.
  if (/password|encrypt/i.test(message)) {
    return new SpreadsheetReadError(
      'password-protected',
      'A planilha está protegida por senha. Remova a proteção no Excel e envie de novo.',
    );
  }

  return new SpreadsheetReadError(
    'unreadable',
    'Não foi possível ler a planilha. Confira se o arquivo abre normalmente no Excel.',
  );
}

/**
 * Decodifica bytes de texto.
 *
 * O Excel brasileiro salva CSV em Windows-1252 por padrão ("CSV (separado por
 * vírgulas)"), não em UTF-8. Decodificar como UTF-8 produziria `Camisa Bebê`
 * virando texto com U+FFFD, o que estragaria exatamente o pareamento por
 * título. Então: tenta UTF-8 e, se aparecer caractere de substituição, refaz em
 * Windows-1252.
 */
function decodeText(buffer: ArrayBuffer): string {
  const utf8 = new TextDecoder('utf-8').decode(buffer);
  if (!utf8.includes('\uFFFD')) return stripBom(utf8);

  try {
    return stripBom(new TextDecoder('windows-1252').decode(buffer));
  } catch {
    return stripBom(utf8);
  }
}

function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

/**
 * Descobre o separador por consistência, não por volume.
 *
 * Contar ocorrências totais erra em título com vírgula ("Camisa P, M e G"):
 * a vírgula ganharia de um `;` que é o separador real. A contagem mediana por
 * linha é estável porque o separador verdadeiro aparece o mesmo número de vezes
 * em toda linha.
 */
export function detectDelimiter(text: string): string {
  const sample = text
    .split(/\r?\n/)
    .filter((line) => line.trim() !== '')
    .slice(0, 20);

  if (sample.length === 0) return ',';

  let best: string = ',';
  let bestScore = 0;

  for (const delimiter of DELIMITERS) {
    const counts = sample
      .map((line) => countOutsideQuotes(line, delimiter))
      .sort((a, b) => a - b);
    const median = counts[Math.floor(counts.length / 2)];
    if (median > bestScore) {
      bestScore = median;
      best = delimiter;
    }
  }

  return best;
}

/** Separador dentro de campo entre aspas não é separador. */
function countOutsideQuotes(line: string, delimiter: string): number {
  let count = 0;
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      // `""` é aspas escapada dentro do campo, não fim do campo.
      if (inQuotes && line[i + 1] === '"') i += 1;
      else inQuotes = !inQuotes;
    } else if (!inQuotes && char === delimiter) {
      count += 1;
    }
  }

  return count;
}

/* -------------------------------------------------------------------------- *
 * Conversão para a matriz
 * -------------------------------------------------------------------------- */

function workbookToGrid(
  XLSX: typeof import('xlsx'),
  workbook: WorkBook,
  requestedSheet: string | undefined,
): SheetGrid {
  const availableSheets = workbook.SheetNames.filter(
    (name) => !isEmptySheet(workbook.Sheets[name]),
  );

  if (availableSheets.length === 0) {
    throw new SpreadsheetReadError('empty', 'A planilha está vazia.');
  }

  if (requestedSheet !== undefined && !availableSheets.includes(requestedSheet)) {
    throw new SpreadsheetReadError(
      'sheet-not-found',
      `A aba "${requestedSheet}" não existe ou está vazia.`,
    );
  }

  const sheetName = requestedSheet ?? availableSheets[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = sheetToRows(XLSX, sheet);

  if (rows.length === 0) {
    throw new SpreadsheetReadError(
      'empty',
      `A aba "${sheetName}" não tem nenhuma linha com conteúdo.`,
    );
  }

  if (rows.length > MAX_ROWS) {
    throw new SpreadsheetReadError(
      'too-many-rows',
      `A planilha tem ${rows.length.toLocaleString('pt-BR')} linhas e o limite é ` +
        `${MAX_ROWS.toLocaleString('pt-BR')}. Divida em partes e importe uma por vez.`,
    );
  }

  const columnCount = Math.min(
    rows.reduce((max, row) => Math.max(max, row.cells.length), 0),
    MAX_COLUMNS,
  );

  // Normaliza a largura: planilha real tem linha curta, e a interface de
  // mapeamento precisa que todo índice de coluna exista em toda linha.
  for (const row of rows) {
    row.cells.length = columnCount;
    for (let i = 0; i < columnCount; i += 1) row.cells[i] ??= EMPTY_CELL;
  }

  return {
    sheetName,
    availableSheets,
    rows,
    columnCount,
    suggestedHasHeader: looksLikeHeader(rows),
  };
}

function isEmptySheet(sheet: WorkSheet | undefined): boolean {
  return !sheet || !sheet['!ref'];
}

function sheetToRows(XLSX: typeof import('xlsx'), sheet: WorkSheet): SheetRow[] {
  // `blankrows: true` mantém o alinhamento com a numeração do Excel; as linhas
  // em branco são descartadas depois, já com o número de linha preservado.
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    raw: true,
    defval: null,
    blankrows: true,
  });

  // Uma planilha cujo conteúdo começa em A5 tem `!ref` começando na linha 5;
  // sem esse deslocamento, todo número de linha que mostrarmos estaria errado.
  const firstRowIndex = XLSX.utils.decode_range(sheet['!ref'] ?? 'A1').s.r;

  const rows: SheetRow[] = [];
  matrix.forEach((rawRow, index) => {
    const cells = (rawRow ?? []).slice(0, MAX_COLUMNS).map(toCell);
    if (cells.every(isBlank)) return;
    rows.push({ lineNumber: firstRowIndex + index + 1, cells });
  });

  return rows;
}

function toCell(value: unknown): SheetCell {
  if (value === null || value === undefined) return EMPTY_CELL;

  if (typeof value === 'number') {
    return Number.isFinite(value)
      ? { text: String(value), number: value }
      : EMPTY_CELL;
  }

  if (typeof value === 'boolean') {
    return { text: value ? 'VERDADEIRO' : 'FALSO', number: null };
  }

  if (value instanceof Date) {
    return { text: value.toLocaleDateString('pt-BR'), number: null };
  }

  const text = String(value);
  return text.trim() === '' ? EMPTY_CELL : { text, number: null };
}

function isBlank(cell: SheetCell): boolean {
  return cell.text.trim() === '';
}

/**
 * A primeira linha parece cabeçalho quando é toda texto e alguma linha seguinte
 * tem número. Planilha de custo sempre tem a coluna de valor numérica, então
 * essa é a assinatura mais confiável sem olhar o conteúdo dos rótulos.
 *
 * É só a sugestão inicial: o usuário confirma na etapa de mapeamento.
 */
function looksLikeHeader(rows: SheetRow[]): boolean {
  if (rows.length < 2) return false;

  const first = rows[0].cells;
  const firstHasNumber = first.some((cell) => cell.number !== null);
  if (firstHasNumber) return false;

  const firstHasText = first.some((cell) => !isBlank(cell));
  if (!firstHasText) return false;

  return rows.slice(1, 11).some((row) => row.cells.some((cell) => cell.number !== null));
}

/* -------------------------------------------------------------------------- *
 * Helpers para a interface
 * -------------------------------------------------------------------------- */

/** `0` → `A`, `25` → `Z`, `26` → `AA`. Rótulo de coluna sem cabeçalho. */
export function columnLabel(index: number): string {
  let label = '';
  let n = index;
  while (n >= 0) {
    label = String.fromCharCode(65 + (n % 26)) + label;
    n = Math.floor(n / 26) - 1;
  }
  return label;
}

/**
 * Nomes das colunas para os selects de mapeamento: o cabeçalho quando existe, e
 * `Coluna A` quando não existe ou o cabeçalho está em branco.
 */
export function columnNames(grid: SheetGrid, hasHeader: boolean): string[] {
  const header = hasHeader ? grid.rows[0]?.cells : undefined;
  return Array.from({ length: grid.columnCount }, (_, index) => {
    const text = header?.[index]?.text.trim();
    return text ? text : `Coluna ${columnLabel(index)}`;
  });
}

/** Linhas de dados, sem a de cabeçalho. */
export function dataRows(grid: SheetGrid, hasHeader: boolean): SheetRow[] {
  return hasHeader ? grid.rows.slice(1) : grid.rows;
}

export function cellAt(row: SheetRow, column: number): SheetCell {
  return row.cells[column] ?? EMPTY_CELL;
}
