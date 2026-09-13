import { Stack, Typography } from '@mui/material';
import { SkusTable } from '@/features/skus/SkusTable';

export function ProductsPage() {
  return (
    <Stack spacing={3}>
      <Stack spacing={0.5}>
        <Typography variant="h4" component="h1">
          Produtos
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Seus SKUs importados do Mercado Livre. Informe ou ajuste o CMV para a
          leitura de margem cobrir mais produtos. Custo zero é válido; deixe o
          campo vazio para marcar como não informado.
        </Typography>
      </Stack>

      <SkusTable />
    </Stack>
  );
}
