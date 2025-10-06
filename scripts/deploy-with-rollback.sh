#!/bin/bash

###############################################################################
# Script de Déploiement Automatique avec Rollback - VISUAL Platform
# Usage: ./deploy-with-rollback.sh [version]
# Exemple: ./deploy-with-rollback.sh v1.2.3
###############################################################################

set -e  # Exit on error

# Couleurs pour output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/app"
BACKUP_DIR="$APP_DIR/.backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
VERSION=${1:-"v$(date +%Y%m%d-%H%M%S)"}
BACKUP_FILE="$BACKUP_DIR/backup_${TIMESTAMP}.tar.gz"
DB_BACKUP_FILE="$BACKUP_DIR/db_backup_${TIMESTAMP}.sql"

# Fichiers critiques à sauvegarder
CRITICAL_FILES=(
  ".env"
  "package.json"
  "client/.env"
  "server/"
  "client/src/"
  "shared/"
  "drizzle/"
)

###############################################################################
# Fonctions utilitaires
###############################################################################

log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[✓]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[!]${NC} $1"
}

log_error() {
  echo -e "${RED}[✗]${NC} $1"
}

###############################################################################
# Fonction: Créer backup complet
###############################################################################
create_backup() {
  log_info "Création du backup avant déploiement..."
  
  # Créer répertoire de backup si inexistant
  mkdir -p "$BACKUP_DIR"
  
  # Backup du code
  log_info "Backup du code source..."
  tar -czf "$BACKUP_FILE" \
    --exclude='node_modules' \
    --exclude='dist' \
    --exclude='.git' \
    --exclude='*.log' \
    -C "$APP_DIR" \
    "${CRITICAL_FILES[@]}" 2>/dev/null || true
  
  if [ -f "$BACKUP_FILE" ]; then
    log_success "Backup code créé: $BACKUP_FILE"
  else
    log_warning "Backup code partiel ou échec"
  fi
  
  # Backup de la base de données (si possible)
  if [ -n "$DATABASE_URL" ]; then
    log_info "Backup de la base de données..."
    # Extraction des infos de connexion depuis DATABASE_URL
    # Format: postgresql://user:pass@host:port/dbname
    
    # Pour PostgreSQL via pg_dump
    pg_dump "$DATABASE_URL" > "$DB_BACKUP_FILE" 2>/dev/null || {
      log_warning "Backup DB impossible (pg_dump non disponible)"
    }
    
    if [ -f "$DB_BACKUP_FILE" ]; then
      log_success "Backup DB créé: $DB_BACKUP_FILE"
    fi
  else
    log_warning "DATABASE_URL non définie, skip backup DB"
  fi
  
  # Créer tag Git avec backup info
  if [ -d ".git" ]; then
    git tag -a "backup-${TIMESTAMP}" -m "Backup before deploy ${VERSION}" 2>/dev/null || true
    log_success "Tag Git créé: backup-${TIMESTAMP}"
  fi
}

###############################################################################
# Fonction: Restaurer depuis backup
###############################################################################
restore_backup() {
  local backup_file=$1
  local db_backup_file=$2
  
  log_warning "ROLLBACK: Restauration depuis backup..."
  
  # Restaurer le code
  if [ -f "$backup_file" ]; then
    log_info "Restauration du code..."
    cd "$APP_DIR"
    tar -xzf "$backup_file" -C "$APP_DIR"
    log_success "Code restauré"
  else
    log_error "Fichier backup introuvable: $backup_file"
    return 1
  fi
  
  # Restaurer la base de données
  if [ -f "$db_backup_file" ] && [ -n "$DATABASE_URL" ]; then
    log_info "Restauration de la base de données..."
    psql "$DATABASE_URL" < "$db_backup_file" 2>/dev/null || {
      log_error "Échec restauration DB"
      return 1
    }
    log_success "Base de données restaurée"
  fi
  
  # Réinstaller les dépendances
  log_info "Réinstallation des dépendances..."
  yarn install --frozen-lockfile 2>&1 | tail -5
  
  # Rebuild
  log_info "Rebuild de l'application..."
  yarn build 2>&1 | tail -10
  
  log_success "ROLLBACK terminé avec succès"
}

###############################################################################
# Fonction: Tests de santé
###############################################################################
health_check() {
  log_info "Vérification de santé de l'application..."
  
  # Wait for app to start
  sleep 5
  
  # Check health endpoint
  local max_attempts=10
  local attempt=1
  
  while [ $attempt -le $max_attempts ]; do
    if curl -f http://localhost:5000/healthz > /dev/null 2>&1; then
      log_success "Health check réussi"
      return 0
    fi
    
    log_warning "Attempt $attempt/$max_attempts failed, retrying..."
    sleep 3
    ((attempt++))
  done
  
  log_error "Health check échoué après $max_attempts tentatives"
  return 1
}

