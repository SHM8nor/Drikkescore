/**
 * Example usage of AlcoholConsumptionChart component
 *
 * This file demonstrates how to use the AlcoholConsumptionChart component
 * in your application.
 */

import { useState } from 'react';
import AlcoholConsumptionChart from './AlcoholConsumptionChart';
import type { Profile, DrinkEntry } from '../../types/database';

// Example component showing usage
export default function AlcoholConsumptionChartExample() {
  const [view, setView] = useState<'per-participant' | 'session-total'>('per-participant');
  const [unit, setUnit] = useState<'grams' | 'beers'>('beers');

  // Example participants data
  const participants: Profile[] = [
    {
      id: '1',
      full_name: 'John Doe',
      weight_kg: 80,
      height_cm: 180,
      gender: 'male',
      age: 25,
      role: 'user',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    },
    {
      id: '2',
      full_name: 'Jane Smith',
      weight_kg: 65,
      height_cm: 165,
      gender: 'female',
      age: 23,
      role: 'user',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    },
    {
      id: '3',
      full_name: 'Bob Johnson',
      weight_kg: 90,
      height_cm: 185,
      gender: 'male',
      age: 28,
      role: 'user',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    },
  ];

  // Example drinks data
  const drinks: DrinkEntry[] = [
    {
      id: '1',
      session_id: 'session-1',
      user_id: '1',
      volume_ml: 500,
      alcohol_percentage: 5,
      consumed_at: '2025-01-01T20:00:00Z',
      created_at: '2025-01-01T20:00:00Z',
    },
    {
      id: '2',
      session_id: 'session-1',
      user_id: '1',
      volume_ml: 500,
      alcohol_percentage: 5,
      consumed_at: '2025-01-01T21:00:00Z',
      created_at: '2025-01-01T21:00:00Z',
    },
    {
      id: '3',
      session_id: 'session-1',
      user_id: '2',
      volume_ml: 330,
      alcohol_percentage: 5,
      consumed_at: '2025-01-01T20:30:00Z',
      created_at: '2025-01-01T20:30:00Z',
    },
    {
      id: '4',
      session_id: 'session-1',
      user_id: '3',
      volume_ml: 500,
      alcohol_percentage: 5,
      consumed_at: '2025-01-01T20:15:00Z',
      created_at: '2025-01-01T20:15:00Z',
    },
    {
      id: '5',
      session_id: 'session-1',
      user_id: '3',
      volume_ml: 500,
      alcohol_percentage: 5,
      consumed_at: '2025-01-01T21:15:00Z',
      created_at: '2025-01-01T21:15:00Z',
    },
    {
      id: '6',
      session_id: 'session-1',
      user_id: '3',
      volume_ml: 330,
      alcohol_percentage: 5,
      consumed_at: '2025-01-01T22:00:00Z',
      created_at: '2025-01-01T22:00:00Z',
    },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <h1>Alcohol Consumption Chart Example</h1>

      {/* Controls */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '20px' }}>
        <div>
          <label style={{ marginRight: '10px' }}>View:</label>
          <select
            value={view}
            onChange={(e) => setView(e.target.value as 'per-participant' | 'session-total')}
          >
            <option value="per-participant">Per Participant</option>
            <option value="session-total">Session Total</option>
          </select>
        </div>

        <div>
          <label style={{ marginRight: '10px' }}>Unit:</label>
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value as 'grams' | 'beers')}
          >
            <option value="beers">Beer Units</option>
            <option value="grams">Grams</option>
          </select>
        </div>
      </div>

      {/* Chart */}
      <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '20px' }}>
        <AlcoholConsumptionChart
          participants={participants}
          drinks={drinks}
          view={view}
          unit={unit}
        />
      </div>

      {/* Info */}
      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <p><strong>Note:</strong> 1 beer unit = 13.035g of pure alcohol (330ml @ 5% ABV)</p>
        <p>
          In this example:
          <br />- John has consumed 2 drinks (1000ml total)
          <br />- Jane has consumed 1 drink (330ml)
          <br />- Bob has consumed 3 drinks (1330ml total)
        </p>
      </div>
    </div>
  );
}

/**
 * Integration Example with useSession hook
 *
 * This shows how to use the chart with real session data from the useSession hook
 */
export function AlcoholConsumptionChartWithSession({ sessionId: _sessionId }: { sessionId: string }) {
  const [view, setView] = useState<'per-participant' | 'session-total'>('per-participant');
  const [unit, setUnit] = useState<'grams' | 'beers'>('beers');

  // Uncomment when integrating with actual session:
  // const { participants, drinks, loading } = useSession(_sessionId);
  //
  // if (loading) {
  //   return <div>Loading...</div>;
  // }

  return (
    <div>
      <div style={{ marginBottom: '16px', display: 'flex', gap: '12px' }}>
        <button
          onClick={() => setView('per-participant')}
          style={{
            padding: '8px 16px',
            backgroundColor: view === 'per-participant' ? '#1976d2' : '#e0e0e0',
            color: view === 'per-participant' ? 'white' : 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Per Participant
        </button>
        <button
          onClick={() => setView('session-total')}
          style={{
            padding: '8px 16px',
            backgroundColor: view === 'session-total' ? '#1976d2' : '#e0e0e0',
            color: view === 'session-total' ? 'white' : 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Session Total
        </button>
        <button
          onClick={() => setUnit(unit === 'beers' ? 'grams' : 'beers')}
          style={{
            padding: '8px 16px',
            backgroundColor: '#4caf50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Toggle Unit ({unit === 'beers' ? 'Show Grams' : 'Show Beer Units'})
        </button>
      </div>

      {/* Uncomment when integrating: */}
      {/* <AlcoholConsumptionChart
        participants={participants}
        drinks={drinks}
        view={view}
        unit={unit}
      /> */}
    </div>
  );
}
