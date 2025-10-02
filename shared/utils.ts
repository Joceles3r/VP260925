// Centralized utility functions for VISUAL platform

import { PROJECT_CATEGORIES, PROFILE_CAUTION_MINIMUMS, PROFILE_WITHDRAWAL_MINIMUMS, INVESTMENT_STATUS, DEFAULT_CATEGORY_SCORE, DEFAULT_COLOR_CLASS, DEFAULT_CAUTION_MINIMUM } from './constants';

/**
 * Multi-Profile Helper Functions
 * These functions handle the new profileTypes array structure
 */

/**
 * Check if user has a specific profile
 * @param profileTypes - Array of user's profile types (can be null/undefined)
 * @param profile - Profile to check for
 * @returns true if user has the specified profile
 */
export function hasProfile(profileTypes: string[] | null | undefined, profile: string): boolean {
  if (!profileTypes || !Array.isArray(profileTypes)) {
    return false;
  }
  return profileTypes.includes(profile);
}

/**
 * Check if user has any of the specified profiles
 * @param profileTypes - Array of user's profile types (can be null/undefined)
 * @param profiles - Array of profiles to check for
 * @returns true if user has at least one of the specified profiles
 */
export function hasAnyProfile(profileTypes: string[] | null | undefined, profiles: string[]): boolean {
  if (!profileTypes || !Array.isArray(profileTypes)) {
    return false;
  }
  return profiles.some(profile => profileTypes.includes(profile));
}

/**
 * Get the highest minimum caution amount for a user with multiple profiles
 * (Users must meet the highest requirement among their profiles)
 * @param profileTypes - Array of user's profile types (can be null/undefined)
 * @returns Minimum caution amount in EUR
 */
export function getMinimumCautionAmountForUser(profileTypes: string[] | null | undefined): number {
  if (!profileTypes || !Array.isArray(profileTypes) || profileTypes.length === 0) {
    return DEFAULT_CAUTION_MINIMUM;
  }
  
  const amounts = profileTypes.map(type => 
    PROFILE_CAUTION_MINIMUMS[type as keyof typeof PROFILE_CAUTION_MINIMUMS] ?? DEFAULT_CAUTION_MINIMUM
  );
  
  return Math.max(...amounts);
}

/**
 * Get the highest minimum withdrawal amount for a user with multiple profiles
 * @param profileTypes - Array of user's profile types (can be null/undefined)
 * @returns Minimum withdrawal amount in EUR
 */
export function getMinimumWithdrawalAmountForUser(profileTypes: string[] | null | undefined): number {
  if (!profileTypes || !Array.isArray(profileTypes) || profileTypes.length === 0) {
    return 25; // Default
  }
  
  const amounts = profileTypes.map(type => 
    PROFILE_WITHDRAWAL_MINIMUMS[type as keyof typeof PROFILE_WITHDRAWAL_MINIMUMS] ?? 25
  );
  
  return Math.max(...amounts);
}

/**
 * Get minimum caution amount based on user profile type
 * @param profileType - User's profile type (creator, admin, investor, invested_reader)
 * @returns Minimum caution amount in EUR
 */
export function getMinimumCautionAmount(profileType: string): number {
  return PROFILE_CAUTION_MINIMUMS[profileType as keyof typeof PROFILE_CAUTION_MINIMUMS] ?? DEFAULT_CAUTION_MINIMUM;
}

/**
 * Get minimum withdrawal amount based on user profile type (Module 6)
 * @param profileType - User's profile type (creator, admin, investor, invested_reader)
 * @returns Minimum withdrawal amount in EUR
 */
export function getMinimumWithdrawalAmount(profileType: string): number {
  return PROFILE_WITHDRAWAL_MINIMUMS[profileType as keyof typeof PROFILE_WITHDRAWAL_MINIMUMS] ?? 25; // Default to €25
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