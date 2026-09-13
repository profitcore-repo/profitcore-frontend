import { useEffect, useMemo, useState } from 'react';
import {
  aggregateOrderItems,
  type OrderItemAggregate,
} from '@/features/skus/skuSales';
import { useSkuCosts } from '@/hooks/useSkuCosts';
import { api } from '@/services/api';
import type { MercadoLivreOrder } from '@/types/api';

/** Janela usada para descobrir quais produtos pesam mais nas vendas. */
const RANKING_RANGE = 'Last30Days' as const;

export type UseSkuSalesResult = {
  /** Vendas por `code` do SKU. Vazio quando não há pedidos ou a consulta falha. */
  salesIndex: Map<string, OrderItemAggregate>;
  isLoading: boolean;
};

/**
 * Vendas recentes por SKU, para ranquear e dar contexto de preço.
 *
 * É informação complementar, não requisito: se a consulta de pedidos falhar, as
 * telas continuam funcionando sem o ranking. Por isso o erro não é propagado.
 */
export function useSkuSales(): UseSkuSalesResult {
  const { storeId } = useSkuCosts();
  const [orders, setOrders] = useState<MercadoLivreOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!storeId) {
      setOrders([]);
      return;
    }
    let cancelled = false;
    setIsLoading(true);

    void (async () => {
      try {
        const result = await api.listMercadoLivreOrders({
          storeId,
          dateRange: RANKING_RANGE,
        });
        if (!cancelled) setOrders(result.orders);
      } catch {
        if (!cancelled) setOrders([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [storeId]);

  const salesIndex = useMemo(() => aggregateOrderItems(orders), [orders]);

  return { salesIndex, isLoading };
}
