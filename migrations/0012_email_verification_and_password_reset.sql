-- FIX19: email verification and password reset tokens.
-- Additive migration: preserves existing accounts and sessions.
ALTER TABLE academy_users ADD COLUMN email_verified_at TEXT;

CREATE TABLE IF NOT EXISTS academy_email_tokens (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES academy_users(id) ON DELETE CASCADE,
  email_normalized TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK(purpose IN ('verify_email','reset_password')),
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_academy_email_tokens_user_purpose
  ON academy_email_tokens(user_id, purpose, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_academy_email_tokens_expiry
  ON academy_email_tokens(expires_at);
