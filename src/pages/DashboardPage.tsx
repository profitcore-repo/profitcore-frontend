import { Box, Divider, Paper, Stack, Typography } from '@mui/material';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { brandColors } from '@/theme/theme';
import { UpdateProfileForm } from '@/features/users/UpdateProfileForm';

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <Stack spacing={4}>
        <Stack spacing={0.5}>
          <Typography variant="h4" component="h1">
            Olá, {user?.name ?? 'usuário'} 👋
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Este é o seu painel. Em breve traremos suas métricas por aqui.
          </Typography>
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, 1.1fr) minmax(0, 0.9fr)' },
            gap: 3,
            alignItems: 'start',
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, md: 5 },
              border: `1px dashed ${brandColors.border}`,
              bgcolor: 'background.paper',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <Stack
              spacing={1.5}
              sx={{
                textAlign: 'center',
                maxWidth: 460,
                alignItems: 'center',
              }}
            >
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  bgcolor: `${brandColors.midBlue}14`,
                  color: 'primary.main',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <InsightsOutlinedIcon fontSize="large" />
              </Box>
              <Typography variant="h6">Nenhum dado por aqui ainda</Typography>
              <Typography variant="body2" color="text.secondary">
                Conecte suas contas e configure suas fontes de dados para ver
                indicadores em tempo real.
              </Typography>
            </Stack>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, md: 4 },
              border: `1px solid ${brandColors.border}`,
              bgcolor: 'background.paper',
            }}
          >
            <Stack spacing={0.25} sx={{ mb: 2 }}>
              <Stack
                direction="row"
                spacing={1.5}
                sx={{ alignItems: 'center' }}
              >
                <ManageAccountsOutlinedIcon color="primary" />
                <Typography variant="h6" component="h2">
                  Meus dados
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                Atualize suas informações pessoais e sua senha.
              </Typography>
            </Stack>
            <Divider sx={{ mb: 2 }} />
            <UpdateProfileForm />
          </Paper>
        </Box>
      </Stack>
    </DashboardLayout>
  );
}
