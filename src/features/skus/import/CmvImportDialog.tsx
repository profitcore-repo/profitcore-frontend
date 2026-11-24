import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined';
import { brandCore } from '@/theme/tokens';
import { api } from '@/services/api';
import { useSkuCosts } from '@/hooks/useSkuCosts';
import { useSkuSales } from '@/hooks/useSkuSales';
import { buildSkuIndex } from '@/features/skus/import/skuIndex';
import {
  readSpreadsheetFile,
  SpreadsheetReadError,
  type SheetGrid,
} from '@/features/skus/import/spreadsheetSource';
import { guessColumns } from '@/features/skus/import/columnGuess';
import {
  applyOverrides,
  buildImportPlan,
  type ColumnMapping,
  type ImportPlan,
  type PlanContext,
  type RowOverride,
  type RowOverrides,
} from '@/features/skus/import/cmvImportPlan';
import {
  commitCmvImport,
  commitTargets,
  type CommitReport,
  type CommitTarget,
} from '@/features/skus/import/cmvImportCommit';
import {
  buildNotImportedCsv,
  downloadTextFile,
} from '@/features/skus/import/importPresentation';
import { UploadStep } from '@/features/skus/import/steps/UploadStep';
import { MappingStep } from '@/features/skus/import/steps/MappingStep';
import { PreviewStep } from '@/features/skus/import/steps/PreviewStep';
import { ResultStep } from '@/features/skus/import/steps/ResultStep';

const { color } = brandCore;

const STEPS = ['Enviar planilha', 'Escolher colunas', 'Conferir', 'Resultado'] as const;

type Stage = 'upload' | 'mapping' | 'preview' | 'result';

const STAGE_INDEX: Record<Stage, number> = {
  upload: 0,
  mapping: 1,
  preview: 2,
  result: 3,
};

type CmvImportDialogProps = {
  open: boolean;
  onClose: () => void;
};

/**
 * Importação de CMV por planilha, em quatro passos.
 *
 * Este componente é o único lugar do fluxo que fala com a rede: toda a decisão
 * (ler, mapear, parear, classificar) está em módulos puros, e aqui ficam a
 * máquina de estados, o progresso e a conexão com o `SkuCostsContext`.
 */
