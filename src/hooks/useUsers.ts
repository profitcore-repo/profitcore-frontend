import { useCallback, useEffect, useState } from 'react';
import { api } from '@/services/api';
import type { UserResponse } from '@/types/api';

export function useUsers() {
  const [data, setData] = useState<UserResponse[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.listUsers();
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, refresh: load };
}
