-- FIX19: TOTP two-factor authentication, encrypted pending/active secret and one-time recovery codes.
-- Additive only: existing users, sessions, identities and learning records remain intact.
ALTER TABLE academy_users ADD COLUMN totp_secret_cipher TEXT;
ALTER TABLE academy_users ADD COLUMN totp_secret_iv TEXT;
ALTER TABLE academy_users ADD COLUMN totp_pending_expires_at TEXT;
ALTER TABLE academy_users ADD COLUMN totp_enabled_at TEXT;
CREATE TABLE IF NOT EXISTS academy_totp_recovery_codes (
  user_id TEXT NOT NULL REFERENCES academy_users(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  used_at TEXT,
  PRIMARY KEY(user_id, code_hash)
);
CREATE INDEX IF NOT EXISTS idx_academy_totp_recovery_user ON academy_totp_recovery_codes(user_id, used_at);
CREATE TABLE IF NOT EXISTS academy_totp_login_challenges (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES academy_users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_academy_totp_challenges_expiry ON academy_totp_login_challenges(expires_at);
