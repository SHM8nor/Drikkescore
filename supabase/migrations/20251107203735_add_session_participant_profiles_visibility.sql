-- Add policy to allow users to view profiles of participants in sessions they've joined
-- This fixes the issue where users can't see other participants in their sessions

-- Create a new policy that allows viewing profiles of co-participants
CREATE POLICY "Users can view profiles of session participants"
ON profiles
FOR SELECT
TO authenticated
USING (
  -- Allow viewing profiles of users who are in the same session(s) as you
  id IN (
    SELECT DISTINCT sp1.user_id
    FROM session_participants sp1
    WHERE sp1.session_id IN (
      SELECT sp2.session_id
      FROM session_participants sp2
      WHERE sp2.user_id = auth.uid()
    )
  )
);

-- Note: This policy works because session_participants has RLS disabled (from migration 20251107203158)
-- so there's no circular dependency. The query flow is:
-- 1. Get all sessions the current user is in
-- 2. Get all participants in those sessions
-- 3. Allow viewing those participants' profiles
