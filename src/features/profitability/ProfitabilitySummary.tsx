import {
  Alert,
  LinearProgress,
  Paper,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import {
  computeCoverage,
  formatPercent,
} from '@/features/profitability/profitability';
import { brandCore } from '@/theme/tokens';
import { formatBRL } from '@/utils/currency';
import type { MercadoLivreTopProductsAnalysisResponse } from '@/types/api';

const { color } = brandCore;

const TILE_COUNT = 5;

type ProfitabilitySummaryProps = {
  analysis: MercadoLivreTopProductsAnalysisResponse | null;
  isLoading: boolean;
};

/**
 * Faixa de KPIs do período mais a cobertura da leitura.
 *
 * A cobertura não é enfeite: sem ela o seller lê o lucro consolidado como se
 * fosse completo, quando produtos sem CMV entraram na conta com custo de
 * mercadoria zero.
 */
export function ProfitabilitySummary({
  analysis,
  isLoading,
}: ProfitabilitySummaryProps) {
  if (isLoading || !analysis) {
    return (
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        useFlexGap
        sx={{ flexWrap: 'wrap' }}
      >
        {Array.from({ length: TILE_COUNT }).map((_, i) => (
          <Paper
            key={i}
            elevation={0}
            sx={{
              px: 2.5,
              py: 2,
              flex: '1 1 180px',
              border: `1px solid ${color.borderNavy}`,
              bgcolor: 'background.paper',
            }}
          >
            <Skeleton variant="text" width="70%" height={32} />
            <Skeleton variant="text" width="90%" height={16} />
          </Paper>
        ))}
      </Stack>
    );
  }

  const { summary, topProducts } = analysis;
  const coverage = computeCoverage(topProducts, summary);
  const isProfitable = summary.netProfit >= 0;
  const shipping = summary.totalShippingCostFromApi;

  return (
    <Stack spacing={2}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        useFlexGap
        sx={{ flexWrap: 'wrap' }}
      >
        <Tile
          label="Produtos vendidos"
          value={String(summary.distinctProductsCount)}
          hint={`${summary.totalUnitsSold} ${
            summary.totalUnitsSold === 1 ? 'unidade' : 'unidades'
          } em ${summary.ordersCount} ${
            summary.ordersCount === 1 ? 'pedido' : 'pedidos'
          }`}
        />
        <Tile
          label="Receita bruta"
          value={formatBRL(summary.grossRevenue)}
          hint={`Líquida de taxas: ${formatBRL(summary.netRevenue)}`}
        />
        <Tile
          label="Lucro líquido"
          value={formatBRL(summary.netProfit)}
          tone={isProfitable ? 'positive' : 'negative'}
          hint={`Margem de ${formatPercent(summary.netMarginPercent)}`}
        />
        <Tile
          label="Custos totais"
          value={formatBRL(summary.totalAllCosts)}
          hint={`Taxas ${formatBRL(summary.totalSaleFees)} · Frete ${formatBRL(
            shipping,
          )} · CMV ${formatBRL(summary.totalCogs)}`}
        />
        <Tile
          label="Produtos sem CMV"
          value={String(summary.productsWithoutCmvCount)}
          tone={summary.productsWithoutCmvCount > 0 ? 'negative' : 'neutral'}
          hint={`${summary.productsWithCmvCount} com custo informado`}
        />
      </Stack>

      <Paper
        elevation={0}
        sx={{
          px: { xs: 2, md: 2.5 },
          py: 2,
          border: `1px solid ${color.borderNavy}`,
          bgcolor: 'background.paper',
        }}
      >
        <Stack spacing={1.25}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <InfoOutlinedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
            <Typography variant="subtitle2">Cobertura da leitura</Typography>
          </Stack>

          <LinearProgress
            variant="determinate"
            value={Math.min(100, Math.round(coverage.ratio * 100))}
            color={coverage.hasGaps ? 'warning' : 'success'}
            aria-label="Percentual da receita com CMV informado"
            sx={{ height: 4, borderRadius: 2 }}
          />

          <Typography variant="caption" color="text.secondary">
            {coverage.totalRevenue > 0
              ? `${Math.round(coverage.ratio * 100)}% da receita analisada tem CMV informado (${formatBRL(coverage.coveredRevenue)} de ${formatBRL(coverage.totalRevenue)}).`
              : 'Sem receita no período para medir a cobertura.'}
          </Typography>

          {summary.shipmentsMissingCount > 0 && (
            <Typography variant="caption" color="text.secondary">
              {summary.shipmentsMissingCount}{' '}
              {summary.shipmentsMissingCount === 1 ? 'remessa' : 'remessas'} não
              retornaram custo de frete e entraram na conta como zero. Frete
              pendente não é frete gratuito.
            </Typography>
          )}

          {coverage.hasGaps && (
            <Alert severity="warning" icon={<InfoOutlinedIcon />}>
              {summary.productsWithoutCmvCount}{' '}
              {summary.productsWithoutCmvCount === 1 ? 'produto' : 'produtos'}{' '}
              sem CMV informado entraram na conta com custo de mercadoria zero.
              O lucro exibido para essas linhas está acima do real.
            </Alert>
          )}
        </Stack>
      </Paper>
    </Stack>
  );
}

function Tile({
  label,
  value,
  hint,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  hint: string;
  tone?: 'neutral' | 'positive' | 'negative';
}) {
  const valueColor =
    tone === 'positive'
      ? 'primary.main'
      : tone === 'negative'
        ? 'error.main'
        : 'text.primary';

  return (
    <Paper
      elevation={0}
      sx={{
        px: 2.5,
        py: 2,
        flex: '1 1 180px',
        minWidth: 0,
        border: `1px solid ${color.borderNavy}`,
        bgcolor: 'background.paper',
      }}
    >
      <Stack spacing={0.25} sx={{ minWidth: 0 }}>
        <Typography
          variant="h5"
          sx={{
            fontVariantNumeric: 'tabular-nums',
            color: valueColor,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {value}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Tooltip title={hint}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              opacity: 0.8,
            }}
          >
            {hint}
          </Typography>
        </Tooltip>
      </Stack>
    </Paper>
  );
}
