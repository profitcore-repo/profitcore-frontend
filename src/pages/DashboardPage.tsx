import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Alert, Box, CircularProgress, Paper, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { brandCore } from '@/theme/tokens';
import { api } from '@/services/api';

const REDIRECT_URI = 'https://profitcore-frontend.netlify.app/dashboard';

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [callbackStatus, setCallbackStatus] = useState<
    'idle' | 'processing' | 'success' | 'error'
  >('idle');
  const [callbackError, setCallbackError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    const err = searchParams.get('error');
    const errDesc = searchParams.get('error_description');

    if (!code && !err) return;

    let cancelled = false;

    (async () => {
      if (err) {
        if (cancelled) return;
        setCallbackStatus('error');
        setCallbackError(
          errDesc || `Autorização negada no Mercado Livre (${err}).`,
        );
        return;
      }

      if (!code) return;

      setCallbackStatus('processing');
      try {
        await api.connectMercadoLivreStore({
          authorizationCode: code,
          redirectUriOverride: REDIRECT_URI,
        });
        if (cancelled) return;
        setCallbackStatus('success');
        setTimeout(() => {
          navigate('/connections', { replace: true });
        }, 1500);
      } catch (e) {
        if (cancelled) return;
        setCallbackStatus('error');
        setCallbackError(
          e instanceof Error
            ? `Falha ao conectar: ${e.message}`
            : 'Falha ao conectar a conta do Mercado Livre.',
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams, navigate]);

  return (
    <DashboardLayout>
      <Stack spacing={4}>
        {callbackStatus !== 'idle' && (
          <Paper
            elevation={0}
            sx={{
              p: 3,
              border: `1px solid ${brandCore.color.borderNavy}`,
              bgcolor: 'background.paper',
            }}
          >
            {callbackStatus === 'processing' && (
              <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                <CircularProgress size={24} />
                <Typography>
                  Finalizando conexão com o Mercado Livre...
                </Typography>
              </Stack>
            )}
            {callbackStatus === 'success' && (
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                <CheckCircleOutlinedIcon color="success" fontSize="medium" />
                <Typography sx={{ color: 'success.main', fontWeight: 600 }}>
                  Conta conectada com sucesso! Redirecionando...
                </Typography>
              </Stack>
            )}
            {callbackStatus === 'error' && (
              <Alert severity="error">{callbackError}</Alert>
            )}
          </Paper>
        )}

        <Stack spacing={0.5}>
          <Typography variant="h4" component="h1">
            Olá, {user?.name ?? 'usuário'}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Este é o seu painel. Em breve traremos suas métricas por aqui.
          </Typography>
        </Stack>

        {/* Edição de perfil mora no menu da conta, no header (ProfileDialog). */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 5 },
            border: `1px dashed ${brandCore.color.borderNavy}`,
            bgcolor: 'background.paper',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <Stack
            spacing={1.5}
            sx={{
              textAlign: 'center',
              maxWidth: 460,
              alignItems: 'center',
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                bgcolor: alpha(brandCore.color.profitGreen, 0.1),
                color: 'primary.main',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <InsightsOutlinedIcon fontSize="large" />
            </Box>
            <Typography variant="h6">Nenhum dado por aqui ainda</Typography>
            <Typography variant="body2" color="text.secondary">
              Conecte suas contas e configure suas fontes de dados para ver
              indicadores em tempo real.
            </Typography>
          </Stack>
        </Paper>
      </Stack>
    </DashboardLayout>
  );
}
