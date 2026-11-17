-- Akademia Serwisu PRO 3.6.0: jawna licencja do zgłoszeń oraz ocena odpowiedzi czatu.
ALTER TABLE academy_knowledge_submissions ADD COLUMN rights_confirmed_at TEXT;
ALTER TABLE academy_knowledge_submissions ADD COLUMN license_code TEXT;
ALTER TABLE academy_knowledge_submissions ADD COLUMN attribution TEXT;
ALTER TABLE academy_knowledge_approved ADD COLUMN license_code TEXT;
ALTER TABLE academy_knowledge_approved ADD COLUMN attribution TEXT;

CREATE TABLE IF NOT EXISTS academy_message_feedback (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES academy_users(id) ON DELETE CASCADE,
  message_id TEXT NOT NULL REFERENCES academy_messages(id) ON DELETE CASCADE,
  conversation_id TEXT NOT NULL REFERENCES academy_conversations(id) ON DELETE CASCADE,
  rating TEXT NOT NULL CHECK(rating IN ('helpful','not_helpful')),
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  UNIQUE(user_id,message_id)
);
CREATE INDEX IF NOT EXISTS idx_academy_feedback_created ON academy_message_feedback(created_at DESC);
