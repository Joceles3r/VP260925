import { db } from '../db';
import { notifications, notificationPreferences, users, projects } from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getWebSocketService } from '../websocket';
import type { 
  InsertNotification, 
  Notification, 
  NotificationWithProject,
  WebSocketMessage 
} from '@shared/types';

export interface NotificationOptions {
  userId: string;
  type: string;
  title: string;
  message: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  projectId?: string;
  data?: Record<string, any>;
  sendWebSocket?: boolean;
  sendEmail?: boolean;
}

export class NotificationService {
  /**
   * Send notification to user
   */
  static async sendNotification(options: NotificationOptions): Promise<Notification> {
    try {
      // Check user notification preferences
      const preferences = await this.getUserPreferences(options.userId, options.type);
      
      // Create notification in database
      const notificationData: InsertNotification = {
        userId: options.userId,
        type: options.type as any,
        title: options.title,
        message: options.message,
        priority: options.priority || 'medium',
        projectId: options.projectId,
        data: options.data || null,
        isRead: false
      };

      const [notification] = await db
        .insert(notifications)
        .values(notificationData)
        .returning();

      // Send real-time notification if enabled
      if ((options.sendWebSocket ?? preferences.pushEnabled) && preferences.enabled) {
        await this.sendWebSocketNotification(notification);
      }

      // Send email notification if enabled (placeholder for future implementation)
      if ((options.sendEmail ?? preferences.emailEnabled) && preferences.enabled) {
        await this.sendEmailNotification(notification);
      }

      return notification;
    } catch (error) {
      console.error('Failed to send notification:', error);
      throw error;
    }
  }

  /**
   * Send investment milestone notification
   */
  static async notifyInvestmentMilestone(
    projectId: string, 
    milestone: number,
    currentAmount: number,
    targetAmount: number
  ): Promise<void> {
    try {
      // Get project details
      const [project] = await db
        .select()
        .from(projects)
        .where(eq(projects.id, projectId))
        .limit(1);

      if (!project) return;

      // Notify project creator
      await this.sendNotification({
        userId: project.creatorId,
        type: 'investment_milestone',
        title: `Objectif atteint à ${milestone}% !`,
        message: `Votre projet "${project.title}" a atteint ${milestone}% de son objectif de financement (${currentAmount}€ / ${targetAmount}€).`,
        priority: milestone >= 100 ? 'high' : 'medium',
        projectId: projectId,
        data: {
          milestone,
          currentAmount,
          targetAmount,
          percentage: (currentAmount / targetAmount) * 100
        }
      });

      // Notify all investors of this project
      await this.notifyProjectInvestors(projectId, {
        type: 'investment_milestone',
        title: `Objectif de financement atteint !`,
        message: `Le projet "${project.title}" a atteint ${milestone}% de son objectif.`,
        priority: 'medium',
        data: { milestone, currentAmount, targetAmount }
      });

      // Send WebSocket update for live updates
      const wsService = getWebSocketService();
      if (wsService) {
        wsService.broadcastToAll({
          type: 'investment',
          data: {
            projectId,
            projectTitle: project.title,
            milestone,
            currentAmount,
            targetAmount,
            timestamp: Date.now()
          }
        });
      }

    } catch (error) {
      console.error('Failed to notify investment milestone:', error);
    }
  }

  /**
   * Notify project status change
   */
  static async notifyProjectStatusChange(
    projectId: string, 
    newStatus: string,
    oldStatus: string
  ): Promise<void> {
    try {
      const [project] = await db
        .select()
        .from(projects)
        .where(eq(projects.id, projectId))
        .limit(1);

      if (!project) return;

      const statusMessages = {
        active: 'Votre projet a été approuvé et est maintenant actif !',
        rejected: 'Votre projet nécessite des modifications avant approbation.',
        completed: 'Félicitations ! Votre projet a été finalisé avec succès.'
      };

      // Notify project creator
      await this.sendNotification({
        userId: project.creatorId,
        type: 'project_status_change',
        title: 'Changement de statut de projet',
        message: statusMessages[newStatus as keyof typeof statusMessages] || 
                 `Le statut de votre projet "${project.title}" a été mis à jour.`,
        priority: newStatus === 'rejected' ? 'high' : 'medium',
        projectId: projectId,
        data: { newStatus, oldStatus }
      });

      // Notify investors if project is completed
      if (newStatus === 'completed') {
        await this.notifyProjectInvestors(projectId, {
          type: 'project_status_change',
          title: 'Projet finalisé !',
          message: `Le projet "${project.title}" dans lequel vous avez investi a été finalisé.`,
          priority: 'medium',
          data: { newStatus, oldStatus }
        });
      }

      // WebSocket notification
      const wsService = getWebSocketService();
      if (wsService) {
        wsService.notifyProjectStatusChange(projectId, newStatus, project.title);
      }

    } catch (error) {
      console.error('Failed to notify project status change:', error);
    }
  }

