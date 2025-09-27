# 🎬 VISUAL Platform

**Plateforme d'investissement de contenus visuels** - Mix innovant entre streaming et crowdfunding.

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/visual-platform/visual)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.0-orange.svg)](package.json)

## 🚀 Vue d'ensemble

VISUAL est une plateforme révolutionnaire qui permet aux investisseurs de soutenir des projets de contenus visuels avec de petits montants (€1-€20) tout en influençant les classements via un système de vote communautaire. Les créateurs perçoivent des droits d'auteur et financements, tandis que les investisseurs gagnent s'ils sélectionnent les projets du TOP 10.

### ✨ Fonctionnalités principales

- **💰 Micro-investissements** : €1 à €20 par projet avec calculs ROI automatiques
- **🎯 Système de vote** : Influence communautaire sur les classements de projets  
- **🤖 Scoring ML** : Évaluation automatique des projets (0-10 points)
- **📊 Dashboard avancé** : Suivi portefeuille et métriques de performance
- **🔴 Shows live** : Battles d'artistes en temps réel avec investissements
- **👥 Réseau social** : Posts, likes, commentaires et partage de projets
- **🛡️ Conformité AMF** : Rapports automatiques et audit trail complet

## 🏗️ Architecture

```
VISUAL Platform/
├── 🔧 Backend (FastAPI + Python)
│   ├── API RESTful complète
│   ├── WebSocket temps réel  
│   ├── Base PostgreSQL + Drizzle ORM
│   └── Services ML et compliance
├── 🎨 Frontend (React + TypeScript)
│   ├── Interface moderne Tailwind
│   ├── Components shadcn/ui
│   └── Navigation responsive
├── 🚀 Infrastructure
│   ├── Docker & Docker Compose
│   ├── Nginx reverse proxy
│   └── Monitoring & logs
└── 📦 Déploiement
    ├── Scripts automatisés
    ├── Configuration production
    └── Health checks
```

## 🚀 Installation rapide

### Prérequis
- **Node.js** 18+ et **Yarn**
- **Python** 3.11+ et **pip** 
- **Docker** & **Docker Compose**
- **PostgreSQL** 15+

### 1. Cloner le projet
```bash
git clone https://github.com/visual-platform/visual.git
cd visual-platform
```

### 2. Configuration environnement
```bash
# Copier le fichier d'exemple
cp .env.example .env.production

# Éditer les variables (base de données, secrets, etc.)
nano .env.production
```

### 3. Déploiement automatique
```bash
# Déploiement complet avec Docker Compose
chmod +x deployment/deploy.sh
./deployment/deploy.sh compose

# OU déploiement de développement
npm install
npm run dev
```

## 📋 Scripts disponibles

```bash
# Développement
npm run dev              # Lance frontend + backend
npm run dev:frontend     # Frontend uniquement (port 3000)  
npm run dev:backend      # Backend uniquement (port 8001)

# Production
npm run build            # Build complet
npm run start            # Démarrage production
npm run deploy           # Déploiement Docker Compose

# Tests & Quality
npm run test             # Tests frontend + backend
npm run lint             # Linting du code

# Déploiement avancé
npm run deploy:build     # Build images Docker uniquement
npm run deploy:logs      # Voir les logs
npm run deploy:status    # Statut déploiement
```

## 🐳 Déploiement Docker

### Option 1: Docker Compose (Recommandé)
```bash
# Déploiement complet avec base de données
docker-compose up -d

# Vérifier le statut
docker-compose ps
```

### Option 2: Container standalone  
```bash
# Build l'image
docker build -t visual-platform .

# Lancer le container
docker run -d \
  --name visual-app \
  -p 80:80 \
  -e NODE_ENV=production \
  visual-platform
```

## 🔧 Configuration

### Variables d'environnement principales

| Variable | Description | Exemple |
|----------|-------------|---------|
| `DATABASE_URL` | URL PostgreSQL | `postgresql://user:pass@localhost:5432/visual_db` |
| `SESSION_SECRET` | Clé de session | `your-secure-secret-key` |
| `NODE_ENV` | Environnement | `production` |
| `STRIPE_SECRET_KEY` | Paiements Stripe | `sk_live_...` |

### Structure base de données

La base utilise PostgreSQL avec les tables principales :
- `users` - Comptes utilisateurs et profils
- `projects` - Projets de contenus visuels  
- `investments` - Investissements et ROI
- `transactions` - Audit trail financier
- `notifications` - Système de notifications

## 📊 API Documentation

### Endpoints principaux

```http
# Authentification
GET  /api/auth/me          # Utilisateur actuel
POST /api/auth/logout      # Déconnexion

# Projets  
GET    /api/projects       # Liste des projets
POST   /api/projects       # Créer projet
GET    /api/projects/{id}  # Détails projet

# Investissements
GET  /api/investments      # Mes investissements  
POST /api/investments      # Nouvel investissement

# Notifications
GET   /api/notifications   # Mes notifications
PATCH /api/notifications/{id}/read  # Marquer lu
```

### Réponse type
```json
{
  "success": true,
  "data": { ... },
  "pagination": {
    "page": 1,
    "limit": 20, 
    "total": 150,
    "totalPages": 8
  }
}
```

## 🎯 Modèle économique

### Répartition des revenus
- **70%** → Créateurs de contenus
- **30%** → Commission plateforme  

### Redistribution mensuelle
- **60%** → TOP 10 créateurs du mois
- **40%** → Investisseurs gagnants

### Système VISUpoints
- **1 EUR = 100 VISUpoints**
- Minimum retrait : **2 500 VP** (25€)

## 🛡️ Sécurité

- ✅ **Authentification** Replit Auth + sessions PostgreSQL
- ✅ **Chiffrement** Données sensibles avec bcrypt
- ✅ **CORS** Configuration restrictive
- ✅ **Rate limiting** Protection API 
- ✅ **Validation** Zod schemas côté backend
- ✅ **Audit logs** Traçabilité complète des actions

## 🚦 Monitoring & Logs

### Health checks
```bash
# Santé application
curl http://localhost/health

# Statut API
curl http://localhost/api/health  

# Logs temps réel
docker-compose logs -f visual-app
```

### Métriques disponibles
- Temps de réponse API
- Taux de conversion investissements  
- Performance des projets
- Activité utilisateurs

## 🤝 Contribution

1. **Fork** le projet
2. **Créer** une branche (`git checkout -b feature/nouvelle-fonctionnalite`)  
3. **Commit** vos changements (`git commit -m 'Ajouter nouvelle fonctionnalité'`)
4. **Push** vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. **Ouvrir** une Pull Request

### Standards de code
- **Frontend** : ESLint + Prettier
- **Backend** : Black + Flake8  
- **Commits** : Convention Conventional Commits
- **Tests** : Couverture > 80%

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 📞 Support

- **Documentation** : [docs.visual-platform.com](https://docs.visual-platform.com)
- **Issues** : [GitHub Issues](https://github.com/visual-platform/visual/issues)  
- **Email** : support@visual-platform.com
- **Discord** : [Communauté VISUAL](https://discord.gg/visual)

---

**🎬 Fait avec ❤️ par l'équipe VISUAL Platform**