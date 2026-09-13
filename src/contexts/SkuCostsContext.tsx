import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api } from '@/services/api';
import { useConnections } from '@/hooks/useConnections';
import type { SkuImportResult, SkuResponse } from '@/types/api';

export type SkuCostsContextValue = {
  /** `null` = ainda não sabemos (carregando, sem loja, ou falhou). */
  skus: SkuResponse[] | null;
  /** GUID da loja, exigido pelo import. `null` enquanto não há conexão. */
  storeId: string | null;
  isResolving: boolean;
  isLoading: boolean;
  isImporting: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  /**
   * Importa os SKUs no Mercado Livre e recarrega a lista. Só por ação do
   * usuário: é escrita e bate na API do ML.
   */
  importSkus: () => Promise<SkuImportResult | null>;
  /** `cmv: null` limpa o valor, marcando o SKU como não informado. */
  saveCmv: (skuId: string, cmv: number | null) => Promise<SkuResponse>;
};

export const SkuCostsContext = createContext<SkuCostsContextValue | undefined>(
  undefined,
);

type SkuCostsProviderProps = {
  children: ReactNode;
};

/**
 * Fonte única dos SKUs e do CMV informado. Os guards de onboarding leem daqui,
 * então salvar um CMV reflete na navegação sem recarregar a página.
 */
export function SkuCostsProvider({ children }: SkuCostsProviderProps) {
  const { stores, hasConnection } = useConnections();
  // O onboarding trabalha com uma loja só; a primeira é a conectada.
  const store = hasConnection && stores && stores.length > 0 ? stores[0] : null;
  const storeId = store?.id ?? null;
  // A listagem é filtrada pelo seller do ML, não pelo GUID da loja.
  const sellerId = store?.mercadoLivreSellerId ?? null;

  const [skus, setSkus] = useState<SkuResponse[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (sellerId === null) return;
    setIsLoading(true);
    setError(null);
    try {
      setSkus(await api.listSkus(sellerId));
    } catch (err) {
      // Mantém `null`: sem resposta não afirmamos que o catálogo está vazio.
      setSkus(null);
      setError(err instanceof Error ? err.message : 'Falha ao carregar seus SKUs.');
    } finally {
      setIsLoading(false);
    }
  }, [sellerId]);

  const importSkus = useCallback(async () => {
    if (!storeId) return null;
    setIsImporting(true);
    setError(null);
    try {
      // `saveOnlyNew` fica no default do backend (`true`): reimportar nunca
      // sobrescreve o CMV que o seller já informou.
      const result = await api.importMercadoLivreSkus(storeId);
      // O import devolve só contadores, então a lista precisa ser relida.
      await refresh();
      return result;
    } catch (err) {
      setError(
        err instanceof Error
          ? `Falha ao importar seus SKUs: ${err.message}`
          : 'Falha ao importar seus SKUs do Mercado Livre.',
      );
      return null;
    } finally {
      setIsImporting(false);
    }
  }, [storeId, refresh]);

  const saveCmv = useCallback(async (skuId: string, cmv: number | null) => {
    const updated = await api.updateSkuCmv(skuId, { cmv });
    setSkus((prev) =>
      prev ? prev.map((sku) => (sku.id === updated.id ? updated : sku)) : prev,
    );
    return updated;
  }, []);

  useEffect(() => {
    if (sellerId === null) {
      setSkus(null);
      setError(null);
      return;
    }
    void refresh();
  }, [sellerId, refresh]);

  const value = useMemo<SkuCostsContextValue>(
    () => ({
      skus,
      storeId,
      isResolving: sellerId !== null && skus === null && error === null,
      isLoading,
      isImporting,
      error,
      refresh,
      importSkus,
      saveCmv,
    }),
    [skus, storeId, sellerId, isLoading, isImporting, error, refresh, importSkus, saveCmv],
  );

  return (
    <SkuCostsContext.Provider value={value}>{children}</SkuCostsContext.Provider>
  );
}
