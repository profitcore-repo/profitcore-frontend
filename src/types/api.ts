export type HealthCheckResponse = {
  status: string;
  checkedAtUtc: string;
};

export type MercadoLivreStoreResponse = {
  id: string;
  mercadoLivreSellerId: number;
  sellerNickname: string | null;
  sellerEmail: string | null;
  scopes: string;
  expiresAtUtc: string;
  createdAtUtc: string;
  updatedAtUtc: string | null;
};

export type MercadoLivreOrdersDateRange =
  | 'Last24Hours'
  | 'Last7Days'
  | 'Last30Days'
  | 'Last90Days';

export type MercadoLivreOrderStatus =
  | 'PaymentRequired'
  | 'PaymentInProcess'
  | 'ToBeConfirmed'
  | 'ReadyToShip'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled'
  | 'NotRated'
  | 'Rated'
  | 'Invalid';

/**
 * O backend declara o status como `enum` C# e **nÃ£o** registra
 * `JsonStringEnumConverter`, entÃ£o `MercadoLivreOrder.status` chega como o
 * Ã­ndice do enum, nÃ£o como o nome. A ordem Ã© a declarada em
 * `Models/MercadoLivre/MercadoLivreOrderDtos.cs` e Ã© a Ãºnica fonte do mapa.
 *
 * O tipo aceita nÃºmero e nome porque o dia em que o backend registrar o
 * conversor a resposta passa a ser string sem quebrar o contrato â€” use
 * `resolveOrderStatus` (em `@/utils/orderStatus`) em vez de comparar direto.
 */
export type MercadoLivreOrderStatusCode = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type MercadoLivreOrderBuyer = {
  id: number;
  nickname: string | null;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
};

export type MercadoLivreOrderPayment = {
  paymentId: number;
  totalPaidAmount: number;
  transactionAmount: number;
  shippingCost: number;
  netReceivedAmount: number;
  status: string | null;
  statusDetail: string | null;
  paymentMethod: string | null;
  currencyId: string | null;
  transactionAmountRefunded: number;
  couponAmount: number;
  marketplaceFee: number;
  dateCreated: string | null;
  dateApproved: string | null;
  dateLastModified: string | null;
};

export type MercadoLivreOrderCancelDetail = {
  date: string | null;
  code: string | null;
  description: string | null;
  group: string | null;
  requestedBy: string | null;
};

export type MercadoLivreOrderShipping = {
  shippingId: number;
  status: string | null;
  shippingType: string | null;
  addressCity: string | null;
  addressState: string | null;
  addressZipCode: string | null;
  trackingNumber: string | null;
  dateShipped: string | null;
  dateDelivered: string | null;
};

export type MercadoLivreOrderItem = {
  itemId: number;
  itemFullId: string;
  title: string;
  itemPictureUrl: string | null;
  quantity: number;
  unitPrice: number;
  fullUnitPrice: number;
  variationName: string | null;
  variationId: number | null;
  sellerSku: string | null;
  userProductId: string | null;
  currencyId: string | null;
  /** Por unidade. O total da linha Ã© `saleFee * quantity`. */
  saleFee: number;
};

export type MercadoLivreOrder = {
  orderId: number;
  sellerId: number;
  /** Ãndice do enum no backend. Leia com `resolveOrderStatus`. */
  status: MercadoLivreOrderStatusCode | MercadoLivreOrderStatus;
  /** Status cru do Mercado Livre (`paid`, `cancelled`â€¦). Sempre string. */
  statusRaw: string;
  statusDetail: string | null;
  dateCreated: string;
  dateClosed: string | null;
  lastUpdated: string | null;
  buyer: MercadoLivreOrderBuyer;
  /** Pagamento principal. `payments` traz todos. */
  payment: MercadoLivreOrderPayment | null;
  payments: MercadoLivreOrderPayment[];
  shipping: MercadoLivreOrderShipping | null;
  items: MercadoLivreOrderItem[];
  /** Envio compartilhado entre pedidos. `null` quando o pedido Ã© sozinho. */
  packId: number | null;
  currencyId: string | null;
  paidAmount: number;
  couponAmount: number;
  cancelDetail: MercadoLivreOrderCancelDetail | null;
  mediationIds: number[];
  tags: string[];
  totalAmount: number;
  totalNetAmount: number;
  totalItemsQuantity: number;
  orderPermalink: string;
};

