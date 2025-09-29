import { storage } from '../storage';
import { auditTrail } from './auditTrail';
import { TwoFAService } from './twofa';
import crypto from 'crypto';
import { nanoid } from 'nanoid';

export interface AdminAccessRequest {
  email: string;
  otpCode?: string;
  totpCode?: string;
  backupCode?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AdminAccessResult {
  success: boolean;
  userId?: string;
  requiresTwoFA?: boolean;
  error?: string;
  accessGranted?: boolean;
}

export interface BreakGlassOtpResult {
  success: boolean;
  otpCode?: string;
  expiresAt?: Date;
  error?: string;
}

/**
 * Service d'accès admin sécurisé avec système "break-glass"
 * Implémente la sécurité recommandée sans backdoors
 */
export class AdminAccessService {
  
  private readonly OTP_EXPIRY_MINUTES = 10; // OTP expire en 10 minutes
  private readonly MAX_ATTEMPTS_PER_HOUR = 3; // Max 3 tentatives par heure
  private readonly ADMIN_EMAILS = process.env.ADMIN_EMAILS?.split(',') || ['visual@replit.com']; // Emails admin autorisés
  private readonly twoFAService = new TwoFAService(); // Instance du service 2FA
  
  /**
   * Générer un OTP temporaire d'accès admin (break-glass)
   * Usage: Accès d'urgence quand 2FA indisponible
   */
  async generateBreakGlassOtp(adminEmail: string): Promise<BreakGlassOtpResult> {
    try {
      // Vérifier que l'email est autorisé
      if (!this.ADMIN_EMAILS.includes(adminEmail)) {
        await auditTrail.appendAudit('admin_access_denied', 'system', {
          email: adminEmail,
          reason: 'email_not_authorized'
        });
        return { success: false, error: 'Email non autorisé pour accès admin' };
      }

      // Nettoyer les anciens OTPs
      await storage.expireOldAdminOtps();

      // Générer un OTP sécurisé de 32 caractères
      const otpCode = nanoid(32);
      const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000);

      // Hasher l'OTP avant stockage (sécurité)
      const otpHash = crypto.createHash('sha256').update(otpCode).digest('hex');

      // Sauvegarder l'OTP hashé
      await storage.createAdminBreakGlassOtp({
        otpCode: otpHash, // Stocker le hash, pas le plaintext
        email: adminEmail,
        expiresAt,
        status: 'active'
      });

      // Audit trail
      await auditTrail.appendAudit('admin_break_glass_otp_generated', 'system', {
        email: adminEmail,
        expiresAt: expiresAt.toISOString(),
        otpLength: otpCode.length
      });

      console.log(`🚨 ADMIN BREAK-GLASS OTP GÉNÉRÉ 🚨`);
      console.log(`Email: ${adminEmail}`);
      console.log(`OTP: ${otpCode}`);
      console.log(`Expire: ${expiresAt.toISOString()}`);
      console.log(`Durée: ${this.OTP_EXPIRY_MINUTES} minutes`);

      return {
        success: true,
        otpCode,
        expiresAt
      };

    } catch (error) {
      console.error('Erreur génération OTP admin:', error);
      return { success: false, error: 'Erreur lors de la génération de l\'OTP' };
    }
  }

  /**
   * Authentifier un admin avec OTP temporaire + 2FA optionnel
   */
  async authenticateAdmin(request: AdminAccessRequest): Promise<AdminAccessResult> {
    try {
      const { email, otpCode, totpCode, backupCode, ipAddress, userAgent } = request;

      // Si OTP fourni, valider l'accès break-glass
      if (otpCode) {
        return await this.validateBreakGlassAccess(otpCode, email, ipAddress, userAgent);
      }

      // Sinon, authentification 2FA standard
      if (totpCode || backupCode) {
        return await this.validate2FAAccess(email, totpCode, backupCode, ipAddress, userAgent);
      }

      return { 
        success: false, 
        error: 'OTP temporaire ou code 2FA requis pour accès admin' 
      };

    } catch (error) {
      console.error('Erreur authentification admin:', error);
      await auditTrail.appendAudit('admin_auth_error', 'system', {
        email: request.email,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        ipAddress: request.ipAddress
      });
      return { success: false, error: 'Erreur lors de l\'authentification' };
    }
  }

