import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  InputAdornment,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import { SkuCmvField } from '@/features/skus/SkuCmvField';
import {
  hasCmv,
  selectMainSkus,
  type MainSku,
} from '@/features/skus/skuSales';
import { useSkuCosts } from '@/hooks/useSkuCosts';
import { useSkuSales } from '@/hooks/useSkuSales';
import { brandCore } from '@/theme/tokens';
import { formatBRL } from '@/utils/currency';
import type { SkuImportResult } from '@/types/api';

const { color } = brandCore;

const COLUMN_COUNT = 4;

type CmvFilter = 'all' | 'missing' | 'informed';

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function matchesSearch(entry: MainSku, term: string): boolean {
  const q = term.trim().toLowerCase();
  if (!q) return true;
  if (entry.sku.code.toLowerCase().includes(q)) return true;
  return Boolean(entry.title?.toLowerCase().includes(q));
}

function matchesFilter(entry: MainSku, filter: CmvFilter): boolean {
  if (filter === 'all') return true;
  return filter === 'informed' ? hasCmv(entry.sku) : !hasCmv(entry.sku);
}

/**
 * Listagem completa dos SKUs com edição de CMV.
 *
 * O onboarding cobre só os principais produtos; é aqui que o seller revisa o
 * catálogo inteiro depois. A ordenação padrão é por receita realizada, então o
 * que falta de custo e mais pesa nas vendas aparece primeiro.
 */
