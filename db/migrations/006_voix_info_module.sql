-- Migration 006: Module "Voix de l'Info" - Système TOP 10 + Golden Ticket
-- Implémentation complète du module Infoporteurs/Investi-lecteurs avec système de classement

-- ===== ENUMS =====

-- Categories d'articles
CREATE TYPE article_category AS ENUM (
  'actualite',        -- Actualités
  'politique',        -- Politique
  'economie',         -- Économie
  'tech',            -- Technologie
  'sport',           -- Sport
  'culture',         -- Culture
  'science',         -- Science
  'sante',           -- Santé
  'environnement',   -- Environnement
  'societe',         -- Société
  'international',   -- International
  'autre'            -- Autre
);

-- Statuts des articles
CREATE TYPE article_status AS ENUM (
  'draft',      -- Brouillon
  'pending',    -- En attente de modération
  'active',     -- Actif et visible
  'paused',     -- Mis en pause par l'auteur
  'rejected',   -- Rejeté par modération
  'archived'    -- Archivé
);

-- Statuts des golden tickets
CREATE TYPE golden_ticket_status AS ENUM (
  'active',     -- Ticket actif dans la compétition
  'completed',  -- Compétition terminée - en attente de résultats
  'refunded',   -- Ticket remboursé selon classement
  'expired'     -- Ticket expiré
);

-- Statuts des classements quotidiens
CREATE TYPE ranking_status AS ENUM (
  'ongoing',    -- Journée en cours
  'calculating', -- Calcul en cours
  'completed',  -- Classement finalisé
  'distributed' -- Gains distribués
);

-- ===== TABLES PRINCIPALES =====

-- Profils Infoporteurs (créateurs de contenu)
CREATE TABLE infoporteur_profiles (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id) UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  bio TEXT,
  avatar VARCHAR, -- URL de l'avatar
  specialties TEXT, -- JSON array des spécialités
  caution_paid BOOLEAN DEFAULT false,
  caution_amount DECIMAL(10,2) DEFAULT 10.00,
  caution_paid_at TIMESTAMP,
  total_articles INTEGER DEFAULT 0,
  total_sales DECIMAL(12,2) DEFAULT 0.00,
  top10_count INTEGER DEFAULT 0, -- Nombre de fois dans le TOP 10
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Profils Investi-lecteurs (investisseurs/lecteurs)
CREATE TABLE investi_lecteur_profiles (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id) UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  avatar VARCHAR, -- URL de l'avatar
  caution_paid BOOLEAN DEFAULT false,
  caution_amount DECIMAL(10,2) DEFAULT 20.00,
  caution_paid_at TIMESTAMP,
  visu_points INTEGER DEFAULT 0, -- Solde VISUpoints
  total_invested DECIMAL(12,2) DEFAULT 0.00,
  total_winnings DECIMAL(12,2) DEFAULT 0.00,
  winning_streaks INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Articles créés par les infoporteurs
CREATE TABLE voix_info_articles (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  infoporteur_id VARCHAR NOT NULL REFERENCES infoporteur_profiles(id),
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(250) NOT NULL UNIQUE,
  excerpt VARCHAR(500),
  content TEXT NOT NULL,
  category article_category NOT NULL,
  price_euros DECIMAL(5,2) NOT NULL, -- 0.2 à 5.00
  cover_image VARCHAR, -- URL image de couverture
  tags TEXT, -- JSON array des tags
  status article_status DEFAULT 'draft',
  moderated_by VARCHAR REFERENCES users(id),
  moderated_at TIMESTAMP,
  moderation_notes TEXT,
  reading_time INTEGER, -- Minutes estimées
  total_sales INTEGER DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  published_at TIMESTAMP
);

