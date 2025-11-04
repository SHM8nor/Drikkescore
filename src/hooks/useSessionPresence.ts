/**
 * useSessionPresence Hook
 *
 * Custom React hook for managing user presence in a session.
 * Automatically handles heartbeat, visibility changes, and cleanup.
 *
 * Features:
 * - Automatic presence tracking
 * - Heartbeat to keep presence alive
 * - Visibility change handling (idle when tab hidden)
 * - Automatic cleanup on unmount
 * - Error callback for silent error handling
 *
 * FIX #4: Added onError callback to presence tracking
 */

import { useEffect, useRef, useCallback } from 'react';
import {
  setupPresenceTracking,
  updateSessionPresence,
  markSessionOffline,
} from '../api';
import type { SessionStatus } from '../types/database';

interface UseSessionPresenceOptions {
  sessionId: string | null;
  enabled?: boolean;
  onError?: (error: Error) => void; // FIX #4: Error callback for handling presence errors
}

interface UseSessionPresenceReturn {
  updateStatus: (status: SessionStatus) => Promise<void>;
  goOffline: () => Promise<void>;
}

/**
 * Hook for managing session presence
 * @param options - Configuration options
 */
export function useSessionPresence(
  options: UseSessionPresenceOptions
): UseSessionPresenceReturn {
  const { sessionId, enabled = true, onError } = options;

  // Ref to track cleanup function
  const cleanupRef = useRef<(() => void) | null>(null);

  // Setup presence tracking
  useEffect(() => {
    // Don't setup if disabled or no session ID
    if (!enabled || !sessionId) {
      return;
    }

    // Setup presence tracking (heartbeat + visibility + unload handling)
    // FIX #4: Pass error handler to setupPresenceTracking
    cleanupRef.current = setupPresenceTracking(sessionId, onError);

    // Cleanup on unmount or when sessionId changes
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [sessionId, enabled, onError]);

  // Manual status update
  const updateStatus = useCallback(
    async (status: SessionStatus) => {
      if (!sessionId) {
        console.warn('Cannot update status: no session ID');
        return;
      }

      try {
        await updateSessionPresence(sessionId, status);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Error updating session presence');
        console.error('Error updating session presence:', error);
        // FIX #4: Call onError callback if provided
        if (onError) {
          onError(error);
        }
        throw error;
      }
    },
    [sessionId, onError]
  );

  // Go offline manually
  const goOffline = useCallback(async () => {
    if (!sessionId) {
      console.warn('Cannot go offline: no session ID');
      return;
    }

    try {
      await markSessionOffline(sessionId);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error marking session offline');
      console.error('Error marking session offline:', error);
      // FIX #4: Call onError callback if provided
      if (onError) {
        onError(error);
      }
      throw error;
    }
  }, [sessionId, onError]);

  return {
    updateStatus,
    goOffline,
  };
}
