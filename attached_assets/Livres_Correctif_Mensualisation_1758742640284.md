# Livres_Correctif_Mensualisation.md

## 📚 Catégorie « Livres » — Correctif de calendrier & formules (v.24/09/2025)

> **Objet** : Remplacer le cycle fixe de **30 jours** par une **fenêtre calendaire mensuelle** :  
> **Ouverture** le **1er de chaque mois**, **Clôture** le **dernier jour** du même mois (28/29/30/31).  
> Fuseau : **Europe/Paris**. Toutes les autres règles « Livres » restent inchangées sauf précision ci‑dessous.

---

## 1) Calendrier (règle de base)
- **Ouverture** : le **1er** à **00:00:00** (Europe/Paris).
- **Clôture** : le **dernier jour du mois** à **23:59:59** (Europe/Paris).  
  - Février : **28** ou **29** jours selon l’année bissextile.
- **Auto-report** : les **TOP 10 auteurs** du mois en cours sont automatiquement **inscrits au mois suivant**.
- **Repêchage (place réservée)** : un auteur **rang 11–100** peut réserver une place pour le **mois suivant** en réglant **25 €** (paramétrable) **dans les 24 h** après la clôture.

### Configuration planifiée (CRON/RRULE)
- **Ouverture** : `RRULE:FREQ=MONTHLY;BYMONTHDAY=1;BYHOUR=0;BYMINUTE=0;BYSECOND=0`
- **Clôture** : `RRULE:FREQ=MONTHLY;BYMONTHDAY=-1;BYHOUR=23;BYMINUTE=59;BYSECOND=59`  
  *(BYMONTHDAY=-1 = dernier jour du mois ; appliquer TZ Europe/Paris)*

---

## 2) Sélection & ordre des gagnants (inchangé)
1. **TOP 10** : sélection des **10 auteurs** ayant **le plus de votes** sur la fenêtre du **mois**.
2. **Ordre du TOP 10** : **coefficient d’engagement** (tri décroissant)  
   `Coeff = montantTotal / max(1, nbInvestisseursUniques)`  
   **Tie-breakers** : (1) + d’investisseurs uniques, (2) montantTotal ↑, (3) ancienneté ↑, (4) tirage audité.

---

## 3) Ventes unitaires (inchangé)
- À chaque vente : **VISUAL 30 % / Auteur 70 %** (Stripe Connect, compta au centime).

---

## 4) Pot mensuel & formules de répartition (auteurs gagnants & investi‑lecteurs gagnants)
**Définition du pot** : sur la **fenêtre du mois**, on agrège les **sommes versées par les investi‑lecteurs classés 11–100** (rangs calculés sur l’ensemble du mois).  
On note **S_pot** la somme totale en euros.

### Groupes bénéficiaires
- **Auteurs gagnants** : les **TOP 10 auteurs** du mois (ou **TOP 20** si l’édition est étendue).
- **Investi‑lecteurs gagnants** : **tous** les lecteurs ayant **acheté ≥ 1 livre** d’un **auteur TOP 10** durant le mois (uniques).

### Paramètres (par défaut)
- Part **auteurs** : **α = 60 %** de S_pot  
- Part **lecteurs** : **β = 40 %** de S_pot  
- Mode : **équipartition** par défaut dans chaque groupe (paramétrable : `weighted`, `group_ratio`).

### Formules (avec arrondis VISUAL)
Travailler en **centimes** puis appliquer l’**arrondi à l’euro inférieur** pour les utilisateurs ; les **restes** (centimes & écarts) vont à **VISUAL**.

- Conversion : `S_c = round(S_pot × 100)` (centimes)  
- Total auteurs (centimes) : `A_c = floor(α × S_c)`  
- Total lecteurs (centimes) : `R_c = floor(β × S_c)`

Si **N** = nombre d’auteurs gagnants (10 par défaut) et **M** = nombre d’investi‑lecteurs gagnants (uniques) :

- **Part auteur unitaire (centimes)** :  
  `a_each_c = floor( A_c / N )` → **versement utilisateur** `a_each_euro = floor(a_each_c / 100) × 100`  
- **Part lecteur unitaire (centimes)** :  
  `r_each_c = floor( R_c / M )` → **versement utilisateur** `r_each_euro = floor(r_each_c / 100) × 100`

- **Résidu** (centimes) pour VISUAL :  
  `residual_c = S_c − ( N × a_each_euro + M × r_each_euro )`  
  **VISUAL reçoit** `residual_c` en plus de ses autres revenus (frais infra, etc.).

> Remarque : si `M = 0` (aucun lecteur gagnant), **R_c** est intégralement versé aux **auteurs gagnants** (*fallback*) **ou** reporté en **residu VISUAL** selon le paramètre `pot_empty_readers_policy`.

---

## 5) Pseudocode (TypeScript-like)
```ts
const ALPHA = 0.60; // auteurs
const BETA  = 0.40; // lecteurs

function closeMonth_Livres(s_pot_eur: number, authorsTopN: string[], readerWinners: string[]) {
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

## 6) Ajustements d’interface & d’admin
- Le **compte à rebours** affiche **“Clôture : dernier jour du mois à 23:59:59 (Europe/Paris)”**.
- L’**Admin** visualise la **fenêtre mensuelle** et les **rangs 1–100** spécifiques au mois.
- Les **exports** (CSV/ledger) utilisent la **période mensuelle** comme partition temporelle.
- Les **rapports** de VisualAI & VisualFinanceAI pour **Livres** passent en **cadence mensuelle**.

---

## 7) Compatibilité & invariants
- **70/30** sur chaque vente unitaire **inchangé**.
- **VISUpoints** : 100 pts = 1 €, seuil 2 500 pts, conversion floor, KYC/Stripe requis **inchangés**.
- **Sécurité/antifraude/modération/SEO** : inchangés.
- **TOP N extensible** : passage à **TOP 20** (si 200 auteurs) → les formules restent valables en remplaçant **N**.

---

## 8) Remplacement dans la doc
- Dans `Category_LIVRES_Spec.md`, remplacer le bloc “Durée : 30 jours” par la **présente mensualisation** et **remplacer “Pot à J+30” par “Pot mensuel (fenêtre calendaire)”**.

---

## 9) Tests à dérouler
- Mois de **28/29/30/31** jours : ouverture/clôture aux bons instants (TZ Europe/Paris, DST ok).
- Cas **M=0** lecteurs gagnants : appliquer la politique `pot_empty_readers_policy`.
- Arrondis : vérifier **euro floor** et **résidus → VISUAL**.
- Auto-report TOP 10 → mois suivant, repêchage rang 11–100 (25 €) sous 24 h.
