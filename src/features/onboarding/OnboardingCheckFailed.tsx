import {
  Alert,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import { FocusShell } from '@/components/layout/FocusShell';
import { brandCore } from '@/theme/tokens';

type OnboardingCheckFailedProps = {
  message: string;
  onRetry: () => void;
  isRetrying: boolean;
};

/**
 * Falha ao verificar em que passo o usuário está.
 *
 * Não redirecionamos nesse caso: mandar para o onboarding prenderia quem já
 * concluiu, e liberar a aplicação mostraria telas sem dados. Pedir nova
 * tentativa é a única opção honesta.
 */
export function OnboardingCheckFailed({
  message,
  onRetry,
  isRetrying,
}: OnboardingCheckFailedProps) {
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
              Não foi possível verificar sua configuração
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Precisamos consultar sua conexão e seus produtos antes de abrir a
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
