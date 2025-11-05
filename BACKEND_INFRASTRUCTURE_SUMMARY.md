# Backend Infrastructure Implementation Summary

## Overview
This document summarizes the backend components implemented for the disclaimer/privacy acceptance and account deletion features for the Drikkescore app.

**Implementation Date:** 2025-11-05
**Author:** Claude Code
**Workstream:** Database & Backend Infrastructure

---

## Files Created/Modified

### 1. Database Migrations

#### `supabase/migrations/20251105000001_add_terms_acceptance.sql`
**Purpose:** Adds columns to the `profiles` table for tracking user acceptance of terms of service and privacy policy.

**Changes:**
- Added `has_accepted_terms` (BOOLEAN, DEFAULT FALSE)
- Added `terms_accepted_at` (TIMESTAMPTZ, NULL)
- Added `privacy_policy_version` (INTEGER, DEFAULT 1)
- Created index on `has_accepted_terms` for efficient querying

**Migration Details:**
```sql
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS has_accepted_terms BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ NULL,
ADD COLUMN IF NOT EXISTS privacy_policy_version INTEGER DEFAULT 1;
```

---

#### `supabase/migrations/20251105000002_delete_drinking_data_function.sql`
**Purpose:** Creates a Postgres function that allows users to delete their drinking data without deleting their entire account.

**Function:** `delete_user_drinking_data(target_user_id UUID)`

**Functionality:**
- Verifies that the user can only delete their own data (auth.uid() check)
- Deletes drink entries for the user
- Removes user from session participations
- Deletes orphaned sessions (where user was sole creator and no participants remain)
- Returns JSON summary of deleted records

**Security:**
- `SECURITY DEFINER` function with built-in authorization check
- Granted to `authenticated` users only
- Prevents users from deleting other users' data

**Return Value:**
```json
{
  "drinks_deleted": <count>,
  "participations_deleted": <count>,
  "sessions_deleted": <count>,
  "success": true
}
```

---

### 2. Edge Functions

#### `supabase/functions/delete-user-account/index.ts`
**Purpose:** Supabase Edge Function for complete account deletion with admin privileges.

**Functionality:**
1. Validates JWT token to ensure user can only delete their own account
2. Uses Supabase admin client (service role) for privileged operations
3. Deletes user's avatar from storage bucket (`avatars/{user_id}/*`)
4. Deletes user from `auth.users` (cascades to all related data)
5. Returns detailed success/error responses

**Security Features:**
- CORS headers configured
- JWT validation
- Service role key for admin operations
- Comprehensive error handling

**Cascade Behavior:**
When a user is deleted from `auth.users`, the following tables are automatically cleaned up via foreign key constraints:
- `profiles` (ON DELETE CASCADE)
- `sessions` (via created_by reference)
- `session_participants` (via user_id reference)
- `drink_entries` (via user_id reference)
- `friendships` (via user_id/friend_id references)
- `active_sessions` (via user_id reference)

**Response Format:**
```typescript
{
  success: boolean;
  message: string;
  deleted_data?: {
    avatar_deleted: boolean;
    user_deleted: boolean;
  };
}
```

---

### 3. TypeScript Types

#### `src/types/database.ts` (Modified)
**Purpose:** Updated the `Profile` interface to include new terms acceptance fields.

**Added Fields:**
```typescript
export interface Profile {
  // ... existing fields ...
  has_accepted_terms: boolean;
  terms_accepted_at: string | null;
  privacy_policy_version: number;
  // ... existing fields ...
}
```

---

### 4. API Functions

#### `src/api/users.ts` (Modified)
**Purpose:** Added TypeScript helper functions for account deletion features.

**New Functions:**

##### `deleteUserDrinkingData(userId: string): Promise<DeleteDrinkingDataResult>`
- Calls the `delete_user_drinking_data` RPC function
- Deletes drinking data only (not account)
- Returns summary of deleted records
- Throws `UserSearchError` on failure

**Example Usage:**
```typescript
import { deleteUserDrinkingData } from './api/users';

const result = await deleteUserDrinkingData(userId);
console.log(`Deleted ${result.drinks_deleted} drinks`);
```

