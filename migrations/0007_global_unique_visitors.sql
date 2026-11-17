-- Akademia Serwisu PRO 5.2.0 — persistent privacy-preserving browser visitor totals.
-- This table stores only SHA-256 hashes of random browser-generated IDs; no IP, UA or fingerprint.
-- Existing daily visit and page-view aggregates are deliberately untouched.
CREATE TABLE IF NOT EXISTS academy_site_unique_visitors (
  visitor_hash TEXT PRIMARY KEY,
  first_seen_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_academy_site_unique_visitors_last_seen
  ON academy_site_unique_visitors(last_seen_at);

-- Backfill the retained 90-day session hashes so the new unique-session counter
-- starts with available history instead of displaying zero after upgrade.
INSERT OR IGNORE INTO academy_site_unique_visitors (visitor_hash, first_seen_at, last_seen_at)
SELECT session_hash, MIN(created_at), MAX(created_at)
FROM academy_site_visit_sessions
GROUP BY session_hash;
