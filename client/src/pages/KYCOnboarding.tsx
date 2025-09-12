import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { CheckCircle, AlertCircle, Wallet, CreditCard, Shield, UserCheck } from 'lucide-react';
import { useLocation } from 'wouter';
import Checkout from './Checkout';

interface WalletInfo {
  balanceEUR: number;
  cautionEUR: number;
  totalInvested: number;
  totalGains: number;
  simulationMode: boolean;
  kycVerified: boolean;
  canInvest: boolean;
}

export default function KYCOnboarding() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [depositAmount, setDepositAmount] = useState('20');
  const [currentStep, setCurrentStep] = useState(1);
  const [showStripeCheckout, setShowStripeCheckout] = useState(false);

  // Fetch wallet information
  const { data: walletInfo, isLoading: walletLoading } = useQuery<WalletInfo>({
    queryKey: ['/api/wallet/balance'],
    enabled: !!user
  });

  // KYC verification mutation
  const kycMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/kyc/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents: { simulation: true } })
      });
      if (!response.ok) throw new Error('KYC verification failed');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Vérification KYC réussie",
        description: "Votre identité a été vérifiée avec succès. Vous pouvez maintenant déposer votre caution.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/wallet/balance'] });
      setCurrentStep(2);
    },
    onError: () => {
      toast({
        title: "Erreur de vérification",
        description: "La vérification KYC a échoué. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  });

  // Deposit mutation
  const depositMutation = useMutation({
    mutationFn: async (amount: string) => {
      const response = await fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, type: 'caution' })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Deposit failed');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Dépôt de caution réussi",
        description: `€${depositAmount} ont été déposés en tant que caution. Vous pouvez maintenant investir !`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/wallet/balance'] });
      setCurrentStep(3);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur de dépôt",
        description: error.message || "Le dépôt a échoué. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  });

  // Role upgrade mutation
  const roleUpgradeMutation = useMutation({
    mutationFn: async (profileType: string) => {
      const response = await fetch(`/api/users/${user?.id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileType })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Role update failed');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Rôle mis à jour",
        description: "Votre profil a été mis à jour avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur de mise à jour",
        description: error.message || "La mise à jour du rôle a échoué.",
        variant: "destructive",
      });
    }
  });

  const handleKYCVerification = () => {
    kycMutation.mutate();
  };

  const handleDepositCaution = () => {
    const amount = parseFloat(depositAmount);
    if (amount < 20) {
      toast({
        title: "Montant insuffisant",
        description: "Le montant minimum de caution est de €20.",
        variant: "destructive",
      });
      return;
    }
    
    // Check if user is in simulation mode
    if (walletInfo?.simulationMode) {
      // Use simulation deposit
      depositMutation.mutate(depositAmount);
    } else {
      // Use Stripe checkout for real payments
      setShowStripeCheckout(true);
    }
  };

  const handleStripeSuccess = () => {
    setShowStripeCheckout(false);
    // Refresh wallet info
    queryClient.invalidateQueries({ queryKey: ['/api/wallet/balance'] });
    toast({
      title: "Paiement réussi",
      description: "Votre caution a été déposée avec succès !",
    });
    setCurrentStep(3);
  };

  const handleStripeCancel = () => {
    setShowStripeCheckout(false);
  };

  const handleUpgradeToCreator = () => {
    roleUpgradeMutation.mutate('creator');
  };

  const getStepProgress = () => {
    if (walletInfo?.canInvest) return 100;
    if (walletInfo?.kycVerified) return 66;
    return 33;
  };

  const canProceedToInvestment = walletInfo?.canInvest;

  if (walletLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Bienvenue sur VISUAL
          </h1>
          <p className="text-lg text-muted-foreground mb-6">
            Finalisez votre profil pour commencer à investir dans du contenu visuel
          </p>
          <Progress value={getStepProgress()} className="w-full max-w-md mx-auto" />
        </div>

        {/* Current Status Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Statut de votre compte
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                {walletInfo?.kycVerified ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                )}
                <span className="font-medium">KYC</span>
                <Badge variant={walletInfo?.kycVerified ? "default" : "secondary"}>
                  {walletInfo?.kycVerified ? "Vérifié" : "En attente"}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                <span className="font-medium">Caution</span>
                <Badge variant={walletInfo?.cautionEUR && walletInfo.cautionEUR >= 20 ? "default" : "secondary"}>
                  €{walletInfo?.cautionEUR?.toFixed(2) || '0.00'}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                <span className="font-medium">Mode</span>
                <Badge variant="outline">
                  {walletInfo?.simulationMode ? "Simulation" : "Réel"}
                </Badge>
              </div>
            </div>
            
            {walletInfo?.simulationMode && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  💡 Vous êtes en mode simulation avec €{walletInfo.balanceEUR?.toFixed(2)} de fonds virtuels
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Step 1: KYC Verification */}
          <Card className={walletInfo?.kycVerified ? "border-green-200 bg-green-50 dark:bg-green-950" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Étape 1: Vérification d'identité (KYC)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {walletInfo?.kycVerified ? (
                <div className="text-center py-4">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                  <p className="text-green-700 dark:text-green-300 font-medium">
                    Votre identité a été vérifiée avec succès !
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    En mode simulation, la vérification KYC est automatique et instantanée. 
                    Cliquez sur le bouton ci-dessous pour finaliser votre vérification.
                  </p>
                  <Button 
                    onClick={handleKYCVerification}
                    disabled={kycMutation.isPending}
                    className="w-full"
                    data-testid="kyc-verify-button"
                  >
                    {kycMutation.isPending ? "Vérification en cours..." : "Vérifier mon identité"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 2: Caution Deposit */}
          <Card className={walletInfo?.cautionEUR && walletInfo.cautionEUR >= 20 ? "border-green-200 bg-green-50 dark:bg-green-950" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Étape 2: Dépôt de caution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {walletInfo?.cautionEUR && walletInfo.cautionEUR >= 20 ? (
                <div className="text-center py-4">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                  <p className="text-green-700 dark:text-green-300 font-medium">
                    Caution de €{walletInfo.cautionEUR.toFixed(2)} déposée !
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Déposez une caution minimum de €20 pour commencer à investir. 
                    En mode simulation, les fonds sont prélevés de votre solde virtuel.
                  </p>
                  
                  <div>
                    <Label htmlFor="caution-amount">Montant de caution (€)</Label>
                    <Input
                      id="caution-amount"
                      type="number"
                      min="20"
                      max="1000"
                      step="10"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="20"
                      disabled={!walletInfo?.kycVerified}
                      data-testid="caution-amount-input"
                    />
                  </div>
                  
                  <Button 
                    onClick={handleDepositCaution}
                    disabled={!walletInfo?.kycVerified || depositMutation.isPending}
                    className="w-full"
                    data-testid="deposit-caution-button"
                  >
                    {depositMutation.isPending ? "Dépôt en cours..." : `Déposer €${depositAmount}`}
                  </Button>
                  
                  {!walletInfo?.kycVerified && (
                    <p className="text-sm text-orange-600 dark:text-orange-400">
                      Terminez d'abord la vérification KYC
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Success and Next Steps */}
        {canProceedToInvestment && (
          <Card className="mt-6 border-green-200 bg-green-50 dark:bg-green-950">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
                <CheckCircle className="h-5 w-5" />
                Félicitations ! Votre compte est prêt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-green-700 dark:text-green-300 mb-4">
                Vous pouvez maintenant investir dans des projets visuels et participer aux live shows !
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={() => setLocation('/projects')}
                  data-testid="browse-projects-button"
                >
                  Découvrir les projets
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => setLocation('/live')}
                  data-testid="view-live-shows-button"
                >
                  Voir les live shows
                </Button>
                
                {user?.profileType === 'investor' && (
                  <Button 
                    variant="outline"
                    onClick={handleUpgradeToCreator}
                    disabled={roleUpgradeMutation.isPending}
                    data-testid="become-creator-button"
                  >
                    {roleUpgradeMutation.isPending ? "Mise à jour..." : "Devenir créateur"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Portfolio Summary */}
        {walletInfo && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Résumé du portefeuille</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-primary">€{walletInfo.balanceEUR.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">Solde disponible</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">€{walletInfo.cautionEUR.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">Caution</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">€{walletInfo.totalInvested.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">Total investi</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">€{walletInfo.totalGains.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">Gains totaux</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Stripe Checkout Modal */}
      {showStripeCheckout && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <Checkout
              amount={parseFloat(depositAmount)}
              type="caution"
              onSuccess={handleStripeSuccess}
              onCancel={handleStripeCancel}
            />
          </div>
        </div>
      )}
    </div>
  );
}