-- Achats d'articles par les investi-lecteurs
CREATE TABLE article_purchases (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id VARCHAR NOT NULL REFERENCES voix_info_articles(id),
  investi_lecteur_id VARCHAR NOT NULL REFERENCES investi_lecteur_profiles(id),
  price_euros DECIMAL(5,2) NOT NULL,
  visu_points_spent INTEGER NOT NULL,
  votes INTEGER NOT NULL, -- Calculé selon le barème (1 vote = 0.10€)
  payment_intent_id VARCHAR, -- Stripe payment intent
  refunded BOOLEAN DEFAULT false,
  refunded_at TIMESTAMP,
  refund_amount DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(article_id, investi_lecteur_id) -- Un achat par article par utilisateur
);

-- Classements quotidiens TOP 10
CREATE TABLE daily_rankings (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  ranking_date VARCHAR(10) NOT NULL, -- Format YYYY-MM-DD
  infoporteur_id VARCHAR NOT NULL REFERENCES infoporteur_profiles(id),
  rank INTEGER NOT NULL, -- 1 à 100+
  total_sales INTEGER NOT NULL, -- Nombre de ventes
  total_revenue DECIMAL(10,2) NOT NULL,
  is_top10 BOOLEAN NOT NULL DEFAULT false,
  bonus_earned DECIMAL(10,2) DEFAULT 0.00,
  status ranking_status DEFAULT 'ongoing',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(ranking_date, infoporteur_id)
);

-- Golden tickets - Tickets premium mensuels
CREATE TABLE golden_tickets (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  investi_lecteur_id VARCHAR NOT NULL REFERENCES investi_lecteur_profiles(id),
  month_year VARCHAR(7) NOT NULL, -- Format YYYY-MM
  tier INTEGER NOT NULL, -- 1=50€, 2=75€, 3=100€
  amount_euros DECIMAL(5,2) NOT NULL,
  votes INTEGER NOT NULL, -- 20, 30, ou 40 selon le tier
  visu_points_spent INTEGER NOT NULL,
  target_infoporteur_id VARCHAR REFERENCES infoporteur_profiles(id),
  final_rank INTEGER, -- Rang final de l'infoporteur ciblé
  refund_percentage INTEGER DEFAULT 0, -- 0, 50, ou 100%
  refund_amount DECIMAL(5,2) DEFAULT 0.00,
  status golden_ticket_status DEFAULT 'active',
  payment_intent_id VARCHAR, -- Stripe payment intent
  refunded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(investi_lecteur_id, month_year) -- Un ticket par mois par utilisateur
);

-- Transactions VISUpoints - Historique complet
CREATE TABLE visu_points_transactions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id),
  type VARCHAR NOT NULL, -- 'purchase', 'spend', 'refund', 'bonus', 'cashout'
  amount INTEGER NOT NULL, -- Peut être négatif pour les dépenses
  balance_before INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  euro_amount DECIMAL(10,2), -- Montant en euros si applicable
  description TEXT NOT NULL,
  related_id VARCHAR, -- ID de l'élément associé
  related_type VARCHAR, -- 'article_purchase', 'golden_ticket', 'pack_purchase', etc.
  payment_intent_id VARCHAR, -- Stripe payment intent si applicable
  created_at TIMESTAMP DEFAULT NOW()
);

