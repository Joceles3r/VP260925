// Centralized constants for VISUAL platform
// Updated with video deposit modules - 2024

// Project categories and their properties
export const PROJECT_CATEGORIES = {
  documentaire: {
    score: 0.8,
    colorClass: 'bg-secondary/10 text-secondary',
    label: 'Documentaire'
  },
  'court-métrage': {
    score: 0.7,
    colorClass: 'bg-chart-4/10 text-purple-600',
    label: 'Court-métrage'
  },
  clip: {
    score: 0.6,
    colorClass: 'bg-accent/10 text-accent',
    label: 'Clip'
  },
  animation: {
    score: 0.75,
    colorClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    label: 'Animation'
  },
  live: {
    score: 0.5,
    colorClass: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    label: 'Live'
  }
} as const;

// User profile types and their minimum caution amounts
export const PROFILE_CAUTION_MINIMUMS = {
  creator: 10,      // Porteurs
  admin: 10,        // Infoporteurs  
  investor: 20,     // Investisseurs
  invested_reader: 20  // Investi-lecteurs
} as const;

// User profile types and their minimum withdrawal amounts (Module 6)
export const PROFILE_WITHDRAWAL_MINIMUMS = {
  creator: 50,      // Porteurs: €50 minimum 
  admin: 50,        // Infoporteurs: €50 minimum
  investor: 25,     // Investisseurs: €25 minimum
  invested_reader: 25  // Investi-lecteurs: €25 minimum
} as const;

// Investment status mappings
export const INVESTMENT_STATUS = {
  active: {
    colorClass: 'bg-accent/10 text-accent',
    label: 'En production'
  },
  completed: {
    colorClass: 'bg-secondary/10 text-secondary',
    label: 'Publié'
  },
  pending: {
    colorClass: 'bg-muted text-muted-foreground',
    label: 'Finalisation'
  }
} as const;

// Default values
export const DEFAULT_CATEGORY_SCORE = 0.5;
export const DEFAULT_COLOR_CLASS = 'bg-muted text-muted-foreground';
export const DEFAULT_CAUTION_MINIMUM = 20;

// VISUAL 16/09/2025 - Nouvelles règles de prix strictes
// Prix autorisés pour les porteurs (projets visuels)
export const ALLOWED_PROJECT_PRICES = [2, 3, 4, 5, 10] as const;
export const MAX_PROJECT_PRICE = 10;
export const MIN_PROJECT_PRICE = 2;

// Tranches d'investissement autorisées pour les investisseurs
export const ALLOWED_INVESTMENT_AMOUNTS = [2, 3, 4, 5, 6, 8, 10, 12, 15, 20] as const;
export const MAX_INVESTMENT_AMOUNT = 20;
export const MIN_INVESTMENT_AMOUNT = 2;

// Fonction utilitaire pour vérifier si un prix de projet est valide
export function isValidProjectPrice(price: number): boolean {
  return ALLOWED_PROJECT_PRICES.includes(price as any);
}

// Fonction utilitaire pour vérifier si un montant d'investissement est valide
export function isValidInvestmentAmount(amount: number): boolean {
  return ALLOWED_INVESTMENT_AMOUNTS.includes(amount as any);
}

// VISUAL video deposit pricing (based on user requirements)
export const VIDEO_DEPOSIT_PRICING = {
  clip: {
    price: 2, // €2 for clips ≤ 10 min
    maxDuration: 600, // 10 minutes in seconds
    maxSizeGB: 1, // 1 GB max
    label: 'Clips / Teasers',
    description: '≤ 10 min → 2 €'
  },
  documentary: {
    price: 5, // €5 for docs ≤ 30 min
    maxDuration: 1800, // 30 minutes in seconds
    maxSizeGB: 2, // 2 GB max
    label: 'Courts-métrages / Documentaires',
    description: '≤ 30 min → 5 €'
  },
  film: {
    price: 10, // €10 for films ≤ 4h
    maxDuration: 14400, // 4 hours in seconds
    maxSizeGB: 5, // 5 GB max
    label: 'Films complets',
    description: '≤ 4 h → 10 €'
  }
} as const;

