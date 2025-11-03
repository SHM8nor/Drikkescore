import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BurgerMenu from '../components/navigation/BurgerMenu/BurgerMenu';
import AnimatedHeader from '../components/header/AnimatedHeader';
import '../styles/layouts.css';

export default function ProtectedLayout() {
  const { user, loading, profileError, retryFetchProfile } = useAuth();

  if (loading) {
    return (
      <div className="layout-loading">
        <div className="loading-spinner"></div>
        <p>Laster...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Show profile error message if profile failed to load
  if (profileError) {
    return (
      <div className="layout-error">
        <div className="error-card">
          <h2>Profilfeil</h2>
          <p className="error-message">{profileError}</p>
          <p className="error-hint">
            Klikk på knappen under for å forsøke automatisk gjenoppretting av profilen din fra kontodata.
          </p>
          <button onClick={retryFetchProfile} className="retry-button">
            Prøv igjen og gjenopprett profil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="protected-layout">
      <BurgerMenu />
      <AnimatedHeader />
      <main className="protected-layout__content">
        <Outlet />
      </main>
    </div>
  );
}
