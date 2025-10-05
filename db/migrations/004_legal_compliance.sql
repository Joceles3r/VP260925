/*
  # Migration: Conformité Légale Européenne et Française

  Cette migration implémente la conformité VISUAL aux lois européennes et françaises.

  ## 1. Nouvelles Tables
    - `legal_terms` : Stockage des règlements, CGU, CGV, mentions légales
    - `user_consents` : Historique des consentements utilisateurs
    - `legal_compliance_logs` : Logs d'audit pour la conformité

  ## 2. Types de Contenus Légaux
    - `terms_of_service` : Conditions Générales d'Utilisation
    - `privacy_policy` : Politique de Confidentialité (RGPD)
    - `cookie_policy` : Politique des Cookies
    - `legal_notice` : Mentions Légales
    - `investment_rules` : Règlement des Investissements
    - `platform_rules` : Règlement de la Plateforme

  ## 3. Sécurité
    - RLS activé sur toutes les tables
    - Politique de lecture publique pour legal_terms (transparence)
    - Politique stricte pour user_consents et compliance_logs

  ## 4. Conformité
    - RGPD (Règlement Général sur la Protection des Données)
    - Loi pour la Confiance dans l'Économie Numérique (LCEN)
    - Code Monétaire et Financier
    - AMF (Autorité des Marchés Financiers)
*/

-- Types énumérés pour les contenus légaux
DO $$ BEGIN
  CREATE TYPE legal_content_type AS ENUM (
    'terms_of_service',
    'privacy_policy',
    'cookie_policy',
    'legal_notice',
    'investment_rules',
    'platform_rules',
    'kyc_aml_policy',
    'risk_warning',
    'fee_schedule'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Statut des consentements
DO $$ BEGIN
  CREATE TYPE consent_status AS ENUM (
    'pending',
    'accepted',
    'rejected',
    'withdrawn'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Table des termes légaux et règlements
CREATE TABLE IF NOT EXISTS legal_terms (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  content_type legal_content_type NOT NULL,
  version TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  language TEXT DEFAULT 'fr' NOT NULL,
  is_current BOOLEAN DEFAULT false NOT NULL,
  effective_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_by TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  UNIQUE(content_type, version, language)
);

CREATE INDEX IF NOT EXISTS idx_legal_terms_type ON legal_terms(content_type);
CREATE INDEX IF NOT EXISTS idx_legal_terms_current ON legal_terms(is_current) WHERE is_current = true;
CREATE INDEX IF NOT EXISTS idx_legal_terms_effective ON legal_terms(effective_date);
CREATE INDEX IF NOT EXISTS idx_legal_terms_language ON legal_terms(language);

-- Table des consentements utilisateurs
CREATE TABLE IF NOT EXISTS user_consents (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  legal_term_id TEXT NOT NULL REFERENCES legal_terms(id) ON DELETE CASCADE,
  content_type legal_content_type NOT NULL,
  version TEXT NOT NULL,
  status consent_status DEFAULT 'pending' NOT NULL,
  consented_at TIMESTAMPTZ,
  withdrawn_at TIMESTAMPTZ,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_consents_user ON user_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_consents_term ON user_consents(legal_term_id);
CREATE INDEX IF NOT EXISTS idx_user_consents_type ON user_consents(content_type);
CREATE INDEX IF NOT EXISTS idx_user_consents_status ON user_consents(status);
CREATE INDEX IF NOT EXISTS idx_user_consents_date ON user_consents(consented_at);

-- Table des logs de conformité légale
CREATE TABLE IF NOT EXISTS legal_compliance_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  event_type TEXT NOT NULL,
  user_id TEXT,
  resource_type TEXT,
  resource_id TEXT,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  compliance_status TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_compliance_logs_event ON legal_compliance_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_compliance_logs_user ON legal_compliance_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_compliance_logs_resource ON legal_compliance_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_compliance_logs_date ON legal_compliance_logs(created_at);

-- Enable Row Level Security
ALTER TABLE legal_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_compliance_logs ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour legal_terms (lecture publique pour transparence)
CREATE POLICY "Public can view current legal terms"
  ON legal_terms
  FOR SELECT
  USING (is_current = true);

CREATE POLICY "Admins can manage legal terms"
  ON legal_terms
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.profile_type = 'admin'
    )
  );

-- Politiques RLS pour user_consents
CREATE POLICY "Users can view own consents"
  ON user_consents
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own consents"
  ON user_consents
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own consents"
  ON user_consents
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all consents"
  ON user_consents
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.profile_type = 'admin'
    )
  );

