-- Add admin policy to view all profiles
-- This allows admins to see all users in the admin panel and session creators

-- First, create a helper function that bypasses RLS to check if user is admin
-- This prevents infinite recursion when the profiles policy checks if user is admin
CREATE OR REPLACE FUNCTION "public"."is_admin"()
RETURNS boolean
LANGUAGE "plpgsql"
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- Now create the policy using the helper function
CREATE POLICY "Admins can view all profiles"
ON "public"."profiles"
FOR SELECT
TO "authenticated"
USING (is_admin());
