import { storage } from '../storage.js';
import { db } from '../db.js';
import Stripe from 'stripe';
import { stripeTransfers } from '../../shared/schema.js';
import { eq, and, lte, sql } from 'drizzle-orm';
import type { StripeTransfer, InsertStripeTransfer } from '../../shared/schema.js';
import { VISUAL_PLATFORM_FEE } from '../../shared/constants.js';

// Lazy-init Stripe to avoid unsafe module-level initialization
let stripeInstance: Stripe | null = null;

function getStripeInstance(): Stripe {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required for financial transfers');
    }
    
    stripeInstance = new Stripe(secretKey, {
      apiVersion: "2025-08-27.basil", // Use required API version
    });
  }
  return stripeInstance;
}

export interface ScheduleTransferOptions {
  userId: string;
  amountCents: number;
  referenceType: string;
  referenceId: string;
  description: string;
  delayHours?: number;
  metadata?: Record<string, any>;
}

export class StripeTransferService {
  /**
   * PLANIFIER UN TRANSFERT STRIPE avec idempotence complète
   * Garantit qu'aucun transfert en double ne sera créé
   */
  static async scheduleTransfer(options: ScheduleTransferOptions): Promise<StripeTransfer> {
    const {
      userId,
      amountCents,
      referenceType,
      referenceId,
      description,
      delayHours = VISUAL_PLATFORM_FEE.TRANSFER_DELAY_HOURS,
      metadata = {}
    } = options;

    // Valider les paramètres
    if (amountCents <= 0) {
      throw new Error(`Montant invalide: ${amountCents} centimes (doit être positif)`);
    }
    if (amountCents > 100000) { // Limite sécurité 1000€
      throw new Error(`Montant excessif: ${amountCents} centimes (limite: 100,000 centimes = 1000€)`);
    }

    // Générer clé d'idempotence unique basée sur la référence
    const idempotencyKey = `${referenceType}_${referenceId}_${userId}`;

    // Vérifier l'idempotence - transfert déjà existant ?
    const existingTransfer = await this.getTransferByIdempotencyKey(idempotencyKey);
    if (existingTransfer) {
      console.log(`[STRIPE] ⚠️ Transfert déjà programmé avec clé ${idempotencyKey}: ${existingTransfer.id}`);
      return existingTransfer;
    }

    // Calculer timestamp de traitement (délai 24h par défaut)
    const scheduledProcessingAt = new Date();
    scheduledProcessingAt.setHours(scheduledProcessingAt.getHours() + delayHours);

    // Créer l'enregistrement de transfert
    const transferData: InsertStripeTransfer = {
      idempotencyKey,
      status: 'scheduled',
      amountCents,
      amountEUR: (amountCents / 100).toFixed(2),
      userId,
      referenceType,
      referenceId,
      scheduledProcessingAt,
      transferDescription: description,
      metadata: {
        ...metadata,
        scheduledDelayHours: delayHours,
        originalAmountCents: amountCents
      }
    };

    const newTransfer = await storage.createStripeTransfer(transferData);
    console.log(`[STRIPE] 📅 Transfert programmé: ${amountCents} centimes pour ${userId} dans ${delayHours}h (${newTransfer.id})`);
    
    return newTransfer;
  }

  /**
   * TRAITER LES TRANSFERTS PROGRAMMÉS - appelé par cron job
   * Traite tous les transferts dont l'heure de traitement est arrivée
   */
  static async processScheduledTransfers(): Promise<{ processed: number; failed: number }> {
    console.log(`[STRIPE] 🔄 Démarrage du traitement des transferts programmés...`);

    // Récupérer tous les transferts prêts à être traités
    const readyTransfers = await this.getReadyTransfers();
    console.log(`[STRIPE] 📋 ${readyTransfers.length} transferts prêts à être traités`);

    let processed = 0;
    let failed = 0;

    for (const transfer of readyTransfers) {
      try {
        await this.processIndividualTransfer(transfer);
        processed++;
        console.log(`[STRIPE] ✅ Transfert traité avec succès: ${transfer.id}`);
      } catch (error) {
        failed++;
        console.error(`[STRIPE] ❌ Échec traitement transfert ${transfer.id}:`, error);
        await this.handleTransferFailure(transfer, error as Error);
      }
    }

    console.log(`[STRIPE] 📊 Traitement terminé: ${processed} réussis, ${failed} échecs`);
    return { processed, failed };
  }

