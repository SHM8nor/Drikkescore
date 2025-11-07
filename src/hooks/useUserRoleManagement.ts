import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateUserRole } from '../api/adminUsers';
import type { UserRole, Profile } from '../types/database';
import type { AdminUser } from '../api/adminUsers';
import { queryKeys } from '../lib/queryKeys';

interface UpdateUserRoleVariables {
  userId: string;
  role: UserRole;
}

interface UseUserRoleManagementReturn {
  updateRole: (userId: string, role: UserRole) => Promise<Profile>;
  isUpdating: boolean;
  error: Error | null;
}

/**
 * Hook to manage user role updates (admin-only)
 * Includes optimistic updates and automatic cache invalidation
 */
export function useUserRoleManagement(): UseUserRoleManagementReturn {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ userId, role }: UpdateUserRoleVariables) => {
      return await updateUserRole(userId, role);
    },
    onMutate: async ({ userId, role }) => {
      // Cancel any outgoing refetches to prevent them from overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey: queryKeys.admin.users });

      // Snapshot the previous value
      const previousUsers = queryClient.getQueryData<AdminUser[]>(queryKeys.admin.users);

      // Optimistically update the cache
      if (previousUsers) {
        queryClient.setQueryData<AdminUser[]>(
          queryKeys.admin.users,
          previousUsers.map((user) =>
            user.id === userId ? { ...user, role } : user
          )
        );
      }

      // Return context with the previous value
      return { previousUsers };
    },
    onError: (error, _variables, context) => {
      // Rollback to the previous value on error
      if (context?.previousUsers) {
        queryClient.setQueryData(queryKeys.admin.users, context.previousUsers);
      }
      console.error('Error updating user role:', error);
    },
    onSuccess: () => {
      // Invalidate and refetch to ensure cache is in sync with server
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users });
    },
  });

  return {
    updateRole: async (userId: string, role: UserRole) => {
      return await mutation.mutateAsync({ userId, role });
    },
    isUpdating: mutation.isPending,
    error: mutation.error,
  };
}
