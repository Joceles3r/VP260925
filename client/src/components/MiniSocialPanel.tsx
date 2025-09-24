import { useState, useEffect, useCallback } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription
} from '@/components/ui/drawer';
// Note: Sidebar UI imports removed as we use custom fixed panel for desktop
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { 
  MessageSquare, 
  X, 
  ChevronRight, 
  ChevronLeft,
  Users,
  Eye,
  Send,
  Clock,
  AlertCircle,
  Star
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MINI_SOCIAL_CONFIG } from '@shared/constants';

export type MiniSocialPanelProps = {
  // État principal - contrôle externe
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  
  // Configuration principale
  autoshow?: boolean;
  position?: 'sidebar' | 'drawer' | 'auto';
  defaultState?: 'expanded' | 'collapsed';
  isLiveShowActive?: boolean;
  liveShowId?: string;
  
  // Données du live show
  viewerCount?: number;
  hostName?: string;
  showTitle?: string;
  
  // Callbacks
  onToggle?: (isExpanded: boolean) => void;
  onMessageSent?: (message: string) => void;
  onClose?: () => void;
  
  // Mode de fonctionnement
  highTrafficMode?: boolean;
  slowMode?: boolean;
  readOnly?: boolean;
  
  // Classes personnalisées
  className?: string;
  triggerClassName?: string;
};

type ChatMessage = {
  id: string;
  username: string;
  message: string;
  timestamp: Date;
  isHighlighted?: boolean;
  isModerator?: boolean;
};

const COOKIE_NAME = 'mini_social_panel_state';
const OPEN_COOKIE_NAME = 'mini_social_panel_open';
const COOKIE_MAX_AGE = MINI_SOCIAL_CONFIG?.sessionPersistence?.cookieExpiry || 24 * 60 * 60 * 1000;

