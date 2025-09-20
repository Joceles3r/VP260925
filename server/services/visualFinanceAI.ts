/**
 * VisualFinanceAI Service - Agent Financier Exécuteur
 * 
 * Rôle : Moteur déterministe des règles financières et VISUpoints
 * - Règles financières 40/30/7/23 pour clôture catégories
 * - Gestion VISUpoints (100 pts = 1€, seuil 2500)
 * - Golden Tickets avec remboursements
 * - Vente articles infoporteurs (30% VISUAL / 70% infoporteur)
 * - Pot 24h articles avec redistribution
 */

import { storage } from "../storage";
import { 
  InsertAgentDecision, 
  InsertAgentAuditLog, 
  InsertFinancialLedger,
  InsertPayoutRecipe,
  FinancialLedger,
  PayoutRecipe
} from "@shared/schema";

// Configuration runtime VisualFinanceAI
export const VISUAL_FINANCE_CONFIG = {
  // Règles de répartition clôture catégorie (40/30/7/23)
  category_close_investors_top10_pct: 0.40,
  category_close_creators_top10_pct: 0.30,
  category_close_investors_11_100_pct: 0.07,
  category_close_visual_pct: 0.23,
  
  // Répartition détaillée TOP10 investisseurs (40%)
  investors_top10_distribution: [
    0.1366, 0.0683, 0.0455, 0.0341, 0.0273, 
    0.0228, 0.0195, 0.0171, 0.0152, 0.0137
  ],
  
  // Répartition détaillée TOP10 porteurs (30%)
  creators_top10_distribution: [
    0.1024, 0.0512, 0.0341, 0.0256, 0.0205,
    0.0171, 0.0146, 0.0128, 0.0114, 0.0102
  ],
  
  // VISUpoints
  points_rate: 100, // 100 pts = 1 €
  points_threshold: 2500, // Seuil minimum conversion
  
  // Articles infoporteurs
  infoarticle_platform_fee_pct: 0.30, // 30% VISUAL, 70% infoporteur
  
  // ===== CATÉGORIE LIVRES =====
  // Ventes instantanées livres (70/30)
  books_author_revenue_share: 0.70, // 70% pour l'auteur
  books_platform_fee_pct: 0.30, // 30% pour VISUAL
  
  // Pot commun LIVRES (60/40)
  books_pot_authors_share: 0.60, // 60% du pot pour auteurs TOP10
  books_pot_readers_share: 0.40, // 40% du pot pour lecteurs gagnants
  
  // Tokens téléchargement
  books_download_token_ttl_hours: 72, // Expiration 72h
  
  // Extension 168h
  extension_price_eur: 25,
  
  // Golden Tickets remboursements - RÈGLES BUSINESS CORRECTES
  golden_ticket_refund_rank_1: 1.00, // 100% pour rang 1
  golden_ticket_refund_rank_2: 0.85, // 85% pour rang 2
  golden_ticket_refund_rank_3: 0.70, // 70% pour rang 3
  golden_ticket_refund_rank_4: 0.55, // 55% pour rang 4
  golden_ticket_refund_rank_5: 0.40, // 40% pour rang 5
  golden_ticket_refund_rank_6: 0.25, // 25% pour rang 6
  golden_ticket_refund_others: 0.0, // 0% pour rangs 7+
  
  // SLOs VisualFinanceAI
  payout_generation_latency_ms: 2000,
  stripe_execution_latency_ms: 60000,
  ledger_divergence_threshold: 0.01 // 0.01%
};

export interface PayoutCalculation {
  rule_version: string;
  total_amount_cents: number;
  payouts: PayoutEntry[];
  visual_amount_cents: number;
  residual_cents: number;
}

export interface PayoutEntry {
  type: 'investor_top10' | 'creator_top10' | 'investor_11_100' | 'visual_platform' | 'pot24h_winner' | 'infoporteur' | 'points_conversion';
  recipient_id?: string;
  amount_cents: number;
  amount_eur_floor: number; // Montant arrondi à l'euro inférieur pour utilisateurs
  rank?: number;
  reference_id: string;
}

