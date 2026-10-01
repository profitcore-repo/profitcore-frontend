import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import { ProfitabilitySummary } from '@/features/profitability/ProfitabilitySummary';
import { ProfitabilityTable } from '@/features/profitability/ProfitabilityTable';
import { formatPeriod } from '@/features/profitability/profitability';
import {
  PROFITABILITY_RANGES,
  useSkuProfitability,
} from '@/hooks/useSkuProfitability';

/**
 * Lucratividade: a conta fechada de cada SKU no período.
 *
 * Diferente de `/products`, que é onde o seller informa o CMV, esta tela só lê:
 * mostra o que o backend apurou cruzando pedidos, taxas, frete e custo
 * informado. Quando falta CMV, a tela aponta de volta para `/products`.
 */
export function ProfitabilityPage() {
  const { analysis, days, setDays, isResolving, isLoading, error, refresh } =
    useSkuProfitability();

  const busy = isResolving || isLoading;

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}
      >
        <Stack spacing={0.5}>
          <Typography variant="overline" color="text.secondary">
            Resultado por produto
          </Typography>
          <Typography variant="h4" component="h1">
            Lucratividade
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 760 }}>
            O que cada anúncio deixou depois das taxas do Mercado Livre, do frete,
            das cobranças de billing e do CMV que você informou.
          </Typography>
          {analysis && (
            <Typography variant="caption" color="text.secondary">
              Período analisado: {formatPeriod(analysis.fromUtc, analysis.toUtc)}
              {analysis.topProducts.length > 0 &&
                ` · ${analysis.topProducts.length} ${
                  analysis.topProducts.length === 1 ? 'produto' : 'produtos'
                } com venda`}
            </Typography>
          )}
        </Stack>

        <Button
          component={RouterLink}
          to="/products"
          variant="outlined"
          sx={{ flexShrink: 0, alignSelf: { xs: 'flex-start', sm: 'center' } }}
        >
          Revisar CMV
        </Button>
      </Stack>

      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: 'center', flexWrap: 'wrap' }}
        useFlexGap
      >
        {PROFITABILITY_RANGES.map((range) => (
          <Chip
            key={range.days}
            label={range.label}
            variant={days === range.days ? 'filled' : 'outlined'}
            color={days === range.days ? 'primary' : 'default'}
            onClick={() => setDays(range.days)}
            disabled={busy}
            aria-pressed={days === range.days}
            sx={{ cursor: busy ? 'default' : 'pointer' }}
          />
        ))}

        <Box sx={{ flex: 1 }} />

        <Tooltip title="Recalcular">
          <span>
            <IconButton
              onClick={() => void refresh()}
              disabled={busy}
              aria-label="Recalcular resultado"
            >
              <RefreshOutlinedIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>

      {error && (
        <Alert
          severity="error"
          action={
            <IconButton
              aria-label="Tentar novamente"
              color="inherit"
              size="small"
              onClick={() => void refresh()}
            >
              <RefreshOutlinedIcon fontSize="small" />
            </IconButton>
          }
        >
          Não foi possível calcular o resultado dos seus produtos: {error}
        </Alert>
      )}

      {!error && (
        <>
          <ProfitabilitySummary analysis={analysis} isLoading={busy} />
          <ProfitabilityTable
            products={analysis?.topProducts ?? []}
            isLoading={busy}
          />
        </>
      )}

      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <WarningAmberOutlinedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
        <Typography variant="caption" color="text.secondary">
          Impostos não entram nesta conta. Pedidos cancelados permanecem na
          receita do período, como o Mercado Livre os reporta.
        </Typography>
      </Stack>
    </Stack>
  );
}
