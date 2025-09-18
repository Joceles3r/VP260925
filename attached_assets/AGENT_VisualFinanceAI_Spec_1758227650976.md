# AGENT_VisualFinanceAI_Spec.md

## VisualFinanceAI — Agent financier (exécuteur)
**Rôle** : moteur **déterministe** des règles financières et VISUpoints (formules, répartitions, conversions, frais, virements, remboursements).  
**Hiérarchie** : reçoit les ordres de **VisualAI (maître)** ; toutes ses actions sont auditables et validables par l’**ADMIN**.

---

## 1) Règles financières implémentées
- **Clôture de catégorie** : répartition **40 / 30 / 7 / 23** de S (somme totale)  
  - 40 % → **Investisseurs TOP10** (répartition par rang ≈ `[13.66, 6.83, 4.55, 3.41, 2.73, 2.28, 1.95, 1.71, 1.52, 1.37]%` de S)
  - 30 % → **Porteurs TOP10** (≈ `[10.24, 5.12, 3.41, 2.56, 2.05, 1.71, 1.46, 1.28, 1.14, 1.02]%` de S)
  - 7 %  → **Investisseurs 11–100** (équipartition)
  - 23 % → **VISUAL** (+ **restes d’arrondis**)
- **Arrondis** : **utilisateurs** payés **à l’euro inférieur** (floor) ; **restes** → VISUAL.
- **Vente d’article infoporteur** : **30 % VISUAL / 70 % infoporteur** (Stripe Connect, arrondi comptable au centime).
- **Pot 24h (articles)** : TOP10 infoporteurs + **investi-lecteurs gagnants** (acheteurs d’≥1 article du TOP10) se partagent le **pot** (sommes rangs 11–100) — *par défaut, équipartition sur l’union des gagnants (paramétrable)*.
- **VISUpoints** : **100 pts = 1 €**, **seuil 2 500 pts**, conversion **floor** à l’euro, **KYC + Stripe requis**.
- **Golden Ticket** : votes 20/30/40 pour 50/75/100 € ; remboursement **100%** (rangs 1–10 & 11), **50%** (12–20), **0%** sinon.

---

## 2) Contrôles & garde-fous
- Pas de virement sans **KYC**, ni si compte Stripe manquant/bloqué.
- **Idempotence** sur toutes les transactions (clés de déduplication), journaux d’audit signés.
- **Dry-run** possible pour demande de validation ADMIN.
- Détection d’anomalies de flux (écarts-types, burst micro-paiements, comptes liés) → alerte VisualAI.

---

## 3) Données & journalisation
- **Ledger** : écritures `gross/net/fees`, référence, hash, signature, idempotencyKey.
- **Payout recipes** : versionnage des règles (ex. `cat_close_40_30_7_23_v1`).
- **Reconciliation** : rapprochement Stripe ↔ Ledger (tickets en cas d’écarts).

---

## 4) Paramètres runtime
- `extension_price_eur = 25` *(modifiable)*
- `infoarticle_platform_fee_pct = 0.30`
- `points_rate = 100`, `points_threshold = 2500`
- `pot24h_split_mode = "equipartition"` (ou `"weighted"`, `"group_ratio"`)
- `payout_rule_version = "cat_close_40_30_7_23_v1"`

---

## 5) SLOs financiers
- Génération des *recipes* de paiements < 2 s (p95).
- Exécution des transferts Stripe < 60 s (p95) après validation.
- Divergences Stripe vs Ledger < 0.01 % des opérations.
