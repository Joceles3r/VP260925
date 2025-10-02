/**
 * Fraud Detection Engine - Système d'apprentissage automatique pour détecter les fraudes
 * 
 * Caractéristiques:
 * - Détection multi-comptes et comptes liés
 * - Analyse comportementale et patterns suspects
 * - Scoring de risque en temps réel
 * - Apprentissage automatique à partir de l'historique
 * - Validation admin obligatoire pour actions critiques
 */

import { storage } from "../storage";
import { 
  User,
  Investment,
  Project,
  Transaction,
  InsertFraudEvent,
  InsertUserRiskScore,
  InsertBehaviorPattern,
  InsertUserRelationship
} from "@shared/schema";

export interface UserBehaviorAnalysis {
  userId: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  patterns: DetectedPattern[];
  relationships: SuspiciousRelationship[];
  recommendations: string[];
}

export interface DetectedPattern {
  type: string;
  signature: string;
  confidence: number;
  evidence: any;
  isAnomaly: boolean;
}

export interface SuspiciousRelationship {
  relatedUserId: string;
  relationshipType: string;
  strength: number;
  evidence: any;
}

export interface FraudDetectionResult {
  isFraudulent: boolean;
  confidence: number;
  fraudType: string[];
  evidence: any;
  recommendedAction: 'monitor' | 'restrict' | 'suspend' | 'block' | 'investigate';
  requiresAdminReview: boolean;
}

export class FraudDetectionEngine {
  private readonly RISK_THRESHOLDS = {
    LOW: 0.3,
    MEDIUM: 0.5,
    HIGH: 0.7,
    CRITICAL: 0.9
  };

  private readonly ADMIN_REVIEW_THRESHOLD = 0.7;
  
  private readonly PATTERN_WEIGHTS = {
    multi_account: 0.8,
    coordinated_investment: 0.7,
    bot_activity: 0.9,
    rapid_succession: 0.6,
    timing_anomaly: 0.5,
    amount_pattern: 0.6
  };

  constructor() {}

  /**
   * Analyse comportementale complète d'un utilisateur
   */
  async analyzeUserBehavior(userId: string): Promise<UserBehaviorAnalysis> {
    try {
      const user = await storage.getUserById(userId);
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      // Collecter les données comportementales
      const investments = await storage.getUserInvestments(userId);
      const transactions = await storage.getUserTransactions(userId);
      
      // Détecter les patterns
      const patterns = await this.detectBehaviorPatterns(userId, investments, transactions);
      
      // Analyser les relations suspectes
      const relationships = await this.analyzeUserRelationships(userId);
      
      // Calculer le score de risque
      const riskScore = this.calculateRiskScore(patterns, relationships);
      const riskLevel = this.getRiskLevel(riskScore);
      
      // Générer les recommandations
      const recommendations = this.generateRecommendations(riskScore, patterns, relationships);
      
      // Mettre à jour le score dans la DB
      await this.updateUserRiskScore(userId, riskScore, riskLevel, {
        patterns,
        relationships,
        timestamp: new Date().toISOString()
      });
      
      return {
        userId,
        riskScore,
        riskLevel,
        patterns,
        relationships,
        recommendations
      };
      
    } catch (error) {
      console.error('[FraudEngine] Error analyzing user:', error);
      throw error;
    }
  }

