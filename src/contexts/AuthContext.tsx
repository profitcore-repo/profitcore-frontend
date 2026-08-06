import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api } from '@/services/api';

export type AuthUser = {
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
  signIn: (credentials: SignInCredentials) => Promise<void>;
  signUp: (data: SignUpData) => Promise<void>;
  signOut: () => void;
};

const STORAGE_KEY = 'profitcore.auth.user';

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

type AuthProviderProps = {
  children: ReactNode;
};

function readStoredUser(): AuthUser | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AuthUser>;
    if (
      parsed &&
      typeof parsed.email === 'string' &&
      typeof parsed.name === 'string'
    ) {
      return {
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
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser());
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    setIsInitializing(false);
  }, []);

  const signIn = useCallback(async ({ email, password }: SignInCredentials) => {
    if (!email || !password) {
      throw new Error('Informe e-mail e senha.');
    }

    // TODO: integrar com endpoint real de autenticação (api.login...)
    await new Promise((resolve) => setTimeout(resolve, 600));

    const nextUser: AuthUser = {
      email,
      name: email.split('@')[0] ?? 'Usuário',
    };

    persistUser(nextUser);
    setUser(nextUser);
  }, []);

  const signUp = useCallback(async (data: SignUpData) => {
    await api.registerUser({
      fullName: data.name,
      email: data.email,
      phone: data.phone,
      cpfCnpj: data.document,
      password: data.password,
    });

    const nextUser: AuthUser = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      document: data.document,
      documentKind: data.documentKind,
    };

    persistUser(nextUser);
    setUser(nextUser);
  }, []);

  const signOut = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isInitializing,
      signIn,
      signUp,
      signOut,
    }),
    [user, isInitializing, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
