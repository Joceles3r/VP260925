import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Crown, Zap, Shield, Activity, TrendingUp, Users, DollarSign, Eye, Play, Pause, CircleStop as StopCircle, Settings, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Clock, Target, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MasterStats {
  totalUsers: number;
  activeProjects: number;
  totalInvested: number;
  platformRevenue: number;
  top10Projects: number;
  liveShows: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  action: () => void;
  enabled: boolean;
}

export default function MasterControlPanel() {
  const [emergencyReason, setEmergencyReason] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('films');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Stats globales de la plateforme
  const { data: stats, isLoading } = useQuery<MasterStats>({
    queryKey: ['master-stats'],
    queryFn: async () => {
      // Mock data - en production, agrégation de toutes les métriques
      return {
        totalUsers: 15420,
        activeProjects: 487,
        totalInvested: 125000,
        platformRevenue: 37500,
        top10Projects: 60,
        liveShows: 3,
        systemHealth: 'healthy' as const
      };
    },
    refetchInterval: 10000,
  });

  // Actions rapides pour le patron
  const quickActions: QuickAction[] = [
    {
      id: 'close-category',
      title: 'Clôturer Catégorie',
      description: 'Forcer la clôture et redistribution',
      icon: Target,
      color: 'bg-blue-600 hover:bg-blue-700',
      action: () => handleCloseCategory(),
      enabled: true
    },
    {
      id: 'emergency-payout',
      title: 'Paiement d\'Urgence',
      description: 'Déclencher redistribution manuelle',
      icon: Zap,
      color: 'bg-green-600 hover:bg-green-700',
      action: () => handleEmergencyPayout(),
      enabled: true
    },
    {
      id: 'platform-maintenance',
      title: 'Mode Maintenance',
      description: 'Activer/désactiver la plateforme',
      icon: Settings,
      color: 'bg-yellow-600 hover:bg-yellow-700',
      action: () => handleMaintenanceMode(),
      enabled: true
    },
    {
      id: 'global-kill',
      title: 'ARRÊT TOTAL',
      description: 'Stopper tous les agents IA',
      icon: StopCircle,
      color: 'bg-red-600 hover:bg-red-700',
      action: () => handleGlobalKill(),
      enabled: true
    }
  ];

  // Mutations pour les actions rapides
  const closeCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      const response = await fetch('/api/admin/visual-ai/test-category-close?admin=true', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId, dryRun: false })
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "🏆 Catégorie clôturée",
        description: "Redistribution en cours...",
      });
    }
  });

  const emergencyPayoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/finance/test-redistribution?admin=true', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 10000, dryRun: false })
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "💰 Paiement d'urgence exécuté",
        description: "Redistribution terminée",
      });
    }
  });

  const globalKillMutation = useMutation({
    mutationFn: async (reason: string) => {
      // Arrêter tous les agents
      await Promise.all([
        fetch('/api/admin/visual-ai/kill?admin=true', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason })
        }),
        fetch('/api/admin/finance/kill?admin=true', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason })
        }),
        fetch('/api/admin/tc/kill?admin=true', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason })
        })
      ]);
    },
    onSuccess: () => {
      toast({
        title: "🚨 ARRÊT TOTAL ACTIVÉ",
        description: "Tous les agents IA ont été stoppés",
        variant: "destructive"
      });
      queryClient.invalidateQueries();
    }
  });

  const handleCloseCategory = () => {
    if (!selectedCategory) return;
    closeCategoryMutation.mutate(selectedCategory);
  };

  const handleEmergencyPayout = () => {
    emergencyPayoutMutation.mutate();
  };

  const handleMaintenanceMode = () => {
    toast({
      title: "🔧 Mode maintenance",
      description: "Fonctionnalité en développement",
    });
  };

  const handleGlobalKill = () => {
    if (!emergencyReason.trim()) {
      toast({
        title: "Erreur",
        description: "Raison obligatoire pour arrêt total",
        variant: "destructive"
      });
      return;
    }
    globalKillMutation.mutate(emergencyReason);
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'critical': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'critical': return <StopCircle className="h-5 w-5 text-red-500" />;
      default: return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
        <span className="ml-3">Chargement tableau de bord maître...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Patron */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <Crown className="h-8 w-8 text-yellow-500" />
            Tableau de Bord PATRON
          </h2>
          <p className="text-muted-foreground text-lg">
            Contrôle total de la plateforme VISUAL
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {getHealthIcon(stats?.systemHealth || 'healthy')}
          <span className={`font-semibold ${getHealthColor(stats?.systemHealth || 'healthy')}`}>
            Système {stats?.systemHealth === 'healthy' ? 'Opérationnel' : 
                    stats?.systemHealth === 'warning' ? 'Attention' : 'Critique'}
          </span>
        </div>
      </div>

      {/* Métriques globales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-300">Utilisateurs Actifs</p>
                <p className="text-3xl font-bold text-white">{stats?.totalUsers.toLocaleString()}</p>
                <p className="text-xs text-blue-400">+12% ce mois</p>
              </div>
              <Users className="h-10 w-10 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500/10 to-violet-500/10 border-purple-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-300">Projets Actifs</p>
                <p className="text-3xl font-bold text-white">{stats?.activeProjects}</p>
                <p className="text-xs text-purple-400">6 catégories</p>
              </div>
              <Eye className="h-10 w-10 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-300">Volume Investi</p>
                <p className="text-3xl font-bold text-white">{(stats?.totalInvested || 0).toLocaleString()}€</p>
                <p className="text-xs text-green-400">Micro-investissements</p>
              </div>
              <TrendingUp className="h-10 w-10 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-300">Revenus Plateforme</p>
                <p className="text-3xl font-bold text-white">{(stats?.platformRevenue || 0).toLocaleString()}€</p>
                <p className="text-xs text-yellow-400">30% des ventes</p>
              </div>
              <DollarSign className="h-10 w-10 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions rapides du patron */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-yellow-500" />
            Actions Rapides PATRON
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.id}
                  onClick={action.action}
                  disabled={!action.enabled}
                  className={`${action.color} h-auto p-4 flex flex-col items-center gap-2 text-white font-semibold`}
                >
                  <Icon className="h-6 w-6" />
                  <div className="text-center">
                    <div className="text-sm">{action.title}</div>
                    <div className="text-xs opacity-80">{action.description}</div>
                  </div>
                </Button>
              );
            })}
          </div>

          {/* Contrôles spécialisés */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <Target className="h-5 w-5" />
                Clôture de Catégorie
              </h4>
              <div className="flex gap-2">
                <select 
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="flex-1 p-2 rounded-md border bg-background"
                >
                  <option value="films">Films (87/100)</option>
                  <option value="videos">Vidéos (94/100)</option>
                  <option value="documentaires">Documentaires (76/100)</option>
                  <option value="livres">Livres (43/100)</option>
                </select>
                <Button 
                  onClick={handleCloseCategory}
                  disabled={closeCategoryMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Clôturer
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Arrêt d'Urgence Global
              </h4>
              <div className="flex gap-2">
                <Input
                  placeholder="Raison de l'arrêt total..."
                  value={emergencyReason}
                  onChange={(e) => setEmergencyReason(e.target.value)}
                  className="flex-1"
                />
                <Button
                  variant="destructive"
                  onClick={handleGlobalKill}
                  disabled={globalKillMutation.isPending || !emergencyReason.trim()}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <StopCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vue d'ensemble temps réel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Activité Temps Réel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm">Nouveaux investissements</span>
                </div>
                <Badge variant="secondary">+23 dernière heure</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-sm">Projets soumis</span>
                </div>
                <Badge variant="secondary">+8 en attente</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500 animate-pulse" />
                  <span className="text-sm">Shows live</span>
                </div>
                <Badge variant="secondary">{stats?.liveShows} actifs</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              Contrôle Plateforme
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Mode Streaming</span>
                <Badge className="bg-green-500/20 text-green-300">Actif</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Micro-Investissements</span>
                <Badge className="bg-blue-500/20 text-blue-300">Actif</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Redistributions Auto</span>
                <Badge className="bg-purple-500/20 text-purple-300">Actif</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Agents IA</span>
                <Badge className="bg-green-500/20 text-green-300">3/3 Opérationnels</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}