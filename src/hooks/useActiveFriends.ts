/**
 * useActiveFriends Hook
 *
 * Custom React hook for tracking active friends' sessions.
 * Provides real-time updates of which friends are currently in sessions.
 *
 * Features:
 * - Automatic data loading
 * - Real-time presence updates
 * - Loading and error states
 * - Filtered views (active/idle/all)
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getActiveFriendsSessions,
  subscribeActiveFriendsSessions,
} from '../api';
import type { ActiveFriendSession } from '../types/database';

interface UseActiveFriendsOptions {
  autoLoad?: boolean;
  enableRealtime?: boolean;
  refreshInterval?: number; // Auto-refresh interval in ms (0 = disabled)
}

interface UseActiveFriendsReturn {
  // Data
  activeFriends: ActiveFriendSession[];
  activeFriendsCount: number;

  // Filtered data
  activeOnly: ActiveFriendSession[];
  idleOnly: ActiveFriendSession[];

  // State
  loading: boolean;
  error: string | null;

  // Actions
  refresh: () => Promise<void>;
  clearError: () => void;
}

/**
 * Hook for tracking active friends' sessions
 * @param options - Configuration options
 */
export function useActiveFriends(
  options: UseActiveFriendsOptions = {}
): UseActiveFriendsReturn {
  const {
    autoLoad = true,
    enableRealtime = true,
    refreshInterval = 0,
  } = options;

  // Data state
  const [activeFriends, setActiveFriends] = useState<ActiveFriendSession[]>([]);

  // UI state
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState<string | null>(null);

  // Load active friends data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getActiveFriendsSessions();
      setActiveFriends(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Kunne ikke laste aktive venner';
      setError(message);
      console.error('Error loading active friends:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (autoLoad) {
      loadData();
    }
  }, [autoLoad, loadData]);

  // Real-time subscriptions
  useEffect(() => {
    if (!enableRealtime) return;

    let unsubscribeFn: (() => void) | null = null;

    // Handle async subscription properly
    subscribeActiveFriendsSessions(() => {
      // Reload data when active sessions change
      loadData();
    }).then((unsubscribe) => {
      // Store cleanup function
      unsubscribeFn = unsubscribe;
    }).catch((err) => {
      console.error('Error setting up active friends subscription:', err);
    });

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribeFn) {
        unsubscribeFn();
      }
    };
  }, [enableRealtime, loadData]);

  // Auto-refresh interval
  useEffect(() => {
    if (!refreshInterval || refreshInterval <= 0) return;

    const intervalId = setInterval(loadData, refreshInterval);

    return () => clearInterval(intervalId);
  }, [refreshInterval, loadData]);

  // Filter to only active friends
  const activeOnly = useMemo(() => {
    return activeFriends.filter((friend) => friend.status === 'active');
  }, [activeFriends]);

  // Filter to only idle friends
  const idleOnly = useMemo(() => {
    return activeFriends.filter((friend) => friend.status === 'idle');
  }, [activeFriends]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Data
    activeFriends,
    activeFriendsCount: activeFriends.length,

    // Filtered data
    activeOnly,
    idleOnly,

    // State
    loading,
    error,

    // Actions
    refresh: loadData,
    clearError,
  };
}
