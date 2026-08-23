import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Chip,
  IconButton,
  Paper,
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
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MercadoLivreConnectCard } from '@/features/connections/MercadoLivreConnectCard';
import { api } from '@/services/api';
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
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stores, setStores] = useState<MercadoLivreStoreResponse[] | null>(null);
  const [loadingStores, setLoadingStores] = useState(false);
  const [storesError, setStoresError] = useState<string | null>(null);

  const loadStores = async () => {
    setStoresError(null);
    setLoadingStores(true);
    try {
      const data = await api.listMercadoLivreStores();
      setStores(data);
    } catch (e) {
      setStoresError(
        e instanceof Error ? e.message : 'Falha ao carregar lojas conectadas.',
      );
    } finally {
      setLoadingStores(false);
    }
  };

  useEffect(() => {
    void loadStores();
  }, []);

  const handleConnect = async () => {
    setError(null);
    setIsConnecting(true);
    try {
      const { authorizeUrl, codeVerifier } = await api.startMercadoLivreAuthorization();
      if (!authorizeUrl) {
        throw new Error('O servidor não retornou a URL de autorização.');
      }
      window.sessionStorage.setItem('ml_code_verifier', codeVerifier);
      window.location.assign(authorizeUrl);
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
      await api.disconnectMercadoLivreStore(store.id);
      setStores((prev) => (prev ? prev.filter((s) => s.id !== store.id) : prev));
    } catch (e) {
      alert(
        e instanceof Error
          ? `Falha ao desconectar: ${e.message}`
          : 'Falha ao desconectar loja.',
      );
    }
  };

  return (
    <DashboardLayout>
      <Stack spacing={4}>
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
              <Tooltip title="Atualizar">
                <IconButton
                  onClick={() => void loadStores()}
                  disabled={loadingStores}
                >
                  <RefreshOutlinedIcon />
                </IconButton>
              </Tooltip>
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
                  {stores.map((store) => {
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

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: stores && stores.length > 0 ? 'auto' : 'calc(100vh - 160px)',
          }}
        >
          <MercadoLivreConnectCard
            onConnect={() => void handleConnect()}
            isConnecting={isConnecting}
            errorMessage={error}
          />
        </Box>
      </Stack>
    </DashboardLayout>
  );
}