export interface VISUPointsConversion {
  user_id: string;
  points_available: number;
  points_to_convert: number;
  euros_amount: number;
  points_remaining: number;
}

export interface Golden {
  ticket_type: '20_50' | '30_75' | '40_100';
  votes_required: number;
  investment_eur: number;
  final_rank: number;
  refund_percentage: number;
  refund_amount_eur: number;
}

export class VisualFinanceAIService {
  private config = VISUAL_FINANCE_CONFIG;
  
  // ===== UTILITAIRES DE CONVERSION =====
  
  private toCents(eur: number): number {
    return Math.round(eur * 100);
  }
  
  private euroFloor(cents: number): number {
    return Math.floor(cents / 100) * 100; // Arrondi à l'euro inférieur
  }
  
  private centsToEur(cents: number): number {
    return cents / 100;
  }
  
  // ===== RÈGLES FINANCIÈRES : CLÔTURE CATÉGORIE 40/30/7/23 =====
  
  async calculateCategoryClosePayout(
    categoryId: string,
    totalAmountEur: number,
    investorsTop10: string[],
    creatorsTop10: string[],
    investors11to100: string[]
  ): Promise<PayoutCalculation> {
    
    if (investorsTop10.length !== 10 || creatorsTop10.length !== 10) {
      throw new Error('TOP10 invalide: doit contenir exactement 10 éléments');
    }
    
    const startTime = Date.now();
    const totalCents = this.toCents(totalAmountEur);
    const payouts: PayoutEntry[] = [];
    let totalUsersPaidCents = 0;
    
    // 40% pour investisseurs TOP10 (répartition par rang)
    for (let i = 0; i < 10; i++) {
      const percentageOfTotal = this.config.investors_top10_distribution[i];
      const amountCents = Math.floor(percentageOfTotal * totalCents);
      const amountEurFloor = this.euroFloor(amountCents);
      
      payouts.push({
        type: 'investor_top10',
        recipient_id: investorsTop10[i],
        amount_cents: amountCents,
        amount_eur_floor: amountEurFloor,
        rank: i + 1,
        reference_id: categoryId
      });
      
      totalUsersPaidCents += amountEurFloor;
    }
    
    // 30% pour porteurs TOP10 (répartition par rang)
    for (let i = 0; i < 10; i++) {
      const percentageOfTotal = this.config.creators_top10_distribution[i];
      const amountCents = Math.floor(percentageOfTotal * totalCents);
      const amountEurFloor = this.euroFloor(amountCents);
      
      payouts.push({
        type: 'creator_top10',
        recipient_id: creatorsTop10[i],
        amount_cents: amountCents,
        amount_eur_floor: amountEurFloor,
        rank: i + 1,
        reference_id: categoryId
      });
      
      totalUsersPaidCents += amountEurFloor;
    }
    
    // 7% pour investisseurs rangs 11-100 (équipartition)
    if (investors11to100.length > 0) {
      const total7PercentCents = Math.floor(this.config.category_close_investors_11_100_pct * totalCents);
      const perPersonCents = Math.floor(total7PercentCents / investors11to100.length);
      const perPersonEurFloor = this.euroFloor(perPersonCents);
      
      for (const investorId of investors11to100) {
        payouts.push({
          type: 'investor_11_100',
          recipient_id: investorId,
          amount_cents: perPersonCents,
          amount_eur_floor: perPersonEurFloor,
          reference_id: categoryId
        });
        
        totalUsersPaidCents += perPersonEurFloor;
      }
    }
    
    // VISUAL = 23% base + tous les restes d'arrondis
    const base23PercentCents = Math.floor(this.config.category_close_visual_pct * totalCents);
    const residualCents = Math.max(0, totalCents - totalUsersPaidCents - base23PercentCents);
    const visualTotalCents = base23PercentCents + residualCents;
    
    payouts.push({
      type: 'visual_platform',
      amount_cents: visualTotalCents,
      amount_eur_floor: visualTotalCents, // VISUAL reçoit les centimes
      reference_id: categoryId
    });
    
    const calculation: PayoutCalculation = {
      rule_version: 'cat_close_40_30_7_23_v1',
      total_amount_cents: totalCents,
      payouts,
      visual_amount_cents: visualTotalCents,
      residual_cents: residualCents
    };
    
    // Vérifier performance
    const latency = Date.now() - startTime;
    if (latency > this.config.payout_generation_latency_ms) {
      console.warn(`[VisualFinanceAI] Calcul paiement lent: ${latency}ms`);
    }
    
    // Enregistrer la recipe dans le ledger
    await this.createLedgerEntries(calculation, 'category_close');
    await this.logAuditEntry('payout_executed', 'category', categoryId, calculation);
    
    return calculation;
  }
  
