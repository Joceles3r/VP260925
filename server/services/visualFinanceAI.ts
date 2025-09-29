/**
 * VisualFinanceAI - Agent Financier (Exécuteur)
 * Moteur déterministe des règles financières et VISUpoints
 */

import { z } from 'zod';

// Configuration VisualFinanceAI
export const FINANCE_AI_CONFIG = {
  enabled: true,
  rounding: {
    userPayoutFloorEuro: true,    // Arrondi à l'euro inférieur pour utilisateurs
    residualToVisual: true        // Restes → VISUAL
  },
  splits: {
    // Redistribution événement catégorie (40/30/7/23)
    videoEvent: {
      investorsTop10: 0.40,
      portersTop10: 0.30,
      investors11_100: 0.07,
      visual: 0.23
    },
    // Vente unitaire (70/30)
    perSale: {
      creator: 0.70,
      visual: 0.30
    },
    // Pot mensuel Livres (60/40)
    livresMonthlyPot: {
      authors: 0.60,
      readers: 0.40
    }
  },
  visupoints: {
    eurToPoints: 100,             // 1 EUR = 100 VISUpoints
    minWithdrawal: 2500,          // Seuil minimum 2500 pts
    conversionFloor: true         // Floor à l'euro
  },
  extensionPriceEur: 25,          // Prix extension 168h
  maxSinglePayout: 50000,        // Limite sécurité 500€
  auditRetentionDays: 2555       // 7 ans de rétention
} as const;

// Répartition TOP 10 (parts absolues de S)
const INV_TOP10_SHARES = [0.1366, 0.0683, 0.0455, 0.0341, 0.0273, 0.0228, 0.0195, 0.0171, 0.0152, 0.0137];
const PORT_TOP10_SHARES = [0.1024, 0.0512, 0.0341, 0.0256, 0.0205, 0.0171, 0.0146, 0.0128, 0.0114, 0.0102];

// Validation schemas
export const categoryCloseSchema = z.object({
  categoryId: z.string(),
  totalAmount: z.number().positive(),
  invTop10: z.array(z.string()).length(10),
  portTop10: z.array(z.string()).length(10),
  inv11to100: z.array(z.string())
});

export const articleSaleSchema = z.object({
  orderId: z.string(),
  grossEUR: z.number().positive(),
  infoporterId: z.string(),
  buyerId: z.string()
});

export const visuPointsConversionSchema = z.object({
  userId: z.string(),
  points: z.number().min(FINANCE_AI_CONFIG.visupoints.minWithdrawal)
});

// Types
export interface PayoutRecipe {
  id: string;
  type: 'category_close' | 'article_sale' | 'pot_24h' | 'extension' | 'visupoints';
  version: string;
  parameters: Record<string, any>;
  payouts: Payout[];
  totalCents: number;
  createdAt: Date;
  executedAt?: Date;
  stripeTransferIds?: string[];
}

export interface Payout {
  type: string;
  userId?: string;
  cents: number;
  rank?: number;
  metadata?: Record<string, any>;
}

export interface LedgerEntry {
  id: string;
  orderId?: string;
  type: string;
  grossCents: number;
  netCents: number;
  feeCents: number;
  fromUserId?: string;
  toUserId?: string;
  stripeTransferId?: string;
  hash: string;
  previousHash?: string;
  createdAt: Date;
}

export class VisualFinanceAI {
  private enabled: boolean;
  private ledger: LedgerEntry[] = [];
  private payoutRecipes: PayoutRecipe[] = [];
  private lastLedgerHash: string = '';

  constructor() {
    this.enabled = FINANCE_AI_CONFIG.enabled;
  }

  // ===== UTILITAIRES =====

  private toCents(eur: number): number {
    return Math.round(eur * 100);
  }

  private euroFloor(cents: number): number {
    return Math.floor(cents / 100) * 100;
  }

  private generateHash(data: string): string {
    // Simulation d'un hash - en production utiliser crypto
    return Buffer.from(data).toString('base64').slice(0, 16);
  }

  // ===== CLÔTURE DE CATÉGORIE (40/30/7/23) =====

