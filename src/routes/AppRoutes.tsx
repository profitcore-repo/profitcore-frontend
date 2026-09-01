import { Navigate, Route, Routes } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { OnboardingLayout } from '@/components/layout/OnboardingLayout';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { OnboardingConnectPage } from '@/pages/OnboardingConnectPage';
import { RedirectsPage } from '@/pages/RedirectsPage';
import { UsersPage } from '@/pages/UsersPage';
import { ConnectionsPage } from '@/pages/ConnectionsPage';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { AppOnboardingGuard, OnboardingStepGuard } from '@/routes/OnboardingGuard';
import { useAuth } from '@/hooks/useAuth';
import { isAdminEmail } from '@/utils/isAdminEmail';

function PublicOnlyRoute({ children }: { children: React.ReactElement }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
}

function AdminOnlyRoute({ children }: { children: React.ReactElement }) {
  const { user } = useAuth();
  if (!isAdminEmail(user?.email)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <RegisterPage />
          </PublicOnlyRoute>
        }
      />

      <Route element={<ProtectedRoute />}>
        {/* Retorno das integrações externas. Precisa de sessão (troca de token),
            mas fica fora dos guards de onboarding: quem ainda não conectou não
            pode ser redirecionado antes de o callback ser processado. */}
        <Route path="/redirects" element={<RedirectsPage />} />
        <Route path="/redirects/:provider" element={<RedirectsPage />} />

        {/* Primeira experiência: login/registro -> conexão. Nada mais. */}
        <Route element={<OnboardingStepGuard />}>
          <Route element={<OnboardingLayout />}>
            <Route path="/onboarding/connect" element={<OnboardingConnectPage />} />
            <Route
              path="/onboarding/*"
              element={<Navigate to="/onboarding/connect" replace />}
            />
          </Route>
        </Route>

        <Route element={<AppOnboardingGuard />}>
          {/* DashboardLayout é route layout: não remonta ao trocar de rota,
              então o estado da sidebar é preservado. */}
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route
              path="/users"
              element={
                <AdminOnlyRoute>
                  <UsersPage />
                </AdminOnlyRoute>
              }
            />
            <Route path="/connections" element={<ConnectionsPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
