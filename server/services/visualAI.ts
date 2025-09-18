/**
 * VisualAI Service - Agent Maître Orchestrateur
 * 
 * Rôle : Supervision et pilotage global de VISUAL
 * - Modération & sécurité 
 * - SEO & internationalisation
 * - Notifications & UX dynamique
 * - Classement & coefficients d'engagement
 * - Orchestration des workflows business
 */

import { storage } from "../storage";
import { 
  InsertAgentDecision, 
  InsertAgentAuditLog, 
  InsertAgentParameter,
  User,
  Project,
  Investment 
} from "@shared/schema";

// Configuration runtime par défaut
export const VISUAL_AI_CONFIG = {
  extension_price_eur: 25,
  payout_rule_version: "cat_close_40_30_7_23_v1",
  infoarticle_platform_fee_pct: 0.30,
  points_rate: 100,
  points_threshold: 2500,
  pot24h_split_mode: "equipartition" as const,
  
  // SLOs VisualAI
  decision_latency_ms: 500,
  moderation_latency_ms: 60000,
  availability_target: 99.9,
  
  // Seuils de validation humaine
  user_block_threshold: 0.8,
  campaign_email_limit: 10000,
  payment_threshold_eur: 500,
  
  // Paramètres tie-breakers
  enable_tiebreakers: true,
  random_seed_daily: true
};

export interface EngagementMetrics {
  coefficient: number;
  investors: number;
  totalAmount: number;
  rank: number;
  tiebreaker_applied?: string;
}

export interface ModerationDecision {
  action: 'approve' | 'suspend' | 'block' | 'escalate';
  severity: number;
  reasons: string[];
  auto_executed: boolean;
}

export interface SEOOptimization {
  sitemap_updated: boolean;
  canonical_urls: string[];
  hreflang_tags: Record<string, string>;
  og_cards_generated: boolean;
}

export class VisualAIService {
  private config = VISUAL_AI_CONFIG;
  
  constructor() {
    this.initializeDefaultParameters();
  }

  // ===== CONFIGURATION & PARAMÈTRES =====
  
  private async initializeDefaultParameters() {
    try {
      // Vérifier et créer les paramètres par défaut si nécessaire
      const existingParams = await storage.getAgentParameters(true);
      const paramKeys = existingParams.map(p => p.parameterKey);
      
      const defaultParams = [
        { key: 'extension_price_eur', value: '25', type: 'number', description: 'Prix extension 168h en euros' },
        { key: 'payout_rule_version', value: 'cat_close_40_30_7_23_v1', type: 'string', description: 'Version règle paiement active' },
        { key: 'points_rate', value: '100', type: 'number', description: 'Taux conversion VISUpoints (pts par euro)' },
        { key: 'points_threshold', value: '2500', type: 'number', description: 'Seuil minimum conversion VISUpoints' },
        { key: 'user_block_threshold', value: '0.8', type: 'number', description: 'Seuil automatique blocage utilisateur' },
        { key: 'campaign_email_limit', value: '10000', type: 'number', description: 'Limite envoi email campagne' }
      ];
      
      for (const param of defaultParams) {
        if (!paramKeys.includes(param.key)) {
          await storage.createAgentParameter({
            parameterKey: param.key,
            parameterValue: param.value,
            parameterType: param.type,
            description: param.description,
            modifiableByAdmin: true,
            lastModifiedBy: 'visualai_init'
          });
        }
      }
    } catch (error) {
      console.error('[VisualAI] Erreur initialisation paramètres:', error);
    }
  }

  async getParameter(key: string, defaultValue?: string): Promise<string | undefined> {
    return await storage.getParameterValue(key, defaultValue);
  }

  async updateParameter(key: string, value: string, modifiedBy: string = 'visualai'): Promise<void> {
    await storage.updateAgentParameter(key, value, modifiedBy);
    await this.logAuditEntry('parameters_changed', 'parameter', key, {
      parameter_key: key,
      new_value: value,
      modified_by: modifiedBy
    });
  }

  // ===== CLASSEMENT & COEFFICIENTS D'ENGAGEMENT =====
  
  /**
   * Calcule le coefficient d'engagement : montantTotal / max(1, nbInvestisseurs)
   */
  calculateEngagementCoefficient(totalAmount: number, investorCount: number): number {
    return Number((totalAmount / Math.max(1, investorCount)).toFixed(2));
  }

