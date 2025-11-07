-- Enable Row Level Security on profiles and session_participants tables
-- These tables had RLS policies defined but RLS was not enabled

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on session_participants table
ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;
