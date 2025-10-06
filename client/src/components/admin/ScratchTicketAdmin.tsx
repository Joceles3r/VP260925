import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Gift, 
  Users, 
  TrendingUp, 
  Clock, 
  RefreshCw, 
  Trash2, 
  BarChart3,
  AlertCircle,
  CheckCircle,
  XCircle 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

interface ScratchTicketStats {
  totalTickets: number;
  pending: number;
  scratched: number;
  expired: number;
  totalVPDistributed: number;
}

interface CleanupResponse {
  success: boolean;
  expired: number;
  message: string;
}

export const ScratchTicketAdmin: React.FC = () => {
  const [stats, setStats] = useState<ScratchTicketStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchStats = async (showRefreshing = false) => {
    if (showRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await fetch('/api/admin/scratch-tickets/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des statistiques');
      }

      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      } else {
        throw new Error('Erreur lors de la récupération des statistiques');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      toast({
        title: "❌ Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCleanupExpired = async () => {
    setCleaning(true);

    try {
      const response = await fetch('/api/admin/scratch-tickets/cleanup-expired', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      const data: CleanupResponse = await response.json();

      if (data.success) {
        toast({
          title: "✅ Nettoyage terminé",
          description: data.message,
        });

        // Actualiser les statistiques
        await fetchStats(true);
      } else {
        throw new Error('Erreur lors du nettoyage');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du nettoyage';
      toast({
        title: "❌ Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setCleaning(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Auto-refresh toutes les 30 secondes
    const interval = setInterval(() => {
      fetchStats(true);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const getSuccessRate = () => {
    if (!stats || stats.scratched === 0) return 0;
    return Math.round((stats.scratched / (stats.scratched + stats.expired)) * 100);
  };

  const getAverageReward = () => {
    if (!stats || stats.scratched === 0) return 0;
    return Math.round(stats.totalVPDistributed / stats.scratched);
  };

  if (loading && !stats) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement des statistiques...</p>
        </CardContent>
      </Card>
    );
  }

  if (error && !stats) {
    return (
      <Card>
        <CardContent className="p-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button 
            onClick={() => fetchStats()} 
            className="mt-4 w-full"
            variant="outline"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full text-white">
            <Gift className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Administration Scratch Tickets</h2>
            <p className="text-muted-foreground">
              Gestion et monitoring des Mini-Tickets Scratch
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={() => fetchStats(true)}
            disabled={refreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          
          <Button
            onClick={handleCleanupExpired}
            disabled={cleaning}
            variant="outline"
            size="sm"
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            <Trash2 className={`h-4 w-4 mr-2 ${cleaning ? 'animate-pulse' : ''}`} />
            Nettoyer expirés
          </Button>
        </div>
      </div>

      {stats && (
        <>
          {/* Statistiques principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Tickets</p>
                      <p className="text-3xl font-bold text-blue-600">{stats.totalTickets}</p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">En Attente</p>
                      <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
                    </div>
                    <Clock className="h-8 w-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Grattés</p>
                      <p className="text-3xl font-bold text-green-600">{stats.scratched}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Expirés</p>
                      <p className="text-3xl font-bold text-red-600">{stats.expired}</p>
                    </div>
                    <XCircle className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Métriques avancées */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  VISUpoints Distribués
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-2">
                  <div className="text-4xl font-bold text-primary">
                    {stats.totalVPDistributed.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total VP distribués via scratch tickets
                  </div>
                  <Badge variant="secondary">
                    ≈ {Math.round(stats.totalVPDistributed / 100)}€ équivalent
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Taux de Succès
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-2">
                  <div className="text-4xl font-bold text-green-600">
                    {getSuccessRate()}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Tickets grattés vs expirés
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {stats.scratched} grattés / {stats.scratched + stats.expired} total
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  Récompense Moyenne
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-2">
                  <div className="text-4xl font-bold text-purple-600">
                    {getAverageReward()} VP
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Par ticket gratté
                  </div>
                  <Badge variant="outline">
                    Basé sur {stats.scratched} tickets
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alertes et recommendations */}
          <div className="space-y-4">
            {stats.expired > stats.scratched && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Attention :</strong> Plus de tickets expirent qu'ils ne sont grattés. 
                  Considérez ajuster la durée d'expiration ou les notifications.
                  ({stats.expired} expirés vs {stats.scratched} grattés)
                </AlertDescription>
              </Alert>
            )}

            {stats.pending > 50 && (
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  Il y a actuellement <strong>{stats.pending}</strong> tickets en attente de grattage.
                  Assurez-vous que les notifications fonctionnent correctement.
                </AlertDescription>
              </Alert>
            )}

            {getSuccessRate() > 80 && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Excellent taux de succès de <strong>{getSuccessRate()}%</strong> ! 
                  Les utilisateurs sont bien engagés avec le système de scratch tickets.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Configuration système */}
          <Card>
            <CardHeader>
              <CardTitle>Configuration Système</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="font-medium">Déclenchement</div>
                  <div className="text-muted-foreground">Tous les 100 VP</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="font-medium">Expiration</div>
                  <div className="text-muted-foreground">30 jours</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="font-medium">Cooldown</div>
                  <div className="text-muted-foreground">1 heure</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="font-medium">Validation IA</div>
                  <div className="text-muted-foreground">Activée</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default ScratchTicketAdmin;