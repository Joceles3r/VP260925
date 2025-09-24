
# Petites_Annonces_Photos_Spec.md
**Version : 24/09/2025 — Module “jusqu’à 10 photos par annonce”**  
**Portée :** Rubrique **Petites Annonces** de VISUAL — s’intègre à la publication/modération existantes.

---

## 1) Règle fonctionnelle
- Chaque annonce peut joindre **jusqu’à 10 photos** (mini 1, maxi 10).  
- **Ordre** des photos modifiable par **glisser‑déposer** ; une **photo de couverture** est obligatoire (par défaut la 1re).  
- **Texte + photos** s’affichent dans la fiche d’annonce ; **aperçu** carré/16:9 généré automatiquement.

---

## 2) Contraintes de fichiers
- **Formats acceptés** : **JPEG (.jpg/.jpeg)**, **PNG**, **WEBP**.  
- **Taille max upload** : **10 Mo par photo** (recommandé ≤ 4 Mo).  
- **Dimensions recommandées** : **long bord ≤ 2560 px** (mini 1024 px).  
- **Couleur** : sRGB ; **EXIF** sensibles **supprimés** à l’ingestion (géoloc, appareil, série…).  
- **Images interdites** : filigranes agressifs, nudité/NSFW, logos/marques trompeurs, QR/paiements externes, pub déguisée.

### Traitements automatiques
- **Normalisation** : orientation EXIF, conversion éventuelle **WebP** qualité 80.  
- **Thumbnails** : 320 px (liste), 640 px (mobile/retina), 1280 px (desktop).  
- **Lazy‑loading** + **blur‑up** ; **CDN** activé (cache public 7 j).

---

## 3) Modèle de données (PostgreSQL)
```sql
CREATE TABLE ad_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  idx SMALLINT NOT NULL CHECK (idx BETWEEN 0 AND 9),  -- ordre 0..9
  is_cover BOOLEAN NOT NULL DEFAULT false,
  alt TEXT,                         -- alternatif accessible
  storage_key TEXT NOT NULL,        -- chemin CDN/Storage
  width INT NOT NULL,
  height INT NOT NULL,
  bytes INT NOT NULL CHECK (bytes > 0 AND bytes <= 10*1024*1024),
  content_type TEXT NOT NULL,       -- image/jpeg|png|webp
  sha256 BYTEA NOT NULL,            -- déduplication
  moderation_status TEXT NOT NULL DEFAULT 'pending', -- pending|approved|rejected
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX ON ad_photos (ad_id, idx);
CREATE INDEX ON ad_photos (ad_id);
```

---

## 4) Endpoints (REST)
- `POST /api/ads/:adId/photos` (multipart)  
  - Valide formats/poids, **limite 10** (retourne 409 si >10).  
  - Retourne `id, idx, is_cover, urls{thumb,medium,full}`.
- `PATCH /api/ads/:adId/photos/order`  
  - Body: `{ order: [photoId1, photoId2, ...] }` (longueur ≤10, unique).  
- `PATCH /api/ads/:adId/photos/:photoId`  
  - Body: `{ is_cover?: boolean, alt?: string }`.
- `DELETE /api/ads/:adId/photos/:photoId`  
  - Supprime + **reindex** les `idx` restants ; si cover supprimée, set cover = idx 0.  

> Sécurité : ACL auteur de l’annonce ou ADMIN ; **CSRF** sur requêtes mutatives ; **scan antivirus**.

---

## 5) Modération & conformité (VisualAI)
- **File “pending”** : chaque photo passe par le **classifieur** (NSFW, texte sensible, logos à risque, fraude).  
- **Règles auto** :  
  - Si rejet → statut `rejected` + motif, notification à l’annonceur.  
  - Si doute → `pending_review` → revue humaine.  
- **Filigranes** : **tolérés** s’ils n’altèrent pas l’information (ex. watermark discret <8% surface).  
- **Droits** : l’annonceur garantit ses droits (photo/lieu/objets, droit à l’image).

---

## 6) UI/UX publication
- Zone **drag‑and‑drop** + bouton “Ajouter”.  
- **Barre de progression** + erreurs lisibles (format, taille, quota 10/10).  
- **Re‑order** par drag ; **Set cover** ; **alt** requis (accessibilité A).  
- **Compteur** : `6 / 10 photos`.  
- **Cropping** non destructif (présets 4:3, 16:9, 1:1).

---

## 7) Performance & CDN
- Stockage **Bunny Storage** (ou S3 compatible) + **Bunny CDN**.  
- **Variantes** stockées en **cache** ; purge à la **modification** ou suppression.  
- TTL public 7 jours, **etag** activé, compression **brotli**/gzip.

---

## 8) Tests
- Upload 11e photo → **409** “limit exceeded”.  
- Suppression cover → réassignation auto.  
- Re‑order persistant (idx 0..n).  
- WebP/JPEG/PNG : preview OK, EXIF sensibles absents.  
- Lazy‑loading + blur‑up visibles en prod.  
- Modération : rejet NSFW → photo non visible publiquement.

---

## 9) Paramètres runtime
- `ads.photos.max_per_ad = 10`  
- `ads.photos.max_bytes = 10485760`  
- `ads.photos.long_edge_max = 2560`  
- `ads.photos.webp_quality = 80`

---

## 10) Intégration doc
- Ajouter la ligne **“jusqu’à 10 photos par annonce”** dans :  
  - le **formulaire de publication**,  
  - l’**Additif/Rappel** (section 3 “Exigences”),  
  - la **page d’aide** Petites Annonces.
