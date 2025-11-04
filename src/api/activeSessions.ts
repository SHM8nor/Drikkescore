/**
 * Active Sessions API
 *
 * Handles tracking user presence in sessions for real-time friend activity:
 * - Updating session presence
 * - Getting active friends' sessions
 * - Tracking online/offline status
 * - Real-time presence updates
 *
 * FIXES APPLIED:
 * - FIX #7: Removed unreliable beforeunload handler, rely on TTL timeout
 */

import { supabase } from '../lib/supabase';
import type {
  ActiveSession,
  ActiveFriendSession,
  SessionActiveUser,
  SessionStatus,
} from '../types/database';

// =============================================================================
// Error Handling
// =============================================================================

export class ActiveSessionError extends Error {
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = 'ActiveSessionError';
    this.code = code;
  }
}

// =============================================================================
// Session Presence Management
// =============================================================================

/**
 * Update or create user's presence in a session
 * @param sessionId - The session ID
 * @param status - The user's status (active, idle, offline)
 * @returns The active session record ID
 * @throws {ActiveSessionError} If the update fails
 */
export async function updateSessionPresence(
  sessionId: string,
  status: SessionStatus = 'active'
): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new ActiveSessionError('Du må være logget inn');
  }

  const { data, error } = await supabase.rpc('upsert_session_presence', {
    p_user_id: user.id,
    p_session_id: sessionId,
    p_status: status,
  });

  if (error) {
    console.error('Error updating session presence:', error);
    throw new ActiveSessionError('Kunne ikke oppdatere sesjonsstatus');
  }

  return data;
}

/**
 * Mark user as offline in a specific session
 * @param sessionId - The session ID
 * @throws {ActiveSessionError} If the update fails
 */
export async function markSessionOffline(sessionId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new ActiveSessionError('Du må være logget inn');
  }

  const { error } = await supabase.rpc('mark_session_offline', {
    p_user_id: user.id,
    p_session_id: sessionId,
  });

  if (error) {
    console.error('Error marking session offline:', error);
    throw new ActiveSessionError('Kunne ikke markere som offline');
  }
}

/**
 * Mark user as offline in all sessions
 * @throws {ActiveSessionError} If the update fails
 */
export async function markAllSessionsOffline(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new ActiveSessionError('Du må være logget inn');
  }

  const { error } = await supabase
    .from('active_sessions')
    .update({ status: 'offline' as SessionStatus })
    .eq('user_id', user.id);

  if (error) {
    console.error('Error marking all sessions offline:', error);
    throw new ActiveSessionError('Kunne ikke oppdatere sesjonsstatus');
  }
}

// =============================================================================
// Active Friends Sessions
// =============================================================================

/**
 * Get all active sessions that the user's friends are in
 * @returns Array of active friend sessions
 * @throws {ActiveSessionError} If the request fails
 */
export async function getActiveFriendsSessions(): Promise<ActiveFriendSession[]> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new ActiveSessionError('Du må være logget inn');
  }

  const { data, error } = await supabase.rpc('get_active_friends_sessions', {
    p_user_id: user.id,
  });

  if (error) {
    console.error('Error fetching active friends sessions:', error);
    throw new ActiveSessionError('Kunne ikke hente venners sesjoner');
  }

  return data || [];
}

/**
 * Get all active users in a specific session
 * @param sessionId - The session ID
 * @returns Array of active users in the session
 * @throws {ActiveSessionError} If the request fails
 */
export async function getSessionActiveUsers(sessionId: string): Promise<SessionActiveUser[]> {
  const { data, error } = await supabase.rpc('get_session_active_users', {
    p_session_id: sessionId,
  });

  if (error) {
    console.error('Error fetching session active users:', error);
    throw new ActiveSessionError('Kunne ikke hente aktive brukere');
  }

  return data || [];
}

/**
 * Get current user's active session
 * @param sessionId - Optional session ID to check
 * @returns The active session record or null
 */
export async function getCurrentActiveSession(sessionId?: string): Promise<ActiveSession | null> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  let query = supabase
    .from('active_sessions')
    .select('*')
    .eq('user_id', user.id)
    .in('status', ['active', 'idle']);

  if (sessionId) {
    query = query.eq('session_id', sessionId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error('Error fetching current active session:', error);
    return null;
  }

  return data;
}

// =============================================================================
// Presence Heartbeat
// =============================================================================

/**
 * Start a presence heartbeat to keep the user marked as active
 * @param sessionId - The session ID
 * @param intervalMs - Heartbeat interval in milliseconds (default: 30 seconds)
 * @param onError - Optional error callback for handling errors
 * @returns Stop function to clear the interval
 */