  /**
   * Détection de multi-comptes via analyse de graphe
   */
  async detectMultiAccounts(userId: string): Promise<FraudDetectionResult> {
    try {
      const relatedUsers = await this.findRelatedAccounts(userId);
      
      if (relatedUsers.length === 0) {
        return {
          isFraudulent: false,
          confidence: 0,
          fraudType: [],
          evidence: {},
          recommendedAction: 'monitor',
          requiresAdminReview: false
        };
      }
      
      // Analyser la force des connexions
      const strongConnections = relatedUsers.filter(r => r.strength > 0.7);
      const suspiciousPatterns = await this.findCoordinatedBehavior(userId, relatedUsers.map(r => r.relatedUserId));
      
      const confidence = this.calculateMultiAccountConfidence(strongConnections, suspiciousPatterns);
      const isFraudulent = confidence > this.RISK_THRESHOLDS.MEDIUM;
      
      // Créer un événement de fraude si détecté
      if (isFraudulent) {
        await this.createFraudEvent({
          eventType: 'multi_account',
          userId,
          relatedUserIds: relatedUsers.map(r => r.relatedUserId),
          severityScore: confidence.toString(),
          confidence: confidence.toString(),
          evidenceData: {
            related_accounts: relatedUsers,
            coordinated_patterns: suspiciousPatterns,
            detection_timestamp: new Date().toISOString()
          },
          detectionMethod: 'pattern_analysis',
          recommendedAction: confidence > this.ADMIN_REVIEW_THRESHOLD ? 'block' : 'suspend'
        });
      }
      
      return {
        isFraudulent,
        confidence,
        fraudType: isFraudulent ? ['multi_account'] : [],
        evidence: {
          relatedAccounts: relatedUsers,
          coordinatedPatterns: suspiciousPatterns
        },
        recommendedAction: this.getRecommendedAction(confidence),
        requiresAdminReview: confidence > this.ADMIN_REVIEW_THRESHOLD
      };
      
    } catch (error) {
      console.error('[FraudEngine] Error detecting multi-accounts:', error);
      throw error;
    }
  }

  /**
   * Détection d'investissements coordonnés (manipulation)
   */
  async detectCoordinatedInvestment(projectId: string): Promise<FraudDetectionResult> {
    try {
      const project = await storage.getProjectById(projectId);
      if (!project) {
        throw new Error(`Project not found: ${projectId}`);
      }

      const investments = await storage.getProjectInvestments(projectId);
      
      // Analyser les patterns temporels
      const timingPatterns = this.analyzeInvestmentTiming(investments);
      
      // Analyser les montants
      const amountPatterns = this.analyzeInvestmentAmounts(investments);
      
      // Détecter les comptes liés
      const investorIds = investments.map(inv => inv.userId);
      const relatedAccountGroups = await this.findRelatedAccountGroups(investorIds);
      
      const confidence = this.calculateCoordinationConfidence(
        timingPatterns,
        amountPatterns,
        relatedAccountGroups
      );
      
      const isFraudulent = confidence > this.RISK_THRESHOLDS.MEDIUM;
      
      if (isFraudulent) {
        await this.createFraudEvent({
          eventType: 'coordinated_investment',
          userId: project.creatorId,
          projectId,
          severityScore: confidence.toString(),
          confidence: confidence.toString(),
          evidenceData: {
            timing_patterns: timingPatterns,
            amount_patterns: amountPatterns,
            related_groups: relatedAccountGroups,
            investor_count: investments.length
          },
          detectionMethod: 'pattern_analysis',
          recommendedAction: confidence > this.ADMIN_REVIEW_THRESHOLD ? 'investigate' : 'monitor'
        });
      }
      
      return {
        isFraudulent,
        confidence,
        fraudType: isFraudulent ? ['coordinated_investment'] : [],
        evidence: {
          timingPatterns,
          amountPatterns,
          relatedGroups: relatedAccountGroups
        },
        recommendedAction: this.getRecommendedAction(confidence),
        requiresAdminReview: confidence > this.ADMIN_REVIEW_THRESHOLD
      };
      
    } catch (error) {
      console.error('[FraudEngine] Error detecting coordinated investment:', error);
      throw error;
    }
  }