export function MiniSocialPanel({
  open: openProp,
  onOpenChange,
  autoshow = MINI_SOCIAL_CONFIG?.autoshow ?? true,
  position = MINI_SOCIAL_CONFIG?.position ?? 'auto',
  defaultState = MINI_SOCIAL_CONFIG?.defaultState ?? 'expanded',
  isLiveShowActive = false,
  liveShowId = '',
  viewerCount = 0,
  hostName = '',
  showTitle = '',
  onToggle,
  onMessageSent,
  onClose,
  highTrafficMode = false,
  slowMode = MINI_SOCIAL_CONFIG?.slowMode ?? true,
  readOnly = false,
  className,
  triggerClassName
}: MiniSocialPanelProps) {
  const isMobile = useIsMobile();
  
  // Déterminer le mode d'affichage selon position et device
  const forceDrawer = position === 'drawer';
  const forceSidebar = position === 'sidebar';
  const useDrawerMode = forceDrawer || (!forceSidebar && isMobile);
  
  // État principal du panel avec contrôle externe
  const [_isOpen, _setIsOpen] = useState<boolean>(() => {
    if (autoshow && isLiveShowActive) return true;
    return loadOpenState();
  });
  const isOpen = openProp ?? _isOpen;
  const setIsOpen = useCallback((value: boolean) => {
    _setIsOpen(value);
    onOpenChange?.(value);
    saveOpenState(value);
  }, [onOpenChange]);
  
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultState === 'expanded');
  const [newMessage, setNewMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Fonctions pour état persistant open/close
  function loadOpenState(): boolean {
    if (!MINI_SOCIAL_CONFIG?.sessionPersistence?.rememberCollapsedState) {
      return false;
    }
    
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === OPEN_COOKIE_NAME) {
        return value === 'true';
      }
    }
    return false;
  }
  
  function saveOpenState(state: boolean) {
    // Only save if not controlled externally
    if (openProp === undefined && MINI_SOCIAL_CONFIG?.sessionPersistence?.rememberCollapsedState) {
      const expires = new Date(Date.now() + COOKIE_MAX_AGE);
      document.cookie = `${OPEN_COOKIE_NAME}=${state}; path=/; expires=${expires.toUTCString()}`;
    }
  }
  
  // Messages du chat (simulation pour le prototype)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      username: 'Créateur_01',
      message: 'Bienvenue dans ce live show ! 🎬',
      timestamp: new Date(Date.now() - 60000),
      isModerator: true
    },
    {
      id: '2', 
      username: 'Investisseur_Pro',
      message: 'Super projet, j\'investis tout de suite !',
      timestamp: new Date(Date.now() - 30000),
      isHighlighted: true
    },
    {
      id: '3',
      username: 'Fan_Cinéma',
      message: 'Tellement hâte de voir le résultat final',
      timestamp: new Date(Date.now() - 15000)
    }
  ]);

  // Gestion du state persistant avec cookies
  const saveState = useCallback((state: boolean) => {
    if (MINI_SOCIAL_CONFIG?.sessionPersistence?.rememberCollapsedState) {
      const expires = new Date(Date.now() + COOKIE_MAX_AGE);
      document.cookie = `${COOKIE_NAME}=${state}; path=/; expires=${expires.toUTCString()}`;
    }
  }, []);

  const loadState = useCallback((): boolean => {
    if (!MINI_SOCIAL_CONFIG?.sessionPersistence?.rememberCollapsedState) {
      return defaultState === 'expanded';
    }
    
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === COOKIE_NAME) {
        return value === 'true';
      }
    }
    return defaultState === 'expanded';
  }, [defaultState]);

  // Initialiser l'état depuis les cookies au montage
  useEffect(() => {
    const savedState = loadState();
    setIsExpanded(savedState);
  }, [loadState]);
  
  // Gestion autoshow quand live show devient actif
  useEffect(() => {
    if (autoshow && isLiveShowActive && !isOpen) {
      setIsOpen(true);
    }
  }, [autoshow, isLiveShowActive, isOpen, setIsOpen]);

  // Sauvegarder l'état quand il change
  useEffect(() => {
    saveState(isExpanded);
  }, [isExpanded, saveState]);

  // Fonctions de gestion
  const handleToggle = useCallback(() => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    onToggle?.(newState);
  }, [isExpanded, onToggle]);
  
  const handleOpen = useCallback(() => {
    setIsOpen(true);
  }, [setIsOpen]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    onClose?.();
  }, [setIsOpen, onClose]);

  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || isLoading) return;
    
    setIsLoading(true);
    
    // Simulation d'envoi de message (à remplacer par l'API réelle)
    const message: ChatMessage = {
      id: Date.now().toString(),
      username: 'Vous',
      message: newMessage.trim(),
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, message]);
    onMessageSent?.(newMessage.trim());
    setNewMessage('');
    
    // Délai de simulation
    setTimeout(() => setIsLoading(false), 500);
  }, [newMessage, isLoading, onMessageSent]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Bouton trigger flottant quand fermé
  const TriggerButton = () => {
    if (isOpen) return null;
    
    return (
      <Button
        onClick={handleOpen}
        className={cn(
          "fixed z-40 transition-all duration-300",
          useDrawerMode 
            ? "bottom-4 right-4 rounded-full h-12 w-12 p-0" 
            : "top-4 right-4 h-10 w-10 p-0",
          triggerClassName
        )}
        data-testid="button-open-mini-social"
      >
        <MessageSquare className="h-5 w-5" />
        {viewerCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs"
          >
            {viewerCount > 99 ? '99+' : viewerCount}
          </Badge>
        )}
      </Button>
    );
  };
  
  // Toujours afficher le trigger button si fermé
  if (!isOpen) {
    return <TriggerButton />;
  }

  // Composant Header commun
  const PanelHeader = () => (
    <div className="flex items-center justify-between border-b p-3">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-primary" />
        <div className="flex flex-col">
          <span className="text-sm font-medium">Chat Live</span>
          {hostName && (
            <span className="text-xs text-muted-foreground">
              avec {hostName}
            </span>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {viewerCount > 0 && (
          <Badge variant="secondary" className="text-xs">
            <Eye className="h-3 w-3 mr-1" />
            {viewerCount}
          </Badge>
        )}
        
        {highTrafficMode && (
          <Badge variant="destructive" className="text-xs">
            <AlertCircle className="h-3 w-3 mr-1" />
            Lecture seule
          </Badge>
        )}
        
        {slowMode && (
          <Badge variant="outline" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            Slow
          </Badge>
        )}
        
        {!isMobile && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleToggle}
            data-testid="button-toggle-mini-social"
          >
            {isExpanded ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        )}
        
        <Button 
          variant="ghost" 
          size="sm"
          onClick={handleClose}
          data-testid="button-close-mini-social"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  // Composant Messages commun
  const MessagesList = () => (
    <ScrollArea className="flex-1 p-3">
      <div className="space-y-2">
        {(highTrafficMode ? messages.filter(m => m.isHighlighted) : messages).map((message) => (
          <div 
            key={message.id}
            className={cn(
              "flex flex-col gap-1 p-2 rounded-lg text-sm",
              message.isHighlighted && "bg-primary/10 border border-primary/20",
              message.isModerator && "bg-accent/50"
            )}
          >
            <div className="flex items-center gap-2">
              <span className="font-medium text-primary">
                {message.username}
              </span>
              {message.isModerator && (
                <Star className="h-3 w-3 text-yellow-500" />
              )}
              <span className="text-xs text-muted-foreground">
                {message.timestamp.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </div>
            <p className="text-foreground leading-relaxed">
              {message.message}
            </p>
          </div>
        ))}
      </div>
    </ScrollArea>
  );

  // Composant Input commun
  const MessageInput = () => (
    <div className="border-t p-3">
      {highTrafficMode ? (
        <div className="text-center text-sm text-muted-foreground py-2">
          {MINI_SOCIAL_CONFIG?.defaultMessages?.highTrafficMode ?? 'Le chat est en lecture seule en raison du trafic élevé'}
        </div>
      ) : (
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={slowMode ? "Mode lent actif..." : "Tapez votre message..."}
            maxLength={MINI_SOCIAL_CONFIG?.messageMaxLength ?? 200}
            disabled={isLoading || readOnly}
            data-testid="input-mini-social-message"
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isLoading}
            size="sm"
            data-testid="button-send-mini-social-message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );

  // Version Drawer (mobile ou forcée)
  if (useDrawerMode) {
    return (
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerContent 
          className={cn("h-[60vh]", className)}
          data-testid="drawer-mini-social"
        >
          <DrawerHeader className="sr-only">
            <DrawerTitle>Chat Live</DrawerTitle>
            <DrawerDescription>
              Interactions en temps réel pendant le live show
            </DrawerDescription>
          </DrawerHeader>
          
          <div className="flex flex-col h-full">
            <PanelHeader />
            <MessagesList />
            <MessageInput />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Version Sidebar (desktop ou forcée)
  return (
    <div 
      className={cn(
        "fixed right-0 top-0 h-screen z-50 transition-all duration-300",
        isExpanded ? "w-80" : "w-12",
        className
      )}
      data-testid="sidebar-mini-social"
    >
      <Card className="h-full rounded-l-lg rounded-r-none border-r-0 shadow-lg">
        {isExpanded ? (
          <div className="flex flex-col h-full">
            <PanelHeader />
            <MessagesList />
            <MessageInput />
          </div>
        ) : (
          // Vue collapsée (icône seulement)
          <div className="h-full flex flex-col items-center justify-start pt-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleToggle}
              className="mb-2"
              data-testid="button-expand-mini-social"
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
            
            {viewerCount > 0 && (
              <Badge variant="secondary" className="writing-mode-vertical text-xs mb-2">
                {viewerCount}
              </Badge>
            )}
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleClose}
              className="mt-auto mb-4"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}