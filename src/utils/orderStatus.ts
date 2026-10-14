import type {
  MercadoLivreOrder,
  MercadoLivreOrderStatus,
} from '@/types/api';

/**
 * Nomes do enum `MercadoLivreOrderStatus` do backend, **na ordem declarada**.
 *
 * O backend não registra `JsonStringEnumConverter`, então o campo `status`
 * chega como o índice do enum. Comparar `order.status === 'Cancelled'` nunca
 * casa — e, pior, erra calado: o pedido cancelado passa a contar como venda.
 *
 * A ordem é a de `Models/MercadoLivre/MercadoLivreOrderDtos.cs` e é a única
 * coisa que precisa mudar se o enum do backend mudar.
 */
const STATUS_BY_CODE: readonly MercadoLivreOrderStatus[] = [
  'PaymentRequired',
  'ToBeConfirmed',
  'ReadyToShip',
  'Shipped',
  'PaymentInProcess',
  'Delivered',
  'Cancelled',
  'NotRated',
  'Rated',
  'Invalid',
];

/** Status cru do Mercado Livre → nome do enum, para quando só há `statusRaw`. */
const STATUS_BY_RAW: Record<string, MercadoLivreOrderStatus> = {
  payment_required: 'PaymentRequired',
  payment_in_process: 'PaymentInProcess',
  to_be_confirmed: 'ToBeConfirmed',
  ready_to_ship: 'ReadyToShip',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  not_rated: 'NotRated',
  rated: 'Rated',
  invalid: 'Invalid',
};

/**
 * Status do pedido como nome, aceitando as três formas em que ele pode chegar:
 * índice do enum (o que o backend manda hoje), nome (se o conversor for
 * registrado) ou `statusRaw`.
 *
 * `null` quando nada disso identifica o status — a tela decide o que dizer, em
 * vez de receber um `Invalid` que o backend não afirmou.
 */
export function resolveOrderStatus(
  order: Pick<MercadoLivreOrder, 'status' | 'statusRaw'>,
): MercadoLivreOrderStatus | null {
  const { status } = order;

  if (typeof status === 'number') {
    return STATUS_BY_CODE[status] ?? null;
  }

  if (typeof status === 'string' && status) {
    if ((STATUS_BY_CODE as readonly string[]).includes(status)) {
      return status as MercadoLivreOrderStatus;
    }
    const byRaw = STATUS_BY_RAW[status.toLowerCase()];
    if (byRaw) return byRaw;
  }

  const raw = (order.statusRaw ?? '').toLowerCase();
  return STATUS_BY_RAW[raw] ?? null;
}

/** Cancelado ou inválido: não é receita realizada. */
export function isDiscardedOrder(
  order: Pick<MercadoLivreOrder, 'status' | 'statusRaw'>,
): boolean {
  const status = resolveOrderStatus(order);
  return status === 'Cancelled' || status === 'Invalid';
}