  // ===== ARTICLES INFOPORTEURS : 30% VISUAL / 70% INFOPORTEUR =====
  
  async processArticleSale(
    orderId: string,
    grossAmountEur: number,
    infoporterId: string
  ): Promise<PayoutCalculation> {
    
    const grossCents = this.toCents(grossAmountEur);
    const feeCents = Math.round(grossCents * this.config.infoarticle_platform_fee_pct);
    const netCents = grossCents - feeCents;
    
    const payouts: PayoutEntry[] = [
      {
        type: 'visual_platform',
        amount_cents: feeCents,
        amount_eur_floor: feeCents, // VISUAL reçoit les centimes
        reference_id: orderId
      },
      {
        type: 'infoporteur',
        recipient_id: infoporterId,
        amount_cents: netCents,
        amount_eur_floor: this.euroFloor(netCents),
        reference_id: orderId
      }
    ];
    
    const calculation: PayoutCalculation = {
      rule_version: 'infoarticle_30_70_v1',
      total_amount_cents: grossCents,
      payouts,
      visual_amount_cents: feeCents,
      residual_cents: 0
    };
    
    await this.createLedgerEntries(calculation, 'article_sale');
    await this.logAuditEntry('payout_executed', 'article_sale', orderId, calculation);
    
    return calculation;
  }
  
  // ===== POT 24H ARTICLES =====
  
  async distributePot24h(
    windowId: string,
    winners: string[],
    potAmountEur: number
  ): Promise<PayoutCalculation> {
    
    const potCents = this.toCents(potAmountEur);
    const payouts: PayoutEntry[] = [];
    let totalUsersPaidCents = 0;
    
    if (winners.length === 0) {
      // Si pas de gagnants, tout va à VISUAL
      payouts.push({
        type: 'visual_platform',
        amount_cents: potCents,
        amount_eur_floor: potCents,
        reference_id: windowId
      });
    } else {
      // Équipartition entre gagnants (par défaut)
      const perWinnerCents = Math.floor(potCents / winners.length);
      const perWinnerEurFloor = this.euroFloor(perWinnerCents);
      
      for (const winnerId of winners) {
        payouts.push({
          type: 'pot24h_winner',
          recipient_id: winnerId,
          amount_cents: perWinnerCents,
          amount_eur_floor: perWinnerEurFloor,
          reference_id: windowId
        });
        totalUsersPaidCents += perWinnerEurFloor;
      }
      
      // Résidus à VISUAL
      const residualCents = potCents - totalUsersPaidCents;
      if (residualCents > 0) {
        payouts.push({
          type: 'visual_platform',
          amount_cents: residualCents,
          amount_eur_floor: residualCents,
          reference_id: windowId
        });
      }
    }
    
    const calculation: PayoutCalculation = {
      rule_version: 'pot24h_equipartition_v1',
      total_amount_cents: potCents,
      payouts,
      visual_amount_cents: payouts.find(p => p.type === 'visual_platform')?.amount_cents || 0,
      residual_cents: payouts.find(p => p.type === 'visual_platform')?.amount_cents || 0
    };
    
    await this.createLedgerEntries(calculation, 'pot24h_distribution');
    await this.logAuditEntry('payout_executed', 'pot24h', windowId, calculation);
    
    return calculation;
  }
  
