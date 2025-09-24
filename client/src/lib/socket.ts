import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

/**
 * Récupère l'instance singleton du socket WebSocket
 * Se connecte automatiquement au serveur sur le même origin
 */
export function getSocket(): Socket {
  if (!socket) {
    // Connexion au serveur sur le même origin
    const serverUrl = window.location.origin;
    
    socket = io(serverUrl, {
      // Réessayer automatiquement en cas de déconnexion
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      
      // Options d'authentification si nécessaire
      transports: ['websocket', 'polling'],
      
      // Headers personnalisés si besoin d'auth
      // auth: {
      //   token: localStorage.getItem('auth_token')
      // }
    });

    // Logs de connexion pour debug
    socket.on('connect', () => {
      console.log('[Socket] Connecté au serveur WebSocket:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Déconnecté du serveur WebSocket:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('[Socket] Erreur de connexion WebSocket:', error);
    });

    // Écouter les événements système de base
    socket.on('user_connected', (data) => {
      console.log('[Socket] Utilisateur connecté:', data);
    });

    socket.on('user_disconnected', (data) => {
      console.log('[Socket] Utilisateur déconnecté:', data);
    });
  }

  return socket;
}

/**
 * Ferme la connexion socket de manière propre
 * Utilisé lors du démontage de l'application
 */
export function closeSocket(): void {
  if (socket) {
    console.log('[Socket] Fermeture de la connexion WebSocket');
    socket.disconnect();
    socket = null;
  }
}

/**
 * Vérifie si le socket est connecté
 */
export function isSocketConnected(): boolean {
  return socket?.connected ?? false;
}

/**
 * Envoie un événement via le socket avec gestion d'erreur
 */
export function emitSocketEvent(eventName: string, data?: any): boolean {
  if (!socket || !socket.connected) {
    console.warn('[Socket] Tentative d\'envoi d\'événement sur socket déconnecté:', eventName);
    return false;
  }

  try {
    socket.emit(eventName, data);
    return true;
  } catch (error) {
    console.error('[Socket] Erreur lors de l\'envoi d\'événement:', eventName, error);
    return false;
  }
}