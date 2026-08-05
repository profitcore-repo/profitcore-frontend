import { Box, Paper, Stack, Typography } from '@mui/material';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { brandColors } from '@/theme/theme';

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <Stack spacing={3}>
        <Stack spacing={0.5}>
          <Typography variant="h4" component="h1">
            Olá, {user?.name ?? 'usuário'} 👋
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Este é o seu painel. Em breve traremos suas métricas por aqui.
          </Typography>
        </Stack>

        <Paper
          elevation={0}
          sx={{
            p: { xs: 4, md: 6 },
            border: `1px dashed ${brandColors.border}`,
            bgcolor: 'background.paper',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <Stack spacing={1.5} sx={{ textAlign: 'center', maxWidth: 460, alignItems: 'center' }}>
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
      </Stack>
    </DashboardLayout>
  );
}
