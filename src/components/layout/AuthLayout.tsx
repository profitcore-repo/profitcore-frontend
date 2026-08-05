import type { ReactNode } from 'react';
import { Box, Paper, Stack, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Logo } from '@/components/Logo';
import { brandColors } from '@/theme/theme';

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
            border: `1px solid ${brandColors.border}`,
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
        color: '#fff',
        background: `radial-gradient(1200px 600px at -10% -20%, ${brandColors.midBlue}33, transparent 60%),
                     radial-gradient(900px 500px at 110% 120%, ${brandColors.green}22, transparent 60%),
                     linear-gradient(160deg, ${brandColors.deepBlue} 0%, #1A1F8A 100%)`,
        overflow: 'hidden',
      }}
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
        <Logo variant="mark" size={44} />
        <Typography sx={{ fontWeight: 700, fontSize: 20, letterSpacing: '-0.01em' }}>
          <Box component="span" sx={{ color: brandColors.brightGreen }}>
            Profit
          </Box>
          <Box component="span" sx={{ color: '#B7C4FF' }}>
            Core
          </Box>
        </Typography>
      </Stack>

      <Stack spacing={2} sx={{ maxWidth: 460 }}>
        <Typography variant="h3" sx={{ lineHeight: 1.1 }}>
          Decisões mais rápidas.
          <Box component="span" sx={{ color: brandColors.brightGreen }}>
            {' '}Resultado maior.
          </Box>
        </Typography>
        <Typography sx={{ opacity: 0.85, fontSize: 16 }}>
          Painel centralizado para acompanhar performance e integrar suas contas
          de mídia em um só lugar.
        </Typography>
      </Stack>

      <Typography variant="caption" sx={{ opacity: 0.6 }}>
        © {new Date().getFullYear()} ProfitCore
      </Typography>
    </Box>
  );
}
