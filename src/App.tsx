import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { HomePage } from './pages/HomePage';
import { SessionPage } from './pages/SessionPage';
import { JoinSession } from './pages/JoinSession';
import { SettingsPage } from './pages/SettingsPage';
import { HistoryPage } from './pages/HistoryPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import FriendsPage from './pages/FriendsPage';
import AdminPage from './pages/AdminPage';
import AccountDeletedPage from './pages/AccountDeletedPage';
import ProtectedLayout from './layouts/ProtectedLayout';
import PublicLayout from './layouts/PublicLayout';
import AdminGuard from './guards/AdminGuard';
import AdminLayout from './layouts/AdminLayout';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
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
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/history" element={<HistoryPage />} />
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

          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
