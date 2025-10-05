import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Plus,
  TrendingUp,
  DollarSign,
  Eye,
  Edit,
  BarChart3,
  Trophy
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface InfoporteurProfile {
  id: string;
  displayName: string;
  bio?: string;
  totalArticles: number;
  totalSales: string;
  top10Count: number;
  cautionPaid: boolean;
}

interface InfoporteurDashboardProps {
  profile: InfoporteurProfile;
}

export const InfoporteurDashboard: React.FC<InfoporteurDashboardProps> = ({ profile }) => {
  // Récupérer les articles de l'infoporteur
  const { data: articlesData } = useQuery({
    queryKey: ['voix-info', 'infoporteur-articles'],
    queryFn: async () => {
      const response = await fetch('/api/voix-info/infoporteur/articles', { credentials: 'include' });
      if (!response.ok) throw new Error('Erreur lors du chargement des articles');
      return response.json();
    }
  });

  // Récupérer l'historique des classements
  const { data: rankingHistory } = useQuery({
    queryKey: ['voix-info', 'ranking-history', profile.id],
    queryFn: async () => {
      const response = await fetch(`/api/voix-info/rankings/history/${profile.id}?days=7`);
      if (!response.ok) return { history: [] };
      return response.json();
    }
  });

  const articles = articlesData?.articles || [];
  const rankings = rankingHistory?.history || [];
  const bestRank = rankings.length > 0 ? Math.min(...rankings.map((r: any) => r.rank)) : null;

  return (
    <div className="space-y-6">
      {/* En-tête du profil */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Espace Infoporteur
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
                  ⚠️ Caution requise (10€)
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
              <div className="p-3 bg-blue-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{profile.totalArticles}</p>
                <p className="text-sm text-muted-foreground">Articles créés</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{parseFloat(profile.totalSales || '0').toFixed(0)}€</p>
                <p className="text-sm text-muted-foreground">Revenus totaux</p>
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
                <p className="text-2xl font-bold">{profile.top10Count}</p>
                <p className="text-sm text-muted-foreground">Fois dans TOP 10</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {bestRank ? `#${bestRank}` : 'N/A'}
                </p>
                <p className="text-sm text-muted-foreground">Meilleur classement</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions rapides */}
      <Card>
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="h-20 flex flex-col items-center justify-center gap-2">
              <Plus className="h-6 w-6" />
              <span>Créer un article</span>
            </Button>
            
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
              <BarChart3 className="h-6 w-6" />
              <span>Voir statistiques</span>
            </Button>
            
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
              <Edit className="h-6 w-6" />
              <span>Gérer profil</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Articles récents */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Mes Articles</CardTitle>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nouvel article
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {articles.length > 0 ? (
            <div className="space-y-4">
              {articles.slice(0, 5).map((article: any) => (
                <div key={article.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{article.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {article.category} • {article.priceEuros}€ • {article.totalSales} ventes
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      article.status === 'active' ? 'default' :
                      article.status === 'draft' ? 'secondary' :
                      'outline'
                    }>
                      {article.status}
                    </Badge>
                    <Button size="sm" variant="ghost">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Aucun article créé</p>
              <p className="text-sm text-muted-foreground mb-4">
                Créez votre premier article pour commencer à générer des revenus
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Créer mon premier article
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historique des classements */}
      {rankings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Historique des classements (7 derniers jours)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {rankings.map((ranking: any) => (
                <div key={ranking.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">{ranking.rankingDate}</p>
                    <p className="text-sm text-muted-foreground">
                      {ranking.totalSales} ventes • {ranking.totalRevenue}€
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={ranking.isTop10 ? 'default' : 'outline'}>
                      #{ranking.rank}
                    </Badge>
                    {ranking.isTop10 && (
                      <Badge variant="secondary">TOP 10</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
                  Vous devez payer une caution de 10€ pour pouvoir publier et vendre vos articles. 
                  Cette caution garantit le respect des règles de la plateforme.
                </p>
                <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                  Payer la caution (10€)
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};