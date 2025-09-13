// VISUAL Video Deposit Service - Handles video uploads with pricing and quotas
// Implements the 3 modules: pricing (2€/5€/10€), technical rules, and protection

import { CREATOR_QUOTAS, VIDEO_DEPOSIT_PRICING } from '@shared/constants';
import { bunnyVideoService } from './bunnyVideoService';
import { storage } from '../storage';
import { z } from 'zod';
import Stripe from 'stripe';
import { nanoid } from 'nanoid';
import type { 
  InsertVideoDeposit, 
  InsertCreatorQuota, 
  InsertTransaction,
  VideoDeposit,
  CreatorQuota
} from '@shared/schema';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

// Video file validation schema
const videoFileSchema = z.object({
  originalname: z.string().min(1),
  mimetype: z.string().refine(type => 
    ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo'].includes(type),
    'Format vidéo non supporté. Utilisez MP4, MOV, WebM ou AVI'
  ),
  size: z.number().positive(),
  buffer: z.instanceof(Buffer).optional(),
  path: z.string().optional()
});

export interface VideoDepositRequest {
  projectId: string;
  creatorId: string;
  videoType: 'clip' | 'documentary' | 'film';
  file: {
    originalname: string;
    mimetype: string;
    size: number;
    buffer?: Buffer;
    path?: string;
  };
  duration?: number; // Duration in seconds if known
}

export interface VideoDepositResult {
  depositId: string;
  paymentIntentId: string;
  clientSecret: string;
  depositFee: number;
  videoType: 'clip' | 'documentary' | 'film';
  bunnyUploadUrl?: string;
  quotaRemaining: {
    clips: number;
    documentaries: number;
    films: number;
  };
}

export interface QuotaCheckResult {
  canDeposit: boolean;
  quotaExceeded?: boolean;
  remainingQuota: {
    clips: number;
    documentaries: number;
    films: number;
  };
  resetDate: Date;
  errors: string[];
}

export class VideoDepositService {

  /**
   * Check creator's quota for video deposits
   * Implements VISUAL rules: 2 clips/month, 1 doc/month, 1 film/quarter
   */
  static async checkCreatorQuota(
    creatorId: string, 
    videoType: 'clip' | 'documentary' | 'film'
  ): Promise<QuotaCheckResult> {
    const currentDate = new Date();
    const currentPeriod = this.getCurrentPeriod(currentDate);
    const currentQuarter = this.getCurrentQuarter(currentDate);

    try {
      // Get current quota record
      const existingQuota = await storage.getCreatorQuota(creatorId, currentPeriod);
      
      const errors: string[] = [];
      let canDeposit = true;

      // Check quotas based on video type and VISUAL rules
      const remainingQuota = {
        clips: CREATOR_QUOTAS.clip.maxPerMonth - (existingQuota?.clipDeposits || 0),
        documentaries: CREATOR_QUOTAS.documentary.maxPerMonth - (existingQuota?.documentaryDeposits || 0),
        films: CREATOR_QUOTAS.film.maxPerQuarter - await this.getQuarterlyFilmCount(creatorId, currentQuarter)
      };

      if (videoType === 'clip' && remainingQuota.clips <= 0) {
        canDeposit = false;
        errors.push('Quota mensuel de clips dépassé (max 2/mois)');
      } else if (videoType === 'documentary' && remainingQuota.documentaries <= 0) {
        canDeposit = false;
        errors.push('Quota mensuel de documentaires dépassé (max 1/mois)');
      } else if (videoType === 'film' && remainingQuota.films <= 0) {
        canDeposit = false;
        errors.push('Quota trimestriel de films dépassé (max 1/trimestre)');
      }

      return {
        canDeposit,
        quotaExceeded: !canDeposit,
        remainingQuota,
        resetDate: this.getNextResetDate(videoType, currentDate),
        errors
      };

    } catch (error) {
      console.error('Error checking creator quota:', error);
      return {
        canDeposit: false,
        remainingQuota: { clips: 0, documentaries: 0, films: 0 },
        resetDate: new Date(),
        errors: ['Erreur de vérification des quotas']
      };
    }
  }

