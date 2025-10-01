import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Users, DollarSign, Trophy, TrendingUp } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { getSocket } from '@/lib/socket';

const INVEST_TRANCHES = [2, 3, 4, 5, 6, 8, 10, 12, 15, 20];

export default function LiveShowWeekly() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedAmount, setSelectedAmount] = useState(5);
  const [selectedFinalist, setSelectedFinalist] = useState<'A' | 'B' | null>(null);

  // Fetch current edition
  const { data: edition, isLoading: editionLoading } = useQuery<any>({
    queryKey: ['/api/live-weekly/current'],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Fetch candidates (finalists)
  const { data: candidates } = useQuery<any[]>({
    queryKey: ['/api/live-weekly/candidates', edition?.id],
    queryFn: () => fetch(`/api/live-weekly/candidates/${edition?.id}`).then(r => r.json()),
    enabled: !!edition?.id,
  });

  // Fetch scoreboard
  const { data: scoreboard, refetch: refetchScoreboard } = useQuery<any[]>({
    queryKey: ['/api/live-weekly/scoreboard', edition?.id],
    queryFn: () => fetch(`/api/live-weekly/scoreboard/${edition?.id}`).then(r => r.json()),
    enabled: !!edition?.id && edition?.currentPhase === 'live',
    refetchInterval: 5000, // Refresh every 5 seconds during live
  });

  // WebSocket for real-time updates
  useEffect(() => {
    if (!edition?.id) return;

    const socket = getSocket();

    const handleScoreUpdate = (data: any) => {
      if (data.editionId === edition.id) {
        refetchScoreboard();
      }
    };

    const handleVotesClosed = (data: any) => {
      if (data.editionId === edition.id) {
        toast({
          title: "Votes fermés!",
          description: "Le décompte des votes est terminé.",
        });
        refetchScoreboard();
      }
    };

    const handleWinnerAnnounced = (data: any) => {
      if (data.editionId === edition.id) {
        toast({
          title: `🏆 Finaliste ${data.winner} a gagné!`,
          description: `Distribution des gains en cours...`,
        });
        queryClient.invalidateQueries({ queryKey: ['/api/live-weekly/current'] });
      }
    };

    socket.on('live_weekly:score_update', handleScoreUpdate);
    socket.on('live_weekly:votes_closed', handleVotesClosed);
    socket.on('live_weekly:winner_announced', handleWinnerAnnounced);

    return () => {
      socket.off('live_weekly:score_update', handleScoreUpdate);
      socket.off('live_weekly:votes_closed', handleVotesClosed);
      socket.off('live_weekly:winner_announced', handleWinnerAnnounced);
    };
  }, [edition?.id, toast, refetchScoreboard]);

  // Investment mutation
  const investMutation = useMutation({
    mutationFn: async ({ finalist, amount }: { finalist: 'A' | 'B'; amount: number }) => {
      const response = await apiRequest('/api/live-weekly/invest', 'POST', {
        finalist,
        editionId: edition?.id,
        amountEUR: amount,
      });
      return response as any;
    },
    onSuccess: (data: any) => {
      toast({
        title: "Investissement réussi!",
        description: `Vous avez investi ${selectedAmount}€ sur le finaliste ${selectedFinalist}`,
      });
      setSelectedFinalist(null);
      queryClient.invalidateQueries({ queryKey: ['/api/live-weekly/scoreboard', edition?.id] });
      
      // Handle Stripe payment if needed
      if (data.clientSecret) {
        // TODO: Integrate Stripe Elements for payment
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de traiter l'investissement",
        variant: "destructive",
      });
    },
  });

  const handleInvest = () => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour investir",
        variant: "destructive",
      });
      return;
    }

    if (!selectedFinalist) {
      toast({
        title: "Sélection requise",
        description: "Veuillez sélectionner un finaliste",
        variant: "destructive",
      });
      return;
    }

    investMutation.mutate({ finalist: selectedFinalist, amount: selectedAmount });
  };

  if (editionLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" data-testid="loading-weekly">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!edition) {
    return (
      <Card className="p-12 text-center" data-testid="no-edition">
        <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-xl font-semibold mb-2">Aucune édition en cours</h3>
        <p className="text-muted-foreground">
          La prochaine édition hebdomadaire sera bientôt disponible.
        </p>
      </Card>
    );
  }

  const finalists = candidates?.filter((c: any) => c.status === 'finalist') || [];
  const finalistA = finalists.find((f: any) => f.rank === 1);
  const finalistB = finalists.find((f: any) => f.rank === 2);

  const scoreA = scoreboard?.find((s: any) => s.finalist === 'A') || { totalVotes: 0, totalAmount: 0, investorCount: 0 };
  const scoreB = scoreboard?.find((s: any) => s.finalist === 'B') || { totalVotes: 0, totalAmount: 0, investorCount: 0 };

  const isLive = edition.currentPhase === 'live' && edition.currentState === 'live_running';

  return (
    <div className="space-y-6" data-testid="live-show-weekly">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" data-testid="edition-title">
            Live Show - Semaine {edition.weekNumber}/{edition.year}
          </h2>
          <p className="text-muted-foreground">
            Phase: {edition.currentPhase} • État: {edition.currentState}
          </p>
        </div>
        {isLive && (
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium">EN DIRECT</span>
          </div>
        )}
      </div>

      {/* Battle Arena */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Finalist A */}
        <Card 
          className={`p-6 cursor-pointer transition-all ${
            selectedFinalist === 'A' ? 'ring-2 ring-primary' : ''
          }`}
          onClick={() => isLive && setSelectedFinalist('A')}
          data-testid="finalist-a-card"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Finaliste A</h3>
            <Trophy className="w-6 h-6 text-yellow-500" />
          </div>
          
          {finalistA && (
            <div className="space-y-2 mb-4">
              <p className="text-sm text-muted-foreground">Projet: {finalistA.projectId || 'N/A'}</p>
              <p className="text-sm text-muted-foreground">Score AI: {finalistA.aiScore || 'N/A'}</p>
            </div>
          )}

          {isLive && (
            <div className="space-y-2 pt-4 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Votes:</span>
                <span className="font-medium" data-testid="score-a-votes">{scoreA.totalVotes}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Montant:</span>
                <span className="font-medium" data-testid="score-a-amount">{scoreA.totalAmount}€</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Investisseurs:</span>
                <span className="font-medium" data-testid="score-a-investors">{scoreA.investorCount}</span>
              </div>
            </div>
          )}
        </Card>

        {/* Finalist B */}
        <Card 
          className={`p-6 cursor-pointer transition-all ${
            selectedFinalist === 'B' ? 'ring-2 ring-primary' : ''
          }`}
          onClick={() => isLive && setSelectedFinalist('B')}
          data-testid="finalist-b-card"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Finaliste B</h3>
            <Trophy className="w-6 h-6 text-yellow-500" />
          </div>
          
          {finalistB && (
            <div className="space-y-2 mb-4">
              <p className="text-sm text-muted-foreground">Projet: {finalistB.projectId || 'N/A'}</p>
              <p className="text-sm text-muted-foreground">Score AI: {finalistB.aiScore || 'N/A'}</p>
            </div>
          )}

          {isLive && (
            <div className="space-y-2 pt-4 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Votes:</span>
                <span className="font-medium" data-testid="score-b-votes">{scoreB.totalVotes}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Montant:</span>
                <span className="font-medium" data-testid="score-b-amount">{scoreB.totalAmount}€</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Investisseurs:</span>
                <span className="font-medium" data-testid="score-b-investors">{scoreB.investorCount}</span>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Investment Panel */}
      {isLive && (
        <Card className="p-6" data-testid="investment-panel">
          <h3 className="text-lg font-semibold mb-4">Investir en temps réel</h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Sélectionnez un montant:</label>
              <div className="grid grid-cols-5 gap-2">
                {INVEST_TRANCHES.map((amount) => (
                  <Button
                    key={amount}
                    variant={selectedAmount === amount ? 'default' : 'outline'}
                    onClick={() => setSelectedAmount(amount)}
                    data-testid={`amount-${amount}`}
                  >
                    {amount}€
                  </Button>
                ))}
              </div>
            </div>

            <Button
              className="w-full"
              size="lg"
              disabled={!selectedFinalist || investMutation.isPending}
              onClick={handleInvest}
              data-testid="button-invest"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              {investMutation.isPending 
                ? "Traitement..." 
                : `Investir ${selectedAmount}€ sur ${selectedFinalist || '?'}`}
            </Button>
          </div>
        </Card>
      )}

      {/* Rules */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Règles de distribution</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="font-medium">40%</p>
            <p className="text-muted-foreground">Artiste gagnant</p>
          </div>
          <div>
            <p className="font-medium">30%</p>
            <p className="text-muted-foreground">Investisseurs gagnants</p>
          </div>
          <div>
            <p className="font-medium">20%</p>
            <p className="text-muted-foreground">Artiste perdant</p>
          </div>
          <div>
            <p className="font-medium">10%</p>
            <p className="text-muted-foreground">Investisseurs perdants</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