  /**
   * Valider accès avec OTP temporaire (break-glass)
   */
  private async validateBreakGlassAccess(
    otpCode: string, 
    email: string, 
    ipAddress?: string, 
    userAgent?: string
  ): Promise<AdminAccessResult> {
    // Hasher l'OTP fourni pour comparaison sécurisée
    const otpHash = crypto.createHash('sha256').update(otpCode).digest('hex');
    
    // Récupérer l'OTP actif par hash
    const otp = await storage.getActiveAdminOtp(otpHash);
    
    if (!otp) {
      await auditTrail.appendAudit('admin_break_glass_failed', 'system', {
        email,
        reason: 'invalid_or_expired_otp',
        ipAddress
      });
      return { success: false, error: 'OTP invalide ou expiré' };
    }

    // Vérifier que l'email correspond
    if (otp.email !== email) {
      await auditTrail.appendAudit('admin_break_glass_failed', 'system', {
        email,
        reason: 'email_mismatch',
        ipAddress
      });
      return { success: false, error: 'Email ne correspond pas à l\'OTP' };
    }

    // Récupérer l'utilisateur admin
    const users = await storage.getAllUsers();
    const adminUser = users.find(u => u.email === email && u.profileType === 'admin');
    
    if (!adminUser) {
      await auditTrail.appendAudit('admin_break_glass_failed', 'system', {
        email,
        reason: 'user_not_admin',
        ipAddress
      });
      return { success: false, error: 'Utilisateur admin introuvable' };
    }

    // Marquer l'OTP comme utilisé (utiliser le hash)
    await storage.useAdminBreakGlassOtp(otpHash, adminUser.id, ipAddress, userAgent);

    // Audit trail succès
    await auditTrail.appendAudit('admin_break_glass_success', adminUser.id, {
      email,
      ipAddress,
      userAgent,
      otpId: otp.id
    });

    return {
      success: true,
      userId: adminUser.id,
      accessGranted: true
    };
  }

  /**
   * Valider accès avec 2FA standard
   */
  private async validate2FAAccess(
    email: string,
    totpCode?: string,
    backupCode?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AdminAccessResult> {
    // Récupérer l'utilisateur admin
    const users = await storage.getAllUsers();
    const adminUser = users.find(u => u.email === email && u.profileType === 'admin');
    
    if (!adminUser) {
      await auditTrail.appendAudit('admin_2fa_failed', 'system', {
        email,
        reason: 'user_not_admin',
        ipAddress
      });
      return { success: false, error: 'Utilisateur admin introuvable' };
    }

    // Vérifier 2FA
    let twoFAResult;
    if (totpCode) {
      twoFAResult = await this.twoFAService.verifyTOTP(adminUser.id, totpCode);
    } else if (backupCode) {
      twoFAResult = await this.twoFAService.verifyBackupCode(adminUser.id, backupCode);
    } else {
      return { success: false, error: 'Code TOTP ou backup requis' };
    }

    if (!twoFAResult.success) {
      await auditTrail.appendAudit('admin_2fa_failed', adminUser.id, {
        email,
        reason: '2fa_verification_failed',
        ipAddress,
        method: totpCode ? 'totp' : 'backup'
      });
      return { success: false, error: 'Code 2FA invalide' };
    }

    // Audit trail succès
    await auditTrail.appendAudit('admin_2fa_success', adminUser.id, {
      email,
      ipAddress,
      userAgent,
      method: totpCode ? 'totp' : 'backup'
    });

    return {
      success: true,
      userId: adminUser.id,
      accessGranted: true
    };
  }

  /**
   * Obtenir l'historique des accès admin
   */
  async getAccessHistory(limit: number = 100): Promise<any[]> {
    return await storage.getAdminOtpHistory(limit);
  }

  /**
   * Vérifier si un utilisateur est admin
   */
  async isAdmin(userId: string): Promise<boolean> {
    const user = await storage.getUser(userId);
    return user?.profileType === 'admin';
  }

  /**
   * Rate limiting pour tentatives d'accès admin
   */
  private rateLimitKey(ipAddress: string): string {
    return `admin_attempts_${ipAddress}`;
  }
}

// Instance singleton
export const adminAccessService = new AdminAccessService();