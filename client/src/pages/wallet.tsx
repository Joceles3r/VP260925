import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Wallet, ArrowDownLeft, Receipt, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface WithdrawalRequest {
  id: string;
  amount: number;
  minimumThreshold: number;
  status: string;
  requestedAt: string;
  processedAt?: string;
  failureReason?: string;
}

export default function WalletPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch wallet balance
  const { data: walletData, isLoading: isLoadingWallet } = useQuery({
    queryKey: ['/api/wallet/balance'],
    enabled: !!user
  });

  // Fetch withdrawal history
  const { data: withdrawalsData, isLoading: isLoadingWithdrawals } = useQuery({
    queryKey: ['/api/withdrawal/history'],
    enabled: !!user
  });

  // Create withdrawal mutation
  const withdrawMutation = useMutation({
    mutationFn: async (amount: string) => {
      const response = await fetch('/api/withdrawal/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create withdrawal request');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Demande de retrait créée",
        description: "Votre demande de retrait est en cours de traitement",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/withdrawal/history'] });
      queryClient.invalidateQueries({ queryKey: ['/api/wallet/balance'] });
      setWithdrawAmount('');
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />En attente</Badge>;
      case 'processing':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800"><Clock className="w-3 h-3 mr-1" />Traitement</Badge>;
      case 'completed':
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Terminé</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Échoué</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getMinimumWithdrawal = () => {
    if (!user?.profileType) return 25;
    return ['creator', 'admin'].includes(user.profileType) ? 50 : 25;
  };

  if (isLoadingWallet) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="wallet-page">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-foreground" data-testid="wallet-title">
          Portefeuille
        </h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="withdraw-button">
              <ArrowDownLeft className="w-4 h-4 mr-2" />
              Demander un retrait
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Demande de retrait</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-4">
                  Montant minimum : €{getMinimumWithdrawal()} ({user?.profileType || 'investor'})
                </p>
                <Input
                  type="number"
                  placeholder="Montant en €"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  min={getMinimumWithdrawal()}
                  data-testid="withdraw-amount-input"
                />
              </div>
              <Button 
                onClick={() => withdrawMutation.mutate(withdrawAmount)}
                disabled={!withdrawAmount || withdrawMutation.isPending || parseFloat(withdrawAmount) < getMinimumWithdrawal()}
                className="w-full"
                data-testid="submit-withdraw-button"
              >
                {withdrawMutation.isPending ? 'Création...' : 'Créer la demande'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Wallet Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card data-testid="balance-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Solde Disponible</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary" data-testid="balance-amount">
              €{((walletData as any)?.balanceEUR?.toFixed(2)) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Disponible pour retrait
            </p>
          </CardContent>
        </Card>

        <Card data-testid="caution-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Caution Déposée</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary" data-testid="caution-amount">
              €{((walletData as any)?.cautionEUR?.toFixed(2)) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Caution de garantie
            </p>
          </CardContent>
        </Card>

        <Card data-testid="investments-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Investi</CardTitle>
            <ArrowDownLeft className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent" data-testid="invested-amount">
              €{((walletData as any)?.totalInvested?.toFixed(2)) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Dans les projets
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Withdrawal History */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des retraits</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingWithdrawals ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse bg-muted h-16 rounded"></div>
              ))}
            </div>
          ) : (withdrawalsData as any)?.withdrawals?.length > 0 ? (
            <div className="space-y-4" data-testid="withdrawal-history">
              {(withdrawalsData as any).withdrawals.map((withdrawal: WithdrawalRequest) => (
                <div key={withdrawal.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`withdrawal-${withdrawal.id}`}>
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="font-medium">€{withdrawal.amount.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(withdrawal.requestedAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(withdrawal.status)}
                    {withdrawal.failureReason && (
                      <p className="text-xs text-destructive mt-1">{withdrawal.failureReason}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8" data-testid="no-withdrawals">
              <ArrowDownLeft className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Aucune demande de retrait</p>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}