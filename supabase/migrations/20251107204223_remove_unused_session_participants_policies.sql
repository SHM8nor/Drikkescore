-- Remove unused RLS policies from session_participants table
-- These policies are not being enforced since RLS is disabled on this table (migration 20251107203158)

-- Drop the INSERT policy
DROP POLICY IF EXISTS "Users can join sessions" ON session_participants;

-- Drop the DELETE policy
DROP POLICY IF EXISTS "Users can leave sessions" ON session_participants;

-- Note: session_participants has RLS disabled to avoid circular dependency issues
-- Access control is handled at the sessions table level
