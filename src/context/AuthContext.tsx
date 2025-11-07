import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { AuthError, PostgrestError, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile, RegisterFormData } from '../types/database';
import { queryKeys } from '../lib/queryKeys';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  profileError: string | null;
  isAdmin: boolean;
  signUp: (data: RegisterFormData) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  retryFetchProfile: () => Promise<void>;
  updateRecapPreference: (enabled: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PROFILE_NOT_FOUND_MESSAGE =
  'Profile not found. Click the button below to restore your profile.';
const PROFILE_FETCH_ERROR = 'Failed to load profile. Please try again.';

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [authInitializing, setAuthInitializing] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const {
          data: { user: initialUser },
          error,
        } = await supabase.auth.getUser();

        if (!mounted) return;

        if (error) {
          console.error('AuthContext: Failed to load initial user', error);
          setUser(null);
        } else {
          setUser(initialUser);
        }
      } catch (err) {
        console.error('AuthContext: Exception during initialization', err);
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setAuthInitializing(false);
        }
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const profileQuery = useQuery({
    queryKey: queryKeys.auth.profile(user?.id ?? null),
    queryFn: async () => {
      if (!user?.id) {
        throw new Error(PROFILE_FETCH_ERROR);
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        const pgError = error as PostgrestError;
        if (pgError.code === 'PGRST116') {
          throw new Error(PROFILE_NOT_FOUND_MESSAGE);
        }
        console.error('AuthContext: Error fetching profile', error);
        throw new Error(PROFILE_FETCH_ERROR);
      }

      if (!data) {
        throw new Error(PROFILE_NOT_FOUND_MESSAGE);
      }

      return data as Profile;
    },
    enabled: Boolean(user?.id),
  });

  const profile = user ? (profileQuery.data ?? null) : null;
  const profileError =
    user && profileQuery.error instanceof Error ? profileQuery.error.message : null;
  const loading = authInitializing || (user ? profileQuery.isPending : false);
  const isAdmin = profile?.role === 'admin';

  const signUp = async (data: RegisterFormData) => {
    return supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.full_name,
          weight_kg: data.weight_kg,
          height_cm: data.height_cm,
          gender: data.gender,
          age: data.age,
        },
      },
    });
  };

  const signIn = async (email: string, password: string) => {
    return supabase.auth.signInWithPassword({ email, password });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    queryClient.clear();
    setUser(null);
  };

  const retryFetchProfile = useCallback(async () => {
    if (!user) {
      console.log('retryFetchProfile: No authenticated user');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        const pgError = error as PostgrestError;
        if (pgError.code === 'PGRST116') {
          const metadata = user.user_metadata || {};
          if (
            metadata.full_name &&
            metadata.weight_kg &&
            metadata.height_cm &&
            metadata.gender &&
            metadata.age
          ) {
            const { error: createError } = await supabase.from('profiles').insert({
              id: user.id,
              full_name: metadata.full_name,
              weight_kg: metadata.weight_kg,
              height_cm: metadata.height_cm,
              gender: metadata.gender,
              age: metadata.age,
            });

            if (createError) {
              console.error(
                'retryFetchProfile: Error creating profile from metadata',
                createError,
              );
              throw new Error('Failed to create profile. Please contact support.');
            }
          } else {
            throw new Error(
              'Profile data missing. Please contact support to recreate your profile.',
            );
          }
        } else {
          throw new Error(pgError.message || PROFILE_FETCH_ERROR);
        }
      } else if (!data) {
        throw new Error(PROFILE_NOT_FOUND_MESSAGE);
      }

      await queryClient.invalidateQueries({
        queryKey: queryKeys.auth.profile(user.id),
      });
    } catch (err) {
      console.error('retryFetchProfile: Exception during retry', err);
      throw err instanceof Error ? err : new Error(PROFILE_FETCH_ERROR);
    }
  }, [queryClient, user]);

  const updateRecapPreferenceMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!user) {
        throw new Error('No user logged in');
      }

      const { error } = await supabase
        .from('profiles')
        .update({ session_recaps_enabled: enabled })
        .eq('id', user.id);

      if (error) {
        console.error('updateRecapPreference: Error updating preference', error);
        throw new Error('Failed to update recap preference. Please try again.');
      }
    },
    onSuccess: async () => {
      if (user) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.auth.profile(user.id),
        });
      }
    },
  });

  const updateRecapPreference = useCallback(
    async (enabled: boolean) => {
      await updateRecapPreferenceMutation.mutateAsync(enabled);
    },
    [updateRecapPreferenceMutation],
  );

  const value: AuthContextType = {
    user,
    profile,
    loading,
    profileError,
    isAdmin,
    signUp,
    signIn,
    signOut,
    retryFetchProfile,
    updateRecapPreference,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
