import { db } from "../db";
import { 
  minorNotifications, 
  minorProfiles,
  users 
} from "@shared/schema";
import { eq, and, desc, count, sql, lte, gte } from "drizzle-orm";
import type { MinorNotification } from "@shared/schema";

// ===== SERVICE DE NOTIFICATIONS POUR VISITEURS MINEURS =====

export class MinorNotificationService {

  /**
   * Récupérer toutes les notifications d'un mineur
   */
  async getMinorNotifications(userId: string, limit = 50): Promise<MinorNotification[]> {
    const profile = await db
      .select({ id: minorProfiles.id })
      .from(minorProfiles)
      .where(eq(minorProfiles.userId, userId))
      .limit(1);

    if (!profile.length) {
      throw new Error("Profil mineur non trouvé");
    }

    const notifications = await db
      .select()
      .from(minorNotifications)
      .where(eq(minorNotifications.minorProfileId, profile[0].id))
      .orderBy(desc(minorNotifications.createdAt))
      .limit(limit);

    return notifications;
  }

  /**
   * Récupérer les notifications non lues d'un mineur
   */
  async getUnreadNotifications(userId: string): Promise<MinorNotification[]> {
    const profile = await db
      .select({ id: minorProfiles.id })
      .from(minorProfiles)
      .where(eq(minorProfiles.userId, userId))
      .limit(1);

    if (!profile.length) {
      return [];
    }

    const notifications = await db
      .select()
      .from(minorNotifications)
      .where(
        and(
          eq(minorNotifications.minorProfileId, profile[0].id),
          eq(minorNotifications.isRead, false)
        )
      )
      .orderBy(desc(minorNotifications.createdAt));

    return notifications;
  }

  /**
   * Marquer une notification comme lue
   */
  async markAsRead(userId: string, notificationId: string): Promise<void> {
    const profile = await db
      .select({ id: minorProfiles.id })
      .from(minorProfiles)
      .where(eq(minorProfiles.userId, userId))
      .limit(1);

    if (!profile.length) {
      throw new Error("Profil mineur non trouvé");
    }

    await db
      .update(minorNotifications)
      .set({ 
        isRead: true,
        readAt: new Date()
      })
      .where(
        and(
          eq(minorNotifications.id, notificationId),
          eq(minorNotifications.minorProfileId, profile[0].id)
        )
      );
  }

  /**
   * Marquer toutes les notifications comme lues
   */
  async markAllAsRead(userId: string): Promise<number> {
    const profile = await db
      .select({ id: minorProfiles.id })
      .from(minorProfiles)
      .where(eq(minorProfiles.userId, userId))
      .limit(1);

    if (!profile.length) {
      throw new Error("Profil mineur non trouvé");
    }

    const result = await db
      .update(minorNotifications)
      .set({ 
        isRead: true,
        readAt: new Date()
      })
      .where(
        and(
          eq(minorNotifications.minorProfileId, profile[0].id),
          eq(minorNotifications.isRead, false)
        )
      );

    return result.rowCount || 0;
  }

  /**
   * Supprimer une notification
   */
  async deleteNotification(userId: string, notificationId: string): Promise<void> {
    const profile = await db
      .select({ id: minorProfiles.id })
      .from(minorProfiles)
      .where(eq(minorProfiles.userId, userId))
      .limit(1);

    if (!profile.length) {
      throw new Error("Profil mineur non trouvé");
    }

    await db
      .delete(minorNotifications)
      .where(
        and(
          eq(minorNotifications.id, notificationId),
          eq(minorNotifications.minorProfileId, profile[0].id)
        )
      );
  }

  /**
   * Créer une notification personnalisée
   */
  async createCustomNotification(
    userId: string, 
    title: string, 
    message: string,
    type = 'custom'
  ): Promise<MinorNotification> {
    const profile = await db
      .select({ id: minorProfiles.id })
      .from(minorProfiles)
      .where(eq(minorProfiles.userId, userId))
      .limit(1);

    if (!profile.length) {
      throw new Error("Profil mineur non trouvé");
    }

    const notificationData = {
      userId,
      minorProfileId: profile[0].id,
      type,
      title,
      message,
      triggerDate: new Date(),
      sentAt: new Date(),
    };

    const [notification] = await db
      .insert(minorNotifications)
      .values(notificationData)
      .returning();

    return notification;
  }

  /**
   * Traiter les notifications programmées (cron job)
   */
  async processPendingNotifications(): Promise<{
    processed: number;
    errors: string[];
  }> {
    const now = new Date();
    
    // Récupérer les notifications à envoyer
    const pendingNotifications = await db
      .select()
      .from(minorNotifications)
      .where(
        and(
          sql`${minorNotifications.sentAt} IS NULL`,
          lte(minorNotifications.triggerDate, now)
        )
      )
      .limit(100);

    let processed = 0;
    const errors: string[] = [];

    for (const notification of pendingNotifications) {
      try {
        // Marquer comme envoyée
        await db
          .update(minorNotifications)
          .set({ sentAt: now })
          .where(eq(minorNotifications.id, notification.id));

        processed++;
      } catch (error) {
        errors.push(`Notification ${notification.id}: ${error.message}`);
      }
    }

    return { processed, errors };
  }

  /**
   * Nettoyage des anciennes notifications (> 6 mois)
   */
  async cleanupOldNotifications(): Promise<number> {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const result = await db
      .delete(minorNotifications)
      .where(
        and(
          lte(minorNotifications.createdAt, sixMonthsAgo),
          eq(minorNotifications.isRead, true)
        )
      );

    return result.rowCount || 0;
  }

  /**
   * Statistiques des notifications (pour admin)
   */
  async getNotificationStats(): Promise<{
    totalNotifications: number;
    unreadNotifications: number;
    notificationsByType: Record<string, number>;
    recentActivity: number;
  }> {
    try {
      const [totalStats] = await db
        .select({
          total: count().as('total')
        })
        .from(minorNotifications);

      const [unreadStats] = await db
        .select({
          unread: count().as('unread')
        })
        .from(minorNotifications)
        .where(eq(minorNotifications.isRead, false));

      // Activité des 7 derniers jours
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const [recentStats] = await db
        .select({
          recent: count().as('recent')
        })
        .from(minorNotifications)
        .where(gte(minorNotifications.createdAt, sevenDaysAgo));

      // Répartition par type (simulée pour l'exemple)
      const notificationsByType = {
        cap_warning_80: 0,
        cap_reached: 0,
        majority_reminder: 0,
        lock_expired: 0,
        custom: 0,
      };

      return {
        totalNotifications: Number(totalStats?.total || 0),
        unreadNotifications: Number(unreadStats?.unread || 0),
        notificationsByType,
        recentActivity: Number(recentStats?.recent || 0),
      };
    } catch (error) {
      console.error('Error getting notification stats:', error);
      return {
        totalNotifications: 0,
        unreadNotifications: 0,
        notificationsByType: {},
        recentActivity: 0,
      };
    }
  }
}

// Export instance unique
export const minorNotificationService = new MinorNotificationService();