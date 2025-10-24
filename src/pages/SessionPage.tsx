import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSession } from '../hooks/useSession';
import { useAuth } from '../context/AuthContext';
import { formatBAC, getBACDescription } from '../utils/bacCalculator';

// Helper function to format countdown timer
function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function SessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    session,
    leaderboard,
    loading,
    error,
    addDrink,
    getCurrentUserBAC,
  } = useSession(sessionId || null);

  const [currentUserBAC, setCurrentUserBAC] = useState(0);
  const [volumeMl, setVolumeMl] = useState(330); // Default beer can size
  const [alcoholPercentage, setAlcoholPercentage] = useState(4.5);
  const [submitting, setSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0); // seconds remaining
  const [sessionEnded, setSessionEnded] = useState(false);

  // Calculate time remaining and check if session ended
  useEffect(() => {
    if (!session) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const endTime = new Date(session.end_time).getTime();
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000)); // seconds

      setTimeRemaining(remaining);

      if (remaining === 0) {
        setSessionEnded(true);
      }
    };

    updateTimer(); // Initial update
    const interval = setInterval(updateTimer, 1000); // Update every second

    return () => clearInterval(interval);
  }, [session]);

  // Update BAC every 10 seconds
  useEffect(() => {
    const updateBAC = () => {
      const bac = getCurrentUserBAC();
      setCurrentUserBAC(bac);
    };

    updateBAC(); // Initial update

    const interval = setInterval(updateBAC, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [getCurrentUserBAC]);

  const handleAddDrink = async (e: FormEvent) => {
    e.preventDefault();
    console.log('Add drink clicked!', { volumeMl, alcoholPercentage });
    setSubmitting(true);
    setAddError(null);

    if (volumeMl <= 0 || alcoholPercentage < 0) {
      console.error('Invalid drink values');
      setAddError('Invalid drink values');
      setSubmitting(false);
      return;
    }

    try {
      console.log('Calling addDrink...');
      await addDrink(volumeMl, alcoholPercentage);
      console.log('Drink added successfully!');
      setSubmitting(false);
      // Reset to defaults
      setVolumeMl(330);
      setAlcoholPercentage(4.5);
    } catch (err: any) {
      console.error('Error adding drink:', err);
      setAddError(err.message || 'Failed to add drink');
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading session...</div>;
  }

  if (error || !session) {
    return (
      <div className="error-page">
        <h2>Error</h2>
        <p>{error || 'Session not found'}</p>
        <button onClick={() => navigate('/')} className="btn-primary">
          Go Home
        </button>
      </div>
    );
  }

  const userLeaderboardEntry = leaderboard.find((entry) => entry.user_id === user?.id);

  return (
    <div className="session-page">
      <header className="session-header">
        <div>
          <h1>Session: {session.session_code}</h1>
          <p className="session-time">
            {sessionEnded ? (
              <strong style={{ color: 'var(--danger-color)' }}>Session Ended!</strong>
            ) : (
              <>
                <strong>Time Remaining:</strong> {formatTime(timeRemaining)}
              </>
            )}
          </p>
        </div>
        <button onClick={() => navigate('/')} className="btn-secondary">
          Leave Session
        </button>
      </header>

      <div className="session-content">
        {/* User's current BAC */}
        <div className="user-bac-card">
          <h2>Your BAC</h2>
          <div className="bac-display">
            <span className="bac-value">{formatBAC(currentUserBAC)}</span>
            <span className="bac-description">{getBACDescription(currentUserBAC)}</span>
          </div>
          {userLeaderboardEntry && (
            <p className="user-rank">
              Current Rank: #{userLeaderboardEntry.rank}
            </p>
          )}
        </div>

        {/* Add drink form */}
        <div className="add-drink-card">
          <h2>Add Drink</h2>
          {sessionEnded && (
            <div className="error-message" style={{ background: '#fff3cd', color: '#856404', borderColor: '#ffc107' }}>
              Session has ended. No more drinks can be added.
            </div>
          )}
          {addError && <div className="error-message">{addError}</div>}

          <form onSubmit={handleAddDrink} className="add-drink-form">
            <div className="form-group">
              <label htmlFor="volume">Volume (ml)</label>
              <input
                id="volume"
                type="number"
                step="1"
                value={volumeMl}
                onChange={(e) => setVolumeMl(parseFloat(e.target.value) || 0)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="alcohol">Alcohol %</label>
              <input
                id="alcohol"
                type="number"
                step="0.1"
                value={alcoholPercentage}
                onChange={(e) => setAlcoholPercentage(parseFloat(e.target.value) || 0)}
                required
              />
            </div>

            <button type="submit" className="btn-primary" disabled={submitting || sessionEnded}>
              {submitting ? 'Adding...' : 'Add Drink'}
            </button>
          </form>

          {/* Quick preset buttons */}
          <div className="drink-presets">
            <button
              onClick={() => {
                setVolumeMl(330);
                setAlcoholPercentage(4.5);
              }}
              className="preset-btn"
            >
              Beer (330ml, 4.5%)
            </button>
            <button
              onClick={() => {
                setVolumeMl(500);
                setAlcoholPercentage(4.5);
              }}
              className="preset-btn"
            >
              Pint (500ml, 4.5%)
            </button>
            <button
              onClick={() => {
                setVolumeMl(150);
                setAlcoholPercentage(12);
              }}
              className="preset-btn"
            >
              Wine (150ml, 12%)
            </button>
            <button
              onClick={() => {
                setVolumeMl(40);
                setAlcoholPercentage(40);
              }}
              className="preset-btn"
            >
              Shot (40ml, 40%)
            </button>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="leaderboard-card">
          <h2>{sessionEnded ? 'Final Highscore' : 'Leaderboard'}</h2>
          {sessionEnded && leaderboard.length > 0 && (
            <div style={{
              background: 'linear-gradient(135deg, #fff9c4, #fff59d)',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '16px',
              textAlign: 'center',
              fontWeight: 'bold'
            }}>
              {leaderboard[0]?.full_name} wins with {formatBAC(leaderboard[0]?.bac)}!
            </div>
          )}
          {leaderboard.length === 0 ? (
            <p className="no-data">No participants yet</p>
          ) : (
            <div className="leaderboard">
              {leaderboard.map((entry) => (
                <div
                  key={entry.user_id}
                  className={`leaderboard-entry ${entry.user_id === user?.id ? 'current-user' : ''}`}
                >
                  <span className="rank">#{entry.rank}</span>
                  <span className="name">{entry.full_name}</span>
                  <span className="bac">{formatBAC(entry.bac)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
