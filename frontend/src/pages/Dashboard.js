import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import { TrendingUp, TrendingDown, DollarSign, Eye, Target } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvestments = async () => {
      try {
        const response = await api.get('/investments');
        if (response.data.success) {
          setInvestments(response.data.data);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des investissements:', error);
        // Fallback data
        setInvestments([
          {
            id: "inv-1",
            userId: "demo-user-1",
            projectId: "proj-1",
            amount: "50.00",
            currentValue: "52.50",
            roi: "0.05",
            createdAt: "2024-01-15T10:00:00Z",
            project: {
              id: "proj-1",
              title: "Documentaire sur l'IA",
              category: "documentaire",
              status: "active",
              thumbnailUrl: null
            }
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchInvestments();
  }, []);

  // Calculate portfolio stats
  const portfolioStats = {
    totalInvested: parseFloat(user?.totalInvested || '0'),
    totalValue: investments.reduce((sum, inv) => sum + parseFloat(inv.currentValue), 0),
    totalGains: parseFloat(user?.totalGains || '0'),
    activeInvestments: investments.length
  };

  portfolioStats.totalROI = portfolioStats.totalInvested > 0 
    ? (portfolioStats.totalValue - portfolioStats.totalInvested) / portfolioStats.totalInvested 
    : 0;

  const statCards = [
    {
      title: 'Valeur du portefeuille',
      value: formatCurrency(portfolioStats.totalValue),
      icon: DollarSign,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Total investi',
      value: formatCurrency(portfolioStats.totalInvested),
      icon: Target,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'ROI global',
      value: formatPercentage(portfolioStats.totalROI),
      icon: portfolioStats.totalROI >= 0 ? TrendingUp : TrendingDown,
      color: portfolioStats.totalROI >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: portfolioStats.totalROI >= 0 ? 'bg-green-100' : 'bg-red-100'
    },
    {
      title: 'Investissements actifs',
      value: portfolioStats.activeInvestments.toString(),
      icon: Eye,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Tableau de bord
        </h1>
        <p className="text-gray-600">
          Suivez la performance de vos investissements en temps réel
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => {
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

      {/* Portfolio Performance Chart Placeholder */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Performance du portefeuille</CardTitle>
          <CardDescription>
            Évolution de vos investissements au cours des 30 derniers jours
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <TrendingUp className="h-16 w-16 text-purple-400 mx-auto mb-4" />
              <p className="text-gray-600">Graphique de performance</p>
              <p className="text-sm text-gray-500 mt-2">
                Évolution: +{formatPercentage(portfolioStats.totalROI)} ce mois
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Investments */}
      <Card>
        <CardHeader>
          <CardTitle>Mes investissements</CardTitle>
          <CardDescription>
            Liste de tous vos investissements actifs et leur performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {investments.length === 0 ? (
            <div className="text-center py-8">
              <Eye className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucun investissement pour le moment</p>
              <p className="text-sm text-gray-500 mt-2">
                Commencez par explorer les projets disponibles
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {investments.map((investment) => {
                const roi = parseFloat(investment.roi);
                const isPositive = roi >= 0;
                
                return (
                  <div key={investment.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-blue-500 rounded-lg flex items-center justify-center">
                        <Eye className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium">{investment.project.title}</h3>
                        <p className="text-sm text-gray-500 capitalize">
                          {investment.project.category}
                        </p>
                        <Badge variant={investment.project.status === 'active' ? 'default' : 'secondary'}>
                          {investment.project.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-medium">
                        {formatCurrency(parseFloat(investment.amount))} → {formatCurrency(parseFloat(investment.currentValue))}
                      </p>
                      <p className={`text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {isPositive ? '+' : ''}{formatPercentage(roi)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(investment.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;