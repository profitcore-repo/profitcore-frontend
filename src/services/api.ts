import type {
  GoogleAdsAuthUrlResponse,
  GoogleAdsTokenResponse,
  GoogleLoginRequest,
  GoogleLoginResponse,
  HealthCheckResponse,
  ProblemDetails,
} from '@/types/api';

const DEFAULT_BASE_URL = 'https://profitcore-backend.onrender.com';

type AppEnv = 'local' | 'homologacao' | 'production';

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

export function getBaseUrlFor(appEnv: AppEnv): string {
  switch (appEnv) {
    case 'local':
      return 'http://localhost:5269';
    case 'homologacao':
      return 'https://profitcore-backend.onrender.com';
    case 'production':
      return DEFAULT_BASE_URL;
  }
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

async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const url = `${getBaseUrl()}${path}`;

  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
    ...init,
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

  loginWithGoogle(idToken: string): Promise<GoogleLoginResponse> {
    const payload: GoogleLoginRequest = { idToken };
    return request<GoogleLoginResponse>('/auth/google', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getGoogleAdsAuthorizeUrl(state?: string): Promise<GoogleAdsAuthUrlResponse> {
    const qs = new URLSearchParams();
    if (state) qs.set('state', state);
    const query = qs.toString();
    return request<GoogleAdsAuthUrlResponse>(
      `/auth/google-ads/authorize-url${query ? `?${query}` : ''}`,
      { method: 'GET' },
    );
  },

  redirectToGoogleAdsAuthorize(state?: string): void {
    const url = `${getBaseUrl()}/auth/google-ads/authorize${
      state ? `?state=${encodeURIComponent(state)}` : ''
    }`;
    window.location.assign(url);
  },

  exchangeGoogleAdsCode(
    code: string,
    state?: string,
  ): Promise<GoogleAdsTokenResponse> {
    const qs = new URLSearchParams({ code });
    if (state) qs.set('state', state);
    return request<GoogleAdsTokenResponse>(
      `/auth/google-ads/callback?${qs.toString()}`,
      { method: 'GET' },
    );
  },
};
