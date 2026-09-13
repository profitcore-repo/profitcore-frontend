import { BrowserRouter } from 'react-router-dom';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { AuthProvider } from '@/contexts/AuthContext';
import { ConnectionsProvider } from '@/contexts/ConnectionsContext';
import { SkuCostsProvider } from '@/contexts/SkuCostsContext';
import { AppRoutes } from '@/routes/AppRoutes';
import { theme } from '@/theme/theme';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <ConnectionsProvider>
          {/* Depende da loja conectada, então fica dentro de ConnectionsProvider. */}
          <SkuCostsProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </SkuCostsProvider>
        </ConnectionsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
