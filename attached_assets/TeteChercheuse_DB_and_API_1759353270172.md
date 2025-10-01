
# TeteChercheuse_DB_and_API.md

## Schéma SQL (PostgreSQL — extrait)
```sql
CREATE TABLE tc_signals (
  id BIGSERIAL PRIMARY KEY,
  platform TEXT NOT NULL,
  keyword TEXT,
  hashtag TEXT,
  lang TEXT,
  ts TIMESTAMPTZ NOT NULL,
  engagement_json JSONB NOT NULL, -- counts agrégés
  sample_url_hash TEXT,           -- pas d'URL brute stockée
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE tc_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  rules JSONB NOT NULL,     -- {keywords:[...],lang:["fr"],zones:[...]}
  locale TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active','paused'))
);

CREATE TABLE tc_scores (
  id BIGSERIAL PRIMARY KEY,
  segment_id UUID REFERENCES tc_segments(id) ON DELETE CASCADE,
  window TEXT NOT NULL,     -- "last_7d"
  interest_score_avg NUMERIC(5,2) NOT NULL,
  ctr_pred NUMERIC(5,2),
  cvr_pred NUMERIC(5,2),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE tc_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel TEXT NOT NULL,    -- meta_ads|tiktok_ads|youtube_ads|x_ads|seo_content
  objective TEXT NOT NULL,  -- traffic|video_views|leads
  budget_cents BIGINT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('draft','active','paused','stopped','archived')) DEFAULT 'draft'
);

CREATE TABLE tc_creatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES tc_campaigns(id) ON DELETE CASCADE,
  locale TEXT NOT NULL,
  copy TEXT NOT NULL,
  asset_ref TEXT,
  kpi_json JSONB,
  status TEXT NOT NULL CHECK (status IN ('draft','approved','rejected','running')) DEFAULT 'draft'
);

CREATE TABLE tc_consent_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,      -- form|lead_ads|import
  email_hash TEXT UNIQUE,    -- SHA-256
  consent_ts TIMESTAMPTZ NOT NULL,
  locale TEXT,
  topics TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## Endpoints (REST)
- `POST /api/admin/tc/segments` body: `{ name, rules, locale }` → 201 `{id}`  
- `GET  /api/admin/tc/segments` → liste  
- `POST /api/admin/tc/simulate` body: `{ segment_id, budget }` → `{ reach_pred, ctr_pred, cvr_pred, cpi_est }`  
- `POST /api/admin/tc/campaigns` body: `{ channel, objective, audience_ref, budget }` → `{ id, status:'draft' }`  
- `PATCH /api/admin/tc/campaigns/:id` → MAJ statut, créas
- `GET  /api/admin/tc/dashboard` → KPIs (reach, CTR, CPA, CVR, top keywords)  
- `POST /api/admin/tc/kill` → stoppe tous les jobs/campagnes (requires ADMIN + 2FA)

> Tous les endpoints : AUTH ADMIN, 2FA, rate‑limit strict, journaux signés.
