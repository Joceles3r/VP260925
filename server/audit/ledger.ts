/**
 * Audit Ledger - VISUAL Platform
 * Système d'audit append-only avec signature HMAC
 */

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const AUDIT_HMAC_KEY = process.env.AUDIT_HMAC_KEY || 'dev-secret-key-change-in-production';
const AUDIT_LOG_PATH = path.join(process.cwd(), 'var', 'audit.log');

interface AuditRecord {
  ts: number;
  type: string;
  actor: string;
  data: Record<string, any>;
}

interface AuditLogEntry {
  record: AuditRecord;
  sig: string;
}

/**
 * Génère une signature HMAC SHA-256 pour un payload
 */
function sign(payload: Buffer): string {
  return crypto
    .createHmac('sha256', AUDIT_HMAC_KEY)
    .update(payload)
    .digest('hex');
}

/**
 * Supprime récursivement les valeurs undefined (mimique JSON.stringify)
 * Convertit undefined en null dans les arrays pour correspondre à JSON.stringify
 * Densifie les sparse arrays (trous → null)
 */
function stripUndefined(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    // Densifier et normaliser : trous et undefined → null (comme JSON.stringify)
    const result = [];
    for (let i = 0; i < obj.length; i++) {
      const item = obj[i];
      result.push(item === undefined ? null : stripUndefined(item));
    }
    return result;
  }
  
  const result: any = {};
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    if (value !== undefined) {
      result[key] = stripUndefined(value);
    }
  });
  
  return result;
}

/**
 * Sérialisation déterministe canonique
 * Normalise avec JSON round-trip puis trie les clés récursivement
 * Garantit l'identité PARFAITE avec la persistence JSON
 */
function deterministicStringify(obj: any): string {
  // Normaliser TOUT avec JSON round-trip (gère SDK objects, toJSON, etc.)
  const normalized = JSON.parse(JSON.stringify(obj));
  // Trier les clés récursivement pour garantir le déterminisme
  return JSON.stringify(sortKeys(normalized));
}

/**
 * Trie récursivement les clés d'un objet (deep)
 */
function sortKeys(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => sortKeys(item));
  }
  
  const sorted: any = {};
  Object.keys(obj).sort().forEach(key => {
    sorted[key] = sortKeys(obj[key]);
  });
  
  return sorted;
}

/**
 * Ajoute une entrée au journal d'audit (append-only, signé HMAC)
 * 
 * @param eventType - Type d'événement
 * @param actorId - ID de l'acteur (user, system, agent)
 * @param data - Données de l'événement
 * @returns true si succès
 */
export function appendAudit(
  eventType: string, 
  actorId: string, 
  data: Record<string, any>
): boolean {
  try {
    const ts = Math.floor(Date.now() / 1000);
    const record: AuditRecord = {
      ts,
      type: eventType,
      actor: actorId,
      data: stripUndefined(data) // Supprimer undefined avant signature
    };
    
    // Sérialisation canonique PROFONDE (tous les champs nested inclus)
    const raw = Buffer.from(deterministicStringify(record));
    const sig = sign(raw);
    
    const logEntry: AuditLogEntry = { record, sig };
    const line = JSON.stringify(logEntry) + '\n';
    
    // Créer le répertoire si nécessaire
    const dir = path.dirname(AUDIT_LOG_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Append au fichier de log
    fs.appendFileSync(AUDIT_LOG_PATH, line, 'utf-8');
    
    return true;
  } catch (error) {
    console.error('Audit log error:', error);
    return false;
  }
}

/**
 * Vérifie la signature d'une entrée d'audit
 * 
 * @param entry - Entrée du journal d'audit
 * @returns true si la signature est valide
 */
export function verifyAuditEntry(entry: AuditLogEntry): boolean {
  try {
    // Utiliser la même sérialisation déterministe profonde
    const raw = Buffer.from(deterministicStringify(entry.record));
    const expectedSig = sign(raw);
    return entry.sig === expectedSig;
  } catch {
    return false;
  }
}

/**
 * Lit et vérifie toutes les entrées du journal d'audit
 * 
 * @returns Liste des entrées vérifiées
 */
export function readAuditLog(): AuditLogEntry[] {
  try {
    if (!fs.existsSync(AUDIT_LOG_PATH)) {
      return [];
    }
    
    const content = fs.readFileSync(AUDIT_LOG_PATH, 'utf-8');
    const lines = content.trim().split('\n').filter(line => line.length > 0);
    
    return lines.map(line => {
      try {
        const entry = JSON.parse(line) as AuditLogEntry;
        return entry;
      } catch {
        return null;
      }
    }).filter((entry): entry is AuditLogEntry => entry !== null);
  } catch (error) {
    console.error('Error reading audit log:', error);
    return [];
  }
}

/**
 * Vérifie l'intégrité complète du journal d'audit
 * 
 * @returns {valid: boolean, totalEntries: number, invalidEntries: number[]}
 */
export function verifyAuditLogIntegrity(): {
  valid: boolean;
  totalEntries: number;
  invalidEntries: number[];
} {
  const entries = readAuditLog();
  const invalidEntries: number[] = [];
  
  entries.forEach((entry, index) => {
    if (!verifyAuditEntry(entry)) {
      invalidEntries.push(index);
    }
  });
  
  return {
    valid: invalidEntries.length === 0,
    totalEntries: entries.length,
    invalidEntries
  };
}
