import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import type { MercadoLivreStoreResponse } from '@/types/api';

export type ConnectionsContextValue = {
  /** `null` = ainda não sabemos (carregando ou falhou). */
  stores: MercadoLivreStoreResponse[] | null;
  hasConnection: boolean;
  /**
   * `true` enquanto a primeira resposta de `/mercado-livre/stores` não chegou.
   * Os guards de rota não podem decidir nada nesse estado.
   */
  isResolving: boolean;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  disconnect: (storeId: string) => Promise<void>;
};

export const ConnectionsContext = createContext<ConnectionsContextValue | undefined>(
  undefined,
);

type ConnectionsProviderProps = {
  children: ReactNode;
};

/**
 * Fonte única do estado de conexão com o Mercado Livre. Guards, dashboard e a
 * tela de conexões leem daqui, então conectar/desconectar reflete na navegação
 * sem recarregar a página.
 */
export function ConnectionsProvider({ children }: ConnectionsProviderProps) {
  const { isAuthenticated, isInitializing } = useAuth();
  const [stores, setStores] = useState<MercadoLivreStoreResponse[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.listMercadoLivreStores();
      setStores(data);
    } catch (err) {
      // Mantém `stores` em `null`: sem resposta não afirmamos que não há conexão.
      setStores(null);
      setError(
        err instanceof Error ? err.message : 'Falha ao carregar lojas conectadas.',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const disconnect = useCallback(async (storeId: string) => {
    await api.disconnectMercadoLivreStore(storeId);
    setStores((prev) => (prev ? prev.filter((store) => store.id !== storeId) : prev));
  }, []);

  useEffect(() => {
    if (isInitializing) return;
    if (!isAuthenticated) {
      setStores(null);
      setError(null);
      setIsLoading(false);
      return;
    }
    void refresh();
  }, [isAuthenticated, isInitializing, refresh]);

  const value = useMemo<ConnectionsContextValue>(() => {
    const resolved = stores !== null;
    return {
      stores,
      hasConnection: resolved && stores.length > 0,
      isResolving: isAuthenticated && !resolved && error === null,
      isLoading,
      error,
      refresh,
      disconnect,
    };
  }, [stores, isAuthenticated, isLoading, error, refresh, disconnect]);

  return (
    <ConnectionsContext.Provider value={value}>
      {children}
    </ConnectionsContext.Provider>
  );
}
