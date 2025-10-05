import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CreditCard, 
  AlertTriangle, 
  Shield, 
  TrendingDown,
  Clock,
  Euro,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';
import { useOverdraftStatus, useOverdraftStats, useOverdraftRiskLevel, useOverdraftFormatters } from '@/hooks/useOverdraft';
import { Link } from 'wouter';

const OverdraftStatusWidget: React.FC = () => {
  const { data: status, isLoading } = useOverdraftStatus();
  const stats = useOverdraftStats(status);
  const riskLevel = useOverdraftRiskLevel(status);
  const { formatAmount, formatPercentage, formatDays } = useOverdraftFormatters();

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-r from-blue-50 to-slate-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
            <span className="text-sm">Chargement du statut de découvert...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!status) {
    return null;
  }

  const getRiskIcon = () => {
    switch (riskLevel.level) {
      case 'safe':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'blocked':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRiskColorClass = () => {
    switch (riskLevel.level) {
      case 'safe':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critical':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'blocked':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCardGradient = () => {
    switch (riskLevel.level) {
      case 'safe':
        return 'bg-gradient-to-r from-green-50 to-blue-50 border-green-200';
      case 'warning':
        return 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200';
      case 'critical':
        return 'bg-gradient-to-r from-orange-50 to-red-50 border-orange-200';
      case 'blocked':
        return 'bg-gradient-to-r from-red-50 to-red-100 border-red-300';
      default:
        return 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200';
    }
  };

  return (
    <Card className={getCardGradient()}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-blue-600" />
            Découvert Autorisé
          </div>
          <Badge className={getRiskColorClass()}>
            {getRiskIcon()}
            <span className="ml-1">{riskLevel.message}</span>
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Solde actuel */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1">
              <Euro className="h-3 w-3 text-blue-500" />
              Solde actuel
            </span>
            <span className={`font-medium ${status.currentBalance < 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatAmount(status.currentBalance)}
            </span>
          </div>
        </div>

        {/* Progression du découvert */}
        {status.overdraftAmount > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Découvert utilisé</span>
              <span className="font-medium text-red-600">
                {formatAmount(status.overdraftAmount)} / {formatAmount(status.overdraftLimit)}
              </span>
            </div>
            
            <Progress 
              value={status.overdraftPercentage * 100} 
              className="h-3"
              indicatorClassName={
                status.overdraftPercentage >= 0.9 ? 'bg-red-500' :
                status.overdraftPercentage >= 0.75 ? 'bg-orange-500' :
                'bg-yellow-500'
              }
            />
            
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatPercentage(status.overdraftPercentage * 100)} utilisé</span>
              <span>Limite: {formatAmount(status.overdraftLimit)}</span>
            </div>
          </div>
        )}

        {/* Crédit disponible */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1">
              <Shield className="h-3 w-3 text-green-500" />
              Crédit disponible
            </span>
            <span className={`font-medium ${status.availableCredit > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatAmount(status.availableCredit)}
            </span>
          </div>
        </div>

        {/* Informations sur les frais */}
        {status.overdraftAmount > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-orange-500" />
                Frais estimés
              </span>
              <span className="font-medium text-orange-600">
                {formatAmount(status.estimatedFees)} ({formatDays(status.daysSinceOverdraft)})
              </span>
            </div>
            
            {stats && (
              <div className="text-xs text-muted-foreground">
                Frais quotidien: {formatAmount(parseFloat(stats.dailyFeeAmount))} / 
                Estimation mensuelle: {formatAmount(parseFloat(stats.monthlyFeeEstimate))}
              </div>
            )}
          </div>
        )}

        {/* Alertes importantes */}
        {status.alertLevel === 'blocked' && (
          <Alert className="border-red-200 bg-red-50">
            <XCircle className="h-4 w-4" />
            <AlertDescription className="text-red-700">
              <strong>Compte bloqué !</strong> Vous avez dépassé votre limite de découvert. 
              Veuillez régulariser votre situation ou contacter le support.
            </AlertDescription>
          </Alert>
        )}

        {status.alertLevel === 'critical' && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-orange-700">
              <strong>Situation critique !</strong> Vous avez utilisé {formatPercentage(status.overdraftPercentage * 100)} 
              de votre découvert. Régularisez sous {stats?.daysUntilBlock || 3} jours pour éviter le blocage.
            </AlertDescription>
          </Alert>
        )}

        {status.alertLevel === 'warning' && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-yellow-700">
              <strong>Attention !</strong> Vous approchez de votre limite de découvert 
              ({formatPercentage(status.overdraftPercentage * 100)} utilisé).
            </AlertDescription>
          </Alert>
        )}

        {/* Prochaine alerte */}
        {status.nextAlert && status.alertLevel !== 'safe' && (
          <div className="text-xs text-muted-foreground text-center">
            Prochaine vérification: {new Date(status.nextAlert).toLocaleDateString('fr-FR')}
          </div>
        )}

        {/* Bouton d'accès aux détails */}
        <Link href="/wallet/overdraft">
          <Button variant="outline" size="sm" className="w-full">
            <TrendingDown className="h-4 w-4 mr-2" />
            Gérer mon découvert
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};

export default OverdraftStatusWidget;