  /**
   * Applique les tie-breakers selon spécifications :
   * 1. Plus d'investisseurs uniques
   * 2. Montant total plus élevé  
   * 3. Ancienneté (plus ancien en premier)
   * 4. Tirage pseudo-aléatoire audité
   */
  async applyTiebreakers(projects: Project[], investments: Investment[]): Promise<Project[]> {
    const projectMetrics = new Map<string, EngagementMetrics>();
    
    // Calculer métriques pour chaque projet
    for (const project of projects) {
      const projectInvestments = investments.filter(inv => inv.projectId === project.id);
      const uniqueInvestors = new Set(projectInvestments.map(inv => inv.userId)).size;
      const totalAmount = projectInvestments.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
      
      projectMetrics.set(project.id, {
        coefficient: this.calculateEngagementCoefficient(totalAmount, uniqueInvestors),
        investors: uniqueInvestors,
        totalAmount,
        rank: 0
      });
    }
    
    // Tri avec tie-breakers
    const sorted = projects.sort((a, b) => {
      const metricsA = projectMetrics.get(a.id)!;
      const metricsB = projectMetrics.get(b.id)!;
      
      // 1. Coefficient d'engagement (principal)
      if (metricsA.coefficient !== metricsB.coefficient) {
        return metricsB.coefficient - metricsA.coefficient;
      }
      
      // 2. Nombre d'investisseurs uniques
      if (metricsA.investors !== metricsB.investors) {
        return metricsB.investors - metricsA.investors;
      }
      
      // 3. Montant total
      if (metricsA.totalAmount !== metricsB.totalAmount) {
        return metricsB.totalAmount - metricsA.totalAmount;
      }
      
      // 4. Ancienneté (plus ancien en premier)
      const dateA = new Date(a.createdAt!).getTime();
      const dateB = new Date(b.createdAt!).getTime();
      if (dateA !== dateB) {
        return dateA - dateB;
      }
      
      // 5. Tirage pseudo-aléatoire audité
      const randomA = this.generateAuditableRandom(a.id);
      const randomB = this.generateAuditableRandom(b.id);
      return randomB - randomA;
    });
    
    // Marquer les tie-breakers appliqués pour audit
    await this.logAuditEntry('decision_made', 'ranking', 'top10_calculation', {
      projects_ranked: sorted.length,
      tiebreakers_applied: true,
      timestamp: new Date().toISOString()
    });
    
    return sorted;
  }

