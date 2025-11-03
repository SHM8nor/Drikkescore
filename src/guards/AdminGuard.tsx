import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAdmin } from '../hooks/useAdmin';
import type { ReactNode } from 'react';

interface AdminGuardProps {
  children: ReactNode;
}

/**
 * AdminGuard component that protects admin-only routes
 * Redirects non-admin users to the home page
 */
export default function AdminGuard({ children }: AdminGuardProps) {
  const { loading } = useAuth();
  const isAdmin = useAdmin();

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="layout-loading">
        <div className="loading-spinner"></div>
        <p>Sjekker tilgang...</p>
      </div>
    );
  }

  // Redirect non-admin users to home page
  if (!isAdmin) {
    // Optional: In a future iteration, you could add a toast notification here
    // For now, just redirect silently
    return <Navigate to="/" replace />;
  }

  // User is admin, render children
  return <>{children}</>;
}
