import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Zap,
  Shield,
  Eye,
  Brain
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AgentStatus {
  name: string;
  enabled: boolean;
  lastActivity: string;
  health: 'healthy' | 'warning' | 'error';
  metrics: Record<string, any>;
}

interface SystemHealth {
  overall: 'healthy' | 'warning' | 'critical';
  agents: AgentStatus[];
  lastCoordination: string;
}

const agentIcons = {
  'VisualScoutAI': Search,
  'VisualAI': Brain,
  'VisualFinanceAI': DollarSign
};

const healthColors = {
  healthy: 'text-green-500',
  warning: 'text-yellow-500',
  error: 'text-red-500'
};

const healthBadgeVariants = {
  healthy: 'default',
  warning: 'secondary',
  error: 'destructive'
} as const;

export default function AgentCoordinatorPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Récupération du statut système
  const { data: systemHealth, isLoading } = useQuery<SystemHealth>({
    queryKey: ['agents-status'],
    queryFn: async () => {
      const response = await fetch('/api/admin/agents/status?admin=true');
      const result = await response.json();
      return result.data;
    },
    refetchInterval: 10000, // Refresh toutes les 10s
  });

  // Commande d'arrêt d'urgence global
  const emergencyStopMutation = useMutation({
    mutationFn: async (reason: string) => {
      const response = await fetch('/api/admin/agents/command?admin=true', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentName: 'ALL',
          action: 'emergency_stop',
          parameters: { reason },
          priority: 'urgent'
        })
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "🚨 Arrêt d'urgence global activé",
        description: "Tous les agents IA ont été arrêtés",
        variant: "destructive"
      });
      queryClient.invalidateQueries({ queryKey: ['agents-status'] });
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
        <span className="ml-3">Chargement statut des agents...</span>
      </div>
    );
  }

  const getOverallHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy': return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-6 w-6 text-yellow-500" />;
      case 'critical': return <XCircle className="h-6 w-6 text-red-500" />;
      default: return <Activity className="h-6 w-6 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header avec statut global */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-500" />
            Coordinateur d'Agents IA
          </h2>
          <p className="text-muted-foreground">
            Supervision et coordination des agents VISUAL
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {getOverallHealthIcon(systemHealth?.overall || 'healthy')}
            <span className="font-medium">
              Système {systemHealth?.overall === 'healthy' ? 'Sain' : 
                      systemHealth?.overall === 'warning' ? 'Attention' : 'Critique'}
            </span>
          </div>
          
          <Button
            variant="destructive"
            onClick={() => emergencyStopMutation.mutate('Arrêt manuel admin')}
            disabled={emergencyStopMutation.isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            <StopCircle className="h-4 w-4 mr-2" />
            Arrêt Global
          </Button>
        </div>
      </div>

      {/* Statut des agents */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {systemHealth?.agents.map((agent) => {
          const Icon = agentIcons[agent.name as keyof typeof agentIcons] || Activity;
          
          return (
            <Card key={agent.name} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Icon className={`h-5 w-5 ${healthColors[agent.health]}`} />
                    {agent.name}
                  </CardTitle>
                  <Badge variant={healthBadgeVariants[agent.health]}>
                    {agent.health}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Statut:</span>
                    <span className={agent.enabled ? 'text-green-600' : 'text-red-600'}>
                      {agent.enabled ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dernière activité:</span>
                    <span>{new Date(agent.lastActivity).toLocaleTimeString()}</span>
                  </div>

                  {/* Métriques spécifiques */}
                  {agent.name === 'VisualScoutAI' && agent.metrics.totalReach && (
                    <div className="mt-3 pt-3 border-t border-muted">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Reach:</span>
                          <span className="ml-1 font-semibold">{agent.metrics.totalReach.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">CTR:</span>
                          <span className="ml-1 font-semibold">{agent.metrics.avgCTR}%</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Conversions:</span>
                          <span className="ml-1 font-semibold">{agent.metrics.conversions}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Budget:</span>
                          <span className="ml-1 font-semibold">€{agent.metrics.totalSpent}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Règles de coordination */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-500" />
            Règles de Coordination
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
              <div>
                <p className="font-medium">VisualScoutAI → VisualAI (Maître)</p>
                <p className="text-muted-foreground">
                  VisualScoutAI obéit aux décisions de VisualAI et respecte les toggles de catégories
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
              <div>
                <p className="font-medium">VisualScoutAI ↔ VisualFinanceAI</p>
                <p className="text-muted-foreground">
                  Coordination pour les budgets de campagne et reporting financier
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-purple-500 mt-2" />
              <div>
                <p className="font-medium">Conformité RGPD/CCPA</p>
                <p className="text-muted-foreground">
                  Respect strict de la vie privée, APIs officielles uniquement, opt-in requis
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dernière coordination */}
      <Card className="bg-muted/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Dernière coordination système</p>
              <p className="text-xs text-muted-foreground">
                {systemHealth?.lastCoordination ? 
                  new Date(systemHealth.lastCoordination).toLocaleString() : 
                  'Jamais'
                }
              </p>
            </div>
            <Button variant="outline" size="sm">
              <Activity className="h-4 w-4 mr-2" />
              Forcer coordination
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}