// Creator quotas per period (monthly/quarterly limits)
export const CREATOR_QUOTAS = {
  clip: {
    maxPerMonth: 2,
    resetPeriod: 'monthly'
  },
  documentary: {
    maxPerMonth: 1,
    resetPeriod: 'monthly'
  },
  film: {
    maxPerQuarter: 1,
    resetPeriod: 'quarterly'
  }
} as const;

// Video security settings
export const VIDEO_SECURITY = {
  tokenExpiryMinutes: 15, // Tokens expire after 15 minutes
  maxTokenUsage: 3, // Max 3 uses per token
  hlsSegmentDuration: 10, // HLS segment duration in seconds
  allowedReferers: [], // Empty = allow all (VISUAL manages this)
  maxSimultaneousSessions: 2, // Max concurrent sessions per user
  watermarkEnabled: true // Dynamic watermarks enabled
} as const;

// Bunny.net CDN configuration (single VISUAL account)
// Note: libraryId and apiKey are configured server-side only for security
export const BUNNY_CONFIG = {
  storageZone: 'visual-videos', // Single storage zone for all videos
  pullZone: 'visual-cdn', // Single pull zone for delivery
  baseUrl: 'https://visual-videos.b-cdn.net', // VISUAL's CDN URL
  streamApiUrl: 'https://video.bunnycdn.com/library', // Stream API base
  allowedFormats: ['mp4', 'webm', 'mov'], // Allowed video formats
  maxConcurrentUploads: 3 // Limit concurrent uploads
} as const;

// ===== NOUVELLES CONSTANTES POUR FONCTIONNALITÉS AVANCÉES =====

// Système de parrainage
export const REFERRAL_SYSTEM = {
  maxReferralsPerMonth: 20, // Limite de 20 filleuls/mois
  sponsorBonusVP: 100, // 100 VISUpoints (1€) pour le parrain
  refereeBonusVP: 50, // 50 VISUpoints (0.50€) pour le filleul
  linkExpiryDays: 30, // Liens valides 30 jours
  codeLength: 8, // Longueur du code de parrainage
} as const;

// Gamification - Streaks de connexion
export const STREAK_REWARDS = {
  daily: 5, // 5 VP par jour consécutif
  weekly: 50, // Bonus 50 VP pour 7 jours consécutifs
  monthly: 200, // Bonus 200 VP pour 30 jours consécutifs
  maxStreakReward: 500, // Récompense maximale pour un streak
} as const;

// Visiteur du mois
export const VISITOR_OF_MONTH = {
  rewardVP: 2500, // 25€ en VISUpoints pour le gagnant
  minActivitiesForRanking: 10, // Minimum d'activités pour être classé
  activityPoints: {
    page_view: 1,
    project_view: 2,
    investment: 10,
    social_interaction: 3,
    login: 2,
  },
} as const;

// Prix articles pour Infoporteurs {0, 0.2-5€}
export const ALLOWED_ARTICLE_PRICES = [0, 0.2, 0.5, 1, 2, 3, 4, 5] as const;
export const MAX_ARTICLE_PRICE = 5;
export const MIN_ARTICLE_PRICE = 0;

// Fonction utilitaire pour vérifier si un prix d'article est valide
export function isValidArticlePrice(price: number): boolean {
  return ALLOWED_ARTICLE_PRICES.includes(price as any);
}

// Packs VISUpoints pour Investi-lecteurs
export const VISU_POINTS_PACKS = [
  { name: 'Starter', points: 500, price: 5, bonus: 0 },
  { name: 'Standard', points: 1200, price: 10, bonus: 100 },
  { name: 'Premium', points: 2500, price: 20, bonus: 250 },
  { name: 'Ultimate', points: 5500, price: 40, bonus: 600 },
] as const;

// VISUpoints système
export const VISU_POINTS = {
  conversionRate: 100, // 100 VP = 1 EUR
  conversionThreshold: 2500, // Minimum 2500 VP pour conversion
  bonusActions: {
    stripe_connected: 50,
    bunny_activated: 25,
    first_investment: 100,
    profile_completed: 30,
    referral_success: 100,
    article_published: 20,
    daily_login: 5,
  },
} as const;

