-- =============================================================================
-- Friend System Quick Reference
-- =============================================================================
-- Common SQL queries for testing and debugging the friend system

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Check if tables exist
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('friendships', 'active_sessions')
ORDER BY table_name;

-- Check all RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('friendships', 'active_sessions')
ORDER BY tablename, policyname;

-- Check indexes
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE tablename IN ('friendships', 'active_sessions')
ORDER BY tablename, indexname;

-- Check realtime is enabled
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename IN ('friendships', 'active_sessions');

-- List all friend-related functions
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND (routine_name LIKE '%friend%' OR routine_name LIKE '%session%')
ORDER BY routine_name;

-- =============================================================================
-- TESTING QUERIES (Replace UUIDs with actual user/session IDs)
-- =============================================================================

-- Get all friendships
SELECT f.*,
  p1.full_name as user_name,
  p2.full_name as friend_name
FROM friendships f
JOIN profiles p1 ON p1.id = f.user_id
JOIN profiles p2 ON p2.id = f.friend_id
ORDER BY f.created_at DESC;

-- Get accepted friends for a user
SELECT * FROM get_friends('USER_ID_HERE');

-- Get pending requests for a user
SELECT * FROM get_pending_requests('USER_ID_HERE');

-- Get sent requests for a user
SELECT * FROM get_sent_requests('USER_ID_HERE');

-- Check if two users are friends
SELECT are_friends('USER_ID_1', 'USER_ID_2');

-- Get friendship status between two users
SELECT get_friendship_status('USER_ID_1', 'USER_ID_2');

-- Get all active sessions
SELECT a.*,
  p.full_name as user_name,
  s.session_name,
  s.session_code
FROM active_sessions a
JOIN profiles p ON p.id = a.user_id
JOIN sessions s ON s.id = a.session_id
ORDER BY a.last_seen DESC;

-- Get active friends sessions for a user
SELECT * FROM get_active_friends_sessions('USER_ID_HERE');

-- Get active users in a session
SELECT * FROM get_session_active_users('SESSION_ID_HERE');

-- =============================================================================
-- MANUAL DATA MANIPULATION (for testing)
-- =============================================================================

-- Create a friend request (as a specific user)
-- Note: In production, use the API, not direct inserts
INSERT INTO friendships (user_id, friend_id, status)
VALUES ('USER_ID_HERE', 'FRIEND_ID_HERE', 'pending')
RETURNING *;

-- Accept a friend request
UPDATE friendships
SET status = 'accepted'
WHERE id = 'FRIENDSHIP_ID_HERE'
RETURNING *;

-- Create an active session presence
-- Note: In production, use the upsert_session_presence function
INSERT INTO active_sessions (user_id, session_id, status)
VALUES ('USER_ID_HERE', 'SESSION_ID_HERE', 'active')
ON CONFLICT (user_id, session_id)
DO UPDATE SET
  status = EXCLUDED.status,
  last_seen = now()
RETURNING *;

-- Mark all sessions offline for a user
UPDATE active_sessions
SET status = 'offline'
WHERE user_id = 'USER_ID_HERE'
RETURNING *;

-- =============================================================================
-- CLEANUP AND MAINTENANCE
-- =============================================================================

-- Cleanup stale sessions (idle > 5 minutes)
SELECT cleanup_stale_sessions();

-- Delete all offline sessions older than 1 hour
DELETE FROM active_sessions
WHERE status = 'offline'
  AND updated_at < now() - interval '1 hour';

-- Count friendships by status
SELECT status, COUNT(*) as count
FROM friendships
GROUP BY status
ORDER BY count DESC;

-- Count active sessions by status
SELECT status, COUNT(*) as count
FROM active_sessions
GROUP BY status
ORDER BY count DESC;

-- Find users with most friends
SELECT
  CASE
    WHEN f.user_id = p.id THEN f.user_id
    ELSE f.friend_id
  END as user_id,
  p.full_name,
  COUNT(*) as friend_count
FROM friendships f
JOIN profiles p ON (p.id = f.user_id OR p.id = f.friend_id)
WHERE f.status = 'accepted'
GROUP BY
  CASE
    WHEN f.user_id = p.id THEN f.user_id
    ELSE f.friend_id
  END,
  p.full_name
ORDER BY friend_count DESC
LIMIT 10;

-- Find most active sessions (by user count)
SELECT
  s.id,
  s.session_name,
  s.session_code,
  COUNT(DISTINCT a.user_id) as active_user_count
FROM sessions s
LEFT JOIN active_sessions a ON a.session_id = s.id AND a.status IN ('active', 'idle')
WHERE s.end_time > now()
GROUP BY s.id, s.session_name, s.session_code
ORDER BY active_user_count DESC;

-- =============================================================================
-- DEBUGGING QUERIES
-- =============================================================================

-- Check for duplicate friendships (should be 0)
SELECT user_id, friend_id, COUNT(*) as duplicates
FROM friendships
GROUP BY user_id, friend_id
HAVING COUNT(*) > 1;

-- Check for self-friendships (should be 0)
SELECT * FROM friendships
WHERE user_id = friend_id;

-- Check for orphaned friendships (users that don't exist)
SELECT f.* FROM friendships f
LEFT JOIN profiles p1 ON p1.id = f.user_id
LEFT JOIN profiles p2 ON p2.id = f.friend_id
WHERE p1.id IS NULL OR p2.id IS NULL;

-- Check for orphaned active sessions
SELECT a.* FROM active_sessions a
LEFT JOIN profiles p ON p.id = a.user_id
LEFT JOIN sessions s ON s.id = a.session_id
WHERE p.id IS NULL OR s.id IS NULL;

-- Check stale active sessions (last seen > 5 minutes ago)
SELECT
  a.*,
  p.full_name,
  EXTRACT(EPOCH FROM (now() - a.last_seen))/60 as minutes_since_last_seen
FROM active_sessions a
JOIN profiles p ON p.id = a.user_id
WHERE a.status IN ('active', 'idle')
  AND a.last_seen < now() - interval '5 minutes'
ORDER BY a.last_seen;

-- =============================================================================
-- PERFORMANCE ANALYSIS
-- =============================================================================

-- Check index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE tablename IN ('friendships', 'active_sessions')
ORDER BY tablename, idx_scan DESC;

-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as indexes_size
FROM pg_tables
WHERE tablename IN ('friendships', 'active_sessions')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- =============================================================================
-- EXAMPLE DATA GENERATION (for development/testing)
-- =============================================================================

-- Create sample friendships between existing users
-- (Replace with actual user IDs from your profiles table)
/*
-- Get some user IDs first
SELECT id, full_name FROM profiles LIMIT 5;

-- Then create friendships
INSERT INTO friendships (user_id, friend_id, status)
VALUES
  ('user1-id', 'user2-id', 'accepted'),
  ('user1-id', 'user3-id', 'accepted'),
  ('user2-id', 'user4-id', 'pending'),
  ('user3-id', 'user4-id', 'accepted');

-- Create sample active sessions
INSERT INTO active_sessions (user_id, session_id, status)
SELECT
  sp.user_id,
  sp.session_id,
  'active'::session_status
FROM session_participants sp
WHERE sp.session_id IN (
  SELECT id FROM sessions WHERE end_time > now() LIMIT 3
);
*/
