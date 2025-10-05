import React, { useEffect, useState } from 'react';
import { Users, DollarSign, Film, ShieldAlert, Flag, Eye, CheckCircle, XCircle, Settings, ToggleLeft, ToggleRight, Clock, MessageSquare } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdminStore } from '@/stores/adminStore';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { FeatureToggle } from '@shared/schema';
import LiveShowsAdminPanel from '@/components/LiveShowsAdminPanel';
import { InternalMessagesManager } from '@/components/admin/InternalMessagesManager';

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
  const [processingReports, setProcessingReports] = useState<Set<string>>(new Set());

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

  const { data: pendingReports, refetch: refetchReports } = useQuery({
    queryKey: ['/api/reports'],
    select: (data: any) => data?.reports || [],
  });

  const { 
    data: featureToggles, 
    isLoading: isLoadingToggles, 
    error: togglesError,
    refetch: refetchToggles 
  } = useQuery<FeatureToggle[]>({
    queryKey: ['/api/admin/toggles'],
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

  const handleReportAction = async (reportId: string, action: 'validate' | 'reject', adminNotes?: string, isAbusive?: boolean) => {
    setProcessingReports(prev => new Set(prev).add(reportId));
    
    try {
      const endpoint = action === 'validate' ? 'validate' : 'reject';
      const body = action === 'validate' ? { adminNotes } : { adminNotes, isAbusive };
      
      await apiRequest('PATCH', `/api/reports/${reportId}/${endpoint}`, body);
      
      toast({
        title: action === 'validate' ? "Signalement validé" : "Signalement rejeté",
        description: "Le signalement a été traité avec succès",
      });

      // Refetch reports after action
      refetchReports();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de traiter le signalement",
        variant: "destructive",
      });
    } finally {
      setProcessingReports(prev => {
        const newSet = new Set(prev);
        newSet.delete(reportId);
        return newSet;
      });
    }
  };

  const handleToggleUpdate = async (key: string, updates: Partial<FeatureToggle>) => {
    try {
      // Optimistic update
      queryClient.setQueryData<FeatureToggle[]>(['/api/admin/toggles'], (old) => 
        old?.map(toggle => 
          toggle.key === key ? { ...toggle, ...updates } : toggle
        ) || []
      );

      await apiRequest('PATCH', `/api/admin/toggles/${key}`, updates);
      
      toast({
        title: "Toggle mis à jour",
        description: "Le bouton ON/OFF a été mis à jour avec succès",
      });

      // Invalidate and refetch toggles after update
      queryClient.invalidateQueries({ queryKey: ['/api/admin/toggles'] });
    } catch (error: any) {
      // Revert optimistic update on error
      refetchToggles();
      
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour le toggle",
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
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="users" data-testid="tab-users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="projects" data-testid="tab-projects">Projets</TabsTrigger>
          <TabsTrigger value="transactions" data-testid="tab-transactions">Transactions</TabsTrigger>
          <TabsTrigger value="compliance" data-testid="tab-compliance">Compliance</TabsTrigger>
          <TabsTrigger value="moderation" data-testid="tab-moderation">Modération</TabsTrigger>
          <TabsTrigger value="liveshows" data-testid="tab-liveshows">Live Shows</TabsTrigger>
          <TabsTrigger value="messages" data-testid="tab-messages">💬 Messagerie</TabsTrigger>
          <TabsTrigger value="toggles" data-testid="tab-toggles">Boutons ON/OFF</TabsTrigger>
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
                  {(adminUsers as any[])?.map((user: any) => (
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
                {(adminPendingProjects as any[])?.map((project: any) => (
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
                
                {(!adminPendingProjects || (adminPendingProjects as any[])?.length === 0) && (
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
                  {(adminTransactions as any[])?.map((transaction: any) => (
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
              {(adminUsers as any[])?.filter((user: any) => !user.kycVerified).map((user: any) => (
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
              
              {(!adminUsers || (adminUsers as any[])?.filter((user: any) => !user.kycVerified).length === 0) && (
                <div className="text-center py-8 text-muted-foreground" data-testid="no-kyc-pending">
                  Aucune vérification KYC en attente
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="moderation" className="space-y-4">
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Signalements en Attente</h3>
                <div className="flex items-center space-x-2">
                  <Flag className="h-5 w-5 text-accent" />
                  <span className="text-sm text-muted-foreground">
                    {pendingReports?.filter((r: any) => r.status === 'pending').length || 0} signalements
                  </span>
                </div>
              </div>
            </div>

            <div className="divide-y divide-border">
              {pendingReports?.filter((report: any) => report.status === 'pending').map((report: any) => (
                <div key={report.id} className="p-6 hover:bg-muted/10" data-testid={`report-${report.id}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-destructive/10 rounded-full flex items-center justify-center">
                            <Flag className="h-4 w-4 text-destructive" />
                          </div>
                          <div>
                            <div className="font-medium text-foreground" data-testid="report-type">
                              {report.reportType.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {report.contentType} • {new Date(report.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Eye className="h-4 w-4" />
                            <span>#{report.contentId.slice(-6)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs font-medium text-primary-foreground">
                            {report.reporter?.firstName?.[0] || report.reporter?.email?.[0] || 'U'}
                          </div>
                          <span className="text-sm text-foreground" data-testid="reporter-name">
                            {report.reporter?.firstName || report.reporter?.email || 'Utilisateur'}
                          </span>
                        </div>
                      </div>

                      {report.description && (
                        <div className="bg-muted/30 rounded-lg p-3">
                          <div className="text-sm text-muted-foreground mb-1">Description:</div>
                          <div className="text-sm text-foreground" data-testid="report-description">
                            {report.description}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col space-y-2 ml-6">
                      <Button
                        size="sm"
                        className="min-w-[100px]"
                        onClick={() => handleReportAction(report.id, 'validate')}
                        disabled={processingReports.has(report.id)}
                        data-testid="validate-report"
                      >
                        {processingReports.has(report.id) ? (
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Valider
                          </>
                        )}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="destructive"
                        className="min-w-[100px]"
                        onClick={() => handleReportAction(report.id, 'reject')}
                        disabled={processingReports.has(report.id)}
                        data-testid="reject-report"
                      >
                        {processingReports.has(report.id) ? (
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 mr-2" />
                            Rejeter
                          </>
                        )}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        className="min-w-[100px] text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => handleReportAction(report.id, 'reject', '', true)}
                        disabled={processingReports.has(report.id)}
                        data-testid="mark-abusive"
                      >
                        Abusif
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {(!pendingReports || pendingReports.filter((r: any) => r.status === 'pending').length === 0) && (
                <div className="text-center py-12 text-muted-foreground" data-testid="no-pending-reports">
                  <Flag className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucun signalement en attente</h3>
                  <p>Tous les signalements ont été traités</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="liveshows" className="space-y-4">
          <LiveShowsAdminPanel />
        </TabsContent>

        <TabsContent value="messages" className="space-y-4">
          <InternalMessagesManager />
        </TabsContent>

        <TabsContent value="toggles" className="space-y-4">
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Gestion des Boutons ON/OFF</h3>
                <div className="flex items-center space-x-2">
                  <Settings className="h-5 w-5 text-accent" />
                  <span className="text-sm text-muted-foreground">
                    {featureToggles?.length || 0} sections configurables
                  </span>
                </div>
              </div>
            </div>

            <div className="divide-y divide-border">
              {isLoadingToggles && (
                <div className="text-center py-12 text-muted-foreground" data-testid="loading-toggles">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                  <p>Chargement des toggles...</p>
                </div>
              )}

              {togglesError && (
                <div className="text-center py-12 text-destructive" data-testid="error-toggles">
                  <ShieldAlert className="h-16 w-16 text-destructive/50 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Erreur de chargement</h3>
                  <p>Impossible de charger les toggles</p>
                </div>
              )}

              {!isLoadingToggles && !togglesError && featureToggles?.map((toggle: FeatureToggle) => (
                <div key={toggle.key} className="p-6 hover:bg-muted/10" data-testid={`toggle-${toggle.key}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            toggle.isVisible 
                              ? 'bg-secondary/10 text-secondary' 
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {toggle.isVisible ? (
                              <ToggleRight className="h-4 w-4" />
                            ) : (
                              <ToggleLeft className="h-4 w-4" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-foreground" data-testid="toggle-label">
                              {toggle.label}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {toggle.kind} • Clé: {toggle.key}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              toggle.isVisible 
                                ? 'bg-secondary/10 text-secondary'
                                : 'bg-muted text-muted-foreground'
                            }`}>
                              {toggle.isVisible ? 'ACTIVÉ' : 'DÉSACTIVÉ'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {(!toggle.isVisible && toggle.hiddenMessageVariant !== 'custom') && (
                        <div className="bg-muted/30 rounded-lg p-3">
                          <div className="text-sm text-muted-foreground mb-1">Message affiché:</div>
                          <div className="text-sm text-foreground flex items-center space-x-2" data-testid="hidden-message">
                            <MessageSquare className="h-4 w-4" />
                            <span>
                              {toggle.hiddenMessageVariant === 'en_cours' && 'Section en cours de développement'}
                              {toggle.hiddenMessageVariant === 'en_travaux' && 'Section en travaux, disponible bientôt'}
                            </span>
                          </div>
                        </div>
                      )}

                      {(!toggle.isVisible && toggle.hiddenMessageVariant === 'custom' && toggle.hiddenMessageCustom) && (
                        <div className="bg-muted/30 rounded-lg p-3">
                          <div className="text-sm text-muted-foreground mb-1">Message personnalisé:</div>
                          <div className="text-sm text-foreground flex items-center space-x-2" data-testid="custom-message">
                            <MessageSquare className="h-4 w-4" />
                            <span>{toggle.hiddenMessageCustom}</span>
                          </div>
                        </div>
                      )}

                      {(toggle.scheduleStart || toggle.scheduleEnd) && (
                        <div className="bg-accent/10 rounded-lg p-3">
                          <div className="text-sm text-muted-foreground mb-1">Programmation:</div>
                          <div className="text-sm text-foreground flex items-center space-x-2" data-testid="schedule-info">
                            <Clock className="h-4 w-4" />
                            <span>
                              {toggle.scheduleStart && `Début: ${new Date(toggle.scheduleStart).toLocaleString()}`}
                              {toggle.scheduleStart && toggle.scheduleEnd && ' • '}
                              {toggle.scheduleEnd && `Fin: ${new Date(toggle.scheduleEnd).toLocaleString()}`}
                            </span>
                          </div>
                        </div>
                      )}

                      {toggle.updatedBy && (
                        <div className="text-xs text-muted-foreground">
                          Dernière modification par: {toggle.updatedBy.slice(-8)} • {new Date(toggle.updatedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col space-y-2 ml-6">
                      <Button
                        size="sm"
                        variant={toggle.isVisible ? "destructive" : "default"}
                        className="min-w-[120px]"
                        onClick={() => handleToggleUpdate(toggle.key, { isVisible: !toggle.isVisible })}
                        data-testid="toggle-visibility"
                      >
                        {toggle.isVisible ? (
                          <>
                            <ToggleLeft className="h-4 w-4 mr-2" />
                            Désactiver
                          </>
                        ) : (
                          <>
                            <ToggleRight className="h-4 w-4 mr-2" />
                            Activer
                          </>
                        )}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        className="min-w-[120px]"
                        data-testid="configure-toggle"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Configurer
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {!isLoadingToggles && !togglesError && (!featureToggles || featureToggles.length === 0) && (
                <div className="text-center py-12 text-muted-foreground" data-testid="no-toggles">
                  <Settings className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucun toggle configuré</h3>
                  <p>Les boutons ON/OFF n'ont pas encore été initialisés</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
