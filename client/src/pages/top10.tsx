import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Crown, TrendingUp, Calendar, Euro, Users } from 'lucide-react';

interface Top10Ranking {
  ranking: {
    top10Infoporteurs: Array<{
      id: string;
      rank: number;
      infoporteurId: string;
      totalSalesEUR: string;
      totalArticlesSold: number;
      redistributionShareEUR: string;
      redistributionPaid: boolean;
    }>;
    winnersCount: number;
    totalPool: string;
    poolDistributed: boolean;
  } | null;
  message?: string;
}

interface Top10History {
  history: Array<{
    date: string;
    top10Count: number;
    winnersCount: number;
    totalPool: string;
    poolDistributed: boolean;
  }>;
}

export default function Top10() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string>('current');

  // Fetch current TOP10 ranking
  const { data: currentRanking, isLoading: isLoadingCurrent } = useQuery<Top10Ranking>({
    queryKey: ['/api/top10/current'],
    refetchOnWindowFocus: false,
  });

  // Fetch TOP10 history
  const { data: historyData, isLoading: isLoadingHistory } = useQuery<Top10History>({
    queryKey: ['/api/top10/history'],
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center space-x-2">
          <Crown className="h-8 w-8 text-yellow-500" />
          <h1 className="text-4xl font-bold text-foreground">TOP10 Classement</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Découvrez les infoporteurs les plus performants et les investi-lecteurs vainqueurs
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pot de Redistribution</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary" data-testid="total-pool">
              €{currentRanking?.ranking?.totalPool || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Redistribué aujourd'hui
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">TOP10 Infoporteurs</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary" data-testid="top10-count">
              {currentRanking?.ranking?.top10Infoporteurs?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Auteurs classés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vainqueurs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent" data-testid="winners-count">
              {currentRanking?.ranking?.winnersCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Investi-lecteurs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="current" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="current" data-testid="tab-current">
            Classement Actuel
          </TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-history">
            Historique
          </TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-4">
          {isLoadingCurrent ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : !currentRanking?.ranking ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{currentRanking?.message || "Aucun classement disponible pour aujourd'hui"}</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {/* TOP10 Infoporteurs */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <Crown className="h-5 w-5 text-yellow-500" />
                        <span>TOP10 Infoporteurs</span>
                      </CardTitle>
                      <CardDescription>
                        Les 10 auteurs avec les meilleures ventes d'articles aujourd'hui
                      </CardDescription>
                    </div>
                    {currentRanking.ranking.poolDistributed && (
                      <Badge variant="secondary" className="text-green-600">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Redistribué
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {currentRanking.ranking.top10Infoporteurs?.map((infoporteur) => (
                      <div 
                        key={infoporteur.id} 
                        className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
                        data-testid={`infoporteur-${infoporteur.rank}`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                            infoporteur.rank === 1 ? 'bg-yellow-500 text-white' :
                            infoporteur.rank === 2 ? 'bg-gray-400 text-white' :
                            infoporteur.rank === 3 ? 'bg-amber-600 text-white' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            #{infoporteur.rank}
                          </div>
                          <div>
                            <p className="font-medium">{infoporteur.infoporteurId}</p>
                            <p className="text-sm text-muted-foreground">
                              {infoporteur.totalArticlesSold} articles vendus
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary">€{infoporteur.totalSalesEUR}</p>
                          {infoporteur.redistributionPaid && (
                            <p className="text-xs text-green-600">+€{infoporteur.redistributionShareEUR}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {isLoadingHistory ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : !historyData?.history?.length ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun historique disponible</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Historique des Classements</CardTitle>
                <CardDescription>
                  Les 30 derniers classements quotidiens
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {historyData.history.map((entry) => (
                    <div 
                      key={entry.date}
                      className="flex items-center justify-between p-4 border rounded-lg"
                      data-testid={`history-${entry.date}`}
                    >
                      <div className="flex items-center space-x-4">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{entry.date}</p>
                          <p className="text-sm text-muted-foreground">
                            {entry.top10Count} infoporteurs • {entry.winnersCount} vainqueurs
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="font-bold">€{entry.totalPool}</p>
                          {entry.poolDistributed && (
                            <Badge variant="outline" className="text-green-600 text-xs">
                              Redistribué
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Admin Actions (if admin) */}
      {isAuthenticated && user?.profileType === 'admin' && (
        <Card>
          <CardHeader>
            <CardTitle>Actions Administrateur</CardTitle>
            <CardDescription>
              Gestion du système TOP10
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              data-testid="admin-generate-ranking"
              onClick={() => {
                // TODO: Implement manual ranking generation
                console.log('Manual ranking generation requested');
              }}
            >
              <Trophy className="h-4 w-4 mr-2" />
              Générer Classement Manuel
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}