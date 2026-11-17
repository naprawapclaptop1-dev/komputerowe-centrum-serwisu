-- Akademia Serwisu PRO 3.8.0
-- Global, aggregate website counters. No IP or user-agent is stored.
CREATE TABLE IF NOT EXISTS academy_site_daily_visits (
  visit_day TEXT PRIMARY KEY,
  visits INTEGER NOT NULL DEFAULT 0,
  page_views INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS academy_site_visit_sessions (
  session_hash TEXT NOT NULL,
  visit_day TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (session_hash, visit_day)
);
CREATE INDEX IF NOT EXISTS idx_academy_site_visit_sessions_created
  ON academy_site_visit_sessions(created_at);

CREATE TABLE IF NOT EXISTS academy_site_page_views (
  page_view_hash TEXT PRIMARY KEY,
  visit_day TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_academy_site_page_views_created
  ON academy_site_page_views(created_at);

CREATE TRIGGER IF NOT EXISTS trg_academy_site_session_insert
AFTER INSERT ON academy_site_visit_sessions
BEGIN
  INSERT INTO academy_site_daily_visits (visit_day, visits, page_views, updated_at)
  VALUES (NEW.visit_day, 1, 0, NEW.created_at)
  ON CONFLICT(visit_day) DO UPDATE SET
    visits = academy_site_daily_visits.visits + 1,
    updated_at = NEW.created_at;
END;

CREATE TRIGGER IF NOT EXISTS trg_academy_site_page_view_insert
AFTER INSERT ON academy_site_page_views
BEGIN
  INSERT INTO academy_site_daily_visits (visit_day, visits, page_views, updated_at)
  VALUES (NEW.visit_day, 0, 1, NEW.created_at)
  ON CONFLICT(visit_day) DO UPDATE SET
    page_views = academy_site_daily_visits.page_views + 1,
    updated_at = NEW.created_at;
END;

CREATE TABLE IF NOT EXISTS academy_site_maintenance (
  maintenance_key TEXT PRIMARY KEY,
  maintenance_value TEXT NOT NULL
);
