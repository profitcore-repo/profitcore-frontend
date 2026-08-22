import { alpha, createTheme } from '@mui/material/styles';
import { brandCore } from '@/theme/tokens';

const { color, radius, font } = brandCore;

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: color.profitGreen,
      dark: color.profitGreenDark,
      contrastText: color.base,
    },
    secondary: {
      main: color.onSurfaceVariant,
      contrastText: color.base,
    },
    error: {
      main: color.riskRed,
      contrastText: color.base,
    },
    warning: {
      main: color.tertiary,
      contrastText: color.base,
    },
    success: {
      main: color.profitGreen,
      contrastText: color.base,
    },
    background: {
      default: color.base,
      paper: color.surfaceNavy,
    },
    text: {
      primary: color.onSurface,
      secondary: color.textMuted,
      disabled: color.outline,
    },
    divider: color.borderNavy,
  },
  shape: {
    borderRadius: radius.md,
  },
  typography: {
    fontFamily: font.family,
    h1: { fontSize: 48, lineHeight: 1.1, letterSpacing: '-0.02em', fontWeight: 700 },
    h2: { fontSize: 36, lineHeight: 1.15, letterSpacing: '-0.02em', fontWeight: 700 },
    h3: { fontSize: 32, lineHeight: 1.25, letterSpacing: '-0.01em', fontWeight: 600 },
    h4: { fontSize: 28, lineHeight: 1.25, fontWeight: 600 },
    h5: { fontSize: 24, lineHeight: 1.3, fontWeight: 600 },
    h6: { fontSize: 18, lineHeight: 1.4, fontWeight: 600 },
    subtitle1: { fontSize: 18, lineHeight: 1.6, fontWeight: 500 },
    subtitle2: { fontSize: 14, lineHeight: 1.5, fontWeight: 600 },
    body1: { fontSize: 16, lineHeight: 1.5, fontWeight: 400 },
    body2: { fontSize: 14, lineHeight: 1.5, fontWeight: 400 },
    caption: { fontSize: 12, lineHeight: 1.4, fontWeight: 400 },
    overline: {
      fontSize: 12,
      lineHeight: 1,
      letterSpacing: '0.05em',
      fontWeight: 600,
      textTransform: 'uppercase',
    },
    button: {
      fontSize: 16,
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        ':root': {
          colorScheme: 'dark',
        },
        body: {
          backgroundColor: color.base,
        },
        '*:focus-visible': {
          outline: `2px solid ${color.profitGreen}`,
          outlineOffset: 2,
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: radius.md,
          paddingBlock: 10,
        },
        outlined: {
          borderColor: color.borderNavy,
        },
      },
      variants: [
        {
          props: { variant: 'contained', color: 'primary' },
          style: {
            fontWeight: 700,
            transition: 'transform 200ms ease-out, box-shadow 200ms ease-out',
            '&:hover': {
              backgroundColor: color.profitGreen,
              transform: 'translateY(-2px)',
              boxShadow: `0 10px 24px ${alpha(color.profitGreen, 0.25)}`,
            },
            '@media (prefers-reduced-motion: reduce)': {
              transition: 'none',
              '&:hover': { transform: 'none' },
            },
          },
        },
      ],
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        fullWidth: true,
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: radius.md,
          backgroundColor: alpha(color.surfaceContainer, 0.6),
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: color.borderNavy,
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: color.outline,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        rounded: {
          borderRadius: radius.md,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottomColor: color.borderNavy,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: radius.pill,
          fontWeight: 600,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: color.surfaceContainerHigh,
          color: color.onSurface,
          fontSize: 12,
          border: `1px solid ${color.borderNavy}`,
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: color.surfaceNavy,
          border: `1px solid ${color.borderNavy}`,
        },
      },
    },
  },
});

export type AppTheme = typeof theme;
