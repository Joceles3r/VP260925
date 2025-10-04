// VISUAL Video Token Validation Middleware
// Secure server-side validation for Bunny.net protected video access

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { storage } from '../storage';
import { bunnyService } from '../services/bunnyService';

export interface VideoTokenRequest extends Request {
  videoAccess?: {
    videoDepositId: string;
    userId: string;
    tokenId: string;
    sessionInfo: {
      ipAddress?: string;
      userAgent?: string;
      sessionId: string;
    };
  };
}

export interface TokenValidationResult {
  valid: boolean;
  errorCode?: 'INVALID_FORMAT' | 'EXPIRED' | 'REVOKED' | 'USAGE_EXCEEDED' | 'IP_MISMATCH' | 'SIGNATURE_INVALID' | 'NOT_FOUND';
  errorMessage?: string;
  tokenData?: {
    videoDepositId: string;
    userId: string;
    expiresAt: number;
    sessionId: string;
    ipAddress?: string;
    libraryId: string;
  };
}

/**
 * Validate video token signature and structure
 */
function validateTokenSignature(token: string, secretKey: string): TokenValidationResult {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) {
      return {
        valid: false,
        errorCode: 'INVALID_FORMAT',
        errorMessage: 'Token format invalide'
      };
    }

    const [tokenString, providedSignature] = parts;
    
    // Verify HMAC signature
    const expectedSignature = crypto
      .createHmac('sha256', secretKey)
      .update(tokenString)
      .digest('hex');

    if (providedSignature !== expectedSignature) {
      return {
        valid: false,
        errorCode: 'SIGNATURE_INVALID',
        errorMessage: 'Signature du token invalide'
      };
    }

    // Decode token data
    const tokenData = JSON.parse(Buffer.from(tokenString, 'base64').toString());
    
    // Validate required fields
    if (!tokenData.videoDepositId || !tokenData.userId || !tokenData.expiresAt || !tokenData.sessionId) {
      return {
        valid: false,
        errorCode: 'INVALID_FORMAT',
        errorMessage: 'Données du token incomplètes'
      };
    }

    return {
      valid: true,
      tokenData
    };
  } catch (error) {
    return {
      valid: false,
      errorCode: 'INVALID_FORMAT',
      errorMessage: 'Erreur de décodage du token'
    };
  }
}

/**
 * Check token expiration
 */
function checkTokenExpiration(tokenData: any): TokenValidationResult {
  const now = Date.now();
  if (now > tokenData.expiresAt) {
    return {
      valid: false,
      errorCode: 'EXPIRED',
      errorMessage: 'Token expiré'
    };
  }
  return { valid: true };
}

/**
 * Check IP address validation (if required)
 */
function checkIpValidation(tokenData: any, requestIp?: string): TokenValidationResult {
  // If token contains IP restriction, validate it
  if (tokenData.ipAddress && requestIp && tokenData.ipAddress !== requestIp) {
    return {
      valid: false,
      errorCode: 'IP_MISMATCH',
      errorMessage: 'Adresse IP non autorisée'
    };
  }
  return { valid: true };
}

/**
 * Main video token validation middleware
 * Validates tokens for secure video access with comprehensive security checks
 */