##### `deleteUserAccount(): Promise<DeleteAccountResult>`
- Calls the `delete-user-account` Edge Function
- Completely deletes the user account
- Requires active session
- Returns success status and deletion details
- Throws `UserSearchError` on failure

**Example Usage:**
```typescript
import { deleteUserAccount } from './api/users';

const result = await deleteUserAccount();
if (result.success) {
  console.log('Account deleted successfully');
}
```

**New Type Exports:**
- `DeleteDrinkingDataResult`
- `DeleteAccountResult`

---

## SQL to Run Manually

### Option 1: Using Supabase CLI (Recommended)
```bash
# Run migrations in order
supabase db push

# Or run specific migrations
supabase migration up --version 20251105000001
supabase migration up --version 20251105000002
```

### Option 2: Direct SQL Execution
Run the following files in order through Supabase Dashboard > SQL Editor:

1. `supabase/migrations/20251105000001_add_terms_acceptance.sql`
2. `supabase/migrations/20251105000002_delete_drinking_data_function.sql`

**Verification Queries:**
```sql
-- Verify terms acceptance columns
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN ('has_accepted_terms', 'terms_accepted_at', 'privacy_policy_version');

-- Verify delete function exists
SELECT routine_name, routine_type, data_type
FROM information_schema.routines
WHERE routine_name = 'delete_user_drinking_data';
```

---

## Deployment Steps

### 1. Deploy Migrations
```bash
# Using Supabase CLI
cd C:/Users/Felles/Documents/Projects/Drikkescore
supabase db push
```

### 2. Deploy Edge Function
```bash
# Deploy the delete-user-account function
supabase functions deploy delete-user-account

# Set required environment variables (if not already set)
# These are typically available automatically in Supabase
supabase secrets set SUPABASE_URL=<your-supabase-url>
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

**Note:** The Edge Function requires the `SUPABASE_SERVICE_ROLE_KEY` to be set in the Supabase environment. This is typically available automatically.

### 3. Verify Deployment
```bash
# List deployed functions
supabase functions list

# Check function logs
supabase functions logs delete-user-account
```

---

## Testing Recommendations

### 1. Database Migration Testing

**Test Terms Acceptance Columns:**
```sql
-- Insert test data
UPDATE profiles
SET has_accepted_terms = TRUE,
    terms_accepted_at = NOW(),
    privacy_policy_version = 1
WHERE id = '<test-user-id>';

-- Verify data
SELECT id, has_accepted_terms, terms_accepted_at, privacy_policy_version
FROM profiles
WHERE id = '<test-user-id>';
```

**Test Delete Drinking Data Function:**
```sql
-- Test with authenticated user
SELECT delete_user_drinking_data(auth.uid());

-- Verify data was deleted
SELECT COUNT(*) FROM drink_entries WHERE user_id = auth.uid();
SELECT COUNT(*) FROM session_participants WHERE user_id = auth.uid();
```

### 2. Edge Function Testing

**Test Delete Account Function:**
```bash
# Using curl (replace with actual values)
curl -X POST \
  https://<project-ref>.supabase.co/functions/v1/delete-user-account \
  -H "Authorization: Bearer <user-jwt-token>" \
  -H "Content-Type: application/json"
```

**Test in Application:**
```typescript
import { deleteUserAccount } from './api/users';

// In a test component/page
try {
  const result = await deleteUserAccount();
  console.log('Account deletion result:', result);
} catch (error) {
  console.error('Failed to delete account:', error);
}
```

### 3. Integration Testing

**Create Test Scenarios:**

1. **Terms Acceptance Flow:**
   - User registers without accepting terms (`has_accepted_terms = FALSE`)
   - User accepts terms (update to `TRUE`, set `terms_accepted_at`)
   - Verify user can access features after acceptance

2. **Delete Drinking Data:**
   - Create test user with drink entries, sessions, participations
   - Call `deleteUserDrinkingData()`
   - Verify data deleted but profile remains
   - Verify user can still log in

3. **Delete Account:**
   - Create test user with complete data (profile, drinks, sessions, avatar)
   - Call `deleteUserAccount()`
   - Verify user deleted from auth.users
   - Verify all related data cascade deleted
   - Verify avatar removed from storage
   - Verify user cannot log in

### 4. Security Testing

**Authorization Tests:**
```typescript
// Test 1: User tries to delete another user's data (should fail)
try {
  await deleteUserDrinkingData('<another-user-id>');
  // Should throw error
} catch (error) {
  console.log('Correctly blocked unauthorized deletion');
}

