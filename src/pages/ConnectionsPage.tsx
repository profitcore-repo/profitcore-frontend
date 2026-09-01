import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import { MercadoLivreConnectCard } from '@/features/connections/MercadoLivreConnectCard';
import { startMercadoLivreOAuth } from '@/features/connections/mercadoLivreOAuth';
import { useConnections } from '@/hooks/useConnections';
import type { MercadoLivreStoreResponse } from '@/types/api';

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function isExpired(expiresAtUtc: string): boolean {
  try {
    return new Date(expiresAtUtc).getTime() <= Date.now();
  } catch {
    return true;
  }
}

export function ConnectionsPage() {
  // Estado de conexão vem do provider: desconectar a última loja devolve o
  // usuário à primeira configuração sem recarregar a página.
  const {
    stores,
    hasConnection,
    isResolving,
    isLoading: loadingStores,
    error: storesError,
    refresh,
    disconnect,
  } = useConnections();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isManaging, setIsManaging] = useState(false);

  // Enquanto não sabemos se há conexão, não mostramos o card do Mercado Livre
  // para evitar o "flash".
  const isInitialLoading = isResolving;
  const showConnectCard = !isInitialLoading && (!hasConnection || isManaging);

  const handleConnect = async () => {
    setError(null);
    setIsConnecting(true);
    try {
      // Reconexão nasce aqui, então o retorno volta para cá.
      await startMercadoLivreOAuth({ returnTo: '/connections' });
    } catch (err) {
      setError(
        err instanceof Error
          ? `Não foi possível iniciar a conexão: ${err.message}`
          : 'Não foi possível iniciar a conexão com o Mercado Livre.',
      );
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async (store: MercadoLivreStoreResponse) => {
    const label = store.sellerNickname || `#${store.mercadoLivreSellerId}`;
    if (!window.confirm(`Desconectar a loja "${label}"?`)) return;
    try {
      await disconnect(store.id);
    } catch (e) {
      alert(
        e instanceof Error
          ? `Falha ao desconectar: ${e.message}`
          : 'Falha ao desconectar loja.',
      );
    }
  };

  return (
    <Stack spacing={4}>
      {isInitialLoading && (
          <Paper
            elevation={0}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <Stack
              direction="row"
              spacing={2}
              sx={{
                px: 3,
                py: 2,
                borderBottom: '1px solid',
                borderColor: 'divider',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Skeleton variant="text" width={220} height={28} />
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Skeleton variant="rounded" width={168} height={32} />
                <Skeleton variant="circular" width={32} height={32} />
              </Stack>
            </Stack>
            <Stack spacing={1.5} sx={{ p: 3 }}>
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} variant="rounded" width="100%" height={56} />
              ))}
            </Stack>
          </Paper>
        )}

        {stores !== null && stores.length > 0 && (
          <Paper
            elevation={0}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <Stack
              direction="row"
              spacing={2}
              sx={{
                px: 3,
                py: 2,
                borderBottom: '1px solid',
                borderColor: 'divider',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Lojas conectadas ({stores.length})
              </Typography>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Button
                  variant={isManaging ? 'outlined' : 'contained'}
                  color="primary"
                  size="small"
                  startIcon={
                    isManaging ? <CloseOutlinedIcon /> : <SettingsOutlinedIcon />
                  }
                  onClick={() => setIsManaging((prev) => !prev)}
                >
                  {isManaging ? 'Cancelar' : 'Gerenciar conexão'}
                </Button>
                <Tooltip title="Atualizar">
                  <IconButton
                    onClick={() => void refresh()}
                    disabled={loadingStores}
                  >
                    <RefreshOutlinedIcon />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>

            {storesError && (
              <Alert severity="error" sx={{ m: 2 }}>
                {storesError}
              </Alert>
            )}

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        Vendedor
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        ID Mercado Livre
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        Status do token
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        Conectada em
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        Ações
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loadingStores &&
                    [0, 1].map((i) => (
                      <TableRow key={`skeleton-${i}`}>
                        <TableCell>
                          <Stack spacing={0.5}>
                            <Skeleton variant="text" width={140} height={20} />
                            <Skeleton variant="text" width={180} height={16} />
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Skeleton variant="text" width={100} height={20} />
                        </TableCell>
                        <TableCell>
                          <Stack spacing={0.5}>
                            <Skeleton variant="rounded" width={72} height={22} />
                            <Skeleton variant="text" width={150} height={16} />
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Skeleton variant="text" width={140} height={20} />
                        </TableCell>
                        <TableCell align="right">
                          <Skeleton
                            variant="circular"
                            width={28}
                            height={28}
                            sx={{ ml: 'auto' }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  {!loadingStores && stores.map((store) => {
                    const expired = isExpired(store.expiresAtUtc);
                    return (
                      <TableRow key={store.id}>
                        <TableCell>
                          <Stack spacing={0.25}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {store.sellerNickname || '—'}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ color: 'text.secondary' }}
                            >
                              {store.sellerEmail || 'sem e-mail'}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {store.mercadoLivreSellerId}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Stack spacing={0.5}>
                            <Chip
                              size="small"
                              color={expired ? 'warning' : 'success'}
                              label={expired ? 'Expirado' : 'Válido'}
                              variant="outlined"
                            />
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              Expira em {formatDate(store.expiresAtUtc)}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(store.createdAtUtc)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Desconectar">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => void handleDisconnect(store)}
                            >
                              <DeleteOutlineOutlinedIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {showConnectCard && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: hasConnection ? 'auto' : 'calc(100vh - 160px)',
            }}
          >
            <MercadoLivreConnectCard
              onConnect={() => void handleConnect()}
              isConnecting={isConnecting}
              errorMessage={error}
              title={
                isManaging
                  ? 'Refazer conexão com o Mercado Livre'
                  : undefined
              }
              subtitle={
                isManaging
                  ? 'Você será redirecionado para o Mercado Livre para autorizar novamente. A conexão existente será atualizada.'
                  : undefined
              }
              buttonLabel={isManaging ? 'Reconectar agora' : undefined}
            />
          </Box>
        )}
    </Stack>
  );
}
