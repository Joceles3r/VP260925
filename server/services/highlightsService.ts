import { storage } from '../storage';
import { miniSocialConfigService } from './miniSocialConfigService';

/**
 * Service de gestion des highlights pour le mode trafic élevé
 * Sélectionne et gère les meilleurs messages pour affichage en lecture seule
 */
export class HighlightsService {
  private liveShowHighlights: Map<string, HighlightMessage[]> = new Map(); // liveShowId -> highlights
  private messageStats: Map<string, MessageStats> = new Map(); // messageId -> stats
  
  private readonly MAX_HIGHLIGHTS_PER_SHOW = 10;
  private readonly MIN_REACTIONS_FOR_HIGHLIGHT = 3;
  private readonly HIGHLIGHT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

  /**
   * Ajoute un message pour évaluation en tant que highlight potentiel
   */
  async addMessage(liveShowId: string, message: SocialMessage): Promise<void> {
    try {
      // Initialiser les stats du message
      this.messageStats.set(message.messageId, {
        messageId: message.messageId,
        userId: message.userId,
        content: message.content,
        timestamp: new Date(message.timestamp),
        reactions: new Map(),
        totalReactions: 0,
        uniqueReactors: new Set(),
        score: 0
      });

      // Nettoyer les anciens messages du live show
      await this.cleanupOldMessages(liveShowId);

      console.log(`[Highlights] Message ${message.messageId} ajouté pour évaluation dans ${liveShowId}`);

    } catch (error) {
      console.error('[Highlights] Erreur lors de l\'ajout du message:', error);
    }
  }

  /**
   * Ajoute une réaction à un message et recalcule les highlights
   */
  async addReaction(liveShowId: string, messageId: string, userId: string, reaction: string): Promise<void> {
    try {
      const messageStats = this.messageStats.get(messageId);
      if (!messageStats) {
        console.log(`[Highlights] Message ${messageId} non trouvé pour réaction`);
        return;
      }

      // Ajouter la réaction
      if (!messageStats.reactions.has(reaction)) {
        messageStats.reactions.set(reaction, new Set());
      }
      messageStats.reactions.get(reaction)!.add(userId);
      messageStats.uniqueReactors.add(userId);

      // Recalculer les totaux
      messageStats.totalReactions = Array.from(messageStats.reactions.values())
        .reduce((total, users) => total + users.size, 0);

      // Recalculer le score
      messageStats.score = this.calculateMessageScore(messageStats);

      // Mettre à jour les highlights si nécessaire
      await this.updateHighlights(liveShowId);

      console.log(`[Highlights] Réaction ${reaction} ajoutée au message ${messageId} (score: ${messageStats.score})`);

    } catch (error) {
      console.error('[Highlights] Erreur lors de l\'ajout de réaction:', error);
    }
  }

  /**
   * Calcule le score d'un message pour déterminer s'il doit être un highlight
   */
  private calculateMessageScore(stats: MessageStats): number {
    const ageMinutes = (Date.now() - stats.timestamp.getTime()) / (1000 * 60);
    const ageFactor = Math.max(0, 1 - (ageMinutes / 30)); // Diminue avec l'âge (30 min max)
    
    // Score basé sur les réactions uniques et la diversité
    const reactionScore = stats.uniqueReactors.size * 2; // Privilégier les réactions uniques
    const diversityBonus = stats.reactions.size; // Bonus pour diversité des réactions
    
    // Bonus pour les messages avec contenu de qualité (heuristique simple)
    const contentBonus = this.getContentQualityBonus(stats.content);
    
    return (reactionScore + diversityBonus + contentBonus) * ageFactor;
  }

  /**
   * Calcule un bonus de qualité pour le contenu du message
   */
  private getContentQualityBonus(content: string): number {
    let bonus = 0;
    
    // Bonus pour longueur appropriée
    if (content.length >= 20 && content.length <= 200) {
      bonus += 2;
    }
    
    // Bonus pour questions (engagement)
    if (content.includes('?')) {
      bonus += 1;
    }
    
    // Bonus pour mots-clés positifs
    const positiveWords = ['bravo', 'excellent', 'super', 'génial', 'merci', 'wow'];
    const hasPositive = positiveWords.some(word => content.toLowerCase().includes(word));
    if (hasPositive) {
      bonus += 1;
    }
    
    // Malus pour majuscules excessives
    const upperCaseRatio = (content.match(/[A-Z]/g) || []).length / content.length;
    if (upperCaseRatio > 0.5) {
      bonus -= 2;
    }
    
    return Math.max(0, bonus);
  }

