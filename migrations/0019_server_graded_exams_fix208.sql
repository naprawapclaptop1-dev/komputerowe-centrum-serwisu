-- FIX208: serwerowo oceniane podejścia egzaminacyjne i publiczne wpisy certyfikatów.
-- Migracja wyłącznie addytywna; nie modyfikuje ani nie usuwa istniejących certyfikatów.
CREATE TABLE IF NOT EXISTS academy_exam_attempts (
  attempt_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  course_title TEXT NOT NULL,
  student_name TEXT NOT NULL,
  question_payload TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'started' CHECK (status IN ('started','submitted','expired')),
  started_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  submitted_at TEXT,
  score INTEGER,
  passed INTEGER NOT NULL DEFAULT 0 CHECK (passed IN (0,1)),
  certificate_id TEXT,
  FOREIGN KEY (user_id) REFERENCES academy_users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_academy_exam_attempts_user_started
  ON academy_exam_attempts(user_id, started_at);
CREATE TABLE IF NOT EXISTS academy_certificates (
  certificate_id TEXT PRIMARY KEY,
  attempt_id TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  course_title TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score BETWEEN 70 AND 100),
  created_at TEXT NOT NULL,
  product_version TEXT NOT NULL DEFAULT '6.8.0',
  FOREIGN KEY (attempt_id) REFERENCES academy_exam_attempts(attempt_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES academy_users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_academy_certificates_user_created
  ON academy_certificates(user_id, created_at);
