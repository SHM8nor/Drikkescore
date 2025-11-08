-- Create Storage Bucket for Badge Icons
-- This migration sets up a public storage bucket for badge icon images with:
-- 1. Public read access for displaying badges
-- 2. Admin-only write/update/delete access via RLS policies
-- 3. File size and type restrictions

-- ============================================================================
-- CREATE STORAGE BUCKET
-- ============================================================================

-- Insert the badge-icons bucket with public access
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'badge-icons',
  'badge-icons',
  true, -- Public bucket for read access
  2097152, -- 2MB file size limit (2 * 1024 * 1024 bytes)
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'] -- Allowed image formats
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES FOR BADGE ICONS
-- ============================================================================

-- Policy 1: Anyone can view/download badge icon images
CREATE POLICY "Badge icons are publicly accessible"
ON storage.objects
FOR SELECT
TO authenticated, anon
USING (bucket_id = 'badge-icons');

-- Policy 2: Only admins can upload badge icons
CREATE POLICY "Admins can upload badge icons"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'badge-icons'
  AND (SELECT is_admin())
);

-- Policy 3: Only admins can update badge icons
CREATE POLICY "Admins can update badge icons"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'badge-icons'
  AND (SELECT is_admin())
)
WITH CHECK (
  bucket_id = 'badge-icons'
  AND (SELECT is_admin())
);

-- Policy 4: Only admins can delete badge icons
CREATE POLICY "Admins can delete badge icons"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'badge-icons'
  AND (SELECT is_admin())
);

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant access to storage.objects for all roles
-- (RLS policies will control actual access)
GRANT SELECT ON storage.objects TO anon, authenticated;
GRANT INSERT ON storage.objects TO authenticated;
GRANT UPDATE ON storage.objects TO authenticated;
GRANT DELETE ON storage.objects TO authenticated;
