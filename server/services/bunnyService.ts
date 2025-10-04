import { BUNNY_CONFIG, VIDEO_SECURITY, VIDEO_DEPOSIT_PRICING } from '@shared/constants';
import { z } from 'zod';
import crypto from 'crypto';
import { nanoid } from 'nanoid';

const bunnyEnvSchema = z.object({
  BUNNY_API_KEY: z.string().min(1).optional(),
  BUNNY_LIBRARY_ID: z.string().min(1).optional(),
  BUNNY_STREAM_API_KEY: z.string().min(1).optional(),
  BUNNY_CDN_TOKEN_KEY: z.string().optional(),
  BUNNY_PULL_ZONE: z.string().optional(),
  VISUAL_PLAY_TOKEN_SECRET: z.string().optional(),
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

type PlaybackTokenPayload = {
  vid: string;
  uid: string;
  ip: string;
  uaHash: string;
  exp: number;
  left: number;
};

export class BunnyService {
  private apiKey: string;
  private libraryId: string;
  private streamApiKey: string;
  private cdnTokenKey?: string;
  private pullZone?: string;
  private playTokenSecret: string;
  private baseUrl: string;
  private streamApiUrl: string;
  private memoryPlays = new Map<string, number>();

  constructor() {
    const env = bunnyEnvSchema.parse(process.env);

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

    this.cdnTokenKey = env.BUNNY_CDN_TOKEN_KEY;
    this.pullZone = env.BUNNY_PULL_ZONE;
    this.playTokenSecret = env.VISUAL_PLAY_TOKEN_SECRET || 'dev-secret-change-me';
    this.baseUrl = BUNNY_CONFIG.baseUrl;
    this.streamApiUrl = `${BUNNY_CONFIG.streamApiUrl}/${this.libraryId}`;
  }

  private authHeaders() {
    return {
      'Content-Type': 'application/json',
      'AccessKey': this.streamApiKey
    };
  }

  getUploadUrl(guid: string) {
    return `${this.streamApiUrl}/videos/${guid}`;
  }

  hlsManifestUrl(guid: string) {
    return `${this.streamApiUrl}/videos/${guid}/playlist.m3u8`;
  }

  static getDepositPrice(videoType: 'clip' | 'documentary' | 'film'): number {
    return VIDEO_DEPOSIT_PRICING[videoType].price;
  }

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

    return { valid: errors.length === 0, errors };
  }

  async createVideo(title: string) {
    if (!this.libraryId || !this.streamApiKey || this.libraryId === 'dev-library') {
      throw new Error('Bunny.net API keys not configured');
    }

    const res = await fetch(`${this.streamApiUrl}/videos`, {
      method: 'POST',
      headers: this.authHeaders(),
      body: JSON.stringify({ title })
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Bunny createVideo failed: ${res.status} ${text}`);
    }

    return res.json() as Promise<{ guid: string; title: string; [key: string]: any }>;
  }

  async createVideoUpload(
    title: string,
    creatorId: string,
    videoType: 'clip' | 'documentary' | 'film'
  ): Promise<VideoUploadResult> {
    try {
      const response = await fetch(`${this.streamApiUrl}/videos`, {
        method: 'POST',
        headers: this.authHeaders(),
        body: JSON.stringify({
          title,
          thumbnailTime: 5,
          collection: `creator_${creatorId}`,
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

  async getStatus(guid: string) {
    const res = await fetch(`${this.streamApiUrl}/videos/${guid}`, {
      headers: this.authHeaders()
    });

    if (!res.ok) {
      throw new Error(`Bunny getStatus failed: ${res.status}`);
    }

    return res.json();
  }

  async getVideoStatus(videoId: string): Promise<VideoProcessingStatus> {
    try {
      const response = await fetch(`${this.streamApiUrl}/videos/${videoId}`, {
        headers: this.authHeaders()
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

  async deleteVideo(guid: string) {
    const res = await fetch(`${this.streamApiUrl}/videos/${guid}`, {
      method: 'DELETE',
      headers: this.authHeaders()
    });

    if (!res.ok) {
      throw new Error(`Bunny delete failed: ${res.status}`);
    }

    return true;
  }

  async getVideoAnalytics(videoId: string, dateFrom?: string, dateTo?: string) {
    try {
      const params = new URLSearchParams({
        dateFrom: dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        dateTo: dateTo || new Date().toISOString().split('T')[0]
      });

      const response = await fetch(`${this.streamApiUrl}/videos/${videoId}/statistics?${params}`, {
        headers: this.authHeaders()
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

  generateSecureToken(
    videoId: string,
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): SecureVideoToken {
    const expiresAt = new Date(Date.now() + VIDEO_SECURITY.tokenExpiryMinutes * 60 * 1000);
    const sessionId = nanoid();

    const tokenData = {
      videoId,
      userId,
      expiresAt: expiresAt.getTime(),
      sessionId,
      ipAddress,
      libraryId: this.libraryId
    };

    const tokenString = Buffer.from(JSON.stringify(tokenData)).toString('base64');

    const signature = crypto
      .createHmac('sha256', this.streamApiKey)
      .update(tokenString)
      .digest('hex');

    const token = `${tokenString}.${signature}`;

    const playbackUrl = `https://iframe.mediadelivery.net/embed/${this.libraryId}/${videoId}?token=${token}&expires=${expiresAt.getTime()}`;

    return {
      token,
      playbackUrl,
      expiresAt,
      maxUsage: VIDEO_SECURITY.maxTokenUsage
    };
  }

  verifySecureToken(token: string): { valid: boolean; data?: any; error?: string } {
    try {
      const [tokenString, signature] = token.split('.');
      if (!tokenString || !signature) {
        return { valid: false, error: 'Token format invalide' };
      }

      const expectedSignature = crypto
        .createHmac('sha256', this.streamApiKey)
        .update(tokenString)
        .digest('hex');

      if (signature !== expectedSignature) {
        return { valid: false, error: 'Signature du token invalide' };
      }

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

  generateSecureHLSUrl(
    videoId: string,
    userId: string,
    sessionId: string
  ): string {
    const timestamp = Math.floor(Date.now() / 1000);
    const expiry = timestamp + (VIDEO_SECURITY.tokenExpiryMinutes * 60);

    const authString = `${this.libraryId}${videoId}${userId}${expiry}${this.streamApiKey}`;
    const authHash = crypto.createHash('md5').update(authString).digest('hex');

    return `https://vz-${this.libraryId.split('-')[0]}.b-cdn.net/${videoId}/playlist.m3u8?auth=${authHash}&expires=${expiry}&user=${userId}&session=${sessionId}`;
  }

  async revokeVideoTokens(videoId: string): Promise<void> {
    console.log(`[SECURITY] Revoking all tokens for video ${videoId}`);
  }

  generateBunnySignedUrl(
    path: string,
    expiresInSeconds = 30 * 60,
    userIp?: string
  ): string {
    if (!this.cdnTokenKey) {
      throw new Error('BUNNY_CDN_TOKEN_KEY not configured - CDN token authentication disabled');
    }

    if (!this.pullZone || this.pullZone === 'vz-xxxxx.b-cdn.net') {
      throw new Error('BUNNY_PULL_ZONE not configured or using default placeholder');
    }

    const expireTimestamp = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const baseUrl = `https://${this.pullZone}`;

    let tokenContent = `${this.cdnTokenKey}${path}${expireTimestamp}`;
    if (userIp) {
      tokenContent += userIp;
    }

    const hash = crypto.createHash('sha256').update(tokenContent).digest();

    let token = Buffer.from(hash).toString('base64');
    token = token
      .replace(/\n/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    let signedUrl = `${baseUrl}${path}?token=${token}&expires=${expireTimestamp}&token_path=${path}`;

    if (userIp) {
      signedUrl += `&ip=${userIp}`;
    }

    return signedUrl;
  }

  generateSignedHlsUrl(
    videoGuid: string,
    expiresInSeconds = 30 * 60,
    userIp?: string
  ): string {
    const manifestPath = `/${videoGuid}/playlist.m3u8`;
    return this.generateBunnySignedUrl(manifestPath, expiresInSeconds, userIp);
  }

  validateBunnyTokenConfig(): {
    configured: boolean;
    message: string;
    fallbackMode: boolean;
  } {
    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction) {
      if (!this.cdnTokenKey) {
        throw new Error('FATAL: BUNNY_CDN_TOKEN_KEY required in production for HLS segment protection');
      }

      if (!this.pullZone || this.pullZone === 'vz-xxxxx.b-cdn.net') {
        throw new Error('FATAL: BUNNY_PULL_ZONE not configured or using default placeholder');
      }

      if (this.playTokenSecret === 'dev-secret-change-me') {
        throw new Error('FATAL: VISUAL_PLAY_TOKEN_SECRET using insecure default value in production');
      }
    }

    if (!this.cdnTokenKey) {
      return {
        configured: false,
        message: '⚠️  BUNNY_CDN_TOKEN_KEY not set - Using fallback authentication (segments NOT protected)',
        fallbackMode: true
      };
    }

    if (!this.pullZone || this.pullZone === 'vz-xxxxx.b-cdn.net') {
      return {
        configured: false,
        message: '⚠️  BUNNY_PULL_ZONE not configured - CDN signed URLs will fail',
        fallbackMode: true
      };
    }

    if (this.playTokenSecret === 'dev-secret-change-me') {
      return {
        configured: false,
        message: '⚠️  VISUAL_PLAY_TOKEN_SECRET using default value - INSECURE in production!',
        fallbackMode: true
      };
    }

    return {
      configured: true,
      message: '✅ Bunny.net CDN Token Authentication configured - Full HLS protection enabled',
      fallbackMode: false
    };
  }

  private signPlaybackToken(payload: PlaybackTokenPayload): string {
    const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const hmac = crypto.createHmac('sha256', this.playTokenSecret).update(data).digest('base64url');
    return `${data}.${hmac}`;
  }

  private verifyAndDecodePlaybackToken(token: string): PlaybackTokenPayload | null {
    const [data, sig] = token.split('.');
    if (!data || !sig) return null;

    const good = crypto.createHmac('sha256', this.playTokenSecret).update(data).digest('base64url');
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good))) return null;

    try {
      return JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    } catch {
      return null;
    }
  }

  issuePlaybackToken(
    vid: string,
    uid: string,
    ip: string,
    userAgent: string,
    maxPlays = 3,
    ttlSec = 30 * 60
  ) {
    const uaHash = crypto.createHash('sha1').update(userAgent || '').digest('hex');
    const payload: PlaybackTokenPayload = {
      vid,
      uid,
      ip,
      uaHash,
      exp: Math.floor(Date.now() / 1000) + ttlSec,
      left: maxPlays
    };

    const token = this.signPlaybackToken(payload);
    this.memoryPlays.set(token, maxPlays);
    return token;
  }

  verifyAndConsumePlaybackToken(token: string, ip: string, userAgent: string) {
    const p = this.verifyAndDecodePlaybackToken(token);
    if (!p) return { ok: false as const, reason: 'bad-signature' };

    if (p.exp < Math.floor(Date.now() / 1000)) {
      return { ok: false as const, reason: 'expired' };
    }

    const uaHash = crypto.createHash('sha1').update(userAgent || '').digest('hex');
    if (p.ip !== ip) return { ok: false as const, reason: 'ip-mismatch' };
    if (p.uaHash !== uaHash) return { ok: false as const, reason: 'ua-mismatch' };

    const left = this.memoryPlays.get(token) ?? p.left;
    if (left <= 0) return { ok: false as const, reason: 'no-plays-left' };

    this.memoryPlays.set(token, left - 1);
    return { ok: true as const, payload: p, left: left - 1 };
  }
}

export const bunnyService = new BunnyService();