  /**
   * Détection d'activité bot
   */
  async detectBotActivity(userId: string): Promise<FraudDetectionResult> {
    try {
      const user = await storage.getUserById(userId);
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      const userActions = await this.getUserActionHistory(userId);
      
      // Analyser la régularité temporelle (bots = patterns très réguliers)
      const temporalRegularity = this.calculateTemporalRegularity(userActions);
      
      // Analyser la vitesse d'action (bots = très rapide)
      const actionSpeed = this.calculateActionSpeed(userActions);
      
      // Analyser la diversité des actions (bots = patterns répétitifs)
      const actionDiversity = this.calculateActionDiversity(userActions);
      
      // Score composite
      const botScore = (temporalRegularity * 0.4) + (actionSpeed * 0.4) + ((1 - actionDiversity) * 0.2);
      const isFraudulent = botScore > this.RISK_THRESHOLDS.HIGH;
      
      if (isFraudulent) {
        await this.createFraudEvent({
          eventType: 'bot_activity',
          userId,
          severityScore: botScore.toString(),
          confidence: botScore.toString(),
          evidenceData: {
            temporal_regularity: temporalRegularity,
            action_speed: actionSpeed,
            action_diversity: actionDiversity,
            action_count: userActions.length
          },
          detectionMethod: 'pattern_analysis',
          recommendedAction: botScore > 0.85 ? 'block' : 'suspend'
        });
      }
      
      return {
        isFraudulent,
        confidence: botScore,
        fraudType: isFraudulent ? ['bot_activity'] : [],
        evidence: {
          temporalRegularity,
          actionSpeed,
          actionDiversity
        },
        recommendedAction: this.getRecommendedAction(botScore),
        requiresAdminReview: botScore > this.ADMIN_REVIEW_THRESHOLD
      };
      
    } catch (error) {
      console.error('[FraudEngine] Error detecting bot activity:', error);
      throw error;
    }
  }

  /**
   * Apprentissage automatique à partir de feedbacks admin
   */
  async learnFromAdminFeedback(fraudEventId: string, verdict: 'confirmed' | 'false_positive' | 'insufficient_evidence'): Promise<void> {
    try {
      const event = await storage.getFraudEventById(fraudEventId);
      if (!event) {
        throw new Error(`Fraud event not found: ${fraudEventId}`);
      }

      // Mettre à jour les patterns selon le verdict
      const isTruePositive = verdict === 'confirmed';
      const patternSignature = this.generatePatternSignature(event.evidenceData);
      
      // Chercher le pattern existant
      let pattern = await storage.getBehaviorPatternBySignature(patternSignature);
      
      if (pattern) {
        // Mettre à jour les compteurs
        const updates: any = {
          detectionCount: pattern.detectionCount + 1,
          lastSeenAt: new Date()
        };
        
        if (isTruePositive) {
          updates.truePositiveCount = pattern.truePositiveCount + 1;
        } else {
          updates.falsePositiveCount = pattern.falsePositiveCount + 1;
        }
        
        // Recalculer l'accuracy
        const totalFeedback = updates.truePositiveCount + updates.falsePositiveCount;
        updates.accuracy = totalFeedback > 0 ? updates.truePositiveCount / totalFeedback : null;
        
        // Ajuster le poids du risque selon l'accuracy
        if (updates.accuracy !== null) {
          updates.riskWeight = updates.accuracy * (pattern.riskWeight || 0.5);
        }
        
        await storage.updateBehaviorPattern(pattern.id, updates);
      } else {
        // Créer un nouveau pattern
        await this.createBehaviorPattern({
          patternType: event.eventType,
          patternSignature,
          isAnomaly: isTruePositive,
          riskWeight: isTruePositive ? '0.7' : '0.3',
          featureVector: event.evidenceData,
          exampleInstances: [{ eventId: event.id, timestamp: event.createdAt }],
          detectionCount: 1,
          truePositiveCount: isTruePositive ? 1 : 0,
          falsePositiveCount: isTruePositive ? 0 : 1,
          accuracy: '1.0',
          learnedFrom: 'admin_feedback',
          modelVersion: 'v1.0.0',
          isActive: isTruePositive
        });
      }
      
      console.log(`[FraudEngine] Learned from admin feedback - Event: ${fraudEventId}, Verdict: ${verdict}`);
      
    } catch (error) {
      console.error('[FraudEngine] Error learning from feedback:', error);
      throw error;
    }
  }

  // ===== MÉTHODES PRIVÉES =====

  private async detectBehaviorPatterns(
    userId: string,
    investments: Investment[],
    transactions: Transaction[]
  ): Promise<DetectedPattern[]> {
    const patterns: DetectedPattern[] = [];
    
    // Pattern 1: Investissements rapides en succession
    if (investments.length > 0) {
      const rapidPattern = this.detectRapidSuccession(investments);
      if (rapidPattern) patterns.push(rapidPattern);
    }
    
    // Pattern 2: Montants suspects
    const amountPattern = this.detectSuspiciousAmounts(investments);
    if (amountPattern) patterns.push(amountPattern);
    
    // Pattern 3: Timing anormal
    const timingPattern = this.detectAbnormalTiming(investments);
    if (timingPattern) patterns.push(timingPattern);
    
    return patterns;
  }

