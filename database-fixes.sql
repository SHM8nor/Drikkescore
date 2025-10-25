-- Database Fixes for Drikkescore
-- Run these SQL statements in your Supabase SQL Editor to fix RLS policies and enable realtime

-- =============================================================================
-- 1. Fix: Allow users to view sessions by code (for joining)
-- =============================================================================
-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can view active sessions by code to join" ON sessions;

CREATE POLICY "Users can view active sessions by code to join"
  ON sessions FOR SELECT
  USING (
    auth.role() = 'authenticated' AND
    end_time > now()
  );

-- =============================================================================
-- 2. Fix: Allow users to view profiles of session participants
-- =============================================================================
-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can view profiles of session participants" ON profiles;

CREATE POLICY "Users can view profiles of session participants"
  ON profiles FOR SELECT
  USING (
    -- User can view profiles of people in the same session
    EXISTS (
      SELECT 1
      FROM session_participants sp1
      INNER JOIN session_participants sp2
        ON sp1.session_id = sp2.session_id
      WHERE sp1.user_id = auth.uid()
        AND sp2.user_id = profiles.id
    )
  );

-- =============================================================================
-- 3. Enable Realtime for tables (optional but recommended)
-- =============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE session_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE drink_entries;

-- =============================================================================
-- 4. Verify setup
-- =============================================================================
-- Check RLS policies
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename IN ('sessions', 'profiles', 'session_participants', 'drink_entries')
ORDER BY tablename, policyname;

-- Check realtime publications
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';
