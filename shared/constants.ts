// Centralized constants for VISUAL platform

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
  },
  livres: {
    score: 0.65,
    colorClass: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    label: 'Livres'
  }
} as const;

// User profile types and their minimum caution amounts
export const PROFILE_CAUTION_MINIMUMS = {
  creator: 10,      // Porteurs
  admin: 10,        // Infoporteurs  
  investor: 20,     // Investisseurs
  invested_reader: 20  // Investi-lecteurs
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
  },
  rejected: {
    colorClass: 'bg-destructive/10 text-destructive',
    label: 'Rejeté'
  }
} as const;

// Investment amounts and corresponding votes
export const INVESTMENT_VOTES_MAPPING = {
  2: 1,
  3: 2,
  4: 3,
  5: 4,
  6: 5,
  8: 6,
  10: 7,
  12: 8,
  15: 9,
  20: 10
} as const;

// VISUpoints conversion rates
export const VISUPOINTS_CONFIG = {
  EUR_TO_POINTS: 100, // 1 EUR = 100 VISUpoints
  MIN_WITHDRAWAL: 2500, // Minimum points for withdrawal
  WITHDRAWAL_THRESHOLD_EUR: 25 // Minimum EUR for withdrawal
} as const;

// Platform revenue sharing
export const REVENUE_SHARING = {
  PLATFORM_COMMISSION: 0.30, // 30% to platform
  CREATOR_SHARE: 0.70, // 70% to creator
  MONTHLY_POT_CREATORS: 0.60, // 60% of monthly pot to top creators
  MONTHLY_POT_INVESTORS: 0.40 // 40% of monthly pot to winning investors
} as const;

// Content report types with descriptions
export const REPORT_TYPES = {
  plagiat: {
    label: 'Plagiat',
    description: 'Contenu copié sans autorisation'
  },
  contenu_offensant: {
    label: 'Contenu offensant',
    description: 'Contenu inapproprié ou choquant'
  },
  desinformation: {
    label: 'Désinformation',
    description: 'Informations fausses ou trompeuses'
  },
  infraction_legale: {
    label: 'Infraction légale',
    description: 'Violation des lois en vigueur'
  },
  contenu_illicite: {
    label: 'Contenu illicite',
    description: 'Contenu interdit par la loi'
  },
  violation_droits: {
    label: 'Violation de droits',
    description: 'Atteinte aux droits d\'auteur ou autres droits'
  },
  propos_haineux: {
    label: 'Propos haineux',
    description: 'Incitation à la haine ou discrimination'
  }
} as const;

// Live streaming battle configuration
export const LIVE_BATTLE_CONFIG = {
  MIN_INVESTMENT: 1, // Minimum €1 investment
  MAX_INVESTMENT: 20, // Maximum €20 investment
  BATTLE_DURATION_MINUTES: 60, // Default battle duration
  VOTING_PERIOD_MINUTES: 10 // Voting period after battle
} as const;

// Notification types configuration
export const NOTIFICATION_TYPES = {
  investment_milestone: {
    label: 'Objectif d\'investissement atteint',
    defaultEnabled: true
  },
  funding_goal_reached: {
    label: 'Objectif de financement atteint',
    defaultEnabled: true
  },
  project_status_change: {
    label: 'Changement de statut de projet',
    defaultEnabled: true
  },
  roi_update: {
    label: 'Mise à jour ROI',
    defaultEnabled: false
  },
  new_investment: {
    label: 'Nouvel investissement',
    defaultEnabled: true
  },
  live_show_started: {
    label: 'Émission live commencée',
    defaultEnabled: true
  },
  battle_result: {
    label: 'Résultat de battle',
    defaultEnabled: true
  },
  performance_alert: {
    label: 'Alerte de performance',
    defaultEnabled: false
  }
} as const;

// ML Scoring parameters
export const ML_SCORING_CONFIG = {
  MAX_SCORE: 10.0,
  MIN_SCORE: 0.0,
  CATEGORY_WEIGHT: 0.3,
  AMOUNT_WEIGHT: 0.2,
  QUALITY_WEIGHT: 0.5,
  DEFAULT_SCORE: 5.0
} as const;

// Default values
export const DEFAULT_CATEGORY_SCORE = 0.5;
export const DEFAULT_COLOR_CLASS = 'bg-muted text-muted-foreground';
export const DEFAULT_CAUTION_MINIMUM = 20;

// API Rate limits
export const RATE_LIMITS = {
  REPORTS_PER_HOUR: 10,
  INVESTMENTS_PER_MINUTE: 5,
  SOCIAL_POSTS_PER_HOUR: 20,
  API_REQUESTS_PER_MINUTE: 100
} as const;

// File upload limits
export const UPLOAD_LIMITS = {
  MAX_VIDEO_SIZE_MB: 100,
  MAX_IMAGE_SIZE_MB: 10,
  ALLOWED_VIDEO_TYPES: ['mp4', 'mov', 'avi', 'webm'],
  ALLOWED_IMAGE_TYPES: ['jpg', 'jpeg', 'png', 'webp', 'gif']
} as const;