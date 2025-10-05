import { db } from "../db";
import { storage } from "../storage";
import {
  users,
  overdraftLimits,
  overdraftAlerts,
  overdraftIncidents,
  auditLogs,
  transactions
} from "@shared/schema";
import { eq, and, desc, count, sum, sql, gte, lte, lt, gt } from "drizzle-orm";
import type {
  User,
  OverdraftLimit,
  OverdraftAlert,
  OverdraftIncident,
  InsertOverdraftLimit,
  InsertOverdraftAlert,
  InsertOverdraftIncident
} from "@shared/schema";

// ===== CONSTANTES DU SYSTÈME DE DÉCOUVERT =====

export const OVERDRAFT_CONSTANTS = {
  // Limites par défaut selon le profil utilisateur
  DEFAULT_LIMITS: {
    investor: 500.00,      // €500 de découvert pour investisseurs
    creator: 300.00,       // €300 de découvert pour créateurs
    admin: 1000.00,        // €1000 de découvert pour admins
    invested_reader: 200.00 // €200 de découvert pour investi-lecteurs
  },
  
  // Seuils d'alerte en pourcentage de la limite
  ALERT_THRESHOLDS: {
    warning: 0.75,      // 75% - Alerte préventive
    critical: 0.90,     // 90% - Alerte critique
    blocked: 1.00       // 100% - Blocage des opérations
  },
  
  // Délais de grâce
  GRACE_PERIODS: {
    warning: 7,         // 7 jours pour régulariser après alerte
    critical: 3,        // 3 jours après alerte critique
    blocked: 24         // 24h pour débloquer le compte
  },
  
  // Frais de découvert (par jour)
  OVERDRAFT_FEES: {
    daily_rate: 0.001,  // 0.1% par jour
    max_fee: 50.00      // Maximum €50 de frais par mois
  }
} as const;

// ===== TYPES =====

export interface OverdraftStatus {
  userId: string;
  currentBalance: number;
  overdraftLimit: number;
  availableCredit: number;
  overdraftAmount: number;
  overdraftPercentage: number;
  alertLevel: 'safe' | 'warning' | 'critical' | 'blocked';
  isBlocked: boolean;
  daysSinceOverdraft: number;
  estimatedFees: number;
  nextAlert?: Date;
}

export interface OverdraftStats {
  totalUsersInOverdraft: number;
  totalOverdraftAmount: number;
  avgOverdraftAmount: number;
  usersAtRisk: number;
  blockedUsers: number;
  totalFeesCollected: number;
}

export interface OverdraftConfiguration {
  limitAmount: number;
  alertsEnabled: boolean;
  autoBlock: boolean;
  gracePeriodDays: number;
  feeRate: number;
}

// ===== SERVICE PRINCIPAL =====

export class OverdraftService {

  // ===== GESTION DES LIMITES =====

  /**
   * Créer ou mettre à jour la limite de découvert d'un utilisateur
   */
  async setOverdraftLimit(
    userId: string, 
    limitAmount: number, 
    adminUserId?: string
  ): Promise<OverdraftLimit> {
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error("Utilisateur non trouvé");
    }

    // Vérifier que la limite n'est pas excessive
    const maxLimit = this.getMaxLimitForProfile(user.profileTypes[0]);
    if (limitAmount > maxLimit) {
      throw new Error(`Limite excessive. Maximum autorisé: €${maxLimit}`);
    }

    const limitData: InsertOverdraftLimit = {
      userId,
      limitAmount: limitAmount.toString(),
      isActive: true,
      setByAdmin: !!adminUserId,
      setBy: adminUserId || userId,
    };

    const [limit] = await db
      .insert(overdraftLimits)
      .values(limitData)
      .onConflictDoUpdate({
        target: overdraftLimits.userId,
        set: {
          limitAmount: limitAmount.toString(),
          isActive: true,
          setByAdmin: !!adminUserId,
          setBy: adminUserId || userId,
          updatedAt: new Date(),
        }
      })
      .returning();

    // Audit log
    await this.createAuditLog(
      adminUserId || userId,
      'overdraft_limit_updated',
      'overdraft_limit',
      limit.id,
      {
        userId,
        limitAmount,
        setByAdmin: !!adminUserId,
        previousLimit: await this.getCurrentLimit(userId)
      }
    );