  /**
   * Exécute la clôture d'une catégorie avec redistribution 40/30/7/23
   */
  async executeCloseCategory(
    categoryId: string,
    totalAmountEUR: number,
    invTop10: string[],
    portTop10: string[],
    inv11to100: string[]
  ): Promise<PayoutRecipe> {
    const data = categoryCloseSchema.parse({
      categoryId,
      totalAmount: totalAmountEUR,
      invTop10,
      portTop10,
      inv11to100
    });

    const S_c = this.toCents(totalAmountEUR);
    const payouts: Payout[] = [];
    let usersPaidCents = 0;

    // 40% investisseurs TOP10 (parts absolues de S)
    for (let i = 0; i < 10; i++) {
      const shareCents = Math.floor(INV_TOP10_SHARES[i] * S_c);
      const payoutCents = this.euroFloor(shareCents);
      
      payouts.push({
        type: 'investor_top10',
        userId: invTop10[i],
        cents: payoutCents,
        rank: i + 1,
        metadata: { originalShare: INV_TOP10_SHARES[i], calculatedCents: shareCents }
      });
      
      usersPaidCents += payoutCents;
    }

    // 30% porteurs TOP10 (parts absolues de S)
    for (let i = 0; i < 10; i++) {
      const shareCents = Math.floor(PORT_TOP10_SHARES[i] * S_c);
      const payoutCents = this.euroFloor(shareCents);
      
      payouts.push({
        type: 'creator_top10',
        userId: portTop10[i],
        cents: payoutCents,
        rank: i + 1,
        metadata: { originalShare: PORT_TOP10_SHARES[i], calculatedCents: shareCents }
      });
      
      usersPaidCents += payoutCents;
    }

    // 7% investisseurs 11-100 (équipartition)
    if (inv11to100.length > 0) {
      const base7Cents = Math.floor(0.07 * S_c);
      const shareCents = Math.floor(base7Cents / inv11to100.length);
      const payoutCents = this.euroFloor(shareCents);
      
      for (const userId of inv11to100) {
        payouts.push({
          type: 'investor_11_100',
          userId,
          cents: payoutCents,
          metadata: { totalPool: base7Cents, sharePerUser: shareCents }
        });
        
        usersPaidCents += payoutCents;
      }
    }

    // 23% VISUAL + restes d'arrondis
    const base23Cents = Math.floor(0.23 * S_c);
    const residualCents = Math.max(0, S_c - usersPaidCents);
    const visualTotalCents = base23Cents + residualCents;
    
    payouts.push({
      type: 'visual_platform',
      cents: visualTotalCents,
      metadata: { 
        basePlatformShare: base23Cents, 
        roundingResidual: residualCents,
        totalUsersPaid: usersPaidCents
      }
    });

    // Créer la recette de paiement
    const recipe: PayoutRecipe = {
      id: `recipe-${Date.now()}`,
      type: 'category_close',
      version: 'cat_close_40_30_7_23_v1',
      parameters: { categoryId, totalAmountEUR, invTop10, portTop10, inv11to100 },
      payouts,
      totalCents: S_c,
      createdAt: new Date()
    };

    this.payoutRecipes.push(recipe);

    // Exécuter les transferts Stripe
    await this.executeStripeTransfers(recipe);

    return recipe;
  }

  // ===== VENTE D'ARTICLE (70/30) =====

  /**
   * Traite la vente d'un article infoporteur
   */
  async processArticleSale(orderId: string, grossEUR: number, infoporterId: string, buyerId: string): Promise<LedgerEntry> {
    const data = articleSaleSchema.parse({ orderId, grossEUR, infoporterId, buyerId });
    
    const grossCents = this.toCents(grossEUR);
    const feeCents = Math.round(grossCents * FINANCE_AI_CONFIG.splits.perSale.visual);
    const netCents = grossCents - feeCents;

    // Créer l'entrée ledger
    const entry: LedgerEntry = {
      id: `ledger-${Date.now()}`,
      orderId,
      type: 'article_sale',
      grossCents,
      netCents,
      feeCents,
      fromUserId: buyerId,
      toUserId: infoporterId,
      hash: '',
      previousHash: this.lastLedgerHash,
      createdAt: new Date()
    };

    // Générer le hash de l'entrée
    const dataToHash = JSON.stringify({
      orderId,
      grossCents,
      netCents,
      feeCents,
      timestamp: entry.createdAt.toISOString()
    });
    entry.hash = this.generateHash(dataToHash + (this.lastLedgerHash || ''));
    this.lastLedgerHash = entry.hash;

    this.ledger.push(entry);

    // Exécuter les transferts Stripe
    await this.executeStripeTransfer(infoporterId, netCents, `article-sale-${orderId}`);
    await this.executeStripeTransfer('VISUAL', feeCents, `article-fee-${orderId}`);

    return entry;
  }

