-- FIX23: dedicated limiter table with a guaranteed PRIMARY KEY for UPSERT.
-- Keep the malformed historical academy_account_rate_limits table untouched.
CREATE TABLE IF NOT EXISTS academy_account_rate_limits_v2 (
  bucket_key TEXT PRIMARY KEY NOT NULL,
  window_start INTEGER NOT NULL,
  request_count INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_academy_account_rate_limits_v2_window
  ON academy_account_rate_limits_v2(window_start);
