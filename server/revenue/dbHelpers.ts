/**
 * Database Helpers pour Revenue Engine
 * Gestion idempotence Stripe et persistence payout plans
 */

import { db } from "../db";
import { 
  stripeEvents, 
  financialLedger,
  type InsertStripeEvents,
  type InsertFinancialLedger
} from "@shared/schema";
import { eq, and } from "drizzle-orm";
import type { SplitItem } from "./revenueEngine";

/**
 * Vérifie si un événement Stripe a déjà été traité (idempotence)
 * 
 * @param eventId - ID de l'événement Stripe
 * @returns true si déjà traité
 */
export async function isStripeEventProcessed(eventId: string): Promise<boolean> {
  try {
    const existing = await db
      .select()
      .from(stripeEvents)
      .where(eq(stripeEvents.id, eventId))
      .limit(1);
    
    return existing.length > 0;
  } catch (error) {
    console.error('Error checking stripe event:', error);
    return false;
  }
}

/**
 * Enregistre un événement Stripe dans la base (marque comme traité)
 * 
 * @param eventId - ID de l'événement
 * @param type - Type d'événement Stripe
 * @param rawData - Données brutes de l'événement
 */
export async function recordStripeEvent(
  eventId: string,
  type: string,
  rawData: any
): Promise<void> {
  try {
    // Mapping des types Stripe vers notre enum
    const eventTypeMap: Record<string, any> = {
      'checkout.session.completed': 'checkout_session_completed',
      'payment_intent.succeeded': 'payment_intent_succeeded',
      'payment_intent.payment_failed': 'payment_intent_failed',
      'charge.refunded': 'charge_refunded',
      'transfer.created': 'transfer_created',
      'transfer.failed': 'transfer_failed',
      'payout.paid': 'payout_paid',
      'payout.failed': 'payout_failed'
    };
    
    const mappedType = eventTypeMap[type] || 'checkout_session_completed';
    
    const eventData: InsertStripeEvents = {
      id: eventId,
      type: mappedType,
      data: rawData,
      processed: true
    };
    
    await db.insert(stripeEvents).values(eventData).onConflictDoNothing();
  } catch (error) {
    console.error('Error recording stripe event:', error);
    throw error;
  }
}

/**
 * Persiste un plan de paiement (payout plan) dans le ledger financier
 * 
 * @param sourceEventId - ID de l'événement Stripe source
 * @param eventType - Type d'événement (article_sale, category_closure)
 * @param plan - Plan de répartition calculé
 * @param rawEvent - Données brutes de l'événement
 */
export async function persistPayoutPlan(
  sourceEventId: string,
  eventType: 'article_sale' | 'category_closure' | 'visupoints_conversion',
  plan: SplitItem[],
  rawEvent: any
): Promise<void> {
  try {
    const ledgerEntries: InsertFinancialLedger[] = plan.map((item) => ({
      transactionType: eventType === 'article_sale' ? 'payout' : 'payout',
      referenceId: sourceEventId,
      referenceType: eventType,
      recipientId: item.accountId === 'acc_visual' ? null : item.accountId, // null pour VISUAL
      grossAmountCents: item.amountCents,
      netAmountCents: item.amountCents, // Pas de fees pour l'instant
      feeCents: 0,
      stripePaymentIntentId: rawEvent?.data?.object?.payment_intent || rawEvent?.data?.object?.id,
      idempotencyKey: `${sourceEventId}_${item.accountId}_${item.role}`,
      payoutRule: eventType === 'article_sale' ? '70_30_v1' : '40_30_7_23_v1',
      signature: null, // TODO: Implémenter signature cryptographique
      status: 'pending'
    }));
    
    // Insertion batch avec gestion des conflits
    for (const entry of ledgerEntries) {
      await db.insert(financialLedger).values(entry).onConflictDoNothing();
    }
    
    console.log(`✅ Payout plan persisted: ${plan.length} entries for event ${sourceEventId}`);
  } catch (error) {
    console.error('Error persisting payout plan:', error);
    throw error;
  }
}

/**
 * Récupère les plans de paiement en attente de traitement
 * 
 * @param limit - Nombre maximum d'entrées à récupérer
 * @returns Liste des entrées du ledger en statut 'pending'
 */
export async function getPendingPayouts(limit: number = 100) {
  try {
    return await db
      .select()
      .from(financialLedger)
      .where(eq(financialLedger.status, 'pending'))
      .limit(limit);
  } catch (error) {
    console.error('Error fetching pending payouts:', error);
    return [];
  }
}

/**
 * Marque un payout comme complété
 * 
 * @param ledgerId - ID de l'entrée dans le ledger
 * @param stripeTransferId - ID du transfert Stripe
 */
export async function markPayoutCompleted(
  ledgerId: string,
  stripeTransferId: string
): Promise<void> {
  try {
    await db
      .update(financialLedger)
      .set({
        status: 'completed',
        stripeTransferId,
        processedAt: new Date()
      })
      .where(eq(financialLedger.id, ledgerId));
  } catch (error) {
    console.error('Error marking payout as completed:', error);
    throw error;
  }
}

/**
 * Marque un payout comme échoué
 * 
 * @param ledgerId - ID de l'entrée dans le ledger
 * @param reason - Raison de l'échec
 */
export async function markPayoutFailed(
  ledgerId: string,
  reason: string
): Promise<void> {
  try {
    await db
      .update(financialLedger)
      .set({
        status: 'failed',
        processedAt: new Date()
      })
      .where(eq(financialLedger.id, ledgerId));
    
    console.error(`❌ Payout ${ledgerId} failed: ${reason}`);
  } catch (error) {
    console.error('Error marking payout as failed:', error);
    throw error;
  }
}