export function startPresenceHeartbeat(
  sessionId: string,
  intervalMs: number = 30000,
  onError?: (error: Error) => void
): () => void {
  // Initial presence update
  updateSessionPresence(sessionId, 'active').catch((err) => {
    console.error('Initial presence update failed:', err);
    if (onError) onError(err);
  });

  // Set up heartbeat interval
  const intervalId = setInterval(() => {
    updateSessionPresence(sessionId, 'active').catch((err) => {
      console.error('Heartbeat presence update failed:', err);
      if (onError) onError(err);
    });
  }, intervalMs);

  // Return cleanup function
  return () => {
    clearInterval(intervalId);
    markSessionOffline(sessionId).catch((err) => {
      console.error('Cleanup presence update failed:', err);
      if (onError) onError(err);
    });
  };
}

/**
 * Handle page visibility changes to update presence
 * @param sessionId - The session ID
 * @param onError - Optional error callback for handling errors
 * @returns Cleanup function to remove event listeners
 */
export function handleVisibilityChange(
  sessionId: string,
  onError?: (error: Error) => void
): () => void {
  const handleVisibility = () => {
    if (document.hidden) {
      updateSessionPresence(sessionId, 'idle').catch((err) => {
        console.error('Visibility change to idle failed:', err);
        if (onError) onError(err);
      });
    } else {
      updateSessionPresence(sessionId, 'active').catch((err) => {
        console.error('Visibility change to active failed:', err);
        if (onError) onError(err);
      });
    }
  };

  document.addEventListener('visibilitychange', handleVisibility);

  return () => {
    document.removeEventListener('visibilitychange', handleVisibility);
  };
}

/**
 * Setup complete presence tracking for a session
 * Combines heartbeat and visibility tracking
 *
 * FIX #7: Removed unreliable beforeunload handler
 * NOTE: We now rely on database TTL timeout to automatically mark users as offline
 * after 2 minutes of inactivity. The heartbeat keeps users active as long as the
 * page is open and not in the background. This is more reliable than beforeunload
 * which doesn't work reliably in mobile browsers or when tabs are force-closed.
 *
 * @param sessionId - The session ID
 * @param onError - Optional error callback for handling errors
 * @returns Cleanup function to stop all tracking
 */
export function setupPresenceTracking(
  sessionId: string,
  onError?: (error: Error) => void
): () => void {
  const stopHeartbeat = startPresenceHeartbeat(sessionId, 30000, onError);
  const stopVisibility = handleVisibilityChange(sessionId, onError);

  // FIX #7: Removed beforeunload handler - unreliable in modern browsers
  // Instead, we rely on the database TTL timeout (2 minutes) to automatically
  // mark users as offline if they close the tab or lose connection.
  // The RPC function 'upsert_session_presence' sets last_active_at timestamp,
  // and the database triggers will mark users as offline after 2 minutes.

  return () => {
    stopHeartbeat();
    stopVisibility();
    // Best-effort cleanup on component unmount (this will work for normal navigation)
    markSessionOffline(sessionId).catch((err) => {
      console.error('Final cleanup presence update failed:', err);
      if (onError) onError(err);
    });
  };
}

// =============================================================================
// Real-time Subscriptions
// =============================================================================

/**
 * Subscribe to active session changes for friends
 * @param callback - Function to call when active sessions change
 * @returns Promise that resolves to an unsubscribe function
 */
export async function subscribeActiveFriendsSessions(
  callback: (payload: { eventType: string; new: ActiveSession; old: ActiveSession }) => void
): Promise<() => void> {
  const subscription = supabase
    .channel('active_sessions')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'active_sessions',
      },
      (payload) => {
        callback({
          eventType: payload.eventType,
          new: payload.new as ActiveSession,
          old: payload.old as ActiveSession,
        });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
}

/**
 * Subscribe to active users in a specific session
 * @param sessionId - The session ID to monitor
 * @param callback - Function to call when active users change
 * @returns Unsubscribe function
 */
export function subscribeSessionActiveUsers(
  sessionId: string,
  callback: (payload: { eventType: string; new: ActiveSession; old: ActiveSession }) => void
) {
  const subscription = supabase
    .channel(`active_sessions:${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'active_sessions',
        filter: `session_id=eq.${sessionId}`,
      },
      (payload) => {
        callback({
          eventType: payload.eventType,
          new: payload.new as ActiveSession,
          old: payload.old as ActiveSession,
        });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
}

// =============================================================================
// Cleanup Utilities
// =============================================================================

/**
 * Manually trigger cleanup of stale sessions
 * This is typically done automatically by the database, but can be triggered manually
 */
export async function cleanupStaleSessions(): Promise<void> {
  const { error } = await supabase.rpc('cleanup_stale_sessions');

  if (error) {
    console.error('Error cleaning up stale sessions:', error);
    throw new ActiveSessionError('Kunne ikke rydde opp i gamle sesjoner');
  }
}
