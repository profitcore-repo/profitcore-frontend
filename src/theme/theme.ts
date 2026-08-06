import { createTheme } from '@mui/material/styles';

/**
 * Paleta de cores derivada da logo ProfitCore:
 * - Azul de fundo profundo (círculo/marca)
 * - Verde vibrante (texto "Profit" e seta ascendente)
 * - Azul médio (texto "Core")
 */
export const brandColors = {
  deepBlue: '#2A2FBE',
  midBlue: '#4A6FE3',
  green: '#3ED569',
  brightGreen: '#33E17A',
  ink: '#0F172A',
  surface: '#FFFFFF',
  softSurface: '#F5F7FB',
  border: '#E2E8F0',
  mutedText: '#64748B',
} as const;

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: brandColors.midBlue,
      dark: brandColors.deepBlue,
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: brandColors.green,
      dark: '#2FB559',
      contrastText: '#0B1B12',
    },
    background: {
      default: brandColors.softSurface,
      paper: brandColors.surface,
    },
    text: {
      primary: brandColors.ink,
      secondary: brandColors.mutedText,
    },
    divider: brandColors.border,
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily:
      'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          paddingBlock: 10,
        },
        containedPrimary: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 6px 16px rgba(74, 111, 227, 0.25)',
          },
        },
      },
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
          borderRadius: 10,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 16,
        },
      },
    },
  },
});

export type AppTheme = typeof theme;
