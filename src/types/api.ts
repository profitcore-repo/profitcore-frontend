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
  paymentMethod: string | null;
  dateApproved: string | null;
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
  saleFee: number;
};

export type MercadoLivreOrder = {
  orderId: number;
  sellerId: number;
  status: MercadoLivreOrderStatus;
  statusRaw: string;
  statusDetail: string | null;
  dateCreated: string;
  dateClosed: string | null;
  lastUpdated: string | null;
  buyer: MercadoLivreOrderBuyer;
  payment: MercadoLivreOrderPayment | null;
  shipping: MercadoLivreOrderShipping | null;
  items: MercadoLivreOrderItem[];
  totalAmount: number;
  totalNetAmount: number;
  totalItemsQuantity: number;
  orderPermalink: string;
};

export type MercadoLivreOrderListResult = {
  orders: MercadoLivreOrder[];
  total: number;
  fromDate: string | null;
  toDate: string | null;
};

export type UserResponse = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  cpfCnpj: string;
  /** Faturamento mensal declarado (R$). `null` = não informado. */
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
   * Omitir ou enviar `null` **não altera** o valor gravado: o backend só grava
   * quando o campo tem valor (`User.Update`). Não existe forma de limpar um
   * faturamento já informado pela API, apenas de sobrescrevê-lo.
   *
   * Negativo é recusado com 400.
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
 * O recurso é `/skus` (não é específico do Mercado Livre) e é escopado pelo
 * usuário do token. Não traz título: o único vínculo com o catálogo do ML é
 * `code`, que guarda o id do anúncio (`MLB…`) — é assim que a importação grava,
 * lendo `/users/{sellerId}/items/search` do Mercado Livre.
 */
export type SkuResponse = {
  id: string;
  userId: string;
  mercadoLivreSellerId: number;
  /** Código do SKU. É a única chave para cruzar com os pedidos. */
  code: string;
  /**
   * CMV unitário. `null` é "não informado" (`decimal?` no backend) e enviar
   * `null` no PUT limpa o valor. `0` é custo real, não ausência de custo.
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

/**
 * Resultado consolidado de lucro por SKU.
 *
 * Vem de `GET /mercado-livre/stores/{id}/analysis/top-products`. O backend cruza
 * os pedidos do período com o CMV informado em `/skus` (match por
 * `Sku.code == itemFullId`, case-insensitive) e rateia frete e taxas de billing
 * por linha de item.
 *
 * É uma consulta caras: pagina todos os pedidos e chama o Mercado Livre uma vez
 * por remessa e uma por mês de billing. Dispare por ação explícita ou em carga
 * de tela única, nunca em polling.
 */
export type MercadoLivreTopProductsAnalysisResponse = {
  storeId: string;
  mercadoLivreSellerId: number;
  /** Tamanho da janela em dias, conforme resolvido pelo backend. */
  days: number;
  fromUtc: string;
  toUtc: string;
  summary: MercadoLivreAnalysisSummary;
  /** Ordenado por receita bruta desc, cortado em `maxProducts`. */
  topProducts: MercadoLivreProductPerformance[];
};

export type MercadoLivreAnalysisSummary = {
  ordersCount: number;
  ordersPaidCount: number;
  ordersShippedCount: number;
  totalUnitsSold: number;
  distinctProductsCount: number;
  productsWithCmvCount: number;
  productsWithoutCmvCount: number;

  grossRevenue: number;
  totalSaleFees: number;
  netRevenue: number;

  /**
   * Não usar: o backend nunca incrementa esse acumulador, então volta sempre 0.
   * O frete real do período está em `totalShippingCostFromApi`.
   */
  totalShippingCost: number;
  /** Frete efetivamente apurado em `/shipments/{id}/costs`. */
  totalShippingCostFromApi: number;
  shipmentsResolvedCount: number;
  /** Remessas que o Mercado Livre não devolveu. Entraram na conta como custo 0. */
  shipmentsMissingCount: number;

  totalBillingCharges: number;
  billingRecordsConsumed: number;
  billingOrdersMatched: number;

  totalCogs: number;
  totalAllCosts: number;

  grossProfit: number;
  /** Já em pontos percentuais: `12.34` é 12,34%. Não multiplicar por 100. */
  grossMarginPercent: number;

  netProfit: number;
  /** Já em pontos percentuais. */
  netMarginPercent: number;
};

export type MercadoLivreProductPerformance = {
  /** Id do anúncio (`MLB…`). É a chave de agregação e o vínculo com `Sku.code`. */
  itemFullId: string;
  itemId: number | null;
  title: string;
  pictureUrl: string | null;
  unitPriceAverage: number | null;
  quantitySold: number;
  ordersCount: number;

  grossRevenue: number;
  totalSaleFees: number;
  /** `grossRevenue - totalSaleFees`. Ainda não desconta frete, billing nem CMV. */
  netRevenue: number;

  proportionalShippingCost: number;
  proportionalBillingCharges: number;

  /** `null` = SKU sem CMV informado. Zero é custo real. */
  cmvUnit: number | null;
  /** `null` sempre que `cmvUnit` é `null`. */
  totalCogs: number | null;
  /** `totalSaleFees + frete + billing + (totalCogs ?? 0)`. */
  totalCosts: number;

  /**
   * `netRevenue - totalCogs`. Quando não há CMV, é igual a `netRevenue` — e a
   * linha não desconta frete nem billing, diferente de `summary.grossProfit`.
   */
  grossProfit: number;
  /** Em pontos percentuais. */
  grossMarginPercent: number;
  /** `grossRevenue - totalCosts`. É a métrica comparável com o summary. */
  netProfit: number;
  /** Em pontos percentuais. */
  netMarginPercent: number;

  lastSaleAtUtc: string | null;
  firstSaleAtUtc: string | null;

  /** Só vem com `includeRawInputs=true`, que a aplicação não usa. */
  rawInputs?: unknown;
};
