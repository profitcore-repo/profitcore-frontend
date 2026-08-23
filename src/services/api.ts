import type {
  CreateUserRequest,
  HealthCheckResponse,
  LoginRequest,
  LoginResponse,
  MercadoLivreOrderListResult,
  MercadoLivreOrdersDateRange,
  MercadoLivreStoreResponse,
  ProblemDetails,
  UpdateUserRequest,
  UserResponse,
} from '@/types/api';

const DEFAULT_BASE_URL = 'https://profitcore-backend.onrender.com';

type AppEnv = 'local' | 'homologacao' | 'production';
const TOKEN_KEY = 'profitcore.auth.token';

export function detectAppEnv(): AppEnv {
  const raw = (import.meta.env.VITE_APP_ENV ?? import.meta.env.MODE ?? '')
    .trim()
    .toLowerCase();

  if (raw === 'local' || raw === 'dev' || raw === 'development') return 'local';
  if (raw === 'homologacao' || raw === 'hml' || raw === 'staging') return 'homologacao';
  if (raw === 'prod') return 'production';
  return 'production';
}

export function getBaseUrl(): string {
  const envUrl = (import.meta.env.VITE_API_BASE_URL ?? '').trim();
  return envUrl || DEFAULT_BASE_URL;
}

export function envLabel(appEnv: AppEnv): string {
  switch (appEnv) {
    case 'local':
      return 'Local';
    case 'homologacao':
      return 'Homologação';
    case 'production':
      return 'Produção';
  }
}

export function getAccessToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAccessToken(token: string | null): void {
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage indisponível */
  }
}

function toRecord(headers: HeadersInit | undefined): Record<string, string> {
  if (!headers) return {};
  if (Array.isArray(headers)) {
    const out: Record<string, string> = {};
    for (const [k, v] of headers) out[k] = v;
    return out;
  }
  if (headers instanceof Headers) {
    const out: Record<string, string> = {};
    headers.forEach((v, k) => {
      out[k] = v;
    });
    return out;
  }
  return { ...headers };
}

async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const url = `${getBaseUrl()}${path}`;
  const token = getAccessToken();

  const headers: Record<string, string> = toRecord(init.headers);
  if (
    !Object.keys(headers).some(
      (k) => k.toLowerCase() === 'content-type',
    ) &&
    init.body &&
    typeof init.body === 'string'
  ) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...init,
    headers,
  });

  const text = await res.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!res.ok) {
    const problem: ProblemDetails =
      body && typeof body === 'object' && 'status' in body
        ? (body as ProblemDetails)
        : {
            status: res.status,
            title: res.statusText || 'Erro na requisição',
            detail: typeof body === 'string' ? body : undefined,
          };
    const error = new Error(
      `${problem.status} ${problem.title}${
        problem.detail ? ` — ${problem.detail}` : ''
      }`,
    ) as Error & { problem?: ProblemDetails };
    error.problem = problem;
    throw error;
  }

  return body as T;
}

export const api = {
  appEnv: detectAppEnv(),
  get appEnvLabel() {
    return envLabel(this.appEnv);
  },
  baseUrl: getBaseUrl(),

  health(): Promise<HealthCheckResponse> {
    return request<HealthCheckResponse>('/health', { method: 'GET' });
  },

  login(payload: LoginRequest): Promise<LoginResponse> {
    return request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: payload.email.trim().toLowerCase(),
        password: payload.password,
      }),
    });
  },

  logout(): Promise<void> {
    return request<void>('/auth/logout', { method: 'POST' }).catch(() => {
      /* sempre limpa localmente mesmo se o request falhar */
    });
  },

  me(): Promise<UserResponse> {
    return request<UserResponse>('/auth/me', { method: 'GET' });
  },

  listUsers(): Promise<UserResponse[]> {
    return request<UserResponse[]>('/users', { method: 'GET' });
  },

  getUserById(userId: string): Promise<UserResponse> {
    return request<UserResponse>(`/users/${userId}`, { method: 'GET' });
  },

  createUser(payload: CreateUserRequest): Promise<UserResponse> {
    return request<UserResponse>('/users', {
      method: 'POST',
      body: JSON.stringify({
        fullName: payload.fullName.trim(),
        email: payload.email.trim().toLowerCase(),
        phone: payload.phone,
        cpfCnpj: payload.cpfCnpj,
        password: payload.password,
      }),
    });
  },

  /**
   * Inicia a conexão OAuth com o Mercado Livre.
   * Retorna a URL de autorização + PKCE code_verifier (salve para usar no callback).
   */
  startMercadoLivreAuthorization(redirectUriOverride?: string): Promise<{
    authorizeUrl: string;
    codeVerifier: string;
  }> {
    const params = new URLSearchParams();
    if (redirectUriOverride) params.append('redirectUriOverride', redirectUriOverride);
    const qs = params.toString();
    return request<{ authorizeUrl: string; codeVerifier: string }>(
      `/mercado-livre/authorize-url${qs ? `?${qs}` : ''}`,
      { method: 'GET' },
    );
  },

  /**
   * Finaliza a conexão trocando o authorization code + code_verifier (PKCE)
   * pelos tokens do ML e cadastrando/atualizando a loja no banco.
   */
  connectMercadoLivreStore(payload: {
    authorizationCode: string;
    codeVerifier?: string;
    redirectUriOverride?: string;
  }): Promise<MercadoLivreStoreResponse> {
    return request<MercadoLivreStoreResponse>('/mercado-livre/stores/connect', {
      method: 'POST',
      body: JSON.stringify({
        authorizationCode: payload.authorizationCode,
        ...(payload.codeVerifier ? { codeVerifier: payload.codeVerifier } : {}),
        ...(payload.redirectUriOverride
          ? { redirectUriOverride: payload.redirectUriOverride }
          : {}),
      }),
    });
  },

  listMercadoLivreStores(): Promise<MercadoLivreStoreResponse[]> {
    return request<MercadoLivreStoreResponse[]>('/mercado-livre/stores', {
      method: 'GET',
    });
  },

  disconnectMercadoLivreStore(storeId: string): Promise<void> {
    return request<void>(`/mercado-livre/stores/${storeId}`, {
      method: 'DELETE',
    });
  },

  listMercadoLivreOrders(params: {
    storeId: string;
    dateRange?: MercadoLivreOrdersDateRange;
    limit?: number;
    offset?: number;
  }): Promise<MercadoLivreOrderListResult> {
    const qs = new URLSearchParams();
    if (params.dateRange) qs.append('dateRange', params.dateRange);
    if (params.limit != null) qs.append('limit', String(params.limit));
    if (params.offset != null) qs.append('offset', String(params.offset));
    const query = qs.toString();
    return request<MercadoLivreOrderListResult>(
      `/mercado-livre/stores/${params.storeId}/orders${query ? `?${query}` : ''}`,
      { method: 'GET' },
    );
  },

  updateUser(userId: string, payload: UpdateUserRequest): Promise<UserResponse> {
    return request<UserResponse>(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({
        fullName: payload.fullName.trim(),
        email: payload.email.trim().toLowerCase(),
        phone: payload.phone,
        cpfCnpj: payload.cpfCnpj,
        ...(payload.password ? { password: payload.password } : {}),
      }),
    });
  },
};
