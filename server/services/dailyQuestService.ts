/**
 * Service de gestion des quêtes quotidiennes "Surprise du jour"
 * Génère et gère les quêtes quotidiennes pour l'engagement utilisateur
 */

import { storage } from '../storage';
import { VISUPointsService } from './visuPointsService';
import { DAILY_QUESTS } from '@shared/constants';
import type { DailyQuest, InsertDailyQuest } from '@shared/schema';

export class DailyQuestService {
  /**
   * Génère ou récupère la quête du jour pour un utilisateur
   */
  static async getTodayQuest(userId: string): Promise<DailyQuest | null> {
    const today = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD
    
    try {
      // Vérifier s'il y a déjà une quête pour aujourd'hui
      const existingQuest = await storage.getUserDailyQuest(userId, today);
      
      if (existingQuest) {
        return existingQuest;
      }
      
      // Générer une nouvelle quête pour aujourd'hui
      return await this.generateDailyQuest(userId, today);
    } catch (error) {
      console.error(`[DAILY_QUEST] Error getting today's quest for user ${userId}:`, error);
      return null;
    }
  }

  /**
   * Génère une nouvelle quête quotidienne aléatoire
   */
  private static async generateDailyQuest(userId: string, questDate: string): Promise<DailyQuest> {
    // Sélectionner un type de quête aléatoirement
    const questTypeKeys = Object.keys(DAILY_QUESTS.questTypes) as Array<keyof typeof DAILY_QUESTS.questTypes>;
    const randomQuestType = questTypeKeys[Math.floor(Math.random() * questTypeKeys.length)];
    const questConfig = DAILY_QUESTS.questTypes[randomQuestType];
    
    const questData: InsertDailyQuest = {
      userId,
      questDate,
      questType: randomQuestType,
      questTitle: questConfig.title,
      questDescription: questConfig.description,
      targetCount: questConfig.target,
      currentCount: 0,
      rewardVP: questConfig.reward,
      isCompleted: false,
      isRewardClaimed: false
    };

    return await storage.createDailyQuest(questData);
  }

  /**
   * Met à jour la progression d'une quête
   */
  static async updateQuestProgress(
    userId: string, 
    questType: string, 
    increment: number = 1
  ): Promise<DailyQuest | null> {
    const today = new Date().toISOString().split('T')[0];
    
    try {
      const quest = await storage.getUserDailyQuest(userId, today, questType);
      
      if (!quest || quest.isCompleted) {
        return quest || null;
      }

      const newCount = (quest.currentCount || 0) + increment;
      const isCompleted = newCount >= (quest.targetCount || 1);

      const updatedQuest = await storage.updateDailyQuest(quest.id, {
        currentCount: newCount,
        isCompleted,
        completedAt: isCompleted ? new Date() : undefined
      });

      if (isCompleted) {
        console.log(`[DAILY_QUEST] Quest completed! User ${userId} finished "${quest.questTitle}"`);
      }

      return updatedQuest;
    } catch (error) {
      console.error(`[DAILY_QUEST] Error updating quest progress:`, error);
      return null;
    }
  }

  /**
   * Réclamer la récompense d'une quête complétée
   */
  static async claimQuestReward(userId: string, questId: string): Promise<{
    success: boolean;
    visuPointsAwarded?: number;
    error?: string;
  }> {
    try {
      const quest = await storage.getDailyQuestById(questId);
      
      if (!quest) {
        return { success: false, error: "Quête introuvable" };
      }

      if (quest.userId !== userId) {
        return { success: false, error: "Cette quête ne vous appartient pas" };
      }

      if (!quest.isCompleted) {
        return { success: false, error: "Quête non complétée" };
      }

      if (quest.isRewardClaimed) {
        return { success: false, error: "Récompense déjà réclamée" };
      }

      // Attribuer les VISUpoints
      await VISUPointsService.awardPoints({
        userId,
        amount: quest.rewardVP || DAILY_QUESTS.defaultReward,
        reason: `Quête quotidienne: ${quest.questTitle}`,
        referenceId: quest.id,
        referenceType: 'daily_quest'
      });

      // Marquer la récompense comme réclamée
      await storage.updateDailyQuest(questId, {
        isRewardClaimed: true,
        rewardClaimedAt: new Date()
      });

      console.log(`[DAILY_QUEST] Reward claimed! User ${userId} earned ${quest.rewardVP} VP`);

      return { 
        success: true, 
        visuPointsAwarded: quest.rewardVP || DAILY_QUESTS.defaultReward 
      };
    } catch (error) {
      console.error(`[DAILY_QUEST] Error claiming quest reward:`, error);
      return { success: false, error: "Erreur lors de la réclamation de la récompense" };
    }
  }

  /**
   * Obtenir les statistiques des quêtes pour un utilisateur
   */
  static async getUserQuestStats(userId: string): Promise<{
    totalCompleted: number;
    currentStreak: number;
    totalVPEarned: number;
    todayQuest: DailyQuest | null;
  }> {
    try {
      const stats = await storage.getUserQuestStatistics(userId);
      const todayQuest = await this.getTodayQuest(userId);

      return {
        totalCompleted: stats?.totalCompleted || 0,
        currentStreak: stats?.currentStreak || 0,
        totalVPEarned: stats?.totalVPEarned || 0,
        todayQuest
      };
    } catch (error) {
      console.error(`[DAILY_QUEST] Error getting user quest stats:`, error);
      return {
        totalCompleted: 0,
        currentStreak: 0,
        totalVPEarned: 0,
        todayQuest: null
      };
    }
  }

  /**
   * Déclencher la progression des quêtes basées sur les actions utilisateur
   */
  static async triggerQuestProgress(userId: string, action: string, data?: any): Promise<void> {
    try {
      switch (action) {
        case 'project_viewed':
          await this.updateQuestProgress(userId, 'explore_projects');
          await this.updateQuestProgress(userId, 'video_watch');
          break;
          
        case 'investment_made':
          await this.updateQuestProgress(userId, 'make_investment');
          break;
          
        case 'social_interaction':
          await this.updateQuestProgress(userId, 'social_activity');
          break;
          
        case 'live_participation':
          await this.updateQuestProgress(userId, 'live_participation');
          break;
          
        default:
          // Action non reconnue, ne rien faire
          break;
      }
    } catch (error) {
      console.error(`[DAILY_QUEST] Error triggering quest progress for action ${action}:`, error);
    }
  }
}