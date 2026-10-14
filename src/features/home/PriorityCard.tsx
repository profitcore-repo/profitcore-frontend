import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, Chip, Paper, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { brandCore } from '@/theme/tokens';
import type { Priority, PrioritySeverity } from '@/features/home/priorities';

const { color, radius } = brandCore;

const SEVERITY_COLOR: Record<PrioritySeverity, string> = {
  risk: color.riskRed,
  attention: color.tertiary,
  info: color.profitGreen,
};

const SEVERITY_CHIP: Record<PrioritySeverity, 'error' | 'warning' | 'default'> = {
  risk: 'error',
  attention: 'warning',
  info: 'default',
};

type PriorityCardProps = {
  priority: Priority;
  rank: number;
  /** Ações restritas a admin só aparecem para quem pode abrir a rota. */
  canSeeRestricted: boolean;
};

/**
 * Uma situação do período: o que é, por que importa e quanto pesa.
 *
 * O número de impacto fica à direita, separado do texto, porque é o que
 * ordena a decisão — e o texto ao lado é o que impede o seller de agir só pelo
 * número.
 */
export function PriorityCard({
  priority,
  rank,
  canSeeRestricted,
}: PriorityCardProps) {
  const accent = SEVERITY_COLOR[priority.severity];
  const actions = priority.actions.filter(
    (action) => !action.adminOnly || canSeeRestricted,
  );

  return (
    <Paper
      elevation={0}
      sx={{
        border: `1px solid ${color.borderNavy}`,
        borderLeft: `3px solid ${accent}`,
        borderRadius: `${radius.md}px`,
        bgcolor: 'background.paper',
        p: { xs: 2, md: 2.5 },
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={{ xs: 2, md: 3 }}
        sx={{ alignItems: { md: 'flex-start' } }}
      >
        <Box
          aria-hidden
          sx={{
            width: 34,
            height: 34,
            flexShrink: 0,
            borderRadius: `${radius.md}px`,
            bgcolor: alpha(accent, 0.12),
            color: accent,
            display: 'grid',
            placeItems: 'center',
            fontWeight: 700,
          }}
        >
          {rank}
        </Box>

        <Stack spacing={1.25} sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {priority.title}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ maxWidth: 760 }}
          >
            {priority.description}
          </Typography>

          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            sx={{ alignItems: 'center', flexWrap: 'wrap', pt: 0.5 }}
          >
            <Chip
              size="small"
              variant="outlined"
              color={SEVERITY_CHIP[priority.severity]}
              label={priority.badgeLabel}
            />
            {actions.map((action) => (
              <Button
                key={action.to}
                component={RouterLink}
                to={action.to}
                size="small"
                variant="outlined"
                sx={{ py: 0.5 }}
              >
                {action.label}
              </Button>
            ))}
          </Stack>
        </Stack>

        <Stack
          spacing={0.25}
          sx={{
            minWidth: { md: 160 },
            textAlign: { md: 'right' },
            flexShrink: 0,
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontVariantNumeric: 'tabular-nums',
              color: priority.impactIsNegative ? 'error.main' : 'text.primary',
            }}
          >
            {priority.impactValue}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {priority.impactCaption}
          </Typography>
        </Stack>
      </Stack>
    </Paper>
  );
}
