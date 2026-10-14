import { Paper, Skeleton, Stack, Tooltip, Typography } from '@mui/material';
import { brandCore } from '@/theme/tokens';
import { formatBRL } from '@/utils/currency';
import { formatPercent } from '@/features/profitability/profitability';
import type { MercadoLivreTopProductsAnalysisResponse } from '@/types/api';

const { color } = brandCore;

const TILE_COUNT = 4;

const DATA_QUALITY_LABEL: Record<string, string> = {
  complete: 'Completos',
  partial: 'Parciais',
  incomplete: 'Incompletos',
};

type HomeStatsProps = {
  analysis: MercadoLivreTopProductsAnalysisResponse | null;
  isLoading: boolean;
};

function plural(count: number, one: string, many: string): string {
  return count === 1 ? one : many;
}

/**
 * Os quatro números que enquadram o período antes das situações.
 *
 * A contribuição é o número central e muda de nome conforme o dado: com CMV
 * completo é a contribuição do período; faltando CMV em qualquer anúncio, o
 * backend devolve `netProfit: null` e o que existe é a contribuição **antes**
 * do CMV. Exibir um sem dizer que é o outro inventaria lucro.
 */
export function HomeStats({ analysis, isLoading }: HomeStatsProps) {
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
              flex: '1 1 200px',
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

  const { summary, pagination, dataQuality } = analysis;
  const hasFullCmv = summary.netProfit !== null;
  const contribution = summary.netProfit ?? summary.contributionBeforeCogs;
  const contributionPercent =
    summary.netMarginPercent ?? summary.contributionBeforeCogsPercent;

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={2}
      useFlexGap
      sx={{ flexWrap: 'wrap' }}
    >
      <Tile
        label="Receita elegível"
        value={formatBRL(summary.eligibleRevenue)}
        hint={`${summary.ordersCount} ${plural(
          summary.ordersCount,
          'pedido',
          'pedidos',
        )} · ${summary.totalUnitsSold} ${plural(
          summary.totalUnitsSold,
          'unidade',
          'unidades',
        )}`}
      />
      <Tile
        label={hasFullCmv ? 'Contribuição do período' : 'Contribuição antes do CMV'}
        value={formatBRL(contribution)}
        tone={contribution < 0 ? 'negative' : 'positive'}
        hint={
          hasFullCmv
            ? `${formatPercent(contributionPercent)} da receita · já descontados tarifas, frete e CMV`
            : `${formatPercent(contributionPercent)} da receita · o CMV ainda será descontado`
        }
      />
      <Tile
        label="Anúncios analisados"
        value={String(summary.distinctProductsCount)}
        hint={`${summary.productsWithCmvCount} com CMV informado · agregados por anúncio (MLB)`}
      />
      <Tile
        label="Dados do período"
        value={DATA_QUALITY_LABEL[dataQuality.level] ?? dataQuality.level}
        tone={dataQuality.level === 'complete' ? 'positive' : 'warning'}
        hint={`Paginação ${
          pagination.paginationComplete ? 'conferida' : 'incompleta'
        } · ${pagination.duplicateOrderIdsCount} ${plural(
          pagination.duplicateOrderIdsCount,
          'duplicado',
          'duplicados',
        )}`}
      />
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
  tone?: 'neutral' | 'positive' | 'negative' | 'warning';
}) {
  const valueColor =
    tone === 'positive'
      ? 'primary.main'
      : tone === 'negative'
        ? 'error.main'
        : tone === 'warning'
          ? 'warning.main'
          : 'text.primary';

  return (
    <Paper
      elevation={0}
      sx={{
        px: 2.5,
        py: 2,
        flex: '1 1 200px',
        minWidth: 0,
        border: `1px solid ${color.borderNavy}`,
        bgcolor: 'background.paper',
      }}
    >
      <Stack spacing={0.25} sx={{ minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
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
