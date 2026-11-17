-- FIX20: dedicated, idempotent rate-limit storage for account and API requests.
-- Keeps the legacy academy_rate_limits table untouched and avoids runtime failure when
-- older D1 installations have an incomplete legacy limiter schema.
CREATE TABLE IF NOT EXISTS academy_account_rate_limits (
  bucket_key TEXT PRIMARY KEY,
  window_start INTEGER NOT NULL,
  request_count INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_academy_account_rate_limits_window
  ON academy_account_rate_limits(window_start);
