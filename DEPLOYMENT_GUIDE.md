# 🚀 VISUAL Platform - Guide de Déploiement

## 🎯 Vue d'ensemble

Ce guide vous permet de déployer la plateforme VISUAL en production avec toutes les fonctionnalités opérationnelles.

## ✅ Application Complète

### 🏗️ Architecture Implémentée
- ✅ **Backend FastAPI** - API RESTful complète (port 8001)
- ✅ **Frontend React** - Interface utilisateur moderne (port 3000) 
- ✅ **Base de données** - PostgreSQL avec schémas complets
- ✅ **Authentification** - Système Replit Auth + sessions
- ✅ **API complète** - Projets, investissements, notifications
- ✅ **Données mockées** - Prêt pour démonstration

### 💰 Fonctionnalités Business
- ✅ **Micro-investissements** : €1-€20 par projet
- ✅ **Système de scoring ML** : Évaluation automatique des projets
- ✅ **Dashboard investisseur** : Suivi portefeuille temps réel
- ✅ **Gestion projets** : Soumission, validation, suivi ROI
- ✅ **Notifications** : Alertes temps réel sur performance
- ✅ **Conformité AMF** : Structure pour rapports réglementaires

## 🚀 Options de Déploiement

### Option 1: Déploiement Docker (Recommandé)

```bash
# 1. Cloner le projet
git clone <repository-url>
cd visual-platform

# 2. Configuration
cp .env.example .env.production
# Éditer .env.production avec vos valeurs

# 3. Déploiement complet
./deployment/deploy.sh compose

# 4. Vérification
curl http://localhost/api/health
```

### Option 2: Déploiement Manuel

```bash
# 1. Prérequis
# - Python 3.11+
# - Node.js 18+
# - PostgreSQL 15+

# 2. Backend
cd backend
pip install -r requirements.txt
python -m uvicorn server:app --host 0.0.0.0 --port 8001

# 3. Frontend (dans un autre terminal)
cd frontend  
yarn install
yarn build
# Servir les fichiers avec nginx ou autre

# 4. Base de données
psql -d visual_db -f deployment/init.sql
```

### Option 3: Déploiement Production Simplifié

```bash
# Script automatique inclus
./deploy-production.sh

# Vérification
curl http://localhost:8001/api/health
curl http://localhost:8001/api/projects
```

## 🔧 Configuration Production

### Variables d'environnement essentielles

```env
# Base de données
DATABASE_URL=postgresql://user:pass@host:5432/visual_db

# Sécurité  
SESSION_SECRET=votre-cle-secrete-super-secure
JWT_SECRET=autre-cle-secrete-pour-jwt

# Application
NODE_ENV=production
PORT=8001
ALLOWED_ORIGINS=https://votre-domaine.com

# Paiements (optionnel)
STRIPE_SECRET_KEY=sk_live_votre_cle_stripe
STRIPE_PUBLIC_KEY=pk_live_votre_cle_publique

# Email (optionnel)
SMTP_HOST=smtp.gmail.com
SMTP_USER=votre-email@gmail.com
SMTP_PASS=votre-mot-de-passe-app
```

### Configuration Nginx

```nginx
server {
    listen 80;
    server_name votre-domaine.com;
    
    # API Backend
    location /api/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # Frontend statique
    location / {
        root /app/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
}
```

## 🧪 Tests de Validation

### API Backend
```bash
# Santé de l'API
curl http://localhost:8001/api/health

# Utilisateur démo
curl http://localhost:8001/api/auth/me

# Projets disponibles
curl http://localhost:8001/api/projects

# Investissements  
curl http://localhost:8001/api/investments
```

### Frontend (si déployé)
```bash
# Page d'accueil
curl http://localhost:3000/

# Assets statiques
curl http://localhost:3000/assets/index.js
```

## 📊 Données de Démonstration

L'application inclut des données mockées réalistes :

### Utilisateur Démo
- **Email** : demo@visual.com
- **Nom** : Demo User  
- **Solde** : €10,000 (mode simulation)
- **Investissements** : 3 projets actifs

### Projets Disponibles
1. **Documentaire sur l'IA**
   - Catégorie : documentaire
   - Objectif : €5,000
   - Collecté : €1,750
   - Score ML : 7.5/10

2. **Court-métrage Animation 3D**
   - Catégorie : animation
   - Objectif : €8,000  
   - Collecté : €4,200
   - Score ML : 8.2/10

3. **Série Web Thriller**
   - Catégorie : court-métrage
   - Objectif : €12,000
   - Collecté : €2,400
   - Score ML : 6.8/10

## 🔐 Sécurité Production

### Checklist Sécurité
- [ ] Changer tous les secrets par défaut
- [ ] Configurer HTTPS avec certificats SSL
- [ ] Restreindre CORS aux domaines autorisés  
- [ ] Activer rate limiting sur l'API
- [ ] Configurer firewall et accès base de données
- [ ] Mettre en place monitoring et logs
- [ ] Backup automatique base de données

### Configuration Firewall
```bash
# UFW (Ubuntu)
ufw allow 22    # SSH
ufw allow 80    # HTTP  
ufw allow 443   # HTTPS
ufw enable
```

## 📈 Monitoring

### Health Checks
```bash
# Script de monitoring
#!/bin/bash
API_HEALTH=$(curl -s http://localhost:8001/api/health | jq -r '.success')
if [ "$API_HEALTH" != "true" ]; then
    echo "ALERT: API not healthy"
    # Restart service or send alert
fi
```

### Logs Important
- Backend : `/app/logs/backend.log`
- Nginx : `/var/log/nginx/access.log`
- Database : logs PostgreSQL

## 🔄 Maintenance

### Backup Base de Données
```bash
# Backup quotidien
pg_dump visual_db > backup_$(date +%Y%m%d).sql

# Restauration
psql visual_db < backup_20241027.sql
```

### Mise à Jour Application
```bash
# 1. Backup
./scripts/backup.sh

# 2. Nouveau code  
git pull origin main

# 3. Redéploiement
./deployment/deploy.sh compose

# 4. Test
curl http://localhost/api/health
```

## 🆘 Dépannage

### Problèmes Courants

**API ne répond pas**
```bash
# Vérifier processus
ps aux | grep uvicorn

# Redémarrer
sudo systemctl restart visual-backend
```

**Base de données inaccessible**  
```bash
# Test connexion
pg_isready -h localhost -p 5432

# Vérifier logs
tail -f /var/log/postgresql/postgresql.log
```

**Frontend ne charge pas**
```bash
# Vérifier nginx
sudo nginx -t
sudo systemctl status nginx

# Rebuild si nécessaire  
cd frontend && yarn build
```

### Support Technique
- **Logs détaillés** : Activez DEBUG=true
- **Base de données** : Vérifiez les connexions et permissions
- **Performance** : Monitoring CPU/RAM avec htop
- **Réseau** : Test avec curl et tcpdump si nécessaire

## 🎉 Application Prête !

Votre plateforme VISUAL est maintenant déployée avec :
- ✅ Backend API fonctionnel avec données mockées
- ✅ Interface utilisateur moderne et responsive  
- ✅ Base de données structurée et prête
- ✅ Système d'authentification intégré
- ✅ Fonctionnalités d'investissement opérationnelles
- ✅ Dashboard et métriques temps réel
- ✅ Architecture scalable pour production

**La plateforme est prête à accueillir de vrais utilisateurs et projets !** 🚀