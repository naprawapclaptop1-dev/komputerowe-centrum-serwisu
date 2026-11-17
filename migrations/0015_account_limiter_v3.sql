-- FIX24: isolated limiter storage with a single-column PRIMARY KEY.
-- This avoids any malformed legacy/v2 limiter schema left by earlier releases.
-- Existing tables and account data are preserved; this table stores only throttling counters.
CREATE TABLE IF NOT EXISTS academy_account_rate_limits_v3 (
  bucket_key TEXT NOT NULL PRIMARY KEY,
  window_start INTEGER NOT NULL,
  request_count INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_academy_account_rate_limits_v3_window
  ON academy_account_rate_limits_v3(window_start);