  private async analyzeUserRelationships(userId: string): Promise<SuspiciousRelationship[]> {
    // Pour l'instant, retourner un tableau vide
    // Cette fonctionnalité nécessite des données d'IP, device fingerprint, etc.
    return [];
  }

  private async findRelatedAccounts(userId: string): Promise<SuspiciousRelationship[]> {
    // Récupérer les relations existantes de la DB
    const relationships = await storage.getUserRelationships(userId);
    
    return relationships
      .filter(r => r.isSuspicious)
      .map(r => ({
        relatedUserId: r.userId2 === userId ? r.userId1 : r.userId2,
        relationshipType: r.relationshipType,
        strength: parseFloat(r.relationshipStrength),
        evidence: r.evidenceData
      }));
  }

  private async findCoordinatedBehavior(userId: string, relatedUserIds: string[]): Promise<any[]> {
    // Analyser les comportements coordonnés entre comptes liés
    const patterns = [];
    
    // Vérifier les investissements simultanés
    const userInvestments = await storage.getUserInvestments(userId);
    
    for (const relatedId of relatedUserIds) {
      const relatedInvestments = await storage.getUserInvestments(relatedId);
      
      // Trouver les investissements dans les mêmes projets
      const commonProjects = this.findCommonProjects(userInvestments, relatedInvestments);
      
      if (commonProjects.length > 0) {
        patterns.push({
          type: 'common_investments',
          relatedUser: relatedId,
          commonProjects,
          suspicionLevel: commonProjects.length / Math.min(userInvestments.length, relatedInvestments.length)
        });
      }
    }
    
    return patterns;
  }

  private findCommonProjects(investments1: Investment[], investments2: Investment[]): string[] {
    const projects1 = new Set(investments1.map(inv => inv.projectId));
    const projects2 = new Set(investments2.map(inv => inv.projectId));
    
    return Array.from(projects1).filter(p => projects2.has(p));
  }

  private calculateMultiAccountConfidence(strongConnections: any[], suspiciousPatterns: any[]): number {
    const connectionScore = Math.min(strongConnections.length * 0.2, 0.6);
    const patternScore = Math.min(suspiciousPatterns.length * 0.15, 0.4);
    
    return Math.min(connectionScore + patternScore, 1.0);
  }

  private async findRelatedAccountGroups(userIds: string[]): Promise<any[]> {
    const groups: any[] = [];
    const visited = new Set<string>();
    
    for (const userId of userIds) {
      if (visited.has(userId)) continue;
      
      const relatedAccounts = await this.findRelatedAccounts(userId);
      if (relatedAccounts.length > 0) {
        const group = {
          mainUser: userId,
          relatedAccounts: relatedAccounts.map(r => r.relatedUserId),
          averageStrength: relatedAccounts.reduce((sum, r) => sum + r.strength, 0) / relatedAccounts.length
        };
        
        groups.push(group);
        visited.add(userId);
        relatedAccounts.forEach(r => visited.add(r.relatedUserId));
      }
    }
    
    return groups;
  }

  private analyzeInvestmentTiming(investments: Investment[]): any {
    if (investments.length < 2) return { suspicious: false };
    
    const timestamps = investments.map(inv => new Date(inv.createdAt!).getTime()).sort();
    const intervals: number[] = [];
    
    for (let i = 1; i < timestamps.length; i++) {
      intervals.push(timestamps[i] - timestamps[i - 1]);
    }
    
    // Calculer la variance des intervalles
    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    
    // Des intervalles très réguliers sont suspects (bots ou coordination)
    const coefficientOfVariation = stdDev / avgInterval;
    const isSuspicious = coefficientOfVariation < 0.3 && investments.length > 5;
    
    return {
      suspicious: isSuspicious,
      avgIntervalMs: avgInterval,
      variance,
      coefficientOfVariation,
      count: investments.length
    };
  }

