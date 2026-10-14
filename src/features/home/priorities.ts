import {
  displayTitle,
  effectiveContribution,
  hasKnownCmv,
  resolveStatus,
} from '@/features/profitability/profitability';
import { formatBRL } from '@/utils/currency';
import type {
  MercadoLivreProductPerformance,
  MercadoLivreTopProductsAnalysisResponse,
} from '@/types/api';

/**
 * Situações que a home coloca na frente do seller.
 *
 * Tudo aqui é derivado de campos que o contrato garante (ver
 * `docs/analysis-top-products.md`). Nada é estimado, inferido ou preenchido com
 * valor de exemplo: se o dado não existe, a situação não aparece. É o que
 * separa "o que merece sua atenção" de um painel de palpites.
 */

export type PrioritySeverity =
  /** Dinheiro já perdido ou em risco confirmado. */
  | 'risk'
  /** Pressão real sobre o resultado, exige investigação antes de agir. */
  | 'attention'
  /** A leitura está incompleta: decidir agora seria decidir no escuro. */
  | 'info';

export type PriorityAction = {
  label: string;
  to: string;
  /**
   * `/profitability` está restrita a admin enquanto a leitura de lucro está em
   * validação interna (ver `AdminOnlyRoute`). A home não pode oferecer um
   * botão que devolve o usuário para ela mesma.
   */
  adminOnly?: boolean;
};

export type Priority = {
  id: string;
  severity: PrioritySeverity;
  badgeLabel: string;
  title: string;
  description: string;
  /** Número grande do card, já formatado. */
  impactValue: string;
  impactCaption: string;
  /** Negativo pinta o valor como perda. */
  impactIsNegative: boolean;
  /** Peso monetário usado só para ordenar dentro da mesma severidade. */
  weight: number;
  actions: PriorityAction[];
};

const SEVERITY_RANK: Record<PrioritySeverity, number> = {
  risk: 0,
  attention: 1,
  info: 2,
};

/**
 * A partir de quanto o frete deixa de ser custo normal e passa a ser situação.
 * 25% da receita do anúncio: abaixo disso a conversa é de precificação, não de
 * investigação de envio.
 */
const SHIPPING_PRESSURE_THRESHOLD = 0.25;

/** Quantos cards a home mostra. Mais que isso deixa de ser priorização. */
export const MAX_PRIORITIES = 4;

function percentLabel(ratio: number): string {
  return `${(ratio * 100).toFixed(1).replace('.', ',')}%`;
}

function plural(count: number, one: string, many: string): string {
  return count === 1 ? one : many;
}

/** O custo que mais pesa na linha, para o card dizer onde olhar primeiro. */
function dominantCost(product: MercadoLivreProductPerformance): string {
  const candidates: { label: string; value: number }[] = [
    { label: 'o frete', value: product.proportionalShippingCost },
    { label: 'as tarifas do Mercado Livre', value: product.totalSaleFees },
    { label: 'o custo do produto', value: product.totalCogs ?? 0 },
  ];
  return candidates.reduce((max, c) => (c.value > max.value ? c : max))
    .label;
}

function negativeContribution(
  products: readonly MercadoLivreProductPerformance[],
): Priority | null {
  const losses = products
    .filter((product) => resolveStatus(product) === 'loss')
    .sort(
      (a, b) =>
        effectiveContribution(a).value - effectiveContribution(b).value,
    );

  const worst = losses[0];
  if (!worst) return null;

  const { value, isBeforeCogs } = effectiveContribution(worst);
  const others = losses.length - 1;

  return {
    id: `negative-contribution:${worst.itemFullId}`,
    severity: 'risk',
    badgeLabel: 'Contribuição negativa',
    title: displayTitle(worst),
    description: [
      isBeforeCogs
        ? 'O anúncio já fica negativo antes do CMV: receita menos tarifas e frete não se paga, e o custo do produto ainda será descontado daí.'
        : `O resultado ficou negativo depois de tarifas, frete e CMV. ${
            dominantCost(worst).charAt(0).toUpperCase() +
            dominantCost(worst).slice(1)
          } concentra a maior parte do impacto.`,
      others > 0
        ? `Outros ${others} ${plural(others, 'anúncio está', 'anúncios estão')} na mesma situação.`
        : '',
    ]
      .filter(Boolean)
      .join(' '),
    impactValue: formatBRL(value),
    impactCaption: isBeforeCogs
      ? 'contribuição antes do CMV'
      : 'contribuição no período',
    impactIsNegative: true,
    weight: Math.abs(value),
    actions: [
      { label: 'Ver composição', to: '/profitability', adminOnly: true },
      { label: 'Revisar CMV', to: '/products' },
    ],
  };
}