  // ===== VISUPOINTS : CONVERSION (100 pts = 1 €, seuil 2500) =====
  
  async convertVISUPoints(
    userId: string,
    availablePoints: number
  ): Promise<VISUPointsConversion> {
    
    if (availablePoints < this.config.points_threshold) {
      throw new Error(`Conversion impossible: ${availablePoints} < ${this.config.points_threshold} points requis`);
    }
    
    const eurosAmount = Math.floor(availablePoints / this.config.points_rate);
    const pointsToConvert = eurosAmount * this.config.points_rate;
    const pointsRemaining = availablePoints - pointsToConvert;
    
    const conversion: VISUPointsConversion = {
      user_id: userId,
      points_available: availablePoints,
      points_to_convert: pointsToConvert,
      euros_amount: eurosAmount,
      points_remaining: pointsRemaining
    };
    
    // Créer entrée ledger pour conversion
    const conversionId = `points_${userId}_${Date.now()}`;
    await this.createLedgerEntry({
      transactionType: 'points_conversion',
      referenceId: conversionId,
      referenceType: 'points_conversion',
      recipientId: userId,
      grossAmountCents: this.toCents(eurosAmount),
      netAmountCents: this.toCents(eurosAmount),
      feeCents: 0,
      idempotencyKey: `points_conv_${userId}_${pointsToConvert}`,
      payoutRule: 'points_conversion_v1'
    });
    
    await this.logAuditEntry('points_converted', 'user', userId, conversion);
    
    return conversion;
  }
  
  // ===== GOLDEN TICKETS =====
  
  async calculateGoldenTicketRefund(
    userId: string,
    ticketType: '20_50' | '30_75' | '40_100',
    finalRank: number
  ): Promise<Golden> {
    
    const ticketConfig = {
      '20_50': { votes: 20, investment: 50 },
      '30_75': { votes: 30, investment: 75 },
      '40_100': { votes: 40, investment: 100 }
    };
    
    const config = ticketConfig[ticketType];
    let refundPercentage = 0;
    
    // Règles de remboursement selon rang final - RÈGLES BUSINESS CORRECTES
    switch (finalRank) {
      case 1:
        refundPercentage = this.config.golden_ticket_refund_rank_1; // 100%
        break;
      case 2:
        refundPercentage = this.config.golden_ticket_refund_rank_2; // 85%
        break;
      case 3:
        refundPercentage = this.config.golden_ticket_refund_rank_3; // 70%
        break;
      case 4:
        refundPercentage = this.config.golden_ticket_refund_rank_4; // 55%
        break;
      case 5:
        refundPercentage = this.config.golden_ticket_refund_rank_5; // 40%
        break;
      case 6:
        refundPercentage = this.config.golden_ticket_refund_rank_6; // 25%
        break;
      default:
        refundPercentage = this.config.golden_ticket_refund_others; // 0% pour rangs 7+
        break;
    }
    
    const refundAmount = config.investment * refundPercentage;
    
    const goldenTicket: Golden = {
      ticket_type: ticketType,
      votes_required: config.votes,
      investment_eur: config.investment,
      final_rank: finalRank,
      refund_percentage: refundPercentage,
      refund_amount_eur: refundAmount
    };
    
    // Si remboursement > 0, créer entrée ledger
    if (refundAmount > 0) {
      const refundId = `golden_${ticketType}_${userId}_${finalRank}`;
      await this.createLedgerEntry({
        transactionType: 'golden_ticket_refund',
        referenceId: refundId,
        referenceType: 'golden_ticket',
        recipientId: userId,
        grossAmountCents: this.toCents(refundAmount),
        netAmountCents: this.toCents(refundAmount),
        feeCents: 0,
        idempotencyKey: `golden_refund_${userId}_${ticketType}_${finalRank}`,
        payoutRule: 'golden_ticket_refund_v1'
      });
    }
    
    await this.logAuditEntry('payout_executed', 'golden_ticket', userId, goldenTicket);
    
    return goldenTicket;
  }
  
