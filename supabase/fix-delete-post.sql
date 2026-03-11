-- Fix: Add missing DELETE policy for posts
-- Run this in the Supabase SQL Editor

CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE
  USING (user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid()));
