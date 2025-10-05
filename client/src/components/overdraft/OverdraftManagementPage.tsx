import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  CreditCard,
  Shield,
  Bell,
  TrendingDown,
  Settings,
  AlertTriangle,
  Euro,
  Clock,
  History,
  HelpCircle,
  Save,
  RefreshCw
} from 'lucide-react';
import { 
  useOverdraftStatus, 
  useOverdraftConfiguration,
  useOverdraftIncidents,
  useUpdateOverdraftLimit,
  useConfigureOverdraftAlerts,
  useRequestAccountUnblock,
  useOverdraftFormatters,
  useOverdraftStats,
  useOverdraftRiskLevel
} from '@/hooks/useOverdraft';
import OverdraftAlertsPanel from './OverdraftAlertsPanel';

const OverdraftManagementPage: React.FC = () => {
  const { data: status, isLoading: statusLoading } = useOverdraftStatus();
  const { data: config, isLoading: configLoading } = useOverdraftConfiguration();
  const { data: incidents = [] } = useOverdraftIncidents();
  const updateLimit = useUpdateOverdraftLimit();
  const configureAlerts = useConfigureOverdraftAlerts();
  const requestUnblock = useRequestAccountUnblock();
  const { formatAmount, formatPercentage, formatDays } = useOverdraftFormatters();
  const stats = useOverdraftStats(status);
  const riskLevel = useOverdraftRiskLevel(status);

  const [newLimit, setNewLimit] = useState<string>('');
  const [alertsConfig, setAlertsConfig] = useState({
    alertsEnabled: true,
    autoBlock: true,
    gracePeriodDays: 7,
  });
  const [unblockMessage, setUnblockMessage] = useState('');

  React.useEffect(() => {
    if (config) {
      setAlertsConfig({
        alertsEnabled: config.alertsEnabled,
        autoBlock: config.autoBlock,
        gracePeriodDays: config.gracePeriodDays,
      });
    }
    if (status) {
      setNewLimit(status.overdraftLimit.toString());
    }
  }, [config, status]);

  const handleUpdateLimit = async () => {
    if (!newLimit || isNaN(parseFloat(newLimit))) return;
    
    try {
      await updateLimit.mutateAsync(parseFloat(newLimit));
    } catch (error) {
      console.error('Erreur mise à jour limite:', error);
    }
  };

  const handleSaveAlertsConfig = async () => {
    try {
      await configureAlerts.mutateAsync(alertsConfig);
    } catch (error) {
      console.error('Erreur configuration alertes:', error);
    }
  };

  const handleRequestUnblock = async () => {
    if (!unblockMessage.trim()) return;
    
    try {
      await requestUnblock.mutateAsync(unblockMessage);
      setUnblockMessage('');
    } catch (error) {
      console.error('Erreur demande déblocage:', error);
    }
  };

  if (statusLoading || configLoading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement de votre espace découvert...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CreditCard className="h-8 w-8 text-blue-500" />
            Gestion du Découvert
          </h1>
          <p className="text-muted-foreground">
            Gérez votre découvert autorisé, vos alertes et votre situation financière
          </p>
        </div>
        
        <Badge className={
          riskLevel.level === 'safe' ? 'bg-green-100 text-green-800' :
          riskLevel.level === 'warning' ? 'bg-yellow-100 text-yellow-800' :
          riskLevel.level === 'critical' ? 'bg-orange-100 text-orange-800' :
          'bg-red-100 text-red-800'
        }>
          {riskLevel.message}
        </Badge>
      </div>

      {/* Vue d'ensemble rapide */}
      {status && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Solde Actuel</CardTitle>
              <Euro className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${status.currentBalance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatAmount(status.currentBalance)}
              </div>
              <p className="text-xs text-muted-foreground">
                {status.currentBalance < 0 ? 'En découvert' : 'Positif'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Limite Autorisée</CardTitle>
              <Shield className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatAmount(status.overdraftLimit)}
              </div>
              <p className="text-xs text-muted-foreground">
                Crédit disponible: {formatAmount(status.availableCredit)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Découvert Utilisé</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatAmount(status.overdraftAmount)}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatPercentage(status.overdraftPercentage * 100)} de la limite
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Frais Estimés</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {formatAmount(status.estimatedFees)}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatDays(status.daysSinceOverdraft)} en découvert
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Indicateur de progression */}
      {status && status.overdraftAmount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Utilisation du découvert</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress 
              value={status.overdraftPercentage * 100} 
              className="h-4"
              indicatorClassName={
                status.overdraftPercentage >= 0.9 ? 'bg-red-500' :
                status.overdraftPercentage >= 0.75 ? 'bg-orange-500' :
                'bg-yellow-500'
              }
            />
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className={`p-2 rounded ${status.overdraftPercentage >= 0.75 ? 'bg-yellow-100' : 'bg-green-100'}`}>
                <div className="text-sm font-medium">75% - Alerte</div>
                <div className="text-xs text-muted-foreground">
                  {formatAmount(status.overdraftLimit * 0.75)}
                </div>
              </div>
              <div className={`p-2 rounded ${status.overdraftPercentage >= 0.9 ? 'bg-orange-100' : 'bg-gray-100'}`}>
                <div className="text-sm font-medium">90% - Critique</div>
                <div className="text-xs text-muted-foreground">
                  {formatAmount(status.overdraftLimit * 0.9)}
                </div>
              </div>
              <div className={`p-2 rounded ${status.overdraftPercentage >= 1.0 ? 'bg-red-100' : 'bg-gray-100'}`}>
                <div className="text-sm font-medium">100% - Blocage</div>
                <div className="text-xs text-muted-foreground">
                  {formatAmount(status.overdraftLimit)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Onglets de gestion */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="limits">Limites</TabsTrigger>
          <TabsTrigger value="alerts">Alertes</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
          <TabsTrigger value="help">Aide</TabsTrigger>
        </TabsList>

        {/* Vue d'ensemble */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Panneau des alertes */}
            <OverdraftAlertsPanel />
            
            {/* Informations sur les frais */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Euro className="h-5 w-5 text-orange-500" />
                  Frais de découvert
                </CardTitle>
                <CardDescription>
                  Calcul automatique basé sur votre situation actuelle
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {status?.overdraftAmount > 0 ? (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Taux quotidien:</span>
                      <span className="font-medium">0,1% par jour</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Frais journaliers:</span>
                      <span className="font-medium">{stats ? formatAmount(parseFloat(stats.dailyFeeAmount)) : '€0,00'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Estimation mensuelle:</span>
                      <span className="font-medium">{stats ? formatAmount(parseFloat(stats.monthlyFeeEstimate)) : '€0,00'}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-sm font-medium">Frais actuels:</span>
                      <span className="font-bold text-orange-600">{formatAmount(status.estimatedFees)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className="text-green-600 text-2xl mb-2">€0,00</div>
                    <p className="text-sm text-muted-foreground">
                      Aucuns frais - Votre compte n'est pas en découvert
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Compte bloqué - Demande de déblocage */}
          {status?.isBlocked && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700">
                  <Shield className="h-5 w-5" />
                  Compte bloqué - Demande de déblocage
                </CardTitle>
                <CardDescription className="text-red-600">
                  Votre compte est bloqué pour dépassement de limite. Vous pouvez demander un déblocage.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="unblock-message">Message pour l'équipe support</Label>
                  <textarea
                    id="unblock-message"
                    value={unblockMessage}
                    onChange={(e) => setUnblockMessage(e.target.value)}
                    placeholder="Expliquez votre situation et les mesures prises pour régulariser..."
                    rows={4}
                    className="w-full p-3 border rounded-md"
                  />
                </div>
                
                <Button 
                  onClick={handleRequestUnblock}
                  disabled={!unblockMessage.trim() || requestUnblock.isPending}
                  className="w-full"
                >
                  {requestUnblock.isPending ? 'Envoi en cours...' : 'Demander le déblocage'}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Gestion des limites */}
        <TabsContent value="limits" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-500" />
                Modifier ma limite de découvert
              </CardTitle>
              <CardDescription>
                Ajustez votre limite selon vos besoins (entre €0 et €1000)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-limit">Nouvelle limite (€)</Label>
                <Input
                  id="new-limit"
                  type="number"
                  min="0"
                  max="1000"
                  step="10"
                  value={newLimit}
                  onChange={(e) => setNewLimit(e.target.value)}
                  placeholder="Exemple: 500"
                />
                <p className="text-xs text-muted-foreground">
                  Limite actuelle: {status ? formatAmount(status.overdraftLimit) : '€0,00'}
                </p>
              </div>
              
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Important :</strong> Réduire votre limite pendant un découvert peut bloquer votre compte.
                  Contactez-nous si vous avez des questions.
                </AlertDescription>
              </Alert>
              
              <Button 
                onClick={handleUpdateLimit}
                disabled={!newLimit || parseFloat(newLimit) < 0 || updateLimit.isPending}
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                {updateLimit.isPending ? 'Mise à jour...' : 'Mettre à jour la limite'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration des alertes */}
        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-orange-500" />
                Configuration des alertes
              </CardTitle>
              <CardDescription>
                Personnalisez vos notifications de découvert
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Alertes activées</Label>
                    <p className="text-sm text-muted-foreground">
                      Recevoir des notifications quand j'approche de ma limite
                    </p>
                  </div>
                  <Switch
                    checked={alertsConfig.alertsEnabled}
                    onCheckedChange={(checked) => setAlertsConfig(prev => ({ ...prev, alertsEnabled: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Blocage automatique</Label>
                    <p className="text-sm text-muted-foreground">
                      Bloquer mon compte si je dépasse ma limite
                    </p>
                  </div>
                  <Switch
                    checked={alertsConfig.autoBlock}
                    onCheckedChange={(checked) => setAlertsConfig(prev => ({ ...prev, autoBlock: checked }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="grace-period">Période de grâce (jours)</Label>
                  <Input
                    id="grace-period"
                    type="number"
                    min="1"
                    max="30"
                    value={alertsConfig.gracePeriodDays}
                    onChange={(e) => setAlertsConfig(prev => ({ 
                      ...prev, 
                      gracePeriodDays: parseInt(e.target.value) || 7 
                    }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Délai avant blocage après dépassement de limite
                  </p>
                </div>
              </div>

              <Button 
                onClick={handleSaveAlertsConfig}
                disabled={configureAlerts.isPending}
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                {configureAlerts.isPending ? 'Sauvegarde...' : 'Sauvegarder les préférences'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Historique */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-purple-500" />
                Historique des incidents
              </CardTitle>
              <CardDescription>
                Suivi de vos dépassements et incidents de découvert
              </CardDescription>
            </CardHeader>
            <CardContent>
              {incidents.length === 0 ? (
                <div className="text-center py-8">
                  <History className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-muted-foreground">Aucun incident enregistré</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {incidents.slice(0, 10).map((incident) => (
                    <div 
                      key={incident.id}
                      className="p-3 border rounded-lg flex items-start justify-between"
                    >
                      <div>
                        <div className="font-medium">{incident.incidentType}</div>
                        <p className="text-sm text-muted-foreground">{incident.description}</p>
                        <div className="text-xs text-muted-foreground">
                          {new Date(incident.createdAt).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                      <Badge className={incident.isResolved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {incident.isResolved ? 'Résolu' : 'En cours'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aide */}
        <TabsContent value="help" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-blue-500" />
                Aide et informations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Comment fonctionne le découvert ?</h4>
                  <p className="text-sm text-muted-foreground">
                    Le découvert vous permet d'avoir un solde négatif jusqu'à votre limite autorisée. 
                    Des frais de 0,1% par jour s'appliquent sur le montant du découvert.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Quand mon compte sera-t-il bloqué ?</h4>
                  <p className="text-sm text-muted-foreground">
                    Votre compte sera bloqué si vous dépassez votre limite de découvert autorisée. 
                    Vous recevrez des alertes à 75% et 90% de votre limite.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Comment débloquer mon compte ?</h4>
                  <p className="text-sm text-muted-foreground">
                    Pour débloquer votre compte, régularisez votre situation en effectuant un virement 
                    ou contactez notre support via l'onglet "Vue d'ensemble".
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Puis-je modifier ma limite ?</h4>
                  <p className="text-sm text-muted-foreground">
                    Oui, vous pouvez augmenter ou réduire votre limite dans l'onglet "Limites". 
                    Les modifications sont appliquées immédiatement.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button variant="outline" className="w-full">
                  Contacter le support
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OverdraftManagementPage;