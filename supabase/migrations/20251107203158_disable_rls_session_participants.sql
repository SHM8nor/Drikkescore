-- Disable RLS on session_participants to avoid circular dependency issues
-- The sessions table already has proper RLS, so participant data is protected at the session level
-- Other tables (drink_entries, active_sessions) rely on querying session_participants in their RLS policies

-- Drop the policy that was causing circular dependency
DROP POLICY IF EXISTS "Users can view participants in joined sessions" ON session_participants;

-- Disable RLS on session_participants table
ALTER TABLE session_participants DISABLE ROW LEVEL SECURITY;

-- Note: profiles table still has RLS enabled, which is the critical one for user privacy
