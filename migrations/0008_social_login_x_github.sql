-- FIX18: add X and GitHub OAuth identities without deleting existing account links or pending state rows.
-- Rebuild only the two OAuth tables because SQLite CHECK constraints cannot be extended in place.
DROP INDEX IF EXISTS idx_academy_auth_identity_user;
ALTER TABLE academy_auth_identities RENAME TO academy_auth_identities_legacy_fix18;
CREATE TABLE academy_auth_identities (
  provider TEXT NOT NULL CHECK(provider IN ('google','facebook','microsoft','x','github')),
  provider_subject TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES academy_users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  PRIMARY KEY(provider, provider_subject)
);
INSERT INTO academy_auth_identities(provider,provider_subject,user_id,created_at)
  SELECT provider,provider_subject,user_id,created_at FROM academy_auth_identities_legacy_fix18;
DROP TABLE academy_auth_identities_legacy_fix18;
CREATE INDEX idx_academy_auth_identity_user ON academy_auth_identities(user_id, provider);

DROP INDEX IF EXISTS idx_academy_oauth_states_expiry;
ALTER TABLE academy_oauth_states RENAME TO academy_oauth_states_legacy_fix18;
CREATE TABLE academy_oauth_states (
  state_hash TEXT PRIMARY KEY,
  provider TEXT NOT NULL CHECK(provider IN ('google','facebook','microsoft','x','github')),
  code_verifier TEXT NOT NULL,
  nickname TEXT NOT NULL DEFAULT '',
  link_user_id TEXT,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  nonce TEXT NOT NULL DEFAULT ''
);
INSERT INTO academy_oauth_states(state_hash,provider,code_verifier,nickname,link_user_id,created_at,expires_at,nonce)
  SELECT state_hash,provider,code_verifier,nickname,link_user_id,created_at,expires_at,nonce FROM academy_oauth_states_legacy_fix18;
DROP TABLE academy_oauth_states_legacy_fix18;
CREATE INDEX idx_academy_oauth_states_expiry ON academy_oauth_states(expires_at);
