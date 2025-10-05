-- Migration 005: Messagerie Interne VISUAL
-- Ajout du système de messagerie interne pour contacter les responsables

-- ===== ENUMS =====

-- Sujets de messages avec niveaux de priorité
CREATE TYPE message_subject AS ENUM (
  'probleme_paiement',        -- URGENT - Problème de paiement/virement
  'escroquerie_fraude',       -- URGENT - Signalement d'escroquerie/fraude  
  'erreur_prelevement',       -- URGENT - Erreur de prélèvement/remboursement
  'probleme_compte',          -- URGENT - Problème d'accès compte
  'signalement_bug',          -- MOYEN - Signalement de bug
  'question_projet',          -- BAS - Question sur un projet
  'question_investissement',  -- BAS - Question sur un investissement
  'demande_aide',            -- BAS - Demande d'aide générale
  'autre_demande'            -- BAS - Autre demande
);

-- Priorités des messages
CREATE TYPE message_priority AS ENUM (
  'urgent',    -- Rouge - Problèmes financiers critiques
  'medium',    -- Orange - Bugs techniques
  'low'        -- Vert - Questions générales
);

-- Statuts des messages
CREATE TYPE message_status AS ENUM (
  'unread',      -- Non lu
  'read',        -- Lu
  'in_progress', -- En cours de traitement
  'resolved',    -- Résolu
  'archived'     -- Archivé
);

-- ===== TABLES =====

-- Table principale des messages internes
CREATE TABLE internal_messages (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id),
  user_type VARCHAR NOT NULL, -- Type de profil utilisateur au moment de l'envoi
  subject message_subject NOT NULL,
  subject_custom VARCHAR, -- Pour "autre_demande"
  message TEXT NOT NULL,
  priority message_priority NOT NULL DEFAULT 'low',
  status message_status NOT NULL DEFAULT 'unread',
  admin_notes TEXT, -- Notes internes de l'admin
  handled_by VARCHAR REFERENCES users(id), -- Admin qui traite le message
  handled_at TIMESTAMP,
  email_sent BOOLEAN DEFAULT false, -- Notification email envoyée
  email_sent_at TIMESTAMP,
  ip_address VARCHAR, -- Sécurité
  user_agent TEXT, -- Sécurité
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table de limitation anti-spam
CREATE TABLE message_rate_limit (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id),
  date VARCHAR(10) NOT NULL, -- Format YYYY-MM-DD
  message_count INTEGER DEFAULT 1,
  max_messages INTEGER DEFAULT 3, -- Limite par jour
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, date)
);

-- Table de configuration du bouton flottant
CREATE TABLE floating_button_config (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  is_enabled BOOLEAN DEFAULT true,
  button_text VARCHAR DEFAULT 'Contacter le Responsable',
  button_color VARCHAR DEFAULT '#dc2626', -- Rouge par défaut
  position VARCHAR DEFAULT 'bottom-right', -- bottom-right, bottom-left
  updated_by VARCHAR REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ===== INDEX POUR PERFORMANCE =====

-- Index pour recherche et tri des messages
CREATE INDEX idx_internal_messages_user ON internal_messages(user_id);
CREATE INDEX idx_internal_messages_status ON internal_messages(status);
CREATE INDEX idx_internal_messages_priority ON internal_messages(priority);
CREATE INDEX idx_internal_messages_created ON internal_messages(created_at);
CREATE INDEX idx_internal_messages_subject ON internal_messages(subject);

-- Index pour anti-spam
CREATE INDEX idx_rate_limit_user ON message_rate_limit(user_id);
CREATE INDEX idx_rate_limit_date ON message_rate_limit(date);

-- ===== DONNÉES INITIALES =====

-- Configuration par défaut du bouton flottant
INSERT INTO floating_button_config (is_enabled, button_text, button_color, position, updated_by)
VALUES (true, 'Contacter le Responsable', '#dc2626', 'bottom-right', NULL);

-- ===== COMMENTAIRES DE DOCUMENTATION =====

COMMENT ON TABLE internal_messages IS 'Messages internes pour contacter les responsables VISUAL';
COMMENT ON COLUMN internal_messages.priority IS 'urgent=rouge (financier), medium=orange (bug), low=vert (général)';
COMMENT ON COLUMN internal_messages.user_type IS 'Types de profil utilisateur au moment de l\'envoi (investor,creator,etc.)';

COMMENT ON TABLE message_rate_limit IS 'Anti-spam : limite de 3 messages par jour par utilisateur';
COMMENT ON TABLE floating_button_config IS 'Configuration administrable du bouton flottant de contact';