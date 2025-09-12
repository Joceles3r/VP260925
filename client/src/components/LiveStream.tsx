import React, { useState, useEffect } from 'react';
import { Users, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

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
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { user: 'Martin', message: 'Emma a une voix incroyable! 🎤', time: '2min' },
    { user: 'Sophie', message: 'Viens d\'investir 15€ sur Marcus 💰', time: '1min' },
    { user: 'Alex', message: 'La battle est serrée! 🔥', time: '30s' },
  ]);

  const handleInvestment = async (artist: 'A' | 'B') => {
    if (!user?.kycVerified) {
      toast({
        title: "KYC requis",
        description: "Vous devez vérifier votre identité pour investir",
        variant: "destructive",
      });
      return;
    }

    if (investmentAmount < 1 || investmentAmount > 20) {
      toast({
        title: "Montant invalide",
        description: "L'investissement doit être entre €1 et €20",
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

      // Add investment to activity feed
      const newMessage = `a investi €${investmentAmount} sur ${artist === 'A' ? artistA : artistB}`;
      setChatMessages(prev => [
        { user: user.firstName || 'Vous', message: newMessage, time: 'maintenant' },
        ...prev,
      ]);

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

  const sendChatMessage = () => {
    if (chatMessage.trim()) {
      setChatMessages(prev => [
        { user: user?.firstName || 'Vous', message: chatMessage, time: 'maintenant' },
        ...prev,
      ]);
      setChatMessage('');
    }
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
                  Montant d'investissement (€1-20)
                </label>
                <Input
                  type="number"
                  min="1"
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

      {/* Live Chat & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Chat */}
        <div className="bg-card rounded-lg border border-border">
          <div className="px-6 py-4 border-b border-border">
            <h4 className="text-lg font-semibold text-foreground">Chat Live</h4>
          </div>
          
          <div className="h-64 p-4 space-y-3 overflow-y-auto" data-testid="chat-messages">
            {chatMessages.map((msg, index) => (
              <div key={index} className="flex items-start space-x-2">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs text-primary-foreground font-medium">
                  {msg.user[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm">
                    <span className="font-medium text-foreground">{msg.user}</span>
                    <span className="text-muted-foreground text-xs ml-2">{msg.time}</span>
                  </div>
                  <div className="text-sm text-foreground">{msg.message}</div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-4 border-t border-border">
            <div className="flex space-x-2">
              <Input
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Tapez votre message..."
                onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                data-testid="chat-input"
              />
              <Button onClick={sendChatMessage} data-testid="send-message">
                Envoyer
              </Button>
            </div>
          </div>
        </div>

        {/* Live Activity Feed */}
        <div className="bg-card rounded-lg border border-border">
          <div className="px-6 py-4 border-b border-border">
            <h4 className="text-lg font-semibold text-foreground">Activité en Temps Réel</h4>
          </div>
          
          <div className="h-64 p-4 space-y-3 overflow-y-auto" data-testid="activity-feed">
            {[
              { user: 'Julie', amount: 8, artist: artistA, time: '5s' },
              { user: 'David', amount: 15, artist: artistB, time: '12s' },
              { user: 'Claire', amount: 20, artist: artistA, time: '18s' },
              { user: 'Thomas', amount: 5, artist: artistB, time: '25s' },
            ].map((activity, index) => (
              <div key={index} className="flex items-center space-x-3 p-2 rounded bg-muted/20">
                <div className="w-2 h-2 bg-secondary rounded-full" />
                <div className="flex-1 text-sm text-foreground">
                  <span className="font-medium">{activity.user}</span> a investi{' '}
                  <span className="font-medium text-secondary">€{activity.amount}</span> sur {activity.artist}
                </div>
                <span className="text-xs text-muted-foreground">Il y a {activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
