/* eslint-disable */
/**
 * USAGE EXAMPLE - Session Detail Hooks
 *
 * This file demonstrates how to use the session detail hooks
 * for the admin deep dive feature.
 *
 * DO NOT IMPORT THIS FILE - It's for documentation only
 */

import { useSessionDetail } from './useSessionDetail';
import { useSessionBACData, calculateSessionBACStats } from './useSessionBACData';

// Example 1: Basic session detail with real-time updates
function SessionDetailView({ sessionId }: { sessionId: string }) {
  const {
    session,
    participants,
    drinks,
    leaderboard,
    loading,
    error,
    refetch
  } = useSessionDetail(sessionId);

  if (loading) return <div>Loading session details...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!session) return <div>Session not found</div>;

  return (
    <div>
      <h1>{session.session_name}</h1>
      <p>Code: {session.session_code}</p>

      <h2>Participants ({participants.length})</h2>
      {participants.map((p) => (
        <div key={p.userId}>
          {p.profile.full_name} - {p.drinkCount} drinks
          Current BAC: {p.currentBAC.toFixed(2)}‰
          Peak BAC: {p.peakBAC.toFixed(2)}‰
        </div>
      ))}

      <h2>Leaderboard</h2>
      {leaderboard.map((entry) => (
        <div key={entry.user_id}>
          #{entry.rank} {entry.full_name} - {entry.bac.toFixed(2)}‰
        </div>
      ))}

      <h2>Recent Drinks ({drinks.length})</h2>
      {drinks.map((drink) => (
        <div key={drink.id}>
          {drink.user.full_name}: {drink.volume_ml}ml at {drink.alcohol_percentage}%
        </div>
      ))}

      <button onClick={() => refetch()}>Refresh</button>
    </div>
  );
}

// Example 2: BAC time-series data for charting
function SessionBACChart({ sessionId }: { sessionId: string }) {
  const { bacData, loading, error } = useSessionBACData(sessionId);

  if (loading) return <div>Loading BAC data...</div>;
  if (error) return <div>Error: {error}</div>;

  const stats = calculateSessionBACStats(bacData);

  return (
    <div>
      <h2>Session BAC Statistics</h2>
      <p>Average Peak BAC: {stats.averagePeakBAC.toFixed(2)}‰</p>
      <p>Max Peak BAC: {stats.maxPeakBAC.toFixed(2)}‰</p>
      <p>Participants over limit: {stats.participantsOverLimit} / {stats.totalParticipants}</p>

      <h3>BAC Over Time</h3>
      {bacData.map((userData) => (
        <div key={userData.userId}>
          <h4>{userData.userName}</h4>
          <p>Peak: {userData.peakBAC.toFixed(2)}‰ at {userData.peakTime}</p>

          {/* Use with MUI X-Charts LineChart */}
          <div>
            Data points: {userData.data.length}
            {/* Example data structure:
              userData.data = [
                { time: '2025-01-15T20:00:00Z', bac: 0.0 },
                { time: '2025-01-15T20:05:00Z', bac: 0.15 },
                { time: '2025-01-15T20:10:00Z', bac: 0.32 },
                ...
              ]
            */}
          </div>
        </div>
      ))}
    </div>
  );
}

// Example 3: Combined admin view
function AdminSessionDeepDive({ sessionId }: { sessionId: string }) {
  const sessionDetail = useSessionDetail(sessionId);
  const bacChartData = useSessionBACData(sessionId);

  if (sessionDetail.loading || bacChartData.loading) {
    return <div>Loading comprehensive session data...</div>;
  }

  if (sessionDetail.error || bacChartData.error) {
    return <div>Error loading data</div>;
  }

  return (
    <div>
      <SessionDetailView sessionId={sessionId} />
      <SessionBACChart sessionId={sessionId} />
    </div>
  );
}

/**
 * KEY FEATURES:
 *
 * 1. Real-time Updates:
 *    - Automatic refetch every 5 seconds for live BAC updates
 *    - Supabase Realtime subscriptions invalidate cache on changes
 *    - Updates to sessions, participants, drinks, profiles all trigger refetch
 *
 * 2. Comprehensive Data:
 *    - Full session details with all participants
 *    - Each participant includes: profile, drink count, current BAC, peak BAC
 *    - All drinks with user information
 *    - Leaderboard sorted by current BAC
 *
 * 3. BAC Time-Series:
 *    - BAC calculated at 5-minute intervals throughout session
 *    - Includes peak BAC and when it occurred for each user
 *    - Ready for charting with MUI X-Charts
 *
 * 4. Type Safety:
 *    - All data fully typed with TypeScript
 *    - Proper error handling
 *    - Loading states managed
 *
 * 5. Query Keys:
 *    - Uses centralized queryKeys for consistency
 *    - Proper cache invalidation across all related queries
 *    - Efficient data fetching with React Query
 */
