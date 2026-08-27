import { useEffect, useState, type ComponentType, type MouseEvent } from 'react';
import { Link as RouterLink, Outlet, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Divider,
  Drawer,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import type { SvgIconProps } from '@mui/material/SvgIcon';
import SpaceDashboardOutlinedIcon from '@mui/icons-material/SpaceDashboardOutlined';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import HubOutlinedIcon from '@mui/icons-material/HubOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import MenuOutlinedIcon from '@mui/icons-material/MenuOutlined';
import { Logo } from '@/components/Logo';
import { ProfileDialog } from '@/features/users/ProfileDialog';
import { useAuth } from '@/hooks/useAuth';
import { brandCore } from '@/theme/tokens';
import { isAdminEmail } from '@/utils/isAdminEmail';

const { color, radius, layout } = brandCore;

/** Logo.wordmark deriva a fonte de `size * 0.32`; 75 => 24px (variante h5 do brand core). */
const WORDMARK_SIZE = 75;

/** Largura do "trilho" (rail) da sidebar quando colapsada — cabe só o botão do menu. */
const SIDEBAR_RAIL_WIDTH = 72;

/**
 * Recuos fixos (não mudam entre aberto/fechado) para que os ícones fiquem
 * exatamente no centro do rail e não se desloquem durante a animação.
 * Ícone: 12 + 12 + 24/2 = 36 = centro do rail de 72.
 * Hamburger: o IconButton do MUI mede 40px, então 16 + 40/2 = 36.
 */
const NAV_ICON_SLOT = 24;
const NAV_CONTAINER_INSET = 12;
const NAV_ITEM_INSET = 12;
const HEADER_INSET = (SIDEBAR_RAIL_WIDTH - 40) / 2;

/**
 * O layout é uma route layout, então o estado do menu sobrevive à navegação em
 * memória. Persistimos a preferência apenas para sobreviver a reload/redirect
 * externo (ex.: retorno do OAuth do Mercado Livre).
 */
const SIDEBAR_STATE_KEY = 'profitcore.ui.sidebarOpen';

function readStoredSidebarOpen(): boolean | null {
  try {
    const raw = window.localStorage.getItem(SIDEBAR_STATE_KEY);
    if (raw === 'true') return true;
    if (raw === 'false') return false;
    return null;
  } catch {
    return null;
  }
}

function persistSidebarOpen(open: boolean): void {
  try {
    window.localStorage.setItem(SIDEBAR_STATE_KEY, String(open));
  } catch {
    /* storage indisponível */
  }
}

type NavItem = {
  to: string;
  label: string;
  icon: ComponentType<SvgIconProps>;
  /** Item previsto no design, porém sem tela publicada. Renderiza sem link. */
  disabled?: boolean;
  /** Disponível apenas para contas de admin (ex.: listagem de usuários do sistema). */
  adminOnly?: boolean;
};

const NAV_ITEMS: readonly NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: SpaceDashboardOutlinedIcon },
  { to: '/users', label: 'Usuários', icon: AdminPanelSettingsOutlinedIcon, adminOnly: true },
  { to: '/connections', label: 'Conexões', icon: HubOutlinedIcon },
  { to: '/products', label: 'Produtos', icon: Inventory2OutlinedIcon, disabled: true },
  { to: '/insights', label: 'Insights', icon: InsightsOutlinedIcon, disabled: true },
] as const;

