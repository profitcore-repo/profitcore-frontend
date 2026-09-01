import { Navigate, Outlet } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import { FocusShell } from '@/components/layout/FocusShell';
import { useConnections } from '@/hooks/useConnections';
import { brandCore } from '@/theme/tokens';

/** Enquanto não sabemos se há conexão, nenhum guard pode decidir rota. */
function ResolvingScreen() {
  return (
    <Box
      role="status"
      aria-label="Verificando suas conexões"
      sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}
    >
      <CircularProgress aria-hidden />
    </Box>
  );
}

/**
 * A lista de lojas falhou. Não redirecionamos: mandar para o onboarding
 * prenderia lá quem já tem loja conectada, e liberar a aplicação mostraria um
 * painel sem dados. Então pedimos nova tentativa.
 */
function ConnectionCheckFailed({
  message,
  onRetry,
  isRetrying,
}: {
  message: string;
  onRetry: () => void;
  isRetrying: boolean;
}) {
  return (
    <FocusShell>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 4 },
          border: `1px solid ${brandCore.color.borderNavy}`,
          bgcolor: 'background.paper',
        }}
      >
        <Stack spacing={2.5} sx={{ alignItems: 'flex-start' }}>
          <Stack spacing={0.5}>
            <Typography variant="h6">
              Não foi possível verificar sua conexão
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Precisamos consultar suas lojas conectadas antes de abrir a
              plataforma. Tente novamente em alguns instantes.
            </Typography>
          </Stack>

          <Alert severity="error" sx={{ width: '100%' }}>
            {message}
          </Alert>

          <Button
            variant="contained"
            onClick={onRetry}
            disabled={isRetrying}
            startIcon={
              isRetrying ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <RefreshOutlinedIcon />
              )
            }
          >
            {isRetrying ? 'Verificando...' : 'Tentar novamente'}
          </Button>
        </Stack>
      </Paper>
    </FocusShell>
  );
}

/**
 * Trava as telas da aplicação enquanto não existir loja do Mercado Livre
 * conectada. Vale para navegação interna e para URL digitada.
 */
export function AppOnboardingGuard() {
  const { isResolving, error, hasConnection, refresh, isLoading } = useConnections();

  if (isResolving) return <ResolvingScreen />;
  if (error) {
    return (
      <ConnectionCheckFailed
        message={error}
        onRetry={() => void refresh()}
        isRetrying={isLoading}
      />
    );
  }
  if (!hasConnection) return <Navigate to="/onboarding/connect" replace />;

  return <Outlet />;
}

/** Espelho do guard acima: com conexão ativa, o onboarding deixa de existir. */
export function OnboardingStepGuard() {
  const { isResolving, error, hasConnection, refresh, isLoading } = useConnections();

  if (isResolving) return <ResolvingScreen />;
  if (error) {
    return (
      <ConnectionCheckFailed
        message={error}
        onRetry={() => void refresh()}
        isRetrying={isLoading}
      />
    );
  }
  if (hasConnection) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}
