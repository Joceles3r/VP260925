/**
 * Service 2FA TOTP avec codes de secours
 * Path: server/services/twofa.ts
 * Basé sur pyotp, adapté pour Node.js avec otplib
 */

import { authenticator } from 'otplib';
import crypto from 'crypto';
import { storage } from '../storage';
import type { InsertUser2FA, User2FA } from '@shared/schema';

export interface TwoFASetupResult {
  otpauthUrl: string;
  secretBase32: string;
  backupCodes: string[];
}

export interface TwoFAVerifyResult {
  success: boolean;
  method: 'totp' | 'backup_code';
}

export class TwoFAService {
  private readonly issuer: string;

  constructor() {
    this.issuer = process.env.VISUAL_ISSUER || 'VISUAL Platform';
    // Configuration otplib pour compatibilité avec Google Authenticator
    authenticator.options = {
      window: 1, // Accepte 1 période avant/après (30s chacune)
      step: 30,   // 30 secondes par période
    };
  }

  /**
   * Active 2FA pour un utilisateur avec génération de secret et codes de secours
   */
  async enableTwoFA(userId: string, userEmail: string): Promise<TwoFASetupResult> {
    try {
      // Générer un secret sécurisé
      const secret = authenticator.generateSecret();
      
      // Créer l'URL otpauth pour QR code
      const otpauthUrl = authenticator.keyuri(userEmail, this.issuer, secret);
      
      // Générer 10 codes de secours uniques
      const backupCodes = this.generateBackupCodes();
      
      // Hacher les codes de secours pour stockage sécurisé
      const hashedBackupCodes = backupCodes.map(code => this.hashBackupCode(code));
      
      // Sauvegarder en base de données
      const user2FA: InsertUser2FA = {
        userId,
        totpSecret: secret,
        backupCodes: hashedBackupCodes,
        status: 'enabled',
      };
      
      await storage.upsertUser2FA(user2FA);
      
      return {
        otpauthUrl,
        secretBase32: secret,
        backupCodes, // Retourner les codes en clair pour affichage unique
      };
    } catch (error) {
      console.error('Erreur activation 2FA:', error);
      throw new Error('Impossible d\'activer l\'authentification 2FA');
    }
  }

  /**
   * Vérifie un code 2FA (TOTP ou code de secours)
   */
  async verifyTwoFA(userId: string, code: string): Promise<TwoFAVerifyResult> {
    try {
      const user2FA = await storage.getUser2FA(userId);
      
      if (!user2FA || user2FA.status !== 'enabled') {
        throw new Error('2FA non activé pour cet utilisateur');
      }

      // D'abord, essayer la vérification TOTP
      const isValidTOTP = authenticator.verify({
        token: code,
        secret: user2FA.totpSecret,
      });

      if (isValidTOTP) {
        // Mettre à jour la dernière utilisation
        await storage.updateUser2FALastUsed(userId);
        return { success: true, method: 'totp' };
      }

      // Si TOTP échoue, essayer les codes de secours
      const hashedCode = this.hashBackupCode(code);
      const backupCodeIndex = user2FA.backupCodes.indexOf(hashedCode);
      
      if (backupCodeIndex !== -1) {
        // Code de secours valide, le supprimer de la liste
        const updatedBackupCodes = user2FA.backupCodes.filter((_: string, index: number) => index !== backupCodeIndex);
        
        // Mettre à jour les codes de secours et dernière utilisation
        await storage.updateUser2FABackupCodes(userId, updatedBackupCodes);
        await storage.updateUser2FALastUsed(userId);
        
        return { success: true, method: 'backup_code' };
      }

      return { success: false, method: 'totp' };
    } catch (error) {
      console.error('Erreur vérification 2FA:', error);
      return { success: false, method: 'totp' };
    }
  }

  /**
   * Désactive 2FA pour un utilisateur
   */
  async disableTwoFA(userId: string): Promise<boolean> {
    try {
      const user2FA = await storage.getUser2FA(userId);
      
      if (!user2FA) {
        return true; // Déjà désactivé
      }

      // Désactiver 2FA
      if (user2FA) {
        await storage.updateUser2FAStatus(userId, 'disabled');
      }
      return true;
    } catch (error) {
      console.error('Erreur désactivation 2FA:', error);
      return false;
    }
  }

  /**
   * Vérifie si 2FA est activé pour un utilisateur
   */
  async isTwoFAEnabled(userId: string): Promise<boolean> {
    try {
      const user2FA = await storage.getUser2FA(userId);
      return user2FA?.status === 'enabled';
    } catch (error) {
      console.error('Erreur vérification statut 2FA:', error);
      return false;
    }
  }

  /**
   * Génère des codes de secours sécurisés
   */
  private generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    
    for (let i = 0; i < count; i++) {
      // Générer code 8 caractères alphanumériques
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      // Format: XXXX-XXXX pour lisibilité
      const formattedCode = `${code.slice(0, 4)}-${code.slice(4, 8)}`;
      codes.push(formattedCode);
    }
    
    return codes;
  }

  /**
   * Hache un code de secours pour stockage sécurisé
   */
  private hashBackupCode(code: string): string {
    return crypto.createHash('sha256').update(code).digest('hex');
  }

  /**
   * Génère des nouveaux codes de secours si nécessaire
   */
  async regenerateBackupCodes(userId: string): Promise<string[]> {
    try {
      const user2FA = await storage.getUser2FA(userId);
      
      if (!user2FA || user2FA.status !== 'enabled') {
        throw new Error('2FA non activé');
      }

      const newCodes = this.generateBackupCodes();
      const hashedCodes = newCodes.map(code => this.hashBackupCode(code));
      
      // Mettre à jour les nouveaux codes de secours
      await storage.updateUser2FABackupCodes(userId, hashedCodes);
      
      return newCodes;
    } catch (error) {
      console.error('Erreur régénération codes de secours:', error);
      throw new Error('Impossible de régénérer les codes de secours');
    }
  }
}