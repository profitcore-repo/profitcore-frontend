import { useState, type FormEvent } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Link,
  Stack,
  TextField,
} from '@mui/material';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

export type LoginFormValues = {
  email: string;
  password: string;
  remember: boolean;
};

type LoginFormProps = {
  onSubmit: (values: LoginFormValues) => Promise<void> | void;
  isSubmitting?: boolean;
  errorMessage?: string | null;
};

const initialValues: LoginFormValues = {
  email: '',
  password: '',
  remember: true,
};

export function LoginForm({
  onSubmit,
  isSubmitting = false,
  errorMessage,
}: LoginFormProps) {
  const [values, setValues] = useState<LoginFormValues>(initialValues);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange =
    <K extends keyof LoginFormValues>(field: K) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value =
        field === 'remember' ? event.target.checked : event.target.value;
      setValues((prev) => ({ ...prev, [field]: value }) as LoginFormValues);
    };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit(values);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Stack spacing={2.5}>
        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

        <TextField
          label="E-mail"
          type="email"
          autoComplete="email"
          required
          value={values.email}
          onChange={handleChange('email')}
          disabled={isSubmitting}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <EmailOutlinedIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />

        <TextField
          label="Senha"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          required
          value={values.password}
          onChange={handleChange('password')}
          disabled={isSubmitting}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <LockOutlinedIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={
                      showPassword ? 'Ocultar senha' : 'Mostrar senha'
                    }
                    onClick={() => setShowPassword((v) => !v)}
                    edge="end"
                    size="small"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />

        <Stack
          direction="row"
          sx={{ alignItems: 'center', justifyContent: 'space-between' }}
        >
          <FormControlLabel
            control={
              <Checkbox
                checked={values.remember}
                onChange={handleChange('remember')}
                disabled={isSubmitting}
                size="small"
              />
            }
            label="Lembrar-me"
          />
          <Link href="#" underline="hover" variant="body2">
            Esqueci minha senha
          </Link>
        </Stack>

        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={isSubmitting}
          fullWidth
        >
          {isSubmitting ? 'Entrando…' : 'Entrar'}
        </Button>
      </Stack>
    </Box>
  );
}
