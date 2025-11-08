# Badge Icon Storage Setup

This document describes the Supabase Storage setup for badge icons and provides usage examples.

## Overview

Badge icons are stored in a **public storage bucket** named `badge-icons` with the following configuration:

- **Public read access**: Anyone can view/download badge icons
- **Admin-only write access**: Only users with `role='admin'` can upload/update/delete
- **File size limit**: 2MB maximum
- **Allowed formats**: PNG, JPG, JPEG, SVG, WebP
- **Max dimensions**: 1024x1024 pixels (for raster images)

## Migration Applied

The migration file creates:
- Storage bucket `badge-icons` with public access
- RLS policies for secure access control
- File size and MIME type restrictions

**Migration File**: `supabase/migrations/20251108130000_create_badge_icons_storage.sql`

## Utility Functions

The `src/utils/storageHelpers.ts` file provides the following functions:

### 1. `uploadBadgeIcon(file: File, badgeCode?: string): Promise<UploadResult>`

Uploads a badge icon and returns the public URL.

**Parameters:**
- `file`: The image File object to upload
- `badgeCode`: Optional badge code to use as filename (e.g., `"first_drink"` → `first_drink.png`)

**Returns:**
```typescript
{
  url: string,   // Public URL for display
  path: string   // Storage path (for deletion)
}
```

**Example:**
```typescript
import { uploadBadgeIcon } from '@/utils/storageHelpers';

async function handleBadgeIconUpload(file: File) {
  try {
    const result = await uploadBadgeIcon(file, 'first_drink');
    console.log('Upload successful!');
    console.log('Public URL:', result.url);
    console.log('Storage path:', result.path);

    // Update badge record with the icon URL
    await supabase
      .from('badges')
      .update({ icon_url: result.url })
      .eq('code', 'first_drink');

  } catch (error) {
    console.error('Upload failed:', error.message);
  }
}
```

### 2. `validateBadgeIcon(file: File): Promise<ImageValidationResult>`

Validates an image file before upload.

**Returns:**
```typescript
{
  valid: boolean,
  error?: string  // Error message if validation fails
}
```

**Example:**
```typescript
import { validateBadgeIcon } from '@/utils/storageHelpers';

async function checkFileBeforeUpload(file: File) {
  const validation = await validateBadgeIcon(file);

  if (!validation.valid) {
    alert(`Invalid file: ${validation.error}`);
    return;
  }

  // Proceed with upload
  await uploadBadgeIcon(file);
}
```

### 3. `deleteBadgeIcon(urlOrPath: string): Promise<void>`

Deletes a badge icon from storage.

**Parameters:**
- `urlOrPath`: Can be either:
  - Full public URL: `https://xxx.supabase.co/storage/v1/object/public/badge-icons/first_drink.png`
  - Storage path: `first_drink.png`

**Example:**
```typescript
import { deleteBadgeIcon } from '@/utils/storageHelpers';

async function removeOldBadgeIcon(iconUrl: string) {
  try {
    await deleteBadgeIcon(iconUrl);
    console.log('Badge icon deleted successfully');
  } catch (error) {
    console.error('Delete failed:', error.message);
  }
}
```

### 4. `getBadgeIconUrl(path: string): string`

Converts a storage path to a public URL.

**Example:**
```typescript
import { getBadgeIconUrl } from '@/utils/storageHelpers';

const path = 'first_drink.png';
const url = getBadgeIconUrl(path);
// Returns: https://xxx.supabase.co/storage/v1/object/public/badge-icons/first_drink.png
```

### 5. `listBadgeIcons(): Promise<FileObject[]>`

Lists all badge icons in storage (admin only).

**Example:**
```typescript
import { listBadgeIcons } from '@/utils/storageHelpers';

async function showAllBadgeIcons() {
  const icons = await listBadgeIcons();
  console.log('Available icons:', icons.map(f => f.name));
}
```

## Complete Admin Panel Example

Here's a complete example of a badge icon upload form for the admin panel:

