import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

// ==============================================
// CONFIGURATION SÉCURITÉ VISUAL PLATFORM
// ==============================================

/**
 * Configuration CORS sécurisée
 */
export const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [
      'http://localhost:3000',
      'https://visual.com',
      'https://www.visual.com'
    ];
    
    // Permettre les requêtes sans origine (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Non autorisé par CORS'), false);
    }
  },
  credentials: true,
  optionsSuccessStatus: 200, // Support legacy browsers
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With', 
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'X-CSRF-Token'
  ],
  maxAge: 86400 // 24 heures
};

/**
 * Configuration Helmet pour headers de sécurité
 */
export const helmetOptions = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // Nécessaire pour Tailwind CSS
        "https://fonts.googleapis.com"
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com"
      ],
      scriptSrc: [
        "'self'",
        "'unsafe-eval'", // Nécessaire pour le dev mode
        "https://js.stripe.com",
        "https://www.googletagmanager.com"
      ],
      objectSrc: ["'none'"],
      baseSrc: ["'self'"],
      connectSrc: [
        "'self'",
        "https://api.stripe.com",
        process.env.BACKEND_URL || "http://localhost:8001"
      ],
      imgSrc: [
        "'self'",
        "data:",
        "https:",
        process.env.OBJECT_STORAGE_ENDPOINT || ""
      ],
      mediaSrc: [
        "'self'",
        "https:",
        process.env.OBJECT_STORAGE_ENDPOINT || ""
      ],
      frameSrc: [
        "'self'",
        "https://js.stripe.com"
      ]
    }
  },
  hsts: {
    maxAge: 31536000, // 1 an
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  frameguard: { action: 'deny' },
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
};

/**
 * Rate limiting par endpoint
 */
export const rateLimiters = {
  // Général - 100 requêtes par 15 minutes
  general: rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '15') * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    message: {
      error: 'Trop de requêtes de cette IP, réessayez plus tard.',
      retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req: Request) => {
      // Skip rate limiting for health checks
      return req.path === '/healthz';
    }
  }),

  // Authentification - 5 tentatives par 15 minutes
  auth: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
      error: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.',
      retryAfter: '15 minutes'
    },
    skipSuccessfulRequests: true
  }),

  // API sensibles - 20 requêtes par minute
  sensitive: rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    message: {
      error: 'Limite API atteinte. Ralentissez vos requêtes.',
      retryAfter: '1 minute'
    }
  }),

  // Upload de fichiers - 5 par heure
  upload: rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: {
      error: 'Limite d\'upload atteinte. Réessayez dans 1 heure.',
      retryAfter: '1 heure'
    }
  })
};

/**
 * Middleware de nettoyage des logs (RGPD)
 * Supprime les informations personnelles des logs
 */
export const sanitizeLogging = (req: Request, res: Response, next: NextFunction) => {
  // Masquer les données sensibles dans les logs
  const originalSend = res.send;
  
  res.send = function(data: any) {
    if (process.env.NODE_ENV === 'production') {
      // Supprimer les emails, IPs, etc. des logs
      if (typeof data === 'string') {
        data = data.replace(/[\w\.-]+@[\w\.-]+\.\w+/g, '[EMAIL_REDACTED]');
        data = data.replace(/\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g, '[IP_REDACTED]');
      }
    }
    return originalSend.call(this, data);
  };
  
  next();
};

/**
 * Headers de sécurité personnalisés
 */
export const customSecurityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Désactiver les informations serveur
  res.removeHeader('X-Powered-By');
  
  // Headers personnalisés
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Permissions-Policy', 
    'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()'
  );
  
  // Cache control pour les ressources sensibles
  if (req.path.includes('/api/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  
  next();
};

/**
 * Validation d'IP - Blocage d'IPs suspectes
 */
export const ipValidation = (req: Request, res: Response, next: NextFunction) => {
  const clientIP = req.ip || req.connection.remoteAddress || '';
  
  // Liste noire basique (à configurer selon les besoins)
  const blacklistedIPs = process.env.BLACKLISTED_IPS?.split(',') || [];
  
  if (blacklistedIPs.includes(clientIP)) {
    return res.status(403).json({ 
      error: 'Accès refusé',
      code: 'IP_BLOCKED' 
    });
  }
  
  next();
};

/**
 * Configuration complète de sécurité
 */
export const setupSecurity = (app: any) => {
  // Rate limiting
  app.use('/api/auth', rateLimiters.auth);
  app.use('/api/upload', rateLimiters.upload);
  app.use('/api/admin', rateLimiters.sensitive);
  app.use('/api/', rateLimiters.general);
  
  // Headers de sécurité
  app.use(helmet(helmetOptions));
  app.use(customSecurityHeaders);
  
  // CORS
  app.use(cors(corsOptions));
  
  // Validation IP
  app.use(ipValidation);
  
  // Nettoyage logs RGPD
  app.use(sanitizeLogging);
  
  console.log('✅ Configuration de sécurité initialisée');
};