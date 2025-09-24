# Category_LIVRES_Spec.md

## 📚 Catégorie « LIVRES » — Spécification complète (v.24/09/2025)

### Objectif
Lancer une catégorie **LIVRES** cohérente avec VISUAL : 100 auteurs en compétition, **cycle mensuel calendaire**, règles de votes et de redistribution intégrées aux agents **VisualAI** (maître) et **VisualFinanceAI** (exécuteur).

---

## 1) Paramètres & cycle de vie

- **Capacité par catégorie** : 100 auteurs (extensible à 200 → TOP 20, voir §12).
- **Calendrier mensuel** :
  - **Ouverture** : le **1er** à **00:00:00** (Europe/Paris)
  - **Clôture** : le **dernier jour du mois** à **23:59:59** (Europe/Paris)
  - Février : **28** ou **29** jours selon l'année bissextile
- **Déclenchement** : ouverture immédiate à N≤100 auteurs.
- **Clôture** : à la fin du mois, calcul TOP 10, pot mensuel, paiements.
- **Auto-report** : tout **auteur classé TOP 10** est **automatiquement inscrit** au mois suivant.
- **Prolongation/repêchage** : un **auteur classé 11–100** peut intégrer le **mois suivant** en réglant **25 €** (`extension_price_eur`, paramétrable). Il dispose de **24 h** après la clôture ; sinon la place revient au premier en file d'attente.
- **File d'attente** : visible jusqu'à **300** auteurs (au-delà **ADMIN** uniquement).

### Configuration planifiée (CRON/RRULE)
- **Ouverture** : `RRULE:FREQ=MONTHLY;BYMONTHDAY=1;BYHOUR=0;BYMINUTE=0;BYSECOND=0`
- **Clôture** : `RRULE:FREQ=MONTHLY;BYMONTHDAY=-1;BYHOUR=23;BYMINUTE=59;BYSECOND=59`  
  *(BYMONTHDAY=-1 = dernier jour du mois ; appliquer TZ Europe/Paris)*

---

## 2) Prix auteurs & tranches investi-lecteurs

### Prix imposés (auteurs)
- Prix de vente **unitaire** du livre numérique : **{2, 3, 4, 5, 8 €}** (max **8 €**).

### Tranches d'engagement (investi-lecteurs)
- **{2, 3, 4, 5, 6, 8, 10, 12, 15, 20 €}**, avec possibilité de payer un **multiple** du prix unitaire (sans dépasser 20 €).
- Le paiement **achète** le livre (accès par **token**) ; tout montant au-dessus du prix unitaire est traité comme **soutien** (tip) et **donne des votes** supplémentaires.

> Remarque : paiements en **euros** (Stripe). Optionnellement, permettre le paiement via **VISUpoints** (conversion interne 100 pts = 1 €) si l'utilisateur a un solde suffisant.

---

## 3) Votes (barème standard VISUAL)
| Montant (€) | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 15 | 20 |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| **Votes** | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |

- **Sélection** : les **10 livres** ayant **le plus de votes** sur la fenêtre du **mois** forment le **TOP 10**.
- **Ordre final (tie-break & robustesse)** : VisualAI applique la méthode VISUAL :
  1) **Coefficient d'engagement** `Coeff = montantTotal / max(1, nbInvestisseurs)` (tri décroissant),
  2) Si égalité : **+ d'investisseurs uniques**,
  3) Puis **montantTotal** le plus élevé,
  4) Puis **ancienneté** (plus ancien gagne),
  5) Sinon **tirage pseudo-aléatoire** audité (seed = idCatégorie+horodatage).

---

## 4) Téléchargement & token sécurisé

- Après paiement, l'investi-lecteur reçoit un **token de téléchargement** (lien expirable) vers le **stockage auteur**.
- **Filigrane/empreinte** : fichier marqué (watermark) avec **ID acheteur** + **horodatage** (dissuasion anti-piratage).
- **Reçu** : justificatif numérique (id, prix, TVA, moyen de paiement).

---

## 5) Payout des ventes (instantané)

- **VISUAL** prélève **30 %**, **Auteur** reçoit **70 %** de chaque vente (`infoarticle_platform_fee_pct=0.30`).
- Comptabilité au **centime** ; transferts via **Stripe Connect** ; journalisation **Ledger** + **Audit**.

---

## 6) Pot mensuel (redistribution en fin de mois)

