-- Migration 007: Visiteurs Mineurs (16-17 ans)
-- Système complet de gestion des utilisateurs mineurs avec restrictions et transition vers majorité

-- ===== ENUMS =====

-- Account types for minors transitioning to majority
CREATE TYPE account_type AS ENUM (
  'visitor_minor',     -- Mineur 16-17 ans
  'visitor_major',     -- Majeur sans profil spécialisé
  'investor',          -- Investisseur (obligatoire post-majorité)
  'investi_lecteur',   -- Investi-lecteur (obligatoire post-majorité)
  'infoporteur'        -- Créateur de contenu
);

-- Minor restriction status
CREATE TYPE minor_status AS ENUM (
  'active',           -- Mineur actif, gains autorisés
  'capped',           -- Mineur ayant atteint le plafond de 200€
  'transitioning',    -- En cours de transition vers majorité
  'locked',           -- Verrou 6 mois post-majorité
  'unlocked'          -- Verrou levé, conversion possible
);

-- ===== TABLES PRINCIPALES =====

-- Minor profiles - Profils des visiteurs mineurs (16-17 ans)
CREATE TABLE minor_profiles (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id) UNIQUE,
  birth_date VARCHAR(10) NOT NULL, -- Format YYYY-MM-DD
  parental_consent BOOLEAN DEFAULT false,
  parental_consent_date TIMESTAMP,
  parent_email VARCHAR, -- Email du parent/tuteur
  social_posting_enabled BOOLEAN DEFAULT false,
  visu_points_earned INTEGER DEFAULT 0, -- VP gagnés depuis inscription
  visu_points_cap INTEGER DEFAULT 20000, -- Cap à 200€ = 20000 VP
  status minor_status DEFAULT 'active',
  -- Transition vers majorité
  majority_date VARCHAR(10) NOT NULL, -- Calcul automatique: birth_date + 18 ans
  transitioned_at TIMESTAMP,
  lock_until TIMESTAMP, -- Verrou 6 mois si cap atteint
  required_account_type account_type DEFAULT 'investor', -- Obligatoire post-majorité
  account_type_chosen account_type, -- Choix effectué
  account_type_chosen_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Minor VISUpoints transactions - Historique des gains VP des mineurs
CREATE TABLE minor_visu_points_transactions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id),
  minor_profile_id VARCHAR NOT NULL REFERENCES minor_profiles(id),
  amount INTEGER NOT NULL, -- VP gagnés (toujours positif pour mineurs)
  balance_before INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  source VARCHAR NOT NULL, -- 'quiz', 'viewing', 'mission', 'educational', etc.
  source_id VARCHAR, -- ID de l'activité source
  description TEXT NOT NULL,
  was_blocked BOOLEAN DEFAULT false, -- true si gain bloqué par cap
  euro_equivalent DECIMAL(8,2), -- Équivalent en euros
  created_at TIMESTAMP DEFAULT NOW()
);

