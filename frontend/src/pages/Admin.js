import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText
} from 'lucide-react';

const Admin = () => {
  const adminStats = [
    {
      title: 'Utilisateurs totaux',
      value: '12,847',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      trend: '+12%'
    },
    {
      title: 'Volume investi',
      value: '2.5M€',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      trend: '+23%'
    },
    {
      title: 'Projets actifs',
      value: '247',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      trend: '+8%'
    },
    {
      title: 'Conformité AMF',
      value: '98.5%',
      icon: Shield,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
      trend: '+1%'
    }
  ];

  const pendingActions = [
    {
      id: 1,
      type: 'project_review',
      title: 'Nouveau projet à valider',
      description: 'Série documentaire "Ocean Plastique"',
      priority: 'high',
      timestamp: 'Il y a 2h'
    },
    {
      id: 2,
      type: 'kyc_verification',
      title: 'Vérification KYC en attente',
      description: 'Marie Dubois - Documents soumis',
      priority: 'medium',
      timestamp: 'Il y a 4h'
    },
    {
      id: 3,
      type: 'compliance_report',
      title: 'Rapport AMF mensuel',
      description: 'À générer avant le 30/09',
      priority: 'high',
      timestamp: 'Il y a 1j'
    },
    {
      id: 4,
      type: 'user_support',
      title: 'Support utilisateur',
      description: 'Problème de paiement signalé',
      priority: 'low',
      timestamp: 'Il y a 2j'
    }
  ];

  const recentActivity = [
    {
      id: 1,
      action: 'Projet approuvé',
      details: 'Documentaire IA - Marie Dubois',
      timestamp: 'Il y a 30m',
      type: 'success'
    },
    {
      id: 2,
      action: 'Utilisateur banni',
      details: 'Activité suspecte détectée',
      timestamp: 'Il y a 1h',
      type: 'warning'
    },
    {
      id: 3,
      action: 'Rapport généré',
      details: 'Analyse des performances Q3',
      timestamp: 'Il y a 2h',
      type: 'info'
    }
  ];

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityIcon = (type) => {
    switch (type) {
      case 'project_review': return <FileText className="h-4 w-4" />;
      case 'kyc_verification': return <Shield className="h-4 w-4" />;
      case 'compliance_report': return <CheckCircle className="h-4 w-4" />;
      case 'user_support': return <Users className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Administration VISUAL
        </h1>
        <p className="text-gray-600">
          Tableau de bord pour la gestion et la supervision de la plateforme
        </p>
      </div>

      {/* Admin Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {adminStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent className="flex items-center p-6">
                <div className={`rounded-full p-3 ${stat.bgColor} mr-4`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="flex-1">
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-gray-600">{stat.title}</p>
                  <p className="text-xs text-green-600 mt-1">{stat.trend} ce mois</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pending Actions */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
                Actions en attente
              </CardTitle>
              <CardDescription>
                Tâches nécessitant votre attention immédiate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingActions.map((action) => (
                  <div key={action.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-gray-100 rounded-full">
                        {getPriorityIcon(action.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium">{action.title}</h3>
                          <Badge className={getPriorityColor(action.priority)}>
                            {action.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500">{action.description}</p>
                        <p className="text-xs text-gray-400">{action.timestamp}</p>
                      </div>
                    </div>
                    <Button size="sm">
                      Traiter
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start">
                <FileText className="h-4 w-4 mr-2" />
                Générer rapport AMF
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                Gérer les utilisateurs
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Shield className="h-4 w-4 mr-2" />
                Audit sécurité
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="h-4 w-4 mr-2" />
                Analytics avancées
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Activité récente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className={`mt-1 w-2 h-2 rounded-full ${
                      activity.type === 'success' ? 'bg-green-500' :
                      activity.type === 'warning' ? 'bg-orange-500' :
                      'bg-blue-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-xs text-gray-500">{activity.details}</p>
                      <p className="text-xs text-gray-400">{activity.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* System Health */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
            État du système
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">99.9%</div>
              <p className="text-sm text-gray-600">Disponibilité</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">245ms</div>
              <p className="text-sm text-gray-600">Temps de réponse moyen</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">3,847</div>
              <p className="text-sm text-gray-600">Utilisateurs connectés</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Admin;