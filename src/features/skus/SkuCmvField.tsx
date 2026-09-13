import { useState } from 'react';
import {
  Button,
  Chip,
  CircularProgress,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import { isCmvAboveObservedPrice, validateCmvInput } from '@/features/skus/cmv';
import type { SkuSales } from '@/features/skus/skuSales';
import type { SkuResponse } from '@/types/api';

/** Campo em branco só quando o CMV é `null`; `0` é valor e aparece como 0,00. */
export function toCmvInputValue(cmv: number | null): string {
  if (cmv === null) return '';
  return cmv.toFixed(2).replace('.', ',');
}

type SkuCmvFieldProps = {
  sku: SkuResponse;
  /** Usado só para avisar quando o custo supera o preço praticado. */
  sales: SkuSales;
  /**
   * `cmv: null` marca como não informado. Deve rejeitar em caso de falha para o
   * campo exibir o erro.
   */
  onSave: (skuId: string, cmv: number | null) => Promise<void>;
  /** Sem label, para caber em célula de tabela. */
  dense?: boolean;
};

/**
 * Edição do CMV de um SKU: valida, salva e dá o retorno.
 *
 * Compartilhado entre o passo do onboarding e a listagem de produtos, para que
 * as duas telas tenham exatamente as mesmas regras — incluindo o vazio que
 * marca como não informado e o aviso de custo acima do preço praticado.
 */
export function SkuCmvField({ sku, sales, onSave, dense = false }: SkuCmvFieldProps) {
  const persisted = toCmvInputValue(sku.cmv);
  const [value, setValue] = useState(persisted);
  const [lastPersisted, setLastPersisted] = useState(persisted);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedAs, setSavedAs] = useState<'value' | 'cleared' | null>(null);

  /**
   * Ressincroniza quando o valor gravado muda por fora deste campo (atualizar a
   * lista, reimportar). A linha da tabela é reaproveitada por `id`, então sem
   * isso o input continuaria exibindo o valor antigo.
   */
  if (persisted !== lastPersisted) {
    setLastPersisted(persisted);
    setValue(persisted);
    setError(null);
  }

  const unchanged = value.trim() === persisted.trim();
  const label = sku.code;

  const handleSave = async () => {
    const parsed = validateCmvInput(value);
    if (!parsed.ok) {
      setError(parsed.error);
      setWarning(null);
      return;
    }

    setError(null);
    setIsSaving(true);
    try {
      await onSave(sku.id, parsed.value);
      setValue(toCmvInputValue(parsed.value));
      setSavedAs(parsed.value === null ? 'cleared' : 'value');
      setWarning(
        parsed.value !== null &&
          isCmvAboveObservedPrice(parsed.value, sales.realizedRevenue, sales.unitsSold)
          ? 'Este valor é maior que o preço médio que você praticou. Confirme se está correto.'
          : null,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? `Não foi possível salvar: ${err.message}`
          : 'Não foi possível salvar.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Stack spacing={1}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
        <TextField
          size="small"
          label={dense ? undefined : 'CMV unitário'}
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setError(null);
            setWarning(null);
            setSavedAs(null);
          }}
          error={Boolean(error)}
          helperText={dense ? undefined : (error ?? undefined)}
          placeholder="Não informado"
          disabled={isSaving}
          slotProps={{
            htmlInput: {
              inputMode: 'decimal',
              'aria-label': `CMV unitário de ${label}`,
            },
            input: {
              startAdornment: <InputAdornment position="start">R$</InputAdornment>,
            },
          }}
          sx={{ flex: 1, minWidth: dense ? 132 : undefined }}
        />
        {/* Vazio com valor salvo é ação válida: limpa o CMV. */}
        <Button
          variant="outlined"
          size={dense ? 'small' : 'medium'}
          onClick={() => void handleSave()}
          disabled={isSaving || unchanged}
          startIcon={isSaving ? <CircularProgress size={16} /> : undefined}
          sx={{ mt: dense ? 0 : 0.25, flexShrink: 0 }}
        >
          {isSaving ? 'Salvando' : 'Salvar'}
        </Button>
      </Stack>

      {dense && error && (
        <Typography variant="caption" sx={{ color: 'error.main' }}>
          {error}
        </Typography>
      )}

      {savedAs && !error && (
        <Chip
          size="small"
          color={savedAs === 'value' ? 'success' : 'default'}
          variant="outlined"
          icon={savedAs === 'value' ? <CheckCircleOutlinedIcon /> : undefined}
          label={savedAs === 'value' ? 'Salvo' : 'Marcado como não informado'}
          sx={{ alignSelf: 'flex-start' }}
        />
      )}

      {warning && (
        <Typography variant="caption" sx={{ color: 'warning.main' }}>
          {warning}
        </Typography>
      )}
    </Stack>
  );
}