export type MercadoLivreOrderListResult = {
  orders: MercadoLivreOrder[];
  total: number;
  /** `false` quando o Mercado Livre nÃ£o informou `paging.total` (e `total` Ã© 0). */
  totalInformed: boolean;
  fromDate: string | null;
  toDate: string | null;
};

export type UserResponse = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  cpfCnpj: string;
  /** Faturamento mensal declarado (R$). `null` = nÃ£o informado. */
  monthlyRevenue: number | null;
  createdAtUtc: string;
  updatedAtUtc?: string | null;
};

export type CreateUserRequest = {
  fullName: string;
  email: string;
  phone: string;
  cpfCnpj: string;
  password: string;
};

export type UpdateUserRequest = {
  fullName: string;
  email: string;
  phone: string;
  cpfCnpj: string;
  password?: string;
  /**
   * Faturamento mensal declarado (R$).
   *
   * Omitir ou enviar `null` **nÃ£o altera** o valor gravado: o backend sÃ³ grava
   * quando o campo tem valor (`User.Update`). NÃ£o existe forma de limpar um
   * faturamento jÃ¡ informado pela API, apenas de sobrescrevÃª-lo.
   *
   * Negativo Ã© recusado com 400.
   */
  monthlyRevenue?: number | null;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
  tokenType: string;
  expiresAtUtc: string;
  user: UserResponse;
};

export type ProblemDetails = {
  status: number;
  title: string;
  detail?: string;
  code?: string;
  traceId?: string;
  errors?: Record<string, string[]>;
};

/**
 * SKU na nossa base, com o CMV informado pelo seller.
 *
 * O recurso Ã© `/skus` (nÃ£o Ã© especÃ­fico do Mercado Livre) e Ã© escopado pelo
 * usuÃ¡rio do token. NÃ£o traz tÃ­tulo: o Ãºnico vÃ­nculo com o catÃ¡logo do ML Ã©
 * `code`, que guarda o id do anÃºncio (`MLBâ€¦`) â€” Ã© assim que a importaÃ§Ã£o grava,
 * lendo `/users/{sellerId}/items/search` do Mercado Livre.
 */
export type SkuResponse = {
  id: string;
  userId: string;
  mercadoLivreSellerId: number;
  /** CÃ³digo do SKU. Ã‰ a Ãºnica chave para cruzar com os pedidos. */
  code: string;
  /**
   * CMV unitÃ¡rio. `null` Ã© "nÃ£o informado" (`decimal?` no backend) e enviar
   * `null` no PUT limpa o valor. `0` Ã© custo real, nÃ£o ausÃªncia de custo.
   */
  cmv: number | null;
  createdAtUtc: string;
  updatedAtUtc: string | null;
};

/** O import devolve apenas o resumo; a lista sai do `GET /skus`. */
export type SkuImportResult = {
  storeId: string;
  mercadoLivreSellerId: number;
  totalFoundInMercadoLivre: number;
  created: number;
  updated: number;
  skipped: number;
};

export type UpdateSkuCmvRequest = {
  /** `null` limpa o CMV do SKU. */
  cmv: number | null;
};

/* ------------------------------------------------------------------------- *
 * Análise de lucro por anúncio
 * GET /mercado-livre/stores/{id}/analysis/top-products
 *
 * Contrato (fonte da verdade): `profitcore-backend/docs/analysis-top-products.md`
 * — schema 2.0, base de cálculo `eligible_orders`.
 *
 * Três regras valem para toda a seção:
 * 1. Campo ausente vem `null`, nunca omitido.
 * 2. Percentuais já estão em pontos percentuais (`12.34` = 12,34%).
 * 3. Lucro e margem são `null` quando falta CMV — no produto, quando aquele
 *    produto não tem CMV; no resumo, quando *qualquer* produto elegível está
 *    sem CMV. `null` é "não sei", não zero.
 * ------------------------------------------------------------------------- */

/** Versão do schema que este arquivo acompanha. */
export const ANALYSIS_SCHEMA_VERSION = '2.0';

/**
 * Billing sempre vem decomposto. O custo é `netCost`; `grossMovement` é só
 * volume movimentado e não deve ser somado a custo nenhum.
 */
export type MercadoLivreBillingAmounts = {
  /** Σ lançamentos `CHARGE`. */
  grossCharges: number;
  /** Σ lançamentos `BONUS` (estornos de cobrança), em valor positivo. */
  bonuses: number;
  /** `grossCharges - bonuses`. Pode ser negativo se o bônus superar a cobrança. */
  netCost: number;
  /** `grossCharges + bonuses`. Volume, não custo. */
  grossMovement: number;
};

