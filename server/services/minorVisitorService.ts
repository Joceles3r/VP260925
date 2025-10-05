import { db } from "../db";
import { storage } from "../storage";
import {
  minorProfiles,
  minorVisuPointsTransactions,
  minorNotifications,
  minorAdminSettings,
  users
} from "@shared/schema";
import { eq, and, desc, sum, count, sql, gte, lte } from "drizzle-orm";
import type {
  MinorProfile,
  CreateMinorProfile,
  UpdateMinorProfile,
  MinorVisuPointsTransaction,
  AwardMinorVisuPoints,
  MinorNotification,
  CreateMinorNotification,
  MinorAdminSettings,
  UpdateMinorAdminSettings
} from "@shared/schema";

// ===== CONSTANTES DU SYSTÈME MINEUR =====

export const MINOR_CONSTANTS = {
  VP_PER_EURO: 100,
  DEFAULT_CAP_EUR: 200,
  DEFAULT_CAP_VP: 20000,
  MIN_AGE: 16,
  MAX_AGE: 17,
  MAJORITY_AGE: 18,
  DEFAULT_LOCK_MONTHS: 6,
  CAP_WARNING_THRESHOLD: 0.8, // 80% du cap pour notification
  
  // Sources autorisées pour les gains VP des mineurs
  ALLOWED_SOURCES: [
    'quiz_completion',
    'educational_content_viewing',
    'daily_login',
    'profile_completion',
    'community_mission',
    'live_show_viewing',
    'content_moderation_help',
    'platform_improvement_feedback'
  ],
  
  // Types de notifications
  NOTIFICATION_TYPES: {
    CAP_WARNING_80: 'cap_warning_80',
    CAP_REACHED: 'cap_reached', 
    MAJORITY_REMINDER: 'majority_reminder',
    LOCK_EXPIRED: 'lock_expired'
  }
} as const;

// ===== INTERFACES =====

export interface CreateMinorProfileRequest {
  userId: string;
  birthDate: string;
  parentEmail?: string;
  parentalConsent?: boolean;
}

export interface AwardPointsResult {
  granted: number;
  blocked: number;
  reason: string;
  newBalance: number;
  triggerNotification?: string;
}

export interface MinorStatusCheck {
  isMinor: boolean;
  age?: number;
  status?: string;
  visuPoints: number;
  capReached: boolean;
  canEarnMore: boolean;
  majorityDate?: string;
  lockUntil?: string;
  canCashOut: boolean;
}

// ===== SERVICE PRINCIPAL =====

export class MinorVisitorService {

  // ===== GESTION DES PROFILS =====

  async createMinorProfile(request: CreateMinorProfileRequest): Promise<MinorProfile> {
    // Vérifier que l'utilisateur n'a pas déjà un profil mineur
    const existingProfile = await this.getMinorProfile(request.userId);
    if (existingProfile) {
      throw new Error("Un profil mineur existe déjà pour cet utilisateur");
    }

    // Calculer l'âge et valider
    const age = this.calculateAge(request.birthDate);
    if (age < MINOR_CONSTANTS.MIN_AGE || age > MINOR_CONSTANTS.MAX_AGE) {
      throw new Error(`Âge invalide: ${age} ans. Doit être entre ${MINOR_CONSTANTS.MIN_AGE} et ${MINOR_CONSTANTS.MAX_AGE} ans`);
    }

    // Calculer la date de majorité (18ème anniversaire)
    const majorityDate = this.calculateMajorityDate(request.birthDate);

    const profileData = {
      userId: request.userId,
      birthDate: request.birthDate,
      parentEmail: request.parentEmail,
      parentalConsent: request.parentalConsent || false,
      parentalConsentDate: request.parentalConsent ? new Date() : undefined,
      majorityDate,
      visuPointsEarned: 0,
      visuPointsCap: MINOR_CONSTANTS.DEFAULT_CAP_VP,
      status: 'active' as any,
      requiredAccountType: 'investor' as any, // Par défaut, modifiable par admin
    };

    const [profile] = await db
      .insert(minorProfiles)
      .values(profileData)
      .returning();

    // Programmer les notifications automatiques
    await this.scheduleAutomaticNotifications(profile);

    return profile;
  }

