import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import type { Notification } from '@shared/schema';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
}

export function useNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Fetch notifications from API
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds as fallback
  });

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Initialize WebSocket connection
  useEffect(() => {
    if (!user) return;

    const newSocket = io({
      path: '/socket.io/',
      autoConnect: false,
      withCredentials: true, // Important: send cookies for session auth
    });

    newSocket.on('connect', () => {
      console.log('Connected to notification service');
      setIsConnected(true);
      
      // Authenticate using session (no need to send userId - server will get it from session)
      newSocket.emit('authenticate');
    });

    newSocket.on('authenticated', (data) => {
      console.log('Authenticated with notification service:', data);
    });

    newSocket.on('authentication-error', (error) => {
      console.error('Authentication failed:', error);
      setIsConnected(false);
      toast({
        title: 'Erreur de connexion',
        description: 'Impossible de se connecter aux notifications en temps réel. Veuillez recharger la page.',
        variant: 'destructive',
        duration: 8000,
      });
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from notification service');
      setIsConnected(false);
    });

    // Listen for new notifications
    newSocket.on('notification', (notification: Notification) => {
      console.log('New notification received:', notification);
      
      // Update the notifications query cache
      queryClient.setQueryData<Notification[]>(['/api/notifications'], (oldData) => {
        return [notification, ...(oldData || [])];
      });

      // Show toast notification
      toast({
        title: notification.title,
        description: notification.message,
        duration: notification.priority === 'high' ? 8000 : 5000,
      });
    });

    // Listen for project updates
    newSocket.on('project-update', (update) => {
      console.log('Project update received:', update);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      queryClient.invalidateQueries({ queryKey: ['/api/projects', update.projectId] });
    });

    // Listen for live show updates
    newSocket.on('live-show-update', (update) => {
      console.log('Live show update received:', update);
      
      // Invalidate live shows queries
      queryClient.invalidateQueries({ queryKey: ['/api/live-shows'] });
    });

    // Listen for system announcements
    newSocket.on('system-announcement', (announcement) => {
      console.log('System announcement received:', announcement);
      
      toast({
        title: announcement.title,
        description: announcement.message,
        duration: 10000,
      });
    });

    newSocket.connect();
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [user, toast, queryClient]);

  // Subscribe to project updates
  const subscribeToProject = useCallback((projectId: string) => {
    if (socket && isConnected) {
      socket.emit('subscribe-project', { projectId });
    }
  }, [socket, isConnected]);

  // Unsubscribe from project updates
  const unsubscribeFromProject = useCallback((projectId: string) => {
    if (socket && isConnected) {
      socket.emit('unsubscribe-project', { projectId });
    }
  }, [socket, isConnected]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Update local cache
        queryClient.setQueryData<Notification[]>(['/api/notifications'], (oldData) => {
          return oldData?.map(n => 
            n.id === notificationId ? { ...n, isRead: true } : n
          ) || [];
        });

        // Emit to WebSocket for real-time update
        if (socket) {
          socket.emit('mark-notification-read', { notificationId });
        }
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [queryClient, socket]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    const unreadNotifications = notifications.filter(n => !n.isRead);
    
    for (const notification of unreadNotifications) {
      await markAsRead(notification.id);
    }
  }, [notifications, markAsRead]);

  return {
    notifications,
    unreadCount,
    isConnected,
    isLoading,
    subscribeToProject,
    unsubscribeFromProject,
    markAsRead,
    markAllAsRead,
  };
}