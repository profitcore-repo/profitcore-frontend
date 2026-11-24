import { useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import ContentPasteOutlinedIcon from '@mui/icons-material/ContentPasteOutlined';
import { brandCore } from '@/theme/tokens';
import {
  MAX_FILE_BYTES,
  isSupportedSpreadsheet,
  readPastedText,
  readSpreadsheetFile,
  SpreadsheetReadError,
  type SheetGrid,
} from '@/features/skus/import/spreadsheetSource';

const { color } = brandCore;

type UploadStepProps = {
  /** Recebe a planilha lida e o arquivo, quando houver (para trocar de aba). */
  onLoaded: (grid: SheetGrid, file: File | null) => void;
};

/**
 * Entrada da importação: arquivo ou colagem.
 *
 * As duas portas existem porque resolvem pessoas diferentes. O arquivo atende
 * quem mantém a planilha de custos num `.xlsx`; a colagem atende quem já está
 * com o Excel aberto e só quer trazer duas colunas, sem salvar arquivo nenhum.
 */
export function UploadStep({ onLoaded }: UploadStepProps) {
  const [tab, setTab] = useState<'file' | 'paste'>('file');
  const [pasted, setPasted] = useState('');
  const [dragging, setDragging] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const read = async (operation: () => Promise<SheetGrid>, file: File | null) => {
    setError(null);
    setIsReading(true);
    try {
      onLoaded(await operation(), file);
    } catch (err) {
      setError(
        err instanceof SpreadsheetReadError
          ? err.message
          : 'Não foi possível ler a planilha. Confira se o arquivo abre no Excel.',
      );
    } finally {
      setIsReading(false);
    }
  };

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    void read(() => readSpreadsheetFile(file), file);
  };

  return (
    <Stack spacing={2.5}>
      <Tabs
        value={tab}
        onChange={(_, next: 'file' | 'paste') => {
          setTab(next);
          setError(null);
        }}
        aria-label="Como enviar sua planilha"
      >
        <Tab
          value="file"
          label="Enviar arquivo"
          icon={<UploadFileOutlinedIcon fontSize="small" />}
          iconPosition="start"
          sx={{ minHeight: 48 }}
        />
        <Tab
          value="paste"
          label="Colar do Excel"
          icon={<ContentPasteOutlinedIcon fontSize="small" />}
          iconPosition="start"
          sx={{ minHeight: 48 }}
        />
      </Tabs>

      {error && <Alert severity="error">{error}</Alert>}

      {tab === 'file' ? (
        <Box
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            const file = event.dataTransfer.files?.[0];
            // Barra aqui para a mensagem citar a extensão, em vez de deixar o
            // parser falhar com um erro genérico.
            if (file && !isSupportedSpreadsheet(file.name)) {
              setError('Formato não suportado. Envie um arquivo .xlsx, .xls ou .csv.');
              return;
            }
            handleFile(file);
          }}
          sx={{
            border: `1px dashed ${dragging ? color.profitGreen : color.borderNavy}`,
            borderRadius: `${brandCore.radius.md}px`,
            bgcolor: dragging ? 'rgba(0, 239, 160, 0.04)' : 'transparent',
            px: 3,
            py: 6,
            textAlign: 'center',
            transition: 'border-color 120ms, background-color 120ms',
          }}
        >
          <Stack spacing={1.5} sx={{ alignItems: 'center' }}>
            {isReading ? (
              <CircularProgress size={28} />
            ) : (
              <UploadFileOutlinedIcon sx={{ fontSize: 36, color: color.textMuted }} />
            )}

            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {isReading ? 'Lendo sua planilha…' : 'Arraste sua planilha aqui'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              .xlsx, .xls ou .csv, até {Math.round(MAX_FILE_BYTES / 1024 / 1024)} MB.
              As colunas podem estar em qualquer ordem.
            </Typography>

            <Box sx={{ pt: 1 }}>
              <Button
                variant="outlined"
                disabled={isReading}
                onClick={() => inputRef.current?.click()}
              >
                Escolher arquivo
              </Button>
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xlsm,.xlsb,.xls,.csv,.tsv,.txt"
                hidden
                onChange={(event) => {
                  handleFile(event.target.files?.[0]);
                  // Permite reenviar o mesmo arquivo depois de corrigi-lo.
                  event.target.value = '';
                }}
              />
            </Box>
          </Stack>
        </Box>
      ) : (
        <Stack spacing={1.5}>
          <Typography variant="body2" color="text.secondary">
            No Excel, selecione a coluna que identifica o produto e a coluna de custo,
            copie com Ctrl+C e cole abaixo. Inclua o cabeçalho se tiver.
          </Typography>

          <TextField
            multiline
            minRows={8}
            maxRows={14}
            fullWidth
            value={pasted}
            onChange={(event) => {
              setPasted(event.target.value);
              setError(null);
            }}
            placeholder={'Codigo\tCusto\nMLB1234567890\t12,50\nMLB9876543210\t8,90'}
            slotProps={{
              htmlInput: {
                'aria-label': 'Conteúdo colado da planilha',
                style: { fontFamily: 'monospace', fontSize: 13 },
              },
            }}
          />

          <Box>
            <Button
              variant="contained"
              disabled={isReading || pasted.trim() === ''}
              startIcon={isReading ? <CircularProgress size={16} color="inherit" /> : undefined}
              onClick={() => void read(() => readPastedText(pasted), null)}
            >
              {isReading ? 'Lendo…' : 'Continuar'}
            </Button>
          </Box>
        </Stack>
      )}
    </Stack>
  );
}