  // ===== EXTENSION 168H PAYANTE =====
  
  async processExtensionPayment(
    projectId: string,
    userId: string,
    paymentIntentId: string
  ): Promise<void> {
    
    const extensionPrice = this.config.extension_price_eur;
    
    await this.createLedgerEntry({
      transactionType: 'extension_payment',
      referenceId: projectId,
      referenceType: 'project_extension',
      recipientId: null, // Payment vers VISUAL
      grossAmountCents: this.toCents(extensionPrice),
      netAmountCents: this.toCents(extensionPrice),
      feeCents: 0,
      stripePaymentIntentId: paymentIntentId,
      idempotencyKey: `ext_${projectId}_${userId}_${paymentIntentId}`,
      payoutRule: 'extension_25eur_v1'
    });
    
    await this.logAuditEntry('payout_executed', 'project_extension', projectId, {
      user_id: userId,
      amount_eur: extensionPrice,
      payment_intent_id: paymentIntentId
    });
  }
  
  // ===== GESTION LEDGER & AUDIT =====
  
  private async createLedgerEntries(calculation: PayoutCalculation, referenceType: string): Promise<void> {
    for (const payout of calculation.payouts) {
      await this.createLedgerEntry({
        transactionType: 'payout',
        referenceId: payout.reference_id,
        referenceType: referenceType,
        recipientId: payout.recipient_id || null,
        grossAmountCents: payout.amount_cents,
        netAmountCents: payout.amount_eur_floor,
        feeCents: payout.amount_cents - payout.amount_eur_floor,
        idempotencyKey: `${referenceType}_${payout.reference_id}_${payout.recipient_id}_${payout.type}`,
        payoutRule: calculation.rule_version
      });
    }
  }
  
  private async createLedgerEntry(entry: Omit<InsertFinancialLedger, 'createdAt' | 'id'>): Promise<FinancialLedger> {
    return await storage.createLedgerEntry(entry);
  }
  
  private async logAuditEntry(action: string, subjectType: string, subjectId: string, details: any): Promise<void> {
    // Le hash chain sera géré automatiquement par storage.createAuditLogEntry
    await storage.createAuditLogEntry({
      agentType: 'visualfinanceai',
      action: action as any,
      subjectType,
      subjectId,
      details,
      actor: 'visualfinanceai'
      // currentHash et previousHash seront générés par le storage
    });
  }
  
  // ===== RÉCONCILIATION & CONTRÔLES =====
  
  async reconcileWithStripe(): Promise<{ divergences: number; total: number }> {
    return await storage.reconcileLedgerWithStripe();
  }
  
  async detectAnomalies(timeframe: 'hour' | 'day' | 'week' = 'day'): Promise<string[]> {
    const anomalies: string[] = [];
    
    // Récupérer transactions récentes
    const entries = await storage.getLedgerEntries(undefined, undefined, 1000);
    
    // Détection de patterns suspects
    const amounts = entries.map(e => e.grossAmountCents);
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    
    for (const entry of entries) {
      // Montant anormalement élevé
      if (entry.grossAmountCents > avgAmount * 10) {
        anomalies.push(`Montant élevé: ${entry.grossAmountCents} centimes (${entry.id})`);
      }
      
      // Micropaiements en rafale (potentiel test/attaque)
      const microPayments = entries.filter(e => 
        e.grossAmountCents < 100 && // < 1€
        Math.abs(new Date(e.createdAt!).getTime() - new Date(entry.createdAt!).getTime()) < 60000 // 1 min
      );
      
      if (microPayments.length > 10) {
        anomalies.push(`Rafale micropaiements détectée: ${microPayments.length} transactions`);
      }
    }
    
    if (anomalies.length > 0) {
      await this.logAuditEntry('decision_made', 'system', 'anomaly_detection', {
        timeframe,
        anomalies,
        entries_analyzed: entries.length
      });
    }
    
    return anomalies;
  }
  
