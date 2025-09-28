# 🤖 VisualScoutAI - Guide d'intégration

## 🎯 Vue d'ensemble

VisualScoutAI est l'agent de prospection éthique de VISUAL qui détecte et active des audiences pertinentes tout en respectant strictement la vie privée et les réglementations RGPD/CCPA.

## 🏗️ Architecture

### 🤝 Coopération avec les autres agents
- **VisualAI (Maître)** : VisualScoutAI obéit aux décisions et toggles
- **VisualFinanceAI** : Coordination pour budgets et reporting
- **AgentCoordinator** : Orchestration et prévention des conflits

### 🛡️ Principes de sécurité
- **APIs officielles uniquement** : Meta, TikTok, YouTube, Twitter
- **Opt-in requis** : Aucun contact non sollicité
- **Données anonymisées** : Signaux agrégés, pas de PII
- **Kill switch** : Arrêt d'urgence par l'admin

## 📊 Fonctionnalités

### 🔍 Détection d'audiences
- **Listening social** : Mots-clés audiovisuels par langue
- **Scoring d'intérêt** : Algorithme 0-100 basé engagement
- **Prédictions** : CTR, CVR, CPI par canal
- **Recommandations** : Activation automatique si score > seuil

### 📈 Campagnes
- **Simulation** : Reach, coûts, conversions estimés
- **Création** : Brouillons avec validation conformité
- **Monitoring** : Métriques temps réel
- **Optimisation** : A/B testing créatifs

### 🎯 Canaux d'activation
- **Meta/Instagram Ads** : Audiences lookalike
- **TikTok Ads** : Ciblage créateurs
- **YouTube Ads** : Intérêts cinéma/vidéo
- **Twitter/X Ads** : Hashtags tendances
- **SEO Content** : Articles optimisés

## 🔧 Configuration

### Variables d'environnement
```env
# VisualScoutAI
SCOUT_ENABLED=true
SCOUT_MAX_BUDGET_EUR=1000
SCOUT_RATE_LIMIT_PER_MINUTE=10

# APIs externes (optionnel)
META_ACCESS_TOKEN=your_token
TIKTOK_ACCESS_TOKEN=your_token
YOUTUBE_API_KEY=your_key
TWITTER_BEARER_TOKEN=your_token
```

### Configuration runtime
```json
{
  "tete_chercheuse": {
    "enabled": true,
    "locales": ["fr-FR","en-US","es-ES"],
    "score_threshold": 62,
    "channels": ["meta_ads","tiktok_ads","youtube_ads"],
    "consent_required_for_contact": true,
    "logs_retention_days": 180
  }
}
```

## 🎮 Interface Admin

### Onglets disponibles
1. **Dashboard** : Métriques globales et top keywords
2. **Segments** : Gestion des audiences cibles
3. **Campagnes** : Création et suivi des campagnes
4. **Simulateur** : Prédictions reach/CTR/CVR
5. **Coordination** : Statut inter-agents

### Actions admin
- **Créer segment** : Définir mots-clés et règles
- **Simuler campagne** : Estimer performance avant lancement
- **Kill switch** : Arrêt d'urgence avec raison obligatoire
- **Templates outreach** : Génération messages opt-in

## 📋 Endpoints API

### Segments
```http
POST /api/admin/tc/segments
GET  /api/admin/tc/segments
```

### Campagnes
```http
POST /api/admin/tc/simulate
POST /api/admin/tc/campaigns
GET  /api/admin/tc/dashboard
```

### Coordination
```http
GET  /api/admin/agents/status
POST /api/admin/agents/command
POST /api/admin/tc/kill
```

## 🔒 Sécurité et conformité

### Authentification
- **Admin requis** : Tous les endpoints protégés
- **2FA obligatoire** : Actions sensibles
- **Rate limiting** : Protection anti-spam
- **Audit logs** : Traçabilité complète

### RGPD/CCPA
- **Base légale** : Intérêt légitime pour écoute agrégée
- **Consentement** : Requis pour contact direct
- **Droit d'opposition** : Désinscription 1 clic
- **Minimisation** : Données strictement nécessaires

### Limites techniques
- **Budget max** : €1,000 par campagne
- **Rate limiting** : 10 requêtes/minute
- **Retention** : 180 jours maximum
- **Kill switch** : Arrêt immédiat possible

## 🧪 Tests et validation

### Tests fonctionnels
- [ ] Détection de signaux par mots-clés
- [ ] Calcul de scores d'intérêt
- [ ] Prédictions CTR/CVR
- [ ] Simulation de campagnes
- [ ] Kill switch fonctionnel

### Tests de conformité
- [ ] Aucun stockage de PII
- [ ] Respect des rate limits APIs
- [ ] Validation des consentements
- [ ] Audit trail complet

### Tests d'intégration
- [ ] Coopération avec VisualAI
- [ ] Respect des toggles de catégories
- [ ] Coordination budgets avec VisualFinanceAI
- [ ] Interface admin responsive

## 🚀 Déploiement

### Prérequis
- Base de données avec tables VisualScoutAI
- Clés APIs des plateformes sociales
- Configuration RGPD/CCPA
- Accès admin configuré

### Activation
1. Configurer les variables d'environnement
2. Créer les premiers segments d'audience
3. Tester avec le simulateur
4. Lancer les premières campagnes
5. Monitorer les métriques

## 📞 Support

### Monitoring
- **Métriques temps réel** : Dashboard admin
- **Alertes** : Budgets, performance, erreurs
- **Logs** : Actions admin et décisions IA

### Maintenance
- **Mise à jour keywords** : Selon tendances
- **Optimisation modèles** : Performance prédictive
- **Rotation clés APIs** : Sécurité
- **Backup configurations** : Segments et règles

---

**🎬 VisualScoutAI - Prospection éthique au service de VISUAL** ✨