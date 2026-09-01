import { useState } from 'react';
import { Stack, Typography } from '@mui/material';
import { MercadoLivreConnectCard } from '@/features/connections/MercadoLivreConnectCard';
import { startMercadoLivreOAuth } from '@/features/connections/mercadoLivreOAuth';
import { brandCore } from '@/theme/tokens';

/**
 * Único passo da primeira configuração. Enquanto não existir loja conectada,
 * é a única tela alcançável depois do login (ver `AppOnboardingGuard`).
 */
export function OnboardingConnectPage() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setError(null);
    setIsConnecting(true);
    try {
      // Sai da SPA para o Mercado Livre; o estado de "conectando" fica até lá.
      await startMercadoLivreOAuth({ returnTo: '/dashboard' });
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
    <Stack spacing={1}>
      <Stack spacing={0.5} sx={{ textAlign: 'center' }}>
        <Typography
          variant="overline"
          sx={{ color: 'primary.main', letterSpacing: '0.12em' }}
        >
          Primeira configuração
        </Typography>
        <Typography variant="body2" sx={{ color: brandCore.color.textMuted }}>
          Passo 1 de 1 — sem a conexão não há dados para analisar.
        </Typography>
      </Stack>

      <MercadoLivreConnectCard
        onConnect={() => void handleConnect()}
        isConnecting={isConnecting}
        errorMessage={error}
        subtitle="Importe seu histórico de vendas e seus SKUs para liberar o ProfitCore e montar sua primeira leitura de lucro real."
        buttonLabel="Conectar conta"
      />
    </Stack>
  );
}