  private analyzeInvestmentAmounts(investments: Investment[]): any {
    if (investments.length < 2) return { suspicious: false };
    
    const amounts = investments.map(inv => parseFloat(inv.amount));
    const uniqueAmounts = new Set(amounts);
    
    // Beaucoup de montants identiques = suspect
    const diversityRatio = uniqueAmounts.size / amounts.length;
    const isSuspicious = diversityRatio < 0.3 && investments.length > 5;
    
    return {
      suspicious: isSuspicious,
      uniqueAmounts: uniqueAmounts.size,
      totalInvestments: amounts.length,
      diversityRatio
    };
  }

  private calculateCoordinationConfidence(timingPatterns: any, amountPatterns: any, relatedGroups: any[]): number {
    let score = 0;
    
    if (timingPatterns.suspicious) score += 0.3;
    if (amountPatterns.suspicious) score += 0.3;
    if (relatedGroups.length > 0) score += Math.min(relatedGroups.length * 0.2, 0.4);
    
    return Math.min(score, 1.0);
  }

  private async getUserActionHistory(userId: string): Promise<any[]> {
    // Combiner investissements et autres actions
    const investments = await storage.getUserInvestments(userId);
    
    return investments.map(inv => ({
      type: 'investment',
      timestamp: new Date(inv.createdAt!).getTime(),
      data: inv
    })).sort((a, b) => a.timestamp - b.timestamp);
  }

  private calculateTemporalRegularity(actions: any[]): number {
    if (actions.length < 3) return 0;
    
    const intervals = [];
    for (let i = 1; i < actions.length; i++) {
      intervals.push(actions[i].timestamp - actions[i - 1].timestamp);
    }
    
    const avgInterval = intervals.reduce((sum, i) => sum + i, 0) / intervals.length;
    const variance = intervals.reduce((sum, i) => sum + Math.pow(i - avgInterval, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = avgInterval > 0 ? stdDev / avgInterval : 0;
    
    // Score inversé: faible variation = haute régularité = suspect
    return Math.max(0, 1 - coefficientOfVariation);
  }

  private calculateActionSpeed(actions: any[]): number {
    if (actions.length < 2) return 0;
    
    const totalTime = actions[actions.length - 1].timestamp - actions[0].timestamp;
    const actionsPerHour = (actions.length / totalTime) * 3600000;
    
    // >10 actions par heure = suspect
    return Math.min(actionsPerHour / 10, 1.0);
  }

  private calculateActionDiversity(actions: any[]): number {
    const types = new Set(actions.map(a => a.type));
    return types.size / Math.max(actions.length, 1);
  }

  private detectRapidSuccession(investments: Investment[]): DetectedPattern | null {
    if (investments.length < 3) return null;
    
    const sorted = investments.sort((a, b) => 
      new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime()
    );
    
    let rapidCount = 0;
    for (let i = 1; i < sorted.length; i++) {
      const timeDiff = new Date(sorted[i].createdAt!).getTime() - new Date(sorted[i - 1].createdAt!).getTime();
      if (timeDiff < 60000) { // Moins d'1 minute
        rapidCount++;
      }
    }
    
    if (rapidCount > 2) {
      return {
        type: 'rapid_succession',
        signature: `rapid_${rapidCount}_in_${investments.length}`,
        confidence: Math.min(rapidCount / 5, 1.0),
        evidence: { rapidCount, totalInvestments: investments.length },
        isAnomaly: true
      };
    }
    
    return null;
  }

  private detectSuspiciousAmounts(investments: Investment[]): DetectedPattern | null {
    if (investments.length < 3) return null;
    
    const amounts = investments.map(inv => parseFloat(inv.amount));
    const uniqueAmounts = new Set(amounts);
    
    // Si plus de 70% des montants sont identiques
    if (uniqueAmounts.size === 1 || (uniqueAmounts.size / amounts.length) < 0.3) {
      return {
        type: 'amount_pattern',
        signature: `uniform_amounts_${uniqueAmounts.size}_of_${amounts.length}`,
        confidence: 1 - (uniqueAmounts.size / amounts.length),
        evidence: { uniqueAmounts: Array.from(uniqueAmounts), totalInvestments: amounts.length },
        isAnomaly: true
      };
    }
    
    return null;
  }

  private detectAbnormalTiming(investments: Investment[]): DetectedPattern | null {
    if (investments.length < 5) return null;
    
    const hours = investments.map(inv => new Date(inv.createdAt!).getHours());
    
    // Tous les investissements à la même heure = suspect
    const hourCounts = new Map<number, number>();
    hours.forEach(h => hourCounts.set(h, (hourCounts.get(h) || 0) + 1));
    
    const maxCount = Math.max(...Array.from(hourCounts.values()));
    if (maxCount / hours.length > 0.7) {
      return {
        type: 'timing_anomaly',
        signature: `concentrated_hour_${maxCount}_of_${hours.length}`,
        confidence: maxCount / hours.length,
        evidence: { hourDistribution: Object.fromEntries(hourCounts) },
        isAnomaly: true
      };
    }
    
    return null;
  }

  private calculateRiskScore(patterns: DetectedPattern[], relationships: SuspiciousRelationship[]): number {
    let score = 0;
    
    // Patterns
    patterns.forEach(pattern => {
      const weight = (this.PATTERN_WEIGHTS as any)[pattern.type] || 0.5;
      score += pattern.confidence * weight;
    });
    
    // Relationships
    relationships.forEach(rel => {
      score += rel.strength * 0.4;
    });
    
    return Math.min(score, 1.0);
  }

  private getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score < this.RISK_THRESHOLDS.LOW) return 'low';
    if (score < this.RISK_THRESHOLDS.MEDIUM) return 'medium';
    if (score < this.RISK_THRESHOLDS.HIGH) return 'high';
    return 'critical';
  }

