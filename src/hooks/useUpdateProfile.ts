import { useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { UpdateProfileFormData } from '../types/database';
import { useAuth } from '../context/AuthContext';
import { queryKeys } from '../lib/queryKeys';

/**
 * Hook to update user profile
 */
export function useUpdateProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: UpdateProfileFormData) => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', user.id);

      if (profileError) {
        console.error('Profile update error:', profileError);
        throw profileError;
      }

      const { error: metadataError } = await supabase.auth.updateUser({
        data,
      });

      if (metadataError) {
        console.error('Metadata update error:', metadataError);
      }

      return { success: true };
    },
    onSuccess: async () => {
      if (user) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.auth.profile(user.id),
        });
      }
    },
  });

  const error = useMemo(() => {
    if (mutation.error instanceof Error) {
      return mutation.error.message;
    }
    return null;
  }, [mutation.error]);

  return {
    updateProfile: mutation.mutateAsync,
    loading: mutation.isPending,
    error,
  };
}
