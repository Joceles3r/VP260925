/**
 * Security Validator for Production Secrets
 * 
 * Validates that all critical secrets are properly configured before starting the server.
 * In production, blocks startup if default development secrets are detected.
 */

import { logger } from './logger';

interface SecretValidation {
  name: string;
  value: string | undefined;
  required: boolean;
  dangerousDefaults: string[];
  description: string;
}

const CRITICAL_SECRETS: SecretValidation[] = [
  {
    name: 'AUDIT_HMAC_KEY',
    value: process.env.AUDIT_HMAC_KEY,
    required: true,
    dangerousDefaults: ['dev-secret-key-change-in-production', 'dev-secret', ''],
    description: 'HMAC key for audit trail integrity',
  },
  {
    name: 'VISUAL_PLAY_TOKEN_SECRET',
    value: process.env.VISUAL_PLAY_TOKEN_SECRET,
    required: true,
    dangerousDefaults: ['dev-secret-change-me', 'dev-secret', ''],
    description: 'Secret for Bunny.net video playback tokens',
  },
  {
    name: 'ADMIN_CONSOLE_SECRET',
    value: process.env.ADMIN_CONSOLE_SECRET,
    required: false, // Optional but recommended
    dangerousDefaults: ['dev_secret_change_me', 'dev-secret', ''],
    description: 'Secret for admin console access',
  },
  {
    name: 'STRIPE_SECRET_KEY',
    value: process.env.STRIPE_SECRET_KEY,
    required: true,
    dangerousDefaults: [],
    description: 'Stripe API secret key',
  },
  {
    name: 'STRIPE_WEBHOOK_SECRET',
    value: process.env.STRIPE_WEBHOOK_SECRET,
    required: true,
    dangerousDefaults: [],
    description: 'Stripe webhook signing secret',
  },
];

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates all critical secrets
 * @param strictMode - In strict mode (production), throws error on validation failure
 */
export function validateSecrets(strictMode: boolean = false): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const isProduction = process.env.NODE_ENV === 'production';

  logger.info('Validating production secrets', {
    environment: isProduction ? 'PRODUCTION' : 'DEVELOPMENT',
    strictMode: strictMode ? 'ENABLED' : 'DISABLED',
  });

  for (const secret of CRITICAL_SECRETS) {
    const value = secret.value;

    // Check if secret is missing
    if (!value) {
      if (secret.required) {
        const msg = `❌ CRITICAL: ${secret.name} is not set (${secret.description})`;
        if (isProduction || strictMode) {
          errors.push(msg);
        } else {
          warnings.push(msg);
        }
      } else {
        warnings.push(`⚠️  Optional secret ${secret.name} is not set (${secret.description})`);
      }
      continue;
    }

    // Check if secret uses dangerous default values
    const isDangerous = secret.dangerousDefaults.some(
      (dangerous) => dangerous && value === dangerous
    );

    if (isDangerous) {
      const msg = `🚨 SECURITY BREACH: ${secret.name} is using a default development value! Current: "${value}"`;
      if (isProduction || strictMode) {
        errors.push(msg);
      } else {
        warnings.push(`⚠️  DEV WARNING: ${secret.name} uses default value. Change before production!`);
      }
    }

    // Additional validation for Stripe keys
    if (secret.name === 'STRIPE_SECRET_KEY' && value) {
      if (isProduction && !value.startsWith('sk_live_')) {
        errors.push(
          `🚨 PRODUCTION ERROR: STRIPE_SECRET_KEY must start with 'sk_live_' in production. Current: "${value.substring(0, 7)}..."`
        );
      } else if (!isProduction && !value.startsWith('sk_test_') && !value.startsWith('sk_live_')) {
        warnings.push(
          `⚠️  Stripe key format: STRIPE_SECRET_KEY should start with 'sk_test_' or 'sk_live_'. Current format may be invalid.`
        );
      }
    }

    if (secret.name === 'STRIPE_WEBHOOK_SECRET' && value) {
      if (!value.startsWith('whsec_')) {
        warnings.push(
          `⚠️  Stripe webhook secret should start with 'whsec_'. Current format may be invalid.`
        );
      }
    }
  }

  // Print results
  if (errors.length > 0) {
    logger.critical('CRITICAL SECURITY ERRORS DETECTED', undefined, {
      errorCount: errors.length,
      errors,
    });
  }

  if (warnings.length > 0) {
    logger.warn('Security validation warnings', {
      warningCount: warnings.length,
      warnings,
    });
  }

  if (errors.length === 0 && warnings.length === 0) {
    logger.info('All secrets validated successfully');
  }

  const valid = errors.length === 0;

  // In production or strict mode, throw on errors
  if (!valid && (isProduction || strictMode)) {
    throw new Error(
      `Security validation failed! Cannot start server with insecure configuration.\n\n` +
      `To fix:\n` +
      `1. Generate strong secrets: openssl rand -base64 32\n` +
      `2. Set them in Replit Secrets or environment variables\n` +
      `3. Restart the application\n\n` +
      `Missing/Invalid secrets:\n${errors.join('\n')}`
    );
  }

  return { valid, errors, warnings };
}

/**
 * Generate a strong random secret (for local testing)
 */
export function generateStrongSecret(length: number = 32): string {
  const crypto = require('crypto');
  return crypto.randomBytes(length).toString('base64');
}
