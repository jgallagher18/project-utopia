-- Fix: Create avatars storage bucket and policies
-- Run this in the Supabase SQL Editor

-- 1. Create the bucket (public so avatar URLs work without auth)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Anyone can view avatars
CREATE POLICY "Anyone can read avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- 3. Authenticated users can upload to their own folder
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 4. Authenticated users can overwrite their own avatar
CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 5. Authenticated users can delete their own avatar
CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
