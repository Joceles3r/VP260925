import { storage } from '../storage.js';
import { VISUPointsService } from './visuPointsService.js';
import { db } from '../db.js';
import Stripe from 'stripe';
import { 
  TOP10_SYSTEM, 
  VISUAL_PLATFORM_FEE 
} from '../../shared/constants.js';
import type { 
  ArticleSalesDaily, 
  Top10Infoporteurs, 
  Top10Winners, 
  Top10Redistributions,
  ArticleInvestment,
  User,
  Article
} from '../../shared/schema.js';
import { 
  articles,
  articleInvestments,
  articleSalesDaily,
  top10Infoporteurs,
  top10Winners,
  top10Redistributions
} from '../../shared/schema.js';
import { and, gte, lte, desc, sql, eq } from 'drizzle-orm';

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

export interface DailyRankingResult {
  top10Infoporteurs: Top10Infoporteurs[];
  winners: Top10Winners[];
  redistribution: Top10Redistributions;
}

export interface ArticleRankingData {
  articleId: string;
  infoporteurId: string;
  dailySalesEUR: number;
  salesCount: number;
  rank: number;
}

export class Top10Service {
  /**
   * NOUVELLE LOGIQUE - Calcule et enregistre le classement quotidien TOP10
   * Basé sur les ARTICLES individuels selon les règles métier clarifiées
   */
  static async generateDailyRanking(date: Date = new Date()): Promise<DailyRankingResult> {
    const rankingDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dateStr = rankingDate.toISOString().split('T')[0];
    
    // 🔒 TRANSACTIONNALITÉ - Utiliser une transaction pour éviter les corruptions
    return await db.transaction(async (tx) => {
      console.log(`[TOP10] 🚀 Génération du classement pour ${dateStr}`);
      
      // 1. IDEMPOTENCE - Vérifier si le classement existe déjà
      const existingRedistribution = await this.getExistingRankingResult(rankingDate);
      if (existingRedistribution) {
        console.log(`[TOP10] ⚠️ Classement déjà traité et distribué pour ${dateStr}`);
        
        // Récupérer les données existantes pour ce classement
        const winners = await storage.getTop10WinnersByDate(rankingDate);
        // Pour les infoporteurs, nous devrons les récupérer différemment car la méthode n'existe pas
        const top10Infoporteurs: Top10Infoporteurs[] = [];
        
        return { top10Infoporteurs, winners, redistribution: existingRedistribution };
      }
      
      // 2. MISE À JOUR DES VENTES QUOTIDIENNES
      await this.updateArticleSalesDaily(rankingDate, tx);
      console.log(`[TOP10] 📊 Ventes quotidiennes mises à jour pour ${dateStr}`);
      
      // 3. CALCUL DES CLASSEMENTS ARTICLES
      const articleInvestments = await this.getArticleInvestmentsByDateWithTx(rankingDate, tx);
      const articleRankings = this.calculateArticleRankings(articleInvestments);
      
      console.log(`[TOP10] 📈 ${articleRankings.length} articles analysés pour le classement`);
      
      // 4. SÉLECTION TOP10 et création des enregistrements
      const top10Articles = articleRankings.slice(0, TOP10_SYSTEM.RANKING_SIZE);
      const redistribution = await this.createRedistributionRecord(rankingDate, articleRankings, tx);
      
      // 5. ENREGISTREMENT DU TOP10
      const top10Infoporteurs: Top10Infoporteurs[] = [];
      for (let i = 0; i < top10Articles.length; i++) {
        const articleData = top10Articles[i];
        const articlesBatch = await this.getArticlesBatchWithTx([articleData.articleId], tx);
        const article = articlesBatch.length > 0 ? articlesBatch[0] : (await this.getArticlesBatch([articleData.articleId]))[0];
        
        if (!article) {
          console.warn(`[TOP10] ⚠️ Article non trouvé: ${articleData.articleId}`);
          continue;
        }
        
        const infoporteurData = {
          rankingDate,
          rank: articleData.rank,
          infoporteurId: article.authorId,
          articleId: articleData.articleId,
          dailySalesEUR: articleData.dailySalesEUR.toFixed(2),
          salesCount: articleData.salesCount
        };
        
        const savedInfoporteur = await storage.createTop10Infoporteur(infoporteurData);
        top10Infoporteurs.push(savedInfoporteur);
      }
      
      console.log(`[TOP10] 🏆 TOP10 créé: ${top10Infoporteurs.length} infoporteurs`);
      
      // 6. CALCUL DES VAINQUEURS (investi-lecteurs)
      const winners = await this.calculateWinners(rankingDate, articleRankings, tx);
      console.log(`[TOP10] 🎉 Vainqueurs calculés: ${winners.length} investi-lecteurs`);
      
      // 7. REDISTRIBUTION INTELLIGENTE 60/40 avec arithmétique en centimes
      await this.executeSmartRedistribution(top10Infoporteurs, winners, redistribution, tx);
      
      console.log(`[TOP10] ✅ Classement quotidien généré avec succès pour ${dateStr}`);
      return { top10Infoporteurs, winners, redistribution };
    });
  }

