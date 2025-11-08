/**
 * BadgeNotificationManager Component
 *
 * Manages and displays celebratory notifications for newly earned badges.
 * Listens to real-time Supabase updates and shows notifications when badges are awarded.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Box } from '@mui/material';
import { BadgeNotification } from './BadgeNotification';
import { useSupabaseBadgeSubscription } from '../../hooks/useSupabaseBadgeSubscription';
import { useRecentBadges } from '../../hooks/useBadges';
import type { Badge } from '../../types/badges';

interface NotificationItem {
  id: string;
  badge: Badge;
  earnedAt: string;
  timestamp: number;
}

interface BadgeNotificationManagerProps {
  userId: string;
  onBadgeClick?: (badge: Badge) => void;
  maxStackedNotifications?: number;
  enabled?: boolean;
}

export function BadgeNotificationManager({
  userId,
  onBadgeClick,
  maxStackedNotifications = 3,
  enabled = true,
}: BadgeNotificationManagerProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const previousBadgeIdsRef = useRef<Set<string>>(new Set());
  const [isInitialized, setIsInitialized] = useState(false);

  // Subscribe to real-time badge changes
  useSupabaseBadgeSubscription(userId, enabled);

  // Fetch recent badges to detect new ones
  const { data: recentBadges } = useRecentBadges(userId, 10, enabled);

  // Debug logging
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[BadgeNotificationManager] State:', {
        userId,
        recentBadgesCount: recentBadges?.length ?? 0,
        recentBadges: recentBadges?.map((ub) => ({
          id: ub.id,
          badge: ub.badge.title,
          earnedAt: ub.earned_at,
        })),
        isInitialized,
        previousBadgeIds: Array.from(previousBadgeIdsRef.current),
        notificationsCount: notifications.length,
      });
    }
  }, [userId, recentBadges, isInitialized, notifications]);

  // Initialize previous badges without showing notifications
  useEffect(() => {
    if (!isInitialized && recentBadges) {
      console.log('[BadgeNotificationManager] Initializing...');
      // Store existing badge IDs without showing notifications
      const existingIds = new Set(recentBadges.map((ub) => ub.id));
      previousBadgeIdsRef.current = existingIds;
      setIsInitialized(true);
      console.log('[BadgeNotificationManager] Initialized with existing badges:', Array.from(existingIds));
    }
  }, [recentBadges, isInitialized]);

  // Detect new badges and show notifications
  useEffect(() => {
    if (!isInitialized || !recentBadges) {
      console.log('[BadgeNotificationManager] Skipping check - not initialized or no badges');
      return;
    }

    // Check for new badges
    const newBadges = recentBadges.filter((ub) => !previousBadgeIdsRef.current.has(ub.id));

    console.log('[BadgeNotificationManager] Checking for new badges:', {
      newBadgesCount: newBadges.length,
      newBadges: newBadges.map((ub) => ({
        id: ub.id,
        badge: ub.badge.title,
        earnedAt: ub.earned_at,
      })),
    });

    if (newBadges.length > 0) {
      console.log('[BadgeNotificationManager] Adding new badge notifications!');

      // Sort by earned_at (newest first) and take only the most recent ones
      const sortedNewBadges = [...newBadges].sort(
        (a, b) => new Date(b.earned_at).getTime() - new Date(a.earned_at).getTime()
      );

      // Create notifications for new badges
      const newNotifications: NotificationItem[] = sortedNewBadges.map((ub) => ({
        id: ub.id,
        badge: ub.badge,
        earnedAt: ub.earned_at,
        timestamp: Date.now(),
      }));

      // Add to notification queue
      setNotifications((prev) => {
        // Combine and limit to maxStackedNotifications
        const combined = [...newNotifications, ...prev];
        return combined.slice(0, maxStackedNotifications);
      });

      // Optional: Play notification sound
      // playBadgeNotificationSound();
    }

    // Update previous badges
    previousBadgeIdsRef.current = new Set(recentBadges.map((ub) => ub.id));
  }, [recentBadges, isInitialized, maxStackedNotifications]);

  const handleDismiss = useCallback((notificationId: string) => {
    console.log('[BadgeNotificationManager] Dismissing notification:', notificationId);
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  }, []);

  const handleBadgeClick = useCallback(
    (badge: Badge) => {
      console.log('[BadgeNotificationManager] Badge clicked:', badge.title);
      if (onBadgeClick) {
        onBadgeClick(badge);
      }
    },
    [onBadgeClick]
  );

  // Show notifications stacked vertically
  // Most recent notification is shown at the top
  return (
    <Box>
      {notifications.map((notification, index) => (
        <Box
          key={notification.id}
          sx={{
            position: 'fixed',
            top: 80 + index * 20, // Stack with slight offset
            right: { xs: 16, sm: 24 },
            left: { xs: 16, sm: 'auto' },
            zIndex: 1400 - index, // Higher z-index for top notification
            transition: 'top 0.3s ease',
          }}
        >
          <BadgeNotification
            badge={notification.badge}
            earnedAt={notification.earnedAt}
            onDismiss={() => handleDismiss(notification.id)}
            onClick={onBadgeClick ? () => handleBadgeClick(notification.badge) : undefined}
            autoHideDelay={5000 + index * 1000} // Stagger auto-hide timers
          />
        </Box>
      ))}
    </Box>
  );
}
