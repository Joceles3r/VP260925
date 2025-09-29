-- Path: db/migrations/001_init.sql
CREATE TABLE IF NOT EXISTS stripe_events (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- add other core tables migrations here...
