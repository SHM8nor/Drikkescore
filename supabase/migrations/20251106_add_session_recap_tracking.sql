-- Migration: Add session recap tracking to profiles
-- Created: 2025-11-06
-- Description: Adds fields to track which session recaps users have viewed and user preference for showing recaps

-- Add session recap tracking columns to profiles table
ALTER TABLE profiles
ADD COLUMN last_session_recap_viewed UUID NULL,
ADD COLUMN last_recap_dismissed_at TIMESTAMPTZ NULL,
ADD COLUMN session_recaps_enabled BOOLEAN DEFAULT true;

-- Add foreign key constraint to sessions table
ALTER TABLE profiles
ADD CONSTRAINT fk_last_session_recap_viewed
FOREIGN KEY (last_session_recap_viewed)
REFERENCES sessions(id)
ON DELETE SET NULL;

-- Create index for performance when querying recap status
CREATE INDEX idx_profiles_last_recap
ON profiles(last_session_recap_viewed);

-- Create index for filtering enabled recaps
CREATE INDEX idx_profiles_recaps_enabled
ON profiles(session_recaps_enabled)
WHERE session_recaps_enabled = true;

-- Add comments for documentation
COMMENT ON COLUMN profiles.last_session_recap_viewed IS
  'The session ID of the last recap the user has viewed or dismissed';

COMMENT ON COLUMN profiles.last_recap_dismissed_at IS
  'Timestamp when the user last dismissed a session recap';

COMMENT ON COLUMN profiles.session_recaps_enabled IS
  'Whether user wants to see session recaps after their drinking sessions (Settings toggle)';

-- =============================================================================
-- RLS Policies for Session Recap Columns
-- =============================================================================

-- Ensure RLS is enabled on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own recap preferences
CREATE POLICY "Users can view their own recap preferences"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can only update their own recap preferences
CREATE POLICY "Users can update their own recap preferences"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Add trigger to validate session participation
CREATE OR REPLACE FUNCTION validate_recap_session()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.last_session_recap_viewed IS NOT NULL THEN
    -- Verify user participated in this session
    IF NOT EXISTS (
      SELECT 1 FROM session_participants
      WHERE session_id = NEW.last_session_recap_viewed
      AND user_id = NEW.id
    ) THEN
      RAISE EXCEPTION 'Cannot set recap for session user did not participate in';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_recap_session_participation
  BEFORE UPDATE OF last_session_recap_viewed ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION validate_recap_session();

COMMENT ON FUNCTION validate_recap_session() IS
  'Validates that users can only mark recaps as viewed for sessions they participated in';
