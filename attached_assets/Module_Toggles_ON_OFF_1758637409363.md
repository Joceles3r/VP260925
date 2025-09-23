
# Module_Toggles_ON_OFF.md

## 🎛️ Module « Boutons ON/OFF » — Visibilité des catégories & rubriques (v.16/09/2025)
Permettre à l’**ADMIN/PATRON** d’activer ou masquer, en un clic, les sections de VISUAL :
- **Catégories vidéo** : *Films*, *Vidéos*, *Documentaires*, *Visual Studio Live Show*
- **Catégories éditoriales** : *Les Voix de l’Info*, *Livres*
- **Rubriques** : *Petites Annonces*

Quand une section est **invisible**, la page publique affiche un **message contrôlé** :
- Pour une **catégorie** : « **Catégorie en cours** » ou « **Catégorie en travaux** »
- Pour la **rubrique** : « **Rubrique en cours** » ou « **Rubrique en travaux** »
(texte **personnalisable** et **traduisible**)

---

## 1) Exigences fonctionnelles
1. **Toggles** ON/OFF par section dans le **Dashboard ADMIN** (accès : ADMIN/PATRON).
2. **Message** configurable quand OFF : radio *(en cours / en travaux)* + **champ personnalisé**.
3. **Programmation** : possibilité de **planifier** une visibilité (date/heure de début/fin) — TZ **Europe/Paris**.
4. **Audit** : journaliser *qui/quand/quoi* pour chaque changement (+ raison).
5. **Propagation** : prise d’effet **quasi-immédiate** (≤ 5 s) côté front via cache court + invalidation.
6. **SEO** : quand OFF, page servie avec `noindex,nofollow` (+ option *maintenance 503* avec `Retry-After`).
7. **i18n** : messages disponibles dans la **langue de l’utilisateur** (barre de langue VISUAL).
8. **Sécurité** : rôle **ADMIN** requis, CSRF, idempotence des requêtes.

---

## 2) Modèle de données (PostgreSQL)
```sql
CREATE TYPE toggle_kind AS ENUM ('category', 'rubrique');
CREATE TYPE message_variant AS ENUM ('en_cours', 'en_travaux', 'custom');

CREATE TABLE feature_toggles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,        -- ex: 'films', 'videos', 'documentaires', 'voix_info', 'live_show', 'livres', 'petites_annonces'
  label TEXT NOT NULL,             -- libellé humain
  kind toggle_kind NOT NULL,       -- 'category' | 'rubrique'
  is_visible BOOLEAN NOT NULL DEFAULT true,

  -- Message lorsqu'off
  hidden_message_variant message_variant NOT NULL DEFAULT 'en_cours',
  hidden_message_custom TEXT,      -- optionnel, par langue en JSON si besoin

  -- Programmation (optionnelle)
  schedule_start TIMESTAMPTZ,      -- prise d'effet auto ON
  schedule_end   TIMESTAMPTZ,      -- prise d'effet auto OFF
  timezone TEXT NOT NULL DEFAULT 'Europe/Paris',

  -- Métadonnées
  version INTEGER NOT NULL DEFAULT 1,
  updated_by UUID,                 -- user ADMIN
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CHECK (key IN ('films','videos','documentaires','voix_info','live_show','livres','petites_annonces'))
);

CREATE INDEX ON feature_toggles (key);
CREATE INDEX ON feature_toggles (is_visible);
```

### Seed de base
```sql
INSERT INTO feature_toggles (key,label,kind) VALUES
('films','Catégorie Films','category'),
('videos','Catégorie Vidéos','category'),
('documentaires','Catégorie Documentaires','category'),
('voix_info','Les Voix de l''Info','category'),
('live_show','Visual Studio Live Show','category'),
('livres','Catégorie Livres','category'),
('petites_annonces','Rubrique Petites Annonces','rubrique');
```

---

## 3) API (REST minimaliste)
- `GET /api/admin/toggles` → liste complète (admin)
- `PATCH /api/admin/toggles/:key`  
  Body (exemple) :
  ```json
  {
    "is_visible": false,
    "hidden_message_variant": "en_travaux",
    "hidden_message_custom": {"fr":"Catégorie en travaux","en":"Category under construction"},
    "schedule_start": null,
    "schedule_end": "2025-09-30T09:00:00+02:00"
  }
  ```
  Réponses signées (ETag), **journal d’audit**.

- `GET /api/public/toggles` → **payload public** (lecture seule) pour le front (cache 5 s, ETag).

---

## 4) Intégration Front (React/Next)
### Hook
```ts
type TogglePublic = { key:string; isVisible:boolean; message:string; };
export async function useToggle(key: string): Promise<TogglePublic> {
  const res = await fetch('/api/public/toggles', { cache: 'no-store' });
  const data = await res.json(); // { films:{visible:true,msg:""}, ... }
  const entry = data[key];
  const message = entry.visible ? "" : entry.message; // i18n déjà résolu en backend
  return { key, isVisible: entry.visible, message };
}
```

### Garde de page
```tsx
export default async function FilmsPage() {
  const { isVisible, message } = await useToggle('films');
  if (!isVisible) {
    return (
      <HiddenPage title="Films" message={message} seoMaintenance={true} />
    );
  }
  return <FilmsCategory />;
}
```

