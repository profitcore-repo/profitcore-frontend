import type { ReactNode } from 'react';
import { Box, Paper, Stack, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Logo } from '@/components/Logo';
import { brandCore } from '@/theme/tokens';

type AuthLayoutProps = {
  children: ReactNode;
  /** Máx. largura da caixa do formulário. Default: 460 (bom para 4-6 campos). */
  maxWidth?: number;
};

export function AuthLayout({ children, maxWidth = 460 }: AuthLayoutProps) {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1.05fr 1fr' },
      }}
    >
      {isMdUp && <BrandPanel />}

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: { xs: 2.5, sm: 4 },
          py: { xs: 4, md: 6 },
          bgcolor: 'background.default',
        }}
      >
        <Paper
          elevation={0}
          sx={{
            width: '100%',
            maxWidth,
            p: { xs: 3, sm: 4 },
            bgcolor: 'background.paper',
            border: `1px solid ${brandCore.color.borderNavy}`,
          }}
        >
          <Stack spacing={3}>
            {!isMdUp && (
              <Stack spacing={1.5} sx={{ mb: 1, alignItems: 'center' }}>
                <Logo size={64} />
              </Stack>
            )}
            {children}
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
}

function BrandPanel() {
  return (
    <Box
      sx={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        p: 6,
        color: 'text.primary',
        borderRight: `1px solid ${brandCore.color.borderNavy}`,
        background: `radial-gradient(1200px 600px at -10% -20%, ${brandCore.color.profitGreen}1F, transparent 60%),
                     radial-gradient(900px 500px at 110% 120%, ${brandCore.color.surfaceNavy}CC, transparent 60%),
                     linear-gradient(160deg, ${brandCore.color.surfaceNavy} 0%, ${brandCore.color.base} 100%)`,
        overflow: 'hidden',
      }}
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
        <Logo variant="mark" size={44} />
        <Logo variant="wordmark" size={63} />
      </Stack>

      <Stack spacing={2} sx={{ maxWidth: 460 }}>
        <Typography variant="h3" sx={{ lineHeight: 1.15 }}>
          Decisões mais rápidas.
          <Box component="span" sx={{ color: 'primary.main' }}>
            {' '}Resultado maior.
          </Box>
        </Typography>
        <Typography sx={{ color: 'text.secondary', fontSize: 16 }}>
          Painel centralizado para acompanhar performance e integrar suas contas
          de mídia em um só lugar.
        </Typography>
      </Stack>

      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        © {new Date().getFullYear()} ProfitCore
      </Typography>
    </Box>
  );
}