-- Minor notifications - Notifications automatiques pour les mineurs
CREATE TABLE minor_notifications (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id),
  minor_profile_id VARCHAR NOT NULL REFERENCES minor_profiles(id),
  type VARCHAR NOT NULL, -- 'cap_warning_80', 'cap_reached', 'majority_reminder', 'lock_expired'
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  trigger_date TIMESTAMP, -- Date de déclenchement programmé
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Minor admin settings - Paramètres admin pour les visiteurs mineurs
CREATE TABLE minor_admin_settings (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  setting_type VARCHAR NOT NULL, -- 'boolean', 'number', 'string'
  description TEXT,
  updated_by VARCHAR REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ===== INDEX POUR PERFORMANCE =====

-- Minor profiles
CREATE INDEX idx_minor_profiles_user ON minor_profiles(user_id);
CREATE INDEX idx_minor_profiles_status ON minor_profiles(status);
CREATE INDEX idx_minor_profiles_majority_date ON minor_profiles(majority_date);
CREATE INDEX idx_minor_profiles_lock_until ON minor_profiles(lock_until);

-- Minor transactions
CREATE INDEX idx_minor_vp_transactions_user ON minor_visu_points_transactions(user_id);
CREATE INDEX idx_minor_vp_transactions_profile ON minor_visu_points_transactions(minor_profile_id);
CREATE INDEX idx_minor_vp_transactions_source ON minor_visu_points_transactions(source);
CREATE INDEX idx_minor_vp_transactions_date ON minor_visu_points_transactions(created_at);

-- Minor notifications
CREATE INDEX idx_minor_notifications_user ON minor_notifications(user_id);
CREATE INDEX idx_minor_notifications_type ON minor_notifications(type);
CREATE INDEX idx_minor_notifications_trigger ON minor_notifications(trigger_date);
CREATE INDEX idx_minor_notifications_read ON minor_notifications(is_read);

-- Minor admin settings
CREATE INDEX idx_minor_settings_key ON minor_admin_settings(setting_key);

-- ===== PARAMÈTRES PAR DÉFAUT =====

-- Configuration par défaut du système mineur
INSERT INTO minor_admin_settings (setting_key, setting_value, setting_type, description) VALUES
('minor_social_posting_enabled', 'false', 'boolean', 'Autoriser les publications sur le réseau social pour les mineurs'),
('minor_points_cap_value_eur', '200', 'number', 'Plafond de gains en euros pour les mineurs'),
('minor_points_accrual_pause_on_cap', 'true', 'boolean', 'Mettre en pause les gains quand le cap est atteint'),
('post_majority_required_account', 'investor', 'string', 'Type de compte obligatoire post-majorité (investor, investi_lecteur, both)'),
('post_majority_lock_months', '6', 'number', 'Nombre de mois de verrou post-majorité si cap atteint'),
('reminders_enabled', 'true', 'boolean', 'Activer les rappels automatiques'),
('parental_consent_mode', 'false', 'boolean', 'Mode consentement parental activé');

-- ===== FONCTIONS UTILITAIRES =====

-- Fonction pour calculer automatiquement la date de majorité
CREATE OR REPLACE FUNCTION calculate_majority_date(birth_date DATE) 
RETURNS DATE AS $$
BEGIN
    RETURN birth_date + INTERVAL '18 years';
END;
$$ LANGUAGE plpgsql;

-- Fonction pour vérifier si un utilisateur peut faire du cashout
CREATE OR REPLACE FUNCTION can_minor_cashout(
    p_user_id VARCHAR,
    p_check_date TIMESTAMP DEFAULT NOW()
) 
RETURNS BOOLEAN AS $$
DECLARE
    profile_record RECORD;
    is_major BOOLEAN;
BEGIN
    -- Récupérer le profil mineur
    SELECT * INTO profile_record
    FROM minor_profiles 
    WHERE user_id = p_user_id;
    
    -- Si pas de profil mineur, c'est un majeur
    IF NOT FOUND THEN
        RETURN TRUE;
    END IF;
    
    -- Vérifier si majeur (18 ans atteints)
    is_major := (p_check_date::DATE >= (profile_record.birth_date::DATE + INTERVAL '18 years')::DATE);
    
    -- Si encore mineur, pas de cashout
    IF NOT is_major THEN
        RETURN FALSE;
    END IF;
    
    -- Si majeur mais verrou actif
    IF profile_record.lock_until IS NOT NULL AND p_check_date < profile_record.lock_until THEN
        RETURN FALSE;
    END IF;
    
    -- Sinon, cashout autorisé
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ===== TRIGGERS =====

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_minor_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_minor_profile_updated_at
    BEFORE UPDATE ON minor_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_minor_profile_updated_at();

-- ===== COMMENTAIRES DE DOCUMENTATION =====

COMMENT ON TABLE minor_profiles IS 'Profils des visiteurs mineurs (16-17 ans) avec restrictions et transition vers majorité';
COMMENT ON COLUMN minor_profiles.visu_points_cap IS 'Plafond de VISUpoints (défaut: 20000 VP = 200€)';
COMMENT ON COLUMN minor_profiles.lock_until IS 'Verrou de 6 mois post-majorité si cap atteint avant 18 ans';

COMMENT ON TABLE minor_visu_points_transactions IS 'Historique des gains VISUpoints des mineurs (sources non-financières uniquement)';
COMMENT ON COLUMN minor_visu_points_transactions.source IS 'Source du gain: quiz, viewing, mission, educational, etc.';

COMMENT ON TABLE minor_notifications IS 'Notifications automatiques pour les mineurs (seuils, majorité, etc.)';
COMMENT ON TABLE minor_admin_settings IS 'Paramètres configurables par les admins pour le système mineur';

-- ===== RÈGLES MÉTIER DOCUMENTÉES =====

/*
RÈGLES DU SYSTÈME VISITEUR MINEUR:

1. ÉLIGIBILITÉ: 16-17 ans uniquement
2. RESTRICTIONS FINANCIÈRES: Pas d'investissement, vente, cashout
3. PLAFOND VP: 200€ max (20000 VP) jusqu'à la majorité
4. GAINS AUTORISÉS: Quiz, visionnage, missions éducatives uniquement
5. RÉSEAU SOCIAL: Lecture OK, publication OFF (sauf si admin active avec consentement parental)
6. TRANSITION MAJORITÉ: Obligation d'ouvrir compte investisseur/investi-lecteur
7. VERROU POST-MAJORITÉ: 6 mois si cap de 200€ atteint avant 18 ans
8. NOTIFICATIONS: Automatiques à 80% du cap, cap atteint, majorité, fin de verrou
9. CONVERSION: 100 VP = 1€ (applicable après majorité et fin de verrou)
10. KYC: Requis pour toute opération financière post-majorité
*/