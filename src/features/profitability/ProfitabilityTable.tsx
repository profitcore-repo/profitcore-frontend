import { useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import {
  displayTitle,
  formatPercent,
  matchesFilter,
  matchesSearch,
  resolveStatus,
  sortProducts,
  STATUS_COLOR,
  STATUS_LABEL,
  type ProfitabilityFilter,
  type ProfitabilitySortKey,
} from '@/features/profitability/profitability';
import { brandCore } from '@/theme/tokens';
import { formatBRL } from '@/utils/currency';
import type { MercadoLivreProductPerformance } from '@/types/api';

const { color } = brandCore;

const COLUMN_COUNT = 11;

/** A tabela é larga por natureza: são 11 colunas de decomposição da conta. */
const MIN_TABLE_WIDTH = 1480;

const FILTER_OPTIONS: { value: ProfitabilityFilter; label: string }[] = [
  { value: 'all', label: 'Todos os produtos' },
  { value: 'loss', label: 'Prejuízo confirmado' },
  { value: 'incomplete', label: 'Leitura incompleta' },
  { value: 'healthy', label: 'Sem alerta relevante' },
];

type ProfitabilityTableProps = {
  products: readonly MercadoLivreProductPerformance[];
  isLoading: boolean;
};

/**
 * Resultado de lucro linha a linha, com a conta aberta.
 *
 * As colunas seguem a ordem da conta do backend — receita, taxas, frete,
 * billing, CMV, lucro — para que o seller consiga reconstruir mentalmente como
 * o número final foi formado, em vez de receber só um resultado.
 */
export function ProfitabilityTable({
  products,
  isLoading,
}: ProfitabilityTableProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ProfitabilityFilter>('all');
  const [sortKey, setSortKey] = useState<ProfitabilitySortKey>('revenue');
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const filtered = useMemo(
    () =>
      products.filter(
        (product) =>
          matchesSearch(product, search) && matchesFilter(product, filter),
      ),
    [products, search, filter],
  );

  const sorted = useMemo(
    () => sortProducts(filtered, sortKey, sortAsc),
    [filtered, sortKey, sortAsc],
  );

  const paged = useMemo(() => {
    const start = page * rowsPerPage;
    return sorted.slice(start, start + rowsPerPage);
  }, [sorted, page, rowsPerPage]);

  const handleSort = (key: ProfitabilitySortKey) => {
    if (sortKey === key) {
      setSortAsc((current) => !current);
    } else {
      setSortKey(key);
      // Métricas financeiras começam no maior valor: é onde está o impacto.
      setSortAsc(false);
    }
    setPage(0);
  };

  const sortableHeader = (key: ProfitabilitySortKey, label: string) => (
    <TableSortLabel
      active={sortKey === key}
      direction={sortKey === key && sortAsc ? 'asc' : 'desc'}
      onClick={() => handleSort(key)}
    >
      {label}
    </TableSortLabel>
  );

  return (
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
          <InsightsOutlinedIcon color="primary" />
          <Stack spacing={0.25}>
            <Typography variant="h6" component="h2">
              Resultado por produto
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {isLoading
                ? 'Calculando…'
                : `${filtered.length} de ${products.length} ${
                    products.length === 1 ? 'produto' : 'produtos'
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
            placeholder="Buscar por produto ou anúncio"
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

          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 220 } }}>
            <InputLabel id="profitability-filter-label">Situação</InputLabel>
            <Select
              labelId="profitability-filter-label"
              label="Situação"
              value={filter}
              onChange={(event) => {
                setFilter(event.target.value as ProfitabilityFilter);
                setPage(0);
              }}
            >
              {FILTER_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Stack>

      <TableContainer sx={{ overflowX: 'auto' }}>
        <Table size="medium" sx={{ minWidth: MIN_TABLE_WIDTH }}>
          <TableHead
            sx={{
              '& .MuiTableCell-head': {
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: 'text.secondary',
                whiteSpace: 'nowrap',
              },
            }}
          >
            <TableRow>
              <TableCell sx={{ minWidth: 260 }}>Produto</TableCell>
              <TableCell align="right">
                {sortableHeader('revenue', 'Receita bruta')}
              </TableCell>
              <TableCell align="right">Taxas ML</TableCell>
              <TableCell align="right">Frete rateado</TableCell>
              <TableCell align="right">Taxas de billing</TableCell>
              <TableCell align="right">CMV</TableCell>
              <TableCell align="right">
                {sortableHeader('netProfit', 'Lucro líquido')}
              </TableCell>
              <TableCell align="right">
                {sortableHeader('netMargin', 'Margem líquida')}
              </TableCell>
              <TableCell align="right">Pedidos</TableCell>
              <TableCell align="right">Unidades</TableCell>
              <TableCell sx={{ minWidth: 200 }}>Situação</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {isLoading ? (
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
                  <EmptyState hasProducts={products.length > 0} />
                </TableCell>
              </TableRow>
            ) : (
              paged.map((product) => (
                <ProductRow key={product.itemFullId} product={product} />
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
          labelDisplayedRows={({ from, to, count }) =>
            `${from}–${to} de ${count}`
          }
        />
      )}
    </Paper>
  );
}

function ProductRow({ product }: { product: MercadoLivreProductPerformance }) {
  const status = resolveStatus(product);
  const knownCmv = status !== 'incomplete';
  const isLoss = product.netProfit < 0;
  const title = displayTitle(product);

  return (
    <TableRow hover>
      <TableCell>
        <Stack spacing={0.25} sx={{ minWidth: 0, maxWidth: 360 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {title === product.itemFullId
              ? 'Título indisponível'
              : product.itemFullId}
          </Typography>
        </Stack>
      </TableCell>

      <Money value={product.grossRevenue} />
      <Money value={product.totalSaleFees} muted />
      <Money value={product.proportionalShippingCost} muted />
      <Money value={product.proportionalBillingCharges} muted />

      <TableCell align="right">
        {knownCmv ? (
          <Stack spacing={0.25} sx={{ alignItems: 'flex-end' }}>
            <Typography
              variant="body2"
              sx={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {formatBRL(product.totalCogs ?? 0)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatBRL(product.cmvUnit ?? 0)} / un.
            </Typography>
          </Stack>
        ) : (
          <Tooltip title="Sem CMV informado. O backend somou o custo de mercadoria como zero.">
            <Typography variant="body2" color="warning.main">
              Não informado
            </Typography>
          </Tooltip>
        )}
      </TableCell>

      <TableCell align="right">
        <Typography
          variant="body2"
          sx={{
            fontWeight: 700,
            fontVariantNumeric: 'tabular-nums',
            color: !knownCmv
              ? 'text.secondary'
              : isLoss
                ? 'error.main'
                : color.profitGreen,
          }}
        >
          {formatBRL(product.netProfit)}
        </Typography>
        {!knownCmv && (
          <Typography variant="caption" color="warning.main">
            acima do real
          </Typography>
        )}
      </TableCell>

      <TableCell align="right">
        <Typography
          variant="body2"
          sx={{
            fontVariantNumeric: 'tabular-nums',
            color: !knownCmv
              ? 'text.secondary'
              : isLoss
                ? 'error.main'
                : 'text.primary',
          }}
        >
          {formatPercent(product.netMarginPercent)}
        </Typography>
      </TableCell>

      <TableCell align="right">
        <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
          {product.ordersCount}
        </Typography>
      </TableCell>

      <TableCell align="right">
        <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
          {product.quantitySold}
        </Typography>
      </TableCell>

      <TableCell>
        <Stack spacing={0.75} sx={{ alignItems: 'flex-start' }}>
          <Chip
            size="small"
            variant="outlined"
            color={STATUS_COLOR[status]}
            label={STATUS_LABEL[status]}
          />
          {status === 'incomplete' ? (
            <Button
              component={RouterLink}
              to="/products"
              size="small"
              sx={{ whiteSpace: 'nowrap', py: 0.25 }}
            >
              Completar CMV
            </Button>
          ) : status === 'loss' ? (
            <Typography variant="caption" color="text.secondary">
              Revise preço ou custo deste anúncio.
            </Typography>
          ) : null}
        </Stack>
      </TableCell>
    </TableRow>
  );
}

function Money({ value, muted = false }: { value: number; muted?: boolean }) {
  return (
    <TableCell align="right">
      <Typography
        variant="body2"
        color={muted ? 'text.secondary' : 'text.primary'}
        sx={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {formatBRL(value)}
      </Typography>
    </TableCell>
  );
}

function EmptyState({ hasProducts }: { hasProducts: boolean }) {
  return (
    <Stack spacing={1.5} sx={{ alignItems: 'center', py: 5, textAlign: 'center' }}>
      <Typography variant="body1" sx={{ fontWeight: 600 }}>
        {hasProducts
          ? 'Nenhum produto corresponde aos filtros atuais'
          : 'Nenhuma venda no período analisado'}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {hasProducts
          ? 'Ajuste a busca ou troque o filtro de situação.'
          : 'Escolha um período maior ou aguarde as próximas vendas serem registradas no Mercado Livre.'}
      </Typography>
      {!hasProducts && (
        <Box>
          <Alert severity="info" sx={{ textAlign: 'left' }}>
            A conta só considera pedidos já registrados no Mercado Livre dentro
            da janela escolhida.
          </Alert>
        </Box>
      )}
    </Stack>
  );
}
