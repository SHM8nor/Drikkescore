# Database Setup Instructions

## Issue: Profile Creation Failing Due to RLS

You're seeing this error during signup:
```
new row violates row-level security policy for table "profiles"
```

This happens because Row Level Security (RLS) is enabled on the `profiles` table, but the INSERT policy is either missing or incorrectly configured.

## Solution: Run the Database Setup SQL

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase project dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Run the Setup SQL

1. Open the file [`database-setup.sql`](./database-setup.sql)
2. Copy the entire contents
3. Paste into the Supabase SQL Editor
4. Click **Run** (or press Ctrl+Enter)

### Step 3: Verify the Setup

After running the SQL, verify:

1. **Check RLS Policies:**
   - Go to **Authentication** > **Policies** in Supabase
   - You should see 3 policies on the `profiles` table:
     - `Users can view their own profile` (SELECT)
     - `Users can insert their own profile` (INSERT) ← **Critical for signup!**
     - `Users can update their own profile` (UPDATE)

2. **Check Trigger:**
   - Go to **Database** > **Functions** in Supabase
   - You should see `handle_new_user` function
   - This function automatically creates a profile when a user signs up

### What the SQL Does

#### 1. **RLS Policies**
- **SELECT Policy**: Users can read their own profile (`auth.uid() = id`)
- **INSERT Policy**: Users can create their own profile during signup (`auth.uid() = id`)
- **UPDATE Policy**: Users can update their own profile (`auth.uid() = id`)

#### 2. **Automatic Profile Creation Trigger**
- Creates a PostgreSQL function `handle_new_user()`
- Trigger fires after a new user is inserted into `auth.users`
- Automatically creates a corresponding row in `public.profiles`
- Uses metadata from signup (full_name, weight_kg, height_cm, gender, age)
- Has fallback values if metadata is missing

## Alternative: Manual Profile Creation for Existing Users

If you already have users without profiles (like your current account), you can:

1. **Logout from the app**
2. **Login again**
3. Click **"Retry & Recover Profile"** button
4. The app will attempt to create your profile from your account metadata

Or, run this SQL in Supabase for a specific user:

```sql
-- Replace 'USER_ID_HERE' with the actual user ID from auth.users
INSERT INTO public.profiles (id, full_name, weight_kg, height_cm, gender, age)
SELECT
  id,
  COALESCE(raw_user_meta_data->>'full_name', 'User'),
  COALESCE((raw_user_meta_data->>'weight_kg')::numeric, 70),
  COALESCE((raw_user_meta_data->>'height_cm')::numeric, 170),
  COALESCE(raw_user_meta_data->>'gender', 'male'),
  COALESCE((raw_user_meta_data->>'age')::integer, 18)
FROM auth.users
WHERE id = 'USER_ID_HERE';
```

## Testing After Setup

1. **Logout** from the app (use the logout button now visible in the top right)
2. **Create a new account** with the registration form
3. You should be successfully logged in with your profile loaded
4. Check the console - you should see:
   - `signUp: Creating profile for user: [user-id]`
   - `signUp: Profile created successfully`

## Why This Happened

The `profiles` table has RLS enabled (which is good for security), but the INSERT policy was missing or misconfigured. This prevented new users from creating their own profile row during signup.

The trigger is a **best practice** approach because:
- ✅ Works even if the client-side code fails
- ✅ Guaranteed to run for every new user
- ✅ Uses SECURITY DEFINER to bypass RLS in the trigger context
- ✅ No race conditions or timing issues

## Need Help?

If you continue to have issues:
1. Check the Supabase logs (Dashboard > Logs)
2. Verify RLS policies are active (Database > Policies)
3. Check if the trigger exists (Database > Functions)
