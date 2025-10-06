import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// ==============================================
// MIDDLEWARE CONFORMITÉ RGPD - VISUAL PLATFORM
// ==============================================

/**
 * Interface pour le consentement RGPD
 */
interface GDPRConsent {
  userId: string;
  consentType: 'marketing' | 'analytics' | 'functional' | 'necessary';
  granted: boolean;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
}

/**
 * Middleware de logging anonymisé (conformité RGPD)
 */
export const anonymizeLogging = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Créer un hash anonyme de l'IP pour le tracking sans exposition
  const ipHash = crypto
    .createHash('sha256')
    .update(req.ip + process.env.ENCRYPTION_KEY)
    .digest('hex')
    .substring(0, 8);
  
  // Logger anonymisé
  const logData = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    userAgent: req.get('User-Agent')?.substring(0, 50), // Tronqué
    ipHash, // IP hashée, pas l'IP réelle
    userId: req.user?.id ? `user_${crypto.createHash('sha256').update(req.user.id).digest('hex').substring(0, 8)}` : 'anonymous'
  };
  
  // Éviter de logger les données sensibles
  const sensitiveFields = ['password', 'email', 'phone', 'address', 'ssn'];
  let sanitizedBody = { ...req.body };
  
  sensitiveFields.forEach(field => {
    if (sanitizedBody[field]) {
      sanitizedBody[field] = '[REDACTED]';
    }
  });
  
  // Logger en fin de requête
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    if (process.env.LOG_LEVEL === 'debug' || res.statusCode >= 400) {
      console.log({
        ...logData,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        body: Object.keys(sanitizedBody).length > 0 ? sanitizedBody : undefined
      });
    }
  });
  
  next();
};

/**
 * Middleware de validation du consentement RGPD
 */
export const checkGDPRConsent = (requiredConsent: GDPRConsent['consentType'][] = []) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Les cookies nécessaires sont toujours autorisés
    if (requiredConsent.includes('necessary')) {
      return next();
    }
    
    // Vérifier le consentement dans les headers ou cookies
    const consent = req.headers['gdpr-consent'] || req.cookies.gdprConsent;
    
    if (!consent && requiredConsent.length > 0) {
      return res.status(451).json({
        error: 'Consentement RGPD requis',
        code: 'GDPR_CONSENT_REQUIRED',
        requiredConsent,
        message: 'Veuillez accepter les conditions d\'utilisation pour continuer.'
      });
    }
    
    try {
      const consentData = typeof consent === 'string' ? JSON.parse(consent) : consent;
      
      // Vérifier que tous les consentements requis sont accordés
      const hasAllRequiredConsents = requiredConsent.every(type => 
        consentData[type] === true
      );
      
      if (!hasAllRequiredConsents) {
        return res.status(451).json({
          error: 'Consentement insuffisant',
          code: 'GDPR_INSUFFICIENT_CONSENT',
          requiredConsent,
          currentConsent: consentData
        });
      }
      
      next();
    } catch (error) {
      return res.status(400).json({
        error: 'Format de consentement invalide',
        code: 'GDPR_INVALID_CONSENT_FORMAT'
      });
    }
  };
};

/**
 * Middleware de gestion des demandes de suppression (Droit à l'oubli)
 */
export const handleDataDeletion = async (req: Request, res: Response, next: NextFunction) => {
  if (req.path === '/api/gdpr/delete-account' && req.method === 'POST') {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Non authentifié' });
      }
      
      // Marquer le compte pour suppression (processus asynchrone)
      // TODO: Implémenter la logique de suppression complète
      
      // Log de la demande de suppression
      console.log({
        action: 'GDPR_DELETION_REQUEST',
        userId: crypto.createHash('sha256').update(userId).digest('hex').substring(0, 8),
        timestamp: new Date().toISOString(),
        ipHash: crypto.createHash('sha256').update(req.ip + process.env.ENCRYPTION_KEY).digest('hex').substring(0, 8)
      });
      
      return res.json({
        message: 'Demande de suppression enregistrée',
        estimatedDeletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
        reference: crypto.randomBytes(8).toString('hex')
      });
    } catch (error) {
      console.error('Erreur lors de la demande de suppression:', error);
      return res.status(500).json({ error: 'Erreur serveur' });
    }
  }
  
  next();
};

