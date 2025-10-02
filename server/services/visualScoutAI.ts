/**
 * VisualScoutAI - Prospection Éthique Assistée par IA
 * 
 * Agent de détection, scoring et activation d'audiences pertinentes
 * pour VISUAL, en respectant strictement RGPD/CCPA et les CGU des plateformes.
 * 
 * Rôles :
 * - Écoute sociale via APIs officielles uniquement
 * - Détection de signaux publics (mots-clés, hashtags, engagement)
 * - Scoring d'intérêt et recommandations d'activation
 * - Respect strict de la vie privée (aucun message non sollicité)
 */

import { db } from "../db";
import { 
  tcSignals, 
  tcSegments, 
  tcScores, 
  tcCampaigns, 
  tcCreatives,
  tcConsentLeads,
  type InsertTcSignal,
  type InsertTcSegment,
  type InsertTcScore,
  type InsertTcCampaign,
  type InsertTcCreative,
  type InsertTcConsentLead,
  type TcSegment,
  type TcScore,
  type TcCampaign
} from "@shared/schema";
import { eq, and, desc, sql, gte } from "drizzle-orm";
import { logger } from "../config/logger";

interface ScoutConfig {
  enabled: boolean;
  locales: string[];
  keywords: {
    [locale: string]: string[];
  };
  windowDays: number;
  scoreThreshold: number;
  channels: string[];
  consentRequiredForContact: boolean;
  logsRetentionDays: number;
}

const DEFAULT_CONFIG: ScoutConfig = {
  enabled: true,
  locales: ["fr-FR", "en-US", "es-ES"],
  keywords: {
    "fr": ["court-métrage", "casting", "tournage", "documentaire", "compositeur film", "voix off", "festival cinéma"],
    "en": ["short film", "casting call", "film shoot", "documentary", "film composer", "voice over", "film festival"],
    "es": ["cortometraje", "casting", "rodaje", "documental", "compositor", "voz en off", "festival cine"]
  },
  windowDays: 7,
  scoreThreshold: 62,
  channels: ["meta_ads", "tiktok_ads", "youtube_ads", "x_ads", "seo_content"],
  consentRequiredForContact: true,
  logsRetentionDays: 180,
};

class VisualScoutAIService {
  private config: ScoutConfig;
  private isRunning: boolean = false;

