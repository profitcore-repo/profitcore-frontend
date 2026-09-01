/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** `local` | `homologacao` | `production` (ver `detectAppEnv`). */
  readonly VITE_APP_ENV?: string;
  /** Base da API. Vazio cai no default de produção em `getBaseUrl`. */
  readonly VITE_API_BASE_URL?: string;
  /**
   * Sobrescreve a redirect_uri do OAuth do Mercado Livre. Vazio deriva de
   * `window.location.origin + /redirects`.
   */
  readonly VITE_MERCADO_LIVRE_REDIRECT_URI?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