// Filtres émotionnels
export const EMOTIONAL_FILTERS = {
  joie: { color: '#fbbf24', icon: '😊' },
  tristesse: { color: '#3b82f6', icon: '😢' },
  colère: { color: '#ef4444', icon: '😠' },
  peur: { color: '#6b7280', icon: '😰' },
  surprise: { color: '#8b5cf6', icon: '😲' },
  dégoût: { color: '#10b981', icon: '🤢' },
  confiance: { color: '#06b6d4', icon: '😌' },
  anticipation: { color: '#f59e0b', icon: '🤗' },
} as const;

// ===== PRÉLÈVEMENT VISUAL 30% SUR VENTES ARTICLES =====
// Additif v.16/09/2025 - Prélèvement automatique sur chaque vente d'article
export const VISUAL_PLATFORM_FEE = {
  PLATFORM_FEE_INFOARTICLE: 0.30, // 30% pour VISUAL
  NET_TO_INFOPORTEUR: 0.70, // 70% pour l'infoporteur
  VISUPOINTS_TO_EUR: 100, // 100 pts = 1 € (référence VISU_POINTS.conversionRate)
  VISUPOINTS_CONVERSION_THRESHOLD: 2500, // Seuil conversion (référence VISU_POINTS.conversionThreshold)
  TRANSFER_DELAY_HOURS: 24, // Délai avant transfert Stripe (24h)
} as const;

// ===== TOP10 SYSTEM - Classements et Redistributions =====
// Système de classement quotidien des infoporteurs et investi-lecteurs
export const TOP10_SYSTEM = {
  RANKING_SIZE: 10, // TOP 10 articles/jour
  TOTAL_ARTICLES_POOL: 100, // Pool total de 100 articles
  REDISTRIBUTION_RANKS_START: 11, // Redistribution commence au rang 11
  REDISTRIBUTION_RANKS_END: 100, // Redistribution termine au rang 100
  SPLIT_TOP10_PERCENT: 0.60, // 60% du pot pour TOP10 infoporteurs
  SPLIT_WINNERS_PERCENT: 0.40, // 40% du pot pour investi-lecteurs vainqueurs
  PROCESSING_DELAY_HOURS: 24, // Délai avant transfert Stripe (24h)
  MIN_DAILY_SALES_FOR_RANKING: 1, // Minimum 1 vente pour être classé
} as const;

// ===== FIDÉLITÉ AMÉLIORÉE - Streaks Quotidiens et Hebdomadaires =====
// Nouveau système de fidélité avec cycles quotidiens et hebdomadaires
export const ENHANCED_FIDELITY = {
  // Barème quotidien - cycle de 7 jours
  DAILY_STREAK_REWARDS: [
    { day: 1, points: 1 }, // 1er jour consécutif = 1 VP
    { day: 2, points: 2 }, // 2ème jour consécutif = 2 VP
    { day: 3, points: 3 }, // 3ème jour consécutif = 3 VP
    { day: 4, points: 4 }, // 4ème jour consécutif = 4 VP
    { day: 5, points: 6 }, // 5ème jour consécutif = 6 VP
    { day: 6, points: 8 }, // 6ème jour consécutif = 8 VP
    { day: 7, points: 10 } // 7ème jour consécutif = 10 VP (puis reset)
  ],
  DAILY_CYCLE_LENGTH: 7, // Cycle de 7 jours
  
  // Barème hebdomadaire - cycle de 4 semaines
  WEEKLY_STREAK_REWARDS: [
    { week: 1, points: 5 },  // 1ère semaine consécutive = 5 VP
    { week: 2, points: 10 }, // 2ème semaine consécutive = 10 VP
    { week: 3, points: 15 }, // 3ème semaine consécutive = 15 VP
    { week: 4, points: 20 }  // 4ème semaine consécutive = 20 VP (puis reset)
  ],
  WEEKLY_CYCLE_LENGTH: 4, // Cycle de 4 semaines
  
  // Combinaison possible des deux systèmes
  SYSTEMS_ARE_CUMULATIVE: true,
  
  // Gestion des streaks
  STREAK_RESET_HOURS: 30, // Reset si pas de connexion pendant 30h
} as const;