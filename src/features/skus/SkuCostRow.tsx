import { Paper, Stack, Typography } from '@mui/material';
import { SkuCmvField } from '@/features/skus/SkuCmvField';
import { hasCmv, type MainSku } from '@/features/skus/skuSales';
import { brandCore } from '@/theme/tokens';
import { formatBRL } from '@/utils/currency';

const { color } = brandCore;

type SkuCostRowProps = {
  entry: MainSku;
  /** `cmv: null` marca como não informado. */
  onSave: (skuId: string, cmv: number | null) => Promise<void>;
};

/** Cartão de um SKU no passo de onboarding, onde só há três itens na tela. */
export function SkuCostRow({ entry, onSave }: SkuCostRowProps) {
  const { sku, title, sales } = entry;
  const showSales = sales.realizedRevenue > 0;
  const informed = hasCmv(sku);

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, md: 2.5 },
        bgcolor: 'background.paper',
        border: `1px solid ${informed ? color.profitGreen : color.borderNavy}`,
        transition: 'border-color 180ms ease-out',
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ alignItems: { md: 'flex-start' }, justifyContent: 'space-between' }}
      >
        <Stack spacing={0.5} sx={{ minWidth: 0, flex: 1 }}>
          {/* Sem título vindo dos pedidos, o código é tudo que temos do produto. */}
          <Typography sx={{ fontWeight: 600 }}>{title ?? sku.code}</Typography>
          <Typography variant="caption" sx={{ color: color.textMuted }}>
            {showSales
              ? `${formatBRL(sales.realizedRevenue)} em vendas · ${sales.unitsSold} ${
                  sales.unitsSold === 1 ? 'unidade' : 'unidades'
                }`
              : 'Sem vendas no período analisado'}
          </Typography>
          {title && (
            <Typography variant="caption" sx={{ color: color.textMuted }}>
              {sku.code}
            </Typography>
          )}
        </Stack>

        <Stack sx={{ minWidth: { md: 320 } }}>
          <SkuCmvField sku={sku} sales={sales} onSave={onSave} />
        </Stack>
      </Stack>
    </Paper>
  );
}
