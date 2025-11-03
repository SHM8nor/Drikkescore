# Supabase Database Updates for Admin Role

This file contains the SQL commands to manually execute in your Supabase SQL Editor.

## Step 1: Add Admin Role Column to Profiles

```sql
-- Add role column to profiles table with default value 'user'
ALTER TABLE profiles
ADD COLUMN role TEXT DEFAULT 'user'
CHECK (role IN ('user', 'admin'));
```

## Step 2: Create Admin RLS Policies for Sessions Table

### Allow admins to view all sessions

```sql
CREATE POLICY "Admins can view all sessions"
ON sessions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
```

### Allow admins to delete any session

```sql
CREATE POLICY "Admins can delete any sessions"
ON sessions
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
```

### Allow admins to update any session

```sql
CREATE POLICY "Admins can update any sessions"
ON sessions
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
```

## Step 3: Set Your Account as Admin

**IMPORTANT:** Replace `YOUR_USER_ID_HERE` with your actual user ID from Supabase Auth.

To find your user ID:
1. Go to Supabase Dashboard → Authentication → Users
2. Find your account and copy the UUID
3. Replace it in the command below

```sql
-- Set your account as admin (replace YOUR_USER_ID_HERE with your actual user ID)
UPDATE profiles
SET role = 'admin'
WHERE id = 'YOUR_USER_ID_HERE';
```

## Step 4: Verify the Changes

```sql
-- Check if role column was added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'role';

-- Verify your admin status
SELECT id, full_name, role
FROM profiles
WHERE role = 'admin';

-- Check RLS policies for sessions table
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'sessions'
AND policyname LIKE '%Admin%';
```

## Notes

- These policies **add** admin permissions without removing existing user permissions
- Regular users can still view/manage their own sessions (existing RLS policies)
- Admins get **additional** permissions to view/edit/delete **all** sessions
- The `role` column defaults to `'user'` for all new users
- Only manually promoted users will have `role = 'admin'`

## Rollback (if needed)

If you need to undo these changes:

```sql
-- Remove admin policies
DROP POLICY IF EXISTS "Admins can view all sessions" ON sessions;
DROP POLICY IF EXISTS "Admins can delete any sessions" ON sessions;
DROP POLICY IF EXISTS "Admins can update any sessions" ON sessions;

-- Remove role column (this will delete all role data!)
ALTER TABLE profiles DROP COLUMN IF EXISTS role;
```
