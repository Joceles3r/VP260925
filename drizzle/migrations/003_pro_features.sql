-- Migration 003: Features PRO - 2FA, GDPR, Security Audit, Stripe Webhooks
-- Ajoute les tables nécessaires pour les fonctionnalités enterprise
-- Toutes les tables utilisent des UUID varchar pour cohérence

-- Enums PRO first
CREATE TYPE "twofa_status" AS ENUM('disabled', 'enabled', 'backup_only');
CREATE TYPE "stripe_event_type" AS ENUM('payment_intent.succeeded', 'payment_intent.payment_failed', 'checkout.session.completed', 'charge.refunded', 'payout.paid');
CREATE TYPE "gdpr_request_type" AS ENUM('export', 'deletion');
CREATE TYPE "gdpr_request_status" AS ENUM('pending', 'processing', 'completed', 'failed');

-- Table 2FA TOTP pour authentification renforcée
CREATE TABLE IF NOT EXISTS "user_2fa" (
        "user_id" varchar PRIMARY KEY NOT NULL,
        "totp_secret" text NOT NULL,
        "backup_codes" text[] DEFAULT '{}' NOT NULL,
        "status" "twofa_status" DEFAULT 'disabled' NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "last_used_at" timestamp
);

-- Table RGPD pour conformité européenne
CREATE TABLE IF NOT EXISTS "gdpr_requests" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "user_id" varchar NOT NULL,
        "request_type" "gdpr_request_type" NOT NULL,
        "status" "gdpr_request_status" DEFAULT 'pending' NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "completed_at" timestamp,
        "file_path" text,
        "expiry_date" timestamp
);

-- Table audit trail pour sécurité enterprise
CREATE TABLE IF NOT EXISTS "security_audit_log" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "timestamp" timestamp DEFAULT now() NOT NULL,
        "actor_id" varchar NOT NULL,
        "action_type" varchar NOT NULL,
        "resource_type" varchar NOT NULL,
        "resource_id" varchar,
        "details" jsonb,
        "ip_address" varchar,
        "user_agent" text,
        "hmac_signature" text NOT NULL
);

-- Table Stripe events pour idempotence webhooks
CREATE TABLE IF NOT EXISTS "stripe_events" (
        "id" text PRIMARY KEY NOT NULL,
        "type" "stripe_event_type" NOT NULL,
        "processed" boolean DEFAULT false NOT NULL,
        "data" jsonb,
        "received_at" timestamp DEFAULT now() NOT NULL
);

-- Index performance pour RGPD  
CREATE INDEX IF NOT EXISTS "idx_gdpr_user" ON "gdpr_requests" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "idx_gdpr_status" ON "gdpr_requests" USING btree ("status");

-- Index performance pour audit trail
CREATE INDEX IF NOT EXISTS "idx_security_audit_timestamp" ON "security_audit_log" USING btree ("timestamp");
CREATE INDEX IF NOT EXISTS "idx_security_audit_actor" ON "security_audit_log" USING btree ("actor_id");
CREATE INDEX IF NOT EXISTS "idx_security_audit_action" ON "security_audit_log" USING btree ("action_type");

-- Contraintes FK (optionnelles, dépendent de la politique de référence)
-- ALTER TABLE "user_2fa" ADD CONSTRAINT "user_2fa_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
-- ALTER TABLE "gdpr_requests" ADD CONSTRAINT "gdpr_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;