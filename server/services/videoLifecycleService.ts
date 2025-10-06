/**
 * Service de gestion du cycle de vie des vidéos
 * Gère les cycles 168h, reconduction TOP10, archivage
 */

import { db } from '../db';
import { videoDeposits, categories, investments } from '@shared/schema';
import { eq, and, sql, desc, lte, gte } from 'drizzle-orm';
import { VIDEO_LIFECYCLE } from '@shared/constants';

export interface VideoLifecycleInfo {
  videoDepositId: string;
  status: 'active' | 'expiring_soon' | 'expired' | 'archived' | 'extended';
  createdAt: Date;
  expiresAt: Date;
  hoursRemaining: number;
  isTop10: boolean;
  canExtend: boolean;
  extensionCount: number;
  maxExtensions: number;
  extensionPriceEUR: number;
  autoRenewEligible: boolean;
  nextAction: 'none' | 'auto_renew' | 'archive' | 'notify_expiry';
}

export interface ExtensionResult {
  success: boolean;
  newExpiresAt?: Date;
  extensionCount?: number;
  error?: string;
}

export class VideoLifecycleService {
  /**
   * Calculer les informations de lifecycle d'une vidéo
   */
  async getLifecycleInfo(videoDepositId: string): Promise<VideoLifecycleInfo | null> {
    const [deposit] = await db
      .select()
      .from(videoDeposits)
      .where(eq(videoDeposits.id, videoDepositId))
      .limit(1);

    if (!deposit) {
      return null;
    }

    const now = new Date();
    const createdAt = deposit.createdAt || now;
    
    // Calculer date d'expiration basée sur créatedAt + durée standard + extensions
    const extensionCount = deposit.extensionCount || 0;
    const totalHours = VIDEO_LIFECYCLE.STANDARD_DURATION_HOURS + 
                       (extensionCount * VIDEO_LIFECYCLE.STANDARD_DURATION_HOURS);
    
    const expiresAt = new Date(createdAt.getTime() + totalHours * 60 * 60 * 1000);
    const hoursRemaining = Math.max(0, (expiresAt.getTime() - now.getTime()) / (60 * 60 * 1000));

    // Vérifier si TOP 10
    const isTop10 = await this.checkIsTop10(videoDepositId);

    // Vérifier si peut prolonger
    const canExtend = 
      deposit.status === 'active' &&
      extensionCount < VIDEO_LIFECYCLE.MAX_EXTENSIONS &&
      hoursRemaining > 0;

    // Déterminer le statut
    let status: VideoLifecycleInfo['status'];
    if (deposit.status === 'archived') {
      status = 'archived';
    } else if (hoursRemaining <= 0) {
      status = 'expired';
    } else if (hoursRemaining <= VIDEO_LIFECYCLE.NOTIFICATION_BEFORE_EXPIRY_HOURS) {
      status = 'expiring_soon';
    } else if (extensionCount > 0) {
      status = 'extended';
    } else {
      status = 'active';
    }

    // Déterminer action suivante
    let nextAction: VideoLifecycleInfo['nextAction'] = 'none';
    if (status === 'expired') {
      nextAction = isTop10 ? 'auto_renew' : 'archive';
    } else if (status === 'expiring_soon') {
      nextAction = 'notify_expiry';
    }

    return {
      videoDepositId,
      status,
      createdAt,
      expiresAt,
      hoursRemaining,
      isTop10,
      canExtend,
      extensionCount,
      maxExtensions: VIDEO_LIFECYCLE.MAX_EXTENSIONS,
      extensionPriceEUR: VIDEO_LIFECYCLE.EXTENSION_PRICE_EUR,
      autoRenewEligible: isTop10 && VIDEO_LIFECYCLE.TOP10_AUTO_RENEW,
      nextAction,
    };
  }

