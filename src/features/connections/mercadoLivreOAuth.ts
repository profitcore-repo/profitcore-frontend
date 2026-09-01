import { api } from '@/services/api';

/**
 * Caminho que o provedor usa para devolver o usuário à SPA. É uma rota própria
 * (`RedirectsPage`) para que o retorno não dependa de nenhuma tela de negócio.
 */
const REDIRECT_PATH = '/redirects';

/** PKCE code_verifier e destino ficam na sessão da aba: somem ao fechar. */
const CODE_VERIFIER_KEY = 'profitcore.ml.codeVerifier';
const RETURN_TO_KEY = 'profitcore.ml.returnTo';

/**
 * URI registrada no app do Mercado Livre. Derivada do host atual para que
 * homologação, produção e localhost funcionem sem recompilar; `VITE_MERCADO_LIVRE_REDIRECT_URI`
 * cobre os casos em que o host não coincide com o que está registrado no ML
 * (deploy preview, domínio customizado).
 */
export function getMercadoLivreRedirectUri(): string {
  const override = (import.meta.env.VITE_MERCADO_LIVRE_REDIRECT_URI ?? '').trim();
  if (override) return override;
  return new URL(REDIRECT_PATH, window.location.origin).toString();
}

function readSession(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeSession(key: string, value: string): void {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    /* storage indisponível */
  }
}

function clearSession(key: string): void {
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    /* storage indisponível */
  }
}

/** Aceita apenas caminho interno: bloqueia open redirect via storage manipulado. */
function sanitizeReturnTo(value: string | null): string | null {
  if (!value) return null;
  if (!value.startsWith('/') || value.startsWith('//')) return null;
  return value;
}

/**
 * Lê e descarta o destino guardado no início do fluxo. É de uso único para não
 * vazar para um próximo callback.
 */
export function consumeMercadoLivreReturnTo(): string | null {
  const value = sanitizeReturnTo(readSession(RETURN_TO_KEY));
  clearSession(RETURN_TO_KEY);
  return value;
}

type StartOptions = {
  /** Para onde voltar depois de conectar. Default resolvido pelo handler do retorno. */
  returnTo?: string;
};

/**
 * Inicia o OAuth do Mercado Livre. Guarda o PKCE verifier e sai da SPA para o
 * ML — quem chama deve manter o estado de "conectando" até a navegação ocorrer.
 */
export async function startMercadoLivreOAuth({ returnTo }: StartOptions = {}): Promise<void> {
  const redirectUri = getMercadoLivreRedirectUri();
  const { authorizeUrl, codeVerifier } = await api.startMercadoLivreAuthorization(
    redirectUri,
  );
  if (!authorizeUrl) {
    throw new Error('O servidor não retornou a URL de autorização.');
  }

  writeSession(CODE_VERIFIER_KEY, codeVerifier);
  if (returnTo) writeSession(RETURN_TO_KEY, returnTo);

  window.location.assign(authorizeUrl);
}

/** Troca o authorization code pelos tokens e cadastra/atualiza a loja. */
export async function finishMercadoLivreOAuth(authorizationCode: string): Promise<void> {
  await api.connectMercadoLivreStore({
    authorizationCode,
    codeVerifier: readSession(CODE_VERIFIER_KEY) ?? undefined,
    redirectUriOverride: getMercadoLivreRedirectUri(),
  });
  clearSession(CODE_VERIFIER_KEY);
}
