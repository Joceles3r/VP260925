# Category_LIVRES_Spec.md

## 📚 Catégorie « LIVRES » — Spécification complète (v.16/09/2025)

### Objectif
Lancer une catégorie **LIVRES** cohérente avec VISUAL : 100 auteurs en compétition, cycle **30 jours**, règles de votes et de redistribution intégrées aux agents **VisualAI** (maître) et **VisualFinanceAI** (exécuteur).

---

## 1) Paramètres & cycle de vie

- **Capacité par catégorie** : 100 auteurs (extensible à 200 → TOP 20, voir §12).
- **Durée** : **30 jours** (chrono affiché en temps réel).
- **Déclenchement** : ouverture immédiate à N≤100 auteurs.
- **Clôture** : à J+30, calcul TOP 10, pot commun, paiements.
- **Auto-report** : tout **auteur classé TOP 10** est **automatiquement inscrit** à la prochaine catégorie LIVRES.
- **Prolongation/repêchage** : un **auteur classé 11–100** peut intégrer la **prochaine** catégorie en réglant **25 €** (`extension_price_eur`, paramétrable). Il dispose de **24 h** ; sinon la place revient au premier en file d’attente.
- **File d’attente** : visible jusqu’à **300** auteurs (au-delà **ADMIN** uniquement).

---

## 2) Prix auteurs & tranches investi-lecteurs

### Prix imposés (auteurs)
- Prix de vente **unitaire** du livre numérique : **{2, 3, 4, 5, 8 €}** (max **8 €**).

### Tranches d’engagement (investi-lecteurs)
- **{2, 3, 4, 5, 6, 8, 10, 12, 15, 20 €}**, avec possibilité de payer un **multiple** du prix unitaire (sans dépasser 20 €).
- Le paiement **achète** le livre (accès par **token**) ; tout montant au-dessus du prix unitaire est traité comme **soutien** (tip) et **donne des votes** supplémentaires.

> Remarque : paiements en **euros** (Stripe). Optionnellement, permettre le paiement via **VISUpoints** (conversion interne 100 pts = 1 €) si l’utilisateur a un solde suffisant.

---

## 3) Votes (barème standard VISUAL)
| Montant (€) | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 15 | 20 |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| **Votes** | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |

- **Sélection** : les **10 livres** ayant **le plus de votes** sur 30 jours forment le **TOP 10**.
- **Ordre final (tie-break & robustesse)** : VisualAI applique la méthode VISUAL :
  1) **Coefficient d’engagement** `Coeff = montantTotal / max(1, nbInvestisseurs)` (tri décroissant),
  2) Si égalité : **+ d’investisseurs uniques**,
  3) Puis **montantTotal** le plus élevé,
  4) Puis **ancienneté** (plus ancien gagne),
  5) Sinon **tirage pseudo-aléatoire** audité (seed = idCatégorie+horodatage).

---

## 4) Téléchargement & token sécurisé

- Après paiement, l’investi-lecteur reçoit un **token de téléchargement** (lien expirable) vers le **stockage auteur**.
- **Filigrane/empreinte** : fichier marqué (watermark) avec **ID acheteur** + **horodatage** (dissuasion anti-piratage).
- **Reçu** : justificatif numérique (id, prix, TVA, moyen de paiement).

---

## 5) Payout des ventes (instantané)

- **VISUAL** prélève **30 %**, **Auteur** reçoit **70 %** de chaque vente (`infoarticle_platform_fee_pct=0.30`).
- Comptabilité au **centime** ; transferts via **Stripe Connect** ; journalisation **Ledger** + **Audit**.

---

## 6) Pot commun (redistribution à J+30)

- **Source du pot** : **sommes investies** par les **investi-lecteurs classés 11–100** (fenêtre des 30 jours).
- **Bénéficiaires** :
  - **TOP 10 auteurs** (classement final),
  - **Tous les investi-lecteurs ayant acheté ≥1 livre d’un auteur du TOP 10** (les « gagnants »).
- **Partage du pot** (par défaut) : **60 %** → TOP 10 auteurs, **40 %** → investi-lecteurs gagnants. *(Paramétrable : `pot_split_authors=0.60`, `pot_split_readers=0.40`)*
- **Mode de répartition** :
  - **Équipartition** par défaut dans chaque groupe (paramètre `pot_mode="equipartition"`),
  - Option **pondérée** (`"weighted"`) par **montant payé** et **précocité d’achat** (early supporters valorisés).

> **Arrondis** : tous **payouts utilisateurs à l’euro inférieur** ; **restes** → **VISUAL** (couverture coûts CDN/stockage/etc.).

---

## 7) VISUpoints (option d’incitation)

- Achat d’un livre → attribution facultative de **VISUpoints** (ex. 1 € = 5 pts ; **configurable**).
- Conversion globale VISUAL : **100 pts = 1 €**, **seuil 2 500 pts**, **KYC + Stripe** requis, **floor** à l’euro.
- Compatible avec **Visiteur du Mois** (2 500 pts) et **streaks**.

---

## 8) Anti-plagiat & conformité

- **Acte de propriété** signé électroniquement ; stockage du document par l’auteur.
- **Scan de similarité** (anti-plagiat) lors de l’upload (hash + heuristiques + sampling).
- **DMCA-like** : procédure de retrait, contre-notification, arbitrage ADMIN.
- **KYC** auteurs/lecteurs pour retraits ; **2FA** requis pour auteurs (paiements) et investis-lecteurs (montants > seuil).

---

## 9) UI/UX & SEO

