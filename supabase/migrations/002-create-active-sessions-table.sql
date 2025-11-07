-- =============================================================================
-- Migration: Create active_sessions table
-- Description: Tracks user presence in sessions for real-time friend activity
-- Author: Claude Code
-- Date: 2025-11-04
-- =============================================================================

-- Create enum type for session status
DO $$ BEGIN
  CREATE TYPE session_status AS ENUM ('active', 'idle', 'offline');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create active_sessions table
CREATE TABLE IF NOT EXISTS active_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  status session_status DEFAULT 'active' NOT NULL,
  last_seen timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,

  -- Constraints
  CONSTRAINT unique_user_session UNIQUE (user_id, session_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_active_sessions_user_id ON active_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_session_id ON active_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_status ON active_sessions(status);
CREATE INDEX IF NOT EXISTS idx_active_sessions_last_seen ON active_sessions(last_seen);

-- Add trigger for updated_at
CREATE TRIGGER update_active_sessions_updated_at
  BEFORE UPDATE ON active_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add trigger to automatically update last_seen on any update
CREATE OR REPLACE FUNCTION update_last_seen()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_seen = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_active_sessions_last_seen
  BEFORE UPDATE ON active_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_last_seen();

-- Enable Row Level Security
ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- RLS Policies for active_sessions
-- =============================================================================

-- Policy 1: Users can view their own active sessions
CREATE POLICY "Users can view their own active sessions"
  ON active_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- Policy 2: Users can view active sessions of their friends
CREATE POLICY "Users can view friends' active sessions"
  ON active_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM friendships f
      WHERE
        ((f.user_id = auth.uid() AND f.friend_id = active_sessions.user_id) OR
         (f.friend_id = auth.uid() AND f.user_id = active_sessions.user_id)) AND
        f.status = 'accepted'
    )
  );

-- Policy 3: Users can view active sessions in sessions they participate in
CREATE POLICY "Users can view active sessions in their sessions"
  ON active_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM session_participants sp
      WHERE sp.session_id = active_sessions.session_id
        AND sp.user_id = auth.uid()
    )
  );

-- Policy 4: Users can insert their own active session records
CREATE POLICY "Users can insert own active sessions"
  ON active_sessions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    -- Ensure user is actually a participant in the session
    EXISTS (
      SELECT 1 FROM session_participants sp
      WHERE sp.session_id = NEW.session_id
        AND sp.user_id = auth.uid()
    )
  );

-- Policy 5: Users can update their own active session records
CREATE POLICY "Users can update own active sessions"
  ON active_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy 6: Users can delete their own active session records
CREATE POLICY "Users can delete own active sessions"
  ON active_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================================================
-- Helper Functions for Active Sessions
-- =============================================================================

-- Function: Get active sessions for a user's friends
CREATE OR REPLACE FUNCTION get_active_friends_sessions(p_user_id uuid DEFAULT auth.uid())
RETURNS TABLE (
  friend_id uuid,
  friend_name text,
  friend_avatar_url text,
  session_id uuid,
  session_name text,
  session_code text,
  status session_status,
  last_seen timestamptz,
  participant_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE
      WHEN f.user_id = p_user_id THEN f.friend_id
      ELSE f.user_id
    END AS friend_id,
    p.full_name AS friend_name,
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Update or insert user session presence (upsert)
CREATE OR REPLACE FUNCTION upsert_session_presence(
  p_user_id uuid,
  p_session_id uuid,
  p_status session_status DEFAULT 'active'
)
RETURNS uuid AS $$
DECLARE
  v_active_session_id uuid;
BEGIN
  -- Verify user is a participant in the session
  IF NOT EXISTS (
    SELECT 1 FROM session_participants
    WHERE user_id = p_user_id AND session_id = p_session_id
  ) THEN
    RAISE EXCEPTION 'User is not a participant in this session';
  END IF;

  -- Upsert active session record
  INSERT INTO active_sessions (user_id, session_id, status)
  VALUES (p_user_id, p_session_id, p_status)
  ON CONFLICT (user_id, session_id)
  DO UPDATE SET
    status = EXCLUDED.status,
    last_seen = now(),
    updated_at = now()
  RETURNING id INTO v_active_session_id;

  RETURN v_active_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Mark user as offline in a session
CREATE OR REPLACE FUNCTION mark_session_offline(
  p_user_id uuid,
  p_session_id uuid
)
RETURNS void AS $$
BEGIN
  UPDATE active_sessions
  SET status = 'offline', updated_at = now()
  WHERE user_id = p_user_id AND session_id = p_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Cleanup stale active sessions (idle > 5 minutes = offline)
CREATE OR REPLACE FUNCTION cleanup_stale_sessions()
RETURNS void AS $$
BEGIN
  UPDATE active_sessions
  SET status = 'offline'
  WHERE
    status != 'offline' AND
    last_seen < now() - interval '5 minutes';

  -- Optionally delete very old offline records (older than 1 hour)
  DELETE FROM active_sessions
  WHERE
    status = 'offline' AND
    updated_at < now() - interval '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get users currently active in a specific session
CREATE OR REPLACE FUNCTION get_session_active_users(p_session_id uuid)
RETURNS TABLE (
  user_id uuid,
  full_name text,
  avatar_url text,
  status session_status,
  last_seen timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS user_id,
    p.full_name,
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- Grant necessary permissions
-- =============================================================================

GRANT EXECUTE ON FUNCTION get_active_friends_sessions(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_session_presence(uuid, uuid, session_status) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_session_offline(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_stale_sessions() TO authenticated;
GRANT EXECUTE ON FUNCTION get_session_active_users(uuid) TO authenticated;

-- =============================================================================
-- Enable Realtime for active_sessions
-- =============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE active_sessions;

-- =============================================================================
-- Create a scheduled job to cleanup stale sessions (optional - requires pg_cron)
-- =============================================================================

-- Uncomment if pg_cron extension is available:
-- SELECT cron.schedule(
--   'cleanup-stale-sessions',
--   '*/5 * * * *', -- Every 5 minutes
--   'SELECT cleanup_stale_sessions();'
-- );

-- =============================================================================
-- Verification Queries
-- =============================================================================

-- Check RLS policies
-- SELECT schemaname, tablename, policyname
-- FROM pg_policies
-- WHERE tablename = 'active_sessions'
-- ORDER BY policyname;

-- Check indexes
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'active_sessions';
