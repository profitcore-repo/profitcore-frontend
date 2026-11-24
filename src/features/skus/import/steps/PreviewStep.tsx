import { useMemo, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  createFilterOptions,
} from '@mui/material';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import RestartAltOutlinedIcon from '@mui/icons-material/RestartAltOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import { brandCore } from '@/theme/tokens';
import type { SkuEntry, SkuIndex } from '@/features/skus/import/skuIndex';
import {
  willWrite,
  type ImportPlan,
  type ImportRow,
  type RowOverride,
  type RowOverrides,
} from '@/features/skus/import/cmvImportPlan';
import {
  filterSummaries,
  formatCmv,
  matchKindLabel,
  matchesFilter,
  statusPresentation,
  type PreviewFilter,
  type StatusTone,
} from '@/features/skus/import/importPresentation';

const { color } = brandCore;

const COLUMN_COUNT = 5;

const CHIP_COLOR: Record<StatusTone, 'success' | 'warning' | 'error' | 'default'> = {
  success: 'success',
  warning: 'warning',
  error: 'error',
  neutral: 'default',
};

/** Limita a lista do seletor manual: catálogo grande travaria o dropdown. */
const skuFilter = createFilterOptions<SkuEntry>({ limit: 20, trim: true });

type PreviewStepProps = {
  plan: ImportPlan;
  index: SkuIndex;
  overrides: RowOverrides;
  onOverride: (lineNumber: number, override: RowOverride | null) => void;
  onDownloadNotImported: () => void;
};

/**
 * Conferência do pareamento antes de qualquer gravação.
 *
 * Esta tela é a razão de a importação ser confiável: custo errado contamina a
 * margem de todo o catálogo e pareceria plausível. Então nada é gravado até o
 * usuário olhar os contadores, resolver o que está incerto e clicar no botão.
 */
