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
        display_name: participant.display_name,
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
    <div className="readonly-session-view" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="session-info-card" style={{
        background: 'white',
        padding: '1.5rem',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0, 48, 73, 0.1)'
      }}>
        <h2 style={{ marginBottom: '1.5rem', color: '#003049' }}>
          {session.session_name || 'Økt'}
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <strong style={{ color: '#003049', minWidth: '90px' }}>Kode:</strong>
            <span style={{
              color: '#003049',
              background: '#eae2b7',
              padding: '0.25rem 0.75rem',
              borderRadius: '4px',
              fontWeight: '500'
            }}>
              {session.session_code}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <strong style={{ color: '#003049', minWidth: '90px' }}>Startet:</strong>
            <span style={{ color: '#003049' }}>
              {new Date(session.start_time).toLocaleString('no-NO', {
                dateStyle: 'short',
                timeStyle: 'short'
              })}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <strong style={{ color: '#003049', minWidth: '90px' }}>Avsluttet:</strong>
            <span style={{ color: '#003049' }}>
              {new Date(session.end_time).toLocaleString('no-NO', {
                dateStyle: 'short',
                timeStyle: 'short'
              })}
            </span>
          </div>
        </div>
      </div>

      {user && participants.find((p) => p.id === user.id) && (
        <div className="user-stats-card" style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0, 48, 73, 0.1)'
        }}>
          <h3 style={{ marginBottom: '1.5rem', color: '#003049' }}>Dine resultater</h3>
          <div className="stats-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '1.5rem'
          }}>
            <div className="stat-item" style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              padding: '1rem',
              background: '#eae2b7',
              borderRadius: '6px',
              borderLeft: '4px solid #f77f00'
            }}>
              <span className="stat-label" style={{ fontSize: '0.875rem', color: '#003049', opacity: 0.8 }}>
                Sluttresultat
              </span>
              <span className="stat-value" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#003049' }}>
                {formatBAC(userStats.bac)}
              </span>
              <span className="stat-description" style={{ fontSize: '0.875rem', color: '#003049' }}>
                {getBACDescription(userStats.bac)}
              </span>
            </div>
            <div className="stat-item" style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              padding: '1rem',
              background: '#eae2b7',
              borderRadius: '6px',
              borderLeft: '4px solid #f77f00'
            }}>
              <span className="stat-label" style={{ fontSize: '0.875rem', color: '#003049', opacity: 0.8 }}>
                Enheter konsumert
              </span>
              <span className="stat-value" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#003049' }}>
                {userStats.beerUnits.toFixed(1)}
              </span>
            </div>
            <div className="stat-item" style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              padding: '1rem',
              background: '#eae2b7',
              borderRadius: '6px',
              borderLeft: '4px solid #f77f00'
            }}>
              <span className="stat-label" style={{ fontSize: '0.875rem', color: '#003049', opacity: 0.8 }}>
                Plassering
              </span>
              <span className="stat-value" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#003049' }}>
                #{userStats.rank}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="leaderboard-card" style={{
        background: 'white',
        padding: '1.5rem',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0, 48, 73, 0.1)'
      }}>
        <h3 style={{ marginBottom: '1.5rem', color: '#003049' }}>Sluttresultat</h3>
        {leaderboard.length > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, #fcbf49, #f77f00)',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            textAlign: 'center',
            fontWeight: 'bold',
            color: '#003049',
            fontSize: '1.125rem',
            boxShadow: '0 2px 4px rgba(0, 48, 73, 0.1)'
          }}>
            {leaderboard[0]?.display_name} vant med {formatBAC(leaderboard[0]?.bac)}!
          </div>
        )}
        {leaderboard.length === 0 ? (
          <p className="no-data" style={{ textAlign: 'center', color: '#003049', opacity: 0.6 }}>
            Ingen deltakere
          </p>
        ) : (
          <div className="leaderboard" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {leaderboard.map((entry, index) => (
              <div
                key={entry.user_id}
                className="leaderboard-entry"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '1rem',
                  background: index === 0 ? '#fcbf49' : '#eae2b7',
                  borderRadius: '6px',
                  gap: '1rem',
                  transition: 'transform 0.2s',
                  cursor: 'default',
                  border: index === 0 ? '2px solid #f77f00' : 'none'
                }}
              >
                <span className="rank" style={{
                  fontWeight: 'bold',
                  color: '#003049',
                  minWidth: '40px',
                  fontSize: '1.125rem'
                }}>
                  #{entry.rank}
                </span>
                <span className="name" style={{
                  flex: 1,
                  color: '#003049',
                  fontWeight: index === 0 ? 'bold' : 'normal',
                  fontSize: index === 0 ? '1.125rem' : '1rem'
                }}>
                  {entry.display_name}
                </span>
                <span className="bac" style={{
                  fontWeight: 'bold',
                  color: '#003049',
                  fontSize: '1.125rem',
                  background: index === 0 ? '#f77f00' : '#fcbf49',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '4px'
                }}>
                  {formatBAC(entry.bac)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="participants-card" style={{
        background: 'white',
        padding: '1.5rem',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0, 48, 73, 0.1)'
      }}>
        <h3 style={{ marginBottom: '1.5rem', color: '#003049' }}>
          Deltakere ({participants.length})
        </h3>
        <div className="participants-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {participants.map((participant) => {
            const drinkCount = drinks.filter((d) => d.user_id === participant.id).length;
            return (
              <div
                key={participant.id}
                className="participant-item"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  background: '#eae2b7',
                  borderRadius: '6px',
                  gap: '1rem'
                }}
              >
                <span style={{ color: '#003049', fontWeight: '500' }}>
                  {participant.display_name}
                </span>
                <span
                  className="participant-drinks"
                  style={{
                    color: '#003049',
                    background: '#fcbf49',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  {drinkCount} {drinkCount === 1 ? 'enhet' : 'enheter'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
