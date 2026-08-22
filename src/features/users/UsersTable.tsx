import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Chip,
  IconButton,
  InputAdornment,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import PeopleOutlineOutlinedIcon from '@mui/icons-material/PeopleOutlineOutlined';
import { useUsers } from '@/hooks/useUsers';
import { useAuth } from '@/hooks/useAuth';
import { alpha } from '@mui/material/styles';
import { brandCore } from '@/theme/tokens';
import { maskPhone, maskSensitiveDocument, onlyDigits } from '@/utils/masks';
import type { UserResponse } from '@/types/api';

const COLUMN_COUNT = 5;

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function documentLabel(cpfCnpj: string): string {
  const len = onlyDigits(cpfCnpj).length;
  if (len === 11) return 'CPF';
  if (len === 14) return 'CNPJ';
  return 'Documento';
}

function filterUsers(users: UserResponse[], term: string): UserResponse[] {
  const q = term.trim().toLowerCase();
  if (!q) return users;
  const qDigits = onlyDigits(q);
  return users.filter((u) => {
    if (u.fullName.toLowerCase().includes(q)) return true;
    if (u.email.toLowerCase().includes(q)) return true;
    if (qDigits && onlyDigits(u.phone).includes(qDigits)) return true;
    if (qDigits && onlyDigits(u.cpfCnpj).includes(qDigits)) return true;
    return false;
  });
}

export function UsersTable() {
  const { data, loading, error, refresh } = useUsers();
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const users = data ?? [];
  const filtered = useMemo(() => filterUsers(users, search), [users, search]);

  const paged = useMemo(() => {
    const start = page * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, page, rowsPerPage]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(0);
  };

  const handleChangePage = (_: unknown, next: number) => setPage(next);

  const handleChangeRowsPerPage = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        border: `1px solid ${brandCore.color.borderNavy}`,
        bgcolor: 'background.paper',
        overflow: 'hidden',
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{
          p: { xs: 2, md: 2.5 },
          alignItems: { sm: 'center' },
          justifyContent: 'space-between',
          borderBottom: `1px solid ${brandCore.color.borderNavy}`,
        }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <PeopleOutlineOutlinedIcon color="primary" />
          <Stack spacing={0.25}>
            <Typography variant="h6" component="h2">
              Usuários cadastrados
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {loading
                ? 'Carregando…'
                : `${filtered.length} de ${users.length} ${
                    users.length === 1 ? 'usuário' : 'usuários'
                  }`}
            </Typography>
          </Stack>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Buscar por nome, e-mail, telefone ou documento"
            value={search}
            onChange={handleSearchChange}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchOutlinedIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
            sx={{ minWidth: { xs: '100%', sm: 320 } }}
          />
          <Tooltip title="Atualizar">
            <span>
              <IconButton
                onClick={() => void refresh()}
                disabled={loading}
                aria-label="Atualizar lista"
              >
                <RefreshOutlinedIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Stack>

      {error && (
        <Box sx={{ p: 2 }}>
          <Alert
            severity="error"
            action={
              <IconButton
                aria-label="Tentar novamente"
                color="inherit"
                size="small"
                onClick={() => void refresh()}
              >
                <RefreshOutlinedIcon fontSize="small" />
              </IconButton>
            }
          >
            Não foi possível carregar os usuários: {error.message}
          </Alert>
        </Box>
      )}

      <TableContainer>
        <Table size="medium">
          <TableHead
            sx={{
              '& .MuiTableCell-head': {
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: 'text.secondary',
              },
            }}
          >
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>E-mail</TableCell>
              <TableCell>Telefone</TableCell>
              <TableCell>Documento</TableCell>
              <TableCell>Criado em</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && users.length === 0 ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  {Array.from({ length: COLUMN_COUNT }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton variant="text" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={COLUMN_COUNT}>
                  <Stack
                    spacing={0.5}
                    sx={{ alignItems: 'center', py: 4, textAlign: 'center' }}
                  >
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {users.length === 0
                        ? 'Nenhum usuário cadastrado ainda'
                        : 'Nenhum resultado para essa busca'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {users.length === 0
                        ? 'Cadastre o primeiro usuário para vê-lo aqui.'
                        : 'Tente ajustar os termos da busca.'}
                    </Typography>
                  </Stack>
                </TableCell>
              </TableRow>
            ) : (
              paged.map((u) => {
                const isMe = currentUser?.id === u.id;
                return (
                  <TableRow
                    key={u.id}
                    hover
                    sx={
                      isMe
                        ? {
                            bgcolor: alpha(brandCore.color.profitGreen, 0.06),
                          }
                        : undefined
                    }
                  >
                    <TableCell>
                      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {u.fullName}
                        </Typography>
                        {isMe && (
                          <Chip
                            label="Você"
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ height: 20 }}
                          />
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {u.email}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'text.primary',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {maskPhone(u.phone)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack spacing={0.25}>
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'text.primary',
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {maskSensitiveDocument(u.cpfCnpj)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {documentLabel(u.cpfCnpj)}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'text.primary',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {formatDate(u.createdAtUtc)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {filtered.length > rowsPerPage && (
        <TablePagination
          component="div"
          count={filtered.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[10, 25, 50]}
          labelRowsPerPage="Linhas por página"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}–${to} de ${count}`
          }
        />
      )}
    </Paper>
  );
}
