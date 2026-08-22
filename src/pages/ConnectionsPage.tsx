import { useState } from 'react';
import { Box } from '@mui/material';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MercadoLivreConnectCard } from '@/features/connections/MercadoLivreConnectCard';
import { api } from '@/services/api';

export function ConnectionsPage() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setError(null);
    setIsConnecting(true);
    try {
      const { authorizationUrl } = await api.startMercadoLivreAuthorization();
      if (!authorizationUrl) {
        throw new Error('O servidor não retornou a URL de autorização.');
      }
      // Redireciona para o consentimento do Mercado Livre; a página é descartada aqui,
      // por isso `isConnecting` permanece ativo.
      window.location.assign(authorizationUrl);
    } catch (err) {
      setError(
        err instanceof Error
          ? `Não foi possível iniciar a conexão: ${err.message}`
          : 'Não foi possível iniciar a conexão com o Mercado Livre.',
      );
      setIsConnecting(false);
    }
  };

  return (
    <DashboardLayout>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 160px)',
        }}
      >
        <MercadoLivreConnectCard
          onConnect={() => void handleConnect()}
          isConnecting={isConnecting}
          errorMessage={error}
        />
      </Box>
    </DashboardLayout>
  );
}
