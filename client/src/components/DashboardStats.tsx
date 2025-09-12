import React from 'react';
import { Wallet, TrendingUp, Film, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  iconColor: string;
}

function StatCard({ title, value, subtitle, icon, iconColor }: StatCardProps) {
  return (
    <div className="bg-card rounded-lg p-6 border border-border" data-testid={`stat-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className={`w-10 h-10 ${iconColor} rounded-lg flex items-center justify-center`}>
            {icon}
          </div>
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground" data-testid={`value-${title.toLowerCase().replace(/\s+/g, '-')}`}>
            {value}
          </p>
          <p className="text-sm text-secondary">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

export default function DashboardStats() {
  const { user } = useAuth();

  const stats = [
    {
      title: 'Portefeuille Total',
      value: user?.balanceEUR ? `€${parseFloat(user.balanceEUR).toLocaleString()}` : '€0',
      subtitle: '+12.5% ce mois',
      icon: <Wallet className="h-5 w-5 text-secondary" />,
      iconColor: 'bg-secondary/10',
    },
    {
      title: 'ROI Moyen',
      value: '15.8%',
      subtitle: '+2.3% vs objectif',
      icon: <TrendingUp className="h-5 w-5 text-primary" />,
      iconColor: 'bg-primary/10',
    },
    {
      title: 'Projets Actifs',
      value: '12',
      subtitle: '3 nouveaux',
      icon: <Film className="h-5 w-5 text-accent" />,
      iconColor: 'bg-accent/10',
    },
    {
      title: 'Rang Global',
      value: '#47',
      subtitle: 'Top 5%',
      icon: <Users className="h-5 w-5 text-purple-600" />,
      iconColor: 'bg-chart-4/10',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {stats.map((stat) => (
        <StatCard key={stat.title} {...stat} />
      ))}
    </div>
  );
}
