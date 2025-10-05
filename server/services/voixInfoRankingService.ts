import { db } from "../db";
import {
  dailyRankings,
  dailyPotDistribution,
  articlePurchases,
  voixInfoArticles,
  infoporteurProfiles,
  investiLecteurProfiles,
  goldenTickets,
  visuPointsTransactions
} from "@shared/schema";
import { eq, and, desc, sum, count, sql, inArray } from "drizzle-orm";
import { VOIX_INFO_CONFIG } from "./voixInfoService";
import type { DailyRanking, DailyPotDistribution, InsertVisuPointsTransaction } from "@shared/schema";

interface RankingCalculation {
  infoporteurId: string;
  totalSales: number;
  totalRevenue: number;
  rank: number;
  isTop10: boolean;
}

interface PotDistributionCalculation {
  totalPotEuros: number;
  top10InfoporteurShare: number;
  investiLecteurShare: number;
  totalWinningVotes: number;
  totalWinningInvestiLecteurs: number;
}

interface GoldenTicketRefund {
  ticketId: string;
  investiLecteurId: string;
  refundPercentage: number;
  refundAmount: number;
}

export class VoixInfoRankingService {

  // ===== CALCUL DES CLASSEMENTS QUOTIDIENS =====

  async calculateAndStoreDailyRankings(date: string): Promise<DailyRanking[]> {
    console.log(`🏆 Calcul des classements pour le ${date}...`);

    try {
      // 1. Calculer les statistiques de vente par infoporteur
      const salesStats = await this.calculateSalesStatsByDate(date);
      
      if (salesStats.length === 0) {
        console.log(`ℹ️  Aucune vente trouvée pour le ${date}`);
        return [];
      }

      // 2. Créer les classements avec rangs
      const rankings = await this.createRankingsFromStats(salesStats, date);

      // 3. Calculer et distribuer le pot commun
      await this.calculateAndDistributePot(date, rankings);

      // 4. Traiter les remboursements Golden Ticket
      await this.processGoldenTicketRefunds(date, rankings);

      console.log(`✅ Classements calculés pour ${date}: ${rankings.length} infoporteurs classés`);
      
      return rankings;

    } catch (error) {
      console.error(`❌ Erreur lors du calcul des classements pour ${date}:`, error);
      throw error;
    }
  }

  private async calculateSalesStatsByDate(date: string): Promise<RankingCalculation[]> {
    // Calculer les ventes par infoporteur pour la date donnée
    const salesQuery = await db
      .select({
        infoporteurId: voixInfoArticles.infoporteurId,
        totalSales: count(articlePurchases.id).as('totalSales'),
        totalRevenue: sum(articlePurchases.priceEuros).as('totalRevenue')
      })
      .from(articlePurchases)
      .innerJoin(voixInfoArticles, eq(articlePurchases.articleId, voixInfoArticles.id))
      .where(sql`DATE(${articlePurchases.createdAt}) = ${date}`)
      .groupBy(voixInfoArticles.infoporteurId)
      .orderBy(
        desc(count(articlePurchases.id)), // D'abord par nombre de ventes
        desc(sum(articlePurchases.priceEuros)) // Puis par revenu total
      );

    // Transformer en format de classement avec rang
    const rankings: RankingCalculation[] = salesQuery.map((stat, index) => ({
      infoporteurId: stat.infoporteurId,
      totalSales: Number(stat.totalSales),
      totalRevenue: Number(stat.totalRevenue || 0),
      rank: index + 1,
      isTop10: (index + 1) <= 10
    }));

    return rankings;
  }

  private async createRankingsFromStats(stats: RankingCalculation[], date: string): Promise<DailyRanking[]> {
    const rankings: DailyRanking[] = [];

    for (const stat of stats) {
      const rankingData = {
        rankingDate: date,
        infoporteurId: stat.infoporteurId,
        rank: stat.rank,
        totalSales: stat.totalSales,
        totalRevenue: stat.totalRevenue.toString(),
        isTop10: stat.isTop10,
        bonusEarned: '0.00', // Sera calculé lors de la distribution
        status: 'completed' as any
      };

      const [ranking] = await db
        .insert(dailyRankings)
        .values(rankingData)
        .onConflictDoUpdate({
          target: [dailyRankings.rankingDate, dailyRankings.infoporteurId],
          set: {
            rank: stat.rank,
            totalSales: stat.totalSales,
            totalRevenue: stat.totalRevenue.toString(),
            isTop10: stat.isTop10,
            updatedAt: new Date()
          }
        })
        .returning();

      rankings.push(ranking);
    }

    return rankings;
  }

  // ===== CALCUL ET DISTRIBUTION DU POT COMMUN =====

