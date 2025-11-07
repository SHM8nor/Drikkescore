-- Add avatar_url column to profiles table
-- This migration adds support for profile pictures

-- Add avatar_url column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add comment to the column
COMMENT ON COLUMN profiles.avatar_url IS 'Public URL to user avatar image stored in Supabase Storage';

-- Create storage bucket for avatars if it doesn't exist
-- Run this in Supabase Dashboard -> Storage or using Supabase client

-- To create the bucket manually in Supabase Dashboard:
-- 1. Go to Storage in Supabase Dashboard
-- 2. Create a new bucket named 'avatars'
-- 3. Set it to public (so URLs are accessible)
-- 4. Configure file size limit (e.g., 5MB)
-- 5. Configure allowed MIME types: image/jpeg, image/png, image/gif, image/webp

-- Storage policies (run these in SQL Editor after creating the bucket):

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
