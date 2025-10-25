import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionHistory } from '../hooks/useSessionHistory';
import { useSession } from '../hooks/useSession';
import { ReadOnlySessionView } from '../components/ReadOnlySessionView';

export function HistoryPage() {
  const navigate = useNavigate();
  const { sessions, loading: historyLoading, error: historyError } = useSessionHistory();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const {
    session: selectedSession,
    participants,
    drinks,
    loading: sessionLoading,
    error: sessionError,
  } = useSession(selectedSessionId);

  useEffect(() => {
    if (sessions.length > 0 && !selectedSessionId) {
      setSelectedSessionId(sessions[0].id);
    }
  }, [sessions, selectedSessionId]);

  if (historyLoading) {
    return <div className="loading">Laster historikk...</div>;
  }

  if (historyError) {
    return (
      <div className="error-page">
        <h2>Feil</h2>
        <p>{historyError}</p>
        <button onClick={() => navigate('/')} className="btn-primary">
          Gå hjem
        </button>
      </div>
    );
  }

  return (
    <div className="history-page">
      <header className="page-header">
        <h1>Økthistorikk</h1>
        <button onClick={() => navigate('/')} className="btn-secondary">
          Tilbake
        </button>
      </header>

      <div className="history-content">
        {sessions.length === 0 ? (
          <div className="no-sessions">
            <p>Du har ingen fullførte økter ennå.</p>
            <button onClick={() => navigate('/')} className="btn-primary">
              Opprett ny økt
            </button>
          </div>
        ) : (
          <>
            <div className="session-selector">
              <label htmlFor="session-select">Velg økt:</label>
              <select
                id="session-select"
                value={selectedSessionId || ''}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                className="session-dropdown"
              >
                {sessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.session_name || 'Økt'} - {new Date(session.start_time).toLocaleDateString('no-NO')}
                  </option>
                ))}
              </select>
            </div>

            {sessionLoading && <div className="loading">Laster øktdata...</div>}

            {sessionError && (
              <div className="error-message">
                <p>{sessionError}</p>
              </div>
            )}

            {selectedSession && !sessionLoading && (
              <ReadOnlySessionView
                session={selectedSession}
                participants={participants}
                drinks={drinks}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}