  /**
   * Vérifier si la vidéo est dans le TOP 10 de sa catégorie
   */
  async checkIsTop10(videoDepositId: string): Promise<boolean> {
    try {
      const [deposit] = await db
        .select()
        .from(videoDeposits)
        .where(eq(videoDeposits.id, videoDepositId))
        .limit(1);

      if (!deposit || !deposit.categoryId) {
        return false;
      }

      // Récupérer le top 10 de la catégorie basé sur le total investi
      const top10 = await db
        .select({
          id: videoDeposits.id,
          totalInvestedEUR: sql<number>`COALESCE(SUM(${investments.amountEUR}), 0)`,
        })
        .from(videoDeposits)
        .leftJoin(investments, eq(investments.projectId, videoDeposits.id))
        .where(
          and(
            eq(videoDeposits.categoryId, deposit.categoryId),
            eq(videoDeposits.status, 'active')
          )
        )
        .groupBy(videoDeposits.id)
        .orderBy(desc(sql`COALESCE(SUM(${investments.amountEUR}), 0)`))
        .limit(10);

      return top10.some(item => item.id === videoDepositId);
    } catch (error) {
      console.error('[VideoLifecycle] Error checking TOP10:', error);
      return false;
    }
  }

  /**
   * Prolonger la durée de vie d'une vidéo (payant)
   */
  async extendLifecycle(
    videoDepositId: string,
    userId: string,
    paymentConfirmed: boolean = false
  ): Promise<ExtensionResult> {
    try {
      const lifecycle = await this.getLifecycleInfo(videoDepositId);

      if (!lifecycle) {
        return { success: false, error: 'Vidéo non trouvée' };
      }

      if (!lifecycle.canExtend) {
        if (lifecycle.extensionCount >= VIDEO_LIFECYCLE.MAX_EXTENSIONS) {
          return { success: false, error: 'Nombre maximum de prolongations atteint' };
        }
        if (lifecycle.hoursRemaining <= 0) {
          return { success: false, error: 'Vidéo expirée, impossible de prolonger' };
        }
        return { success: false, error: 'Prolongation non autorisée' };
      }

      if (!paymentConfirmed) {
        return { 
          success: false, 
          error: `Paiement de ${VIDEO_LIFECYCLE.EXTENSION_PRICE_EUR}€ requis` 
        };
      }

      // Incrémenter le compteur d'extensions
      const newExtensionCount = lifecycle.extensionCount + 1;
      const newExpiresAt = new Date(
        lifecycle.expiresAt.getTime() + 
        VIDEO_LIFECYCLE.STANDARD_DURATION_HOURS * 60 * 60 * 1000
      );

      await db
        .update(videoDeposits)
        .set({
          extensionCount: newExtensionCount,
          updatedAt: new Date(),
        })
        .where(eq(videoDeposits.id, videoDepositId));

      console.log(`[VideoLifecycle] Extended ${videoDepositId} by ${VIDEO_LIFECYCLE.STANDARD_DURATION_HOURS}h`);

      return {
        success: true,
        newExpiresAt,
        extensionCount: newExtensionCount,
      };
    } catch (error) {
      console.error('[VideoLifecycle] Extension error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      };
    }
  }

  /**
   * Reconduire automatiquement les vidéos TOP 10
   */
  async autoRenewTop10Videos(): Promise<{ renewed: number; failed: number }> {
    let renewed = 0;
    let failed = 0;

    try {
      // Trouver toutes les vidéos actives expirées ou sur le point d'expirer
      const now = new Date();
      const gracePeriodEnd = new Date(
        now.getTime() + VIDEO_LIFECYCLE.GRACE_PERIOD_HOURS * 60 * 60 * 1000
      );

      const deposits = await db
        .select()
        .from(videoDeposits)
        .where(
          and(
            eq(videoDeposits.status, 'active'),
            lte(
              sql`${videoDeposits.createdAt} + INTERVAL '${VIDEO_LIFECYCLE.STANDARD_DURATION_HOURS} hours'`,
              gracePeriodEnd
            )
          )
        );

      for (const deposit of deposits) {
        const lifecycle = await this.getLifecycleInfo(deposit.id);

        if (!lifecycle) continue;

        // Si TOP 10 et éligible à reconduction
        if (lifecycle.isTop10 && lifecycle.autoRenewEligible) {
          const result = await this.extendLifecycle(deposit.id, 'system', true);
          
          if (result.success) {
            renewed++;
            console.log(`[VideoLifecycle] Auto-renewed TOP10 video ${deposit.id}`);
          } else {
            failed++;
            console.warn(`[VideoLifecycle] Failed to auto-renew ${deposit.id}:`, result.error);
          }
        }
      }

      console.log(`[VideoLifecycle] Auto-renew completed: ${renewed} renewed, ${failed} failed`);
    } catch (error) {
      console.error('[VideoLifecycle] Auto-renew error:', error);
    }

    return { renewed, failed };
  }

  /**
   * Archiver automatiquement les vidéos expirées (hors TOP 10)
   */
  async autoArchiveExpiredVideos(): Promise<{ archived: number; failed: number }> {
    let archived = 0;
    let failed = 0;

    try {
      const now = new Date();
      const archiveThreshold = new Date(
        now.getTime() - VIDEO_LIFECYCLE.AUTO_ARCHIVE_DELAY_HOURS * 60 * 60 * 1000
      );

      const deposits = await db
        .select()
        .from(videoDeposits)
        .where(
          and(
            eq(videoDeposits.status, 'active'),
            lte(
              sql`${videoDeposits.createdAt} + INTERVAL '${VIDEO_LIFECYCLE.STANDARD_DURATION_HOURS} hours'`,
              archiveThreshold
            )
          )
        );

      for (const deposit of deposits) {
        const lifecycle = await this.getLifecycleInfo(deposit.id);

        if (!lifecycle) continue;

        // Si expiré et PAS TOP 10
        if (lifecycle.status === 'expired' && !lifecycle.isTop10) {
          await db
            .update(videoDeposits)
            .set({
              status: 'archived',
              archivedAt: now,
              updatedAt: now,
            })
            .where(eq(videoDeposits.id, deposit.id));

          archived++;
          console.log(`[VideoLifecycle] Auto-archived expired video ${deposit.id}`);
        } else if (lifecycle.status === 'expired' && lifecycle.isTop10) {
          // TOP 10 expiré mais pas encore reconduit - on laisse la grâce period
          console.log(`[VideoLifecycle] TOP10 ${deposit.id} in grace period`);
        }
      }

      console.log(`[VideoLifecycle] Auto-archive completed: ${archived} archived`);
    } catch (error) {
      console.error('[VideoLifecycle] Auto-archive error:', error);
    }

    return { archived, failed };
  }

  /**
   * Envoyer notifications d'expiration imminente
   */
  async notifyExpiringVideos(): Promise<{ notified: number }> {
    let notified = 0;

    try {
      const now = new Date();
      const notifyThreshold = new Date(
        now.getTime() + VIDEO_LIFECYCLE.NOTIFICATION_BEFORE_EXPIRY_HOURS * 60 * 60 * 1000
      );

      const deposits = await db
        .select()
        .from(videoDeposits)
        .where(
          and(
            eq(videoDeposits.status, 'active'),
            lte(
              sql`${videoDeposits.createdAt} + INTERVAL '${VIDEO_LIFECYCLE.STANDARD_DURATION_HOURS} hours'`,
              notifyThreshold
            ),
            gte(
              sql`${videoDeposits.createdAt} + INTERVAL '${VIDEO_LIFECYCLE.STANDARD_DURATION_HOURS} hours'`,
              now
            )
          )
        );

      for (const deposit of deposits) {
        // TODO: Intégrer avec système de notifications
        // await notificationService.send(deposit.creatorId, 'video_expiring', {...})
        
        console.log(`[VideoLifecycle] Should notify ${deposit.creatorId} about ${deposit.id}`);
        notified++;
      }

      console.log(`[VideoLifecycle] Notifications sent: ${notified}`);
    } catch (error) {
      console.error('[VideoLifecycle] Notification error:', error);
    }

    return { notified };
  }

  /**
   * Tâche CRON - Exécuter toutes les actions de maintenance
   */
  async runMaintenanceTasks(): Promise<{
    renewed: number;
    archived: number;
    notified: number;
    errors: number;
  }> {
    console.log('[VideoLifecycle] Running maintenance tasks...');

    const results = {
      renewed: 0,
      archived: 0,
      notified: 0,
      errors: 0,
    };

    try {
      // 1. Reconduire TOP 10
      const renewResult = await this.autoRenewTop10Videos();
      results.renewed = renewResult.renewed;
      results.errors += renewResult.failed;

      // 2. Archiver vidéos expirées
      const archiveResult = await this.autoArchiveExpiredVideos();
      results.archived = archiveResult.archived;
      results.errors += archiveResult.failed;

      // 3. Notifier expirations imminentes
      const notifyResult = await this.notifyExpiringVideos();
      results.notified = notifyResult.notified;

      console.log('[VideoLifecycle] Maintenance completed:', results);
    } catch (error) {
      console.error('[VideoLifecycle] Maintenance error:', error);
      results.errors++;
    }

    return results;
  }
}

export const videoLifecycleService = new VideoLifecycleService();
