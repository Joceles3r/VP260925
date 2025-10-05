import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Bell, 
  Calendar, 
  AlertCircle, 
  Gift, 
  Star, 
  Clock,
  CheckCircle,
  X
} from 'lucide-react';
import { useMinorNotifications } from '@/hooks/useMinorVisitor';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface MinorNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  triggerDate?: string;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'cap_warning_80':
      return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    case 'cap_reached':
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    case 'majority_reminder':
      return <Calendar className="h-5 w-5 text-blue-500" />;
    case 'lock_expired':
      return <Gift className="h-5 w-5 text-green-500" />;
    default:
      return <Bell className="h-5 w-5 text-muted-foreground" />;
  }
};

const getNotificationStyle = (type: string, isRead: boolean) => {
  const opacity = isRead ? 'opacity-60' : '';
  
  switch (type) {
    case 'cap_warning_80':
      return `border-l-4 border-l-yellow-400 bg-yellow-50 ${opacity}`;
    case 'cap_reached':
      return `border-l-4 border-l-red-400 bg-red-50 ${opacity}`;
    case 'majority_reminder':
      return `border-l-4 border-l-blue-400 bg-blue-50 ${opacity}`;
    case 'lock_expired':
      return `border-l-4 border-l-green-400 bg-green-50 ${opacity}`;
    default:
      return `border-l-4 border-l-gray-400 bg-gray-50 ${opacity}`;
  }
};

const getNotificationPriority = (type: string) => {
  switch (type) {
    case 'cap_reached':
    case 'lock_expired':
      return { level: 'high', color: 'bg-red-100 text-red-800' };
    case 'cap_warning_80':
    case 'majority_reminder':
      return { level: 'medium', color: 'bg-yellow-100 text-yellow-800' };
    default:
      return { level: 'low', color: 'bg-blue-100 text-blue-800' };
  }
};

const MinorNotificationCenter: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { data: notifications = [], isLoading } = useMinorNotifications();
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  const activeNotifications = notifications.filter(n => !dismissedIds.includes(n.id));
  const unreadCount = activeNotifications.filter(n => !n.isRead).length;

  const handleDismiss = (notificationId: string) => {
    setDismissedIds(prev => [...prev, notificationId]);
  };

  const handleMarkAsRead = (notificationId: string) => {
    // TODO: Implémenter l'API pour marquer comme lu
    console.log('Mark as read:', notificationId);
  };

  if (isLoading) {
    return (
      <Card className={compact ? "bg-muted/30" : ""}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
            <span className="text-sm text-muted-foreground">Chargement des notifications...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    // Version compacte pour le tableau de bord
    return (
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-blue-600" />
              Notifications
            </div>
            {unreadCount > 0 && (
              <Badge className="bg-red-500 text-white text-xs">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {activeNotifications.length === 0 ? (
            <div className="text-center py-4">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Aucune notification</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activeNotifications.slice(0, 3).map((notification) => (
                <div 
                  key={notification.id}
                  className={`p-2 rounded-lg text-sm ${getNotificationStyle(notification.type, notification.isRead)}`}
                >
                  <div className="flex items-start gap-2">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{notification.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {notification.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {activeNotifications.length > 3 && (
                <Button variant="ghost" size="sm" className="w-full">
                  Voir toutes ({activeNotifications.length})
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
          <Bell className="h-5 w-5 text-blue-500" />
          Centre de notifications
          {unreadCount > 0 && (
            <Badge className="bg-red-500 text-white">
              {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeNotifications.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <h3 className="font-medium mb-1">Aucune notification</h3>
            <p className="text-sm text-muted-foreground">
              Tu es à jour avec toutes tes notifications !
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeNotifications.map((notification) => {
              const priority = getNotificationPriority(notification.type);
              
              return (
                <div 
                  key={notification.id}
                  className={`p-4 rounded-lg ${getNotificationStyle(notification.type, notification.isRead)}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      {getNotificationIcon(notification.type)}
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{notification.title}</h4>
                          <Badge className={priority.color}>
                            {priority.level === 'high' ? 'Urgent' : 
                             priority.level === 'medium' ? 'Important' : 'Info'}
                          </Badge>
                          {!notification.isRead && (
                            <Badge variant="outline" className="bg-blue-100 text-blue-800">
                              Nouveau
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Il y a {formatDistanceToNow(new Date(notification.createdAt), { locale: fr })}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-1">
                      {!notification.isRead && (
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          Marquer comme lu
                        </Button>
                      )}
                      
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleDismiss(notification.id)}
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
        {activeNotifications.length > 0 && (
          <div className="flex justify-between pt-4 border-t">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                // TODO: Marquer toutes comme lues
                console.log('Mark all as read');
              }}
            >
              Marquer toutes comme lues
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setDismissedIds(activeNotifications.map(n => n.id))}
            >
              Tout supprimer
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MinorNotificationCenter;