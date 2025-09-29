-- Path: db/migrations/001_init.sql
-- Base migrations for VISUAL platform
-- This file provides foundation tables beyond core Drizzle schema

-- Stripe events tracking for webhook idempotency
CREATE TABLE IF NOT EXISTS stripe_events (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed BOOLEAN NOT NULL DEFAULT false,
  data JSONB
);

-- Create index for webhook processing efficiency
CREATE INDEX IF NOT EXISTS idx_stripe_events_type ON stripe_events(type);
CREATE INDEX IF NOT EXISTS idx_stripe_events_received ON stripe_events(received_at);

-- Audit trail for compliance and security
CREATE TABLE IF NOT EXISTS audit_log (
  id BIGSERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  actor_id TEXT NOT NULL,
  action_type TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  hmac_signature TEXT NOT NULL
);

-- Create indices for audit queries
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action_type);

-- 2FA TOTP secrets (encrypted at rest in production)
CREATE TABLE IF NOT EXISTS user_2fa (
  user_id TEXT PRIMARY KEY,
  totp_secret TEXT NOT NULL,
  backup_codes TEXT[] NOT NULL DEFAULT '{}',
  enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ
);

-- GDPR data export/deletion tracking
CREATE TABLE IF NOT EXISTS gdpr_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('export', 'deletion')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  file_path TEXT,
  expiry_date TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_gdpr_user ON gdpr_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_gdpr_status ON gdpr_requests(status);