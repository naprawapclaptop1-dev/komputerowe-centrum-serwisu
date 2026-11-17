-- FIX204: większe stany edukacyjne synchronizowane porcjami.
-- Addytywna tabela; academy_user_state pozostaje źródłem kompatybilnych małych wpisów.
CREATE TABLE IF NOT EXISTS academy_user_state_chunks (
  user_id TEXT NOT NULL,
  state_key TEXT NOT NULL,
  chunk_index INTEGER NOT NULL CHECK (chunk_index >= 0 AND chunk_index < 12),
  chunk_total INTEGER NOT NULL CHECK (chunk_total BETWEEN 2 AND 12),
  chunk_json TEXT NOT NULL CHECK (length(chunk_json) <= 30000),
  updated_at TEXT NOT NULL,
  PRIMARY KEY (user_id, state_key, chunk_index),
  FOREIGN KEY (user_id) REFERENCES academy_users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_academy_user_state_chunks_updated
  ON academy_user_state_chunks(user_id, updated_at);