  /**
   * Met à jour la liste des highlights pour un live show
   */
  private async updateHighlights(liveShowId: string): Promise<void> {
    try {
      // Récupérer tous les messages du live show
      const liveShowMessages = Array.from(this.messageStats.values())
        .filter(stats => {
          // Filtrer par fenêtre temporelle (messages récents seulement)
          const age = Date.now() - stats.timestamp.getTime();
          return age <= this.HIGHLIGHT_WINDOW_MS;
        })
        .filter(stats => stats.totalReactions >= this.MIN_REACTIONS_FOR_HIGHLIGHT)
        .sort((a, b) => b.score - a.score) // Trier par score décroissant
        .slice(0, this.MAX_HIGHLIGHTS_PER_SHOW); // Garder seulement le top N

      // Convertir en format highlight
      const highlights: HighlightMessage[] = liveShowMessages.map(stats => ({
        messageId: stats.messageId,
        userId: stats.userId,
        content: stats.content,
        timestamp: stats.timestamp.toISOString(),
        score: stats.score,
        reactions: this.formatReactions(stats.reactions),
        isHighlight: true
      }));

      // Mettre à jour le cache
      this.liveShowHighlights.set(liveShowId, highlights);

      console.log(`[Highlights] Mis à jour ${highlights.length} highlights pour ${liveShowId}`);

    } catch (error) {
      console.error('[Highlights] Erreur lors de la mise à jour des highlights:', error);
    }
  }

  /**
   * Formate les réactions pour l'affichage
   */
  private formatReactions(reactions: Map<string, Set<string>>): ReactionSummary[] {
    return Array.from(reactions.entries()).map(([reaction, users]) => ({
      reaction,
      count: users.size,
      users: Array.from(users)
    }));
  }

  /**
   * Récupère les highlights actuels pour un live show
   */
  getHighlights(liveShowId: string): HighlightMessage[] {
    return this.liveShowHighlights.get(liveShowId) || [];
  }

  /**
   * Nettoie les anciens messages pour optimiser la mémoire
   */
  private async cleanupOldMessages(liveShowId: string): Promise<void> {
    const now = Date.now();
    const expireAge = this.HIGHLIGHT_WINDOW_MS * 2; // Garde 2x la fenêtre

    // Nettoyer les stats de messages expirés
    for (const [messageId, stats] of Array.from(this.messageStats.entries())) {
      const age = now - stats.timestamp.getTime();
      if (age > expireAge) {
        this.messageStats.delete(messageId);
      }
    }

    // Nettoyer les highlights expirés
    const currentHighlights = this.liveShowHighlights.get(liveShowId) || [];
    const validHighlights = currentHighlights.filter(highlight => {
      const age = now - new Date(highlight.timestamp).getTime();
      return age <= expireAge;
    });

    if (validHighlights.length !== currentHighlights.length) {
      this.liveShowHighlights.set(liveShowId, validHighlights);
    }
  }

  /**
   * Force la régénération des highlights pour un live show (admin)
   */
  async regenerateHighlights(liveShowId: string): Promise<HighlightMessage[]> {
    await this.updateHighlights(liveShowId);
    return this.getHighlights(liveShowId);
  }

  /**
   * Nettoie complètement les données d'un live show terminé
   */
  async cleanupLiveShow(liveShowId: string): Promise<void> {
    this.liveShowHighlights.delete(liveShowId);
    
    // Nettoyer les stats de messages de ce live show
    // Note: On ne peut pas facilement identifier les messages par live show
    // dans le design actuel, donc on nettoie par âge
    await this.cleanupOldMessages(liveShowId);
    
    console.log(`[Highlights] Nettoyage complet pour live show ${liveShowId}`);
  }

  /**
   * Obtient les statistiques des highlights
   */
  getStats() {
    const totalHighlights = Array.from(this.liveShowHighlights.values())
      .reduce((total, highlights) => total + highlights.length, 0);
    
    return {
      activeLiveShows: this.liveShowHighlights.size,
      totalHighlights,
      totalMessages: this.messageStats.size,
      maxHighlightsPerShow: this.MAX_HIGHLIGHTS_PER_SHOW,
      minReactionsForHighlight: this.MIN_REACTIONS_FOR_HIGHLIGHT,
      highlightWindowMinutes: this.HIGHLIGHT_WINDOW_MS / (1000 * 60)
    };
  }
}

// Types pour les highlights
interface SocialMessage {
  messageId: string;
  userId: string;
  content: string;
  timestamp: string;
  liveShowId: string;
}

interface MessageStats {
  messageId: string;
  userId: string;
  content: string;
  timestamp: Date;
  reactions: Map<string, Set<string>>; // reaction -> Set of userIds
  totalReactions: number;
  uniqueReactors: Set<string>;
  score: number;
}

interface HighlightMessage {
  messageId: string;
  userId: string;
  content: string;
  timestamp: string;
  score: number;
  reactions: ReactionSummary[];
  isHighlight: true;
}

interface ReactionSummary {
  reaction: string;
  count: number;
  users: string[];
}

// Instance singleton
export const highlightsService = new HighlightsService();