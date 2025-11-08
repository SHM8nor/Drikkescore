-- Add session_type column to sessions table
-- This migration adds support for themed session types (standard, julebord, etc.)

-- Step 1: Add session_type column (nullable initially for migration)
ALTER TABLE public.sessions
ADD COLUMN IF NOT EXISTS session_type VARCHAR(50);

-- Step 2: Populate session_type with 'standard' for existing sessions
UPDATE public.sessions
SET session_type = 'standard'
WHERE session_type IS NULL;

-- Step 3: Make session_type NOT NULL with default value
ALTER TABLE public.sessions
ALTER COLUMN session_type SET NOT NULL,
ALTER COLUMN session_type SET DEFAULT 'standard';

-- Step 4: Add CHECK constraint to validate session types
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'sessions_type_check'
    AND conrelid = 'public.sessions'::regclass
  ) THEN
    ALTER TABLE public.sessions
    ADD CONSTRAINT sessions_type_check
    CHECK (session_type IN ('standard', 'julebord'));
  END IF;
END $$;

-- Step 5: Create index for performance (filtering by session type)
CREATE INDEX IF NOT EXISTS idx_sessions_session_type
ON public.sessions USING btree (session_type);

-- Step 6: Add compound index for common query patterns (type + active sessions)
CREATE INDEX IF NOT EXISTS idx_sessions_type_end_time
ON public.sessions USING btree (session_type, end_time DESC);

-- Comment on the new column
COMMENT ON COLUMN public.sessions.session_type IS 'Type of session theme: standard (default) or themed events like julebord (Christmas party)';