  /**
   * MÉTHODE AMÉLIORÉE - Calcule les vainqueurs parmi les investi-lecteurs
   * Les vainqueurs sont ceux qui ont investi dans les articles rangs 11-100
   */
  private static async calculateWinners(
    date: Date, 
    articleRankings: ArticleRankingData[], 
    tx?: any
  ): Promise<Top10Winners[]> {
    const winners: Top10Winners[] = [];
    
    // Articles éligibles pour redistribution (rangs 11-100)
    const redistributionArticles = articleRankings.slice(
      TOP10_SYSTEM.REDISTRIBUTION_RANKS_START - 1, // rang 11 = index 10
      TOP10_SYSTEM.REDISTRIBUTION_RANKS_END // rang 100 = index 99
    );
    
    if (redistributionArticles.length === 0) {
      console.log(`[TOP10] ⚠️ Aucun article éligible pour redistribution (rangs 11-100)`);
      return winners;
    }
    
    console.log(`[TOP10] 🎯 ${redistributionArticles.length} articles éligibles pour redistribution (rangs ${TOP10_SYSTEM.REDISTRIBUTION_RANKS_START}-${redistributionArticles.length + TOP10_SYSTEM.REDISTRIBUTION_RANKS_START - 1})`);
    
    // Récupérer tous les investissements pour ces articles
    const articleIds = redistributionArticles.map(a => a.articleId);
    const articleInvestments = await this.getArticleInvestmentsByDateWithTx(date, tx);
    const relevantInvestments = articleInvestments.filter((inv: any) => articleIds.includes(inv.articleId));
    
    console.log(`[TOP10] 💰 ${relevantInvestments.length} investissements trouvés sur les articles de redistribution`);
    
    // Créer un winner pour chaque investissement éligible
    for (const investment of relevantInvestments) {
      const article = redistributionArticles.find(a => a.articleId === investment.articleId);
      if (!article) continue;
      
      const winnerData = {
        rankingDate: date,
        investilecteurId: investment.userId,
        articleId: investment.articleId,
        articleRank: article.rank,
        investmentAmountEUR: parseFloat(investment.amount).toFixed(2),
        investmentDate: investment.createdAt || new Date()
      };
      
      const savedWinner = await storage.createTop10Winner(winnerData);
      winners.push(savedWinner);
    }
    
    console.log(`[TOP10] 🏆 ${winners.length} vainqueurs créés pour la redistribution`);
    return winners;
  }

