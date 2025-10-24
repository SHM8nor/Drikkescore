import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { User, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile, RegisterFormData } from '../types/database';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (data: RegisterFormData) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile from database
  const fetchProfile = async (userId: string) => {
    try {
      console.log('fetchProfile: Starting fetch for user:', userId);

      // Add timeout to profile fetch
      const timeoutPromise = new Promise<null>((resolve) => {
        setTimeout(() => {
          console.log('fetchProfile: Timeout after 5 seconds');
          resolve(null);
        }, 5000);
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
            return null;
          }
          return data as Profile;
        });

      const result = await Promise.race([fetchPromise, timeoutPromise]);
      console.log('fetchProfile: Returning result:', result);
      return result;
    } catch (err) {
      console.error('fetchProfile: Exception fetching profile:', err);
      return null;
    }
  };

  // Initialize auth state
  useEffect(() => {
    let mounted = true;
    let sessionLoaded = false;

    console.log('AuthContext: Initializing...');

    // Fallback timeout in case getSession hangs
    const timeout = setTimeout(() => {
      if (mounted && !sessionLoaded) {
        console.log('AuthContext: getSession timed out, setting loading to false');
        setLoading(false);
      }
    }, 3000);

    // Get initial session
    supabase.auth.getSession()
      .then(async ({ data: { session } }) => {
        console.log('AuthContext: Got session:', session?.user?.id);
        sessionLoaded = true;
        clearTimeout(timeout);
        if (!mounted) return;
        setUser(session?.user ?? null);
        if (session?.user) {
          console.log('AuthContext: Fetching profile for user:', session.user.id);
          const userProfile = await fetchProfile(session.user.id);
          console.log('AuthContext: Profile fetched:', userProfile);
          if (mounted) setProfile(userProfile);
        }
        if (mounted) {
          console.log('AuthContext: Setting loading to false');
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('AuthContext: Error getting session:', err);
        sessionLoaded = true;
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

      // If this is the first auth event and session hasn't loaded yet, handle it here
      if (!sessionLoaded) {
        sessionLoaded = true;
        clearTimeout(timeout);
      }

      if (!mounted) return;
      setUser(session?.user ?? null);
      if (session?.user) {
        console.log('AuthContext: Fetching profile from auth state change for user:', session.user.id);
        const userProfile = await fetchProfile(session.user.id);
        console.log('AuthContext: Profile fetched from auth state change:', userProfile);
        if (mounted) setProfile(userProfile);
      } else {
        if (mounted) setProfile(null);
      }
      if (mounted) {
        console.log('AuthContext: Setting loading to false from auth state change');
        setLoading(false);
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

    // Create auth user with metadata
    // The database trigger will automatically create the profile
    const { error: authError } = await supabase.auth.signUp({
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

    return { error: null };
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
    await supabase.auth.signOut();
  };

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
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
