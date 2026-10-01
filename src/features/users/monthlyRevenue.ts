import { parseBRLInput, roundToCents } from '@/utils/currency';

export type MonthlyRevenueValidation =
  /** `value: null` = não informado. O backend trata como "não alterar". */
  | { ok: true; value: number | null }
  | { ok: false; error: string };

/**
 * Valida o faturamento mensal declarado.
 *
 * Campo vazio é intencional: significa "não informado". Zero é declaração
 * legítima (conta nova que ainda não vendeu), então é aceito. Só negativo é
 * recusado — e o backend recusa também, com 400.
 *
 * Mesmas regras de parsing do CMV (ver `parseBRLInput`), para que "10.50" e
 * "10,50" signifiquem a mesma coisa nos dois campos.
 */
export function validateMonthlyRevenueInput(
  raw: string,
): MonthlyRevenueValidation {
  if (raw.trim() === '') {
    return { ok: true, value: null };
  }

  const value = parseBRLInput(raw);
  if (value === null) {
    return { ok: false, error: 'Informe um valor válido.' };
  }
  if (value < 0) {
    return { ok: false, error: 'O faturamento não pode ser negativo.' };
  }

  return { ok: true, value: roundToCents(value) };
}

/** Campo em branco só quando não informado; `0` é valor e aparece como 0,00. */
export function toMonthlyRevenueInputValue(value: number | null): string {
  if (value === null) return '';
  return value.toFixed(2).replace('.', ',');
}
