/**
 * Service de gestion des fonctionnalités sociales interactives en direct
 * 
 * Gère les réactions, sondages, prédictions, badges et points d'engagement
 * en temps réel pendant les Live Shows
 */

import { storage } from '../storage';
import { getNotificationService } from '../websocket';
import type {
  LiveChatMessage,
  MessageReaction,
  LivePoll,
  PollVote,
  EngagementPoint,
  UserBadge,
  LivePrediction,
  PredictionBet
} from '@shared/schema';

export type ReactionType = 'like' | 'love' | 'laugh' | 'wow' | 'sad' | 'angry';

export interface ReactionStats {
  messageId: string;
  totalReactions: number;
  reactionsByType: Record<ReactionType, number>;
  userReacted: boolean;
  userReaction?: ReactionType;
}

export interface PollResult {
  pollId: string;
  question: string;
  options: string[];
  votes: number[];
  totalVotes: number;
  userVoted: boolean;
  userVoteIndex?: number;
  isActive: boolean;
}

export interface EngagementStats {
  userId: string;
  totalPoints: number;
  todayPoints: number;
  rank: number;
  badges: UserBadge[];
  level: string;
}

export class LiveSocialService {
  private messageReactionCache: Map<string, ReactionStats> = new Map();
  private pollResultsCache: Map<string, PollResult> = new Map();
  private userEngagementCache: Map<string, EngagementStats> = new Map();

  // ===== CHAT MESSAGES & REACTIONS =====

  /**
   * Envoie un message de chat en direct avec validation automatique
   */
  async sendChatMessage(liveShowId: string, userId: string, content: string): Promise<LiveChatMessage> {
    try {
      // Valider le message via le service de modération
      const { moderationService } = await import('./moderationService');
      const validation = await moderationService.canUserPostMessage(userId, content);

      if (!validation.allowed) {
        throw new Error(`Message rejeté: ${validation.reason}`);
      }

      // Créer le message
      const messageData = {
        liveShowId,
        userId,
        content: content.trim(),
        messageType: 'chat' as const,
        isModerated: !validation.allowed,
        moderationReason: validation.allowed ? null : validation.reason
      };

      const message = await storage.createLiveChatMessage(messageData);

      // Ajouter des points d'engagement
      await this.awardEngagementPoints(userId, liveShowId, 'message', 5, 'Message envoyé');

      // Diffuser le message via WebSocket
      const ws = getNotificationService();
      await ws.broadcastToRoom(`live_show_${liveShowId}`, 'live_chat_message', {
        message,
        liveShowId
      });

      console.log(`[LiveSocial] Message envoyé par ${userId} dans ${liveShowId}`);
      return message;

    } catch (error) {
      console.error('[LiveSocial] Erreur lors de l\'envoi du message:', error);
      throw error;
    }
  }

  /**
   * Ajoute une réaction à un message avec mise à jour temps réel
   */
  async addMessageReaction(messageId: string, userId: string, reaction: ReactionType): Promise<ReactionStats> {
    try {
      // Vérifier si l'utilisateur a déjà réagi
      const existingReaction = await storage.getUserMessageReaction(messageId, userId);
      
      if (existingReaction) {
        if (existingReaction.reaction === reaction) {
          // Supprimer la réaction si identique
          await storage.removeMessageReaction(messageId, userId, reaction);
        } else {
          // Changer la réaction
          await storage.updateMessageReaction(existingReaction.id, { reaction });
        }
      } else {
        // Ajouter nouvelle réaction
        await storage.createMessageReaction({
          messageId,
          userId,
          reaction
        });
      }

      // Mettre à jour le compteur sur le message
      const reactionStats = await this.getMessageReactionStats(messageId, userId);
      await storage.updateLiveChatMessage(messageId, {
        reactionCount: reactionStats.totalReactions
      });

      // Ajouter des points d'engagement
      const message = await storage.getLiveChatMessage(messageId);
      if (message) {
        await this.awardEngagementPoints(userId, message.liveShowId, 'reaction', 2, 'Réaction ajoutée');
      }

      // Diffuser la mise à jour via WebSocket
      const ws = getNotificationService();
      if (message) {
        await ws.broadcastToRoom(`live_show_${message.liveShowId}`, 'message_reaction_update', {
          messageId,
          reactionStats,
          liveShowId: message.liveShowId
        });
      }

      console.log(`[LiveSocial] Réaction ${reaction} ajoutée par ${userId} sur message ${messageId}`);
      return reactionStats;

    } catch (error) {
      console.error('[LiveSocial] Erreur lors de l\'ajout de réaction:', error);
      throw error;
    }
  }

