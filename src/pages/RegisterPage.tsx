import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Box, Link, Stack, Typography } from '@mui/material';
import { AuthLayout } from '@/components/layout/AuthLayout';
import {
  RegisterForm,
  type RegisterPayload,
} from '@/features/auth/RegisterForm';
import { useAuth } from '@/hooks/useAuth';

export function RegisterPage() {
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (payload: RegisterPayload) => {
    setError(null);
    setIsSubmitting(true);
    try {
      await signUp(payload);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao criar conta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout maxWidth={480}>
      <Stack spacing={0.5}>
        <Typography variant="h5" component="h1">
          Criar sua conta
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Preencha seus dados para começar a usar o ProfitCore.
        </Typography>
      </Stack>

      <RegisterForm
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        errorMessage={error}
      />

      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Já tem conta?{' '}
          <Link component={RouterLink} to="/login" underline="hover" sx={{ fontWeight: 600 }}>
            Entrar
          </Link>
        </Typography>
      </Box>
    </AuthLayout>
  );
}