###############################################################################
# Fonction: Déploiement principal
###############################################################################
deploy() {
  log_info "======================================================================"
  log_info " 🚀 VISUAL Platform - Déploiement ${VERSION}"
  log_info "======================================================================"
  echo ""
  
  # Étape 1: Créer backup
  create_backup
  echo ""
  
  # Étape 2: Tests pré-déploiement
  log_info "Tests pré-déploiement..."
  if ! yarn check; then
    log_error "TypeScript check failed"
    exit 1
  fi
  log_success "Tests pré-déploiement OK"
  echo ""
  
  # Étape 3: Installation des dépendances
  log_info "Installation des dépendances..."
  yarn install --frozen-lockfile || {
    log_error "Installation des dépendances échouée"
    exit 1
  }
  log_success "Dépendances installées"
  echo ""
  
  # Étape 4: Build
  log_info "Build de l'application..."
  if ! yarn build; then
    log_error "Build échoué"
    log_warning "Tentative de rollback..."
    restore_backup "$BACKUP_FILE" "$DB_BACKUP_FILE"
    exit 1
  fi
  log_success "Build réussi"
  echo ""
  
  # Étape 5: Migrations DB
  if [ -n "$DATABASE_URL" ]; then
    log_info "Application des migrations..."
    yarn db:push || {
      log_error "Migrations échouées"
      log_warning "Tentative de rollback..."
      restore_backup "$BACKUP_FILE" "$DB_BACKUP_FILE"
      exit 1
    }
    log_success "Migrations appliquées"
    echo ""
  fi
  
  # Étape 6: Redémarrage
  log_info "Redémarrage de l'application..."
  # Note: Sur Replit, le restart est automatique
  # Pour serveur custom: systemctl restart visual-app
  log_success "Redémarrage initié"
  echo ""
  
  # Étape 7: Health check
  if ! health_check; then
    log_error "Health check échoué après déploiement"
    log_warning "ROLLBACK AUTOMATIQUE..."
    restore_backup "$BACKUP_FILE" "$DB_BACKUP_FILE"
    
    # Restart après rollback
    log_info "Redémarrage après rollback..."
    sleep 5
    
    if health_check; then
      log_success "Application restaurée et fonctionnelle"
    else
      log_error "ÉCHEC CRITIQUE: Application non fonctionnelle après rollback"
      log_error "Intervention manuelle requise"
      exit 1
    fi
    exit 1
  fi
  
  log_success "Health check post-déploiement OK"
  echo ""
  
  # Étape 8: Tag de version
  if [ -d ".git" ]; then
    git tag -a "${VERSION}" -m "Deploy ${VERSION} - ${TIMESTAMP}" 2>/dev/null || true
    log_success "Version taggée: ${VERSION}"
  fi
  
  # Étape 9: Nettoyage des anciens backups (garder les 10 derniers)
  log_info "Nettoyage des anciens backups..."
  cd "$BACKUP_DIR"
  ls -t backup_*.tar.gz 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null || true
  ls -t db_backup_*.sql 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null || true
  log_success "Anciens backups nettoyés"
  
  echo ""
  log_info "======================================================================"
  log_success " ✅ DÉPLOIEMENT RÉUSSI - Version ${VERSION}"
  log_info "======================================================================"
  echo ""
  log_info "Backup disponible: $BACKUP_FILE"
  log_info "Pour rollback manuel: ./scripts/rollback.sh ${TIMESTAMP}"
  echo ""
}

###############################################################################
# Fonction: Rollback manuel
###############################################################################
manual_rollback() {
  local timestamp=$1
  
  if [ -z "$timestamp" ]; then
    log_error "Usage: $0 rollback <timestamp>"
    log_info "Backups disponibles:"
    ls -lh "$BACKUP_DIR"/backup_*.tar.gz 2>/dev/null || log_warning "Aucun backup trouvé"
    exit 1
  fi
  
  local backup_file="$BACKUP_DIR/backup_${timestamp}.tar.gz"
  local db_backup_file="$BACKUP_DIR/db_backup_${timestamp}.sql"
  
  if [ ! -f "$backup_file" ]; then
    log_error "Backup introuvable: $backup_file"
    exit 1
  fi
  
  log_warning "ROLLBACK MANUEL vers backup ${timestamp}"
  read -p "Confirmer le rollback? (yes/no): " confirm
  
  if [ "$confirm" != "yes" ]; then
    log_info "Rollback annulé"
    exit 0
  fi
  
  restore_backup "$backup_file" "$db_backup_file"
  
  # Restart
  log_info "Redémarrage..."
  sleep 5
  
  if health_check; then
    log_success "ROLLBACK RÉUSSI"
  else
    log_error "Health check échoué après rollback"
    exit 1
  fi
}

###############################################################################
# Point d'entrée principal
###############################################################################

case "${1:-deploy}" in
  deploy)
    deploy
    ;;
  rollback)
    manual_rollback "$2"
    ;;
  *)
    echo "Usage: $0 {deploy|rollback} [version|timestamp]"
    echo ""
    echo "Exemples:"
    echo "  $0 deploy v1.2.3          - Déployer version v1.2.3"
    echo "  $0 rollback 20250120_1430 - Rollback vers backup spécifique"
    exit 1
    ;;
esac
