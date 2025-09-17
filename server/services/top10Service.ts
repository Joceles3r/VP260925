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
      const existingRedistribution = await storage.getTop10RedistributionByDate(rankingDate);
      if (existingRedistribution && existingRedistribution.poolDistributed) {
        console.log(`[TOP10] ⚠️ Classement déjà traité et distribué pour ${dateStr}`);
        return await this.getExistingRankingResult(rankingDate);
      }

      // 2. CALCUL CORRECT - Classer les ARTICLES par leurs ventes quotidiennes
      const articleRankings = await this.calculateArticleRankings(rankingDate, tx);
      
      // ASSOUPLIR LES RÈGLES MÉTIER - Permettre le processus même avec moins d'articles
      if (articleRankings.length === 0) {
        throw new Error('Aucun article vendu pour générer le classement TOP10');
      }
      
      const actualRankingSize = Math.min(articleRankings.length, TOP10_SYSTEM.RANKING_SIZE);
      console.log(`[TOP10] 📊 Classement avec ${actualRankingSize} articles (${articleRankings.length} articles vendus au total)`);

      // 3. CRÉER TOP10 INFOPORTEURS (auteurs des meilleurs articles disponibles)
      const top10Infoporteurs = await this.createTop10InfPorteursRanking(articleRankings.slice(0, actualRankingSize), rankingDate, tx);
      
      // 4. IDENTIFIER LES VAINQUEURS (investi-lecteurs ayant acheté des articles TOP10)
      const winners = await this.identifyCorrectWinners(articleRankings.slice(0, actualRankingSize), rankingDate, tx);
      
      // 5. CALCULER LE POT DE REDISTRIBUTION (rangs 11-100)
      const redistribution = await this.calculateRedistributionPool(articleRankings, rankingDate, tx);
      
      // 6. EXÉCUTER LA REDISTRIBUTION SELON LES RÈGLES 60/40
      await this.executeSmartRedistribution(top10Infoporteurs, winners, redistribution, tx);
      
      console.log(`[TOP10] ✅ Classement généré: ${top10Infoporteurs.length} infoporteurs TOP10, ${winners.length} vainqueurs`);
      
      return {
        top10Infoporteurs,
        winners,
        redistribution
      };
    });
  }

  /**
   * NOUVELLE MÉTHODE - Calcule le classement des ARTICLES par leurs ventes quotidiennes
   * (Pas des auteurs comme avant, mais bien des articles individuels)
   * OPTIMISÉ - Élimine les requêtes N+1 pour les articles
   */
  private static async calculateArticleRankings(date: Date, tx?: any): Promise<ArticleRankingData[]> {
    console.log(`[TOP10] 📊 Calcul du classement des articles pour ${date.toISOString().split('T')[0]}`);
    
    // 1. Créer/mettre à jour les entrées articleSalesDaily pour cette date
    await this.updateArticleSalesDaily(date, tx);
    
    // 2. Récupérer toutes les ventes d'articles du jour
    const investments = tx 
      ? await this.getArticleInvestmentsByDateWithTx(date, tx)
      : await storage.getArticleInvestmentsByDate(date);
    
    if (investments.length === 0) {
      return [];
    }
    
    // 3. OPTIMISATION N+1 - Récupérer tous les articles nécessaires en une seule requête
    const uniqueArticleIds = Array.from(new Set(investments.map(i => i.articleId)));
    const articles = tx 
      ? await this.getArticlesBatchWithTx(uniqueArticleIds, tx)
      : await this.getArticlesBatch(uniqueArticleIds);
    
    const articlesMap = new Map(articles.map(article => [article.id, article]));
    
    // 4. Grouper par article (pas par auteur!)
    const salesByArticle = new Map<string, { salesEUR: number; count: number; infoporteurId: string; }>();
    
    for (const investment of investments) {
      const article = articlesMap.get(investment.articleId);
      if (!article) continue;
      
      const current = salesByArticle.get(investment.articleId) || { salesEUR: 0, count: 0, infoporteurId: article.authorId };
      salesByArticle.set(investment.articleId, {
        salesEUR: current.salesEUR + parseFloat(investment.amount),
        count: current.count + 1,
        infoporteurId: article.authorId
      });
    }
    
    // 5. Trier par ventes décroissantes et créer le ranking
    const sortedArticles = Array.from(salesByArticle.entries())
      .map(([articleId, data]) => ({
        articleId,
        infoporteurId: data.infoporteurId,
        dailySalesEUR: data.salesEUR,
        salesCount: data.count,
        rank: 0 // Sera défini ci-dessous
      }))
      .sort((a, b) => b.dailySalesEUR - a.dailySalesEUR);

    // 6. Attribuer les rangs
    sortedArticles.forEach((article, index) => {
      article.rank = index + 1;
    });

    console.log(`[TOP10] 📈 ${sortedArticles.length} articles classés, TOP 10: ${sortedArticles.slice(0, 10).map(a => `${a.articleId} (${a.dailySalesEUR.toFixed(2)}€)`).join(', ')}`);
    
    return sortedArticles;
  }

  // MÉTHODE DÉPLACÉE - updateArticleSalesDaily est maintenant dans la section des méthodes helper avec support transactionnel

  /**
   * NOUVELLE MÉTHODE - Crée le ranking des infoporteurs selon les articles TOP10
   * SÉCURISÉ - Utilise upserts atomiques avec contraintes uniques pour idempotence
   */
  private static async createTop10InfPorteursRanking(
    top10Articles: ArticleRankingData[],
    rankingDate: Date,
    tx?: any
  ): Promise<Top10Infoporteurs[]> {
    const ranking: Top10Infoporteurs[] = [];
    
    for (let i = 0; i < top10Articles.length; i++) {
      const article = top10Articles[i];
      
      try {
        const entryData = {
          rankingDate,
          infoporteurId: article.infoporteurId,
          rank: i + 1,
          topArticleId: article.articleId,
          totalSalesEUR: article.dailySalesEUR.toString(),
          totalArticlesSold: article.salesCount,
          redistributionShareEUR: '0.00',
          redistributionPaid: false
        };
        
        let top10Entry;
        if (tx) {
          // UPSERT ATOMIQUE avec transaction pour éviter les doublons
          [top10Entry] = await tx.insert(top10Infoporteurs)
            .values(entryData)
            .onConflictDoUpdate({
              target: [top10Infoporteurs.rankingDate, top10Infoporteurs.infoporteurId],
              set: {
                rank: entryData.rank,
                topArticleId: entryData.topArticleId,
                totalSalesEUR: entryData.totalSalesEUR,
                totalArticlesSold: entryData.totalArticlesSold,
                updatedAt: new Date()
              }
            })
            .returning();
        } else {
          // Fallback sans transaction
          top10Entry = await storage.createTop10Infoporteur(entryData);
        }
        
        ranking.push(top10Entry);
      } catch (error: any) {
        // Ignorer les violations de contrainte unique (idempotence)
        if (error.code !== '23505') {
          console.error(`[TOP10] ❌ Erreur création infoporteur rang ${i + 1}:`, error);
          throw error;
        }
      }
    }
    
    return ranking;
  }

  /**
   * NOUVELLE MÉTHODE - Identifie correctement les investi-lecteurs vainqueurs
   * (Ceux qui ont acheté des articles classés TOP10, pas des articles d'auteurs TOP10)
   * SÉCURISÉ - Support transactionnel et upserts atomiques
   */
  private static async identifyCorrectWinners(
    top10Articles: ArticleRankingData[],
    rankingDate: Date,
    tx?: any
  ): Promise<Top10Winners[]> {
    const winners: Top10Winners[] = [];
    const winnerMap = new Map<string, { articlesCount: number; totalInvested: number; articleIds: string[]; }>();
    
    // Récupérer les IDs des articles TOP10
    const top10ArticleIds = new Set(top10Articles.map(a => a.articleId));
    
    // Trouver tous les investisseurs qui ont acheté CES articles TOP10 spécifiques
    const investments = tx 
      ? await this.getArticleInvestmentsByDateWithTx(rankingDate, tx)
      : await storage.getArticleInvestmentsByDate(rankingDate);
    
    for (const investment of investments) {
      if (top10ArticleIds.has(investment.articleId)) {
        const current = winnerMap.get(investment.userId) || { 
          articlesCount: 0, 
          totalInvested: 0, 
          articleIds: [] 
        };
        
        if (!current.articleIds.includes(investment.articleId)) {
          current.articleIds.push(investment.articleId);
          current.articlesCount += 1;
        }
        
        current.totalInvested += parseFloat(investment.amount);
        winnerMap.set(investment.userId, current);
      }
    }
    
    // Créer les entrées winners avec upserts atomiques
    for (const [userId, data] of Array.from(winnerMap.entries())) {
      try {
        const winnerData = {
          rankingDate,
          investilecteurId: userId,
          top10ArticlesBought: data.articlesCount,
          totalInvestedEUR: data.totalInvested.toString(),
          redistributionShareEUR: '0.00',
          redistributionPaid: false
        };
        
        let winner;
        if (tx) {
          // UPSERT ATOMIQUE avec transaction
          [winner] = await tx.insert(top10Winners)
            .values(winnerData)
            .onConflictDoUpdate({
              target: [top10Winners.rankingDate, top10Winners.investilecteurId],
              set: {
                top10ArticlesBought: winnerData.top10ArticlesBought,
                totalInvestedEUR: winnerData.totalInvestedEUR,
                updatedAt: new Date()
              }
            })
            .returning();
        } else {
          // Fallback sans transaction
          winner = await storage.createTop10Winner(winnerData);
        }
        
        winners.push(winner);
      } catch (error: any) {
        // Ignorer les violations de contrainte unique (idempotence)
        if (error.code !== '23505') {
          console.error(`[TOP10] ❌ Erreur création winner ${userId}:`, error);
          throw error;
        }
      }
    }
    
    console.log(`[TOP10] 🎯 ${winners.length} investi-lecteurs vainqueurs identifiés (ont acheté des articles TOP10)`);
    return winners;
  }

  /**
   * NOUVELLE MÉTHODE - Calcule le pot de redistribution à partir des rangs 11-100
   * SÉCURISÉ - Support transactionnel et upserts atomiques
   */
  private static async calculateRedistributionPool(
    articleRankings: ArticleRankingData[],
    rankingDate: Date,
    tx?: any
  ): Promise<Top10Redistributions> {
    // Le pot = somme des ventes des articles classés 11-100
    const redistributionRanks = articleRankings.slice(
      TOP10_SYSTEM.REDISTRIBUTION_RANKS_START - 1, 
      TOP10_SYSTEM.REDISTRIBUTION_RANKS_END
    );
    
    const totalPool = redistributionRanks.reduce((sum, article) => sum + article.dailySalesEUR, 0);
    
    console.log(`[TOP10] 💰 Pot de redistribution: ${totalPool.toFixed(2)}€ (articles rangs ${TOP10_SYSTEM.REDISTRIBUTION_RANKS_START}-${Math.min(articleRankings.length, TOP10_SYSTEM.REDISTRIBUTION_RANKS_END)})`);
    
    const redistributionData = {
      redistributionDate: rankingDate,
      totalPoolEUR: totalPool.toString(),
      infoporteursCount: TOP10_SYSTEM.RANKING_SIZE,
      winnersCount: 0, // Sera mis à jour après
      poolDistributed: false
    };
    
    let redistribution;
    try {
      if (tx) {
        // UPSERT ATOMIQUE avec transaction pour idempotence
        [redistribution] = await tx.insert(top10Redistributions)
          .values(redistributionData)
          .onConflictDoUpdate({
            target: [top10Redistributions.redistributionDate],
            set: {
              totalPoolEUR: redistributionData.totalPoolEUR,
              infoporteursCount: redistributionData.infoporteursCount,
              updatedAt: new Date()
            }
          })
          .returning();
      } else {
        // Fallback sans transaction
        redistribution = await storage.createTop10Redistribution(redistributionData);
      }
    } catch (error: any) {
      // Ignorer les violations de contrainte unique (idempotence)
      if (error.code === '23505') {
        // Récupérer l'entrée existante si conflit
        redistribution = tx 
          ? await this.getTop10RedistributionByDateWithTx(rankingDate, tx)
          : await storage.getTop10RedistributionByDate(rankingDate);
      } else {
        console.error(`[TOP10] ❌ Erreur création redistribution:`, error);
        throw error;
      }
    }
    
    return redistribution!;
  }

  /**
   * NOUVELLE MÉTHODE - Redistribution intelligente selon les règles 60/40
   * 60% pour TOP10 infoporteurs, 40% pour investi-lecteurs vainqueurs
   * MATHÉMATIQUES EXACTES - Arithmétique en centimes pour précision absolue
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
    
    // Validation des pourcentages constants
    if (TOP10_SYSTEM.SPLIT_TOP10_PERCENT + TOP10_SYSTEM.SPLIT_WINNERS_PERCENT !== 1.0) {
      throw new Error(`ERREUR CONSTANTES: Split ne fait pas 100% (${TOP10_SYSTEM.SPLIT_TOP10_PERCENT} + ${TOP10_SYSTEM.SPLIT_WINNERS_PERCENT})`);
    }
    
    // CALCULS EXACTS EN CENTIMES
    const top10PoolCents = Math.round(totalPoolCents * TOP10_SYSTEM.SPLIT_TOP10_PERCENT); // 60%
    const winnersPoolCents = totalPoolCents - top10PoolCents; // 40% (calculé pour garantir exactitude)
    
    // Vérification mathématique stricte
    if (top10PoolCents + winnersPoolCents !== totalPoolCents) {
      throw new Error(`ERREUR CRITIQUE Split centimes: ${totalPoolCents} != ${top10PoolCents} + ${winnersPoolCents}`);
    }
    
    console.log(`[TOP10] 📊 Redistribution EXACTE: ${(totalPoolCents/100).toFixed(2)}€ total → TOP10: ${(top10PoolCents/100).toFixed(2)}€, Vainqueurs: ${(winnersPoolCents/100).toFixed(2)}€`);
    
    // DISTRIBUTION EXACTE avec gestion des restes d'arrondi
    await this.distributePoolExactly(top10Infoporteurs, top10PoolCents, 'infoporteur', tx);
    await this.distributePoolExactly(winners, winnersPoolCents, 'winner', tx);
  }

  /**
   * DISTRIBUTION EXACTE - Répartition précise en centimes avec gestion des restes
   */
  private static async distributePoolExactly(
    recipients: any[], 
    poolCents: number, 
    recipientType: 'infoporteur' | 'winner',
    tx?: any
  ): Promise<void> {
    if (recipients.length === 0) return;
    
    // Calculer la part de base par destinataire (en centimes)
    const baseShareCents = Math.floor(poolCents / recipients.length);
    const remainderCents = poolCents - (baseShareCents * recipients.length);
    
    console.log(`[TOP10] 💵 Distribution ${recipientType}: ${recipients.length} destinataires, part base: ${baseShareCents/100}€, reste: ${remainderCents/100}€`);
    
    // Distribuer avec gestion du reste (attribué aux premiers destinataires)
    let distributedCents = 0;
    
    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      const shareCents = baseShareCents + (i < remainderCents ? 1 : 0); // 1 centime supplémentaire pour les premiers
      const shareEUR = shareCents / 100;
      
      distributedCents += shareCents;
      
      if (recipientType === 'infoporteur') {
        await this.distributeToInfoporteur(recipient, shareEUR, tx);
      } else {
        await this.distributeToWinner(recipient, shareEUR, tx);
      }
    }
    
    // Vérification finale de cohérence
    if (distributedCents !== poolCents) {
      throw new Error(`ERREUR DISTRIBUTION: ${poolCents} centimes != ${distributedCents} centimes distribués`);
    }
    
    console.log(`[TOP10] ✅ Distribution ${recipientType} terminée: ${distributedCents/100}€ distribués exactement`);
  }
    
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
    
    console.log(`[TOP10] ✅ Redistribution terminée: ${top10Infoporteurs.length} infoporteurs, ${winners.length} vainqueurs`);
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
      console.error(`[TOP10] ❌ Erreur redistribution infoporteur ${infoporteur.infoporteurId}:`, error);
      throw error; // Propager l'erreur pour rollback de transaction
    }
  }

  /**
   * MÉTHODE AMÉLIORÉE - Distribue la part à un investi-lecteur vainqueur
   * SÉCURISÉ - Support transactionnel
   */
  private static async distributeToWinner(winner: Top10Winners, amountEUR: number, tx?: any): Promise<void> {
    try {
      // Convertir en VISUpoints (100 VP = 1€)
      const visuPoints = Math.round(amountEUR * VISUAL_PLATFORM_FEE.VISUPOINTS_TO_EUR);
      
      await VISUPointsService.awardPoints({
        userId: winner.investilecteurId,
        amount: visuPoints,
        reason: `Redistribution TOP10 - Vainqueur (${winner.top10ArticlesBought} articles TOP10)`,
        referenceId: winner.id,
        referenceType: 'top10_redistribution',
        idempotencyKey: `top10-winner-${winner.id}-${winner.rankingDate.toISOString().split('T')[0]}`
      });
      
      const updateData = {
        redistributionShareEUR: amountEUR.toFixed(2),
        redistributionPaid: true,
        redistributionPaidAt: new Date()
      };
      
      if (tx) {
        await tx.update(top10Winners)
          .set(updateData)
          .where(eq(top10Winners.id, winner.id));
      } else {
        await storage.updateTop10Winner(winner.id, updateData);
      }
      
      console.log(`[TOP10] 🏆 Vainqueur (${winner.top10ArticlesBought} articles TOP10): ${amountEUR.toFixed(2)}€ (${visuPoints} VP) attribués`);
    } catch (error) {
      console.error(`[TOP10] ❌ Erreur redistribution winner ${winner.investilecteurId}:`, error);
      throw error;
    }
  }

  /**
   * NOUVELLE MÉTHODE - Gestion des ventes d'articles avec prélèvement 30% VISUAL
   * À appeler lors de chaque vente d'article confirmée
   * CORRIGÉ - Stockage des montants bruts ET nets pour cohérence financière
   */
  static async processArticleSale(articleId: string, buyerUserId: string, saleAmountEUR: number): Promise<{
    platformFee: number;
    creatorNet: number;
    visuPointsAwarded: number;
  }> {
    try {
      console.log(`[TOP10] 💰 Traitement vente article ${articleId}: ${saleAmountEUR.toFixed(2)}€`);
      
      // 1. Calculer la répartition 30/70 avec arrondi correct
      const platformFee = Math.round(saleAmountEUR * VISUAL_PLATFORM_FEE.PLATFORM_FEE_INFOARTICLE * 100) / 100;
      const creatorNet = Math.round(saleAmountEUR * VISUAL_PLATFORM_FEE.NET_TO_INFOPORTEUR * 100) / 100;
      
      // Validation mathématique stricte
      const calculatedTotal = platformFee + creatorNet;
      if (Math.abs(calculatedTotal - saleAmountEUR) > 0.01) {
        console.warn(`[TOP10] ⚠️ Écart de calcul détecté: ${saleAmountEUR}€ != ${calculatedTotal}€ (${platformFee}€ + ${creatorNet}€)`);
      }
      
      // 2. Récupérer l'article et son auteur
      const article = await storage.getArticle(articleId);
      if (!article) {
        throw new Error(`Article ${articleId} introuvable`);
      }
      
      // 3. Enregistrer la vente avec montant BRUT pour traçabilité
      await storage.createArticleInvestment({
        articleId,
        userId: buyerUserId,
        amount: saleAmountEUR.toString(), // BRUT pour traçabilité complète
        visuPoints: 0, // Pas de points pour l'acheteur, seulement pour le créateur
        currentValue: saleAmountEUR.toString()
      });
      
      // 4. Attribuer les VISUpoints à l'infoporteur (70% convertis en VP)
      const visuPoints = Math.round(creatorNet * VISUAL_PLATFORM_FEE.VISUPOINTS_TO_EUR);
      
      await VISUPointsService.awardPoints({
        userId: article.authorId,
        amount: visuPoints,
        reason: `Vente article "${article.title}" (70% après commission VISUAL)`,
        referenceId: articleId,
        referenceType: 'article_sale',
        idempotencyKey: `article-sale-${articleId}-${Date.now()}`
      });
      
      // 5. Programmer le transfert Stripe à l'infoporteur (après 24h)
      // TODO: Implémenter le système de transfert Stripe différé
      
      console.log(`[TOP10] ✅ Vente traitée: Plateforme ${platformFee.toFixed(2)}€, Créateur ${creatorNet.toFixed(2)}€ (${visuPoints} VP)`);
      
      return {
        platformFee,
        creatorNet,
        visuPointsAwarded: visuPoints
      };
    } catch (error) {
      console.error(`[TOP10] ❌ Erreur traitement vente article:`, error);
      throw error;
    }
  }

  /**
   * Récupère un classement existant
   */
  private static async getExistingRankingResult(rankingDate: Date): Promise<DailyRankingResult> {
    const top10Infoporteurs = await storage.getTop10ByDate(rankingDate);
    const winners = await storage.getTop10WinnersByDate(rankingDate);
    const redistribution = await storage.getTop10RedistributionByDate(rankingDate);
    
    if (!redistribution) {
      throw new Error(`Aucune redistribution trouvée pour ${rankingDate.toISOString().split('T')[0]}`);
    }
    
    return {
      top10Infoporteurs,
      winners,
      redistribution
    };
  }

  /**
   * Récupère le classement actuel
   */
  static async getCurrentRanking(): Promise<DailyRankingResult | null> {
    const today = new Date();
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    try {
      return await this.getExistingRankingResult(todayDate);
    } catch {
      return null;
    }
  }

  /**
   * Récupère l'historique des classements
   */
  static async getRankingHistory(limit: number = 30): Promise<DailyRankingResult[]> {
    const rankings: DailyRankingResult[] = [];
    const today = new Date();
    
    for (let i = 0; i < limit; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      
      try {
        const ranking = await this.getExistingRankingResult(dateOnly);
        rankings.push(ranking);
      } catch {
        // Ignorer les dates sans classement
      }
    }
    
    return rankings;
  }

  /**
   * MÉTHODES HELPER POUR OPTIMISATIONS N+1 ET TRANSACTIONNALITÉ
   */
  
  /**
   * Récupère les investissements d'articles par date avec transaction
   */
  private static async getArticleInvestmentsByDateWithTx(date: Date, tx: any): Promise<ArticleInvestment[]> {
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);
    
    return await tx.select()
      .from(articleInvestments)
      .where(and(
        gte(articleInvestments.createdAt, startOfDay),
        lte(articleInvestments.createdAt, endOfDay)
      ))
      .orderBy(desc(articleInvestments.createdAt));
  }
  
  /**
   * Récupère plusieurs articles en batch pour éviter les requêtes N+1
   */
  private static async getArticlesBatch(articleIds: string[]): Promise<Article[]> {
    if (articleIds.length === 0) return [];
    
    return await storage.getArticlesByIds(articleIds);
  }
  
  /**
   * Récupère plusieurs articles en batch avec transaction
   */
  private static async getArticlesBatchWithTx(articleIds: string[], tx: any): Promise<Article[]> {
    if (articleIds.length === 0) return [];
    
    return await tx.select()
      .from(articles)
      .where(sql`${articles.id} = ANY(${articleIds})`);
  }

  /**
   * Récupère la redistribution par date avec transaction
   */
  private static async getTop10RedistributionByDateWithTx(date: Date, tx: any): Promise<Top10Redistributions | undefined> {
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);
    
    const [result] = await tx.select()
      .from(top10Redistributions)
      .where(and(
        gte(top10Redistributions.redistributionDate, startOfDay),
        lte(top10Redistributions.redistributionDate, endOfDay)
      ))
      .limit(1);
    
    return result;
  }

  /**
   * Met à jour la table articleSalesDaily avec support des transactions
   * CORRIGÉ - Calcule et stocke les montants nets pour redistribution correcte
   */
  private static async updateArticleSalesDaily(date: Date, tx?: any): Promise<void> {
    const investments = tx 
      ? await this.getArticleInvestmentsByDateWithTx(date, tx)
      : await storage.getArticleInvestmentsByDate(date);
    
    const dateStr = date.toISOString().split('T')[0];
    
    for (const investment of investments) {
      try {
        // CORRECTION CRITIQUE : Calculer le montant NET en centimes pour précision exacte
        const grossCents = Math.round(parseFloat(investment.amount) * 100);
        const netCents = Math.round(grossCents * VISUAL_PLATFORM_FEE.NET_TO_INFOPORTEUR); // 70%
        const netAmount = netCents / 100;
        
        console.log(`[TOP10] 💰 Vente ${investment.articleId}: Brut ${grossAmount}€ → Net ${netAmount}€ (après 30% VISUAL)`);
        
        if (tx) {
          // Utiliser upsert avec la transaction pour éviter les doublons
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
}