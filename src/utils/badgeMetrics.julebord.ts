// =============================================================================
// Christmas Badge Metrics - Julebord Extensions
// =============================================================================
// Additional metric extraction functions for Christmas-themed badges
// These functions extend badgeMetrics.ts with julebord-specific metrics
//
// INTEGRATION: Merge these functions into src/utils/badgeMetrics.ts

import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Get total number of julebord sessions user has participated in
 *
 * Strategy:
 * - Query session_participants joined with sessions table
 * - Filter by session_type = 'julebord'
 * - Count distinct sessions
 *
 * @param supabase Supabase client instance
 * @param userId User ID to query
 * @returns Total julebord session count, or 0 on error
 */
export async function getJulebordSessionCount(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  try {
    // Join session_participants with sessions to filter by session_type
    const { data: participations, error } = await supabase
      .from('session_participants')
      .select('session_id, sessions!inner(session_type)')
      .eq('user_id', userId)
      .eq('sessions.session_type', 'julebord');

    if (error) {
      console.error('[getJulebordSessionCount] Error querying sessions:', error);
      return 0;
    }

    // Count unique sessions (in case of duplicate entries)
    const uniqueSessions = new Set(participations?.map(p => p.session_id) ?? []);
    return uniqueSessions.size;
  } catch (error) {
    console.error('[getJulebordSessionCount] Unexpected error:', error);
    return 0;
  }
}

/**
 * Check if a specific session is a julebord session
 *
 * Returns 1 if session is julebord type, 0 otherwise.
 * This is used as a boolean flag in badge criteria evaluation.
 *
 * @param supabase Supabase client instance
 * @param sessionId Session ID to check
 * @returns 1 if julebord, 0 if not or error
 */
export async function getIsJulebordSession(
  supabase: SupabaseClient,
  sessionId: string
): Promise<number> {
  try {
    const { data: session, error } = await supabase
      .from('sessions')
      .select('session_type')
      .eq('id', sessionId)
      .single();

    if (error) {
      console.error('[getIsJulebordSession] Error querying session:', error);
      return 0;
    }

    return session?.session_type === 'julebord' ? 1 : 0;
  } catch (error) {
    console.error('[getIsJulebordSession] Unexpected error:', error);
    return 0;
  }
}

/**
 * Get number of julebord sessions created by user
 *
 * This tracks how many times a user has organized/created a julebord session,
 * which qualifies them for the "Julenisse" (Christmas Elf) badge.
 *
 * @param supabase Supabase client instance
 * @param userId User ID to query
 * @returns Number of julebord sessions created, or 0 on error
 */
export async function getCreatedJulebordSessionCount(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', userId)
      .eq('session_type', 'julebord');

    if (error) {
      console.error('[getCreatedJulebordSessionCount] Error querying sessions:', error);
      return 0;
    }

    return count ?? 0;
  } catch (error) {
    console.error('[getCreatedJulebordSessionCount] Unexpected error:', error);
    return 0;
  }
}

/**
 * ADMIN ONLY: Marker metric for manually awarded badges
 *
 * This metric always returns 0 for automatic badge checks.
 * It's only a placeholder to indicate the badge is admin-awarded.
 *
 * The "Pepperkake" badge uses this metric to indicate it can only
 * be awarded manually through the admin panel.
 *
 * @returns Always returns 0 (badge cannot be auto-awarded)
 */
export function getAdminAwardedFlag(): number {
  return 0; // Always 0 - this badge is never automatically awarded
}

// =============================================================================
// INTEGRATION INSTRUCTIONS
// =============================================================================
/*

TO INTEGRATE THESE METRICS:

1. Copy the four functions above into src/utils/badgeMetrics.ts

2. Update src/utils/badgeChecker.ts in the checkBadgeEligibility function:

   Add these cases to the switch statement (around line 197):

   ```typescript
   case 'julebord_session_count':
     value = await getJulebordSessionCount(supabase, userId);
     break;

   case 'is_julebord_session':
     if (sessionId) {
       value = await getIsJulebordSession(supabase, sessionId);
     } else {
       console.warn('[checkBadgeEligibility] is_julebord_session requires sessionId');
     }
     break;

   case 'created_julebord_session':
     value = await getCreatedJulebordSessionCount(supabase, userId);
     break;

   case 'admin_awarded':
     value = getAdminAwardedFlag();
     break;
   ```

3. Update src/hooks/useBadgeAwarding.ts to handle 'special' category:

   Change lines 56-70 to include 'special' category:

   ```typescript
   if (context === 'drink_added') {
     automaticBadges = automaticBadges.filter(
       badge => badge.category === 'milestone' ||
                badge.category === 'global' ||
                badge.category === 'special'
     );
   } else if (context === 'session_ended') {
     automaticBadges = automaticBadges.filter(
       badge => badge.category === 'session' ||
                badge.category === 'social' ||
                badge.category === 'special'
     );
   }
   ```

4. Add session creation trigger for "Julenisse" badge:

   In the session creation logic (find where sessions are created):

   ```typescript
   // After session is successfully created
   if (newSession.session_type === 'julebord') {
     // Award "Julenisse" badge to creator
     const { checkAndAward } = useCheckAndAwardBadges();
     await checkAndAward('session_ended', newSession.id);
   }
   ```

5. Implement "Julestjerne" award logic:

   Add this function and call it when a julebord session ends:

   ```typescript
   async function awardJulestjerneBadge(sessionId: string) {
     // Verify this is a julebord session
     const { data: session } = await supabase
       .from('sessions')
       .select('session_type')
       .eq('id', sessionId)
       .single();

     if (session?.session_type !== 'julebord') {
       return;
     }

     // Get all participants and their max BAC
     const { data: drinks } = await supabase
       .from('drink_entries')
       .select('user_id, volume_ml, alcohol_percentage, consumed_at, profiles!inner(*)')
       .eq('session_id', sessionId);

     if (!drinks || drinks.length === 0) {
       return;
     }

     // Calculate max BAC for each user
     const userBACMap = new Map<string, number>();

     // Group drinks by user
     const drinksByUser = drinks.reduce((acc, drink) => {
       if (!acc[drink.user_id]) {
         acc[drink.user_id] = [];
       }
       acc[drink.user_id].push(drink);
       return acc;
     }, {} as Record<string, any[]>);

     // Calculate max BAC for each user
     for (const [userId, userDrinks] of Object.entries(drinksByUser)) {
       const profile = userDrinks[0].profiles;
       const maxBAC = await getMaxBACInSession(supabase, sessionId, userId, profile);
       userBACMap.set(userId, maxBAC);
     }

     // Find user with highest BAC
     let highestBAC = 0;
     let winnerUserId: string | null = null;

     for (const [userId, bac] of userBACMap.entries()) {
       if (bac > highestBAC) {
         highestBAC = bac;
         winnerUserId = userId;
       }
     }

     // Award badge if winner has BAC >= 0.5
     if (winnerUserId && highestBAC >= 0.5) {
       await supabase.rpc('award_badge', {
         p_user_id: winnerUserId,
         p_badge_code: 'julestjerne',
         p_session_id: sessionId,
         p_metadata: {
           bac: highestBAC,
           awarded_at: new Date().toISOString(),
           reason: 'Highest BAC in julebord session'
         }
       });
     }
   }
   ```

*/
