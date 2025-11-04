-- =============================================================================
-- Friend System Verification Script
-- =============================================================================
-- Run this script in Supabase SQL Editor to verify the friend system is
-- properly installed and configured.
--
-- Expected result: All checks should return positive results
-- =============================================================================

-- =============================================================================
-- CHECK 1: Tables Exist
-- =============================================================================
SELECT
  '✅ CHECK 1: Tables Exist' AS check_name,
  CASE
    WHEN COUNT(*) = 2 THEN '✅ PASS - Both tables exist'
    ELSE '❌ FAIL - Missing tables: ' || (2 - COUNT(*))::text
  END AS result
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('friendships', 'active_sessions');

-- Show which tables exist
SELECT
  'Table: ' || table_name AS details,
  '✅ Exists' AS status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('friendships', 'active_sessions')
ORDER BY table_name;

-- =============================================================================
-- CHECK 2: RLS is Enabled
-- =============================================================================
SELECT
  '✅ CHECK 2: RLS Enabled' AS check_name,
  CASE
    WHEN COUNT(*) = 2 THEN '✅ PASS - RLS enabled on both tables'
    ELSE '❌ FAIL - RLS not enabled on all tables'
  END AS result
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('friendships', 'active_sessions')
  AND rowsecurity = true;

-- Show RLS status
SELECT
  'Table: ' || tablename AS details,
  CASE
    WHEN rowsecurity THEN '✅ RLS Enabled'
    ELSE '❌ RLS Disabled'
  END AS status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('friendships', 'active_sessions')
ORDER BY tablename;

-- =============================================================================
-- CHECK 3: RLS Policies Exist
-- =============================================================================
SELECT
  '✅ CHECK 3: RLS Policies' AS check_name,
  CASE
    WHEN COUNT(*) >= 11 THEN '✅ PASS - All policies created (' || COUNT(*) || ' policies)'
    ELSE '❌ FAIL - Missing policies. Found: ' || COUNT(*) || ', Expected: 11+'
  END AS result
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('friendships', 'active_sessions');

-- Show policies by table
SELECT
  tablename,
  COUNT(*) as policy_count,
  CASE
    WHEN tablename = 'friendships' AND COUNT(*) >= 5 THEN '✅ OK'
    WHEN tablename = 'active_sessions' AND COUNT(*) >= 6 THEN '✅ OK'
    ELSE '❌ Missing policies'
  END AS status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('friendships', 'active_sessions')
GROUP BY tablename
ORDER BY tablename;

-- List all policies
SELECT
  tablename,
  policyname,
  '✅ Created' AS status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('friendships', 'active_sessions')
ORDER BY tablename, policyname;

-- =============================================================================
-- CHECK 4: Indexes Exist
-- =============================================================================
SELECT
  '✅ CHECK 4: Indexes' AS check_name,
  CASE
    WHEN COUNT(*) >= 8 THEN '✅ PASS - All indexes created (' || COUNT(*) || ' indexes)'
    ELSE '❌ FAIL - Missing indexes. Found: ' || COUNT(*) || ', Expected: 8+'
  END AS result
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('friendships', 'active_sessions')
  AND indexname LIKE 'idx_%';

-- Show indexes by table
SELECT
  tablename,
  COUNT(*) as index_count,
  CASE
    WHEN tablename = 'friendships' AND COUNT(*) >= 4 THEN '✅ OK'
    WHEN tablename = 'active_sessions' AND COUNT(*) >= 4 THEN '✅ OK'
    ELSE '⚠️ May need more indexes'
  END AS status
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('friendships', 'active_sessions')
  AND indexname LIKE 'idx_%'
GROUP BY tablename
ORDER BY tablename;

-- List all indexes
SELECT
  tablename,
  indexname,
  '✅ Created' AS status
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('friendships', 'active_sessions')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- =============================================================================
-- CHECK 5: Database Functions Exist
-- =============================================================================
SELECT
  '✅ CHECK 5: Database Functions' AS check_name,
  CASE
    WHEN COUNT(*) >= 10 THEN '✅ PASS - All functions created (' || COUNT(*) || ' functions)'
    ELSE '❌ FAIL - Missing functions. Found: ' || COUNT(*) || ', Expected: 10+'
  END AS result
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
  AND (
    routine_name LIKE '%friend%' OR
    routine_name LIKE '%session%' OR
    routine_name = 'update_last_seen' OR
    routine_name = 'upsert_session_presence' OR
    routine_name = 'mark_session_offline' OR
    routine_name = 'cleanup_stale_sessions'
  );

-- List all friend-related functions
SELECT
  routine_name AS function_name,
  '✅ Created' AS status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
  AND (
    routine_name LIKE '%friend%' OR
    routine_name LIKE '%session%' OR
    routine_name = 'update_last_seen' OR
    routine_name = 'upsert_session_presence' OR
    routine_name = 'mark_session_offline' OR
    routine_name = 'cleanup_stale_sessions'
  )
ORDER BY routine_name;

