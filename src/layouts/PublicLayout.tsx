import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/layouts.css';

export default function PublicLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="layout-loading">
        <div className="loading-spinner"></div>
        <p>Laster...</p>
      </div>
    );
  }

  // Redirect to home if already logged in
  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="public-layout">
      <Outlet />
    </div>
  );
}
