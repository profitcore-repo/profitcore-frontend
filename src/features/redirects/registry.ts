import { mercadoLivreRedirectHandler } from '@/features/redirects/mercadoLivreRedirect';
import type { RedirectHandler, RedirectResolution } from '@/features/redirects/types';

/** Ponto único de extensão: nova integração entra aqui e mais nada muda. */
const HANDLERS: readonly RedirectHandler[] = [mercadoLivreRedirectHandler];

/**
 * Descobre quem respondeu o retorno.
 *
 * `/redirects/<id>` é a forma explícita e preferida. `/redirects` puro só
 * funciona enquanto exatamente uma integração reconhecer os parâmetros — com
 * duas ou mais, o retorno é tratado como não identificado em vez de adivinhado.
 */
export function resolveRedirectHandler(
  providerId: string | undefined,
  params: URLSearchParams,
): RedirectResolution {
  if (providerId) {
    const handler = HANDLERS.find((candidate) => candidate.id === providerId);
    return handler
      ? { kind: 'resolved', handler }
      : {
          kind: 'unknown',
          reason: `Não existe integração registrada como "${providerId}".`,
        };
  }

  const matches = HANDLERS.filter((candidate) => candidate.matches(params));

  if (matches.length === 1) {
    return { kind: 'resolved', handler: matches[0] };
  }
  if (matches.length === 0) {
    return {
      kind: 'unknown',
      reason: 'Não foi possível identificar de qual integração veio este retorno.',
    };
  }
  return {
    kind: 'unknown',
    reason:
      'Mais de uma integração reconhece este retorno. O provedor precisa devolver em /redirects/<integração>.',
  };
}
