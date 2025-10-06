/**
 * Composant pour gérer les paramètres de Push Notifications
 * Interface utilisateur pour activer/désactiver les notifications
 */

import React from 'react';
import { Bell, BellOff, Check, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export default function PushNotificationSettings() {
  const {
    permission,
    isSubscribed,
    isSupported,
    isLoading,
    requestPermission,
    subscribe,
    unsubscribe,
    sendTestNotification,
  } = usePushNotifications();

  // Affichage si non supporté
  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Notifications Push
          </CardTitle>
          <CardDescription>
            Recevez des alertes en temps réel pour vos investissements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Les notifications push ne sont pas supportées par votre navigateur.
              Veuillez utiliser un navigateur moderne (Chrome, Firefox, Edge, Safari 16+).
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Gestion du toggle
  const handleToggle = async (checked: boolean) => {
    if (checked) {
      if (permission === 'default') {
        await requestPermission();
      }
      if (permission === 'granted' || (await requestPermission())) {
        await subscribe();
      }
    } else {
      await unsubscribe();
    }
  };

  return (
    <Card data-testid="push-notification-settings">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          Notifications Push
        </CardTitle>
        <CardDescription>
          Recevez des alertes en temps réel pour vos investissements, lives et activités
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Statut de la permission */}
        <div className="space-y-2">
          <Label>Statut</Label>
          <div className="flex items-center gap-2">
            {permission === 'granted' && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Check className="h-4 w-4" />
                Permission accordée
              </div>
            )}
            {permission === 'denied' && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Permission refusée. Veuillez activer les notifications dans les paramètres de votre navigateur.
                </AlertDescription>
              </Alert>
            )}
            {permission === 'default' && (
              <div className="text-sm text-muted-foreground">
                Permission non demandée
              </div>
            )}
          </div>
        </div>

        {/* Toggle principal */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="push-enabled">
              Activer les notifications
            </Label>
            <p className="text-sm text-muted-foreground">
              {isSubscribed ? 'Vous recevez les notifications' : 'Activez pour recevoir les alertes'}
            </p>
          </div>
          <Switch
            id="push-enabled"
            checked={isSubscribed}
            onCheckedChange={handleToggle}
            disabled={isLoading || permission === 'denied'}
            data-testid="push-toggle"
          />
        </div>

        {/* Types de notifications */}
        {isSubscribed && (
          <div className="space-y-4 border-t pt-4">
            <Label>Types de notifications</Label>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">💰</span>
                  <span className="text-sm">Investissements et ROI</span>
                </div>
                <Switch defaultChecked disabled={isLoading} />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🔴</span>
                  <span className="text-sm">Lives et événements</span>
                </div>
                <Switch defaultChecked disabled={isLoading} />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">💬</span>
                  <span className="text-sm">Activité sociale</span>
                </div>
                <Switch defaultChecked disabled={isLoading} />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">⚠️</span>
                  <span className="text-sm">Alertes importantes</span>
                </div>
                <Switch defaultChecked disabled={isLoading} />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">⭐</span>
                  <span className="text-sm">Bonus VISUpoints</span>
                </div>
                <Switch defaultChecked disabled={isLoading} />
              </div>
            </div>
          </div>
        )}

        {/* Bouton de test */}
        {isSubscribed && (
          <div className="border-t pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={sendTestNotification}
              disabled={isLoading}
              className="w-full"
              data-testid="test-notification-btn"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Bell className="mr-2 h-4 w-4" />
                  Envoyer une notification test
                </>
              )}
            </Button>
          </div>
        )}

        {/* Informations complémentaires */}
        <div className="text-xs text-muted-foreground space-y-1 border-t pt-4">
          <p>💡 Les notifications sont envoyées même si VISUAL est fermé</p>
          <p>🔒 Vos données de notification restent privées et sécurisées</p>
          <p>📱 Disponible sur desktop et mobile (Chrome, Firefox, Edge, Safari 16+)</p>
        </div>
      </CardContent>
    </Card>
  );
}
