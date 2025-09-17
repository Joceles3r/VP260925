import { storage } from '../storage.js';
import { VISUPointsService } from './visuPointsService.js';
import type { 
  ArticleSalesDaily, 
  Top10Infoporteurs, 
  Top10Winners, 
  Top10Redistributions,
  ArticleInvestment,
  User
} from '../../shared/schema.js';

export interface DailyRankingResult {
  top10Infoporteurs: Top10Infoporteurs[];
  winners: Top10Winners[];
  redistribution: Top10Redistributions;
}

export class Top10Service {
  /**
   * Calcule et enregistre le classement quotidien TOP10
   * Appelé automatiquement chaque jour à 00:00
   */
  static async generateDailyRanking(date: Date = new Date()): Promise<DailyRankingResult> {
    const rankingDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    try {
      console.log(`[TOP10] Génération du classement pour ${rankingDate.toISOString().split('T')[0]}`);
      
      // 1. Vérifier si le classement existe déjà pour cette date
      const existingRanking = await storage.getTop10ByDate(rankingDate);
      if (existingRanking && existingRanking.length > 0) {
        console.log(`[TOP10] Classement déjà existant pour cette date`);
        return await this.getExistingRankingResult(rankingDate);
      }

      // 2. Calculer les ventes totales par infoporteur pour la journée
      const salesData = await this.calculateDailySales(rankingDate);
      
      // 3. Classer les infoporteurs (TOP10)
      const top10Infoporteurs = await this.createTop10Ranking(salesData, rankingDate);
      
      // 4. Identifier les investi-lecteurs vainqueurs
      const winners = await this.identifyWinners(top10Infoporteurs, rankingDate);
      
      // 5. Calculer le pot de redistribution (rangs 11-100)
      const redistribution = await this.calculateRedistribution(salesData, rankingDate);
      
      // 6. Exécuter la redistribution
      await this.executeRedistribution(top10Infoporteurs, winners, redistribution);
      
      console.log(`[TOP10] Classement généré: ${top10Infoporteurs.length} infoporteurs TOP10, ${winners.length} vainqueurs`);
      
      return {
        top10Infoporteurs,
        winners,
        redistribution
      };
    } catch (error) {
      console.error(`[TOP10] Erreur lors de la génération du classement:`, error);
      throw error;
    }
  }

  /**
   * Calcule les ventes quotidiennes par infoporteur
   */
  private static async calculateDailySales(date: Date): Promise<{ infoporteurId: string; totalSales: number; articlesCount: number; }[]> {
    // Récupérer tous les investments d'articles pour la journée
    const investments = await storage.getArticleInvestmentsByDate(date);
    
    // Grouper par infoporteur (auteur de l'article)
    const salesByInfoporteur = new Map<string, { totalSales: number; articlesCount: number; }>();
    
    for (const investment of investments) {
      const article = await storage.getArticle(investment.articleId);
      if (!article) continue;
      
      const infoporteurId = article.authorId;
      const current = salesByInfoporteur.get(infoporteurId) || { totalSales: 0, articlesCount: 0 };
      
      salesByInfoporteur.set(infoporteurId, {
        totalSales: current.totalSales + parseFloat(investment.amount),
        articlesCount: current.articlesCount + 1
      });
    }
    
    // Convertir en array et trier par ventes décroissantes
    return Array.from(salesByInfoporteur.entries())
      .map(([infoporteurId, data]) => ({
        infoporteurId,
        totalSales: data.totalSales,
        articlesCount: data.articlesCount
      }))
      .sort((a, b) => b.totalSales - a.totalSales);
  }