  // ===== POT MENSUEL LIVRES (60/40) =====

  /**
   * Distribue le pot mensuel de la catégorie Livres
   */
  async distributeLivresMonthlyPot(
    monthId: string,
    potEUR: number,
    authorsTop10: string[],
    readersWinners: string[]
  ): Promise<PayoutRecipe> {
    const potCents = this.toCents(potEUR);
    const authorsCents = Math.floor(potCents * FINANCE_AI_CONFIG.splits.livresMonthlyPot.authors);
    const readersCents = Math.floor(potCents * FINANCE_AI_CONFIG.splits.livresMonthlyPot.readers);
    
    const payouts: Payout[] = [];
    let usersPaidCents = 0;

    // 60% auteurs TOP 10 (équipartition)
    if (authorsTop10.length > 0) {
      const sharePerAuthor = Math.floor(authorsCents / authorsTop10.length);
      const payoutPerAuthor = this.euroFloor(sharePerAuthor);
      
      for (const authorId of authorsTop10) {
        payouts.push({
          type: 'author_monthly_pot',
          userId: authorId,
          cents: payoutPerAuthor,
          metadata: { monthId, totalAuthors: authorsTop10.length }
        });
        usersPaidCents += payoutPerAuthor;
      }
    }

    // 40% lecteurs gagnants (équipartition)
    if (readersWinners.length > 0) {
      const sharePerReader = Math.floor(readersCents / readersWinners.length);
      const payoutPerReader = this.euroFloor(sharePerReader);
      
      for (const readerId of readersWinners) {
        payouts.push({
          type: 'reader_monthly_pot',
          userId: readerId,
          cents: payoutPerReader,
          metadata: { monthId, totalReaders: readersWinners.length }
        });
        usersPaidCents += payoutPerReader;
      }
    } else {
      // Fallback : si aucun lecteur gagnant, tout aux auteurs
      const fallbackCents = this.euroFloor(readersCents / Math.max(1, authorsTop10.length));
      for (const authorId of authorsTop10) {
        payouts.push({
          type: 'author_monthly_pot_fallback',
          userId: authorId,
          cents: fallbackCents,
          metadata: { monthId, reason: 'no_winning_readers' }
        });
        usersPaidCents += fallbackCents;
      }
    }

    // Restes → VISUAL
    const residualCents = Math.max(0, potCents - usersPaidCents);
    payouts.push({
      type: 'visual_monthly_residual',
      cents: residualCents,
      metadata: { monthId, originalPot: potCents, usersPaid: usersPaidCents }
    });

    const recipe: PayoutRecipe = {
      id: `monthly-pot-${monthId}`,
      type: 'pot_24h',
      version: 'livres_monthly_60_40_v1',
      parameters: { monthId, potEUR, authorsTop10, readersWinners },
      payouts,
      totalCents: potCents,
      createdAt: new Date()
    };

    this.payoutRecipes.push(recipe);
    await this.executeStripeTransfers(recipe);

    return recipe;
  }

  // ===== VISUPOINTS =====

