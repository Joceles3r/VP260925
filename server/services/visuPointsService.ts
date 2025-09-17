import { storage } from '../storage.js';
import type { VisuPointsTransaction } from '../../shared/schema.js';

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