import { useContext } from 'react';
import {
  SkuCostsContext,
  type SkuCostsContextValue,
} from '@/contexts/SkuCostsContext';

export function useSkuCosts(): SkuCostsContextValue {
  const ctx = useContext(SkuCostsContext);
  if (!ctx) {
    throw new Error('useSkuCosts deve ser usado dentro de <SkuCostsProvider>.');
  }
  return ctx;
}
