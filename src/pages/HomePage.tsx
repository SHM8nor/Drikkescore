import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateSession, useJoinSession } from "../hooks/useSession";
import { useActiveSession } from "../hooks/useActiveSession";
import { useThemeConfig } from "../hooks/useThemeConfig";
import { QRScanner } from "../components/session/QRScanner";
import { ActiveSessions } from "../components/friends/ActiveSessions";
import { SessionTypeIndicator } from "../components/session/SessionTypeIndicator";
import { PageContainer } from "../components/layout/PageContainer";
import type { SessionType } from "../types/database";
import { Box, Paper, Typography, Alert } from "@mui/material";
import { isThemeAvailable, getRecommendedTheme } from "../config/themes";

export function HomePage() {
  const navigate = useNavigate();
  const { createSession, loading: createLoading } = useCreateSession();
  const { joinSession, loading: joinLoading } = useJoinSession();
  const { activeSessions, loading: activeSessionsLoading } = useActiveSession();

  // Fetch theme configuration from database
  const { data: themeConfig } = useThemeConfig();

  const [activeTab, setActiveTab] = useState<"create" | "join">("create");
  const [error, setError] = useState<string | null>(null);
  const [showQRScanner, setShowQRScanner] = useState(false);

  // Create session form state
  const [duration, setDuration] = useState(60); // default 1 hour in minutes
  const [sessionName, setSessionName] = useState("");
  const [sessionType, setSessionType] = useState<SessionType>("standard");

  // Set recommended theme on mount (based on seasonal settings)
  useEffect(() => {
    const recommended = getRecommendedTheme();
    if (isThemeAvailable(recommended)) {
      setSessionType(recommended);
    }
  }, []);

  // Join session form state
  const [sessionCode, setSessionCode] = useState("");

  const handleCreateSession = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!duration || duration <= 0) {
      setError("Vennligst velg en øktvarighet");
      return;
    }

    if (!sessionName.trim()) {
      setError("Vennligst skriv inn et øktnavn");
      return;
    }

    // Calculate start and end times based on duration
    const start = new Date();
    const end = new Date(start.getTime() + duration * 60 * 1000); // duration in ms

    try {
      const session = await createSession(sessionName.trim(), start, end, sessionType);
      navigate(`/session/${session.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunne ikke opprette økt");
    }
  };

  const handleJoinSession = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!sessionCode.trim()) {
      setError("Vennligst skriv inn en øktkode");
      return;
    }

    try {
      const session = await joinSession(sessionCode.toUpperCase().trim());
      navigate(`/session/${session.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunne ikke bli med i økt");
    }
  };

  const handleQRScanSuccess = async (scannedCode: string) => {
    setShowQRScanner(false);
    setError(null);

    try {
      const session = await joinSession(scannedCode.toUpperCase().trim());
      navigate(`/session/${session.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunne ikke bli med i økt");
      // Switch to join tab to show error
      setActiveTab("join");
    }
  };

  const handleRejoinSession = (sessionId: string) => {
    navigate(`/session/${sessionId}`);
  };

  const formatTimeRemaining = (endTime: string): string => {
    const end = new Date(endTime);
    const now = new Date();
    const diffMs = end.getTime() - now.getTime();

    if (diffMs <= 0) return "Utløpt";

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 0) {
      return `${diffHours}t ${diffMinutes}m igjen`;
    }
    return `${diffMinutes}m igjen`;
  };

  // Get theme colors for preview
  const getThemePreview = () => {
    if (sessionType === "julebord") {
      return {
        primary: "#165B33",
        secondary: "#C41E3A",
        accent: "#FFD700",
        danger: "#8B0000",
      };
    }
    return {
      primary: "#003049",
      secondary: "#f77f00",
      accent: "#fcbf49",
      danger: "#d62828",
    };
  };

  return (
    <PageContainer>
      <div className="home-page">
        <div className="home-content">
          {/* Active User Sessions Section */}
          {!activeSessionsLoading && activeSessions.length > 0 && (
            <div
              className="active-sessions-container"
              style={{ marginBottom: "var(--spacing-xl)" }}
            >
              <h2
                style={{
                  color: "var(--prussian-blue)",
                  marginBottom: "var(--spacing-md)",
                  fontSize: "var(--font-size-h5)",
                }}
              >
                Dine aktive økter
              </h2>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--spacing-md)",
                }}
              >
                {activeSessions.map((session) => (
                  <div
                    key={session.id}
                    className="active-session-card"
                    style={{
                      background: "var(--color-background-primary)",
                      border: "2px solid var(--prussian-blue)",
                      borderRadius: "var(--radius-lg)",
                      padding: "var(--spacing-md)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      boxShadow: "var(--shadow-md)",
                      transition: "all var(--transition-base)",
                      cursor: "pointer",
                    }}
                    onClick={() => handleRejoinSession(session.id)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "var(--shadow-lg)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "var(--shadow-md)";
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--spacing-xs)' }}>
                        <h3
                          style={{
                            color: "var(--color-text-primary)",
                            fontSize: "var(--font-size-base)",
                            fontWeight: "var(--font-weight-medium)",
                            margin: 0,
                          }}
                        >
                          {session.session_name}
                        </h3>
                        <SessionTypeIndicator sessionType={session.session_type} size="small" />
                      </div>
                      <p
                        style={{
                          color: "var(--color-text-secondary)",
                          fontSize: "var(--font-size-small)",
                          marginBottom: "var(--spacing-xs)",
                        }}
                      >
                        Kode: <strong>{session.session_code}</strong>
                      </p>
                      <p
                        style={{
                          color: "var(--color-text-muted)",
                          fontSize: "var(--font-size-small)",
                        }}
                      >
                        {formatTimeRemaining(session.end_time)}
                      </p>
                    </div>
                    <button
                      className="btn-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRejoinSession(session.id);
                      }}
                      style={{ minWidth: "120px" }}
                    >
                      Bli med
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Friends' Active Sessions Section */}
          <div
            className="friends-sessions-container"
            style={{ marginBottom: "var(--spacing-xl)" }}
          >
            <ActiveSessions maxDisplay={5} />
          </div>

          <div className="session-container">
            <div className="tabs">
              <button
                className={`tab ${activeTab === "create" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("create");
                  setError(null);
                }}
              >
                Opprett økt
              </button>
              <button
                className={`tab ${activeTab === "join" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("join");
                  setError(null);
                }}
              >
                Bli med i økt
              </button>
            </div>

            {error && <div className="error-message">{error}</div>}

            {activeTab === "create" ? (
              <form onSubmit={handleCreateSession} className="session-form">
                <h2>Opprett ny økt</h2>
                <p className="form-description">
                  Velg hvor lenge drikkeøkten skal vare og hvilket tema du ønsker
                </p>

                <div className="form-group">
                  <label htmlFor="session_name">Øktnavn</label>
                  <input
                    id="session_name"
                    type="text"
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                    placeholder="F.eks. Fredagspils"
                    required
                  />
                </div>

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
                    <option value={480}>8 timer</option>
                    <option value={600}>10 timer</option>
                    <option value={720}>12 timer</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="session_type">Tema</label>
                  <Box sx={{ mt: 1 }}>
                    <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                      <button
                        type="button"
                        className={sessionType === "standard" ? "btn-primary" : "btn-secondary"}
                        onClick={() => setSessionType("standard")}
                        style={{ flex: 1 }}
                      >
                        Standard
                      </button>
                      {themeConfig?.julebord_enabled && (
                        <button
                          type="button"
                          className={sessionType === "julebord" ? "btn-primary" : "btn-secondary"}
                          onClick={() => setSessionType("julebord")}
                          style={{
                            flex: 1,
                            backgroundColor: sessionType === "julebord" ? "#C41E3A" : undefined,
                            borderColor: sessionType === "julebord" ? "#C41E3A" : undefined,
                          }}
                        >
                          🎄 Julebord
                        </button>
                      )}
                    </Box>

                    {/* Theme Preview */}
                    {sessionType !== "standard" && (
                      <Paper
                        elevation={1}
                        sx={{
                          p: 2,
                          backgroundColor: "#f5f5f5",
                          borderRadius: 2,
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            mb: 1.5,
                            fontWeight: 600,
                            color: "#666"
                          }}
                        >
                          Forhåndsvisning av fargepalett:
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                          <Box
                            sx={{
                              width: 48,
                              height: 48,
                              backgroundColor: getThemePreview().primary,
                              borderRadius: 1,
                              border: "1px solid #ddd",
                              transition: "all 0.3s ease",
                            }}
                            title="Primærfarge"
                          />
                          <Box
                            sx={{
                              width: 48,
                              height: 48,
                              backgroundColor: getThemePreview().secondary,
                              borderRadius: 1,
                              border: "1px solid #ddd",
                              transition: "all 0.3s ease",
                            }}
                            title="Sekundærfarge"
                          />
                          <Box
                            sx={{
                              width: 48,
                              height: 48,
                              backgroundColor: getThemePreview().accent,
                              borderRadius: 1,
                              border: "1px solid #ddd",
                              transition: "all 0.3s ease",
                            }}
                            title="Aksentfarge"
                          />
                          <Box
                            sx={{
                              width: 48,
                              height: 48,
                              backgroundColor: getThemePreview().danger,
                              borderRadius: 1,
                              border: "1px solid #ddd",
                              transition: "all 0.3s ease",
                            }}
                            title="Farefarge"
                          />
                          <Typography
                            variant="caption"
                            sx={{
                              ml: 1.5,
                              color: "#666",
                              fontStyle: "italic"
                            }}
                          >
                            Julebordstema aktiveres når økten starter
                          </Typography>
                        </Box>
                      </Paper>
                    )}
                  </Box>
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={createLoading}
                  style={{
                    backgroundColor: sessionType === "julebord" ? "#C41E3A" : undefined,
                    borderColor: sessionType === "julebord" ? "#C41E3A" : undefined,
                  }}
                >
                  {createLoading ? "Oppretter..." : "Opprett økt"}
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
                    style={{ textTransform: "uppercase", letterSpacing: "0.1em" }}
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={joinLoading}
                >
                  {joinLoading ? "Blir med..." : "Bli med i økt"}
                </button>

                {/* QR Scanner Button */}
                <div
                  style={{
                    marginTop: "var(--spacing-md)",
                    textAlign: "center",
                    padding: "var(--spacing-md) 0",
                    borderTop: "1px solid var(--color-border)",
                  }}
                >
                  <p
                    style={{
                      color: "var(--color-text-secondary)",
                      fontSize: "var(--font-size-small)",
                      marginBottom: "var(--spacing-sm)",
                    }}
                  >
                    eller
                  </p>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowQRScanner(true)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "var(--spacing-sm)",
                      width: "100%",
                    }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="3" y="3" width="8" height="8" />
                      <rect x="13" y="3" width="8" height="8" />
                      <rect x="3" y="13" width="8" height="8" />
                      <rect x="13" y="13" width="8" height="8" />
                    </svg>
                    Skann QR-kode
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* QR Scanner Modal */}
        {showQRScanner && (
          <QRScanner
            onScanSuccess={handleQRScanSuccess}
            onClose={() => setShowQRScanner(false)}
          />
        )}
      </div>
    </PageContainer>
  );
}
