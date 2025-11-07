-- Cleanup duplicate RLS policies on profiles table
-- Run this to remove the old duplicate policies

-- Remove the old policies (without "their")
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Verify only 3 policies remain (the ones with "their own")
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'profiles'
ORDER BY cmd, policyname;
