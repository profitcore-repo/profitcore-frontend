import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api, setAccessToken } from '@/services/api';
import type { UserResponse } from '@/types/api';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  document?: string;
  documentKind?: 'cpf' | 'cnpj';
};

export type SignInCredentials = {
  email: string;
  password: string;
};

export type SignUpData = {
  name: string;
  email: string;
  phone: string;
  document: string;
  documentKind: 'cpf' | 'cnpj';
  password: string;
};

export type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  refreshProfile: () => Promise<void>;
  signIn: (credentials: SignInCredentials) => Promise<void>;
  signUp: (data: SignUpData) => Promise<void>;
  signOut: () => Promise<void>;
};

const USER_KEY = 'profitcore.auth.user';

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

type AuthProviderProps = {
  children: ReactNode;
};

function apiUserToAuthUser(user: UserResponse): AuthUser {
  const len = user.cpfCnpj.length;
  const documentKind: 'cpf' | 'cnpj' | undefined =
    len === 11 ? 'cpf' : len === 14 ? 'cnpj' : undefined;
  return {
    id: user.id,
    name: user.fullName,
    email: user.email,
    phone: user.phone,
    document: user.cpfCnpj,
    documentKind,
  };
}

function readStoredUser(): AuthUser | null {
  try {
    const raw = window.localStorage.getItem(USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AuthUser>;
    if (parsed && typeof parsed.email === 'string' && typeof parsed.id === 'string' && typeof parsed.name === 'string') {
      return {
        id: parsed.id,
        name: parsed.name,
        email: parsed.email,
        phone: typeof parsed.phone === 'string' ? parsed.phone : undefined,
        document:
          typeof parsed.document === 'string' ? parsed.document : undefined,
        documentKind:
          parsed.documentKind === 'cpf' || parsed.documentKind === 'cnpj'
            ? parsed.documentKind
            : undefined,
      };
    }
    return null;
  } catch {
    return null;
  }
}

function persistUser(user: AuthUser) {
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearStorage() {
  window.localStorage.removeItem(USER_KEY);
  setAccessToken(null);
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser());
  const [isInitializing, setIsInitializing] = useState(true);

  const refreshProfile = useCallback(async () => {
    try {
      const remote = await api.me();
      const next = apiUserToAuthUser(remote);
      persistUser(next);
      setUser(next);
    } catch {
      clearStorage();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    setIsInitializing(false);
  }, []);

  const signIn = useCallback(async ({ email, password }: SignInCredentials) => {
    if (!email || !password) {
      throw new Error('Informe e-mail e senha.');
    }

    const result = await api.login({ email, password });
    setAccessToken(result.accessToken);

    const next = apiUserToAuthUser(result.user);
    persistUser(next);
    setUser(next);
  }, []);

  const signUp = useCallback(async (data: SignUpData) => {
    const created = await api.createUser({
      fullName: data.name,
      email: data.email,
      phone: data.phone,
      cpfCnpj: data.document,
      password: data.password,
    });

    try {
      const loginResult = await api.login({
        email: data.email,
        password: data.password,
      });
      setAccessToken(loginResult.accessToken);
      const next = apiUserToAuthUser(loginResult.user);
      persistUser(next);
      setUser(next);
    } catch {
      const next = apiUserToAuthUser(created);
      persistUser(next);
      setUser(next);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      clearStorage();
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isInitializing,
      refreshProfile,
      signIn,
      signUp,
      signOut,
    }),
    [user, isInitializing, refreshProfile, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
