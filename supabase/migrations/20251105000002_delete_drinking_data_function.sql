-- =============================================================================
-- Migration: Add function to delete user drinking data
-- Description: Creates a function that allows users to delete their own
--              drinking data without deleting their entire account
-- Author: Claude Code
-- Date: 2025-11-05
-- =============================================================================

-- Create function to delete all drinking-related data for a user
CREATE OR REPLACE FUNCTION delete_user_drinking_data(target_user_id UUID)
RETURNS JSON AS $$
DECLARE
  deleted_drinks INTEGER;
  deleted_active_sessions INTEGER;
  deleted_participations INTEGER;
  deleted_sessions INTEGER;
BEGIN
  -- Security check: Must be the user themselves
  IF target_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: You can only delete your own drinking data';
  END IF;

  -- Step 1: Delete drink entries
  -- This removes all individual drink records for the user
  DELETE FROM drink_entries WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_drinks = ROW_COUNT;

  -- Step 2: Delete active session records for this user
  -- This must be done before deleting session_participants to prevent orphaned records
  DELETE FROM active_sessions WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_active_sessions = ROW_COUNT;

  -- Step 3: Delete session participations
  -- This removes the user from all sessions they participated in
  DELETE FROM session_participants WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_participations = ROW_COUNT;

  -- Step 4: Delete sessions where user was the sole creator AND no other participants remain
  -- This only deletes sessions that would be orphaned by removing this user
  DELETE FROM sessions
  WHERE created_by = target_user_id
  AND id NOT IN (
    SELECT DISTINCT session_id FROM session_participants
  );
  GET DIAGNOSTICS deleted_sessions = ROW_COUNT;

  -- Return summary of deleted data
  RETURN json_build_object(
    'drinks_deleted', deleted_drinks,
    'active_sessions_deleted', deleted_active_sessions,
    'participations_deleted', deleted_participations,
    'sessions_deleted', deleted_sessions,
    'success', true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment to document the function
COMMENT ON FUNCTION delete_user_drinking_data(UUID) IS
  'Deletes all drinking-related data for a user including drink entries, session participations, and orphaned sessions. Users can only delete their own data.';

-- =============================================================================
-- RLS Policy for function execution
-- =============================================================================

-- Grant execute permission to authenticated users
-- (The function itself enforces that users can only delete their own data)
GRANT EXECUTE ON FUNCTION delete_user_drinking_data(UUID) TO authenticated;

-- =============================================================================
-- Verification Queries
-- =============================================================================

-- Test the function exists
-- SELECT routine_name, routine_type, data_type
-- FROM information_schema.routines
-- WHERE routine_name = 'delete_user_drinking_data';

-- Example usage (commented out):
-- SELECT delete_user_drinking_data(auth.uid());
