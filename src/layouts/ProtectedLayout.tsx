import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BurgerMenu from '../components/navigation/BurgerMenu/BurgerMenu';
import AnimatedHeader from '../components/header/AnimatedHeader';
import DisclaimerModal from '../components/legal/DisclaimerModal';
import { supabase } from '../lib/supabase';
import '../styles/layouts.css';

export default function ProtectedLayout() {
  const { user, profile, loading, profileError, retryFetchProfile } = useAuth();
  const [isUpdatingTerms, setIsUpdatingTerms] = useState(false);
  const [termsError, setTermsError] = useState<string | null>(null);

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

  // Handle terms acceptance
  const handleAcceptTerms = async () => {
    if (!user || !profile) return;

    setIsUpdatingTerms(true);
    setTermsError(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          has_accepted_terms: true,
          terms_accepted_at: new Date().toISOString(),
          privacy_policy_version: 1,
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating terms acceptance:', error);
        setTermsError('Kunne ikke oppdatere vilkårene. Vennligst prøv igjen.');
        setIsUpdatingTerms(false);
        return;
      }

      // Clear profile cache to force fresh fetch
      sessionStorage.removeItem(`drikkescore_profile_cache_${user.id}`);

      // Reload the page to refetch profile with updated terms
      window.location.reload();
    } catch (err) {
      console.error('Exception updating terms:', err);
      setTermsError('En feil oppstod. Vennligst prøv igjen.');
      setIsUpdatingTerms(false);
    }
  };

  // Show disclaimer modal if user hasn't accepted terms
  const shouldShowDisclaimerModal = profile && !profile.has_accepted_terms;

  return (
    <>
      {/* Disclaimer Modal - blocking if terms not accepted */}
      <DisclaimerModal
        open={shouldShowDisclaimerModal || false}
        onAccept={handleAcceptTerms}
        loading={isUpdatingTerms}
      />

      {/* Error message for terms update failure */}
      {termsError && (
        <div className="layout-error">
          <div className="error-card">
            <h2>Feil</h2>
            <p className="error-message">{termsError}</p>
            <button onClick={handleAcceptTerms} className="retry-button">
              Prøv igjen
            </button>
          </div>
        </div>
      )}

      {/* Main layout - only rendered after terms are accepted */}
      <div className="protected-layout">
        <BurgerMenu />
        <AnimatedHeader />
        <main className="protected-layout__content">
          <Outlet />
        </main>
      </div>
    </>
  );
}
