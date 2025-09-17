import { storage } from '../storage.js';
import type { VisuPointsTransaction } from '../../shared/schema.js';
import { VISU_POINTS, VISUAL_PLATFORM_FEE } from '../../shared/constants.js';

export interface AwardPointsOptions {
  userId: string;
  amount: number;
  reason: string;
  referenceId?: string;
  referenceType?: string;
  idempotencyKey?: string;
}

export class VISUPointsService {
  /**
   * Award VISUpoints to a user with full atomicity and idempotency
   */
  static async awardPoints(options: AwardPointsOptions): Promise<VisuPointsTransaction> {
    const { userId, amount, reason, referenceId, referenceType, idempotencyKey } = options;

    try {
      // VALIDATION CRITIQUE - Montants et règles de sécurité
      if (amount < 0) {
        throw new Error(`Montant VISUpoints invalide: ${amount} (doit être positif)`);
      }
      if (amount > 100000) { // Limite sécurité 100k VP = 1000€
        throw new Error(`Montant VISUpoints excessif: ${amount} VP (limite: 100,000 VP)`);
      }
      
      // Check for idempotency if key is provided
      if (idempotencyKey) {
        const existingTransaction = await storage.getVisuPointsTransactionByKey(idempotencyKey);
        if (existingTransaction) {
          console.log(`Idempotent VISUpoints award skipped for key: ${idempotencyKey}`);
          return existingTransaction;
        }
      }
      
      // Create the transaction record with idempotency key
      const transaction = await storage.createVisuPointsTransaction({
        userId,
        amount,
        reason,
        referenceId: referenceId || null,
        referenceType: referenceType || null,
        idempotencyKey: idempotencyKey || null
      });

      // TODO: Update user balance (could be done with DB triggers or separate update)
      // For now, the transactions table serves as the authoritative audit trail
      
      console.log(`VISUpoints awarded: ${amount} VP to user ${userId} for: ${reason}`);
      return transaction;
    } catch (error) {
      console.error(`Error awarding VISUpoints to user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Award referral bonus with proper idempotency
   */
  static async awardReferralBonus(
    sponsorId: string,
    refereeId: string,
    referralId: string,
    sponsorAmount: number,
    refereeAmount: number
  ): Promise<{ sponsorTransaction: VisuPointsTransaction; refereeTransaction: VisuPointsTransaction }> {
    // Use referral ID as part of idempotency keys to prevent duplicate awards
    const sponsorKey = `referral-sponsor-${referralId}`;
    const refereeKey = `referral-referee-${referralId}`;

    const sponsorTransaction = await this.awardPoints({
      userId: sponsorId,
      amount: sponsorAmount,
      reason: 'Bonus parrainage - filleul actif',
      referenceId: referralId,
      referenceType: 'referral',
      idempotencyKey: sponsorKey
    });

    const refereeTransaction = await this.awardPoints({
      userId: refereeId,
      amount: refereeAmount,
      reason: 'Bonus d\'accueil - parrainage',
      referenceId: referralId,
      referenceType: 'referral',
      idempotencyKey: refereeKey
    });

    return { sponsorTransaction, refereeTransaction };
  }

  /**
   * Award streak bonus with daily idempotency
   */
  static async awardStreakBonus(
    userId: string,
    amount: number,
    streakDays: number,
    streakId: string,
    date: string = new Date().toISOString().split('T')[0]
  ): Promise<VisuPointsTransaction> {
    // Daily idempotency: one award per user per day
    const idempotencyKey = `streak-${userId}-${date}`;
    
    const reason = streakDays === 1 
      ? 'Connexion quotidienne'
      : `Streak de ${streakDays} jours consécutifs`;

    return this.awardPoints({
      userId,
      amount,
      reason,
      referenceId: streakId,
      referenceType: 'login_streak',
      idempotencyKey
    });
  }

  /**
   * Award activity points for visitor tracking
   */
  static async awardActivityPoints(
    userId: string,
    amount: number,
    activityType: string,
    activityId: string
  ): Promise<VisuPointsTransaction> {
    return this.awardPoints({
      userId,
      amount,
      reason: `Activité: ${activityType}`,
      referenceId: activityId,
      referenceType: 'visitor_activity'
    });
  }

  /**
   * NOUVEAU - Validation des règles de conversion VISUpoints
   * Vérifie la cohérence avec les constantes système
   */
  static validateConversionRules(): {
    conversionRate: number;
    threshold: number;
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    // Vérifier la cohérence entre constantes
    if (VISU_POINTS.conversionRate !== VISUAL_PLATFORM_FEE.VISUPOINTS_TO_EUR) {
      errors.push(`Incohérence taux de conversion: VISU_POINTS.conversionRate (${VISU_POINTS.conversionRate}) != VISUAL_PLATFORM_FEE.VISUPOINTS_TO_EUR (${VISUAL_PLATFORM_FEE.VISUPOINTS_TO_EUR})`);
    }
    
    if (VISU_POINTS.conversionThreshold !== VISUAL_PLATFORM_FEE.VISUPOINTS_CONVERSION_THRESHOLD) {
      errors.push(`Incohérence seuil conversion: VISU_POINTS.conversionThreshold (${VISU_POINTS.conversionThreshold}) != VISUAL_PLATFORM_FEE.VISUPOINTS_CONVERSION_THRESHOLD (${VISUAL_PLATFORM_FEE.VISUPOINTS_CONVERSION_THRESHOLD})`);
    }
    
    // Validations logiques
    if (VISU_POINTS.conversionRate <= 0) {
      errors.push(`Taux de conversion invalide: ${VISU_POINTS.conversionRate} (doit être > 0)`);
    }
    
    if (VISU_POINTS.conversionThreshold <= 0) {
      errors.push(`Seuil de conversion invalide: ${VISU_POINTS.conversionThreshold} (doit être > 0)`);
    }
    
    return {
      conversionRate: VISU_POINTS.conversionRate,
      threshold: VISU_POINTS.conversionThreshold,
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * NOUVEAU - Calcule la valeur EUR des VISUpoints selon les règles officielles
   */
  static convertVPToEUR(visuPoints: number): { 
    euros: number; 
    canConvert: boolean; 
    remainingVP: number;
    thresholdMet: boolean;
  } {
    const validation = this.validateConversionRules();
    if (!validation.isValid) {
      throw new Error(`Règles de conversion invalides: ${validation.errors.join(', ')}`);
    }
    
    const thresholdMet = visuPoints >= VISU_POINTS.conversionThreshold;
    const convertibleVP = thresholdMet ? visuPoints : 0;
    const euros = Math.floor(convertibleVP / VISU_POINTS.conversionRate * 100) / 100; // Arrondir à 2 décimales
    
    return {
      euros,
      canConvert: thresholdMet && euros > 0,
      remainingVP: thresholdMet ? 0 : visuPoints, // Si on peut convertir, tout est converti
      thresholdMet
    };
  }

  /**
   * Award monthly visitor winner bonus
   */
  static async awardVisitorOfMonthBonus(
    userId: string,
    monthYear: string,
    amount: number = 2500
  ): Promise<VisuPointsTransaction> {
    const idempotencyKey = `visitor-of-month-${monthYear}-${userId}`;
    
    return this.awardPoints({
      userId,
      amount,
      reason: `Visiteur du mois - ${monthYear}`,
      referenceId: monthYear,
      referenceType: 'visitor_of_month',
      idempotencyKey
    });
  }

  /**
   * Get user's total VISUpoints balance
   */
  static async getUserBalance(userId: string): Promise<number> {
    return storage.getUserVisuPointsBalance(userId);
  }

  /**
   * Get user's VISUpoints transaction history
   */
  static async getUserTransactionHistory(userId: string, limit: number = 50): Promise<VisuPointsTransaction[]> {
    return storage.getUserVisuPointsHistory(userId, limit);
  }
}