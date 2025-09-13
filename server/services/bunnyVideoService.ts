// VISUAL Bunny.net Video Service - Centralized video management
// Single account for all VISUAL video operations with token protection

import { BUNNY_CONFIG, VIDEO_SECURITY, VIDEO_DEPOSIT_PRICING } from '@shared/constants';
import { z } from 'zod';
import crypto from 'crypto';
import { nanoid } from 'nanoid';

// Environment validation for Bunny.net credentials  
const bunnyEnvSchema = z.object({
  BUNNY_API_KEY: z.string().min(1, 'BUNNY_API_KEY is required').optional(),
  BUNNY_LIBRARY_ID: z.string().min(1, 'BUNNY_LIBRARY_ID is required').optional(),
  BUNNY_STREAM_API_KEY: z.string().min(1, 'BUNNY_STREAM_API_KEY is required').optional(),
});

export interface VideoUploadResult {
  videoId: string;
  libraryId: string;
  uploadUrl: string;
  thumbnailUrl?: string;
  status: 'uploading' | 'processing' | 'ready' | 'error';
}

export interface SecureVideoToken {
  token: string;
  playbackUrl: string;
  expiresAt: Date;
  maxUsage: number;
}

export interface VideoProcessingStatus {
  videoId: string;
  status: 'processing' | 'completed' | 'failed';
  progress?: number;
  duration?: number;
  resolution?: string;
  fileSize?: number;
  hlsUrl?: string;
  thumbnailUrl?: string;
}

export class BunnyVideoService {
  private apiKey: string;
  private libraryId: string;
  private streamApiKey: string;
  private baseUrl: string;
  private streamApiUrl: string;

  constructor() {
    // Validate environment variables
    const env = bunnyEnvSchema.parse(process.env);
    
    // Handle missing credentials for development mode
    if (!env.BUNNY_API_KEY || !env.BUNNY_LIBRARY_ID || !env.BUNNY_STREAM_API_KEY) {
      console.warn('[BUNNY] Environment variables not configured - running in development mode');
      this.apiKey = 'dev-mode';
      this.libraryId = 'dev-library';
      this.streamApiKey = 'dev-stream-key';
    } else {
      this.apiKey = env.BUNNY_API_KEY;
      this.libraryId = env.BUNNY_LIBRARY_ID;
      this.streamApiKey = env.BUNNY_STREAM_API_KEY;
    }
    
    this.baseUrl = BUNNY_CONFIG.baseUrl;
    this.streamApiUrl = `${BUNNY_CONFIG.streamApiUrl}/${this.libraryId}`;
  }

  /**
   * Get video deposit pricing based on video type
   */
  static getDepositPrice(videoType: 'clip' | 'documentary' | 'film'): number {
    return VIDEO_DEPOSIT_PRICING[videoType].price;
  }

