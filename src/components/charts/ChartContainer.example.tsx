/**
 * Example usage of ChartContainer component
 *
 * This file demonstrates how to use the ChartContainer component
 * with different configurations.
 */

import ChartContainer from './ChartContainer';

// Example 1: Basic usage without controls
export function BasicChartExample() {
  return (
    <ChartContainer title="BAC Over Time">
      <div style={{ width: '100%', height: '300px' }}>
        {/* Your chart component goes here */}
        <p>Chart placeholder</p>
      </div>
    </ChartContainer>
  );
}

// Example 2: With toggle controls
export function ChartWithControlsExample() {
  return (
    <ChartContainer
      title="Consumption Analysis"
      controls={
        <>
          <button className="btn-secondary">Daily</button>
          <button className="btn-secondary">Weekly</button>
          <button className="btn-secondary">Monthly</button>
        </>
      }
    >
      <div style={{ width: '100%', height: '300px' }}>
        {/* Your chart component goes here */}
        <p>Chart with controls placeholder</p>
      </div>
    </ChartContainer>
  );
}

// Example 3: With custom controls (toggle buttons)
export function ChartWithToggleExample() {
  return (
    <ChartContainer
      title="Leaderboard Stats"
      controls={
        <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
          <button
            className="btn-secondary"
            style={{ padding: 'var(--spacing-xs) var(--spacing-sm)', fontSize: 'var(--font-size-small)' }}
          >
            BAC
          </button>
          <button
            className="btn-secondary"
            style={{ padding: 'var(--spacing-xs) var(--spacing-sm)', fontSize: 'var(--font-size-small)' }}
          >
            Drinks
          </button>
        </div>
      }
    >
      <div style={{ width: '100%', height: '300px' }}>
        {/* Your chart component goes here */}
        <p>Chart with toggle controls placeholder</p>
      </div>
    </ChartContainer>
  );
}
