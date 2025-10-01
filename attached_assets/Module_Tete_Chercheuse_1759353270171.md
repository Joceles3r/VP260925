
# Module « Tête chercheuse » — Prospection éthique assistée par IA
**Agent principal : _VisualScoutAI_** (IA d'observation & d'audience)  
**Version : 27/09/2025** • **Statut : prêt à intégrer (spec + endpoints + modèles)**

> Objet : détecter, scorer et activer des **audiences pertinentes** pour VISUAL, en respectant strictement la **vie privée**, les **CGU** des plateformes et la **réglementation** (RGPD/CCPA).  
> ⚠️ **Aucun envoi de messages privés non sollicités**. L'activation se fait par **contenus publics**, **publicités officielles** (APIs Ads) et **contacts opt‑in** uniquement.

---

## 1) Rôles & responsabilités
- **VisualScoutAI (ce module)** : écoute sociale (APIs officielles), **détection de signaux publics**, scoring d'intérêt, recommandations d'activation (contenus, ads).  
- **VisualAI (maître)** : supervision, validation manuelle, conformité, publication des contenus, modération.  
- **VisualFinanceAI (esclave)** : non impliqué (sauf si campagne payante activée : budget, factures).

---

## 2) Sources & limites (conformité)
- **Sources autorisées** : APIs officielles (ex. Meta/Instagram Graph, TikTok, X/Twitter, YouTube, Reddit) **avec clés et droits** ; moteurs de recherche (tendances/keywords).  
- **Interdit** : scraping sauvage, data brokers non conformes, collecte de données sensibles (religion, santé, politique, etc.), identification personnelle sans consentement.  
- **Données stockées** : signaux agrégés/anonymisés (mots‑clés, hashtags, métriques d'engagement), **jamais** d’emails/téléphones sans **opt‑in** explicite.

---

## 3) Cœur du module (pipeline)
1. **Listening** (jobs planifiés)  
   - Requêtes par **mots‑clés** (ex. *court‑métrage*, *tournage*, *casting*, *documentaire*, *BTS filming*, *film festival*, *sound design*…).  
   - Filtres : langue (`fr,en,es`), zone, fraîcheur (≤7j), type de média.  
2. **Enrichment** (safe)  
   - Normalisation, détection de langue, catégories (créateur / investisseur / pro).  
   - **Aucune** inférence de traits sensibles.  
3. **Scoring** (Intérêt VISUAL)  
   - `interest_score ∈ [0,100]` = f(mot‑clé, fréquence, auteur créatif, suivi de comptes cinéma, mention *funding*, interaction avec contenus similaires, etc.).  
   - **Fairness** : pas d’attribut sensible, contrôle de biais, explications SHAP simplifiées.  
4. **Ciblage & activation**  
   - **Contenu organique** recommandé : sujets, hashtags, timing.  
   - **Publicités** via APIs Ads : ciblages par centres d’intérêt/audiences similaires (lookalike), **jamais** par catégories sensibles.  
   - **Contact direct** uniquement si **opt‑in** (formulaires, newsletter, lead ads).  
5. **Boucle d’apprentissage**  
   - Évalue CTR, watch‑time, conversions (inscription/investissement), ajuste mots‑clés, horaires et créas.

---

## 4) Canaux d’activation (autorisés)
- **Ads officielles** : Meta/Instagram Ads, TikTok Ads, YouTube Ads, X Ads (créneaux, intérêt cinéma/vidéo, lookalikes).  
- **SEO/Content** : articles, extraits, *behind the scenes*, *case studies* → redirection vers landing VISUAL.  
- **Lead opt‑in** : newsletter, waitlist, lead‑gen forms (plateformes) ; **email** uniquement si double opt‑in.  
- **Messagerie** : **uniquement** conversation initiée par l’utilisateur (commentaire mot‑clé, clic “Message” sur page pro).

---

## 5) Gouvernance & conformité
- **Registre de traitement** : finalités, DPO, base légale (**intérêt légitime** pour écoute **agrégée**), durées de conservation (90j agrégés).  
- **Consentement** : exigé pour emails/SMS/Custom Audiences (hash).  
- **Droit d’opposition** : lien simple en pied de page (désinscription 1 clic).  
- **Journalisation** : requêtes APIs, versions de modèles, décisions automatisées **auditables**.  
- **Kill‑switch** : `tete_chercheuse.enabled=false` désactive tous les jobs.

---

## 6) Modèle de données (résumé)
**Tables principales**  
- `tc_signals` : id, platform, keyword, hashtag, lang, ts, engagement_counts (agg), sample_post_url (hash).  
- `tc_segments` : id, name, rules (JSON), locale, status.  
- `tc_scores` : id, segment_id, window, interest_score_avg, ctr_pred, cvr_pred.  
- `tc_campaigns` : id, channel (meta/tiktok/yt/x), objective, budget, dates, status.  
- `tc_creatives` : id, campaign_id, copy_id, asset_id, locale, status, kpi.  
- `tc_consent_leads` : id, source, email_hash, consent_ts, locale, topics.

---

## 7) Endpoints (REST, schéma)
- `POST /api/admin/tc/segments` : créer un **segment** (règles de mots‑clés, langue, zone).  
- `POST /api/admin/tc/simulate` : simuler **reach** & **CPI** estimés.  
- `POST /api/admin/tc/campaigns` : préparer **brouillon de campagne** (channel + audience + créas).  
- `GET  /api/admin/tc/dashboard` : métriques agrégées (reach, CTR, CPA, conversions).  
- `POST /api/admin/tc/kill` : arrêt d’urgence (désactive jobs & campagnes).

_Authentification ADMIN + 2FA, rate‑limit, journaux signés._

---

## 8) Pseudocode (illustratif)
```ts
// 1) Listening
for (const kw of KEYWORDS["fr"]) {
  const res = await socialApi.search({ q: kw, lang: "fr", since: now-7d, limit: 500 });
  const signals = aggregate(res); // counts only, no PII
  db.tc_signals.insert(signals);
}

// 2) Scoring (par segment)
for (const seg of db.tc_segments.active()) {
  const S = db.tc_signals.filter(seg.rules).last(7d);
  const score = model.predictInterest(S);
  db.tc_scores.upsert({ segment_id: seg.id, interest_score_avg: score.avg, ctr_pred: score.ctr, cvr_pred: score.cvr });
}

// 3) Reco activation
if (score.ctr > 0.8 && score.cvr > 0.25) {
  suggestCampaign({
    channel: "meta_ads",
    objective: "traffic",
    audience: buildInterestAudience(seg),
    creatives: pickCreatives("cinema_neon_fr"),
    budget: planBudget(score)
  });
}
```

---

## 9) UI Admin (rapide)
- **Segments** (cartes : mots‑clés, locale, score d’intérêt).  
- **Recommandations** (onglet : “Top créas”, “Top horaires”, “Hashtags gagnants”).  
- **Simulateur** (slider budget → reach/CTR/CVR estimés).  
- **Journal** (APIs, décisions, campagnes actives).  
- **Kill‑switch** (rouge, confirmation double).

---

## 10) Templates d’invitation (opt‑in uniquement)
- **FR (email opt‑in / message initié)**  
  > Bonjour {Prénom}, on a vu votre intérêt pour {thème}. VISUAL mélange **streaming** et **micro‑investissement** pour soutenir les projets vidéo (2 à 20 €). On vous montre ? {lien}  
- **EN**  
  > Hi {FirstName}, noticed your interest in {topic}. VISUAL blends **streaming** with **micro‑investing** (from €2). Fancy a look? {link}

---

## 11) Métriques & objectifs
- **Reach qualifié** (par segment/locale), **CTR**, **CPI**, **CPA inscription**, **CVR investisseur**.  
- **Qualité** : watch‑time moyen, follow créateurs, rétention 7/30.  
- **Sécurité** : 0 incident (report plateforme, violation CGU), 0 plainte RGPD.

---

## 12) Paramètres (runtime)
```json
{
  "tete_chercheuse": {
    "enabled": true,
    "locales": ["fr-FR","en-US","es-ES"],
    "keywords": {
      "fr": ["court-métrage","casting","tournage","documentaire","compositeur film","voix off","festival cinéma"],
      "en": ["short film","casting call","film shoot","documentary","film composer","voice over","film festival"]
    },
    "window_days": 7,
    "score_threshold": 62,
    "channels": ["meta_ads","tiktok_ads","youtube_ads","x_ads","seo_content"],
    "consent_required_for_contact": true,
    "logs_retention_days": 180
  }
}
```

---

## 13) Roadmap brève
- **v1** : écoute agrégée + scoring, reco contenu + ads, tableau de bord.  
- **v1.1** : lookalikes (via API Ads), optimisation créas A/B.  
- **v1.2** : lead scoring (opt‑in) + nurturing multilingue.  
- **v2** : modèle multi‑tâches (intérêt + fraude + détection de bots), attribution MMM.

---

### ⚖️ Notes éthiques
- Finalité limitée, minimisation, transparence (page “Marketing & Vie privée”).  
- Droit d’opposition **sans friction**.  
- PAS de ciblage par attribut sensible, PAS de DMs non sollicités, PAS de scraping.
