import { Box, Stack, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import { brandColors } from '@/theme/theme';

type LogoVariant = 'full' | 'mark' | 'wordmark';

type LogoProps = {
  variant?: LogoVariant;
  /** Tamanho do símbolo circular em px. */
  size?: number;
  sx?: SxProps<Theme>;
};

const LogoMark = ({ size }: { size: number }) => (
  <svg
    role="img"
    aria-label="ProfitCore"
    width={size}
    height={size}
    viewBox="0 0 120 120"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="pc-bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor={brandColors.deepBlue} />
        <stop offset="100%" stopColor="#1F229A" />
      </linearGradient>
    </defs>
    <circle cx="60" cy="60" r="56" fill="url(#pc-bg)" />
    <circle
      cx="60"
      cy="60"
      r="52"
      fill="none"
      stroke="#1B2278"
      strokeWidth="4"
      opacity="0.7"
    />
    <path
      d="M22 82 L44 62 L58 74 L82 46"
      fill="none"
      stroke={brandColors.brightGreen}
      strokeWidth="9"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M74 42 L88 40 L86 54 Z"
      fill={brandColors.brightGreen}
      stroke={brandColors.brightGreen}
      strokeWidth="4"
      strokeLinejoin="round"
    />
  </svg>
);

const LogoWordmark = ({ fontSize }: { fontSize: number }) => (
  <Stack direction="row" spacing={0} sx={{ alignItems: 'baseline' }}>
    <Typography
      component="span"
      sx={{
        fontSize,
        fontWeight: 800,
        letterSpacing: '-0.01em',
        color: brandColors.green,
      }}
    >
      Profit
    </Typography>
    <Typography
      component="span"
      sx={{
        fontSize,
        fontWeight: 800,
        letterSpacing: '-0.01em',
        color: brandColors.midBlue,
      }}
    >
      Core
    </Typography>
  </Stack>
);

export function Logo({ variant = 'full', size = 72, sx }: LogoProps) {
  const wordmarkSize = Math.max(18, Math.round(size * 0.32));

  if (variant === 'mark') {
    return (
      <Box sx={sx} aria-label="Logo ProfitCore">
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
