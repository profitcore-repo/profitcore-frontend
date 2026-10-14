import type {
  MercadoLivreAnalysisSummary,
  MercadoLivreBillingAmounts,
  MercadoLivreProductPerformance,
  MercadoLivreTopProductsAnalysisResponse,
} from '@/types/api';
import { ANALYSIS_SCHEMA_VERSION } from '@/types/api';

/**
 * Dados fictícios para demonstração da tela de lucratividade.
 *
 * Modelados a partir de uma análise real exportada em planilha (Mercado Livre,
 * agosto de 2026), mas com valores de produto que servem apenas de exemplo —
 * não vêm da API e não devem ser tratados como leitura de uma loja real.
 *
 * As linhas são declaradas com os valores de entrada (receita, tarifa, frete,
 * CMV) e **todo derivado é calculado aqui**, pelas mesmas fórmulas do contrato
 * (`docs/analysis-top-products.md`). Mock com derivado digitado à mão passa a
 * mentir na primeira vez que alguém edita um número.
 */

type MockRow = {
  itemFullId: string;
  title: string;
  unitPriceAverage: number | null;
  quantitySold: number;
  ordersCount: number;
  eligibleRevenue: number;
  totalSaleFees: number;
  proportionalShippingCost: number;
  billingGrossCharges: number;
  /** `null` reproduz um anúncio sem CMV informado. */
  cmvUnit: number | null;
};

const MOCK_ROWS: MockRow[] = [
  {
    itemFullId: 'MLB5096194919',
    title: 'Kit 4 Top Feminino Sutia Sem Costura Azul Bojo Sustentação Azul P/M',
    unitPriceAverage: 78.62,
    quantitySold: 1,
    ordersCount: 1,
    eligibleRevenue: 78.62,
    totalSaleFees: 14.94,
    proportionalShippingCost: 54.24,
    billingGrossCharges: 0,
    cmvUnit: 38.4,
  },
  {
    itemFullId: 'MLB4899224859',
    title: 'Kit 3 Pares Meia Soquete Cano Curto Confortável Cor Sortida',
    unitPriceAverage: 16.18,
    quantitySold: 2,
    ordersCount: 2,
    eligibleRevenue: 32.35,
    totalSaleFees: 5.7,
    proportionalShippingCost: 37.08,
    billingGrossCharges: 0,
    cmvUnit: 3.12,
  },
  {
    itemFullId: 'MLB7526690034',
    title:
      'Kit 3 Cueca Box Masculina Uomo Adulto Elástico Várias Cores Diversas P/M',
    unitPriceAverage: 33.75,
    quantitySold: 1,
    ordersCount: 1,
    eligibleRevenue: 33.75,
    totalSaleFees: 4.72,
    proportionalShippingCost: 19.14,
    billingGrossCharges: 0,
    cmvUnit: 11.55,
  },
  {
    itemFullId: 'MLB4960747659',
    title: 'Calça Moletom Masculina Flanelada Com Bolso Confortável',
    unitPriceAverage: 51.12,
    quantitySold: 1,
    ordersCount: 1,
    eligibleRevenue: 51.12,
    totalSaleFees: 7.16,
    proportionalShippingCost: 8.05,
    billingGrossCharges: 0,
    cmvUnit: 26.9,
  },
  {
    itemFullId: 'MLB5096218851',
    title: 'Kit 2 Top Feminino Sutia Sem Costura Bege Bojo Sustentação Bege P/M',
    unitPriceAverage: 46.31,
    quantitySold: 1,
    ordersCount: 1,
    eligibleRevenue: 46.31,
    totalSaleFees: 6.48,
    proportionalShippingCost: 6.85,
    billingGrossCharges: 0,
    cmvUnit: 19.2,
  },
  {
    itemFullId: 'MLB4960738705',
    title: 'Kit 3 Pares Meia Soquete Cano Curto Confortável Cor Sortida',
    unitPriceAverage: 16.06,
    quantitySold: 4,
    ordersCount: 2,
    eligibleRevenue: 64.24,
    totalSaleFees: 4.5,
    proportionalShippingCost: 27.64,
    billingGrossCharges: 0,
    cmvUnit: 3.12,
  },
  {
    itemFullId: 'MLB4899182495',
    title: 'Calça Moletom Plus Size Masculina Flanelada Com Bolsos',
    unitPriceAverage: 60.36,
    quantitySold: 3,
    ordersCount: 3,
    eligibleRevenue: 181.09,
    totalSaleFees: 29.17,
    proportionalShippingCost: 24.85,
    billingGrossCharges: 0,
    cmvUnit: 33.05,
  },
  {
    itemFullId: 'MLB7526690046',
    title:
      'Kit 10 Cueca Box Masculina Uomo Adulto Elástico Várias Cores Diversos P/M',
    unitPriceAverage: 90.0,
    quantitySold: 1,
    ordersCount: 1,
    eligibleRevenue: 90.0,
    totalSaleFees: 12.6,
    proportionalShippingCost: 14.45,
    billingGrossCharges: 0,
    cmvUnit: 38.5,
  },
  {
    itemFullId: 'MLB7177391848',
    title: 'Calça Moletom Masculina Flanelada Com Bolso Confortável',
    unitPriceAverage: 58.68,
    quantitySold: 11,
    ordersCount: 9,
    eligibleRevenue: 645.51,
    totalSaleFees: 103.23,
    proportionalShippingCost: 88.95,
    billingGrossCharges: 28.59,
    cmvUnit: 26.9,
  },
  {
    itemFullId: 'MLB7170820506',
    title: 'Camiseta Masculina Mormaii Original 100% Algodão Premium',
    unitPriceAverage: 55.81,
    quantitySold: 71,
    ordersCount: 69,
    eligibleRevenue: 3962.74,
    totalSaleFees: 698.12,
    proportionalShippingCost: 699.14,
    billingGrossCharges: 341.93,
    cmvUnit: 27.99,
  },
  {
    itemFullId: 'MLB4960692551',
    title: 'Camiseta Masculina Mormaii Original 100% Algodão Premium',
    unitPriceAverage: 50.88,
    quantitySold: 157,
    ordersCount: 146,
    eligibleRevenue: 7987.78,
    totalSaleFees: 923.94,
    proportionalShippingCost: 1363.03,
    billingGrossCharges: 0,
    cmvUnit: 27.99,
  },
  {
    // Anúncio sem CMV informado: é o caso que a tela precisa saber tratar, com
    // lucro e margem em `null` e leitura marcada como incompleta.
    itemFullId: 'MLB5096230173',
    title: 'Kit 4 Top Feminino Sutia Sem Costura Preto Bojo Sustentação Preto P/M',
    unitPriceAverage: 87.87,
    quantitySold: 1,
    ordersCount: 1,
    eligibleRevenue: 87.87,
    totalSaleFees: 16.7,
    proportionalShippingCost: 16.3,
    billingGrossCharges: 0,
    cmvUnit: null,
  },
];