// Test 2: Unauthenticated request (should fail)
// Make request without valid JWT token
```

**RLS Policy Verification:**
```sql
-- Verify RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('profiles', 'friendships', 'sessions');

-- Test as different users
SET request.jwt.claim.sub = '<user-id>';
SELECT * FROM profiles; -- Should only see own profile
```

---

## Environment Variables Required

### For Edge Function Deployment:
- `SUPABASE_URL` - Your Supabase project URL (auto-available)
- `SUPABASE_ANON_KEY` - Public anon key (auto-available)
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key with admin privileges (auto-available)

**Note:** These are typically pre-configured in the Supabase environment and don't need manual setup.

---

## Known Limitations and Considerations

1. **Avatar Deletion:**
   - If avatar deletion fails, the user account deletion will still proceed
   - This prevents orphaned data in `auth.users` if storage fails
   - Consider implementing a cleanup job for orphaned storage files

2. **Edge Function Cold Starts:**
   - First invocation after idle period may be slower
   - Consider warming the function for production use

3. **Cascade Deletes:**
   - Relies on database foreign key constraints
   - Ensure foreign keys have `ON DELETE CASCADE` configured
   - Test thoroughly to verify all related data is cleaned up

4. **Data Recovery:**
   - **Account deletion is permanent and irreversible**
   - Consider implementing a soft-delete with grace period
   - Or export user data before deletion

5. **Active Sessions:**
   - Users with active sessions in progress will lose all session data
   - Consider warning users about data loss
   - Consider preventing deletion during active sessions

---

## Next Steps (Frontend Integration)

1. **Create Terms Acceptance UI:**
   - Add checkbox/modal for terms acceptance during registration
   - Update profile creation to set `has_accepted_terms = TRUE`
   - Store `terms_accepted_at` timestamp

2. **Create Account Settings Page:**
   - Add "Delete Drinking Data" button
   - Add "Delete Account" button (with confirmation)
   - Show current `privacy_policy_version`

3. **Implement Confirmation Dialogs:**
   - Two-step confirmation for account deletion
   - Warning about permanent data loss
   - Export data option before deletion

4. **Add Loading States:**
   - Show progress during deletion operations
   - Handle errors gracefully
   - Redirect after successful account deletion

5. **Update Registration Flow:**
   - Check `has_accepted_terms` after login
   - Show terms acceptance modal if not accepted
   - Block access to features until terms accepted

---

## Code Quality Checklist

- [x] TypeScript strict mode compliance
- [x] Comprehensive error handling
- [x] JSDoc comments for all functions
- [x] Security best practices (RLS, auth checks)
- [x] CORS configuration for Edge Function
- [x] Detailed logging for debugging
- [x] Type safety with explicit interfaces
- [x] Follows existing codebase patterns
- [x] Database migrations are idempotent (IF NOT EXISTS)
- [x] Functions use SECURITY DEFINER appropriately

---

## Summary

All backend infrastructure for the disclaimer/privacy acceptance and account deletion features has been successfully implemented:

**Database Schema:**
- 3 new columns added to `profiles` table
- 1 new Postgres function for deleting drinking data
- Proper indexing and documentation

**Edge Functions:**
- 1 new Edge Function for complete account deletion
- Admin privileges via service role
- Comprehensive error handling

**TypeScript Integration:**
- Updated types to reflect database changes
- 2 new API helper functions
- Full type safety maintained

**Ready for:**
- Frontend integration (Workstream 2)
- User testing
- Production deployment (after testing)

---

## Support and Documentation

For questions or issues:
1. Review this implementation summary
2. Check Supabase documentation: https://supabase.com/docs
3. Review existing migration files in `guidelines/`
4. Test using the provided verification queries
