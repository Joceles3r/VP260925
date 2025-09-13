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
export const BUNNY_CONFIG = {
  storageZone: 'visual-videos', // Single storage zone for all videos
  pullZone: 'visual-cdn', // Single pull zone for delivery
  libraryId: process.env.BUNNY_LIBRARY_ID || '', // VISUAL's library ID
  apiKey: process.env.BUNNY_API_KEY || '', // VISUAL's API key
  baseUrl: 'https://visual-videos.b-cdn.net', // VISUAL's CDN URL
  streamApiUrl: 'https://video.bunnycdn.com/library', // Stream API base
  allowedFormats: ['mp4', 'webm', 'mov'], // Allowed video formats
  maxConcurrentUploads: 3 // Limit concurrent uploads
} as const;