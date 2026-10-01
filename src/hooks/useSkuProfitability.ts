import { useCallback, useEffect, useState } from 'react';
import { api } from '@/services/api';
import { useConnections } from '@/hooks/useConnections';
import type { MercadoLivreTopProductsAnalysisResponse } from '@/types/api';

/** Janelas oferecidas na tela. O backend aceita qualquer inteiro positivo. */
export const PROFITABILITY_RANGES = [
  { days: 7, label: '7 dias' },
  { days: 30, label: '30 dias' },
  { days: 90, label: '90 dias' },
] as const;

export type ProfitabilityRangeDays =
  (typeof PROFITABILITY_RANGES)[number]['days'];

const DEFAULT_RANGE: ProfitabilityRangeDays = 30;

export type UseSkuProfitabilityResult = {
  /** `null` = ainda não sabemos (carregando, sem loja, ou falhou). */
  analysis: MercadoLivreTopProductsAnalysisResponse | null;
  days: ProfitabilityRangeDays;
  setDays: (days: ProfitabilityRangeDays) => void;
  /** Primeira resolução, antes de haver qualquer resposta ou erro. */
  isResolving: boolean;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

/**
 * Resultado de lucro por SKU no período escolhido.
 *
 * Diferente de `useSkuSales`, o erro é propagado: esta é a informação principal
 * da tela, não um enriquecimento. Exibir a tabela vazia depois de uma falha
 * afirmaria que o seller não vendeu nada.
 *
 * A consulta é pesada no backend, então roda apenas ao trocar de loja ou de
 * período — nunca em intervalo.
 */
export function useSkuProfitability(): UseSkuProfitabilityResult {
  const { stores, hasConnection } = useConnections();
  // O onboarding trabalha com uma loja só; a primeira é a conectada.
  const storeId =
    hasConnection && stores && stores.length > 0 ? stores[0].id : null;

  const [days, setDays] = useState<ProfitabilityRangeDays>(DEFAULT_RANGE);
  const [analysis, setAnalysis] =
    useState<MercadoLivreTopProductsAnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (signal?: { cancelled: boolean }) => {
      if (!storeId) return;
      setIsLoading(true);
      setError(null);
      try {
        const result = await api.getSkuProfitability({ storeId, days });
        if (signal?.cancelled) return;
        setAnalysis(result);
      } catch (err) {
        if (signal?.cancelled) return;
        // Mantém `null`: sem resposta não afirmamos que não houve vendas.
        setAnalysis(null);
        setError(
          err instanceof Error
            ? err.message
            : 'Falha ao calcular o resultado dos seus produtos.',
        );
      } finally {
        if (!signal?.cancelled) setIsLoading(false);
      }
    },
    [storeId, days],
  );

  useEffect(() => {
    if (!storeId) {
      setAnalysis(null);
      setError(null);
      return;
    }
    const signal = { cancelled: false };
    void load(signal);
    return () => {
      signal.cancelled = true;
    };
  }, [storeId, load]);

  const refresh = useCallback(() => load(), [load]);

  return {
    analysis,
    days,
    setDays,
    isResolving: storeId !== null && analysis === null && error === null,
    isLoading,
    error,
    refresh,
  };
}