  /**
   * Récupère les statistiques de réactions pour un message
   */
  async getMessageReactionStats(messageId: string, userId?: string): Promise<ReactionStats> {
    try {
      const reactions = await storage.getMessageReactions(messageId);
      
      const reactionsByType: Record<ReactionType, number> = {
        like: 0,
        love: 0,
        laugh: 0,
        wow: 0,
        sad: 0,
        angry: 0
      };

      let userReacted = false;
      let userReaction: ReactionType | undefined;

      reactions.forEach(reaction => {
        const type = reaction.reaction as ReactionType;
        reactionsByType[type]++;

        if (userId && reaction.userId === userId) {
          userReacted = true;
          userReaction = type;
        }
      });

      const stats: ReactionStats = {
        messageId,
        totalReactions: reactions.length,
        reactionsByType,
        userReacted,
        userReaction
      };

      // Cache pour 30 secondes
      this.messageReactionCache.set(messageId, stats);
      setTimeout(() => this.messageReactionCache.delete(messageId), 30000);

      return stats;

    } catch (error) {
      console.error('[LiveSocial] Erreur lors de la récupération des stats de réaction:', error);
      throw error;
    }
  }

  // ===== SONDAGES EN DIRECT =====

  /**
   * Crée un sondage en direct
   */
  async createLivePoll(liveShowId: string, createdBy: string, question: string, options: string[], durationMinutes = 5): Promise<LivePoll> {
    try {
      const endsAt = new Date(Date.now() + durationMinutes * 60 * 1000);

      const pollData = {
        liveShowId,
        createdBy,
        question: question.trim(),
        options: JSON.stringify(options),
        endsAt
      };

      const poll = await storage.createLivePoll(pollData);

      // Diffuser le nouveau sondage
      const ws = getNotificationService();
      await ws.broadcastToRoom(`live_show_${liveShowId}`, 'live_poll_created', {
        poll: {
          ...poll,
          options: JSON.parse(poll.options as string)
        },
        liveShowId
      });

      console.log(`[LiveSocial] Sondage créé par ${createdBy} dans ${liveShowId}: ${question}`);
      return poll;

    } catch (error) {
      console.error('[LiveSocial] Erreur lors de la création du sondage:', error);
      throw error;
    }
  }

  /**
   * Vote sur un sondage en direct
   */
  async voteOnPoll(pollId: string, userId: string, optionIndex: number): Promise<PollResult> {
    try {
      const poll = await storage.getLivePoll(pollId);
      if (!poll || !poll.isActive || (poll.endsAt && poll.endsAt < new Date())) {
        throw new Error('Sondage non disponible ou expiré');
      }

      const options = JSON.parse(poll.options as string) as string[];
      if (optionIndex < 0 || optionIndex >= options.length) {
        throw new Error('Option de vote invalide');
      }

      // Vérifier si l'utilisateur a déjà voté
      const existingVote = await storage.getUserPollVote(pollId, userId);
      if (existingVote) {
        // Mettre à jour le vote
        await storage.updatePollVote(existingVote.id, { optionIndex });
      } else {
        // Nouveau vote
        await storage.createPollVote({
          pollId,
          userId,
          optionIndex
        });

        // Incrémenter le compteur total
        await storage.updateLivePoll(pollId, {
          totalVotes: poll.totalVotes + 1
        });
      }

      // Ajouter des points d'engagement
      await this.awardEngagementPoints(userId, poll.liveShowId, 'poll_vote', 10, 'Vote sur sondage');

      // Récupérer les résultats mis à jour
      const results = await this.getPollResults(pollId, userId);

      // Diffuser la mise à jour
      const ws = getNotificationService();
      await ws.broadcastToRoom(`live_show_${poll.liveShowId}`, 'poll_vote_update', {
        pollId,
        results,
        liveShowId: poll.liveShowId
      });

      console.log(`[LiveSocial] Vote ajouté par ${userId} sur sondage ${pollId}, option ${optionIndex}`);
      return results;

    } catch (error) {
      console.error('[LiveSocial] Erreur lors du vote:', error);
      throw error;
    }
  }

