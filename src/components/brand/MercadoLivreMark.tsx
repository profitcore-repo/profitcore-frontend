import { Box } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import mercadoLivreLogo from '@/assets/mercado-libre.svg';

type MercadoLivreMarkProps = {
  /** Lado do tile em px. */
  size?: number;
  sx?: SxProps<Theme>;
};

/**
 * Tile de marca do Mercado Livre.
 *
 * Usa o SVG oficial versionado em `src/assets/mercado-libre.svg` — o brand core proíbe
 * hotlink de asset externo e proíbe aplicar tokens ProfitCore sobre a marca de terceiro.
 */
export function MercadoLivreMark({ size = 48, sx }: MercadoLivreMarkProps) {
  return (
    <Box
      sx={[
        {
          width: size,
          height: size,
          display: 'grid',
          placeItems: 'center',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Box
        component="img"
        src={mercadoLivreLogo}
        alt="Mercado Livre"
        sx={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          display: 'block',
        }}
      />
    </Box>
  );
}
