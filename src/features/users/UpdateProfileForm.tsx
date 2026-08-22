import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  Alert,
  Box,
  Button,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';

import { api } from '@/services/api';
import type { UpdateUserRequest, UserResponse } from '@/types/api';
import {
  detectDocumentKind,
  isValidDocument,
  isValidEmail,
  isValidPhone,
  maskDocument,
  maskPhone,
  onlyDigits,
} from '@/utils/masks';
import { useAuth } from '@/hooks/useAuth';

type ProfileFormValues = {
  fullName: string;
  email: string;
  phone: string;
  document: string;
  password: string;
  passwordConfirmation: string;
};

type FieldErrors = Partial<Record<keyof ProfileFormValues, string>>;

function validate(values: ProfileFormValues): FieldErrors {
  const errors: FieldErrors = {};

  if (values.fullName.trim().length < 3) {
    errors.fullName = 'Informe o nome completo.';
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

  if (values.password) {
    if (values.password.length < 6) {
      errors.password = 'A senha deve ter pelo menos 6 caracteres.';
    }
    if (!values.passwordConfirmation) {
      errors.passwordConfirmation = 'Confirme a nova senha.';
    } else if (values.passwordConfirmation !== values.password) {
      errors.passwordConfirmation = 'As senhas não conferem.';
    }
  }

  return errors;
}

export function UpdateProfileForm() {
  const { user, refreshProfile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserResponse | null>(null);

  const [values, setValues] = useState<ProfileFormValues>({
    fullName: '',
    email: '',
    phone: '',
    document: '',
    password: '',
    passwordConfirmation: '',
  });
  const [touched, setTouched] = useState<Record<keyof ProfileFormValues, boolean>>({
    fullName: false,
    email: false,
    phone: false,
    document: false,
    password: false,
    passwordConfirmation: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const me = await api.me();
        if (cancelled) return;
        setProfile(me);
        setValues({
          fullName: me.fullName,
          email: me.email,
          phone: me.phone,
          document: me.cpfCnpj,
          password: '',
          passwordConfirmation: '',
        });
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Falha ao carregar perfil.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const errors = useMemo(() => validate(values), [values]);
  const isValid = Object.keys(errors).length === 0;

  const documentLabel = useMemo(() => {
    const kind = detectDocumentKind(values.document);
    if (kind === 'cpf') return 'CPF';
    if (kind === 'cnpj') return 'CNPJ';
    return 'CPF ou CNPJ';
  }, [values.document]);

  const setField =
    <K extends keyof ProfileFormValues>(field: K, transform?: (v: string) => string) =>
      (event: React.ChangeEvent<HTMLInputElement>) => {
        setSuccess(null);
        const raw = event.target.value;
        const next = transform ? transform(raw) : raw;
        setValues((prev) => ({ ...prev, [field]: next }));
      };

  const markTouched = (field: keyof ProfileFormValues) => () =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  const showError = (field: keyof ProfileFormValues) =>
    touched[field] && Boolean(errors[field]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profile) return;

    setTouched({
      fullName: true,
      email: true,
      phone: true,
      document: true,
      password: true,
      passwordConfirmation: true,
    });
    if (!isValid) return;

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payload: UpdateUserRequest = {
        fullName: values.fullName,
        email: values.email,
        phone: onlyDigits(values.phone),
        cpfCnpj: onlyDigits(values.document),
      };
      if (values.password) payload.password = values.password;

      await api.updateUser(profile.id, payload);
      await refreshProfile();

      setValues((prev) => ({ ...prev, password: '', passwordConfirmation: '' }));
      setTouched((prev) => ({ ...prev, password: false, passwordConfirmation: false }));
      setSuccess('Perfil atualizado com sucesso.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao salvar perfil.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          p: 4,
          display: 'grid',
          placeItems: 'center',
          color: 'text.secondary',
        }}
      >
        Carregando perfil…
      </Box>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
      <Stack spacing={2.5}>
        <Stack spacing={0.5}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                display: 'grid',
                placeItems: 'center',
                fontWeight: 600,
                fontSize: 14,
                lineHeight: 1,
              }}
            >
              {(user?.name ?? values.fullName)
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((n) => n[0]?.toUpperCase())
                .join('')}
            </Box>
            <Stack spacing={0.25} sx={{ minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                {values.fullName || 'Perfil'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap>
                {values.email || user?.email || 'Atualize seus dados'}
              </Typography>
            </Stack>
          </Stack>
        </Stack>

        {success && (
          <Alert
            severity="success"
            icon={<CheckCircleOutlineOutlinedIcon fontSize="inherit" />}
          >
            {success}
          </Alert>
        )}
        {error && <Alert severity="error">{error}</Alert>}

        <TextField
          label="Nome completo"
          autoComplete="name"
          required
          value={values.fullName}
          onChange={setField('fullName')}
          onBlur={markTouched('fullName')}
          disabled={saving}
          error={showError('fullName')}
          helperText={showError('fullName') ? errors.fullName : ' '}
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
          disabled={saving}
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
          disabled={saving}
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
              inputProps: { inputMode: 'tel', maxLength: 16 },
            },
          }}
        />

        <TextField
          label={documentLabel}
          required
          value={values.document}
          onChange={setField('document', maskDocument)}
          onBlur={markTouched('document')}
          disabled={saving}
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
              inputProps: { inputMode: 'numeric', maxLength: 18 },
            },
          }}
        />

        <Stack
          direction="row"
          spacing={1}
          sx={{
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
          }}
        >
          <Typography variant="overline" sx={{ color: 'text.secondary' }}>
            Alterar senha
          </Typography>
          <Tooltip title="Preencha apenas se quiser trocar a senha atual.">
            <Typography variant="caption" sx={{ color: 'text.disabled', cursor: 'help' }}>
              opcional
            </Typography>
          </Tooltip>
        </Stack>

        <TextField
          label="Nova senha"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          value={values.password}
          onChange={setField('password')}
          onBlur={markTouched('password')}
          disabled={saving}
          error={showError('password')}
          helperText={showError('password') ? errors.password : ' '}
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
          label="Confirmar nova senha"
          type={showPasswordConfirmation ? 'text' : 'password'}
          autoComplete="new-password"
          value={values.passwordConfirmation}
          onChange={setField('passwordConfirmation')}
          onBlur={markTouched('passwordConfirmation')}
          disabled={saving}
          error={showError('passwordConfirmation')}
          helperText={
            showError('passwordConfirmation')
              ? errors.passwordConfirmation
              : ' '
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
          disabled={saving || loading}
          startIcon={<SaveOutlinedIcon />}
          fullWidth
          sx={{ mt: 0.5 }}
        >
          {saving ? 'Salvando…' : 'Salvar alterações'}
        </Button>
      </Stack>
    </Box>
  );
}
