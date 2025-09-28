/**
 * VisualScoutAI - Agent de prospection éthique
 * Détection d'audiences pertinentes avec respect strict de la vie privée
 */

import { z } from 'zod';

// Configuration VisualScoutAI
export const SCOUT_CONFIG = {
  enabled: true,
  locales: ["fr-FR", "en-US", "es-ES"],
  keywords: {
    fr: [
      "court-métrage", "casting", "tournage", "documentaire", 
      "compositeur film", "voix off", "festival cinéma", "réalisateur indépendant",
      "financement participatif", "crowdfunding film", "production audiovisuelle"
    ],
    en: [
      "short film", "casting call", "film shoot", "documentary",
      "film composer", "voice over", "film festival", "indie filmmaker",
      "crowdfunding", "film funding", "audiovisual production"
    ],
    es: [
      "cortometraje", "casting", "rodaje", "documental",
      "compositor musical", "voz en off", "festival de cine", "cineasta independiente",
      "financiación colectiva", "producción audiovisual"
    ]
  },
  windowDays: 7,
  scoreThreshold: 62,
  channels: ["meta_ads", "tiktok_ads", "youtube_ads", "x_ads", "seo_content"],
  consentRequiredForContact: true,
  logsRetentionDays: 180,
  maxPerMinute: 10,
  cooldownMs: 5000
} as const;

// Validation schemas
export const createSegmentSchema = z.object({
  name: z.string().min(1).max(255),
  rules: z.object({
    keywords: z.array(z.string()),
    lang: z.array(z.string()),
    zones: z.array(z.string()).optional(),
    excludeKeywords: z.array(z.string()).optional()
  }),
  locale: z.string().min(2).max(10)
});

export const simulateCampaignSchema = z.object({
  segmentId: z.string().uuid(),
  budget: z.number().min(10).max(10000),
  channel: z.enum(['meta_ads', 'tiktok_ads', 'youtube_ads', 'x_ads', 'seo_content']),
  objective: z.enum(['traffic', 'video_views', 'leads'])
});

export const createCampaignSchema = z.object({
  channel: z.enum(['meta_ads', 'tiktok_ads', 'youtube_ads', 'x_ads', 'seo_content']),
  objective: z.enum(['traffic', 'video_views', 'leads']),
  segmentId: z.string().uuid(),
  budgetCents: z.number().min(1000).max(1000000), // €10 to €10,000
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional()
});

// Types
export interface TcSignal {
  id: string;
  platform: string;
  keyword?: string;
  hashtag?: string;
  lang?: string;
  ts: Date;
  engagementJson: Record<string, any>;
  sampleUrlHash?: string;
  createdAt: Date;
}

export interface TcSegment {
  id: string;
  name: string;
  rules: {
    keywords: string[];
    lang: string[];
    zones?: string[];
    excludeKeywords?: string[];
  };
  locale: string;
  status: 'active' | 'paused';
  createdAt: Date;
  updatedAt: Date;
}

export interface TcScore {
  id: string;
  segmentId: string;
  window: string;
  interestScoreAvg: number;
  ctrPred?: number;
  cvrPred?: number;
  createdAt: Date;
}

export interface TcCampaign {
  id: string;
  channel: string;
  objective: string;
  budgetCents: number;
  currency: string;
  startAt?: Date;
  endAt?: Date;
  status: 'draft' | 'active' | 'paused' | 'stopped' | 'archived';
  segmentId?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TcCreative {
  id: string;
  campaignId: string;
  locale: string;
  copy: string;
  assetRef?: string;
  kpiJson?: Record<string, any>;
  status: 'draft' | 'approved' | 'rejected' | 'running';
  createdAt: Date;
  updatedAt: Date;
}

export interface TcConsentLead {
  id: string;
  source: string;
  emailHash: string;
  consentTs: Date;
  locale?: string;
  topics?: string[];
  createdAt: Date;
}

// Service class
export class VisualScoutAI {
  private enabled: boolean;
  private lastSignalTs: number = 0;
  private signalCount: number = 0;
  private windowStart: number = 0;

  constructor() {
    this.enabled = SCOUT_CONFIG.enabled;
  }