    return limit;
  }

  /**
   * Récupérer la limite de découvert actuelle d'un utilisateur
   */
  async getCurrentLimit(userId: string): Promise<number> {
    const [limit] = await db
      .select()
      .from(overdraftLimits)
      .where(and(
        eq(overdraftLimits.userId, userId),
        eq(overdraftLimits.isActive, true)
      ))
      .limit(1);

    if (limit) {
      return parseFloat(limit.limitAmount);
    }

    // Limite par défaut selon le profil
    const user = await storage.getUser(userId);
    if (user) {
      return this.getDefaultLimitForProfile(user.profileTypes[0]);
    }

    return OVERDRAFT_CONSTANTS.DEFAULT_LIMITS.investor; // Valeur par défaut
  }

  /**
   * Calculer le statut complet du découvert d'un utilisateur
   */
  async getOverdraftStatus(userId: string): Promise<OverdraftStatus> {
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error("Utilisateur non trouvé");
    }

    const currentBalance = parseFloat(user.balanceEUR || '0');
    const overdraftLimit = await this.getCurrentLimit(userId);
    const overdraftAmount = currentBalance < 0 ? Math.abs(currentBalance) : 0;
    const availableCredit = overdraftLimit + Math.min(currentBalance, 0);
    const overdraftPercentage = overdraftLimit > 0 ? (overdraftAmount / overdraftLimit) : 0;

    // Déterminer le niveau d'alerte
    let alertLevel: 'safe' | 'warning' | 'critical' | 'blocked' = 'safe';
    if (overdraftPercentage >= OVERDRAFT_CONSTANTS.ALERT_THRESHOLDS.blocked) {
      alertLevel = 'blocked';
    } else if (overdraftPercentage >= OVERDRAFT_CONSTANTS.ALERT_THRESHOLDS.critical) {
      alertLevel = 'critical';
    } else if (overdraftPercentage >= OVERDRAFT_CONSTANTS.ALERT_THRESHOLDS.warning) {
      alertLevel = 'warning';
    }

    // Calculer les jours en découvert
    const daysSinceOverdraft = await this.getDaysSinceOverdraft(userId);
    
    // Calculer les frais estimés
    const estimatedFees = this.calculateOverdraftFees(overdraftAmount, daysSinceOverdraft);

    return {
      userId,
      currentBalance,
      overdraftLimit,
      availableCredit,
      overdraftAmount,
      overdraftPercentage,
      alertLevel,
      isBlocked: alertLevel === 'blocked',
      daysSinceOverdraft,
      estimatedFees,
      nextAlert: await this.getNextAlertDate(userId, alertLevel)
    };
  }

  // ===== SURVEILLANCE ET ALERTES =====

  /**
   * Vérifier tous les utilisateurs et envoyer les alertes nécessaires
   */
  async processOverdraftAlerts(): Promise<{
    processed: number;
    alerts: number;
    blocked: number;
    errors: string[];
  }> {
    const overdraftUsers = await this.getUsersInOverdraft();
    
    let processed = 0;
    let alerts = 0;
    let blocked = 0;
    const errors: string[] = [];

    for (const user of overdraftUsers) {
      try {
        const status = await this.getOverdraftStatus(user.id);
        
        // Vérifier si une alerte est nécessaire
        if (await this.shouldSendAlert(user.id, status.alertLevel)) {
          await this.sendOverdraftAlert(user.id, status);
          alerts++;
        }

        // Bloquer le compte si nécessaire
        if (status.isBlocked && !await this.isAccountBlocked(user.id)) {
          await this.blockAccount(user.id, 'overdraft_limit_exceeded');
          blocked++;
        }

        processed++;
      } catch (error) {
        errors.push(`Erreur utilisateur ${user.id}: ${error.message}`);
      }
    }

    return { processed, alerts, blocked, errors };
  }

  /**
   * Envoyer une alerte de découvert
   */
  async sendOverdraftAlert(userId: string, status: OverdraftStatus): Promise<void> {
    const user = await storage.getUser(userId);
    if (!user) return;

    // Créer l'alerte en base
    const alertData: InsertOverdraftAlert = {
      userId,
      alertType: status.alertLevel,
      overdraftAmount: status.overdraftAmount.toString(),
      limitAmount: status.overdraftLimit.toString(),
      message: this.generateAlertMessage(status),
    };

    await db.insert(overdraftAlerts).values(alertData);

    // Envoyer notification (email, SMS, push selon préférences)
    await this.sendNotification(user, status);

    // Log audit
    await this.createAuditLog(
      'system',
      'overdraft_alert_sent',
      'overdraft_alert',
      userId,
      { alertType: status.alertLevel, overdraftAmount: status.overdraftAmount }
    );
  }

  /**
   * Bloquer un compte pour découvert
   */
  async blockAccount(userId: string, reason: string): Promise<void> {
    // Créer un incident de découvert
    const incidentData: InsertOverdraftIncident = {
      userId,
      incidentType: 'account_blocked',
      overdraftAmount: ((await this.getOverdraftStatus(userId)).overdraftAmount).toString(),
      limitAmount: ((await this.getCurrentLimit(userId))).toString(),
      description: `Compte bloqué: ${reason}`,
      isResolved: false,
    };

    await db.insert(overdraftIncidents).values(incidentData);

    // Mettre à jour le statut utilisateur (peut nécessiter ajout d'un champ dans users table)
    // TODO: Ajouter champ isBlocked dans users table si pas présent

    // Log audit
    await this.createAuditLog(
      'system',
      'account_blocked_overdraft',
      'user',
      userId,
      { reason, timestamp: new Date() }
    );
  }

  // ===== CALCULS ET UTILITAIRES =====

  /**
   * Calculer les frais de découvert
   */
  calculateOverdraftFees(overdraftAmount: number, days: number): number {
    if (overdraftAmount <= 0 || days <= 0) return 0;
    
    const dailyFee = overdraftAmount * OVERDRAFT_CONSTANTS.OVERDRAFT_FEES.daily_rate;
    const totalFees = dailyFee * days;
    
    return Math.min(totalFees, OVERDRAFT_CONSTANTS.OVERDRAFT_FEES.max_fee);
  }

  /**
   * Obtenir les utilisateurs actuellement en découvert
   */
  private async getUsersInOverdraft(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(lt(users.balanceEUR, '0'));
  }

  /**
   * Obtenir la limite par défaut selon le profil
   */
  private getDefaultLimitForProfile(profileType: string): number {
    return OVERDRAFT_CONSTANTS.DEFAULT_LIMITS[profileType as keyof typeof OVERDRAFT_CONSTANTS.DEFAULT_LIMITS] 
           || OVERDRAFT_CONSTANTS.DEFAULT_LIMITS.investor;
  }

  /**
   * Obtenir la limite maximum selon le profil
   */
  private getMaxLimitForProfile(profileType: string): number {
    const defaultLimit = this.getDefaultLimitForProfile(profileType);
    return defaultLimit * 2; // Maximum 2x la limite par défaut
  }

  /**
   * Calculer les jours depuis le début du découvert
   */
  private async getDaysSinceOverdraft(userId: string): Promise<number> {
    const [lastPositiveTransaction] = await db
      .select()
      .from(transactions)
      .where(and(
        eq(transactions.userId, userId),
        gt(transactions.amount, '0')
      ))
      .orderBy(desc(transactions.createdAt))
      .limit(1);

    if (!lastPositiveTransaction) return 0;

    const daysSince = Math.floor(
      (Date.now() - lastPositiveTransaction.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    return Math.max(0, daysSince);
  }

  /**
   * Vérifier si un compte est bloqué
   */
  private async isAccountBlocked(userId: string): Promise<boolean> {
    const [incident] = await db
      .select()
      .from(overdraftIncidents)
      .where(and(
        eq(overdraftIncidents.userId, userId),
        eq(overdraftIncidents.incidentType, 'account_blocked'),
        eq(overdraftIncidents.isResolved, false)
      ))
      .limit(1);

    return !!incident;
  }

  /**
   * Vérifier si une alerte doit être envoyée
   */
  private async shouldSendAlert(userId: string, alertLevel: string): Promise<boolean> {
    if (alertLevel === 'safe') return false;

    // Vérifier la dernière alerte du même type
    const [lastAlert] = await db
      .select()
      .from(overdraftAlerts)
      .where(and(
        eq(overdraftAlerts.userId, userId),
        eq(overdraftAlerts.alertType, alertLevel)
      ))
      .orderBy(desc(overdraftAlerts.createdAt))
      .limit(1);

    if (!lastAlert) return true;

    // Ne pas spammer - attendre au moins 24h entre alertes du même type
    const hoursSinceLastAlert = (Date.now() - lastAlert.createdAt.getTime()) / (1000 * 60 * 60);
    return hoursSinceLastAlert >= 24;
  }

  /**
   * Générer le message d'alerte selon le niveau
   */
  private generateAlertMessage(status: OverdraftStatus): string {
    switch (status.alertLevel) {
      case 'warning':
        return `Attention : Votre solde est négatif de €${status.overdraftAmount.toFixed(2)}. Vous approchez de votre limite de découvert (${(status.overdraftPercentage * 100).toFixed(1)}%).`;
      
      case 'critical':
        return `Alerte critique : Vous avez utilisé ${(status.overdraftPercentage * 100).toFixed(1)}% de votre découvert autorisé. Régularisez rapidement pour éviter le blocage.`;
      
      case 'blocked':
        return `Compte bloqué : Limite de découvert dépassée (€${status.overdraftAmount.toFixed(2)} / €${status.overdraftLimit.toFixed(2)}). Contactez-nous pour débloquer votre compte.`;
      
      default:
        return 'Mise à jour de votre statut de découvert.';
    }
  }

  /**
   * Envoyer une notification (placeholder pour intégration email/SMS)
   */
  private async sendNotification(user: User, status: OverdraftStatus): Promise<void> {
    // TODO: Intégrer avec service d'email/SMS
    console.log(`Notification envoyée à ${user.email} - Niveau: ${status.alertLevel}`);
  }

  /**
   * Obtenir la prochaine date d'alerte
   */
  private async getNextAlertDate(userId: string, alertLevel: string): Promise<Date | undefined> {
    if (alertLevel === 'safe') return undefined;

    const gracePeriod = OVERDRAFT_CONSTANTS.GRACE_PERIODS[alertLevel as keyof typeof OVERDRAFT_CONSTANTS.GRACE_PERIODS] || 1;
    const nextAlert = new Date();
    nextAlert.setDate(nextAlert.getDate() + gracePeriod);
    
    return nextAlert;
  }

  /**
   * Créer un log d'audit
   */
  private async createAuditLog(
    userId: string,
    action: string,
    resourceType: string,
    resourceId: string,
    details: any
  ): Promise<void> {
    await db.insert(auditLogs).values({
      userId,
      action: action as any,
      resourceType,
      resourceId,
      details,
      success: true,
      createdAt: new Date(),
    });
  }

  // ===== STATISTIQUES ADMIN =====

  /**
   * Obtenir les statistiques globales des découverts
   */
  async getOverdraftStats(): Promise<OverdraftStats> {
    try {
      // Utilisateurs en découvert
      const [overdraftCount] = await db
        .select({ count: count() })
        .from(users)
        .where(lt(users.balanceEUR, '0'));

      // Montant total des découverts
      const [totalAmount] = await db
        .select({ 
          total: sql<number>`SUM(ABS(CAST(${users.balanceEUR} AS NUMERIC)))`,
          avg: sql<number>`AVG(ABS(CAST(${users.balanceEUR} AS NUMERIC)))`
        })
        .from(users)
        .where(lt(users.balanceEUR, '0'));

      // Utilisateurs à risque (>75% de leur limite)
      const usersAtRisk = await this.getUsersAtRisk();
      
      // Comptes bloqués
      const [blockedCount] = await db
        .select({ count: count() })
        .from(overdraftIncidents)
        .where(and(
          eq(overdraftIncidents.incidentType, 'account_blocked'),
          eq(overdraftIncidents.isResolved, false)
        ));

      return {
        totalUsersInOverdraft: Number(overdraftCount?.count || 0),
        totalOverdraftAmount: Number(totalAmount?.total || 0),
        avgOverdraftAmount: Number(totalAmount?.avg || 0),
        usersAtRisk: usersAtRisk.length,
        blockedUsers: Number(blockedCount?.count || 0),
        totalFeesCollected: 0 // TODO: Calculer depuis les transactions de frais
      };
    } catch (error) {
      console.error('Error getting overdraft stats:', error);
      return {
        totalUsersInOverdraft: 0,
        totalOverdraftAmount: 0,
        avgOverdraftAmount: 0,
        usersAtRisk: 0,
        blockedUsers: 0,
        totalFeesCollected: 0
      };
    }
  }

  /**
   * Obtenir les utilisateurs à risque
   */
  private async getUsersAtRisk(): Promise<User[]> {
    const overdraftUsers = await this.getUsersInOverdraft();
    const usersAtRisk: User[] = [];

    for (const user of overdraftUsers) {
      const status = await this.getOverdraftStatus(user.id);
      if (status.overdraftPercentage >= OVERDRAFT_CONSTANTS.ALERT_THRESHOLDS.warning) {
        usersAtRisk.push(user);
      }
    }

    return usersAtRisk;
  }
}

// Export instance unique
export const overdraftService = new OverdraftService();