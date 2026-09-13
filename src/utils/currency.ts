const BRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 2,
});

export function formatBRL(value: number): string {
  return BRL.format(value);
}

/**
 * Converte o que o usuário digitou num campo de dinheiro em número.
 *
 * Retorna `null` quando o texto não representa um número, deixando a mensagem
 * de erro para quem chamou.
 *
 * O ponto é ambíguo em pt-BR: em `1.050` é separador de milhar, em `10.50` é
 * decimal. Interpretar sempre como milhar transformaria "10.50" em mil e
 * cinquenta reais — um erro de 100x num campo de custo. As regras:
 *
 * - Se há vírgula, ela é o decimal e todo ponto é milhar.
 * - Só ponto, uma única ocorrência e sem 3 dígitos depois: decimal.
 * - Qualquer outro caso com ponto: milhar.
 */
export function parseBRLInput(raw: string): number | null {
  const cleaned = raw.trim().replace(/\s/g, '').replace(/^R\$/i, '');
  if (!cleaned) return null;
  // O sinal é aceito aqui para que quem chama possa recusar negativo com uma
  // mensagem específica, em vez de um genérico "valor inválido".
  if (!/^-?\d[\d.,]*$/.test(cleaned)) return null;

  let normalized: string;
  if (cleaned.includes(',')) {
    normalized = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (cleaned.includes('.')) {
    const isSingleDot = cleaned.indexOf('.') === cleaned.lastIndexOf('.');
    const decimals = cleaned.slice(cleaned.lastIndexOf('.') + 1);
    normalized =
      isSingleDot && decimals.length !== 3 ? cleaned : cleaned.replace(/\./g, '');
  } else {
    normalized = cleaned;
  }

  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

/** Arredonda para centavos, evitando enviar dízimas ao backend. */
export function roundToCents(value: number): number {
  return Math.round(value * 100) / 100;
}