  async calculateAndDistributePot(date: string, rankings: DailyRanking[]): Promise<DailyPotDistribution | null> {
    console.log(`💰 Calcul du pot commun pour le ${date}...`);

    // Récupérer les infoporteurs TOP 10 et rangs 11+
    const top10Ids = rankings.filter(r => r.isTop10).map(r => r.infoporteurId);
    const ranks11PlusIds = rankings.filter(r => !r.isTop10).map(r => r.infoporteurId);

    if (ranks11PlusIds.length === 0) {
      console.log(`ℹ️  Aucun infoporteur en rang 11+ pour constituer le pot commun`);
      return null;
    }

    // Calculer le pot commun (70% des ventes des rangs 11+)
    const potCalculation = await this.calculatePotAmount(date, top10Ids, ranks11PlusIds);
    
    if (potCalculation.totalPotEuros === 0) {
      console.log(`ℹ️  Pot commun vide pour le ${date}`);
      return null;
    }

    // Créer l'enregistrement de distribution
    const distributionData = {
      distributionDate: date,
      totalPotEuros: potCalculation.totalPotEuros.toString(),
      top10InfoporteurShare: potCalculation.top10InfoporteurShare.toString(),
      investiLecteurShare: potCalculation.investiLecteurShare.toString(),
      totalWinningVotes: potCalculation.totalWinningVotes,
      totalWinningInvestiLecteurs: potCalculation.totalWinningInvestiLecteurs,
      visualCommission: '0.00', // 0% selon validation
      status: 'completed' as any,
      processedAt: new Date()
    };

    const [distribution] = await db
      .insert(dailyPotDistribution)
      .values(distributionData)
      .onConflictDoUpdate({
        target: [dailyPotDistribution.distributionDate],
        set: distributionData
      })
      .returning();

    // Distribuer les gains
    await this.distributePotToWinners(date, distribution, top10Ids);

    console.log(`✅ Pot distribué: ${potCalculation.totalPotEuros}€ répartis`);
    
    return distribution;
  }

  private async calculatePotAmount(date: string, top10Ids: string[], ranks11PlusIds: string[]): Promise<PotDistributionCalculation> {
    // Calculer le montant total généré par les rangs 11+ (devient le pot commun)
    const ranksRevenue = await db
      .select({
        totalRevenue: sum(articlePurchases.priceEuros).as('totalRevenue')
      })
      .from(articlePurchases)
      .innerJoin(voixInfoArticles, eq(articlePurchases.articleId, voixInfoArticles.id))
      .where(and(
        sql`DATE(${articlePurchases.createdAt}) = ${date}`,
        inArray(voixInfoArticles.infoporteurId, ranks11PlusIds)
      ));

    // Le pot = 70% des revenus des rangs 11+ (les 30% restants vont à VISUAL)
    const totalRevenueRanks11Plus = Number(ranksRevenue[0]?.totalRevenue || 0);
    const totalPotEuros = totalRevenueRanks11Plus * (VOIX_INFO_CONFIG.revenueSharing.directSales.infoporteur / 100);

    // Répartition 50/50 entre TOP 10 infoporteurs et investi-lecteurs gagnants
    const top10InfoporteurShare = totalPotEuros * (VOIX_INFO_CONFIG.revenueSharing.potCommun.infoporteurs / 100);
    const investiLecteurShare = totalPotEuros * (VOIX_INFO_CONFIG.revenueSharing.potCommun.investiLecteurs / 100);

    // Calculer les votes gagnants (investi-lecteurs ayant soutenu le TOP 10)
    const winningVotes = await db
      .select({
        totalVotes: sum(articlePurchases.votes).as('totalVotes'),
        uniqueInvestiLecteurs: count(sql`DISTINCT ${articlePurchases.investiLecteurId}`).as('uniqueInvestiLecteurs')
      })
      .from(articlePurchases)
      .innerJoin(voixInfoArticles, eq(articlePurchases.articleId, voixInfoArticles.id))
      .where(and(
        sql`DATE(${articlePurchases.createdAt}) = ${date}`,
        inArray(voixInfoArticles.infoporteurId, top10Ids)
      ));

    return {
      totalPotEuros,
      top10InfoporteurShare,
      investiLecteurShare,
      totalWinningVotes: Number(winningVotes[0]?.totalVotes || 0),
      totalWinningInvestiLecteurs: Number(winningVotes[0]?.uniqueInvestiLecteurs || 0)
    };
  }

  private async distributePotToWinners(date: string, distribution: DailyPotDistribution, top10Ids: string[]): Promise<void> {
    // 1. Distribuer aux TOP 10 infoporteurs (répartition égale)
    await this.distributePotToTop10Infoporteurs(date, distribution, top10Ids);

    // 2. Distribuer aux investi-lecteurs gagnants (prorata des votes)
    await this.distributePotToWinningInvestiLecteurs(date, distribution, top10Ids);
  }

