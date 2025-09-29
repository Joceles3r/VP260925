import { Request, Response, NextFunction } from 'express';

/**
 * Security middleware pour les en-têtes de sécurité PRO
 * Implémente les recommandations de la mise à niveau PRO avec config environment-aware
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Strict-Transport-Security (HSTS) - uniquement en production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  // Content-Security-Policy (CSP) - adapté à l'environnement
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  let cspDirectives = [
    "default-src 'self'",
    "img-src 'self' data: https:",
    "media-src 'self' https: data: blob:",
    "font-src 'self' https:",
    "frame-src 'self' https:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self' https:"
  ];
  
  if (isDevelopment) {
    // Développement - permet Vite HMR
    cspDirectives.push("script-src 'self' 'unsafe-inline' 'unsafe-eval' https:");
    cspDirectives.push("style-src 'self' 'unsafe-inline' https:");
    cspDirectives.push("connect-src 'self' https: wss: ws:");
  } else {
    // Production - sécurité renforcée
    cspDirectives.push("script-src 'self' https:");
    cspDirectives.push("style-src 'self' https:");
    cspDirectives.push("connect-src 'self' https: wss:");
  }
  
  res.setHeader('Content-Security-Policy', cspDirectives.join('; '));
  
  // Autres en-têtes de sécurité
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
}

/**
 * Rate limiting configuration pour les API sensibles
 */
export const rateLimitConfig = {
  // Configuration générale pour express-rate-limit
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limite générale : 100 requêtes par 15 minutes
  message: {
    error: 'Trop de requêtes, veuillez réessayer plus tard.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
};

/**
 * Rate limiting strict pour les opérations financières
 */
export const strictRateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requêtes par minute pour les opérations sensibles
  message: {
    error: 'Trop d\'opérations sensibles, veuillez patienter.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
};

/**
 * Configuration pour l'audit logging
 */
export interface AuditLogEntry {
  timestamp: Date;
  userId?: string;
  action: string;
  resource: string;
  ip: string;
  userAgent?: string;
  sessionId?: string;
  success: boolean;
  details?: any;
}

/**
 * Middleware d'audit pour les actions sensibles
 */
export function auditLogger(action: string, resource: string) {
  return (req: any, res: Response, next: NextFunction) => {
    const originalSend = res.send;
    
    res.send = function(data: any) {
      const logEntry: AuditLogEntry = {
        timestamp: new Date(),
        userId: req.user?.claims?.sub,
        action,
        resource,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        sessionId: req.sessionID,
        success: res.statusCode < 400,
        details: res.statusCode >= 400 ? { error: data } : undefined
      };
      
      // Log à améliorer avec Sentry dans la prochaine étape
      console.log('[AUDIT]', JSON.stringify(logEntry));
      
      return originalSend.call(this, data);
    };
    
    next();
  };
}

/**
 * Middleware de validation des tokens d'API pour les opérations critiques
 */
export function requireApiToken(req: any, res: Response, next: NextFunction) {
  const token = req.headers['x-api-token'] || req.query.token;
  
  if (!token) {
    return res.status(401).json({ 
      error: 'Token d\'API requis pour cette opération',
      code: 'MISSING_API_TOKEN'
    });
  }
  
  // Validation simplifiée - à améliorer avec JWT ou database lookup
  if (token !== process.env.API_ADMIN_TOKEN) {
    return res.status(403).json({ 
      error: 'Token d\'API invalide',
      code: 'INVALID_API_TOKEN'
    });
  }
  
  next();
}

/**
 * Middleware de protection pour les endpoints de monitoring
 * Restricts access to internal monitoring endpoints
 */
export function requireMonitoringAccess(req: Request, res: Response, next: NextFunction) {
  // En développement, autoriser localhost
  if (process.env.NODE_ENV === 'development') {
    const remoteAddr = req.socket.remoteAddress;
    if (remoteAddr === '127.0.0.1' || remoteAddr === '::1' || remoteAddr === '::ffff:127.0.0.1') {
      return next();
    }
  }
  
  // En production, vérifier token de monitoring
  const token = req.headers['x-monitoring-token'] || req.query.token;
  
  if (!token || token !== process.env.MONITORING_TOKEN) {
    return res.status(403).json({ 
      error: 'Accès non autorisé aux métriques',
      code: 'FORBIDDEN_MONITORING_ACCESS'
    });
  }
  
  next();
}