-- ============================================================================
-- Utopia — Seed Data
-- Run this in the Supabase SQL Editor after schema.sql
-- Mirrors the mock data in App.jsx
-- ============================================================================

-- ─── Users ──────────────────────────────────────────────────────────────────

insert into users (id, username, display_name, bio, avatar_url, follower_count, following_count, human_verified) values
  ('a0000000-0000-0000-0000-000000000001', 'nova_dreams',       'Nova',           'building utopia one pixel at a time. web archaeologist. digital gardener.', null, 847, 312, true),
  ('a0000000-0000-0000-0000-000000000002', 'pixel_witch',       'Pixel Witch',    'casting spells with CSS',                   null, 1200, 400, true),
  ('a0000000-0000-0000-0000-000000000003', 'retro_ron',         'Retro Ron',      'living in the 90s web forever',             null, 950,  280, true),
  ('a0000000-0000-0000-0000-000000000004', 'css_goddess',       'CSS Goddess',    'box-shadow is my love language',            null, 2100, 150, true),
  ('a0000000-0000-0000-0000-000000000005', 'byte_me',           'Byte Me',        'be weird on the internet again',            null, 3200, 500, true),
  ('a0000000-0000-0000-0000-000000000006', 'lo-fi_luke',        'Lo-Fi Luke',     'four-track recordings and chill',           null, 780,  200, true),
  ('a0000000-0000-0000-0000-000000000007', 'html_hera',         'HTML Hera',      'guestbooks are the future',                 null, 1600, 340, true),
  ('a0000000-0000-0000-0000-000000000008', 'ai_digest_bot',     'AI Digest Bot',  'aggregating AI news from 500 sources',      null, 50,   0,   false),
  ('a0000000-0000-0000-0000-000000000009', 'content_mill_3000', 'Content Mill',   'threads and hot takes 24/7',                null, 15,   0,   false);

-- ─── User Preferences (theme for nova_dreams) ──────────────────────────────

insert into user_preferences (user_id, bg_color, accent_color, border_color) values
  ('a0000000-0000-0000-0000-000000000001', '#f5f0e8', '#ff6600', '#222222');

-- ─── Posts ──────────────────────────────────────────────────────────────────

insert into posts (id, user_id, content, like_count, reply_count, repost_count, created_at) values
  ('b0000000-0000-0000-0000-000000000001',
   'a0000000-0000-0000-0000-000000000002',
   'just discovered you can still use <marquee> tags in 2025 and honestly? respect.',
   42, 7, 0, now() - interval '2 minutes'),

  ('b0000000-0000-0000-0000-000000000002',
   'a0000000-0000-0000-0000-000000000003',
   'hot take: the internet peaked when we had custom cursors and auto-playing midi files on every page',
   128, 34, 0, now() - interval '8 minutes'),

  ('b0000000-0000-0000-0000-000000000003',
   'a0000000-0000-0000-0000-000000000008',
   'Here are today''s top 10 AI breakthroughs aggregated from 500 sources...',
   5, 0, 0, now() - interval '12 minutes'),

  ('b0000000-0000-0000-0000-000000000004',
   'a0000000-0000-0000-0000-000000000004',
   'made an entire solar system with nothing but box-shadows. no javascript. fight me.',
   256, 19, 0, now() - interval '25 minutes'),

  ('b0000000-0000-0000-0000-000000000005',
   'a0000000-0000-0000-0000-000000000005',
   'friendly reminder that your personal website doesn''t need to be a portfolio. it can just be weird. be weird on the internet again.',
   512, 67, 0, now() - interval '45 minutes'),

  ('b0000000-0000-0000-0000-000000000006',
   'a0000000-0000-0000-0000-000000000009',
   '5 SHOCKING ways to 10x your productivity (thread)',
   2, 0, 0, now() - interval '50 minutes'),

  ('b0000000-0000-0000-0000-000000000007',
   'a0000000-0000-0000-0000-000000000006',
   'new album dropped. recorded everything on a four-track from 1998. link in bio.',
   89, 12, 0, now() - interval '90 minutes'),

  ('b0000000-0000-0000-0000-000000000008',
   'a0000000-0000-0000-0000-000000000007',
   'normalize having a guestbook on your website in 2025',
   334, 45, 0, now() - interval '3 hours');

-- ─── Relationships (nova follows everyone + top8) ───────────────────────────

-- Follows
insert into relationships (follower_id, following_id, type) values
  ('a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'follow'),
  ('a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', 'follow'),
  ('a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000004', 'follow'),
  ('a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000005', 'follow'),
  ('a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000006', 'follow'),
  ('a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000007', 'follow'),
  ('a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000008', 'follow'),
  ('a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000009', 'follow');

-- Top 8 (positions match MOCK_TOP8 order)
insert into relationships (follower_id, following_id, type, position) values
  ('a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'top8', 1),
  ('a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', 'top8', 2),
  ('a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000004', 'top8', 3),
  ('a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000005', 'top8', 4),
  ('a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000006', 'top8', 5),
  ('a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000007', 'top8', 6);

-- ─── Playlist Items (nova's playlist) ───────────────────────────────────────

insert into playlist_items (user_id, title, artist, position) values
  ('a0000000-0000-0000-0000-000000000001', 'Digital Love',   'Daft Punk',    1),
  ('a0000000-0000-0000-0000-000000000001', 'Midnight City',  'M83',          2),
  ('a0000000-0000-0000-0000-000000000001', 'Eventually',     'Tame Impala',  3);
