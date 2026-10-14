import { CircularProgress, Paper, Stack, Typography } from '@mui/material';
import { brandCore } from '@/theme/tokens';

const { color, radius } = brandCore;

type AnalysisProgressProps = {
  /** Rótulo do período em apuração, quando já se sabe qual é. */
  periodLabel?: string | null;
};

/**
 * Espera longa da apuração do período.
 *
 * Entra no lugar dos skeletons quando a resposta passa de alguns segundos: um
 * esqueleto parado sugere travamento, enquanto o giro mais o texto dizem que
 * algo está acontecendo e por que leva tempo. O texto é a parte que importa —
 * a apuração realmente pagina todos os pedidos e consulta o Mercado Livre por
 * remessa e por período de billing.
 */
export function AnalysisProgress({ periodLabel }: AnalysisProgressProps) {
  return (
    <Paper
      elevation={0}
      role="status"
      aria-live="polite"
      sx={{
        border: `1px solid ${color.borderNavy}`,
        borderRadius: `${radius.md}px`,
        bgcolor: 'background.paper',
        px: { xs: 2, md: 3 },
        py: { xs: 5, md: 7 },
      }}
    >
      <Stack spacing={2} sx={{ alignItems: 'center', textAlign: 'center' }}>
        <CircularProgress size={36} thickness={4} aria-hidden />

        <Stack spacing={0.75} sx={{ alignItems: 'center' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Apurando o período
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ maxWidth: 520 }}
          >
            Estamos lendo todos os pedidos
            {periodLabel ? ` de ${periodLabel}` : ' do período'} e buscando no
            Mercado Livre o custo de cada envio e as tarifas cobradas. A
            primeira apuração de um período é a mais demorada.
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Pode levar alguns minutos. Você não precisa recarregar a página.
          </Typography>
        </Stack>
      </Stack>
    </Paper>
  );
}
