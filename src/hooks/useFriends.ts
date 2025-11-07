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

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
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
import { useAuth } from '../context/AuthContext';
import { queryKeys } from '../lib/queryKeys';

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
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);

  const enabled = autoLoad && Boolean(user);

  const friendsQuery = useQuery({
    queryKey: queryKeys.friends.list(user?.id ?? null),
    queryFn: getFriends,
    enabled,
  });

  const pendingQuery = useQuery({
    queryKey: queryKeys.friends.pending(user?.id ?? null),
    queryFn: getPendingRequests,
    enabled,
  });

  const sentQuery = useQuery({
    queryKey: queryKeys.friends.sent(user?.id ?? null),
    queryFn: getSentRequests,
    enabled,
  });

  const invalidateFriendData = useCallback(async () => {
    if (!user) return;

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.friends.list(user.id) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.friends.pending(user.id) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.friends.sent(user.id) }),
    ]);
  }, [queryClient, user]);

  // Use ref to prevent stale closure in subscription callback
  const invalidateRef = useRef(invalidateFriendData);
  useEffect(() => {
    invalidateRef.current = invalidateFriendData;
  }, [invalidateFriendData]);

  // Real-time subscriptions
  useEffect(() => {
    if (!enableRealtime || !user) return;

    let unsubscribe: (() => void) | null = null;

    // Set up subscription
    subscribeFriendships(() => {
      invalidateRef.current();
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
  }, [enableRealtime, user]);

  const sendRequestMutation = useMutation({
    mutationFn: async (friendId: string) => {
      setActionError(null);
      return sendFriendRequest(friendId);
    },
    onSuccess: invalidateFriendData,
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Kunne ikke sende forespørsel';
      setActionError(message);
    },
  });

  const acceptRequestMutation = useMutation({
    mutationFn: async (friendshipId: string) => {
      setActionError(null);
      return acceptFriendRequest(friendshipId);
    },
    onSuccess: invalidateFriendData,
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Kunne ikke akseptere forespørsel';
      setActionError(message);
    },
  });

  const declineRequestMutation = useMutation({
    mutationFn: async (friendshipId: string) => {
      setActionError(null);
      return declineFriendRequest(friendshipId);
    },
    onSuccess: invalidateFriendData,
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Kunne ikke avslå forespørsel';
      setActionError(message);
    },
  });

  const cancelRequestMutation = useMutation({
    mutationFn: async (friendshipId: string) => {
      setActionError(null);
      return cancelFriendRequest(friendshipId);
    },
    onSuccess: invalidateFriendData,
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Kunne ikke kansellere forespørsel';
      setActionError(message);
    },
  });

  const unfriendMutation = useMutation({
    mutationFn: async (friendId: string) => {
      setActionError(null);
      return removeFriend(friendId);
    },
    onSuccess: invalidateFriendData,
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Kunne ikke fjerne venn';
      setActionError(message);
    },
  });

  const refresh = useCallback(async () => {
    await Promise.all([
      friendsQuery.refetch(),
      pendingQuery.refetch(),
      sentQuery.refetch(),
    ]);
  }, [friendsQuery, pendingQuery, sentQuery]);

  const queryError =
    friendsQuery.error || pendingQuery.error || sentQuery.error;

  const error = useMemo(() => {
    if (actionError) {
      return actionError;
    }
    if (queryError instanceof Error) {
      return queryError.message;
    }
    return null;
  }, [actionError, queryError]);

  const initialPending =
    friendsQuery.isPending || pendingQuery.isPending || sentQuery.isPending;

  const loading =
    initialPending ||
    friendsQuery.isFetching ||
    pendingQuery.isFetching ||
    sentQuery.isFetching;

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
    setActionError(null);
  }, []);

  return {
    // Data
    friends: friendsQuery.data ?? [],
    pendingRequests: pendingQuery.data ?? [],
    sentRequests: sentQuery.data ?? [],

    // Counts
    friendCount: friendsQuery.data?.length ?? 0,
    pendingCount: pendingQuery.data?.length ?? 0,
    sentCount: sentQuery.data?.length ?? 0,

    // State
    loading,
    error,

    // Actions
    sendRequest: sendRequestMutation.mutateAsync,
    acceptRequest: acceptRequestMutation.mutateAsync,
    declineRequest: declineRequestMutation.mutateAsync,
    cancelRequest: cancelRequestMutation.mutateAsync,
    unfriend: unfriendMutation.mutateAsync,
    checkFriendship,
    getStatus,
    refresh,
    clearError,
  };
}
