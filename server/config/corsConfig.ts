/**
 * CORS Configuration for VISUAL Platform
 * 
 * Configures Cross-Origin Resource Sharing (CORS) with environment-aware settings.
 * Production uses strict whitelist, development allows all origins.
 */

import cors from 'cors';
import { logger } from './logger';

/**
 * Get allowed origins based on environment
 */
function getAllowedOrigins(): string[] | boolean {
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (!isProduction) {
    // Development: Allow all origins (including Vite dev server)
    return true;
  }

  // Production: Whitelist of allowed domains
  const allowedOrigins: string[] = [
    // Replit production URL (auto-generated)
    process.env.REPL_SLUG ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co` : '',
    
    // Replit app domain
    process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS}` : '',
    
    // Custom domains (if configured)
    process.env.CUSTOM_DOMAIN ? `https://${process.env.CUSTOM_DOMAIN}` : '',
    process.env.CUSTOM_DOMAIN_2 ? `https://${process.env.CUSTOM_DOMAIN_2}` : '',
  ].filter(Boolean); // Remove empty strings

  // Always include the main Replit app URL
  if (process.env.REPLIT_DOMAINS) {
    const domains = process.env.REPLIT_DOMAINS.split(',');
    domains.forEach(domain => {
      allowedOrigins.push(`https://${domain.trim()}`);
    });
  }

  // Log allowed origins for debugging
  logger.info('CORS production mode initialized', {
    allowedOrigins,
    originCount: allowedOrigins.length,
  });

  return allowedOrigins;
}

/**
 * CORS middleware configuration
 */
export const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = getAllowedOrigins();
    const isProduction = process.env.NODE_ENV === 'production';

    // In development, allow all origins
    if (allowedOrigins === true) {
      return callback(null, true);
    }

    // No origin (same-origin requests, server-to-server, etc.)
    if (!origin) {
      return callback(null, true);
    }

    // Check if origin is in whitelist
    if (Array.isArray(allowedOrigins) && allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // In production, reject unknown origins
    if (isProduction) {
      logger.warn('CORS blocked unauthorized origin', { origin });
      return callback(new Error('Not allowed by CORS'));
    }

    // In development, log but allow
    logger.debug('CORS allowing origin in development', { origin });
    return callback(null, true);
  },
  
  // Allow credentials (cookies, authorization headers)
  credentials: true,
  
  // Allowed HTTP methods
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  
  // Allowed headers
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-API-Token',
    'X-Monitoring-Token',
  ],
  
  // Exposed headers (client can access these)
  exposedHeaders: [
    'Content-Range',
    'X-Content-Range',
    'X-Total-Count',
  ],
  
  // Preflight cache duration (24 hours)
  maxAge: 86400,
  
  // Handle preflight OPTIONS requests
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

/**
 * Apply CORS middleware with logging
 */
export function setupCORS() {
  const isProduction = process.env.NODE_ENV === 'production';
  const methods = Array.isArray(corsOptions.methods) ? corsOptions.methods.join(', ') : corsOptions.methods;
  
  logger.info('Initializing CORS middleware', {
    environment: isProduction ? 'PRODUCTION' : 'DEVELOPMENT',
    credentials: corsOptions.credentials ? 'ENABLED' : 'DISABLED',
    methods,
  });
  
  return cors(corsOptions);
}
