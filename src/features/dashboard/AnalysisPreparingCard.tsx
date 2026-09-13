import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import RadioButtonUncheckedOutlinedIcon from '@mui/icons-material/RadioButtonUncheckedOutlined';
import QueryStatsOutlinedIcon from '@mui/icons-material/QueryStatsOutlined';
import { countInformedCmv } from '@/features/skus/skuSales';
import { useConnections } from '@/hooks/useConnections';
import { useSkuCosts } from '@/hooks/useSkuCosts';
import { brandCore } from '@/theme/tokens';

const { color, radius } = brandCore;

type Checkpoint = {
  label: string;
  detail: string;
  done: boolean;
};

type AnalysisPreparingCardProps = {
  /** Pedidos retornados na janela consultada pelo painel. */
  ordersCount: number | null;
};

/**
 * Comunica que a leitura de lucro está em preparação.
 *
 * Todos os números vindos daqui são reais — loja conectada, pedidos importados,
 * SKUs e cobertura de CMV. A barra é indeterminada de propósito: não existe job
 * com percentual conhecido, e exibir progresso numérico seria invenção.
 */
export function AnalysisPreparingCard({ ordersCount }: AnalysisPreparingCardProps) {
  const { stores } = useConnections();
  const { skus } = useSkuCosts();

  const storeCount = stores?.length ?? 0;
  const skuCount = skus?.length ?? 0;
  const informed = skus ? countInformedCmv(skus) : 0;
  const missingCmv = Math.max(0, skuCount - informed);

  const checkpoints: Checkpoint[] = [
    {
      label: 'Conta conectada',
      detail:
        storeCount > 1
          ? `${storeCount} lojas do Mercado Livre`
          : 'Mercado Livre autorizado',
      done: storeCount > 0,
    },
    {
      label: 'Vendas importadas',
      detail:
        ordersCount === null
          ? 'Consultando seus pedidos'
          : `${ordersCount} ${ordersCount === 1 ? 'pedido lido' : 'pedidos lidos'} no período`,
      done: (ordersCount ?? 0) > 0,
    },
    {
      label: 'Produtos mapeados',
      detail: `${skuCount} ${skuCount === 1 ? 'SKU' : 'SKUs'} na sua base`,
      done: skuCount > 0,
    },
    {
      label: 'Custos informados',
      detail:
        skuCount === 0
          ? 'Aguardando importação dos produtos'
          : `${informed} de ${skuCount} com CMV`,
      done: skuCount > 0 && missingCmv === 0,
    },
  ];

  return (
    <Paper
      elevation={0}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        border: `1px solid ${color.borderNavy}`,
        borderRadius: `${radius.md}px`,
        bgcolor: 'background.paper',
        backgroundImage: `linear-gradient(135deg, ${alpha(
          color.profitGreen,
          0.06,
        )} 0%, transparent 55%)`,
      }}
    >
      <LinearProgress
        aria-label="Análise em preparação"
        sx={{
          height: 3,
          bgcolor: 'transparent',
          '& .MuiLinearProgress-bar': { bgcolor: color.profitGreen },
          '@media (prefers-reduced-motion: reduce)': {
            '& .MuiLinearProgress-bar': { animation: 'none', opacity: 0.5 },
          },
        }}
      />

      <Stack spacing={3} sx={{ p: { xs: 2.5, md: 3.5 } }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{ alignItems: { sm: 'flex-start' } }}
        >
          <Box
            sx={{
              width: 48,
              height: 48,
              flexShrink: 0,
              borderRadius: `${radius.md}px`,
              bgcolor: alpha(color.profitGreen, 0.1),
              color: 'primary.main',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <QueryStatsOutlinedIcon />
          </Box>

          <Stack spacing={0.75} sx={{ minWidth: 0 }}>
            <Typography variant="h6" component="h2">
              Estamos preparando sua análise
            </Typography>
            <Typography variant="body2" sx={{ color: color.textMuted, maxWidth: 620 }}>
              Já estamos consolidando suas vendas, tarifas do Mercado Livre, frete e
              custos para montar sua leitura de lucro real por produto. Os números
              abaixo são o que já temos em mãos.
            </Typography>
          </Stack>
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 1fr))',
              lg: 'repeat(4, minmax(0, 1fr))',
            },
          }}
        >
          {checkpoints.map(({ label, detail, done }) => (
            <Stack
              key={label}
              direction="row"
              spacing={1.25}
              sx={{ alignItems: 'flex-start', minWidth: 0 }}
            >
              {done ? (
                <CheckCircleOutlinedIcon
                  sx={{ fontSize: 18, mt: 0.25, color: 'primary.main', flexShrink: 0 }}
                />
              ) : (
                <RadioButtonUncheckedOutlinedIcon
                  sx={{ fontSize: 18, mt: 0.25, color: color.outline, flexShrink: 0 }}
                />
              )}
              <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {label}
                </Typography>
                <Typography variant="caption" sx={{ color: color.textMuted }}>
                  {detail}
                </Typography>
              </Stack>
            </Stack>
          ))}
        </Box>

        {missingCmv > 0 && (
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            sx={{
              alignItems: { sm: 'center' },
              justifyContent: 'space-between',
              pt: 2.5,
              borderTop: `1px solid ${color.borderNavy}`,
            }}
          >
            <Typography variant="body2" sx={{ color: color.textMuted }}>
              {missingCmv === 1
                ? 'Falta o custo de 1 produto para a análise cobrir todo o seu catálogo.'
                : `Faltam os custos de ${missingCmv} produtos para a análise cobrir todo o seu catálogo.`}
            </Typography>
            <Button
              component={RouterLink}
              to="/products"
              variant="outlined"
              size="small"
              sx={{ flexShrink: 0, alignSelf: { xs: 'flex-start', sm: 'auto' } }}
            >
              Completar custos
            </Button>
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}