  async getMinorProfile(userId: string): Promise<MinorProfile | null> {
    const [profile] = await db
      .select()
      .from(minorProfiles)
      .where(eq(minorProfiles.userId, userId))
      .limit(1);

    return profile || null;
  }

  async updateMinorProfile(userId: string, updates: UpdateMinorProfile): Promise<MinorProfile> {
    const profile = await this.getMinorProfile(userId);
    if (!profile) {
      throw new Error("Profil mineur non trouvé");
    }

    const updateData: any = {
      ...updates,
      updatedAt: new Date()
    };

    // Si choix de type de compte, enregistrer la date
    if (updates.accountTypeChosen) {
      updateData.accountTypeChosenAt = new Date();
    }

    const [updatedProfile] = await db
      .update(minorProfiles)
      .set(updateData)
      .where(eq(minorProfiles.userId, userId))
      .returning();

    return updatedProfile;
  }

  // ===== GESTION DES VISUPOINTS =====

  async awardVisuPoints(userId: string, request: AwardMinorVisuPoints): Promise<AwardPointsResult> {
    const profile = await this.getMinorProfile(userId);
    if (!profile) {
      throw new Error("Profil mineur requis");
    }

    // Vérifier que l'utilisateur est encore mineur
    if (profile.status === 'locked' || profile.status === 'unlocked') {
      throw new Error("Utilisateur majeur - utilisez le système normal de VISUpoints");
    }

    // Vérifier la source autorisée
    if (!MINOR_CONSTANTS.ALLOWED_SOURCES.includes(request.source as any)) {
      throw new Error(`Source non autorisée pour les mineurs: ${request.source}`);
    }

    const currentBalance = profile.visuPointsEarned;
    const capReached = currentBalance >= profile.visuPointsCap;

    let granted = 0;
    let blocked = 0;
    let reason = 'ok';
    let triggerNotification: string | undefined;

    if (capReached) {
      // Cap déjà atteint - aucun gain supplémentaire
      blocked = request.amount;
      reason = 'cap_reached';
    } else {
      // Calculer combien on peut accorder
      const availablePoints = profile.visuPointsCap - currentBalance;
      granted = Math.min(request.amount, availablePoints);
      blocked = request.amount - granted;

      if (blocked > 0) {
        reason = 'cap_reached';
      }

      // Vérifier si on atteint le seuil d'alerte (80%)
      const newBalance = currentBalance + granted;
      const warningThreshold = profile.visuPointsCap * MINOR_CONSTANTS.CAP_WARNING_THRESHOLD;
      
      if (currentBalance < warningThreshold && newBalance >= warningThreshold) {
        triggerNotification = MINOR_CONSTANTS.NOTIFICATION_TYPES.CAP_WARNING_80;
      } else if (newBalance >= profile.visuPointsCap) {
        triggerNotification = MINOR_CONSTANTS.NOTIFICATION_TYPES.CAP_REACHED;
      }
    }

    // Enregistrer la transaction
    if (granted > 0 || blocked > 0) {
      const transactionData = {
        userId,
        minorProfileId: profile.id,
        amount: granted,
        balanceBefore: currentBalance,
        balanceAfter: currentBalance + granted,
        source: request.source,
        sourceId: request.sourceId,
        description: request.description,
        wasBlocked: blocked > 0,
        euroEquivalent: (granted / MINOR_CONSTANTS.VP_PER_EURO).toString(),
      };

      await db.insert(minorVisuPointsTransactions).values(transactionData);

      // Mettre à jour le profil
      if (granted > 0) {
        await db
          .update(minorProfiles)
          .set({
            visuPointsEarned: currentBalance + granted,
            status: (currentBalance + granted) >= profile.visuPointsCap ? 'capped' : 'active',
            updatedAt: new Date()
          })
          .where(eq(minorProfiles.id, profile.id));
      }
    }

    // Envoyer notification si nécessaire
    if (triggerNotification) {
      await this.createNotification(userId, profile.id, triggerNotification, currentBalance + granted);
    }

    return {
      granted,
      blocked,
      reason,
      newBalance: currentBalance + granted,
      triggerNotification
    };
  }