/** Premissas do cálculo. Lidas pela tela para não afirmar o que o número não diz. */
export type MercadoLivreAnalysisProcessing = {
  calculationBasis: string;
  cancellationsAlreadyProcessed: boolean;
  /** `false`: reembolsos são informativos, ainda não descontados da receita. */
  refundsAlreadyProcessed: boolean;
  /** `false`: billing não entra na contribuição (duplicaria `sale_fee`). */
  billingUsedInContribution: boolean;
  personalBuyerDataRemoved: boolean;
};

export type MercadoLivreAnalysisStopReason =
  | 'reached_total'
  | 'empty_page'
  | 'page_error'
  | 'safety_cap';

export type MercadoLivreAnalysisPagination = {
  /** `null` quando o Mercado Livre não informou `paging.total`. */
  pagingTotal: number | null;
  stopReason: MercadoLivreAnalysisStopReason | string;
  pagingLimit: number;
  offsetsFetched: number[];
  pagesFetched: number;
  recordsReceivedCount: number;
  uniqueOrderIdsCount: number;
  duplicateOrderIdsCount: number;
  /** `false` = faltaram pedidos. O período está subcontado. */
  paginationComplete: boolean;
  paginationErrors: string[];
};

export type MercadoLivreAnalysisSourceCounts = {
  ordersFetchedCount: number;
  ordersEligibleCount: number;
  ordersExcludedCount: number;
  unitsFetchedCount: number;
  unitsEligibleCount: number;
  unitsExcludedCount: number;
  productsFetchedCount: number;
  productsEligibleCount: number;
  productsOnlyExcludedCount: number;
};

/** KPIs do período. Considera somente pedidos elegíveis. */
export type MercadoLivreAnalysisSummary = {
  ordersCount: number;
  ordersPaidCount: number;
  ordersShippedCount: number;
  totalUnitsSold: number;

  /** Produtos elegíveis no período, antes do corte de `maxProducts`. */
  distinctProductsCount: number;
  productsWithCmvCount: number;
  productsWithoutCmvCount: number;

  /** Σ `unitPrice × quantity`. */
  grossRevenue: number;
  /**
   * Parte do desconto bancada pelo vendedor. Informativo: o `unitPrice` já é o
   * preço final, então não é subtraído outra vez.
   */
  sellerDiscounts: number;
  /**
   * Frete pago pelo comprador. **Não é receita do vendedor** — o Mercado Livre
   * cobra o valor de volta na tarifa de envio do billing.
   */
  buyerPaidShipping: number;
  /** Informativo enquanto `processing.refundsAlreadyProcessed` é `false`. */
  refundsAmount: number;

  /** `= grossRevenue`. É a base de receita de todas as margens. */
  eligibleRevenue: number;
  /** Σ `saleFee × quantity`. */
  totalSaleFees: number;
  /** `eligibleRevenue - totalSaleFees`. */
  netRevenue: number;

  /** Custo de frete do vendedor (`senders[].cost`) rateado aos elegíveis. */
  totalShippingCost: number;
  /** Parcela de `totalShippingCost` que veio de `/shipments/{id}/costs`. */
  totalShippingCostFromApi: number;
  shipmentsResolvedCount: number;
  /** Remessas sem custo resolvido. Entraram como zero: frete pendente não é frete grátis. */
  shipmentsMissingCount: number;

  totalBillingGrossCharges: number;
  totalBillingBonuses: number;
  /** Custo líquido de billing. Fora de custos/lucro por decisão de negócio. */
  totalBillingNetCost: number;
  /** Movimentação de billing. Não é custo. */
  totalBillingGrossMovement: number;
  billingRecordsConsumed: number;
  billingOrdersMatched: number;

  /**
   * `netRevenue - totalShippingCost`. Não depende de CMV, então está **sempre**
   * preenchido — é o número honesto para mostrar quando falta custo informado.
   */
  contributionBeforeCogs: number;
  contributionBeforeCogsPercent: number;

  /** Σ CMV dos produtos com custo informado. Parcial se `productsWithoutCmvCount > 0`. */
  totalCogs: number;

  /** `totalSaleFees + totalShippingCost + totalCogs`. `null` sem CMV completo. */
  totalAllCosts: number | null;
  /** `netRevenue - totalCogs`. `null` sem CMV completo. */
  grossProfit: number | null;
  grossMarginPercent: number | null;
  /** `eligibleRevenue - totalAllCosts` (contribuição). `null` sem CMV completo. */
  netProfit: number | null;
  netMarginPercent: number | null;

  /** `null` quando o período mistura moedas (ver `dataQuality`). */
  currencyId: string | null;
};

