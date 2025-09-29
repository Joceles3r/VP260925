import React, { useState, useEffect } from 'react';
import { Users, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { MiniSocialPanel } from '@/components/MiniSocialPanel';
import { getSocket } from '@/lib/socket';

interface LiveStreamProps {
  showId: string;
  title: string;
  artistA: string;
  artistB: string;
  investmentA: string;
  investmentB: string;
  viewerCount: number;
}

export default function LiveStream({
  showId,
  title,
  artistA,
  artistB,
  investmentA,
  investmentB,
  viewerCount,
}: LiveStreamProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedArtist, setSelectedArtist] = useState<'A' | 'B' | null>(null);
  const [investmentAmount, setInvestmentAmount] = useState(5);
  const [isInvesting, setIsInvesting] = useState(false);
  
  // États pour MiniSocialPanel
  const [miniSocialOpen, setMiniSocialOpen] = useState(false);
  const [miniSocialConfig, setMiniSocialConfig] = useState({
    autoshow: true,
    position: 'auto' as 'sidebar' | 'drawer' | 'auto',
    mode: 'normal' as 'normal' | 'normal_with_slow_mode' | 'highlights_only' | 'read_only' | 'dnd',
    slowMode: true,
    highTrafficMode: false
  });

  // WebSocket pour déclenchement automatique du mini réseau social
  useEffect(() => {
    if (!showId) return;

    try {
      const socket = getSocket();
      
      // Écouter l'événement de déclenchement automatique
      const handleAutoTrigger = (data: any) => {
        if (data.liveShowId === showId) {
          console.log('[LiveStream] Mini réseau social déclenché automatiquement:', data);
          
          // Mettre à jour la configuration selon les données reçues
          setMiniSocialConfig(prev => ({
            ...prev,
            autoshow: data.config?.autoshow ?? true,
            position: data.config?.position ?? 'auto',
            mode: data.trafficMode?.mode ?? 'normal',
            slowMode: data.trafficMode?.mode === 'normal_with_slow_mode' || data.config?.slowMode,
            highTrafficMode: data.config?.isHighTraffic ?? false
          }));
          
          // Ouvrir automatiquement le panneau si autoshow activé
          if (data.config?.autoshow) {
            setMiniSocialOpen(true);
          }
          
          // Afficher une notification selon le mode
          const modeMessages = {
            normal: "Chat en direct activé",
            normal_with_slow_mode: "Chat en direct activé - mode lent",
            highlights_only: "Mode highlights activé - messages populaires uniquement",
            read_only: "Mode lecture seule activé - trafic élevé détecté",
            dnd: "Mode silencieux activé"
          };
          
          toast({
            title: "Réseau social live",
            description: modeMessages[data.trafficMode?.mode as keyof typeof modeMessages] || "Chat activé",
          });
        }
      };

      // Écouter l'événement de fermeture automatique
      const handleAutoClose = (data: any) => {
        if (data.liveShowId === showId) {
          console.log('[LiveStream] Mini réseau social fermé automatiquement:', data);
          setMiniSocialOpen(false);
          
          toast({
            title: "Live terminé",
            description: "Le chat en direct a été fermé",
          });
        }
      };

      // Écouter les changements de mode en temps réel
      const handleModeChange = (data: any) => {
        if (data.liveShowId === showId) {
          console.log('[LiveStream] Changement de mode:', data);
          
          setMiniSocialConfig(prev => ({
            ...prev,
            mode: data.mode,
            slowMode: data.mode === 'normal_with_slow_mode',
            highTrafficMode: data.mode === 'highlights_only' || data.mode === 'read_only'
          }));
          
          // Notification du changement de mode
          const modeMessages = {
            normal: "Mode normal rétabli",
            normal_with_slow_mode: "Mode lent activé",
            highlights_only: "Mode highlights - messages populaires",
            read_only: "Mode lecture seule - trafic élevé",
            dnd: "Mode silencieux activé"
          };
          
          if (!data.isManual) {
            toast({
              title: "Mode automatique",
              description: modeMessages[data.mode as keyof typeof modeMessages],
            });
          }
        }
      };

      // Attacher les listeners
      socket.on('mini_social_auto_trigger', handleAutoTrigger);
      socket.on('mini_social_auto_close', handleAutoClose);
      socket.on('mini_social_mode_change', handleModeChange);

      // Fallback : Si le socket est connecté mais qu'on a un live show actif, 
      // ouvrir le panneau automatiquement si autoshow est activé
      if (socket.connected && miniSocialConfig.autoshow) {
        const timer = setTimeout(() => {
          console.log('[LiveStream] Fallback autoshow activé pour le live show:', showId);
          setMiniSocialOpen(true);
        }, 2000); // 2 secondes après le montage
        
        // Nettoyer le timer au démontage
        return () => {
          clearTimeout(timer);
          socket.off('mini_social_auto_trigger', handleAutoTrigger);
          socket.off('mini_social_auto_close', handleAutoClose);
          socket.off('mini_social_mode_change', handleModeChange);
        };
      }

      // Nettoyer les listeners au démontage
      return () => {
        socket.off('mini_social_auto_trigger', handleAutoTrigger);
        socket.off('mini_social_auto_close', handleAutoClose);
        socket.off('mini_social_mode_change', handleModeChange);
      };
    } catch (error) {
      console.error('[LiveStream] Erreur lors de l\'initialisation WebSocket:', error);
      
      // Fallback si erreur socket : ouvrir quand même si autoshow activé
      if (miniSocialConfig.autoshow) {
        toast({
          title: "Mode hors ligne",
          description: "Chat local activé - fonctionnalités limitées",
          variant: "destructive"
        });
        setMiniSocialOpen(true);
      }
    }
  }, [showId, toast, miniSocialConfig.autoshow]);

  const handleInvestment = async (artist: 'A' | 'B') => {
    if (!user?.kycVerified) {
      toast({
        title: "KYC requis",
        description: "Vous devez vérifier votre identité pour investir",
        variant: "destructive",
      });
      return;
    }

    if (investmentAmount < 2 || investmentAmount > 20) {
      toast({
        title: "Montant invalide",
        description: "L'investissement doit être entre **2–20 €**",
        variant: "destructive",
      });
      return;
    }

    setIsInvesting(true);
    try {
      await apiRequest('POST', `/api/live-shows/${showId}/invest`, {
        artist,
        amount: investmentAmount,
      });

      toast({
        title: "Investissement réussi",
        description: `€${investmentAmount} investi sur ${artist === 'A' ? artistA : artistB}`,
      });

      // Activité investissement sera gérée par MiniSocialPanel via WebSocket

    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de traiter l'investissement",
        variant: "destructive",
      });
    } finally {
      setIsInvesting(false);
    }
  };

  // Gestion des messages pour MiniSocialPanel
  const handleMiniSocialMessage = (message: string) => {
    console.log('[LiveStream] Message envoyé via MiniSocialPanel:', message);
    // Le message sera traité automatiquement par MiniSocialPanel via WebSocket
  };

  return (
    <div className="space-y-6">
      {/* Live Video Player */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="relative bg-black aspect-video">
          <img 
            src="https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=1200&h=675&fit=crop" 
            alt="Live performance stream"
            className="w-full h-full object-cover"
            data-testid="live-stream-video"
          />
          
          {/* Play button overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <button 
              className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
              data-testid="play-button"
            >
              <div className="w-0 h-0 border-l-[12px] border-l-white border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent ml-1" />
            </button>
          </div>
          
          {/* Live indicator */}
          <div className="absolute top-4 left-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-500 text-white">
              <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
              LIVE
            </span>
          </div>
          
          {/* Viewer count */}
          <div className="absolute top-4 right-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-black/50 backdrop-blur-sm text-white">
              <Users className="w-4 h-4 mr-1" />
              {viewerCount.toLocaleString()} viewers
            </span>
          </div>
        </div>
        
        <div className="p-6">
          <h3 className="text-xl font-bold text-foreground mb-2" data-testid="live-title">
            {title}
          </h3>
          <p className="text-muted-foreground mb-4">
            Affrontement final entre deux artistes prometteurs. Les spectateurs peuvent investir en temps réel sur leur favori!
          </p>
          
          {/* Battle Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div 
              className={`bg-muted/30 rounded-lg p-4 text-center cursor-pointer transition-colors ${
                selectedArtist === 'A' ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedArtist('A')}
              data-testid="artist-a-card"
            >
              <div className="text-2xl font-bold text-foreground">Artist A</div>
              <div className="text-sm text-muted-foreground mb-2">{artistA}</div>
              <div className="text-lg font-semibold text-secondary" data-testid="investment-a">
                €{parseFloat(investmentA).toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">152 investisseurs</div>
            </div>
            
            <div 
              className={`bg-muted/30 rounded-lg p-4 text-center cursor-pointer transition-colors ${
                selectedArtist === 'B' ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedArtist('B')}
              data-testid="artist-b-card"
            >
              <div className="text-2xl font-bold text-foreground">Artist B</div>
              <div className="text-sm text-muted-foreground mb-2">{artistB}</div>
              <div className="text-lg font-semibold text-secondary" data-testid="investment-b">
                €{parseFloat(investmentB).toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">98 investisseurs</div>
            </div>
          </div>

          {/* Investment Controls */}
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Montant d'investissement (**2–20 €**)
                </label>
                <Input
                  type="number"
                  min="2"
                  max="20"
                  value={investmentAmount}
                  onChange={(e) => setInvestmentAmount(parseInt(e.target.value) || 1)}
                  className="w-full"
                  data-testid="investment-amount-input"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                className="flex-1"
                disabled={!selectedArtist || selectedArtist !== 'A' || isInvesting}
                onClick={() => handleInvestment('A')}
                data-testid="invest-artist-a"
              >
                {isInvesting ? 'Investissement...' : `Investir sur ${artistA}`}
              </Button>
              <Button
                className="flex-1"
                variant="outline"
                disabled={!selectedArtist || selectedArtist !== 'B' || isInvesting}
                onClick={() => handleInvestment('B')}
                data-testid="invest-artist-b"
              >
                {isInvesting ? 'Investissement...' : `Investir sur ${artistB}`}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mini Social Network - Remplace Chat & Activity */}
      <div className="w-full">
        <MiniSocialPanel
          open={miniSocialOpen}
          onOpenChange={setMiniSocialOpen}
          autoshow={miniSocialConfig.autoshow}
          position={miniSocialConfig.position}
          defaultState="expanded"
          isLiveShowActive={true}
          liveShowId={showId}
          viewerCount={viewerCount}
          hostName={`${artistA} vs ${artistB}`}
          showTitle={title}
          onMessageSent={handleMiniSocialMessage}
          onClose={() => setMiniSocialOpen(false)}
          highTrafficMode={miniSocialConfig.highTrafficMode}
          slowMode={miniSocialConfig.slowMode}
          readOnly={miniSocialConfig.mode === 'read_only' || miniSocialConfig.mode === 'dnd'}
          className="min-h-[500px]"
        />
      </div>
    </div>
  );
}
