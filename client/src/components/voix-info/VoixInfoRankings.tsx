import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trophy, 
  TrendingUp, 
  Calendar,
  Users,
  Coins,
  RefreshCw,
  Crown,
  Medal,
  Award
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Ranking {
  id: string;
  rank: number;
  infoporteurId: string;
  totalSales: number;
  totalRevenue: string;
  isTop10: boolean;
  bonusEarned: string;
  rankingDate: string;
  displayName?: string;
  avatar?: string;
}

export const VoixInfoRankings: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Récupérer les classements actuels
  const { data: currentRankings, isLoading, refetch } = useQuery({
    queryKey: ['voix-info', 'current-rankings'],
    queryFn: async () => {
      const response = await fetch('/api/voix-info/rankings/current?limit=100');
      if (!response.ok) throw new Error('Erreur lors du chargement des classements');
      return response.json();
    },
    refetchInterval: 30000, // Actualiser toutes les 30 secondes
  });

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Award className="h-5 w-5 text-orange-400" />;
    return null;
  };

  const getRankBadgeVariant = (rank: number) => {
    if (rank <= 3) return 'default';
    if (rank <= 10) return 'secondary';
    return 'outline';
  };

  const getRankBackground = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200';
    if (rank === 2) return 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200';
    if (rank === 3) return 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200';
    if (rank <= 10) return 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200';
    return '';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto" />
            <p className="text-muted-foreground">Chargement des classements...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const rankings: Ranking[] = currentRankings?.rankings || [];
  const top10 = rankings.filter(r => r.isTop10);
  const others = rankings.filter(r => !r.isTop10);

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Classements Quotidiens - TOP 10 & Plus
              </CardTitle>
              <CardDescription>
                Classement mis à jour en temps réel • Redistribution à minuit
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetch()}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Actualiser
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <Trophy className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-yellow-700">{top10.length}</div>
              <div className="text-sm text-yellow-600">TOP 10 Gagnants</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <Users className="h-6 w-6 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-700">{rankings.length}</div>
              <div className="text-sm text-blue-600">Infoporteurs actifs</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <Coins className="h-6 w-6 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-700">
                {rankings.reduce((sum, r) => sum + parseInt(r.totalSales), 0)}
              </div>
              <div className="text-sm text-green-600">Ventes totales</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
              <TrendingUp className="h-6 w-6 text-purple-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-700">
                {rankings.reduce((sum, r) => sum + parseFloat(r.totalRevenue || '0'), 0).toFixed(0)}€
              </div>
              <div className="text-sm text-purple-600">Chiffre d'affaires</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="top10" className="space-y-6">
        <TabsList>
          <TabsTrigger value="top10">🏆 TOP 10</TabsTrigger>
          <TabsTrigger value="all">📊 Classement complet</TabsTrigger>
        </TabsList>

        <TabsContent value="top10" className="space-y-4">
          {/* Podium TOP 3 */}
          {top10.length >= 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-center">🏆 Podium du Jour</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-center gap-4 py-6">
                  {/* 2ème place */}
                  <div className="text-center">
                    <div className="w-20 h-24 bg-gradient-to-t from-gray-200 to-gray-300 rounded-t-lg flex items-end justify-center pb-2 mb-2">
                      <Medal className="h-6 w-6 text-gray-600" />
                    </div>
                    <Badge variant="secondary" className="mb-2">2</Badge>
                    <p className="font-medium text-sm">{top10[1]?.displayName || `Infoporteur #2`}</p>
                    <p className="text-xs text-muted-foreground">{top10[1]?.totalSales} ventes</p>
                  </div>

                  {/* 1ère place */}
                  <div className="text-center">
                    <div className="w-20 h-32 bg-gradient-to-t from-yellow-300 to-yellow-400 rounded-t-lg flex items-end justify-center pb-2 mb-2">
                      <Crown className="h-8 w-8 text-yellow-700" />
                    </div>
                    <Badge className="mb-2 bg-yellow-500">1</Badge>
                    <p className="font-bold">{top10[0]?.displayName || `Infoporteur #1`}</p>
                    <p className="text-sm text-muted-foreground">{top10[0]?.totalSales} ventes</p>
                    <p className="text-sm font-medium text-green-600">{top10[0]?.totalRevenue}€</p>
                  </div>

                  {/* 3ème place */}
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-t from-orange-200 to-orange-300 rounded-t-lg flex items-end justify-center pb-2 mb-2">
                      <Award className="h-5 w-5 text-orange-600" />
                    </div>
                    <Badge variant="outline" className="mb-2 border-orange-400 text-orange-600">3</Badge>
                    <p className="font-medium text-sm">{top10[2]?.displayName || `Infoporteur #3`}</p>
                    <p className="text-xs text-muted-foreground">{top10[2]?.totalSales} ventes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TOP 10 détaillé */}
          <Card>
            <CardHeader>
              <CardTitle>TOP 10 - Éligibles au pot commun</CardTitle>
              <CardDescription>
                Ces infoporteurs partagent 50% du pot commun généré par les rangs 11+
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {top10.map((ranking, index) => (
                <div
                  key={ranking.id}
                  className={`p-4 rounded-lg border transition-all hover:shadow-md ${getRankBackground(ranking.rank)}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {getRankIcon(ranking.rank)}
                      <Badge variant={getRankBadgeVariant(ranking.rank)} className="w-12 text-center">
                        #{ranking.rank}
                      </Badge>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">
                            {ranking.displayName || `Infoporteur #${ranking.rank}`}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            ID: {ranking.infoporteurId.slice(-6)}
                          </p>
                        </div>
                        
                        <div className="text-right">
                          <div className="flex items-center gap-6">
                            <div>
                              <p className="text-lg font-bold">{ranking.totalSales}</p>
                              <p className="text-xs text-muted-foreground">Ventes</p>
                            </div>
                            <div>
                              <p className="text-lg font-bold text-green-600">{ranking.totalRevenue}€</p>
                              <p className="text-xs text-muted-foreground">Revenus</p>
                            </div>
                            {parseFloat(ranking.bonusEarned) > 0 && (
                              <div>
                                <p className="text-lg font-bold text-purple-600">+{ranking.bonusEarned}€</p>
                                <p className="text-xs text-muted-foreground">Bonus</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {top10.length === 0 && (
                <div className="text-center py-12">
                  <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucun infoporteur dans le TOP 10 aujourd'hui</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Soyez le premier à vendre des articles !
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Classement Complet (Rangs 1-100+)</CardTitle>
              <CardDescription>
                Tous les infoporteurs actifs aujourd'hui • Les rangs 11+ contribuent au pot commun
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {rankings.map((ranking) => (
                  <div
                    key={ranking.id}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all hover:bg-muted/50 ${
                      ranking.isTop10 ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 min-w-[80px]">
                        {getRankIcon(ranking.rank)}
                        <Badge variant={getRankBadgeVariant(ranking.rank)}>
                          #{ranking.rank}
                        </Badge>
                        {ranking.isTop10 && (
                          <Badge variant="secondary" className="text-xs">TOP 10</Badge>
                        )}
                      </div>
                      
                      <div>
                        <p className="font-medium">
                          {ranking.displayName || `Infoporteur #${ranking.rank}`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          ID: {ranking.infoporteurId.slice(-8)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6 text-right">
                      <div>
                        <p className="font-semibold">{ranking.totalSales}</p>
                        <p className="text-xs text-muted-foreground">Ventes</p>
                      </div>
                      <div>
                        <p className="font-semibold text-green-600">{ranking.totalRevenue}€</p>
                        <p className="text-xs text-muted-foreground">Revenus</p>
                      </div>
                      {ranking.isTop10 && parseFloat(ranking.bonusEarned) > 0 && (
                        <div>
                          <p className="font-semibold text-purple-600">+{ranking.bonusEarned}€</p>
                          <p className="text-xs text-muted-foreground">Bonus</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {rankings.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Aucune activité aujourd'hui</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Le classement se mettra à jour dès les premières ventes
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Informations sur le système */}
          <Card className="bg-muted/30">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    Système de Récompenses
                  </h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• <strong>TOP 10</strong> : Partagent 50% du pot commun</li>
                    <li>• <strong>Rangs 11+</strong> : Leurs revenus alimentent le pot</li>
                    <li>• <strong>Investi-lecteurs</strong> : 50% du pot si ils ont misé sur le TOP 10</li>
                    <li>• <strong>Redistribution</strong> : Automatique à minuit</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    Fonctionnement
                  </h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• <strong>Classement</strong> : Par nombre de ventes en 24h</li>
                    <li>• <strong>Ex-aequo</strong> : Priorité au plus ancien inscrit</li>
                    <li>• <strong>Mise à jour</strong> : Temps réel toute la journée</li>
                    <li>• <strong>Reset</strong> : Chaque jour à minuit</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};