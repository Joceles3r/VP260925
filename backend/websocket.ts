import { Server as SocketIOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import { getReplitUser, ensureUser } from './replitAuth';
import type { AuthUser, LiveUpdate, WebSocketMessage } from '@shared/types';

interface AuthenticatedSocket extends SocketIO.Socket {
  user?: AuthUser;
}

export class WebSocketService {
  private io: SocketIOServer;
  private connectedUsers = new Map<string, AuthUser>();

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    // Authentication middleware for WebSocket connections
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        // Get user info from handshake headers
        const replitUser = await getReplitUser({
          headers: socket.handshake.headers
        } as any);

        if (replitUser) {
          const user = await ensureUser(replitUser);
          socket.user = user;
          this.connectedUsers.set(socket.id, user);
        }

        next();
      } catch (error) {
        console.error('WebSocket authentication error:', error);
        next();
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`User connected: ${socket.user?.id || 'anonymous'} (${socket.id})`);

      // Join user-specific room for personal notifications
      if (socket.user) {
        socket.join(`user:${socket.user.id}`);
        
        // Join admin room if user is admin
        if (socket.user.isAdmin) {
          socket.join('admin');
        }
      }

      // Handle live show events
      socket.on('join-live-show', (showId: string) => {
        socket.join(`live-show:${showId}`);
        console.log(`User ${socket.user?.id || 'anonymous'} joined live show ${showId}`);
      });

      socket.on('leave-live-show', (showId: string) => {
        socket.leave(`live-show:${showId}`);
        console.log(`User ${socket.user?.id || 'anonymous'} left live show ${showId}`);
      });

      // Handle live investment during battles
      socket.on('live-investment', (data: { showId: string; artist: 'A' | 'B'; amount: number }) => {
        if (!socket.user) return;

        // Broadcast investment to all users in the live show
        this.broadcastToLiveShow(data.showId, {
          type: 'live-investment',
          data: {
            userId: socket.user.id,
            userName: `${socket.user.firstName} ${socket.user.lastName}`,
            artist: data.artist,
            amount: data.amount,
            timestamp: Date.now()
          }
        });
      });

      // Handle live votes
      socket.on('live-vote', (data: { projectId: string; votes: number }) => {
        if (!socket.user) return;

        this.broadcastToAll({
          type: 'live-vote',
          data: {
            projectId: data.projectId,
            userId: socket.user.id,
            votes: data.votes,
            timestamp: Date.now()
          }
        });
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.user?.id || 'anonymous'} (${socket.id})`);
        if (socket.user) {
          this.connectedUsers.delete(socket.id);
        }
      });
    });
  }

  // Broadcast to all connected clients
  public broadcastToAll(message: LiveUpdate) {
    this.io.emit('live-update', message);
  }

  // Broadcast to specific user
  public broadcastToUser(userId: string, message: WebSocketMessage) {
    this.io.to(`user:${userId}`).emit('notification', message);
  }

  // Broadcast to admin users
  public broadcastToAdmins(message: WebSocketMessage) {
    this.io.to('admin').emit('admin-notification', message);
  }

  // Broadcast to live show participants
  public broadcastToLiveShow(showId: string, message: LiveUpdate) {
    this.io.to(`live-show:${showId}`).emit('live-update', message);
  }

  // Send investment notification
  public notifyInvestment(projectId: string, investorName: string, amount: number) {
    this.broadcastToAll({
      type: 'investment',
      data: {
        projectId,
        investorName,
        amount,
        timestamp: Date.now()
      }
    });
  }

  // Send project status change notification
  public notifyProjectStatusChange(projectId: string, newStatus: string, projectTitle: string) {
    this.broadcastToAll({
      type: 'investment',
      data: {
        projectId,
        projectTitle,
        newStatus,
        timestamp: Date.now()
      }
    });
  }

  // Send battle result notification
  public notifyBattleResult(showId: string, winner: 'A' | 'B', artistA: string, artistB: string) {
    this.broadcastToLiveShow(showId, {
      type: 'battle_result',
      data: {
        showId,
        winner,
        artistA,
        artistB,
        timestamp: Date.now()
      }
    });
  }

  // Send content report notification to admins
  public notifyContentReport(reportId: string, contentType: string, reportType: string) {
    this.broadcastToAdmins({
      type: 'content_report',
      payload: {
        reportId,
        contentType,
        reportType,
        timestamp: Date.now()
      },
      timestamp: Date.now()
    });
  }

  // Get connected users count
  public getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  // Get connected users in live show
  public getLiveShowViewers(showId: string): number {
    const room = this.io.sockets.adapter.rooms.get(`live-show:${showId}`);
    return room ? room.size : 0;
  }

  // Get WebSocket server instance
  public getIO(): SocketIOServer {
    return this.io;
  }
}

// Singleton instance
let webSocketService: WebSocketService | null = null;

export function initializeWebSocket(server: HTTPServer): WebSocketService {
  if (!webSocketService) {
    webSocketService = new WebSocketService(server);
  }
  return webSocketService;
}

export function getWebSocketService(): WebSocketService | null {
  return webSocketService;
}