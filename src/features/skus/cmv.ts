import { parseBRLInput, roundToCents } from '@/utils/currency';

/**
 * Quantos SKUs o seller precisa custear para liberar a plataforma.
 *
 * Regra herdada do protótipo: pedir o CMV apenas dos produtos com maior peso
 * nas vendas, não do catálogo inteiro. O resto ele completa depois.
 */
export const CMV_REQUIRED_SKUS = 3;

export type CmvValidation =
  /** `value: null` = marcar como não informado (limpa o CMV no backend). */
  | { ok: true; value: number | null }
  | { ok: false; error: string };

/**
 * Valida o CMV unitário digitado.
 *
 * Campo vazio é intencional, não erro: significa "não informado" e limpa o
 * valor. Zero é custo legítimo (brinde, bonificação, amostra), então é aceito
 * como qualquer outro número. Só negativo é recusado.
 */
export function validateCmvInput(raw: string): CmvValidation {
  if (raw.trim() === '') {
    return { ok: true, value: null };
  }

  const value = parseBRLInput(raw);
  if (value === null) {
    return { ok: false, error: 'Informe um valor válido.' };
  }
  if (value < 0) {
    return { ok: false, error: 'O CMV não pode ser negativo.' };
  }

  return { ok: true, value: roundToCents(value) };
}

/** Preço unitário efetivamente praticado, derivado do que já foi vendido. */
export function observedUnitPrice(
  realizedRevenue: number,
  unitsSold: number,
): number | null {
  if (unitsSold <= 0) return null;
  return realizedRevenue / unitsSold;
}

/**
 * CMV acima do preço praticado quase sempre é erro de digitação (centavos
 * trocados por reais). Não bloqueia o salvamento, só avisa — pode ser um
 * produto realmente vendido no prejuízo, e esconder isso seria pior.
 */
export function isCmvAboveObservedPrice(
  unitCost: number,
  realizedRevenue: number,
  unitsSold: number,
): boolean {
  const price = observedUnitPrice(realizedRevenue, unitsSold);
  return price !== null && unitCost > price;
}
