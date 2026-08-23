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
