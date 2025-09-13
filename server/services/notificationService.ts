import { storage } from "../storage";
import { getNotificationService } from "../websocket";
import type { 
  InsertNotification, 
  Notification, 
  Project, 
  Investment, 
  Transaction,
  User
} from "@shared/schema";

export interface NotificationTriggerData {
  projectId?: string;
  userId?: string;
  amount?: string;
  percentage?: number;
  targetAmount?: string;
  currentAmount?: string;
  investorCount?: number;
  metadata?: Record<string, any>;
}

export class NotificationService {
  
  // Create and send a notification
  private async createAndSendNotification(notification: InsertNotification): Promise<Notification> {
    // Save to database
    const savedNotification = await storage.createNotification(notification);
    
    // Send via WebSocket if user is connected
    try {
      const wsService = getNotificationService();
      wsService.sendNotificationToUser(notification.userId, savedNotification);
    } catch (error) {
      console.log("WebSocket service not available or user not connected:", (error as Error).message);
    }
    
    return savedNotification;
  }

  // New investment notification
  async notifyNewInvestment(data: NotificationTriggerData): Promise<void> {
    if (!data.projectId || !data.userId || !data.amount) return;
    
    const project = await storage.getProject(data.projectId);
    if (!project) return;

    await this.createAndSendNotification({
      userId: data.userId,
      projectId: data.projectId,
      type: 'new_investment',
      title: 'Nouvel investissement',
      message: `Votre investissement de €${data.amount} dans "${project.title}" a été confirmé`,
      priority: 'medium',
      data: { amount: data.amount, projectTitle: project.title }
    });

    // Notify project creator
    await this.createAndSendNotification({
      userId: project.creatorId,
      projectId: data.projectId,
      type: 'new_investment',
      title: 'Nouvel investisseur',
      message: `Quelqu'un a investi €${data.amount} dans votre projet "${project.title}"`,
      priority: 'medium',
      data: { amount: data.amount, projectTitle: project.title }
    });
  }

  // Investment milestone notification (25%, 50%, 75%, 100%)
  async notifyInvestmentMilestone(data: NotificationTriggerData): Promise<void> {
    if (!data.projectId || !data.percentage) return;
    
    const project = await storage.getProject(data.projectId);
    if (!project) return;

    const milestones = [25, 50, 75, 100];
    const milestone = milestones.find(m => Math.abs(m - data.percentage!) < 1);
    if (!milestone) return;

    // Get all investors for this project
    const investments = await storage.getProjectInvestments(data.projectId);
    const investorIds = Array.from(new Set(investments.map(inv => inv.userId)));

    const title = milestone === 100 ? 'Objectif atteint!' : `${milestone}% de l'objectif atteint`;
    const message = milestone === 100 
      ? `Le projet "${project.title}" a atteint son objectif de financement!`
      : `Le projet "${project.title}" a atteint ${milestone}% de son objectif de financement`;

    // Notify all investors
    for (const userId of investorIds) {
      await this.createAndSendNotification({
        userId,
        projectId: data.projectId,
        type: 'investment_milestone',
        title,
        message,
        priority: milestone === 100 ? 'high' : 'medium',
        data: { 
          milestone, 
          projectTitle: project.title,
          currentAmount: data.currentAmount,
          targetAmount: data.targetAmount
        }
      });
    }

    // Notify project creator
    await this.createAndSendNotification({
      userId: project.creatorId,
      projectId: data.projectId,
      type: 'investment_milestone',
      title,
      message: `Votre projet "${project.title}" a atteint ${milestone}% de son objectif!`,
      priority: milestone === 100 ? 'high' : 'medium',
      data: { 
        milestone, 
        projectTitle: project.title,
        currentAmount: data.currentAmount,
        targetAmount: data.targetAmount
      }
    });
  }

  // Funding goal reached notification
  async notifyFundingGoalReached(data: NotificationTriggerData): Promise<void> {
    if (!data.projectId) return;
    
    const project = await storage.getProject(data.projectId);
    if (!project) return;

    // Get all investors
    const investments = await storage.getProjectInvestments(data.projectId);
    const investorIds = Array.from(new Set(investments.map(inv => inv.userId)));

    // Notify all investors
    for (const userId of investorIds) {
      await this.createAndSendNotification({
        userId,
        projectId: data.projectId,
        type: 'funding_goal_reached',
        title: 'Objectif de financement atteint!',
        message: `Le projet "${project.title}" a atteint son objectif de financement de €${project.targetAmount}`,
        priority: 'high',
        data: { 
          projectTitle: project.title,
          targetAmount: project.targetAmount,
          currentAmount: project.currentAmount
        }
      });
    }
  }

