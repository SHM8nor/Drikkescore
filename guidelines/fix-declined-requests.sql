-- =============================================================================
-- Fix: Handle Declined Friend Requests
-- =============================================================================
-- Problem: When declining friend requests, they are marked as 'declined' which
-- blocks future requests due to the unique constraint.
--
-- Solution: Delete all declined requests and update the status check constraint
-- to only allow 'pending', 'accepted', and 'blocked'.
-- =============================================================================

-- Step 1: Delete all declined friend requests
-- This allows users to send new requests after a decline
DELETE FROM friendships WHERE status = 'declined';

-- Step 2: Update the status constraint to remove 'declined' as a valid status
-- Drop the old constraint
ALTER TABLE friendships DROP CONSTRAINT IF EXISTS friendships_status_check;

-- Add new constraint without 'declined'
ALTER TABLE friendships ADD CONSTRAINT friendships_status_check
  CHECK (status IN ('pending', 'accepted', 'blocked'));

-- =============================================================================
-- Verification
-- =============================================================================

-- Check that all declined requests are gone
SELECT
  'Declined requests remaining: ' || COUNT(*)::text AS status,
  CASE
    WHEN COUNT(*) = 0 THEN '✅ All declined requests cleaned up'
    ELSE '❌ Still have declined requests'
  END AS result
FROM friendships
WHERE status = 'declined';

-- Verify constraint
SELECT
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition,
  '✅ Updated' AS status
FROM pg_constraint
WHERE conrelid = 'friendships'::regclass
  AND conname = 'friendships_status_check';
