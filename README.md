# VISUAL - Plateforme d'Investissement de Contenu Créatif 🎬

VISUAL est une plateforme web innovante permettant aux utilisateurs d'investir dans des projets de contenu visuel (documentaires, courts-métrages, clips, animations, live shows) avec des micro-investissements de 1€ à 20€.

## 🚀 Stack Technique

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Express.js + TypeScript + PostgreSQL + Drizzle ORM
- **Authentification**: Replit Auth (OpenID Connect)
- **Paiements**: Stripe Connect + Payment Intents
- **Base de données**: PostgreSQL avec migrations Drizzle
- **Temps réel**: WebSocket pour live shows et notifications
- **Storage**: Object Storage pour médias
- **Monitoring**: Health checks + Metrics

## 📦 Installation

### Prérequis

- Node.js 18+
- PostgreSQL 14+
- Yarn (recommandé)
- Docker (optionnel)

### Clone du projet

```bash
git clone https://github.com/votre-org/visual-platform.git
cd visual-platform
```

### Installation des dépendances

```bash
# Installation globale
yarn install

# Ou installation séparée (si besoin)
cd client && yarn install
cd ../server && yarn install
```

### Configuration

1. Copiez les fichiers d'exemple :
```bash
cp .env.example .env
cp client/.env.example client/.env
cp server/.env.example server/.env
```

2. Configurez vos variables d'environnement (voir section Configuration)

3. Lancez les migrations :
```bash
yarn db:migrate
```

4. (Optionnel) Seedez la base de données :
```bash
yarn db:seed
```

## 🔧 Configuration

### Variables d'environnement principales

Référez-vous aux fichiers `.env.example` pour la configuration complète.

**Clés critiques :**
- `DATABASE_URL`: URL de connexion PostgreSQL
- `STRIPE_SECRET_KEY`: Clé secrète Stripe
- `REPLIT_AUTH_*`: Configuration authentification
- `OBJECT_STORAGE_*`: Configuration stockage fichiers

## 🏃‍♂️ Développement

### Commandes Make (recommandé)

```bash
# Démarrage rapide
make dev          # Lance tous les services en mode développement
make up           # Lance avec Docker Compose
make down         # Arrête Docker Compose

# Base de données
make migrate      # Lance les migrations
make seed         # Seed la base de données
make db-reset     # Reset complet de la BDD

# Tests et qualité
make test         # Lance tous les tests
make lint         # Vérifie le code (ESLint + Ruff)
make format       # Formate le code (Prettier + Black)

# Production
make build        # Build pour production
make start        # Démarre en mode production
```

### Commandes manuelles

```bash
# Développement
yarn dev          # Lance frontend + backend
yarn dev:client   # Frontend uniquement
yarn dev:server   # Backend uniquement

# Base de données
yarn db:migrate   # Migrations
yarn db:generate  # Génère migrations
yarn db:studio    # Interface Drizzle Studio

# Tests
yarn test         # Tests unitaires
yarn test:e2e     # Tests end-to-end
yarn lighthouse   # Tests performance

# Build
yarn build        # Build production
yarn preview      # Preview du build
```

## 🐳 Docker

```bash
# Avec Docker Compose
docker-compose up -d          # Services en arrière-plan
docker-compose logs -f app    # Logs de l'application

# Build manuel
docker build -t visual-app .
docker run -p 3000:3000 visual-app
```

## 📊 Architecture

### Structure du projet

```
visual-platform/
├── client/                   # Frontend React
│   ├── src/
│   │   ├── components/      # Composants React
│   │   ├── pages/          # Pages de l'application
│   │   ├── hooks/          # Hooks personnalisés
│   │   └── admin/          # Interface administration
│   └── public/             # Assets statiques
├── server/                  # Backend Express
│   ├── services/           # Services métier
│   ├── routes/            # Routes API
│   ├── middleware/        # Middlewares Express
│   └── config/            # Configuration serveur
├── shared/                 # Code partagé
│   ├── schema.ts          # Schémas base de données
│   └── constants.ts       # Constantes communes
├── db/                     # Base de données
│   └── migrations/        # Migrations SQL
└── scripts/               # Scripts utilitaires
```

### Modules principaux

- **🎯 Investissements**: Micro-investissements de 1€ à 20€
- **📺 Live Shows**: Battles en temps réel entre artistes
- **👥 Réseau Social**: Posts, commentaires, interactions
- **🛡️ Modération**: Signalements communautaires
- **👤 Visiteurs Mineurs**: Système pour utilisateurs 16-17 ans
- **💳 Découvert**: Gestion des découverts de solde
- **📰 Voix de l'Info**: Plateforme d'articles payants
- **👑 Administration**: Interface admin complète

## 🔒 Sécurité

- Authentification OpenID Connect via Replit Auth
- Headers de sécurité configurés (CSP, HSTS, etc.)
- Validation stricte des entrées avec Zod
- Chiffrement des données sensibles
- Conformité RGPD et protection des données
- Rotation automatique des clés API
- Audit trail complet des actions

## 🚦 Monitoring

### Health Checks

- `/healthz`: Status basique (public)
- `/readyz`: Vérifications détaillées (authentifié)
- `/metrics`: Métriques Prometheus (authentifié)
- `/status`: État des services (authentifié)

### Logs

Les logs sont structurés et ne contiennent pas d'informations personnelles (conformité RGPD).

## 🧪 Tests

```bash
# Tests unitaires
yarn test:unit

# Tests d'intégration
yarn test:integration

# Tests E2E
yarn test:e2e

# Performance (Lighthouse)
yarn lighthouse

# Accessibilité
yarn a11y
```

## 📝 Contribution

1. Forkez le projet
2. Créez votre branche feature (`git checkout -b feature/ma-feature`)
3. Commitez vos changements (`git commit -m 'Ajout de ma feature'`)
4. Poussez vers la branche (`git push origin feature/ma-feature`)
5. Ouvrez une Pull Request

### Standards de code

- **TypeScript**: Configuration stricte
- **ESLint + Prettier**: Formatage automatique
- **Conventional Commits**: Messages de commit standardisés
- **Pre-commit hooks**: Vérifications automatiques

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🆘 Support

- **Documentation**: [VISUAL_Documentation_Complete.md](VISUAL_Documentation_Complete_16-09-2025.md)
- **Issues**: Utilisez les GitHub Issues
- **Contact**: [Informations dans APPLICATION_VISUAL_COMPLETE.md](APPLICATION_VISUAL_COMPLETE.md)

## 📈 Status des intégrations

Voir [INTEGRATION_STATUS.md](INTEGRATION_STATUS.md) pour l'état détaillé des fonctionnalités et intégrations.

---

Développé avec ❤️ pour révolutionner l'investissement dans le contenu créatif.