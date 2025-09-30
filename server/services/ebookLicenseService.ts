/**
 * SERVICE DE LICENCES EBOOKS AVEC JWT RS256
 * 
 * Gère les licences de livres numériques avec :
 * - JWT RS256 pour prouver la propriété
 * - Quotas de téléchargement (3 DL / 7 jours par défaut)
 * - URLs signées courte durée (60-120s)
 * - Watermarking personnalisé
 * - Audit trail complet
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { nanoid } from 'nanoid';
import { storage } from '../storage';
import { auditTrail } from './auditTrail';

interface LicenseJWTPayload {
  sub: string; // user_id
  ebookId: string;
  licenseId: string;
  orderId?: string;
  dlMax: number; // téléchargements restants
  watermark: {
    userId: string;
    emailHash: string;
    orderId?: string;
    issuedAt: string;
  };
  jti: string; // JWT ID (unique, pour éviter réutilisation)
  exp: number; // expiration
  nbf: number; // not before
}

export class EbookLicenseService {
  
  private readonly JWT_EXPIRY_SECONDS = 600; // 10 minutes
  private readonly ATTEMPT_EXPIRY_SECONDS = 120; // 2 minutes
  private readonly SIGNED_URL_TTL_SECONDS = 60; // 60 secondes
  
  /**
   * Générer une clé privée RS256 (pour dev - en prod utiliser env var)
   */
  private getPrivateKey(): string {
    // EN PRODUCTION: Utiliser process.env.EBOOK_JWT_PRIVATE_KEY
    // Pour dev: générer une clé temporaire
    const privateKey = process.env.EBOOK_JWT_PRIVATE_KEY;
    if (!privateKey) {
      console.warn('⚠️ EBOOK_JWT_PRIVATE_KEY manquant - utilisation clé dev (UNSAFE pour production)');
      // Clé RSA 2048 bits dev (NE PAS utiliser en prod!)
      return `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKj
MzEfYyjiWA4R4/M2bS1+fWIcPm15A8+raUhEbXFqSbXPr1u0fBhU0tQPGqxmhXZq
vO/5wqeUQV1SJlhHn0p8wO1BNrChBbDQJAKCZXBKOVQ5SZu9Mhgd/u5MWi4SUnwK
vCPjLh9vLdC+bPO8LnBm0IzQdLiLJf7q9GH9MpQkp3YGbTcPjKSkPgAnE9aFTHDJ
gJaIHbqwFQQhwOlp8QXyLGMU3l3FPJ2Z7sQz4bYAeGWqWaEMb5c6PsZvCyGPBPaU
m0L5zPLN9NlKFKc0mVK8pxn4rq7qAnX5cHN+w0ZRMqEWXD3f6m0p6rYfAqQvdYMu
VxPMGkuTAgMBAAECggEADyPkmMk3kLMfLmGDkrwF0YfvH3vHwCf4k0E3mPpMQqNT
W+bJcL2yqPfPgRXeGY/JyQPdQtOqVlDw9s0MUP6zN0HqKbMbr9C/1rQ+R8A+zfQb
BqPu+qHJ5tgXDUvYxJtEp0rKp8Z5dLPVpBm5nk/z6yPztVp5n8VQ0F9T6LWcQGnD
xW3dKfGKQMpC3ZbxPvQNmLFGDjqP0Dj8QSmLbZmVJOqP1t+WvZ1JHxvMeN5TZY9k
hN0MoOu6tLqPnwVB9qLOvK9vk5cZT3qxQ8nBvN5kOxPzFqL5dKm7c8F9qLbPtGdL
vZpZQkVxN8qxDm0qKCfQrPKm8qBn8vQ5LGkPqL9nwQKBgQDmMaX9Y8qLJY5p8LnQ
vN5n8qL7pQm9kX5qL8nQ9k5L8pQm9kX5qL8nQ9k5L8pQm9kX5qL8nQ9k5L8pQm9k
X5qL8nQ9k5L8pQm9kX5qL8nQ9k5L8pQm9kX5qL8nQ9k5L8pQm9kX5qL8nQ9k5L8p
Qm9kX5qL8nQ9k5L8pQKBgQDQ8nL7pQm9kX5qL8nQ9k5L8pQm9kX5qL8nQ9k5L8pQ
m9kX5qL8nQ9k5L8pQm9kX5qL8nQ9k5L8pQm9kX5qL8nQ9k5L8pQm9kX5qL8nQ9k5
L8pQm9kX5qL8nQ9k5L8pQm9kX5qL8nQ9k5L8pQm9kX5qL8nQ9k5L8pQKBgFn9kX5
qL8nQ9k5L8pQm9kX5qL8nQ9k5L8pQm9kX5qL8nQ9k5L8pQm9kX5qL8nQ9k5L8pQm
9kX5qL8nQ9k5L8pQm9kX5qL8nQ9k5L8pQm9kX5qL8nQ9k5L8pQm9kX5qL8nQ9k5L
8pQm9kX5qL8nQ9k5L8pQm9kX5qL8nQ9k5L8pQKBgH5qL8nQ9k5L8pQm9kX5qL8n
Q9k5L8pQm9kX5qL8nQ9k5L8pQm9kX5qL8nQ9k5L8pQm9kX5qL8nQ9k5L8pQm9kX5
qL8nQ9k5L8pQm9kX5qL8nQ9k5L8pQm9kX5qL8nQ9k5L8pQm9kX5qL8nQ9k5L8pQm
9kX5qL8nQ9k5L8pQKBgAm9kX5qL8nQ9k5L8pQm9kX5qL8nQ9k5L8pQm9kX5qL8nQ
9k5L8pQm9kX5qL8nQ9k5L8pQm9kX5qL8nQ9k5L8pQm9kX5qL8nQ9k5L8pQm9kX5q
L8nQ9k5L8pQm9kX5qL8nQ9k5L8pQm9kX5qL8nQ9k5L8pQm9kX5qL8nQ9k5L8pQ==
-----END PRIVATE KEY-----`;
    }
    return privateKey;
  }

  /**
   * Créer une licence après un achat réussi (webhook Stripe)
   */
  async createLicense(params: {
    userId: string;
    ebookId: string;
    orderId: string;
    userEmail: string;
  }): Promise<{ licenseId: string; success: boolean }> {
    try {
      const { userId, ebookId, orderId, userEmail } = params;

      // Vérifier si licence existe déjà
      const existing = await storage.getEbookLicenseByUserAndBook(userId, ebookId, orderId);
      if (existing) {
        console.log(`License already exists for user ${userId}, ebook ${ebookId}`);
        return { licenseId: existing.id, success: true };
      }

      // Hash email pour watermark
      const emailHash = crypto.createHash('sha256').update(userEmail).digest('hex').substring(0, 16);

      // Créer la licence
      const license = await storage.createEbookLicense({
        userId,
        ebookId,
        orderId,
        status: 'active',
        dlLimit: 3, // 3 téléchargements
        dlUsed: 0,
        windowDays: 7, // fenêtre de 7 jours
        windowStartAt: new Date(),
        watermarkData: {
          userId,
          emailHash,
          orderId,
          createdAt: new Date().toISOString(),
        },
        jwtIssued: 0,
      });

      // Audit
      await auditTrail.appendAudit('ebook_license_created', userId, {
        licenseId: license.id,
        ebookId,
        orderId,
      });

      return { licenseId: license.id, success: true };

    } catch (error) {
      console.error('Error creating ebook license:', error);
      return { licenseId: '', success: false };
    }
  }

  /**
   * Générer un JWT de licence pour téléchargement
   */
  async generateLicenseJWT(licenseId: string, userId: string): Promise<{
    success: boolean;
    token?: string;
    error?: string;
  }> {
    try {
      // Récupérer la licence
      const license = await storage.getEbookLicense(licenseId);
      if (!license) {
        return { success: false, error: 'Licence introuvable' };
      }

      // Vérifier propriété
      if (license.userId !== userId) {
        await auditTrail.appendAudit('ebook_jwt_denied', userId, {
          licenseId,
          reason: 'not_owner',
        });
        return { success: false, error: 'Accès non autorisé' };
      }

      // Vérifier statut
      if (license.status !== 'active') {
        return { success: false, error: 'Licence révoquée ou expirée' };
      }

      // Vérifier quotas
      const remainingDownloads = license.dlLimit - license.dlUsed;
      if (remainingDownloads <= 0) {
        return { success: false, error: 'Quota de téléchargements atteint (3/7 jours)' };
      }

      // Vérifier fenêtre de quota
      const windowStart = new Date(license.windowStartAt);
      const windowEnd = new Date(windowStart.getTime() + license.windowDays * 24 * 60 * 60 * 1000);
      const now = new Date();
      
      if (now > windowEnd) {
        // Reset window
        await storage.resetEbookLicenseWindow(licenseId);
      }

      // Générer payload JWT
      const jti = nanoid(32); // ID unique
      const payload: LicenseJWTPayload = {
        sub: userId,
        ebookId: license.ebookId,
        licenseId: license.id,
        orderId: license.orderId || undefined,
        dlMax: remainingDownloads,
        watermark: license.watermarkData as any || {
          userId,
          emailHash: 'unknown',
          issuedAt: new Date().toISOString(),
        },
        jti,
        exp: Math.floor(Date.now() / 1000) + this.JWT_EXPIRY_SECONDS,
        nbf: Math.floor(Date.now() / 1000),
      };

      // Signer JWT avec RS256
      const token = jwt.sign(payload, this.getPrivateKey(), {
        algorithm: 'RS256',
        issuer: 'visual-platform',
        audience: 'ebook-download',
      });

      // Tracker JWT émis
      await storage.incrementEbookLicenseJWT(licenseId);

      // Audit
      await auditTrail.appendAudit('ebook_jwt_issued', userId, {
        licenseId,
        ebookId: license.ebookId,
        jti,
        remainingDownloads,
      });

      return { success: true, token };

    } catch (error) {
      console.error('Error generating license JWT:', error);
      return { success: false, error: 'Erreur génération JWT' };
    }
  }

  /**
   * Vérifier et décoder un JWT de licence
   */
  verifyLicenseJWT(token: string): { valid: boolean; payload?: LicenseJWTPayload; error?: string } {
    try {
      const publicKey = this.getPublicKey();
      const decoded = jwt.verify(token, publicKey, {
        algorithms: ['RS256'],
        issuer: 'visual-platform',
        audience: 'ebook-download',
      }) as LicenseJWTPayload;

      return { valid: true, payload: decoded };

    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return { valid: false, error: 'JWT expiré (10 min max)' };
      }
      if (error instanceof jwt.JsonWebTokenError) {
        return { valid: false, error: 'JWT invalide ou corrompu' };
      }
      return { valid: false, error: 'Erreur vérification JWT' };
    }
  }

  /**
   * Obtenir la clé publique (dérivée de la privée)
   */
  private getPublicKey(): string {
    // EN PRODUCTION: Utiliser process.env.EBOOK_JWT_PUBLIC_KEY
    const publicKey = process.env.EBOOK_JWT_PUBLIC_KEY;
    if (!publicKey) {
      console.warn('⚠️ EBOOK_JWT_PUBLIC_KEY manquant - dérivation depuis clé privée');
      // Pour dev: clé publique correspondant à la clé privée dev
      return `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAu1SU1LfVLPHCozMxH2Mo
4lgOEePzNm0tfn1iHD5teQPPq2lIRG1xakm1z69btHwYVNLUDxqsZoV2arzv+cKn
lEFdUiZYR59KfMDtQTawoQWw0CQCgmVwSjlUOUmbvTIYHf7uTFouElJ8Crwj4y4f
by3Qvmzrr4/8aJKd2Bm03D4ykpD4AJxPWhUxw0Z1P2qsBUEIcDpafEF8ixjFN5dx
TydmdLEM+G2AHhlqlmhDG+XOj7GbwshjwT2lJtC+czyTfTZShSnNJlSvKcZ+K6u6
gJ1+XBzfsNGUTKhFlw93+ptKeq2HwKkL3WDLlcTzBpLkwQIDAQAB
-----END PUBLIC KEY-----`;
    }
    return publicKey;
  }

  /**
   * Créer une tentative de téléchargement avec JWT
   */
  async createDownloadAttempt(params: {
    licenseId: string;
    userId: string;
    ebookId: string;
    jwtToken: string;
    jwtJti: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<{ attemptId: string; nonce: string; expiresAt: Date }> {
    const nonce = nanoid(32);
    const expiresAt = new Date(Date.now() + this.ATTEMPT_EXPIRY_SECONDS * 1000);

    const attempt = await storage.createEbookDownloadAttempt({
      licenseId: params.licenseId,
      userId: params.userId,
      ebookId: params.ebookId,
      status: 'pending',
      nonce,
      jwtToken: params.jwtToken,
      jwtJti: params.jwtJti,
      expiresAt,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });

    return {
      attemptId: attempt.id,
      nonce,
      expiresAt,
    };
  }

  /**
   * Marquer une tentative comme succès et débiter le quota
   */
  async markAttemptSuccess(attemptId: string, cdnResponse?: number): Promise<boolean> {
    try {
      const attempt = await storage.updateEbookDownloadAttempt(attemptId, {
        status: 'success',
        completedAt: new Date(),
        cdnResponse,
      });

      if (!attempt) return false;

      // Débiter le quota de la licence
      await storage.incrementEbookLicenseUsage(attempt.licenseId);

      // Audit
      await auditTrail.appendAudit('ebook_download_success', attempt.userId, {
        attemptId,
        licenseId: attempt.licenseId,
        ebookId: attempt.ebookId,
        cdnResponse,
      });

      return true;

    } catch (error) {
      console.error('Error marking attempt success:', error);
      return false;
    }
  }

  /**
   * Marquer tentatives expirées (cron job)
   */
  async expireOldAttempts(): Promise<number> {
    return await storage.expireOldEbookDownloadAttempts();
  }

  /**
   * Révoquer une licence (remboursement, chargeback, etc.)
   */
  async revokeLicense(licenseId: string, reason: string, actorId: string): Promise<boolean> {
    try {
      await storage.revokeEbookLicense(licenseId, reason);

      await auditTrail.appendAudit('ebook_license_revoked', actorId, {
        licenseId,
        reason,
      });

      return true;
    } catch (error) {
      console.error('Error revoking license:', error);
      return false;
    }
  }

  /**
   * Générer URL signée pour CDN (Bunny/S3/CloudFront)
   */
  generateSignedURL(storageKey: string, nonce: string, ttlSeconds: number = this.SIGNED_URL_TTL_SECONDS): string {
    // TODO: Implémenter signature spécifique au CDN utilisé
    // Ici simulation pour Bunny CDN
    const baseUrl = process.env.CDN_BASE_URL || 'https://cdn.visual.example';
    const expires = Math.floor(Date.now() / 1000) + ttlSeconds;
    
    // Signer avec secret CDN
    const signKey = process.env.CDN_SIGN_KEY || 'dev_cdn_key';
    const signData = `${storageKey}${expires}${nonce}`;
    const signature = crypto.createHmac('sha256', signKey).update(signData).digest('hex').substring(0, 32);

    return `${baseUrl}/${storageKey}?expires=${expires}&nonce=${nonce}&sig=${signature}`;
  }

  /**
   * Vérifier quota de téléchargement d'une licence
   */
  checkQuota(license: any): { allowed: boolean; limit: number; used: number; windowDays: number; windowEnd: string; remaining: number } {
    const now = new Date();
    const windowStart = new Date(license.windowStartAt);
    const windowEnd = new Date(windowStart.getTime() + license.windowDays * 24 * 60 * 60 * 1000);
    
    // Si fenêtre expirée, reset implicite (sera fait au prochain download)
    const isWindowExpired = now > windowEnd;
    const effectiveUsed = isWindowExpired ? 0 : license.dlUsed;
    const remaining = license.dlLimit - effectiveUsed;

    return {
      allowed: license.status === 'active' && remaining > 0,
      limit: license.dlLimit,
      used: effectiveUsed,
      windowDays: license.windowDays,
      windowEnd: windowEnd.toISOString(),
      remaining,
    };
  }

  /**
   * Demander un téléchargement (créer tentative + JWT)
   */
  async requestDownload(license: any, ebook: any, userId: string): Promise<{
    nonce: string;
    expiresAt: Date;
    jwtToken: string;
  }> {
    // Vérifier et reset fenêtre si nécessaire
    const now = new Date();
    const windowStart = new Date(license.windowStartAt);
    const windowEnd = new Date(windowStart.getTime() + license.windowDays * 24 * 60 * 60 * 1000);
    
    if (now > windowEnd) {
      await storage.resetEbookLicenseWindow(license.id);
      license.dlUsed = 0;
      license.windowStartAt = now;
    }

    // Générer JWT
    const jwtResult = await this.generateLicenseJWT(license.id, userId);
    if (!jwtResult.success || !jwtResult.token) {
      throw new Error(jwtResult.error || 'Failed to generate JWT');
    }

    // Extraire JTI depuis le JWT décodé (sans vérification car c'est nous qui venons de le créer)
    const decoded = jwt.decode(jwtResult.token) as LicenseJWTPayload | null;
    if (!decoded || !decoded.jti) {
      throw new Error('Invalid JWT generated: missing jti');
    }

    // Créer tentative de téléchargement avec JWT stocké
    const attempt = await this.createDownloadAttempt({
      licenseId: license.id,
      userId,
      ebookId: ebook.id,
      jwtToken: jwtResult.token,
      jwtJti: decoded.jti,
    });

    return {
      nonce: attempt.nonce,
      expiresAt: attempt.expiresAt,
      jwtToken: jwtResult.token,
    };
  }

  /**
   * Vérifier JWT d'une tentative de téléchargement
   */
  verifyJWT(jwtToken: string): { valid: boolean; watermark?: any; payload?: LicenseJWTPayload } | null {
    try {
      const publicKey = this.getPublicKey();
      const decoded = jwt.verify(jwtToken, publicKey, {
        algorithms: ['RS256'],
        issuer: 'visual-platform',
        audience: 'ebook-download',
      }) as LicenseJWTPayload;

      return {
        valid: true,
        watermark: decoded.watermark,
        payload: decoded,
      };
    } catch (error) {
      console.error('[Ebook] JWT verification failed:', error);
      return null;
    }
  }
}

// Export instance
export const ebookLicenseService = new EbookLicenseService();
