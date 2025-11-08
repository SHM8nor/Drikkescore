/**
 * FriendRequestNotificationManager Component
 *
 * Manages and displays game-style notifications for incoming friend requests.
 * Listens to real-time updates and shows notifications when new requests arrive.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Box } from '@mui/material';
import { FriendRequestNotification } from './FriendRequestNotification';
import { useFriends } from '../../hooks/useFriends';
import type { FriendRequest } from '../../types/database';

interface NotificationItem {
  id: string;
  request: FriendRequest;
  timestamp: number;
}

export function FriendRequestNotificationManager() {
  const { pendingRequests, acceptRequest, declineRequest } = useFriends(true, true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const previousRequestsRef = useRef<Set<string>>(new Set());
  const [isInitialized, setIsInitialized] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log('[FriendRequestNotificationManager] State:', {
      pendingRequestsCount: pendingRequests.length,
      pendingRequests: pendingRequests.map(r => ({ id: r.friendship_id, name: r.display_name })),
      isInitialized,
      previousRequests: Array.from(previousRequestsRef.current),
      notificationsCount: notifications.length,
    });
  }, [pendingRequests, isInitialized, notifications]);

  // Initialize previous requests without showing notifications
  useEffect(() => {
    if (!isInitialized) {
      console.log('[FriendRequestNotificationManager] Initializing...');
      // Store existing requests without showing notifications
      const existingIds = new Set(pendingRequests.map(req => req.friendship_id));
      previousRequestsRef.current = existingIds;
      setIsInitialized(true);
      console.log('[FriendRequestNotificationManager] Initialized with existing requests:', Array.from(existingIds));
    }
  }, [pendingRequests, isInitialized]);

  // Detect new friend requests and show notifications
  useEffect(() => {
    if (!isInitialized) {
      console.log('[FriendRequestNotificationManager] Skipping check - not initialized');
      return;
    }

    // Check for new requests
    const newRequests = pendingRequests.filter(
      req => !previousRequestsRef.current.has(req.friendship_id)
    );

    console.log('[FriendRequestNotificationManager] Checking for new requests:', {
      newRequestsCount: newRequests.length,
      newRequests: newRequests.map(r => ({ id: r.friendship_id, name: r.display_name })),
    });

    if (newRequests.length > 0) {
      console.log('[FriendRequestNotificationManager] Adding new notifications!');
      // Add new notifications (one at a time for better UX)
      const newNotifications: NotificationItem[] = newRequests.map(req => ({
        id: req.friendship_id,
        request: req,
        timestamp: Date.now(),
      }));

      setNotifications(prev => [...prev, ...newNotifications]);

      // Play notification sound (optional - commented out for now)
      // playNotificationSound();
    }

    // Update previous requests
    previousRequestsRef.current = new Set(pendingRequests.map(req => req.friendship_id));
  }, [pendingRequests, isInitialized]);

  const handleDismiss = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  const handleAccept = useCallback(async (friendshipId: string) => {
    await acceptRequest(friendshipId);
    handleDismiss(friendshipId);
  }, [acceptRequest, handleDismiss]);

  const handleDecline = useCallback(async (friendshipId: string) => {
    await declineRequest(friendshipId);
    handleDismiss(friendshipId);
  }, [declineRequest, handleDismiss]);

  // Only show the most recent notification to avoid clutter
  const currentNotification = notifications.length > 0 ? notifications[notifications.length - 1] : null;

  return (
    <Box>
      {currentNotification && (
        <FriendRequestNotification
          key={currentNotification.id}
          request={currentNotification.request}
          onAccept={handleAccept}
          onDecline={handleDecline}
          onDismiss={() => handleDismiss(currentNotification.id)}
          autoHideDelay={15000} // 15 seconds
        />
      )}
    </Box>
  );
}
