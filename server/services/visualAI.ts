/**
 * VisualAI - Agent Maître (Orchestrateur Global)
 * Supervision et pilotage de VISUAL : sécurité, UX, SEO, modération, orchestration
 */

import { z } from 'zod';
import { visualFinanceAI } from './visualFinanceAI';

// Configuration VisualAI
export const VISUAL_AI_CONFIG = {
  enabled: true,
  orchestration: {
    maxDecisionsPerMinute: 100,
    validationThresholds: {
      userBlock: true,           // Blocage utilisateur → validation humaine
      massEmail: 10000,          // Campagne > 10k emails → validation
      highPayment: 500,          // Paiement > 500€ → validation
      policyChange: true,        // Changement CGU → validation
      securityIncident: true     // Incident sécurité → validation
    }
  },
  moderation: {
    autoSuspendThreshold: 3,     // Suspension auto après 3 signalements
    escalationScore: 75,         // Score > 75 → escalade humaine
    reviewTimeoutHours: 24       // Timeout pour review humaine
  },
  seo: {
    autoSitemapGeneration: true,
    hreflangManagement: true,
    schemaOrgEnabled: true
  }
} as const;

// Validation schemas
export const orchestrationCommandSchema = z.object({
  action: z.enum(['category_close', 'user_moderation', 'seo_update', 'notification_send']),
  parameters: z.record(z.any()),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  requiresValidation: z.boolean().default(false)
});

export const moderationDecisionSchema = z.object({
  contentId: z.string(),
  contentType: z.enum(['project', 'article', 'social_post', 'comment']),
  action: z.enum(['approve', 'suspend', 'block', 'escalate']),
  reason: z.string().min(1),
  severity: z.number().min(0).max(100)
});

// Types
export interface AIDecision {
  id: string;
  type: 'orchestration' | 'moderation' | 'financial' | 'seo';
  action: string;
  parameters: Record<string, any>;
  confidence: number;
  requiresValidation: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'executed';
  createdAt: Date;
  validatedAt?: Date;
  validatedBy?: string;
  executedAt?: Date;
  result?: Record<string, any>;
}

export interface EngagementCoefficient {
  projectId: string;
  totalAmount: number;
  uniqueInvestors: number;
  coefficient: number;
  rank?: number;
}

export interface TieBreaker {
  projectId: string;
  coefficient: number;
  uniqueInvestors: number;
  totalAmount: number;
  createdAt: Date;
  finalRank: number;
  tieBreakReason?: string;
}

export class VisualAI {
  private enabled: boolean;
  private pendingDecisions: Map<string, AIDecision> = new Map();
  private executionQueue: AIDecision[] = [];

  constructor() {
    this.enabled = VISUAL_AI_CONFIG.enabled;
  }

  // ===== COEFFICIENT D'ENGAGEMENT & CLASSEMENT =====
  
  /**
   * Calcule le coefficient d'engagement pour tous les projets
   */
  calculateEngagementCoefficients(projects: Array<{
    id: string;
    totalAmount: number;
    uniqueInvestors: number;
    votes: number;
    createdAt: string;
  }>): EngagementCoefficient[] {
    return projects.map(project => ({
      projectId: project.id,
      totalAmount: project.totalAmount,
      uniqueInvestors: project.uniqueInvestors,
      coefficient: +(project.totalAmount / Math.max(1, project.uniqueInvestors)).toFixed(2)
    }));
  }

