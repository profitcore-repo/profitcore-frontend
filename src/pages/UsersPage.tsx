import { Stack, Typography } from '@mui/material';
import { UsersTable } from '@/features/users/UsersTable';

export function UsersPage() {
  return (
    <Stack spacing={3}>
      <Stack spacing={0.5}>
        <Typography variant="h4" component="h1">
          Usuários
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Consulte todos os usuários cadastrados no sistema.
        </Typography>
      </Stack>

      <UsersTable />
    </Stack>
  );
}
