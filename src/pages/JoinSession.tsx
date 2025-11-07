import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useJoinSession } from '../hooks/useSession';
import { supabase } from '../lib/supabase';
import type { Session } from '../types/database';

/**
 * Validates if a sessionId is in valid format (UUID or 6-char code)
 * SECURITY: Prevents open redirect attacks by validating format before storage
 */
function isValidSessionId(sessionId: string): boolean {
  // Check for UUID format
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sessionId);

  // Check for 6-character session code format
  const isSessionCode = /^[A-Z0-9]{6}$/i.test(sessionId);

  return isUUID || isSessionCode;
}

/**
 * JoinSession Page - Handles deep links for joining sessions via URL
 * Accessed via: /join/:sessionId or /join/:sessionCode
 */
export function JoinSession() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { joinSession, loading: joinLoading } = useJoinSession();

  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [joining, setJoining] = useState(false);

  // SECURITY FIX #5: Wrap handleJoinSession in useCallback with proper dependencies
  // Prevents stale closures in useEffect
  const handleJoinSession = useCallback(async (sessionToJoin: Session) => {
    try {
      setError(null);
      setJoining(true);

      // Use the session code to join
      const joinedSession = await joinSession(sessionToJoin.session_code);

      // Navigate to session page
      navigate(`/session/${joinedSession.id}`, { replace: true });
    } catch (err) {
      console.error('Error joining session:', err);
      setError(err instanceof Error ? err.message : 'Kunne ikke bli med i økten');
      setJoining(false);
    }
  }, [joinSession, navigate]);

  // Redirect unauthenticated users to login immediately
  useEffect(() => {
    if (authLoading || !sessionId) return;

    // If not authenticated, redirect to login with join context
    if (!user) {
      // Validate sessionId format before storing
      if (isValidSessionId(sessionId)) {
        sessionStorage.setItem('redirect_after_login', `/join/${sessionId}`);
      }
      navigate('/login?from=join', { replace: true });
      return;
    }

    // User is authenticated - proceed with session validation and join
    const validateAndFetchSession = async () => {
      try {
        setError(null);

        // First, try to find session by ID (UUID format)
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sessionId);

        let sessionData: Session | null = null;

        if (isUUID) {
          // Query by session ID
          const { data, error: fetchError } = await supabase
            .from('sessions')
            .select('*')
            .eq('id', sessionId)
            .single();

          if (fetchError) {
            console.error('Error fetching session by ID:', fetchError);
            throw new Error('Ugyldig økt-ID');
          }

          sessionData = data as Session;
        } else {
          // Assume it's a session code (6-character format)
          const sessionCode = sessionId.toUpperCase();

          // Validate session code format (6 alphanumeric characters)
          if (!/^[A-Z0-9]{6}$/.test(sessionCode)) {
            throw new Error('Ugyldig øktkode-format. Koden skal være 6 tegn.');
          }

          const { data, error: fetchError } = await supabase
            .from('sessions')
            .select('*')
            .eq('session_code', sessionCode)
            .single();

          if (fetchError) {
            console.error('Error fetching session by code:', fetchError);
            throw new Error('Økten ble ikke funnet');
          }

          sessionData = data as Session;
        }

        if (!sessionData) {
          throw new Error('Økten ble ikke funnet');
        }

        // Check if session has ended
        const endTime = new Date(sessionData.end_time);
        const now = new Date();

        if (now > endTime) {
          throw new Error('Denne økten har utløpt og kan ikke bli med i lenger');
        }

        setSession(sessionData);

        // User is authenticated - automatically join session
        setJoining(true);
        await handleJoinSession(sessionData);
      } catch (err) {
        console.error('Error validating session:', err);
        setError(err instanceof Error ? err.message : 'Kunne ikke laste økt');
      }
    };

    validateAndFetchSession();
  }, [sessionId, authLoading, user, handleJoinSession, navigate]);

  // Handle manual retry
  const handleRetry = () => {
    if (session && user) {
      handleJoinSession(session);
    }
  };

  // Loading state while auth is initializing
  if (authLoading) {
    return (
      <div className="join-session-page">
        <div className="join-session-container">
          <div className="loading">
            <div className="loading-spinner"></div>
            <p>Laster...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && !session) {
    return (
      <div className="join-session-page">
        <div className="join-session-container">
          <div className="error-card">
            <div className="error-icon">⚠️</div>
            <h2>Kunne ikke finne økt</h2>
            <p className="error-message">{error}</p>
            <div className="button-group">
              <button onClick={() => navigate('/')} className="btn-primary">
                Gå til hjemmeside
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Joining in progress
  if (joining || joinLoading) {
    return (
      <div className="join-session-page">
        <div className="join-session-container">
          <div className="loading">
            <div className="loading-spinner"></div>
            <p>Blir med i økt...</p>
            {session && (
              <p className="session-name">{session.session_name}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Error during join - show retry option
  if (error && session && user) {
    return (
      <div className="join-session-page">
        <div className="join-session-container">
          <div className="error-card">
            <div className="error-icon">⚠️</div>
            <h2>Kunne ikke bli med i økt</h2>
            <p className="error-message">{error}</p>
            <div className="session-details">
              <h3>{session.session_name}</h3>
              <p className="session-code">Kode: <strong>{session.session_code}</strong></p>
            </div>
            <div className="button-group">
              <button onClick={handleRetry} className="btn-primary">
                Prøv igjen
              </button>
              <button onClick={() => navigate('/')} className="btn-secondary">
                Gå til hjemmeside
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default loading state (shouldn't normally reach here)
  return (
    <div className="join-session-page">
      <div className="join-session-container">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Laster økt...</p>
        </div>
      </div>
    </div>
  );
}
