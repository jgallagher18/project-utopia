-- Add profile_emoji column to users
-- Run this in the Supabase SQL Editor

ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_emoji text DEFAULT '';
