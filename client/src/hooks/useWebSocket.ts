import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './useAuth';
import type { WebSocketMessage, LiveUpdate } from '@shared/types';

interface WebSocketState {
  isConnected: boolean;
  lastMessage: WebSocketMessage | null;
  lastLiveUpdate: LiveUpdate | null;
  error: string | null;
}

export function useWebSocket() {
  const { isAuthenticated, user } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    lastMessage: null,
    lastLiveUpdate: null,
    error: null,
  });

  const connect = useCallback(() => {
    if (!isAuthenticated || socketRef.current?.connected) {
      return;
    }

    try {
      socketRef.current = io({
        autoConnect: true,
        transports: ['websocket', 'polling'],
      });

      const socket = socketRef.current;

      socket.on('connect', () => {
        console.log('WebSocket connected');
        setState(prev => ({ ...prev, isConnected: true, error: null }));
      });

      socket.on('disconnect', () => {
        console.log('WebSocket disconnected');
        setState(prev => ({ ...prev, isConnected: false }));
      });

      socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        setState(prev => ({ ...prev, error: error.message, isConnected: false }));
      });

      // Handle notifications
      socket.on('notification', (message: WebSocketMessage) => {
        setState(prev => ({ ...prev, lastMessage: message }));
      });

      // Handle live updates
      socket.on('live-update', (update: LiveUpdate) => {
        setState(prev => ({ ...prev, lastLiveUpdate: update }));
      });

      // Handle admin notifications (if user is admin)
      if (user?.isAdmin) {
        socket.on('admin-notification', (message: WebSocketMessage) => {
          setState(prev => ({ ...prev, lastMessage: message }));
        });
      }

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Connection failed',
        isConnected: false 
      }));
    }
  }, [isAuthenticated, user?.isAdmin]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setState(prev => ({ ...prev, isConnected: false }));
    }
  }, []);

  // Join live show room
  const joinLiveShow = useCallback((showId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join-live-show', showId);
    }
  }, []);

  // Leave live show room
  const leaveLiveShow = useCallback((showId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave-live-show', showId);
    }
  }, []);

  // Send live investment
  const sendLiveInvestment = useCallback((data: {
    showId: string;
    artist: 'A' | 'B';
    amount: number;
  }) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('live-investment', data);
    }
  }, []);

  // Send live vote
  const sendLiveVote = useCallback((data: {
    projectId: string;
    votes: number;
  }) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('live-vote', data);
    }
  }, []);

  // Connect when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [isAuthenticated, connect, disconnect]);

  return {
    ...state,
    connect,
    disconnect,
    joinLiveShow,
    leaveLiveShow,
    sendLiveInvestment,
    sendLiveVote,
  };
}

// Hook for specific live update types
export function useLiveUpdates(type?: string) {
  const { lastLiveUpdate } = useWebSocket();
  const [updates, setUpdates] = useState<LiveUpdate[]>([]);

  useEffect(() => {
    if (lastLiveUpdate && (!type || lastLiveUpdate.type === type)) {
      setUpdates(prev => [lastLiveUpdate, ...prev.slice(0, 49)]); // Keep last 50 updates
    }
  }, [lastLiveUpdate, type]);

  return updates;
}

// Hook for notifications
export function useNotifications() {
  const { lastMessage } = useWebSocket();
  const [notifications, setNotifications] = useState<WebSocketMessage[]>([]);

  useEffect(() => {
    if (lastMessage) {
      setNotifications(prev => [lastMessage, ...prev.slice(0, 19)]); // Keep last 20 notifications
    }
  }, [lastMessage]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    clearNotifications,
    unreadCount: notifications.length,
  };
}