  /**
   * Validate video file against VISUAL technical specifications
   */
  static validateVideoSpecs(
    videoType: 'clip' | 'documentary' | 'film',
    file: any,
    duration?: number
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Validate file schema first
    const fileValidation = videoFileSchema.safeParse(file);
    if (!fileValidation.success) {
      errors.push(...fileValidation.error.issues.map(i => i.message));
      return { valid: false, errors };
    }

    const specs = VIDEO_DEPOSIT_PRICING[videoType];
    const fileSizeGB = file.size / (1024 * 1024 * 1024);

    // Check file size limits
    if (fileSizeGB > specs.maxSizeGB) {
      errors.push(`Fichier trop volumineux: ${fileSizeGB.toFixed(2)} GB > ${specs.maxSizeGB} GB max pour ${specs.label}`);
    }

    // Check duration if provided
    if (duration && duration > specs.maxDuration) {
      const maxMinutes = Math.floor(specs.maxDuration / 60);
      errors.push(`Durée trop longue: ${Math.floor(duration/60)} min > ${maxMinutes} min max pour ${specs.label}`);
    }

    // Validate video format
    const allowedFormats = ['video/mp4', 'video/quicktime', 'video/webm'];
    if (!allowedFormats.includes(file.mimetype)) {
      errors.push('Format non supporté. Utilisez MP4, MOV ou WebM');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Create video deposit with Stripe payment
   * Implements VISUAL pricing: 2€, 5€, 10€
   */
  static async createVideoDeposit(request: VideoDepositRequest): Promise<VideoDepositResult> {
    const { projectId, creatorId, videoType, file, duration } = request;

    // 1. Validate creator quota
    const quotaCheck = await this.checkCreatorQuota(creatorId, videoType);
    if (!quotaCheck.canDeposit) {
      throw new Error(`Quota dépassé: ${quotaCheck.errors.join(', ')}`);
    }

    // 2. Validate video specifications
    const specsValidation = this.validateVideoSpecs(videoType, file, duration);
    if (!specsValidation.valid) {
      throw new Error(`Fichier non conforme: ${specsValidation.errors.join(', ')}`);
    }

    // 3. Get pricing
    const depositFee = bunnyVideoService.getDepositPrice(videoType);

    try {
      // 4. Create Stripe payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: depositFee * 100, // Convert to cents
        currency: 'eur',
        description: `VISUAL - Dépôt ${VIDEO_DEPOSIT_PRICING[videoType].label}`,
        metadata: {
          projectId,
          creatorId,
          videoType,
          platform: 'VISUAL'
        },
        payment_method_types: ['card'],
        confirm: false // User will confirm on frontend
      });

      // 5. Create Bunny.net upload session
      let bunnyUpload;
      try {
        bunnyUpload = await bunnyVideoService.createVideoUpload(
          file.originalname.split('.')[0], // Title without extension
          creatorId,
          videoType
        );
      } catch (bunnyError) {
        console.error('Bunny.net upload creation failed:', bunnyError);
        // Continue without Bunny upload for now, will retry later
      }

      // 6. Create video deposit record
      const videoDeposit: InsertVideoDeposit = {
        projectId,
        creatorId,
        videoType,
        originalFilename: file.originalname,
        bunnyVideoId: bunnyUpload?.videoId,
        bunnyLibraryId: bunnyUpload?.libraryId,
        duration,
        fileSize: file.size,
        status: 'pending_payment',
        depositFee: depositFee.toString(),
        paymentIntentId: paymentIntent.id,
        protectionLevel: 'token'
      };

      const depositId = await storage.createVideoDeposit(videoDeposit);

      // 7. Create audit transaction
      const transaction: InsertTransaction = {
        userId: creatorId,
        type: 'deposit',
        amount: depositFee.toString(),
        projectId,
        metadata: {
          type: 'video_deposit',
          videoType,
          depositId,
          paymentIntentId: paymentIntent.id
        }
      };

      await storage.createTransaction(transaction);

      return {
        depositId,
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret!,
        depositFee,
        videoType,
        bunnyUploadUrl: bunnyUpload?.uploadUrl,
        quotaRemaining: quotaCheck.remainingQuota
      };

    } catch (error) {
      console.error('Error creating video deposit:', error);
      throw new Error('Erreur lors de la création du dépôt vidéo');
    }
  }

