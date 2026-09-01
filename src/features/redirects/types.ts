/**
 * Contrato dos retornos de integração que chegam em `/redirects`.
 *
 * Cada integração externa que devolve o usuário para a SPA implementa um
 * `RedirectHandler`. A rota não conhece nenhum provedor: ela identifica quem
 * respondeu, delega e navega para onde o handler indicar.
 */

export type RedirectHandlerContext = {
  /** Reprocessa o estado de conexões antes de liberar a navegação. */
  refreshConnections: () => Promise<void>;
};

export type RedirectHandlerResult =
  /** Deu certo: navegar para `redirectTo`. */
  | { outcome: 'success'; redirectTo: string }
  /** O usuário recusou a autorização no provedor. Não é erro do sistema. */
  | { outcome: 'denied'; message: string }
  /** Falha técnica: token, rede, contrato. */
  | { outcome: 'failed'; message: string };

export type RedirectHandler = {
  /** Usado na URL explícita `/redirects/<id>`. */
  id: string;
  /** Nome exibido ao usuário nas telas de espera e de erro. */
  label: string;
  /**
   * Reconhece o retorno pelos parâmetros quando a URL não traz o id.
   * Novas integrações devem registrar `/redirects/<id>` para evitar ambiguidade.
   */
  matches: (params: URLSearchParams) => boolean;
  handle: (
    params: URLSearchParams,
    context: RedirectHandlerContext,
  ) => Promise<RedirectHandlerResult>;
};

export type RedirectResolution =
  | { kind: 'resolved'; handler: RedirectHandler }
  | { kind: 'unknown'; reason: string };