  /**
   * Récupère les résultats d'un sondage
   */
  async getPollResults(pollId: string, userId?: string): Promise<PollResult> {
    try {
      const poll = await storage.getLivePoll(pollId);
      if (!poll) {
        throw new Error('Sondage non trouvé');
      }

      const votes = await storage.getPollVotes(pollId);
      const options = JSON.parse(poll.options as string) as string[];
      
      const voteCounts = new Array(options.length).fill(0);
      let userVoted = false;
      let userVoteIndex: number | undefined;

      votes.forEach(vote => {
        voteCounts[vote.optionIndex]++;
        if (userId && vote.userId === userId) {
          userVoted = true;
          userVoteIndex = vote.optionIndex;
        }
      });

      const results: PollResult = {
        pollId,
        question: poll.question,
        options,
        votes: voteCounts,
        totalVotes: votes.length,
        userVoted,
        userVoteIndex,
        isActive: poll.isActive && (!poll.endsAt || poll.endsAt > new Date())
      };

      return results;

    } catch (error) {
      console.error('[LiveSocial] Erreur lors de la récupération des résultats:', error);
      throw error;
    }
  }

  // ===== SYSTÈME D'ENGAGEMENT ET BADGES =====

  /**
   * Attribue des points d'engagement à un utilisateur
   */
  async awardEngagementPoints(userId: string, liveShowId: string, pointType: string, points: number, description: string): Promise<void> {
    try {
      await storage.createEngagementPoint({
        userId,
        liveShowId,
        pointType,
        points,
        description
      });

      // Vérifier les badges à décerner
      await this.checkAndAwardBadges(userId, liveShowId, pointType);

      // Mettre à jour le cache des stats utilisateur
      this.userEngagementCache.delete(userId);

      console.log(`[LiveSocial] ${points} points '${pointType}' attribués à ${userId}: ${description}`);

    } catch (error) {
      console.error('[LiveSocial] Erreur lors de l\'attribution des points:', error);
    }
  }

  /**
   * Vérifie et attribue automatiquement les badges selon les activités
   */
  async checkAndAwardBadges(userId: string, liveShowId: string, activityType: string): Promise<void> {
    try {
      const userStats = await this.getUserEngagementStats(userId);

      // Badge "Early Bird" - premiers 10 messages du live
      if (activityType === 'message') {
        const messageCount = await storage.getUserLiveShowMessageCount(userId, liveShowId);
        if (messageCount === 1) {
          const totalMessages = await storage.getLiveShowMessageCount(liveShowId);
          if (totalMessages <= 10) {
            await this.awardBadge(userId, liveShowId, 'early_bird', 'Early Bird', 'Parmi les 10 premiers à écrire dans le chat');
          }
        }
      }

      // Badge "Chat Master" - 50+ messages dans un live
      if (activityType === 'message') {
        const messageCount = await storage.getUserLiveShowMessageCount(userId, liveShowId);
        if (messageCount >= 50) {
          await this.awardBadge(userId, liveShowId, 'chat_master', 'Chat Master', '50+ messages dans un Live Show');
        }
      }

      // Badge "Reaction King" - 100+ réactions données
      if (activityType === 'reaction') {
        const reactionCount = await storage.getUserLiveShowReactionCount(userId, liveShowId);
        if (reactionCount >= 100) {
          await this.awardBadge(userId, liveShowId, 'reaction_king', 'Reaction King', '100+ réactions dans un Live Show');
        }
      }

      // Badge "Top Investor" - plus gros investissement du live
      if (activityType === 'investment') {
        const isTopInvestor = await storage.isUserTopInvestorForLiveShow(userId, liveShowId);
        if (isTopInvestor) {
          await this.awardBadge(userId, liveShowId, 'top_investor', 'Top Investor', 'Plus gros investissement du Live Show');
        }
      }

    } catch (error) {
      console.error('[LiveSocial] Erreur lors de la vérification des badges:', error);
    }
  }

