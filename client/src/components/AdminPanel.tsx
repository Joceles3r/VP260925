import React, { useEffect } from 'react';
import { Users, DollarSign, Film, ShieldAlert } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdminStore } from '@/stores/adminStore';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface AdminStatsProps {
  stats: any;
}

function AdminStats({ stats }: AdminStatsProps) {
  if (!stats) return null;

  const statCards = [
    {
      title: 'Utilisateurs Actifs',
      value: stats.users.totalUsers.toLocaleString(),
      subtitle: `+${Math.round(((stats.users.activeUsers / stats.users.totalUsers) * 100))}% cette semaine`,
      icon: <Users className="h-5 w-5 text-primary" />,
      iconColor: 'bg-primary/10',
    },
    {
      title: 'Volume Transactions',
      value: `€${parseFloat(stats.transactions.totalVolume).toLocaleString()}`,
      subtitle: `€${parseFloat(stats.transactions.todayVolume).toLocaleString()} aujourd'hui`,
      icon: <DollarSign className="h-5 w-5 text-secondary" />,
      iconColor: 'bg-secondary/10',
    },
    {
      title: 'Projets Soumis',
      value: stats.projects.pendingProjects.toString(),
      subtitle: 'En attente validation',
      icon: <Film className="h-5 w-5 text-accent" />,
      iconColor: 'bg-accent/10',
    },
    {
      title: 'Alertes Sécurité',
      value: stats.users.kycPending.toString(),
      subtitle: 'KYC en attente',
      icon: <ShieldAlert className="h-5 w-5 text-destructive" />,
      iconColor: 'bg-destructive/10',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statCards.map((stat) => (
        <div key={stat.title} className="bg-card rounded-lg p-6 border border-border" data-testid={`admin-stat-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className={`w-10 h-10 ${stat.iconColor} rounded-lg flex items-center justify-center`}>
                {stat.icon}
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
              <p className="text-2xl font-bold text-foreground" data-testid={`value-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                {stat.value}
              </p>
              <p className="text-sm text-secondary">{stat.subtitle}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminPanel() {
  const { toast } = useToast();
  const { stats, users, pendingProjects, transactions } = useAdminStore();

  const { data: adminStats } = useQuery({
    queryKey: ['/api/admin/stats'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: adminUsers } = useQuery({
    queryKey: ['/api/admin/users'],
  });

  const { data: adminPendingProjects } = useQuery({
    queryKey: ['/api/admin/projects/pending'],
  });

  const { data: adminTransactions } = useQuery({
    queryKey: ['/api/admin/transactions'],
  });

  const handleProjectApproval = async (projectId: string, status: 'active' | 'rejected') => {
    try {
      await apiRequest('PUT', `/api/admin/projects/${projectId}/status`, { status });
      
      toast({
        title: "Projet mis à jour",
        description: `Le projet a été ${status === 'active' ? 'approuvé' : 'rejeté'}`,
      });

      // Refetch pending projects
      window.location.reload(); // Simple refresh for now
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le projet",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground" data-testid="admin-title">Administration</h2>
        <div className="flex items-center space-x-4">
          <select className="px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
            <option>Dernières 24h</option>
            <option>7 derniers jours</option>
            <option>30 derniers jours</option>
          </select>
          <Button variant="outline" data-testid="export-report">
            Exporter Rapport
          </Button>
        </div>
      </div>

      <AdminStats stats={adminStats} />

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users" data-testid="tab-users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="projects" data-testid="tab-projects">Projets</TabsTrigger>
          <TabsTrigger value="transactions" data-testid="tab-transactions">Transactions</TabsTrigger>
          <TabsTrigger value="compliance" data-testid="tab-compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Gestion des Utilisateurs</h3>
                <div className="flex items-center space-x-2">
                  <Input
                    placeholder="Rechercher un utilisateur..."
                    className="w-64"
                    data-testid="user-search"
                  />
                  <Button size="sm" data-testid="search-users">
                    Rechercher
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="users-table">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Utilisateur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      KYC
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Solde
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Dernière Activité
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                
                <tbody className="divide-y divide-border">
                  {adminUsers?.map((user: any) => (
                    <tr key={user.id} className="hover:bg-muted/10" data-testid={`user-row-${user.id}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-sm font-medium text-primary-foreground">
                            {user.firstName?.[0] || user.email?.[0] || 'U'}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-foreground" data-testid="user-name">
                              {user.firstName || user.email || 'Utilisateur'}
                            </div>
                            <div className="text-sm text-muted-foreground" data-testid="user-email">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span 
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.kycVerified 
                              ? 'bg-secondary/10 text-secondary'
                              : 'bg-accent/10 text-accent'
                          }`}
                          data-testid="kyc-status"
                        >
                          {user.kycVerified ? '✓ Vérifié' : '⏳ En cours'}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground" data-testid="user-balance">
                        €{parseFloat(user.balanceEUR || '0').toLocaleString()}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground" data-testid="last-activity">
                        {new Date(user.updatedAt).toLocaleDateString()}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary/10 text-secondary">
                          Actif
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button className="text-primary hover:text-primary/80" data-testid="view-user">
                          Voir
                        </button>
                        <button className="text-muted-foreground hover:text-foreground" data-testid="edit-user">
                          Modifier
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Gestion des Projets</h3>
                <Button data-testid="create-project">Nouveau Projet</Button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {adminPendingProjects?.map((project: any) => (
                  <div key={project.id} className="border border-border rounded-lg p-4" data-testid={`pending-project-${project.id}`}>
                    <img 
                      src={project.thumbnailUrl || 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=200&fit=crop'} 
                      alt={`${project.title} thumbnail`}
                      className="w-full h-32 object-cover rounded mb-3"
                      data-testid="project-thumbnail"
                    />
                    
                    <h4 className="font-semibold text-foreground mb-2" data-testid="project-title">
                      {project.title}
                    </h4>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Type:</span>
                        <span className="text-foreground" data-testid="project-category">
                          {project.category}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Objectif:</span>
                        <span className="text-foreground" data-testid="project-target">
                          €{parseFloat(project.targetAmount).toLocaleString()}
                        </span>
                      </div>
                      
                      {project.mlScore && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Score ML:</span>
                          <span className="text-secondary" data-testid="ml-score">
                            {parseFloat(project.mlScore).toFixed(1)}/10
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleProjectApproval(project.id, 'active')}
                        data-testid="approve-project"
                      >
                        Approuver
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1"
                        onClick={() => handleProjectApproval(project.id, 'rejected')}
                        data-testid="reject-project"
                      >
                        Rejeter
                      </Button>
                    </div>
                  </div>
                ))}
                
                {(!adminPendingProjects || adminPendingProjects.length === 0) && (
                  <div className="col-span-full text-center py-8 text-muted-foreground" data-testid="no-pending-projects">
                    Aucun projet en attente
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">Transactions Récentes</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="transactions-table">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      ID Transaction
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Utilisateur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Montant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Commission
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                
                <tbody className="divide-y divide-border">
                  {adminTransactions?.map((transaction: any) => (
                    <tr key={transaction.id} className="hover:bg-muted/10" data-testid={`transaction-row-${transaction.id}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-foreground" data-testid="transaction-id">
                        #{transaction.id.slice(-8)}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground" data-testid="transaction-user">
                        {transaction.userId.slice(-8)}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground" data-testid="transaction-type">
                        {transaction.type}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground" data-testid="transaction-amount">
                        €{parseFloat(transaction.amount).toFixed(2)}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary" data-testid="transaction-commission">
                        €{parseFloat(transaction.commission || '0').toFixed(2)}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground" data-testid="transaction-date">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Compliance AMF</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-secondary/10 rounded-lg p-4" data-testid="compliance-rate">
                <div className="text-2xl font-bold text-secondary">98.5%</div>
                <div className="text-sm text-muted-foreground">Taux de conformité</div>
              </div>
              
              <div className="bg-accent/10 rounded-lg p-4" data-testid="reports-generated">
                <div className="text-2xl font-bold text-accent">12</div>
                <div className="text-sm text-muted-foreground">Rapports générés</div>
              </div>
              
              <div className="bg-destructive/10 rounded-lg p-4" data-testid="active-alerts">
                <div className="text-2xl font-bold text-destructive">2</div>
                <div className="text-sm text-muted-foreground">Alertes actives</div>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Vérifications KYC en Attente</h3>
            
            <div className="space-y-3">
              {adminUsers?.filter((user: any) => !user.kycVerified).map((user: any) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg" data-testid={`kyc-pending-${user.id}`}>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center text-sm font-medium text-accent-foreground">
                      {user.firstName?.[0] || user.email?.[0] || 'U'}
                    </div>
                    <div>
                      <div className="font-medium text-foreground" data-testid="kyc-user-name">
                        {user.firstName || user.email}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Inscription: {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button size="sm" data-testid="verify-kyc">
                      Vérifier
                    </Button>
                    <Button size="sm" variant="destructive" data-testid="reject-kyc">
                      Rejeter
                    </Button>
                  </div>
                </div>
              ))}
              
              {(!adminUsers || adminUsers.filter((user: any) => !user.kycVerified).length === 0) && (
                <div className="text-center py-8 text-muted-foreground" data-testid="no-kyc-pending">
                  Aucune vérification KYC en attente
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
