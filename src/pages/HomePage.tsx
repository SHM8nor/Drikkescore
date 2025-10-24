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
      setError('Please select a session duration');
      return;
    }

    // Calculate start and end times based on duration
    const start = new Date();
    const end = new Date(start.getTime() + duration * 60 * 1000); // duration in ms

    try {
      const session = await createSession(start, end);
      navigate(`/session/${session.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create session');
    }
  };

  const handleJoinSession = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!sessionCode.trim()) {
      setError('Please enter a session code');
      return;
    }

    try {
      const session = await joinSession(sessionCode.toUpperCase().trim());
      navigate(`/session/${session.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to join session');
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
        {profile && (
          <div className="user-info">
            <span>Welcome, {profile.full_name}</span>
            <button onClick={handleSignOut} className="btn-secondary">
              Logout
            </button>
          </div>
        )}
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
              Create Session
            </button>
            <button
              className={`tab ${activeTab === 'join' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('join');
                setError(null);
              }}
            >
              Join Session
            </button>
          </div>

          {error && <div className="error-message">{error}</div>}

          {activeTab === 'create' ? (
            <form onSubmit={handleCreateSession} className="session-form">
              <h2>Create New Session</h2>
              <p className="form-description">
                Choose how long your drinking session will last
              </p>

              <div className="form-group">
                <label htmlFor="duration">Session Duration</label>
                <select
                  id="duration"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  required
                >
                  <option value={1}>1 minute (testing)</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                  <option value={150}>2.5 hours</option>
                  <option value={180}>3 hours</option>
                  <option value={240}>4 hours</option>
                  <option value={300}>5 hours</option>
                  <option value={360}>6 hours</option>
                </select>
              </div>

              <button type="submit" className="btn-primary" disabled={createLoading}>
                {createLoading ? 'Creating...' : 'Create Session'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoinSession} className="session-form">
              <h2>Join Existing Session</h2>
              <p className="form-description">
                Enter the 6-character session code to join
              </p>

              <div className="form-group">
                <label htmlFor="session_code">Session Code</label>
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
                {joinLoading ? 'Joining...' : 'Join Session'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
