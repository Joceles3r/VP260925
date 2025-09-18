# Admin_Controls_and_SLOs.md

## Console ADMIN — Contrôles, validations, SLOs

### 1) Contrôles & validations
- **File d’attente décisions IA** : accepter/refuser/rejouer avec commentaire obligatoire.
- **Seuils de validation humaine** :
  - Blocage définitif d’un compte,
  - Campagne email > 10k envois,
  - Paiement unitaire > seuil (ex. 500 €),
  - Changement CGU / frais / coefficients,
  - Incident sécurité (clé, fuite, intrusion),
  - Litiges VIP/partenaires.
- **Paramètres runtime** (live) :
  - `extension_price_eur = 25` *(modifiable)*,
  - `payout_rule_version = "cat_close_40_30_7_23_v1"`,
  - `infoarticle_platform_fee_pct = 0.30`,
  - `points_rate = 100`, `points_threshold = 2500`,
  - `pot24h_split_mode = "equipartition"`,
  - Throttling mails/push, quotas SEO/crawl, fenêtres pot 24h.

### 2) Journaux & audit
- **Audit immuable** : hash chaîné, horodatage, acteur (IA/Admin), idempotencyKey.
- **Ledger** : écritures financières (gross/net/fees), références Stripe, signatures.
- **Rapport hebdomadaire IA** : incidents, suggestions, KPI (coûts CDN/Stripe, fraude bloquée, réussite SEO, latences).

### 3) SLOs & SLA internes
- Orchestration non-financière (VisualAI) : latence < 500 ms (p95), disponibilité ≥ 99.9 %.
- Préparation des paiements (VisualFinanceAI) : < 2 s (p95).
- Exécution des transferts (Stripe) : < 60 s (p95) après validation.
- Reconciliation divergences Stripe ↔ Ledger < 0.01 %.
- RTO backups : ≤ 4 h ; RPO : ≤ 15 min.

### 4) Sécurité & conformité
- **2FA** obligatoire (porteurs/investisseurs), KYC strict, anti auto-investissement.
- **Webhooks Stripe** signés, **idempotence** partout, **mTLS** inter-services, **KMS** pour clés.
- **RGPD/DSP2** : minimisation des données, droit à l’oubli, registres de traitement.

### 5) Tableaux ADMIN
- **Décisions IA** (liste + filtres + export CSV).
- **Payouts** (statut, montants, bénéficiaires, erreurs).
- **Vis points** (wallets, conversions).
- **Catégories** (chrono 168h, extensions, TOP10, seuils 30/100 vidéos).
- **Sandbox testeurs** (on/off).

### 6) Escalade & continuité
- Procédure **d’urgence** (attaque, panne Stripe/CDN) : désactivation automatisme critique, bascule manuelle, communication aux utilisateurs, post-mortem.
