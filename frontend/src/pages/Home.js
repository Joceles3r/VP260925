import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/lib/i18n';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { TrendingUp, DollarSign, Eye, Users } from 'lucide-react';

const Home = () => {
  const { user } = useAuth();
  const { t, formatCurrency } = useI18n();
  const [, navigate] = useLocation();

  const stats = [
    {
      title: t('dashboard.stats.balance'),
      value: formatCurrency(parseFloat(user?.balanceEUR || '0')),
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: t('dashboard.stats.invested'),
      value: formatCurrency(parseFloat(user?.totalInvested || '0')),
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: t('dashboard.stats.gains'),
      value: formatCurrency(parseFloat(user?.totalGains || '0')),
      icon: Eye,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: t('dashboard.stats.projects'),
      value: '12',
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ];

  const recentProjects = [
    {
      id: 1,
      title: 'Documentaire sur l\'IA',
      category: 'Documentaire',
      progress: 25,
      amount: '1,250€',
      target: '5,000€',
      roi: '+5%'
    },
    {
      id: 2,
      title: 'Court-métrage Animation',
      category: 'Animation',
      progress: 40,
      amount: '3,200€',
      target: '8,000€',
      roi: '+12%'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Bonjour {user?.firstName} ! 👋
        </h1>
        <p className="mt-2 text-gray-600">
          Voici un aperçu de votre activité sur VISUAL Platform
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
            <CardDescription>
              Accédez rapidement aux fonctionnalités principales
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button 
                onClick={() => navigate('/projects')}
                className="h-20 flex flex-col items-center justify-center"
              >
                <Eye className="h-6 w-6 mb-2" />
                Parcourir les projets
              </Button>
              <Button 
                onClick={() => navigate('/portfolio')}
                variant="outline"
                className="h-20 flex flex-col items-center justify-center"
              >
                <TrendingUp className="h-6 w-6 mb-2" />
                Mon portefeuille
              </Button>
              <Button 
                onClick={() => navigate('/live')}
                variant="outline"
                className="h-20 flex flex-col items-center justify-center"
              >
                <Users className="h-6 w-6 mb-2" />
                Shows en direct
              </Button>
              <Button 
                onClick={() => navigate('/dashboard')}
                variant="outline"
                className="h-20 flex flex-col items-center justify-center"
              >
                <DollarSign className="h-6 w-6 mb-2" />
                Tableau de bord
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notification</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900">
                  Nouveau projet disponible !
                </p>
                <p className="text-xs text-blue-700">
                  Un documentaire sur l'écologie vient d'être publié
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm font-medium text-green-900">
                  ROI positif !
                </p>
                <p className="text-xs text-green-700">
                  Votre investissement dans "IA Documentary" rapporte +5%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Projects */}
      <Card>
        <CardHeader>
          <CardTitle>Projets récents</CardTitle>
          <CardDescription>
            Vos derniers investissements et leur performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentProjects.map((project) => (
              <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-1">
                  <h3 className="font-medium">{project.title}</h3>
                  <p className="text-sm text-gray-500">{project.category}</p>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full" 
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>
                <div className="text-right ml-4">
                  <p className="font-medium">{project.amount} / {project.target}</p>
                  <p className="text-sm text-green-600">{project.roi}</p>
                </div>
              </div>
            ))}
          </div>
          <Button 
            onClick={() => navigate('/projects')}
            variant="outline" 
            className="w-full mt-4"
          >
            Voir tous les projets
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Home;