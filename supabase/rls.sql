-- ============================================================================
-- Utopia — Row-Level Security Policies (Step 4)
-- Run this in the Supabase SQL Editor after schema.sql and seed.sql
-- Replaces wide-open write policies with auth-scoped ownership checks
-- ============================================================================

-- ─── Drop old permissive write policies ───────────────────────────────────────

drop policy "Anyone can insert users"        on users;
drop policy "Anyone can update users"        on users;
drop policy "Anyone can insert preferences"  on user_preferences;
drop policy "Anyone can update preferences"  on user_preferences;
drop policy "Anyone can insert posts"        on posts;
drop policy "Anyone can update posts"        on posts;
drop policy "Anyone can insert relationships" on relationships;
drop policy "Anyone can delete relationships" on relationships;
drop policy "Anyone can insert playlists"    on playlist_items;
drop policy "Anyone can update playlists"    on playlist_items;
drop policy "Anyone can delete playlists"    on playlist_items;

-- ─── Users ────────────────────────────────────────────────────────────────────

create policy "Authenticated users can insert own user"
  on users for insert
  with check (auth_id = auth.uid());

create policy "Users can update own profile"
  on users for update
  using (auth_id = auth.uid());

-- ─── User Preferences ────────────────────────────────────────────────────────

create policy "Users can insert own preferences"
  on user_preferences for insert
  with check (user_id = (select id from public.users where auth_id = auth.uid()));

create policy "Users can update own preferences"
  on user_preferences for update
  using (user_id = (select id from public.users where auth_id = auth.uid()));

-- ─── Posts ────────────────────────────────────────────────────────────────────

create policy "Users can insert own posts"
  on posts for insert
  with check (user_id = (select id from public.users where auth_id = auth.uid()));

create policy "Users can update own posts"
  on posts for update
  using (user_id = (select id from public.users where auth_id = auth.uid()));

-- ─── Relationships ───────────────────────────────────────────────────────────

create policy "Users can insert own relationships"
  on relationships for insert
  with check (follower_id = (select id from public.users where auth_id = auth.uid()));

create policy "Users can delete own relationships"
  on relationships for delete
  using (follower_id = (select id from public.users where auth_id = auth.uid()));

-- ─── Playlist Items ──────────────────────────────────────────────────────────

create policy "Users can insert own playlists"
  on playlist_items for insert
  with check (user_id = (select id from public.users where auth_id = auth.uid()));

create policy "Users can update own playlists"
  on playlist_items for update
  using (user_id = (select id from public.users where auth_id = auth.uid()));

create policy "Users can delete own playlists"
  on playlist_items for delete
  using (user_id = (select id from public.users where auth_id = auth.uid()));
