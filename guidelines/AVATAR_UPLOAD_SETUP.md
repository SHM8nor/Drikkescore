# Avatar Upload Feature Setup

This guide explains how to set up the profile picture upload functionality in Drikkescore.

## Overview

The avatar upload feature allows users to upload and update their profile pictures. Images are stored in Supabase Storage, and the public URL is saved in the user's profile.

## Database Changes

### 1. Add avatar_url Column to Profiles Table

Run the following SQL in your Supabase SQL Editor:

```sql
-- Add avatar_url column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add comment to the column
COMMENT ON COLUMN profiles.avatar_url IS 'Public URL to user avatar image stored in Supabase Storage';
```

Or use the migration file: `guidelines/add-avatar-url-to-profiles.sql`

## Supabase Storage Setup

### 2. Create Avatars Storage Bucket

1. Go to **Storage** in your Supabase Dashboard
2. Click **New Bucket**
3. Configure the bucket:
   - **Name**: `avatars`
   - **Public**: Yes (enable public access)
   - **File size limit**: 5 MB
   - **Allowed MIME types**: `image/jpeg`, `image/png`, `image/gif`, `image/webp`

### 3. Set Up Storage Policies

Run these policies in the Supabase SQL Editor to control access to avatar files:

```sql
-- Allow authenticated users to upload their own avatars
CREATE POLICY "Users can upload their own avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own avatars
CREATE POLICY "Users can update their own avatar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own avatars
CREATE POLICY "Users can delete their own avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to avatars
CREATE POLICY "Anyone can view avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');
```

## Feature Details

### File Validation

- **Allowed file types**: Images only (checked via MIME type)
- **Maximum file size**: 5 MB
- **Image preview**: Shows preview before upload

### Upload Flow

1. User selects an image file
2. Preview is generated using FileReader API
3. User clicks "Last opp" (Upload) button
4. File is uploaded to Supabase Storage with unique filename: `{user_id}-{timestamp}.{ext}`
5. Public URL is retrieved from Storage
6. Old avatar is deleted from Storage (if exists)
7. Profile is updated with new avatar URL
8. Success message is shown

### UI Components

- **Circular avatar preview**: 150px diameter (120px on mobile)
- **Placeholder icon**: SVG user icon when no avatar exists
- **File selection button**: "Velg bilde" (Select image)
- **Upload button**: "Last opp" (Upload) - only shown when file is selected
- **Error messages**: Displayed for validation errors or upload failures
- **File info**: Shows selected filename

### Responsive Design

- Desktop: 150px avatar, horizontal button layout
- Mobile: 120px avatar, vertical button layout with full-width buttons

## Code Changes

### TypeScript Types Updated

- **`src/types/database.ts`**: Added `avatar_url?: string` to `Profile` interface and `UpdateProfileFormData`

### Component Updated

- **`src/pages/SettingsPage.tsx`**: Added complete avatar upload functionality with:
  - State management for avatar URL, selected file, preview, and upload status
  - File validation (type and size)
  - Upload handler with Supabase Storage integration
  - Old avatar deletion when updating
  - Preview generation using FileReader
  - Error handling and success messages

### Styles Added

- **`src/styles/pages.css`**: Added complete styling for:
  - Settings page layout
  - Avatar section with circular preview
  - Avatar controls (buttons)
  - Error and file info messages
  - Responsive design for mobile devices

## Testing Checklist

- [ ] Create the `avatars` storage bucket in Supabase
- [ ] Add avatar_url column to profiles table
- [ ] Set up storage policies
- [ ] Test image upload with various file types (JPEG, PNG, GIF, WEBP)
- [ ] Test file size validation (try > 5MB file)
- [ ] Test file type validation (try non-image file)
- [ ] Test avatar update (should delete old avatar)
- [ ] Test on mobile devices (responsive design)
- [ ] Verify old avatars are deleted from storage when updated
- [ ] Check that avatar URLs are publicly accessible

## Usage

1. Navigate to Settings page (click Innstillinger)
2. Profile picture section is at the top of profile settings
3. Click "Velg bilde" to select an image
4. Preview will appear
5. Click "Last opp" to upload
6. Success message will appear when complete
7. Page will show the uploaded avatar

## Error Handling

The feature handles several error cases:

- **Invalid file type**: "Vennligst velg en bildefil"
- **File too large**: "Bildet må være mindre enn 5MB"
- **Upload failure**: Shows Supabase error message
- **Network errors**: Caught and displayed to user

## Security Considerations

- Users can only upload/update/delete their own avatars (enforced by Storage policies)
- File size is limited to 5MB to prevent abuse
- Only image MIME types are allowed
- Filenames include user ID to prevent conflicts
- Old avatars are automatically deleted to prevent storage bloat

## Future Enhancements

Potential improvements:

- Image cropping/resizing before upload
- Multiple profile picture options (cover photo, etc.)
- Image compression client-side
- Avatar history/gallery
- Default avatar selection (instead of placeholder)
- Drag-and-drop upload
