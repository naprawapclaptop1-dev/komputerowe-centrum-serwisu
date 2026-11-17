-- Akademia Serwisu PRO 5.2.0 — addytywne konta e-mail/hasło i katalog modeli społeczności.
-- Nie usuwa ani nie modyfikuje istniejących rekordów użytkowników, sesji ani zgłoszeń.
ALTER TABLE academy_users ADD COLUMN email_normalized TEXT;
ALTER TABLE academy_users ADD COLUMN password_salt TEXT;
ALTER TABLE academy_users ADD COLUMN password_hash TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_academy_users_email_unique
  ON academy_users(email_normalized) WHERE email_normalized IS NOT NULL;

CREATE TABLE IF NOT EXISTS academy_device_model_submissions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES academy_users(id) ON DELETE CASCADE,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  series TEXT NOT NULL DEFAULT '',
  device_type TEXT NOT NULL DEFAULT 'laptop' CHECK(device_type IN ('laptop','desktop','workstation','all-in-one','mini-pc')),
  board_id TEXT NOT NULL DEFAULT '',
  pcb_revision TEXT NOT NULL DEFAULT '',
  cpu_platform TEXT NOT NULL DEFAULT '',
  gpu TEXT NOT NULL DEFAULT '',
  ram_type TEXT NOT NULL DEFAULT '',
  storage TEXT NOT NULL DEFAULT '',
  display_info TEXT NOT NULL DEFAULT '',
  known_issues TEXT NOT NULL DEFAULT '',
  repair_notes TEXT NOT NULL DEFAULT '',
  source_urls_json TEXT NOT NULL DEFAULT '[]',
  attribution TEXT NOT NULL DEFAULT '',
  rights_confirmed_at TEXT,
  license_code TEXT NOT NULL DEFAULT '',
  share_consent INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
  moderation_note TEXT,
  created_at TEXT NOT NULL,
  reviewed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_academy_device_submissions_status
  ON academy_device_model_submissions(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_academy_device_submissions_brand_model
  ON academy_device_model_submissions(brand, model);

CREATE TABLE IF NOT EXISTS academy_device_models (
  id TEXT PRIMARY KEY,
  submission_id TEXT UNIQUE REFERENCES academy_device_model_submissions(id) ON DELETE SET NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  series TEXT NOT NULL DEFAULT '',
  device_type TEXT NOT NULL DEFAULT 'laptop' CHECK(device_type IN ('laptop','desktop','workstation','all-in-one','mini-pc')),
  board_id TEXT NOT NULL DEFAULT '',
  pcb_revision TEXT NOT NULL DEFAULT '',
  cpu_platform TEXT NOT NULL DEFAULT '',
  gpu TEXT NOT NULL DEFAULT '',
  ram_type TEXT NOT NULL DEFAULT '',
  storage TEXT NOT NULL DEFAULT '',
  display_info TEXT NOT NULL DEFAULT '',
  known_issues TEXT NOT NULL DEFAULT '',
  repair_notes TEXT NOT NULL DEFAULT '',
  source_urls_json TEXT NOT NULL DEFAULT '[]',
  attribution TEXT NOT NULL DEFAULT '',
  license_code TEXT NOT NULL DEFAULT '',
  approved_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_academy_device_models_brand_model
  ON academy_device_models(brand, model);
CREATE INDEX IF NOT EXISTS idx_academy_device_models_type
  ON academy_device_models(device_type, brand);