  /**
   * Applique les tie-breakers déterministes selon les règles VISUAL
   */
  applyTieBreakers(coefficients: EngagementCoefficient[], projects: Array<{
    id: string;
    votes: number;
    createdAt: string;
  }>): TieBreaker[] {
    // Sélection TOP 10 par votes d'abord
    const top10ByVotes = projects
      .sort((a, b) => b.votes - a.votes)
      .slice(0, 10);

    // Enrichir avec coefficients
    const withCoeffs = top10ByVotes.map(project => {
      const coeff = coefficients.find(c => c.projectId === project.id);
      return {
        projectId: project.id,
        coefficient: coeff?.coefficient || 0,
        uniqueInvestors: coeff?.uniqueInvestors || 0,
        totalAmount: coeff?.totalAmount || 0,
        createdAt: new Date(project.createdAt),
        votes: project.votes,
        finalRank: 0,
        tieBreakReason: undefined as string | undefined
      };
    });

    // Tri final avec tie-breakers
    withCoeffs.sort((a, b) => {
      // 1) Coefficient d'engagement (décroissant)
      if (a.coefficient !== b.coefficient) {
        return b.coefficient - a.coefficient;
      }
      
      // 2) Plus d'investisseurs uniques
      if (a.uniqueInvestors !== b.uniqueInvestors) {
        return b.uniqueInvestors - a.uniqueInvestors;
      }
      
      // 3) Montant total plus élevé
      if (a.totalAmount !== b.totalAmount) {
        return b.totalAmount - a.totalAmount;
      }
      
      // 4) Ancienneté (plus ancien gagne)
      if (a.createdAt.getTime() !== b.createdAt.getTime()) {
        return a.createdAt.getTime() - b.createdAt.getTime();
      }
      
      // 5) Tirage pseudo-aléatoire audité
      const seedA = parseInt(a.projectId.slice(-6), 16) || 1;
      const seedB = parseInt(b.projectId.slice(-6), 16) || 1;
      return seedA - seedB;
    });

    // Assigner les rangs finaux
    return withCoeffs.map((item, index) => ({
      ...item,
      finalRank: index + 1,
      tieBreakReason: index > 0 && withCoeffs[index-1].coefficient === item.coefficient 
        ? 'tie-breaker-applied' : undefined
    }));
  }

  // ===== MODÉRATION & SÉCURITÉ =====

  /**
   * Analyse un signalement et décide de l'action
   */
  async analyzeReport(reportId: string, contentType: string, reportType: string, description?: string): Promise<AIDecision> {
    const severity = this.calculateSeverityScore(reportType, description);
    
    let action: string;
    let requiresValidation = false;

    if (severity >= 90) {
      action = 'block';
      requiresValidation = true;
    } else if (severity >= 75) {
      action = 'escalate';
      requiresValidation = true;
    } else if (severity >= 50) {
      action = 'suspend';
    } else {
      action = 'approve';
    }

    const decision: AIDecision = {
      id: `decision-${Date.now()}`,
      type: 'moderation',
      action,
      parameters: {
        reportId,
        contentType,
        reportType,
        severity,
        description
      },
      confidence: Math.min(100, severity + 10),
      requiresValidation,
      status: requiresValidation ? 'pending' : 'approved',
      createdAt: new Date()
    };

    this.pendingDecisions.set(decision.id, decision);
    
    if (!requiresValidation) {
      await this.executeDecision(decision.id);
    }

    return decision;
  }

  /**
   * Calcule le score de sévérité d'un signalement
   */
  private calculateSeverityScore(reportType: string, description?: string): number {
    const baseScores = {
      'plagiat': 70,
      'contenu_offensant': 60,
      'desinformation': 80,
      'infraction_legale': 95,
      'contenu_illicite': 100,
      'violation_droits': 75,
      'propos_haineux': 90
    };

    let score = baseScores[reportType as keyof typeof baseScores] || 50;

    // Analyse du texte de description (simulation)
    if (description) {
      const keywords = ['urgent', 'grave', 'illégal', 'enfant', 'violence'];
      const foundKeywords = keywords.filter(k => 
        description.toLowerCase().includes(k)
      ).length;
      score += foundKeywords * 10;
    }

    return Math.min(100, score);
  }

  // ===== ORCHESTRATION =====

  /**
   * Orchestre la clôture d'une catégorie
   */
  async orchestrateCategoryClose(categoryId: string, projects: any[]): Promise<AIDecision> {
    // Calcul des coefficients et classement
    const coefficients = this.calculateEngagementCoefficients(projects);
    const finalRanking = this.applyTieBreakers(coefficients, projects);
    
    // Préparation des listes pour VisualFinanceAI
    const invTop10 = finalRanking.slice(0, 10).map(r => `investor-${r.projectId}`);
    const portTop10 = finalRanking.slice(0, 10).map(r => `creator-${r.projectId}`);
    const inv11to100 = finalRanking.slice(10, 100).map(r => `investor-${r.projectId}`);
    
    // Calcul du montant total à redistribuer
    const totalAmount = projects.reduce((sum, p) => sum + p.totalAmount, 0);

    const decision: AIDecision = {
      id: `category-close-${Date.now()}`,
      type: 'financial',
      action: 'category_close',
      parameters: {
        categoryId,
        totalAmount,
        invTop10,
        portTop10,
        inv11to100,
        finalRanking
      },
      confidence: 100,
      requiresValidation: totalAmount > 10000, // Validation si > 10k€
      status: totalAmount > 10000 ? 'pending' : 'approved',
      createdAt: new Date()
    };

    this.pendingDecisions.set(decision.id, decision);

    if (!decision.requiresValidation) {
      await this.executeDecision(decision.id);
    }

    return decision;
  }

