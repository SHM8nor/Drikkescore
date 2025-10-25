import { useState } from 'react';
import { supabase } from '../lib/supabase';
import type { UpdateProfileFormData } from '../types/database';
import { useAuth } from '../context/AuthContext';

/**
 * Hook to update user profile
 */
export function useUpdateProfile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProfile = async (data: UpdateProfileFormData) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      // Update profile in database
      const { error: profileError } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', user.id);

      if (profileError) {
        console.error('Profile update error:', profileError);
        throw profileError;
      }

      // Update auth user metadata to keep it in sync
      const { error: metadataError } = await supabase.auth.updateUser({
        data: data,
      });

      if (metadataError) {
        console.error('Metadata update error:', metadataError);
        // Don't throw - profile was updated successfully
        // Metadata is just for backup/recovery
      }

      console.log('Profile updated successfully');
      setLoading(false);
      return { success: true };
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message);
      setLoading(false);
      throw err;
    }
  };

  return { updateProfile, loading, error };
}
