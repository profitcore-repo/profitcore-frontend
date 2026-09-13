import { CMV_REQUIRED_SKUS } from '@/features/skus/cmv';
import { countInformedCmv } from '@/features/skus/skuSales';
import type { SkuResponse } from '@/types/api';

export type OnboardingStep = 'connect' | 'cmv';

export const ONBOARDING_STEP_PATHS: Record<OnboardingStep, string> = {
  connect: '/onboarding/connect',
  cmv: '/onboarding/cmv',
};

/** Ordem dos passos, usada para exibir "passo N de M". */
export const ONBOARDING_STEP_ORDER: readonly OnboardingStep[] = [
  'connect',
  'cmv',
] as const;

export type OnboardingState =
  /** Ainda consultando o backend: nenhum guard pode decidir rota. */
  | { status: 'resolving' }
  /** Não deu para verificar. Não redirecionamos no escuro. */
  | { status: 'failed'; message: string }
  | { status: 'pending'; step: OnboardingStep }
  | { status: 'ready' };

export type OnboardingInput = {
  connection: {
    isResolving: boolean;
    error: string | null;
    hasConnection: boolean;
  };
  skuCosts: {
    isResolving: boolean;
    error: string | null;
    skus: SkuResponse[] | null;
  };
};

/**
 * Quantos CMVs o passo exige. Um catálogo menor que o alvo não pode travar o
 * seller, e catálogo vazio (nada importado ainda) não exige nada.
 */
export function requiredCostCount(skus: readonly SkuResponse[]): number {
  return Math.min(CMV_REQUIRED_SKUS, skus.length);
}

/**
 * Decide em que ponto da primeira configuração o usuário está.
 *
 * Função pura: os dois guards de rota chamam esta mesma decisão, então não
 * existe caminho em que a aplicação e o onboarding discordem entre si.
 */
export function resolveOnboardingState({
  connection,
  skuCosts,
}: OnboardingInput): OnboardingState {
  if (connection.isResolving) return { status: 'resolving' };
  if (connection.error) return { status: 'failed', message: connection.error };
  if (!connection.hasConnection) return { status: 'pending', step: 'connect' };

  if (skuCosts.isResolving) return { status: 'resolving' };
  if (skuCosts.error) return { status: 'failed', message: skuCosts.error };
  // Sem resposta do catálogo ainda: tratamos como indefinido, não como vazio.
  if (skuCosts.skus === null) return { status: 'resolving' };

  const required = requiredCostCount(skuCosts.skus);
  if (required === 0) return { status: 'ready' };

  return countInformedCmv(skuCosts.skus) >= required
    ? { status: 'ready' }
    : { status: 'pending', step: 'cmv' };
}
