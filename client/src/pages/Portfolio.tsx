import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, DollarSign, ChartPie as PieChart, ChartBar as BarChart3, Eye, Star, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatCurrency, formatPercentage, calculateROI } from '@shared/utils';
import { useAuth } from '@/hooks/useAuth';
import { investmentsApi } from '@/lib/api';

interface PortfolioStats {
  totalInvested: number;
  currentValue: number;
  totalROI: number;
  totalGains: number;
  investmentCount: number;
  topPerformer: {
    projectTitle: string;
    roi: number;
  } | null;
}

export default function Portfolio() {
  const { user } = useAuth();
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  // Mock portfolio data
  const mockInvestments = [
    {
      id: 'inv-1',
      userId: '1',
      projectId: 'proj-1',
      amount: '50.00',
      currentValue: '62.50',
      roi: '0.25',
      votesGiven: 4,
      createdAt: '2024-01-15T10:00:00Z',
      project: {
        id: 'proj-1',
        title: 'Documentaire sur l\'IA',
        category: 'documentaire',
        status: 'active',
        thumbnailUrl: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=400'
      }
    },
    {
      id: 'inv-2',
      userId: '1',
      projectId: 'proj-2',
      amount: '75.00',
      currentValue: '82.50',
      roi: '0.10',
      votesGiven: 6,
      createdAt: '2024-01-10T14:30:00Z',
      project: {
        id: 'proj-2',
        title: 'Court-métrage Animation 3D',
        category: 'animation',
        status: 'active',
        thumbnailUrl: 'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=400'
      }
    },
    {
      id: 'inv-3',
      userId: '1',
      projectId: 'proj-3',
      amount: '25.00',
      currentValue: '22.50',
      roi: '-0.10',
      votesGiven: 2,
      createdAt: '2024-01-20T09:15:00Z',
      project: {
        id: 'proj-3',
        title: 'Série Web Thriller',
        category: 'série',
        status: 'pending',
        thumbnailUrl: 'https://images.pexels.com/photos/1029141/pexels-photo-1029141.jpeg?auto=compress&cs=tinysrgb&w=400'
      }
    }
  ];

  const { data: investments = mockInvestments, isLoading } = useQuery({
    queryKey: ['investments', timeframe],
    queryFn: async () => {
      // Simulation d'un appel API
      return mockInvestments;
    },
    staleTime: 1000 * 60 * 5,
  });

  // Calcul des statistiques du portfolio
  const portfolioStats: PortfolioStats = React.useMemo(() => {
    const totalInvested = investments.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
    const currentValue = investments.reduce((sum, inv) => sum + parseFloat(inv.currentValue), 0);
    const totalGains = currentValue - totalInvested;
    const totalROI = totalInvested > 0 ? totalGains / totalInvested : 0;
    
    const topPerformer = investments.reduce((best, inv) => {
      const roi = parseFloat(inv.roi);
      if (!best || roi > best.roi) {
        return { projectTitle: inv.project.title, roi };
      }
      return best;
    }, null as { projectTitle: string; roi: number } | null);

    return {
      totalInvested,
      currentValue,
      totalROI,
      totalGains,
      investmentCount: investments.length,
      topPerformer
    };
  }, [investments]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">Mon Portfolio</h1>
          <p className="text-gray-400">Suivez la performance de vos investissements en temps réel</p>
        </motion.div>

        {/* Stats principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Total Investi</p>
                    <p className="text-2xl font-bold text-white">
                      {formatCurrency(portfolioStats.totalInvested)}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Valeur Actuelle</p>
                    <p className="text-2xl font-bold text-white">
                      {formatCurrency(portfolioStats.currentValue)}
                    </p>
                  </div>
                  <PieChart className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">ROI Total</p>
                    <p className={`text-2xl font-bold ${portfolioStats.totalROI >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {portfolioStats.totalROI >= 0 ? '+' : ''}{formatPercentage(portfolioStats.totalROI)}
                    </p>
                  </div>
                  {portfolioStats.totalROI >= 0 ? (
                    <TrendingUp className="h-8 w-8 text-green-500" />
                  ) : (
                    <TrendingDown className="h-8 w-8 text-red-500" />
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Gains/Pertes</p>
                    <p className={`text-2xl font-bold ${portfolioStats.totalGains >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {portfolioStats.totalGains >= 0 ? '+' : ''}{formatCurrency(portfolioStats.totalGains)}
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-pink-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Meilleur performer */}
        {portfolioStats.topPerformer && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mb-8"
          >
            <Card className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 border-green-500/30">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Star className="h-6 w-6 text-yellow-500" />
                    <div>
                      <p className="text-sm font-medium text-green-300">Meilleur Performer</p>
                      <p className="text-lg font-bold text-white">{portfolioStats.topPerformer.projectTitle}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-400">
                      +{formatPercentage(portfolioStats.topPerformer.roi)}
                    </p>
                    <p className="text-sm text-green-300">ROI</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Filtres de période */}
        <div className="flex gap-2 mb-6">
          {(['7d', '30d', '90d', 'all'] as const).map((period) => (
            <Button
              key={period}
              variant={timeframe === period ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeframe(period)}
              className={timeframe === period 
                ? 'bg-gradient-to-r from-blue-500 to-purple-600' 
                : 'border-slate-600 text-gray-300 hover:bg-slate-700'
              }
            >
              {period === 'all' ? 'Tout' : period}
            </Button>
          ))}
        </div>

        {/* Liste des investissements */}
        <div className="space-y-4">
          {investments.map((investment, index) => {
            const roi = parseFloat(investment.roi);
            const isPositive = roi >= 0;
            
            return (
              <motion.div
                key={investment.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-all duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      {/* Thumbnail */}
                      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                        <img 
                          src={investment.project.thumbnailUrl} 
                          alt={investment.project.title}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Détails du projet */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-white mb-1 truncate">
                          {investment.project.title}
                        </h3>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary" className="text-xs">
                            {investment.project.category}
                          </Badge>
                          <Badge 
                            variant={investment.project.status === 'active' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {investment.project.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-400">
                          Investi le {new Date(investment.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>

                      {/* Métriques */}
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="text-right">
                            <p className="text-sm text-gray-400">Investi</p>
                            <p className="text-lg font-semibold text-white">
                              {formatCurrency(parseFloat(investment.amount))}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-400">Valeur</p>
                            <p className="text-lg font-semibold text-white">
                              {formatCurrency(parseFloat(investment.currentValue))}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          {isPositive ? (
                            <ArrowUpRight className="h-4 w-4 text-green-500" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4 text-red-500" />
                          )}
                          <span className={`font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                            {isPositive ? '+' : ''}{formatPercentage(roi)}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2">
                        <Button size="sm" variant="outline" className="border-slate-600 text-gray-300 hover:bg-slate-700">
                          <Eye className="h-4 w-4 mr-1" />
                          Voir
                        </Button>
                        <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white">
                          <Star className="h-4 w-4 mr-1" />
                          Suivre
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* État vide */}
        {investments.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-white mb-2">Aucun investissement</h3>
            <p className="text-gray-400 mb-6">
              Commencez à investir dans des projets pour voir votre portfolio ici.
            </p>
            <Button 
              onClick={() => window.location.href = '/projects'}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              Découvrir les projets
            </Button>
          </motion.div>
        )}

        {/* Graphiques de performance */}
        {investments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-8"
          >
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Analyse de Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <PieChart className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    Graphiques d'analyse bientôt disponibles
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}