export async function validateVideoToken(
  req: VideoTokenRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token as string;
    
    if (!token) {
      res.status(401).json({ 
        error: 'Token manquant', 
        code: 'TOKEN_REQUIRED' 
      });
      return;
    }

    // Get Bunny.net stream API key for signature validation
    const streamApiKey = process.env.BUNNY_STREAM_API_KEY;
    if (!streamApiKey) {
      console.error('Missing BUNNY_STREAM_API_KEY for token validation');
      res.status(500).json({ 
        error: 'Configuration serveur invalide', 
        code: 'SERVER_CONFIG_ERROR' 
      });
      return;
    }

    // 1. Validate token signature and structure
    const signatureResult = validateTokenSignature(token, streamApiKey);
    if (!signatureResult.valid) {
      res.status(401).json({ 
        error: signatureResult.errorMessage, 
        code: signatureResult.errorCode 
      });
      return;
    }

    const tokenData = signatureResult.tokenData!;

    // 2. Check token expiration
    const expirationResult = checkTokenExpiration(tokenData);
    if (!expirationResult.valid) {
      res.status(401).json({ 
        error: expirationResult.errorMessage, 
        code: expirationResult.errorCode 
      });
      return;
    }

    // 3. Check IP validation (if enabled)
    const clientIp = req.ip || req.connection.remoteAddress;
    const ipResult = checkIpValidation(tokenData, clientIp);
    if (!ipResult.valid) {
      res.status(403).json({ 
        error: ipResult.errorMessage, 
        code: ipResult.errorCode 
      });
      return;
    }

    // 4. Validate token in database
    const dbToken = await storage.getVideoToken(token);
    if (!dbToken) {
      res.status(401).json({ 
        error: 'Token invalide ou non trouvé', 
        code: 'NOT_FOUND' 
      });
      return;
    }

    // 5. Check if token is revoked
    if (dbToken.isRevoked) {
      res.status(401).json({ 
        error: 'Token révoqué', 
        code: 'REVOKED' 
      });
      return;
    }

    // 6. Check usage limits
    if ((dbToken.usageCount || 0) >= (dbToken.maxUsage || 3)) {
      res.status(429).json({ 
        error: 'Limite d\'utilisation du token dépassée', 
        code: 'USAGE_EXCEEDED' 
      });
      return;
    }

    // 7. Verify video deposit exists and is active
    const videoDeposit = await storage.getVideoDeposit(tokenData.videoDepositId);
    if (!videoDeposit || videoDeposit.status !== 'active') {
      res.status(404).json({ 
        error: 'Vidéo non disponible', 
        code: 'VIDEO_NOT_AVAILABLE' 
      });
      return;
    }

    // 8. Update token usage count
    await storage.updateVideoToken(dbToken.id, {
      usageCount: (dbToken.usageCount || 0) + 1,
      lastAccessedAt: new Date()
    });

    // 9. Log access for analytics
    const userAgent = req.headers['user-agent'];
    await storage.createVideoAnalytics({
      videoDepositId: tokenData.videoDepositId,
      userId: tokenData.userId,
      viewDate: new Date(),
      ipAddress: clientIp,
      userAgent,
      tokenId: dbToken.id,
      sessionDuration: 0 // Will be updated on session end
    });

    // Attach validated data to request for downstream handlers
    req.videoAccess = {
      videoDepositId: tokenData.videoDepositId,
      userId: tokenData.userId,
      tokenId: dbToken.id,
      sessionInfo: {
        ipAddress: clientIp,
        userAgent,
        sessionId: tokenData.sessionId
      }
    };

    next();
  } catch (error) {
    console.error('Video token validation error:', error);
    res.status(500).json({ 
      error: 'Erreur interne de validation', 
      code: 'VALIDATION_ERROR' 
    });
  }
}

/**
 * Middleware to check if user has access to specific video
 */
export async function checkVideoAccess(
  req: VideoTokenRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    const { videoDepositId } = req.params;
    const userId = (req as any).user?.id; // From auth middleware
    
    if (!userId) {
      res.status(401).json({ 
        error: 'Authentification requise', 
        code: 'AUTH_REQUIRED' 
      });
      return;
    }

    // Check if user can access this video (owner or has valid access token)
    const videoDeposit = await storage.getVideoDeposit(videoDepositId);
    if (!videoDeposit) {
      res.status(404).json({ 
        error: 'Vidéo non trouvée', 
        code: 'VIDEO_NOT_FOUND' 
      });
      return;
    }

    // Allow access if user is the creator
    if (videoDeposit.creatorId === userId) {
      req.videoAccess = {
        videoDepositId,
        userId,
        tokenId: '', // Creator doesn't need token
        sessionInfo: {
          sessionId: 'creator-access'
        }
      };
      next();
      return;
    }

    // For non-creators, require valid token
    validateVideoToken(req, res, next);
  } catch (error) {
    console.error('Video access check error:', error);
    res.status(500).json({ 
      error: 'Erreur de vérification d\'accès', 
      code: 'ACCESS_CHECK_ERROR' 
    });
  }
}