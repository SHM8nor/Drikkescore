-- =============================================================================
-- Migration: Add terms and privacy policy acceptance tracking
-- Description: Adds columns to profiles table for tracking user acceptance of
--              terms of service and privacy policy
-- Author: Claude Code
-- Date: 2025-11-05
-- =============================================================================

-- Add terms acceptance columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS has_accepted_terms BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ NULL,
ADD COLUMN IF NOT EXISTS privacy_policy_version INTEGER DEFAULT 1;

-- Create index for querying users who haven't accepted terms
CREATE INDEX IF NOT EXISTS idx_profiles_terms_acceptance
  ON profiles(has_accepted_terms)
  WHERE has_accepted_terms = FALSE;

-- Add comment to document the columns
COMMENT ON COLUMN profiles.has_accepted_terms IS
  'Indicates whether the user has accepted the current terms of service';

COMMENT ON COLUMN profiles.terms_accepted_at IS
  'Timestamp when the user accepted the terms of service';

COMMENT ON COLUMN profiles.privacy_policy_version IS
  'Version number of the privacy policy the user has accepted';

-- =============================================================================
-- Verification Queries
-- =============================================================================

-- Check that columns were added successfully
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'profiles'
--   AND column_name IN ('has_accepted_terms', 'terms_accepted_at', 'privacy_policy_version')
-- ORDER BY ordinal_position;
