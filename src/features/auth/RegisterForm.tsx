import { useMemo, useState, type FormEvent } from 'react';
import {
  Alert,
  Box,
  Button,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
} from '@mui/material';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import {
  detectDocumentKind,
  isValidDocument,
  isValidEmail,
  isValidPhone,
  maskDocument,
  maskPhone,
  onlyDigits,
} from '@/utils/masks';

export type RegisterFormValues = {
  name: string;
  email: string;
  phone: string;
  document: string;
  password: string;
  passwordConfirmation: string;
};

/** Valores no formato "cru" (apenas dígitos onde aplicável) para envio ao backend. */
export type RegisterPayload = {
  name: string;
  email: string;
  phone: string;
  document: string;
  documentKind: 'cpf' | 'cnpj';
  password: string;
};

type RegisterFormProps = {
  onSubmit: (payload: RegisterPayload) => Promise<void> | void;
  isSubmitting?: boolean;
  errorMessage?: string | null;
};

type FieldErrors = Partial<Record<keyof RegisterFormValues, string>>;

const initialValues: RegisterFormValues = {
  name: '',
  email: '',
  phone: '',
  document: '',
  password: '',
  passwordConfirmation: '',
};

function validate(values: RegisterFormValues): FieldErrors {
  const errors: FieldErrors = {};

  if (values.name.trim().length < 3) {
    errors.name = 'Informe o nome completo.';
  }

  if (!isValidEmail(values.email)) {
    errors.email = 'E-mail inválido.';
  }

  if (!isValidPhone(values.phone)) {
    errors.phone = 'Telefone inválido. Use DDD + número.';
  }

  if (!isValidDocument(values.document)) {
    errors.document = 'CPF ou CNPJ inválido.';
  }

  if (values.password.length < 6) {
    errors.password = 'A senha deve ter pelo menos 6 caracteres.';
  }

  if (!values.passwordConfirmation) {
    errors.passwordConfirmation = 'Confirme a senha.';
  } else if (values.passwordConfirmation !== values.password) {
    errors.passwordConfirmation = 'As senhas não conferem.';
  }

  return errors;
}

export function RegisterForm({
  onSubmit,
  isSubmitting = false,
  errorMessage,
}: RegisterFormProps) {
  const [values, setValues] = useState<RegisterFormValues>(initialValues);
  const [touched, setTouched] = useState<Record<keyof RegisterFormValues, boolean>>({
    name: false,
    email: false,
    phone: false,
    document: false,
    password: false,
    passwordConfirmation: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);

  const errors = useMemo(() => validate(values), [values]);
  const isValid = Object.keys(errors).length === 0;

  const documentLabel = useMemo(() => {
    const kind = detectDocumentKind(values.document);
    if (kind === 'cpf') return 'CPF';
    if (kind === 'cnpj') return 'CNPJ';
    return 'CPF ou CNPJ';
  }, [values.document]);

  const setField =
    <K extends keyof RegisterFormValues>(field: K, transform?: (v: string) => string) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const raw = event.target.value;
      const next = transform ? transform(raw) : raw;
      setValues((prev) => ({ ...prev, [field]: next }));
    };

  const markTouched = (field: keyof RegisterFormValues) => () =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  const showError = (field: keyof RegisterFormValues) =>
    touched[field] && Boolean(errors[field]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched({
      name: true,
      email: true,
      phone: true,
      document: true,
      password: true,
      passwordConfirmation: true,
    });

    if (!isValid) return;

    const kind = detectDocumentKind(values.document);
    if (!kind) return;

    await onSubmit({
      name: values.name.trim(),
      email: values.email.trim().toLowerCase(),
      phone: onlyDigits(values.phone),
      document: onlyDigits(values.document),
      documentKind: kind,
      password: values.password,
    });
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Stack spacing={2.5}>
        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

        <TextField
          label="Nome completo"
          autoComplete="name"
          required
          value={values.name}
          onChange={setField('name')}
          onBlur={markTouched('name')}
          disabled={isSubmitting}
          error={showError('name')}
          helperText={showError('name') ? errors.name : ' '}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <PersonOutlineOutlinedIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />

        <TextField
          label="E-mail"
          type="email"
          autoComplete="email"
          required
          value={values.email}
          onChange={setField('email')}
          onBlur={markTouched('email')}
          disabled={isSubmitting}
          error={showError('email')}
          helperText={showError('email') ? errors.email : ' '}
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
          label="Telefone"
          autoComplete="tel"
          required
          value={values.phone}
          onChange={setField('phone', maskPhone)}
          onBlur={markTouched('phone')}
          disabled={isSubmitting}
          error={showError('phone')}
          helperText={showError('phone') ? errors.phone : ' '}
          placeholder="(11) 90000-0000"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <PhoneOutlinedIcon fontSize="small" />
                </InputAdornment>
              ),
            },
            htmlInput: { inputMode: 'tel', maxLength: 16 },
          }}
        />

        <TextField
          label={documentLabel}
          required
          value={values.document}
          onChange={setField('document', maskDocument)}
          onBlur={markTouched('document')}
          disabled={isSubmitting}
          error={showError('document')}
          helperText={showError('document') ? errors.document : ' '}
          placeholder="000.000.000-00"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <BadgeOutlinedIcon fontSize="small" />
                </InputAdornment>
              ),
            },
            htmlInput: { inputMode: 'numeric', maxLength: 18 },
          }}
        />

        <TextField
          label="Senha"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          required
          value={values.password}
          onChange={setField('password')}
          onBlur={markTouched('password')}
          disabled={isSubmitting}
          error={showError('password')}
          helperText={
            showError('password')
              ? errors.password
              : 'Mínimo de 6 caracteres.'
          }
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
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
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

        <TextField
          label="Confirmar senha"
          type={showPasswordConfirmation ? 'text' : 'password'}
          autoComplete="new-password"
          required
          value={values.passwordConfirmation}
          onChange={setField('passwordConfirmation')}
          onBlur={markTouched('passwordConfirmation')}
          disabled={isSubmitting}
          error={showError('passwordConfirmation')}
          helperText={
            showError('passwordConfirmation') ? errors.passwordConfirmation : ' '
          }
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
                      showPasswordConfirmation
                        ? 'Ocultar confirmação de senha'
                        : 'Mostrar confirmação de senha'
                    }
                    onClick={() => setShowPasswordConfirmation((v) => !v)}
                    edge="end"
                    size="small"
                  >
                    {showPasswordConfirmation ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />

        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={isSubmitting}
          fullWidth
        >
          {isSubmitting ? 'Criando conta…' : 'Criar conta'}
        </Button>
      </Stack>
    </Box>
  );
}