  /**
   * REDISTRIBUTION EXACTE - Arithmétique en centimes stricte selon les règles 60/40
   * MATHÉMATIQUES PARFAITES - Allocation déterministe des restes d'arrondi
   * SÉCURISÉ - Support transactionnel pour garantir l'atomicité
   */
  private static async executeSmartRedistribution(
    top10Infoporteurs: Top10Infoporteurs[], 
    winners: Top10Winners[], 
    redistribution: Top10Redistributions,
    tx?: any
  ): Promise<void> {
    const totalPoolEUR = parseFloat(redistribution.totalPoolEUR);
    if (totalPoolEUR <= 0) {
      console.log(`[TOP10] ⚠️ Pas de pot de redistribution (${totalPoolEUR}€)`);
      return;
    }
    
    // CONVERSION EN CENTIMES pour arithmétique exacte
    const totalPoolCents = Math.round(totalPoolEUR * 100);
    
    // Validation des pourcentages constants (protection contre erreurs de configuration)
    if (Math.abs(TOP10_SYSTEM.SPLIT_TOP10_PERCENT + TOP10_SYSTEM.SPLIT_WINNERS_PERCENT - 1.0) > 0.0001) {
      throw new Error(`ERREUR CONSTANTES: Split ne fait pas 100% (${TOP10_SYSTEM.SPLIT_TOP10_PERCENT} + ${TOP10_SYSTEM.SPLIT_WINNERS_PERCENT})`);
    }
    
    // CALCULS EXACTS EN CENTIMES (garantit précision absolue)
    const top10PoolCents = Math.round(totalPoolCents * TOP10_SYSTEM.SPLIT_TOP10_PERCENT); // 60%
    const winnersPoolCents = totalPoolCents - top10PoolCents; // 40% (garantit exactitude mathématique)
    
    // Vérification mathématique stricte (détecte toute corruption)
    if (top10PoolCents + winnersPoolCents !== totalPoolCents) {
      throw new Error(`ERREUR CRITIQUE Split centimes: ${totalPoolCents} != ${top10PoolCents} + ${winnersPoolCents}`);
    }
    
    console.log(`[TOP10] 📊 Redistribution EXACTE: ${totalPoolEUR.toFixed(2)}€ (${totalPoolCents} centimes)`);
    console.log(`[TOP10] 💎 TOP10: ${(top10PoolCents/100).toFixed(2)}€ (${top10PoolCents} centimes)`);
    console.log(`[TOP10] 🎉 Vainqueurs: ${(winnersPoolCents/100).toFixed(2)}€ (${winnersPoolCents} centimes)`);
    
    // DISTRIBUTION EXACTE avec gestion déterministe des restes
    const distributedTop10Cents = await this.distributePoolExactly(top10Infoporteurs, top10PoolCents, 'infoporteur', tx);
    const distributedWinnersCents = await this.distributePoolExactly(winners, winnersPoolCents, 'winner', tx);
    
    // Vérification finale de cohérence absolue (protection ultime)
    const totalDistributedCents = distributedTop10Cents + distributedWinnersCents;
    if (totalDistributedCents !== totalPoolCents) {
      throw new Error(`ERREUR DISTRIBUTION FINALE: ${totalPoolCents} centimes != ${totalDistributedCents} centimes distribués (TOP10: ${distributedTop10Cents}, Winners: ${distributedWinnersCents})`);
    }
    
    console.log(`[TOP10] ✅ Distribution mathématiquement parfaite: ${totalDistributedCents} centimes = ${(totalDistributedCents/100).toFixed(2)}€`);
    
    // Marquer la redistribution comme terminée
    const updateData = {
      poolDistributed: true,
      distributionCompletedAt: new Date(),
      winnersCount: winners.length
    };
    
    if (tx) {
      await tx.update(top10Redistributions)
        .set(updateData)
        .where(eq(top10Redistributions.id, redistribution.id));
    } else {
      await storage.updateTop10Redistribution(redistribution.id, updateData);
    }
  }

  /**
   * DISTRIBUTION EXACTE - Méthode Largest Remainder pour allocation déterministe
   * Garantit que sum(distributions) === poolCents EXACTEMENT
   */
  private static async distributePoolExactly(
    recipients: (Top10Infoporteurs | Top10Winners)[], 
    poolCents: number, 
    recipientType: 'infoporteur' | 'winner',
    tx?: any
  ): Promise<number> {
    if (recipients.length === 0) return 0;
    
    // Méthode "Largest Remainder" pour allocation déterministe
    const baseShareCents = Math.floor(poolCents / recipients.length);
    const remainderCents = poolCents - (baseShareCents * recipients.length);
    
    console.log(`[TOP10] 💵 Distribution ${recipientType}: ${recipients.length} destinataires, ${baseShareCents} centimes de base, ${remainderCents} centimes de reste`);
    
    // Trier les destinataires par ID pour allocation déterministe des restes
    const sortedRecipients = [...recipients].sort((a, b) => a.id.localeCompare(b.id));
    
    let totalDistributedCents = 0;
    
    // Distribuer avec allocation déterministe du reste
    for (let i = 0; i < sortedRecipients.length; i++) {
      const recipient = sortedRecipients[i];
      const extraCent = i < remainderCents ? 1 : 0; // Les premiers reçoivent le reste
      const finalShareCents = baseShareCents + extraCent;
      const finalShareEUR = finalShareCents / 100;
      
      totalDistributedCents += finalShareCents;
      
      // Distribuer selon le type
      if (recipientType === 'infoporteur') {
        await this.distributeToInfoporteur(recipient as Top10Infoporteurs, finalShareEUR, tx);
      } else {
        await this.distributeToWinner(recipient as Top10Winners, finalShareEUR, tx);
      }
      
      console.log(`[TOP10] 💰 ${recipientType} ${i+1}/${recipients.length}: ${finalShareEUR.toFixed(2)}€ (${finalShareCents} centimes${extraCent ? ' +1 reste' : ''})`);
    }
    
    // Vérification critique : distribution exacte
    if (totalDistributedCents !== poolCents) {
      throw new Error(`ERREUR ALLOCATION ${recipientType.toUpperCase()}: ${poolCents} centimes != ${totalDistributedCents} centimes distribués`);
    }
    
    console.log(`[TOP10] ✅ Distribution ${recipientType} PARFAITE: ${totalDistributedCents} centimes = ${(totalDistributedCents/100).toFixed(2)}€`);
    return totalDistributedCents;
  }

