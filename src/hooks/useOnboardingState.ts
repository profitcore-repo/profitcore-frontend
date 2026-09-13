import { useCallback, useMemo } from 'react';
import {
  resolveOnboardingState,
  type OnboardingState,
} from '@/features/onboarding/onboardingSteps';
import { useConnections } from '@/hooks/useConnections';
import { useSkuCosts } from '@/hooks/useSkuCosts';

export type UseOnboardingStateResult = {
  state: OnboardingState;
  /** Refaz as consultas que alimentam a decisão, para a tela de falha. */
  retry: () => Promise<void>;
  isRetrying: boolean;
};

/**
 * Compõe conexão + catálogo de SKUs na decisão de onboarding. A regra em si
 * fica em `resolveOnboardingState`, que é pura e independe de React.
 */
export function useOnboardingState(): UseOnboardingStateResult {
  const connection = useConnections();
  const skuCosts = useSkuCosts();

  const state = useMemo(
    () =>
      resolveOnboardingState({
        connection: {
          isResolving: connection.isResolving,
          error: connection.error,
          hasConnection: connection.hasConnection,
        },
        skuCosts: {
          isResolving: skuCosts.isResolving,
          error: skuCosts.error,
          skus: skuCosts.skus,
        },
      }),
    [
      connection.isResolving,
      connection.error,
      connection.hasConnection,
      skuCosts.isResolving,
      skuCosts.error,
      skuCosts.skus,
    ],
  );

  const retry = useCallback(async () => {
    // A conexão vem primeiro: sem loja, o catálogo nem é consultado.
    await connection.refresh();
    await skuCosts.refresh();
  }, [connection, skuCosts]);

  return {
    state,
    retry,
    isRetrying: connection.isLoading || skuCosts.isLoading,
  };
}
