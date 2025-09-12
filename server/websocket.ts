import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import type { Express } from 'express';
import type { Notification } from '@shared/schema';
import session from 'express-session';
import { storage } from './storage';

interface AuthenticatedSocket {
  userId?: string;
  join(room: string): void;
  emit(event: string, data: any): void;
  disconnect(): void;
}

class NotificationWebSocketService {
  private io: SocketIOServer;
  private connectedUsers: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds

  constructor(server: any, sessionMiddleware: any) {
    console.log('[WebSocket] Creating Socket.IO server...');
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? [process.env.REPLIT_DOMAIN || 'https://visual.replit.app']
          : ['http://localhost:5000', 'http://127.0.0.1:5000'],
        methods: ["GET", "POST"],
        credentials: true
      },
      path: "/socket.io/"
    });

    // Enable session middleware for Socket.IO
    const wrap = (middleware: any) => (socket: any, next: any) => middleware(socket.request, {}, next);
    this.io.use(wrap(sessionMiddleware));

    this.setupConnection();
    console.log('[WebSocket] Socket.IO server ready and listening for connections');
  }

  private setupConnection() {
    this.io.on('connection', (socket: any) => {
      console.log(`[WebSocket] Socket connected: ${socket.id}`);

      // Handle user authentication - verify session instead of trusting client
      socket.on('authenticate', async () => {
        try {
          const session = (socket.request as any).session;
          
          if (!session || !session.passport || !session.passport.user || !session.passport.user.claims) {
            console.log(`[WebSocket] Authentication failed for socket ${socket.id}: No valid session found`);
            console.log(`[WebSocket] Session structure:`, session ? Object.keys(session) : 'null');
            socket.emit('authentication-error', { error: 'No valid session found' });
            socket.disconnect();
            return;
          }

          const userId = session.passport.user.claims.sub;
          socket.userId = userId;
          
          // Track this user's connection
          if (!this.connectedUsers.has(userId)) {
            this.connectedUsers.set(userId, new Set());
          }
          this.connectedUsers.get(userId)!.add(socket.id);
          
          // Join user-specific room for targeted notifications
          socket.join(`user:${userId}`);
          
          console.log(`[WebSocket] User ${userId} authenticated via session and joined room`);
          
          socket.emit('authenticated', { success: true, userId });
        } catch (error) {
          console.error(`Authentication error for socket ${socket.id}:`, error);
          socket.emit('authentication-error', { error: 'Authentication failed' });
          socket.disconnect();
        }
      });

      // Handle joining project-specific rooms for project updates
      socket.on('subscribe-project', (data: { projectId: string }) => {
        if (socket.userId && data.projectId) {
          socket.join(`project:${data.projectId}`);
          console.log(`[WebSocket] User ${socket.userId} subscribed to project ${data.projectId}`);
        }
      });

      // Handle unsubscribing from project updates
      socket.on('unsubscribe-project', (data: { projectId: string }) => {
        if (data.projectId) {
          socket.leave(`project:${data.projectId}`);
          console.log(`[WebSocket] User ${socket.userId} unsubscribed from project ${data.projectId}`);
        }
      });

      // Handle mark notification as read
      socket.on('mark-notification-read', (data: { notificationId: string }) => {
        // This will be implemented when we add the notification service
        console.log(`Marking notification ${data.notificationId} as read for user ${socket.userId}`);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`[WebSocket] Socket disconnected: ${socket.id}`);
        
        if (socket.userId) {
          const userSockets = this.connectedUsers.get(socket.userId);
          if (userSockets) {
            userSockets.delete(socket.id);
            if (userSockets.size === 0) {
              this.connectedUsers.delete(socket.userId);
            }
          }
        }
      });
    });
  }

  // Send notification to a specific user
  public sendNotificationToUser(userId: string, notification: Notification) {
    this.io.to(`user:${userId}`).emit('notification', {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      priority: notification.priority,
      projectId: notification.projectId,
      data: notification.data,
      createdAt: notification.createdAt,
      isRead: notification.isRead
    });
  }

  // Send project update to all subscribers of a project
  public sendProjectUpdate(projectId: string, update: any) {
    this.io.to(`project:${projectId}`).emit('project-update', {
      projectId,
      ...update
    });
  }

  // Send live show update to all connected users
  public sendLiveShowUpdate(liveShowId: string, update: any) {
    this.io.emit('live-show-update', {
      liveShowId,
      ...update
    });
  }

  // Send system-wide announcement
  public sendSystemAnnouncement(announcement: any) {
    this.io.emit('system-announcement', announcement);
  }

  // Get connected users count
  public getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  // Check if user is connected
  public isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  // Get WebSocket server instance
  public getIO(): SocketIOServer {
    return this.io;
  }
}

// Singleton instance
let notificationService: NotificationWebSocketService | null = null;

export function initializeWebSocket(server: any, sessionMiddleware: any): NotificationWebSocketService {
  if (!notificationService) {
    notificationService = new NotificationWebSocketService(server, sessionMiddleware);
  }
  return notificationService;
}

export function getNotificationService(): NotificationWebSocketService {
  if (!notificationService) {
    throw new Error('WebSocket service not initialized. Call initializeWebSocket first.');
  }
  return notificationService;
}

export { NotificationWebSocketService };