export function CmvImportDialog({ open, onClose }: CmvImportDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  const { skus, applyCmvBatch } = useSkuCosts();
  const { salesIndex } = useSkuSales();

  const [stage, setStage] = useState<Stage>('upload');
  const [grid, setGrid] = useState<SheetGrid | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({
    keyColumn: -1,
    cmvColumn: -1,
    hasHeader: true,
  });
  const [basePlan, setBasePlan] = useState<ImportPlan | null>(null);
  const [overrides, setOverrides] = useState<RowOverrides>(new Map());
  const [buildProgress, setBuildProgress] = useState<number | null>(null);
  const [commitProgress, setCommitProgress] = useState<{ done: number; total: number } | null>(
    null,
  );
  const [report, setReport] = useState<CommitReport | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const context = useMemo<PlanContext>(
    () => ({ index: buildSkuIndex(skus ?? [], salesIndex), salesIndex }),
    [skus, salesIndex],
  );

  const plan = useMemo(
    () => (basePlan ? applyOverrides(basePlan, context, overrides) : null),
    [basePlan, context, overrides],
  );

  const isBusy = buildProgress !== null || commitProgress !== null;

  /* ---------------------------------------------------------------- */

  const handleLoaded = useCallback(
    (loaded: SheetGrid, loadedFile: File | null) => {
      const hasHeader = loaded.suggestedHasHeader;
      const guess = guessColumns(loaded, hasHeader);

      setGrid(loaded);
      setFile(loadedFile);
      setMapping({
        keyColumn: guess.keyColumn ?? -1,
        cmvColumn: guess.cmvColumn ?? -1,
        hasHeader,
      });
      setError(null);
      setStage('mapping');
    },
    [],
  );

  /** Troca de aba relê o arquivo e refaz o palpite para a nova aba. */
  const handleSheetChange = useCallback(
    (sheetName: string) => {
      if (!file) return;
      void (async () => {
        try {
          const reloaded = await readSpreadsheetFile(file, sheetName);
          handleLoaded(reloaded, file);
        } catch (err) {
          setError(
            err instanceof SpreadsheetReadError ? err.message : 'Não foi possível ler esta aba.',
          );
        }
      })();
    },
    [file, handleLoaded],
  );

  const handleBuild = useCallback(() => {
    if (!grid) return;
    const controller = new AbortController();
    abortRef.current = controller;

    void (async () => {
      setError(null);
      setBuildProgress(0);
      try {
        const built = await buildImportPlan(grid, mapping, context, {
          signal: controller.signal,
          onProgress: (processed, total) =>
            setBuildProgress(total === 0 ? 100 : (processed / total) * 100),
        });
        setBasePlan(built);
        setOverrides(new Map());
        setStage('preview');
      } catch (err) {
        if (!(err instanceof DOMException && err.name === 'AbortError')) {
          setError(err instanceof Error ? err.message : 'Falha ao analisar a planilha.');
        }
      } finally {
        setBuildProgress(null);
        abortRef.current = null;
      }
    })();
  }, [grid, mapping, context]);

  const runCommit = useCallback(
    (targets: readonly CommitTarget[], previous: CommitReport | null) => {
      const controller = new AbortController();
      abortRef.current = controller;

      void (async () => {
        setError(null);
        setCommitProgress({ done: 0, total: targets.length });
        try {
          const result = await commitCmvImport(targets, {
            save: (items) => api.updateSkusCmv(items),
            signal: controller.signal,
            onProgress: (done, total) => setCommitProgress({ done, total }),
          });

          // Reflete na tabela de produtos de uma vez, sem um render por SKU.
          applyCmvBatch(result.updated);

          setReport(
            previous
              ? { ...result, updated: [...previous.updated, ...result.updated] }
              : result,
          );
          setStage('result');
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Falha ao gravar os custos.');
        } finally {
          setCommitProgress(null);
          setIsRetrying(false);
          abortRef.current = null;
        }
      })();
    },
    [applyCmvBatch],
  );

  const handleCommit = useCallback(() => {
    if (!plan) return;
    runCommit(commitTargets(plan), null);
  }, [plan, runCommit]);

  const handleRetryFailures = useCallback(() => {
    if (!report) return;
    setIsRetrying(true);
    runCommit([...report.failures, ...report.skipped], report);
  }, [report, runCommit]);

  const handleOverride = useCallback((lineNumber: number, override: RowOverride | null) => {
    setOverrides((prev) => {
      const next = new Map(prev);
      if (override === null) next.delete(lineNumber);
      else next.set(lineNumber, override);
      return next;
    });
  }, []);

  const handleDownloadNotImported = useCallback(() => {
    if (!plan) return;
    downloadTextFile(
      'linhas-nao-importadas.csv',
      buildNotImportedCsv(plan),
      'text/csv;charset=utf-8',
    );
  }, [plan]);

  const handleCancelBusy = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const handleClose = useCallback(() => {
    abortRef.current?.abort();
    onClose();
  }, [onClose]);

  /* ---------------------------------------------------------------- */

  const mappingReady =
    mapping.keyColumn >= 0 &&
    mapping.cmvColumn >= 0 &&
    mapping.keyColumn !== mapping.cmvColumn;

  return (
    <Dialog
      open={open}
      onClose={isBusy ? undefined : handleClose}
      fullWidth
      maxWidth="lg"
      fullScreen={fullScreen}
      aria-labelledby="cmv-import-title"
      slotProps={{
        paper: {
          sx: {
            bgcolor: 'background.paper',
            border: `1px solid ${color.borderNavy}`,
            backgroundImage: 'none',
          },
        },
      }}
    >
      <DialogTitle
        id="cmv-import-title"
        component="div"
        sx={{ borderBottom: `1px solid ${color.borderNavy}`, px: 3, py: 2 }}
      >
        <Stack
          direction="row"
          spacing={1.5}
          sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}
        >
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0 }}>
            <TableChartOutlinedIcon color="primary" />
            <Stack spacing={0.25} sx={{ minWidth: 0 }}>
              <Typography variant="h6" component="h2">
                Importar custos de uma planilha
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Você escolhe quais colunas usar e confere tudo antes de salvar.
              </Typography>
            </Stack>
          </Stack>

          <IconButton
            onClick={handleClose}
            aria-label="Fechar"
            size="small"
            disabled={isBusy}
            sx={{ color: 'text.secondary', flexShrink: 0 }}
          >
            <CloseOutlinedIcon fontSize="small" />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ px: 3, py: 3 }}>
        <Stack spacing={3}>
          <Stepper activeStep={STAGE_INDEX[stage]} alternativeLabel={!fullScreen}>
            {STEPS.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && <Alert severity="error">{error}</Alert>}

          {skus === null ? (
            <Alert severity="info">
              Seus produtos ainda não foram carregados. Feche esta janela, use "Buscar novos"
              para importar seus anúncios e tente de novo.
            </Alert>
          ) : skus.length === 0 ? (
            <Alert severity="warning">
              Você ainda não tem produtos importados do Mercado Livre. A planilha precisa de
              produtos para casar com os custos.
            </Alert>
          ) : (
            <>
              {buildProgress !== null && (
                <Stack spacing={1}>
                  <Typography variant="body2" color="text.secondary">
                    Analisando a planilha e procurando seus produtos…
                  </Typography>
                  <LinearProgress variant="determinate" value={buildProgress} />
                </Stack>
              )}

              {commitProgress !== null && (
                <Stack spacing={1}>
                  <Typography variant="body2" color="text.secondary">
                    Gravando {commitProgress.done} de {commitProgress.total} custos…
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={
                      commitProgress.total === 0
                        ? 100
                        : (commitProgress.done / commitProgress.total) * 100
                    }
                  />
                </Stack>
              )}

              {stage === 'upload' && <UploadStep onLoaded={handleLoaded} />}

              {stage === 'mapping' && grid && (
                <MappingStep
                  grid={grid}
                  mapping={mapping}
                  onChange={setMapping}
                  onSheetChange={file ? handleSheetChange : undefined}
                />
              )}

              {stage === 'preview' && plan && (
                <PreviewStep
                  plan={plan}
                  index={context.index}
                  overrides={overrides}
                  onOverride={handleOverride}
                  onDownloadNotImported={handleDownloadNotImported}
                />
              )}

              {stage === 'result' && report && (
                <ResultStep
                  report={report}
                  isRetrying={isRetrying}
                  onRetryFailures={handleRetryFailures}
                />
              )}
            </>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ borderTop: `1px solid ${color.borderNavy}`, px: 3, py: 2 }}>
        {isBusy ? (
          <Button onClick={handleCancelBusy} color="inherit">
            Cancelar
          </Button>
        ) : (
          <>
            {stage === 'mapping' && (
              <Button
                onClick={() => {
                  setStage('upload');
                  setGrid(null);
                  setFile(null);
                }}
                color="inherit"
              >
                Voltar
              </Button>
            )}

            {stage === 'preview' && (
              <Button onClick={() => setStage('mapping')} color="inherit">
                Voltar
              </Button>
            )}

            <div style={{ flex: 1 }} />

            {stage === 'upload' && (
              <Button onClick={handleClose} color="inherit">
                Cancelar
              </Button>
            )}

            {stage === 'mapping' && (
              <Button variant="contained" disabled={!mappingReady} onClick={handleBuild}>
                Continuar
              </Button>
            )}

            {stage === 'preview' && plan && (
              <Button
                variant="contained"
                disabled={plan.counts.willWrite === 0}
                onClick={handleCommit}
                startIcon={isBusy ? <CircularProgress size={16} color="inherit" /> : undefined}
              >
                {plan.counts.willWrite === 0
                  ? 'Nada para importar'
                  : plan.counts.willWrite === 1
                    ? 'Importar 1 custo'
                    : `Importar ${plan.counts.willWrite} custos`}
              </Button>
            )}

            {stage === 'result' && (
              <Button variant="contained" onClick={handleClose}>
                Concluir
              </Button>
            )}
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
