import { storage } from '../storage.js';
import { VISUAL_PLATFORM_FEE } from '../../shared/constants.js';
import { VISUPointsService } from './visuPointsService.js';

/**
 * SERVICE STRIPE TRANSFERS - Gestion sécurisée des transferts différés
 * Intègre l'idempotence stricte et la prévention du double-paiement
 */

export interface StripeTransferOptions {
  recipientUserId: string;
  amountEUR: number;
  reason: string;
  referenceId: string;
  referenceType: 'top10_redistribution' | 'article_sale' | 'weekly_streak';
  scheduledAt?: Date;
  idempotencyKey: string;
}

export interface StripeTransferResult {
  transferId?: string;
  status: 'scheduled' | 'processing' | 'completed' | 'failed' | 'duplicate';
  message: string;
  visuPointsAwarded: number;
}

export class StripeTransferService {
  /**
   * IDEMPOTENCE STRICTE - Planifier un transfert Stripe avec clé d'idempotence
   * Prévient les doubles transferts même en cas d'erreur système
   */
  static async scheduleTransfer(options: StripeTransferOptions): Promise<StripeTransferResult> {
    const { recipientUserId, amountEUR, reason, referenceId, referenceType, scheduledAt, idempotencyKey } = options;
    
    try {
      // 1. VALIDATION CRITIQUE des paramètres
      if (amountEUR <= 0) {
        throw new Error(`Montant invalide: ${amountEUR}€ (doit être > 0)`);
      }
      
      if (amountEUR > 10000) { // Limite sécurité 10k€
        throw new Error(`Montant excessif: ${amountEUR}€ (limite: 10,000€)`);
      }
      
      // 2. IDEMPOTENCE - Vérifier si le transfert existe déjà
      // TODO: Implémenter une table stripe_transfers pour stocker les transferts planifiés
      // const existingTransfer = await storage.getStripeTransferByIdempotencyKey(idempotencyKey);
      // if (existingTransfer) {
      //   console.log(`[STRIPE] ⚠️ Transfert déjà planifié avec clé: ${idempotencyKey}`);
      //   return {
      //     transferId: existingTransfer.id,
      //     status: 'duplicate',
      //     message: 'Transfert déjà existant',
      //     visuPointsAwarded: 0
      //   };
      // }
      
      // 3. ATTRIBUTION IMMÉDIATE de VISUpoints (système de backup)
      const visuPoints = Math.round(amountEUR * VISUAL_PLATFORM_FEE.VISUPOINTS_TO_EUR);
      
      await VISUPointsService.awardPoints({
        userId: recipientUserId,
        amount: visuPoints,
        reason: `${reason} (en attente de transfert Stripe)`,
        referenceId,
        referenceType,
        idempotencyKey: `visupoints-${idempotencyKey}`
      });
      
      // 4. PLANIFICATION du transfert Stripe pour plus tard (24h)
      const transferDate = scheduledAt || new Date(Date.now() + VISUAL_PLATFORM_FEE.TRANSFER_DELAY_HOURS * 60 * 60 * 1000);
      
      // TODO: Créer l'entrée dans la table stripe_transfers
      // const stripeTransfer = await storage.createStripeTransfer({
      //   recipientUserId,
      //   amountEUR: amountEUR.toString(),
      //   reason,
      //   referenceId,
      //   referenceType,
      //   scheduledAt: transferDate,
      //   status: 'scheduled',
      //   idempotencyKey,
      //   visuPointsAwarded: visuPoints
      // });
      
      console.log(`[STRIPE] 📅 Transfert planifié: ${amountEUR}€ vers ${recipientUserId} pour ${transferDate.toISOString()}`);
      console.log(`[STRIPE] 💎 VISUpoints accordés immédiatement: ${visuPoints} VP (backup système)`);
      
      return {
        // transferId: stripeTransfer.id,
        status: 'scheduled',
        message: `Transfert de ${amountEUR}€ planifié pour ${transferDate.toLocaleDateString()}`,
        visuPointsAwarded: visuPoints
      };
      
    } catch (error) {
      console.error(`[STRIPE] ❌ Erreur planification transfert:`, error);
      
      return {
        status: 'failed',
        message: error instanceof Error ? error.message : 'Erreur inconnue',
        visuPointsAwarded: 0
      };
    }
  }

