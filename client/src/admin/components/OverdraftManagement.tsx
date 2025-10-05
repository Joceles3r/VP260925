import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CreditCard,
  TrendingDown,
  Shield,
  AlertTriangle,
  Users,
  Euro,
  Clock,
  Settings,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Download,
  Search,
  Filter,
  XCircle
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

// ===== INTERFACES =====

interface OverdraftStats {
  totalUsersInOverdraft: number;
  totalOverdraftAmount: number;
  avgOverdraftAmount: number;
  usersAtRisk: number;
  blockedUsers: number;
  totalFeesCollected: number;
}

interface OverdraftUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  currentBalance: number;
  overdraftLimit: number;
  overdraftAmount: number;
  overdraftPercentage: number;
  alertLevel: 'safe' | 'warning' | 'critical' | 'blocked';
  daysSinceOverdraft: number;
  estimatedFees: number;
  lastAlert?: string;
}

interface GlobalOverdraftConfig {
  defaultLimitInvestor: number;
  defaultLimitCreator: number;
  defaultLimitAdmin: number;
  warningThreshold: number;
  criticalThreshold: number;
  dailyFeeRate: number;
  maxMonthlyFees: number;
  gracePeriodDays: number;
  autoBlockEnabled: boolean;
  alertsEnabled: boolean;
}

// ===== COMPOSANT PRINCIPAL =====

