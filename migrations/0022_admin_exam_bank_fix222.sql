-- FIX222: pytania dodatkowe zarządzane przez administratora; pytania wbudowane pozostają nienaruszone.
CREATE TABLE IF NOT EXISTS academy_exam_question_bank (
  question_id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('podstawowy','średni','zaawansowany')),
  prompt TEXT NOT NULL CHECK (length(prompt) BETWEEN 12 AND 500),
  options_json TEXT NOT NULL,
  correct_index INTEGER NOT NULL CHECK (correct_index BETWEEN 0 AND 5),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_academy_exam_bank_active_category
  ON academy_exam_question_bank(status, category, difficulty);
