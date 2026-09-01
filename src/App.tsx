import { BrowserRouter } from 'react-router-dom';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { AuthProvider } from '@/contexts/AuthContext';
import { ConnectionsProvider } from '@/contexts/ConnectionsContext';
import { AppRoutes } from '@/routes/AppRoutes';
import { theme } from '@/theme/theme';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <ConnectionsProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </ConnectionsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