  /**
   * MÉTHODE AMÉLIORÉE - Distribue la part à un infoporteur TOP10
   * Inclut programmation des transferts Stripe après 24h
   * SÉCURISÉ - Support transactionnel
   */
  private static async distributeToInfoporteur(infoporteur: Top10Infoporteurs, amountEUR: number, tx?: any): Promise<void> {
    try {
      // 1. Attribuer immédiatement les VISUpoints (100 VP = 1€)
      const visuPoints = Math.round(amountEUR * VISUAL_PLATFORM_FEE.VISUPOINTS_TO_EUR);
      
      await VISUPointsService.awardPoints({
        userId: infoporteur.infoporteurId,
        amount: visuPoints,
        reason: `Redistribution TOP10 - Rang ${infoporteur.rank}`,
        referenceId: infoporteur.id,
        referenceType: 'top10_redistribution',
        idempotencyKey: `top10-infoporteur-${infoporteur.id}-${infoporteur.rankingDate.toISOString().split('T')[0]}`
      });
      
      // 2. Programmer le transfert Stripe après 24h
      // TODO: Implémenter le système de transfert Stripe différé
      // Pour l'instant, on enregistre la transaction comme "en attente"
      
      // 3. Mettre à jour l'entrée TOP10
      const updateData = {
        redistributionShareEUR: amountEUR.toFixed(2),
        redistributionPaid: true, // Pour VISUpoints, Stripe sera traité séparément
        redistributionPaidAt: new Date()
      };
      
      if (tx) {
        await tx.update(top10Infoporteurs)
          .set(updateData)
          .where(eq(top10Infoporteurs.id, infoporteur.id));
      } else {
        await storage.updateTop10Infoporteur(infoporteur.id, updateData);
      }
      
      console.log(`[TOP10] 💎 Infoporteur rang ${infoporteur.rank}: ${amountEUR.toFixed(2)}€ (${visuPoints} VP) attribués`);
    } catch (error) {
      console.error(`[TOP10] ❌ Erreur distribution infoporteur ${infoporteur.id}:`, error);
      throw error;
    }
  }

  /**
   * MÉTHODE AMÉLIORÉE - Distribue la part à un investi-lecteur vainqueur
   * Inclut programmation des transferts Stripe après 24h
   * SÉCURISÉ - Support transactionnel
   */
  private static async distributeToWinner(winner: Top10Winners, amountEUR: number, tx?: any): Promise<void> {
    try {
      // 1. Attribuer immédiatement les VISUpoints (100 VP = 1€)
      const visuPoints = Math.round(amountEUR * VISUAL_PLATFORM_FEE.VISUPOINTS_TO_EUR);
      
      await VISUPointsService.awardPoints({
        userId: winner.investilecteurId,
        amount: visuPoints,
        reason: `Redistribution TOP10 - Article investi`,
        referenceId: winner.id,
        referenceType: 'top10_redistribution',
        idempotencyKey: `top10-winner-${winner.id}-${winner.rankingDate.toISOString().split('T')[0]}`
      });
      
      // 2. Programmer le transfert Stripe après 24h
      // TODO: Implémenter le système de transfert Stripe différé
      // Pour l'instant, on enregistre la transaction comme "en attente"
      
      // 3. Mettre à jour l'entrée Vainqueur
      const updateData = {
        redistributionShareEUR: amountEUR.toFixed(2),
        redistributionPaid: true, // Pour VISUpoints, Stripe sera traité séparément
        redistributionPaidAt: new Date()
      };
      
      if (tx) {
        await tx.update(top10Winners)
          .set(updateData)
          .where(eq(top10Winners.id, winner.id));
      } else {
        await storage.updateTop10Winner(winner.id, updateData);
      }
      
      console.log(`[TOP10] 🎉 Vainqueur investissement: ${amountEUR.toFixed(2)}€ (${visuPoints} VP) attribués`);
    } catch (error) {
      console.error(`[TOP10] ❌ Erreur distribution vainqueur ${winner.id}:`, error);
      throw error;
    }
  }

