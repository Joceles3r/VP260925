import { storage } from '../storage.js';
import { VISUPointsService } from './visuPointsService.js';
import type { LoginStreak, WeeklyStreaks } from '../../shared/schema.js';

export interface DailyStreakReward {
  day: number;
  visuPoints: number;
  description: string;
}

export interface WeeklyStreakReward {
  week: number;
  visuPoints: number;
  description: string;
}

export class FidelityService {
  // Barème quotidien selon la règle VISUpoints Fidelity
  private static readonly DAILY_STREAK_REWARDS: DailyStreakReward[] = [
    { day: 1, visuPoints: 1, description: "Connexion jour 1" },
    { day: 2, visuPoints: 2, description: "Connexion jour 2" },
    { day: 3, visuPoints: 3, description: "Connexion jour 3" },
    { day: 4, visuPoints: 4, description: "Connexion jour 4" },
    { day: 5, visuPoints: 5, description: "Connexion jour 5" },
    { day: 6, visuPoints: 6, description: "Connexion jour 6" },
    { day: 7, visuPoints: 10, description: "Fin de semaine - bonus !" },
  ];

  // Barème hebdomadaire selon la règle VISUpoints Fidelity
  private static readonly WEEKLY_STREAK_REWARDS: WeeklyStreakReward[] = [
    { week: 1, visuPoints: 5, description: "Semaine 1" },
    { week: 2, visuPoints: 10, description: "Semaine 2" },
    { week: 3, visuPoints: 15, description: "Semaine 3" },
    { week: 4, visuPoints: 20, description: "Bonus mensuel" },
  ];

  /**
   * Traite la connexion quotidienne d'un utilisateur
   * Gère automatiquement les streaks quotidiens et hebdomadaires
   */
  static async processUserLogin(userId: string): Promise<{
    dailyReward: { points: number; day: number; description: string } | null;
    weeklyReward: { points: number; week: number; description: string } | null;
    totalPoints: number;
  }> {
    const today = new Date();
    const todayDateStr = today.toISOString().split('T')[0];
    
    try {
      console.log(`[FIDELITY] Traitement connexion pour utilisateur ${userId}`);
      
      // Traiter le streak quotidien
      const dailyResult = await this.processDailyStreak(userId, today);
      
      // Traiter le streak hebdomadaire
      const weeklyResult = await this.processWeeklyStreak(userId, today);
      
      const totalPoints = (dailyResult?.points || 0) + (weeklyResult?.points || 0);
      
      if (totalPoints > 0) {
        console.log(`[FIDELITY] Récompenses totales: ${totalPoints} VP (quotidien: ${dailyResult?.points || 0}, hebdomadaire: ${weeklyResult?.points || 0})`);
      }
      
      return {
        dailyReward: dailyResult,
        weeklyReward: weeklyResult,
        totalPoints
      };
    } catch (error) {
      console.error(`[FIDELITY] Erreur lors du traitement de la connexion:`, error);
      throw error;
    }
  }