export type MercadoLivreProductPerformance = {
  /** Id do anúncio (`MLB…`). Chave de agregação e vínculo com `Sku.code`. */
  itemFullId: string;
  itemId: number | null;
  /** Só preenchido quando todas as linhas do produto trazem o mesmo valor. */
  sellerSku: string | null;
  userProductId: string | null;
  variationId: number | null;
  variationName: string | null;

  title: string;
  pictureUrl: string | null;
  unitPriceAverage: number | null;
  quantitySold: number;
  ordersCount: number;

  grossRevenue: number;
  /** Informativo, como no resumo. */
  sellerDiscounts: number;
  refundsAmount: number;
  eligibleRevenue: number;
  totalSaleFees: number;
  netRevenue: number;

  proportionalShippingCost: number;

  proportionalBillingGrossCharges: number;
  proportionalBillingBonuses: number;
  /** Informativo: não entra em `totalCosts` nem em `netProfit`. */
  proportionalBillingNetCost: number;

  /** `netRevenue - proportionalShippingCost`. Sempre preenchido. */
  contributionBeforeCogs: number;
  contributionBeforeCogsPercent: number;

  /** `null` = SKU sem CMV informado. Zero é custo real. */
  cmvUnit: number | null;
  /** `null` sempre que `cmvUnit` é `null`. */
  totalCogs: number | null;
  /** `totalSaleFees + frete + totalCogs`. `null` sem CMV. */
  totalCosts: number | null;

  grossProfit: number | null;
  grossMarginPercent: number | null;
  /** `eligibleRevenue - totalCosts`. Métrica comparável com o resumo. `null` sem CMV. */
  netProfit: number | null;
  netMarginPercent: number | null;

  firstSaleAtUtc: string | null;
  lastSaleAtUtc: string | null;

  /** Só vem com `includeRawInputs=true`, que a aplicação não usa. */
  rawInputs?: unknown;
};

/** Revisão automática de cancelamento depois da entrega. */
export type MercadoLivrePostDeliveryReviewStatus =
  /** Cancelado após a entrega e sem devolução registrada: possível perda. */
  | 'review_required'
  /** Cancelado após a entrega, mas o produto voltou. */
  | 'returned_to_seller'
  | 'not_applicable';

export type MercadoLivreExcludedOrdersSummary = {
  ordersCount: number;
  unitsCount: number;
  grossRevenue: number;
  totalSaleFees: number;
  totalShippingCostFromApi: number;
  totalBillingGrossCharges: number;
  totalBillingBonuses: number;
  totalBillingNetCost: number;
  postDeliveryCancellationsCount: number;
  /** Chaveado por `MercadoLivrePostDeliveryReviewStatus`. */
  postDeliveryReviewByStatus: Record<string, number>;
  /** Pedidos por motivo de exclusão (`cancelled`, `not_paid`, `charged_back`…). */
  byReason: Record<string, number>;
};

export type MercadoLivreBillingAuditStatus =
  | 'complete'
  | 'partial'
  | 'failed'
  | 'no_orders';

export type MercadoLivreBillingAudit = {
  found: MercadoLivreBillingAmounts;
  orderIdsQueriedCount: number;
  ordersServedFromCache: number;
  requestsMade: number;
  requestsFailed: number;
  requestsSkippedByRateLimit: number;
  recordsConsumedCount: number;
  ordersMatchedCount: number;
  /** Pedidos pagos sem nenhum lançamento nos períodos consultados. */
  ordersWithoutBillingCount: number;
  ordersWithoutBillingIds: number[];
  /** Elegíveis com billing mas sem a tarifa de venda (`CV*`). */
  eligibleOrdersWithoutSaleFeeCount: number;
  eligibleOrdersWithoutSaleFeeIds: number[];
  distributedToEligibleOrders: MercadoLivreBillingAmounts;
  distributedToExcludedOrders: MercadoLivreBillingAmounts;
  distributedTotal: MercadoLivreBillingAmounts;
  /** `found - distributedTotal`. */
  notDistributed: MercadoLivreBillingAmounts;
  /** Sempre `false` hoje: billing duplicaria `sale_fee`. */
  usedInContribution: boolean;
  /** Estado da consulta, independente de `usedInContribution`. */
  status: MercadoLivreBillingAuditStatus | string;
  periodsQueried: string[];
  periodsFailed: string[];
};

