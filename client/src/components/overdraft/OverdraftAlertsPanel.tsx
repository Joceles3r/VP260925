import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Bell, 
  AlertTriangle, 
  AlertCircle, 
  XCircle,
  Clock, 
  CheckCircle,
  Eye,
  X,
  Mail,
  Smartphone,
  Settings
} from 'lucide-react';
import { useOverdraftAlerts, useMarkAlertAsRead, useOverdraftFormatters } from '@/hooks/useOverdraft';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface OverdraftAlert {
  id: string;
  alertType: 'warning' | 'critical' | 'blocked';
  overdraftAmount: number;
  limitAmount: number;
  message: string;
  isRead: boolean;
  emailSent?: boolean;
  smsSent?: boolean;
  pushSent?: boolean;
  createdAt: string;
}

const OverdraftAlertsPanel: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { data: alerts = [], isLoading, error } = useOverdraftAlerts();
  const markAsRead = useMarkAlertAsRead();
  const { formatAmount } = useOverdraftFormatters();
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  const activeAlerts = alerts.filter(alert => !dismissedIds.includes(alert.id));
  const unreadCount = activeAlerts.filter(alert => !alert.isRead).length;

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      case 'blocked':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getAlertStyle = (type: string, isRead: boolean) => {
    const opacity = isRead ? 'opacity-70' : '';
    
    switch (type) {
      case 'warning':
        return `border-l-4 border-l-yellow-400 bg-yellow-50 ${opacity}`;
      case 'critical':
        return `border-l-4 border-l-orange-400 bg-orange-50 ${opacity}`;
      case 'blocked':
        return `border-l-4 border-l-red-400 bg-red-50 ${opacity}`;
      default:
        return `border-l-4 border-l-gray-400 bg-gray-50 ${opacity}`;
    }
  };

  const getAlertPriority = (type: string) => {
    switch (type) {
      case 'blocked':
        return { level: 'urgent', color: 'bg-red-500 text-white' };
      case 'critical':
        return { level: 'élevé', color: 'bg-orange-500 text-white' };
      case 'warning':
        return { level: 'moyen', color: 'bg-yellow-500 text-white' };
      default:
        return { level: 'info', color: 'bg-blue-500 text-white' };
    }
  };

  const handleMarkAsRead = async (alertId: string) => {
    try {
      await markAsRead.mutateAsync(alertId);
    } catch (error) {
      console.error('Erreur lors du marquage comme lu:', error);
    }
  };

  const handleDismiss = (alertId: string) => {
    setDismissedIds(prev => [...prev, alertId]);
  };

  if (isLoading) {
    return (
      <Card className={compact ? "bg-muted/30" : ""}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
            <span className="text-sm text-muted-foreground">Chargement des alertes...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={compact ? "bg-muted/30" : ""}>
        <CardContent className="p-4">
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-700">
              Impossible de charger les alertes de découvert. Veuillez réessayer.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    // Version compacte pour le tableau de bord
    return (
      <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-orange-600" />
              Alertes Découvert
            </div>
            {unreadCount > 0 && (
              <Badge className="bg-red-500 text-white text-xs">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {activeAlerts.length === 0 ? (
            <div className="text-center py-4">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Aucune alerte active</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activeAlerts.slice(0, 2).map((alert) => (
                <div 
                  key={alert.id}
                  className={`p-2 rounded-lg text-sm ${getAlertStyle(alert.alertType, alert.isRead)}`}
                >
                  <div className="flex items-start gap-2">
                    {getAlertIcon(alert.alertType)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        Découvert: {formatAmount(alert.overdraftAmount)}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {alert.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {activeAlerts.length > 2 && (
                <Button variant="ghost" size="sm" className="w-full">
                  Voir toutes ({activeAlerts.length})
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Version complète
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-orange-500" />
          Alertes de découvert
          {unreadCount > 0 && (
            <Badge className="bg-red-500 text-white">
              {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Notifications concernant votre découvert de solde et vos limites
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeAlerts.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <h3 className="font-medium mb-1">Aucune alerte de découvert</h3>
            <p className="text-sm text-muted-foreground">
              Votre situation financière ne nécessite aucune attention particulière.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeAlerts.map((alert) => {
              const priority = getAlertPriority(alert.alertType);
              
              return (
                <div 
                  key={alert.id}
                  className={`p-4 rounded-lg ${getAlertStyle(alert.alertType, alert.isRead)}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      {getAlertIcon(alert.alertType)}
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">
                            Découvert: {formatAmount(alert.overdraftAmount)}
                          </h4>
                          <Badge className={priority.color}>
                            {priority.level}
                          </Badge>
                          {!alert.isRead && (
                            <Badge variant="outline" className="bg-blue-100 text-blue-800">
                              Nouveau
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2">
                          {alert.message}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Il y a {formatDistanceToNow(new Date(alert.createdAt), { locale: fr })}
                          </div>
                          
                          <div className="flex items-center gap-1">
                            Limite: {formatAmount(alert.limitAmount)}
                          </div>
                        </div>

                        {/* Statut des notifications */}
                        <div className="flex items-center gap-3 mt-2 text-xs">
                          <div className={`flex items-center gap-1 ${alert.emailSent ? 'text-green-600' : 'text-muted-foreground'}`}>
                            <Mail className="h-3 w-3" />
                            Email {alert.emailSent ? '✓' : '×'}
                          </div>
                          <div className={`flex items-center gap-1 ${alert.smsSent ? 'text-green-600' : 'text-muted-foreground'}`}>
                            <Smartphone className="h-3 w-3" />
                            SMS {alert.smsSent ? '✓' : '×'}
                          </div>
                          <div className={`flex items-center gap-1 ${alert.pushSent ? 'text-green-600' : 'text-muted-foreground'}`}>
                            <Bell className="h-3 w-3" />
                            Push {alert.pushSent ? '✓' : '×'}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-1">
                      {!alert.isRead && (
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleMarkAsRead(alert.id)}
                          disabled={markAsRead.isPending}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleDismiss(alert.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Actions globales */}
        {activeAlerts.length > 0 && (
          <div className="flex justify-between pt-4 border-t">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                // Marquer toutes comme lues
                activeAlerts.filter(a => !a.isRead).forEach(alert => {
                  handleMarkAsRead(alert.id);
                });
              }}
              disabled={markAsRead.isPending}
            >
              Marquer toutes comme lues
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setDismissedIds(activeAlerts.map(a => a.id))}
            >
              Tout supprimer
            </Button>
          </div>
        )}

        {/* Lien vers configuration */}
        <div className="pt-4 border-t">
          <Button variant="outline" size="sm" className="w-full">
            <Settings className="h-4 w-4 mr-2" />
            Configurer mes alertes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default OverdraftAlertsPanel;