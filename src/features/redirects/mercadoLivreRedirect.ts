import {
  consumeMercadoLivreReturnTo,
  finishMercadoLivreOAuth,
} from '@/features/connections/mercadoLivreOAuth';
import type { RedirectHandler } from '@/features/redirects/types';

/** Destino quando o fluxo não guardou de onde partiu. */
const DEFAULT_REDIRECT_TO = '/dashboard';

export const mercadoLivreRedirectHandler: RedirectHandler = {
  id: 'mercado-livre',
  label: 'Mercado Livre',

  // OAuth 2.0 padrão: sucesso traz `code`, recusa traz `error`.
  matches: (params) => params.has('code') || params.has('error'),

  async handle(params, { refreshConnections }) {
    const denied = params.get('error');
    if (denied) {
      return {
        outcome: 'denied',
        message:
          params.get('error_description') ||
          `Autorização negada no Mercado Livre (${denied}).`,
      };
    }

    const authorizationCode = params.get('code');
    if (!authorizationCode) {
      return {
        outcome: 'failed',
        message: 'O Mercado Livre não devolveu o código de autorização.',
      };
    }

    try {
      await finishMercadoLivreOAuth(authorizationCode);
      // Só navega depois de atualizar as conexões: os guards leem esse estado.
      await refreshConnections();
      return {
        outcome: 'success',
        redirectTo: consumeMercadoLivreReturnTo() ?? DEFAULT_REDIRECT_TO,
      };
    } catch (err) {
      return {
        outcome: 'failed',
        message:
          err instanceof Error
            ? `Falha ao conectar: ${err.message}`
            : 'Falha ao conectar a conta do Mercado Livre.',
      };
    }
  },
};
