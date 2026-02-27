-- ============================================================================
-- Utopia — Extended Features (Step 10)
-- Run this in the Supabase SQL Editor after social.sql
-- Adds reposts, notifications, and direct messaging
-- ============================================================================

-- ─── Reposts ─────────────────────────────────────────────────────────────────

create table reposts (
  post_id    uuid not null references posts (id) on delete cascade,
  user_id    uuid not null references users (id) on delete cascade,
  created_at timestamptz default now(),

  constraint pk_reposts primary key (post_id, user_id)
);

create index idx_reposts_user on reposts (user_id);

-- Repost counter trigger
create or replace function update_repost_count()
returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    update posts set repost_count = repost_count + 1 where id = NEW.post_id;
    return NEW;
  elsif (TG_OP = 'DELETE') then
    update posts set repost_count = greatest(repost_count - 1, 0) where id = OLD.post_id;
    return OLD;
  end if;
end;
$$ language plpgsql security definer;

create trigger trg_reposts_count
  after insert or delete on reposts
  for each row execute function update_repost_count();

-- RLS
alter table reposts enable row level security;

create policy "Anyone can read reposts"
  on reposts for select using (true);

create policy "Users can insert own reposts"
  on reposts for insert
  with check (user_id = (select id from public.users where auth_id = auth.uid()));

create policy "Users can delete own reposts"
  on reposts for delete
  using (user_id = (select id from public.users where auth_id = auth.uid()));

-- ─── Notifications ───────────────────────────────────────────────────────────

create type notification_type as enum ('like', 'reply', 'follow', 'repost', 'message');

create table notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users (id) on delete cascade,
  actor_id   uuid not null references users (id) on delete cascade,
  type       notification_type not null,
  post_id    uuid references posts (id) on delete cascade,
  read       boolean default false,
  created_at timestamptz default now()
);

create index idx_notifications_user on notifications (user_id, created_at desc);
create index idx_notifications_unread on notifications (user_id) where read = false;

-- Auto-create notification on like
create or replace function notify_on_like()
returns trigger as $$
declare
  post_owner uuid;
begin
  select user_id into post_owner from posts where id = NEW.post_id;
  if post_owner is not null and post_owner <> NEW.user_id then
    insert into notifications (user_id, actor_id, type, post_id)
    values (post_owner, NEW.user_id, 'like', NEW.post_id);
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

create trigger trg_notify_like
  after insert on post_likes
  for each row execute function notify_on_like();

-- Auto-create notification on reply
create or replace function notify_on_reply()
returns trigger as $$
declare
  post_owner uuid;
begin
  select user_id into post_owner from posts where id = NEW.post_id;
  if post_owner is not null and post_owner <> NEW.user_id then
    insert into notifications (user_id, actor_id, type, post_id)
    values (post_owner, NEW.user_id, 'reply', NEW.post_id);
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

create trigger trg_notify_reply
  after insert on post_replies
  for each row execute function notify_on_reply();

-- Auto-create notification on follow
create or replace function notify_on_follow()
returns trigger as $$
begin
  if NEW.type = 'follow' then
    insert into notifications (user_id, actor_id, type)
    values (NEW.following_id, NEW.follower_id, 'follow');
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

create trigger trg_notify_follow
  after insert on relationships
  for each row execute function notify_on_follow();

-- Auto-create notification on repost
create or replace function notify_on_repost()
returns trigger as $$
declare
  post_owner uuid;
begin
  select user_id into post_owner from posts where id = NEW.post_id;
  if post_owner is not null and post_owner <> NEW.user_id then
    insert into notifications (user_id, actor_id, type, post_id)
    values (post_owner, NEW.user_id, 'repost', NEW.post_id);
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

create trigger trg_notify_repost
  after insert on reposts
  for each row execute function notify_on_repost();

-- RLS
alter table notifications enable row level security;

create policy "Users can read own notifications"
  on notifications for select
  using (user_id = (select id from public.users where auth_id = auth.uid()));

create policy "Users can update own notifications"
  on notifications for update
  using (user_id = (select id from public.users where auth_id = auth.uid()));

-- Insert handled by security definer triggers only; no direct insert policy needed

-- ─── Direct Messages ─────────────────────────────────────────────────────────

create table conversations (
  id         uuid primary key default gen_random_uuid(),
  user1_id   uuid not null references users (id) on delete cascade,
  user2_id   uuid not null references users (id) on delete cascade,
  updated_at timestamptz default now(),
  created_at timestamptz default now(),

  constraint uq_conversation_pair unique (user1_id, user2_id),
  constraint chk_no_self_chat check (user1_id <> user2_id)
);

create index idx_conversations_user1 on conversations (user1_id);
create index idx_conversations_user2 on conversations (user2_id);

create table messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations (id) on delete cascade,
  sender_id       uuid not null references users (id) on delete cascade,
  content         text not null,
  created_at      timestamptz default now()
);

create index idx_messages_conversation on messages (conversation_id, created_at);

-- Update conversation.updated_at on new message
create or replace function update_conversation_timestamp()
returns trigger as $$
begin
  update conversations set updated_at = now() where id = NEW.conversation_id;
  return NEW;
end;
$$ language plpgsql security definer;

create trigger trg_message_update_conversation
  after insert on messages
  for each row execute function update_conversation_timestamp();

-- RLS
alter table conversations enable row level security;
alter table messages enable row level security;

create policy "Users can read own conversations"
  on conversations for select
  using (
    user1_id = (select id from public.users where auth_id = auth.uid()) or
    user2_id = (select id from public.users where auth_id = auth.uid())
  );

create policy "Users can insert conversations they are part of"
  on conversations for insert
  with check (
    user1_id = (select id from public.users where auth_id = auth.uid()) or
    user2_id = (select id from public.users where auth_id = auth.uid())
  );

create policy "Users can read messages in own conversations"
  on messages for select
  using (
    conversation_id in (
      select id from conversations
      where user1_id = (select id from public.users where auth_id = auth.uid())
         or user2_id = (select id from public.users where auth_id = auth.uid())
    )
  );

create policy "Users can send messages in own conversations"
  on messages for insert
  with check (
    sender_id = (select id from public.users where auth_id = auth.uid())
    and conversation_id in (
      select id from conversations
      where user1_id = (select id from public.users where auth_id = auth.uid())
         or user2_id = (select id from public.users where auth_id = auth.uid())
    )
  );

-- ─── Storage bucket for avatars ──────────────────────────────────────────────
-- Run this separately or in Supabase Dashboard → Storage → New Bucket:
--   Name: avatars
--   Public: true
--   File size limit: 2MB
--   Allowed MIME types: image/jpeg, image/png, image/gif, image/webp
--
-- Then add this storage policy:
-- create policy "Users can upload own avatar"
--   on storage.objects for insert
--   with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
--
-- create policy "Anyone can read avatars"
--   on storage.objects for select
--   using (bucket_id = 'avatars');
--
-- create policy "Users can update own avatar"
--   on storage.objects for update
--   using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
