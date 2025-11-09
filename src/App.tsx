import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedLayout from './layouts/ProtectedLayout';
import PublicLayout from './layouts/PublicLayout';
import AdminGuard from './guards/AdminGuard';
import AdminLayout from './layouts/AdminLayout';

// Loading component for Suspense fallback
const RouteLoading = () => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      bgcolor: 'background.default'
    }}
  >
    <CircularProgress size={60} />
  </Box>
);

// Public routes - minimal bundle for unauthenticated users
const LoginPage = lazy(() =>
  import('./pages/LoginPage').then(m => ({ default: m.LoginPage }))
);
const RegisterPage = lazy(() =>
  import('./pages/RegisterPage').then(m => ({ default: m.RegisterPage }))
);
const AccountDeletedPage = lazy(() => import('./pages/AccountDeletedPage'));

// Join session - accessible to both authenticated and unauthenticated
const JoinSession = lazy(() =>
  import('./pages/JoinSession').then(m => ({ default: m.JoinSession }))
);

// Core user routes - frequently used, loaded together
const HomePage = lazy(() =>
  import('./pages/HomePage').then(m => ({ default: m.HomePage }))
);
const SessionPage = lazy(() =>
  import('./pages/SessionPage').then(m => ({ default: m.SessionPage }))
);

// Social features chunk
const FriendsPage = lazy(() => import('./pages/FriendsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));

// Settings and history chunk
const SettingsPage = lazy(() =>
  import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage }))
);
const HistoryPage = lazy(() =>
  import('./pages/HistoryPage').then(m => ({ default: m.HistoryPage }))
);

// Badge system - large feature, separate chunk
const BadgesPage = lazy(() => import('./pages/BadgesPage'));

// Analytics - HEAVY chunk with all charts
const AnalyticsPage = lazy(() =>
  import('./pages/AnalyticsPage').then(m => ({ default: m.AnalyticsPage }))
);

// Admin routes - only loaded for admin users
// These are heavy with DataGrids and admin-specific charts
const AdminPage = lazy(() => import('./pages/AdminPage'));
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage'));
const AdminAnalyticsPage = lazy(() => import('./pages/AdminAnalyticsPage'));
const AdminBadgesPage = lazy(() => import('./pages/AdminBadgesPage'));

// Preload functions for better UX (optional, can be used on hover/intent)
export const preloadAnalytics = () => import('./pages/AnalyticsPage');
export const preloadAdmin = () => {
  import('./pages/AdminPage');
  import('./pages/AdminUsersPage');
  import('./pages/AdminAnalyticsPage');
  import('./pages/AdminBadgesPage');
};
export const preloadBadges = () => import('./pages/BadgesPage');
export const preloadSession = () => import('./pages/SessionPage');

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <ErrorBoundary>
            <Suspense fallback={<RouteLoading />}>
              <Routes>
              {/* Public routes */}
              <Route element={<PublicLayout />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
              </Route>

              {/* Account deleted page - public route */}
              <Route path="/konto-slettet" element={<AccountDeletedPage />} />

              {/* Join session route - accessible to both authenticated and unauthenticated users */}
              <Route path="/join/:sessionId" element={<JoinSession />} />

              {/* Protected routes */}
              <Route element={<ProtectedLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/session/:sessionId" element={<SessionPage />} />
                <Route path="/friends" element={<FriendsPage />} />
                <Route path="/profile/:userId" element={<ProfilePage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/badges" element={<BadgesPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
              </Route>

              {/* Admin routes - protected by AdminGuard */}
              <Route
                path="/admin"
                element={
                  <AdminGuard>
                    <AdminLayout>
                      <AdminPage />
                    </AdminLayout>
                  </AdminGuard>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <AdminGuard>
                    <AdminLayout>
                      <AdminUsersPage />
                    </AdminLayout>
                  </AdminGuard>
                }
              />
              <Route
                path="/admin/analytics"
                element={
                  <AdminGuard>
                    <AdminLayout>
                      <AdminAnalyticsPage />
                    </AdminLayout>
                  </AdminGuard>
                }
              />
              <Route
                path="/admin/badges"
                element={
                  <AdminGuard>
                    <AdminLayout>
                      <AdminBadgesPage />
                    </AdminLayout>
                  </AdminGuard>
                }
              />

              {/* Catch all - redirect to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;