  // Rate limiting pour éviter le spam
  private canProcessSignal(): boolean {
    if (!this.enabled) return false;
    
    const now = Date.now();
    if (now - this.windowStart > 60_000) {
      this.windowStart = now;
      this.signalCount = 0;
    }
    
    if (this.signalCount >= SCOUT_CONFIG.maxPerMinute) return false;
    if (now - this.lastSignalTs < SCOUT_CONFIG.cooldownMs) return false;
    
    this.lastSignalTs = now;
    this.signalCount++;
    return true;
  }

  // Simulation de détection de signaux (remplace par vraies APIs)
  async detectSignals(keywords: string[], locale: string): Promise<TcSignal[]> {
    if (!this.canProcessSignal()) {
      return [];
    }

    // Mock data - en production, ici on appellerait les APIs officielles
    const mockSignals: TcSignal[] = keywords.map((keyword, index) => ({
      id: `signal-${Date.now()}-${index}`,
      platform: ['instagram', 'tiktok', 'youtube', 'twitter'][index % 4],
      keyword,
      lang: locale.split('-')[0],
      ts: new Date(),
      engagementJson: {
        mentions: Math.floor(Math.random() * 100) + 10,
        likes: Math.floor(Math.random() * 1000) + 50,
        shares: Math.floor(Math.random() * 200) + 5,
        comments: Math.floor(Math.random() * 150) + 10
      },
      sampleUrlHash: `hash-${Math.random().toString(36).substring(7)}`,
      createdAt: new Date()
    }));

    return mockSignals;
  }

  // Calcul du score d'intérêt (0-100)
  calculateInterestScore(signals: TcSignal[]): number {
    if (signals.length === 0) return 0;

    let totalScore = 0;
    for (const signal of signals) {
      const engagement = signal.engagementJson;
      const mentions = engagement.mentions || 0;
      const likes = engagement.likes || 0;
      const shares = engagement.shares || 0;
      const comments = engagement.comments || 0;

      // Algorithme de scoring basé sur l'engagement
      const engagementScore = Math.min(100, 
        (mentions * 0.4) + 
        (likes * 0.001) + 
        (shares * 0.1) + 
        (comments * 0.05)
      );

      // Bonus pour plateformes créatives
      const platformBonus = signal.platform === 'youtube' ? 1.2 : 
                           signal.platform === 'instagram' ? 1.1 : 1.0;

      totalScore += engagementScore * platformBonus;
    }

    return Math.min(100, totalScore / signals.length);
  }

  // Prédiction CTR basée sur les données historiques
  predictCTR(interestScore: number, channel: string): number {
    const baselineCTR = {
      meta_ads: 1.2,
      tiktok_ads: 2.1,
      youtube_ads: 0.8,
      x_ads: 0.9,
      seo_content: 3.5
    };

    const baseline = baselineCTR[channel as keyof typeof baselineCTR] || 1.0;
    const scoreMultiplier = 0.5 + (interestScore / 100) * 1.5; // 0.5x à 2.0x
    
    return Math.min(10, baseline * scoreMultiplier);
  }

  // Prédiction CVR (conversion rate)
  predictCVR(interestScore: number, ctr: number): number {
    const baseCVR = 0.8; // 0.8% baseline
    const qualityMultiplier = (interestScore / 100) * (ctr / 2.0);
    
    return Math.min(5, baseCVR * (1 + qualityMultiplier));
  }

  // Estimation du coût par impression
  estimateCPI(channel: string, targetingComplexity: number = 1): number {
    const baseCPI = {
      meta_ads: 0.005,    // €0.005 per impression
      tiktok_ads: 0.008,
      youtube_ads: 0.003,
      x_ads: 0.004,
      seo_content: 0.001
    };

    const base = baseCPI[channel as keyof typeof baseCPI] || 0.005;
    return base * targetingComplexity;
  }

  // Génération de recommandations d'activation
  generateActivationRecommendations(score: TcScore, segment: TcSegment): {
    priority: 'high' | 'medium' | 'low';
    channels: string[];
    suggestedBudget: number;
    timing: string;
    creativeThemes: string[];
  } {
    const priority = score.interestScoreAvg >= 80 ? 'high' : 
                    score.interestScoreAvg >= 60 ? 'medium' : 'low';

    const channels = [];
    if (score.ctrPred && score.ctrPred > 1.5) channels.push('meta_ads', 'tiktok_ads');
    if (score.interestScoreAvg > 70) channels.push('youtube_ads');
    channels.push('seo_content'); // Toujours recommandé

    const suggestedBudget = Math.max(50, Math.min(500, score.interestScoreAvg * 5));

    const timing = score.interestScoreAvg > 75 ? 'immediate' : 'within_week';

    const creativeThemes = segment.rules.keywords.slice(0, 3);

    return {
      priority,
      channels,
      suggestedBudget,
      timing,
      creativeThemes
    };
  }