  /**
   * Notify ROI update
   */
  static async notifyROIUpdate(
    userId: string,
    projectId: string,
    oldROI: number,
    newROI: number,
    threshold: number = 0.1 // 10% change threshold
  ): Promise<void> {
    try {
      const roiChange = Math.abs(newROI - oldROI);
      if (roiChange < threshold) return; // Don't notify for small changes

      const [project] = await db
        .select()
        .from(projects)
        .where(eq(projects.id, projectId))
        .limit(1);

      if (!project) return;

      const isPositive = newROI > oldROI;
      const changePercent = ((newROI - oldROI) * 100).toFixed(1);

      await this.sendNotification({
        userId,
        type: 'roi_update',
        title: `ROI ${isPositive ? 'en hausse' : 'en baisse'}`,
        message: `Le ROI de votre investissement dans "${project.title}" a ${isPositive ? 'augmenté' : 'diminué'} de ${changePercent}%.`,
        priority: Math.abs(parseFloat(changePercent)) > 20 ? 'high' : 'medium',
        projectId: projectId,
        data: {
          oldROI,
          newROI,
          change: newROI - oldROI,
          changePercent: parseFloat(changePercent)
        }
      });

    } catch (error) {
      console.error('Failed to notify ROI update:', error);
    }
  }

  /**
   * Notify live show events
   */
  static async notifyLiveShowStarted(showId: string, showTitle: string): Promise<void> {
    try {
      // Get all users who might be interested (could be based on preferences)
      const interestedUsers = await db
        .select({ userId: users.id })
        .from(users)
        .limit(100); // Limit to avoid spam

      // Send notifications to interested users
      for (const user of interestedUsers) {
        await this.sendNotification({
          userId: user.userId,
          type: 'live_show_started',
          title: 'Émission live en cours !',
          message: `L'émission "${showTitle}" vient de commencer. Rejoignez-nous maintenant !`,
          priority: 'medium',
          data: { showId, showTitle },
          sendWebSocket: true
        });
      }

      // WebSocket broadcast
      const wsService = getWebSocketService();
      if (wsService) {
        wsService.broadcastToAll({
          type: 'investment',
          data: {
            showId,
            showTitle,
            status: 'started',
            timestamp: Date.now()
          }
        });
      }

    } catch (error) {
      console.error('Failed to notify live show started:', error);
    }
  }

  /**
   * Get user notifications with pagination
   */
  static async getUserNotifications(
    userId: string, 
    page: number = 1, 
    limit: number = 20
  ): Promise<NotificationWithProject[]> {
    try {
      const offset = (page - 1) * limit;

      const result = await db
        .select({
          notification: notifications,
          project: projects
        })
        .from(notifications)
        .leftJoin(projects, eq(notifications.projectId, projects.id))
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt))
        .limit(limit)
        .offset(offset);

      return result.map(row => ({
        ...row.notification,
        project: row.project ? {
          id: row.project.id,
          title: row.project.title,
          thumbnailUrl: row.project.thumbnailUrl
        } : undefined
      }));

    } catch (error) {
      console.error('Failed to get user notifications:', error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    try {
      const result = await db
        .update(notifications)
        .set({ isRead: true })
        .where(and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId)
        ))
        .returning();

      return result.length > 0;
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      return false;
    }
  }

  /**
   * Mark all notifications as read for user
   */
  static async markAllAsRead(userId: string): Promise<number> {
    try {
      const result = await db
        .update(notifications)
        .set({ isRead: true })
        .where(and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        ))
        .returning();

      return result.length;
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      return 0;
    }
  }

  /**
   * Get unread notifications count
   */
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const result = await db
        .select()
        .from(notifications)
        .where(and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        ));

      return result.length;
    } catch (error) {
      console.error('Failed to get unread count:', error);
      return 0;
    }
  }

  /**
   * Private helper methods
   */
  private static async getUserPreferences(userId: string, notificationType: string) {
    try {
      const [preference] = await db
        .select()
        .from(notificationPreferences)
        .where(and(
          eq(notificationPreferences.userId, userId),
          eq(notificationPreferences.notificationType, notificationType as any)
        ))
        .limit(1);

      // Return default preferences if none found
      return preference || {
        enabled: true,
        emailEnabled: false,
        pushEnabled: true
      };
    } catch (error) {
      console.error('Failed to get user preferences:', error);
      return {
        enabled: true,
        emailEnabled: false,
        pushEnabled: true
      };
    }
  }

  private static async sendWebSocketNotification(notification: Notification): Promise<void> {
    try {
      const wsService = getWebSocketService();
      if (!wsService) return;

      const message: WebSocketMessage = {
        type: 'notification',
        payload: notification,
        timestamp: Date.now(),
        userId: notification.userId
      };

      wsService.broadcastToUser(notification.userId, message);
    } catch (error) {
      console.error('Failed to send WebSocket notification:', error);
    }
  }

  private static async sendEmailNotification(notification: Notification): Promise<void> {
    try {
      // Placeholder for email notification implementation
      console.log('Email notification (not implemented):', {
        to: notification.userId,
        subject: notification.title,
        message: notification.message
      });
    } catch (error) {
      console.error('Failed to send email notification:', error);
    }
  }

  private static async notifyProjectInvestors(
    projectId: string,
    notificationData: {
      type: string;
      title: string;
      message: string;
      priority: string;
      data?: Record<string, any>;
    }
  ): Promise<void> {
    try {
      // This would typically join with investments table to get all investors
      // For now, we'll implement a simple version
      console.log('Notify project investors (placeholder):', {
        projectId,
        ...notificationData
      });
    } catch (error) {
      console.error('Failed to notify project investors:', error);
    }
  }
}