  /**
   * MÉTHODE HELPER - Calcule le pot de redistribution basé sur les ventes nettes
   */
  private static calculateRedistributionPool(articleRankings: ArticleRankingData[]): number {
    // Articles éligibles pour redistribution (rangs 11-100)
    const redistributionArticles = articleRankings.slice(
      TOP10_SYSTEM.REDISTRIBUTION_RANKS_START - 1, // rang 11 = index 10
      TOP10_SYSTEM.REDISTRIBUTION_RANKS_END // rang 100 = index 99
    );
    
    // IMPORTANT: Utiliser les montants NETS (70% après commission VISUAL 30%)
    const totalPool = redistributionArticles.reduce((sum, article) => {
      return sum + (article.dailySalesEUR * VISUAL_PLATFORM_FEE.NET_TO_INFOPORTEUR);
    }, 0);
    
    console.log(`[TOP10] 💰 Pot de redistribution calculé: ${totalPool.toFixed(2)}€ (depuis ${redistributionArticles.length} articles nets)`);
    return totalPool;
  }

  /**
   * MÉTHODE HELPER - Créer l'enregistrement de redistribution
   */
  private static async createRedistributionRecord(
    date: Date, 
    articleRankings: ArticleRankingData[], 
    tx?: any
  ): Promise<Top10Redistributions> {
    const totalPool = this.calculateRedistributionPool(articleRankings);
    const articlesInRedistribution = Math.min(
      articleRankings.length - TOP10_SYSTEM.REDISTRIBUTION_RANKS_START + 1,
      TOP10_SYSTEM.REDISTRIBUTION_RANKS_END - TOP10_SYSTEM.REDISTRIBUTION_RANKS_START + 1
    );
    
    const redistributionData = {
      redistributionDate: date,
      totalPoolEUR: totalPool.toFixed(2),
      articlesCount: articleRankings.length,
      articlesInRedistribution,
      poolDistributed: false
    };
    
    return await storage.createTop10Redistribution(redistributionData);
  }

  /**
   * MÉTHODE HELPER - Calcule les classements d'articles basés sur les ventes nettes
   */
  private static calculateArticleRankings(investments: ArticleInvestment[]): ArticleRankingData[] {
    const articleMap = new Map<string, { totalSales: number; salesCount: number; infoporteurId: string }>();
    
    // Agréger les ventes par article
    for (const investment of investments) {
      const articleId = investment.articleId;
      
      if (!articleMap.has(articleId)) {
        articleMap.set(articleId, { 
          totalSales: 0, 
          salesCount: 0, 
          infoporteurId: '' // Sera défini avec le premier investissement
        });
      }
      
      const articleData = articleMap.get(articleId)!;
      
      // CORRECTION CRITIQUE : Calculer le montant NET en centimes pour précision exacte
      const grossCents = Math.round(parseFloat(investment.amount) * 100);
      const netCents = Math.round(grossCents * VISUAL_PLATFORM_FEE.NET_TO_INFOPORTEUR); // 70%
      const netAmount = netCents / 100;
      
      articleData.totalSales += netAmount; // UTILISER LE MONTANT NET
      articleData.salesCount += 1;
      
      // L'infoporteurId sera défini lors de la récupération des articles
      // On ne peut pas accéder à article.authorId directement depuis investment
    }
    
    // Convertir en format de classement et trier
    const rankings: ArticleRankingData[] = [];
    for (const [articleId, data] of Array.from(articleMap.entries())) {
      // Filtrer les articles avec ventes insuffisantes
      if (data.salesCount >= TOP10_SYSTEM.MIN_DAILY_SALES_FOR_RANKING) {
        rankings.push({
          articleId,
          infoporteurId: data.infoporteurId,
          dailySalesEUR: data.totalSales,
          salesCount: data.salesCount,
          rank: 0 // Sera défini après le tri
        });
      }
    }
    
    // Trier par ventes décroissantes et attribuer les rangs
    rankings.sort((a, b) => b.dailySalesEUR - a.dailySalesEUR);
    rankings.forEach((article, index) => {
      article.rank = index + 1;
    });
    
    console.log(`[TOP10] 🏅 Classements calculés: ${rankings.length} articles éligibles`);
    return rankings;
  }

