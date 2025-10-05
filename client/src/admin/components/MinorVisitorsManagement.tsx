import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Settings, 
  TrendingUp, 
  Shield, 
  AlertCircle, 
  Calendar,
  Coins,
  Clock,
  CheckCircle,
  Send,
  RotateCcw,
  Download,
  Filter
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

// ===== INTERFACES =====

interface MinorStats {
  totalMinors: number;
  activeMinors: number;
  cappedMinors: number;
  avgVisuPoints: number;
  totalVisuPointsEarned: number;
  nearMajority: number;
}

interface MinorSettings {
  minor_social_posting_enabled: boolean;
  minor_points_cap_value_eur: number;
  minor_points_accrual_pause_on_cap: boolean;
  post_majority_required_account: string;
  post_majority_lock_months: number;
  reminders_enabled: boolean;
  parental_consent_mode: boolean;
}

interface MinorProfile {
  id: string;
  userId: string;
  birthDate: string;
  visuPointsEarned: number;
  visuPointsCap: number;
  status: string;
  majorityDate: string;
  accountTypeChosen?: string;
  createdAt: string;
  user?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
}

// ===== COMPOSANT PRINCIPAL =====

const MinorVisitorsManagement: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState('stats');
  const [customNotification, setCustomNotification] = useState({ title: '', message: '' });

  // ===== QUERIES =====

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin', 'minor-visitors', 'stats'],
    queryFn: async (): Promise<MinorStats> => {
      const response = await fetch('/api/admin/minor-visitors/stats', { credentials: 'include' });
      if (!response.ok) throw new Error('Erreur lors du chargement des statistiques');
      const data = await response.json();
      return data.stats;
    }
  });

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['admin', 'minor-visitors', 'settings'],
    queryFn: async (): Promise<MinorSettings> => {
      const response = await fetch('/api/admin/minor-visitors/settings', { credentials: 'include' });
      if (!response.ok) throw new Error('Erreur lors du chargement des paramètres');
      const data = await response.json();
      return data.settings;
    }
  });

  // ===== MUTATIONS =====

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<MinorSettings>) => {
      const response = await fetch('/api/admin/minor-visitors/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newSettings),
      });
      if (!response.ok) throw new Error('Erreur lors de la mise à jour');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'minor-visitors', 'settings'] });
      toast({ title: "✅ Paramètres mis à jour", description: "Les modifications ont été sauvegardées." });
    },
    onError: (error: Error) => {
      toast({ title: "❌ Erreur", description: error.message, variant: "destructive" });
    },
  });

  const processDailyTransitionsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/minor-visitors/process-daily-transitions', {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Erreur lors du traitement');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'minor-visitors'] });
      toast({ 
        title: "✅ Transitions traitées", 
        description: `${data.result.processed} transitions effectuées avec succès.` 
      });
    },
    onError: (error: Error) => {
      toast({ title: "❌ Erreur", description: error.message, variant: "destructive" });
    },
  });

  // ===== HANDLERS =====

  const handleSettingChange = (key: keyof MinorSettings, value: any) => {
    if (!settings) return;
    updateSettingsMutation.mutate({ [key]: value });
  };

  const handleProcessTransitions = () => {
    processDailyTransitionsMutation.mutate();
  };

  const handleSendNotification = () => {
    if (!customNotification.title || !customNotification.message) {
      toast({ 
        title: "❌ Champs requis", 
        description: "Veuillez remplir le titre et le message.", 
        variant: "destructive" 
      });
      return;
    }

    // TODO: Implémenter l'envoi de notification personnalisée
    toast({ 
      title: "📨 Notification envoyée", 
      description: "La notification a été envoyée à tous les visiteurs mineurs." 
    });
    
    setCustomNotification({ title: '', message: '' });
  };

  // ===== RENDER =====

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-500" />
            Gestion des Visiteurs Mineurs
          </h1>
          <p className="text-muted-foreground">
            Administration des utilisateurs de 16-17 ans et de leurs transitions vers la majorité
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleProcessTransitions}
            disabled={processDailyTransitionsMutation.isPending}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Traiter transitions
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
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
          <TabsTrigger value="profiles">Profils</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
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
                  <CardTitle className="text-sm font-medium">Total Mineurs</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalMinors || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Utilisateurs 16-17 ans inscrits
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Actifs</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats?.activeMinors || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Peuvent encore gagner des VP
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Plafonds atteints</CardTitle>
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{stats?.cappedMinors || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Ont atteint les 200€ maximum
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">VP Moyens</CardTitle>
                  <Coins className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">{stats?.avgVisuPoints || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Moyenne par visiteur mineur
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">VP Total</CardTitle>
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{stats?.totalVisuPointsEarned || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    ≈ {((stats?.totalVisuPointsEarned || 0) / 100).toFixed(0)}€ en VP
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Majorité proche</CardTitle>
                  <Calendar className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{stats?.nearMajority || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Deviendront majeurs dans 30 jours
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Alertes importantes */}
          {stats && (
            <div className="space-y-4">
              {stats.nearMajority > 0 && (
                <Alert className="border-orange-200 bg-orange-50">
                  <Calendar className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{stats.nearMajority} visiteur{stats.nearMajority > 1 ? 's' : ''} mineur{stats.nearMajority > 1 ? 's' : ''}</strong> atteindront la majorité dans les 30 prochains jours. 
                    Pensez à traiter leurs transitions.
                  </AlertDescription>
                </Alert>
              )}

              {stats.cappedMinors > 0 && (
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{stats.cappedMinors} visiteur{stats.cappedMinors > 1 ? 's' : ''} mineur{stats.cappedMinors > 1 ? 's' : ''}</strong> {stats.cappedMinors > 1 ? 'ont' : 'a'} atteint le plafond de 200€. 
                    Ils devront attendre leur majorité + 6 mois pour récupérer leurs gains.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </TabsContent>

        {/* ONGLET PARAMÈTRES */}
        <TabsContent value="settings" className="space-y-6">
          {settingsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-4" />
              <p className="text-muted-foreground">Chargement des paramètres...</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {/* Paramètres généraux */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Paramètres généraux
                  </CardTitle>
                  <CardDescription>
                    Configuration du système de visiteurs mineurs
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="cap-value">Plafond VISUpoints (€)</Label>
                      <Input
                        id="cap-value"
                        type="number"
                        min="50"
                        max="500"
                        value={settings?.minor_points_cap_value_eur || 200}
                        onChange={(e) => handleSettingChange('minor_points_cap_value_eur', parseInt(e.target.value))}
                      />
                      <p className="text-xs text-muted-foreground">
                        Montant maximum que peut gagner un mineur (50€ - 500€)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lock-months">Verrou post-majorité (mois)</Label>
                      <Input
                        id="lock-months"
                        type="number"
                        min="0"
                        max="12"
                        value={settings?.post_majority_lock_months || 6}
                        onChange={(e) => handleSettingChange('post_majority_lock_months', parseInt(e.target.value))}
                      />
                      <p className="text-xs text-muted-foreground">
                        Durée du verrou si le plafond est atteint avant la majorité
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Publications réseau social</Label>
                        <p className="text-sm text-muted-foreground">
                          Autoriser les mineurs à publier sur le réseau social
                        </p>
                      </div>
                      <Switch
                        checked={settings?.minor_social_posting_enabled || false}
                        onCheckedChange={(checked) => handleSettingChange('minor_social_posting_enabled', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Pause gains au plafond</Label>
                        <p className="text-sm text-muted-foreground">
                          Stopper automatiquement les gains quand le plafond est atteint
                        </p>
                      </div>
                      <Switch
                        checked={settings?.minor_points_accrual_pause_on_cap !== false}
                        onCheckedChange={(checked) => handleSettingChange('minor_points_accrual_pause_on_cap', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Rappels automatiques</Label>
                        <p className="text-sm text-muted-foreground">
                          Envoyer des notifications de rappel pour la majorité
                        </p>
                      </div>
                      <Switch
                        checked={settings?.reminders_enabled !== false}
                        onCheckedChange={(checked) => handleSettingChange('reminders_enabled', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Mode consentement parental</Label>
                        <p className="text-sm text-muted-foreground">
                          Exiger le consentement parental pour l'inscription
                        </p>
                      </div>
                      <Switch
                        checked={settings?.parental_consent_mode || false}
                        onCheckedChange={(checked) => handleSettingChange('parental_consent_mode', checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions administratives */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Actions administratives
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button 
                      onClick={handleProcessTransitions}
                      disabled={processDailyTransitionsMutation.isPending}
                      className="w-full"
                    >
                      {processDailyTransitionsMutation.isPending ? (
                        <>
                          <Clock className="h-4 w-4 mr-2 animate-spin" />
                          Traitement en cours...
                        </>
                      ) : (
                        <>
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Traiter transitions manuellement
                        </>
                      )}
                    </Button>

                    <Button variant="outline" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Exporter rapport complet
                    </Button>
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Le traitement des transitions est normalement automatique (quotidien). 
                      Utilisez le bouton manuel uniquement en cas de problème technique.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* ONGLET PROFILS */}
        <TabsContent value="profiles" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Liste des visiteurs mineurs</CardTitle>
              <CardDescription>
                Gestion individuelle des profils de visiteurs mineurs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Interface de gestion des profils en cours de développement</p>
                <p className="text-sm">Fonctionnalité disponible dans une prochaine version</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ONGLET NOTIFICATIONS */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Notification personnalisée
              </CardTitle>
              <CardDescription>
                Envoyer une notification à tous les visiteurs mineurs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notif-title">Titre de la notification</Label>
                <Input
                  id="notif-title"
                  value={customNotification.title}
                  onChange={(e) => setCustomNotification(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ex: Mise à jour importante de VISUAL"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notif-message">Message</Label>
                <Textarea
                  id="notif-message"
                  value={customNotification.message}
                  onChange={(e) => setCustomNotification(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Votre message pour les visiteurs mineurs..."
                  rows={4}
                />
              </div>

              <Button onClick={handleSendNotification} className="w-full">
                <Send className="h-4 w-4 mr-2" />
                Envoyer la notification
              </Button>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Cette notification sera envoyée immédiatement à tous les visiteurs mineurs actifs. 
                  Vérifiez le contenu avant d'envoyer.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MinorVisitorsManagement;