  /**
   * Envoie une notification multilingue
   */
  async sendNotification(userId: string, type: string, data: Record<string, any>, locale: string = 'fr-FR'): Promise<void> {
    const templates = {
      'fr-FR': {
        'investment_success': 'Investissement réussi ! Vous avez investi {amount}€ et obtenu {votes} votes.',
        'project_funded': 'Félicitations ! Votre projet "{title}" a atteint son objectif de financement.',
        'roi_update': 'Mise à jour ROI : Votre investissement dans "{title}" : {roi}%'
      },
      'en-US': {
        'investment_success': 'Investment successful! You invested €{amount} and got {votes} votes.',
        'project_funded': 'Congratulations! Your project "{title}" reached its funding goal.',
        'roi_update': 'ROI Update: Your investment in "{title}": {roi}%'
      }
    };

    const template = templates[locale as keyof typeof templates]?.[type] || templates['fr-FR'][type];
    if (!template) return;

    let message = template;
    Object.entries(data).forEach(([key, value]) => {
      message = message.replace(`{${key}}`, String(value));
    });

    // En production, ici on enverrait via WebSocket, email, push, etc.
    console.log(`📧 VisualAI Notification [${locale}] to ${userId}: ${message}`);
  }

  // ===== GESTION DES DÉCISIONS =====

  /**
   * Valide une décision en attente (action admin)
   */
  async validateDecision(decisionId: string, adminUserId: string, approved: boolean, notes?: string): Promise<boolean> {
    const decision = this.pendingDecisions.get(decisionId);
    if (!decision || decision.status !== 'pending') {
      throw new Error('Decision not found or not pending');
    }

    decision.status = approved ? 'approved' : 'rejected';
    decision.validatedAt = new Date();
    decision.validatedBy = adminUserId;

    // Log de l'action admin
    await this.logAction('decision_validation', {
      decisionId,
      adminUserId,
      approved,
      notes,
      originalAction: decision.action
    });

    if (approved) {
      await this.executeDecision(decisionId);
    }

    return true;
  }

  /**
   * Exécute une décision approuvée
   */
  async executeDecision(decisionId: string): Promise<void> {
    const decision = this.pendingDecisions.get(decisionId);
    if (!decision || decision.status !== 'approved') {
      throw new Error('Decision not approved for execution');
    }

    try {
      switch (decision.action) {
        case 'category_close':
          await this.executeCategoryClose(decision);
          break;
        case 'user_block':
          await this.executeUserBlock(decision);
          break;
        case 'content_suspend':
          await this.executeContentSuspension(decision);
          break;
        default:
          throw new Error(`Unknown action: ${decision.action}`);
      }

      decision.status = 'executed';
      decision.executedAt = new Date();
      
    } catch (error) {
      console.error(`Failed to execute decision ${decisionId}:`, error);
      throw error;
    }
  }

  /**
   * Exécute la clôture d'une catégorie via VisualFinanceAI
   */
  private async executeCategoryClose(decision: AIDecision): Promise<void> {
    const { categoryId, totalAmount, invTop10, portTop10, inv11to100 } = decision.parameters;
    
    // Délégation à VisualFinanceAI
    const result = await visualFinanceAI.executeCloseCategory(
      categoryId,
      totalAmount,
      invTop10,
      portTop10,
      inv11to100
    );

    decision.result = result;
    
    // Log de l'exécution
    await this.logAction('category_closed', {
      categoryId,
      totalAmount,
      payoutsCount: result.payouts.length,
      executionTime: new Date().toISOString()
    });
  }

  /**
   * Exécute le blocage d'un utilisateur
   */
  private async executeUserBlock(decision: AIDecision): Promise<void> {
    const { userId, reason } = decision.parameters;
    
    // En production, ici on bloquerait l'utilisateur en DB
    console.log(`🚫 VisualAI: Blocking user ${userId} - Reason: ${reason}`);
    
    decision.result = { userId, blocked: true, timestamp: new Date().toISOString() };
  }

  /**
   * Exécute la suspension de contenu
   */
  private async executeContentSuspension(decision: AIDecision): Promise<void> {
    const { contentId, contentType, reason } = decision.parameters;
    
    // En production, ici on suspendrait le contenu
    console.log(`⏸️ VisualAI: Suspending ${contentType} ${contentId} - Reason: ${reason}`);
    
    decision.result = { contentId, suspended: true, timestamp: new Date().toISOString() };
  }

