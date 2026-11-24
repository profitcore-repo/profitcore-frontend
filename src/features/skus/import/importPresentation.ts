import { formatBRL } from '@/utils/currency';
import {
  willWrite,
  type ImportCounts,
  type ImportPlan,
  type ImportRow,
  type MatchKind,
  type RowStatus,
} from '@/features/skus/import/cmvImportPlan';

/**
 * Tradução do plano de importação para a tela: rótulos, cores, filtros e o CSV
 * do que não entrou.
 *
 * Fica separado dos componentes porque é texto e regra de exibição, não
 * layout — e porque é o vocabulário que o lojista vai ler para decidir se
 * confia na importação.
 */

export type StatusTone = 'success' | 'warning' | 'error' | 'neutral';

export type StatusPresentation = {
  label: string;
  tone: StatusTone;
};

const STATUS: Record<RowStatus, StatusPresentation> = {
  ready: { label: 'Será importada', tone: 'success' },
  'needs-confirmation': { label: 'Confirme o produto', tone: 'warning' },
  unchanged: { label: 'Já está com esse custo', tone: 'neutral' },
  'invalid-value': { label: 'Valor inválido', tone: 'error' },
  unmatched: { label: 'Produto não encontrado', tone: 'warning' },
  'empty-value': { label: 'Sem custo preenchido', tone: 'neutral' },
  duplicate: { label: 'Linha repetida', tone: 'neutral' },
  ignored: { label: 'Ignorada por você', tone: 'neutral' },
};

export function statusPresentation(status: RowStatus): StatusPresentation {
  return STATUS[status];
}

const MATCH_KIND: Record<MatchKind, string> = {
  code: 'Pareado pelo código do anúncio',
  'code-embedded': 'Código do anúncio encontrado no texto',
  'title-exact': 'Pareado pelo título exato',
  'title-fuzzy': 'Pareado por semelhança de título',
  manual: 'Escolhido por você',
};

export function matchKindLabel(kind: MatchKind): string {
  return MATCH_KIND[kind];
}

/* -------------------------------------------------------------------------- *
 * Filtros do preview
 * -------------------------------------------------------------------------- */

export type PreviewFilter =
  | 'all'
  | 'ready'
  | 'needs-confirmation'
  | 'unchanged'
  | 'invalid-value'
  | 'unmatched'
  | 'empty-value'
  | 'duplicate'
  | 'ignored'
  | 'warning';

export type FilterSummary = {
  filter: PreviewFilter;
  label: string;
  count: number;
  tone: StatusTone;
};

/**
 * Cartões-filtro do cabeçalho do preview, só os que têm linha.
 *
 * Esconder contador zerado é deliberado: numa importação limpa o lojista vê
 * "287 serão importadas" e mais nada, em vez de seis zeros que o fazem procurar
 * problema onde não tem.
 */
export function filterSummaries(counts: ImportCounts): FilterSummary[] {
  const all: FilterSummary[] = [
    { filter: 'ready', label: 'Serão importadas', count: counts.ready, tone: 'success' },
    {
      filter: 'needs-confirmation',
      label: 'Precisam de confirmação',
      count: counts.needsConfirmation,
      tone: 'warning',
    },
    {
      filter: 'unmatched',
      label: 'Não encontradas',
      count: counts.unmatched,
      tone: 'warning',
    },
    {
      filter: 'invalid-value',
      label: 'Valor inválido',
      count: counts.invalidValue,
      tone: 'error',
    },
    {
      filter: 'unchanged',
      label: 'Já atualizadas',
      count: counts.unchanged,
      tone: 'neutral',
    },
    {
      filter: 'empty-value',
      label: 'Sem custo na planilha',
      count: counts.emptyValue,
      tone: 'neutral',
    },
    { filter: 'duplicate', label: 'Repetidas', count: counts.duplicate, tone: 'neutral' },
    { filter: 'ignored', label: 'Ignoradas', count: counts.ignored, tone: 'neutral' },
  ];

  return all.filter((summary) => summary.count > 0);
}

export function matchesFilter(row: ImportRow, filter: PreviewFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'warning') return row.aboveObservedPrice;
  return row.status === filter;
}

/* -------------------------------------------------------------------------- *
 * Formatação de célula
 * -------------------------------------------------------------------------- */

export function formatCmv(value: number | null): string {
  return value === null ? 'Não informado' : formatBRL(value);
}

/** Nome do produto pareado, com o código como apoio. */
export function matchLabel(row: ImportRow): string {
  if (!row.match) return '—';
  return row.match.title ?? row.match.code;
}

/* -------------------------------------------------------------------------- *
 * CSV do que não entrou
 * -------------------------------------------------------------------------- */

const CSV_SEPARATOR = ';';

const CSV_HEADERS = [
  'Linha da planilha',
  'Identificador na planilha',
  'Custo na planilha',
  'Produto pareado',
  'Codigo do anuncio',
  'Situacao',
  'Motivo',
];

/**
 * Linhas que não serão importadas, em CSV, para o lojista corrigir no Excel e
 * tentar de novo.
 *
 * Sem isso, uma importação com 40 produtos não encontrados vira um beco sem
 * saída: a informação de quais linhas falharam existe só na tela e desaparece
 * ao fechar o diálogo.
 */
export function buildNotImportedCsv(plan: ImportPlan): string {
  const rows = plan.rows.filter((row) => !willWrite(row));

  const lines = [
    CSV_HEADERS.join(CSV_SEPARATOR),
    ...rows.map((row) =>
      [
        String(row.lineNumber),
        row.rawKey,
        row.rawCmv,
        row.match?.title ?? '',
        row.match?.code ?? '',
        statusPresentation(row.status).label,
        row.reason ?? '',
      ]
        .map(escapeCsv)
        .join(CSV_SEPARATOR),
    ),
  ];

  // BOM para o Excel em pt-BR abrir com acentuação correta por duplo clique.
  return `\uFEFF${lines.join('\r\n')}\r\n`;
}

function escapeCsv(value: string): string {
  const needsQuotes = /[";\r\n]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

/** Dispara o download no navegador e libera a URL temporária. */
export function downloadTextFile(fileName: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  URL.revokeObjectURL(url);
}
