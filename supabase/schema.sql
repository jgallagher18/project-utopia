-- ============================================================================
-- Utopia — Database Schema
-- Run this in the Supabase SQL Editor before seed.sql
-- ============================================================================

-- ─── Custom Types ───────────────────────────────────────────────────────────

create type relationship_type as enum ('follow', 'top8');

-- ─── Users ──────────────────────────────────────────────────────────────────

create table users (
  id            uuid primary key default gen_random_uuid(),
  auth_id       uuid unique,                     -- links to auth.users later
  username      text unique not null,
  display_name  text not null,
  bio           text default '',
  avatar_url    text,
  follower_count  int default 0,
  following_count int default 0,
  human_verified  boolean default false,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index idx_users_username on users (username);

-- ─── User Preferences (theme colors) ───────────────────────────────────────

create table user_preferences (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users (id) on delete cascade,
  bg_color   text default '#f5f0e8',
  accent_color text default '#ff6600',
  border_color text default '#222222',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  constraint uq_user_preferences_user unique (user_id)
);

-- ─── Posts ──────────────────────────────────────────────────────────────────

create table posts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references users (id) on delete cascade,
  content      text not null,
  like_count   int default 0,
  reply_count  int default 0,
  repost_count int default 0,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create index idx_posts_user_id on posts (user_id);
create index idx_posts_created_at on posts (created_at desc);

-- ─── Relationships (follow + top8) ─────────────────────────────────────────

create table relationships (
  id            uuid primary key default gen_random_uuid(),
  follower_id   uuid not null references users (id) on delete cascade,
  following_id  uuid not null references users (id) on delete cascade,
  type          relationship_type not null default 'follow',
  position      int,                              -- 1-8 for top8, null for follow
  created_at    timestamptz default now(),

  constraint uq_relationship unique (follower_id, following_id, type),
  constraint chk_no_self_follow check (follower_id <> following_id),
  constraint chk_top8_position check (
    (type = 'top8' and position between 1 and 8) or
    (type = 'follow' and position is null)
  )
);

create index idx_relationships_follower on relationships (follower_id);
create index idx_relationships_following on relationships (following_id);

-- ─── Playlist Items ─────────────────────────────────────────────────────────

create table playlist_items (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users (id) on delete cascade,
  title      text not null,
  artist     text not null,
  position   int not null,
  created_at timestamptz default now(),

  constraint uq_playlist_position unique (user_id, position)
);

create index idx_playlist_user_id on playlist_items (user_id);

-- ─── Updated-at trigger ─────────────────────────────────────────────────────

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_users_updated_at
  before update on users
  for each row execute function update_updated_at();

create trigger trg_user_preferences_updated_at
  before update on user_preferences
  for each row execute function update_updated_at();

create trigger trg_posts_updated_at
  before update on posts
  for each row execute function update_updated_at();

-- ─── Row Level Security ─────────────────────────────────────────────────────
-- Enabled with permissive policies for now. Auth-based restrictions in step 2.

alter table users enable row level security;
alter table user_preferences enable row level security;
alter table posts enable row level security;
alter table relationships enable row level security;
alter table playlist_items enable row level security;

-- Open read
create policy "Anyone can read users"        on users            for select using (true);
create policy "Anyone can read preferences"  on user_preferences for select using (true);
create policy "Anyone can read posts"        on posts            for select using (true);
create policy "Anyone can read relationships" on relationships   for select using (true);
create policy "Anyone can read playlists"    on playlist_items   for select using (true);

-- Open write (will be tightened with auth)
create policy "Anyone can insert users"        on users            for insert with check (true);
create policy "Anyone can update users"        on users            for update using (true);
create policy "Anyone can insert preferences"  on user_preferences for insert with check (true);
create policy "Anyone can update preferences"  on user_preferences for update using (true);
create policy "Anyone can insert posts"        on posts            for insert with check (true);
create policy "Anyone can update posts"        on posts            for update using (true);
create policy "Anyone can insert relationships" on relationships   for insert with check (true);
create policy "Anyone can delete relationships" on relationships   for delete using (true);
create policy "Anyone can insert playlists"    on playlist_items   for insert with check (true);
create policy "Anyone can update playlists"    on playlist_items   for update using (true);
create policy "Anyone can delete playlists"    on playlist_items   for delete using (true);
