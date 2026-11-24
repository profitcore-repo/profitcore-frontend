import {
  Alert,
  Button,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import ReplayOutlinedIcon from '@mui/icons-material/ReplayOutlined';
import { brandCore } from '@/theme/tokens';
import { formatBRL } from '@/utils/currency';
import type { CommitReport } from '@/features/skus/import/cmvImportCommit';

const { color } = brandCore;

type ResultStepProps = {
  report: CommitReport;
  isRetrying: boolean;
  onRetryFailures: () => void;
};

/**
 * Relatório da gravação.
 *
 * Mostra o parcial com a mesma clareza do total: num lote de 300, "297
 * gravados, 3 falharam" com a lista das 3 é a diferença entre o lojista
 * resolver sozinho e abrir um ticket dizendo "a importação não funcionou".
 */
export function ResultStep({ report, isRetrying, onRetryFailures }: ResultStepProps) {
  const { updated, failures, skipped, canceled, stoppedByFailures, stopMessage } = report;
  const pending = failures.length + skipped.length;

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
        <CheckCircleOutlinedIcon
          sx={{ color: updated.length > 0 ? color.profitGreen : color.textMuted, fontSize: 28 }}
        />
        <Stack spacing={0.25}>
          <Typography variant="h6" component="p">
            {updated.length === 0
              ? 'Nenhum custo foi gravado'
              : updated.length === 1
                ? '1 custo atualizado'
                : `${updated.length} custos atualizados`}
          </Typography>
          {pending > 0 && (
            <Typography variant="body2" color="text.secondary">
              {pending === 1
                ? '1 linha não foi gravada.'
                : `${pending} linhas não foram gravadas.`}
            </Typography>
          )}
        </Stack>
      </Stack>

      {stoppedByFailures && (
        <Alert severity="error">
          A importação foi interrompida. {stopMessage}
        </Alert>
      )}

      {canceled && !stoppedByFailures && (
        <Alert severity="info">
          Você cancelou a importação. Os custos gravados até o cancelamento foram
          mantidos.
        </Alert>
      )}

      {failures.length > 0 && (
        <Stack spacing={1}>
          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: 'center', justifyContent: 'space-between' }}
          >
            <Typography variant="subtitle2">Linhas que falharam</Typography>
            <Button
              size="small"
              variant="outlined"
              startIcon={<ReplayOutlinedIcon />}
              disabled={isRetrying}
              onClick={onRetryFailures}
            >
              {isRetrying ? 'Tentando…' : 'Tentar novamente'}
            </Button>
          </Stack>

          <Paper
            elevation={0}
            sx={{ border: `1px solid ${color.borderNavy}`, bgcolor: 'background.paper' }}
          >
            <TableContainer sx={{ maxHeight: 260 }}>
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
                    <TableCell>Produto</TableCell>
                    <TableCell sx={{ width: 110 }}>Custo</TableCell>
                    <TableCell>Erro</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {failures.map((failure) => (
                    <TableRow key={failure.lineNumber}>
                      <TableCell sx={{ color: 'text.secondary' }}>
                        {failure.lineNumber}
                      </TableCell>
                      <TableCell sx={{ maxWidth: 260 }}>
                        <Typography variant="body2" noWrap>
                          {failure.title ?? failure.code}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {failure.code}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontVariantNumeric: 'tabular-nums' }}>
                        {formatBRL(failure.cmv)}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="error.main">
                          {failure.message}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Stack>
      )}

      {skipped.length > 0 && (
        <Alert severity="warning">
          {skipped.length === 1
            ? '1 linha não chegou a ser enviada.'
            : `${skipped.length} linhas não chegaram a ser enviadas.`}{' '}
          Use "Tentar novamente" para enviá-las.
        </Alert>
      )}
    </Stack>
  );
}
