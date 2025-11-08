import { useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useActiveBadges, useAwardBadge } from './useBadges';
import { supabase } from '../lib/supabase';
import { checkMultipleBadges, filterEligibleBadges } from '../utils/badgeChecker';

/**
 * Orchestration hook for checking and awarding badges automatically.
 *
 * Features:
 * - Batch checks all active automatic badges
 * - Awards eligible badges silently
 * - Non-blocking execution (doesn't throw)
 * - Returns statistics for optional UI feedback
 *
 * @example
 * const { checkAndAward, isReady } = useCheckAndAwardBadges();
 *
 * // After adding a drink
 * const result = await checkAndAward('drink_added', sessionId);
 * if (result.awarded > 0) {
 *   showToast(`Du har låst opp ${result.awarded} nye badges!`);
 * }
 */
export function useCheckAndAwardBadges() {
  const { user, profile } = useAuth();
  const { data: activeBadges } = useActiveBadges();
  const awardBadgeMutation = useAwardBadge();

  const checkAndAward = useCallback(async (
    context: 'drink_added' | 'session_ended',
    sessionId?: string
  ): Promise<{ awarded: number; skipped: number; errors: number }> => {
    console.debug('[BadgeAwarding] Starting badge check', { context, sessionId, userId: user?.id });

    // Guard clauses
    if (!user?.id) {
      console.debug('[BadgeAwarding] No user, skipping badge check');
      return { awarded: 0, skipped: 0, errors: 0 };
    }

    if (!profile) {
      console.debug('[BadgeAwarding] No profile, skipping badge check');
      return { awarded: 0, skipped: 0, errors: 0 };
    }

    if (!activeBadges || activeBadges.length === 0) {
      console.debug('[BadgeAwarding] No active badges, skipping badge check');
      return { awarded: 0, skipped: 0, errors: 0 };
    }

    // Filter to automatic badges only
    let automaticBadges = activeBadges.filter(badge => badge.is_automatic);

    // Filter badges by category based on context
    if (context === 'drink_added') {
      // On drink_added: Only check milestone and global badges
      // These are achievement-based and can be earned mid-session
      automaticBadges = automaticBadges.filter(
        badge => badge.category === 'milestone' || badge.category === 'global'
      );
      console.debug('[BadgeAwarding] Context: drink_added - checking milestone/global badges only');
    } else if (context === 'session_ended') {
      // On session_ended: Only check session and social badges
      // These require the full session to be complete for accurate evaluation
      automaticBadges = automaticBadges.filter(
        badge => badge.category === 'session' || badge.category === 'social'
      );
      console.debug('[BadgeAwarding] Context: session_ended - checking session/social badges only');
    }

    if (automaticBadges.length === 0) {
      console.debug('[BadgeAwarding] No badges to check for context:', context);
      return { awarded: 0, skipped: 0, errors: 0 };
    }

    console.debug('[BadgeAwarding] Checking', automaticBadges.length, 'automatic badges for', context);

    try {
      // Batch check eligibility for all automatic badges
      const eligibilityResults = await checkMultipleBadges(
        supabase,
        automaticBadges,
        user.id,
        profile,
        sessionId
      );

      // Filter to only eligible badges
      const eligibleBadges = filterEligibleBadges(eligibilityResults);

      console.debug('[BadgeAwarding] Found', eligibleBadges.length, 'eligible badges');

      if (eligibleBadges.length === 0) {
        return { awarded: 0, skipped: 0, errors: 0 };
      }

      // Award each eligible badge
      let awarded = 0;
      let skipped = 0;
      let errors = 0;

      for (const badgeResult of eligibleBadges) {
        const badge = badgeResult.badge;
        try {
          console.debug('[BadgeAwarding] Attempting to award badge:', badge.title);

          await awardBadgeMutation.mutateAsync({
            badge_id: badge.id,
            user_id: user.id,
            session_id: sessionId
          });

          awarded++;
          console.debug('[BadgeAwarding] Successfully awarded:', badge.title);
        } catch (error) {
          // Check if this is a duplicate error (user already has this badge)
          const errorMessage = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
          const isDuplicate = errorMessage.includes('already') ||
                            errorMessage.includes('duplicate') ||
                            errorMessage.includes('unique');

          if (isDuplicate) {
            console.debug('[BadgeAwarding] Badge already awarded, skipping:', badge.title);
            skipped++;
          } else {
            console.error('[BadgeAwarding] Failed to award badge:', badge.title, error);
            errors++;
          }
        }
      }

      console.debug('[BadgeAwarding] Completed:', { awarded, skipped, errors });
      return { awarded, skipped, errors };

    } catch (error) {
      // Batch check failed - log but don't throw
      console.error('[BadgeAwarding] Batch eligibility check failed:', error);
      return { awarded: 0, skipped: 0, errors: 1 };
    }
  }, [user, profile, activeBadges, awardBadgeMutation]);

  return {
    /**
     * Check and award all eligible badges for the given context.
     *
     * @param context - The trigger context: 'drink_added' or 'session_ended'
     * @param sessionId - Optional session ID for session-specific checks
     * @returns Statistics about awards: { awarded, skipped, errors }
     */
    checkAndAward,

    /**
     * Whether the hook is ready to check badges.
     * False if user, profile, or badges are not loaded.
     */
    isReady: !!(user && profile && activeBadges)
  };
}
