#!/usr/bin/env node

/**
 * VISUAL Platform - Script de rotation des clés de sécurité
 * 
 * Ce script permet de rotationner automatiquement les clés sensibles :
 * - Clés de session, JWT, chiffrement
 * 
 * Usage: node scripts/security/rotate-keys.js [--dry-run] [--force]
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const CONFIG = {
  ENV_FILES: ['.env', 'server/.env', 'client/.env'],
  KEYS_TO_ROTATE: {
    SESSION_SECRET: { length: 64 },
    JWT_SECRET: { length: 32 },
    ENCRYPTION_KEY: { length: 32 }
  },
  BACKUP_DIR: './backups/key-rotation'
};

function generateSecureKey(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

function log(message, type = 'info') {
  const colors = { info: '\x1b[36m', success: '\x1b[32m', warning: '\x1b[33m', error: '\x1b[31m', reset: '\x1b[0m' };
  console.log(`${colors[type]}[${new Date().toISOString()}] ${message}${colors.reset}`);
}

function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(CONFIG.BACKUP_DIR, timestamp);
  fs.mkdirSync(backupPath, { recursive: true });
  
  CONFIG.ENV_FILES.forEach(envFile => {
    const fullPath = path.resolve(envFile);
    if (fs.existsSync(fullPath)) {
      const backupFile = path.join(backupPath, path.basename(envFile));
      fs.copyFileSync(fullPath, backupFile);
      log(`Sauvegarde créée: ${backupFile}`, 'success');
    }
  });
  
  return backupPath;
}

function updateEnvFile(filePath, newKeys) {
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let updated = false;
  
  Object.entries(newKeys).forEach(([key, value]) => {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(content)) {
      content = content.replace(regex, `${key}=${value}`);
    } else {
      content += `\n${key}=${value}`;
    }
    updated = true;
    log(`Clé mise à jour: ${key}`, 'success');
  });
  
  if (updated) fs.writeFileSync(filePath, content);
}

async function rotateKeys(options = {}) {
  const { dryRun = false, force = false } = options;
  
  try {
    log('🔄 Rotation des clés de sécurité', 'info');
    
    // Générer nouvelles clés
    const newKeys = {};
    Object.entries(CONFIG.KEYS_TO_ROTATE).forEach(([keyName, config]) => {
      newKeys[keyName] = generateSecureKey(config.length);
    });
    
    if (dryRun) {
      log('Mode DRY-RUN: simulation terminée', 'warning');
      return;
    }
    
    // Backup
    const backupPath = createBackup();
    
    // Mise à jour des fichiers
    CONFIG.ENV_FILES.forEach(envFile => updateEnvFile(envFile, newKeys));
    
    // Audit
    const auditFile = path.join(CONFIG.BACKUP_DIR, 'rotation-audit.jsonl');
    fs.appendFileSync(auditFile, JSON.stringify({
      timestamp: new Date().toISOString(),
      rotatedKeys: Object.keys(newKeys),
      backupPath
    }) + '\n');
    
    log('✅ Rotation terminée avec succès', 'success');
    log('⚠️ Redémarrez les services pour appliquer les nouvelles clés', 'warning');
    
  } catch (error) {
    log(`❌ Erreur: ${error.message}`, 'error');
    process.exit(1);
  }
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    dryRun: args.includes('--dry-run'),
    force: args.includes('--force')
  };
  
  rotateKeys(options);
}