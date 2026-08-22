import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import type { SvgIconProps } from '@mui/material/SvgIcon';
import type { ComponentType } from 'react';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import { Logo } from '@/components/Logo';
import { MercadoLivreMark } from '@/components/brand/MercadoLivreMark';
import { brandCore } from '@/theme/tokens';

const { color, radius } = brandCore;

const TILE_SIZE = 80;

type Benefit = {
  icon: ComponentType<SvgIconProps>;
  title: string;
  description: string;
  /** Verde = valor entregue. Neutro = garantia/limite de escopo. */
  tone: 'accent' | 'neutral';
};

const BENEFITS: readonly Benefit[] = [
  {
    icon: CheckCircleOutlinedIcon,
    title: 'Leitura de pedidos',
    description: 'Importamos apenas histórico de vendas.',
    tone: 'accent',
  },
  {
    icon: CheckCircleOutlinedIcon,
    title: 'Sincronização de SKUs',
    description: 'Mapeamento automático de catálogo.',
    tone: 'accent',
  },
  {
    icon: LockOutlinedIcon,
    title: 'Acesso somente leitura',
    description: 'Não alteramos seus anúncios.',
    tone: 'neutral',
  },
  {
    icon: VerifiedUserOutlinedIcon,
    title: 'API oficial',
    description: '100% seguro e homologado.',
    tone: 'neutral',
  },
] as const;

type MercadoLivreConnectCardProps = {
  onConnect: () => void;
  isConnecting?: boolean;
  errorMessage?: string | null;
};

export function MercadoLivreConnectCard({
  onConnect,
  isConnecting = false,
  errorMessage = null,
}: MercadoLivreConnectCardProps) {
  return (
    <Box
      sx={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        py: { xs: 2, md: 3 },
        overflow: 'hidden',
      }}
    >

      <Paper
        elevation={0}
        sx={{
          position: 'relative',
          width: '100%',
          maxWidth: 768,
          bgcolor: 'background.paper',
          border: `1px solid ${color.borderNavy}`,
          borderRadius: `${radius.md}px`,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
          overflow: 'hidden',
        }}
      >

        <Stack
          spacing={0}
          sx={{
            alignItems: 'center',
            textAlign: 'center',
            px: { xs: 3, md: 6 },
            py: { xs: 5, md: 6 },
          }}
        >
          <Stack
            direction="row"
            spacing={4}
            sx={{ alignItems: 'center', justifyContent: 'center', mb: 6 }}
          >
            <Box
              sx={{
                width: TILE_SIZE,
                height: TILE_SIZE,
                borderRadius: `${radius.lg}px`,
                bgcolor: color.surfaceContainer,
                border: `1px solid ${color.borderNavy}`,
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <Logo variant="mark" size={48} />
            </Box>

            <Connector />

            <Box
              sx={{
                width: TILE_SIZE,
                height: TILE_SIZE,
                borderRadius: `${radius.lg}px`,
                bgcolor: color.mercadoLivreYellow,
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <MercadoLivreMark size={48} />
            </Box>
          </Stack>

          <Typography variant="h3" component="h1" sx={{ mb: 2 }}>
            Conecte sua conta do Mercado Livre
          </Typography>

          <Typography
            variant="subtitle1"
            sx={{ color: 'text.secondary', maxWidth: 576, mb: 5 }}
          >
            Importe seus dados de vendas e SKUs para começar a analisar seu lucro
            real. Uma visão clara dos seus números.
          </Typography>

          {errorMessage && (
            <Alert severity="error" sx={{ width: '100%', maxWidth: 384, mb: 2 }}>
              {errorMessage}
            </Alert>
          )}

          <Button
            variant="contained"
            onClick={onConnect}
            disabled={isConnecting}
            fullWidth
            endIcon={
              isConnecting ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <ArrowForwardIcon />
              )
            }
            sx={{
              maxWidth: 384,
              py: 1.75,
              px: 3,
              letterSpacing: '0.01em',
              '& .MuiButton-endIcon': {
                transition: 'transform 200ms ease-out',
              },
              '&:hover .MuiButton-endIcon': {
                transform: 'translateX(4px)',
              },
              '@media (prefers-reduced-motion: reduce)': {
                '&:hover .MuiButton-endIcon': { transform: 'none' },
              },
            }}
          >
            {isConnecting ? 'Conectando...' : 'Conectar agora'}
          </Button>
        </Stack>

        <Box
          sx={{
            borderTop: `1px solid ${color.borderNavy}`,
            px: { xs: 3, md: 4 },
            py: 4,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
              gap: 4,
              maxWidth: 672,
              width: '100%',
            }}
          >
            {BENEFITS.map(({ icon: Icon, title, description, tone }) => (
              <Stack key={title} direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
                <Icon
                  sx={{
                    fontSize: 20,
                    mt: 0.25,
                    flexShrink: 0,
                    color: tone === 'accent' ? 'primary.main' : color.outline,
                  }}
                />
                <Stack spacing={0.5}>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {description}
                  </Typography>
                </Stack>
              </Stack>
            ))}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}

/** Trilha entre as duas marcas, com preenchimento verde em loop e ícone de elo. */
function Connector() {
  return (
    <Stack sx={{ alignItems: 'center' }} aria-hidden>
      <Box
        sx={{
          position: 'relative',
          width: 64,
          height: 2,
          bgcolor: color.borderNavy,
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            bgcolor: 'primary.main',
            transformOrigin: 'left',
            animation: 'pcConnectorFill 2s ease-in-out infinite alternate',
            '@keyframes pcConnectorFill': {
              from: { transform: 'scaleX(0)' },
              to: { transform: 'scaleX(1)' },
            },
            '@media (prefers-reduced-motion: reduce)': {
              animation: 'none',
              transform: 'scaleX(1)',
              opacity: 0.5,
            },
          }}
        />
      </Box>
      <Box
        sx={{
          mt: '-20px',
          px: 1,
          bgcolor: 'background.paper',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <LinkOutlinedIcon sx={{ fontSize: 18, color: color.outline, display: 'block' }} />
      </Box>
    </Stack>
  );
}