function shippingPressure(
  products: readonly MercadoLivreProductPerformance[],
): Priority | null {
  const pressured = products
    .filter(
      (product) =>
        product.eligibleRevenue > 0 &&
        product.proportionalShippingCost / product.eligibleRevenue >=
          SHIPPING_PRESSURE_THRESHOLD,
    )
    .sort(
      (a, b) => b.proportionalShippingCost - a.proportionalShippingCost,
    );

  const worst = pressured[0];
  if (!worst) return null;

  const ratio = worst.proportionalShippingCost / worst.eligibleRevenue;

  return {
    id: `shipping-pressure:${worst.itemFullId}`,
    severity: 'attention',
    badgeLabel: 'Pressão de frete',
    title: 'O frete consome uma parte relevante da receita',
    description: `Em ${displayTitle(worst)}, o custo de envio do vendedor somou ${formatBRL(
      worst.proportionalShippingCost,
    )} em ${worst.ordersCount} ${plural(
      worst.ordersCount,
      'pedido',
      'pedidos',
    )}. Confira os envios mais caros antes de concluir que houve cobrança indevida.`,
    impactValue: percentLabel(ratio),
    impactCaption: 'da receita do anúncio',
    impactIsNegative: false,
    weight: worst.proportionalShippingCost,
    actions: [
      { label: 'Conferir envios', to: '/profitability', adminOnly: true },
    ],
  };
}

function missingCmv(
  analysis: MercadoLivreTopProductsAnalysisResponse,
): Priority | null {
  const { summary, topProducts } = analysis;
  if (summary.productsWithoutCmvCount <= 0) return null;

  const uncoveredRevenue = topProducts
    .filter((product) => !hasKnownCmv(product))
    .reduce((sum, product) => sum + product.eligibleRevenue, 0);

  const share =
    summary.eligibleRevenue > 0
      ? uncoveredRevenue / summary.eligibleRevenue
      : 0;
  const count = summary.productsWithoutCmvCount;

  return {
    id: 'missing-cmv',
    severity: 'info',
    badgeLabel: 'Leitura incompleta',
    title: `${count} ${plural(count, 'anúncio sem custo informado', 'anúncios sem custo informado')}`,
    description: `Sem CMV não há lucro a calcular: para ${plural(
      count,
      'esse anúncio',
      'esses anúncios',
    )} o sistema só consegue mostrar a contribuição antes do custo do produto. Informar o CMV fecha a conta.`,
    impactValue: percentLabel(share),
    impactCaption: 'da receita sem custo informado',
    impactIsNegative: false,
    weight: uncoveredRevenue,
    actions: [{ label: 'Informar CMV', to: '/products' }],
  };
}

function postDeliveryReview(
  analysis: MercadoLivreTopProductsAnalysisResponse,
): Priority | null {
  const count =
    analysis.excludedOrdersSummary.postDeliveryReviewByStatus
      ?.review_required ?? 0;
  if (count <= 0) return null;

  return {
    id: 'post-delivery-review',
    severity: 'risk',
    badgeLabel: 'Cancelamento após entrega',
    title: `${count} ${plural(count, 'pedido cancelado', 'pedidos cancelados')} depois de entregue sem devolução registrada`,
    description:
      'O produto saiu, foi entregue e o pedido foi cancelado — e o Mercado Livre não registrou devolução. Pode ser produto e frete perdidos. Vale abrir cada caso no Mercado Livre antes de considerar o período fechado.',
    impactValue: String(count),
    impactCaption: plural(count, 'pedido a revisar', 'pedidos a revisar'),
    impactIsNegative: true,
    // Fica por último entre os riscos: o valor perdido não é afirmável aqui.
    weight: 0,
    actions: [],
  };
}

