import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import { TrendingUp, TrendingDown, Eye, Target, Calendar } from 'lucide-react';

const Portfolio = () => {
  const { user } = useAuth();

  // Mock portfolio data
  const investments = [
    {
      id: 1,
      project: {
        title: "Documentaire sur l'IA",
        category: "Documentaire",
        status: "active"
      },
      amount: 50,
      currentValue: 52.50,
      roi: 0.05,
      investedDate: "2024-01-15",
      shares: 5
    },
    {
      id: 2,
      project: {
        title: "Court-métrage Animation",
        category: "Animation", 
        status: "active"
      },
      amount: 75,
      currentValue: 84,
      roi: 0.12,
      investedDate: "2024-02-01",
      shares: 7.5
    },
    {
      id: 3,
      project: {
        title: "Série Web Écologique",
        category: "Série",
        status: "completed"
      },
      amount: 100,
      currentValue: 95,
      roi: -0.05,
      investedDate: "2023-12-10",
      shares: 10
    }
  ];

  const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
  const totalValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
  const totalROI = (totalValue - totalInvested) / totalInvested;

  const portfolioStats = [
    {
      title: 'Valeur totale',
      value: formatCurrency(totalValue),
      icon: Target,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Investi',
      value: formatCurrency(totalInvested),
      icon: Eye,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Plus-value',
      value: formatCurrency(totalValue - totalInvested),
      icon: totalROI >= 0 ? TrendingUp : TrendingDown,
      color: totalROI >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: totalROI >= 0 ? 'bg-green-100' : 'bg-red-100'
    },
    {
      title: 'ROI Global',
      value: formatPercentage(totalROI),
      icon: Calendar,
      color: totalROI >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: totalROI >= 0 ? 'bg-green-100' : 'bg-red-100'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Mon Portfolio
        </h1>
        <p className="text-gray-600">
          Suivez la performance de tous vos investissements VISUAL
        </p>
      </div>

      {/* Portfolio Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {portfolioStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent className="flex items-center p-6">
                <div className={`rounded-full p-3 ${stat.bgColor} mr-4`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-gray-600">{stat.title}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Allocation Chart Placeholder */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Répartition du portefeuille</CardTitle>
          <CardDescription>
            Distribution de vos investissements par catégorie
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Target className="h-16 w-16 text-purple-400 mx-auto mb-4" />
              <p className="text-gray-600">Graphique de répartition</p>
              <div className="mt-4 flex justify-center space-x-4">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-purple-400 rounded mr-2"></div>
                  <span className="text-sm">Documentaire (40%)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-blue-400 rounded mr-2"></div>
                  <span className="text-sm">Animation (35%)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-400 rounded mr-2"></div>
                  <span className="text-sm">Série (25%)</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Investments List */}
      <Card>
        <CardHeader>
          <CardTitle>Détail des investissements</CardTitle>
          <CardDescription>
            Historique complet de vos investissements avec performance détaillée
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {investments.map((investment) => {
              const isPositive = investment.roi >= 0;
              const progressPercent = Math.min((investment.currentValue / investment.amount) * 100, 200);
              
              return (
                <div key={investment.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1">
                        {investment.project.title}
                      </h3>
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant="outline">
                          {investment.project.category}
                        </Badge>
                        <Badge variant={investment.project.status === 'active' ? 'default' : 'secondary'}>
                          {investment.project.status === 'active' ? 'Actif' : 'Terminé'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">
                        Investi le {new Date(investment.investedDate).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-bold mb-1">
                        {formatCurrency(investment.currentValue)}
                      </div>
                      <div className={`text-lg ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {isPositive ? '+' : ''}{formatPercentage(investment.roi)}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Investment Progress */}
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Investissement initial:</span>
                        <span className="font-medium">{formatCurrency(investment.amount)}</span>
                      </div>
                      <Progress value={progressPercent} className="h-3" />
                    </div>

                    {/* Investment Details */}
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Parts détenues</p>
                        <p className="font-medium">{investment.shares}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Plus-value</p>
                        <p className={`font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(investment.currentValue - investment.amount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Durée</p>
                        <p className="font-medium">
                          {Math.floor((new Date() - new Date(investment.investedDate)) / (1000 * 60 * 60 * 24))} jours
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Portfolio;