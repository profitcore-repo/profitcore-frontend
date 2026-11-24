import { useMemo } from 'react';
import {
  Alert,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { brandCore } from '@/theme/tokens';
import { parseBRLInput } from '@/utils/currency';
import {
  cellAt,
  columnNames,
  dataRows,
  type SheetGrid,
} from '@/features/skus/import/spreadsheetSource';
import type { ColumnMapping } from '@/features/skus/import/cmvImportPlan';
import { formatCmv } from '@/features/skus/import/importPresentation';

const { color } = brandCore;

/** Linhas mostradas na conferência. Cinco bastam para notar coluna errada. */
const PREVIEW_ROWS = 5;

type MappingStepProps = {
  grid: SheetGrid;
  mapping: ColumnMapping;
  onChange: (mapping: ColumnMapping) => void;
  /** Lista de abas, quando o arquivo tem mais de uma. */
  onSheetChange?: (sheetName: string) => void;
};

/**
 * Escolha das duas colunas que importam.
 *
 * O palpite automático já vem aplicado; esta tela existe para o usuário
 * confirmar ou corrigir, e principalmente para ele **ver o resultado da
 * leitura** antes de seguir. A amostra abaixo mostra o custo já convertido:
 * é onde um `12.50` lido como mil duzentos e cinquenta aparece antes de virar
 * problema.
 */
export function MappingStep({ grid, mapping, onChange, onSheetChange }: MappingStepProps) {
  const names = useMemo(() => columnNames(grid, mapping.hasHeader), [grid, mapping.hasHeader]);
  const sample = useMemo(
    () => dataRows(grid, mapping.hasHeader).slice(0, PREVIEW_ROWS),
    [grid, mapping.hasHeader],
  );

  const sameColumn =
    mapping.keyColumn >= 0 && mapping.keyColumn === mapping.cmvColumn;
  const columns = names.map((name, index) => ({ name, index }));

  return (
    <Stack spacing={2.5}>
      {grid.availableSheets.length > 1 && onSheetChange && (
        <FormControl size="small" sx={{ maxWidth: 280 }}>
          <InputLabel id="import-sheet-label">Aba da planilha</InputLabel>
          <Select
            labelId="import-sheet-label"
            label="Aba da planilha"
            value={grid.sheetName ?? ''}
            onChange={(event) => onSheetChange(event.target.value)}
          >
            {grid.availableSheets.map((sheet) => (
              <MenuItem key={sheet} value={sheet}>
                {sheet}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <FormControl size="small" fullWidth error={sameColumn}>
          <InputLabel id="import-key-label">Coluna que identifica o produto</InputLabel>
          <Select
            labelId="import-key-label"
            label="Coluna que identifica o produto"
            value={mapping.keyColumn >= 0 ? String(mapping.keyColumn) : ''}
            onChange={(event) =>
              onChange({ ...mapping, keyColumn: Number(event.target.value) })
            }
          >
            {columns.map(({ name, index }) => (
              <MenuItem key={index} value={String(index)}>
                {name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" fullWidth error={sameColumn}>
          <InputLabel id="import-cmv-label">Coluna com o custo (CMV)</InputLabel>
          <Select
            labelId="import-cmv-label"
            label="Coluna com o custo (CMV)"
            value={mapping.cmvColumn >= 0 ? String(mapping.cmvColumn) : ''}
            onChange={(event) =>
              onChange({ ...mapping, cmvColumn: Number(event.target.value) })
            }
          >
            {columns.map(({ name, index }) => (
              <MenuItem key={index} value={String(index)}>
                {name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      <FormControlLabel
        control={
          <Switch
            checked={mapping.hasHeader}
            onChange={(event) => onChange({ ...mapping, hasHeader: event.target.checked })}
          />
        }
        label="A primeira linha é cabeçalho"
      />

      {sameColumn && (
        <Alert severity="error">
          O identificador e o custo precisam estar em colunas diferentes.
        </Alert>
      )}

      <Typography variant="body2" color="text.secondary">
        O identificador pode ser o código do anúncio (<strong>MLB…</strong>) ou o título do
        produto. Se usar o título, você vai confirmar cada pareamento no próximo passo.
      </Typography>

      <Stack spacing={1}>
        <Typography variant="subtitle2">Conferência das primeiras linhas</Typography>

        <Paper
          elevation={0}
          sx={{
            border: `1px solid ${color.borderNavy}`,
            bgcolor: 'background.paper',
            overflowX: 'auto',
          }}
        >
          <Table size="small">
            <TableHead
              sx={{
                '& .MuiTableCell-head': {
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'text.secondary',
                },
              }}
            >
              <TableRow>
                <TableCell sx={{ width: 72 }}>Linha</TableCell>
                <TableCell>Identificador</TableCell>
                <TableCell>Custo na planilha</TableCell>
                <TableCell>Será lido como</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sample.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                      Nenhuma linha de dados. Se a primeira linha já é um produto, desmarque
                      "A primeira linha é cabeçalho".
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                sample.map((row) => {
                  const keyCell = mapping.keyColumn >= 0 ? cellAt(row, mapping.keyColumn) : null;
                  const cmvCell = mapping.cmvColumn >= 0 ? cellAt(row, mapping.cmvColumn) : null;
                  const parsed = readSampleCmv(cmvCell?.number ?? null, cmvCell?.text ?? '');

                  return (
                    <TableRow key={row.lineNumber}>
                      <TableCell sx={{ color: 'text.secondary' }}>{row.lineNumber}</TableCell>
                      <TableCell sx={{ maxWidth: 320 }}>
                        <Typography variant="body2" noWrap title={keyCell?.text ?? ''}>
                          {keyCell?.text.trim() || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary' }}>
                        {cmvCell?.text.trim() || '—'}
                      </TableCell>
                      <TableCell
                        sx={{
                          fontVariantNumeric: 'tabular-nums',
                          color: parsed === null ? color.riskRed : color.profitGreen,
                        }}
                      >
                        {cmvCell?.text.trim() === ''
                          ? 'ignorada (sem custo)'
                          : parsed === null
                            ? 'valor inválido'
                            : formatCmv(parsed)}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Paper>
      </Stack>
    </Stack>
  );
}

/**
 * Mesma precedência do plano: número da planilha ganha do texto.
 *
 * Duplicar essa regra aqui é intencional e barato — a conferência tem de mostrar
 * exatamente o que a importação vai gravar, e não uma aproximação.
 */
function readSampleCmv(cellNumber: number | null, text: string): number | null {
  if (cellNumber !== null) return Number.isFinite(cellNumber) ? cellNumber : null;
  if (text.trim() === '') return null;
  return parseBRLInput(text);
}
