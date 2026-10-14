import { Paper, Stack, Typography } from '@mui/material';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { brandCore } from '@/theme/tokens';
import type { ReadingConfidence as Confidence } from '@/features/home/priorities';

const { color, radius } = brandCore;

type ReadingConfidenceProps = {
  confidence: Confidence;
};

/**
 * As ressalvas da leitura, fora da lista de prioridades.
 *
 * Paginação incompleta, frete não resolvido ou billing parcial não são
 * situações para agir: são avisos de que **todos** os números da tela podem
 * mudar na próxima apuração. O seller precisa saber disso antes de decidir.
 */
export function ReadingConfidence({ confidence }: ReadingConfidenceProps) {
  if (confidence.level === 'unknown') return null;

  const ok = confidence.isReliable;

  return (
    <Paper
      elevation={0}
      sx={{
        border: `1px solid ${color.borderNavy}`,
        borderRadius: `${radius.md}px`,
        bgcolor: 'background.paper',
        px: { xs: 2, md: 2.5 },
        py: 2,
      }}
    >
      <Stack spacing={1.25}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          {ok ? (
            <CheckCircleOutlinedIcon
              fontSize="small"
              sx={{ color: 'primary.main' }}
            />
          ) : (
            <InfoOutlinedIcon fontSize="small" sx={{ color: 'warning.main' }} />
          )}
          <Typography variant="subtitle2">
            {ok ? 'Leitura fechada' : 'O que ainda limita esta leitura'}
          </Typography>
        </Stack>

        {ok ? (
          <Typography variant="caption" color="text.secondary">
            Paginação conferida, frete resolvido e CMV informado em todos os
            anúncios com venda. Os números do período estão fechados.
          </Typography>
        ) : (
          <Stack component="ul" spacing={0.75} sx={{ m: 0, pl: 2.5 }}>
            {confidence.caveats.map((caveat) => (
              <Typography
                key={caveat}
                component="li"
                variant="caption"
                color="text.secondary"
              >
                {caveat}
              </Typography>
            ))}
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}