  // Vérification de conformité avant activation
  validateCompliance(campaign: Partial<TcCampaign>): {
    valid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    if (!campaign.budgetCents || campaign.budgetCents < 1000) {
      issues.push('Budget minimum €10 requis');
    }

    if (!campaign.channel) {
      issues.push('Canal de diffusion requis');
    }

    if (!campaign.objective) {
      issues.push('Objectif de campagne requis');
    }

    // Vérification des limites de budget
    if (campaign.budgetCents && campaign.budgetCents > 100000) {
      issues.push('Budget maximum €1,000 pour sécurité');
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  // Kill switch - arrêt d'urgence
  async emergencyStop(adminUserId: string, reason: string): Promise<void> {
    console.log(`🚨 VisualScoutAI Emergency Stop by ${adminUserId}: ${reason}`);
    this.enabled = false;
    
    // En production, ici on stopperait toutes les campagnes actives
    // et on désactiverait tous les jobs de listening
    
    // Log de l'action d'urgence
    await this.logAction('emergency_stop', {
      adminUserId,
      reason,
      timestamp: new Date().toISOString()
    });
  }

  // Logging sécurisé des actions
  private async logAction(action: string, details: Record<string, any>): Promise<void> {
    console.log(`📊 VisualScoutAI Action: ${action}`, details);
    
    // En production, ici on écrirait dans audit_logs
    // avec signature cryptographique pour l'intégrité
  }

  // Génération de templates d'outreach
  generateOutreachTemplate(locale: string, theme: string, firstName?: string): {
    subject: string;
    body: string;
  } {
    const templates = {
      'fr-FR': {
        subject: 'VISUAL — regardez, soutenez, partagez la réussite 🎬',
        body: `Bonjour ${firstName || '{Prénom}'},

Vous suivez ${theme} — VISUAL est une plateforme qui mélange **streaming** et **micro‑investissement** (2 à 20 €) pour aider les créateurs à produire leurs films/vidéos. Vous pouvez regarder des extraits, payer petit pour voir en entier, et **soutenir** les projets que vous aimez.

→ Découvrir : {lien}
→ FAQ (risques & règles) : {lien_disclaimer}

À bientôt,
L'équipe VISUAL`
      },
      'en-US': {
        subject: 'VISUAL — watch, support, share the outcome 🎬',
        body: `Hi ${firstName || '{FirstName}'},

You're into ${theme} — VISUAL blends **streaming** with **micro‑investing** (€2–€20) to help creators fund their films/videos. Watch teasers, pay small to watch full, and **support** the projects you like.

→ Explore: {link}
→ FAQ (risks & rules): {link_disclaimer}

Cheers,
The VISUAL team`
      },
      'es-ES': {
        subject: 'VISUAL — mira, apoya, comparte el éxito 🎬',
        body: `Hola ${firstName || '{Nombre}'},

Te interesa ${theme} — VISUAL combina **streaming** con **micro‑inversión** (€2–€20) para ayudar a los creadores a financiar sus películas/videos. Mira avances, paga poco para ver completo, y **apoya** los proyectos que te gustan.

→ Explorar: {enlace}
→ FAQ (riesgos y reglas): {enlace_disclaimer}

Saludos,
El equipo VISUAL`
      }
    };

    return templates[locale as keyof typeof templates] || templates['fr-FR'];
  }

  // Métriques et dashboard
  async getDashboardMetrics(): Promise<{
    activeSegments: number;
    activeCampaigns: number;
    totalReach: number;
    avgCTR: number;
    avgCVR: number;
    totalSpent: number;
    conversions: number;
    topKeywords: Array<{ keyword: string; score: number }>;
  }> {
    // Mock data - en production, calculé depuis la DB
    return {
      activeSegments: 5,
      activeCampaigns: 3,
      totalReach: 15420,
      avgCTR: 1.8,
      avgCVR: 0.9,
      totalSpent: 245.50,
      conversions: 12,
      topKeywords: [
        { keyword: 'court-métrage', score: 85 },
        { keyword: 'documentaire', score: 78 },
        { keyword: 'casting', score: 72 }
      ]
    };
  }
}

export const visualScoutAI = new VisualScoutAI();