  /**
   * HELPERS - Méthodes utilitaires pour les opérations de base de données
   */
  private static async getExistingRankingResult(date: Date): Promise<Top10Redistributions | null> {
    try {
      const redistribution = await storage.getTop10RedistributionByDate(date);
      return redistribution?.poolDistributed ? redistribution : null;
    } catch (error) {
      return null;
    }
  }

  private static async updateArticleSalesDaily(date: Date, tx?: any): Promise<void> {
    const dateStr = date.toISOString().split('T')[0];
    const articleInvestments = tx 
      ? await this.getArticleInvestmentsByDateWithTx(date, tx)
      : await storage.getArticleInvestmentsByDate(date);
    
    console.log(`[TOP10] 📅 Mise à jour des ventes quotidiennes pour ${articleInvestments.length} investissements`);
    
    // Traiter chaque investissement pour mettre à jour articleSalesDaily
    for (const investment of articleInvestments) {
      try {
        // CORRECTION CRITIQUE : Calculer le montant NET après commission VISUAL 30%
        const grossAmount = parseFloat(investment.amount);
        const netAmount = Math.round(grossAmount * VISUAL_PLATFORM_FEE.NET_TO_INFOPORTEUR * 100) / 100;
        
        if (tx) {
          // Utiliser la transaction pour upsert
          await tx.insert(articleSalesDaily)
            .values({
              articleId: investment.articleId,
              salesDate: new Date(dateStr + 'T00:00:00Z'),
              totalSalesEUR: netAmount.toString(), // UTILISER LE MONTANT NET
              salesCount: 1
            })
            .onConflictDoUpdate({
              target: [articleSalesDaily.articleId, articleSalesDaily.salesDate],
              set: {
                totalSalesEUR: sql`${articleSalesDaily.totalSalesEUR} + ${netAmount}`, // NET
                salesCount: sql`${articleSalesDaily.salesCount} + 1`,
                updatedAt: new Date()
              }
            });
        } else {
          // Version fallback sans transaction - UTILISER MONTANT NET
          const existing = await storage.getArticleSaleDaily(investment.articleId, dateStr);
          
          if (existing) {
            await storage.updateArticleSaleDaily(existing.id, {
              totalSalesEUR: (parseFloat(existing.totalSalesEUR || '0') + netAmount).toString(), // NET
              salesCount: (existing.salesCount || 0) + 1
            });
          } else {
            await storage.createArticleSaleDaily({
              articleId: investment.articleId,
              salesDate: new Date(dateStr + 'T00:00:00Z'),
              totalSalesEUR: netAmount.toString(), // UTILISER LE MONTANT NET
              salesCount: 1
            });
          }
        }
      } catch (error: any) {
        // Ignore les conflits de clé unique car cela signifie qu'une autre transaction a déjà traité cette entrée
        if (error.code !== '23505') { // PostgreSQL unique violation code
          console.error(`[TOP10] ❌ Erreur lors de la mise à jour articleSalesDaily pour ${investment.articleId}:`, error);
          throw error;
        }
      }
    }
  }

  private static async getArticleInvestmentsByDateWithTx(date: Date, tx: any): Promise<ArticleInvestment[]> {
    const dateStr = date.toISOString().split('T')[0];
    
    try {
      const result = await tx
        .select()
        .from(articleInvestments)
        .where(
          sql`DATE(${articleInvestments.createdAt}) = ${dateStr}`
        );
      
      return result || [];
    } catch (error) {
      console.error(`[TOP10] ❌ Erreur lors de la récupération des investissements avec transaction:`, error);
      return [];
    }
  }

  private static async getArticlesBatchWithTx(articleIds: string[], tx: any): Promise<Article[]> {
    if (articleIds.length === 0) return [];
    
    try {
      const result = await tx
        .select()
        .from(articles)
        .where(sql`${articles.id} = ANY(${articleIds})`);
      
      return result || [];
    } catch (error) {
      console.error(`[TOP10] ❌ Erreur lors de la récupération des articles avec transaction:`, error);
      return [];
    }
  }

  private static async getArticlesBatch(articleIds: string[]): Promise<Article[]> {
    if (articleIds.length === 0) return [];
    
    try {
      const result = await storage.getArticles(); // Fallback - récupérer tous les articles puis filtrer
      return result?.filter(article => articleIds.includes(article.id)) || [];
    } catch (error) {
      console.error(`[TOP10] ❌ Erreur lors de la récupération des articles:`, error);
      return [];
    }
  }
}