  // ===== PAYOUT RECIPES VERSIONING =====
  
  async createPayoutRecipe(
    ruleType: string,
    version: string,
    formula: any,
    description: string
  ): Promise<PayoutRecipe> {
    
    const recipe = await storage.createPayoutRecipe({
      version,
      ruleType,
      formula,
      description,
      isActive: false, // Pas activé par défaut
      createdBy: 'visualfinanceai'
    });
    
    await this.logAuditEntry('policy_updated', 'payout_recipe', recipe.id, {
      rule_type: ruleType,
      version,
      formula
    });
    
    return recipe;
  }
  
  async activatePayoutRecipe(version: string): Promise<PayoutRecipe> {
    const activated = await storage.activatePayoutRecipe(version);
    
    await this.logAuditEntry('policy_updated', 'payout_recipe', activated.id, {
      version,
      activated_at: new Date().toISOString()
    });
    
    return activated;
  }

  // ===== RÈGLES FINANCIÈRES : CATÉGORIE LIVRES =====

  /**
   * Calcul vente instantanée livre (70/30)
   * @param bookId ID du livre
   * @param authorId ID de l'auteur
   * @param grossPriceEur Prix de vente brut en euros
   * @param buyerId ID de l'acheteur
   * @param stripePaymentIntentId ID Stripe transaction
   */
  async calculateBookSale(
    bookId: string,
    authorId: string,
    grossPriceEur: number,
    buyerId: string,
    stripePaymentIntentId: string
  ): Promise<PayoutCalculation> {
    
    const grossCents = this.toCents(grossPriceEur);
    const platformFeeCents = Math.round(grossCents * this.config.books_platform_fee_pct);
    const authorRevenueCents = grossCents - platformFeeCents;
    
    // Euro floor pour l'auteur (utilisateur)
    const authorRevenueEurFloor = this.euroFloor(authorRevenueCents);
    const residualCents = authorRevenueCents - authorRevenueEurFloor;
    
    const payouts: PayoutEntry[] = [
      {
        type: 'infoporteur', // Réutilisation du type existant pour auteur livre
        recipient_id: authorId,
        amount_cents: authorRevenueCents,
        amount_eur_floor: authorRevenueEurFloor,
        reference_id: bookId
      }
    ];
    
    const calculation: PayoutCalculation = {
      rule_version: 'books_sale_70_30_v1',
      total_amount_cents: grossCents,
      payouts,
      visual_amount_cents: platformFeeCents + residualCents,
      residual_cents: residualCents
    };

    // Créer entrée ledger
    await this.createLedgerEntry({
      transactionType: 'book_sale',
      referenceId: bookId,
      referenceType: 'book_purchase',
      recipientId: authorId,
      grossAmountCents: grossCents,
      netAmountCents: authorRevenueEurFloor,
      feeCents: platformFeeCents + residualCents,
      stripePaymentIntentId,
      idempotencyKey: `book_sale_${bookId}_${buyerId}_${stripePaymentIntentId}`,
      payoutRule: 'books_70_30_v1'
    });

    await this.logAuditEntry('payout_executed', 'book_sale', bookId, {
      author_id: authorId,
      buyer_id: buyerId,
      gross_eur: grossPriceEur,
      author_revenue_eur: this.centsToEur(authorRevenueEurFloor),
      platform_fee_eur: this.centsToEur(platformFeeCents),
      residual_eur: this.centsToEur(residualCents),
      stripe_payment_intent_id: stripePaymentIntentId
    });

    return calculation;
  }

