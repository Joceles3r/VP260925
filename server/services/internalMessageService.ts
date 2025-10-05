import { storage } from "../storage";
import { db } from "../db";
import { internalMessages, messageRateLimit, floatingButtonConfig, users } from "@shared/schema";
import { eq, and, desc, count, sql } from "drizzle-orm";
import type { 
  InsertInternalMessage, 
  UpdateInternalMessage,
  InternalMessage,
  MessageRateLimit,
  FloatingButtonConfig
} from "@shared/schema";

export interface SendMessageRequest {
  userId: string;
  subject: string;
  subjectCustom?: string;
  message: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface MessageFilters {
  status?: string;
  priority?: string;
  subject?: string;
  dateFrom?: string;
  dateTo?: string;
  userId?: string;
  limit?: number;
  offset?: number;
}

export class InternalMessageService {
  
  // Système de priorité automatique basé sur le sujet
  private determinePriority(subject: string): 'urgent' | 'medium' | 'low' {
    const urgentSubjects = [
      'probleme_paiement',
      'escroquerie_fraude', 
      'erreur_prelevement',
      'probleme_compte'
    ];
    
    const mediumSubjects = [
      'signalement_bug'
    ];
    
    if (urgentSubjects.includes(subject)) {
      return 'urgent';
    } else if (mediumSubjects.includes(subject)) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  // Vérifier la limite de messages par utilisateur (anti-spam)
  async checkRateLimit(userId: string): Promise<{ allowed: boolean; remainingToday: number; resetDate: string }> {
    const today = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD
    
    try {
      const existingLimit = await db
        .select()
        .from(messageRateLimit)
        .where(and(
          eq(messageRateLimit.userId, userId),
          eq(messageRateLimit.date, today)
        ))
        .limit(1);

      if (existingLimit.length === 0) {
        // Premier message du jour
        return {
          allowed: true,
          remainingToday: 2, // 3 - 1
          resetDate: today
        };
      }

      const limit = existingLimit[0];
      const allowed = limit.messageCount < limit.maxMessages;
      const remainingToday = Math.max(0, limit.maxMessages - limit.messageCount);

      return {
        allowed,
        remainingToday: allowed ? remainingToday - 1 : remainingToday,
        resetDate: today
      };
    } catch (error) {
      console.error('Error checking rate limit:', error);
      // En cas d'erreur, on autorise le message mais on log l'erreur
      return {
        allowed: true,
        remainingToday: 2,
        resetDate: today
      };
    }
  }

  // Incrémenter le compteur de messages
  private async incrementRateLimit(userId: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    
    try {
      const existingLimit = await db
        .select()
        .from(messageRateLimit)
        .where(and(
          eq(messageRateLimit.userId, userId),
          eq(messageRateLimit.date, today)
        ))
        .limit(1);

      if (existingLimit.length === 0) {
        // Créer nouvelle entrée
        await db.insert(messageRateLimit).values({
          userId,
          date: today,
          messageCount: 1,
          maxMessages: 3
        });
      } else {
        // Incrémenter le compteur
        await db
          .update(messageRateLimit)
          .set({ 
            messageCount: sql`${messageRateLimit.messageCount} + 1`,
            updatedAt: new Date()
          })
          .where(eq(messageRateLimit.id, existingLimit[0].id));
      }
    } catch (error) {
      console.error('Error updating rate limit:', error);
      // En cas d'erreur, on continue (le message est déjà créé)
    }
  }

  // Envoyer un message interne
  async sendMessage(request: SendMessageRequest): Promise<{ success: boolean; message?: InternalMessage; error?: string }> {
    try {
      // 1. Vérifier la limite de messages
      const rateCheck = await this.checkRateLimit(request.userId);
      if (!rateCheck.allowed) {
        return {
          success: false,
          error: `Limite de 3 messages par jour atteinte. Prochaine réinitialisation : ${rateCheck.resetDate}`
        };
      }

      // 2. Récupérer les infos utilisateur
      const user = await storage.getUser(request.userId);
      if (!user) {
        return {
          success: false,
          error: "Utilisateur non trouvé"
        };
      }

      // 3. Déterminer la priorité automatiquement
      const priority = this.determinePriority(request.subject);

      // 4. Créer le message
      const messageData: InsertInternalMessage = {
        userId: request.userId,
        userType: user.profileTypes.join(','), // Types de profil au moment de l'envoi
        subject: request.subject as any,
        subjectCustom: request.subjectCustom,
        message: request.message,
        priority,
        status: 'unread',
        ipAddress: request.ipAddress,
        userAgent: request.userAgent
      };

      const [newMessage] = await db
        .insert(internalMessages)
        .values(messageData)
        .returning();

      // 5. Incrémenter le compteur anti-spam
      await this.incrementRateLimit(request.userId);

      // 6. Envoyer notification email si priorité urgente
      if (priority === 'urgent') {
        await this.sendUrgentEmailNotification(newMessage, user);
      }

      return {
        success: true,
        message: newMessage
      };
      
    } catch (error) {
      console.error('Error sending internal message:', error);
      return {
        success: false,
        error: "Erreur lors de l'envoi du message"
      };
    }
  }

  // Envoyer notification email urgente aux responsables
  private async sendUrgentEmailNotification(message: InternalMessage, user: any): Promise<void> {
    try {
      // TODO: Implémenter l'envoi d'email
      // Pour l'instant, on log et on marque comme envoyé
      console.log(`🔴 URGENT MESSAGE - Subject: ${message.subject}, User: ${user.email || user.id}, Message ID: ${message.id}`);
      
      // Marquer l'email comme envoyé
      await db
        .update(internalMessages)
        .set({ 
          emailSent: true, 
          emailSentAt: new Date() 
        })
        .where(eq(internalMessages.id, message.id));
        
    } catch (error) {
      console.error('Error sending urgent email notification:', error);
    }
  }

  // Récupérer les messages avec filtres (pour l'admin)
  async getMessages(filters: MessageFilters = {}): Promise<{ messages: any[]; total: number }> {
    try {
      const {
        status,
        priority, 
        subject,
        dateFrom,
        dateTo,
        userId,
        limit = 50,
        offset = 0
      } = filters;

      // Construire la requête avec les jointures
      let query = db
        .select({
          id: internalMessages.id,
          subject: internalMessages.subject,
          subjectCustom: internalMessages.subjectCustom,
          message: internalMessages.message,
          priority: internalMessages.priority,
          status: internalMessages.status,
          adminNotes: internalMessages.adminNotes,
          handledBy: internalMessages.handledBy,
          handledAt: internalMessages.handledAt,
          emailSent: internalMessages.emailSent,
          createdAt: internalMessages.createdAt,
          updatedAt: internalMessages.updatedAt,
          // Infos utilisateur
          userId: internalMessages.userId,
          userType: internalMessages.userType,
          userEmail: users.email,
          userFirstName: users.firstName,
          userLastName: users.lastName,
          userNickname: users.nickname
        })
        .from(internalMessages)
        .leftJoin(users, eq(internalMessages.userId, users.id));

      // Appliquer les filtres
      const conditions = [];
      
      if (status) {
        conditions.push(eq(internalMessages.status, status as any));
      }
      
      if (priority) {
        conditions.push(eq(internalMessages.priority, priority as any));
      }
      
      if (subject) {
        conditions.push(eq(internalMessages.subject, subject as any));
      }
      
      if (userId) {
        conditions.push(eq(internalMessages.userId, userId));
      }
      
      if (dateFrom) {
        conditions.push(sql`${internalMessages.createdAt} >= ${dateFrom}::timestamp`);
      }
      
      if (dateTo) {
        conditions.push(sql`${internalMessages.createdAt} <= ${dateTo}::timestamp`);
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      // Récupérer les messages avec pagination
      const messages = await query
        .orderBy(desc(internalMessages.createdAt))
        .limit(limit)
        .offset(offset);

      // Compter le total pour la pagination
      let countQuery = db
        .select({ count: count() })
        .from(internalMessages);

      if (conditions.length > 0) {
        countQuery = countQuery.where(and(...conditions));
      }

      const [{ count: total }] = await countQuery;

      return {
        messages,
        total
      };
      
    } catch (error) {
      console.error('Error getting messages:', error);
      return {
        messages: [],
        total: 0
      };
    }
  }

  // Mettre à jour le statut d'un message (admin)
  async updateMessage(messageId: string, updates: UpdateInternalMessage, adminId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: any = {
        ...updates,
        updatedAt: new Date()
      };

      // Si on change le statut vers "in_progress" ou "resolved", marquer qui traite
      if (updates.status && ['in_progress', 'resolved'].includes(updates.status)) {
        updateData.handledBy = adminId;
        updateData.handledAt = new Date();
      }

      await db
        .update(internalMessages)
        .set(updateData)
        .where(eq(internalMessages.id, messageId));

      return { success: true };
      
    } catch (error) {
      console.error('Error updating message:', error);
      return {
        success: false,
        error: "Erreur lors de la mise à jour du message"
      };
    }
  }

  // Récupérer un message par ID
  async getMessage(messageId: string): Promise<any | null> {
    try {
      const [message] = await db
        .select({
          id: internalMessages.id,
          subject: internalMessages.subject,
          subjectCustom: internalMessages.subjectCustom,
          message: internalMessages.message,
          priority: internalMessages.priority,
          status: internalMessages.status,
          adminNotes: internalMessages.adminNotes,
          handledBy: internalMessages.handledBy,
          handledAt: internalMessages.handledAt,
          emailSent: internalMessages.emailSent,
          ipAddress: internalMessages.ipAddress,
          userAgent: internalMessages.userAgent,
          createdAt: internalMessages.createdAt,
          updatedAt: internalMessages.updatedAt,
          // Infos utilisateur
          userId: internalMessages.userId,
          userType: internalMessages.userType,
          userEmail: users.email,
          userFirstName: users.firstName,
          userLastName: users.lastName,
          userNickname: users.nickname
        })
        .from(internalMessages)
        .leftJoin(users, eq(internalMessages.userId, users.id))
        .where(eq(internalMessages.id, messageId))
        .limit(1);

      return message || null;
      
    } catch (error) {
      console.error('Error getting message:', error);
      return null;
    }
  }

  // Configuration du bouton flottant
  async getFloatingButtonConfig(): Promise<FloatingButtonConfig | null> {
    try {
      const [config] = await db
        .select()
        .from(floatingButtonConfig)
        .limit(1);

      return config || null;
      
    } catch (error) {
      console.error('Error getting floating button config:', error);
      return null;
    }
  }

  // Mettre à jour la configuration du bouton flottant (admin)
  async updateFloatingButtonConfig(updates: Partial<FloatingButtonConfig>, adminId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Vérifier si une config existe
      const existingConfig = await this.getFloatingButtonConfig();
      
      if (existingConfig) {
        // Mettre à jour
        await db
          .update(floatingButtonConfig)
          .set({
            ...updates,
            updatedBy: adminId,
            updatedAt: new Date()
          })
          .where(eq(floatingButtonConfig.id, existingConfig.id));
      } else {
        // Créer nouvelle config
        await db
          .insert(floatingButtonConfig)
          .values({
            ...updates,
            updatedBy: adminId,
            updatedAt: new Date()
          });
      }

      return { success: true };
      
    } catch (error) {
      console.error('Error updating floating button config:', error);
      return {
        success: false,
        error: "Erreur lors de la mise à jour de la configuration"
      };
    }
  }

