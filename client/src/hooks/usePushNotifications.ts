/**
 * Hook React pour gérer les Push Notifications PWA
 * Gère la permission, subscription et réception
 */

import { useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';

export interface PushSubscriptionInfo {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  requireInteraction?: boolean;
}

export const usePushNotifications = () => {
  const { toast } = useToast();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Vérifier le support des notifications
  useEffect(() => {
    const checkSupport = () => {
      const supported = 
        'Notification' in window &&
        'serviceWorker' in navigator &&
        'PushManager' in window;
      
      setIsSupported(supported);
      
      if (supported && Notification.permission) {
        setPermission(Notification.permission);
      }
    };

    checkSupport();
  }, []);

  // Vérifier la subscription existante
  useEffect(() => {
    const checkSubscription = async () => {
      if (!isSupported) return;

      try {
        const registration = await navigator.serviceWorker.ready;
        const existingSub = await registration.pushManager.getSubscription();
        
        if (existingSub) {
          setSubscription(existingSub);
          setIsSubscribed(true);
        }
      } catch (error) {
        console.error('[Push] Error checking subscription:', error);
      }
    };

    checkSubscription();
  }, [isSupported]);

  // Demander la permission
  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      toast({
        title: 'Non supporté',
        description: 'Les notifications push ne sont pas supportées par votre navigateur',
        variant: 'destructive',
      });
      return false;
    }

    setIsLoading(true);

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        toast({
          title: 'Permission accordée',
          description: 'Vous recevrez maintenant les notifications VISUAL',
        });
        return true;
      } else if (result === 'denied') {
        toast({
          title: 'Permission refusée',
          description: 'Vous ne recevrez pas de notifications',
          variant: 'destructive',
        });
        return false;
      }
      
      return false;
    } catch (error) {
      console.error('[Push] Error requesting permission:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de demander la permission',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, toast]);

  // S'abonner aux push notifications
  const subscribe = useCallback(async () => {
    if (!isSupported || permission !== 'granted') {
      if (permission === 'default') {
        const granted = await requestPermission();
        if (!granted) return null;
      } else {
        return null;
      }
    }

    setIsLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Récupérer la clé publique VAPID depuis le serveur
      const response = await fetch('/api/push/vapid-public-key');
      const { publicKey } = await response.json();

      // Créer la subscription
      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      // Envoyer la subscription au serveur
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: newSubscription.toJSON(),
        }),
      });

      setSubscription(newSubscription);
      setIsSubscribed(true);

      toast({
        title: 'Notifications activées',
        description: 'Vous recevrez les mises à jour en temps réel',
      });

      return newSubscription;
    } catch (error) {
      console.error('[Push] Error subscribing:', error);
      toast({
        title: 'Erreur d\'abonnement',
        description: 'Impossible d\'activer les notifications',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, permission, requestPermission, toast]);

  // Se désabonner
  const unsubscribe = useCallback(async () => {
    if (!subscription) return false;

    setIsLoading(true);

    try {
      // Désabonner du PushManager
      await subscription.unsubscribe();

      // Informer le serveur
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
        }),
      });

      setSubscription(null);
      setIsSubscribed(false);

      toast({
        title: 'Notifications désactivées',
        description: 'Vous ne recevrez plus de notifications push',
      });

      return true;
    } catch (error) {
      console.error('[Push] Error unsubscribing:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de désactiver les notifications',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [subscription, toast]);

  // Envoyer une notification test
  const sendTestNotification = useCallback(async () => {
    if (!isSubscribed || !subscription) {
      toast({
        title: 'Non abonné',
        description: 'Veuillez d\'abord vous abonner aux notifications',
        variant: 'destructive',
      });
      return;
    }

    try {
      await fetch('/api/push/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
        }),
      });

      toast({
        title: 'Notification envoyée',
        description: 'Vous devriez recevoir une notification test',
      });
    } catch (error) {
      console.error('[Push] Error sending test notification:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'envoyer la notification test',
        variant: 'destructive',
      });
    }
  }, [isSubscribed, subscription, toast]);

  return {
    // États
    permission,
    isSubscribed,
    subscription,
    isSupported,
    isLoading,
    
    // Actions
    requestPermission,
    subscribe,
    unsubscribe,
    sendTestNotification,
  };
};

// Utilitaire pour convertir la clé VAPID
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}
