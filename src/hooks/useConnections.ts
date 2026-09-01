import { useContext } from 'react';
import {
  ConnectionsContext,
  type ConnectionsContextValue,
} from '@/contexts/ConnectionsContext';

export function useConnections(): ConnectionsContextValue {
  const ctx = useContext(ConnectionsContext);
  if (!ctx) {
    throw new Error('useConnections deve ser usado dentro de <ConnectionsProvider>.');
  }
  return ctx;
}