  /**
   * Validate video specs against VISUAL requirements
   */
  static validateVideoSpecs(
    videoType: 'clip' | 'documentary' | 'film',
    duration: number,
    fileSizeBytes: number
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const specs = VIDEO_DEPOSIT_PRICING[videoType];
    
    if (duration > specs.maxDuration) {
      const maxMinutes = Math.floor(specs.maxDuration / 60);
      errors.push(`${specs.label}: durée max ${maxMinutes} min dépassée`);
    }

    const fileSizeGB = fileSizeBytes / (1024 * 1024 * 1024);
    if (fileSizeGB > specs.maxSizeGB) {
      errors.push(`${specs.label}: taille max ${specs.maxSizeGB} GB dépassée`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Create new video upload session via Bunny.net
   * All videos go through VISUAL's single account
   */
  async createVideoUpload(
    title: string,
    creatorId: string,
    videoType: 'clip' | 'documentary' | 'film'
  ): Promise<VideoUploadResult> {
    try {
      const response = await fetch(`${this.streamApiUrl}/videos`, {
        method: 'POST',
        headers: {
          'AccessKey': this.streamApiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          thumbnailTime: 5, // Generate thumbnail at 5s
          collection: `creator_${creatorId}`, // Organize by creator
          chapters: []
        })
      });

      if (!response.ok) {
        throw new Error(`Bunny.net upload creation failed: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        videoId: data.guid,
        libraryId: this.libraryId,
        uploadUrl: `${this.streamApiUrl}/videos/${data.guid}`,
        status: 'uploading'
      };
    } catch (error) {
      console.error('Bunny.net video upload creation failed:', error);
      throw new Error('Échec de création de l\'upload vidéo');
    }
  }

  /**
   * Check video processing status on Bunny.net
   */
  async getVideoStatus(videoId: string): Promise<VideoProcessingStatus> {
    try {
      const response = await fetch(`${this.streamApiUrl}/videos/${videoId}`, {
        headers: {
          'AccessKey': this.streamApiKey
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get video status: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        videoId,
        status: data.status === 4 ? 'completed' : data.status === 5 ? 'failed' : 'processing',
        progress: data.encodeProgress,
        duration: data.length,
        resolution: data.resolution,
        fileSize: data.storageSize,
        hlsUrl: data.status === 4 ? `https://iframe.mediadelivery.net/embed/${this.libraryId}/${videoId}` : undefined,
        thumbnailUrl: data.thumbnailFileName ? `https://vz-${this.libraryId.split('-')[0]}.b-cdn.net/${videoId}/${data.thumbnailFileName}` : undefined
      };
    } catch (error) {
      console.error('Failed to get video status from Bunny.net:', error);
      throw new Error('Impossible de récupérer le statut de la vidéo');
    }
  }

  /**
   * Generate secure token for video playback
   * Implements VISUAL's protection requirements from Module 3
   */
  generateSecureToken(
    videoId: string, 
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): SecureVideoToken {
    const expiresAt = new Date(Date.now() + VIDEO_SECURITY.tokenExpiryMinutes * 60 * 1000);
    const sessionId = nanoid();
    
    // Create signed token with video and user info
    const tokenData = {
      videoId,
      userId,
      expiresAt: expiresAt.getTime(),
      sessionId,
      ipAddress,
      libraryId: this.libraryId
    };

    const tokenString = Buffer.from(JSON.stringify(tokenData)).toString('base64');
    
    // Sign token with HMAC
    const signature = crypto
      .createHmac('sha256', this.streamApiKey)
      .update(tokenString)
      .digest('hex');
    
    const token = `${tokenString}.${signature}`;

    // Generate secure playback URL with token protection
    const playbackUrl = `https://iframe.mediadelivery.net/embed/${this.libraryId}/${videoId}?token=${token}&expires=${expiresAt.getTime()}`;

    return {
      token,
      playbackUrl,
      expiresAt,
      maxUsage: VIDEO_SECURITY.maxTokenUsage
    };
  }

  /**
   * Verify token signature and check expiry
   */
  verifySecureToken(token: string): { valid: boolean; data?: any; error?: string } {
    try {
      const [tokenString, signature] = token.split('.');
      if (!tokenString || !signature) {
        return { valid: false, error: 'Token format invalide' };
      }

      // Verify signature
      const expectedSignature = crypto
        .createHmac('sha256', this.streamApiKey)
        .update(tokenString)
        .digest('hex');

      if (signature !== expectedSignature) {
        return { valid: false, error: 'Signature du token invalide' };
      }

      // Decode and check expiry
      const data = JSON.parse(Buffer.from(tokenString, 'base64').toString());
      
      if (data.expiresAt < Date.now()) {
        return { valid: false, error: 'Token expiré' };
      }

      return { valid: true, data };
    } catch (error) {
      console.error('Token verification failed:', error);
      return { valid: false, error: 'Erreur de vérification du token' };
    }
  }

  /**
   * Generate HLS playlist URL with additional security
   * For advanced video protection beyond basic tokens
   */
  generateSecureHLSUrl(
    videoId: string,
    userId: string,
    sessionId: string
  ): string {
    const timestamp = Math.floor(Date.now() / 1000);
    const expiry = timestamp + (VIDEO_SECURITY.tokenExpiryMinutes * 60);
    
    // Create auth hash for HLS segments
    const authString = `${this.libraryId}${videoId}${userId}${expiry}${this.streamApiKey}`;
    const authHash = crypto.createHash('md5').update(authString).digest('hex');
    
    return `https://vz-${this.libraryId.split('-')[0]}.b-cdn.net/${videoId}/playlist.m3u8?auth=${authHash}&expires=${expiry}&user=${userId}&session=${sessionId}`;
  }

  /**
   * Revoke all tokens for a specific video (emergency protection)
   */
  async revokeVideoTokens(videoId: string): Promise<void> {
    // This would be implemented with a token blacklist in the database
    // For now, we log the action for audit purposes
    console.log(`[SECURITY] Revoking all tokens for video ${videoId}`);
    
    // In production, this would:
    // 1. Add videoId to a blacklist table
    // 2. Update all active tokens for this video to revoked status
    // 3. Send notification to affected users
  }

  /**
   * Delete video from Bunny.net (when project is removed)
   */
  async deleteVideo(videoId: string): Promise<void> {
    try {
      const response = await fetch(`${this.streamApiUrl}/videos/${videoId}`, {
        method: 'DELETE',
        headers: {
          'AccessKey': this.streamApiKey
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to delete video: ${response.statusText}`);
      }

      console.log(`[BUNNY] Video ${videoId} deleted from VISUAL account`);
    } catch (error) {
      console.error('Failed to delete video from Bunny.net:', error);
      throw new Error('Impossible de supprimer la vidéo');
    }
  }

  /**
   * Get video analytics from Bunny.net
   */
  async getVideoAnalytics(videoId: string, dateFrom?: string, dateTo?: string) {
    try {
      const params = new URLSearchParams({
        dateFrom: dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        dateTo: dateTo || new Date().toISOString().split('T')[0]
      });

      const response = await fetch(`${this.streamApiUrl}/videos/${videoId}/statistics?${params}`, {
        headers: {
          'AccessKey': this.streamApiKey
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get analytics: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get video analytics:', error);
      throw new Error('Impossible de récupérer les statistiques vidéo');
    }
  }
}

// Singleton instance for the entire VISUAL platform
export const bunnyVideoService = new BunnyVideoService();