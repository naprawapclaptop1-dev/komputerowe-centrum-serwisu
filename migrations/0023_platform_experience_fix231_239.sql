-- FIX231-FIX239: notification inbox/subscriptions, guardian consent links, content quality reports.
-- Additive only. Existing accounts, sessions, events and learning data are preserved.
CREATE TABLE IF NOT EXISTS academy_notification_preferences (
  user_id TEXT PRIMARY KEY REFERENCES academy_users(id) ON DELETE CASCADE,
  preferences_json TEXT NOT NULL DEFAULT '{"announcement":true,"assignment":true,"grade":true,"exam":true,"security":true,"email":false,"push":false}',
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS academy_notifications (
  notification_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES academy_users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK(notification_type IN ('announcement','assignment','submission','grade','exam','security','platform')),
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  resource_url TEXT,
  created_at TEXT NOT NULL,
  read_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_academy_notifications_user_created ON academy_notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_academy_notifications_unread ON academy_notifications(user_id, read_at, created_at DESC);
CREATE TABLE IF NOT EXISTS academy_push_subscriptions (
  subscription_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES academy_users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  endpoint_hash TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth_secret TEXT NOT NULL,
  created_at TEXT NOT NULL,
  last_used_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_academy_push_subscriptions_user ON academy_push_subscriptions(user_id);
CREATE TABLE IF NOT EXISTS academy_guardian_invites (
  invite_id TEXT PRIMARY KEY,
  student_user_id TEXT NOT NULL REFERENCES academy_users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  claimed_at TEXT,
  revoked_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_academy_guardian_invites_student ON academy_guardian_invites(student_user_id, created_at DESC);
CREATE TABLE IF NOT EXISTS academy_guardian_links (
  link_id TEXT PRIMARY KEY,
  student_user_id TEXT NOT NULL REFERENCES academy_users(id) ON DELETE CASCADE,
  guardian_user_id TEXT NOT NULL REFERENCES academy_users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK(status IN ('pending','approved','rejected','revoked')),
  created_at TEXT NOT NULL,
  approved_at TEXT,
  UNIQUE(student_user_id, guardian_user_id),
  CHECK(student_user_id <> guardian_user_id)
);
CREATE INDEX IF NOT EXISTS idx_academy_guardian_links_student ON academy_guardian_links(student_user_id, status);
CREATE INDEX IF NOT EXISTS idx_academy_guardian_links_guardian ON academy_guardian_links(guardian_user_id, status);
CREATE TABLE IF NOT EXISTS academy_content_reports (
  report_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES academy_users(id) ON DELETE CASCADE,
  resource_id TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('factual_error','outdated','broken_link','accessibility','copyright','other')),
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','reviewing','fixed','rejected')),
  created_at TEXT NOT NULL,
  reviewed_at TEXT,
  review_note TEXT
);
CREATE INDEX IF NOT EXISTS idx_academy_content_reports_status ON academy_content_reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_academy_content_reports_user ON academy_content_reports(user_id, created_at DESC);
