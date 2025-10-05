import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  User, 
  Coins, 
  Calendar, 
  Shield, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  Clock,
  Gift
} from 'lucide-react';
import { useMinorStatus, useMinorVisuPointsStats, useMajorityCountdown } from '@/hooks/useMinorVisitor';
import { Link } from 'wouter';

const MinorStatusWidget: React.FC = () => {
  const { data: status, isLoading } = useMinorStatus();
  const vpStats = useMinorVisuPointsStats(status?.visuPoints || 0);
  const majorityCountdown = useMajorityCountdown(status?.majorityDate);

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-500 border-t-transparent" />
            <span className="text-sm">Vérification du statut mineur...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!status?.isMinor) {
    return null; // Ne pas afficher le widget si ce n'est pas un mineur
  }

  const getStatusIcon = () => {
    switch (status.status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'capped':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'transitioning':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'locked':
        return <Shield className="h-4 w-4 text-red-500" />;
      case 'unlocked':
        return <Gift className="h-4 w-4 text-purple-500" />;
      default:
        return <User className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusLabel = () => {
    switch (status.status) {
      case 'active':
        return 'Actif';
      case 'capped':
        return 'Plafond atteint';
      case 'transitioning':
        return 'En transition';
      case 'locked':
        return 'Verrou 6 mois';
      case 'unlocked':
        return 'Conversion possible';
      default:
        return 'Statut inconnu';
    }
  };

  const getStatusColor = () => {
    switch (status.status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'capped':
        return 'bg-orange-100 text-orange-800';
      case 'transitioning':
        return 'bg-blue-100 text-blue-800';
      case 'locked':
        return 'bg-red-100 text-red-800';
      case 'unlocked':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-purple-600" />
            Profil Visiteur Mineur
          </div>
          <Badge className={getStatusColor()}>
            {getStatusIcon()}
            <span className="ml-1">{getStatusLabel()}</span>
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* VISUpoints actuels */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1">
              <Coins className="h-3 w-3 text-purple-500" />
              VISUpoints
            </span>
            <span className="font-medium">
              {status.visuPoints.toLocaleString()} VP
            </span>
          </div>
          
          <div className="space-y-1">
            <Progress value={parseFloat(vpStats.capPercentage)} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>≈ {vpStats.euroEquivalent}€</span>
              <span>Max: 200€</span>
            </div>
          </div>
        </div>

        {/* Countdown majorité */}
        {majorityCountdown && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-blue-500" />
                Majorité
              </span>
              <span className={`font-medium ${majorityCountdown.isReached ? 'text-green-600' : majorityCountdown.isNear ? 'text-orange-600' : 'text-muted-foreground'}`}>
                {majorityCountdown.isReached ? '🎉 Atteinte !' : `Dans ${majorityCountdown.text}`}
              </span>
            </div>
          </div>
        )}

        {/* Indicateurs rapides */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center p-2 bg-white/50 rounded">
            <div className="font-medium text-blue-600">{status.age || 0}</div>
            <div className="text-muted-foreground">ans</div>
          </div>
          
          <div className="text-center p-2 bg-white/50 rounded">
            <div className="font-medium text-purple-600">{vpStats.remainingVP}</div>
            <div className="text-muted-foreground">VP restants</div>
          </div>
          
          <div className="text-center p-2 bg-white/50 rounded">
            <div className={`font-medium ${status.canEarnMore ? 'text-green-600' : 'text-red-600'}`}>
              {status.canEarnMore ? '✅' : '🛑'}
            </div>
            <div className="text-muted-foreground">Gains</div>
          </div>
        </div>

        {/* Alertes importantes */}
        {vpStats.isNearCap && !vpStats.isCapReached && (
          <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
            ⚠️ Tu approches du plafond de 200€
          </div>
        )}

        {vpStats.isCapReached && (
          <div className="p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-700">
            🛑 Plafond atteint - Gains en pause jusqu'à tes 18 ans
          </div>
        )}

        {majorityCountdown?.isNear && !majorityCountdown.isReached && (
          <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
            📅 Ta majorité approche ! Prépare-toi à choisir ton type de compte.
          </div>
        )}

        {/* Bouton d'accès au dashboard mineur */}
        <Link href="/minor-visitor-dashboard">
          <Button variant="outline" size="sm" className="w-full">
            <TrendingUp className="h-4 w-4 mr-2" />
            Voir mon espace mineur
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};

export default MinorStatusWidget;