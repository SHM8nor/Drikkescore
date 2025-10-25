import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCreateSession, useJoinSession } from '../hooks/useSession';

export function HomePage() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { createSession, loading: createLoading } = useCreateSession();
  const { joinSession, loading: joinLoading } = useJoinSession();

  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [error, setError] = useState<string | null>(null);

  // Create session form state
  const [duration, setDuration] = useState(60); // default 1 hour in minutes

  // Join session form state
  const [sessionCode, setSessionCode] = useState('');

  const handleCreateSession = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!duration || duration <= 0) {
      setError('Vennligst velg en øktvarighet');
      return;
    }

    // Calculate start and end times based on duration
    const start = new Date();
    const end = new Date(start.getTime() + duration * 60 * 1000); // duration in ms

    try {
      const session = await createSession(start, end);
      navigate(`/session/${session.id}`);
    } catch (err: any) {
      setError(err.message || 'Kunne ikke opprette økt');
    }
  };

  const handleJoinSession = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!sessionCode.trim()) {
      setError('Vennligst skriv inn en øktkode');
      return;
    }

    try {
      const session = await joinSession(sessionCode.toUpperCase().trim());
      navigate(`/session/${session.id}`);
    } catch (err: any) {
      setError(err.message || 'Kunne ikke bli med i økt');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="home-page">
      <header className="home-header">
        <h1>Drikkescore</h1>
        <div className="user-info">
          {profile && <span>Velkommen, {profile.full_name}</span>}
          <button onClick={handleSignOut} className="btn-secondary">
            Logg ut
          </button>
        </div>
      </header>

      <div className="home-content">
        <div className="session-container">
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'create' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('create');
                setError(null);
              }}
            >
              Opprett økt
            </button>
            <button
              className={`tab ${activeTab === 'join' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('join');
                setError(null);
              }}
            >
              Bli med i økt
            </button>
          </div>

          {error && <div className="error-message">{error}</div>}

          {activeTab === 'create' ? (
            <form onSubmit={handleCreateSession} className="session-form">
              <h2>Opprett ny økt</h2>
              <p className="form-description">
                Velg hvor lenge drikkeøkten skal vare
              </p>

              <div className="form-group">
                <label htmlFor="duration">Øktvarighet</label>
                <select
                  id="duration"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  required
                >
                  <option value={1}>1 minutt (testing)</option>
                  <option value={30}>30 minutter</option>
                  <option value={60}>1 time</option>
                  <option value={90}>1,5 timer</option>
                  <option value={120}>2 timer</option>
                  <option value={150}>2,5 timer</option>
                  <option value={180}>3 timer</option>
                  <option value={240}>4 timer</option>
                  <option value={300}>5 timer</option>
                  <option value={360}>6 timer</option>
                </select>
              </div>

              <button type="submit" className="btn-primary" disabled={createLoading}>
                {createLoading ? 'Oppretter...' : 'Opprett økt'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoinSession} className="session-form">
              <h2>Bli med i eksisterende økt</h2>
              <p className="form-description">
                Skriv inn 6-tegns øktkoden for å bli med
              </p>

              <div className="form-group">
                <label htmlFor="session_code">Øktkode</label>
                <input
                  id="session_code"
                  type="text"
                  value={sessionCode}
                  onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                  placeholder="ABC123"
                  maxLength={6}
                  required
                  style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}
                />
              </div>

              <button type="submit" className="btn-primary" disabled={joinLoading}>
                {joinLoading ? 'Blir med...' : 'Bli med i økt'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
