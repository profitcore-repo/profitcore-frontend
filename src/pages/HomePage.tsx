import { useMemo } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import { HomeStats } from '@/features/home/HomeStats';
import { PriorityCard } from '@/features/home/PriorityCard';
import { ReadingConfidence } from '@/features/home/ReadingConfidence';
import {
  buildPriorities,
  isSupportedSchema,
  readingConfidence,
} from '@/features/home/priorities';
import { formatPeriod } from '@/features/profitability/profitability';
import { useAuth } from '@/hooks/useAuth';
import { useConnections } from '@/hooks/useConnections';
import {
  PROFITABILITY_RANGES,
  useSkuProfitability,
} from '@/hooks/useSkuProfitability';
import { brandCore } from '@/theme/tokens';
import { isAdminEmail } from '@/utils/isAdminEmail';

const { color, radius } = brandCore;

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Home: o que merece atenção no período.
 *
 * A tela não é um painel de métricas, é uma fila de decisão. Os KPIs enquadram
 * o período e as situações abaixo dizem onde o dinheiro está sendo perdido ou
 * onde a leitura ainda não fecha.
 *
 * Toda a informação vem de uma única chamada — `analysis/top-products`, via
 * `useSkuProfitability`. É uma consulta caríssima no backend (ver o contrato em
 * `docs/analysis-top-products.md`), então ela roda ao abrir a tela e ao trocar
 * de período, nunca em intervalo.
 */
export function HomePage() {
  const { user } = useAuth();
  const { stores } = useConnections();
  const { analysis, days, setDays, isResolving, isLoading, error, refresh } =
    useSkuProfitability();

  const busy = isResolving || isLoading;
  const isAdmin = isAdminEmail(user?.email);
  const store = stores && stores.length > 0 ? stores[0] : null;

  const priorities = useMemo(() => buildPriorities(analysis), [analysis]);
  const confidence = useMemo(() => readingConfidence(analysis), [analysis]);

  const hasSales = (analysis?.summary.ordersCount ?? 0) > 0;
  const schemaOk = isSupportedSchema(analysis);

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}
      >
        <Stack spacing={0.5} sx={{ minWidth: 0 }}>
          <Typography variant="overline" color="primary">
            Atenção do período
          </Typography>
          <Typography variant="h4" component="h1">
            O que merece sua atenção agora
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 760 }}>
            {busy
              ? 'Consolidando pedidos, tarifas, frete e custos do período.'
              : !analysis
                ? 'Sem leitura do período disponível.'
                : priorities.length === 0
                  ? 'Nenhuma situação se destacou na sua operação neste período.'
                  : `${priorities.length} ${
                      priorities.length === 1
                        ? 'situação encontrada'
                        : 'situações encontradas'
                    } na sua operação deste período.`}
          </Typography>
        </Stack>

        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          sx={{ alignItems: 'center', flexWrap: 'wrap', flexShrink: 0 }}
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
          <Tooltip title="Recalcular o período">
            <span>
              <IconButton
                onClick={() => void refresh()}
                disabled={busy}
                aria-label="Recalcular o período"
              >
                <RefreshOutlinedIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Stack>

      <Stack
        direction="row"
        spacing={1.5}
        useFlexGap
        sx={{ alignItems: 'center', flexWrap: 'wrap' }}
      >
        {busy && !analysis ? (
          <Skeleton variant="text" width={320} height={18} />
        ) : analysis ? (
          <Typography variant="caption" color="text.secondary">
            {formatPeriod(analysis.fromUtc, analysis.toUtc)} · apurado em{' '}
            {formatDateTime(analysis.generatedAtUtc)}
          </Typography>
        ) : null}
        {store && (
          <Chip
            size="small"
            variant="outlined"
            color="primary"
            label={`Conectado · ${
              store.sellerNickname ||
              store.sellerEmail ||
              `Loja ${store.mercadoLivreSellerId}`
            }`}
          />
        )}
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
          Não foi possível apurar o período: {error}
        </Alert>
      )}

      {!error && !schemaOk && (
        <Alert severity="warning">
          A API respondeu com o schema {analysis?.schemaVersion || 'desconhecido'}{' '}
          da análise, e esta tela lê o 2.x. Nada aqui seria confiável até os
          contratos voltarem a bater — rode a sincronização de contratos antes de
          usar os números.
        </Alert>
      )}

      {!error && schemaOk && (
        <>
          <HomeStats analysis={analysis} isLoading={busy} />

          <Stack
            direction="row"
            spacing={1.5}
            sx={{ alignItems: 'center', justifyContent: 'space-between' }}
          >
            <Typography variant="h6" component="h2">
              Situações para avaliar
            </Typography>
            {priorities.length > 1 && (
              <Chip
                size="small"
                variant="outlined"
                label="Ordenadas por impacto"
              />
            )}
          </Stack>

          {busy ? (
            <Stack spacing={1.5}>
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} variant="rounded" height={132} />
              ))}
            </Stack>
          ) : !analysis ? null : !hasSales ? (
            <EmptyState
              title="Nenhuma venda elegível neste período"
              description="A conta considera apenas pedidos já registrados no Mercado Livre dentro da janela escolhida. Escolha um período maior ou aguarde as próximas vendas."
            />
          ) : priorities.length === 0 ? (
            <EmptyState
              icon
              title="Nada exige sua atenção agora"
              description="Nenhum anúncio ficou com contribuição negativa, o frete não está comendo parte relevante da receita e os custos estão informados. Vale conferir o resultado por anúncio de tempos em tempos."
              action={
                isAdmin
                  ? { label: 'Ver resultado por anúncio', to: '/profitability' }
                  : { label: 'Revisar custos', to: '/products' }
              }
            />
          ) : (
            <Stack spacing={1.5}>
              {priorities.map((priority, index) => (
                <PriorityCard
                  key={priority.id}
                  priority={priority}
                  rank={index + 1}
                  canSeeRestricted={isAdmin}
                />
              ))}
            </Stack>
          )}

          {!busy && analysis && <ReadingConfidence confidence={confidence} />}

          {!busy && analysis && (
            <Typography variant="caption" color="text.secondary">
              <strong>Como ler:</strong> contribuição é leitura operacional —
              receita elegível menos tarifas do Mercado Livre, frete do vendedor
              e CMV informado. Não é o lucro líquido da empresa: impostos,
              despesas fixas e publicidade não entram nesta conta. Pressão de
              frete indica investigação, não cobrança indevida.
            </Typography>
          )}
        </>
      )}
    </Stack>
  );
}

function EmptyState({
  title,
  description,
  action,
  icon = false,
}: {
  title: string;
  description: string;
  action?: { label: string; to: string };
  icon?: boolean;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        border: `1px solid ${color.borderNavy}`,
        borderRadius: `${radius.md}px`,
        bgcolor: 'background.paper',
        px: { xs: 2, md: 3 },
        py: 4,
      }}
    >
      <Stack spacing={1.25} sx={{ alignItems: 'center', textAlign: 'center' }}>
        {icon && (
          <Box sx={{ color: 'primary.main', display: 'grid' }}>
            <CheckCircleOutlinedIcon />
          </Box>
        )}
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ maxWidth: 620 }}
        >
          {description}
        </Typography>
        {action && (
          <Button
            component={RouterLink}
            to={action.to}
            variant="outlined"
            size="small"
            sx={{ mt: 0.5 }}
          >
            {action.label}
          </Button>
        )}
      </Stack>
    </Paper>
  );
}
