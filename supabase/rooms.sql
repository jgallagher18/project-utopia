-- ============================================================================
-- Recess — Vibe Rooms Support
-- Run this in the Supabase SQL Editor after groups.sql
-- Adds room column to posts for Vibe Room categorization
-- ============================================================================

-- Add room column to posts (nullable — posts without a room appear in all feeds)
alter table posts add column if not exists room text;

-- Index for fast room filtering
create index if not exists idx_posts_room on posts (room) where room is not null;
