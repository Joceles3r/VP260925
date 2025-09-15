import { z } from 'zod';

/**
 * MODULE 5: Règles catégories vidéos - Schemas de validation
 * 
 * Règles métier :
 * 1. Activation catégorie : ≥30 vidéos déposées
 * 2. Démarrage cycle : Dès 30 vidéos validées → cycle de 168h (7 jours) 
 * 3. Limite max : 100 vidéos par cycle
 * 4. Cycle 2 : Si <100 vidéos après 168h → deuxième cycle de 168h
 * 5. Clôture : Après 2×168h si <100 vidéos → clôture + paiements Stripe
 */

// Schema pour créer une nouvelle catégorie vidéo
export const createCategorySchema = z.object({
  name: z.string().min(1, "Nom requis").max(100, "Nom trop long"),
  displayName: z.string().min(1, "Nom d'affichage requis"),
  description: z.string().optional(),
  targetVideoCount: z.number().min(30).max(100).default(30),
  maxVideoCount: z.number().min(30).max(100).default(100),
});

// Schema pour mettre à jour une catégorie
export const updateCategorySchema = z.object({
  displayName: z.string().min(1).optional(),
  description: z.string().optional(),
  targetVideoCount: z.number().min(30).max(100).optional(),
  maxVideoCount: z.number().min(30).max(100).optional(),
  isActive: z.boolean().optional(),
});

// Schema pour démarrer un cycle manuel (admin)
export const startCycleSchema = z.object({
  categoryId: z.string().uuid("ID catégorie invalide"),
  forceCycle: z.boolean().default(false), // Forcer même si <30 vidéos
});

// Schema pour clôturer une catégorie manuellement
export const closeCategorySchema = z.object({
  categoryId: z.string().uuid("ID catégorie invalide"),
  reason: z.string().min(1, "Raison requise"),
  triggerPayments: z.boolean().default(true),
});

// Schema pour vérification automatique des seuils
export const checkThresholdsSchema = z.object({
  dryRun: z.boolean().default(true),
  categoryIds: z.array(z.string().uuid()).optional(), // Vérifier catégories spécifiques
});

// Schema pour statistiques de catégorie
export const categoryStatsSchema = z.object({
  categoryId: z.string().uuid("ID catégorie invalide"),
  includeVideos: z.boolean().default(false),
  includeInvestments: z.boolean().default(false),
});

// Schema pour le processus de paiement de clôture
export const categoryPayoutSchema = z.object({
  categoryId: z.string().uuid("ID catégorie invalide"),
  dryRun: z.boolean().default(true),
  payoutMethod: z.enum(['stripe_connect', 'manual']).default('stripe_connect'),
});

// Types déduits pour TypeScript
export type CreateCategoryRequest = z.infer<typeof createCategorySchema>;
export type UpdateCategoryRequest = z.infer<typeof updateCategorySchema>;
export type StartCycleRequest = z.infer<typeof startCycleSchema>;
export type CloseCategoryRequest = z.infer<typeof closeCategorySchema>;
export type CheckThresholdsRequest = z.infer<typeof checkThresholdsSchema>;
export type CategoryStatsRequest = z.infer<typeof categoryStatsSchema>;
export type CategoryPayoutRequest = z.infer<typeof categoryPayoutSchema>;

// Constantes des règles métier
export const CATEGORY_RULES = {
  MIN_VIDEOS_TO_ACTIVATE: 30,
  MAX_VIDEOS_PER_CYCLE: 100,
  CYCLE_DURATION_HOURS: 168, // 7 jours
  MAX_CYCLES: 2,
  AUTO_CHECK_INTERVAL_MINUTES: 60, // Vérification automatique chaque heure
} as const;

// Types d'événements pour l'audit des catégories
export const CATEGORY_EVENTS = {
  CATEGORY_CREATED: 'category_created',
  CATEGORY_UPDATED: 'category_updated',
  CATEGORY_ACTIVATED: 'category_activated', 
  CYCLE_STARTED: 'cycle_started',
  CYCLE_EXTENDED: 'cycle_extended',
  CATEGORY_CLOSED: 'category_closed',
  THRESHOLD_CHECK: 'threshold_check',
  PAYOUT_PROCESSED: 'payout_processed',
} as const;