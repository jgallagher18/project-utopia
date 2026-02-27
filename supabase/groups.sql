-- ============================================================================
-- Recess — Group Chats + Message Notifications
-- Run this in the Supabase SQL Editor after features.sql
-- Adds group conversation support and message notification trigger
-- ============================================================================

-- ─── Message Notification Trigger ──────────────────────────────────────────

create or replace function notify_on_message()
returns trigger as $$
declare
  other_user uuid;
  member_record record;
  conv record;
begin
  select * into conv from conversations where id = NEW.conversation_id;

  if conv.is_group is true then
    -- Group: notify all members except sender
    for member_record in
      select user_id from conversation_members
      where conversation_id = NEW.conversation_id and user_id <> NEW.sender_id
    loop
      insert into notifications (user_id, actor_id, type)
      values (member_record.user_id, NEW.sender_id, 'message');
    end loop;
  else
    -- 1-on-1: notify the other user
    if conv.user1_id = NEW.sender_id then
      other_user := conv.user2_id;
    else
      other_user := conv.user1_id;
    end if;

    if other_user is not null and other_user <> NEW.sender_id then
      insert into notifications (user_id, actor_id, type)
      values (other_user, NEW.sender_id, 'message');
    end if;
  end if;

  return NEW;
end;
$$ language plpgsql security definer;

create trigger trg_notify_message
  after insert on messages
  for each row execute function notify_on_message();

-- ─── Group Chat Schema ─────────────────────────────────────────────────────

-- Add group columns to conversations
alter table conversations
  add column if not exists is_group boolean default false,
  add column if not exists name text;

-- Make user1_id/user2_id nullable for group chats
alter table conversations
  alter column user1_id drop not null,
  alter column user2_id drop not null;

-- Conversation members junction table
create table if not exists conversation_members (
  conversation_id uuid not null references conversations (id) on delete cascade,
  user_id         uuid not null references users (id) on delete cascade,
  joined_at       timestamptz default now(),

  constraint pk_conversation_members primary key (conversation_id, user_id)
);

create index if not exists idx_convo_members_user on conversation_members (user_id);
create index if not exists idx_convo_members_convo on conversation_members (conversation_id);

-- RLS for conversation_members
alter table conversation_members enable row level security;

create policy "Users can read members of own conversations"
  on conversation_members for select
  using (
    conversation_id in (
      select conversation_id from conversation_members cm
      where cm.user_id = (select id from public.users where auth_id = auth.uid())
    )
  );

create policy "Users can insert members into own conversations"
  on conversation_members for insert
  with check (
    -- Either you're adding yourself, or you're already a member of this convo
    user_id = (select id from public.users where auth_id = auth.uid())
    or conversation_id in (
      select conversation_id from conversation_members cm
      where cm.user_id = (select id from public.users where auth_id = auth.uid())
    )
  );

-- Additional conversation policies for group chats
create policy "Members can read group conversations"
  on conversations for select
  using (
    is_group = true and id in (
      select conversation_id from conversation_members
      where user_id = (select id from public.users where auth_id = auth.uid())
    )
  );

create policy "Users can insert group conversations"
  on conversations for insert
  with check (is_group = true);

-- Messages in group conversations
create policy "Users can read messages in group conversations"
  on messages for select
  using (
    conversation_id in (
      select conversation_id from conversation_members
      where user_id = (select id from public.users where auth_id = auth.uid())
    )
  );

create policy "Users can send messages in group conversations"
  on messages for insert
  with check (
    sender_id = (select id from public.users where auth_id = auth.uid())
    and conversation_id in (
      select conversation_id from conversation_members
      where user_id = (select id from public.users where auth_id = auth.uid())
    )
  );