const cents = (value: number) => Math.round(value * 100) / 100;

const percentOf = (value: number, base: number) =>
  base > 0 ? cents((value / base) * 100) : 0;

function billing(grossCharges: number): MercadoLivreBillingAmounts {
  return {
    grossCharges: cents(grossCharges),
    bonuses: 0,
    netCost: cents(grossCharges),
    grossMovement: cents(grossCharges),
  };
}

function toProduct(row: MockRow): MercadoLivreProductPerformance {
  const netRevenue = cents(row.eligibleRevenue - row.totalSaleFees);
  const contributionBeforeCogs = cents(
    netRevenue - row.proportionalShippingCost,
  );
  const totalCogs =
    row.cmvUnit === null ? null : cents(row.cmvUnit * row.quantitySold);
  const totalCosts =
    totalCogs === null
      ? null
      : cents(row.totalSaleFees + row.proportionalShippingCost + totalCogs);
  const grossProfit = totalCogs === null ? null : cents(netRevenue - totalCogs);
  const netProfit =
    totalCosts === null ? null : cents(row.eligibleRevenue - totalCosts);

  return {
    itemFullId: row.itemFullId,
    itemId: null,
    sellerSku: null,
    userProductId: null,
    variationId: null,
    variationName: null,
    title: row.title,
    pictureUrl: null,
    unitPriceAverage: row.unitPriceAverage,
    quantitySold: row.quantitySold,
    ordersCount: row.ordersCount,
    grossRevenue: row.eligibleRevenue,
    sellerDiscounts: 0,
    refundsAmount: 0,
    eligibleRevenue: row.eligibleRevenue,
    totalSaleFees: row.totalSaleFees,
    netRevenue,
    proportionalShippingCost: row.proportionalShippingCost,
    proportionalBillingGrossCharges: row.billingGrossCharges,
    proportionalBillingBonuses: 0,
    proportionalBillingNetCost: row.billingGrossCharges,
    contributionBeforeCogs,
    contributionBeforeCogsPercent: percentOf(
      contributionBeforeCogs,
      row.eligibleRevenue,
    ),
    cmvUnit: row.cmvUnit,
    totalCogs,
    totalCosts,
    grossProfit,
    grossMarginPercent:
      grossProfit === null ? null : percentOf(grossProfit, row.eligibleRevenue),
    netProfit,
    netMarginPercent:
      netProfit === null ? null : percentOf(netProfit, row.eligibleRevenue),
    firstSaleAtUtc: null,
    lastSaleAtUtc: null,
  };
}