/**
 * Situações do período, ordenadas por severidade e, dentro dela, por impacto.
 *
 * Devolve lista vazia quando nada se destaca — e isso é um resultado válido,
 * não um estado de erro.
 */
export function buildPriorities(
  analysis: MercadoLivreTopProductsAnalysisResponse | null,
): Priority[] {
  if (!analysis) return [];

  const products = analysis.topProducts ?? [];

  return [
    negativeContribution(products),
    postDeliveryReview(analysis),
    shippingPressure(products),
    missingCmv(analysis),
  ]
    .filter((priority): priority is Priority => priority !== null)
    .sort(
      (a, b) =>
        SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] ||
        b.weight - a.weight,
    )
    .slice(0, MAX_PRIORITIES);
}

/**
 * A tela só sabe ler o schema que os tipos descrevem (`2.x`).
 *
 * Checar isso não é paranoia: a resposta `1.x` não tem `pagination`,
 * `dataQuality` nem `eligibleRevenue`, e ler esses campos de um objeto antigo
 * daria tela branca ou — pior — números em branco passando por zero. Melhor
 * dizer que o contrato mudou do que exibir um período vazio.
 */
export function isSupportedSchema(
  analysis: MercadoLivreTopProductsAnalysisResponse | null,
): boolean {
  if (!analysis) return true;
  const major = (analysis.schemaVersion ?? '').split('.')[0];
  return major === '2';
}

export type ReadingConfidence = {
  /** `true` quando nada compromete a leitura do período. */
  isReliable: boolean;
  level: string;
  /** Frases curtas do que está incompleto. Vazio quando está tudo fechado. */
  caveats: string[];
};

/**
 * O quanto a leitura do período pode ser levada a sério.
 *
 * Separado das prioridades de propósito: paginação incompleta ou frete não
 * resolvido não é uma situação para agir, é uma ressalva sobre todos os números
 * da tela. Misturar as duas coisas faria o seller agir sobre um número que o
 * backend não garantiu.
 */
export function readingConfidence(
  analysis: MercadoLivreTopProductsAnalysisResponse | null,
): ReadingConfidence {
  if (!analysis) {
    return { isReliable: false, level: 'unknown', caveats: [] };
  }

  const { pagination, summary, billingAudit, dataQuality, postSaleAudit } =
    analysis;
  const caveats: string[] = [];

  if (!pagination.paginationComplete) {
    caveats.push(
      'A leitura dos pedidos não fechou com o total informado pelo Mercado Livre, então o período está subcontado.',
    );
  }
  if (pagination.duplicateOrderIdsCount > 0) {
    caveats.push(
      `${pagination.duplicateOrderIdsCount} ${plural(
        pagination.duplicateOrderIdsCount,
        'pedido repetido foi',
        'pedidos repetidos foram',
      )} descartado na paginação.`,
    );
  }
  if (summary.shipmentsMissingCount > 0) {
    caveats.push(
      `${summary.shipmentsMissingCount} ${plural(
        summary.shipmentsMissingCount,
        'remessa não retornou',
        'remessas não retornaram',
      )} custo de frete e entrou na conta como zero. Frete pendente não é frete grátis.`,
    );
  }
  if (summary.productsWithoutCmvCount > 0) {
    caveats.push(
      'Enquanto houver anúncio sem CMV, o lucro consolidado do período não é calculado — só a contribuição antes do custo do produto.',
    );
  }
  if (billingAudit.status !== 'complete' && billingAudit.status !== 'no_orders') {
    caveats.push(
      'A auditoria de billing ficou parcial. Ela não entra no resultado, mas é o que confere as tarifas cobradas.',
    );
  }
  if (postSaleAudit.status === 'partial') {
    caveats.push(
      'Parte das consultas de pós-venda falhou, então devoluções e reembolsos podem estar incompletos.',
    );
  }
  if (analysis.reconciliation.status === 'divergent') {
    caveats.push(
      'Os totais do resumo não fecharam com a soma dos pedidos. Trate os valores como aproximados até a próxima apuração.',
    );
  }

  return {
    isReliable: caveats.length === 0 && dataQuality.level === 'complete',
    level: dataQuality.level,
    caveats,
  };
}
