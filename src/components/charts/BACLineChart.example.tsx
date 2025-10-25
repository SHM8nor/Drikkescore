/**
 * Example usage of BACLineChart component
 *
 * This file demonstrates how to integrate BACLineChart into a React component,
 * such as the SessionPage.
 */

import { useState } from 'react';
import BACLineChart from './BACLineChart';
import { useSession } from '../../hooks/useSession';
import { useAuth } from '../../context/AuthContext';

export function BACLineChartExample() {
  const { user } = useAuth();
  const sessionId = 'your-session-id'; // Get from URL params or context

  const {
    session,
    drinks,
    participants,
  } = useSession(sessionId);

  const [view, setView] = useState<'all' | 'self'>('all');

  if (!session || !user) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <button
          onClick={() => setView('all')}
          style={{
            marginRight: '8px',
            fontWeight: view === 'all' ? 'bold' : 'normal'
          }}
        >
          Show All
        </button>
        <button
          onClick={() => setView('self')}
          style={{
            fontWeight: view === 'self' ? 'bold' : 'normal'
          }}
        >
          Show My BAC
        </button>
      </div>

      <BACLineChart
        participants={participants}
        drinks={drinks}
        sessionStartTime={new Date(session.start_time)}
        sessionEndTime={new Date(session.end_time)}
        currentUserId={user.id}
        view={view}
      />
    </div>
  );
}

/**
 * Integration example for SessionPage.tsx
 *
 * Add this to your SessionPage.tsx after the leaderboard section:
 *
 * ```tsx
 * import BACLineChart from '../components/charts/BACLineChart';
 *
 * // Inside the component, add state for view toggle
 * const [chartView, setChartView] = useState<'all' | 'self'>('all');
 *
 * // Inside the return JSX, add after the leaderboard-card:
 * <div className="bac-chart-card">
 *   <h2>BAC Evolution</h2>
 *   <div className="chart-controls">
 *     <button
 *       onClick={() => setChartView('all')}
 *       className={chartView === 'all' ? 'active' : ''}
 *     >
 *       All Participants
 *     </button>
 *     <button
 *       onClick={() => setChartView('self')}
 *       className={chartView === 'self' ? 'active' : ''}
 *     >
 *       My BAC Only
 *     </button>
 *   </div>
 *
 *   {session && user && (
 *     <BACLineChart
 *       participants={participants}
 *       drinks={drinks}
 *       sessionStartTime={new Date(session.start_time)}
 *       sessionEndTime={new Date(session.end_time)}
 *       currentUserId={user.id}
 *       view={chartView}
 *     />
 *   )}
 * </div>
 * ```
 *
 * Add corresponding CSS to your session page styles:
 *
 * ```css
 * .bac-chart-card {
 *   background: white;
 *   padding: 20px;
 *   border-radius: 8px;
 *   box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
 * }
 *
 * .chart-controls {
 *   display: flex;
 *   gap: 10px;
 *   margin-bottom: 16px;
 * }
 *
 * .chart-controls button {
 *   padding: 8px 16px;
 *   border: 1px solid #ddd;
 *   background: white;
 *   border-radius: 4px;
 *   cursor: pointer;
 * }
 *
 * .chart-controls button.active {
 *   background: var(--primary-color);
 *   color: white;
 *   border-color: var(--primary-color);
 * }
 * ```
 */