  async getMinorStatus(userId: string): Promise<MinorStatusCheck> {
    const profile = await this.getMinorProfile(userId);
    
    if (!profile) {
      return {
        isMinor: false,
        visuPoints: 0,
        capReached: false,
        canEarnMore: false,
        canCashOut: true // Les majeurs peuvent faire du cashout (selon KYC)
      };
    }

    const age = this.calculateAge(profile.birthDate);
    const isMajor = age >= MINOR_CONSTANTS.MAJORITY_AGE;
    
    return {
      isMinor: !isMajor,
      age,
      status: profile.status,
      visuPoints: profile.visuPointsEarned,
      capReached: profile.visuPointsEarned >= profile.visuPointsCap,
      canEarnMore: profile.status === 'active' && profile.visuPointsEarned < profile.visuPointsCap,
      majorityDate: profile.majorityDate,
      lockUntil: profile.lockUntil?.toISOString(),
      canCashOut: this.canCashOut(profile, isMajor)
    };
  }

  // ===== TRANSITION VERS MAJORITÉ =====

  async processMinorToMajorityTransition(userId: string): Promise<{ success: boolean; lockUntil?: Date }> {
    const profile = await this.getMinorProfile(userId);
    if (!profile) {
      throw new Error("Profil mineur non trouvé");
    }

    const age = this.calculateAge(profile.birthDate);
    if (age < MINOR_CONSTANTS.MAJORITY_AGE) {
      throw new Error("Utilisateur encore mineur");
    }

    let lockUntil: Date | undefined;

    // Si le cap de 200€ était atteint, appliquer le verrou de 6 mois
    if (profile.visuPointsEarned >= profile.visuPointsCap) {
      const settings = await this.getAdminSettings();
      const lockMonths = settings.post_majority_lock_months || MINOR_CONSTANTS.DEFAULT_LOCK_MONTHS;
      lockUntil = new Date();
      lockUntil.setMonth(lockUntil.getMonth() + lockMonths);
    }

    // Mettre à jour le statut
    await db
      .update(minorProfiles)
      .set({
        status: lockUntil ? 'locked' : 'unlocked',
        transitionedAt: new Date(),
        lockUntil,
        updatedAt: new Date()
      })
      .where(eq(minorProfiles.id, profile.id));

    // Créer notification de transition
    await this.createNotification(
      userId, 
      profile.id, 
      MINOR_CONSTANTS.NOTIFICATION_TYPES.MAJORITY_REMINDER,
      profile.visuPointsEarned
    );

    return { success: true, lockUntil };
  }

  async checkAndProcessDailyTransitions(): Promise<{ processed: number; errors: string[] }> {
    const today = new Date().toISOString().split('T')[0];
    
    // Trouver tous les profils dont la majorité est aujourd'hui
    const profilesToTransition = await db
      .select()
      .from(minorProfiles)
      .where(and(
        eq(minorProfiles.majorityDate, today),
        eq(minorProfiles.status, 'active' as any)
      ));

    let processed = 0;
    const errors: string[] = [];

    for (const profile of profilesToTransition) {
      try {
        await this.processMinorToMajorityTransition(profile.userId);
        processed++;
      } catch (error) {
        errors.push(`Erreur transition ${profile.userId}: ${error.message}`);
      }
    }

    return { processed, errors };
  }

  // ===== NOTIFICATIONS =====

