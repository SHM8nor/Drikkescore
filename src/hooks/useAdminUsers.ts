import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getAllUsers } from '../api/adminUsers';
import type { AdminUser } from '../api/adminUsers';
import { useSupabaseSubscription } from './useSupabaseSubscription';
import { queryKeys } from '../lib/queryKeys';

// Re-export AdminUser type for convenience
export type { AdminUser } from '../api/adminUsers';

interface UseAdminUsersReturn {
  users: AdminUser[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and manage all users (admin-only)
 * Includes real-time subscription for live updates
 */
export function useAdminUsers(): UseAdminUsersReturn {
  const queryClient = useQueryClient();

  const usersQuery = useQuery({
    queryKey: queryKeys.admin.users,
    queryFn: getAllUsers,
  });

  const invalidateUsers = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.admin.users });
  }, [queryClient]);

  // Subscribe to profiles table changes
  useSupabaseSubscription(
    'admin-users',
    useCallback(
      (channel) => {
        channel.on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'profiles' },
          invalidateUsers,
        );
        // Also listen to related tables that affect user statistics
        channel.on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'session_participants' },
          invalidateUsers,
        );
        channel.on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'drink_entries' },
          invalidateUsers,
        );
        channel.on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'friendships' },
          invalidateUsers,
        );
        channel.on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'session_active_users' },
          invalidateUsers,
        );
      },
      [invalidateUsers],
    ),
    true,
  );

  const error = useMemo(() => {
    if (usersQuery.error instanceof Error) {
      return usersQuery.error.message;
    }
    return null;
  }, [usersQuery.error]);

  return {
    users: usersQuery.data ?? [],
    loading: usersQuery.isPending,
    error,
    refetch: async () => {
      await usersQuery.refetch();
    },
  };
}