  /**
   * TRAITER UN TRANSFERT INDIVIDUEL vers Stripe
   * Avec gestion complète des erreurs et nouvelles tentatives
   */
  private static async processIndividualTransfer(transfer: StripeTransfer): Promise<void> {
    console.log(`[STRIPE] 🚀 Traitement transfert ${transfer.id}: ${transfer.amountCents} centimes vers ${transfer.userId}`);

    // Marquer comme en cours de traitement
    await this.updateTransferStatus(transfer.id, 'processing');

    try {
      const stripe = getStripeInstance();

      // Récupérer le compte Stripe Connect de l'utilisateur
      const userStripeAccount = await this.getUserStripeAccount(transfer.userId);
      if (!userStripeAccount) {
        throw new Error(`Utilisateur ${transfer.userId} n'a pas de compte Stripe Connect configuré`);
      }

      // Créer le transfert Stripe avec idempotence native de Stripe
      const stripeTransfer = await stripe.transfers.create({
        amount: transfer.amountCents,
        currency: 'eur',
        destination: userStripeAccount,
        description: transfer.transferDescription || `Transfert VISUAL ${transfer.referenceType}`,
        metadata: {
          visual_transfer_id: transfer.id,
          visual_reference_type: transfer.referenceType,
          visual_reference_id: transfer.referenceId,
          visual_user_id: transfer.userId
        }
      }, {
        idempotencyKey: transfer.idempotencyKey // Idempotence native Stripe
      });

      // Mettre à jour avec les informations Stripe
      const destinationPayment = typeof stripeTransfer.destination_payment === 'string' 
        ? stripeTransfer.destination_payment 
        : stripeTransfer.destination_payment?.id || '';
      await this.updateTransferCompleted(transfer.id, stripeTransfer.id, destinationPayment);

      console.log(`[STRIPE] 🎉 Transfert Stripe créé avec succès: ${stripeTransfer.id}`);

    } catch (error: any) {
      // Relancer l'erreur pour gestion par le processus appelant
      throw new Error(`Erreur transfert Stripe: ${error.message}`);
    }
  }

  /**
   * GESTION DES ÉCHECS avec nouvelles tentatives automatiques
   */
  private static async handleTransferFailure(transfer: StripeTransfer, error: Error): Promise<void> {
    const maxRetries = 3;
    const retryCount = (transfer.retryCount || 0) + 1;

    if (retryCount <= maxRetries) {
      // Programmer une nouvelle tentative (délai exponentiel)
      const retryDelayMinutes = Math.pow(2, retryCount - 1) * 30; // 30min, 1h, 2h
      const nextRetryAt = new Date();
      nextRetryAt.setMinutes(nextRetryAt.getMinutes() + retryDelayMinutes);

      await this.updateTransferForRetry(transfer.id, retryCount, nextRetryAt, error.message);
      console.log(`[STRIPE] 🔄 Nouvelle tentative programmée pour ${transfer.id} dans ${retryDelayMinutes} minutes (tentative ${retryCount}/${maxRetries})`);
    } else {
      // Échec définitif après 3 tentatives
      await this.updateTransferStatus(transfer.id, 'failed', error.message);
      console.error(`[STRIPE] 💀 Transfert ${transfer.id} définitivement échoué après ${maxRetries} tentatives: ${error.message}`);
    }
  }

  /**
   * MÉTHODES UTILITAIRES pour les opérations de base de données
   */
  private static async getTransferByIdempotencyKey(idempotencyKey: string): Promise<StripeTransfer | null> {
    try {
      const result = await db
        .select()
        .from(stripeTransfers)
        .where(eq(stripeTransfers.idempotencyKey, idempotencyKey))
        .limit(1);
      
      return result[0] || null;
    } catch (error) {
      console.error(`[STRIPE] Erreur récupération transfert par clé ${idempotencyKey}:`, error);
      return null;
    }
  }

  private static async getReadyTransfers(): Promise<StripeTransfer[]> {
    try {
      const now = new Date();
      
      const result = await db
        .select()
        .from(stripeTransfers)
        .where(
          and(
            eq(stripeTransfers.status, 'scheduled'),
            lte(stripeTransfers.scheduledProcessingAt, now)
          )
        )
        .orderBy(stripeTransfers.scheduledProcessingAt);
      
      return result;
    } catch (error) {
      console.error(`[STRIPE] Erreur récupération transferts prêts:`, error);
      return [];
    }
  }

  private static async updateTransferStatus(
    transferId: string, 
    status: 'scheduled' | 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled',
    failureReason?: string
  ): Promise<void> {
    try {
      await db
        .update(stripeTransfers)
        .set({
          status,
          failureReason: failureReason || null,
          updatedAt: new Date()
        })
        .where(eq(stripeTransfers.id, transferId));
    } catch (error) {
      console.error(`[STRIPE] Erreur mise à jour statut transfert ${transferId}:`, error);
      throw error;
    }
  }