  async createNotification(
    userId: string, 
    minorProfileId: string, 
    type: string, 
    currentVP: number
  ): Promise<MinorNotification> {
    let title = '';
    let message = '';

    switch (type) {
      case MINOR_CONSTANTS.NOTIFICATION_TYPES.CAP_WARNING_80:
        title = "⚠️ Limite VISUpoints approchée";
        message = `Tu approches de la limite mineur de 200€ (${currentVP.toLocaleString()} VP / 20 000 VP). Profite de tes derniers gains avant la majorité !`;
        break;
        
      case MINOR_CONSTANTS.NOTIFICATION_TYPES.CAP_REACHED:
        title = "🛑 Limite VISUpoints atteinte";
        message = "Gains en pause jusqu'à ta majorité (200€ max atteints). Tes points seront récupérables après ton 18ème anniversaire et 6 mois d'attente.";
        break;
        
      case MINOR_CONSTANTS.NOTIFICATION_TYPES.MAJORITY_REMINDER:
        title = "🎉 Majorité atteinte !";
        message = "Félicitations ! Tu peux maintenant ouvrir ton compte Investisseur ou Investi-lecteur. Tes VISUpoints seront convertibles selon les conditions.";
        break;
        
      case MINOR_CONSTANTS.NOTIFICATION_TYPES.LOCK_EXPIRED:
        title = "🔓 Verrou expiré";
        message = "Tu peux maintenant récupérer tes 200€ en VISUpoints (sous réserve de validation KYC).";
        break;
        
      default:
        title = "Notification VISUAL";
        message = "Une mise à jour concernant ton compte mineur.";
    }

    const notificationData = {
      userId,
      minorProfileId,
      type,
      title,
      message,
      triggerDate: new Date(),
      sentAt: new Date(),
    };

    const [notification] = await db
      .insert(minorNotifications)
      .values(notificationData)
      .returning();

    return notification;
  }

  async scheduleAutomaticNotifications(profile: MinorProfile): Promise<void> {
    // Programmer la notification de majorité pour J-7 et J-1
    const majorityDate = new Date(profile.majorityDate + 'T00:00:00.000Z');
    
    // Notification J-7
    const reminderDate7 = new Date(majorityDate);
    reminderDate7.setDate(reminderDate7.getDate() - 7);
    
    // Notification J-1  
    const reminderDate1 = new Date(majorityDate);
    reminderDate1.setDate(reminderDate1.getDate() - 1);

    const notifications = [
      {
        userId: profile.userId,
        minorProfileId: profile.id,
        type: MINOR_CONSTANTS.NOTIFICATION_TYPES.MAJORITY_REMINDER,
        title: "📅 Majorité dans 7 jours",
        message: "Ta majorité approche ! Commence à réfléchir au type de compte que tu souhaites ouvrir (Investisseur ou Investi-lecteur).",
        triggerDate: reminderDate7,
      },
      {
        userId: profile.userId,
        minorProfileId: profile.id,
        type: MINOR_CONSTANTS.NOTIFICATION_TYPES.MAJORITY_REMINDER,
        title: "🎂 Majorité demain !",
        message: "Demain, tu devras choisir ton type de compte définitif sur VISUAL. Tes VISUpoints t'attendent !",
        triggerDate: reminderDate1,
      }
    ];

    await db.insert(minorNotifications).values(notifications);
  }

  // ===== PARAMÈTRES ADMIN =====

  async getAdminSettings(): Promise<any> {
    const settings = await db
      .select()
      .from(minorAdminSettings);

    // Convertir en objet avec valeurs par défaut
    const settingsMap: any = {
      minor_social_posting_enabled: false,
      minor_points_cap_value_eur: 200,
      minor_points_accrual_pause_on_cap: true,
      post_majority_required_account: 'investor',
      post_majority_lock_months: 6,
      reminders_enabled: true,
      parental_consent_mode: false,
    };

    settings.forEach(setting => {
      let value: any = setting.settingValue;
      
      // Conversion selon le type
      if (setting.settingType === 'boolean') {
        value = setting.settingValue === 'true';
      } else if (setting.settingType === 'number') {
        value = parseFloat(setting.settingValue);
      }
      
      settingsMap[setting.settingKey] = value;
    });

    return settingsMap;
  }

