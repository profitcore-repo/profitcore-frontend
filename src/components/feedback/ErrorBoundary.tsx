import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Alert, Button, Stack, Typography } from '@mui/material';

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  error: Error | null;
};

/**
 * Rede de segurança para erros de render.
 *
 * Sem isso, qualquer exceção inesperada (resposta de API fora do formato
 * esperado, por exemplo) derruba a árvore inteira do React e a tela fica em
 * branco/cinza, sem nenhuma pista pro usuário. Aqui a página quebrada fica
 * isolada e o usuário pode tentar de novo sem recarregar manualmente.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('Erro não tratado na árvore de componentes:', error, info);
  }

  private handleRetry = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <Stack spacing={2} sx={{ p: { xs: 2, md: 4 }, maxWidth: 640, mx: 'auto' }}>
          <Alert severity="error">
            Algo deu errado ao carregar esta tela. Tente novamente; se o
            problema continuar, atualize a página.
          </Alert>
          <Typography variant="caption" color="text.secondary">
            {this.state.error.message}
          </Typography>
          <Button variant="outlined" onClick={this.handleRetry} sx={{ alignSelf: 'flex-start' }}>
            Tentar novamente
          </Button>
        </Stack>
      );
    }

    return this.props.children;
  }
}
