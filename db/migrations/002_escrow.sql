-- Path: db/migrations/002_escrow.sql
-- Escrow system for secure transactions (Petites Annonces)

-- Main escrow transactions table
CREATE TABLE IF NOT EXISTS escrow_transactions (
  id TEXT PRIMARY KEY,
  buyer_id TEXT NOT NULL,
  seller_id TEXT NOT NULL,
  listing_id TEXT, -- Reference to petite annonce
  amount_cents BIGINT NOT NULL CHECK (amount_cents > 0),
  fee_cents BIGINT NOT NULL CHECK (fee_cents >= 0),
  stripe_payment_intent TEXT NOT NULL UNIQUE,
  stripe_account_id TEXT, -- For marketplace payments
  status TEXT NOT NULL CHECK (status IN ('HELD','RELEASED','REFUNDED','DISPUTED')),
  hold_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  held_until TIMESTAMPTZ, -- Auto-release date
  released_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  dispute_opened_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);

-- Escrow status transitions for audit trail
CREATE TABLE IF NOT EXISTS escrow_status_history (
  id BIGSERIAL PRIMARY KEY,
  escrow_id TEXT NOT NULL REFERENCES escrow_transactions(id),
  from_status TEXT NOT NULL,
  to_status TEXT NOT NULL,
  reason TEXT,
  changed_by TEXT NOT NULL, -- user_id or 'system'
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

-- Escrow dispute resolution
CREATE TABLE IF NOT EXISTS escrow_disputes (
  id TEXT PRIMARY KEY,
  escrow_id TEXT NOT NULL REFERENCES escrow_transactions(id),
  initiated_by TEXT NOT NULL, -- 'buyer' or 'seller'
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('open','investigating','resolved_buyer','resolved_seller','cancelled')),
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT -- admin user_id
);

-- Create indices for performance
CREATE INDEX IF NOT EXISTS idx_escrow_buyer ON escrow_transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_escrow_seller ON escrow_transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_escrow_status ON escrow_transactions(status);
CREATE INDEX IF NOT EXISTS idx_escrow_stripe_pi ON escrow_transactions(stripe_payment_intent);
CREATE INDEX IF NOT EXISTS idx_escrow_created ON escrow_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_escrow_history_escrow ON escrow_status_history(escrow_id);
CREATE INDEX IF NOT EXISTS idx_disputes_escrow ON escrow_disputes(escrow_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON escrow_disputes(status);