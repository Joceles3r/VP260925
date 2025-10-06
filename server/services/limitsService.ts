import { db } from "../db";
import { users, userDailyLimits, auditLogs } from "@shared/schema";
import { eq, and, gte, lte, count, sum, sql } from "drizzle-orm";
import type { User } from "@shared/schema";

// ===== SYSTÈME DE LIMITES QUOTIDIENNES DÉFINIES =====

/**
 * Limites par défaut selon le type de profil utilisateur
 */
export const DEFAULT_DAILY_LIMITS = {
  // Investisseurs standards
  investor: {
    maxInvestmentsPerDay: 10,
    maxInvestmentAmountPerDay: 200, // €200/jour
    maxProjectsPerDay: 5,
    maxSocialActionsPerDay: 50, // likes, commentaires, partages
    maxVotesPerDay: 20,
    maxWithdrawalsPerDay: 3,
    maxWithdrawalAmountPerDay: 500
  },

  // Créateurs de contenu
  creator: {
    maxInvestmentsPerDay: 5,
    maxInvestmentAmountPerDay: 100,
    maxProjectsPerDay: 2, // Création de projets
    maxSocialActionsPerDay: 100,
    maxVotesPerDay: 30,
    maxWithdrawalsPerDay: 2,
    maxWithdrawalAmountPerDay: 1000 // Plus élevé pour les créateurs
  },

  // Investi-lecteurs (lecture payante)
  invested_reader: {
    maxInvestmentsPerDay: 3,
    maxInvestmentAmountPerDay: 50,
    maxProjectsPerDay: 0,
    maxSocialActionsPerDay: 30,
    maxVotesPerDay: 15,
    maxWithdrawalsPerDay: 1,
    maxWithdrawalAmountPerDay: 100,
    maxArticleReadsPerDay: 20,
    maxArticlePurchasesPerDay: 5
  },

  // Visiteurs mineurs (16-17 ans)
  minor_visitor: {
    maxInvestmentsPerDay: 0, // Pas d'investissements financiers
    maxInvestmentAmountPerDay: 0,
    maxProjectsPerDay: 0,
    maxSocialActionsPerDay: 20, // Limité pour protection
    maxVotesPerDay: 10,
    maxWithdrawalsPerDay: 0,
    maxWithdrawalAmountPerDay: 0,
    maxVisuPointsEarnPerDay: 500, // 5€ équivalent max/jour
    maxActivitiesPerDay: 5
  },

  // Administrateurs
  admin: {
    maxInvestmentsPerDay: 50,
    maxInvestmentAmountPerDay: 1000,
    maxProjectsPerDay: 10,
    maxSocialActionsPerDay: 200,
    maxVotesPerDay: 100,
    maxWithdrawalsPerDay: 10,
    maxWithdrawalAmountPerDay: 5000
  }
};

/**
 * Interface pour le tracking des limites quotidiennes
 */
interface DailyUsage {
  date: string;
  userId: string;
  investmentsCount: number;
  investmentAmount: number;
  projectsCreated: number;
  socialActions: number;
  votesCount: number;
  withdrawalsCount: number;
  withdrawalAmount: number;
  visuPointsEarned?: number;
  activitiesCompleted?: number;
  articleReads?: number;
  articlePurchases?: number;
}

/**
 * Résultat de vérification de limite
 */
interface LimitCheckResult {
  allowed: boolean;
  reason?: string;
  currentUsage: number;
  limit: number;
  resetsAt: Date;
  timeUntilReset: string;
}

/**
 * Service de gestion des limites quotidiennes
 */
export class DailyLimitsService {

  /**
   * Obtenir les limites pour un utilisateur selon son profil
   */
  async getUserLimits(userId: string): Promise<typeof DEFAULT_DAILY_LIMITS.investor> {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user.length) {
      throw new Error('Utilisateur non trouvé');
    }

    const profileType = user[0].profileTypes?.[0] || 'investor';
    