**Définition du pot** : sur la **fenêtre du mois**, on agrège les **sommes versées par les investi‑lecteurs classés 11–100** (rangs calculés sur l'ensemble du mois).

### Groupes bénéficiaires
- **Auteurs gagnants** : les **TOP 10 auteurs** du mois (ou **TOP 20** si l'édition est étendue).
- **Investi‑lecteurs gagnants** : **tous** les lecteurs ayant **acheté ≥ 1 livre** d'un **auteur TOP 10** durant le mois (uniques).

### Paramètres (par défaut)
- Part **auteurs** : **α = 60 %** du pot mensuel  
- Part **lecteurs** : **β = 40 %** du pot mensuel  
- Mode : **équipartition** par défaut dans chaque groupe (paramétrable : `weighted`, `group_ratio`).

### Formules (avec arrondis VISUAL)
Travailler en **centimes** puis appliquer l'**arrondi à l'euro inférieur** pour les utilisateurs ; les **restes** (centimes & écarts) vont à **VISUAL**.

- Conversion : `S_c = round(S_pot × 100)` (centimes)  
- Total auteurs (centimes) : `A_c = floor(α × S_c)`  
- Total lecteurs (centimes) : `R_c = floor(β × S_c)`

Si **N** = nombre d'auteurs gagnants (10 par défaut) et **M** = nombre d'investi‑lecteurs gagnants (uniques) :

- **Part auteur unitaire (centimes)** :  
  `a_each_c = floor( A_c / N )` → **versement utilisateur** `a_each_euro = floor(a_each_c / 100) × 100`  
- **Part lecteur unitaire (centimes)** :  
  `r_each_c = floor( R_c / M )` → **versement utilisateur** `r_each_euro = floor(r_each_c / 100) × 100`

- **Résidu** (centimes) pour VISUAL :  
  `residual_c = S_c − ( N × a_each_euro + M × r_each_euro )`  
  **VISUAL reçoit** `residual_c` en plus de ses autres revenus (frais infra, etc.).

> Remarque : si `M = 0` (aucun lecteur gagnant), **R_c** est intégralement versé aux **auteurs gagnants** (*fallback*) **ou** reporté en **residu VISUAL** selon le paramètre `pot_empty_readers_policy`.

---

## 7) VISUpoints (option d'incitation)

- Achat d'un livre → attribution facultative de **VISUpoints** (ex. 1 € = 5 pts ; **configurable**).
- Conversion globale VISUAL : **100 pts = 1 €**, **seuil 2 500 pts**, **KYC + Stripe** requis, **floor** à l'euro.
- Compatible avec **Visiteur du Mois** (2 500 pts) et **streaks**.

---

## 8) Anti-plagiat & conformité

- **Acte de propriété** signé électroniquement ; stockage du document par l'auteur.
- **Scan de similarité** (anti-plagiat) lors de l'upload (hash + heuristiques + sampling).
- **DMCA-like** : procédure de retrait, contre-notification, arbitrage ADMIN.
- **KYC** auteurs/lecteurs pour retraits ; **2FA** requis pour auteurs (paiements) et investis-lecteurs (montants > seuil).

---

## 9) UI/UX & SEO

- **Mur TOP** : affichage **TOP 20** en temps réel (à minima TOP 10), liste des 80 suivants accessible.
- **Compte à rebours** : affiche **"Clôture : dernier jour du mois à 23:59:59 (Europe/Paris)"**.
- **Fiche auteur** : pseudo, résumé, prix, lien/token, notes (★ jusqu'à 5), réseaux sociaux (≤5), stockage **10 livres** (extensible).
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
- Orchestration du **classement mensuel**, modération, SEO/i18n, notifications, wallboards, tie-breakers.
- Émet les ordres de paiements/redistributions (**pot mensuel** calendaire) à **VisualFinanceAI**.

### VisualFinanceAI (exécuteur)
- Applique **70/30** par vente (centime), **pot 60/40**, **arrondis floor** pour utilisateurs, **restes → VISUAL**.
- Gère les **payouts Stripe**, les **journaux Ledger/Audit**, la **conversion VISUpoints**.
- **Cadence mensuelle** : rapports et redistributions adaptés au calendrier mensuel.

---

## 12) Extension à 200 auteurs (TOP 20)

- Capacité : **200** auteurs, **TOP 20** gagnants.
- **Pot** : mêmes règles, réparti **60 %** (TOP 20 auteurs) / **40 %** (investi-lecteurs gagnants).
- **Affichage** : mur TOP 20 + pagination. Performance : caches/streaming adaptés.
- **Back-office** : paramètres `max_authors=200`, `top_n=20`.

---

## 13) Pseudocode — événements clés

### a) Vente d'un livre (70/30 + token)
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

### c) Pot mensuel (60/40 ; équipartition par défaut)
```ts
function closeMonth_Livres(s_pot_eur: number, authorsTopN: string[], readerWinners: string[]) {
  const ALPHA = 0.60; // auteurs
  const BETA  = 0.40; // lecteurs
  
  const S_c = Math.round(s_pot_eur * 100);
  const A_c = Math.floor(ALPHA * S_c);
  const R_c = Math.floor(BETA  * S_c);

  const N = authorsTopN.length; // 10 (ou 20)
  const M = readerWinners.length;

  const payouts: any[] = [];
  let paid_c = 0;

  if (N > 0) {
    const a_each_c = Math.floor(A_c / N);
    const a_each_e = Math.floor(a_each_c / 100) * 100; // euro floor
    for (const a of authorsTopN) { payouts.push({ type:"author_pot", user:a, cents:a_each_e }); paid_c += a_each_e; }
  }

  if (M > 0) {
    const r_each_c = Math.floor(R_c / M);
    const r_each_e = Math.floor(r_each_c / 100) * 100; // euro floor
    for (const r of readerWinners) { payouts.push({ type:"reader_pot", user:r, cents:r_each_e }); paid_c += r_each_e; }
  } else {
    // fallback paramétrable : soit tout → auteurs, soit tout → VISUAL
    payouts.push({ type:"visual_residual_pot_readers_empty", cents: R_c });
    paid_c += 0;
  }

  const residual_c = Math.max(0, S_c - paid_c);
  payouts.push({ type:"visual_residuals", cents: residual_c });

  return payouts;
}
```

---

## 14) Ajustements d'interface & d'admin

- Le **compte à rebours** affiche **"Clôture : dernier jour du mois à 23:59:59 (Europe/Paris)"**.
- L'**Admin** visualise la **fenêtre mensuelle** et les **rangs 1–100** spécifiques au mois.
- Les **exports** (CSV/ledger) utilisent la **période mensuelle** comme partition temporelle.
- Les **rapports** de VisualAI & VisualFinanceAI pour **Livres** passent en **cadence mensuelle**.

---

## 15) Checklist conformité & admin

- **KYC obligatoire** pour retraits ; **2FA** pour auteurs/lecteurs (paiements).
- **CGU/Charte** : anti-plagiat, respect droits d'auteur, règles de remboursement.
- **Logs & audit** : décisions IA, ventes, redistributions, litiges.
- **SEO/i18n** : hreflang, sitemaps, traductions à jour.
- **Paramètres runtime** : `extension_price_eur=25` (modifiable), `pot_split_authors=0.60`, `pot_split_readers=0.40`, `pot_mode="equipartition"`.

---

## 16) Compatibilité & invariants

- **70/30** sur chaque vente unitaire **inchangé**.
- **VISUpoints** : 100 pts = 1 €, seuil 2 500 pts, conversion floor, KYC/Stripe requis **inchangés**.
- **Sécurité/antifraude/modération/SEO** : inchangés.
- **TOP N extensible** : passage à **TOP 20** (si 200 auteurs) → les formules restent valables en remplaçant **N**.

---

## 17) Tests à dérouler

- Mois de **28/29/30/31** jours : ouverture/clôture aux bons instants (TZ Europe/Paris, DST ok).
- Cas **M=0** lecteurs gagnants : appliquer la politique `pot_empty_readers_policy`.
- Arrondis : vérifier **euro floor** et **résidus → VISUAL**.
- Auto-report TOP 10 → mois suivant, repêchage rang 11–100 (25 €) sous 24 h.

---

## 18) Résumé exécutable

- **Cycle mensuel calendaire** (1er → dernier jour du mois), 100 auteurs (ext. 200).
- **Prix auteurs** : 2/3/4/5/8 € ; **Tranches** lecteurs 2→20 € ; votes mappés.
- **Ventes** : **70/30** (auteur/VISUAL), token + watermark, reçu.
- **TOP 10** : votes → **Coeff** → tie-breakers.
- **Pot mensuel** : **60/40** (auteurs/lecteurs gagnants), **floor à l'euro**, restes → VISUAL.
- **Repêchage** : 25 € pour intégrer le mois suivant (24 h après clôture).
- **CRON/RRULE** : ouverture/clôture automatisées avec fuseau Europe/Paris.

---