  /**
   * Crée le classement TOP10 des infoporteurs
   */
  private static async createTop10Ranking(
    salesData: { infoporteurId: string; totalSales: number; articlesCount: number; }[], 
    rankingDate: Date
  ): Promise<Top10Infoporteurs[]> {
    const top10 = salesData.slice(0, 10); // Prendre les 10 premiers
    const ranking: Top10Infoporteurs[] = [];
    
    for (let i = 0; i < top10.length; i++) {
      const data = top10[i];
      const top10Entry = await storage.createTop10Infoporteur({
        rankingDate,
        infoporteurId: data.infoporteurId,
        rank: i + 1,
        totalSalesEUR: data.totalSales.toString(),
        totalArticlesSold: data.articlesCount,
        redistributionShareEUR: '0.00', // Sera calculé lors de la redistribution
        redistributionPaid: false
      });
      
      ranking.push(top10Entry);
    }
    
    return ranking;
  }

  /**
   * Identifie les investi-lecteurs vainqueurs (qui ont acheté des articles du TOP10)
   */
  private static async identifyWinners(
    top10Infoporteurs: Top10Infoporteurs[], 
    rankingDate: Date
  ): Promise<Top10Winners[]> {
    const winners: Top10Winners[] = [];
    const winnerMap = new Map<string, { articlesCount: number; totalInvested: number; }>();
    
    // Récupérer tous les articles des infoporteurs TOP10
    const top10ArticleIds = new Set<string>();
    for (const infoporteur of top10Infoporteurs) {
      const articles = await storage.getArticlesByAuthor(infoporteur.infoporteurId);
      articles.forEach(article => top10ArticleIds.add(article.id));
    }
    
    // Trouver tous les investisseurs qui ont acheté ces articles
    const investments = await storage.getArticleInvestmentsByDate(rankingDate);
    
    for (const investment of investments) {
      if (top10ArticleIds.has(investment.articleId)) {
        const current = winnerMap.get(investment.userId) || { articlesCount: 0, totalInvested: 0 };
        winnerMap.set(investment.userId, {
          articlesCount: current.articlesCount + 1,
          totalInvested: current.totalInvested + parseFloat(investment.amount)
        });
      }
    }
    
    // Créer les entrées winners
    for (const [userId, data] of Array.from(winnerMap.entries())) {
      const winner = await storage.createTop10Winner({
        rankingDate,
        investilecteurId: userId,
        top10ArticlesBought: data.articlesCount,
        totalInvestedEUR: data.totalInvested.toString(),
        redistributionShareEUR: '0.00', // Sera calculé lors de la redistribution
        redistributionPaid: false
      });
      
      winners.push(winner);
    }
    
    return winners;
  }

  /**
   * Calcule le pot de redistribution (sommes des rangs 11-100)
   */
  private static async calculateRedistribution(
    salesData: { infoporteurId: string; totalSales: number; articlesCount: number; }[], 
    rankingDate: Date
  ): Promise<Top10Redistributions> {
    // Le pot commun = sommes investies par les infoporteurs classés 11-100
    const ranks11to100 = salesData.slice(10, 100); // Rangs 11 à 100
    const totalPool = ranks11to100.reduce((sum, data) => sum + data.totalSales, 0);
    
    const redistribution = await storage.createTop10Redistribution({
      redistributionDate: rankingDate,
      totalPoolEUR: totalPool.toString(),
      infoporteursCount: Math.min(salesData.length, 10), // Nombre d'infoporteurs TOP10
      winnersCount: 0, // Sera mis à jour après identification des winners
      poolDistributed: false
    });
    
    return redistribution;
  }

