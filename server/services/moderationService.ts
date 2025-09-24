import { storage } from '../storage';
import { miniSocialConfigService } from './miniSocialConfigService';
import type { User } from '@shared/schema';

/**
 * Service de modération automatique pour le mini réseau social
 * Gère le filtrage IA, slow-mode, et limitations sur les comptes récents
 */
export class ModerationService {
  private userLastMessage: Map<string, number> = new Map(); // userId -> timestamp
  private userMessageCount: Map<string, { count: number, resetTime: number }> = new Map();
  
  private readonly SLOW_MODE_INTERVALS = {
    slow: 5000,    // 5 secondes entre messages
    normal: 1000,  // 1 seconde entre messages  
    fast: 500      // 0.5 seconde entre messages
  };

  private readonly RATE_LIMITS = {
    newAccount: { maxMessages: 3, windowMs: 60000 }, // 3 messages/minute pour nouveaux comptes
    verified: { maxMessages: 10, windowMs: 60000 },   // 10 messages/minute pour comptes vérifiés
    premium: { maxMessages: 20, windowMs: 60000 }     // 20 messages/minute pour comptes premium
  };

  /**
   * Vérifie si un utilisateur peut poster un message selon les règles de modération
   */
  async canUserPostMessage(userId: string, content: string): Promise<{
    allowed: boolean;
    reason?: string;
    timeToWait?: number;
    action?: 'slow_mode' | 'rate_limit' | 'content_filter' | 'account_restriction';
  }> {
    try {
      // 1. Récupérer l'utilisateur et la configuration
      const user = await storage.getUser(userId);
      if (!user) {
        return { allowed: false, reason: "Utilisateur non trouvé", action: 'account_restriction' };
      }

      const config = await miniSocialConfigService.getConfig();

      // 2. Vérifier les restrictions de compte
      const accountCheck = await this.checkAccountRestrictions(user);
      if (!accountCheck.allowed) {
        return accountCheck;
      }

      // 3. Vérifier le slow-mode
      if (config.slowMode) {
        const slowModeCheck = await this.checkSlowMode(userId, user);
        if (!slowModeCheck.allowed) {
          return slowModeCheck;
        }
      }

      // 4. Vérifier les limites de fréquence
      const rateLimitCheck = this.checkRateLimit(userId, user);
      if (!rateLimitCheck.allowed) {
        return rateLimitCheck;
      }

      // 5. Filtrage de contenu IA (si activé)
      if (config.aiModeration) {
        const contentCheck = await this.checkContentFilter(content, user);
        if (!contentCheck.allowed) {
          return contentCheck;
        }
      }

      // 6. Enregistrer le timestamp et incrémenter le compteur
      this.updateUserActivity(userId);

      // Audit log pour messages autorisés
      await this.logModerationDecision(userId, 'message_approved', {
        contentLength: content.length,
        userType: this.getUserType(user),
        slowMode: config.slowMode,
        aiModeration: config.aiModeration
      });

      return { allowed: true };

    } catch (error) {
      console.error('[Moderation] Erreur lors de la vérification:', error);
      await this.logModerationDecision(userId, 'moderation_error', {
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
      
      // En cas d'erreur, on bloque par sécurité
      return { 
        allowed: false, 
        reason: "Erreur de modération - veuillez réessayer",
        action: 'content_filter'
      };
    }
  }

  /**
   * Vérifie les restrictions liées au type et ancienneté du compte
   */
  private async checkAccountRestrictions(user: User): Promise<{
    allowed: boolean;
    reason?: string;
    action?: 'account_restriction';
  }> {
    // Vérifier que l'utilisateur a un profil valide
    if (!user.profileType) {
      return {
        allowed: false,
        reason: "Profil utilisateur invalide",
        action: 'account_restriction'
      };
    }

    // Vérifier KYC pour les fonctionnalités avancées
    if (!user.kycVerified) {
      // Les non-vérifiés peuvent poster mais avec des limitations
      const createdAt = user.createdAt ? new Date(user.createdAt).getTime() : Date.now();
      const accountAge = Date.now() - createdAt;
      const isNewAccount = accountAge < 7 * 24 * 60 * 60 * 1000; // 7 jours

      if (isNewAccount) {
        return {
          allowed: false,
          reason: "Compte trop récent - vérification KYC requise pour participer",
          action: 'account_restriction'
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Vérifie les règles de slow-mode
   */
  private checkSlowMode(userId: string, user: User): Promise<{
    allowed: boolean;
    reason?: string;
    timeToWait?: number;
    action?: 'slow_mode';
  }> {
    const lastMessageTime = this.userLastMessage.get(userId) || 0;
    const now = Date.now();
    const userType = this.getUserType(user);
    
    // Intervalle selon le type d'utilisateur
    let interval = this.SLOW_MODE_INTERVALS.slow; // Défaut pour nouveaux comptes
    if (user.kycVerified) {
      interval = this.SLOW_MODE_INTERVALS.normal;
    }
    if (user.profileType === 'admin' || user.profileType === 'creator') {
      interval = this.SLOW_MODE_INTERVALS.fast;
    }

    const timeSinceLastMessage = now - lastMessageTime;
    
    if (timeSinceLastMessage < interval) {
      const timeToWait = interval - timeSinceLastMessage;
      return Promise.resolve({
        allowed: false,
        reason: `Slow-mode actif - attendez ${Math.ceil(timeToWait / 1000)} secondes`,
        timeToWait,
        action: 'slow_mode'
      });
    }

    return Promise.resolve({ allowed: true });
  }

  /**
   * Vérifie les limites de fréquence de messages
   */
  private checkRateLimit(userId: string, user: User): {
    allowed: boolean;
    reason?: string;
    timeToWait?: number;
    action?: 'rate_limit';
  } {
    const now = Date.now();
    const userType = this.getUserType(user);
    
    // Sélectionner les limites selon le type d'utilisateur
    let limits = this.RATE_LIMITS.newAccount;
    if (user.kycVerified) {
      limits = this.RATE_LIMITS.verified;
    }
    if (user.profileType === 'admin' || user.profileType === 'creator') {
      limits = this.RATE_LIMITS.premium;
    }

    const userStats = this.userMessageCount.get(userId);
    
    if (!userStats || now > userStats.resetTime) {
      // Nouveau compteur ou fenêtre expirée
      this.userMessageCount.set(userId, {
        count: 0,
        resetTime: now + limits.windowMs
      });
      return { allowed: true };
    }

    if (userStats.count >= limits.maxMessages) {
      const timeToWait = userStats.resetTime - now;
      return {
        allowed: false,
        reason: `Limite de messages atteinte (${limits.maxMessages}/${Math.ceil(limits.windowMs/60000)}min)`,
        timeToWait,
        action: 'rate_limit'
      };
    }

    return { allowed: true };
  }

  /**
   * Filtrage de contenu avec IA (optionnel selon disponibilité OpenAI)
   */
  private async checkContentFilter(content: string, user: User): Promise<{
    allowed: boolean;
    reason?: string;
    action?: 'content_filter';
  }> {
    try {
      // Filtrage basique par mots-clés (toujours actif)
      const basicFilter = this.basicContentFilter(content);
      if (!basicFilter.allowed) {
        await this.logModerationDecision(user.id, 'content_filtered_basic', {
          reason: basicFilter.reason,
          contentLength: content.length
        });
        return basicFilter;
      }

      // Filtrage IA avancé (optionnel si OpenAI disponible)
      const aiFilter = await this.aiContentFilter(content);
      if (!aiFilter.allowed) {
        await this.logModerationDecision(user.id, 'content_filtered_ai', {
          reason: aiFilter.reason,
          contentLength: content.length
        });
        return aiFilter;
      }

      return { allowed: true };

    } catch (error) {
      console.error('[Moderation] Erreur filtrage contenu:', error);
      
      // En cas d'erreur IA, utiliser seulement le filtrage basique
      const basicFilter = this.basicContentFilter(content);
      if (!basicFilter.allowed) {
        return basicFilter;
      }

      // Si le filtrage basique passe, autoriser malgré l'erreur IA
      return { allowed: true };
    }
  }

  /**
   * Filtrage basique par mots-clés et règles simples
   */
  private basicContentFilter(content: string): {
    allowed: boolean;
    reason?: string;
    action?: 'content_filter';
  } {
    const trimmed = content.trim();
    
    // Messages vides ou trop courts
    if (trimmed.length < 1) {
      return {
        allowed: false,
        reason: "Message trop court",
        action: 'content_filter'
      };
    }

    // Messages trop longs
    if (trimmed.length > 500) {
      return {
        allowed: false,
        reason: "Message trop long (max 500 caractères)",
        action: 'content_filter'
      };
    }

    // Spam détection simple
    const repeatedChars = /(.)\1{10,}/.test(trimmed); // Plus de 10 caractères identiques consécutifs
    if (repeatedChars) {
      return {
        allowed: false,
        reason: "Spam détecté",
        action: 'content_filter'
      };
    }

    // Messages en majuscules excessives
    const upperCaseRatio = (trimmed.match(/[A-Z]/g) || []).length / trimmed.length;
    if (trimmed.length > 20 && upperCaseRatio > 0.7) {
      return {
        allowed: false,
        reason: "Évitez les messages entièrement en majuscules",
        action: 'content_filter'
      };
    }

    // Mots-clés interdits basiques
    const forbiddenWords = [
      'spam', 'scam', 'hack', 'bot', 'fake',
      // Ajouter d'autres mots selon les besoins
    ];

    const lowerContent = trimmed.toLowerCase();
    for (const word of forbiddenWords) {
      if (lowerContent.includes(word)) {
        return {
          allowed: false,
          reason: "Contenu non autorisé détecté",
          action: 'content_filter'
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Filtrage IA avancé (utilise OpenAI si disponible)
   */
  private async aiContentFilter(content: string): Promise<{
    allowed: boolean;
    reason?: string;
    action?: 'content_filter';
  }> {
    // Vérifier si OpenAI est disponible
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      // Pas d'OpenAI configuré, passer le filtrage IA
      return { allowed: true };
    }

    try {
      // Simple vérification de modération avec OpenAI
      // (Ici on simule, implémentation réelle nécessiterait le SDK OpenAI)
      
      // Pour l'instant, simuler une vérification IA simple
      const suspiciousPatterns = [
        /\b(buy|sell|crypto|bitcoin|investment|money|profit)\b/i,
        /\b(click|link|url|website|visit)\b.*\b(here|now|quick)\b/i,
        /\b(urgent|limited|offer|deal|discount)\b/i
      ];

      for (const pattern of suspiciousPatterns) {
        if (pattern.test(content)) {
          return {
            allowed: false,
            reason: "Contenu potentiellement promotionnel détecté",
            action: 'content_filter'
          };
        }
      }

      return { allowed: true };

    } catch (error) {
      console.error('[Moderation] Erreur filtrage IA:', error);
      // En cas d'erreur IA, autoriser le message
      return { allowed: true };
    }
  }

  /**
   * Met à jour l'activité de l'utilisateur
   */
  private updateUserActivity(userId: string): void {
    const now = Date.now();
    
    // Mettre à jour le timestamp du dernier message
    this.userLastMessage.set(userId, now);
    
    // Incrémenter le compteur de messages
    const userStats = this.userMessageCount.get(userId);
    if (userStats && now <= userStats.resetTime) {
      userStats.count++;
    }
  }

  /**
   * Détermine le type d'utilisateur pour les règles de modération
   */
  private getUserType(user: User): 'new' | 'verified' | 'premium' | 'admin' {
    if (user.profileType === 'admin') return 'admin';
    if (user.profileType === 'creator') return 'premium';
    if (user.kycVerified) return 'verified';
    return 'new';
  }

  /**
   * Enregistre les décisions de modération dans l'audit log
   */
  private async logModerationDecision(userId: string, action: string, metadata: any): Promise<void> {
    try {
      await storage.createAuditLog({
        userId,
        action: 'admin_access', // Utiliser une action valide du schema
        details: `Modération: ${action} pour utilisateur ${userId} | ${JSON.stringify(metadata)}`,
        ipAddress: '127.0.0.1',
        userAgent: 'ModerationService/1.0'
      });
    } catch (error) {
      console.error('[Moderation] Erreur lors de l\'audit log:', error);
    }
  }

  /**
   * Nettoie les données temporaires (pour optimisation mémoire)
   */
  public cleanup(): void {
    const now = Date.now();
    const cleanupAge = 60 * 60 * 1000; // 1 heure

    // Nettoyer les anciens timestamps
    for (const [userId, timestamp] of Array.from(this.userLastMessage.entries())) {
      if (now - timestamp > cleanupAge) {
        this.userLastMessage.delete(userId);
      }
    }

    // Nettoyer les anciens compteurs
    for (const [userId, stats] of Array.from(this.userMessageCount.entries())) {
      if (now > stats.resetTime + cleanupAge) {
        this.userMessageCount.delete(userId);
      }
    }

    console.log(`[Moderation] Cleanup: ${this.userLastMessage.size} timestamps, ${this.userMessageCount.size} compteurs`);
  }

  /**
   * Obtient les statistiques de modération
   */
  public getStats() {
    return {
      activeUsers: this.userLastMessage.size,
      rateLimitedUsers: Array.from(this.userMessageCount.entries())
        .filter(([_, stats]) => Date.now() <= stats.resetTime)
        .length,
      slowModeIntervals: this.SLOW_MODE_INTERVALS,
      rateLimits: this.RATE_LIMITS
    };
  }
}

// Instance singleton
export const moderationService = new ModerationService();