export function DashboardLayout() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() =>
    isMobile ? false : (readStoredSidebarOpen() ?? true),
  );
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Fecha ao entrar no breakpoint mobile e restaura a preferência ao voltar
  // para telas grandes. Não persiste, para não sobrescrever a escolha do usuário.
  useEffect(() => {
    setIsSidebarOpen(isMobile ? false : (readStoredSidebarOpen() ?? true));
  }, [isMobile]);

  const openMenu = (e: MouseEvent<HTMLElement>) => setMenuAnchor(e.currentTarget);
  const closeMenu = () => setMenuAnchor(null);
  const toggleSidebar = () => {
    const next = !isSidebarOpen;
    setIsSidebarOpen(next);
    persistSidebarOpen(next);
  };

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);
  const isAdmin = isAdminEmail(user?.email);

  // Largura corrente da sidebar. Colapsada mostra apenas o trilho com o botão do menu.
  const currentSidebarWidth = isSidebarOpen
    ? layout.sidebarWidth
    : SIDEBAR_RAIL_WIDTH;
  const sidebarTransition = theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: isSidebarOpen
      ? theme.transitions.duration.enteringScreen
      : theme.transitions.duration.leavingScreen,
  });

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Drawer
        variant="permanent"
        open
        sx={{
          width: currentSidebarWidth,
          flexShrink: 0,
          transition: sidebarTransition,
          '& .MuiDrawer-paper': {
            width: currentSidebarWidth,
            boxSizing: 'border-box',
            bgcolor: 'background.default',
            borderRight: `1px solid ${color.borderNavy}`,
            backgroundImage: 'none',
            overflowX: 'hidden',
            transition: sidebarTransition,
          },
        }}
      >
        <SidebarContent
          isActive={isActive}
          isAdmin={isAdmin}
          isOpen={isSidebarOpen}
          onToggle={toggleSidebar}
        />
      </Drawer>

      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: `calc(100% - ${currentSidebarWidth}px)`,
          ml: `${currentSidebarWidth}px`,
          transition: sidebarTransition,
          bgcolor: alpha(color.base, 0.9),
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${color.borderNavy}`,
          backgroundImage: 'none',
        }}
      >
        <Toolbar
          disableGutters
          sx={{
            minHeight: layout.headerHeight,
            height: layout.headerHeight,
            px: { xs: 2, md: 4 },
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center', minWidth: 0 }}>
            <Tooltip title="Busca global em breve">
              <Stack
                direction="row"
                spacing={2}
                sx={{ alignItems: 'center', minWidth: 0, cursor: 'default' }}
              >
                <SearchOutlinedIcon sx={{ color: color.outline, fontSize: 20 }} />
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                    display: { xs: 'none', sm: 'block' },
                    whiteSpace: 'nowrap',
                  }}
                >
                  Busca global...
                </Typography>
              </Stack>
            </Tooltip>
          </Stack>

          <Stack direction="row" spacing={3} sx={{ alignItems: 'center', minWidth: 0 }}>
            <Stack
              direction="row"
              spacing={1}
              sx={{
                alignItems: 'center',
                pr: 3,
                borderRight: `1px solid ${color.borderNavy}`,
                display: { xs: 'none', sm: 'flex' },
              }}
            >
              <Tooltip title="Notificações em breve">
                <IconButton
                  aria-label="Notificações"
                  size="small"
                  sx={{
                    color: 'text.secondary',
                    '&:hover': { color: 'primary.main' },
                  }}
                >
                  <NotificationsNoneOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Ajuda em breve">
                <IconButton
                  aria-label="Ajuda"
                  size="small"
                  sx={{
                    color: 'text.secondary',
                    '&:hover': { color: 'primary.main' },
                  }}
                >
                  <HelpOutlineOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>

            <Stack
              direction="row"
              spacing={1.5}
              onClick={openMenu}
              role="button"
              tabIndex={0}
              aria-label="Abrir menu da conta"
              aria-haspopup="menu"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openMenu(e as unknown as MouseEvent<HTMLElement>);
                }
              }}
              sx={{ alignItems: 'center', cursor: 'pointer', minWidth: 0 }}
            >
              <Stack
                spacing={0.25}
                sx={{ textAlign: 'right', minWidth: 0, display: { xs: 'none', sm: 'flex' } }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: 'text.primary',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {user?.name ?? 'Minha conta'}
                </Typography>
                <Typography
                  variant="overline"
                  sx={{
                    color: 'text.secondary',
                    fontSize: 11,
                    textTransform: 'none',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {user?.email ?? ''}
                </Typography>
              </Stack>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  flexShrink: 0,
                  borderRadius: `${radius.pill}px`,
                  bgcolor: color.surfaceContainer,
                  border: `1px solid ${color.borderNavy}`,
                  display: 'grid',
                  placeItems: 'center',
                  color: 'text.secondary',
                }}
              >
                <PersonOutlineOutlinedIcon sx={{ fontSize: 18 }} />
              </Box>
            </Stack>
          </Stack>
        </Toolbar>
      </AppBar>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={closeMenu}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1, minWidth: 220 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {user?.name}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {user?.email}
          </Typography>
        </Box>
        <Divider sx={{ borderColor: color.borderNavy }} />
        <MenuItem
          onClick={() => {
            closeMenu();
            setIsProfileOpen(true);
          }}
        >
          <ManageAccountsOutlinedIcon fontSize="small" sx={{ mr: 1 }} />
          Meus dados
        </MenuItem>
        <MenuItem
          onClick={() => {
            closeMenu();
            void signOut();
          }}
        >
          <LogoutOutlinedIcon fontSize="small" sx={{ mr: 1 }} />
          Sair
        </MenuItem>
      </Menu>

      <ProfileDialog open={isProfileOpen} onClose={() => setIsProfileOpen(false)} />

      <Box
        component="main"
        sx={{
          ml: `${currentSidebarWidth}px`,
          pt: `${layout.headerHeight}px`,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          transition: sidebarTransition,
        }}
      >
        <Box
          sx={{
            flex: 1,
            width: '100%',
            maxWidth: layout.contentMaxWidth,
            mx: 'auto',
            px: { xs: 2, md: 4 },
            py: 3,
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

type SidebarContentProps = {
  isActive: (path: string) => boolean;
  isAdmin: boolean;
  isOpen: boolean;
  onToggle: () => void;
};

function SidebarContent({
  isActive,
  isAdmin,
  isOpen,
  onToggle,
}: SidebarContentProps) {
  const theme = useTheme();
  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.adminOnly || isAdmin,
  );

  /**
   * Os labels nunca desmontam: eles apenas somem via opacidade, no mesmo ritmo
   * da largura do drawer. Desmontar causava o texto piscar antes do colapso.
   */
  const labelTransition = theme.transitions.create('opacity', {
    easing: theme.transitions.easing.sharp,
    duration: isOpen
      ? theme.transitions.duration.enteringScreen
      : theme.transitions.duration.leavingScreen,
  });

  /** Aplicado em todo texto que colapsa junto com a sidebar. */
  const collapsibleLabelSx = {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'clip',
    opacity: isOpen ? 1 : 0,
    transition: labelTransition,
  } as const;

  return (
    <Stack sx={{ height: '100%' }}>
      <Stack
        direction="row"
        spacing={1.5}
        sx={{
          alignItems: 'center',
          px: `${HEADER_INSET}px`,
          py: 2,
          mb: 1,
          minHeight: 72,
          flexShrink: 0,
        }}
      >
        <Tooltip
          title={isOpen ? 'Fechar menu' : 'Abrir menu'}
          placement="right"
        >
          <IconButton
            aria-label={isOpen ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
            aria-expanded={isOpen}
            onClick={onToggle}
            sx={{ color: 'text.secondary', flexShrink: 0 }}
          >
            <MenuOutlinedIcon />
          </IconButton>
        </Tooltip>
        <Stack
          direction="row"
          spacing={1.5}
          aria-hidden={!isOpen}
          sx={{
            alignItems: 'center',
            flexShrink: 0,
            opacity: isOpen ? 1 : 0,
            transition: labelTransition,
            pointerEvents: isOpen ? 'auto' : 'none',
          }}
        >
          <Logo variant="mark" size={32} />
          <Logo variant="wordmark" size={WORDMARK_SIZE} />
        </Stack>
      </Stack>

      <Stack
        component="nav"
        spacing={0.5}
        sx={{ flex: 1, px: `${NAV_CONTAINER_INSET}px` }}
      >
        {visibleItems.map(({ to, label, icon: Icon, disabled }) => {
          const active = isActive(to);
          const tooltipTitle = disabled
            ? 'Em breve'
            : !isOpen
              ? label
              : '';

          const inner = (
            <Stack
              direction="row"
              spacing={1.5}
              aria-current={active ? 'page' : undefined}
              aria-disabled={disabled ? 'true' : undefined}
              sx={{
                alignItems: 'center',
                px: `${NAV_ITEM_INSET}px`,
                py: 1.5,
                borderRadius: `${radius.sm}px`,
                textDecoration: 'none',
                overflow: 'hidden',
                transition: 'background-color 200ms ease-out, color 200ms ease-out',
                ...(disabled
                  ? {
                      color: 'text.disabled',
                      cursor: 'default',
                    }
                  : active
                    ? {
                        bgcolor: alpha(color.profitGreen, 0.1),
                        color: 'primary.main',
                        fontWeight: 600,
                      }
                    : {
                        color: 'text.secondary',
                        '&:hover': {
                          bgcolor: color.surfaceContainer,
                          color: 'text.primary',
                        },
                      }),
              }}
            >
              <Box
                sx={{
                  width: NAV_ICON_SLOT,
                  flexShrink: 0,
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <Icon sx={{ fontSize: 20 }} />
              </Box>
              <Typography
                variant="body2"
                aria-hidden={!isOpen}
                sx={{
                  ...collapsibleLabelSx,
                  flex: 1,
                  minWidth: 0,
                  fontWeight: active ? 600 : 400,
                  color: 'inherit',
                }}
              >
                {label}
              </Typography>
              {disabled && (
                <Typography
                  variant="caption"
                  aria-hidden={!isOpen}
                  sx={{
                    ...collapsibleLabelSx,
                    flexShrink: 0,
                    fontSize: 10,
                    opacity: isOpen ? 0.8 : 0,
                  }}
                >
                  Em breve
                </Typography>
              )}
            </Stack>
          );

          const node = disabled ? (
            inner
          ) : (
            <Box
              component={RouterLink}
              to={to}
              sx={{ textDecoration: 'none', display: 'block' }}
            >
              {inner}
            </Box>
          );

          if (tooltipTitle) {
            return (
              <Tooltip key={to} title={tooltipTitle} placement="right">
                {node}
              </Tooltip>
            );
          }
          return <Box key={to}>{node}</Box>;
        })}
      </Stack>

      <Box
        sx={{
          p: `${NAV_CONTAINER_INSET}px`,
          borderTop: `1px solid ${color.borderNavy}`,
          flexShrink: 0,
        }}
      >
        <Tooltip title="Em breve" placement="right">
          <Stack
            direction="row"
            spacing={1.5}
            aria-disabled="true"
            sx={{
              alignItems: 'center',
              px: `${NAV_ITEM_INSET}px`,
              py: 1,
              color: 'text.secondary',
              cursor: 'default',
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                width: NAV_ICON_SLOT,
                flexShrink: 0,
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <SettingsOutlinedIcon sx={{ fontSize: 20 }} />
            </Box>
            <Typography variant="body2" aria-hidden={!isOpen} sx={collapsibleLabelSx}>
              Configurações
            </Typography>
          </Stack>
        </Tooltip>
      </Box>
    </Stack>
  );
}
