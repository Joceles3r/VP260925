import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Plus,
  TrendingUp,
  DollarSign,
  Star,
  ShoppingCart,
  Trophy,
  Coins,
  BarChart3
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { GoldenTicketManager } from './GoldenTicketManager';

interface InvestiLecteurProfile {
  id: string;
  displayName: string;
  visuPoints: number;
  totalInvested: string;
  totalWinnings: string;
  winningStreaks: number;
  cautionPaid: boolean;
}

interface InvestiLecteurDashboardProps {
  profile: InvestiLecteurProfile;
}

export const InvestiLecteurDashboard: React.FC<InvestiLecteurDashboardProps> = ({ profile }) => {
  // Récupérer le solde VISUpoints détaillé
  const { data: balanceData } = useQuery({
    queryKey: ['voix-info', 'visu-points-balance'],
    queryFn: async () => {
      const response = await fetch('/api/voix-info/visu-points/balance', { credentials: 'include' });
      if (!response.ok) throw new Error('Erreur lors du chargement du solde');
      return response.json();
    }
  });

  // Récupérer les Golden Tickets actifs
  const { data: goldenTickets } = useQuery({
    queryKey: ['voix-info', 'golden-tickets'],
    queryFn: async () => {
      // TODO: Implémenter l'endpoint pour récupérer les Golden Tickets de l'utilisateur
      return { tickets: [] };
    }
  });

  const visuPointsBalance = balanceData?.balance || profile.visuPoints;
  const balanceEuros = balanceData?.balanceEuros || (visuPointsBalance * 0.01);

  const getPacks = () => [
    { euros: 5, points: 500, popular: false },
    { euros: 10, points: 1000, popular: true },
    { euros: 20, points: 2000, popular: false }
  ];

  const getGoldenTicketTiers = () => [
    { tier: 1, euros: 50, votes: 20, color: 'bg-yellow-100 border-yellow-300' },
    { tier: 2, euros: 75, votes: 30, color: 'bg-orange-100 border-orange-300' },
    { tier: 3, euros: 100, votes: 40, color: 'bg-red-100 border-red-300' }
  ];

  return (
    <div className="space-y-6">
      {/* En-tête du profil */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Espace Investi-lecteur
              </CardTitle>
              <CardDescription className="mt-2">
                Bienvenue <strong>{profile.displayName}</strong>
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              {profile.cautionPaid ? (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  ✅ Caution payée
                </Badge>
              ) : (
                <Badge variant="destructive">
                  ⚠️ Caution requise (20€)
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Coins className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{visuPointsBalance.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">VISUpoints</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{parseFloat(profile.totalInvested || '0').toFixed(0)}€</p>
                <p className="text-sm text-muted-foreground">Total investi</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{parseFloat(profile.totalWinnings || '0').toFixed(0)}€</p>
                <p className="text-sm text-muted-foreground">Gains totaux</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Trophy className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{profile.winningStreaks}</p>
                <p className="text-sm text-muted-foreground">Séries gagnantes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Solde VISUpoints */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-purple-600" />
            Votre Solde VISUpoints
          </CardTitle>
          <CardDescription>
            1€ = 100 VISUpoints • Conversion possible à partir de 2500 VP (25€)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-purple-600">
                {visuPointsBalance.toLocaleString()} VP
              </p>
              <p className="text-lg text-muted-foreground">
                ≈ {balanceEuros.toFixed(2)}€
              </p>
            </div>
            
            <div className="flex gap-2">
              {visuPointsBalance >= 2500 ? (
                <Button variant="outline">
                  Convertir en euros
                </Button>
              ) : (
                <Badge variant="outline">
                  {2500 - visuPointsBalance} VP pour conversion
                </Badge>
              )}
              <Button>
                Acheter VISUpoints
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Packs VISUpoints */}
      <Card>
        <CardHeader>
          <CardTitle>Acheter des VISUpoints</CardTitle>
          <CardDescription>
            Packs optimisés pour éviter les frais de transaction
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {getPacks().map((pack) => (
              <Card key={pack.euros} className={`relative ${pack.popular ? 'ring-2 ring-primary' : ''}`}>
                {pack.popular && (
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                    <Badge>Populaire</Badge>
                  </div>
                )}
                <CardContent className="p-6 text-center">
                  <p className="text-2xl font-bold">{pack.euros}€</p>
                  <p className="text-muted-foreground">{pack.points.toLocaleString()} VP</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Permet {Math.floor(pack.points / 20)} à {Math.floor(pack.points / 1000)} achats
                  </p>
                  <Button className="w-full mt-4" disabled={!profile.cautionPaid}>
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Acheter
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Golden Tickets Manager */}
      <GoldenTicketManager profile={{ id: profile.id, visuPoints: visuPointsBalance }} />

      {/* Actions rapides */}
      <Card>
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button className="h-20 flex flex-col items-center justify-center gap-2">
              <ShoppingCart className="h-6 w-6" />
              <span>Explorer articles</span>
            </Button>
            
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
              <Trophy className="h-6 w-6" />
              <span>Voir classements</span>
            </Button>
            
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
              <Star className="h-6 w-6" />
              <span>Golden Tickets</span>
            </Button>
            
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
              <BarChart3 className="h-6 w-6" />
              <span>Mes statistiques</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {!profile.cautionPaid && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                ⚠️
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-orange-800">Caution requise</h4>
                <p className="text-sm text-orange-700">
                  Vous devez payer une caution de 20€ pour pouvoir acheter des articles et des Golden Tickets. 
                  Cette caution garantit le respect des règles de la plateforme.
                </p>
                <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                  Payer la caution (20€)
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};