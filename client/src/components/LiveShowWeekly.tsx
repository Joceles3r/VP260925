import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Users, DollarSign, Trophy, TrendingUp, CreditCard } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { getSocket } from '@/lib/socket';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const INVEST_TRANCHES = [2, 3, 4, 5, 6, 8, 10, 12, 15, 20];

// Payment Form Component
function PaymentForm({ onSuccess, amount }: { onSuccess: () => void; amount: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/live`,
      },
      redirect: 'if_required', // Avoid full page redirect when possible
    });

    if (error) {
      toast({
        title: "Échec du paiement",
        description: error.message,
        variant: "destructive",
      });
      setIsProcessing(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      toast({
        title: "Paiement confirmé!",
        description: `Votre investissement de ${amount}€ a été traité avec succès.`,
      });
      onSuccess();
    } else {
      // Payment requires additional action (will redirect)
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing} 
        className="w-full"
        data-testid="confirm-payment-button"
      >
        {isProcessing ? (
          <>
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
            Traitement en cours...
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4 mr-2" />
            Confirmer €{amount}
          </>
        )}
      </Button>
    </form>
  );
}

export default function LiveShowWeekly() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedAmount, setSelectedAmount] = useState(5);
  const [selectedFinalist, setSelectedFinalist] = useState<'A' | 'B' | null>(null);
  const [paymentClientSecret, setPaymentClientSecret] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Fetch current edition
  const { data: edition, isLoading: editionLoading } = useQuery<any>({
    queryKey: ['/api/live-weekly/current'],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Handle return from 3DS redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const clientSecret = urlParams.get('payment_intent_client_secret');
    
    if (clientSecret && stripePromise) {
      stripePromise.then(async (stripe) => {
        if (!stripe) return;
        
        const { paymentIntent, error } = await stripe.retrievePaymentIntent(clientSecret);
        
        if (error) {
          toast({
            title: "Erreur de paiement",
            description: error.message,
            variant: "destructive",
          });
        } else if (paymentIntent && paymentIntent.status === 'succeeded') {
          toast({
            title: "Paiement confirmé!",
            description: "Votre investissement a été traité avec succès.",
          });
          
          // Clean URL
          window.history.replaceState({}, '', '/live');
          
          // Refresh scoreboard
          if (edition?.id) {
            queryClient.invalidateQueries({ queryKey: ['/api/live-weekly/scoreboard', edition.id] });
          }
        }
      });
    }
  }, [edition?.id, toast]);

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
      const response = await apiRequest('POST', '/api/live-weekly/invest', {
        finalist,
        editionId: edition?.id,
        amountEUR: amount,
      });
      return response as any;
    },
    onSuccess: (data: any) => {
      // Handle Stripe payment
      if (data.clientSecret) {
        setPaymentClientSecret(data.clientSecret);
        setShowPaymentModal(true);
      } else {
        toast({
          title: "Investissement créé!",
          description: `Investissement de ${selectedAmount}€ en attente de paiement`,
        });
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

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    setPaymentClientSecret(null);
    setSelectedFinalist(null);
    queryClient.invalidateQueries({ queryKey: ['/api/live-weekly/scoreboard', edition?.id] });
    
    toast({
      title: "Paiement confirmé!",
      description: `Votre investissement de ${selectedAmount}€ a été confirmé`,
    });
  };

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

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="max-w-md" data-testid="payment-modal">
          <DialogHeader>
            <DialogTitle>Confirmer votre investissement</DialogTitle>
          </DialogHeader>
          
          {paymentClientSecret && (
            <Elements stripe={stripePromise} options={{ clientSecret: paymentClientSecret }}>
              <PaymentForm onSuccess={handlePaymentSuccess} amount={selectedAmount} />
            </Elements>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