```typescript
import React, { useState } from 'react';
import { uploadBadgeIcon, validateBadgeIcon } from '@/utils/storageHelpers';
import { supabase } from '@/lib/supabase';
import { Button, TextField, Alert, CircularProgress } from '@mui/material';

export function BadgeIconUploader({ badgeCode }: { badgeCode: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate immediately
    const validation = await validateBadgeIcon(selectedFile);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Upload the icon
      const { url } = await uploadBadgeIcon(file, badgeCode);

      // Update the badge record with the new icon URL
      const { error: updateError } = await supabase
        .from('badges')
        .update({ icon_url: url })
        .eq('code', badgeCode);

      if (updateError) throw updateError;

      setSuccess(true);
      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
        onChange={handleFileChange}
        disabled={loading}
      />

      {file && (
        <Button
          onClick={handleUpload}
          disabled={loading}
          variant="contained"
        >
          {loading ? <CircularProgress size={24} /> : 'Upload Icon'}
        </Button>
      )}

      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">Icon uploaded successfully!</Alert>}
    </div>
  );
}
```

## Validation Rules

The `validateBadgeIcon` function enforces the following rules:

1. **File Size**: Maximum 2MB
2. **File Type**: Must be PNG, JPG, JPEG, SVG, or WebP
3. **Dimensions**: Maximum 1024x1024 pixels (raster images only, SVG exempt)

Validation errors include helpful messages:
- `"File size must be less than 2MB. Current size: 2.5MB"`
- `"Invalid file type. Allowed types: PNG, JPG, JPEG, SVG, WebP. Got: image/gif"`
- `"Image dimensions must be 1024x1024px or smaller. Got: 2048x2048px"`

## Security Considerations

### RLS Policies

The storage bucket uses Row Level Security (RLS) policies to enforce access control:

1. **Public Read**: Anyone (authenticated or anonymous) can view badge icons
2. **Admin Write**: Only admins can upload, update, or delete icons
3. **Function-based Auth**: Uses the existing `is_admin()` function for consistency

### Admin Check

The `is_admin()` function (defined in `20251107210000_add_admin_profiles_policy.sql`) checks:
```sql
SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
```

This ensures that only users with `role='admin'` in the profiles table can modify badge icons.

### File Validation

Client-side validation prevents:
- Oversized files (>2MB)
- Invalid file types
- Oversized images (>1024x1024px)

Server-side validation is also enforced through:
- Storage bucket `file_size_limit` configuration
- Storage bucket `allowed_mime_types` configuration

## Error Handling

All functions throw descriptive errors that can be caught and displayed to users:

```typescript
try {
  await uploadBadgeIcon(file, 'invalid_badge');
} catch (error) {
  if (error instanceof Error) {
    // Possible error messages:
    // - "File size must be less than 2MB..."
    // - "Invalid file type..."
    // - "Image dimensions must be..."
    // - "Failed to upload badge icon: ..."
    console.error(error.message);
  }
}
```

## Integration with Badge System

Badge icons integrate with the badge system tables:

1. Upload icon using `uploadBadgeIcon()`
2. Store the public URL in `badges.icon_url`
3. Display icons using the URL from the database

Example workflow:
```typescript
// 1. Create badge
const { data: badge } = await supabase
  .from('badges')
  .insert({
    code: 'first_drink',
    title: 'First Drink',
    description: 'Had your first drink',
    category: 'milestone',
    tier: 'bronze',
    tier_order: 1,
    criteria: { drinks: 1 },
    icon_url: null // No icon yet
  })
  .select()
  .single();

// 2. Upload icon
const { url } = await uploadBadgeIcon(iconFile, 'first_drink');

// 3. Update badge with icon URL
await supabase
  .from('badges')
  .update({ icon_url: url })
  .eq('code', 'first_drink');
```

## Testing Checklist

Before deploying, verify:

- [ ] Migration runs successfully (`supabase migration up`)
- [ ] Storage bucket exists in Supabase dashboard
- [ ] RLS policies are active (check "Storage" → "Policies")
- [ ] Admin users can upload icons
- [ ] Non-admin users cannot upload icons
- [ ] All users can view icon URLs
- [ ] File validation works (try uploading 3MB file, GIF, etc.)
- [ ] Icons display correctly in the UI

## Rollback

If you need to remove the storage bucket and policies:

```sql
-- Delete all RLS policies
DROP POLICY IF EXISTS "Badge icons are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload badge icons" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update badge icons" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete badge icons" ON storage.objects;

-- Delete the bucket (this will also delete all files)
DELETE FROM storage.buckets WHERE id = 'badge-icons';
```

**Warning**: This will permanently delete all uploaded badge icons.
