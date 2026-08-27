/**
 * Controle de protótipo: define quais contas podem ver telas de admin
 * (ex.: listagem de usuários do sistema).
 *
 * Hardcoded temporariamente para MVP / prototipação interna.
 * Em produção, a validação de permissões deve vir DO BACKEND via role/claim no JWT.
 */
const ADMIN_EMAILS: ReadonlySet<string> = new Set<string>([
  'profitcoretemp@gmail.com',
]);

/**
 * Compara emails de forma segura: trim + lowercase.
 * Aceita undefined/null para simplificar o uso no hook.
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return ADMIN_EMAILS.has(normalized);
}
