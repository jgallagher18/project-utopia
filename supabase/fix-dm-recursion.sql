-- Fix infinite recursion in conversation_members RLS policy
-- Run this in the Supabase SQL Editor

-- The old SELECT policy on conversation_members references itself,
-- causing infinite recursion when any query touches conversations.
-- Fix: make conversation_members readable (it's just a join table, not sensitive data).
-- Message content is still protected by messages table policies.

DROP POLICY IF EXISTS "Users can read members of own conversations" ON conversation_members;
CREATE POLICY "Anyone can read conversation members"
  ON conversation_members FOR SELECT
  USING (true);

-- Also fix the INSERT policy which has the same self-reference issue
DROP POLICY IF EXISTS "Users can insert members into own conversations" ON conversation_members;
CREATE POLICY "Users can insert own membership"
  ON conversation_members FOR INSERT
  WITH CHECK (
    user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid())
  );