    // Retourner les limites par défaut selon le profil
    return DEFAULT_DAILY_LIMITS[profileType as keyof typeof DEFAULT_DAILY_LIMITS] 
           || DEFAULT_DAILY_LIMITS.investor;
  }

  /**
   * Obtenir l'utilisation quotidienne actuelle d'un utilisateur
   */
  async getDailyUsage(userId: string, date = new Date()): Promise<DailyUsage> {
    const dateStr = date.toISOString().split('T')[0]; // Format YYYY-MM-DD
    const startOfDay = new Date(`${dateStr}T00:00:00Z`);
    const endOfDay = new Date(`${dateStr}T23:59:59Z`);

    // Compter les investissements du jour
    const [investmentStats] = await db
      .select({
        count: count(),
        totalAmount: sum(sql`CAST(amount AS NUMERIC)`)
      })
      .from(sql`investments`)
      .where(and(
        eq(sql`user_id`, userId),
        gte(sql`created_at`, startOfDay),
        lte(sql`created_at`, endOfDay)
      ));

    // Compter les actions sociales du jour  
    const [socialStats] = await db
      .select({
        count: count()
      })
      .from(sql`social_interactions`)
      .where(and(
        eq(sql`user_id`, userId),
        gte(sql`created_at`, startOfDay),
        lte(sql`created_at`, endOfDay)
      ));

    // Compter les votes du jour
    const [voteStats] = await db
      .select({
        count: count()
      })
      .from(sql`project_votes`)
      .where(and(
        eq(sql`user_id`, userId),
        gte(sql`created_at`, startOfDay),
        lte(sql`created_at`, endOfDay)
      ));

    // Compter les retraits du jour
    const [withdrawalStats] = await db
      .select({
        count: count(),
        totalAmount: sum(sql`CAST(amount AS NUMERIC)`)
      })
      .from(sql`withdrawals`)
      .where(and(
        eq(sql`user_id`, userId),
        gte(sql`created_at`, startOfDay),
        lte(sql`created_at`, endOfDay)
      ));

    return {
      date: dateStr,
      userId,
      investmentsCount: Number(investmentStats?.count || 0),
      investmentAmount: Number(investmentStats?.totalAmount || 0),
      projectsCreated: 0, // TODO: Implémenter le comptage des projets créés
      socialActions: Number(socialStats?.count || 0),
      votesCount: Number(voteStats?.count || 0),
      withdrawalsCount: Number(withdrawalStats?.count || 0),
      withdrawalAmount: Number(withdrawalStats?.totalAmount || 0)
    };
  }

  /**
   * Vérifier si une action est autorisée selon les limites quotidiennes
   */
  async checkLimit(
    userId: string, 
    action: keyof typeof DEFAULT_DAILY_LIMITS.investor,
    amount?: number
  ): Promise<LimitCheckResult> {
    const limits = await this.getUserLimits(userId);
    const usage = await this.getDailyUsage(userId);
    
    let currentUsage = 0;
    let limit = 0;

    // Déterminer l'utilisation actuelle selon l'action
    switch (action) {
      case 'maxInvestmentsPerDay':
        currentUsage = usage.investmentsCount;
        limit = limits.maxInvestmentsPerDay;
        break;
      case 'maxInvestmentAmountPerDay':
        currentUsage = usage.investmentAmount + (amount || 0);
        limit = limits.maxInvestmentAmountPerDay;
        break;
      case 'maxSocialActionsPerDay':
        currentUsage = usage.socialActions;
        limit = limits.maxSocialActionsPerDay;
        break;
      case 'maxVotesPerDay':
        currentUsage = usage.votesCount;
        limit = limits.maxVotesPerDay;
        break;
      case 'maxWithdrawalsPerDay':
        currentUsage = usage.withdrawalsCount;
        limit = limits.maxWithdrawalsPerDay;
        break;
      case 'maxWithdrawalAmountPerDay':
        currentUsage = usage.withdrawalAmount + (amount || 0);
        limit = limits.maxWithdrawalAmountPerDay;
        break;
      default:
        // Action non limitée
        return {
          allowed: true,
          currentUsage: 0,
          limit: Infinity,
          resetsAt: this.getNextResetTime(),
          timeUntilReset: this.getTimeUntilReset()
        };
    }

    const allowed = currentUsage < limit;
    
    // Calculer le temps jusqu'au reset (minuit)
    const resetsAt = this.getNextResetTime();
    const timeUntilReset = this.getTimeUntilReset();

    return {
      allowed,
      reason: allowed ? undefined : `Limite quotidienne atteinte (${currentUsage}/${limit})`,
      currentUsage: amount ? currentUsage - amount : currentUsage, // Usage actuel sans le montant en cours
      limit,
      resetsAt,
      timeUntilReset
    };
  }

  /**
   * Enregistrer une action pour le tracking des limites
   */
  async recordAction(
    userId: string, 
    action: string, 
    amount?: number,
    metadata?: any
  ): Promise<void> {
    // Log pour audit
    await db.insert(auditLogs).values({
      userId,
      action: action as any,
      resourceType: 'daily_limit',
      resourceId: userId,
      details: {
        action,
        amount,
        metadata,
        timestamp: new Date()
      },
      success: true,
      createdAt: new Date()
    });
  }

  /**
   * Obtenir les limites avec l'utilisation actuelle pour l'interface
   */
  async getLimitsWithUsage(userId: string) {
    const limits = await this.getUserLimits(userId);
    const usage = await this.getDailyUsage(userId);
    
    return {
      limits,
      usage,
      resetsAt: this.getNextResetTime(),
      timeUntilReset: this.getTimeUntilReset(),
      checks: {
        canInvest: usage.investmentsCount < limits.maxInvestmentsPerDay,
        canCreateProject: usage.projectsCreated < limits.maxProjectsPerDay,
        canSocialize: usage.socialActions < limits.maxSocialActionsPerDay,
        canVote: usage.votesCount < limits.maxVotesPerDay,
        canWithdraw: usage.withdrawalsCount < limits.maxWithdrawalsPerDay
      }
    };
  }

  /**
   * Réinitialiser les limites pour un nouvel utilisateur
   */
  async initializeUserLimits(userId: string, profileType: string): Promise<void> {
    // Les limites sont calculées dynamiquement, pas de stockage nécessaire
    // Mais on peut enregistrer des préférences personnalisées si besoin
    
    await this.recordAction(userId, 'limits_initialized', undefined, { profileType });
  }

  /**
   * Modifier temporairement les limites d'un utilisateur (admin)
   */
  async updateUserLimits(
    userId: string, 
    newLimits: Partial<typeof DEFAULT_DAILY_LIMITS.investor>,
    adminUserId: string,
    expiresAt?: Date
  ): Promise<void> {
    // TODO: Implémenter le stockage de limites personnalisées en base
    
    await this.recordAction(adminUserId, 'limits_updated', undefined, {
      targetUserId: userId,
      newLimits,
      expiresAt
    });
  }

  /**
   * Obtenir l'heure de reset des limites (minuit UTC)
   */
  private getNextResetTime(): Date {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);
    return tomorrow;
  }

  /**
   * Obtenir le temps restant avant reset sous forme lisible
   */
  private getTimeUntilReset(): string {
    const now = new Date();
    const resetTime = this.getNextResetTime();
    const diffMs = resetTime.getTime() - now.getTime();
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    } else {
      return `${minutes}min`;
    }
  }

  /**
   * Obtenir les statistiques d'utilisation des limites (pour admin)
   */
  async getLimitUsageStats(): Promise<{
    totalUsers: number;
    usersAtLimit: number;
    mostUsedLimits: Array<{ action: string; count: number }>;
    averageUsage: any;
  }> {
    // TODO: Implémenter les statistiques globales
    
    return {
      totalUsers: 0,
      usersAtLimit: 0,
      mostUsedLimits: [],
      averageUsage: {}
    };
  }
}

// Export instance unique
export const dailyLimitsService = new DailyLimitsService();