  private async distributePotToTop10Infoporteurs(date: string, distribution: DailyPotDistribution, top10Ids: string[]): Promise<void> {
    if (top10Ids.length === 0) return;

    const bonusPerInfoporteur = Number(distribution.top10InfoporteurShare) / top10Ids.length;

    for (const infoporteurId of top10Ids) {
      // Mettre à jour le ranking avec le bonus
      await db
        .update(dailyRankings)
        .set({ 
          bonusEarned: bonusPerInfoporteur.toString(),
          updatedAt: new Date()
        })
        .where(and(
          eq(dailyRankings.rankingDate, date),
          eq(dailyRankings.infoporteurId, infoporteurId)
        ));

      // Récupérer l'infoporteur profile pour obtenir l'userId
      const [infoporteur] = await db
        .select({ userId: infoporteurProfiles.userId })
        .from(infoporteurProfiles)
        .where(eq(infoporteurProfiles.id, infoporteurId))
        .limit(1);

      if (infoporteur) {
        // Créer une transaction de bonus VISUpoints
        const bonusVP = Math.floor(bonusPerInfoporteur * VOIX_INFO_CONFIG.conversion.pointsPerEuro);
        
        await this.addBonusVisuPoints(
          infoporteur.userId,
          bonusVP,
          `Bonus TOP 10 du ${date} (${bonusPerInfoporteur.toFixed(2)}€)`,
          date,
          'daily_ranking_bonus'
        );
      }
    }
  }

  private async distributePotToWinningInvestiLecteurs(date: string, distribution: DailyPotDistribution, top10Ids: string[]): Promise<void> {
    // Récupérer tous les investissements sur les TOP 10 avec leurs votes
    const winningInvestments = await db
      .select({
        investiLecteurId: articlePurchases.investiLecteurId,
        userId: investiLecteurProfiles.userId,
        votes: articlePurchases.votes
      })
      .from(articlePurchases)
      .innerJoin(voixInfoArticles, eq(articlePurchases.articleId, voixInfoArticles.id))
      .innerJoin(investiLecteurProfiles, eq(articlePurchases.investiLecteurId, investiLecteurProfiles.id))
      .where(and(
        sql`DATE(${articlePurchases.createdAt}) = ${date}`,
        inArray(voixInfoArticles.infoporteurId, top10Ids)
      ));

    if (winningInvestments.length === 0 || Number(distribution.totalWinningVotes) === 0) return;

    const totalBonusEuros = Number(distribution.investiLecteurShare);
    const totalVotes = Number(distribution.totalWinningVotes);

    // Grouper par investi-lecteur et sommer leurs votes
    const investiLecteurVotes = new Map<string, { userId: string; totalVotes: number }>();
    
    for (const investment of winningInvestments) {
      const existing = investiLecteurVotes.get(investment.investiLecteurId);
      if (existing) {
        existing.totalVotes += investment.votes;
      } else {
        investiLecteurVotes.set(investment.investiLecteurId, {
          userId: investment.userId,
          totalVotes: investment.votes
        });
      }
    }

    // Distribuer les bonus proportionnellement aux votes
    for (const [investiLecteurId, data] of investiLecteurVotes) {
      const bonusRatio = data.totalVotes / totalVotes;
      const bonusEuros = totalBonusEuros * bonusRatio;
      const bonusVP = Math.floor(bonusEuros * VOIX_INFO_CONFIG.conversion.pointsPerEuro);

      if (bonusVP > 0) {
        await this.addBonusVisuPoints(
          data.userId,
          bonusVP,
          `Bonus investi-lecteur TOP 10 du ${date} (${bonusEuros.toFixed(2)}€ - ${data.totalVotes} votes)`,
          investiLecteurId,
          'daily_investor_bonus'
        );
      }
    }
  }

  private async addBonusVisuPoints(userId: string, amount: number, description: string, relatedId: string, relatedType: string): Promise<void> {
    // Récupérer le solde actuel
    const currentBalance = await this.getCurrentVisuPointsBalance(userId);
    const newBalance = currentBalance + amount;

    // Créer la transaction de bonus
    const transactionData: InsertVisuPointsTransaction = {
      userId,
      type: 'bonus',
      amount,
      balanceBefore: currentBalance,
      balanceAfter: newBalance,
      euroAmount: amount * VOIX_INFO_CONFIG.conversion.euroPerPoint,
      description,
      relatedId,
      relatedType
    };

    await db.insert(visuPointsTransactions).values(transactionData);

    // Mettre à jour le solde si c'est un investi-lecteur
    await db
      .update(investiLecteurProfiles)
      .set({ 
        visuPoints: newBalance,
        totalWinnings: sql`${investiLecteurProfiles.totalWinnings} + ${amount * VOIX_INFO_CONFIG.conversion.euroPerPoint}`,
        updatedAt: new Date()
      })
      .where(eq(investiLecteurProfiles.userId, userId));
  }

