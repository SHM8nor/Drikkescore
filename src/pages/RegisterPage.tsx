import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { RegisterFormData, Gender } from '../types/database';
import DisclaimerModal from '../components/legal/DisclaimerModal';
import { supabase } from '../lib/supabase';

/**
 * Validates if a redirect path is safe to navigate to
 * SECURITY: Prevents open redirect vulnerabilities by ensuring path is internal
 */
function isValidRedirectPath(redirectPath: string): boolean {
  try {
    // Path must start with /
    if (!redirectPath.startsWith('/')) {
      return false;
    }

    // Construct URL using window.location.origin as base
    const url = new URL(redirectPath, window.location.origin);

    // Verify the origin matches our application
    if (url.origin !== window.location.origin) {
      return false;
    }

    // Additional check: reject paths that try to escape via .. or @
    if (redirectPath.includes('..') || redirectPath.includes('@')) {
      return false;
    }

    return true;
  } catch {
    // If URL construction fails, path is invalid
    return false;
  }
}

export function RegisterPage() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDisclaimerModal, setShowDisclaimerModal] = useState(false);

  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    password: '',
    full_name: '',
    display_name: '',
    weight_kg: 0,
    height_cm: 0,
    gender: 'male',
    age: 18,
  });

  // Check for redirect parameter and join context
  const [redirectPath, setRedirectPath] = useState<string | null>(null);
  const isFromJoin = searchParams.get('from') === 'join';

  useEffect(() => {
    // Check sessionStorage for redirect path
    const storedRedirect = sessionStorage.getItem('redirect_after_login');
    if (storedRedirect) {
      setRedirectPath(storedRedirect);
    }
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.email || !formData.password || !formData.full_name || !formData.display_name) {
      setError('Vennligst fyll inn alle obligatoriske felt');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Vennligst oppgi en gyldig e-postadresse');
      return;
    }

    // Check for common typos in email domains
    const commonTypos = [
      { wrong: /@gmial\./, correct: '@gmail.' },
      { wrong: /@gmai\./, correct: '@gmail.' },
      { wrong: /@gamil\./, correct: '@gmail.' },
      { wrong: /@gmal\./, correct: '@gmail.' },
      { wrong: /@hotmial\./, correct: '@hotmail.' },
      { wrong: /@hotmil\./, correct: '@hotmail.' },
      { wrong: /@yahooo\./, correct: '@yahoo.' },
      { wrong: /@yaho\./, correct: '@yahoo.' },
      { wrong: /@outlok\./, correct: '@outlook.' },
    ];

    for (const { wrong, correct } of commonTypos) {
      if (wrong.test(formData.email)) {
        setError(`Sjekk e-postadressen din. Mente du "${formData.email.replace(wrong, correct)}"?`);
        return;
      }
    }

    if (formData.weight_kg <= 0 || formData.height_cm <= 0) {
      setError('Vekt og høyde må være positive tall');
      return;
    }

    if (formData.age < 18) {
      setError('Du må være minst 18 år gammel');
      return;
    }

    // Show disclaimer modal before creating account
    setShowDisclaimerModal(true);
  };

  const handleAcceptTerms = async () => {
    setLoading(true);

    try {
      // Create auth user
      const { error: signUpError } = await signUp(formData);

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        setShowDisclaimerModal(false);
        return;
      }

      // Wait a moment for auth session to be established
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Get the current user session
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        // Update profile with terms acceptance
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            has_accepted_terms: true,
            terms_accepted_at: new Date().toISOString(),
            privacy_policy_version: 1,
          })
          .eq('id', session.user.id);

        if (updateError) {
          console.error('Error updating terms in profile:', updateError);
          // Don't block signup - the ProtectedLayout will catch this
        }
      }

      // Clear redirect path from storage
      sessionStorage.removeItem('redirect_after_login');

      // SECURITY FIX #3: Validate redirect path before navigating
      // Prevents open redirect vulnerabilities
      if (redirectPath) {
        if (isValidRedirectPath(redirectPath)) {
          navigate(redirectPath);
        } else {
          console.warn('Invalid redirect path detected, redirecting to home:', redirectPath);
          navigate('/');
        }
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error('Signup error:', err);
      setError(err instanceof Error ? err.message : 'Kunne ikke registrere');
      setLoading(false);
      setShowDisclaimerModal(false);
    }
  };

  return (
    <>
      {/* Disclaimer Modal */}
      <DisclaimerModal
        open={showDisclaimerModal}
        onAccept={handleAcceptTerms}
        loading={loading}
      />

      <div className="auth-page">
        <div className="auth-container">
          <h1>Opprett konto</h1>
          <p className="auth-subtitle">Registrer deg for å begynne å spore promillen din</p>

          {(redirectPath || isFromJoin) && (
            <div style={{
              background: 'var(--vanilla-light)',
              padding: 'var(--spacing-md)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--spacing-md)',
              color: 'var(--color-text-secondary)',
              fontSize: 'var(--font-size-small)',
              textAlign: 'center'
            }}>
              Opprett konto for å bli med i økten
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">E-post</label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Passord</label>
              <input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                minLength={6}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="full_name">Fullt navn</label>
              <input
                id="full_name"
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="display_name">Visningsnavn</label>
              <input
                id="display_name"
                type="text"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                placeholder="Dette er navnet andre brukere ser når de søker etter deg"
                required
                disabled={loading}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="weight_kg">Vekt (kg)</label>
                <input
                  id="weight_kg"
                  type="number"
                  step="0.1"
                  value={formData.weight_kg || ''}
                  onChange={(e) => setFormData({ ...formData, weight_kg: parseFloat(e.target.value) || 0 })}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="height_cm">Høyde (cm)</label>
                <input
                  id="height_cm"
                  type="number"
                  step="0.1"
                  value={formData.height_cm || ''}
                  onChange={(e) => setFormData({ ...formData, height_cm: parseFloat(e.target.value) || 0 })}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="gender">Kjønn</label>
                <select
                  id="gender"
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                  required
                  disabled={loading}
                >
                  <option value="male">Mann</option>
                  <option value="female">Kvinne</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="age">Alder</label>
                <input
                  id="age"
                  type="number"
                  value={formData.age || ''}
                  onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
                  min={18}
                  max={120}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Oppretter konto...' : 'Opprett konto'}
            </button>
          </form>

          <p className="auth-footer">
            Har du allerede en konto? <Link to={isFromJoin ? "/login?from=join" : "/login"}>Logg inn her</Link>
          </p>
        </div>
      </div>
    </>
  );
}