  constructor(config: Partial<ScoutConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async start(): Promise<void> {
    if (!this.config.enabled) {
      logger.info('[VisualScoutAI] Service disabled in configuration');
      return;
    }

    if (this.isRunning) {
      logger.warn('[VisualScoutAI] Service already running');
      return;
    }

    this.isRunning = true;
    logger.info('[VisualScoutAI] Service started', {
      locales: this.config.locales,
      channels: this.config.channels,
    });
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    logger.info('[VisualScoutAI] Service stopped');
  }

  async killSwitch(): Promise<void> {
    logger.critical('[VisualScoutAI] KILL SWITCH ACTIVATED', undefined, {
      timestamp: new Date().toISOString(),
      reason: 'Emergency stop requested',
    });

    await this.pauseAllCampaigns();
    await this.stop();
  }

  async createSegment(data: InsertTcSegment): Promise<string> {
    const [segment] = await db.insert(tcSegments).values(data).returning();
    
    logger.info('[VisualScoutAI] Segment created', {
      segmentId: segment.id,
      name: segment.name,
      locale: segment.locale,
    });

    return segment.id;
  }

  async getActiveSegments(): Promise<TcSegment[]> {
    return db.select()
      .from(tcSegments)
      .where(eq(tcSegments.status, 'active'));
  }

  async getSegmentScores(segmentId: string, limit: number = 30): Promise<TcScore[]> {
    return db.select()
      .from(tcScores)
      .where(eq(tcScores.segmentId, segmentId))
      .orderBy(desc(tcScores.createdAt))
      .limit(limit);
  }

  async recordSignal(signal: InsertTcSignal): Promise<void> {
    await db.insert(tcSignals).values(signal);
  }

  async scoreSegment(segmentId: string): Promise<TcScore> {
    const segment = await db.select()
      .from(tcSegments)
      .where(eq(tcSegments.id, segmentId))
      .limit(1);

    if (!segment.length) {
      throw new Error(`Segment ${segmentId} not found`);
    }

    const windowStart = new Date();
    windowStart.setDate(windowStart.getDate() - this.config.windowDays);

    const recentSignals = await db.select()
      .from(tcSignals)
      .where(gte(tcSignals.ts, windowStart));

    const filteredSignals = this.filterSignalsByRules(recentSignals, segment[0].rules as any);
    const score = this.calculateInterestScore(filteredSignals);

    const [newScore] = await db.insert(tcScores).values({
      segmentId,
      window: `last_${this.config.windowDays}d`,
      interestScoreAvg: score.avg.toString(),
      ctrPred: score.ctr.toString(),
      cvrPred: score.cvr.toString(),
    }).returning();

    logger.info('[VisualScoutAI] Segment scored', {
      segmentId,
      interestScore: score.avg,
      ctr: score.ctr,
      cvr: score.cvr,
      signalCount: filteredSignals.length,
    });

    return newScore;
  }

  private filterSignalsByRules(signals: any[], rules: { keywords?: string[], lang?: string[] }): any[] {
    return signals.filter(signal => {
      if (rules.lang && !rules.lang.includes(signal.lang)) {
        return false;
      }
      if (rules.keywords && signal.keyword) {
        return rules.keywords.some(kw => 
          signal.keyword.toLowerCase().includes(kw.toLowerCase())
        );
      }
      return true;
    });
  }

  private calculateInterestScore(signals: any[]): { avg: number, ctr: number, cvr: number } {
    if (signals.length === 0) {
      return { avg: 0, ctr: 0, cvr: 0 };
    }

    let totalEngagement = 0;
    for (const signal of signals) {
      const engagement = signal.engagementJson as any;
      totalEngagement += (engagement?.likes || 0) + 
                         (engagement?.comments || 0) + 
                         (engagement?.shares || 0);
    }

    const avgEngagement = totalEngagement / signals.length;
    const interestScore = Math.min(100, Math.max(0, avgEngagement / 10));
    
    const ctr = Math.min(100, interestScore * 0.8);
    const cvr = Math.min(100, interestScore * 0.25);

    return {
      avg: Math.round(interestScore * 100) / 100,
      ctr: Math.round(ctr * 100) / 100,
      cvr: Math.round(cvr * 100) / 100,
    };
  }

  async simulateCampaign(segmentId: string, budgetCents: number): Promise<{
    reachPred: number;
    ctrPred: number;
    cvrPred: number;
    cpiEst: number;
  }> {
    const latestScores = await this.getSegmentScores(segmentId, 1);
    
    if (!latestScores.length) {
      throw new Error('No scores available for segment');
    }

    const score = latestScores[0];
    const budgetEuros = budgetCents / 100;
    
    const cpiEst = 1.5;
    const reachPred = Math.round(budgetEuros / cpiEst);
    
    return {
      reachPred,
      ctrPred: parseFloat(score.ctrPred || "0"),
      cvrPred: parseFloat(score.cvrPred || "0"),
      cpiEst,
    };
  }

  async createCampaign(data: InsertTcCampaign): Promise<string> {
    const [campaign] = await db.insert(tcCampaigns).values(data).returning();
    
    logger.info('[VisualScoutAI] Campaign created', {
      campaignId: campaign.id,
      channel: campaign.channel,
      objective: campaign.objective,
      status: campaign.status,
    });

    return campaign.id;
  }

  async updateCampaignStatus(campaignId: string, status: string): Promise<void> {
    await db.update(tcCampaigns)
      .set({ 
        status: status as any,
        updatedAt: new Date(),
      })
      .where(eq(tcCampaigns.id, campaignId));

    logger.info('[VisualScoutAI] Campaign status updated', {
      campaignId,
      status,
    });
  }

  async pauseAllCampaigns(): Promise<void> {
    await db.update(tcCampaigns)
      .set({ status: 'paused', updatedAt: new Date() })
      .where(eq(tcCampaigns.status, 'active'));

    logger.warn('[VisualScoutAI] All active campaigns paused');
  }

  async getDashboardMetrics(): Promise<{
    totalSegments: number;
    activeSegments: number;
    activeCampaigns: number;
    totalReach: number;
    avgCtr: number;
    avgCvr: number;
  }> {
    const segments = await db.select().from(tcSegments);
    const activeSegments = segments.filter(s => s.status === 'active');
    const campaigns = await db.select().from(tcCampaigns);
    const activeCampaigns = campaigns.filter(c => c.status === 'active');

    const recentScores = await db.select()
      .from(tcScores)
      .orderBy(desc(tcScores.createdAt))
      .limit(100);

    const avgCtr = recentScores.length > 0
      ? recentScores.reduce((sum, s) => sum + parseFloat(s.ctrPred || "0"), 0) / recentScores.length
      : 0;

    const avgCvr = recentScores.length > 0
      ? recentScores.reduce((sum, s) => sum + parseFloat(s.cvrPred || "0"), 0) / recentScores.length
      : 0;

    const totalReach = campaigns.reduce((sum, c) => {
      const kpi = c.kpiJson as any;
      return sum + (kpi?.reach || 0);
    }, 0);

    return {
      totalSegments: segments.length,
      activeSegments: activeSegments.length,
      activeCampaigns: activeCampaigns.length,
      totalReach,
      avgCtr: Math.round(avgCtr * 100) / 100,
      avgCvr: Math.round(avgCvr * 100) / 100,
    };
  }

  async addConsentLead(data: InsertTcConsentLead): Promise<string> {
    const [lead] = await db.insert(tcConsentLeads).values(data).returning();
    
    logger.info('[VisualScoutAI] Consent lead added', {
      source: lead.source,
      locale: lead.locale,
    });

    return lead.id;
  }

  async getRecommendations(segmentId: string): Promise<{
    topCreatives: string[];
    topHashtags: string[];
    bestTiming: string[];
    suggestedBudget: number;
  }> {
    const scores = await this.getSegmentScores(segmentId, 7);
    
    if (!scores.length) {
      return {
        topCreatives: [],
        topHashtags: [],
        bestTiming: [],
        suggestedBudget: 50000,
      };
    }

    const avgScore = scores.reduce((sum, s) => sum + parseFloat(s.interestScoreAvg), 0) / scores.length;
    
    return {
      topCreatives: ['neon_cinema_fr', 'battle_friday_en', 'investment_showcase'],
      topHashtags: ['#courtmétrage', '#shortfilm', '#indiefilm', '#filmfestival'],
      bestTiming: ['18:00-21:00', '12:00-14:00'],
      suggestedBudget: Math.max(50000, Math.min(500000, Math.round(avgScore * 5000))),
    };
  }

  async generateSEOForNewProject(projectId: string, locale: string = 'fr'): Promise<void> {
    try {
      const { seoService } = await import('./seoService');
      await seoService.generateMetadataForProject(projectId, locale);
      
      logger.info('[VisualScoutAI] SEO metadata generated for project', {
        projectId,
        locale,
      });
    } catch (error) {
      logger.error('[VisualScoutAI] Failed to generate SEO for project', error, {
        projectId,
        locale,
      });
    }
  }

  async autoGenerateSEOForAllLocales(pageSlug: string, pageType: 'home' | 'project', projectId?: string): Promise<void> {
    const locales = this.config.locales.map(l => l.split('-')[0]);
    
    for (const locale of locales) {
      try {
        const { seoService } = await import('./seoService');
        
        if (pageType === 'home') {
          await seoService.generateHomePageMetadata(locale);
        } else if (pageType === 'project' && projectId) {
          await seoService.generateMetadataForProject(projectId, locale);
        }
        
        logger.info('[VisualScoutAI] SEO auto-generated', {
          pageSlug,
          locale,
          pageType,
          projectId,
        });
      } catch (error) {
        logger.error('[VisualScoutAI] SEO auto-generation failed', error, {
          pageSlug,
          locale,
          projectId,
        });
      }
    }
  }
}

export const visualScoutAI = new VisualScoutAIService();