  /**
   * Exécute la redistribution du pot commun
   */
  private static async executeRedistribution(
    top10Infoporteurs: Top10Infoporteurs[], 
    winners: Top10Winners[], 
    redistribution: Top10Redistributions
  ): Promise<void> {
    const totalPool = parseFloat(redistribution.totalPoolEUR);
    if (totalPool <= 0) {
      console.log(`[TOP10] Pas de pot de redistribution (${totalPool}€)`);
      return;
    }
    
    const totalRecipients = top10Infoporteurs.length + winners.length;
    if (totalRecipients === 0) {
      console.log(`[TOP10] Aucun bénéficiaire pour la redistribution`);
      return;
    }
    
    const sharePerRecipient = totalPool / totalRecipients;
    
    console.log(`[TOP10] Redistribution de ${totalPool}€ entre ${totalRecipients} bénéficiaires (${sharePerRecipient.toFixed(2)}€ chacun)`);
    
    // Redistribuer aux TOP10 infoporteurs
    for (const infoporteur of top10Infoporteurs) {
      await this.distributeToInfoporteur(infoporteur, sharePerRecipient);
    }
    
    // Redistribuer aux investi-lecteurs vainqueurs
    for (const winner of winners) {
      await this.distributeToWinner(winner, sharePerRecipient);
    }
    
    // Marquer la redistribution comme terminée
    await storage.updateTop10Redistribution(redistribution.id, {
      poolDistributed: true,
      distributionCompletedAt: new Date(),
      winnersCount: winners.length
    });
  }

  /**
   * Distribue la part à un infoporteur TOP10
   */
  private static async distributeToInfoporteur(infoporteur: Top10Infoporteurs, amountEUR: number): Promise<void> {
    try {
      // Convertir en VISUpoints (100 VP = 1€)
      const visuPoints = Math.round(amountEUR * 100);
      
      // Attribuer les VISUpoints
      await VISUPointsService.awardPoints({
        userId: infoporteur.infoporteurId,
        amount: visuPoints,
        reason: `Redistribution TOP10 - Rang ${infoporteur.rank}`,
        referenceId: infoporteur.id,
        referenceType: 'top10_redistribution',
        idempotencyKey: `top10-infoporteur-${infoporteur.id}`
      });
      
      // Mettre à jour l'entrée TOP10
      await storage.updateTop10Infoporteur(infoporteur.id, {
        redistributionShareEUR: amountEUR.toString(),
        redistributionPaid: true,
        redistributionPaidAt: new Date()
      });
      
      console.log(`[TOP10] Redistribué ${amountEUR.toFixed(2)}€ (${visuPoints} VP) à l'infoporteur rang ${infoporteur.rank}`);
    } catch (error) {
      console.error(`[TOP10] Erreur redistribution infoporteur ${infoporteur.infoporteurId}:`, error);
    }
  }

  /**
   * Distribue la part à un investi-lecteur vainqueur
   */
  private static async distributeToWinner(winner: Top10Winners, amountEUR: number): Promise<void> {
    try {
      // Convertir en VISUpoints (100 VP = 1€)
      const visuPoints = Math.round(amountEUR * 100);
      
      // Attribuer les VISUpoints
      await VISUPointsService.awardPoints({
        userId: winner.investilecteurId,
        amount: visuPoints,
        reason: `Redistribution TOP10 - Vainqueur (${winner.top10ArticlesBought} articles)`,
        referenceId: winner.id,
        referenceType: 'top10_redistribution',
        idempotencyKey: `top10-winner-${winner.id}`
      });
      
      // Mettre à jour l'entrée winner
      await storage.updateTop10Winner(winner.id, {
        redistributionShareEUR: amountEUR.toString(),
        redistributionPaid: true,
        redistributionPaidAt: new Date()
      });
      
      console.log(`[TOP10] Redistribué ${amountEUR.toFixed(2)}€ (${visuPoints} VP) au vainqueur (${winner.top10ArticlesBought} articles TOP10)`);
    } catch (error) {
      console.error(`[TOP10] Erreur redistribution winner ${winner.investilecteurId}:`, error);
    }
  }

  /**
   * Récupère un classement existant
   */
  private static async getExistingRankingResult(rankingDate: Date): Promise<DailyRankingResult> {
    const top10Infoporteurs = await storage.getTop10ByDate(rankingDate);
    const winners = await storage.getTop10WinnersByDate(rankingDate);
    const redistributions = await storage.getTop10RedistributionByDate(rankingDate);
    
    return {
      top10Infoporteurs,
      winners,
      redistribution: redistributions!
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
}