-- Politiques RLS pour legal_compliance_logs
CREATE POLICY "Admins can view compliance logs"
  ON legal_compliance_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.profile_type = 'admin'
    )
  );

CREATE POLICY "System can create compliance logs"
  ON legal_compliance_logs
  FOR INSERT
  WITH CHECK (true);

-- Insertion des règlements VISUAL conformes aux lois européennes et françaises
INSERT INTO legal_terms (id, content_type, version, title, content, summary, language, is_current, effective_date, created_by, metadata)
VALUES
(
  gen_random_uuid()::text,
  'terms_of_service',
  '1.0.0',
  'Conditions Générales d''Utilisation VISUAL',
  '# CONDITIONS GÉNÉRALES D''UTILISATION DE LA PLATEFORME VISUAL

**Version 1.0.0 - Entrée en vigueur : 5 octobre 2025**

## ARTICLE 1 - OBJET

Les présentes Conditions Générales d''Utilisation (CGU) régissent l''accès et l''utilisation de la plateforme VISUAL (ci-après "la Plateforme"), accessible à l''adresse visual.replit.app.

VISUAL est une plateforme de financement participatif permettant aux créateurs de présenter leurs projets et aux investisseurs de participer à leur financement.

## ARTICLE 2 - ACCEPTATION DES CGU

L''utilisation de la Plateforme implique l''acceptation pleine et entière des présentes CGU. L''Utilisateur reconnaît avoir pris connaissance des CGU et les accepter sans réserve.

En cas de non-acceptation des CGU, l''Utilisateur doit s''abstenir d''accéder à la Plateforme.

## ARTICLE 3 - MENTIONS LÉGALES (CONFORMITÉ LCEN)

**Éditeur de la Plateforme :**
- Dénomination : VISUAL
- Forme juridique : [À compléter]
- Capital social : [À compléter]
- Siège social : [À compléter]
- RCS : [À compléter]
- SIRET : [À compléter]
- Numéro de TVA intracommunautaire : [À compléter]
- Directeur de la publication : [À compléter]
- Contact : contact@visual.com

**Hébergeur :**
- Replit, Inc.
- 548 Market St PMB 89830
- San Francisco, California 94104-5401
- États-Unis

## ARTICLE 4 - ACCÈS À LA PLATEFORME

### 4.1 Inscription
L''inscription sur la Plateforme est gratuite et obligatoire pour accéder aux fonctionnalités d''investissement.

L''Utilisateur garantit la véracité et l''exactitude des informations communiquées lors de son inscription.

### 4.2 Compte Utilisateur
Chaque Utilisateur est responsable de la confidentialité de ses identifiants. En cas d''utilisation frauduleuse, l''Utilisateur doit en informer immédiatement VISUAL.

### 4.3 Suspension et Suppression de Compte
VISUAL se réserve le droit de suspendre ou supprimer tout compte en cas de :
- Non-respect des présentes CGU
- Activité frauduleuse ou suspicion de fraude
- Non-respect des lois en vigueur

## ARTICLE 5 - RÈGLES D''INVESTISSEMENT (CONFORMITÉ AMF)

### 5.1 Montants Autorisés
Les montants d''investissement autorisés sur VISUAL sont strictement définis :
- **2 €** (deux euros)
- **5 €** (cinq euros)
- **10 €** (dix euros)
- **15 €** (quinze euros)

**Aucun autre montant n''est accepté.** Cette règle garantit l''équité et la conformité réglementaire.

### 5.2 Avertissement sur les Risques
⚠️ **AVERTISSEMENT OBLIGATOIRE (Article L. 511-6 du CMF)**

*Investir dans des projets comporte des risques de perte totale ou partielle du capital investi. Les performances passées ne préjugent pas des performances futures. Tout investissement doit être effectué en connaissance de cause.*

*VISUAL n''est pas un établissement de crédit et ne fournit pas de conseil en investissement.*

### 5.3 Protection des Investisseurs
Conformément aux directives européennes (Directive 2014/65/UE - MiFID II), VISUAL met en œuvre :
- Information claire sur les risques
- Transparence des frais et commissions
- Mécanisme de réclamation accessible

## ARTICLE 6 - PROPRIÉTÉ INTELLECTUELLE

### 6.1 Droits de VISUAL
La Plateforme, son design, sa structure, ses fonctionnalités et son contenu (hors contenus créés par les Utilisateurs) sont protégés par le droit d''auteur et le droit des marques.

### 6.2 Contenus des Utilisateurs
Les Utilisateurs conservent tous les droits de propriété intellectuelle sur les contenus qu''ils publient (projets, vidéos, articles).

En publiant du contenu, l''Utilisateur concède à VISUAL une licence mondiale, non exclusive, pour :
- Héberger et diffuser le contenu
- Promouvoir le projet sur la Plateforme
- Assurer la continuité du service

### 6.3 Respect des Droits Tiers
L''Utilisateur garantit qu''il détient tous les droits nécessaires sur les contenus publiés et qu''ils ne portent pas atteinte aux droits de tiers.

## ARTICLE 7 - PROTECTION DES DONNÉES PERSONNELLES (RGPD)

Conformément au Règlement (UE) 2016/679 (RGPD) et à la Loi Informatique et Libertés, VISUAL s''engage à protéger les données personnelles de ses Utilisateurs.

### 7.1 Responsable du Traitement
VISUAL est responsable du traitement des données personnelles collectées sur la Plateforme.

### 7.2 Données Collectées
Les données collectées incluent :
- Informations d''identification (nom, prénom, email)
- Données de connexion (adresse IP, logs)
- Données financières (historique de transactions)
- Données de navigation

### 7.3 Droits des Utilisateurs
Conformément aux articles 15 à 22 du RGPD, chaque Utilisateur dispose des droits suivants :
- **Droit d''accès** : obtenir une copie de ses données
- **Droit de rectification** : corriger des données inexactes
- **Droit à l''effacement** : demander la suppression de ses données
- **Droit à la portabilité** : récupérer ses données dans un format structuré
- **Droit d''opposition** : s''opposer au traitement de ses données
- **Droit à la limitation** : limiter le traitement dans certains cas

Pour exercer ces droits : privacy@visual.com

### 7.4 Conservation des Données
Les données sont conservées pendant la durée nécessaire aux finalités du traitement, conformément aux obligations légales :
- Données comptables : 10 ans (Code de Commerce)
- Données de transaction : 5 ans (Directive anti-blanchiment)
- Données de connexion : 1 an (LCEN)

## ARTICLE 8 - COOKIES

VISUAL utilise des cookies pour améliorer l''expérience utilisateur. L''Utilisateur peut gérer ses préférences cookies via les paramètres de son navigateur.

Types de cookies utilisés :
- **Cookies essentiels** : nécessaires au fonctionnement
- **Cookies analytiques** : statistiques d''utilisation
- **Cookies fonctionnels** : préférences utilisateur

Conformément à la Directive ePrivacy et à la loi CNIL, le consentement de l''Utilisateur est recueilli pour les cookies non essentiels.

## ARTICLE 9 - MODÉRATION ET CONTENU ILLICITE

### 9.1 Obligations de l''Utilisateur
L''Utilisateur s''engage à ne pas publier de contenu :
- Contraire aux lois en vigueur
- Diffamatoire, injurieux ou discriminatoire
- Violant les droits de propriété intellectuelle
- Portant atteinte à la vie privée d''autrui

### 9.2 Signalement
Tout contenu illicite peut être signalé via le bouton "Signaler" présent sur la Plateforme.

**Seuils de modération automatique :**
- **10 signalements** : blocage temporaire du contenu et suspension du compte (7 jours)
- **20 signalements** : exclusion définitive et blocage permanent des opérations bancaires

### 9.3 Responsabilité de VISUAL
Conformément à la Directive 2000/31/CE (Commerce Électronique) et à la LCEN, VISUAL n''est pas tenue à une obligation générale de surveillance des contenus.

Cependant, VISUAL agit promptement pour retirer ou bloquer tout contenu illicite porté à sa connaissance.

## ARTICLE 10 - LUTTE CONTRE LE BLANCHIMENT (LCB-FT)

Conformément à la Directive (UE) 2015/849 et au Code Monétaire et Financier, VISUAL met en œuvre des mesures de vigilance :

### 10.1 KYC (Know Your Customer)
Vérification d''identité obligatoire pour :
- Premiers investissements
- Retraits supérieurs à 50 €
- Transactions suspectes

### 10.2 Surveillance des Transactions
VISUAL surveille les transactions pour détecter :
- Activités inhabituelles
- Fractionnement de transactions
- Utilisation de comptes multiples

### 10.3 Déclaration TRACFIN
En cas de soupçon de blanchiment, VISUAL est tenue de déclarer les transactions suspectes à TRACFIN (cellule anti-blanchiment française).

## ARTICLE 11 - RESPONSABILITÉ

### 11.1 Limitation de Responsabilité
VISUAL ne garantit pas :
- La disponibilité continue de la Plateforme
- L''absence d''erreurs ou de bugs
- Le succès des projets financés

### 11.2 Exclusion de Garanties
VISUAL décline toute responsabilité en cas de :
- Perte financière liée à un investissement
- Défaillance d''un créateur de projet
- Force majeure (panne serveur, cyberattaque, etc.)

### 11.3 Obligations de l''Utilisateur
L''Utilisateur est seul responsable de :
- Ses décisions d''investissement
- La sécurité de ses identifiants
- La véracité des informations communiquées

## ARTICLE 12 - RÉSILIATION

### 12.1 Par l''Utilisateur
L''Utilisateur peut supprimer son compte à tout moment via les paramètres de la Plateforme.

### 12.2 Par VISUAL
VISUAL peut résilier l''accès d''un Utilisateur en cas de :
- Violation des CGU
- Activité frauduleuse
- Non-respect des lois en vigueur

## ARTICLE 13 - RÉCLAMATIONS ET MÉDIATION

### 13.1 Réclamation
Toute réclamation doit être adressée à : reclamation@visual.com

Délai de réponse : 30 jours ouvrés

### 13.2 Médiation de la Consommation
Conformément à la Directive 2013/11/UE et au Code de la Consommation, l''Utilisateur peut recourir à un médiateur agréé :

**Médiateur de la Consommation :**
- [À compléter - Nom du médiateur agréé]
- [Adresse]
- [Site web]

### 13.3 Plateforme RLL (Règlement en Ligne des Litiges)
Pour les litiges transfrontaliers, l''Utilisateur peut accéder à la plateforme européenne RLL : https://ec.europa.eu/consumers/odr

## ARTICLE 14 - LOI APPLICABLE ET JURIDICTION

### 14.1 Loi Applicable
Les présentes CGU sont régies par le droit français.

### 14.2 Juridiction Compétente
En cas de litige, et après échec de la médiation, les tribunaux français sont seuls compétents.

Pour les litiges avec des consommateurs, la juridiction compétente est celle du lieu de résidence du consommateur ou du siège de VISUAL.

## ARTICLE 15 - MODIFICATIONS DES CGU

VISUAL se réserve le droit de modifier les présentes CGU à tout moment.

Les Utilisateurs seront informés des modifications par :
- Email
- Notification sur la Plateforme
- Publication sur la page "Règlements"

**En cas de modification substantielle, un nouveau consentement sera demandé.**

## ARTICLE 16 - CONTACT

Pour toute question relative aux présentes CGU :
- **Email général** : contact@visual.com
- **Protection des données** : privacy@visual.com
- **Réclamations** : reclamation@visual.com
- **Conformité** : compliance@visual.com

---

**Date de dernière mise à jour : 5 octobre 2025**

**Version : 1.0.0**',
  'Conditions générales d''utilisation de la plateforme VISUAL conformes au RGPD, LCEN, AMF et directives européennes.',
  'fr',
  true,
  '2025-10-05 00:00:00'::timestamptz,
  'system',
  '{"compliance": ["RGPD", "LCEN", "MiFID II", "AMF", "LCB-FT"], "regulations": ["EU 2016/679", "EU 2014/65", "EU 2015/849", "Directive 2000/31/CE"]}'::jsonb
)
ON CONFLICT (content_type, version, language) DO NOTHING;

-- Commentaires sur les tables
COMMENT ON TABLE legal_terms IS 'Stockage des termes légaux et règlements de la plateforme VISUAL';
COMMENT ON TABLE user_consents IS 'Historique des consentements utilisateurs pour la conformité RGPD';
COMMENT ON TABLE legal_compliance_logs IS 'Logs d''audit pour le suivi de la conformité légale';

COMMENT ON COLUMN legal_terms.content_type IS 'Type de contenu légal (CGU, CGV, mentions légales, etc.)';
COMMENT ON COLUMN legal_terms.is_current IS 'Indique si c''est la version actuellement en vigueur';
COMMENT ON COLUMN legal_terms.effective_date IS 'Date d''entrée en vigueur du document';

COMMENT ON COLUMN user_consents.status IS 'Statut du consentement : pending, accepted, rejected, withdrawn';
COMMENT ON COLUMN user_consents.consented_at IS 'Date et heure du consentement (horodatage légal)';
