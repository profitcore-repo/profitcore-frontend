import { useEffect, useState } from 'react';

export type LoadingPhase =
  /** Não está carregando. */
  | 'idle'
  /** Começou agora: vale desenhar a forma da tela que vai chegar. */
  | 'skeleton'
  /** Está demorando: a espera precisa ser explicada, não fingida. */
  | 'extended';

/** Quando a espera deixa de ser "quase lá" e passa a ser "vai demorar". */
const DEFAULT_EXTENDED_AFTER_MS = 4000;

/**
 * Em que fase da espera a tela está.
 *
 * Skeleton é uma promessa de conteúdo imediato: funciona no primeiro instante e
 * se volta contra a tela quando a resposta demora — parado por muito tempo, ele
 * passa a parecer conexão ruim ou tela quebrada. Depois do limite, a espera
 * merece um indicador de processo em andamento e uma explicação do motivo.
 *
 * O relógio reinicia a cada novo carregamento, então um refresh rápido depois
 * de uma apuração longa volta a mostrar skeleton.
 */
export function useLoadingPhase(
  isLoading: boolean,
  extendedAfterMs: number = DEFAULT_EXTENDED_AFTER_MS,
): LoadingPhase {
  const [isExtended, setIsExtended] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setIsExtended(false);
      return;
    }
    setIsExtended(false);
    const timer = window.setTimeout(() => setIsExtended(true), extendedAfterMs);
    return () => window.clearTimeout(timer);
  }, [isLoading, extendedAfterMs]);

  if (!isLoading) return 'idle';
  return isExtended ? 'extended' : 'skeleton';
}
