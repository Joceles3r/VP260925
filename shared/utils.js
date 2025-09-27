// Centralized utility functions for VISUAL platform
import { PROJECT_CATEGORIES, PROFILE_CAUTION_MINIMUMS, INVESTMENT_STATUS, INVESTMENT_VOTES_MAPPING, VISUPOINTS_CONFIG, DEFAULT_CATEGORY_SCORE, DEFAULT_COLOR_CLASS, DEFAULT_CAUTION_MINIMUM, REPORT_TYPES } from './constants';
/**
 * Get minimum caution amount based on user profile type
 * @param profileType - User's profile type (creator, admin, investor, invested_reader)
 * @returns Minimum caution amount in EUR
 */
export function getMinimumCautionAmount(profileType) {
    return PROFILE_CAUTION_MINIMUMS[profileType] ?? DEFAULT_CAUTION_MINIMUM;
}
/**
 * Get category score for ML scoring
 * @param category - Project category
 * @returns Score between 0.0 and 1.0
 */
export function getCategoryScore(category) {
    const normalizedCategory = category.toLowerCase();
    return PROJECT_CATEGORIES[normalizedCategory]?.score ?? DEFAULT_CATEGORY_SCORE;
}
/**
 * Get CSS color classes for project category
 * @param category - Project category
 * @returns CSS class string for styling
 */
export function getCategoryColor(category) {
    const normalizedCategory = category?.toLowerCase();
    return PROJECT_CATEGORIES[normalizedCategory]?.colorClass ?? DEFAULT_COLOR_CLASS;
}
/**
 * Get color classes for investment status
 * @param status - Investment status (active, completed, pending, rejected)
 * @returns CSS class string for styling
 */
export function getStatusColor(status) {
    return INVESTMENT_STATUS[status]?.colorClass ?? DEFAULT_COLOR_CLASS;
}
/**
 * Get human-readable label for investment status
 * @param status - Investment status (active, completed, pending, rejected)
 * @returns Localized status label
 */
export function getStatusLabel(status) {
    return INVESTMENT_STATUS[status]?.label ?? 'Inconnu';
}
/**
 * Get human-readable label for project category
 * @param category - Project category
 * @returns Localized category label
 */
export function getCategoryLabel(category) {
    const normalizedCategory = category?.toLowerCase();
    return PROJECT_CATEGORIES[normalizedCategory]?.label ?? category;
}
/**
 * Calculate votes based on investment amount
 * @param amount - Investment amount in EUR
 * @returns Number of votes
 */
export function calculateVotes(amount) {
    const closestAmount = Object.keys(INVESTMENT_VOTES_MAPPING)
        .map(Number)
        .find(amt => amt >= amount) || 20;
    return INVESTMENT_VOTES_MAPPING[closestAmount] || 10;
}
/**
 * Convert EUR to VISUpoints
 * @param eur - Amount in EUR
 * @returns VISUpoints amount
 */
export function eurToVisuPoints(eur) {
    return Math.floor(eur * VISUPOINTS_CONFIG.EUR_TO_POINTS);
}
/**
 * Convert VISUpoints to EUR
 * @param points - VISUpoints amount
 * @returns EUR amount
 */
export function visuPointsToEur(points) {
    return points / VISUPOINTS_CONFIG.EUR_TO_POINTS;
}
/**
 * Check if VISUpoints amount is withdrawable
 * @param points - VISUpoints amount
 * @returns True if withdrawable
 */
export function isVisuPointsWithdrawable(points) {
    return points >= VISUPOINTS_CONFIG.MIN_WITHDRAWAL;
}
/**
 * Format currency amount
 * @param amount - Amount to format
 * @param currency - Currency code (default: EUR)
 * @returns Formatted currency string
 */
export function formatCurrency(amount, currency = 'EUR') {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: currency
    }).format(amount);
}
/**
 * Format percentage
 * @param value - Decimal value (e.g., 0.15 for 15%)
 * @param decimals - Number of decimal places
 * @returns Formatted percentage string
 */
export function formatPercentage(value, decimals = 2) {
    return (value * 100).toFixed(decimals) + '%';
}
/**
 * Calculate ROI
 * @param currentValue - Current investment value
 * @param initialAmount - Initial investment amount
 * @returns ROI as decimal (e.g., 0.15 for 15%)
 */
export function calculateROI(currentValue, initialAmount) {
    if (initialAmount === 0)
        return 0;
    return (currentValue - initialAmount) / initialAmount;
}
/**
 * Get report type label and description
 * @param reportType - Report type key
 * @returns Report type info
 */
export function getReportTypeInfo(reportType) {
    return REPORT_TYPES[reportType] || {
        label: 'Autre',
        description: 'Type de signalement non spécifié'
    };
}
/**
 * Generate secure random string
 * @param length - Length of the string
 * @returns Random string
 */
export function generateSecureId(length = 32) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
/**
 * Validate email format
 * @param email - Email to validate
 * @returns True if valid email format
 */
export function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
/**
 * Sanitize filename for safe storage
 * @param filename - Original filename
 * @returns Sanitized filename
 */
export function sanitizeFilename(filename) {
    return filename
        .replace(/[^a-zA-Z0-9.-]/g, '_')
        .replace(/_{2,}/g, '_')
        .toLowerCase();
}
/**
 * Get file extension from filename
 * @param filename - Filename
 * @returns File extension (lowercase)
 */
export function getFileExtension(filename) {
    return filename.split('.').pop()?.toLowerCase() || '';
}
/**
 * Format file size in human readable format
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
export function formatFileSize(bytes) {
    if (bytes === 0)
        return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
/**
 * Debounce function to limit function calls
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce(func, wait) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}
/**
 * Deep clone an object
 * @param obj - Object to clone
 * @returns Cloned object
 */
export function deepClone(obj) {
    if (obj === null || typeof obj !== 'object')
        return obj;
    if (obj instanceof Date)
        return new Date(obj.getTime());
    if (obj instanceof Array)
        return obj.map(item => deepClone(item));
    if (typeof obj === 'object') {
        const clonedObj = {};
        for (const key in obj) {
            clonedObj[key] = deepClone(obj[key]);
        }
        return clonedObj;
    }
    return obj;
}
