import { useState } from 'react';
import {
  Link as RouterLink,
  useLocation,
  useNavigate,
  type Location,
} from 'react-router-dom';
import { Divider, Link, Stack, Typography } from '@mui/material';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { LoginForm, type LoginFormValues } from '@/features/auth/LoginForm';
import { useAuth } from '@/hooks/useAuth';

type LocationState = { from?: Location } | null;

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async ({ email, password }: LoginFormValues) => {
    setError(null);
    setIsSubmitting(true);
    try {
      await signIn({ email, password });
      const state = location.state as LocationState;
      const redirectTo = state?.from?.pathname ?? '/dashboard';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao entrar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <Stack spacing={0.5}>
        <Typography variant="h5" component="h1">
          Bem-vindo de volta
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Acesse sua conta para continuar.
        </Typography>
      </Stack>

      <LoginForm
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        errorMessage={error}
      />

      <Divider>ou</Divider>

      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
        Ainda não tem conta?{' '}
        <Link
          component={RouterLink}
          to="/register"
          underline="hover"
          sx={{ fontWeight: 600 }}
        >
          Criar conta
        </Link>
      </Typography>
    </AuthLayout>
  );
}