const MOCK_PRODUCTS: MercadoLivreProductPerformance[] = MOCK_ROWS.map(toProduct)
  // O backend devolve `topProducts` ordenado por receita bruta desc.
  .sort((a, b) => b.grossRevenue - a.grossRevenue);

const sum = (pick: (p: MercadoLivreProductPerformance) => number) =>
  cents(MOCK_PRODUCTS.reduce((total, product) => total + pick(product), 0));

const ELIGIBLE_REVENUE = sum((p) => p.eligibleRevenue);
const TOTAL_SALE_FEES = sum((p) => p.totalSaleFees);
const TOTAL_SHIPPING = sum((p) => p.proportionalShippingCost);
const TOTAL_BILLING_CHARGES = sum((p) => p.proportionalBillingGrossCharges);
const TOTAL_COGS = sum((p) => p.totalCogs ?? 0);
const NET_REVENUE = cents(ELIGIBLE_REVENUE - TOTAL_SALE_FEES);
const CONTRIBUTION_BEFORE_COGS = cents(NET_REVENUE - TOTAL_SHIPPING);
const WITHOUT_CMV = MOCK_PRODUCTS.filter((p) => p.cmvUnit === null).length;
const ORDERS_COUNT = MOCK_PRODUCTS.reduce((t, p) => t + p.ordersCount, 0);
const UNITS_SOLD = MOCK_PRODUCTS.reduce((t, p) => t + p.quantitySold, 0);

const MOCK_SUMMARY: MercadoLivreAnalysisSummary = {
  ordersCount: ORDERS_COUNT,
  ordersPaidCount: ORDERS_COUNT,
  ordersShippedCount: ORDERS_COUNT,
  totalUnitsSold: UNITS_SOLD,

  distinctProductsCount: MOCK_PRODUCTS.length,
  productsWithCmvCount: MOCK_PRODUCTS.length - WITHOUT_CMV,
  productsWithoutCmvCount: WITHOUT_CMV,

  grossRevenue: ELIGIBLE_REVENUE,
  sellerDiscounts: 0,
  buyerPaidShipping: 0,
  refundsAmount: 0,

  eligibleRevenue: ELIGIBLE_REVENUE,
  totalSaleFees: TOTAL_SALE_FEES,
  netRevenue: NET_REVENUE,

  totalShippingCost: TOTAL_SHIPPING,
  totalShippingCostFromApi: TOTAL_SHIPPING,
  shipmentsResolvedCount: ORDERS_COUNT,
  shipmentsMissingCount: 0,

  totalBillingGrossCharges: TOTAL_BILLING_CHARGES,
  totalBillingBonuses: 0,
  totalBillingNetCost: TOTAL_BILLING_CHARGES,
  totalBillingGrossMovement: TOTAL_BILLING_CHARGES,
  billingRecordsConsumed: 2,
  billingOrdersMatched: 2,

  contributionBeforeCogs: CONTRIBUTION_BEFORE_COGS,
  contributionBeforeCogsPercent: percentOf(
    CONTRIBUTION_BEFORE_COGS,
    ELIGIBLE_REVENUE,
  ),

  totalCogs: TOTAL_COGS,

  // Há anúncio sem CMV no exemplo, então o resumo não afirma lucro — igual ao
  // backend, que devolve `null` enquanto qualquer elegível estiver sem custo.
  totalAllCosts: null,
  grossProfit: null,
  grossMarginPercent: null,
  netProfit: null,
  netMarginPercent: null,

  currencyId: 'BRL',
};