  /**
   * Calcul redistribution pot commun LIVRES (60/40)
   * @param categoryId ID de la catégorie LIVRES
   * @param potTotalEur Montant total du pot en euros
   * @param authorsTop10 IDs des auteurs TOP 10
   * @param winningReaders IDs des lecteurs gagnants (qui ont acheté livres TOP 10)
   */
  async calculateBooksPotRedistribution(
    categoryId: string,
    potTotalEur: number,
    authorsTop10: string[],
    winningReaders: string[]
  ): Promise<PayoutCalculation> {
    
    const potCents = this.toCents(potTotalEur);
    const authorsPotCents = Math.floor(potCents * this.config.books_pot_authors_share);
    const readersPotCents = Math.floor(potCents * this.config.books_pot_readers_share);
    
    // Répartition équitable par défaut
    const authorsShareEach = authorsTop10.length > 0 ? Math.floor(authorsPotCents / authorsTop10.length) : 0;
    const readersShareEach = winningReaders.length > 0 ? Math.floor(readersPotCents / winningReaders.length) : 0;
    
    // Euro floor pour utilisateurs
    const authorsShareEurFloor = this.euroFloor(authorsShareEach);
    const readersShareEurFloor = this.euroFloor(readersShareEach);
    
    const payouts: PayoutEntry[] = [];
    
    // Payouts auteurs TOP 10
    for (let i = 0; i < authorsTop10.length; i++) {
      payouts.push({
        type: 'creator_top10',
        recipient_id: authorsTop10[i],
        amount_cents: authorsShareEach,
        amount_eur_floor: authorsShareEurFloor,
        rank: i + 1,
        reference_id: categoryId
      });
    }
    
    // Payouts lecteurs gagnants
    for (const readerId of winningReaders) {
      payouts.push({
        type: 'pot24h_winner', // Réutilisation type existant
        recipient_id: readerId,
        amount_cents: readersShareEach,
        amount_eur_floor: readersShareEurFloor,
        reference_id: categoryId
      });
    }
    
    // Calcul résiduel (restes euro-floor + montant non réparti)
    const totalPaidAuthors = authorsTop10.length * authorsShareEurFloor;
    const totalPaidReaders = winningReaders.length * readersShareEurFloor;
    const totalPaidCents = totalPaidAuthors + totalPaidReaders;
    const residualCents = potCents - totalPaidCents;
    
    const calculation: PayoutCalculation = {
      rule_version: 'books_pot_60_40_v1',
      total_amount_cents: potCents,
      payouts,
      visual_amount_cents: residualCents,
      residual_cents: residualCents
    };

    // Créer entrées ledger pour tous les payouts
    await this.createLedgerEntries(calculation, 'books_pot_redistribution');

    await this.logAuditEntry('payout_executed', 'books_pot', categoryId, {
      pot_total_eur: potTotalEur,
      authors_count: authorsTop10.length,
      readers_count: winningReaders.length,
      authors_share_eur: this.centsToEur(authorsPotCents),
      readers_share_eur: this.centsToEur(readersPotCents),
      residual_eur: this.centsToEur(residualCents)
    });

    return calculation;
  }

  /**
   * Génération token téléchargement sécurisé avec watermark
   * @param purchaseId ID de l'achat
   * @param userId ID de l'utilisateur
   * @param bookId ID du livre
   */
  async generateDownloadToken(
    purchaseId: string,
    userId: string,
    bookId: string
  ): Promise<{ token: string; expiresAt: Date; downloadUrl: string }> {
    
    const token = `bt_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + this.config.books_download_token_ttl_hours);
    
    // Données pour watermark
    const watermarkData = {
      user_id: userId,
      purchase_id: purchaseId,
      book_id: bookId,
      timestamp: new Date().toISOString(),
      token: token
    };
    
    // URL temporaire signée (à implémenter selon stockage)
    const downloadUrl = `/api/books/download/${token}`;
    
    await this.logAuditEntry('decision_made', 'download_token', token, {
      purchase_id: purchaseId,
      user_id: userId,
      book_id: bookId,
      expires_at: expiresAt.toISOString(),
      watermark_data: watermarkData
    });
    
    return {
      token,
      expiresAt,
      downloadUrl
    };
  }
}

export const visualFinanceAI = new VisualFinanceAIService();