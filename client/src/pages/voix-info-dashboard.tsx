import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  TrendingUp, 
  Users, 
  Trophy,
  Coins,
  MessageSquare,
  Star,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { InfoporteurDashboard } from '@/components/voix-info/InfoporteurDashboard';
import { InvestiLecteurDashboard } from '@/components/voix-info/InvestiLecteurDashboard';
import { VoixInfoRankings } from '@/components/voix-info/VoixInfoRankings';
import { VoixInfoArticles } from '@/components/voix-info/VoixInfoArticles';

interface UserProfiles {
  infoporteur?: any;
  investiLecteur?: any;
}

const VoixInfoDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  // Récupérer les profils utilisateur
  const { data: profiles, isLoading } = useQuery<UserProfiles>({
    queryKey: ['voix-info', 'user-profiles'],
    queryFn: async () => {
      const [infoporteurRes, investiLecteurRes] = await Promise.allSettled([
        fetch('/api/voix-info/infoporteur/profile', { credentials: 'include' }),
        fetch('/api/voix-info/investi-lecteur/profile', { credentials: 'include' })
      ]);

      const profiles: UserProfiles = {};

      if (infoporteurRes.status === 'fulfilled' && infoporteurRes.value.ok) {
        const data = await infoporteurRes.value.json();
        profiles.infoporteur = data.profile;
      }

      if (investiLecteurRes.status === 'fulfilled' && investiLecteurRes.value.ok) {
        const data = await investiLecteurRes.value.json();
        profiles.investiLecteur = data.profile;
      }

      return profiles;
    }
  });

  // Récupérer les classements actuels
  const { data: currentRankings } = useQuery({
    queryKey: ['voix-info', 'current-rankings'],
    queryFn: async () => {
      const response = await fetch('/api/voix-info/rankings/current?limit=10');
      if (!response.ok) throw new Error('Erreur lors du chargement des classements');
      return response.json();
    },
    refetchInterval: 60000, // Actualiser toutes les minutes
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto" />
            <p className="text-muted-foreground">Chargement du module Voix de l'Info...</p>
          </div>
        </div>
      </div>
    );
  }

  const hasInfoporteurProfile = !!profiles?.infoporteur;
  const hasInvestiLecteurProfile = !!profiles?.investiLecteur;
  const hasAnyProfile = hasInfoporteurProfile || hasInvestiLecteurProfile;

  return (
    <div className="container mx-auto py-8 px-4">
      {/* En-tête principal */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <MessageSquare className="h-8 w-8 text-primary" />
              Voix de l'Info
            </h1>
            <p className="text-muted-foreground text-lg mt-2">
              Module de création de contenu et d'investissement intelligent
            </p>
          </div>
          
          {currentRankings?.rankings?.length > 0 && (
            <Card className="w-64">
              <CardContent className="p-4">
                <div className="text-center">
                  <Trophy className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">TOP 1 Aujourd'hui</p>
                  <p className="font-semibold">
                    {currentRankings.rankings[0]?.displayName || 'En attente...'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {currentRankings.rankings[0]?.totalSales || 0} ventes
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {currentRankings?.rankings?.length || 0}
                </p>
                <p className="text-sm text-muted-foreground">Infoporteurs actifs</p>
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
                <p className="text-2xl font-bold">TOP 10</p>
                <p className="text-sm text-muted-foreground">Classement quotidien</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Coins className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">0.2€-5€</p>
                <p className="text-sm text-muted-foreground">Prix articles</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">50€-100€</p>
                <p className="text-sm text-muted-foreground">Golden Tickets</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {!hasAnyProfile ? (
        // Écran de bienvenue pour nouveaux utilisateurs
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Bienvenue dans Voix de l'Info !</CardTitle>
            <CardDescription className="text-lg">
              Choisissez votre profil pour commencer
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Profil Infoporteur */}
              <Card className="border-2 hover:border-primary transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Devenir Infoporteur
                  </CardTitle>
                  <CardDescription>
                    Créez et vendez du contenu d'actualité
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm">✅ Créez des articles d'actualité</p>
                    <p className="text-sm">✅ Fixez vos prix (0.2€ à 5€)</p>
                    <p className="text-sm">✅ Participez au classement TOP 10</p>
                    <p className="text-sm">✅ Gagnez 70% des ventes + bonus</p>
                  </div>
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium text-orange-600">
                      Caution requise : 10€
                    </p>
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={() => setActiveTab('become-infoporteur')}
                  >
                    Commencer comme Infoporteur
                  </Button>
                </CardContent>
              </Card>

              {/* Profil Investi-lecteur */}
              <Card className="border-2 hover:border-primary transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Devenir Investi-lecteur
                  </CardTitle>
                  <CardDescription>
                    Investissez sur les créateurs prometteurs
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm">✅ Achetez des articles (0.2€ à 10€)</p>
                    <p className="text-sm">✅ Identifiez les futurs TOP 10</p>
                    <p className="text-sm">✅ Gagnez des bonus sur vos paris</p>
                    <p className="text-sm">✅ Golden Tickets premium (50€-100€)</p>
                  </div>
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium text-orange-600">
                      Caution requise : 20€
                    </p>
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={() => setActiveTab('become-investi-lecteur')}
                  >
                    Commencer comme Investi-lecteur
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Informations système */}
            <Card className="bg-muted/50">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="space-y-2">
                    <h4 className="font-medium">Comment ça fonctionne :</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• <strong>TOP 10 quotidien</strong> : Les 10 infoporteurs les plus performants</li>
                      <li>• <strong>Pot commun</strong> : Redistribué équitablement entre TOP 10 et investi-lecteurs gagnants</li>
                      <li>• <strong>VISUpoints</strong> : 100 VP = 1€ (packs 5€, 10€, 20€ pour éviter les micro-frais)</li>
                      <li>• <strong>Golden Tickets</strong> : Paris premium mensuels avec remboursements selon classement</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      ) : (
        // Interface principale pour utilisateurs avec profils
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="rankings">Classements</TabsTrigger>
            <TabsTrigger value="articles">Articles</TabsTrigger>
            {hasInfoporteurProfile && (
              <TabsTrigger value="infoporteur">Mon Espace Créateur</TabsTrigger>
            )}
            {hasInvestiLecteurProfile && (
              <TabsTrigger value="investi-lecteur">Mon Espace Investisseur</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Classement TOP 10 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    TOP 10 du jour
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {currentRankings?.rankings?.slice(0, 10).map((ranking: any, index: number) => (
                    <div key={ranking.id} className="flex items-center gap-3 py-2 border-b last:border-b-0">
                      <Badge variant={index < 3 ? 'default' : 'outline'} className="w-8 text-center">
                        {ranking.rank}
                      </Badge>
                      <div className="flex-1">
                        <p className="font-medium">{ranking.displayName || `Infoporteur #${ranking.rank}`}</p>
                        <p className="text-sm text-muted-foreground">
                          {ranking.totalSales} ventes • {ranking.totalRevenue}€
                        </p>
                      </div>
                      {index < 3 && (
                        <Trophy className={`h-4 w-4 ${
                          index === 0 ? 'text-yellow-500' :
                          index === 1 ? 'text-gray-400' :
                          'text-orange-400'
                        }`} />
                      )}
                    </div>
                  )) || (
                    <p className="text-center text-muted-foreground py-8">
                      Aucun classement disponible aujourd'hui
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Mes profils */}
              <Card>
                <CardHeader>
                  <CardTitle>Mes Profils</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {hasInfoporteurProfile && (
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <BookOpen className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">Infoporteur</p>
                          <p className="text-sm text-muted-foreground">
                            {profiles?.infoporteur?.displayName}
                          </p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => setActiveTab('infoporteur')}
                      >
                        Gérer
                      </Button>
                    </div>
                  )}
                  
                  {hasInvestiLecteurProfile && (
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">Investi-lecteur</p>
                          <p className="text-sm text-muted-foreground">
                            {profiles?.investiLecteur?.displayName}
                          </p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => setActiveTab('investi-lecteur')}
                      >
                        Gérer
                      </Button>
                    </div>
                  )}

                  {(!hasInfoporteurProfile || !hasInvestiLecteurProfile) && (
                    <div className="border-t pt-4">
                      <p className="text-sm text-muted-foreground mb-3">
                        Créer un profil supplémentaire :
                      </p>
                      <div className="space-y-2">
                        {!hasInfoporteurProfile && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full"
                            onClick={() => setActiveTab('become-infoporteur')}
                          >
                            <BookOpen className="h-4 w-4 mr-2" />
                            Devenir Infoporteur
                          </Button>
                        )}
                        {!hasInvestiLecteurProfile && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full"
                            onClick={() => setActiveTab('become-investi-lecteur')}
                          >
                            <Users className="h-4 w-4 mr-2" />
                            Devenir Investi-lecteur
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="rankings">
            <VoixInfoRankings />
          </TabsContent>

          <TabsContent value="articles">
            <VoixInfoArticles />
          </TabsContent>

          {hasInfoporteurProfile && (
            <TabsContent value="infoporteur">
              <InfoporteurDashboard profile={profiles.infoporteur} />
            </TabsContent>
          )}

          {hasInvestiLecteurProfile && (
            <TabsContent value="investi-lecteur">
              <InvestiLecteurDashboard profile={profiles.investiLecteur} />
            </TabsContent>
          )}

          {/* TODO: Ajouter les onglets pour créer les profils */}
        </Tabs>
      )}
    </div>
  );
};

export default VoixInfoDashboardPage;