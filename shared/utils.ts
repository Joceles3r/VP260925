// Centralized utility functions for VISUAL platform

import { PROJECT_CATEGORIES, PROFILE_CAUTION_MINIMUMS, INVESTMENT_STATUS, DEFAULT_CATEGORY_SCORE, DEFAULT_COLOR_CLASS, DEFAULT_CAUTION_MINIMUM } from './constants';

/**
 * Get minimum caution amount based on user profile type
 * @param profileType - User's profile type (creator, admin, investor, invested_reader)
 * @returns Minimum caution amount in EUR
 */
export function getMinimumCautionAmount(profileType: string): number {
  return PROFILE_CAUTION_MINIMUMS[profileType as keyof typeof PROFILE_CAUTION_MINIMUMS] ?? DEFAULT_CAUTION_MINIMUM;
}

/**
 * Get category score for ML scoring
 * @param category - Project category
 * @returns Score between 0.0 and 1.0
 */
export function getCategoryScore(category: string): number {
  const normalizedCategory = category.toLowerCase();
  return PROJECT_CATEGORIES[normalizedCategory as keyof typeof PROJECT_CATEGORIES]?.score ?? DEFAULT_CATEGORY_SCORE;
}

/**
 * Get CSS color classes for project category
 * @param category - Project category
 * @returns CSS class string for styling
 */
export function getCategoryColor(category: string): string {
  const normalizedCategory = category?.toLowerCase();
  return PROJECT_CATEGORIES[normalizedCategory as keyof typeof PROJECT_CATEGORIES]?.colorClass ?? DEFAULT_COLOR_CLASS;
}

/**
 * Get color classes for investment status
 * @param status - Investment status (active, completed, pending)
 * @returns CSS class string for styling
 */
export function getStatusColor(status: string): string {
  return INVESTMENT_STATUS[status as keyof typeof INVESTMENT_STATUS]?.colorClass ?? DEFAULT_COLOR_CLASS;
}

/**
 * Get human-readable label for investment status
 * @param status - Investment status (active, completed, pending)
 * @returns Localized status label
 */
export function getStatusLabel(status: string): string {
  return INVESTMENT_STATUS[status as keyof typeof INVESTMENT_STATUS]?.label ?? 'Inconnu';
}

/**
 * Get human-readable label for project category
 * @param category - Project category
 * @returns Localized category label
 */
export function getCategoryLabel(category: string): string {
  const normalizedCategory = category?.toLowerCase();
  return PROJECT_CATEGORIES[normalizedCategory as keyof typeof PROJECT_CATEGORIES]?.label ?? category;
}