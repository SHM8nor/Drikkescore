import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { calculateSessionAnalytics } from '../utils/analyticsCalculator';
import type { Session, DrinkEntry } from '../types/database';
import type { SessionAnalytics } from '../types/analytics';

/**
 * Hook to manage session recap display logic
 *
 * Checks if a session recap should be shown to the user based on:
 * 1. User has session_recaps_enabled in profile
 * 2. Most recent completed session where end_time is >3 hours ago
 * 3. Session hasn't been viewed yet (session.id !== profile.last_session_recap_viewed)
 *
 * @returns Object containing:
 *   - shouldShow: boolean indicating if recap should be displayed
 *   - session: Session data or null
 *   - analytics: Full analytics for the session or null
 *   - markAsViewed: Function to mark the recap as viewed
 *   - loading: Loading state
 *   - error: Error message if any
 */
export function useSessionRecap() {
  const { user, profile } = useAuth();
  const [shouldShow, setShouldShow] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [analytics, setAnalytics] = useState<SessionAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Early return if no user or profile
    if (!user || !profile) {
      setLoading(false);
      setShouldShow(false);
      setSession(null);
      setAnalytics(null);
      return;
    }

    // Early return if session recaps are disabled
    if (!profile.session_recaps_enabled) {
      setLoading(false);
      setShouldShow(false);
      setSession(null);
      setAnalytics(null);
      return;
    }

    const checkForSessionRecap = async () => {
      try {
        setLoading(true);
        setError(null);

        // Calculate the time threshold (1 minute ago for testing, change back to 3 hours later)
        const threeHoursAgo = new Date();
        threeHoursAgo.setMinutes(threeHoursAgo.getMinutes() - 1);
        const threeHoursAgoIso = threeHoursAgo.toISOString();

        // Step 1: Get all session IDs where user was a participant
        const { data: participantData, error: participantError } = await supabase
          .from('session_participants')
          .select('session_id')
          .eq('user_id', user.id);

        if (participantError) throw participantError;

        // No sessions found
        if (!participantData || participantData.length === 0) {
          setShouldShow(false);
          setSession(null);
          setAnalytics(null);
          setLoading(false);
          return;
        }

        const sessionIds = participantData.map((p) => p.session_id);

        // Step 2: Get the most recent completed session
        // Session must be:
        // - User participated in it
        // - end_time is in the past (completed)
        // - end_time was more than 3 hours ago
        // - Different from the last viewed recap
        const { data: sessionsData, error: sessionsError } = await supabase
          .from('sessions')
          .select('*')
          .in('id', sessionIds)
          .lt('end_time', new Date().toISOString()) // Completed sessions
          .lt('end_time', threeHoursAgoIso) // More than 3 hours ago
          .order('end_time', { ascending: false })
          .limit(1);

        if (sessionsError) throw sessionsError;

        // No eligible sessions found
        if (!sessionsData || sessionsData.length === 0) {
          setShouldShow(false);
          setSession(null);
          setAnalytics(null);
          setLoading(false);
          return;
        }

        const mostRecentSession = sessionsData[0] as Session;

        // Step 3: Check if this session has already been viewed
        if (profile.last_session_recap_viewed === mostRecentSession.id) {
          setShouldShow(false);
          setSession(null);
          setAnalytics(null);
          setLoading(false);
          return;
        }

        // Step 4: Fetch drink entries for this session
        const { data: drinksData, error: drinksError } = await supabase
          .from('drink_entries')
          .select('*')
          .eq('session_id', mostRecentSession.id)
          .eq('user_id', user.id)
          .order('consumed_at', { ascending: true });

        if (drinksError) throw drinksError;

        const sessionDrinks = (drinksData || []) as DrinkEntry[];

        // Step 5: Calculate full analytics for the session
        // Note: totalSpent is set to 0 as we're not fetching drink prices
        const sessionAnalytics = calculateSessionAnalytics(
          mostRecentSession,
          sessionDrinks,
          profile,
          0
        );

        // Step 6: Set state to show the recap
        setShouldShow(true);
        setSession(mostRecentSession);
        setAnalytics(sessionAnalytics);
        setLoading(false);
      } catch (err: unknown) {
        console.error('Error checking for session recap:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to check for session recap';
        setError(errorMessage);
        setShouldShow(false);
        setSession(null);
        setAnalytics(null);
        setLoading(false);
      }
    };

    checkForSessionRecap();
  }, [user, profile]);

  /**
   * Mark the current session recap as viewed
   *
   * @param viewedDetails - If true, user viewed the full details. If false, user dismissed it.
   */
  const markAsViewed = useCallback(
    async (viewedDetails: boolean) => {
      if (!user || !session) {
        console.error('Cannot mark recap as viewed: missing user or session');
        return;
      }

      try {
        const updateData: {
          last_session_recap_viewed: string;
          last_recap_dismissed_at?: string;
        } = {
          last_session_recap_viewed: session.id,
        };

        // If user dismissed without viewing details, record the dismissal time
        if (!viewedDetails) {
          updateData.last_recap_dismissed_at = new Date().toISOString();
        }

        const { error: updateError } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', user.id);

        if (updateError) {
          console.error('Error marking recap as viewed:', updateError);
          throw updateError;
        }

        // Update local state to hide the recap
        setShouldShow(false);
        setSession(null);
        setAnalytics(null);
      } catch (err: unknown) {
        console.error('Exception marking recap as viewed:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to mark recap as viewed';
        setError(errorMessage);
      }
    },
    [user, session]
  );

  return {
    shouldShow,
    session,
    analytics,
    markAsViewed,
    loading,
    error,
  };
}
