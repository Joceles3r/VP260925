# VISUAL Studio Live Show — Fichier de Secours (Finalistes & Remplaçants)
_Version courte opérationnelle • Timezone : Europe/Paris_

## 1) Objet
Gérer les **imprévus** quand un (ou les deux) finaliste(s) se désiste(nt) avant le Live Show du vendredi **21:00–00:00**. Prévoit **jusqu’à 2 remplaçants** (rangs **#3** et **#4**) et des **échéances claires** de confirmation/annulation.

---

## 2) Règles de base
- **Désignation (Mar 00:00)** : après la sélection, on fige le **classement 1→4**.  
  - **F1** = finaliste #1, **F2** = finaliste #2.  
  - **A1** = remplaçant #3, **A2** = remplaçant #4.
- **Live Show** : vendredi **21:00–00:00**.  
- **Deadline de line-up** : **vendredi 20:00** (composition finale verrouillée).

---

## 3) Confirmations & délais
### Finalistes (F1, F2)
- **Mar 00:00** : envoi “**Confirme ta battle**” → réponse requise par **Mer 12:00** (soft deadline).
- **Annulation possible jusqu’à Jeudi 21:00** (dernier délai **sans pénalité**).  
- Après **Jeudi 21:00** → annulation = **cas d’urgence** (peut déclencher pénalités, cf. §8).

### Remplaçants (A1, A2)
- **Mar 00:05** : envoi “**Alerte Stand-by**” → demander **acceptation de disponibilité**.  
- Rester prêts jusqu’à **Vendredi 20:00** (confirmation finale).  
- **Vendredi 19:30** : ping “**Êtes-vous prêts si besoin ?**” ; **cut-off 20:00**.

---

## 4) Scénarios de remplacement
> **Priorité** : A1 puis A2. Tous les changements sont **journalisés** et **notifiés**.

### S1 — Un seul finaliste se retire **avant Jeudi 21:00**
1. Promouvoir **A1** → devient **F’**.  
2. A1 refuse/indisponible → promouvoir **A2**.  
3. Mettre à jour : visuels, textes, communiqués, planning.  
4. Notifier : F restant, A1/A2, partenaires pub, équipe technique.

### S2 — Un seul finaliste se retire **après Jeudi 21:00** et **avant Vendredi 20:00**
1. **Cas d’urgence** : tenter **A1** (sinon **A2**).  
2. Si aucun remplaçant dispo → bascule **mode fallback** (§6).  
3. Notifier immédiatement tous les acteurs.

### S3 — **Deux** finalistes forfait **avant Jeudi 21:00**
1. Tenter **A1 vs A2** comme **nouvelle bataille**.  
2. Si un seul dispo → bascule **fallback** (§6).

### S4 — **Deux** finalistes forfait **après Jeudi 21:00**
1. Urgence : tenter **A1 vs A2**.  
2. Si impossible → **fallback** (§6), puis replanification.

---

## 5) Notifications (modèles FR)
### 5.1 Finaliste — Confirmation (Mar 00:00)
> Objet : **[VISUAL] Confirmation de ta battle — Vendredi 21:00**  
Bonjour **{Nom}**,  
Tu es finaliste du VISUAL Studio Live Show de cette semaine.  
Merci de **confirmer** ta participation (bouton ci-dessous) **avant Mercredi 12:00**.  
- Annulation possible **jusqu’à Jeudi 21:00**.  
[Confirmer ma battle] — [Annuler]

### 5.2 Remplaçant — Alerte Stand-by (Mar 00:05)
> Objet : **[VISUAL] Stand-by finaliste — sois prêt jusqu’à vendredi 20:00**  
Bonjour **{Nom}**,  
Tu es remplaçant prioritaire (**rang {#3|#4}**).  
Merci de **confirmer ta disponibilité** et de rester **prêt jusqu’à Vendredi 20:00**.  
[Je suis disponible] — [Je ne peux pas]

### 5.3 Public — Mise à jour line-up
> **Mise à jour** : un ajustement de line-up a été effectué. Le show **est maintenu** à **21:00**. Merci pour votre compréhension !

---

## 6) Modes fallback (si aucun duel possible)
- **“Showcase Spécial”** : un seul artiste (ou un best-of multi-artistes) + Q&A live.  
- **“Report”** : émission décalée à la semaine suivante (les pubs/spots sont re-bookés).  
> Le choix du fallback se fait en **Admin** (bouton) avec **message public** automatique.

---

## 7) Check-list Admin (opérationnel)
- Boutons : **Confirmer F1/F2**, **Promouvoir A1/A2**, **Verrouiller line-up (Ven 20:00)**, **Basculer fallback**.  
- Mises à jour automatiques : **bannières**, **assets**, **timers**, **planning pub**, **programme UI**.  
- Logs/audit : horodatage, acteur (Admin/IA), justification.

---

## 8) Politique (optionnelle) de pénalités
- **Annulation après Jeudi 21:00** : avertissement formel + **perte de priorité** pendant N éditions (paramétrable).  
- **No-show** sans prévenir : **exclusion temporaire** (ex. 1 édition) + retrait avantages.

> Ces pénalités sont des **toggles** (ON/OFF). Par défaut : **OFF** (à activer si abus).

---

## 9) API minimale (à brancher)
- `POST /live/finalists/confirm` `{ finalistId }` — confirme la battle.  
- `POST /live/finalists/cancel` `{ finalistId, reason }` — initie remplacement.  
- `POST /live/alternates/standby` `{ altId, available:true|false }` — confirme disponibilité.  
- `POST /live/finalists/promote` `{ fromAltId }` — promeut A1/A2 en finaliste.  
- `POST /live/lineup/lock` — verrouille la composition (Ven 20:00).

---

## 10) Résumé (1 minute)
- **Mar 00:00** : F1/F2 **doivent confirmer** ; A1/A2 **en stand-by**.  
- **Jusqu’à Jeudi 21:00** : annulation sans pénalité.  
- **Après Jeudi 21:00 → Ven 20:00** : **urgence** → promote A1/A2 si possible.  
- **Vendredi 20:00** : **line-up verrouillé**.  
- Si personne de dispo → **fallback** (Showcase ou Report).