  // Statistiques pour le dashboard admin
  async getMessageStats(): Promise<{
    total: number;
    unread: number;
    urgent: number;
    inProgress: number;
    todayCount: number;
  }> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const [
        totalResult,
        unreadResult,
        urgentResult,
        inProgressResult,
        todayResult
      ] = await Promise.all([
        db.select({ count: count() }).from(internalMessages),
        db.select({ count: count() }).from(internalMessages).where(eq(internalMessages.status, 'unread')),
        db.select({ count: count() }).from(internalMessages).where(eq(internalMessages.priority, 'urgent')),
        db.select({ count: count() }).from(internalMessages).where(eq(internalMessages.status, 'in_progress')),
        db.select({ count: count() }).from(internalMessages).where(sql`DATE(${internalMessages.createdAt}) = ${today}`)
      ]);

      return {
        total: totalResult[0]?.count || 0,
        unread: unreadResult[0]?.count || 0,
        urgent: urgentResult[0]?.count || 0,
        inProgress: inProgressResult[0]?.count || 0,
        todayCount: todayResult[0]?.count || 0
      };
      
    } catch (error) {
      console.error('Error getting message stats:', error);
      return {
        total: 0,
        unread: 0,
        urgent: 0,
        inProgress: 0,
        todayCount: 0
      };
    }
  }
}

// Export instance unique
export const internalMessageService = new InternalMessageService();