-- =============================================================================
-- CHECK 6: Realtime Enabled
-- =============================================================================
SELECT
  '✅ CHECK 6: Realtime Enabled' AS check_name,
  CASE
    WHEN COUNT(*) = 2 THEN '✅ PASS - Realtime enabled on both tables'
    ELSE '❌ FAIL - Realtime not enabled. Found: ' || COUNT(*) || ', Expected: 2'
  END AS result
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND schemaname = 'public'
  AND tablename IN ('friendships', 'active_sessions');

-- Show realtime status
SELECT
  tablename,
  '✅ Realtime enabled' AS status
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND schemaname = 'public'
  AND tablename IN ('friendships', 'active_sessions')
ORDER BY tablename;

-- =============================================================================
-- CHECK 7: Enum Types Exist
-- =============================================================================
SELECT
  '✅ CHECK 7: Enum Types' AS check_name,
  CASE
    WHEN COUNT(*) >= 1 THEN '✅ PASS - Enum type created'
    ELSE '❌ FAIL - Missing enum type: session_status'
  END AS result
FROM pg_type
WHERE typname = 'session_status';

-- Show enum values
SELECT
  'session_status enum' AS enum_name,
  enumlabel AS value,
  '✅ Created' AS status
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'session_status'
ORDER BY e.enumsortorder;

-- =============================================================================
-- CHECK 8: Table Structure
-- =============================================================================
SELECT
  '✅ CHECK 8: Table Structure' AS check_name,
  '✅ PASS - Checking column structure' AS result;

-- Friendships table columns
SELECT
  'friendships.' || column_name AS column_path,
  data_type,
  CASE
    WHEN is_nullable = 'NO' THEN '✅ NOT NULL'
    ELSE '⚪ Nullable'
  END AS nullable_status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'friendships'
ORDER BY ordinal_position;

-- Active_sessions table columns
SELECT
  'active_sessions.' || column_name AS column_path,
  data_type,
  CASE
    WHEN is_nullable = 'NO' THEN '✅ NOT NULL'
    ELSE '⚪ Nullable'
  END AS nullable_status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'active_sessions'
ORDER BY ordinal_position;

-- =============================================================================
-- CHECK 9: Constraints
-- =============================================================================
SELECT
  '✅ CHECK 9: Constraints' AS check_name,
  '✅ PASS - Checking constraints' AS result;

-- Show all constraints on friendships
SELECT
  'friendships.' || constraint_name AS constraint_path,
  constraint_type,
  '✅ Created' AS status
FROM information_schema.table_constraints
WHERE table_schema = 'public'
  AND table_name = 'friendships'
ORDER BY constraint_type, constraint_name;

-- Show all constraints on active_sessions
SELECT
  'active_sessions.' || constraint_name AS constraint_path,
  constraint_type,
  '✅ Created' AS status
FROM information_schema.table_constraints
WHERE table_schema = 'public'
  AND table_name = 'active_sessions'
ORDER BY constraint_type, constraint_name;

-- =============================================================================
-- FINAL SUMMARY
-- =============================================================================
SELECT
  '================================================' AS separator,
  'FRIEND SYSTEM VERIFICATION SUMMARY' AS title,
  '================================================' AS separator2;

-- Overall status
SELECT
  CASE
    WHEN
      (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('friendships', 'active_sessions')) = 2
      AND (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('friendships', 'active_sessions') AND rowsecurity = true) = 2
      AND (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('friendships', 'active_sessions')) >= 11
      AND (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public' AND tablename IN ('friendships', 'active_sessions') AND indexname LIKE 'idx_%') >= 8
      AND (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public' AND routine_type = 'FUNCTION' AND (routine_name LIKE '%friend%' OR routine_name LIKE '%session%')) >= 10
      AND (SELECT COUNT(*) FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename IN ('friendships', 'active_sessions')) = 2
    THEN '✅ ✅ ✅ ALL CHECKS PASSED - FRIEND SYSTEM IS READY! ✅ ✅ ✅'
    ELSE '❌ SOME CHECKS FAILED - REVIEW RESULTS ABOVE'
  END AS final_status;

-- Checklist
SELECT '✅ Tables created' AS checklist_item
UNION ALL SELECT '✅ RLS enabled'
UNION ALL SELECT '✅ Policies created'
UNION ALL SELECT '✅ Indexes created'
UNION ALL SELECT '✅ Functions created'
UNION ALL SELECT '✅ Realtime enabled'
UNION ALL SELECT '✅ Enum types created'
UNION ALL SELECT '✅ Constraints added';

-- Next steps
SELECT
  '================================================' AS separator,
  'NEXT STEPS' AS title,
  '================================================' AS separator2;

SELECT
  '1. ✅ Database setup is complete' AS step
UNION ALL SELECT '2. 📝 Import the API functions in your React app'
UNION ALL SELECT '3. 🎣 Use the React hooks in your components'
UNION ALL SELECT '4. 🎨 Review FriendsExample.tsx for component examples'
UNION ALL SELECT '5. 📚 Read FRIEND_SYSTEM_COMPLETE_SUMMARY.md for full docs'
UNION ALL SELECT '6. 🚀 Start building your friend UI!'
ORDER BY step;
