import { useState, type MouseEvent, type ReactNode } from 'react';
import {
  AppBar,
  Avatar,
  Box,
  Container,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/hooks/useAuth';
import { brandColors } from '@/theme/theme';

type DashboardLayoutProps = {
  children: ReactNode;
};

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, signOut } = useAuth();
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  const openMenu = (e: MouseEvent<HTMLElement>) => setMenuAnchor(e.currentTarget);
  const closeMenu = () => setMenuAnchor(null);

  const initial = (user?.name?.[0] ?? user?.email?.[0] ?? '?').toUpperCase();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="sticky"
        elevation={0}
        color="inherit"
        sx={{
          bgcolor: 'background.paper',
          borderBottom: `1px solid ${brandColors.border}`,
        }}
      >
        <Toolbar sx={{ gap: 2 }}>
          <Stack direction="row" spacing={1.25} sx={{ flexGrow: 1, alignItems: 'center' }}>
            <Logo variant="mark" size={32} />
            <Logo variant="wordmark" size={64} />
          </Stack>

          <Tooltip title={user?.email ?? ''}>
            <IconButton onClick={openMenu} size="small" aria-label="Conta">
              <Avatar
                sx={{
                  width: 34,
                  height: 34,
                  bgcolor: brandColors.midBlue,
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                {initial}
              </Avatar>
            </IconButton>
          </Tooltip>

          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={closeMenu}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <Box sx={{ px: 2, py: 1, minWidth: 200 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {user?.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.email}
              </Typography>
            </Box>
            <MenuItem
              onClick={() => {
                closeMenu();
                signOut();
              }}
            >
              <LogoutOutlinedIcon fontSize="small" style={{ marginRight: 8 }} />
              Sair
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        {children}
      </Container>
    </Box>
  );
}
