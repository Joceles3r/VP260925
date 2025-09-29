import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, DollarSign, ChartPie as PieChart, ChartBar as BarChart3, Users, Eye, Star, Bell, Calendar, Activity, Zap, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatCurrency, formatPercentage } from '@shared/utils';
import { useAuth } from '@/hooks/useAuth';

interface DashboardStats {
  totalBalance: number;
  totalInvested: number;
  totalGains: number;
  activeInvestments: number;
  portfolioROI: number;
  monthlyGains: number;
  visuPoints: number;
  notifications: number;
}

interface RecentActivity {
  id: string;
  type: 'investment' | 'gain' | 'notification';
  title: string;
  description: string;
  amount?: number;
  timestamp: string;
}

export default function Dashboard() {
  const { user } = useAuth();

  // Mock dashboard data
  const mockStats: DashboardStats = {
    totalBalance: parseFloat(user?.balanceEUR || '10000'),
    totalInvested: parseFloat(user?.totalInvested || '150'),
    totalGains: parseFloat(user?.totalGains || '12.50'),
    activeInvestments: 3,
    portfolioROI: 0.083, // 8.3%
    monthlyGains: 8.75,
    visuPoints: 1250,
    notifications: 2
  };

  const mockActivities: RecentActivity[] = [
    {
      id: '1',
      type: 'investment',
      title: 'Nouvel investissement',
      description: 'Documentaire sur l\'IA - 50€',
      amount: 50,
      timestamp: '2024-01-20T14:30:00Z'
    },
    {
      id: '2',
      type: 'gain',
      title: 'Redistribution mensuelle',
      description: 'Court-métrage Animation 3D',
      amount: 12.50,
      timestamp: '2024-01-19T10:00:00Z'
    },
    {
      id: '3',
      type: 'notification',
      title: 'Projet financé',
      description: 'Série Web Thriller a atteint son objectif',
      timestamp: '2024-01-18T16:45:00Z'
    }
  ];

  const { data: stats = mockStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => mockStats,
    staleTime: 1000 * 60 * 5,
  });

  const { data: activities = mockActivities } = useQuery({
    queryKey: ['recent-activities'],
    queryFn: async () => mockActivities,
    staleTime: 1000 * 60 * 2,
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'investment': return <TrendingUp className="h-4 w-4 text-blue-500" />;
      case 'gain': return <DollarSign className="h-4 w-4 text-green-500" />;
      case 'notification': return <Bell className="h-4 w-4 text-purple-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / 3600000);
    
    if (diffInHours < 24) return `${diffInHours}h`;
    return `${Math.floor(diffInHours / 24)}j`;
  };

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
          <h1 className="text-4xl font-bold text-white mb-2">
            Tableau de Bord
          </h1>
          <p className="text-gray-400">
            Vue d'ensemble de votre activité sur VISUAL
          </p>
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
                    <p className="text-sm font-medium text-gray-400">Solde Total</p>
                    <p className="text-2xl font-bold text-white">
                      {formatCurrency(stats.totalBalance)}
                    </p>
                    <p className="text-xs text-green-400 mt-1">Mode simulation</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-500" />
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
                    <p className="text-sm font-medium text-gray-400">Investi</p>
                    <p className="text-2xl font-bold text-white">
                      {formatCurrency(stats.totalInvested)}
                    </p>
                    <p className="text-xs text-blue-400 mt-1">
                      {stats.activeInvestments} projets actifs
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-500" />
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
                    <p className="text-sm font-medium text-gray-400">ROI Portfolio</p>
                    <p className="text-2xl font-bold text-green-400">
                      +{formatPercentage(stats.portfolioROI)}
                    </p>
                    <p className="text-xs text-green-400 mt-1">
                      +{formatCurrency(stats.totalGains)} ce mois
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-purple-500" />
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
                    <p className="text-sm font-medium text-gray-400">VISUpoints</p>
                    <p className="text-2xl font-bold text-white">
                      {stats.visuPoints.toLocaleString()}
                    </p>
                    <p className="text-xs text-yellow-400 mt-1">
                      ≈ {formatCurrency(stats.visuPoints / 100)}
                    </p>
                  </div>
                  <Star className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Activité récente */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="lg:col-span-2"
          >
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Activité Récente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activities.map((activity, index) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/50 hover:bg-slate-900/70 transition-colors"
                    >
                      <div className="flex-shrink-0">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-white">{activity.title}</p>
                        <p className="text-sm text-gray-400">{activity.description}</p>
                      </div>
                      <div className="text-right">
                        {activity.amount && (
                          <p className={`font-semibold ${
                            activity.type === 'gain' ? 'text-green-400' : 'text-white'
                          }`}>
                            {activity.type === 'gain' ? '+' : '-'}{formatCurrency(activity.amount)}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          {getTimeAgo(activity.timestamp)}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Actions rapides */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="space-y-6"
          >
            {/* Notifications */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notifications
                  {stats.notifications > 0 && (
                    <Badge className="bg-red-500 text-white">
                      {stats.notifications}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-blue-900/20 border border-blue-500/30">
                    <p className="text-sm font-medium text-blue-300">Nouveau projet</p>
                    <p className="text-xs text-gray-400">Un documentaire vient d'être publié</p>
                  </div>
                  <div className="p-3 rounded-lg bg-green-900/20 border border-green-500/30">
                    <p className="text-sm font-medium text-green-300">Objectif atteint</p>
                    <p className="text-xs text-gray-400">Animation 3D a atteint 50% de financement</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-4 border-slate-600 text-gray-300">
                  Voir toutes
                </Button>
              </CardContent>
            </Card>

            {/* Actions rapides */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Actions Rapides
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  onClick={() => window.location.href = '/projects'}
                >
                  <Target className="h-4 w-4 mr-2" />
                  Découvrir des projets
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full border-slate-600 text-gray-300 hover:bg-slate-700"
                  onClick={() => window.location.href = '/portfolio'}
                >
                  <PieChart className="h-4 w-4 mr-2" />
                  Voir mon portfolio
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full border-slate-600 text-gray-300 hover:bg-slate-700"
                  onClick={() => window.location.href = '/live'}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Shows en direct
                </Button>
              </CardContent>
            </Card>

            {/* Objectifs du mois */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Objectifs du Mois
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Investissements</span>
                    <span className="text-white">3/5</span>
                  </div>
                  <Progress value={60} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">VISUpoints</span>
                    <span className="text-white">1250/2500</span>
                  </div>
                  <Progress value={50} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">ROI Cible</span>
                    <span className="text-green-400">8.3%/10%</span>
                  </div>
                  <Progress value={83} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Graphiques de performance */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mt-8"
        >
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance du Portfolio
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
      </div>
    </div>
  );
}