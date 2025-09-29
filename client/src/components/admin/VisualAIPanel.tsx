import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, CircleCheck as CheckCircle, Circle as XCircle, Clock, TriangleAlert as AlertTriangle, Zap, Shield, Activity, TrendingUp, Users, FileText, Settings, CircleStop as StopCircle, Play, Pause } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AIDecision {
  id: string;
  type: 'orchestration' | 'moderation' | 'financial' | 'seo';
  action: string;
  parameters: Record<string, any>;
  confidence: number;
  requiresValidation: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'executed';
  createdAt: string;
  validatedAt?: string;
  validatedBy?: string;
  executedAt?: string;
  result?: Record<string, any>;
}

interface PerformanceMetrics {
  decisionsPerHour: number;
  averageConfidence: number;
  validationRate: number;
  executionSuccessRate: number;
  pendingDecisions: number;
}

export default function VisualAIPanel() {
  const [selectedDecision, setSelectedDecision] = useState<string | null>(null);
  const [emergencyReason, setEmergencyReason] = useState('');
  const [testCategoryId, setTestCategoryId] = useState('films');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Récupération des métriques de performance
  const { data: metrics, isLoading: metricsLoading } = useQuery<PerformanceMetrics>({
    queryKey: ['visual-ai-metrics'],
    queryFn: async () => {
      const response = await fetch('/api/admin/visual-ai/metrics?admin=true');
      const result = await response.json();
      return result.data;
    },
    refetchInterval: 10000, // Refresh toutes les 10s
  });

  // Récupération des décisions en attente
  const { data: pendingDecisions = [], isLoading: decisionsLoading } = useQuery<AIDecision[]>({
    queryKey: ['visual-ai-decisions'],
    queryFn: async () => {
      const response = await fetch('/api/admin/visual-ai/decisions?admin=true');
      const result = await response.json();
      return result.data;
    },
    refetchInterval: 5000, // Refresh toutes les 5s
  });

  // Validation d'une décision
  const validateDecisionMutation = useMutation({
    mutationFn: async (data: { decisionId: string; approved: boolean; notes?: string }) => {
      const response = await fetch('/api/admin/visual-ai/decisions/validate?admin=true', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return response.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: variables.approved ? "✅ Décision approuvée" : "❌ Décision rejetée",
        description: `L'action ${variables.approved ? 'sera exécutée' : 'a été annulée'}`,
      });
      queryClient.invalidateQueries({ queryKey: ['visual-ai-decisions'] });
      queryClient.invalidateQueries({ queryKey: ['visual-ai-metrics'] });
    }
  });

  // Test de clôture de catégorie
  const testCategoryCloseMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      const response = await fetch('/api/admin/visual-ai/test-category-close?admin=true', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId, dryRun: true })
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "🧪 Test de clôture réussi",
        description: `Simulation terminée - ${data.data.payoutsCount} paiements calculés`,
      });
    }
  });

  // Kill switch
  const killSwitchMutation = useMutation({
    mutationFn: async (reason: string) => {
      const response = await fetch('/api/admin/visual-ai/kill?admin=true', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "🚨 Arrêt d'urgence activé",
        description: "VisualAI a été désactivé",
        variant: "destructive"
      });
      queryClient.invalidateQueries({ queryKey: ['visual-ai-metrics'] });
    }
  });

  const handleValidateDecision = (decisionId: string, approved: boolean) => {
    validateDecisionMutation.mutate({
      decisionId,
      approved,
      notes: approved ? 'Approuvé par admin' : 'Rejeté par admin'
    });
  };

  const handleTestCategoryClose = () => {
    if (!testCategoryId) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une catégorie",
        variant: "destructive"
      });
      return;
    }
    testCategoryCloseMutation.mutate(testCategoryId);
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

  const getDecisionIcon = (type: string) => {
    switch (type) {
      case 'orchestration': return <Activity className="h-4 w-4 text-blue-500" />;
      case 'moderation': return <Shield className="h-4 w-4 text-yellow-500" />;
      case 'financial': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'seo': return <FileText className="h-4 w-4 text-purple-500" />;
      default: return <Brain className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-500';
      case 'approved': return 'text-green-500';
      case 'rejected': return 'text-red-500';
      case 'executed': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  if (metricsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
        <span className="ml-3">Chargement VisualAI...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec métriques */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-blue-500" />
            VisualAI - Agent Maître
          </h2>
          <p className="text-muted-foreground">
            Orchestrateur global : modération, SEO, notifications, classements
          </p>
        </div>
        
        {/* Métriques temps réel */}
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-500">{metrics?.decisionsPerHour || 0}</p>
            <p className="text-xs text-muted-foreground">Décisions/h</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-500">{metrics?.averageConfidence.toFixed(1) || 0}%</p>
            <p className="text-xs text-muted-foreground">Confiance</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-500">{metrics?.pendingDecisions || 0}</p>
            <p className="text-xs text-muted-foreground">En attente</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="decisions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="decisions">Décisions IA</TabsTrigger>
          <TabsTrigger value="orchestration">Orchestration</TabsTrigger>
          <TabsTrigger value="moderation">Modération</TabsTrigger>
          <TabsTrigger value="controls">Contrôles</TabsTrigger>
        </TabsList>

        <TabsContent value="decisions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Décisions en attente de validation
                {pendingDecisions.length > 0 && (
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    {pendingDecisions.length}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {decisionsLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : pendingDecisions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune décision en attente</p>
                  <p className="text-sm">Toutes les décisions IA ont été traitées</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingDecisions.map((decision) => (
                    <div 
                      key={decision.id} 
                      className="p-4 rounded-lg border bg-muted/20 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getDecisionIcon(decision.type)}
                            <span className="font-semibold">{decision.action}</span>
                            <Badge variant="outline" className={getStatusColor(decision.status)}>
                              {decision.status}
                            </Badge>
                            <Badge variant="secondary">
                              Confiance: {decision.confidence}%
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-2">
                            {JSON.stringify(decision.parameters, null, 2)}
                          </p>
                          
                          <p className="text-xs text-muted-foreground">
                            Créé le {new Date(decision.createdAt).toLocaleString()}
                          </p>
                        </div>
                        
                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            onClick={() => handleValidateDecision(decision.id, true)}
                            disabled={validateDecisionMutation.isPending}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approuver
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleValidateDecision(decision.id, false)}
                            disabled={validateDecisionMutation.isPending}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Rejeter
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orchestration" className="space-y-4">
          {/* Test de clôture de catégorie */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Test de Clôture de Catégorie
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Catégorie à tester</label>
                  <select 
                    value={testCategoryId}
                    onChange={(e) => setTestCategoryId(e.target.value)}
                    className="w-full mt-1 p-2 rounded-md border bg-background"
                  >
                    <option value="films">Films / Vidéos</option>
                    <option value="documentaires">Documentaires</option>
                    <option value="livres">Livres</option>
                    <option value="voix_info">Voix de l'Info</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={handleTestCategoryClose}
                    disabled={testCategoryCloseMutation.isPending}
                    className="w-full"
                  >
                    {testCategoryCloseMutation.isPending ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                        Test en cours...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Tester la clôture
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Algorithme de clôture</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>1. Sélection TOP 10 par votes</p>
                  <p>2. Calcul coefficient d'engagement</p>
                  <p>3. Application tie-breakers déterministes</p>
                  <p>4. Redistribution 40/30/7/23 avec arrondis</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Génération SEO */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                SEO & Internationalisation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Button variant="outline" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Générer Sitemaps
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Mettre à jour Schema.org
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Optimiser hreflang
                </Button>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
                  SEO automatique activé
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-400">
                  Génération automatique des sitemaps, balises hreflang et métadonnées Schema.org
                  pour les 3 langues supportées (FR, EN, ES).
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="moderation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Modération Automatique
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Seuils de modération</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Suspension automatique :</span>
                      <span className="font-semibold">3 signalements</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Escalade humaine :</span>
                      <span className="font-semibold">Score > 75</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Timeout review :</span>
                      <span className="font-semibold">24 heures</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3">Actions automatiques</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span>Approbation automatique (score < 50)</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <span>Suspension préventive (50-75)</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <span>Escalade obligatoire (> 75)</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="controls" className="space-y-4">
          {/* Paramètres runtime */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Paramètres Runtime
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Prix extension (€)</label>
                    <Input type="number" defaultValue="25" className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Seuil VISUpoints</label>
                    <Input type="number" defaultValue="2500" className="mt-1" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Frais plateforme (%)</label>
                    <Input type="number" defaultValue="30" className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Mode pot 24h</label>
                    <select className="w-full mt-1 p-2 rounded-md border bg-background">
                      <option value="equipartition">Équipartition</option>
                      <option value="weighted">Pondéré</option>
                      <option value="group_ratio">Ratio groupes</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <Button className="mt-4 w-full">
                <Settings className="h-4 w-4 mr-2" />
                Sauvegarder les paramètres
              </Button>
            </CardContent>
          </Card>

          {/* Zone d'urgence */}
          <Card className="border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-900/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Contrôles d'urgence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                En cas de problème critique, utilisez le kill switch pour arrêter immédiatement VisualAI.
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
        </TabsContent>
      </Tabs>
    </div>
  );
}