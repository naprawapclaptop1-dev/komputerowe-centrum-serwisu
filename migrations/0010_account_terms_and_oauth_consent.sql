-- FIX18: record acceptance of platform terms separately from optional cloud-learning sync consent.
-- Existing user accounts are preserved; historical acceptance is deliberately left NULL.
ALTER TABLE academy_users ADD COLUMN terms_accepted_at TEXT;
ALTER TABLE academy_users ADD COLUMN terms_version TEXT;
ALTER TABLE academy_oauth_states ADD COLUMN terms_accepted INTEGER NOT NULL DEFAULT 0;
