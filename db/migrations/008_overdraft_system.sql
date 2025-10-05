-- Migration pour le système de découvert de solde
-- Crée les tables nécessaires pour gérer les découverts utilisateurs

-- Types énumérés pour le système de découvert
CREATE TYPE overdraft_alert_type AS ENUM ('warning', 'critical', 'blocked');
CREATE TYPE overdraft_incident_type AS ENUM ('account_blocked', 'payment_failed', 'automatic_recovery', 'manual_intervention');
CREATE TYPE incident_status AS ENUM ('open', 'investigating', 'resolved', 'closed');

-- Table des limites de découvert par utilisateur
CREATE TABLE IF NOT EXISTS overdraft_limits (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL UNIQUE, -- Référence à users.id
    limit_amount DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    set_by_admin BOOLEAN DEFAULT false,
    set_by VARCHAR NOT NULL, -- ID de l'utilisateur ou admin qui a défini
    reason TEXT, -- Raison de la modification
    valid_from TIMESTAMP DEFAULT NOW(),
    valid_until TIMESTAMP, -- Optionnel pour limites temporaires
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Index pour les limites de découvert
CREATE INDEX IF NOT EXISTS idx_overdraft_limits_user ON overdraft_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_overdraft_limits_active ON overdraft_limits(is_active);

-- Table des alertes de découvert envoyées
CREATE TABLE IF NOT EXISTS overdraft_alerts (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL, -- Référence à users.id
    alert_type overdraft_alert_type NOT NULL,
    overdraft_amount DECIMAL(10,2) NOT NULL,
    limit_amount DECIMAL(10,2) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    email_sent BOOLEAN DEFAULT false,
    email_sent_at TIMESTAMP,
    sms_sent BOOLEAN DEFAULT false,
    sms_sent_at TIMESTAMP,
    push_sent BOOLEAN DEFAULT false,
    push_sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index pour les alertes de découvert
CREATE INDEX IF NOT EXISTS idx_overdraft_alerts_user ON overdraft_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_overdraft_alerts_type ON overdraft_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_overdraft_alerts_date ON overdraft_alerts(created_at);
CREATE INDEX IF NOT EXISTS idx_overdraft_alerts_unread ON overdraft_alerts(is_read);

-- Table des incidents de découvert (blocages, échecs de paiement, etc.)
CREATE TABLE IF NOT EXISTS overdraft_incidents (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL, -- Référence à users.id
    incident_type overdraft_incident_type NOT NULL,
    status incident_status DEFAULT 'open',
    overdraft_amount DECIMAL(10,2) NOT NULL,
    limit_amount DECIMAL(10,2) NOT NULL,
    description TEXT NOT NULL,
    admin_notes TEXT, -- Notes internes admin
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP,
    resolved_by VARCHAR, -- ID admin qui a résolu
    auto_resolved BOOLEAN DEFAULT false,
    
    -- Métadonnées pour tracking
    transaction_id VARCHAR, -- Transaction qui a causé l'incident
    payment_intent_id VARCHAR, -- Stripe payment intent
    error_code VARCHAR, -- Code d'erreur technique
    error_message TEXT, -- Message d'erreur détaillé
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Index pour les incidents de découvert
CREATE INDEX IF NOT EXISTS idx_overdraft_incidents_user ON overdraft_incidents(user_id);
CREATE INDEX IF NOT EXISTS idx_overdraft_incidents_type ON overdraft_incidents(incident_type);
CREATE INDEX IF NOT EXISTS idx_overdraft_incidents_status ON overdraft_incidents(status);
CREATE INDEX IF NOT EXISTS idx_overdraft_incidents_resolved ON overdraft_incidents(is_resolved);
CREATE INDEX IF NOT EXISTS idx_overdraft_incidents_date ON overdraft_incidents(created_at);

-- Table des frais de découvert
CREATE TABLE IF NOT EXISTS overdraft_fees (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL, -- Référence à users.id
    overdraft_amount DECIMAL(10,2) NOT NULL,
    fee_amount DECIMAL(10,2) NOT NULL,
    fee_rate DECIMAL(5,4) NOT NULL, -- Taux journalier
    days_in_overdraft INTEGER NOT NULL,
    calculated_at TIMESTAMP DEFAULT NOW(),
    
    -- Statut du prélèvement
    is_charged BOOLEAN DEFAULT false,
    charged_at TIMESTAMP,
    transaction_id VARCHAR, -- Transaction du prélèvement
    payment_intent_id VARCHAR, -- Stripe payment intent
    
    -- Période couverte
    period_start TIMESTAMP NOT NULL,
    period_end TIMESTAMP NOT NULL,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index pour les frais de découvert
CREATE INDEX IF NOT EXISTS idx_overdraft_fees_user ON overdraft_fees(user_id);
CREATE INDEX IF NOT EXISTS idx_overdraft_fees_period ON overdraft_fees(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_overdraft_fees_charged ON overdraft_fees(is_charged);

-- Table de configuration des découverts (paramètres globaux)
CREATE TABLE IF NOT EXISTS overdraft_config (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT NOT NULL,
    config_type VARCHAR NOT NULL, -- 'number', 'boolean', 'string'
    description TEXT,
    category VARCHAR DEFAULT 'general', -- 'limits', 'fees', 'alerts', 'general'
    is_editable BOOLEAN DEFAULT true,
    updated_by VARCHAR, -- Référence à users.id
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Index pour la configuration
CREATE INDEX IF NOT EXISTS idx_overdraft_config_key ON overdraft_config(config_key);
CREATE INDEX IF NOT EXISTS idx_overdraft_config_category ON overdraft_config(category);

-- Insertion des paramètres de configuration par défaut
INSERT INTO overdraft_config (config_key, config_value, config_type, description, category) VALUES
('default_limit_investor', '500.00', 'number', 'Limite par défaut pour les investisseurs (€)', 'limits'),
('default_limit_creator', '300.00', 'number', 'Limite par défaut pour les créateurs (€)', 'limits'),
('default_limit_admin', '1000.00', 'number', 'Limite par défaut pour les administrateurs (€)', 'limits'),
('default_limit_invested_reader', '200.00', 'number', 'Limite par défaut pour les investi-lecteurs (€)', 'limits'),
('warning_threshold', '0.75', 'number', 'Seuil d''alerte préventive (75%)', 'alerts'),
('critical_threshold', '0.90', 'number', 'Seuil d''alerte critique (90%)', 'alerts'),
('daily_fee_rate', '0.001', 'number', 'Taux de frais journalier (0.1%)', 'fees'),
('max_monthly_fees', '50.00', 'number', 'Frais maximum par mois (€)', 'fees'),
('grace_period_days', '7', 'number', 'Période de grâce avant blocage (jours)', 'general'),
('auto_block_enabled', 'true', 'boolean', 'Blocage automatique activé', 'general'),
('alerts_enabled', 'true', 'boolean', 'Alertes automatiques activées', 'alerts')
ON CONFLICT (config_key) DO NOTHING;

-- Trigger pour mettre à jour le timestamp updated_at
CREATE OR REPLACE FUNCTION update_overdraft_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Application des triggers
CREATE TRIGGER update_overdraft_limits_updated_at BEFORE UPDATE ON overdraft_limits 
    FOR EACH ROW EXECUTE FUNCTION update_overdraft_updated_at_column();

CREATE TRIGGER update_overdraft_incidents_updated_at BEFORE UPDATE ON overdraft_incidents 
    FOR EACH ROW EXECUTE FUNCTION update_overdraft_updated_at_column();

CREATE TRIGGER update_overdraft_config_updated_at BEFORE UPDATE ON overdraft_config 
    FOR EACH ROW EXECUTE FUNCTION update_overdraft_updated_at_column();

-- Commentaires pour documentation
COMMENT ON TABLE overdraft_limits IS 'Limites de découvert personnalisées par utilisateur';
COMMENT ON TABLE overdraft_alerts IS 'Alertes de découvert envoyées aux utilisateurs';
COMMENT ON TABLE overdraft_incidents IS 'Incidents de découvert (blocages, échecs, etc.)';
COMMENT ON TABLE overdraft_fees IS 'Historique des frais de découvert calculés et prélevés';
COMMENT ON TABLE overdraft_config IS 'Configuration globale du système de découvert';

-- Contraintes de sécurité
ALTER TABLE overdraft_limits ADD CONSTRAINT chk_limit_amount_positive CHECK (limit_amount >= 0);
ALTER TABLE overdraft_limits ADD CONSTRAINT chk_limit_amount_reasonable CHECK (limit_amount <= 5000); -- Max €5000

ALTER TABLE overdraft_alerts ADD CONSTRAINT chk_overdraft_amount_positive CHECK (overdraft_amount >= 0);
ALTER TABLE overdraft_alerts ADD CONSTRAINT chk_limit_amount_positive CHECK (limit_amount >= 0);

ALTER TABLE overdraft_incidents ADD CONSTRAINT chk_incident_overdraft_amount_positive CHECK (overdraft_amount >= 0);
ALTER TABLE overdraft_incidents ADD CONSTRAINT chk_incident_limit_amount_positive CHECK (limit_amount >= 0);

ALTER TABLE overdraft_fees ADD CONSTRAINT chk_fee_overdraft_amount_positive CHECK (overdraft_amount >= 0);
ALTER TABLE overdraft_fees ADD CONSTRAINT chk_fee_amount_positive CHECK (fee_amount >= 0);
ALTER TABLE overdraft_fees ADD CONSTRAINT chk_fee_rate_valid CHECK (fee_rate >= 0 AND fee_rate <= 0.1); -- Max 10% par jour
ALTER TABLE overdraft_fees ADD CONSTRAINT chk_days_positive CHECK (days_in_overdraft > 0);
ALTER TABLE overdraft_fees ADD CONSTRAINT chk_period_valid CHECK (period_end > period_start);

-- Politique RLS (Row Level Security) - à activer si nécessaire
-- ALTER TABLE overdraft_limits ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE overdraft_alerts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE overdraft_incidents ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE overdraft_fees ENABLE ROW LEVEL SECURITY;