export function SkusTable() {
  const { skus, isResolving, isLoading, isImporting, error, refresh, importSkus, saveCmv } =
    useSkuCosts();
  const { salesIndex } = useSkuSales();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<CmvFilter>('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [lastImport, setLastImport] = useState<SkuImportResult | null>(null);

  const all = skus ?? [];

  // Reaproveita o mesmo ranking do onboarding, sem corte: aqui o limite é o
  // catálogo inteiro.
  const ranked = useMemo(
    () => selectMainSkus(all, salesIndex, all.length),
    [all, salesIndex],
  );

  const filtered = useMemo(
    () => ranked.filter((entry) => matchesSearch(entry, search) && matchesFilter(entry, filter)),
    [ranked, search, filter],
  );

  const paged = useMemo(() => {
    const start = page * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, page, rowsPerPage]);

  const informedCount = ranked.filter((entry) => hasCmv(entry.sku)).length;
  const missingCount = ranked.length - informedCount;

  const handleImport = async () => {
    setLastImport(await importSkus());
  };

  const handleSave = async (skuId: string, cmv: number | null) => {
    await saveCmv(skuId, cmv);
  };

  return (
    <Stack spacing={2}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        useFlexGap
        sx={{ flexWrap: 'wrap' }}
      >
        <SummaryCard label="SKUs importados" value={String(ranked.length)} />
        <SummaryCard label="Com CMV" value={String(informedCount)} tone="accent" />
        <SummaryCard label="Sem CMV" value={String(missingCount)} />
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
          {error}
        </Alert>
      )}

      {lastImport && (
        <Alert severity="success" onClose={() => setLastImport(null)}>
          {lastImport.totalFoundInMercadoLivre} anúncios encontrados no Mercado
          Livre · {lastImport.created} novos
          {lastImport.skipped > 0
            ? ` · ${lastImport.skipped} já cadastrados, mantidos como estavam`
            : ''}
          .
        </Alert>
      )}

      <Paper
        elevation={0}
        sx={{
          border: `1px solid ${color.borderNavy}`,
          bgcolor: 'background.paper',
          overflow: 'hidden',
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{
            p: { xs: 2, md: 2.5 },
            alignItems: { md: 'center' },
            justifyContent: 'space-between',
            borderBottom: `1px solid ${color.borderNavy}`,
          }}
        >
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Inventory2OutlinedIcon color="primary" />
            <Stack spacing={0.25}>
              <Typography variant="h6" component="h2">
                Meus produtos
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {isResolving
                  ? 'Carregando…'
                  : `${filtered.length} de ${ranked.length} ${
                      ranked.length === 1 ? 'SKU' : 'SKUs'
                    }`}
              </Typography>
            </Stack>
          </Stack>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            sx={{ alignItems: { sm: 'center' } }}
          >
            <TextField
              size="small"
              placeholder="Buscar por produto ou código"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(0);
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchOutlinedIcon fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ minWidth: { xs: '100%', sm: 260 } }}
            />

            <ToggleButtonGroup
              size="small"
              exclusive
              value={filter}
              onChange={(_, next: CmvFilter | null) => {
                if (next) {
                  setFilter(next);
                  setPage(0);
                }
              }}
              aria-label="Filtrar por CMV"
            >
              <ToggleButton value="all">Todos</ToggleButton>
              <ToggleButton value="missing">Sem CMV</ToggleButton>
              <ToggleButton value="informed">Com CMV</ToggleButton>
            </ToggleButtonGroup>

            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Tooltip title="Atualizar lista">
                <span>
                  <IconButton
                    onClick={() => void refresh()}
                    disabled={isLoading}
                    aria-label="Atualizar lista"
                  >
                    <RefreshOutlinedIcon />
                  </IconButton>
                </span>
              </Tooltip>
              <Button
                variant="outlined"
                size="small"
                onClick={() => void handleImport()}
                disabled={isImporting}
                startIcon={
                  isImporting ? (
                    <CircularProgress size={16} />
                  ) : (
                    <DownloadOutlinedIcon />
                  )
                }
                sx={{ flexShrink: 0 }}
              >
                {isImporting ? 'Importando...' : 'Buscar novos'}
              </Button>
            </Stack>
          </Stack>
        </Stack>

        <TableContainer>
          <Table size="medium">
            <TableHead
              sx={{
                '& .MuiTableCell-head': {
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  color: 'text.secondary',
                },
              }}
            >
              <TableRow>
                <TableCell>Produto</TableCell>
                <TableCell>Vendas (30 dias)</TableCell>
                <TableCell sx={{ minWidth: 240 }}>CMV unitário</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isResolving ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    {Array.from({ length: COLUMN_COUNT }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton variant="text" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : paged.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={COLUMN_COUNT}>
                    <EmptyState
                      hasCatalog={ranked.length > 0}
                      onImport={() => void handleImport()}
                      isImporting={isImporting}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                paged.map((entry) => (
                  <TableRow key={entry.sku.id} hover>
                    <TableCell>
                      <Stack spacing={0.25} sx={{ minWidth: 0, maxWidth: 360 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {entry.title ?? entry.sku.code}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {entry.title ? entry.sku.code : 'Título indisponível'}
                        </Typography>
                      </Stack>
                    </TableCell>

                    <TableCell>
                      {entry.sales.realizedRevenue > 0 ? (
                        <Stack spacing={0.25}>
                          <Typography
                            variant="body2"
                            sx={{ fontVariantNumeric: 'tabular-nums' }}
                          >
                            {formatBRL(entry.sales.realizedRevenue)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {entry.sales.unitsSold}{' '}
                            {entry.sales.unitsSold === 1 ? 'unidade' : 'unidades'}
                          </Typography>
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          —
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell>
                      <SkuCmvField
                        sku={entry.sku}
                        sales={entry.sales}
                        onSave={handleSave}
                        dense
                      />
                    </TableCell>

                    <TableCell>
                      <Stack spacing={0.5} sx={{ alignItems: 'flex-start' }}>
                        <Chip
                          size="small"
                          variant="outlined"
                          color={hasCmv(entry.sku) ? 'success' : 'warning'}
                          label={hasCmv(entry.sku) ? 'Informado' : 'Ausente'}
                        />
                        {hasCmv(entry.sku) && entry.sku.updatedAtUtc && (
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(entry.sku.updatedAtUtc)}
                          </Typography>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {filtered.length > rowsPerPage && (
          <TablePagination
            component="div"
            count={filtered.length}
            page={page}
            onPageChange={(_, next) => setPage(next)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(parseInt(event.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 25, 50]}
            labelRowsPerPage="Linhas por página"
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
          />
        )}
      </Paper>
    </Stack>
  );
}

function SummaryCard({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  tone?: 'neutral' | 'accent';
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        px: 2.5,
        py: 2,
        flex: '1 1 180px',
        border: `1px solid ${color.borderNavy}`,
        bgcolor: 'background.paper',
      }}
    >
      <Stack spacing={0.25}>
        <Typography
          variant="h5"
          sx={{
            fontVariantNumeric: 'tabular-nums',
            color: tone === 'accent' ? 'primary.main' : 'text.primary',
          }}
        >
          {value}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
      </Stack>
    </Paper>
  );
}

function EmptyState({
  hasCatalog,
  onImport,
  isImporting,
}: {
  hasCatalog: boolean;
  onImport: () => void;
  isImporting: boolean;
}) {
  return (
    <Stack spacing={1.5} sx={{ alignItems: 'center', py: 5, textAlign: 'center' }}>
      <Typography variant="body1" sx={{ fontWeight: 600 }}>
        {hasCatalog
          ? 'Nenhum resultado para esse filtro'
          : 'Nenhum produto importado ainda'}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {hasCatalog
          ? 'Ajuste a busca ou troque o filtro de CMV.'
          : 'Busque seus anúncios no Mercado Livre para informar os custos.'}
      </Typography>
      {!hasCatalog && (
        <Box>
          <Button
            variant="contained"
            onClick={onImport}
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
        </Box>
      )}
    </Stack>
  );
}
