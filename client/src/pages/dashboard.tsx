import React from 'react';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import DashboardStats from '@/components/DashboardStats';
import MinorStatusWidget from '@/components/minor/MinorStatusWidget';
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
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative" data-testid="dashboard-page">
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#00D1FF]/5 via-transparent to-[#7B2CFF]/5 pointer-events-none"></div>
      
      <div className="relative z-10">
        <div className="mb-8 visual-fade-in">
          <h1 className="text-4xl font-bold visual-text-gradient mb-2" data-testid="dashboard-title">
            Tableau de bord
          </h1>
          <p className="text-muted-foreground">Bienvenue sur votre plateforme d'investissement créatif</p>
        </div>

        <div className="visual-fade-in visual-delay-100">
          <DashboardStats />
        </div>

        {/* Widget Visiteur Mineur */}
        <div className="mt-8">
          <MinorStatusWidget />
        </div>

        {/* Recent Activity & Portfolio Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* Portfolio Performance Chart */}
          <div className="glass-card rounded-2xl p-6 border border-[#00D1FF]/20 visual-fade-in visual-delay-200 neon-glow-blue">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-foreground flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-[#00D1FF]" />
                Performance Portfolio
              </h3>
              <select className="text-sm border border-[#7B2CFF]/30 rounded-lg px-3 py-2 glass-card smooth-transition hover:border-[#7B2CFF]/50">
                <option>30 derniers jours</option>
                <option>3 mois</option>
                <option>1 an</option>
              </select>
            </div>
            
            {/* Chart placeholder */}
            <div className="h-64 glass-card rounded-xl flex items-center justify-center border border-[#7B2CFF]/20" data-testid="portfolio-chart">
              <div className="text-center">
                <BarChart3 className="h-16 w-16 text-[#7B2CFF] mx-auto mb-3 floating" />
                <p className="text-foreground font-medium">Graphique de performance</p>
                <p className="text-sm text-muted-foreground mt-1">Évolution des gains sur la période</p>
              </div>
            </div>
          </div>

          {/* Recent Investments */}
          <div className="glass-card rounded-2xl p-6 border border-[#FF3CAC]/20 visual-fade-in visual-delay-300 neon-glow-pink">
            <h3 className="text-lg font-bold text-foreground mb-6 flex items-center">
              <span className="text-2xl mr-2">💎</span>
              Investissements Récents
            </h3>
            
            <div className="space-y-3" data-testid="recent-investments">
              {/* Sample investment items */}
              <div className="flex items-center space-x-4 p-3 rounded-xl glass-card hover:border-[#00D1FF]/30 smooth-transition border border-transparent cursor-pointer">
                <img 
                  src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=50&h=50&fit=crop" 
                  alt="Project thumbnail"
                  className="w-14 h-14 rounded-lg object-cover ring-2 ring-[#00D1FF]/30"
                />
                <div className="flex-1">
                  <p className="font-semibold text-foreground">Documentaire "Ocean's Call"</p>
                  <p className="text-sm text-muted-foreground">Investissement: €250</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-green-400">+18.5%</p>
                  <p className="text-xs text-muted-foreground">7j</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 p-3 rounded-xl glass-card hover:border-[#7B2CFF]/30 smooth-transition border border-transparent cursor-pointer">
                <img 
                  src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=50&h=50&fit=crop" 
                  alt="Project thumbnail"
                  className="w-14 h-14 rounded-lg object-cover ring-2 ring-[#7B2CFF]/30"
                />
                <div className="flex-1">
                  <p className="font-semibold text-foreground">Clip "Urban Pulse"</p>
                  <p className="text-sm text-muted-foreground">Investissement: €150</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-green-400">+12.3%</p>
                  <p className="text-xs text-muted-foreground">14j</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 p-3 rounded-xl glass-card hover:border-[#FF3CAC]/30 smooth-transition border border-transparent cursor-pointer">
                <img 
                  src="https://images.unsplash.com/photo-1518929458119-e5bf444c30f4?w=50&h=50&fit=crop" 
                  alt="Project thumbnail"
                  className="w-14 h-14 rounded-lg object-cover ring-2 ring-[#FF3CAC]/30"
                />
                <div className="flex-1">
                  <p className="font-semibold text-foreground">Court-métrage "Midnight"</p>
                  <p className="text-sm text-muted-foreground">Investissement: €500</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-red-400">-2.1%</p>
                  <p className="text-xs text-muted-foreground">21j</p>
                </div>
              </div>
            </div>


            
            <button className="w-full mt-4 px-4 py-3 text-sm font-semibold glass-card rounded-xl hover:border-[#FF3CAC]/40 smooth-transition border border-[#FF3CAC]/20 hover:bg-[#FF3CAC]/5 text-foreground" data-testid="view-all-investments">
              Voir tous les investissements →
            </button>
          </div>
        </div>

        {/* Simulation Mode Notice */}
        {user?.simulationMode && (
          <div className="mt-8 glass-card border border-[#00D1FF]/20 rounded-2xl p-4 visual-fade-in visual-delay-400" data-testid="simulation-notice">
            <div className="flex items-center">
              <TrendingUp className="h-5 w-5 text-[#00D1FF] mr-2" />
              <span className="text-sm font-bold text-[#00D1FF]">Mode Simulation Actif</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Vous utilisez actuellement un portefeuille virtuel de €{parseFloat(user.balanceEUR || '0').toLocaleString()}. 
              Aucune transaction réelle n'est effectuée.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
