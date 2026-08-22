import { Box, Stack, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import profitCoreLogo from '@/assets/LOGO.svg';

type LogoVariant = 'full' | 'mark' | 'wordmark';

type LogoProps = {
  variant?: LogoVariant;
  size?: number;
  sx?: SxProps<Theme>;
};


const LogoMark = ({ size }: { size: number }) => (
  <Box
    component="img"
    src={profitCoreLogo}
    alt="ProfitCore"
    sx={{
      width: size,
      height: size,
      display: 'block',
      objectFit: 'contain',
      flexShrink: 0,
    }}
  />
);

const LogoWordmark = ({ fontSize }: { fontSize: number }) => (
  <Typography
    component="span"
    sx={{
      fontSize,
      fontWeight: 600,
      letterSpacing: '-0.01em',
      lineHeight: 1.3,
      color: 'text.primary',
      whiteSpace: 'nowrap',
    }}
  >
    ProfitCore
  </Typography>
);

export function Logo({ variant = 'full', size = 72, sx }: LogoProps) {
  const wordmarkSize = Math.max(16, Math.round(size * 0.32));

  if (variant === 'mark') {
    return (
      <Box sx={[{ lineHeight: 0 }, ...(Array.isArray(sx) ? sx : [sx])]}>
        <LogoMark size={size} />
      </Box>
    );
  }

  if (variant === 'wordmark') {
    return (
      <Box sx={sx} aria-label="ProfitCore">
        <LogoWordmark fontSize={wordmarkSize} />
      </Box>
    );
  }

  return (
    <Stack
      spacing={1.25}
      sx={[{ alignItems: 'center' }, ...(Array.isArray(sx) ? sx : [sx])]}
    >
      <LogoMark size={size} />
      <LogoWordmark fontSize={wordmarkSize} />
    </Stack>
  );
}
