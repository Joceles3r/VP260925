import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Target, 
  TrendingUp, 
  AlertTriangle, 
  Play, 
  Pause, 
  StopCircle,
  Eye,
  MousePointer,
  Users,
  DollarSign,
  Activity,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ScoutMetrics {
  activeSegments: number;
  activeCampaigns: number;
  totalReach: number;
  avgCTR: number;
  avgCVR: number;
  totalSpent: number;
  conversions: number;
  topKeywords: Array<{ keyword: string; score: number }>;
}

interface Segment {
  id: string;
  name: string;
  rules: {
    keywords: string[];
    lang: string[];
    zones?: string[];
  };
  locale: string;
  status: 'active' | 'paused';
  createdAt: string;
}

interface Campaign {
  id: string;
  channel: string;
  objective: string;
  budgetCents: number;
  status: 'draft' | 'active' | 'paused' | 'stopped';
  createdAt: string;
}

export default function VisualScoutPanel() {
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [simulationBudget, setSimulationBudget] = useState<number>(100);
  const [emergencyReason, setEmergencyReason] = useState<string>('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Récupération des métriques dashboard
  const { data: metrics, isLoading: metricsLoading } = useQuery<ScoutMetrics>({
    queryKey: ['scout-metrics'],
    queryFn: async () => {
      const response = await fetch('/api/admin/tc/dashboard?admin=true');
      const result = await response.json();
      return result.data;
    },
    refetchInterval: 30000, // Refresh toutes les 30s
  });

  // Récupération des segments
  const { data: segments = [], isLoading: segmentsLoading } = useQuery<Segment[]>({
    queryKey: ['scout-segments'],
    queryFn: async () => {
      const response = await fetch('/api/admin/tc/segments?admin=true');
      const result = await response.json();
      return result.data;
    },
  });

  // Simulation de campagne
  const simulateMutation = useMutation({
    mutationFn: async (data: { segmentId: string; budget: number; channel: string }) => {
      const response = await fetch('/api/admin/tc/simulate?admin=true', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Simulation terminée ✅",
        description: `Reach estimé: ${data.data.reachPred} • CTR: ${data.data.ctrPred}%`
      });
    }
  });

  // Kill switch
  const killSwitchMutation = useMutation({
    mutationFn: async (reason: string) => {
      const response = await fetch('/api/admin/tc/kill?admin=true', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "🚨 Arrêt d'urgence activé",
        description: "VisualScoutAI a été désactivé",
        variant: "destructive"
      });
      queryClient.invalidateQueries({ queryKey: ['scout-metrics'] });
    }
  });

  const handleSimulate = () => {
    if (!selectedSegment) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un segment",
        variant: "destructive"
      });
      return;
    }

    simulateMutation.mutate({
      segmentId: selectedSegment,
      budget: simulationBudget,
      channel: 'meta_ads'
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

  if (metricsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
        <span className="ml-3">Chargement VisualScoutAI...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Search className="h-6 w-6 text-blue-500" />
            VisualScoutAI
          </h2>
          <p className="text-muted-foreground">
            Agent de prospection éthique et détection d'audiences
          </p>
        </div>
        
        {/* Kill Switch */}
        <div className="flex items-center gap-2">
          <Input
            placeholder="Raison de l'arrêt..."
            value={emergencyReason}
            onChange={(e) => setEmergencyReason(e.target.value)}
            className="w-48"
          />
          <Button
            variant="destructive"
            onClick={handleEmergencyStop}
            disabled={killSwitchMutation.isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            <StopCircle className="h-4 w-4 mr-2" />
            Kill Switch
          </Button>
        </div>
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Reach Total</p>
                <p className="text-2xl font-bold">{metrics?.totalReach.toLocaleString()}</p>
              </div>
              <Eye className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">CTR Moyen</p>
                <p className="text-2xl font-bold">{metrics?.avgCTR}%</p>
              </div>
              <MousePointer className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Conversions</p>
                <p className="text-2xl font-bold">{metrics?.conversions}</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Budget Utilisé</p>
                <p className="text-2xl font-bold">€{metrics?.totalSpent}</p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="segments">Segments</TabsTrigger>
          <TabsTrigger value="campaigns">Campagnes</TabsTrigger>
          <TabsTrigger value="simulator">Simulateur</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          {/* Top Keywords */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Mots-clés performants
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {metrics?.topKeywords.map((keyword, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <span className="font-medium">{keyword.keyword}</span>
                    <Badge variant="secondary">
                      Score: {keyword.score}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Statut des campagnes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Statut en temps réel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
                  <p className="text-2xl font-bold text-green-600">{metrics?.activeSegments}</p>
                  <p className="text-sm text-muted-foreground">Segments actifs</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <p className="text-2xl font-bold text-blue-600">{metrics?.activeCampaigns}</p>
                  <p className="text-sm text-muted-foreground">Campagnes en cours</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="segments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Segments d'audience</CardTitle>
            </CardHeader>
            <CardContent>
              {segmentsLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : (
                <div className="space-y-4">
                  {segments.map((segment) => (
                    <div 
                      key={segment.id} 
                      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                        selectedSegment === segment.id 
                          ? 'border-primary bg-primary/5' 
                          : 'border-muted hover:border-muted-foreground'
                      }`}
                      onClick={() => setSelectedSegment(segment.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{segment.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {segment.rules.keywords.join(', ')} • {segment.locale}
                          </p>
                        </div>
                        <Badge variant={segment.status === 'active' ? 'default' : 'secondary'}>
                          {segment.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="simulator" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Simulateur de campagne
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Budget (€)</label>
                  <Input
                    type="number"
                    value={simulationBudget}
                    onChange={(e) => setSimulationBudget(Number(e.target.value))}
                    min={10}
                    max={1000}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Segment sélectionné</label>
                  <p className="text-sm text-muted-foreground mt-2">
                    {selectedSegment ? 
                      segments.find(s => s.id === selectedSegment)?.name || 'Segment inconnu' : 
                      'Aucun segment sélectionné'
                    }
                  </p>
                </div>
              </div>

              <Button 
                onClick={handleSimulate}
                disabled={!selectedSegment || simulateMutation.isPending}
                className="w-full"
              >
                {simulateMutation.isPending ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Simulation en cours...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Simuler la campagne
                  </>
                )}
              </Button>

              {simulateMutation.data && (
                <div className="mt-4 p-4 rounded-lg bg-muted/50">
                  <h4 className="font-semibold mb-2">Résultats de simulation</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Reach estimé:</span>
                      <span className="ml-2 font-semibold">{simulateMutation.data.data.reachPred.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">CTR prédit:</span>
                      <span className="ml-2 font-semibold">{simulateMutation.data.data.ctrPred}%</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Conversions:</span>
                      <span className="ml-2 font-semibold">{simulateMutation.data.data.conversionsPred}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Score d'intérêt:</span>
                      <span className="ml-2 font-semibold">{simulateMutation.data.data.interestScore}/100</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Campagnes actives</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune campagne active</p>
                <p className="text-sm">Créez un segment et simulez pour commencer</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Zone d'urgence */}
      <Card className="border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-900/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Zone d'urgence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            En cas de problème, utilisez le kill switch pour arrêter immédiatement toutes les opérations VisualScoutAI.
          </p>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Raison de l'arrêt d'urgence..."
              value={emergencyReason}
              onChange={(e) => setEmergencyReason(e.target.value)}
              className="flex-1"
            />
            <Button
              variant="destructive"
              onClick={handleEmergencyStop}
              disabled={killSwitchMutation.isPending || !emergencyReason.trim()}
            >
              {killSwitchMutation.isPending ? (
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <StopCircle className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}