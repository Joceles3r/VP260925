#!/bin/bash

###############################################################################
# Script de Rollback Rapide - VISUAL Platform
# Restaure automatiquement le dernier backup
###############################################################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

BACKUP_DIR="/app/.backups"

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }

# Trouver le dernier backup
LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/backup_*.tar.gz 2>/dev/null | head -1)
LATEST_DB_BACKUP=$(ls -t "$BACKUP_DIR"/db_backup_*.sql 2>/dev/null | head -1)

if [ -z "$LATEST_BACKUP" ]; then
  log_error "Aucun backup trouvé dans $BACKUP_DIR"
  exit 1
fi

log_warning "⚠️  ROLLBACK RAPIDE"
log_info "Backup à restaurer: $(basename $LATEST_BACKUP)"
echo ""
log_warning "Cette action va:"
log_warning "  - Restaurer le code depuis le backup"
log_warning "  - Restaurer la base de données (si disponible)"
log_warning "  - Redémarrer l'application"
echo ""
read -p "Continuer? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  log_info "Rollback annulé"
  exit 0
fi

echo ""
log_info "Extraction du backup..."
cd /app
tar -xzf "$LATEST_BACKUP" -C /app
log_info "Code restauré"

if [ -n "$LATEST_DB_BACKUP" ] && [ -n "$DATABASE_URL" ]; then
  log_info "Restauration de la base de données..."
  psql "$DATABASE_URL" < "$LATEST_DB_BACKUP" 2>&1 | tail -5
  log_info "DB restaurée"
fi

log_info "Réinstallation des dépendances..."
yarn install --frozen-lockfile 2>&1 | tail -5

log_info "Rebuild..."
yarn build 2>&1 | tail -10

log_info "Redémarrage..."
sleep 5

# Health check
if curl -f http://localhost:5000/healthz > /dev/null 2>&1; then
  echo ""
  log_info "======================================================================"
  log_info "✅ ROLLBACK RÉUSSI"
  log_info "======================================================================"
else
  log_error "Health check échoué - vérifier les logs"
  exit 1
fi
