-- ─── Statuses table (AIM-style status messages) ──────────────────────────

CREATE TABLE IF NOT EXISTS statuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content text NOT NULL,
  emoji text DEFAULT '💭',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_statuses_user_latest
  ON statuses (user_id, created_at DESC);

-- RLS
ALTER TABLE statuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view statuses"
  ON statuses FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own status"
  ON statuses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own status"
  ON statuses FOR DELETE
  USING (auth.uid() = user_id);

-- ─── Interests column on users ────────────────────────────────────────────

ALTER TABLE users ADD COLUMN IF NOT EXISTS interests text DEFAULT '';
