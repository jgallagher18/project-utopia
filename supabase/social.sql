-- ============================================================================
-- Utopia — Social Features (Step 8)
-- Run this in the Supabase SQL Editor after schema.sql, seed.sql, and rls.sql
-- Adds post_likes, post_replies tables + counter triggers
-- ============================================================================

-- ─── Post Likes ──────────────────────────────────────────────────────────────

create table post_likes (
  post_id   uuid not null references posts (id) on delete cascade,
  user_id   uuid not null references users (id) on delete cascade,
  created_at timestamptz default now(),

  constraint pk_post_likes primary key (post_id, user_id)
);

create index idx_post_likes_user on post_likes (user_id);

-- ─── Post Replies ────────────────────────────────────────────────────────────

create table post_replies (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references posts (id) on delete cascade,
  user_id    uuid not null references users (id) on delete cascade,
  content    text not null,
  created_at timestamptz default now()
);

create index idx_post_replies_post on post_replies (post_id);
create index idx_post_replies_user on post_replies (user_id);

-- ─── Counter Triggers ────────────────────────────────────────────────────────

-- Like counter: keeps posts.like_count in sync
create or replace function update_like_count()
returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    update posts set like_count = like_count + 1 where id = NEW.post_id;
    return NEW;
  elsif (TG_OP = 'DELETE') then
    update posts set like_count = greatest(like_count - 1, 0) where id = OLD.post_id;
    return OLD;
  end if;
end;
$$ language plpgsql security definer;

create trigger trg_post_likes_count
  after insert or delete on post_likes
  for each row execute function update_like_count();

-- Reply counter: keeps posts.reply_count in sync
create or replace function update_reply_count()
returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    update posts set reply_count = reply_count + 1 where id = NEW.post_id;
    return NEW;
  elsif (TG_OP = 'DELETE') then
    update posts set reply_count = greatest(reply_count - 1, 0) where id = OLD.post_id;
    return OLD;
  end if;
end;
$$ language plpgsql security definer;

create trigger trg_post_replies_count
  after insert or delete on post_replies
  for each row execute function update_reply_count();

-- Follow counter: keeps users.follower_count and following_count in sync
create or replace function update_follow_counts()
returns trigger as $$
begin
  if (TG_OP = 'INSERT' and NEW.type = 'follow') then
    update users set following_count = following_count + 1 where id = NEW.follower_id;
    update users set follower_count = follower_count + 1 where id = NEW.following_id;
    return NEW;
  elsif (TG_OP = 'DELETE' and OLD.type = 'follow') then
    update users set following_count = greatest(following_count - 1, 0) where id = OLD.follower_id;
    update users set follower_count = greatest(follower_count - 1, 0) where id = OLD.following_id;
    return OLD;
  end if;
  return coalesce(NEW, OLD);
end;
$$ language plpgsql security definer;

create trigger trg_relationships_follow_count
  after insert or delete on relationships
  for each row execute function update_follow_counts();

-- ─── Row Level Security ──────────────────────────────────────────────────────

alter table post_likes enable row level security;
alter table post_replies enable row level security;

-- Open read for both tables
create policy "Anyone can read post_likes"
  on post_likes for select using (true);

create policy "Anyone can read post_replies"
  on post_replies for select using (true);

-- Likes: users can only insert/delete own likes
create policy "Users can insert own likes"
  on post_likes for insert
  with check (user_id = (select id from public.users where auth_id = auth.uid()));

create policy "Users can delete own likes"
  on post_likes for delete
  using (user_id = (select id from public.users where auth_id = auth.uid()));

-- Replies: users can only insert/delete own replies
create policy "Users can insert own replies"
  on post_replies for insert
  with check (user_id = (select id from public.users where auth_id = auth.uid()));

create policy "Users can delete own replies"
  on post_replies for delete
  using (user_id = (select id from public.users where auth_id = auth.uid()));
