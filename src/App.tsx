import { useEffect, useState } from 'react';
import { useHealth } from '@/hooks/useHealth';
import { api } from '@/services/api';
import type { GoogleAdsTokenResponse } from '@/types/api';
import './App.css';

function App() {
  const { data, loading, error, refresh } = useHealth();
  const [callbackResult, setCallbackResult] =
    useState<GoogleAdsTokenResponse | null>(null);
  const [callbackError, setCallbackError] = useState<Error | null>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state') ?? undefined;
    if (code) {
      const next = new URL(window.location.href);
      next.searchParams.delete('code');
      next.searchParams.delete('state');
      next.searchParams.delete('scope');
      next.searchParams.delete('error');
      next.hash = '';
      window.history.replaceState({}, '', next.toString());

      api
        .exchangeGoogleAdsCode(code, state)
        .then((res) => {
          setCallbackResult(res);
          setCallbackError(null);
        })
        .catch((err: unknown) => {
          setCallbackError(err instanceof Error ? err : new Error('Erro desconhecido'));
          setCallbackResult(null);
        });
    }
  }, []);

  return (
    <div className="page">
      <header className="hero">
        <div className="hero-top">
          <h1>Profitcore</h1>
          <span className={`env-tag env-tag--${api.appEnv}`}>{api.appEnvLabel}</span>
        </div>
        <p className="subtitle">Painel de integração com Google Ads</p>
      </header>

      <section className="card">
        <div className="card-header">
          <h2>Status da API</h2>
          <button className="btn btn-ghost" onClick={() => void refresh()} disabled={loading}>
            {loading ? 'Atualizando…' : 'Atualizar'}
          </button>
        </div>

        <div className="status-row">
          <dt>Base URL</dt>
          <dd className="mono">{api.baseUrl}</dd>
          <dt>Status</dt>
          <dd>
            {loading && <span className="pill pill-idle">Carregando…</span>}
            {!loading && !error && data && (
              <span className="pill pill-ok">{data.status.toUpperCase()}</span>
            )}
            {!loading && error && <span className="pill pill-err">OFFLINE</span>}
          </dd>
          <dt>Checado em</dt>
          <dd className="mono">
            {data?.checkedAtUtc ? new Date(data.checkedAtUtc).toLocaleString('pt-BR') : '—'}
          </dd>
        </div>

        {error && <div className="alert alert-err">{error.message}</div>}
      </section>

      <section className="card">
        <h2>Conectar conta Google Ads</h2>
        <p>
          Ao clicar abaixo você será redirecionado para o consentimento do Google.
          Depois volta aqui com os tokens.
        </p>
        <div className="actions">
          <button
            className="btn btn-primary"
            onClick={() => api.redirectToGoogleAdsAuthorize()}
          >
            Conectar Google Ads
          </button>
        </div>

        {callbackResult && (
          <div className="result">
            <h3>Conexão realizada com sucesso ✅</h3>
            <pre>{JSON.stringify(callbackResult, null, 2)}</pre>
          </div>
        )}

        {callbackError && (
          <div className="alert alert-err">
            Falha ao trocar código: {callbackError.message}
          </div>
        )}
      </section>

      <footer className="footer">
        <small>Vite + React + TypeScript · profitcore-frontend</small>
      </footer>
    </div>
  );
}

export default App;