  private async getCurrentVisuPointsBalance(userId: string): Promise<number> {
    const [profile] = await db
      .select({ visuPoints: investiLecteurProfiles.visuPoints })
      .from(investiLecteurProfiles)
      .where(eq(investiLecteurProfiles.userId, userId))
      .limit(1);

    return profile?.visuPoints || 0;
  }

  // ===== TRAITEMENT DES GOLDEN TICKETS =====

  async processGoldenTicketRefunds(date: string, rankings: DailyRanking[]): Promise<GoldenTicketRefund[]> {
    const currentMonth = date.slice(0, 7); // YYYY-MM
    console.log(`🎫 Traitement des Golden Tickets pour ${currentMonth}...`);

    // Récupérer tous les Golden Tickets actifs du mois
    const activeTickets = await db
      .select()
      .from(goldenTickets)
      .where(and(
        eq(goldenTickets.monthYear, currentMonth),
        eq(goldenTickets.status, 'active')
      ));

    if (activeTickets.length === 0) {
      console.log(`ℹ️  Aucun Golden Ticket actif pour ${currentMonth}`);
      return [];
    }

    const refunds: GoldenTicketRefund[] = [];

    for (const ticket of activeTickets) {
      if (!ticket.targetInfoporteurId) continue;

      // Trouver le rang final de l'infoporteur ciblé
      const targetRanking = rankings.find(r => r.infoporteurId === ticket.targetInfoporteurId);
      const finalRank = targetRanking?.rank || 999; // Si pas classé = rang très bas

      // Calculer le pourcentage de remboursement
      let refundPercentage = 0;
      if (finalRank >= 1 && finalRank <= 10) {
        refundPercentage = VOIX_INFO_CONFIG.goldenTicketRefunds.ranks1_10;
      } else if (finalRank === 11) {
        refundPercentage = VOIX_INFO_CONFIG.goldenTicketRefunds.rank11;
      } else if (finalRank >= 12 && finalRank <= 20) {
        refundPercentage = VOIX_INFO_CONFIG.goldenTicketRefunds.ranks12_20;
      } else {
        refundPercentage = VOIX_INFO_CONFIG.goldenTicketRefunds.ranksAbove20;
      }

      const refundAmount = Number(ticket.amountEuros) * (refundPercentage / 100);

      // Mettre à jour le ticket
      await db
        .update(goldenTickets)
        .set({
          finalRank,
          refundPercentage,
          refundAmount: refundAmount.toString(),
          status: 'completed',
          refundedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(goldenTickets.id, ticket.id));

      // Si remboursement > 0, créditer les VISUpoints
      if (refundAmount > 0) {
        const refundVP = Math.floor(refundAmount * VOIX_INFO_CONFIG.conversion.pointsPerEuro);
        
        await this.addBonusVisuPoints(
          ticket.investiLecteurId,
          refundVP,
          `Remboursement Golden Ticket ${refundPercentage}% - Rang final: ${finalRank} (${refundAmount.toFixed(2)}€)`,
          ticket.id,
          'golden_ticket_refund'
        );
      }

      refunds.push({
        ticketId: ticket.id,
        investiLecteurId: ticket.investiLecteurId,
        refundPercentage,
        refundAmount
      });
    }

    console.log(`✅ ${refunds.length} Golden Tickets traités`);
    return refunds;
  }

  // ===== UTILITAIRES =====

  async getLatestRankings(limit = 100): Promise<DailyRanking[]> {
    const latestDate = await db
      .select({ date: dailyRankings.rankingDate })
      .from(dailyRankings)
      .orderBy(desc(dailyRankings.rankingDate))
      .limit(1);

    if (latestDate.length === 0) return [];

    return await db
      .select()
      .from(dailyRankings)
      .where(eq(dailyRankings.rankingDate, latestDate[0].date))
      .orderBy(dailyRankings.rank)
      .limit(limit);
  }

  async getRankingHistory(infoporteurId: string, days = 30): Promise<DailyRanking[]> {
    return await db
      .select()
      .from(dailyRankings)
      .where(eq(dailyRankings.infoporteurId, infoporteurId))
      .orderBy(desc(dailyRankings.rankingDate))
      .limit(days);
  }
}

// Export instance unique
export const voixInfoRankingService = new VoixInfoRankingService();