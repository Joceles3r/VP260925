import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  TrendingUp, 
  PieChart, 
  BarChart3, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  FileText,
  Calculator,
  CreditCard,
  StopCircle,
  RefreshCw,
  Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FinancialMetrics {
  totalProcessed: number;
  totalFees: number;
  totalPayouts: number;
  averageTransactionSize: number;
  ledgerEntries: number;
  pendingTransfers: number;
  lastReconciliation: string;
}

interface PayoutRecipe {
  id: string;
  type: string;
  version: string;
  parameters: Record<string, any>;
  payouts: Array<{
    type: string;
    userId?: string;
    cents: number;
    rank?: number;
  }>;
  totalCents: number;
  createdAt: string;
  executedAt?: string;
}

interface LedgerEntry {
  id: string;
  orderId?: string;
  type: string;
  grossCents: number;
  netCents: number;
  feeCents: number;
  fromUserId?: string;
  toUserId?: string;
  hash: string;
  createdAt: string;
}

export default function VisualFinancePanel() {
  const [testAmount, setTestAmount] = useState<number>(1000);
  const [testUserId, setTestUserId] = useState<string>('test-user-1');
  const [emergencyReason, setEmergencyReason] = useState<string>('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Récupération des métriques financières
  const { data: metrics, isLoading: metricsLoading } = useQuery<FinancialMetrics>({
    queryKey: ['finance-metrics'],
    queryFn: async () => {
      const response = await fetch('/api/admin/finance/metrics?admin=true');
      const result = await response.json();
      return result.data;
    },
    refetchInterval: 30000, // Refresh toutes les 30s
  });

  // Récupération des recettes de paiement
  const { data: recipes = [], isLoading: recipesLoading } = useQuery<PayoutRecipe[]>({
    queryKey: ['payout-recipes'],
    queryFn: async () => {
      const response = await fetch('/api/admin/finance/recipes?admin=true');
      const result = await response.json();
      return result.data;
    },
  });

  // Récupération du ledger
  const { data: ledgerEntries = [], isLoading: ledgerLoading } = useQuery<LedgerEntry[]>({
    queryKey: ['ledger-entries'],
    queryFn: async () => {
      const response = await fetch('/api/admin/finance/ledger?admin=true');
      const result = await response.json();
      return result.data;
    },
  });

  // Test de redistribution 40/30/7/23
  const testRedistributionMutation = useMutation({
    mutationFn: async (data: { amount: number; dryRun: boolean }) => {
      const response = await fetch('/api/admin/finance/test-redistribution?admin=true', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "🧮 Test de redistribution réussi",
        description: `Simulation 40/30/7/23 terminée - ${data.data.payoutsCount} paiements calculés`,
      });
    }
  });

  // Conversion VISUpoints
  const convertPointsMutation = useMutation({
    mutationFn: async (data: { userId: string; points: number }) => {
      const response = await fetch('/api/admin/finance/convert-points?admin=true', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "💎 Conversion VISUpoints réussie",
        description: `${data.data.euros}€ transférés, ${data.data.pointsLeft} points restants`,
      });
      queryClient.invalidateQueries({ queryKey: ['finance-metrics'] });
    }
  });

  // Vérification intégrité ledger
  const verifyLedgerMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/finance/verify-ledger?admin=true', {
        method: 'POST'
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: data.data.valid ? "✅ Ledger intègre" : "❌ Problème détecté",
        description: data.data.valid 
          ? `${data.data.totalEntries} entrées vérifiées` 
          : `${data.data.errors.length} erreurs trouvées`,
        variant: data.data.valid ? "default" : "destructive"
      });
    }
  });

  // Kill switch
  const killSwitchMutation = useMutation({
    mutationFn: async (reason: string) => {
      const response = await fetch('/api/admin/finance/kill?admin=true', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "🚨 Arrêt d'urgence financier activé",
        description: "VisualFinanceAI a été désactivé",
        variant: "destructive"
      });
      queryClient.invalidateQueries({ queryKey: ['finance-metrics'] });
    }
  });

  const handleTestRedistribution = () => {
    testRedistributionMutation.mutate({
      amount: testAmount,
      dryRun: true
    });
  };

  const handleConvertPoints = () => {
    if (!testUserId || testAmount < 2500) {
      toast({
        title: "Erreur",
        description: "Minimum 2500 points requis",
        variant: "destructive"
      });
      return;
    }
    
    convertPointsMutation.mutate({
      userId: testUserId,
      points: testAmount
    });
  };

  const handleEmergencyStop = () => {
    if (!emergencyReason.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez indiquer une raison pour l'arrêt d'urgence",
        variant: "destructive"
      });
      return;
    }
    killSwitchMutation.mutate(emergencyReason);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  if (metricsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
        <span className="ml-3">Chargement VisualFinanceAI...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec métriques */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-green-500" />
            VisualFinanceAI - Agent Financier
          </h2>
          <p className="text-muted-foreground">
            Moteur déterministe des règles financières et redistributions
          </p>
        </div>
        
        {/* Métriques temps réel */}
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-500">{formatCurrency(metrics?.totalProcessed || 0)}</p>
            <p className="text-xs text-muted-foreground">Traité</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-500">{formatCurrency(metrics?.totalFees || 0)}</p>
            <p className="text-xs text-muted-foreground">Frais</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-500">{metrics?.ledgerEntries || 0}</p>
            <p className="text-xs text-muted-foreground">Entrées ledger</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="redistribution">Redistributions</TabsTrigger>
          <TabsTrigger value="visupoints">VISUpoints</TabsTrigger>
          <TabsTrigger value="ledger">Ledger</TabsTrigger>
          <TabsTrigger value="controls">Contrôles</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          {/* Métriques principales */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Volume Total</p>
                    <p className="text-2xl font-bold">{formatCurrency(metrics?.totalProcessed || 0)}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Frais Plateforme</p>
                    <p className="text-2xl font-bold">{formatCurrency(metrics?.totalFees || 0)}</p>
                  </div>
                  <PieChart className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Payouts Créateurs</p>
                    <p className="text-2xl font-bold">{formatCurrency(metrics?.totalPayouts || 0)}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Taille Moy. Transaction</p>
                    <p className="text-2xl font-bold">{formatCurrency(metrics?.averageTransactionSize || 0)}</p>
                  </div>
                  <Calculator className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Règles financières */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Règles Financières Actives
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
                    Événements Catégorie
                  </h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Investisseurs TOP10:</span>
                      <span className="font-semibold">40%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Porteurs TOP10:</span>
                      <span className="font-semibold">30%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Investisseurs 11-100:</span>
                      <span className="font-semibold">7%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>VISUAL:</span>
                      <span className="font-semibold">23%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 dark:text-green-300 mb-2">
                    Ventes Articles
                  </h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Créateur:</span>
                      <span className="font-semibold">70%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>VISUAL:</span>
                      <span className="font-semibold">30%</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      Comptabilité au centime
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-900 dark:text-purple-300 mb-2">
                    Pot Mensuel Livres
                  </h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Auteurs gagnants:</span>
                      <span className="font-semibold">60%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Lecteurs gagnants:</span>
                      <span className="font-semibold">40%</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      Cycle mensuel calendaire
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="redistribution" className="space-y-4">
          {/* Test de redistribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Test de Redistribution 40/30/7/23
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Montant à redistribuer (€)</label>
                  <Input
                    type="number"
                    value={testAmount}
                    onChange={(e) => setTestAmount(Number(e.target.value))}
                    min={100}
                    max={50000}
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={handleTestRedistribution}
                    disabled={testRedistributionMutation.isPending}
                    className="w-full"
                  >
                    {testRedistributionMutation.isPending ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                        Calcul en cours...
                      </>
                    ) : (
                      <>
                        <Calculator className="h-4 w-4 mr-2" />
                        Simuler redistribution
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Formule de redistribution</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• Calcul en centimes pour précision maximale</p>
                  <p>• Paiements utilisateurs arrondis à l'euro inférieur</p>
                  <p>• Restes d'arrondis → VISUAL (transparence totale)</p>
                  <p>• Parts TOP 10 selon coefficients prédéfinis</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Historique des recettes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Historique des Redistributions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recipesLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : recipes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune redistribution effectuée</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recipes.slice(0, 5).map((recipe) => (
                    <div key={recipe.id} className="p-4 rounded-lg border bg-muted/20">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{recipe.type}</Badge>
                          <span className="font-semibold">{recipe.version}</span>
                        </div>
                        <span className="font-bold">{formatCurrency(recipe.totalCents / 100)}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {recipe.payouts.length} paiements • {new Date(recipe.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visupoints" className="space-y-4">
          {/* Test conversion VISUpoints */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Test Conversion VISUpoints
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">User ID</label>
                  <Input
                    value={testUserId}
                    onChange={(e) => setTestUserId(e.target.value)}
                    placeholder="test-user-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Points à convertir</label>
                  <Input
                    type="number"
                    value={testAmount}
                    onChange={(e) => setTestAmount(Number(e.target.value))}
                    min={2500}
                    max={100000}
                  />
                </div>
              </div>
              
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="h-4 w-4 text-yellow-600" />
                  <span className="font-semibold text-yellow-900 dark:text-yellow-300">
                    Règles de conversion
                  </span>
                </div>
                <div className="text-sm text-yellow-800 dark:text-yellow-400 space-y-1">
                  <p>• 100 VISUpoints = 1€</p>
                  <p>• Seuil minimum : 2 500 points (25€)</p>
                  <p>• Conversion floor à l'euro</p>
                  <p>• KYC + Stripe requis</p>
                </div>
              </div>

              <Button 
                onClick={handleConvertPoints}
                disabled={convertPointsMutation.isPending}
                className="w-full"
              >
                {convertPointsMutation.isPending ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Conversion en cours...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Convertir {testAmount} points → {Math.floor(testAmount / 100)}€
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ledger" className="space-y-4">
          {/* Vérification intégrité */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Intégrité du Ledger
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Button 
                  onClick={() => verifyLedgerMutation.mutate()}
                  disabled={verifyLedgerMutation.isPending}
                  variant="outline"
                >
                  {verifyLedgerMutation.isPending ? (
                    <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Vérifier l'intégrité
                </Button>
                
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Exporter CSV
                </Button>
                
                <Button variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Réconciliation Stripe
                </Button>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <h4 className="font-semibold text-green-900 dark:text-green-300 mb-2">
                  Hash chaîné activé
                </h4>
                <p className="text-sm text-green-800 dark:text-green-400">
                  Chaque entrée du ledger est liée cryptographiquement à la précédente, 
                  garantissant l'intégrité et l'immutabilité des données financières.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Entrées récentes du ledger */}
          <Card>
            <CardHeader>
              <CardTitle>Entrées Récentes du Ledger</CardTitle>
            </CardHeader>
            <CardContent>
              {ledgerLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : ledgerEntries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune entrée dans le ledger</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {ledgerEntries.slice(0, 10).map((entry) => (
                    <div key={entry.id} className="p-3 rounded-lg border bg-muted/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline">{entry.type}</Badge>
                            <span className="text-sm font-mono">{entry.hash.slice(0, 8)}...</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(entry.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(entry.grossCents / 100)}</p>
                          <p className="text-xs text-muted-foreground">
                            Net: {formatCurrency(entry.netCents / 100)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="controls" className="space-y-4">
          {/* Zone d'urgence */}
          <Card className="border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-900/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Contrôles d'Urgence Financiers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                En cas de problème financier critique, utilisez le kill switch pour arrêter 
                immédiatement tous les transferts et opérations VisualFinanceAI.
              </p>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Raison de l'arrêt d'urgence financier..."
                  value={emergencyReason}
                  onChange={(e) => setEmergencyReason(e.target.value)}
                  className="flex-1"
                />
                <Button
                  variant="destructive"
                  onClick={handleEmergencyStop}
                  disabled={killSwitchMutation.isPending || !emergencyReason.trim()}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {killSwitchMutation.isPending ? (
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <StopCircle className="h-4 w-4" />
                  )}
                  Kill Switch
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Limites de sécurité */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Limites de Sécurité
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Limites Opérationnelles</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Paiement unitaire max :</span>
                      <span className="font-semibold">500€</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Extension 168h :</span>
                      <span className="font-semibold">25€</span>
                    </div>
                    <div className="flex justify-between">
                      <span>VISUpoints min :</span>
                      <span className="font-semibold">2 500 pts</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3">Audit & Conformité</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Rétention audit :</span>
                      <span className="font-semibold">7 ans</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Hash chaîné :</span>
                      <span className="font-semibold text-green-600">Actif</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Idempotence :</span>
                      <span className="font-semibold text-green-600">Garantie</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}