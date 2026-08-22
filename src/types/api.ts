export type HealthCheckResponse = {
  status: string;
  checkedAtUtc: string;
};

export type UserResponse = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  cpfCnpj: string;
  createdAtUtc: string;
  updatedAtUtc?: string | null;
};

export type CreateUserRequest = {
  fullName: string;
  email: string;
  phone: string;
  cpfCnpj: string;
  password: string;
};

export type UpdateUserRequest = {
  fullName: string;
  email: string;
  phone: string;
  cpfCnpj: string;
  password?: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
  tokenType: string;
  expiresAtUtc: string;
  user: UserResponse;
};

/**
 * Resposta esperada ao iniciar o OAuth do Mercado Livre.
 * TODO(backend): confirmar contrato/rota com o backend ProfitCore.
 */
export type MercadoLivreAuthorizationResponse = {
  /** URL de autorização do Mercado Livre para redirecionar o usuário. */
  authorizationUrl: string;
};

export type ProblemDetails = {
  status: number;
  title: string;
  detail?: string;
  code?: string;
  traceId?: string;
  errors?: Record<string, string[]>;
};
