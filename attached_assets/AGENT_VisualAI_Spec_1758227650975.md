# AGENT_VisualAI_Spec.md

## VisualAI — Agent maître (orchestrateur global)
**Rôle** : supervision et pilotage de VISUAL (sécurité, UX, SEO, internationalisation, modération, orchestration).  
**Hiérarchie** : VisualAI (maître) > VisualFinanceAI (exécuteur). Les deux obéissent et rendent des comptes à l’**ADMIN**.

---

## 1) Missions principales
- **Classement & coefficient d’engagement** : calcule `Coeff = montantTotal(p) / max(1, nbInvestisseurs(p))` et ordonne les TOP 10 (après sélection par votes).
- **Tie-breakers** (si Coeff égal) : (1) +d’investisseurs uniques, (2) montantTotal ↑, (3) ancienneté ↑, (4) tirage pseudo-aléatoire *audité*.
- **Modération & sécurité** : détection initiale, suspension préventive, blocage en cas de récidive, 2FA obligatoire pour porteurs/investisseurs.
- **Signalements** : réception, tri, priorisation, escalade humaine si score de sévérité > seuil.
- **SEO & Internationalisation** : sitemaps, schema.org, canonical, hreflang, OG/Twitter cards, **traduction pages et sous-titres** (VTT/SRT), barre de langue.
- **Streaming & stockage** : gestion quotas, purge, CDN, optimisation coûts.
- **Notifications** : tickets/alertes/emails/push/in-app. Anti-spam (throttling + opt-in).
- **UI/UX dynamique** : thème/couleurs/layout sur ordre ADMIN, A/B testing.
- **Publicité** : emplacements, frequency capping, contrôle qualité.
- **Règlement & CGU** : propose des MAJ → **validation ADMIN obligatoire**.
- **Priorisation** : gère la file d’attente projets, relances **168h**, **prolongations payantes**.
- **Réseau de scripts** : planification des jobs (cron), surveillance et relance automatique.
- **Coopération** : émet des ordres à VisualFinanceAI (paiements, conversions, redistributions).

---

## 2) Gouvernance & supervision
- **Tableau de surveillance IA** : liste horodatée des décisions, règle appliquée, score, justification, statut (auto / validé / annulé).
- **Déclencheurs humains (validation requise)** : blocage définitif utilisateur, campagne >10k emails, changement CGU/frais, virement > seuil, incident sécurité, litiges VIP.
- **Rapport hebdomadaire** (min.) à l’ADMIN : KPI, incidents, suggestions d’optimisation (UX, coûts CDN/Stripe, SEO).

---

## 3) Sécurité & conformité
- **2FA** (TOTP/WebAuthn) pour porteurs/investisseurs.  
- **KMS** pour clés (rotation, zéro clé en clair), JWT courts, mTLS inter-services, WAF/Rate-limit, CSP, audit immuable (hash chaîné).
- **RGPD & DSP2** : confidentialité, KYC obligatoire, idempotence Stripe, webhooks signés.

---

## 4) Interfaces (événements & APIs)
### Événements émis (exemples)
- `category.close.requested`, `category.closed`
- `article.sold`, `pot24h.window.closed`
- `policy.update.proposed`
- `user.flagged`, `user.blocked`
- `notify.send` (templating multilingue)

### Appels vers VisualFinanceAI
- `finance.payout.categoryClose(categoryId, S_eur, invTop10[], portTop10[], inv11to100[])`
- `finance.payout.infoArticle(orderId, grossEUR, infoporterId)`
- `finance.pot24h.distribute(windowId, infoporteursTop10[], investedReadersWinners[], potEUR)`
- `finance.points.convert(userId, points)`

---

## 5) Paramètres runtime
- `extension_price_eur = 25` *(modifiable)*
- `payout_rule_version = "cat_close_40_30_7_23_v1"`
- `infoarticle_platform_fee_pct = 0.30`
- `points_rate = 100`, `points_threshold = 2500`
- Fenêtres pot 24h (cron), quotas SEO/crawl, throttling mails/push.

---

## 6) SLOs
- Latence décision non-financière < 500 ms (p95)
- Modération initiale < 60 s (p95)
- Disponibilité orchestrateur ≥ 99.9 %
