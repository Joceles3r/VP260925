import React from 'react';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import DashboardStats from '@/components/DashboardStats';
import { BarChart3, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="dashboard-page">
      <h1 className="text-2xl font-bold text-foreground mb-8" data-testid="dashboard-title">
        Tableau de bord
      </h1>

      <DashboardStats />

      {/* Recent Activity & Portfolio Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Portfolio Performance Chart */}
        <div className="bg-card rounded-lg p-6 border border-border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">Performance Portfolio</h3>
            <select className="text-sm border border-border rounded-md px-3 py-1 bg-background">
              <option>30 derniers jours</option>
              <option>3 mois</option>
              <option>1 an</option>
            </select>
          </div>
          
          {/* Chart placeholder */}
          <div className="h-64 bg-muted/30 rounded-lg flex items-center justify-center" data-testid="portfolio-chart">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">Graphique de performance</p>
              <p className="text-xs text-muted-foreground">Évolution des gains sur la période</p>
            </div>
          </div>
        </div>

        {/* Recent Investments */}
        <div className="bg-card rounded-lg p-6 border border-border">
          <h3 className="text-lg font-semibold text-foreground mb-6">Investissements Récents</h3>
          
          <div className="space-y-4" data-testid="recent-investments">
            {/* Sample investment items */}
            <div className="flex items-center space-x-4 p-3 rounded-lg bg-muted/30">
              <img 
                src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=50&h=50&fit=crop" 
                alt="Project thumbnail"
                className="w-12 h-12 rounded object-cover"
              />
              <div className="flex-1">
                <p className="font-medium text-foreground">Documentaire "Ocean's Call"</p>
                <p className="text-sm text-muted-foreground">Investissement: €250</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-secondary">+18.5%</p>
                <p className="text-xs text-muted-foreground">7j</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 p-3 rounded-lg bg-muted/30">
              <img 
                src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=50&h=50&fit=crop" 
                alt="Project thumbnail"
                className="w-12 h-12 rounded object-cover"
              />
              <div className="flex-1">
                <p className="font-medium text-foreground">Clip "Urban Pulse"</p>
                <p className="text-sm text-muted-foreground">Investissement: €150</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-secondary">+12.3%</p>
                <p className="text-xs text-muted-foreground">14j</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 p-3 rounded-lg bg-muted/30">
              <img 
                src="https://images.unsplash.com/photo-1518929458119-e5bf444c30f4?w=50&h=50&fit=crop" 
                alt="Project thumbnail"
                className="w-12 h-12 rounded object-cover"
              />
              <div className="flex-1">
                <p className="font-medium text-foreground">Court-métrage "Midnight"</p>
                <p className="text-sm text-muted-foreground">Investissement: €500</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-destructive">-2.1%</p>
                <p className="text-xs text-muted-foreground">21j</p>
              </div>
            </div>
          </div>
          
          <button className="w-full mt-4 px-4 py-2 text-sm border border-border rounded-md hover:bg-muted/50 transition-colors" data-testid="view-all-investments">
            Voir tous les investissements
          </button>
        </div>
      </div>

      {/* Simulation Mode Notice */}
      {user?.simulationMode && (
        <div className="mt-8 bg-accent/10 border border-accent/20 rounded-lg p-4" data-testid="simulation-notice">
          <div className="flex items-center">
            <TrendingUp className="h-5 w-5 text-accent mr-2" />
            <span className="text-sm font-medium text-accent">Mode Simulation Actif</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Vous utilisez actuellement un portefeuille virtuel de €{parseFloat(user.balanceEUR).toLocaleString()}. 
            Aucune transaction réelle n'est effectuée.
          </p>
        </div>
      )}
    </main>
  );
}
