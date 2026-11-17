PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS academy_users (
  id TEXT PRIMARY KEY,
  nickname TEXT NOT NULL,
  created_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  consent_at TEXT,
  consent_version TEXT,
  locale TEXT NOT NULL DEFAULT 'pl'
);

CREATE TABLE IF NOT EXISTS academy_sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES academy_users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_academy_sessions_user ON academy_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_academy_sessions_expiry ON academy_sessions(expires_at);

CREATE TABLE IF NOT EXISTS academy_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES academy_users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  resource_id TEXT,
  title TEXT,
  details_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_academy_events_user_time ON academy_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_academy_events_type_time ON academy_events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_academy_events_resource ON academy_events(resource_id, event_type);

CREATE TABLE IF NOT EXISTS academy_user_state (
  user_id TEXT NOT NULL REFERENCES academy_users(id) ON DELETE CASCADE,
  state_key TEXT NOT NULL,
  state_json TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY(user_id, state_key)
);

CREATE TABLE IF NOT EXISTS academy_lesson_progress (
  user_id TEXT NOT NULL REFERENCES academy_users(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'started',
  progress_percent INTEGER NOT NULL DEFAULT 0,
  last_seen_at TEXT NOT NULL,
  completed_at TEXT,
  PRIMARY KEY(user_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS academy_conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES academy_users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_academy_conversations_user ON academy_conversations(user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS academy_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES academy_conversations(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES academy_users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK(role IN ('user','assistant','system')),
  content TEXT NOT NULL,
  sources_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_academy_messages_conversation ON academy_messages(conversation_id, created_at);

CREATE TABLE IF NOT EXISTS academy_knowledge_submissions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES academy_users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  symptoms TEXT NOT NULL,
  diagnosis TEXT NOT NULL,
  procedure TEXT NOT NULL,
  result TEXT NOT NULL,
  source_urls_json TEXT NOT NULL DEFAULT '[]',
  share_consent INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
  moderation_note TEXT,
  created_at TEXT NOT NULL,
  reviewed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_academy_submissions_status ON academy_knowledge_submissions(status, created_at DESC);

CREATE TABLE IF NOT EXISTS academy_knowledge_approved (
  id TEXT PRIMARY KEY,
  submission_id TEXT UNIQUE REFERENCES academy_knowledge_submissions(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  symptoms TEXT NOT NULL,
  diagnosis TEXT NOT NULL,
  procedure TEXT NOT NULL,
  result TEXT NOT NULL,
  source_urls_json TEXT NOT NULL DEFAULT '[]',
  approved_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_academy_approved_category ON academy_knowledge_approved(category, approved_at DESC);

CREATE TABLE IF NOT EXISTS academy_knowledge (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  category TEXT,
  title_pl TEXT NOT NULL,
  title_en TEXT,
  content_pl TEXT,
  content_en TEXT,
  tags TEXT,
  source_ref TEXT
);
CREATE INDEX IF NOT EXISTS idx_academy_knowledge_kind ON academy_knowledge(kind);
CREATE INDEX IF NOT EXISTS idx_academy_knowledge_category ON academy_knowledge(category);

CREATE TABLE IF NOT EXISTS academy_sources (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT,
  url TEXT NOT NULL,
  description TEXT,
  source_type TEXT,
  verified_label TEXT
);
CREATE INDEX IF NOT EXISTS idx_academy_sources_category ON academy_sources(category);

CREATE TABLE IF NOT EXISTS academy_rate_limits (
  bucket_key TEXT PRIMARY KEY,
  window_start INTEGER NOT NULL,
  request_count INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS academy_audit_log (
  id TEXT PRIMARY KEY,
  actor_id TEXT,
  action TEXT NOT NULL,
  target_id TEXT,
  details_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_academy_audit_time ON academy_audit_log(created_at DESC);
