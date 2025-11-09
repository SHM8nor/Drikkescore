import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, FormControl, InputLabel, Select, MenuItem, Typography } from '@mui/material';
import { useSessionHistory } from '../hooks/useSessionHistory';
import { useHistoricalSession } from '../hooks/useHistoricalSession';
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
  } = useHistoricalSession(selectedSessionId);

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
            <Box sx={{ mt: 2, mb: 3 }}>
              <FormControl fullWidth>
                <InputLabel id="session-select-label">Velg økt</InputLabel>
                <Select
                  labelId="session-select-label"
                  id="session-select"
                  value={selectedSessionId || ''}
                  label="Velg økt"
                  onChange={(e) => setSelectedSessionId(e.target.value)}
                  sx={{
                    backgroundColor: 'white',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(0, 48, 73, 0.2)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'var(--prussian-blue)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'var(--prussian-blue)',
                    },
                  }}
                >
                  {sessions.map((session) => {
                    const date = new Date(session.start_time);
                    const formattedDate = date.toLocaleDateString('no-NO', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    });

                    return (
                      <MenuItem key={session.id} value={session.id}>
                        <Box
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 0.5,
                            width: '100%',
                          }}
                        >
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: 600,
                              color: 'var(--prussian-blue)',
                            }}
                          >
                            {session.session_name || 'Økt'}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: 'var(--color-text-secondary)',
                              fontSize: '0.875rem',
                            }}
                          >
                            {formattedDate}
                          </Typography>
                        </Box>
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Box>

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
