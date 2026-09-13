import { Box, CircularProgress } from '@mui/material';

type FullScreenLoaderProps = {
  /** Anunciado a leitores de tela: a espera precisa ter significado. */
  label: string;
};

export function FullScreenLoader({ label }: FullScreenLoaderProps) {
  return (
    <Box
      role="status"
      aria-label={label}
      sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}
    >
      <CircularProgress aria-hidden />
    </Box>
  );
}
