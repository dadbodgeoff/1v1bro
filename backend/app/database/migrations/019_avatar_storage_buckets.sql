-- Migration: Create storage buckets for avatars and banners
-- Run this in Supabase SQL Editor or via migration tool

-- ============================================
-- Create Storage Buckets
-- ============================================

-- Create avatars bucket (public for easy access)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars',
    'avatars',
    true,  -- Public bucket for avatar images
    5242880,  -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Create banners bucket (public for easy access)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'banners',
    'banners',
    true,  -- Public bucket for banner images
    10485760,  -- 10MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- ============================================
-- Storage RLS Policies for Avatars
-- ============================================

-- Allow authenticated users to upload their own avatars
-- Path format: {user_id}/{filename}
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own avatars
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own avatars
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to all avatars (since bucket is public)
CREATE POLICY "Public avatar read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- ============================================
-- Storage RLS Policies for Banners
-- ============================================

-- Allow authenticated users to upload their own banners
CREATE POLICY "Users can upload own banner"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'banners' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own banners
CREATE POLICY "Users can update own banner"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'banners' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own banners
CREATE POLICY "Users can delete own banner"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'banners' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to all banners (since bucket is public)
CREATE POLICY "Public banner read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'banners');

-- ============================================
-- Service Role Access (for backend operations)
-- ============================================

-- Note: Service role bypasses RLS by default, so no additional
-- policies needed for backend operations using service key.