  /**
   * Convertit les VISUpoints en EUR
   */
  async convertVisuPoints(userId: string, points: number): Promise<{
    euros: number;
    pointsLeft: number;
    transferId?: string;
  }> {
    const data = visuPointsConversionSchema.parse({ userId, points });
    
    if (points < FINANCE_AI_CONFIG.visupoints.minWithdrawal) {
      throw new Error(`Minimum ${FINANCE_AI_CONFIG.visupoints.minWithdrawal} points required`);
    }

    const euros = Math.floor(points / FINANCE_AI_CONFIG.visupoints.eurToPoints);
    const pointsLeft = points - (euros * FINANCE_AI_CONFIG.visupoints.eurToPoints);
    
    // Exécuter le transfert Stripe
    const transferId = await this.executeStripeTransfer(userId, this.toCents(euros), `visupoints-${userId}-${Date.now()}`);

    // Enregistrer dans le ledger
    await this.recordLedgerEntry({
      orderId: `visupoints-${Date.now()}`,
      type: 'visupoints_conversion',
      grossCents: this.toCents(euros),
      netCents: this.toCents(euros),
      feeCents: 0,
      toUserId: userId,
      stripeTransferId: transferId
    });

    return { euros, pointsLeft, transferId };
  }

  // ===== EXTENSIONS 168H =====

  /**
   * Traite le paiement d'une extension 168h
   */
  async processExtensionPayment(
    projectId: string, 
    userId: string, 
    priceEUR: number, 
    paymentIntentId: string
  ): Promise<void> {
    const priceCents = this.toCents(priceEUR);
    
    // Enregistrer dans le ledger
    await this.recordLedgerEntry({
      orderId: `extension-${projectId}-${Date.now()}`,
      type: 'category_extension',
      grossCents: priceCents,
      netCents: 0, // Tout va à VISUAL
      feeCents: priceCents,
      fromUserId: userId,
      toUserId: 'VISUAL',
      stripeTransferId: paymentIntentId
    });

    console.log(`💰 VisualFinanceAI: Extension payment processed - ${priceEUR}€ from ${userId} for project ${projectId}`);
  }

  // ===== STRIPE & TRANSFERTS =====

  /**
   * Exécute tous les transferts Stripe d'une recette
   */
  private async executeStripeTransfers(recipe: PayoutRecipe): Promise<void> {
    const transferIds: string[] = [];
    
    for (const payout of recipe.payouts) {
      if (payout.userId && payout.cents > 0) {
        try {
          const transferId = await this.executeStripeTransfer(
            payout.userId, 
            payout.cents, 
            `${recipe.type}-${recipe.id}-${payout.type}`
          );
          transferIds.push(transferId);
        } catch (error) {
          console.error(`Failed to transfer ${payout.cents} cents to ${payout.userId}:`, error);
        }
      }
    }

    recipe.stripeTransferIds = transferIds;
    recipe.executedAt = new Date();
  }

  /**
   * Exécute un transfert Stripe individuel
   */
  private async executeStripeTransfer(userId: string, cents: number, idempotencyKey: string): Promise<string> {
    // Simulation - en production, utiliser Stripe Connect
    const transferId = `tr_${Math.random().toString(36).substring(7)}`;
    
    console.log(`💳 Stripe Transfer: ${cents} cents → ${userId} (${idempotencyKey})`);
    
    // Simulation d'un délai Stripe
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return transferId;
  }

  // ===== LEDGER & AUDIT =====

