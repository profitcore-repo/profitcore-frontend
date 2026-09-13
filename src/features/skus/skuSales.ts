import type { MercadoLivreOrder, SkuResponse } from '@/types/api';

export type SkuSales = {
  ordersCount: number;
  unitsSold: number;
  realizedRevenue: number;
};

export type OrderItemAggregate = SkuSales & {
  /** Título do anúncio. É a única fonte de nome do produto que temos. */
  title: string | null;
};

const EMPTY_AGGREGATE: OrderItemAggregate = {
  ordersCount: 0,
  unitsSold: 0,
  realizedRevenue: 0,
  title: null,
};

export function normalizeSkuCode(code: string): string {
  return code.trim().toUpperCase();
}

/**
 * Agrega vendas por anúncio, indexadas por `itemFullId` (`MLB…`).
 *
 * Essa é a chave certa porque a importação grava em `Sku.Code` exatamente o id
 * de anúncio devolvido por `/users/{sellerId}/items/search` do Mercado Livre.
 *
 * Cancelado e inválido ficam fora: não são receita realizada e distorceriam o
 * ranking dos principais produtos.
 *
 * Variações do mesmo anúncio somam juntas, porque a granularidade do nosso SKU
 * é o anúncio, não a variação.
 */
export function aggregateOrderItems(
  orders: readonly MercadoLivreOrder[],
): Map<string, OrderItemAggregate> {
  const byItem = new Map<number, OrderItemAggregate>();
  const index = new Map<string, OrderItemAggregate>();

  for (const order of orders) {
    if (order.status === 'Cancelled' || order.status === 'Invalid') continue;

    for (const item of order.items) {
      const current = byItem.get(item.itemId) ?? EMPTY_AGGREGATE;
      const accumulated: OrderItemAggregate = {
        ordersCount: current.ordersCount + 1,
        unitsSold: current.unitsSold + item.quantity,
        realizedRevenue: current.realizedRevenue + item.quantity * item.unitPrice,
        title: current.title ?? item.title,
      };

      byItem.set(item.itemId, accumulated);
      // Reescreve a chave a cada ocorrência: no fim, aponta para o total
      // acumulado do anúncio.
      index.set(normalizeSkuCode(item.itemFullId), accumulated);
    }
  }

  return index;
}

export type MainSku = {
  sku: SkuResponse;
  /** Nome do produto quando o cruzamento com pedidos funcionou. */
  title: string | null;
  sales: SkuSales;
};

/**
 * Escolhe os principais SKUs: maior receita realizada primeiro.
 *
 * Devolve sempre `limit` itens (ou o catálogo todo, se for menor), completando
 * com quem não vendeu no período. Isso é obrigatório, não estético: o passo do
 * onboarding exige `min(limit, total)` custos informados, e se a tela exibisse
 * só os SKUs com venda o seller poderia ficar sem nenhuma linha onde preencher
 * o que falta — travado num passo impossível de concluir.
 *
 * O `GET /skus` não devolve receita, então o ranking é feito aqui cruzando com
 * os pedidos que já sabemos consultar.
 */
export function selectMainSkus(
  skus: readonly SkuResponse[],
  salesIndex: Map<string, OrderItemAggregate>,
  limit: number,
): MainSku[] {
  return skus
    .map((sku) => {
      const aggregate = salesIndex.get(normalizeSkuCode(sku.code));
      return {
        sku,
        title: aggregate?.title ?? null,
        sales: aggregate ?? EMPTY_AGGREGATE,
      };
    })
    // Sort estável: entre os sem venda, preserva a ordem que o backend devolveu.
    .sort((a, b) => b.sales.realizedRevenue - a.sales.realizedRevenue)
    .slice(0, limit);
}

/** Se nenhum dos selecionados casou com vendas, a tela avisa o seller. */
export function hasAnySales(entries: readonly MainSku[]): boolean {
  return entries.some((entry) => entry.sales.realizedRevenue > 0);
}

/**
 * `null` é o único "não informado". Zero é custo real e conta como informado —
 * produto de custo zero existe (brinde, bonificação, amostra).
 */
export function hasCmv(sku: SkuResponse): boolean {
  return sku.cmv !== null;
}

export function countInformedCmv(skus: readonly SkuResponse[]): number {
  return skus.filter(hasCmv).length;
}
