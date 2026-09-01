import type { ReactNode } from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/hooks/useAuth';
import { brandCore } from '@/theme/tokens';

const { color } = brandCore;

/** Logo.wordmark deriva a fonte de `size * 0.32`; 63 => 20px. */
const WORDMARK_SIZE = 63;

type FocusShellProps = {
  children: ReactNode;
};

/**
 * Casca de tela única: sem sidebar, sem header e sem navegação. Usada quando o
 * usuário precisa concluir ou aguardar uma etapa antes de entrar na aplicação
 * (primeira configuração, retorno de integração). O único escape é sair da conta.
 */
export function FocusShell({ children }: FocusShellProps) {
  const { user, signOut } = useAuth();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        px: { xs: 2, sm: 3 },
        py: { xs: 3, md: 5 },
      }}
    >
      <Stack
        spacing={{ xs: 3, md: 4 }}
        sx={{ width: '100%', maxWidth: 880, mx: 'auto' }}
      >
        <Stack
          direction="row"
          spacing={2}
          sx={{ alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0 }}>
            <Logo variant="mark" size={36} />
            <Logo variant="wordmark" size={WORDMARK_SIZE} />
          </Stack>

          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0 }}>
            <Typography
              variant="caption"
              sx={{
                color: color.textMuted,
                display: { xs: 'none', sm: 'block' },
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user?.email ?? ''}
            </Typography>
            <Button
              size="small"
              variant="text"
              startIcon={<LogoutOutlinedIcon fontSize="small" />}
              onClick={() => void signOut()}
              sx={{ color: 'text.secondary', flexShrink: 0 }}
            >
              Sair
            </Button>
          </Stack>
        </Stack>

        <Box>{children}</Box>
      </Stack>
    </Box>
  );
}
