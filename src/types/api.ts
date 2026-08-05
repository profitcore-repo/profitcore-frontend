export type HealthCheckResponse = {
  status: string;
  checkedAtUtc: string;
};

export type GoogleLoginRequest = {
  idToken: string;
};

export type GoogleLoginResponse = {
  subject: string;
  email: string;
  emailVerified: boolean;
  name: string;
  pictureUrl: string;
  expiresAtUtc: string;
};

export type GoogleAdsAuthUrlResponse = {
  url: string;
};

export type GoogleAdsTokenResponse = {
  accessToken: string;
  refreshToken?: string;
  expiresInSeconds: number;
  scope: string;
  tokenType: string;
  issuedAtUtc: string;
};

export type RegisterUserRequest = {
  fullName: string;
  email: string;
  phone: string;
  cpfCnpj: string;
  password: string;
};

export type RegisterUserResponse = {
  id?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  cpfCnpj?: string;
  createdAtUtc?: string;
};

export type ProblemDetails = {
  status: number;
  title: string;
  detail?: string;
  code?: string;
  traceId?: string;
  errors?: Record<string, string[]>;
};
