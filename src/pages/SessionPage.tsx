import { useState, useEffect, useMemo } from 'react';
import type { FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSession } from '../hooks/useSession';
import { useAuth } from '../context/AuthContext';
import { formatBAC, getBACDescription } from '../utils/bacCalculator';
import { calculateTotalAlcoholGrams, convertGramsToBeers } from '../utils/chartHelpers';
import BACLineChart from '../components/charts/BACLineChart';
import AlcoholConsumptionChart from '../components/charts/AlcoholConsumptionChart';
import ChartContainer from '../components/charts/ChartContainer';

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
    participants,
    drinks,
    loading,
    error,
    addDrink,
    deleteDrink,
    getCurrentUserBAC,
  } = useSession(sessionId || null);

  const [currentUserBAC, setCurrentUserBAC] = useState(0);
  const [volumeMl, setVolumeMl] = useState(330); // Default beer can size
  const [alcoholPercentage, setAlcoholPercentage] = useState(4.5);
  const [submitting, setSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0); // seconds remaining
  const [sessionEnded, setSessionEnded] = useState(false);

  // Chart view toggles
  const [bacView, setBacView] = useState<'all' | 'self'>('all');
  const [consumptionView, setConsumptionView] = useState<'per-participant' | 'session-total'>('per-participant');
  const [consumptionUnit, setConsumptionUnit] = useState<'grams' | 'beers'>('beers');

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

  // Calculate user's total beer units consumed
  const userBeerUnits = useMemo(() => {
    if (!user) return 0;
    const userDrinks = drinks.filter((d) => d.user_id === user.id);
    const totalGrams = calculateTotalAlcoholGrams(userDrinks);
    return convertGramsToBeers(totalGrams);
  }, [drinks, user]);

  // Find the most recent drink added by current user
  const lastUserDrink = useMemo(() => {
    if (!user) return null;
    const userDrinks = drinks.filter((d) => d.user_id === user.id);
    if (userDrinks.length === 0) return null;
    // Drinks are already sorted by consumed_at descending
    return userDrinks[0];
  }, [drinks, user]);

  // Check if the last drink can be undone (added within last 2 minutes)
  const [canUndoLastDrink, setCanUndoLastDrink] = useState(false);

  useEffect(() => {
    const checkUndoAvailability = () => {
      if (!lastUserDrink) {
        setCanUndoLastDrink(false);
        return;
      }
      const drinkTime = new Date(lastUserDrink.consumed_at).getTime();
      const now = new Date().getTime();
      const twoMinutesInMs = 2 * 60 * 1000;
      setCanUndoLastDrink((now - drinkTime) < twoMinutesInMs);
    };

    checkUndoAvailability(); // Initial check

    const interval = setInterval(checkUndoAvailability, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [lastUserDrink]);

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

  const handleUndoDrink = async () => {
    if (!lastUserDrink) return;

    setSubmitting(true);
    setAddError(null);

    try {
      console.log('Undoing last drink:', lastUserDrink.id);
      await deleteDrink(lastUserDrink.id);
      console.log('Drink undone successfully!');
      setSubmitting(false);
    } catch (err: any) {
      console.error('Error undoing drink:', err);
      setAddError(err.message || 'Failed to undo drink');
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading">Laster økt...</div>;
  }

  if (error || !session) {
    return (
      <div className="error-page">
        <h2>Feil</h2>
        <p>{error || 'Økt ikke funnet'}</p>
        <button onClick={() => navigate('/')} className="btn-primary">
          Gå hjem
        </button>
      </div>
    );
  }

  const userLeaderboardEntry = leaderboard.find((entry) => entry.user_id === user?.id);

  return (
    <div className="session-page">
      {/* Session info banner - spans full width */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 24px',
        backgroundColor: 'rgba(0, 48, 73, 0.08)',
        borderRadius: '8px',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, fontSize: '16px', color: 'var(--prussian-blue)' }}>
            {session.session_name || 'Økt'}: <strong>{session.session_code}</strong>
          </span>
          <span style={{ fontSize: '15px', color: sessionEnded ? 'var(--fire-engine-red)' : 'var(--prussian-blue)' }}>
            {sessionEnded ? (
              <strong>Økten er avsluttet!</strong>
            ) : (
              <>⏱ {formatTime(timeRemaining)} igjen</>
            )}
          </span>
        </div>
        <button onClick={() => navigate('/')} className="btn-secondary">
          Forlat økt
        </button>
      </div>

      <div className="session-content">
        {/* User's current BAC */}
        <div className="user-bac-card">
          <h2>Din promille</h2>
          <div className="bac-display">
            <span className="bac-value">{formatBAC(currentUserBAC)}</span>
            <span className="bac-description">{getBACDescription(currentUserBAC)}</span>
          </div>
          <p className="user-stats">
            <span className="stat-item">
              <strong>{userBeerUnits.toFixed(1)}</strong> enheter konsumert
            </span>
          </p>
          {userLeaderboardEntry && (
            <p className="user-rank">
              Nåværende plassering: #{userLeaderboardEntry.rank}
            </p>
          )}
        </div>

        {/* Add drink form */}
        <div className="add-drink-card">
          <h2>Legg til enhet</h2>
          {sessionEnded && (
            <div className="error-message" style={{ background: '#fff3cd', color: '#856404', borderColor: '#ffc107' }}>
              Økten er avsluttet. Flere enheter kan ikke legges til.
            </div>
          )}
          {addError && <div className="error-message">{addError}</div>}

          <form onSubmit={handleAddDrink} className="add-drink-form">
            <div className="form-group">
              <label htmlFor="volume">Volum (ml)</label>
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
              <label htmlFor="alcohol">Alkohol %</label>
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
              {submitting ? 'Legger til...' : 'Legg til enhet'}
            </button>

            {canUndoLastDrink && !sessionEnded && (
              <button
                type="button"
                onClick={handleUndoDrink}
                className="btn-secondary"
                disabled={submitting}
                style={{
                  marginTop: '8px',
                  backgroundColor: '#ff9800',
                  borderColor: '#ff9800',
                  color: 'white'
                }}
              >
                {submitting ? 'Angrer...' : 'Angre siste enhet'}
              </button>
            )}
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
              Øl (330ml, 4.5%)
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
              Vin (150ml, 12%)
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
          <h2>{sessionEnded ? 'Sluttresultat' : 'Toppliste'}</h2>
          {sessionEnded && leaderboard.length > 0 && (
            <div style={{
              background: 'linear-gradient(135deg, #fff9c4, #fff59d)',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '16px',
              textAlign: 'center',
              fontWeight: 'bold'
            }}>
              {leaderboard[0]?.full_name} vinner med {formatBAC(leaderboard[0]?.bac)}!
            </div>
          )}
          {leaderboard.length === 0 ? (
            <p className="no-data">Ingen deltakere ennå</p>
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

        {/* BAC Evolution Chart */}
        {participants.length > 0 && user?.id && (
          <ChartContainer
            title="Promilleutvikling over tid"
            controls={
              <div className="chart-controls">
                <button
                  className={`preset-btn ${bacView === 'all' ? 'active' : ''}`}
                  onClick={() => setBacView('all')}
                >
                  Alle deltakere
                </button>
                <button
                  className={`preset-btn ${bacView === 'self' ? 'active' : ''}`}
                  onClick={() => setBacView('self')}
                >
                  Min promille
                </button>
              </div>
            }
          >
            <BACLineChart
              participants={participants}
              drinks={drinks}
              sessionStartTime={new Date(session.start_time)}
              sessionEndTime={new Date(session.end_time)}
              currentUserId={user.id}
              view={bacView}
            />
          </ChartContainer>
        )}

        {/* Alcohol Consumption Chart */}
        {participants.length > 0 && (
          <ChartContainer
            title="Alkoholforbruk"
            controls={
              <div className="chart-controls">
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className={`preset-btn ${consumptionView === 'per-participant' ? 'active' : ''}`}
                    onClick={() => setConsumptionView('per-participant')}
                  >
                    Per deltaker
                  </button>
                  <button
                    className={`preset-btn ${consumptionView === 'session-total' ? 'active' : ''}`}
                    onClick={() => setConsumptionView('session-total')}
                  >
                    Totalt for økt
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className={`preset-btn ${consumptionUnit === 'beers' ? 'active' : ''}`}
                    onClick={() => setConsumptionUnit('beers')}
                  >
                    Antall enheter
                  </button>
                  <button
                    className={`preset-btn ${consumptionUnit === 'grams' ? 'active' : ''}`}
                    onClick={() => setConsumptionUnit('grams')}
                  >
                    Gram
                  </button>
                </div>
              </div>
            }
          >
            <AlcoholConsumptionChart
              participants={participants}
              drinks={drinks}
              view={consumptionView}
              unit={consumptionUnit}
              currentUserId={user?.id}
            />
          </ChartContainer>
        )}
      </div>
    </div>
  );
}