  /**
   * Attribue un badge à un utilisateur
   */
  async awardBadge(userId: string, liveShowId: string, badgeType: string, badgeName: string, badgeDescription: string): Promise<void> {
    try {
      // Vérifier si l'utilisateur a déjà ce badge pour ce live
      const existingBadge = await storage.getUserBadge(userId, badgeType, liveShowId);
      if (existingBadge) {
        return; // Badge déjà obtenu
      }

      const badge = await storage.createUserBadge({
        userId,
        liveShowId,
        badgeType,
        badgeName,
        badgeDescription
      });

      // Diffuser l'obtention du badge
      const ws = getNotificationService();
      await ws.sendToUser(userId, 'badge_earned', {
        badge,
        liveShowId
      });

      await ws.broadcastToRoom(`live_show_${liveShowId}`, 'user_badge_earned', {
        userId,
        badge,
        liveShowId
      });

      console.log(`[LiveSocial] Badge '${badgeName}' attribué à ${userId} pour ${liveShowId}`);

    } catch (error) {
      console.error('[LiveSocial] Erreur lors de l\'attribution du badge:', error);
    }
  }

  /**
   * Récupère les statistiques d'engagement d'un utilisateur
   */
  async getUserEngagementStats(userId: string): Promise<EngagementStats> {
    try {
      // Vérifier le cache
      const cached = this.userEngagementCache.get(userId);
      if (cached) {
        return cached;
      }

      const totalPoints = await storage.getUserTotalEngagementPoints(userId);
      const todayPoints = await storage.getUserDailyEngagementPoints(userId);
      const badges = await storage.getUserBadges(userId);
      const rank = await storage.getUserEngagementRank(userId);

      // Déterminer le niveau selon les points
      const level = this.calculateUserLevel(totalPoints);

      const stats: EngagementStats = {
        userId,
        totalPoints,
        todayPoints,
        rank,
        badges,
        level
      };

      // Cache pour 2 minutes
      this.userEngagementCache.set(userId, stats);
      setTimeout(() => this.userEngagementCache.delete(userId), 120000);

      return stats;

    } catch (error) {
      console.error('[LiveSocial] Erreur lors de la récupération des stats d\'engagement:', error);
      throw error;
    }
  }

  /**
   * Calcule le niveau d'un utilisateur selon ses points
   */
  private calculateUserLevel(totalPoints: number): string {
    if (totalPoints >= 10000) return 'Légende';
    if (totalPoints >= 5000) return 'Expert';
    if (totalPoints >= 2000) return 'Avancé';
    if (totalPoints >= 500) return 'Intermédiaire';
    if (totalPoints >= 100) return 'Débutant';
    return 'Nouveau';
  }

  /**
   * Récupère le leaderboard des utilisateurs les plus actifs
   */
  async getEngagementLeaderboard(liveShowId?: string, period: 'today' | 'week' | 'all' = 'today', limit = 10): Promise<EngagementStats[]> {
    try {
      const users = await storage.getTopEngagementUsers(liveShowId, period, limit);
      
      const leaderboard: EngagementStats[] = [];
      for (let i = 0; i < users.length; i++) {
        const userStats = await this.getUserEngagementStats(users[i].userId);
        userStats.rank = i + 1;
        leaderboard.push(userStats);
      }

      return leaderboard;

    } catch (error) {
      console.error('[LiveSocial] Erreur lors de la récupération du leaderboard:', error);
      throw error;
    }
  }

  /**
   * Nettoie les caches et données expirées
   */
  async cleanup(): Promise<void> {
    try {
      // Nettoyer les sondages expirés
      await storage.deactivateExpiredPolls();
      
      // Nettoyer les prédictions expirées
      await storage.deactivateExpiredPredictions();
      
      // Vider les caches
      this.messageReactionCache.clear();
      this.pollResultsCache.clear();
      this.userEngagementCache.clear();

      console.log('[LiveSocial] Nettoyage effectué');

    } catch (error) {
      console.error('[LiveSocial] Erreur lors du nettoyage:', error);
    }
  }

  /**
   * Récupère les messages d'un live show avec réactions
   */
  async getLiveShowMessages(liveShowId: string, limit = 50, offset = 0): Promise<Array<LiveChatMessage & { reactions: ReactionStats }>> {
    try {
      const messages = await storage.getLiveShowMessages(liveShowId, limit, offset);
      
      const messagesWithReactions = [];
      for (const message of messages) {
        const reactions = await this.getMessageReactionStats(message.id);
        messagesWithReactions.push({
          ...message,
          reactions
        });
      }

      return messagesWithReactions;

    } catch (error) {
      console.error('[LiveSocial] Erreur lors de la récupération des messages:', error);
      throw error;
    }
  }
}

// Instance singleton
export const liveSocialService = new LiveSocialService();