  /**
   * Process successful payment and activate video
   */
  static async processPaymentSuccess(paymentIntentId: string): Promise<void> {
    try {
      // Find deposit by payment intent
      const deposit = await storage.getVideoDepositByPaymentIntent(paymentIntentId);
      if (!deposit) {
        throw new Error('Dépôt vidéo introuvable');
      }

      // Update deposit status
      await storage.updateVideoDeposit(deposit.id, {
        status: 'processing',
        updatedAt: new Date()
      });

      // Update creator quota
      await this.incrementCreatorQuota(deposit.creatorId, deposit.videoType);

      // Update project with video info if successful Bunny upload
      if (deposit.bunnyVideoId) {
        await storage.updateProject(deposit.projectId, {
          videoUrl: `bunny:${deposit.bunnyVideoId}`, // Special format for Bunny videos
          status: 'active', // Activate project when video is uploaded
          updatedAt: new Date()
        });
      }

      console.log(`[VIDEO DEPOSIT] Payment processed for deposit ${deposit.id}`);

    } catch (error) {
      console.error('Error processing video deposit payment:', error);
      throw error;
    }
  }

  /**
   * Update creator quota after successful deposit
   */
  private static async incrementCreatorQuota(creatorId: string, videoType: 'clip' | 'documentary' | 'film'): Promise<void> {
    const currentPeriod = this.getCurrentPeriod(new Date());
    const existingQuota = await storage.getCreatorQuota(creatorId, currentPeriod);

    const quotaUpdate: Partial<CreatorQuota> = {
      updatedAt: new Date()
    };

    if (videoType === 'clip') {
      quotaUpdate.clipDeposits = (existingQuota?.clipDeposits || 0) + 1;
    } else if (videoType === 'documentary') {
      quotaUpdate.documentaryDeposits = (existingQuota?.documentaryDeposits || 0) + 1;
    } else if (videoType === 'film') {
      quotaUpdate.filmDeposits = (existingQuota?.filmDeposits || 0) + 1;
    }

    if (existingQuota) {
      await storage.updateCreatorQuota(creatorId, currentPeriod, quotaUpdate);
    } else {
      const newQuota: InsertCreatorQuota = {
        creatorId,
        period: currentPeriod,
        clipDeposits: videoType === 'clip' ? 1 : 0,
        documentaryDeposits: videoType === 'documentary' ? 1 : 0,
        filmDeposits: videoType === 'film' ? 1 : 0,
        totalSpentEUR: VIDEO_DEPOSIT_PRICING[videoType].price.toString()
      };
      await storage.createCreatorQuota(newQuota);
    }
  }

  /**
   * Get quarterly film count for quota checking
   */
  private static async getQuarterlyFilmCount(creatorId: string, quarter: string): Promise<number> {
    // This would query all monthly periods in the quarter
    const [year, q] = quarter.split('-Q');
    const quarterMonths = this.getQuarterMonths(parseInt(year), parseInt(q));
    
    let filmCount = 0;
    for (const month of quarterMonths) {
      const quota = await storage.getCreatorQuota(creatorId, month);
      filmCount += quota?.filmDeposits || 0;
    }
    
    return filmCount;
  }

  // Helper methods for date calculations
  private static getCurrentPeriod(date: Date): string {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
  }

  private static getCurrentQuarter(date: Date): string {
    const quarter = Math.ceil((date.getMonth() + 1) / 3);
    return `${date.getFullYear()}-Q${quarter}`;
  }

  private static getQuarterMonths(year: number, quarter: number): string[] {
    const startMonth = (quarter - 1) * 3 + 1;
    return [
      `${year}-${startMonth.toString().padStart(2, '0')}`,
      `${year}-${(startMonth + 1).toString().padStart(2, '0')}`,
      `${year}-${(startMonth + 2).toString().padStart(2, '0')}`
    ];
  }

  private static getNextResetDate(videoType: 'clip' | 'documentary' | 'film', currentDate: Date): Date {
    if (videoType === 'film') {
      // Next quarter
      const currentQuarter = Math.ceil((currentDate.getMonth() + 1) / 3);
      const nextQuarterStart = currentQuarter === 4 ? 
        new Date(currentDate.getFullYear() + 1, 0, 1) :
        new Date(currentDate.getFullYear(), currentQuarter * 3, 1);
      return nextQuarterStart;
    } else {
      // Next month
      return new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    }
  }
}

export { VideoDepositService };