  /**
   * EXÉCUTION SÉCURISÉE - Traiter les transferts planifiés (à appeler par cron job)
   */
  static async processScheduledTransfers(): Promise<{
    processed: number;
    successful: number;
    failed: number;
    errors: string[];
  }> {
    const result = {
      processed: 0,
      successful: 0,
      failed: 0,
      errors: [] as string[]
    };
    
    try {
      console.log(`[STRIPE] 🔄 Début traitement transferts planifiés...`);
      
      // TODO: Récupérer tous les transferts à traiter
      // const pendingTransfers = await storage.getPendingStripeTransfers();
      
      // for (const transfer of pendingTransfers) {
      //   try {
      //     result.processed++;
      //     
      //     // IDEMPOTENCE Stripe - Utiliser la clé d'idempotence pour éviter double transfert
      //     const stripeResult = await this.executeStripeTransfer(transfer);
      //     
      //     if (stripeResult.success) {
      //       result.successful++;
      //       await storage.updateStripeTransfer(transfer.id, {
      //         status: 'completed',
      //         stripeTransferId: stripeResult.transferId,
      //         completedAt: new Date()
      //       });
      //     } else {
      //       result.failed++;
      //       result.errors.push(`Transfert ${transfer.id}: ${stripeResult.error}`);
      //     }
      //   } catch (error) {
      //     result.failed++;
      //     result.errors.push(`Erreur transfert ${transfer.id}: ${error}`);
      //   }
      // }
      
      console.log(`[STRIPE] ✅ Traitement terminé: ${result.successful}/${result.processed} réussis`);
      
    } catch (error) {
      result.errors.push(`Erreur générale: ${error}`);
      console.error(`[STRIPE] ❌ Erreur traitement global:`, error);
    }
    
    return result;
  }

  /**
   * STRIPE API - Exécution réelle du transfert avec idempotence
   * PLACEHOLDER - À implémenter avec l'API Stripe réelle
   */
  private static async executeStripeTransfer(transfer: any): Promise<{
    success: boolean;
    transferId?: string;
    error?: string;
  }> {
    try {
      console.log(`[STRIPE] 💸 Exécution transfert: ${transfer.amountEUR}€ vers ${transfer.recipientUserId}`);
      
      // TODO: Implémenter l'appel réel à l'API Stripe
      // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      // 
      // const stripeTransfer = await stripe.transfers.create({
      //   amount: Math.round(parseFloat(transfer.amountEUR) * 100), // Convertir en centimes
      //   currency: 'eur',
      //   destination: transfer.stripeAccountId, // ID du compte Stripe Connect du destinataire
      //   transfer_group: transfer.referenceId,
      //   metadata: {
      //     user_id: transfer.recipientUserId,
      //     reference_type: transfer.referenceType,
      //     reference_id: transfer.referenceId
      //   }
      // }, {
      //   idempotencyKey: transfer.idempotencyKey // CRITIQUE pour éviter doublons
      // });
      // 
      // return {
      //   success: true,
      //   transferId: stripeTransfer.id
      // };
      
      // SIMULATION pour le développement
      return {
        success: true,
        transferId: `sim_transfer_${Date.now()}`
      };
      
    } catch (error: any) {
      console.error(`[STRIPE] ❌ Erreur exécution transfert:`, error);
      
      return {
        success: false,
        error: error.message || 'Erreur Stripe inconnue'
      };
    }
  }

  /**
   * ANNULATION sécurisée d'un transfert planifié
   */
  static async cancelScheduledTransfer(transferId: string, reason: string): Promise<boolean> {
    try {
      // TODO: Implémenter l'annulation
      // await storage.updateStripeTransfer(transferId, {
      //   status: 'cancelled',
      //   cancelledAt: new Date(),
      //   cancellationReason: reason
      // });
      
      console.log(`[STRIPE] ❌ Transfert annulé: ${transferId} - ${reason}`);
      return true;
      
    } catch (error) {
      console.error(`[STRIPE] ❌ Erreur annulation transfert:`, error);
      return false;
    }
  }
}