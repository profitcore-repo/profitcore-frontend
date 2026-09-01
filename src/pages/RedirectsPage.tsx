import { Link as RouterLink, Navigate } from 'react-router-dom';
import {
  Alert,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { FocusShell } from '@/components/layout/FocusShell';
import { useRedirectCallback } from '@/hooks/useRedirectCallback';
import { brandCore } from '@/theme/tokens';

type CardProps = {
  title: string;
  children: React.ReactNode;
};

function RedirectCard({ title, children }: CardProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 3, md: 4 },
        border: `1px solid ${brandCore.color.borderNavy}`,
        bgcolor: 'background.paper',
      }}
    >
      <Stack spacing={2.5} sx={{ alignItems: 'flex-start' }}>
        <Typography variant="h6">{title}</Typography>
        {children}
      </Stack>
    </Paper>
  );
}

/**
 * `/connections` resolve os dois casos: quem já tem loja cai na tela de
 * gerenciamento e quem não tem é levado pelo guard à primeira configuração.
 * Nas duas pontas existe o card de conexão.
 */
function RetryButton() {
  return (
    <Button component={RouterLink} to="/connections" variant="contained" replace>
      Tentar de novo
    </Button>
  );
}

/**
 * Ponto de retorno das integrações externas (`/redirects` e
 * `/redirects/:provider`). Fica fora dos guards de onboarding: um usuário que
 * ainda não concluiu a primeira configuração precisa poder receber o callback.
 */
export function RedirectsPage() {
  const state = useRedirectCallback();

  if (state.status === 'done') {
    return <Navigate to={state.redirectTo} replace />;
  }

  if (state.status === 'processing') {
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
          <Stack
            direction="row"
            spacing={2}
            role="status"
            aria-live="polite"
            sx={{ alignItems: 'center' }}
          >
            <CircularProgress size={24} aria-hidden />
            <Stack spacing={0.25}>
              <Typography sx={{ fontWeight: 600 }}>
                Finalizando conexão com o {state.handler.label}...
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Não feche esta janela.
              </Typography>
            </Stack>
          </Stack>
        </Paper>
      </FocusShell>
    );
  }

  if (state.status === 'denied') {
    return (
      <FocusShell>
        <RedirectCard title="Autorização não concedida">
          <Alert severity="warning" sx={{ width: '100%' }}>
            {state.message}
          </Alert>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Sem a autorização não conseguimos importar suas vendas. Você pode
            tentar de novo quando quiser.
          </Typography>
          <RetryButton />
        </RedirectCard>
      </FocusShell>
    );
  }

  if (state.status === 'failed') {
    return (
      <FocusShell>
        <RedirectCard title={`Não foi possível concluir com o ${state.handler.label}`}>
          <Alert severity="error" sx={{ width: '100%' }}>
            {state.message}
          </Alert>
          <RetryButton />
        </RedirectCard>
      </FocusShell>
    );
  }

  return (
    <FocusShell>
      <RedirectCard title="Retorno não reconhecido">
        <Alert severity="warning" sx={{ width: '100%' }}>
          {state.reason}
        </Alert>
        <Button component={RouterLink} to="/dashboard" variant="contained" replace>
          Ir para o painel
        </Button>
      </RedirectCard>
    </FocusShell>
  );
}
