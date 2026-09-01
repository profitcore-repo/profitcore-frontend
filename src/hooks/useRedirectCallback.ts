import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { resolveRedirectHandler } from '@/features/redirects/registry';
import type { RedirectHandler, RedirectHandlerResult } from '@/features/redirects/types';
import { useConnections } from '@/hooks/useConnections';

export type RedirectCallbackState =
  | { status: 'processing'; handler: RedirectHandler }
  | { status: 'done'; handler: RedirectHandler; redirectTo: string }
  | { status: 'denied'; handler: RedirectHandler; message: string }
  | { status: 'failed'; handler: RedirectHandler; message: string }
  | { status: 'unknown'; reason: string };

/**
 * Orquestra um retorno de integração: identifica o handler, executa uma única
 * vez por URL e expõe o desfecho. Não navega — quem consome decide como reagir.
 */
export function useRedirectCallback(): RedirectCallbackState {
  const { provider } = useParams<{ provider?: string }>();
  const { search } = useLocation();
  const { refresh } = useConnections();

  const resolution = useMemo(
    () => resolveRedirectHandler(provider, new URLSearchParams(search)),
    [provider, search],
  );
  const [result, setResult] = useState<RedirectHandlerResult | null>(null);

  /**
   * Um authorization code é de uso único, então o handler roda uma vez por URL.
   * A chave é a própria URL: se ela mudar, o retorno é outro.
   *
   * Note que não existe flag de cancelamento aqui. O StrictMode executa
   * efeito -> cleanup -> efeito: cancelar a primeira execução deixaria a
   * segunda bloqueada por este ref e o desfecho nunca chegaria.
   */
  const handledUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (resolution.kind !== 'resolved') return;

    const url = `${provider ?? ''}${search}`;
    if (handledUrlRef.current === url) return;
    handledUrlRef.current = url;

    void resolution.handler
      .handle(new URLSearchParams(search), { refreshConnections: refresh })
      .then(setResult)
      // Handler é ponto de extensão: uma exceção não tratada não pode
      // deixar a tela presa no estado de processamento.
      .catch((err: unknown) => {
        setResult({
          outcome: 'failed',
          message:
            err instanceof Error
              ? err.message
              : `Falha inesperada ao processar o retorno de ${resolution.handler.label}.`,
        });
      });
  }, [resolution, provider, search, refresh]);

  if (resolution.kind === 'unknown') {
    return { status: 'unknown', reason: resolution.reason };
  }

  const { handler } = resolution;
  if (!result) return { status: 'processing', handler };
  if (result.outcome === 'success') {
    return { status: 'done', handler, redirectTo: result.redirectTo };
  }
  return { status: result.outcome, handler, message: result.message };
}