- **Mur TOP** : affichage **TOP 20** en temps réel (à minima TOP 10), liste des 80 suivants accessible.
- **Fiche auteur** : pseudo, résumé, prix, lien/token, notes (★ jusqu’à 5), réseaux sociaux (≤5), stockage **10 livres** (extensible).
- **Langues** : traduction de chaque page (barre de langue) + **sous-titres** pour extraits audio/lecture (si fournis).
- **SEO** : sitemaps, Schema.org `Book`, OpenGraph, hreflang, canonical.

---

## 10) Sécurité & signalements

- **Modération préventive** : VisualAI peut **suspendre** un livre en attente de revue (contenu sensible).
- **Signalements** utilisateurs → file de traitement ; blocage si récidive/violation.
- **Anti-fraude** : détection comptes liés, burst achats anormaux, remboursements en série → **freeze** + alerte ADMIN.

---

## 11) Intégration agents IA

### VisualAI (maître)
- Orchestration du **classement**, modération, SEO/i18n, notifications, wallboards, tie-breakers.
- Émet les ordres de paiements/redistributions (**catégorie** & **pot 24h** si activé pour LIVRES) à **VisualFinanceAI**.

### VisualFinanceAI (exécuteur)
- Applique **70/30** par vente (centime), **pot 60/40**, **arrondis floor** pour utilisateurs, **restes → VISUAL**.
- Gère les **payouts Stripe**, les **journaux Ledger/Audit**, la **conversion VISUpoints**.

---

## 12) Extension à 200 auteurs (TOP 20)

- Capacité : **200** auteurs, **TOP 20** gagnants.
- **Pot** : mêmes règles, réparti **60 %** (TOP 20 auteurs) / **40 %** (investi-lecteurs gagnants).
- **Affichage** : mur TOP 20 + pagination. Performance : caches/streaming adaptés.
- **Back-office** : paramètres `max_authors=200`, `top_n=20`.

---

## 13) Pseudocode — événements clés

### a) Vente d’un livre (70/30 + token)
```ts
function onBookSold(orderId: string, bookId: string, authorId: string, grossEUR: number, buyerId: string){
  const gross_c = Math.round(grossEUR*100);
  const fee_c   = Math.round(gross_c * 0.30); // VISUAL
  const net_c   = gross_c - fee_c;            // auteur
  stripe.transfer("VISUAL", fee_c, {key:`fee:${orderId}`});
  stripe.transfer(authorId,  net_c, {key:`net:${orderId}`});
  ledger.record({orderId, bookId, authorId, buyerId, type:"book_sale", gross_c, fee_c, net_c});
  tokenService.issueDownloadToken(buyerId, bookId, {ttl: "72h", watermark:true});
}
```

### b) Calcul TOP 10 (sélection votes → ordre par Coeff + tie-breakers)
```ts
function computeTop10(categoryId: string){
  const candidates = repo.fetchAuthors(categoryId);
  const byVotesDesc = candidates.sort((a,b)=> b.votes - a.votes).slice(0,10);
  const withCoeff = byVotesDesc.map(a=> ({...a, coeff: +(a.grossEUR / Math.max(1,a.uniqueBuyers)).toFixed(2)}));
  return withCoeff.sort((a,b)=> b.coeff - a.coeff || b.uniqueBuyers - a.uniqueBuyers || b.grossEUR - a.grossEUR || a.createdAt - b.createdAt || tieBreak(a.id,b.id));
}
```

### c) Pot commun (60/40 ; équipartition par défaut)
```ts
function distributePot(categoryId: string, potEUR: number, authorsTop10: string[], winningReaders: string[]){
  const pot_c = Math.round(potEUR*100);
  const A = Math.floor(pot_c * 0.60); // auteurs
  const R = Math.floor(pot_c * 0.40); // lecteurs
  const A_each = authorsTop10.length ? Math.floor(A / authorsTop10.length) : 0;
  const R_each = winningReaders.length ? Math.floor(R / winningReaders.length) : 0;
  const A_e = Math.floor(A_each/100)*100; // euros floor
  const R_e = Math.floor(R_each/100)*100; // euros floor

  let paidUsers_c = authorsTop10.length*A_e + winningReaders.length*R_e;
  const residual_c = Math.max(0, pot_c - paidUsers_c);
  payouts.push({type:"visual_residuals", cents: residual_c}); // restes → VISUAL

  for(const a of authorsTop10) payouts.push({type:"author_pot", user:a, cents:A_e});
  for(const r of winningReaders) payouts.push({type:"reader_pot", user:r, cents:R_e});

  return payouts;
}
```

---

## 14) Checklist conformité & admin

- **KYC obligatoire** pour retraits ; **2FA** pour auteurs/lecteurs (paiements).
- **CGU/Charte** : anti-plagiat, respect droits d’auteur, règles de remboursement.
- **Logs & audit** : décisions IA, ventes, redistributions, litiges.
- **SEO/i18n** : hreflang, sitemaps, traductions à jour.
- **Paramètres runtime** : `extension_price_eur=25` (modifiable), `pot_split_authors=0.60`, `pot_split_readers=0.40`, `pot_mode="equipartition"`.

---

## 15) Résumé exécutable
- **Cycle 30 jours**, 100 auteurs (ext. 200).
- **Prix auteurs** : 2/3/4/5/8 € ; **Tranches** lecteurs 2→20 € ; votes mappés.
- **Ventes** : **70/30** (auteur/VISUAL), token + watermark, reçu.
- **TOP 10** : votes → **Coeff** → tie-breakers.
- **Pot** : **60/40** (auteurs/lecteurs gagnants), **floor à l’euro**, restes → VISUAL.
- **Repêchage** : 25 € pour intégrer la prochaine catégorie (24 h).

---