### Composant placeholder (SEO-friendly)
```tsx
function HiddenPage({title, message, seoMaintenance=false}:{title:string,message:string,seoMaintenance?:boolean}){
  return (
    <main className="mx-auto max-w-2xl p-6 text-center">
      {seoMaintenance && <meta name="robots" content="noindex,nofollow" />}
      <h1 className="text-2xl font-bold mb-2">{title}</h1>
      <p className="text-lg">{message}</p>
    </main>
  );
}
```

---

## 5) Dashboard ADMIN (UX)
- **Switch** ON/OFF par ligne : Films / Vidéos / Documentaires / Les Voix de l’Info / Live Show / Livres / Petites Annonces.
- **Sélecteur de message** : radio *(en cours / en travaux)* + **champ personnalisé** (multi-langues).
- **Planification** : date/heure début/fin (TZ Europe/Paris), aperçu de l’état futur.
- **Bouton d’invalidation** cache (si purge CDN).
- **Audit pane** : encart latéral *qui/quand/quoi/pourquoi*.
- **Raccourcis** : OFF global (maintenance) / ON global (réouverture).

---

## 6) Règles d’affichage des messages
- **Catégories** OFF → message par défaut :  
  - `en_cours` → « Catégorie en cours »  
  - `en_travaux` → « Catégorie en travaux »
- **Rubrique** OFF → message par défaut :  
  - `en_cours` → « Rubrique en cours »  
  - `en_travaux` → « Rubrique en travaux »
- **Custom** : possible (par langue). Les placeholders `{name}` et `{until}` sont supportés :
  - Ex. `"{name} en travaux jusqu’au {until}"` (format localisé).

---

## 7) SEO & HTTP
- Par défaut **HTTP 200** + `<meta name="robots" content="noindex,nofollow">` pour éviter l’indexation pendant l’OFF.
- Option **maintenance stricte** : **HTTP 503** + `Retry-After` *(paramètre admin)*.
- Ne jamais renvoyer 404/410 (ce sont des pages existantes mais temporairement masquées).

---

## 8) Sécurité & Audit
- Accès API **ADMIN/PATRON** seulement (ACL + 2FA).
- **CSRF** sur endpoints mutatifs, **idempotency-key** sur PATCH.
- Audit : `toggle.changed` (key, old→new, userId, reason, timestamp).  
- **Notifications ADMIN** : Slack/Email lors d’un OFF programmé ou effectif.

---

## 9) Observabilité
- Métriques : temps de propagation, taux de cache hit, nb de flips/jour, erreurs PATCH.
- Logs : corrélation request-id, journaux signés (hash chaîne).
- Alertes si : divergence front/back (>5 s), échec purge CDN, tentatives non autorisées.

---

## 10) Compatibilité agents IA
- **VisualAI** : empêche l’affichage, les actions front, les notifs de cette section quand OFF (sauf ADMIN).
- **VisualFinanceAI** : **aucun payout** ni opération financière déclenchée par une section OFF (sauf tâches de clôture déjà engagées).

---

## 11) Exemple de payload public (i18n résolu)
```json
{
  "films":             {"visible": true,  "message": ""},
  "videos":            {"visible": true,  "message": ""},
  "documentaires":     {"visible": true,  "message": ""},
  "voix_info":         {"visible": false, "message": "Catégorie en travaux"},
  "live_show":         {"visible": true,  "message": ""},
  "livres":            {"visible": true,  "message": ""},
  "petites_annonces":  {"visible": false, "message": "Rubrique en cours"}
}
```

---

## 12) Checklist de tests
- Basculer chaque section ON/OFF → placeholder correct, SEO noindex présent, cache invalidé.
- Planifier OFF (dans 5 min) puis ON (dans 2 h) → état respecte la programmation.
- Custom message FR/EN → rendu correct, placeholders substitués.
- API sécurité : refus utilisateur non-admin ; CSRF OK ; idempotence PATCH OK.
- Observabilité : audit créé, notif ADMIN reçue.

---

## 13) Paramètres runtime conseillés
- `toggles_public_cache_ttl_s = 5`
- `toggle_default_message_variant_category = 'en_cours'`
- `toggle_default_message_variant_rubrique = 'en_cours'`
- `timezone_default = 'Europe/Paris'`
```

---

## 14) Snippet UI (ADMIN) — React + Tailwind (extrait)
```tsx
function ToggleRow({label, keyName}:{label:string,keyName:string}){
  const [state,setState]=React.useState({visible:true,variant:'en_cours',custom:''});
  return (
    <div className="flex items-center justify-between py-3 border-b">
      <div>
        <div className="font-medium">{label}</div>
        {!state.visible && (
          <div className="text-sm text-gray-600">Message: {state.variant==='custom'?state.custom:(state.variant==='en_travaux'?'en travaux':'en cours')}</div>
        )}
      </div>
      <div className="flex items-center gap-3">
        <select className="border rounded px-2 py-1" disabled={state.visible} value={state.variant} onChange={e=>setState(s=>({...s,variant:e.target.value}))}>
          <option value="en_cours">en cours</option>
          <option value="en_travaux">en travaux</option>
          <option value="custom">custom…</option>
        </select>
        {!state.visible && state.variant==='custom' && <input className="border rounded px-2 py-1" placeholder="Message personnalisé" onChange={e=>setState(s=>({...s,custom:e.target.value}))}/>}
        <button className={"px-4 py-1 rounded "+(state.visible?"bg-green-600 text-white":"bg-gray-300")} onClick={()=>setState(s=>({...s,visible:!s.visible}))}>
          {state.visible ? 'ON' : 'OFF'}
        </button>
      </div>
    </div>
  );
}
```