-- Distribution quotidienne des gains du pot commun
CREATE TABLE daily_pot_distribution (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  distribution_date VARCHAR(10) NOT NULL, -- Format YYYY-MM-DD
  total_pot_euros DECIMAL(12,2) NOT NULL,
  top10_infoporteur_share DECIMAL(12,2) NOT NULL, -- 50%
  investi_lecteur_share DECIMAL(12,2) NOT NULL, -- 50%
  total_winning_votes INTEGER NOT NULL,
  total_winning_investi_lecteurs INTEGER NOT NULL,
  visual_commission DECIMAL(12,2) DEFAULT 0.00, -- 0% selon validation
  status ranking_status DEFAULT 'calculating',
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ===== INDEX POUR PERFORMANCE =====

-- Infoporteurs
CREATE INDEX idx_infoporteur_user ON infoporteur_profiles(user_id);
CREATE INDEX idx_infoporteur_active ON infoporteur_profiles(is_active);
CREATE INDEX idx_infoporteur_top10 ON infoporteur_profiles(top10_count);

-- Investi-lecteurs
CREATE INDEX idx_investi_lecteur_user ON investi_lecteur_profiles(user_id);
CREATE INDEX idx_investi_lecteur_active ON investi_lecteur_profiles(is_active);
CREATE INDEX idx_investi_lecteur_points ON investi_lecteur_profiles(visu_points);

-- Articles
CREATE INDEX idx_articles_infoporteur ON voix_info_articles(infoporteur_id);
CREATE INDEX idx_articles_status ON voix_info_articles(status);
CREATE INDEX idx_articles_category ON voix_info_articles(category);
CREATE INDEX idx_articles_price ON voix_info_articles(price_euros);
CREATE INDEX idx_articles_sales ON voix_info_articles(total_sales);
CREATE INDEX idx_articles_published ON voix_info_articles(published_at);

-- Achats
CREATE INDEX idx_purchases_article ON article_purchases(article_id);
CREATE INDEX idx_purchases_investi ON article_purchases(investi_lecteur_id);
CREATE INDEX idx_purchases_date ON article_purchases(created_at);

-- Classements
CREATE INDEX idx_rankings_date ON daily_rankings(ranking_date);
CREATE INDEX idx_rankings_infoporteur ON daily_rankings(infoporteur_id);
CREATE INDEX idx_rankings_rank ON daily_rankings(rank);
CREATE INDEX idx_rankings_top10 ON daily_rankings(is_top10);

-- Golden tickets
CREATE INDEX idx_golden_tickets_investi ON golden_tickets(investi_lecteur_id);
CREATE INDEX idx_golden_tickets_month ON golden_tickets(month_year);
CREATE INDEX idx_golden_tickets_tier ON golden_tickets(tier);
CREATE INDEX idx_golden_tickets_status ON golden_tickets(status);

-- Transactions VISUpoints
CREATE INDEX idx_vp_transactions_user ON visu_points_transactions(user_id);
CREATE INDEX idx_vp_transactions_type ON visu_points_transactions(type);
CREATE INDEX idx_vp_transactions_date ON visu_points_transactions(created_at);
CREATE INDEX idx_vp_transactions_related ON visu_points_transactions(related_id, related_type);

-- Distribution
CREATE INDEX idx_pot_distribution_date ON daily_pot_distribution(distribution_date);
CREATE INDEX idx_pot_distribution_status ON daily_pot_distribution(status);

-- ===== DONNÉES INITIALES =====

-- Aucune donnée initiale requise - les profils seront créés à l'inscription

-- ===== COMMENTAIRES DE DOCUMENTATION =====

COMMENT ON TABLE infoporteur_profiles IS 'Profils des créateurs de contenu (Infoporteurs)';
COMMENT ON TABLE investi_lecteur_profiles IS 'Profils des investisseurs/lecteurs';
COMMENT ON TABLE voix_info_articles IS 'Articles créés par les infoporteurs - prix 0.2€ à 5€';
COMMENT ON TABLE article_purchases IS 'Achats d articles par les investi-lecteurs';
COMMENT ON TABLE daily_rankings IS 'Classements quotidiens TOP 10 des infoporteurs';
COMMENT ON TABLE golden_tickets IS 'Tickets premium mensuels 50€/75€/100€';
COMMENT ON TABLE visu_points_transactions IS 'Historique complet des transactions VISUpoints';
COMMENT ON TABLE daily_pot_distribution IS 'Distribution quotidienne des gains du pot commun';

-- Contraintes de prix validées
COMMENT ON COLUMN voix_info_articles.price_euros IS 'Prix autorisés : 0.2, 0.5, 1, 2, 3, 4, 5 euros';
COMMENT ON COLUMN golden_tickets.tier IS '1=50€+20votes, 2=75€+30votes, 3=100€+40votes';
COMMENT ON COLUMN article_purchases.votes IS 'Barème : 1 vote = 0.10€ = 10 VISUpoints';