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

export type ProblemDetails = {
  status: number;
  title: string;
  detail?: string;
  code?: string;
  traceId?: string;
  errors?: Record<string, string[]>;
};
