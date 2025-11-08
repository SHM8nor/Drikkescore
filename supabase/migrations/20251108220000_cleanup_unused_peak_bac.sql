-- Clean up unused peak BAC database implementation
-- The client-side calculations in TypeScript are working correctly
-- We don't need server-side storage for peak BAC values

-- Drop the placeholder functions
DROP FUNCTION IF EXISTS update_participant_peak_bac(UUID, UUID);
DROP FUNCTION IF EXISTS recalculate_all_peak_bac();
DROP FUNCTION IF EXISTS trigger_update_peak_bac();

-- Drop the trigger if it still exists
DROP TRIGGER IF EXISTS update_peak_bac_on_drink_insert ON drink_entries;

-- Drop the index
DROP INDEX IF EXISTS idx_session_participants_peak_bac;

-- Remove the peak BAC columns from session_participants
ALTER TABLE session_participants
DROP COLUMN IF EXISTS peak_bac,
DROP COLUMN IF EXISTS peak_bac_time;

-- Add comment explaining the approach
COMMENT ON TABLE session_participants IS 'Session participant records. Peak BAC is calculated client-side on-demand using the bacCalculator utility.';
