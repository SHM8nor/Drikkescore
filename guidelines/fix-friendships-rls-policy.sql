-- =============================================================================
-- Fix: Friendships RLS INSERT Policy
-- =============================================================================
-- Problem: The INSERT policy's NOT EXISTS check fails because it tries to
-- query rows that the user doesn't have SELECT permission for (reverse friendships)
--
-- Solution: Simplify the INSERT policy and rely on the unique constraint and
-- application-level validation (which already exists in src/api/friendships.ts)
-- =============================================================================

-- Drop the old INSERT policy
DROP POLICY IF EXISTS "Users can send friend requests" ON friendships;

-- Create a simplified INSERT policy
-- This allows users to insert friendships where they are the user_id and status is pending
-- The unique constraint (unique_friendship) will prevent duplicate entries
-- The application layer handles checking for reverse direction friendships
CREATE POLICY "Users can send friend requests"
  ON friendships FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    status = 'pending'
  );

-- Verify the policy was created
SELECT
  policyname,
  cmd as command,
  qual as using_expression,
  with_check as check_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'friendships'
  AND policyname = 'Users can send friend requests';
