import { Alert, Chip, Stack, Typography } from '@mui/material';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import { ProfitabilitySummary } from '@/features/profitability/ProfitabilitySummary';
import { ProfitabilityTable } from '@/features/profitability/ProfitabilityTable';
import { formatPeriod } from '@/features/profitability/profitability';
import { MOCK_PROFITABILITY_ANALYSIS } from '@/features/profitability/profitabilityMockData';

/**
 * Prévia da tela de lucratividade com dados fictícios.
 *
 * Serve para apresentar o formato da leitura de lucro (KPIs, cobertura de CMV
 * e a tabela por produto) sem depender da API nem de uma loja conectada. Os
 * valores vêm de uma análise de exemplo, não de uma loja real — por isso fica
 * restrita a admins, assim como `/profitability` (ver `AdminOnlyRoute`).
 */
export function ProfitabilityMockPage() {
  const { summary, fromUtc, toUtc, topProducts } = MOCK_PROFITABILITY_ANALYSIS;

  return (
    <Stack spacing={3}>
      <Stack spacing={0.5}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <Typography variant="overline" color="text.secondary">
            Prévia · dados fictícios
          </Typography>
          <Chip
            size="small"
            icon={<ScienceOutlinedIcon fontSize="small" />}
            label="Mock"
            color="warning"
            variant="outlined"
          />
        </Stack>
        <Typography variant="h4" component="h1">
          Lucratividade (exemplo)
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 760 }}>
          Mesma leitura de /profitability, mas com uma análise de exemplo no
          lugar da API. Útil para validar o formato da tela com o time antes
          de a leitura real sair da validação interna.
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Período de exemplo: {formatPeriod(fromUtc, toUtc)} ·{' '}
          {summary.distinctProductsCount}{' '}
          {summary.distinctProductsCount === 1 ? 'produto' : 'produtos'} com
          venda
        </Typography>
      </Stack>

      <Alert severity="warning" icon={<ScienceOutlinedIcon fontSize="small" />}>
        Esta página mostra dados fictícios para demonstração. Nenhum valor aqui
        vem da sua conta do Mercado Livre.
      </Alert>

      <ProfitabilitySummary
        analysis={MOCK_PROFITABILITY_ANALYSIS}
        isLoading={false}
      />
      <ProfitabilityTable products={topProducts} isLoading={false} />
    </Stack>
  );
}
