/**
 * Utilitários puros para formatação e validação dos campos brasileiros
 * usados nos formulários (telefone, CPF, CNPJ).
 *
 * Todas as funções operam sobre strings e nunca lançam.
 */

export function onlyDigits(value: string): string {
  return value.replace(/\D+/g, '');
}

/**
 * Aplica máscara de telefone BR:
 * - 10 dígitos → (00) 0000-0000
 * - 11 dígitos → (00) 00000-0000
 * Aceita entrada parcial para uso em `onChange`.
 */
export function maskPhone(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);
  const len = digits.length;

  if (len === 0) return '';
  if (len < 3) return `(${digits}`;
  if (len < 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (len <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function isValidPhone(value: string): boolean {
  const digits = onlyDigits(value);
  return digits.length === 10 || digits.length === 11;
}

/**
 * Máscara dinâmica CPF/CNPJ:
 * - até 11 dígitos → CPF (000.000.000-00)
 * - 12 a 14 dígitos → CNPJ (00.000.000/0000-00)
 */
export function maskDocument(value: string): string {
  const digits = onlyDigits(value).slice(0, 14);
  if (digits.length <= 11) return maskCpf(digits);
  return maskCnpj(digits);
}

function maskCpf(digits: string): string {
  const d = digits.slice(0, 11);
  const len = d.length;
  if (len <= 3) return d;
  if (len <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (len <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function maskCnpj(digits: string): string {
  const d = digits.slice(0, 14);
  const len = d.length;
  if (len <= 2) return d;
  if (len <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (len <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (len <= 12) {
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  }
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

export type DocumentKind = 'cpf' | 'cnpj';

export function detectDocumentKind(value: string): DocumentKind | null {
  const digits = onlyDigits(value);
  if (digits.length === 11) return 'cpf';
  if (digits.length === 14) return 'cnpj';
  return null;
}

export function isValidCpf(value: string): boolean {
  const digits = onlyDigits(value);
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  const calcDigit = (base: string, factorStart: number) => {
    let sum = 0;
    for (let i = 0; i < base.length; i += 1) {
      sum += Number(base[i]) * (factorStart - i);
    }
    const mod = (sum * 10) % 11;
    return mod === 10 ? 0 : mod;
  };

  const d1 = calcDigit(digits.slice(0, 9), 10);
  const d2 = calcDigit(digits.slice(0, 10), 11);
  return d1 === Number(digits[9]) && d2 === Number(digits[10]);
}

export function isValidCnpj(value: string): boolean {
  const digits = onlyDigits(value);
  if (digits.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(digits)) return false;

  const calcDigit = (base: string) => {
    const factors =
      base.length === 12
        ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < base.length; i += 1) {
      sum += Number(base[i]) * factors[i];
    }
    const mod = sum % 11;
    return mod < 2 ? 0 : 11 - mod;
  };

  const d1 = calcDigit(digits.slice(0, 12));
  const d2 = calcDigit(digits.slice(0, 12) + String(d1));
  return d1 === Number(digits[12]) && d2 === Number(digits[13]);
}

export function isValidDocument(value: string): boolean {
  const kind = detectDocumentKind(value);
  if (kind === 'cpf') return isValidCpf(value);
  if (kind === 'cnpj') return isValidCnpj(value);
  return false;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(value.trim());
}