const OverdraftManagement: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState('stats');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('all');

  // ===== QUERIES =====

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin', 'overdraft', 'stats'],
    queryFn: async (): Promise<OverdraftStats> => {
      const response = await fetch('/api/admin/overdraft/stats', { credentials: 'include' });
      if (!response.ok) throw new Error('Erreur lors du chargement des statistiques');
      const data = await response.json();
      return data.stats;
    }
  });

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['admin', 'overdraft', 'users'],
    queryFn: async (): Promise<OverdraftUser[]> => {
      const response = await fetch('/api/admin/overdraft/users', { credentials: 'include' });
      if (!response.ok) throw new Error('Erreur lors du chargement des utilisateurs');
      const data = await response.json();
      return data.users;
    }
  });

  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ['admin', 'overdraft', 'config'],
    queryFn: async (): Promise<GlobalOverdraftConfig> => {
      const response = await fetch('/api/admin/overdraft/config', { credentials: 'include' });
      if (!response.ok) throw new Error('Erreur lors du chargement de la configuration');
      const data = await response.json();
      return data.config;
    }
  });

  // ===== MUTATIONS =====

  const updateConfigMutation = useMutation({
    mutationFn: async (newConfig: Partial<GlobalOverdraftConfig>) => {
      const response = await fetch('/api/admin/overdraft/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newConfig),
      });
      if (!response.ok) throw new Error('Erreur lors de la mise à jour');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'overdraft', 'config'] });
      toast({ title: "✅ Configuration mise à jour", description: "Les paramètres ont été sauvegardés." });
    },
    onError: (error: Error) => {
      toast({ title: "❌ Erreur", description: error.message, variant: "destructive" });
    },
  });

  const processAlertsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/overdraft/process-alerts', {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Erreur lors du traitement');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'overdraft'] });
      toast({ 
        title: "✅ Alertes traitées", 
        description: `${data.alerts} alertes envoyées, ${data.blocked} comptes bloqués.` 
      });
    },
    onError: (error: Error) => {
      toast({ title: "❌ Erreur", description: error.message, variant: "destructive" });
    },
  });

  const unblockUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/admin/overdraft/users/${userId}/unblock`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Erreur lors du déblocage');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'overdraft', 'users'] });
      toast({ title: "✅ Utilisateur débloqué", description: "Le compte a été débloqué avec succès." });
    },
    onError: (error: Error) => {
      toast({ title: "❌ Erreur", description: error.message, variant: "destructive" });
    },
  });

  // ===== HANDLERS =====

  const handleConfigChange = (key: keyof GlobalOverdraftConfig, value: any) => {
    if (!config) return;
    updateConfigMutation.mutate({ [key]: value });
  };

  const handleProcessAlerts = () => {
    processAlertsMutation.mutate();
  };

  const handleUnblockUser = (userId: string) => {
    unblockUserMutation.mutate(userId);
  };

  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatPercentage = (percentage: number): string => {
    return `${(percentage * 100).toFixed(1)}%`;
  };

  const getAlertLevelBadge = (level: string) => {
    switch (level) {
      case 'safe':
        return <Badge className="bg-green-100 text-green-800">Sûr</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">Attention</Badge>;
      case 'critical':
        return <Badge className="bg-orange-100 text-orange-800">Critique</Badge>;
      case 'blocked':
        return <Badge className="bg-red-100 text-red-800">Bloqué</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Inconnu</Badge>;
    }
  };

  // Filtrage des utilisateurs
  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterLevel === 'all' || user.alertLevel === filterLevel;
    
    return matchesSearch && matchesFilter;
  });

  // ===== RENDER =====

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-blue-500" />
            Gestion des Découverts
          </h1>
          <p className="text-muted-foreground">
            Administration des découverts de solde et des limites utilisateurs
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleProcessAlerts}
            disabled={processAlertsMutation.isPending}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Traiter alertes
          </Button>
          
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="stats">Statistiques</TabsTrigger>
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        {/* ONGLET STATISTIQUES */}
        <TabsContent value="stats" className="space-y-6">
          {statsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-4" />
              <p className="text-muted-foreground">Chargement des statistiques...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Utilisateurs en découvert</CardTitle>
                  <TrendingDown className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{stats?.totalUsersInOverdraft || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Comptes avec solde négatif
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Montant total</CardTitle>
                  <Euro className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {formatAmount(stats?.totalOverdraftAmount || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Découvert cumulé de tous les utilisateurs
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Découvert moyen</CardTitle>
                  <TrendingDown className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {formatAmount(stats?.avgOverdraftAmount || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Par utilisateur en découvert
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Utilisateurs à risque</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{stats?.usersAtRisk || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    ≥75% de leur limite utilisée
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Comptes bloqués</CardTitle>
                  <XCircle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{stats?.blockedUsers || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Limite de découvert dépassée
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Frais collectés</CardTitle>
                  <Euro className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatAmount(stats?.totalFeesCollected || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Revenus des frais de découvert
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Alertes importantes */}
          {stats && (
            <div className="space-y-4">
              {stats.usersAtRisk > 0 && (
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{stats.usersAtRisk} utilisateur{stats.usersAtRisk > 1 ? 's' : ''}</strong> 
                    {stats.usersAtRisk > 1 ? ' sont' : ' est'} à risque de dépassement de limite. 
                    Surveillez leur situation de près.
                  </AlertDescription>
                </Alert>
              )}

              {stats.blockedUsers > 0 && (
                <Alert className="border-red-200 bg-red-50">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{stats.blockedUsers} compte{stats.blockedUsers > 1 ? 's' : ''}</strong> 
                    {stats.blockedUsers > 1 ? ' sont bloqués' : ' est bloqué'} pour dépassement de limite. 
                    Vérifiez les demandes de déblocage.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </TabsContent>

        {/* ONGLET UTILISATEURS */}
        <TabsContent value="users" className="space-y-6">
          {/* Filtres */}
          <Card>
            <CardHeader>
              <CardTitle>Filtres et recherche</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="search">Rechercher un utilisateur</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Email ou nom..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="filter">Niveau d'alerte</Label>
                  <select
                    id="filter"
                    value={filterLevel}
                    onChange={(e) => setFilterLevel(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="all">Tous</option>
                    <option value="safe">Sûr</option>
                    <option value="warning">Attention</option>
                    <option value="critical">Critique</option>
                    <option value="blocked">Bloqué</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <Button variant="outline" onClick={() => { setSearchTerm(''); setFilterLevel('all'); }}>
                    <Filter className="h-4 w-4 mr-2" />
                    Réinitialiser
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Liste des utilisateurs */}
          <Card>
            <CardHeader>
              <CardTitle>
                Utilisateurs en découvert ({filteredUsers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-4" />
                  <p className="text-muted-foreground">Chargement des utilisateurs...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredUsers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {searchTerm || filterLevel !== 'all' ? 
                        "Aucun utilisateur ne correspond aux filtres" : 
                        "Aucun utilisateur en découvert"
                      }
                    </div>
                  ) : (
                    filteredUsers.map((user) => (
                      <div 
                        key={user.id}
                        className="p-4 border rounded-lg flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div>
                              <div className="font-medium">
                                {user.firstName} {user.lastName}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {user.email}
                              </div>
                            </div>
                            {getAlertLevelBadge(user.alertLevel)}
                          </div>
                          
                          <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>
                              <div className="text-muted-foreground">Solde</div>
                              <div className={`font-medium ${user.currentBalance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {formatAmount(user.currentBalance)}
                              </div>
                            </div>
                            
                            <div>
                              <div className="text-muted-foreground">Découvert</div>
                              <div className="font-medium text-red-600">
                                {formatAmount(user.overdraftAmount)} / {formatAmount(user.overdraftLimit)}
                              </div>
                            </div>
                            
                            <div>
                              <div className="text-muted-foreground">Utilisation</div>
                              <div className="font-medium">
                                {formatPercentage(user.overdraftPercentage)}
                              </div>
                            </div>
                            
                            <div>
                              <div className="text-muted-foreground">Frais estimés</div>
                              <div className="font-medium text-orange-600">
                                {formatAmount(user.estimatedFees)}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          {user.alertLevel === 'blocked' && (
                            <Button 
                              size="sm"
                              onClick={() => handleUnblockUser(user.id)}
                              disabled={unblockUserMutation.isPending}
                            >
                              Débloquer
                            </Button>
                          )}
                          
                          <Button size="sm" variant="outline">
                            Détails
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ONGLET CONFIGURATION */}
        <TabsContent value="config" className="space-y-6">
          {configLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-4" />
              <p className="text-muted-foreground">Chargement de la configuration...</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {/* Limites par défaut */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Limites par défaut
                  </CardTitle>
                  <CardDescription>
                    Découverts autorisés par type de profil utilisateur
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Investisseurs (€)</Label>
                      <Input
                        type="number"
                        value={config?.defaultLimitInvestor || 500}
                        onChange={(e) => handleConfigChange('defaultLimitInvestor', parseInt(e.target.value))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Créateurs (€)</Label>
                      <Input
                        type="number"
                        value={config?.defaultLimitCreator || 300}
                        onChange={(e) => handleConfigChange('defaultLimitCreator', parseInt(e.target.value))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Investi-lecteurs (€)</Label>
                      <Input
                        type="number"
                        value={config?.defaultLimitAdmin || 200}
                        onChange={(e) => handleConfigChange('defaultLimitAdmin', parseInt(e.target.value))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Administrateurs (€)</Label>
                      <Input
                        type="number"
                        value={config?.defaultLimitAdmin || 1000}
                        onChange={(e) => handleConfigChange('defaultLimitAdmin', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Seuils et frais */}
              <Card>
                <CardHeader>
                  <CardTitle>Seuils d'alerte et frais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Seuil d'attention (%)</Label>
                      <Input
                        type="number"
                        min="50"
                        max="90"
                        value={(config?.warningThreshold || 0.75) * 100}
                        onChange={(e) => handleConfigChange('warningThreshold', parseInt(e.target.value) / 100)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Seuil critique (%)</Label>
                      <Input
                        type="number"
                        min="80"
                        max="95"
                        value={(config?.criticalThreshold || 0.90) * 100}
                        onChange={(e) => handleConfigChange('criticalThreshold', parseInt(e.target.value) / 100)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Période de grâce (jours)</Label>
                      <Input
                        type="number"
                        min="1"
                        max="30"
                        value={config?.gracePeriodDays || 7}
                        onChange={(e) => handleConfigChange('gracePeriodDays', parseInt(e.target.value))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Taux journalier (%)</Label>
                      <Input
                        type="number"
                        step="0.001"
                        min="0"
                        max="1"
                        value={(config?.dailyFeeRate || 0.001) * 100}
                        onChange={(e) => handleConfigChange('dailyFeeRate', parseFloat(e.target.value) / 100)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Frais max/mois (€)</Label>
                      <Input
                        type="number"
                        min="10"
                        max="100"
                        value={config?.maxMonthlyFees || 50}
                        onChange={(e) => handleConfigChange('maxMonthlyFees', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Options générales */}
              <Card>
                <CardHeader>
                  <CardTitle>Options générales</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Alertes automatiques</Label>
                      <p className="text-sm text-muted-foreground">
                        Envoyer automatiquement des alertes aux utilisateurs
                      </p>
                    </div>
                    <Switch
                      checked={config?.alertsEnabled !== false}
                      onCheckedChange={(checked) => handleConfigChange('alertsEnabled', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Blocage automatique</Label>
                      <p className="text-sm text-muted-foreground">
                        Bloquer automatiquement les comptes qui dépassent leur limite
                      </p>
                    </div>
                    <Switch
                      checked={config?.autoBlockEnabled !== false}
                      onCheckedChange={(checked) => handleConfigChange('autoBlockEnabled', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* ONGLET MONITORING */}
        <TabsContent value="monitoring" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Actions de surveillance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  onClick={handleProcessAlerts}
                  disabled={processAlertsMutation.isPending}
                  className="h-20 flex flex-col items-center justify-center"
                >
                  <RefreshCw className="h-6 w-6 mb-2" />
                  <span>Traiter les alertes</span>
                  <span className="text-xs opacity-70">Vérifier tous les découverts</span>
                </Button>

                <Button 
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center"
                >
                  <Download className="h-6 w-6 mb-2" />
                  <span>Export complet</span>
                  <span className="text-xs opacity-70">Données CSV/Excel</span>
                </Button>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Le traitement des alertes est normalement automatique (toutes les heures). 
                  Utilisez ces boutons uniquement pour des vérifications manuelles.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OverdraftManagement;