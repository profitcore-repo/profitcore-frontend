import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
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
import { alpha } from '@mui/material/styles';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import AttachMoneyOutlinedIcon from '@mui/icons-material/AttachMoneyOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { brandCore } from '@/theme/tokens';
import { api } from '@/services/api';
import type {
  MercadoLivreOrder,
  MercadoLivreOrderListResult,
  MercadoLivreOrdersDateRange,
  MercadoLivreOrderStatus,
  MercadoLivreStoreResponse,
} from '@/types/api';

const REDIRECT_URI = 'https://profitcore-frontend.netlify.app/dashboard';

const RANGE_OPTIONS: { value: MercadoLivreOrdersDateRange; label: string }[] = [
  { value: 'Last24Hours', label: '24h' },
  { value: 'Last7Days', label: '7 dias' },
  { value: 'Last30Days', label: '30 dias' },
  { value: 'Last90Days', label: '90 dias' },
];

const STATUS_LABEL: Record<MercadoLivreOrderStatus, string> = {
  PaymentRequired: 'Pagamento pendente',
  PaymentInProcess: 'Pagamento em análise',
  ToBeConfirmed: 'Aguardando confirmação',
  ReadyToShip: 'Pronto para enviar',
  Shipped: 'Enviado',
  Delivered: 'Entregue',
  Cancelled: 'Cancelado',
  NotRated: 'Finalizado (avaliação pendente)',
  Rated: 'Finalizado (avaliado)',
  Invalid: 'Status desconhecido',
};

const STATUS_COLOR: Record<MercadoLivreOrderStatus, 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'> = {
  PaymentRequired: 'warning',
  PaymentInProcess: 'warning',
  ToBeConfirmed: 'info',
  ReadyToShip: 'primary',
  Shipped: 'info',
  Delivered: 'success',
  Cancelled: 'error',
  NotRated: 'success',
  Rated: 'success',
  Invalid: 'default',
};

const BRL_CURRENCY = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

function formatDate(iso: string | null): string {
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
    return '—';
  }
}

function buildBuyerLabel(
  buyer: MercadoLivreOrder['buyer'],
): string {
  const full = [buyer.firstName, buyer.lastName].filter(Boolean).join(' ').trim();
  if (full) return full;
  if (buyer.nickname) return buyer.nickname;
  if (buyer.email) return buyer.email;
  return 'Comprador';
}

function itemsPreview(order: MercadoLivreOrder): { title: string; subtitle: string | null }[] {
  return order.items.slice(0, 3).map((it) => ({
    title:
      it.title ||
      (it.itemFullId ? `Item ${it.itemFullId}` : `Produto ${it.itemId || ''}`),
    subtitle:
      it.quantity > 1
        ? `${it.quantity}x ${BRL_CURRENCY.format(it.unitPrice)}` +
          (it.variationName ? ` • ${it.variationName}` : '')
        : it.variationName || null,
  }));
}