/** Resposta fictícia completa, no formato devolvido pela API real. */
export const MOCK_PROFITABILITY_ANALYSIS: MercadoLivreTopProductsAnalysisResponse =
  {
    schemaVersion: ANALYSIS_SCHEMA_VERSION,
    storeId: 'mock-store-daniel',
    mercadoLivreSellerId: 0,
    generatedAtUtc: '2026-09-01T12:00:00Z',
    fromUtc: '2026-08-01T03:00:00Z',
    toUtc: '2026-09-01T02:59:59Z',
    timezone: 'America/Sao_Paulo',
    days: 31,
    calculationBasis: 'eligible_orders',

    processing: {
      calculationBasis: 'eligible_orders',
      cancellationsAlreadyProcessed: true,
      refundsAlreadyProcessed: false,
      billingUsedInContribution: false,
      personalBuyerDataRemoved: true,
    },

    pagination: {
      pagingTotal: ORDERS_COUNT,
      stopReason: 'reached_total',
      pagingLimit: 51,
      offsetsFetched: [0, 51, 102, 153, 204],
      pagesFetched: 5,
      recordsReceivedCount: ORDERS_COUNT,
      uniqueOrderIdsCount: ORDERS_COUNT,
      duplicateOrderIdsCount: 0,
      paginationComplete: true,
      paginationErrors: [],
    },

    sourceCounts: {
      ordersFetchedCount: ORDERS_COUNT + 1,
      ordersEligibleCount: ORDERS_COUNT,
      ordersExcludedCount: 1,
      unitsFetchedCount: UNITS_SOLD + 1,
      unitsEligibleCount: UNITS_SOLD,
      unitsExcludedCount: 1,
      productsFetchedCount: MOCK_PRODUCTS.length,
      productsEligibleCount: MOCK_PRODUCTS.length,
      productsOnlyExcludedCount: 0,
    },

    summary: MOCK_SUMMARY,
    topProducts: MOCK_PRODUCTS,

    excludedOrdersSummary: {
      ordersCount: 1,
      unitsCount: 1,
      grossRevenue: 87.87,
      totalSaleFees: 16.7,
      totalShippingCostFromApi: 0,
      totalBillingGrossCharges: 0,
      totalBillingBonuses: 0,
      totalBillingNetCost: 0,
      postDeliveryCancellationsCount: 0,
      postDeliveryReviewByStatus: { not_applicable: 1 },
      byReason: { cancelled: 1 },
    },
    excludedOrders: null,

    billingAudit: {
      found: billing(TOTAL_BILLING_CHARGES),
      orderIdsQueriedCount: ORDERS_COUNT,
      ordersServedFromCache: 0,
      requestsMade: 5,
      requestsFailed: 0,
      requestsSkippedByRateLimit: 0,
      recordsConsumedCount: 2,
      ordersMatchedCount: 2,
      ordersWithoutBillingCount: 0,
      ordersWithoutBillingIds: [],
      eligibleOrdersWithoutSaleFeeCount: 0,
      eligibleOrdersWithoutSaleFeeIds: [],
      distributedToEligibleOrders: billing(TOTAL_BILLING_CHARGES),
      distributedToExcludedOrders: billing(0),
      distributedTotal: billing(TOTAL_BILLING_CHARGES),
      notDistributed: billing(0),
      usedInContribution: false,
      status: 'complete',
      periodsQueried: ['2026-09-01', '2026-08-01'],
      periodsFailed: [],
    },

    postSaleAudit: {
      status: 'complete',
      ordersClaimsQueried: ORDERS_COUNT,
      ordersClaimsSkippedByCap: 0,
      claimsFound: 0,
      returnsFound: 0,
      changesFound: 0,
      paymentsQueried: 1,
      refundsFound: 0,
      ordersDiscountsQueried: 0,
      callsMade: ORDERS_COUNT,
      callsFailed: 0,
      errorsSample: [],
    },

    reconciliation: {
      sourceRawTotals: {
        ordersCount: ORDERS_COUNT + 1,
        unitsCount: UNITS_SOLD + 1,
        grossRevenue: cents(ELIGIBLE_REVENUE + 87.87),
        eligibleRevenue: cents(ELIGIBLE_REVENUE + 87.87),
        totalSaleFees: cents(TOTAL_SALE_FEES + 16.7),
        totalShippingCost: TOTAL_SHIPPING,
        totalBillingGrossCharges: TOTAL_BILLING_CHARGES,
        totalBillingBonuses: 0,
        totalBillingNetCost: TOTAL_BILLING_CHARGES,
      },
      eligibleTotals: {
        ordersCount: ORDERS_COUNT,
        unitsCount: UNITS_SOLD,
        grossRevenue: ELIGIBLE_REVENUE,
        eligibleRevenue: ELIGIBLE_REVENUE,
        totalSaleFees: TOTAL_SALE_FEES,
        totalShippingCost: TOTAL_SHIPPING,
        totalBillingGrossCharges: TOTAL_BILLING_CHARGES,
        totalBillingBonuses: 0,
        totalBillingNetCost: TOTAL_BILLING_CHARGES,
      },
      excludedTotals: {
        ordersCount: 1,
        unitsCount: 1,
        grossRevenue: 87.87,
        eligibleRevenue: 87.87,
        totalSaleFees: 16.7,
        totalShippingCost: 0,
        totalBillingGrossCharges: 0,
        totalBillingBonuses: 0,
        totalBillingNetCost: 0,
      },
      aggregationDifferences: {},
      monetaryTolerance: 0,
      externalControlDifference: null,
      status: 'reconciled',
    },

    dataQuality: {
      level: 'partial',
      warnings: [
        {
          code: 'cmv_missing',
          message: `${WITHOUT_CMV} produto elegível sem CMV informado: lucro e margem ficam nulos.`,
          count: WITHOUT_CMV,
          sampleOrderIds: [],
        },
      ],
      missingFields: [
        'payment.totalRefundQuantity',
        'items.refundQuantity',
        'shipping.billableWeight',
      ],
      inconsistencies: [],
    },
  };
