-- Fix session_participants RLS policy to allow viewing all participants in sessions you're part of
-- The previous policy was too restrictive and caused circular dependency issues

-- Drop the old restrictive SELECT policy
DROP POLICY IF EXISTS "Users can view participants in their sessions" ON session_participants;

-- Create a new policy that allows users to view all participants in any session they're part of
CREATE POLICY "Users can view participants in joined sessions"
ON session_participants
FOR SELECT
TO authenticated
USING (
  -- User can see all participants in sessions they are part of
  session_id IN (
    SELECT session_id
    FROM session_participants
    WHERE user_id = auth.uid()
  )
);
