-- Add display_name column to profiles table
-- This migration adds a unique display name field for public user identification

-- Step 1: Add display_name column (nullable initially for migration)
ALTER TABLE public.profiles
ADD COLUMN display_name TEXT;

-- Step 2: Populate display_name from full_name for existing users
UPDATE public.profiles
SET display_name = full_name
WHERE display_name IS NULL;

-- Step 3: Make display_name NOT NULL
ALTER TABLE public.profiles
ALTER COLUMN display_name SET NOT NULL;

-- Step 4: Add unique constraint on display_name
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_display_name_unique UNIQUE (display_name);

-- Step 5: Create index for search performance
CREATE INDEX idx_profiles_display_name ON public.profiles USING btree (display_name);

-- Step 6: Add case-insensitive search index (for ILIKE queries)
CREATE INDEX idx_profiles_display_name_lower ON public.profiles USING btree (LOWER(display_name));

-- Update database functions to return display_name instead of full_name

-- Drop existing functions first (required because we're changing return types)
DROP FUNCTION IF EXISTS public.get_friends(uuid);
DROP FUNCTION IF EXISTS public.get_pending_requests(uuid);
DROP FUNCTION IF EXISTS public.get_sent_requests(uuid);
DROP FUNCTION IF EXISTS public.get_session_active_users(uuid);
DROP FUNCTION IF EXISTS public.get_session_leaderboard(uuid, timestamp with time zone);
DROP FUNCTION IF EXISTS public.get_active_friends_sessions(uuid);

-- Function 1: get_friends - return display_name
CREATE OR REPLACE FUNCTION public.get_friends(p_user_id uuid)
RETURNS TABLE(friend_id uuid, display_name text, avatar_url text, created_at timestamp with time zone)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE
      WHEN f.user_id = p_user_id THEN f.friend_id
      ELSE f.user_id
    END AS friend_id,
    p.display_name,
    p.avatar_url,
    f.created_at
  FROM friendships f
  JOIN profiles p ON (
    (f.user_id = p_user_id AND p.id = f.friend_id) OR
    (f.friend_id = p_user_id AND p.id = f.user_id)
  )
  WHERE
    (f.user_id = p_user_id OR f.friend_id = p_user_id) AND
    f.status = 'accepted'
  ORDER BY p.display_name;
END;
$$;

-- Function 2: get_pending_requests - return display_name
CREATE OR REPLACE FUNCTION public.get_pending_requests(p_user_id uuid)
RETURNS TABLE(friendship_id uuid, requester_id uuid, display_name text, avatar_url text, created_at timestamp with time zone)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.id AS friendship_id,
    f.user_id AS requester_id,
    p.display_name,
    p.avatar_url,
    f.created_at
  FROM friendships f
  JOIN profiles p ON p.id = f.user_id
  WHERE
    f.friend_id = p_user_id AND
    f.status = 'pending'
  ORDER BY f.created_at DESC;
END;
$$;

-- Function 3: get_sent_requests - return display_name
CREATE OR REPLACE FUNCTION public.get_sent_requests(p_user_id uuid)
RETURNS TABLE(friendship_id uuid, recipient_id uuid, display_name text, avatar_url text, created_at timestamp with time zone)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.id AS friendship_id,
    f.friend_id AS recipient_id,
    p.display_name,
    p.avatar_url,
    f.created_at
  FROM friendships f
  JOIN profiles p ON p.id = f.friend_id
  WHERE
    f.user_id = p_user_id AND
    f.status = 'pending'
  ORDER BY f.created_at DESC;
END;
$$;

-- Function 4: get_session_active_users - return display_name
CREATE OR REPLACE FUNCTION public.get_session_active_users(p_session_id uuid)
RETURNS TABLE(user_id uuid, display_name text, avatar_url text, status session_status, last_seen timestamp with time zone)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS user_id,
    p.display_name,
    p.avatar_url,
    a.status,
    a.last_seen
  FROM active_sessions a
  JOIN profiles p ON p.id = a.user_id
  WHERE
    a.session_id = p_session_id AND
    a.status IN ('active', 'idle')
  ORDER BY a.last_seen DESC;
END;
$$;

-- Function 5: get_session_leaderboard - return display_name
CREATE OR REPLACE FUNCTION public.get_session_leaderboard(p_session_id uuid, p_current_time timestamp with time zone DEFAULT now())
RETURNS TABLE(rank integer, user_id uuid, display_name text, bac numeric)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ROW_NUMBER() OVER (ORDER BY calculate_user_bac(sp.user_id, sp.session_id, p_current_time) DESC)::integer as rank,
    sp.user_id,
    p.display_name,
    calculate_user_bac(sp.user_id, sp.session_id, p_current_time) as bac
  FROM session_participants sp
  JOIN profiles p ON p.id = sp.user_id
  WHERE sp.session_id = p_session_id
  ORDER BY rank;
END;
$$;

-- Function 6: get_active_friends_sessions - return display_name as friend_name
CREATE OR REPLACE FUNCTION public.get_active_friends_sessions(p_user_id uuid DEFAULT auth.uid())
RETURNS TABLE(friend_id uuid, friend_name text, friend_avatar_url text, session_id uuid, session_name text, session_code text, status session_status, last_seen timestamp with time zone, participant_count bigint)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE
      WHEN f.user_id = p_user_id THEN f.friend_id
      ELSE f.user_id
    END AS friend_id,
    p.display_name AS friend_name,
    p.avatar_url AS friend_avatar_url,
    s.id AS session_id,
    s.session_name,
    s.session_code,
    a.status,
    a.last_seen,
    (SELECT COUNT(*) FROM session_participants sp WHERE sp.session_id = s.id) AS participant_count
  FROM friendships f
  JOIN profiles p ON (
    (f.user_id = p_user_id AND p.id = f.friend_id) OR
    (f.friend_id = p_user_id AND p.id = f.user_id)
  )
  JOIN active_sessions a ON a.user_id = p.id
  JOIN sessions s ON s.id = a.session_id
  WHERE
    (f.user_id = p_user_id OR f.friend_id = p_user_id) AND
    f.status = 'accepted' AND
    a.status IN ('active', 'idle') AND
    s.end_time > now() -- Only active sessions
  ORDER BY a.last_seen DESC;
END;
$$;

-- Comment on the new column
COMMENT ON COLUMN public.profiles.display_name IS 'Public display name for user identification and search. Must be unique across all users.';
