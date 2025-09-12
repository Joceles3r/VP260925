import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, PiggyBank, Percent, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PortfolioTable from '@/components/PortfolioTable';
import { useAuth } from '@/hooks/useAuth';
import { usePortfolioStore } from '@/stores/portfolioStore';
import { useToast } from '@/hooks/use-toast';

export default function Portfolio() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const { 
    investments, 
    projects, 
    totalValue, 
    totalGains, 
    averageROI,
    setInvestments,
    setProjects 
  } = usePortfolioStore();

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

  const { data: userInvestments } = useQuery({
    queryKey: ['/api/investments/user', user?.id],
    enabled: !!user?.id,
  });

  const { data: allProjects } = useQuery({
    queryKey: ['/api/projects'],
  });

  useEffect(() => {
    if (userInvestments) {
      setInvestments(userInvestments);
    }
  }, [userInvestments, setInvestments]);

  useEffect(() => {
    if (allProjects) {
      setProjects(allProjects);
    }
  }, [allProjects, setProjects]);

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

  const totalInvested = investments.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="portfolio-page">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-foreground" data-testid="portfolio-title">
          Mon Portfolio
        </h2>
        
        <div className="flex items-center space-x-4">
          <select className="px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
            <option>Tous les investissements</option>
            <option>Actifs</option>
            <option>Terminés</option>
            <option>En cours</option>
          </select>
          <Button variant="outline" data-testid="export-portfolio">
            <Download className="w-4 h-4 mr-2" />
            Exporter (PDF)
          </Button>
        </div>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card rounded-lg p-6 border border-border" data-testid="portfolio-total-value">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Valeur Totale</p>
              <p className="text-2xl font-bold text-foreground" data-testid="total-value">
                €{totalValue.toFixed(2)}
              </p>
            </div>
            <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-secondary" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className={`${totalGains >= 0 ? 'text-secondary' : 'text-destructive'}`} data-testid="total-gains">
              {totalGains >= 0 ? '+' : ''}€{totalGains.toFixed(2)}
            </span>
            <span className="text-muted-foreground ml-1">
              ({totalInvested > 0 ? ((totalGains / totalInvested) * 100).toFixed(1) : '0.0'}%)
            </span>
          </div>
        </div>

        <div className="bg-card rounded-lg p-6 border border-border" data-testid="portfolio-gains">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Gains Totaux</p>
              <p className="text-2xl font-bold text-foreground" data-testid="gains-value">
                €{totalGains.toFixed(2)}
              </p>
            </div>
            <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
              <PiggyBank className="h-6 w-6 text-accent" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-secondary">+€89.45</span>
            <span className="text-muted-foreground ml-1">ce mois</span>
          </div>
        </div>

        <div className="bg-card rounded-lg p-6 border border-border" data-testid="portfolio-roi">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">ROI Moyen</p>
              <p className="text-2xl font-bold text-foreground" data-testid="average-roi">
                {averageROI.toFixed(1)}%
              </p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Percent className="h-6 w-6 text-primary" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-secondary">+2.3%</span>
            <span className="text-muted-foreground ml-1">vs objectif</span>
          </div>
        </div>
      </div>

      {/* Portfolio Performance Chart */}
      <div className="bg-card rounded-lg p-6 border border-border mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground">Évolution du Portfolio</h3>
          <select className="text-sm border border-border rounded-md px-3 py-1 bg-background">
            <option>30 derniers jours</option>
            <option>3 mois</option>
            <option>6 mois</option>
            <option>1 an</option>
          </select>
        </div>
        
        {/* Chart placeholder */}
        <div className="h-64 bg-muted/30 rounded-lg flex items-center justify-center" data-testid="portfolio-chart">
          <div className="text-center">
            <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">Graphique d'évolution du portfolio</p>
            <p className="text-xs text-muted-foreground">Performance des investissements dans le temps</p>
          </div>
        </div>
      </div>

      {/* Investments Table */}
      <PortfolioTable investments={investments} projects={projects} />

      {/* Simulation Mode Notice */}
      {user?.simulationMode && (
        <div className="mt-8 bg-accent/10 border border-accent/20 rounded-lg p-4" data-testid="simulation-notice">
          <div className="flex items-center">
            <TrendingUp className="h-5 w-5 text-accent mr-2" />
            <span className="text-sm font-medium text-accent">Mode Simulation</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Toutes les données affichées sont simulées. Aucune transaction réelle n'est effectuée.
          </p>
        </div>
      )}
    </main>
  );
}