  private getRecommendedAction(confidence: number): 'monitor' | 'restrict' | 'suspend' | 'block' | 'investigate' {
    if (confidence < this.RISK_THRESHOLDS.LOW) return 'monitor';
    if (confidence < this.RISK_THRESHOLDS.MEDIUM) return 'restrict';
    if (confidence < this.RISK_THRESHOLDS.HIGH) return 'suspend';
    if (confidence < this.RISK_THRESHOLDS.CRITICAL) return 'investigate';
    return 'block';
  }

  private generateRecommendations(score: number, patterns: DetectedPattern[], relationships: SuspiciousRelationship[]): string[] {
    const recommendations: string[] = [];
    
    if (score > this.RISK_THRESHOLDS.HIGH) {
      recommendations.push('Révision admin urgente recommandée');
    }
    
    if (patterns.some(p => p.type === 'bot_activity')) {
      recommendations.push('Vérifier l\'authenticité du compte');
    }
    
    if (relationships.length > 2) {
      recommendations.push('Investiguer les liens entre comptes');
    }
    
    if (patterns.some(p => p.type === 'rapid_succession')) {
      recommendations.push('Surveiller l\'activité en temps réel');
    }
    
    return recommendations;
  }

  private generatePatternSignature(evidenceData: any): string {
    // Générer une signature unique pour le pattern
    const keys = Object.keys(evidenceData).sort();
    const signatureParts = keys.map(k => `${k}:${typeof evidenceData[k]}`);
    return signatureParts.join('|');
  }

  private async updateUserRiskScore(userId: string, riskScore: number, riskLevel: string, contributingFactors: any): Promise<void> {
    await storage.upsertUserRiskScore({
      userId,
      riskScore: riskScore.toString(),
      riskLevel: riskLevel as any,
      contributingFactors,
      incidentCount: 0,
      falsePositiveCount: 0
    });
  }

  private async createFraudEvent(event: Omit<InsertFraudEvent, 'adminReviewed'>): Promise<void> {
    await storage.createFraudEvent({
      ...event,
      adminReviewed: false
    });
  }

  private async createBehaviorPattern(pattern: InsertBehaviorPattern): Promise<void> {
    await storage.createBehaviorPattern(pattern);
  }
}

// Instance singleton
export const fraudEngine = new FraudDetectionEngine();
