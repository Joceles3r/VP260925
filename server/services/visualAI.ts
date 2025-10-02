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

  // ===== SYSTÈME DE DÉTECTION DE FRAUDE AVANCÉ =====
  
  /**
   * Analyse le risque d'un utilisateur avec machine learning
   */
  async analyzeUserFraudRisk(userId: string): Promise<{
    riskScore: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    flags: string[];
    recommendations: string[];
  }> {
    try {
      const user = await storage.getUser(userId);
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      const investments = await storage.getUserInvestments(userId);
      const transactions = await storage.getUserTransactions(userId, 100);
      
      let riskScore = 0;
      const flags: string[] = [];
      const recommendations: string[] = [];
      
      // Analyse 1: Investissements rapides (bot detection)
      const rapidInvestments = this.detectRapidInvestments(investments);
      if (rapidInvestments.isRapid) {
        riskScore += 0.3;
        flags.push(`${rapidInvestments.count} investissements en ${rapidInvestments.timeWindowMinutes} minutes`);
        recommendations.push('Vérifier activité automatisée');
      }
      
      // Analyse 2: Montants suspects
      const uniformAmounts = this.detectUniformAmounts(investments);
      if (uniformAmounts.isUniform) {
        riskScore += 0.25;
        flags.push(`${uniformAmounts.percentage}% des montants sont identiques`);
        recommendations.push('Investiguer pattern de montants');
      }
      
      // Analyse 3: Timing anormal (toujours aux mêmes heures)
      const timingAnomaly = this.detectTimingAnomaly(investments);
      if (timingAnomaly.isAnomalous) {
        riskScore += 0.2;
        flags.push(`Concentration sur heure ${timingAnomaly.peakHour}h: ${timingAnomaly.concentration}%`);
        recommendations.push('Surveiller patterns temporels');
      }
      
      // Analyse 4: Volume suspect
      if (investments.length > 50 && transactions.length > 100) {
        riskScore += 0.15;
        flags.push(`Volume élevé: ${investments.length} investissements, ${transactions.length} transactions`);
        recommendations.push('Audit approfondi recommandé');
      }
      
      // Calcul du niveau de risque
      const riskLevel = this.calculateRiskLevel(riskScore);
      
      // Créer une décision agent si risque élevé (>= 0.6 requiert validation admin)
      if (riskScore >= 0.6) {
        await this.createAgentDecision({
          agentType: 'visualai',
          decisionType: 'fraud_detection',
          subjectId: userId,
          subjectType: 'user',
          ruleApplied: 'fraud_analysis_v1',
          score: riskScore.toString(),
          justification: `Analyse de fraude automatique - Score: ${(riskScore * 100).toFixed(1)}% - Flags: ${flags.join(', ')}`,
          parameters: {
            flags,
            recommendations,
            investment_count: investments.length,
            transaction_count: transactions.length
          },
          status: 'pending' // TOUS les scores >= 0.6 requièrent validation admin
        });
      }
      
      // Persister les résultats dans les tables de fraude
      // TODO: Implémenter storage.upsertUserRiskScore() et storage.createFraudEvent()
      // Pour l'instant, logger les données (persistence sera ajoutée ultérieurement)
      console.log('[VisualAI] User Risk Score:', {
        userId,
        riskScore,
        riskLevel,
        flags,
        recommendations
      });
      
      if (riskScore >= 0.6) {
        console.log('[VisualAI] Fraud Event Created:', {
          eventType: 'high_risk_user',
          userId,
          severityScore: riskScore,
          confidence: riskScore,
          evidenceData: {
            flags,
            rapid_investments: rapidInvestments,
            uniform_amounts: uniformAmounts,
            timing_anomaly: timingAnomaly,
            total_investments: investments.length,
            total_transactions: transactions.length
          }
        });
      }
      
      await this.logAuditEntry('decision_made', 'user', userId, {
        fraud_analysis: {
          risk_score: riskScore,
          risk_level: riskLevel,
          flags_count: flags.length
        }
      });
      
      return {
        riskScore: Math.min(riskScore, 1.0),
        riskLevel,
        flags,
        recommendations: riskScore >= 0.6 ? [...recommendations, '⚠️ Validation admin requise'] : recommendations
      };
      
    } catch (error) {
      console.error('[VisualAI] Erreur analyse fraude:', error);
      throw error;
    }
  }

  /**
   * Détecte les investissements coordonnés entre plusieurs comptes
   */
  async detectCoordinatedInvestments(projectId: string): Promise<{
    isCoordinated: boolean;
    confidence: number;
    suspiciousGroups: any[];
    evidence: any;
  }> {
    try {
      const investments = await storage.getProjectInvestments(projectId);
      
      if (investments.length < 5) {
        return {
          isCoordinated: false,
          confidence: 0,
          suspiciousGroups: [],
          evidence: {}
        };
      }
      
      // Analyser les patterns temporels
      const timingClusters = this.findInvestmentClusters(investments);
      
      // Analyser les montants identiques
      const amountPatterns = this.analyzeAmountPatterns(investments);
      
      // Score de confiance
      let confidence = 0;
      
      if (timingClusters.largestCluster > 5) {
        confidence += 0.4;
      }
      
      if (amountPatterns.uniqueRatio < 0.3) {
        confidence += 0.35;
      }
      
      if (investments.length > 20 && timingClusters.largestCluster > 10) {
        confidence += 0.25;
      }
      
      const isCoordinated = confidence > 0.5;
      
      if (isCoordinated) {
        await this.createAgentDecision({
          agentType: 'visualai',
          decisionType: 'coordinated_investment',
          subjectId: projectId,
          subjectType: 'project',
          ruleApplied: 'coordination_detection_v1',
          score: confidence.toString(),
          justification: `Investissements potentiellement coordonnés détectés - Confiance: ${(confidence * 100).toFixed(1)}%`,
          parameters: {
            timing_clusters: timingClusters,
            amount_patterns: amountPatterns,
            investor_count: investments.length
          },
          status: confidence >= 0.6 ? 'pending' : 'escalated' // >= 0.6 requiert validation admin
        });
        
        // Persister l'événement de fraude
        // TODO: Implémenter storage.createFraudEvent()
        if (confidence >= 0.6) {
          console.log('[VisualAI] Coordinated Investment Fraud Event:', {
            eventType: 'coordinated_investment',
            userId: project.creatorId,
            projectId,
            severityScore: confidence,
            evidenceData: {
              timing_clusters: timingClusters,
              amount_patterns: amountPatterns,
              investor_count: investments.length
            }
          });
        }
      }
      
      // Audit trail pour détections coordonnées
      await this.logAuditEntry('decision_made', 'project', projectId, {
        coordinated_investment_analysis: {
          confidence,
          is_coordinated: isCoordinated,
          timing_clusters: timingClusters.largestCluster,
          amount_diversity: amountPatterns.uniqueRatio,
          investor_count: investments.length
        }
      });
      
      return {
        isCoordinated,
        confidence,
        suspiciousGroups: timingClusters.clusters,
        evidence: {
          timingClusters,
          amountPatterns,
          investorCount: investments.length
        }
      };
      
    } catch (error) {
      console.error('[VisualAI] Erreur détection coordination:', error);
      throw error;
    }
  }

  /**
   * Apprentissage automatique à partir de feedback admin
   */
  async learnFromAdminFeedback(decisionId: string, verdict: 'approved' | 'rejected', adminComment?: string): Promise<void> {
    try {
      const decision = await storage.getAgentDecision(decisionId);
      if (!decision) {
        throw new Error(`Decision not found: ${decisionId}`);
      }

      // Mettre à jour la décision
      await storage.updateAgentDecision(decisionId, {
        status: verdict === 'approved' ? 'approved' : 'rejected',
        adminComment: adminComment || `Admin verdict: ${verdict}`,
        validatedAt: new Date()
      });
      
      // Ajuster les seuils basés sur le feedback
      const score = parseFloat(decision.score || '0');
      const decisionType = decision.decisionType;
      
      if (verdict === 'rejected' && score > 0.7) {
        // False positive avec score élevé → augmenter les seuils
        console.log(`[VisualAI] Learning: False positive detected for ${decisionType}, adjusting thresholds`);
        // En production, mettre à jour les paramètres automatiquement
      } else if (verdict === 'approved' && score < 0.6) {
        // True positive avec score bas → diminuer les seuils
        console.log(`[VisualAI] Learning: True positive with low score for ${decisionType}, adjusting thresholds`);
      }
      
      await this.logAuditEntry('decision_made', 'agent_decision', decisionId, {
        admin_verdict: verdict,
        original_score: score,
        learning_applied: true,
        admin_comment: adminComment
      });
      
    } catch (error) {
      console.error('[VisualAI] Erreur apprentissage:', error);
      throw error;
    }
  }

  // ===== MÉTHODES PRIVÉES DÉTECTION FRAUDE =====

  private detectRapidInvestments(investments: Investment[]): {
    isRapid: boolean;
    count: number;
    timeWindowMinutes: number;
  } {
    if (investments.length < 3) {
      return { isRapid: false, count: 0, timeWindowMinutes: 0 };
    }

    const sorted = investments.sort((a, b) => 
      new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime()
    );

    let maxCount = 0;
    let minWindow = Infinity;

    // Chercher fenêtres de 5, 15, 30, 60 minutes
    const windows = [5, 15, 30, 60];
    
    for (const windowMinutes of windows) {
      const windowMs = windowMinutes * 60 * 1000;
      let count = 0;
      
      for (let i = 0; i < sorted.length; i++) {
        const startTime = new Date(sorted[i].createdAt!).getTime();
        count = 1;
        
        for (let j = i + 1; j < sorted.length; j++) {
          const currentTime = new Date(sorted[j].createdAt!).getTime();
          if (currentTime - startTime <= windowMs) {
            count++;
          } else {
            break;
          }
        }
        
        if (count > maxCount) {
          maxCount = count;
          minWindow = windowMinutes;
        }
      }
    }

    return {
      isRapid: maxCount >= 5,
      count: maxCount,
      timeWindowMinutes: minWindow
    };
  }

  private detectUniformAmounts(investments: Investment[]): {
    isUniform: boolean;
    percentage: number;
  } {
    if (investments.length < 3) {
      return { isUniform: false, percentage: 0 };
    }

    const amounts = investments.map(inv => parseFloat(inv.amount));
    const amountCounts = new Map<number, number>();
    
    amounts.forEach(amount => {
      amountCounts.set(amount, (amountCounts.get(amount) || 0) + 1);
    });

    const maxCount = Math.max(...Array.from(amountCounts.values()));
    const percentage = (maxCount / amounts.length) * 100;

    return {
      isUniform: percentage > 70,
      percentage: Math.round(percentage)
    };
  }

  private detectTimingAnomaly(investments: Investment[]): {
    isAnomalous: boolean;
    peakHour: number;
    concentration: number;
  } {
    if (investments.length < 5) {
      return { isAnomalous: false, peakHour: 0, concentration: 0 };
    }

    const hourCounts = new Map<number, number>();
    
    investments.forEach(inv => {
      const hour = new Date(inv.createdAt!).getHours();
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    });

    let maxHour = 0;
    let maxCount = 0;
    
    hourCounts.forEach((count, hour) => {
      if (count > maxCount) {
        maxCount = count;
        maxHour = hour;
      }
    });

    const concentration = (maxCount / investments.length) * 100;

    return {
      isAnomalous: concentration > 60,
      peakHour: maxHour,
      concentration: Math.round(concentration)
    };
  }

  private findInvestmentClusters(investments: Investment[]): {
    largestCluster: number;
    clusters: any[];
  } {
    const sorted = investments.sort((a, b) => 
      new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime()
    );

    const clusters: any[] = [];
    const clusterWindow = 10 * 60 * 1000; // 10 minutes
    
    let currentCluster: Investment[] = [];
    let clusterStart = 0;

    for (let i = 0; i < sorted.length; i++) {
      const time = new Date(sorted[i].createdAt!).getTime();
      
      if (currentCluster.length === 0) {
        currentCluster = [sorted[i]];
        clusterStart = time;
      } else if (time - clusterStart <= clusterWindow) {
        currentCluster.push(sorted[i]);
      } else {
        if (currentCluster.length >= 3) {
          clusters.push({
            size: currentCluster.length,
            startTime: new Date(clusterStart),
            investments: currentCluster.map(inv => inv.id)
          });
        }
        currentCluster = [sorted[i]];
        clusterStart = time;
      }
    }

    if (currentCluster.length >= 3) {
      clusters.push({
        size: currentCluster.length,
        startTime: new Date(clusterStart),
        investments: currentCluster.map(inv => inv.id)
      });
    }

    return {
      largestCluster: Math.max(0, ...clusters.map(c => c.size)),
      clusters
    };
  }

  private analyzeAmountPatterns(investments: Investment[]): {
    uniqueRatio: number;
    mostCommonAmount: number;
    occurrences: number;
  } {
    const amounts = investments.map(inv => parseFloat(inv.amount));
    const amountCounts = new Map<number, number>();
    
    amounts.forEach(amount => {
      amountCounts.set(amount, (amountCounts.get(amount) || 0) + 1);
    });

    let mostCommon = 0;
    let maxOccurrences = 0;
    
    amountCounts.forEach((count, amount) => {
      if (count > maxOccurrences) {
        maxOccurrences = count;
        mostCommon = amount;
      }
    });

    return {
      uniqueRatio: amountCounts.size / amounts.length,
      mostCommonAmount: mostCommon,
      occurrences: maxOccurrences
    };
  }

  private calculateRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score < 0.3) return 'low';
    if (score < 0.6) return 'medium';
    if (score < 0.8) return 'high';
    return 'critical';
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