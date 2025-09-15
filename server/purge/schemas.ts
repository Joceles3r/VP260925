// PURGE_SCHEMAS - Zod validation schemas for VISUAL purge operations
// These schemas validate purge requests and ensure data integrity

import { z } from "zod";

// Manual purge request schema with comprehensive validation
export const purgeRequestSchema = z.object({
  types: z.array(z.enum(['projects', 'live_shows', 'articles', 'technical', 'financial', 'all'])).min(1).default(['all']),
  dryRun: z.boolean().default(true), // Default to dry-run for safety
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(), 
  limit: z.number().int().min(1).max(1000).default(100), // Pagination with safety limits
  offset: z.number().int().min(0).default(0)
});

// Scheduled purge request schema with authentication
export const scheduledPurgeSchema = z.object({
  dryRun: z.boolean().default(true),
  authKey: z.string().min(1)
});

// Type exports for TypeScript safety
export type PurgeRequest = z.infer<typeof purgeRequestSchema>;
export type ScheduledPurgeRequest = z.infer<typeof scheduledPurgeSchema>;

// Purge result structure for consistent response formatting
export interface PurgeResults {
  dryRun: boolean;
  dateFilter: { from: Date | null; to: Date | null };
  pagination: { limit: number; offset: number };
  projects: PurgeOperationResult;
  liveShows: PurgeOperationResult;
  articles: PurgeOperationResult;
  technical: PurgeOperationResult;
  financial: PurgeOperationResult;
  startedAt: Date;
  completedAt: Date | null;
}

export interface PurgeOperationResult {
  processed: number;
  purged: number;
  errors: string[];
  affectedIds: string[];
}

// Purge statistics schema for comprehensive analytics
export interface PurgeStatistics {
  generatedAt: Date;
  dateFilter: { from: Date | null; to: Date | null };
  pagination: { limit: number; offset: number };
  projects: {
    total: number;
    active: number;
    expired: number;
    archived: number;
    pendingPurge: number;
    eligibleForPurge: number;
  };
  liveShows: {
    total: number;
    active: number;
    ended: number;
    archived: number;
    eligibleForPurge: number;
  };
  articles: {
    total: number;
    recent: number;
    inactive: number;
    archived: number;
    eligibleForPurge: number;
  };
  technical: {
    oldTransactions: number;
    inactiveUsers: number;
    totalUsers: number;
    eligibleForPurge: number;
  };
  financial: {
    usersWithSmallBalances: number;
    totalSmallBalances: number;
    eligibleForPurge: number;
  };
  summary: {
    totalEligibleForPurge: number;
    estimatedSafetyRisk: 'low' | 'medium' | 'high';
  };
}