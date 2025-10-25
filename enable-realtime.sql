-- Enable Supabase Realtime for session updates
-- Run this SQL in your Supabase SQL Editor to enable real-time updates

-- Enable realtime for session_participants table
ALTER PUBLICATION supabase_realtime ADD TABLE session_participants;

-- Enable realtime for drink_entries table
ALTER PUBLICATION supabase_realtime ADD TABLE drink_entries;

-- Verify realtime is enabled
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';