function useMercadoLivreOrders() {
  const [stores, setStores] = useState<MercadoLivreStoreResponse[] | null>(null);
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [range, setRange] = useState<MercadoLivreOrdersDateRange>('Last30Days');
  const [result, setResult] = useState<MercadoLivreOrderListResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [storesLoading, setStoresLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setStoresLoading(true);
      try {
        const list = await api.listMercadoLivreStores();
        if (cancelled) return;
        setStores(list);
        if (list.length > 0) {
          setSelectedStore(list[0].id);
        }
      } catch (e) {
        if (cancelled) return;
        setStores([]);
      } finally {
        if (!cancelled) setStoresLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedStore) {
      setResult(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.listMercadoLivreOrders({
          storeId: selectedStore,
          dateRange: range,
        });
        if (cancelled) return;
        setResult(data);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Erro ao buscar vendas.');
        setResult(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedStore, range]);

  return {
    stores,
    storesLoading,
    selectedStore,
    setSelectedStore,
    range,
    setRange,
    result,
    loading,
    error,
  };
}

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [callbackStatus, setCallbackStatus] = useState<
    'idle' | 'processing' | 'success' | 'error'
  >('idle');
  const [callbackError, setCallbackError] = useState<string | null>(null);
  const orders = useMercadoLivreOrders();

  useEffect(() => {
    const code = searchParams.get('code');
    const err = searchParams.get('error');
    const errDesc = searchParams.get('error_description');

    if (!code && !err) return;

    let cancelled = false;

    (async () => {
      if (err) {
        if (cancelled) return;
        setCallbackStatus('error');
        setCallbackError(
          errDesc || `Autorização negada no Mercado Livre (${err}).`,
        );
        return;
      }

      if (!code) return;

      const codeVerifier = window.sessionStorage.getItem('ml_code_verifier') || undefined;

      setCallbackStatus('processing');
      try {
        await api.connectMercadoLivreStore({
          authorizationCode: code,
          codeVerifier,
          redirectUriOverride: REDIRECT_URI,
        });
        if (cancelled) return;
        window.sessionStorage.removeItem('ml_code_verifier');
        setCallbackStatus('success');
        setTimeout(() => {
          navigate('/connections', { replace: true });
        }, 1500);
      } catch (e) {
        if (cancelled) return;
        setCallbackStatus('error');
        setCallbackError(
          e instanceof Error
            ? `Falha ao conectar: ${e.message}`
            : 'Falha ao conectar a conta do Mercado Livre.',
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams, navigate]);

  const totals = useMemo(() => {
    if (!orders.result) return null;
    const items = orders.result.orders;
    const paid = items.filter(
      (o) =>
        o.status === 'PaymentInProcess' ||
        o.status === 'ToBeConfirmed' ||
        o.status === 'ReadyToShip' ||
        o.status === 'Shipped' ||
        o.status === 'Delivered' ||
        o.status === 'NotRated' ||
        o.status === 'Rated',
    );
    const grossTotal = paid.reduce((s, o) => s + (o.totalAmount || 0), 0);
    const netTotal = paid.reduce((s, o) => s + (o.totalNetAmount || 0), 0);
    const cancelled = items.filter((o) => o.status === 'Cancelled').length;
    const pending = items.filter(
      (o) =>
        o.status === 'PaymentRequired' ||
        o.status === 'PaymentInProcess' ||
        o.status === 'ToBeConfirmed' ||
        o.status === 'ReadyToShip' ||
        o.status === 'Shipped',
    ).length;
    return {
      count: orders.result.total,
      returned: items.length,
      grossTotal,
      netTotal,
      cancelled,
      pending,
    };
  }, [orders.result]);

  const noStores = !orders.storesLoading && orders.stores && orders.stores.length === 0;

  return (
    <DashboardLayout>
      <Stack spacing={4}>
        {callbackStatus !== 'idle' && (
          <Paper
            elevation={0}
            sx={{
              p: 3,
              border: `1px solid ${brandCore.color.borderNavy}`,
              bgcolor: 'background.paper',
            }}
          >
            {callbackStatus === 'processing' && (
              <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                <CircularProgress size={24} />
                <Typography>Finalizando conexão com o Mercado Livre...</Typography>
              </Stack>
            )}
            {callbackStatus === 'success' && (
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                <CheckCircleOutlinedIcon color="success" fontSize="medium" />
                <Typography sx={{ color: 'success.main', fontWeight: 600 }}>
                  Conta conectada com sucesso! Redirecionando...
                </Typography>
              </Stack>
            )}
            {callbackStatus === 'error' && <Alert severity="error">{callbackError}</Alert>}
          </Paper>
        )}

        <Stack spacing={0.5}>
          <Typography variant="h4" component="h1">
            Olá, {user?.name ?? 'usuário'}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Este é o seu painel. Acompanhe suas vendas do Mercado Livre em tempo real.
          </Typography>
        </Stack>

        {noStores ? (
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, md: 5 },
              border: `1px dashed ${brandCore.color.borderNavy}`,
              bgcolor: 'background.paper',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <Stack
              spacing={2}
              sx={{
                textAlign: 'center',
                maxWidth: 520,
                alignItems: 'center',
              }}
            >
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  bgcolor: alpha(brandCore.color.profitGreen, 0.1),
                  color: 'primary.main',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <StorefrontOutlinedIcon fontSize="large" />
              </Box>
              <Stack spacing={0.5}>
                <Typography variant="h6">Nenhuma loja conectada ainda</Typography>
                <Typography variant="body2" color="text.secondary">
                  Conecte sua conta de vendedor do Mercado Livre para visualizar suas
                  vendas por aqui.
                </Typography>
              </Stack>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/connections')}
                startIcon={<StorefrontOutlinedIcon />}
              >
                Conectar conta Mercado Livre
              </Button>
            </Stack>
          </Paper>
        ) : (
          <Stack spacing={4}>
            {/* KPI Cards */}
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2.5}
              useFlexGap
              sx={{ flexWrap: 'wrap' }}
            >
              {[0, 1, 2, 3].map((i) => (
                <Box
                  key={i}
                  sx={{
                    flex: '1 1 0',
                    minWidth: '100%',
                    '@media (min-width: 600px)': { minWidth: 'calc(50% - 10px)' },
                    '@media (min-width: 900px)': { minWidth: 'calc(25% - 15px)' },
                  }}
                >
                  <Card
                    elevation={0}
                    sx={{ border: 1, borderColor: 'divider', height: '100%' }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Stack spacing={1.5}>
                        <Stack
                          direction="row"
                          spacing={1.5}
                          sx={{ alignItems: 'center', justifyContent: 'space-between' }}
                        >
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: 2,
                              bgcolor:
                                i === 0
                                  ? alpha(brandCore.color.profitGreen, 0.12)
                                  : i === 1
                                    ? alpha('#2563eb', 0.12)
                                    : i === 2
                                      ? alpha(brandCore.color.profitGreen, 0.18)
                                      : alpha('#f59e0b', 0.15),
                              color:
                                i === 0
                                  ? brandCore.color.profitGreen
                                  : i === 1
                                    ? '#2563eb'
                                    : i === 2
                                      ? '#15803d'
                                      : '#d97706',
                              display: 'grid',
                              placeItems: 'center',
                            }}
                          >
                            {i === 0 && <ReceiptLongOutlinedIcon />}
                            {(i === 1 || i === 2) && <AttachMoneyOutlinedIcon />}
                            {i === 3 && <LocalShippingOutlinedIcon />}
                          </Box>
                          {i === 0 &&
                            (orders.storesLoading || orders.loading ? (
                              <Skeleton width={80} height={24} variant="rounded" />
                            ) : (
                              <Chip
                                size="small"
                                variant="outlined"
                                color="info"
                                label={`${
                                  orders.range
                                    ? RANGE_OPTIONS.find((r) => r.value === orders.range)?.label
                                    : ''
                                }`}
                              />
                            ))}
                        </Stack>
                        <Stack spacing={0.25}>
                          {orders.loading || !totals ? (
                            <>
                              <Skeleton width={140} height={32} variant="text" />
                              <Skeleton width={i === 3 ? 130 : 110} height={18} variant="text" />
                            </>
                          ) : (
                            <>
                              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                                {i === 0
                                  ? totals.count
                                  : i === 1
                                    ? BRL_CURRENCY.format(totals.grossTotal)
                                    : i === 2
                                      ? BRL_CURRENCY.format(totals.netTotal)
                                      : totals.pending}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {i === 0
                                  ? `Total de pedidos (${totals.returned} retornados)`
                                  : i === 1
                                    ? 'Faturamento bruto'
                                    : i === 2
                                      ? 'Valor líquido recebido'
                                      : 'Pedidos pendentes / em andamento'}
                              </Typography>
                            </>
                          )}
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                </Box>
              ))}
            </Stack>

            {/* Toolbar + Tabela */}
            <Paper
              elevation={0}
              sx={{ border: 1, borderColor: 'divider', bgcolor: 'background.paper' }}
            >
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={{ xs: 1.5, md: 2 }}
                sx={{ p: { xs: 2, md: 3 }, alignItems: { md: 'center' }, justifyContent: 'space-between' }}
              >
                <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Vendas recentes
                  </Typography>
                  {orders.stores && orders.stores.length > 1 && (
                    <Box
                      component="select"
                      sx={{
                        p: 1.25,
                        borderRadius: 1.5,
                        border: 1,
                        borderColor: 'divider',
                        bgcolor: 'background.paper',
                        minWidth: 220,
                      }}
                      value={orders.selectedStore || ''}
                      onChange={(e) => orders.setSelectedStore(e.target.value)}
                    >
                      {orders.stores.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.sellerNickname || s.sellerEmail || `Loja ${s.mercadoLivreSellerId}`}
                        </option>
                      ))}
                    </Box>
                  )}
                </Stack>

                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                  {RANGE_OPTIONS.map((opt) => (
                    <Chip
                      key={opt.value}
                      label={opt.label}
                      variant={orders.range === opt.value ? 'filled' : 'outlined'}
                      color={orders.range === opt.value ? 'primary' : 'default'}
                      onClick={() => orders.setRange(opt.value)}
                      sx={{ cursor: 'pointer' }}
                    />
                  ))}
                </Stack>
              </Stack>

              <Divider />

              {orders.error && (
                <Box sx={{ p: 3 }}>
                  <Alert severity="error">
                    Não foi possível carregar suas vendas: {orders.error}
                  </Alert>
                </Box>
              )}

              {!orders.error && (orders.storesLoading || orders.loading) && (
                <Stack spacing={2} sx={{ p: 3 }}>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} variant="rounded" width="100%" height={64} />
                  ))}
                </Stack>
              )}

              {!orders.storesLoading &&
                !orders.loading &&
                !orders.error &&
                (!orders.result || orders.result.orders.length === 0) && (
                  <Stack spacing={1.5} sx={{ p: 6, textAlign: 'center', alignItems: 'center' }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        bgcolor: alpha(brandCore.color.profitGreen, 0.08),
                        color: 'primary.main',
                        display: 'grid',
                        placeItems: 'center',
                      }}
                    >
                      <InsightsOutlinedIcon />
                    </Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Nenhuma venda encontrada neste período
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tente alterar o filtro de período ou conectar uma conta que já tenha
                      realizado vendas.
                    </Typography>
                  </Stack>
                )}

              {!orders.storesLoading &&
                !orders.loading &&
                !orders.error &&
                orders.result &&
                orders.result.orders.length > 0 && (
                  <TableContainer>
                    <Table size="medium">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>Pedido</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Produtos</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Comprador</TableCell>
                          <TableCell sx={{ fontWeight: 700 }} align="right">
                            Valor bruto
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700 }} align="right">
                            Líquido
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Data</TableCell>
                          <TableCell />
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {orders.result.orders.map((order) => {
                          const rows = itemsPreview(order);
                          const buyer = buildBuyerLabel(order.buyer);
                          const hasMore = order.items.length > rows.length;
                          return (
                            <TableRow
                              key={order.orderId}
                              hover
                              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                            >
                              <TableCell>
                                <Stack spacing={0.25}>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    #{order.orderId}
                                  </Typography>
                                  {order.shipping ? (
                                    <Typography variant="caption" color="text.secondary">
                                      {order.shipping.addressCity || order.shipping.addressZipCode
                                        ? order.shipping.addressCity || ''
                                        : ''}
                                      {order.shipping.addressCity && order.shipping.addressState
                                        ? `/${order.shipping.addressState}`
                                        : ''}
                                      {order.shipping.trackingNumber
                                        ? ` • ${order.shipping.trackingNumber}`
                                        : ''}
                                    </Typography>
                                  ) : null}
                                </Stack>
                              </TableCell>
                              <TableCell>
                                <Stack spacing={0.5} sx={{ maxWidth: 360 }}>
                                  {rows.map((r, i) => (
                                    <Stack key={i} spacing={0.1}>
                                      <Typography variant="body2" noWrap>
                                        {r.title}
                                      </Typography>
                                      {r.subtitle && (
                                        <Typography variant="caption" color="text.secondary">
                                          {r.subtitle}
                                        </Typography>
                                      )}
                                    </Stack>
                                  ))}
                                  {hasMore && (
                                    <Typography variant="caption" color="text.secondary">
                                      +{order.items.length - rows.length} mais
                                    </Typography>
                                  )}
                                </Stack>
                              </TableCell>
                              <TableCell>
                                <Stack spacing={0.25}>
                                  <Typography variant="body2">{buyer}</Typography>
                                  {order.buyer.email && (
                                    <Typography variant="caption" color="text.secondary">
                                      {order.buyer.email}
                                    </Typography>
                                  )}
                                  {order.buyer.phoneNumber && (
                                    <Typography variant="caption" color="text.secondary">
                                      {order.buyer.phoneNumber}
                                    </Typography>
                                  )}
                                </Stack>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {BRL_CURRENCY.format(order.totalAmount)}
                                </Typography>
                                {order.totalItemsQuantity > 1 && (
                                  <Typography variant="caption" color="text.secondary">
                                    {order.totalItemsQuantity} itens
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell align="right">
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: 700,
                                    color: brandCore.color.profitGreen,
                                  }}
                                >
                                  {BRL_CURRENCY.format(order.totalNetAmount)}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  size="small"
                                  label={STATUS_LABEL[order.status] || order.statusRaw}
                                  color={STATUS_COLOR[order.status] || 'default'}
                                  variant="filled"
                                />
                              </TableCell>
                              <TableCell>
                                <Typography variant="caption" color="text.secondary">
                                  {formatDate(order.dateCreated)}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Tooltip title="Abrir pedido no Mercado Livre">
                                  <IconButton
                                    component="a"
                                    href={order.orderPermalink}
                                    target="_blank"
                                    rel="noreferrer"
                                    size="small"
                                  >
                                    <OpenInNewOutlinedIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
            </Paper>
          </Stack>
        )}
      </Stack>
    </DashboardLayout>
  );
}
