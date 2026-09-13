import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Button,
  CircularProgress,
  LinearProgress,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import { SkuCostRow } from '@/features/skus/SkuCostRow';
import { CMV_REQUIRED_SKUS } from '@/features/skus/cmv';
import {
  countInformedCmv,
  hasAnySales,
  selectMainSkus,
} from '@/features/skus/skuSales';
import {
  ONBOARDING_STEP_ORDER,
  requiredCostCount,
} from '@/features/onboarding/onboardingSteps';
import { useSkuCosts } from '@/hooks/useSkuCosts';
import { useSkuSales } from '@/hooks/useSkuSales';
import { brandCore } from '@/theme/tokens';
import type { SkuImportResult } from '@/types/api';

const { color } = brandCore;

const STEP_NUMBER = ONBOARDING_STEP_ORDER.indexOf('cmv') + 1;
const STEP_TOTAL = ONBOARDING_STEP_ORDER.length;

/**
 * Segundo passo da primeira configuração: o seller informa o CMV dos produtos
 * que mais vendem. O Mercado Livre não fornece custo de compra, então sem isso
 * não existe leitura de margem — daí o passo ser obrigatório.
 */
export function OnboardingCmvPage() {
  const navigate = useNavigate();
  const { skus, isResolving, isImporting, error, importSkus, saveCmv } = useSkuCosts();

  const { salesIndex } = useSkuSales();
  const [lastImport, setLastImport] = useState<SkuImportResult | null>(null);

  const entries = useMemo(() => {
    if (!skus) return null;
    return selectMainSkus(skus, salesIndex, CMV_REQUIRED_SKUS);
  }, [skus, salesIndex]);

  const required = skus ? requiredCostCount(skus) : 0;
  const informed = skus ? countInformedCmv(skus) : 0;
  const ready = required > 0 && informed >= required;

  const handleSave = useCallback(
    async (skuId: string, cmv: number | null) => {
      await saveCmv(skuId, cmv);
    },
    [saveCmv],
  );

  const handleImport = useCallback(async () => {
    setLastImport(await importSkus());
  }, [importSkus]);

  return (
    <Stack spacing={3}>
      <Stack spacing={0.75} sx={{ textAlign: 'center' }}>
        <Typography
          variant="overline"
          sx={{ color: 'primary.main', letterSpacing: '0.12em' }}
        >
          Primeira configuração
        </Typography>
        <Typography variant="h4" component="h1">
          Informe o custo dos seus principais produtos
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: color.textMuted, mx: 'auto', maxWidth: 620 }}
        >
          Passo {STEP_NUMBER} de {STEP_TOTAL} — o Mercado Livre não informa quanto
          você pagou pelo produto. Com o CMV a gente calcula seu lucro real.
        </Typography>
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}

      {lastImport && (
        <Alert severity="success">
          {lastImport.totalFoundInMercadoLivre} anúncios encontrados no Mercado
          Livre · {lastImport.created} novos
          {lastImport.skipped > 0
            ? ` · ${lastImport.skipped} já cadastrados, mantidos como estavam`
            : ''}
          .
        </Alert>
      )}

      {isResolving && (
        <Stack spacing={1.5}>
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} variant="rectangular" height={96} />
          ))}
        </Stack>
      )}

      {!isResolving && skus && skus.length === 0 && (
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 4 },
            border: `1px dashed ${color.borderNavy}`,
            bgcolor: 'background.paper',
          }}
        >
          <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
            <Stack spacing={0.5}>
              <Typography variant="h6">Nenhum produto importado ainda</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Vamos buscar seus anúncios no Mercado Livre para você informar o
                custo dos que mais vendem.
              </Typography>
            </Stack>
            <Button
              variant="contained"
              onClick={() => void handleImport()}
              disabled={isImporting}
              startIcon={
                isImporting ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <DownloadOutlinedIcon />
                )
              }
            >
              {isImporting ? 'Importando...' : 'Importar meus produtos'}
            </Button>
          </Stack>
        </Paper>
      )}

      {!isResolving && entries && entries.length > 0 && (
        <>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.5, md: 3 },
              border: `1px solid ${color.borderNavy}`,
              bgcolor: 'background.paper',
            }}
          >
            <Stack spacing={1.25}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={0.5}
                sx={{ justifyContent: 'space-between', alignItems: { sm: 'baseline' } }}
              >
                <Typography variant="h6">
                  {informed} de {required} custos informados
                </Typography>
                <Typography variant="body2" sx={{ color: color.textMuted }}>
                  Custo zero é válido. Deixe vazio para marcar como não informado.
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={
                  required > 0 ? (Math.min(informed, required) / required) * 100 : 0
                }
                aria-label="Progresso do preenchimento de CMV"
                sx={{ height: 6, borderRadius: 3 }}
              />
            </Stack>
          </Paper>

          {!hasAnySales(entries) && (
            <Alert severity="info">
              Não encontramos vendas dos seus SKUs nos últimos 30 dias, então
              listamos os primeiros da sua base.
            </Alert>
          )}

          <Stack spacing={1.5}>
            {entries.map((entry) => (
              <SkuCostRow key={entry.sku.id} entry={entry} onSave={handleSave} />
            ))}
          </Stack>

          {ready && (
            <Alert severity="success">
              Pronto. Já conseguimos calcular a margem desses produtos.
            </Alert>
          )}

          <Button
            variant="contained"
            size="large"
            disabled={!ready}
            endIcon={<ArrowForwardIcon />}
            onClick={() => navigate('/dashboard', { replace: true })}
            sx={{ alignSelf: { xs: 'stretch', sm: 'flex-start' } }}
          >
            Ver minha leitura
          </Button>
        </>
      )}
    </Stack>
  );
}
