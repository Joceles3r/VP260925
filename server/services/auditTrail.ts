/**
 * Service d'audit trail sécurisé avec signature HMAC
 * Path: server/services/auditTrail.ts
 * Adapté du fichier Python ledger.py fourni
 */

import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

export interface AuditRecord {
  timestamp: number;
  type: string;
  actor: string;
  data: Record<string, any>;
}

export interface SignedAuditEntry {
  record: AuditRecord;
  signature: string;
}

export class AuditTrailService {
  private readonly key: Buffer;
  private readonly auditLogPath: string;
  private readonly lock = new AsyncLock();

  constructor() {
    // Clé HMAC depuis les variables d'environnement
    const keyStr = process.env.AUDIT_HMAC_KEY || 'dev-secret-change-in-production';
    this.key = Buffer.from(keyStr, 'utf-8');
    
    // Chemin du fichier d'audit
    this.auditLogPath = process.env.AUDIT_LOG_PATH || 'var/audit.log';
  }

  /**
   * Signe un payload avec HMAC-SHA256
   */
  private sign(payload: Buffer): string {
    return crypto.createHmac('sha256', this.key).update(payload).digest('hex');
  }

  /**
   * Ajoute une entrée au trail d'audit avec signature
   */
  async appendAudit(eventType: string, actorId: string, data: Record<string, any>): Promise<boolean> {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      
      const record: AuditRecord = {
        timestamp,
        type: eventType,
        actor: actorId,
        data,
      };

      // Sérialiser de manière déterministe pour signature
      const rawRecord = JSON.stringify(record, null, 0);
      const recordBuffer = Buffer.from(rawRecord, 'utf-8');
      
      // Signer le record
      const signature = this.sign(recordBuffer);
      
      const signedEntry: SignedAuditEntry = {
        record,
        signature,
      };

      // Ligne à écrire dans le fichier
      const line = JSON.stringify(signedEntry) + '\n';

      // Écriture thread-safe
      await this.lock.acquire('write', async () => {
        await this.ensureAuditDir();
        await fs.appendFile(this.auditLogPath, line, 'utf-8');
      });

      return true;
    } catch (error) {
      console.error('Erreur audit trail:', error);
      return false;
    }
  }

  /**
   * Vérifie l'intégrité de tout le fichier d'audit
   */
  async verifyAuditFile(): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    let lineNumber = 0;

    try {
      if (!(await this.fileExists(this.auditLogPath))) {
        return { valid: true, errors: [] }; // Pas de fichier = pas d'erreur
      }

      const content = await fs.readFile(this.auditLogPath, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim() !== '');

      for (const line of lines) {
        lineNumber++;
        
        try {
          const entry: SignedAuditEntry = JSON.parse(line);
          
          // Vérifier la structure
          if (!entry.record || !entry.signature) {
            errors.push(`Ligne ${lineNumber}: Structure invalide`);
            continue;
          }

          // Recalculer la signature pour vérification
          const rawRecord = JSON.stringify(entry.record, null, 0);
          const recordBuffer = Buffer.from(rawRecord, 'utf-8');
          const expectedSignature = this.sign(recordBuffer);

          if (expectedSignature !== entry.signature) {
            errors.push(`Ligne ${lineNumber}: Signature HMAC invalide`);
          }

        } catch (parseError) {
          errors.push(`Ligne ${lineNumber}: JSON invalide - ${parseError}`);
        }
      }

      return {
        valid: errors.length === 0,
        errors,
      };

    } catch (error) {
      errors.push(`Erreur de lecture du fichier: ${error}`);
      return { valid: false, errors };
    }
  }

  /**
   * Récupère les entrées d'audit avec pagination
   */
  async getAuditEntries(
    limit: number = 100,
    offset: number = 0,
    actorId?: string,
    eventType?: string
  ): Promise<AuditRecord[]> {
    try {
      if (!(await this.fileExists(this.auditLogPath))) {
        return [];
      }

      const content = await fs.readFile(this.auditLogPath, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim() !== '');

      const entries: AuditRecord[] = [];

      for (const line of lines) {
        try {
          const entry: SignedAuditEntry = JSON.parse(line);
          
          // Filtrer par acteur si spécifié
          if (actorId && entry.record.actor !== actorId) {
            continue;
          }

          // Filtrer par type d'événement si spécifié
          if (eventType && entry.record.type !== eventType) {
            continue;
          }

          entries.push(entry.record);
        } catch (parseError) {
          console.warn('Ligne d\'audit corrompue ignorée:', parseError);
        }
      }

      // Trier par timestamp décroissant (plus récent en premier)
      entries.sort((a, b) => b.timestamp - a.timestamp);

      // Appliquer pagination
      return entries.slice(offset, offset + limit);

    } catch (error) {
      console.error('Erreur lecture audit trail:', error);
      return [];
    }
  }

  /**
   * Rotation des logs d'audit (garder les N derniers)
   */
  async rotateAuditLogs(keepCount: number = 10): Promise<boolean> {
    try {
      const auditDir = path.dirname(this.auditLogPath);
      const auditFilename = path.basename(this.auditLogPath);
      
      if (!(await this.fileExists(this.auditLogPath))) {
        return true; // Rien à faire
      }

      // Créer une copie horodatée
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const archivePath = path.join(auditDir, `${auditFilename}.${timestamp}`);
      
      await fs.copyFile(this.auditLogPath, archivePath);

      // Supprimer les anciens fichiers d'archive
      const files = await fs.readdir(auditDir);
      const auditFiles = files
        .filter(file => file.startsWith(auditFilename) && file !== auditFilename)
        .sort()
        .reverse(); // Plus récent en premier

      // Supprimer les fichiers excédentaires
      for (let i = keepCount; i < auditFiles.length; i++) {
        await fs.unlink(path.join(auditDir, auditFiles[i]));
      }

      // Vider le fichier actuel
      await fs.writeFile(this.auditLogPath, '', 'utf-8');

      return true;
    } catch (error) {
      console.error('Erreur rotation audit logs:', error);
      return false;
    }
  }

  /**
   * Assure que le répertoire d'audit existe
   */
  private async ensureAuditDir(): Promise<void> {
    const auditDir = path.dirname(this.auditLogPath);
    await fs.mkdir(auditDir, { recursive: true });
  }

  /**
   * Vérifie si un fichier existe
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Simple AsyncLock pour éviter les conditions de course sur l'écriture
 */
class AsyncLock {
  private locks = new Map<string, Promise<void>>();

  async acquire<T>(key: string, callback: () => Promise<T>): Promise<T> {
    // Attendre le lock précédent s'il existe
    if (this.locks.has(key)) {
      await this.locks.get(key);
    }

    // Créer et exécuter le nouveau lock
    const lockPromise = callback();
    this.locks.set(key, lockPromise.then(() => {}, () => {}));

    try {
      return await lockPromise;
    } finally {
      // Nettoyer le lock
      if (this.locks.get(key) === lockPromise.then(() => {}, () => {})) {
        this.locks.delete(key);
      }
    }
  }
}

// Instance singleton
export const auditTrail = new AuditTrailService();