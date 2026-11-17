-- FIX36: addytywne centrum społeczności, propozycje, głosy, zgody publiczne, obserwowanie aktualności i jawne koszty.
-- Nie modyfikuje istniejących kont, zgłoszeń wiedzy, płatności ani danych wizyt.
CREATE TABLE IF NOT EXISTS academy_support_proposals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES academy_users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Inne',
  details TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
  moderation_note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  reviewed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_support_proposals_status_created ON academy_support_proposals(status, created_at DESC);
CREATE TABLE IF NOT EXISTS academy_support_proposal_votes (
  id TEXT PRIMARY KEY,
  proposal_id TEXT NOT NULL REFERENCES academy_support_proposals(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES academy_users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  UNIQUE(proposal_id,user_id)
);
CREATE INDEX IF NOT EXISTS idx_support_votes_proposal ON academy_support_proposal_votes(proposal_id);
CREATE TABLE IF NOT EXISTS academy_support_thanks (
  user_id TEXT PRIMARY KEY REFERENCES academy_users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  show_public INTEGER NOT NULL DEFAULT 0 CHECK(show_public IN (0,1)),
  consent_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_support_thanks_public ON academy_support_thanks(show_public, updated_at DESC);
CREATE TABLE IF NOT EXISTS academy_support_subscriptions (
  user_id TEXT PRIMARY KEY REFERENCES academy_users(id) ON DELETE CASCADE,
  enabled INTEGER NOT NULL DEFAULT 0 CHECK(enabled IN (0,1)),
  last_seen_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS academy_support_costs (
  id TEXT PRIMARY KEY,
  period TEXT NOT NULL,
  category TEXT NOT NULL,
  amount_minor INTEGER NOT NULL CHECK(amount_minor > 0),
  currency TEXT NOT NULL DEFAULT 'PLN' CHECK(currency='PLN'),
  note TEXT NOT NULL DEFAULT '',
  evidence_url TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published')),
  created_at TEXT NOT NULL,
  published_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_support_costs_public ON academy_support_costs(status, period DESC, created_at DESC);
CREATE TABLE IF NOT EXISTS academy_support_announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'release' CHECK(kind IN ('release','lesson','maintenance','community')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published')),
  created_at TEXT NOT NULL,
  published_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_support_announcements_public ON academy_support_announcements(status, published_at DESC);
