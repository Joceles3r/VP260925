import { useState } from 'react';
import { Bell, X, Check, AlertCircle, TrendingUp, Target, Award, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Notification } from '@shared/schema';

// Notification type icons mapping
const getNotificationIcon = (type: string) => {
  const icons = {
    'new_investment': Users,
    'investment_milestone': Target,
    'funding_goal_reached': Award,
    'project_status_change': AlertCircle,
    'roi_update': TrendingUp,
    'live_show_started': Bell,
    'battle_result': Award,
    'performance_alert': TrendingUp,
  };
  
  const IconComponent = icons[type as keyof typeof icons] || Bell;
  return <IconComponent className="h-4 w-4" />;
};

// Priority color mapping
const getPriorityColor = (priority: string) => {
  const colors = {
    'low': 'text-muted-foreground',
    'medium': 'text-blue-600 dark:text-blue-400',
    'high': 'text-orange-600 dark:text-orange-400',
    'urgent': 'text-red-600 dark:text-red-400',
  };
  
  return colors[priority as keyof typeof colors] || colors.medium;
};

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}

function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMarkAsRead(notification.id);
  };

  const timeAgo = formatDistanceToNow(new Date(notification.createdAt!), {
    addSuffix: true,
    locale: fr
  });

  return (
    <div 
      className={`flex items-start gap-3 p-4 border-b border-border hover:bg-muted/50 transition-colors ${
        !notification.isRead ? 'bg-primary/5' : ''
      }`}
      data-testid={`notification-${notification.id}`}
    >
      <div className={`flex-shrink-0 mt-1 ${getPriorityColor(notification.priority || 'medium')}`}>
        {getNotificationIcon(notification.type)}
      </div>
      
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-foreground">{notification.title}</h4>
          {!notification.isRead && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAsRead}
              className="h-6 w-6 p-0"
              data-testid="mark-read-button"
            >
              <Check className="h-3 w-3" />
            </Button>
          )}
        </div>
        
        <p className="text-sm text-muted-foreground leading-relaxed">
          {notification.message}
        </p>
        
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
          
          <div className="flex items-center gap-2">
            {!notification.isRead && (
              <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                Nouveau
              </Badge>
            )}
            
            {notification.priority === 'high' && (
              <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                Important
              </Badge>
            )}
            
            {notification.priority === 'urgent' && (
              <Badge variant="destructive" className="h-5 px-1.5 text-xs animate-pulse">
                Urgent
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NotificationPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const { 
    notifications, 
    unreadCount, 
    isConnected, 
    isLoading, 
    markAsRead, 
    markAllAsRead 
  } = useNotifications();

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="relative"
          data-testid="notification-trigger"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
              data-testid="notification-badge"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-96 p-0"
        align="end"
        data-testid="notification-panel"
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <h3 className="font-medium">Notifications</h3>
            {isConnected ? (
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-muted-foreground">En ligne</span>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 bg-red-500 rounded-full" />
                <span className="text-xs text-muted-foreground">Hors ligne</span>
              </div>
            )}
          </div>
          
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleMarkAllAsRead}
              data-testid="mark-all-read-button"
            >
              Tout marquer comme lu
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-96">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Chargement...</p>
              </div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Aucune notification</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Vous serez notifié ici des mises à jour importantes
                </p>
              </div>
            </div>
          ) : (
            <div data-testid="notification-list">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                />
              ))}
            </div>
          )}
        </ScrollArea>
        
        {notifications.length > 10 && (
          <div className="p-4 border-t border-border">
            <Button variant="outline" size="sm" className="w-full">
              Voir toutes les notifications
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}