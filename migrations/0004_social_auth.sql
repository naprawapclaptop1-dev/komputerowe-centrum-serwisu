-- Akademia Serwisu PRO 3.9.2 — bezpieczne logowanie OAuth i konta autorów.
-- Nie zapisujemy access tokenów ani adresów e-mail dostawców.
CREATE TABLE IF NOT EXISTS academy_auth_identities (
  provider TEXT NOT NULL CHECK(provider IN ('google','facebook','microsoft')),
  provider_subject TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES academy_users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  PRIMARY KEY(provider, provider_subject)
);
CREATE INDEX IF NOT EXISTS idx_academy_auth_identity_user ON academy_auth_identities(user_id, provider);

CREATE TABLE IF NOT EXISTS academy_oauth_states (
  state_hash TEXT PRIMARY KEY,
  provider TEXT NOT NULL CHECK(provider IN ('google','facebook','microsoft')),
  code_verifier TEXT NOT NULL,
  nickname TEXT NOT NULL DEFAULT '',
  link_user_id TEXT,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_academy_oauth_states_expiry ON academy_oauth_states(expires_at);
