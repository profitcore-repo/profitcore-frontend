import { useRef } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { FullScreenLoader } from '@/components/feedback/FullScreenLoader';
import { OnboardingCheckFailed } from '@/features/onboarding/OnboardingCheckFailed';
import { ONBOARDING_STEP_PATHS } from '@/features/onboarding/onboardingSteps';
import { useOnboardingState } from '@/hooks/useOnboardingState';

/**
 * Trava as telas da aplicação até a primeira configuração terminar. Vale para
 * navegação interna e para URL digitada.
 */
export function AppOnboardingGuard() {
  const { state, retry, isRetrying } = useOnboardingState();

  switch (state.status) {
    case 'resolving':
      return <FullScreenLoader label="Verificando sua configuração" />;
    case 'failed':
      return (
        <OnboardingCheckFailed
          message={state.message}
          onRetry={() => void retry()}
          isRetrying={isRetrying}
        />
      );
    case 'pending':
      return <Navigate to={ONBOARDING_STEP_PATHS[state.step]} replace />;
    case 'ready':
      return <Outlet />;
  }
}

/**
 * Espelho do guard acima: mantém o usuário no passo pendente e impede voltar ao
 * onboarding depois de concluído.
 */
export function OnboardingStepGuard() {
  const { state, retry, isRetrying } = useOnboardingState();
  const location = useLocation();

  /**
   * Último passo em que o usuário esteve pendente.
   *
   * O estado do onboarding é derivado da API, então ele vira `ready` no
   * instante em que o último dado é salvo. Sem esta memória, o usuário seria
   * arrancado da tela antes de ver a confirmação — e antes de ler eventuais
   * avisos sobre o que acabou de informar. Quem concluiu segue na página até
   * clicar para avançar; quem chega depois é redirecionado.
   */
  const completedStepPathRef = useRef<string | null>(null);
  if (state.status === 'pending') {
    completedStepPathRef.current = ONBOARDING_STEP_PATHS[state.step];
  }

  switch (state.status) {
    case 'resolving':
      return <FullScreenLoader label="Verificando sua configuração" />;
    case 'failed':
      return (
        <OnboardingCheckFailed
          message={state.message}
          onRetry={() => void retry()}
          isRetrying={isRetrying}
        />
      );
    case 'ready':
      return location.pathname === completedStepPathRef.current ? (
        <Outlet />
      ) : (
        <Navigate to="/dashboard" replace />
      );
    case 'pending': {
      const expected = ONBOARDING_STEP_PATHS[state.step];
      // Pular etapa pela URL devolve o usuário ao passo que falta.
      return location.pathname === expected ? (
        <Outlet />
      ) : (
        <Navigate to={expected} replace />
      );
    }
  }
}
