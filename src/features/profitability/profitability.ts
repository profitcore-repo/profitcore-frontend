import type {
  MercadoLivreAnalysisSummary,
  MercadoLivreProductPerformance,
} from '@/types/api';

/**
 * Situação de leitura de uma linha de produto.
 *
 * A distinção entre `loss` e `incomplete` é o ponto central desta tela. Quando o
 * SKU não tem CMV informado, o backend soma o custo de mercadoria como zero
 * (`totalCogs ?? 0`), então o lucro devolvido está inflado. Tratar essas duas
 * situações como a mesma coisa faria a tela afirmar lucro onde não há leitura.
 */
export type ProfitabilityStatus = 'loss' | 'incomplete' | 'healthy';

export type ProfitabilityFilter = 'all' | ProfitabilityStatus;

export type ProfitabilitySortKey = 'revenue' | 'netProfit' | 'netMargin';

/** `null` = não informado. Zero é custo real (brinde, bonificação, amostra). */
export function hasKnownCmv(product: MercadoLivreProductPerformance): boolean {
  return product.cmvUnit !== null;
}

export function resolveStatus(
  product: MercadoLivreProductPerformance,
): ProfitabilityStatus {
  // Sem CMV o backend devolve `netProfit: null` — não há leitura de lucro, mas
  // a contribuição antes do CMV já pode estar negativa, e isso é prejuízo
  // certo: nenhum custo de mercadoria vai melhorar o número.
  if (!hasKnownCmv(product)) {
    return product.contributionBeforeCogs < 0 ? 'loss' : 'incomplete';
  }
  return (product.netProfit ?? 0) < 0 ? 'loss' : 'healthy';
}

/**
 * O melhor número de resultado que existe para o produto.
 *
 * Com CMV é a contribuição completa (`netProfit`). Sem CMV, é a contribuição
 * antes do CMV — que é um **teto**, não o resultado: o custo de mercadoria
 * ainda será descontado dali. `isBeforeCogs` existe para a tela dizer isso em
 * vez de deixar o seller ler um teto como se fosse lucro.
 */
export function effectiveContribution(product: MercadoLivreProductPerformance): {
  value: number;
  isBeforeCogs: boolean;
} {
  if (product.netProfit !== null) {
    return { value: product.netProfit, isBeforeCogs: false };
  }
  return { value: product.contributionBeforeCogs, isBeforeCogs: true };
}

export const STATUS_LABEL: Record<ProfitabilityStatus, string> = {
  loss: 'Prejuízo confirmado',
  incomplete: 'Leitura incompleta',
  healthy: 'Sem alerta relevante',
};

export const STATUS_COLOR: Record<
  ProfitabilityStatus,
  'error' | 'warning' | 'default'
> = {
  loss: 'error',
  incomplete: 'warning',
  healthy: 'default',
};

/**
 * Nome exibível do produto. O `title` vem dos pedidos do Mercado Livre e pode
 * chegar vazio; nesse caso o id do anúncio é a única identificação que temos.
 */
export function displayTitle(product: MercadoLivreProductPerformance): string {
  return (product.title ?? '').trim() || product.itemFullId;
}

export function matchesSearch(
  product: MercadoLivreProductPerformance,
  term: string,
): boolean {
  const q = term.trim().toLowerCase();
  if (!q) return true;
  if (product.itemFullId.toLowerCase().includes(q)) return true;
  return (product.title ?? '').toLowerCase().includes(q);
}

export function matchesFilter(
  product: MercadoLivreProductPerformance,
  filter: ProfitabilityFilter,
): boolean {
  return filter === 'all' || resolveStatus(product) === filter;
}

function sortValue(
  product: MercadoLivreProductPerformance,
  key: ProfitabilitySortKey,
): number {
  switch (key) {
    case 'revenue':
      return product.grossRevenue;
    // Sem CMV não existe lucro: ordena pela contribuição antes do CMV, que é o
    // teto do resultado. Manda a linha incompleta para perto de onde ela vai
    // cair, em vez de jogá-la para o fim como se fosse zero.
    case 'netProfit':
      return effectiveContribution(product).value;
    case 'netMargin':
      return (
        product.netMarginPercent ?? product.contributionBeforeCogsPercent
      );
  }
}

export function sortProducts(
  products: readonly MercadoLivreProductPerformance[],
  key: ProfitabilitySortKey,
  ascending: boolean,
): MercadoLivreProductPerformance[] {
  const direction = ascending ? 1 : -1;
  return [...products].sort(
    (a, b) => (sortValue(a, key) - sortValue(b, key)) * direction,
  );
}

/**
 * Margem em pontos percentuais, como o backend já devolve.
 *
 * Não multiplicar por 100: `netMarginPercent: 12.34` significa 12,34%.
 */
export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `${value.toFixed(1)}%`;
}

export type ProfitabilityCoverage = {
  /** Produtos com CMV informado / produtos vendidos no período. */
  ratio: number;
  /** Receita bruta coberta por produtos com CMV informado. */
  coveredRevenue: number;
  totalRevenue: number;
  /** `true` quando ao menos um produto entrou na conta sem CMV. */
  hasGaps: boolean;
};

/**
 * Quanto da leitura pode ser levada a sério.
 *
 * A cobertura é medida em receita, não em contagem de produtos: um SKU sem CMV
 * que responde por metade do faturamento compromete a leitura muito mais do que
 * dez SKUs de cauda longa.
 */
export function computeCoverage(
  products: readonly MercadoLivreProductPerformance[] | null | undefined,
  summary: MercadoLivreAnalysisSummary,
): ProfitabilityCoverage {
  const list = products ?? [];
  const totalRevenue = list.reduce((sum, p) => sum + p.grossRevenue, 0);
  const coveredRevenue = list
    .filter(hasKnownCmv)
    .reduce((sum, p) => sum + p.grossRevenue, 0);

  return {
    ratio: totalRevenue > 0 ? coveredRevenue / totalRevenue : 0,
    coveredRevenue,
    totalRevenue,
    hasGaps: summary.productsWithoutCmvCount > 0,
  };
}

/** Rótulo do período analisado, a partir do que o backend resolveu. */
export function formatPeriod(fromUtc: string, toUtc: string): string {
  const format = (iso: string) => {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };
  return `${format(fromUtc)} a ${format(toUtc)}`;
}
