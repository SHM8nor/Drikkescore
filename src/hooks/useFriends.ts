/**
 * useFriends Hook
 *
 * Custom React hook for managing friend system state and operations.
 * Provides a simple interface for components to interact with the friend system.
 *
 * Features:
 * - Automatic data loading
 * - Real-time updates via subscriptions
 * - Loading and error states
 * - Simplified API for common operations
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getFriends,
  getPendingRequests,
  getSentRequests,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
  removeFriend,
  subscribeFriendships,
  areFriends,
  getFriendshipStatus,
} from '../api';
import type {
  Friend,
  FriendRequest,
  SentFriendRequest,
  FriendshipStatus,
} from '../types/database';

interface UseFriendsReturn {
  // Data
  friends: Friend[];
  pendingRequests: FriendRequest[];
  sentRequests: SentFriendRequest[];

  // Counts
  friendCount: number;
  pendingCount: number;
  sentCount: number;

  // State
  loading: boolean;
  error: string | null;

  // Actions
  sendRequest: (friendId: string) => Promise<void>;
  acceptRequest: (friendshipId: string) => Promise<void>;
  declineRequest: (friendshipId: string) => Promise<void>;
  cancelRequest: (friendshipId: string) => Promise<void>;
  unfriend: (friendId: string) => Promise<void>;
  checkFriendship: (friendId: string) => Promise<boolean>;
  getStatus: (friendId: string) => Promise<FriendshipStatus | 'none'>;
  refresh: () => Promise<void>;
  clearError: () => void;
}

/**
 * Hook for managing friends
 * @param autoLoad - Whether to automatically load data on mount (default: true)
 * @param enableRealtime - Whether to enable real-time subscriptions (default: true)
 */
export function useFriends(
  autoLoad: boolean = true,
  enableRealtime: boolean = true
): UseFriendsReturn {
  // Data state
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<SentFriendRequest[]>([]);

  // UI state
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState<string | null>(null);

  // Load all friend data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [friendsData, pendingData, sentData] = await Promise.all([
        getFriends(),
        getPendingRequests(),
        getSentRequests(),
      ]);

      setFriends(friendsData);
      setPendingRequests(pendingData);
      setSentRequests(sentData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Kunne ikke laste venner';
      setError(message);
      console.error('Error loading friends:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Use ref to prevent stale closure in subscription callback
  const loadDataRef = useRef(loadData);
  useEffect(() => {
    loadDataRef.current = loadData;
  }, [loadData]);

  // Initial load
  useEffect(() => {
    if (autoLoad) {
      loadData();
    }
  }, [autoLoad, loadData]);

  // Real-time subscriptions
  useEffect(() => {
    if (!enableRealtime) return;

    let unsubscribe: (() => void) | null = null;

    // Set up subscription
    subscribeFriendships(() => {
      // Use ref to access latest loadData function
      loadDataRef.current();
    }).then((unsub) => {
      unsubscribe = unsub;
    }).catch((err) => {
      console.error('Error setting up friendship subscription:', err);
    });

    // Cleanup function to unsubscribe
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [enableRealtime]);

  // Send friend request
  const sendRequest = useCallback(async (friendId: string) => {
    setError(null);
    try {
      await sendFriendRequest(friendId);
      await loadData();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Kunne ikke sende forespørsel';
      setError(message);
      throw err;
    }
  }, [loadData]);

  // Accept friend request
  const acceptRequest = useCallback(async (friendshipId: string) => {
    setError(null);
    try {
      await acceptFriendRequest(friendshipId);
      await loadData();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Kunne ikke akseptere forespørsel';
      setError(message);
      throw err;
    }
  }, [loadData]);

  // Decline friend request
  const declineRequest = useCallback(async (friendshipId: string) => {
    setError(null);
    try {
      await declineFriendRequest(friendshipId);
      await loadData();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Kunne ikke avslå forespørsel';
      setError(message);
      throw err;
    }
  }, [loadData]);

  // Cancel sent friend request
  const cancelRequest = useCallback(async (friendshipId: string) => {
    setError(null);
    try {
      await cancelFriendRequest(friendshipId);
      await loadData();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Kunne ikke kansellere forespørsel';
      setError(message);
      throw err;
    }
  }, [loadData]);

  // Remove friend
  const unfriend = useCallback(async (friendId: string) => {
    setError(null);
    try {
      await removeFriend(friendId);
      await loadData();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Kunne ikke fjerne venn';
      setError(message);
      throw err;
    }
  }, [loadData]);

  // Check if users are friends
  const checkFriendship = useCallback(async (friendId: string): Promise<boolean> => {
    try {
      return await areFriends(friendId);
    } catch (err) {
      console.error('Error checking friendship:', err);
      return false;
    }
  }, []);

  // Get friendship status
  const getStatus = useCallback(async (friendId: string): Promise<FriendshipStatus | 'none'> => {
    try {
      return await getFriendshipStatus(friendId);
    } catch (err) {
      console.error('Error getting friendship status:', err);
      return 'none';
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Data
    friends,
    pendingRequests,
    sentRequests,

    // Counts
    friendCount: friends.length,
    pendingCount: pendingRequests.length,
    sentCount: sentRequests.length,

    // State
    loading,
    error,

    // Actions
    sendRequest,
    acceptRequest,
    declineRequest,
    cancelRequest,
    unfriend,
    checkFriendship,
    getStatus,
    refresh: loadData,
    clearError,
  };
}
