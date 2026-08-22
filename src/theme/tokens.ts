/**
 * ProfitCore Brand Core — fonte da verdade dos tokens visuais.
 *
 * Espelha o design system definido em `.kiro/steering/brand-core.md`.
 * Qualquer valor visual novo entra aqui primeiro; componentes só consomem tokens.
 */

export const brandCore = {
  color: {
    /** Fundo da aplicação, sidebar e header. */
    base: '#08111F',
    /** Superfície de cards, tabelas e painéis. */
    surfaceNavy: '#121C2B',
    /** Tiles, avatares e hover de item de menu. */
    surfaceContainer: '#1F1F21',
    /** Hover elevado e inputs. */
    surfaceContainerHigh: '#2A2A2B',
    /** Toda borda e divisor. */
    borderNavy: '#1E293B',
    /** Ação primária, estado ativo e indicador positivo. */
    profitGreen: '#00EFA0',
    /** Verde de apoio para hover/gradiente. */
    profitGreenDark: '#00C283',
    /** Texto primário. */
    onSurface: '#E4E2E3',
    /** Texto de apoio. */
    onSurfaceVariant: '#C5C6CC',
    /** Texto secundário e legendas. */
    textMuted: '#94A3B8',
    /** Ícones neutros e placeholders. */
    outline: '#8F9096',
    /** Erro, risco e estado negativo. */
    riskRed: '#E5484D',
    /** Alerta/atenção, uso pontual. */
    tertiary: '#E2C0A8',
    /** Marca Mercado Livre — não usar em elementos ProfitCore. */
    mercadoLivreYellow: '#FFE600',
    mercadoLivreBlue: '#2D3277',
  },
  radius: {
    xs: 2,
    sm: 4,
    md: 8,
    pill: 12,
    lg: 16,
  },
  layout: {
    sidebarWidth: 256,
    headerHeight: 64,
    contentMaxWidth: 1280,
  },
  font: {
    family: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
  },
} as const;

export type BrandCore = typeof brandCore;