export function PreviewStep({
  plan,
  index,
  overrides,
  onOverride,
  onDownloadNotImported,
}: PreviewStepProps) {
  const [filter, setFilter] = useState<PreviewFilter>('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const summaries = useMemo(() => filterSummaries(plan.counts), [plan.counts]);
  const filtered = useMemo(
    () => plan.rows.filter((row) => matchesFilter(row, filter)),
    [plan.rows, filter],
  );
  const paged = useMemo(
    () => filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filtered, page, rowsPerPage],
  );

  const notImported = plan.counts.total - plan.counts.willWrite;

  const changeFilter = (next: PreviewFilter) => {
    setFilter(next);
    setPage(0);
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
        <Chip
          label={`Todas as ${plan.counts.total} linhas`}
          onClick={() => changeFilter('all')}
          variant={filter === 'all' ? 'filled' : 'outlined'}
          color={filter === 'all' ? 'primary' : 'default'}
        />
        {summaries.map((summary) => (
          <Chip
            key={summary.filter}
            label={`${summary.count} ${summary.label.toLowerCase()}`}
            onClick={() => changeFilter(summary.filter)}
            variant={filter === summary.filter ? 'filled' : 'outlined'}
            color={filter === summary.filter ? CHIP_COLOR[summary.tone] : 'default'}
          />
        ))}
      </Stack>

      {plan.counts.aboveObservedPrice > 0 && (
        <Alert
          severity="warning"
          icon={<WarningAmberOutlinedIcon />}
          action={
            <Button color="inherit" size="small" onClick={() => changeFilter('warning')}>
              Ver linhas
            </Button>
          }
        >
          {plan.counts.aboveObservedPrice === 1
            ? '1 produto ficou com custo acima do preço médio que você praticou.'
            : `${plan.counts.aboveObservedPrice} produtos ficaram com custo acima do preço médio que você praticou.`}{' '}
          Confira se os centavos não foram lidos como reais.
        </Alert>
      )}

      {plan.counts.needsConfirmation > 0 && (
        <Alert severity="info">
          {plan.counts.needsConfirmation === 1
            ? '1 linha foi pareada pelo título e precisa da sua confirmação.'
            : `${plan.counts.needsConfirmation} linhas foram pareadas pelo título e precisam da sua confirmação.`}{' '}
          Elas não serão importadas enquanto você não escolher o produto.
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
        <TableContainer sx={{ maxHeight: 420 }}>
          <Table size="small" stickyHeader>
            <TableHead
              sx={{
                '& .MuiTableCell-head': {
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'text.secondary',
                  bgcolor: color.surfaceNavy,
                },
              }}
            >
              <TableRow>
                <TableCell sx={{ width: 64 }}>Linha</TableCell>
                <TableCell>Da sua planilha</TableCell>
                <TableCell sx={{ minWidth: 260 }}>Produto</TableCell>
                <TableCell sx={{ width: 150 }}>Custo</TableCell>
                <TableCell sx={{ width: 200 }}>Situação</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {paged.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={COLUMN_COUNT}>
                    <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                      Nenhuma linha neste filtro.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paged.map((row) => (
                  <PreviewRow
                    key={row.lineNumber}
                    row={row}
                    index={index}
                    override={overrides.get(row.lineNumber)}
                    onOverride={onOverride}
                  />
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

      {notImported > 0 && (
        <Box>
          <Button
            size="small"
            variant="text"
            startIcon={<DownloadOutlinedIcon />}
            onClick={onDownloadNotImported}
          >
            Baixar as {notImported} linhas que não serão importadas
          </Button>
        </Box>
      )}
    </Stack>
  );
}

/* -------------------------------------------------------------------------- *
 * Linha
 * -------------------------------------------------------------------------- */

type PreviewRowProps = {
  row: ImportRow;
  index: SkuIndex;
  override: RowOverride | undefined;
  onOverride: (lineNumber: number, override: RowOverride | null) => void;
};

function PreviewRow({ row, index, override, onOverride }: PreviewRowProps) {
  const presentation = statusPresentation(row.status);
  const isIgnored = row.status === 'ignored';

  return (
    <TableRow hover>
      <TableCell sx={{ color: 'text.secondary', verticalAlign: 'top', pt: 1.75 }}>
        {row.lineNumber}
      </TableCell>

      <TableCell sx={{ maxWidth: 220, verticalAlign: 'top', pt: 1.5 }}>
        <Stack spacing={0.25} sx={{ minWidth: 0 }}>
          <Typography variant="body2" noWrap title={row.rawKey}>
            {row.rawKey || '—'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {row.rawCmv || 'sem custo'}
          </Typography>
        </Stack>
      </TableCell>

      <TableCell sx={{ verticalAlign: 'top', pt: 1.5 }}>
        <ProductCell row={row} index={index} onOverride={onOverride} />
      </TableCell>

      <TableCell sx={{ verticalAlign: 'top', pt: 1.5 }}>
        <Stack spacing={0.25}>
          <Typography
            variant="body2"
            sx={{
              fontVariantNumeric: 'tabular-nums',
              fontWeight: willWrite(row) ? 600 : 400,
              color: willWrite(row) ? color.profitGreen : 'text.secondary',
            }}
          >
            {row.cmv === null ? '—' : formatCmv(row.cmv)}
          </Typography>
          {row.match && row.match.currentCmv !== null && (
            <Typography variant="caption" color="text.secondary">
              antes: {formatCmv(row.match.currentCmv)}
            </Typography>
          )}
          {row.aboveObservedPrice && (
            <Tooltip title="Acima do preço médio que você praticou. Confira a escala do valor.">
              <WarningAmberOutlinedIcon sx={{ fontSize: 16, color: 'warning.main' }} />
            </Tooltip>
          )}
        </Stack>
      </TableCell>

      <TableCell sx={{ verticalAlign: 'top', pt: 1.5 }}>
        <Stack spacing={0.5} sx={{ alignItems: 'flex-start' }}>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
            <Chip
              size="small"
              variant="outlined"
              color={CHIP_COLOR[presentation.tone]}
              label={presentation.label}
            />

            {isIgnored ? (
              <Tooltip title="Voltar a considerar esta linha">
                <IconButton
                  size="small"
                  aria-label={`Restaurar a linha ${row.lineNumber}`}
                  onClick={() => onOverride(row.lineNumber, null)}
                >
                  <RestartAltOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            ) : (
              row.status !== 'empty-value' && (
                <Tooltip title="Não importar esta linha">
                  <IconButton
                    size="small"
                    aria-label={`Ignorar a linha ${row.lineNumber}`}
                    onClick={() => onOverride(row.lineNumber, { skuId: null })}
                  >
                    <BlockOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )
            )}
          </Stack>

          {row.reason && (
            <Typography variant="caption" color="text.secondary">
              {row.reason}
            </Typography>
          )}

          {override?.skuId && row.status === 'ready' && row.match?.kind === 'manual' && (
            <Typography variant="caption" color="text.secondary">
              Escolhido por você.
            </Typography>
          )}
        </Stack>
      </TableCell>
    </TableRow>
  );
}

/* -------------------------------------------------------------------------- *
 * Célula do produto: exibição ou resolução
 * -------------------------------------------------------------------------- */

type ProductCellProps = {
  row: ImportRow;
  index: SkuIndex;
  onOverride: (lineNumber: number, override: RowOverride | null) => void;
};

function ProductCell({ row, index, onOverride }: ProductCellProps) {
  // Escolha entre candidatos: o pareamento encontrou produtos parecidos e só
  // falta dizer qual é.
  if (row.status === 'needs-confirmation' && row.candidates.length > 0) {
    return (
      <Select
        size="small"
        fullWidth
        displayEmpty
        value={row.match?.skuId ?? ''}
        onChange={(event) => {
          const value = event.target.value;
          onOverride(row.lineNumber, value ? { skuId: value } : null);
        }}
        aria-label={`Produto para a linha ${row.lineNumber}`}
        sx={{ maxWidth: 360 }}
      >
        <MenuItem value="">
          <Typography variant="body2" color="text.secondary">
            Escolha o produto…
          </Typography>
        </MenuItem>
        {row.candidates.map((candidate) => (
          <MenuItem key={candidate.skuId} value={candidate.skuId}>
            <Stack spacing={0} sx={{ minWidth: 0 }}>
              <Typography variant="body2" noWrap>
                {candidate.title ?? candidate.code}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {candidate.code}
                {candidate.kind === 'title-fuzzy' &&
                  ` · ${Math.round(candidate.score * 100)}% parecido`}
                {candidate.currentCmv !== null && ` · hoje ${formatCmv(candidate.currentCmv)}`}
              </Typography>
            </Stack>
          </MenuItem>
        ))}
      </Select>
    );
  }

  // Nada pareou: oferece a busca no catálogo em vez de deixar a linha morta.
  if (row.status === 'unmatched') {
    return (
      <Autocomplete
        size="small"
        options={index.entries}
        filterOptions={skuFilter}
        getOptionLabel={(entry) => entry.title ?? entry.sku.code}
        isOptionEqualToValue={(a, b) => a.sku.id === b.sku.id}
        value={null}
        onChange={(_, entry) =>
          onOverride(row.lineNumber, entry ? { skuId: entry.sku.id } : null)
        }
        noOptionsText="Nenhum produto encontrado"
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder="Buscar produto…"
            aria-label={`Buscar produto para a linha ${row.lineNumber}`}
          />
        )}
        renderOption={(props, entry) => (
          <li {...props} key={entry.sku.id}>
            <Stack spacing={0} sx={{ minWidth: 0 }}>
              <Typography variant="body2" noWrap>
                {entry.title ?? entry.sku.code}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {entry.sku.code}
                {entry.sku.cmv !== null && ` · hoje ${formatCmv(entry.sku.cmv)}`}
              </Typography>
            </Stack>
          </li>
        )}
        sx={{ maxWidth: 360 }}
      />
    );
  }

  if (!row.match) {
    return (
      <Typography variant="body2" color="text.secondary">
        —
      </Typography>
    );
  }

  return (
    <Stack spacing={0.25} sx={{ minWidth: 0, maxWidth: 360 }}>
      <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap title={row.match.title ?? ''}>
        {row.match.title ?? row.match.code}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {row.match.code} · {matchKindLabel(row.match.kind)}
      </Typography>
    </Stack>
  );
}