  private static async updateTransferCompleted(
    transferId: string,
    stripeTransferId: string,
    stripeDestinationPaymentId: string
  ): Promise<void> {
    try {
      await db
        .update(stripeTransfers)
        .set({
          status: 'completed',
          stripeTransferId,
          stripeDestinationPaymentId,
          processedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(stripeTransfers.id, transferId));
    } catch (error) {
      console.error(`[STRIPE] Erreur finalisation transfert ${transferId}:`, error);
      throw error;
    }
  }

  private static async updateTransferForRetry(
    transferId: string,
    retryCount: number,
    nextRetryAt: Date,
    failureReason: string
  ): Promise<void> {
    try {
      await db
        .update(stripeTransfers)
        .set({
          status: 'scheduled', // Repasser en scheduled pour nouvelle tentative
          retryCount,
          nextRetryAt,
          failureReason,
          scheduledProcessingAt: nextRetryAt, // Reprogrammer à l'heure de nouvelle tentative
          updatedAt: new Date()
        })
        .where(eq(stripeTransfers.id, transferId));
    } catch (error) {
      console.error(`[STRIPE] Erreur programmation nouvelle tentative ${transferId}:`, error);
      throw error;
    }
  }

  /**
   * RÉCUPÉRER LE COMPTE STRIPE CONNECT d'un utilisateur
   * TODO: Implémenter selon votre logique Stripe Connect
   */
  private static async getUserStripeAccount(userId: string): Promise<string | null> {
    // TODO: Récupérer depuis votre table users ou stripe_accounts
    // Pour l'instant, simuler un compte de test
    console.log(`[STRIPE] 🔍 Recherche compte Stripe Connect pour utilisateur ${userId}`);
    
    // PLACEHOLDER - Remplacer par votre logique réelle
    // return user.stripeConnectAccountId;
    
    // En développement, utiliser un compte de test fictif
    if (process.env.NODE_ENV === 'development') {
      return 'acct_test_account'; // Compte de test Stripe
    }
    
    throw new Error(`Compte Stripe Connect non trouvé pour utilisateur ${userId} - intégration Stripe Connect requise`);
  }

  /**
   * MÉTHODES PUBLIQUES pour intégration avec d'autres services
   */

  /**
   * Planifier un transfert TOP10 avec idempotence
   */
  static async scheduleTop10Transfer(
    userId: string,
    amountCents: number,
    referenceType: 'top10_infoporteur' | 'top10_winner',
    referenceId: string,
    rank?: number
  ): Promise<StripeTransfer> {
    const description = referenceType === 'top10_infoporteur' 
      ? `Redistribution TOP10 - Rang ${rank || 'N/A'}`
      : `Redistribution TOP10 - Investi-lecteur`;

    return this.scheduleTransfer({
      userId,
      amountCents,
      referenceType,
      referenceId,
      description,
      metadata: {
        top10_rank: rank,
        transfer_type: 'top10_redistribution'
      }
    });
  }

  /**
   * Planifier un transfert de conversion VISUpoints
   */
  static async scheduleVisuPointsTransfer(
    userId: string,
    amountCents: number,
    visuPointsAmount: number,
    referenceId: string
  ): Promise<StripeTransfer> {
    return this.scheduleTransfer({
      userId,
      amountCents,
      referenceType: 'visupoints_conversion',
      referenceId,
      description: `Conversion VISUpoints vers EUR (${visuPointsAmount} VP)`,
      metadata: {
        visupoints_amount: visuPointsAmount,
        conversion_rate: VISUAL_PLATFORM_FEE.VISUPOINTS_TO_EUR,
        transfer_type: 'visupoints_conversion'
      }
    });
  }

  /**
   * Obtenir le statut d'un transfert
   */
  static async getTransferStatus(transferId: string): Promise<StripeTransfer | null> {
    try {
      const result = await db
        .select()
        .from(stripeTransfers)
        .where(eq(stripeTransfers.id, transferId))
        .limit(1);
      
      return result[0] || null;
    } catch (error) {
      console.error(`[STRIPE] Erreur récupération transfert ${transferId}:`, error);
      return null;
    }
  }

  /**
   * Obtenir tous les transferts d'un utilisateur
   */
  static async getUserTransfers(userId: string): Promise<StripeTransfer[]> {
    try {
      const result = await db
        .select()
        .from(stripeTransfers)
        .where(eq(stripeTransfers.userId, userId))
        .orderBy(sql`${stripeTransfers.createdAt} DESC`);
      
      return result;
    } catch (error) {
      console.error(`[STRIPE] Erreur récupération transferts utilisateur ${userId}:`, error);
      return [];
    }
  }
}