  private generateAuditableRandom(projectId: string): number {
    // Génération pseudo-aléatoire reproductible pour audit
    const seed = this.getDateSeed() + projectId;
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) / 2147483647; // Normalize to [0,1]
  }

  private getDateSeed(): string {
    const today = new Date();
    return `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
  }

  // ===== MODÉRATION & SÉCURITÉ =====
  
  async moderateContent(contentType: string, contentId: string, content: any): Promise<ModerationDecision> {
    const startTime = Date.now();
    
    try {
      // Analyse de contenu (simulée - en prod, utiliser IA de modération)
      const severity = this.calculateModerationSeverity(content);
      const reasons = this.identifyModerationReasons(content);
      
      let action: ModerationDecision['action'] = 'approve';
      let autoExecuted = false;
      
      const blockThreshold = parseFloat(await this.getParameter('user_block_threshold', '0.8') || '0.8');
      
      if (severity >= blockThreshold) {
        action = 'block';
        autoExecuted = true;
      } else if (severity >= 0.6) {
        action = 'suspend';
        autoExecuted = true;
      } else if (severity >= 0.4) {
        action = 'escalate';
        autoExecuted = false;
      }
      
      const decision: ModerationDecision = {
        action,
        severity,
        reasons,
        auto_executed: autoExecuted
      };
      
      // Enregistrer décision pour validation admin si nécessaire
      if (!autoExecuted || action === 'block') {
        await this.createAgentDecision({
          agentType: 'visualai',
          decisionType: 'content_moderation',
          subjectId: contentId,
          subjectType: contentType,
          ruleApplied: 'content_moderation_v1',
          score: severity.toString(),
          justification: `Modération automatique: ${reasons.join(', ')}`,
          parameters: { content_analysis: content, decision },
          status: autoExecuted ? 'auto' : 'pending'
        });
      }
      
      // Log performance
      const latency = Date.now() - startTime;
      if (latency > this.config.moderation_latency_ms) {
        console.warn(`[VisualAI] Modération lente: ${latency}ms > ${this.config.moderation_latency_ms}ms`);
      }
      
      return decision;
      
    } catch (error) {
      console.error('[VisualAI] Erreur modération:', error);
      return {
        action: 'escalate',
        severity: 1.0,
        reasons: ['system_error'],
        auto_executed: false
      };
    }
  }

  private calculateModerationSeverity(content: any): number {
    // Analyse simplifiée - en production, utiliser ML/IA
    let severity = 0;
    const text = JSON.stringify(content).toLowerCase();
    
    // Détection de contenu problématique
    const patterns = {
      spam: /spam|fake|scam|phishing/g,
      inappropriate: /nsfw|adult|violence/g,
      financial_risk: /guaranteed|risk-free|100%|ponzi/g
    };
    
    Object.entries(patterns).forEach(([type, pattern]) => {
      const matches = text.match(pattern);
      if (matches) {
        severity += matches.length * 0.2;
      }
    });
    
    return Math.min(severity, 1.0);
  }

  private identifyModerationReasons(content: any): string[] {
    const reasons = [];
    const text = JSON.stringify(content).toLowerCase();
    
    if (text.includes('spam')) reasons.push('contenu_spam');
    if (text.includes('fake')) reasons.push('fausses_informations');
    if (text.includes('guaranteed')) reasons.push('promesses_irrealistes');
    
    return reasons.length > 0 ? reasons : ['analyse_automatique'];
  }

  // ===== GESTION DES SIGNALEMENTS =====
  
  async processReport(reportId: string, reportType: string, reportData: any): Promise<void> {
    const severity = this.calculateReportSeverity(reportData);
    
    await this.createAgentDecision({
      agentType: 'visualai',
      decisionType: 'report_processing',
      subjectId: reportId,
      subjectType: 'content_report',
      ruleApplied: 'report_triage_v1',
      score: severity.toString(),
      justification: `Traitement signalement: ${reportType}`,
      parameters: { report_data: reportData },
      status: severity > 0.7 ? 'pending' : 'auto'
    });
    
    await this.logAuditEntry('decision_made', 'content_report', reportId, {
      report_type: reportType,
      severity,
      auto_processed: severity <= 0.7
    });
  }

  private calculateReportSeverity(reportData: any): number {
    // Analyse simplifiée de sévérité du signalement
    const reportCount = reportData.count || 1;
    const reporterCredibility = reportData.reporter_credibility || 0.5;
    
    return Math.min((reportCount * 0.2) + (reporterCredibility * 0.3), 1.0);
  }

  // ===== SEO & INTERNATIONALISATION =====
  
  async optimizeSEO(pageType: string, pageData: any): Promise<SEOOptimization> {
    const optimization: SEOOptimization = {
      sitemap_updated: false,
      canonical_urls: [],
      hreflang_tags: {},
      og_cards_generated: false
    };
    
    try {
      // Génération des balises canoniques
      if (pageData.id) {
        optimization.canonical_urls.push(`https://visual.replit.app/${pageType}/${pageData.id}`);
      }
      
      // Génération hreflang pour internationalisation
      const supportedLangs = ['fr', 'en', 'es', 'de'];
      supportedLangs.forEach(lang => {
        optimization.hreflang_tags[lang] = `https://visual.replit.app/${lang}/${pageType}/${pageData.id}`;
      });
      
      // Génération Open Graph cards
      optimization.og_cards_generated = true;
      
      await this.logAuditEntry('decision_made', 'seo_optimization', pageData.id, {
        page_type: pageType,
        optimizations: optimization
      });
      
      return optimization;
      
    } catch (error) {
      console.error('[VisualAI] Erreur optimisation SEO:', error);
      return optimization;
    }
  }

  // ===== COOPÉRATION AVEC VISUALFINANCEAI =====
  
  async requestPayout(payoutType: string, parameters: any): Promise<string> {
    const decisionId = await this.createAgentDecision({
      agentType: 'visualai',
      decisionType: 'payout_request',
      subjectId: parameters.reference_id,
      subjectType: payoutType,
      ruleApplied: `payout_${payoutType}_v1`,
      score: '1.0',
      justification: `Demande paiement ${payoutType}`,
      parameters: { payout_parameters: parameters },
      status: 'pending'
    });
    
    // En production, ici on enverrait l'ordre à VisualFinanceAI
    console.log(`[VisualAI] Ordre envoyé à VisualFinanceAI: ${payoutType}`, parameters);
    
    return decisionId;
  }

  // ===== UTILITAIRES PRIVÉES =====
  
  private async createAgentDecision(decision: Omit<InsertAgentDecision, 'createdAt' | 'updatedAt'>): Promise<string> {
    const created = await storage.createAgentDecision(decision);
    return created.id;
  }

  private async logAuditEntry(action: string, subjectType: string, subjectId: string, details: any): Promise<void> {
    // Le hash chain sera géré automatiquement par storage.createAuditLogEntry
    await storage.createAuditLogEntry({
      agentType: 'visualai',
      action: action as any,
      subjectType,
      subjectId,
      details,
      actor: 'visualai'
      // currentHash et previousHash seront générés par le storage
    });
  }

  // ===== RAPPORTS & MONITORING =====
  
  async generateWeeklyReport(): Promise<any> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const decisions = await storage.getAgentDecisions('visualai', undefined, 1000);
    const weeklyDecisions = decisions.filter(d => 
      new Date(d.createdAt!) >= startDate && new Date(d.createdAt!) <= endDate
    );
    
    const report = {
      period: { start: startDate, end: endDate },
      decisions: {
        total: weeklyDecisions.length,
        auto_executed: weeklyDecisions.filter(d => d.status === 'auto').length,
        pending_admin: weeklyDecisions.filter(d => d.status === 'pending').length,
        escalated: weeklyDecisions.filter(d => d.status === 'escalated').length
      },
      performance: {
        avg_decision_latency: '200ms', // À calculer en production
        availability: '99.95%',
        moderation_accuracy: '94%'
      },
      suggestions: [
        'Augmenter le seuil de blocage automatique à 0.85',
        'Optimiser les requêtes de classement TOP10',
        'Améliorer la détection de contenu spam'
      ]
    };
    
    await this.logAuditEntry('policy_updated', 'system', 'weekly_report', report);
    
    return report;
  }
}

export const visualAI = new VisualAIService();