  // Project status change notification
  async notifyProjectStatusChange(data: NotificationTriggerData & { oldStatus: string, newStatus: string }): Promise<void> {
    if (!data.projectId || !data.newStatus) return;
    
    const project = await storage.getProject(data.projectId);
    if (!project) return;

    // Get all investors
    const investments = await storage.getProjectInvestments(data.projectId);
    const investorIds = Array.from(new Set(investments.map(inv => inv.userId)));

    const statusMessages = {
      'pending': 'en attente de validation',
      'active': 'maintenant actif et accepte les investissements',
      'completed': 'terminé avec succès',
      'rejected': 'rejeté'
    };

    const message = `Le projet "${project.title}" est ${statusMessages[data.newStatus as keyof typeof statusMessages] || data.newStatus}`;

    // Notify all investors
    for (const userId of investorIds) {
      await this.createAndSendNotification({
        userId,
        projectId: data.projectId,
        type: 'project_status_change',
        title: 'Changement de statut du projet',
        message,
        priority: data.newStatus === 'rejected' ? 'high' : 'medium',
        data: { 
          projectTitle: project.title,
          oldStatus: data.oldStatus,
          newStatus: data.newStatus
        }
      });
    }

    // Notify project creator
    await this.createAndSendNotification({
      userId: project.creatorId,
      projectId: data.projectId,
      type: 'project_status_change',
      title: 'Changement de statut de votre projet',
      message: `Votre projet "${project.title}" est ${statusMessages[data.newStatus as keyof typeof statusMessages] || data.newStatus}`,
      priority: data.newStatus === 'rejected' ? 'high' : 'medium',
      data: { 
        projectTitle: project.title,
        oldStatus: data.oldStatus,
        newStatus: data.newStatus
      }
    });
  }

  // ROI update notification
  async notifyROIUpdate(data: NotificationTriggerData & { oldROI: string, newROI: string }): Promise<void> {
    if (!data.projectId || !data.userId) return;
    
    const project = await storage.getProject(data.projectId);
    if (!project) return;

    const roiChange = parseFloat(data.newROI) - parseFloat(data.oldROI);
    const isPositive = roiChange > 0;
    
    await this.createAndSendNotification({
      userId: data.userId,
      projectId: data.projectId,
      type: 'roi_update',
      title: `ROI mis à jour ${isPositive ? '📈' : '📉'}`,
      message: `Le ROI de votre investissement dans "${project.title}" est maintenant de ${data.newROI}% (${isPositive ? '+' : ''}${roiChange.toFixed(2)}%)`,
      priority: Math.abs(roiChange) > 10 ? 'high' : 'medium',
      data: { 
        projectTitle: project.title,
        oldROI: data.oldROI,
        newROI: data.newROI,
        change: roiChange.toFixed(2)
      }
    });
  }

  // Live show started notification
  async notifyLiveShowStarted(data: NotificationTriggerData & { liveShowId: string, title: string }): Promise<void> {
    if (!data.liveShowId || !data.title) return;

    // Broadcast to all connected users
    try {
      const wsService = getNotificationService();
      wsService.sendSystemAnnouncement({
        type: 'live_show_started',
        title: 'Live Show en cours!',
        message: `"${data.title}" a commencé - Rejoignez-nous maintenant!`,
        liveShowId: data.liveShowId,
        priority: 'high'
      });
    } catch (error) {
      console.log("WebSocket service not available:", (error as Error).message);
    }
  }

  // Battle result notification
  async notifyBattleResult(data: NotificationTriggerData & { 
    liveShowId: string, 
    winnerArtist: string, 
    loserArtist: string,
    userInvestments: Array<{ userId: string, artist: 'A' | 'B', amount: number }>
  }): Promise<void> {
    if (!data.liveShowId || !data.userInvestments) return;

    // Notify each investor of their result
    for (const investment of data.userInvestments) {
      const isWinner = (investment.artist === 'A' && data.winnerArtist.includes('A')) ||
                      (investment.artist === 'B' && data.winnerArtist.includes('B'));
      
      await this.createAndSendNotification({
        userId: investment.userId,
        type: 'battle_result',
        title: isWinner ? 'Vous avez gagné! 🎉' : 'Battle terminée',
        message: isWinner 
          ? `Félicitations! Votre investissement de €${investment.amount} sur ${data.winnerArtist} a gagné la battle!`
          : `La battle est terminée. ${data.winnerArtist} a gagné contre ${data.loserArtist}`,
        priority: 'medium',
        data: { 
          liveShowId: data.liveShowId,
          isWinner,
          investment: investment.amount,
          winnerArtist: data.winnerArtist,
          loserArtist: data.loserArtist
        }
      });
    }
  }

  // Performance alert notification (for significant changes)
  async notifyPerformanceAlert(data: NotificationTriggerData & { 
    alertType: 'surge' | 'drop' | 'trending',
    description: string 
  }): Promise<void> {
    if (!data.projectId || !data.userId || !data.alertType) return;
    
    const project = await storage.getProject(data.projectId);
    if (!project) return;

    const alertIcons = {
      surge: '🚀',
      drop: '⚠️',
      trending: '📈'
    };

    await this.createAndSendNotification({
      userId: data.userId,
      projectId: data.projectId,
      type: 'performance_alert',
      title: `Alerte performance ${alertIcons[data.alertType]}`,
      message: data.description,
      priority: data.alertType === 'drop' ? 'high' : 'medium',
      data: { 
        projectTitle: project.title,
        alertType: data.alertType,
        description: data.description
      }
    });
  }

  // Generic notification method for direct notifications
  async notifyUser(userId: string, notification: {
    type: string;
    title: string;
    message: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    projectId?: string;
    data?: Record<string, any>;
  }): Promise<void> {
    await this.createAndSendNotification({
      userId,
      projectId: notification.projectId,
      type: notification.type as any, // Type assertion since it's a generic method
      title: notification.title,
      message: notification.message,
      priority: notification.priority || 'medium',
      data: notification.data
    });
  }
}

// Singleton instance
export const notificationService = new NotificationService();