/**
 * Middleware pour l'export des données personnelles (Portabilité des données)
 */
export const handleDataExport = async (req: Request, res: Response, next: NextFunction) => {
  if (req.path === '/api/gdpr/export-data' && req.method === 'GET') {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Non authentifié' });
      }
      
      // TODO: Implémenter l'export complet des données utilisateur
      const userData = {
        profile: {}, // Données de profil
        investments: [], // Investissements
        transactions: [], // Transactions
        socialActivity: [], // Activité sociale
        preferences: {} // Préférences
      };
      
      // Log de la demande d'export
      console.log({
        action: 'GDPR_DATA_EXPORT',
        userId: crypto.createHash('sha256').update(userId).digest('hex').substring(0, 8),
        timestamp: new Date().toISOString()
      });
      
      return res.json({
        message: 'Export des données généré',
        data: userData,
        exportDate: new Date().toISOString(),
        format: 'JSON'
      });
    } catch (error) {
      console.error('Erreur lors de l\'export de données:', error);
      return res.status(500).json({ error: 'Erreur serveur' });
    }
  }
  
  next();
};

/**
 * Middleware de masquage des données sensibles dans les réponses
 */
export const maskSensitiveData = (req: Request, res: Response, next: NextFunction) => {
  const originalSend = res.send;
  
  res.send = function(data: any) {
    if (process.env.NODE_ENV === 'production' && data) {
      try {
        let responseData = typeof data === 'string' ? JSON.parse(data) : data;
        
        // Masquer récursivement les champs sensibles
        const maskObject = (obj: any): any => {
          if (typeof obj !== 'object' || obj === null) return obj;
          
          const sensitiveFields = [
            'password', 'email', 'phone', 'address', 'ssn', 
            'stripeCustomerId', 'bankAccount', 'ipAddress'
          ];
          
          for (const key in obj) {
            if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
              if (key === 'email') {
                // Masquer partiellement l'email
                obj[key] = obj[key].replace(/(.{2})(.*)(@.*)/, '$1***$3');
              } else {
                obj[key] = '[MASKED]';
              }
            } else if (typeof obj[key] === 'object') {
              obj[key] = maskObject(obj[key]);
            }
          }
          return obj;
        };
        
        responseData = maskObject(responseData);
        data = typeof data === 'string' ? JSON.stringify(responseData) : responseData;
      } catch (error) {
        // Si erreur de parsing, continuer sans masquage
      }
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

/**
 * Middleware de validation de l'âge (conformité réglementaire)
 */
export const ageVerification = (minAge: number = 16) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const birthDate = req.body.birthDate || req.query.birthDate;
    
    if (birthDate) {
      const age = calculateAge(birthDate);
      
      if (age < minAge) {
        return res.status(403).json({
          error: 'Âge insuffisant',
          code: 'AGE_RESTRICTION',
          minAge,
          message: `Vous devez avoir au moins ${minAge} ans pour utiliser ce service.`
        });
      }
      
      // Log pour conformité (âge vérifié mais pas stocké)
      console.log({
        action: 'AGE_VERIFICATION',
        result: 'VALID',
        timestamp: new Date().toISOString(),
        ipHash: crypto.createHash('sha256').update(req.ip + process.env.ENCRYPTION_KEY).digest('hex').substring(0, 8)
      });
    }
    
    next();
  };
};

/**
 * Utilitaire pour calculer l'âge
 */
function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Configuration complète RGPD
 */
export const setupGDPRCompliance = (app: any) => {
  // Logging anonymisé global
  app.use(anonymizeLogging);
  
  // Masquage des données sensibles
  app.use(maskSensitiveData);
  
  // Gestion des demandes RGPD
  app.use(handleDataDeletion);
  app.use(handleDataExport);
  
  console.log('✅ Conformité RGPD initialisée');
};