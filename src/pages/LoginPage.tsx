import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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

export function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

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
    setLoading(true);
    setError(null);

    if (!email || !password) {
      setError('Vennligst fyll inn alle felt');
      setLoading(false);
      return;
    }

    try {
      const { error: signInError } = await signIn(email, password);

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      // Clear redirect path from storage
      sessionStorage.removeItem('redirect_after_login');

      // SECURITY FIX #2: Validate redirect path before navigating
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
    } catch (err: any) {
      setError(err.message || 'Kunne ikke logge inn');
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1>Velkommen tilbake</h1>
        <p className="auth-subtitle">Logg inn for å fortsette</p>

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
            Logg inn for å bli med i økten
          </div>
        )}

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">E-post</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Passord</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Logger inn...' : 'Logg inn'}
          </button>
        </form>

        <p className="auth-footer">
          Har du ikke en konto? <Link to={isFromJoin ? "/register?from=join" : "/register"}>Registrer deg her</Link>
        </p>
      </div>
    </div>
  );
}
