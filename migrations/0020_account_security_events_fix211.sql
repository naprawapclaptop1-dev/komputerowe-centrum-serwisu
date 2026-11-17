-- FIX211: historia zdarzeń bezpieczeństwa konta. Bez surowych IP, user-agent, haseł i tokenów.
CREATE TABLE IF NOT EXISTS academy_security_events (
  event_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('oauth_login','account_linked','sessions_revoked','totp_enabled','totp_disabled','recovery_codes_regenerated','email_verified','password_reset')),
  provider TEXT CHECK (provider IS NULL OR provider IN ('google','microsoft','facebook','github','discord')),
  details_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES academy_users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_academy_security_events_user_created
  ON academy_security_events(user_id, created_at DESC);