  /**
   * Enregistre une entrée dans le ledger avec hash chaîné
   */
  private async recordLedgerEntry(data: Omit<LedgerEntry, 'id' | 'hash' | 'previousHash' | 'createdAt'>): Promise<LedgerEntry> {
    const entry: LedgerEntry = {
      id: `ledger-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      ...data,
      hash: '',
      previousHash: this.lastLedgerHash || undefined,
      createdAt: new Date()
    };

    // Générer le hash chaîné
    const dataToHash = JSON.stringify({
      ...data,
      timestamp: entry.createdAt.toISOString(),
      previousHash: entry.previousHash
    });
    entry.hash = this.generateHash(dataToHash);
    this.lastLedgerHash = entry.hash;

    this.ledger.push(entry);
    
    console.log(`📊 Ledger Entry: ${entry.type} - ${entry.grossCents} cents`);
    
    return entry;
  }

  /**
   * Vérifie l'intégrité du ledger
   */
  async verifyLedgerIntegrity(): Promise<{
    valid: boolean;
    totalEntries: number;
    lastVerifiedHash: string;
    errors: string[];
  }> {
    const errors: string[] = [];
    let previousHash = '';

    for (let i = 0; i < this.ledger.length; i++) {
      const entry = this.ledger[i];
      
      // Vérifier le hash précédent
      if (entry.previousHash !== previousHash) {
        errors.push(`Entry ${i}: Invalid previous hash`);
      }
      
      // Recalculer et vérifier le hash
      const dataToHash = JSON.stringify({
        orderId: entry.orderId,
        type: entry.type,
        grossCents: entry.grossCents,
        netCents: entry.netCents,
        feeCents: entry.feeCents,
        timestamp: entry.createdAt.toISOString(),
        previousHash: entry.previousHash
      });
      const expectedHash = this.generateHash(dataToHash);
      
      if (entry.hash !== expectedHash) {
        errors.push(`Entry ${i}: Hash mismatch`);
      }
      
      previousHash = entry.hash;
    }

    return {
      valid: errors.length === 0,
      totalEntries: this.ledger.length,
      lastVerifiedHash: previousHash,
      errors
    };
  }

  // ===== MÉTRIQUES & MONITORING =====

  /**
   * Récupère les métriques financières
   */
  async getFinancialMetrics(): Promise<{
    totalProcessed: number;
    totalFees: number;
    totalPayouts: number;
    averageTransactionSize: number;
    ledgerEntries: number;
    pendingTransfers: number;
    lastReconciliation: Date;
  }> {
    const totalProcessed = this.ledger.reduce((sum, entry) => sum + entry.grossCents, 0) / 100;
    const totalFees = this.ledger.reduce((sum, entry) => sum + entry.feeCents, 0) / 100;
    const totalPayouts = this.ledger.reduce((sum, entry) => sum + entry.netCents, 0) / 100;
    
    return {
      totalProcessed,
      totalFees,
      totalPayouts,
      averageTransactionSize: totalProcessed / Math.max(1, this.ledger.length),
      ledgerEntries: this.ledger.length,
      pendingTransfers: 0, // En production, compter les transferts en attente
      lastReconciliation: new Date()
    };
  }

  /**
   * Génère un rapport financier
   */
  async generateFinancialReport(period: 'daily' | 'weekly' | 'monthly'): Promise<{
    period: string;
    totalRevenue: number;
    platformFees: number;
    creatorPayouts: number;
    visuPointsConverted: number;
    extensionRevenue: number;
    ledgerIntegrity: boolean;
  }> {
    const metrics = await this.getFinancialMetrics();
    const integrity = await this.verifyLedgerIntegrity();
    
    // Calculs par type de transaction
    const articleSales = this.ledger.filter(e => e.type === 'article_sale');
    const extensions = this.ledger.filter(e => e.type === 'category_extension');
    const visuPointsConversions = this.ledger.filter(e => e.type === 'visupoints_conversion');

    return {
      period: `${period}-${new Date().toISOString().split('T')[0]}`,
      totalRevenue: metrics.totalProcessed,
      platformFees: metrics.totalFees,
      creatorPayouts: metrics.totalPayouts,
      visuPointsConverted: visuPointsConversions.reduce((sum, e) => sum + e.grossCents, 0) / 100,
      extensionRevenue: extensions.reduce((sum, e) => sum + e.grossCents, 0) / 100,
      ledgerIntegrity: integrity.valid
    };
  }

  // ===== CONTRÔLES ADMIN =====

  /**
   * Kill switch - arrêt d'urgence
   */
  async emergencyStop(adminUserId: string, reason: string): Promise<void> {
    console.log(`🚨 VisualFinanceAI Emergency Stop by ${adminUserId}: ${reason}`);
    this.enabled = false;
    
    // En production, ici on stopperait tous les transferts en cours
    // et on sauvegarderait l'état pour audit
    
    await this.recordLedgerEntry({
      orderId: `emergency-stop-${Date.now()}`,
      type: 'emergency_stop',
      grossCents: 0,
      netCents: 0,
      feeCents: 0,
      fromUserId: adminUserId,
      stripeTransferId: `emergency-${Date.now()}`
    });
  }

  /**
   * Récupère toutes les recettes de paiement
   */
  getPayoutRecipes(): PayoutRecipe[] {
    return this.payoutRecipes.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Récupère les entrées du ledger
   */
  getLedgerEntries(limit: number = 100): LedgerEntry[] {
    return this.ledger
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }
}

export const visualFinanceAI = new VisualFinanceAI();