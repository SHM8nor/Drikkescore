import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { User, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile, RegisterFormData } from '../types/database';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  profileError: string | null;
  signUp: (data: RegisterFormData) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  retryFetchProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Profile cache helper functions
  const PROFILE_CACHE_KEY = 'drikkescore_profile_cache';

  const getCachedProfile = (userId: string): Profile | null => {
    try {
      const cached = sessionStorage.getItem(`${PROFILE_CACHE_KEY}_${userId}`);
      if (cached) {
        const { profile, timestamp } = JSON.parse(cached);
        // Cache valid for 5 minutes
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          console.log('fetchProfile: Using cached profile for user:', userId);
          return profile as Profile;
        }
      }
    } catch (err) {
      console.error('fetchProfile: Error reading cache:', err);
    }
    return null;
  };

  const setCachedProfile = (userId: string, profile: Profile | null) => {
    try {
      if (profile) {
        sessionStorage.setItem(
          `${PROFILE_CACHE_KEY}_${userId}`,
          JSON.stringify({ profile, timestamp: Date.now() })
        );
      } else {
        sessionStorage.removeItem(`${PROFILE_CACHE_KEY}_${userId}`);
      }
    } catch (err) {
      console.error('fetchProfile: Error setting cache:', err);
    }
  };

  // Fetch user profile from database with retry logic
  const fetchProfile = async (userId: string, retryCount = 0): Promise<Profile | null> => {
    try {
      // Check cache first
      const cachedProfile = getCachedProfile(userId);
      if (cachedProfile) {
        setProfileError(null);
        return cachedProfile;
      }

      console.log('fetchProfile: Starting fetch for user:', userId);

      // Reduced timeout to 3 seconds for faster failure detection
      const timeoutPromise = new Promise<null>((resolve) => {
        setTimeout(() => {
          console.log('fetchProfile: Timeout after 3 seconds');
          resolve(null);
        }, 3000);
      });

      const fetchPromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
        .then(({ data, error }) => {
          console.log('fetchProfile: Query completed', { data, error });
          if (error) {
            console.error('fetchProfile: Error fetching profile:', error);

            // Check if profile doesn't exist
            if (error.code === 'PGRST116') {
              setProfileError('Profile not found. Please contact support or recreate your profile.');
              return null;
            }

            throw error;
          }
          return data as Profile;
        });

      const result = await Promise.race([fetchPromise, timeoutPromise]);

      // Don't retry if profile doesn't exist (PGRST116 error already set error message)
      if (result === null && retryCount < 2 && !profileError) {
        // Retry up to 2 times with exponential backoff (only for timeouts/network errors)
        console.log(`fetchProfile: Retry attempt ${retryCount + 1}`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return fetchProfile(userId, retryCount + 1);
      }

      if (result) {
        // Cache successful result
        setCachedProfile(userId, result);
        setProfileError(null);
      } else if (retryCount >= 2 && !profileError) {
        setProfileError('Failed to load profile after multiple attempts. Please try again.');
      }

      console.log('fetchProfile: Returning result:', result);
      return result;
    } catch (err) {
      console.error('fetchProfile: Exception fetching profile:', err);

      // Retry on exception
      if (retryCount < 2) {
        console.log(`fetchProfile: Retry attempt ${retryCount + 1} after exception`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return fetchProfile(userId, retryCount + 1);
      }

      setProfileError('An error occurred while loading your profile. Please try again.');
      return null;
    }
  };

  // Initialize auth state
  useEffect(() => {
    let mounted = true;
    let initialLoadComplete = false;

    console.log('AuthContext: Initializing...');

    // Fallback timeout in case getSession hangs
    const timeout = setTimeout(() => {
      if (mounted && !initialLoadComplete) {
        console.log('AuthContext: getSession timed out, setting loading to false');
        setLoading(false);
        initialLoadComplete = true;
      }
    }, 3000);

    // Get initial session using getUser for better security validation
    supabase.auth.getUser()
      .then(async ({ data: { user }, error }) => {
        console.log('AuthContext: Got user:', user?.id);
        initialLoadComplete = true;
        clearTimeout(timeout);

        if (!mounted) return;

        if (error) {
          console.error('AuthContext: Error getting user:', error);
          setLoading(false);
          return;
        }

        setUser(user);

        if (user) {
          console.log('AuthContext: Fetching profile for user:', user.id);
          const userProfile = await fetchProfile(user.id);
          console.log('AuthContext: Profile fetched:', userProfile);
          if (mounted) setProfile(userProfile);
        }

        if (mounted) {
          console.log('AuthContext: Setting loading to false');
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('AuthContext: Exception getting user:', err);
        initialLoadComplete = true;
        clearTimeout(timeout);
        if (mounted) {
          setLoading(false);
        }
      });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('AuthContext: Auth state changed:', _event, session?.user?.id);

      // Skip INITIAL_SESSION event to avoid duplicate fetch
      if (_event === 'INITIAL_SESSION') {
        console.log('AuthContext: Skipping INITIAL_SESSION event (already handled by getUser)');
        return;
      }

      // Skip TOKEN_REFRESHED event - no need to refetch profile
      if (_event === 'TOKEN_REFRESHED') {
        console.log('AuthContext: Skipping TOKEN_REFRESHED event (profile unchanged)');
        return;
      }

      if (!mounted) return;

      setUser(session?.user ?? null);

      // Only fetch profile on SIGNED_IN or USER_UPDATED events
      if (session?.user && (_event === 'SIGNED_IN' || _event === 'USER_UPDATED')) {
        console.log('AuthContext: Fetching profile from auth state change for user:', session.user.id);
        const userProfile = await fetchProfile(session.user.id);
        console.log('AuthContext: Profile fetched from auth state change:', userProfile);
        if (mounted) setProfile(userProfile);
      } else if (_event === 'SIGNED_OUT') {
        console.log('AuthContext: User signed out, clearing profile and cache');
        if (mounted) {
          setProfile(null);
          setProfileError(null);
          // Clear profile cache on sign out
          sessionStorage.removeItem(`${PROFILE_CACHE_KEY}_${session?.user?.id}`);
        }
      }
    });

    return () => {
      console.log('AuthContext: Cleaning up');
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  // Sign up with email and create profile
  const signUp = async (data: RegisterFormData) => {
    const { email, password, full_name, weight_kg, height_cm, gender, age } = data;

    try {
      // Create auth user with metadata
      // Store metadata so it can be used to create profile later
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name,
            weight_kg,
            height_cm,
            gender,
            age,
          },
        },
      });

      if (authError) {
        return { error: authError };
      }

      if (!authData.user || !authData.session) {
        return { error: { message: 'User creation failed', name: 'SignUpError', status: 500 } as AuthError };
      }

      // Wait a moment for the session to be fully established
      await new Promise(resolve => setTimeout(resolve, 500));

      // Manually create profile in the database
      // The user is now authenticated, so RLS should allow the insert
      console.log('signUp: Creating profile for user:', authData.user.id);
      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        full_name,
        weight_kg,
        height_cm,
        gender,
        age,
      });

      if (profileError) {
        console.error('signUp: Error creating profile:', profileError);
        // Profile creation failed - the metadata is stored, so it can be recovered later
        // Don't fail signup - let them continue and recover via retry button
        console.log('signUp: Profile creation failed, but user can recover it later from metadata');
      } else {
        console.log('signUp: Profile created successfully');
      }

      return { error: null };
    } catch (err: any) {
      console.error('signUp: Exception during signup:', err);
      return { error: { message: err.message || 'Failed to create account', name: 'SignUpError', status: 500 } as AuthError };
    }
  };

  // Sign in with email
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error };
  };

  // Sign out
  const signOut = async () => {
    // Clear profile cache before signing out
    if (user) {
      sessionStorage.removeItem(`${PROFILE_CACHE_KEY}_${user.id}`);
    }
    await supabase.auth.signOut();
  };

  // Retry fetching profile (for manual retry after error)
  const retryFetchProfile = async () => {
    if (!user) {
      console.log('retryFetchProfile: No user to fetch profile for');
      return;
    }

    console.log('retryFetchProfile: Manually retrying profile fetch for user:', user.id);
    setProfileError(null);

    // Clear cache to force fresh fetch
    sessionStorage.removeItem(`${PROFILE_CACHE_KEY}_${user.id}`);

    const userProfile = await fetchProfile(user.id);

    // If profile still doesn't exist, try to create it from user metadata
    if (!userProfile && user.user_metadata) {
      console.log('retryFetchProfile: Profile not found, attempting to create from metadata');

      const metadata = user.user_metadata;
      if (metadata.full_name && metadata.weight_kg && metadata.height_cm && metadata.gender && metadata.age) {
        try {
          const { error: createError } = await supabase.from('profiles').insert({
            id: user.id,
            full_name: metadata.full_name,
            weight_kg: metadata.weight_kg,
            height_cm: metadata.height_cm,
            gender: metadata.gender,
            age: metadata.age,
          });

          if (createError) {
            console.error('retryFetchProfile: Error creating profile from metadata:', createError);
            setProfileError('Failed to create profile. Please contact support.');
          } else {
            console.log('retryFetchProfile: Profile created from metadata, fetching again');
            // Clear cache and fetch again
            sessionStorage.removeItem(`${PROFILE_CACHE_KEY}_${user.id}`);
            const newProfile = await fetchProfile(user.id);
            setProfile(newProfile);
          }
        } catch (err) {
          console.error('retryFetchProfile: Exception creating profile:', err);
          setProfileError('An error occurred. Please contact support.');
        }
      } else {
        setProfileError('Profile data missing. Please contact support to recreate your profile.');
      }
    } else {
      setProfile(userProfile);
    }
  };

  const value = {
    user,
    profile,
    loading,
    profileError,
    signUp,
    signIn,
    signOut,
    retryFetchProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
