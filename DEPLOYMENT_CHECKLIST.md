# Deployment Checklist - Backend Infrastructure

## Quick Reference for Deploying Account Deletion Features

---

## Prerequisites

- [ ] Supabase CLI installed (`npm install -g supabase`)
- [ ] Logged in to Supabase (`supabase login`)
- [ ] Project linked (`supabase link --project-ref <your-project-ref>`)

---

## Step 1: Deploy Database Migrations

### Option A: Using Supabase CLI (Recommended)

```bash
cd C:/Users/Felles/Documents/Projects/Drikkescore

# Push all pending migrations
supabase db push

# Or push specific migration
supabase db push --version 20251105000001
supabase db push --version 20251105000002
```

### Option B: Manual SQL Execution

1. Log into Supabase Dashboard
2. Navigate to **SQL Editor**
3. Run migrations in order:
   - `supabase/migrations/20251105000001_add_terms_acceptance.sql`
   - `supabase/migrations/20251105000002_delete_drinking_data_function.sql`

### Verify Migrations:

```sql
-- Check columns exist
SELECT column_name FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name IN ('has_accepted_terms', 'terms_accepted_at', 'privacy_policy_version');

-- Check function exists
SELECT routine_name FROM information_schema.routines
WHERE routine_name = 'delete_user_drinking_data';
```

**Expected Results:**
- 3 columns returned (has_accepted_terms, terms_accepted_at, privacy_policy_version)
- 1 function returned (delete_user_drinking_data)

---

## Step 2: Deploy Edge Function

```bash
# Deploy the delete-user-account function
supabase functions deploy delete-user-account

# Verify deployment
supabase functions list
```

**Expected Output:**
```
delete-user-account  deployed  v1  2025-11-05
```

### Test Edge Function:

```bash
# Get your function URL
supabase functions list --format json

# Test with curl (replace with actual JWT token)
curl -X POST \
  https://<project-ref>.supabase.co/functions/v1/delete-user-account \
  -H "Authorization: Bearer <user-jwt-token>" \
  -H "Content-Type: application/json"
```

---

## Step 3: Verify Environment Variables

Edge functions automatically have access to:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

To verify:
```bash
supabase secrets list
```

---

## Step 4: Test Functionality

### Test 1: Terms Acceptance Columns

```typescript
// In your app
import { supabase } from './lib/supabase';

const { data, error } = await supabase
  .from('profiles')
  .update({
    has_accepted_terms: true,
    terms_accepted_at: new Date().toISOString(),
    privacy_policy_version: 1
  })
  .eq('id', userId);
```

### Test 2: Delete Drinking Data

```typescript
import { deleteUserDrinkingData } from './api/users';

const result = await deleteUserDrinkingData(userId);
console.log(result); // { drinks_deleted: X, participations_deleted: Y, sessions_deleted: Z }
```

### Test 3: Delete Account

```typescript
import { deleteUserAccount } from './api/users';

const result = await deleteUserAccount();
console.log(result); // { success: true, message: "...", deleted_data: {...} }
```

---

## Step 5: Monitor and Debug

### View Edge Function Logs:
```bash
supabase functions logs delete-user-account
```

### Check Database Logs:
```bash
supabase db logs
```

### Monitor Errors:
- Check Supabase Dashboard > Edge Functions > Logs
- Check Browser console for client-side errors
- Check Network tab for API responses

---

## Rollback Plan

### Rollback Migrations:

```bash
# List migrations
supabase migration list

# Rollback to previous version
supabase db reset --version <previous-version>
```

### Rollback Edge Function:

```bash
# Deploy previous version or delete function
supabase functions delete delete-user-account
```

---

## Production Checklist

Before deploying to production:

- [ ] All migrations tested locally
- [ ] Edge function tested with real user accounts
- [ ] TypeScript compilation successful
- [ ] No console errors in development
- [ ] RLS policies verified
- [ ] Foreign key constraints verified
- [ ] Backup database before migration
- [ ] Terms of service and privacy policy documents ready
- [ ] User notifications/emails prepared
- [ ] Support documentation updated
- [ ] Monitoring and alerting configured

---

## Quick Commands Reference

```bash
# Deploy everything
supabase db push && supabase functions deploy delete-user-account

# Check status
supabase db status && supabase functions list

# View logs
supabase functions logs delete-user-account --follow

# Test locally
supabase start  # Start local instance
supabase functions serve delete-user-account  # Serve function locally

# Stop local instance
supabase stop
```

---

## Troubleshooting

### Issue: Migration fails with "column already exists"
**Solution:** This is expected if migration was run before. The `IF NOT EXISTS` clause prevents errors.

### Issue: Edge function returns 401 Unauthorized
**Solution:** Verify JWT token is valid and user is authenticated.

### Issue: Edge function returns 500 Internal Server Error
**Solution:** Check function logs with `supabase functions logs delete-user-account`

### Issue: User data not deleted
**Solution:** Verify foreign key constraints have `ON DELETE CASCADE`.

### Issue: Avatar not deleted from storage
**Solution:** Check storage bucket name and user has avatar files. Avatar deletion failure doesn't block account deletion.

---

## Support Resources

- **Supabase Documentation:** https://supabase.com/docs
- **Edge Functions Guide:** https://supabase.com/docs/guides/functions
- **Database Migrations:** https://supabase.com/docs/guides/cli/local-development#database-migrations
- **RLS Policies:** https://supabase.com/docs/guides/auth/row-level-security

---

## Files Modified/Created

**Database Migrations:**
- `supabase/migrations/20251105000001_add_terms_acceptance.sql`
- `supabase/migrations/20251105000002_delete_drinking_data_function.sql`

**Edge Functions:**
- `supabase/functions/delete-user-account/index.ts`

**TypeScript:**
- `src/types/database.ts` (modified)
- `src/api/users.ts` (modified)

**Documentation:**
- `BACKEND_INFRASTRUCTURE_SUMMARY.md` (created)
- `DEPLOYMENT_CHECKLIST.md` (this file)
