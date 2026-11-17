-- FIX221: wersjonowanie zapisów stanu i atomowa kontrola konfliktów synchronizacji.
-- Migracja addytywna; istniejące stany otrzymują rewizję początkową 1.
CREATE TABLE IF NOT EXISTS academy_user_state_versions (
  user_id TEXT NOT NULL,
  state_key TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 0 CHECK (revision >= 0),
  write_token TEXT,
  updated_at TEXT,
  PRIMARY KEY (user_id, state_key),
  FOREIGN KEY (user_id) REFERENCES academy_users(id) ON DELETE CASCADE
);
INSERT OR IGNORE INTO academy_user_state_versions(user_id,state_key,revision,write_token,updated_at)
SELECT user_id,state_key,1,NULL,updated_at FROM academy_user_state;
INSERT OR IGNORE INTO academy_user_state_versions(user_id,state_key,revision,write_token,updated_at)
SELECT user_id,state_key,1,NULL,MAX(updated_at) FROM academy_user_state_chunks GROUP BY user_id,state_key;
CREATE INDEX IF NOT EXISTS idx_academy_state_versions_updated
  ON academy_user_state_versions(user_id, updated_at DESC);