  /**
   * Traite le streak quotidien
   */
  private static async processDailyStreak(userId: string, loginDate: Date): Promise<{
    points: number;
    day: number;
    description: string;
  } | null> {
    const today = loginDate.toISOString().split('T')[0];
    const yesterday = new Date(loginDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    // Récupérer ou créer le streak quotidien
    let streak = await storage.getUserLoginStreak(userId);
    
    if (!streak) {
      // Créer un nouveau streak
      streak = await storage.createLoginStreak({
        userId,
        currentStreak: 1,
        longestStreak: 1,
        lastLoginDate: loginDate,
        streakStartDate: loginDate,
        totalLogins: 1,
        visuPointsEarned: 0
      });
    } else {
      const lastLoginStr = streak.lastLoginDate?.toISOString().split('T')[0];
      
      if (lastLoginStr === today) {
        // Déjà connecté aujourd'hui, pas de récompense
        return null;
      } else if (lastLoginStr === yesterdayStr) {
        // Streak continue
        const newStreakDay = (streak.currentStreak || 0) + 1;
        
        // Reset après 7 jours pour recommencer le cycle
        const effectiveDay = newStreakDay > 7 ? ((newStreakDay - 1) % 7) + 1 : newStreakDay;
        
        await storage.updateLoginStreak(userId, {
          currentStreak: effectiveDay,
          longestStreak: Math.max(streak.longestStreak || 0, newStreakDay),
          lastLoginDate: loginDate,
          totalLogins: (streak.totalLogins || 0) + 1
        });
        
        streak.currentStreak = effectiveDay;
      } else {
        // Streak cassé, recommencer
        await storage.updateLoginStreak(userId, {
          currentStreak: 1,
          lastLoginDate: loginDate,
          streakStartDate: loginDate,
          totalLogins: (streak.totalLogins || 0) + 1
        });
        
        streak.currentStreak = 1;
      }
    }
    
    // Calculer la récompense
    const currentDay = streak.currentStreak || 1;
    const rewardInfo = this.DAILY_STREAK_REWARDS.find(r => r.day === currentDay);
    if (!rewardInfo) {
      console.log(`[FIDELITY] Pas de récompense définie pour le jour ${currentDay}`);
      return null;
    }
    
    // Attribuer les VISUpoints avec idempotence (1 attribution par jour)
    const idempotencyKey = `daily-streak-${userId}-${today}`;
    
    await VISUPointsService.awardPoints({
      userId,
      amount: rewardInfo.visuPoints,
      reason: `Streak quotidien - ${rewardInfo.description}`,
      referenceId: streak.id,
      referenceType: 'daily_login_streak',
      idempotencyKey
    });
    
    // Mettre à jour les points gagnés
    await storage.updateLoginStreak(userId, {
      visuPointsEarned: (streak.visuPointsEarned || 0) + rewardInfo.visuPoints
    });
    
    return {
      points: rewardInfo.visuPoints,
      day: currentDay,
      description: rewardInfo.description
    };
  }

  /**
   * Traite le streak hebdomadaire
   */
  private static async processWeeklyStreak(userId: string, loginDate: Date): Promise<{
    points: number;
    week: number;
    description: string;
  } | null> {
    const currentWeek = this.getWeekString(loginDate); // Format: "2025-W37"
    const lastWeek = this.getWeekString(new Date(loginDate.getTime() - 7 * 24 * 60 * 60 * 1000));
    
    // Récupérer ou créer le streak hebdomadaire
    let weeklyStreak = await storage.getUserWeeklyStreak(userId);
    
    if (!weeklyStreak) {
      // Créer un nouveau streak hebdomadaire
      weeklyStreak = await storage.createWeeklyStreak({
        userId,
        currentWeeklyStreak: 1,
        longestWeeklyStreak: 1,
        lastWeekDate: currentWeek,
        weeklyStreakStartDate: currentWeek,
        totalWeeksLogged: 1,
        visuPointsEarned: 0
      });
    } else {
      if (weeklyStreak.lastWeekDate === currentWeek) {
        // Déjà récompensé cette semaine
        return null;
      } else if (weeklyStreak.lastWeekDate === lastWeek) {
        // Streak continue
        const newWeekStreak = (weeklyStreak.currentWeeklyStreak || 0) + 1;
        
        // Reset après 4 semaines pour recommencer le cycle
        const effectiveWeek = newWeekStreak > 4 ? ((newWeekStreak - 1) % 4) + 1 : newWeekStreak;
        
        await storage.updateWeeklyStreak(userId, {
          currentWeeklyStreak: effectiveWeek,
          longestWeeklyStreak: Math.max(weeklyStreak.longestWeeklyStreak || 0, newWeekStreak),
          lastWeekDate: currentWeek,
          totalWeeksLogged: (weeklyStreak.totalWeeksLogged || 0) + 1
        });
        
        weeklyStreak.currentWeeklyStreak = effectiveWeek;
      } else {
        // Streak cassé, recommencer
        await storage.updateWeeklyStreak(userId, {
          currentWeeklyStreak: 1,
          lastWeekDate: currentWeek,
          weeklyStreakStartDate: currentWeek,
          totalWeeksLogged: (weeklyStreak.totalWeeksLogged || 0) + 1
        });
        
        weeklyStreak.currentWeeklyStreak = 1;
      }
    }
    
    // Calculer la récompense hebdomadaire
    const rewardInfo = this.WEEKLY_STREAK_REWARDS.find(r => r.week === weeklyStreak.currentWeeklyStreak);
    if (!rewardInfo) {
      console.log(`[FIDELITY] Pas de récompense définie pour la semaine ${weeklyStreak.currentWeeklyStreak}`);
      return null;
    }
    
    // Attribuer les VISUpoints avec idempotence (1 attribution par semaine)
    const idempotencyKey = `weekly-streak-${userId}-${currentWeek}`;
    
    await VISUPointsService.awardPoints({
      userId,
      amount: rewardInfo.visuPoints,
      reason: `Streak hebdomadaire - ${rewardInfo.description}`,
      referenceId: weeklyStreak.id,
      referenceType: 'weekly_login_streak',
      idempotencyKey
    });
    
    // Mettre à jour les points gagnés
    await storage.updateWeeklyStreak(userId, {
      visuPointsEarned: (weeklyStreak.visuPointsEarned || 0) + rewardInfo.visuPoints
    });
    
    return {
      points: rewardInfo.visuPoints,
      week: weeklyStreak.currentWeeklyStreak || 1,
      description: rewardInfo.description
    };
  }

  /**
   * Récupère les statistiques de fidélité d'un utilisateur
   */
  static async getUserFidelityStats(userId: string): Promise<{
    dailyStreak: {
      current: number;
      longest: number;
      totalLogins: number;
      pointsEarned: number;
      nextReward: DailyStreakReward | null;
    };
    weeklyStreak: {
      current: number;
      longest: number;
      totalWeeks: number;
      pointsEarned: number;
      nextReward: WeeklyStreakReward | null;
    };
  }> {
    const dailyStreak = await storage.getUserLoginStreak(userId);
    const weeklyStreak = await storage.getUserWeeklyStreak(userId);
    
    // Calculer la prochaine récompense quotidienne
    const nextDailyDay = dailyStreak ? 
      ((dailyStreak.currentStreak || 0) >= 7 ? 1 : (dailyStreak.currentStreak || 0) + 1) : 1;
    const nextDailyReward = this.DAILY_STREAK_REWARDS.find(r => r.day === nextDailyDay);
    
    // Calculer la prochaine récompense hebdomadaire
    const nextWeeklyWeek = weeklyStreak ? 
      ((weeklyStreak.currentWeeklyStreak || 0) >= 4 ? 1 : (weeklyStreak.currentWeeklyStreak || 0) + 1) : 1;
    const nextWeeklyReward = this.WEEKLY_STREAK_REWARDS.find(r => r.week === nextWeeklyWeek);
    
    return {
      dailyStreak: {
        current: dailyStreak?.currentStreak || 0,
        longest: dailyStreak?.longestStreak || 0,
        totalLogins: dailyStreak?.totalLogins || 0,
        pointsEarned: dailyStreak?.visuPointsEarned || 0,
        nextReward: nextDailyReward || null
      },
      weeklyStreak: {
        current: weeklyStreak?.currentWeeklyStreak || 0,
        longest: weeklyStreak?.longestWeeklyStreak || 0,
        totalWeeks: weeklyStreak?.totalWeeksLogged || 0,
        pointsEarned: weeklyStreak?.visuPointsEarned || 0,
        nextReward: nextWeeklyReward || null
      }
    };
  }

  /**
   * Calcule le format de semaine ISO (YYYY-WNN)
   */
  private static getWeekString(date: Date): string {
    const year = date.getFullYear();
    const oneJan = new Date(year, 0, 1);
    const numberOfDays = Math.floor((date.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((numberOfDays + oneJan.getDay() + 1) / 7);
    
    return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
  }

  /**
   * Récupère les barèmes de récompenses pour l'affichage
   */
  static getRewardScales(): {
    daily: DailyStreakReward[];
    weekly: WeeklyStreakReward[];
  } {
    return {
      daily: this.DAILY_STREAK_REWARDS,
      weekly: this.WEEKLY_STREAK_REWARDS
    };
  }
}