export type MercadoLivrePostSaleAuditStatus =
  | 'complete'
  | 'partial'
  | 'skipped'
  | 'no_orders';

export type MercadoLivrePostSaleAudit = {
  status: MercadoLivrePostSaleAuditStatus | string;
  ordersClaimsQueried: number;
  ordersClaimsSkippedByCap: number;
  claimsFound: number;
  returnsFound: number;
  changesFound: number;
  paymentsQueried: number;
  refundsFound: number;
  ordersDiscountsQueried: number;
  callsMade: number;
  callsFailed: number;
  errorsSample: string[];
};

export type MercadoLivreReconciliationTotals = {
  ordersCount: number;
  unitsCount: number;
  grossRevenue: number;
  eligibleRevenue: number;
  totalSaleFees: number;
  totalShippingCost: number;
  totalBillingGrossCharges: number;
  totalBillingBonuses: number;
  totalBillingNetCost: number;
};

export type MercadoLivreAnalysisReconciliation = {
  sourceRawTotals: MercadoLivreReconciliationTotals;
  eligibleTotals: MercadoLivreReconciliationTotals;
  excludedTotals: MercadoLivreReconciliationTotals;
  /** `0` = reconciliado. Chaves `rawVsSplit.*`, `summaryVsOrders.*`, `summaryVsProducts.*`. */
  aggregationDifferences: Record<string, number>;
  /** `0.00`: o rateio distribui centavos, então tudo fecha ao centavo. */
  monetaryTolerance: number;
  /** Só com `externalGrossRevenue` na query; senão `null`. */
  externalControlDifference: number | null;
  status: 'reconciled' | 'divergent' | string;
};

export type MercadoLivreDataQualityIssue = {
  code: string;
  message: string;
  count: number;
  /** Amostra (até 50) dos pedidos afetados. */
  sampleOrderIds: number[];
};

export type MercadoLivreDataQualityLevel = 'complete' | 'partial' | 'incomplete';

export type MercadoLivreAnalysisDataQuality = {
  level: MercadoLivreDataQualityLevel | string;
  warnings: MercadoLivreDataQualityIssue[];
  /** Campos do contrato ainda não integrados: voltam sempre `null`. */
  missingFields: string[];
  inconsistencies: MercadoLivreDataQualityIssue[];
};

/**
 * Resultado consolidado de lucro por anúncio.
 *
 * O backend cruza os pedidos do período com o CMV informado em `/skus` (match
 * por `Sku.code == itemFullId`, case-insensitive) e rateia frete e billing por
 * linha de item, distribuindo centavos pelo maior resto.
 *
 * É uma consulta caríssima: pagina todos os pedidos, chama o Mercado Livre uma
 * vez por remessa, uma por mês de billing e — com `includePostSale` — uma série
 * de chamadas de pós-venda. Dispare por ação explícita ou em carga de tela
 * única, nunca em polling.
 */
export type MercadoLivreTopProductsAnalysisResponse = {
  /** `2.0` hoje. Mudança de major significa releitura do contrato. */
  schemaVersion: string;
  storeId: string;
  mercadoLivreSellerId: number;
  generatedAtUtc: string;
  fromUtc: string;
  toUtc: string;
  /** Fuso usado para interpretar `startDate`/`endDate`. As datas vêm em UTC. */
  timezone: string;
  /** Tamanho da janela em dias, conforme resolvido pelo backend. */
  days: number;
  calculationBasis: string;

  processing: MercadoLivreAnalysisProcessing;
  pagination: MercadoLivreAnalysisPagination;
  sourceCounts: MercadoLivreAnalysisSourceCounts;
  summary: MercadoLivreAnalysisSummary;

  /** Ordenado por receita bruta desc, cortado em `maxProducts`. */
  topProducts: MercadoLivreProductPerformance[];

  excludedOrdersSummary: MercadoLivreExcludedOrdersSummary;
  /** Só com `includeRawInputs=true`; senão `null`. */
  excludedOrders?: unknown[] | null;

  billingAudit: MercadoLivreBillingAudit;
  postSaleAudit: MercadoLivrePostSaleAudit;
  reconciliation: MercadoLivreAnalysisReconciliation;
  dataQuality: MercadoLivreAnalysisDataQuality;
};
