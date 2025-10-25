import { useMemo } from 'react';
import type { Session, Profile, DrinkEntry } from '../types/database';
import { useAuth } from '../context/AuthContext';
import { formatBAC, getBACDescription } from '../utils/bacCalculator';
import { calculateTotalAlcoholGrams, convertGramsToBeers } from '../utils/chartHelpers';
import { calculateBAC } from '../utils/bacCalculator';

interface ReadOnlySessionViewProps {
  session: Session;
  participants: Profile[];
  drinks: DrinkEntry[];
}

export function ReadOnlySessionView({ session, participants, drinks }: ReadOnlySessionViewProps) {
  const { user } = useAuth();

  const leaderboard = useMemo(() => {
    if (participants.length === 0) return [];

    const endTime = new Date(session.end_time);
    const leaderboardData = participants.map((participant) => {
      const userDrinks = drinks.filter((d) => d.user_id === participant.id);
      const bac = calculateBAC(userDrinks, participant, endTime);

      return {
        user_id: participant.id,
        full_name: participant.full_name,
        bac,
        rank: 0,
      };
    });

    leaderboardData.sort((a, b) => b.bac - a.bac);
    leaderboardData.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return leaderboardData;
  }, [participants, drinks, session.end_time]);

  const userStats = useMemo(() => {
    if (!user) return { bac: 0, beerUnits: 0, rank: 0 };

    const userDrinks = drinks.filter((d) => d.user_id === user.id);
    const profile = participants.find((p) => p.id === user.id);

    if (!profile) return { bac: 0, beerUnits: 0, rank: 0 };

    const bac = calculateBAC(userDrinks, profile, new Date(session.end_time));
    const totalGrams = calculateTotalAlcoholGrams(userDrinks);
    const beerUnits = convertGramsToBeers(totalGrams);
    const rank = leaderboard.find((e) => e.user_id === user.id)?.rank || 0;

    return { bac, beerUnits, rank };
  }, [drinks, participants, user, session.end_time, leaderboard]);

  return (
    <div className="readonly-session-view">
      <div className="session-info">
        <h2>{session.session_name || 'Økt'}</h2>
        <p>Kode: {session.session_code}</p>
        <p>Startet: {new Date(session.start_time).toLocaleString('no-NO')}</p>
        <p>Avsluttet: {new Date(session.end_time).toLocaleString('no-NO')}</p>
      </div>

      {user && participants.find((p) => p.id === user.id) && (
        <div className="user-stats-card">
          <h3>Dine resultater</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Sluttresultat</span>
              <span className="stat-value">{formatBAC(userStats.bac)}</span>
              <span className="stat-description">{getBACDescription(userStats.bac)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Enheter konsumert</span>
              <span className="stat-value">{userStats.beerUnits.toFixed(1)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Plassering</span>
              <span className="stat-value">#{userStats.rank}</span>
            </div>
          </div>
        </div>
      )}

      <div className="leaderboard-card">
        <h3>Sluttresultat</h3>
        {leaderboard.length > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, #fff9c4, #fff59d)',
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '16px',
            textAlign: 'center',
            fontWeight: 'bold'
          }}>
            {leaderboard[0]?.full_name} vant med {formatBAC(leaderboard[0]?.bac)}!
          </div>
        )}
        {leaderboard.length === 0 ? (
          <p className="no-data">Ingen deltakere</p>
        ) : (
          <div className="leaderboard">
            {leaderboard.map((entry) => (
              <div
                key={entry.user_id}
                className="leaderboard-entry"
              >
                <span className="rank">#{entry.rank}</span>
                <span className="name">{entry.full_name}</span>
                <span className="bac">{formatBAC(entry.bac)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="participants-card">
        <h3>Deltakere ({participants.length})</h3>
        <div className="participants-list">
          {participants.map((participant) => (
            <div key={participant.id} className="participant-item">
              <span>{participant.full_name}</span>
              <span className="participant-drinks">
                {drinks.filter((d) => d.user_id === participant.id).length} enheter
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