  async updateAdminSettings(updates: UpdateMinorAdminSettings, adminUserId: string): Promise<void> {
    for (const [key, value] of Object.entries(updates)) {
      if (value === undefined) continue;

      const settingType = typeof value === 'boolean' ? 'boolean' : 
                         typeof value === 'number' ? 'number' : 'string';

      await db
        .insert(minorAdminSettings)
        .values({
          settingKey: key,
          settingValue: String(value),
          settingType,
          description: `Paramètre ${key} pour visiteurs mineurs`,
          updatedBy: adminUserId,
        })
        .onConflictDoUpdate({
          target: minorAdminSettings.settingKey,
          set: {
            settingValue: String(value),
            settingType,
            updatedBy: adminUserId,
            updatedAt: new Date(),
          }
        });
    }
  }

  // ===== UTILITAIRES =====

  private calculateAge(birthDate: string): number {
    const birth = new Date(birthDate);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const monthDiff = now.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  private calculateMajorityDate(birthDate: string): string {
    const birth = new Date(birthDate);
    birth.setFullYear(birth.getFullYear() + MINOR_CONSTANTS.MAJORITY_AGE);
    return birth.toISOString().split('T')[0]; // Format YYYY-MM-DD
  }

  private canCashOut(profile: MinorProfile, isMajor: boolean): boolean {
    if (!isMajor) return false;
    if (profile.status === 'locked' && profile.lockUntil && new Date() < profile.lockUntil) return false;
    return profile.status === 'unlocked' || !profile.lockUntil;
  }

  // ===== STATISTIQUES =====

  async getMinorStats(): Promise<{
    totalMinors: number;
    activeMinors: number;
    cappedMinors: number;
    avgVisuPoints: number;
    totalVisuPointsEarned: number;
    nearMajority: number; // Dans les 30 jours
  }> {
    try {
      const [stats] = await db
        .select({
          totalMinors: count().as('totalMinors'),
          totalVisuPointsEarned: sum(minorProfiles.visuPointsEarned).as('totalVisuPointsEarned'),
        })
        .from(minorProfiles);

      const [activeStats] = await db
        .select({
          count: count().as('count')
        })
        .from(minorProfiles)
        .where(eq(minorProfiles.status, 'active'));

      const [cappedStats] = await db
        .select({
          count: count().as('count')
        })
        .from(minorProfiles)
        .where(eq(minorProfiles.status, 'capped'));

      // Mineurs proches de la majorité (30 jours)
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const futureDateStr = futureDate.toISOString().split('T')[0];

      const [nearMajorityStats] = await db
        .select({
          count: count().as('count')
        })
        .from(minorProfiles)
        .where(lte(minorProfiles.majorityDate, futureDateStr));

      const totalMinors = Number(stats?.totalMinors || 0);
      const totalVisuPointsEarned = Number(stats?.totalVisuPointsEarned || 0);
      
      return {
        totalMinors,
        activeMinors: Number(activeStats?.count || 0),
        cappedMinors: Number(cappedStats?.count || 0),
        avgVisuPoints: totalMinors > 0 ? Math.round(totalVisuPointsEarned / totalMinors) : 0,
        totalVisuPointsEarned,
        nearMajority: Number(nearMajorityStats?.count || 0),
      };
    } catch (error) {
      console.error('Error getting minor stats:', error);
      return {
        totalMinors: 0,
        activeMinors: 0,
        cappedMinors: 0,
        avgVisuPoints: 0,
        totalVisuPointsEarned: 0,
        nearMajority: 0,
      };
    }
  }
}

// Export instance unique
export const minorVisitorService = new MinorVisitorService();