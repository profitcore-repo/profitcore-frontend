import { useState, type ComponentType, type MouseEvent, type ReactNode } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
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
} from '@mui/material';
import { alpha } from '@mui/material/styles';
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

const { color, radius, layout } = brandCore;

/** Logo.wordmark deriva a fonte de `size * 0.32`; 75 => 24px (variante h5 do brand core). */
const WORDMARK_SIZE = 75;

type NavItem = {
  to: string;
  label: string;
  icon: ComponentType<SvgIconProps>;
  /** Item previsto no design, porém sem tela publicada. Renderiza sem link. */
  disabled?: boolean;
};

const NAV_ITEMS: readonly NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: SpaceDashboardOutlinedIcon },
  // { to: '/users', label: 'Usuários', icon: AdminPanelSettingsOutlinedIcon },
  { to: '/connections', label: 'Conexões', icon: HubOutlinedIcon },
  { to: '/products', label: 'Produtos', icon: Inventory2OutlinedIcon, disabled: true },
  { to: '/insights', label: 'Insights', icon: InsightsOutlinedIcon, disabled: true },
] as const;

type DashboardLayoutProps = {
  children: ReactNode;
};

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const openMenu = (e: MouseEvent<HTMLElement>) => setMenuAnchor(e.currentTarget);
  const closeMenu = () => setMenuAnchor(null);

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Drawer
        variant="permanent"
        open
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            width: layout.sidebarWidth,
            boxSizing: 'border-box',
            bgcolor: 'background.default',
            borderRight: `1px solid ${color.borderNavy}`,
            backgroundImage: 'none',
          },
        }}
      >
        <SidebarContent isActive={isActive} />
      </Drawer>

      <Drawer
        variant="temporary"
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: layout.sidebarWidth,
            boxSizing: 'border-box',
            bgcolor: 'background.default',
            borderRight: `1px solid ${color.borderNavy}`,
            backgroundImage: 'none',
          },
        }}
      >
        <SidebarContent
          isActive={isActive}
          onNavigate={() => setIsDrawerOpen(false)}
        />
      </Drawer>

      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${layout.sidebarWidth}px)` },
          ml: { md: `${layout.sidebarWidth}px` },
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
            <IconButton
              aria-label="Abrir menu de navegação"
              onClick={() => setIsDrawerOpen(true)}
              sx={{ display: { md: 'none' }, color: 'text.secondary' }}
            >
              <MenuOutlinedIcon />
            </IconButton>

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
          ml: { md: `${layout.sidebarWidth}px` },
          pt: `${layout.headerHeight}px`,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
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
          {children}
        </Box>
      </Box>
    </Box>
  );
}

type SidebarContentProps = {
  isActive: (path: string) => boolean;
  onNavigate?: () => void;
};

function SidebarContent({ isActive, onNavigate }: SidebarContentProps) {
  return (
    <Stack sx={{ height: '100%' }}>
      <Stack
        direction="row"
        spacing={1.5}
        sx={{ alignItems: 'center', p: 3, mb: 2 }}
      >
        <Logo variant="mark" size={32} />
        <Logo variant="wordmark" size={WORDMARK_SIZE} />
      </Stack>

      <Stack component="nav" spacing={0.5} sx={{ flex: 1, px: 2 }}>
        {NAV_ITEMS.map(({ to, label, icon: Icon, disabled }) => {
          const active = isActive(to);

          if (disabled) {
            return (
              <Tooltip key={to} title="Em breve" placement="right">
                <Stack
                  direction="row"
                  spacing={1.5}
                  aria-disabled="true"
                  sx={{
                    alignItems: 'center',
                    px: 2,
                    py: 1.5,
                    borderRadius: `${radius.sm}px`,
                    color: 'text.disabled',
                    cursor: 'default',
                  }}
                >
                  <Icon sx={{ fontSize: 20 }} />
                  <Typography variant="body2" sx={{ flex: 1 }}>
                    {label}
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: 10, opacity: 0.8 }}>
                    Em breve
                  </Typography>
                </Stack>
              </Tooltip>
            );
          }

          return (
            <Stack
              key={to}
              component={RouterLink}
              to={to}
              onClick={onNavigate}
              direction="row"
              spacing={1.5}
              aria-current={active ? 'page' : undefined}
              sx={{
                alignItems: 'center',
                px: 2,
                py: 1.5,
                borderRadius: `${radius.sm}px`,
                textDecoration: 'none',
                transition: 'background-color 200ms ease-out, color 200ms ease-out',
                ...(active
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
              <Icon sx={{ fontSize: 20 }} />
              <Typography
                variant="body2"
                sx={{ fontWeight: active ? 600 : 400, color: 'inherit' }}
              >
                {label}
              </Typography>
            </Stack>
          );
        })}
      </Stack>

      <Box sx={{ p: 2, borderTop: `1px solid ${color.borderNavy}` }}>
        <Tooltip title="Em breve" placement="right">
          <Stack
            direction="row"
            spacing={1.5}
            aria-disabled="true"
            sx={{
              alignItems: 'center',
              px: 2,
              py: 1,
              color: 'text.secondary',
              cursor: 'default',
            }}
          >
            <SettingsOutlinedIcon sx={{ fontSize: 20 }} />
            <Typography variant="body2">Configurações</Typography>
          </Stack>
        </Tooltip>
      </Box>
    </Stack>
  );
}