  // ===== SEO & INTERNATIONALISATION =====

  /**
   * Génère automatiquement les sitemaps multilingues
   */
  async generateSitemaps(locales: string[] = ['fr-FR', 'en-US', 'es-ES']): Promise<void> {
    for (const locale of locales) {
      const sitemap = await this.buildSitemapForLocale(locale);
      // En production, écrire le fichier sitemap
      console.log(`🗺️ VisualAI: Generated sitemap for ${locale} (${sitemap.urls.length} URLs)`);
    }
  }

  /**
   * Construit un sitemap pour une locale donnée
   */
  private async buildSitemapForLocale(locale: string): Promise<{ urls: string[] }> {
    const baseUrl = 'https://visual.replit.app';
    const langPrefix = locale === 'fr-FR' ? '' : `/${locale.split('-')[0]}`;
    
    const urls = [
      `${baseUrl}${langPrefix}/`,
      `${baseUrl}${langPrefix}/projects`,
      `${baseUrl}${langPrefix}/live`,
      `${baseUrl}${langPrefix}/books`,
      `${baseUrl}${langPrefix}/petites-annonces`
    ];

    return { urls };
  }

  // ===== GESTION DES EXTENSIONS 168H =====

  /**
   * Traite une demande d'extension payante (25€)
   */
  async processExtensionRequest(projectId: string, userId: string, paymentIntentId: string): Promise<AIDecision> {
    const decision: AIDecision = {
      id: `extension-${Date.now()}`,
      type: 'financial',
      action: 'grant_extension',
      parameters: {
        projectId,
        userId,
        paymentIntentId,
        extensionHours: 168,
        priceEUR: 25
      },
      confidence: 100,
      requiresValidation: false,
      status: 'approved',
      createdAt: new Date()
    };

    // Délégation à VisualFinanceAI pour traitement du paiement
    await visualFinanceAI.processExtensionPayment(projectId, userId, 25, paymentIntentId);
    
    decision.status = 'executed';
    decision.executedAt = new Date();
    
    return decision;
  }

  // ===== MONITORING & MÉTRIQUES =====

  /**
   * Récupère les métriques de performance de l'agent
   */
  async getPerformanceMetrics(): Promise<{
    decisionsPerHour: number;
    averageConfidence: number;
    validationRate: number;
    executionSuccessRate: number;
    pendingDecisions: number;
  }> {
    const now = Date.now();
    const oneHourAgo = now - 3600000;
    
    const recentDecisions = Array.from(this.pendingDecisions.values())
      .filter(d => d.createdAt.getTime() > oneHourAgo);

    const validatedDecisions = recentDecisions.filter(d => d.validatedAt);
    const executedDecisions = recentDecisions.filter(d => d.executedAt);

    return {
      decisionsPerHour: recentDecisions.length,
      averageConfidence: recentDecisions.reduce((sum, d) => sum + d.confidence, 0) / Math.max(1, recentDecisions.length),
      validationRate: validatedDecisions.length / Math.max(1, recentDecisions.length),
      executionSuccessRate: executedDecisions.length / Math.max(1, validatedDecisions.length),
      pendingDecisions: Array.from(this.pendingDecisions.values()).filter(d => d.status === 'pending').length
    };
  }

  /**
   * Récupère toutes les décisions en attente de validation
   */
  getPendingDecisions(): AIDecision[] {
    return Array.from(this.pendingDecisions.values())
      .filter(d => d.status === 'pending')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Kill switch - arrêt d'urgence
   */
  async emergencyStop(adminUserId: string, reason: string): Promise<void> {
    console.log(`🚨 VisualAI Emergency Stop by ${adminUserId}: ${reason}`);
    this.enabled = false;
    
    // Annuler toutes les décisions en attente
    for (const [id, decision] of this.pendingDecisions) {
      if (decision.status === 'pending') {
        decision.status = 'rejected';
        decision.validatedBy = adminUserId;
        decision.validatedAt = new Date();
      }
    }

    await this.logAction('emergency_stop', {
      adminUserId,
      reason,
      cancelledDecisions: this.pendingDecisions.size,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Logging sécurisé des actions
   */
  private async logAction(action: string, details: Record<string, any>): Promise<void> {
    console.log(`🎯 VisualAI Action: ${action}`, details);
    
    // En production, écrire dans audit_logs avec signature
    // pour traçabilité complète et intégrité des données
  }
}

export const visualAI = new VisualAI();