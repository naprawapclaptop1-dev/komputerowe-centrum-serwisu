-- FIX43: dedicated site ratings and improvement reports. Additive only.
CREATE TABLE IF NOT EXISTS academy_site_feedback (
  id TEXT PRIMARY KEY,
  user_id TEXT NULL REFERENCES academy_users(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  what_add TEXT NOT NULL DEFAULT '',
  what_change TEXT NOT NULL DEFAULT '',
  what_broken TEXT NOT NULL DEFAULT '',
  details TEXT NOT NULL DEFAULT '',
  route TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','in_review','fixed','wont_fix')),
  admin_note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  reviewed_at TEXT NULL
);
CREATE INDEX IF NOT EXISTS idx_academy_site_feedback_created ON academy_site_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_academy_site_feedback_status ON academy_site_feedback(status, created_at DESC);
