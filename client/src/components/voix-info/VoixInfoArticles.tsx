import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  BookOpen, 
  Search,
  Filter,
  Clock,
  Eye,
  ShoppingCart,
  Star,
  TrendingUp,
  Tag
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Article {
  id: string;
  title: string;
  excerpt?: string;
  content: string;
  category: string;
  priceEuros: string;
  coverImage?: string;
  tags?: string;
  readingTime?: number;
  totalSales: number;
  totalRevenue: string;
  publishedAt: string;
  infoporteurId: string;
  infoporteurName?: string;
}

const CATEGORIES = {
  'actualite': '📰 Actualités',
  'politique': '🏛️ Politique',
  'economie': '💼 Économie',
  'tech': '💻 Tech',
  'sport': '⚽ Sport',
  'culture': '🎭 Culture',
  'science': '🔬 Science',
  'sante': '🏥 Santé',
  'environnement': '🌱 Environnement',
  'societe': '👥 Société',
  'international': '🌍 International',
  'autre': '📋 Autre'
};

export const VoixInfoArticles: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [priceFilter, setPriceFilter] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const queryClient = useQueryClient();

  // Récupérer les articles publics
  const { data: articlesData, isLoading } = useQuery({
    queryKey: ['voix-info', 'public-articles', searchTerm, selectedCategory, priceFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory) params.append('category', selectedCategory);
      if (priceFilter) params.append('price', priceFilter);
      
      const response = await fetch(`/api/voix-info/articles/public?${params}`);
      if (!response.ok) throw new Error('Erreur lors du chargement des articles');
      return response.json();
    },
  });

  // Vérifier si l'utilisateur a un profil investi-lecteur
  const { data: investiLecteurProfile } = useQuery({
    queryKey: ['voix-info', 'investi-lecteur-profile'],
    queryFn: async () => {
      const response = await fetch('/api/voix-info/investi-lecteur/profile', { credentials: 'include' });
      if (!response.ok) return null;
      return response.json();
    },
  });

  // Récupérer le solde VISUpoints
  const { data: balanceData } = useQuery({
    queryKey: ['voix-info', 'visu-points-balance'],
    queryFn: async () => {
      const response = await fetch('/api/voix-info/visu-points/balance', { credentials: 'include' });
      if (!response.ok) throw new Error('Erreur lors du chargement du solde');
      return response.json();
    },
    enabled: !!investiLecteurProfile?.profile,
  });

  // Mutation pour acheter un article
  const purchaseArticle = useMutation({
    mutationFn: async (data: { articleId: string; priceEuros: number; visuPointsSpent: number }) => {
      const response = await fetch(`/api/voix-info/articles/${data.articleId}/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          priceEuros: data.priceEuros,
          visuPointsSpent: data.visuPointsSpent
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de l\'achat');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voix-info'] });
      setShowPurchaseDialog(false);
      setSelectedArticle(null);
    }
  });

  const handlePurchase = () => {
    if (!selectedArticle) return;
    
    const priceEuros = parseFloat(selectedArticle.priceEuros);
    const visuPointsSpent = Math.floor(priceEuros * 100); // 1€ = 100 VP
    
    purchaseArticle.mutate({
      articleId: selectedArticle.id,
      priceEuros,
      visuPointsSpent
    });
  };

  const getPriceColor = (price: string) => {
    const priceNum = parseFloat(price);
    if (priceNum <= 0.5) return 'text-green-600';
    if (priceNum <= 2) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPopularityBadge = (sales: number) => {
    if (sales >= 50) return <Badge variant="destructive">🔥 Populaire</Badge>;
    if (sales >= 20) return <Badge variant="secondary">⭐ Tendance</Badge>;
    if (sales >= 5) return <Badge variant="outline">📈 Montant</Badge>;
    return null;
  };

  const articles: Article[] = articlesData?.articles || [];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto" />
            <p className="text-muted-foreground">Chargement des articles...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête et filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Articles Disponibles
          </CardTitle>
          <CardDescription>
            Explorez les articles des infoporteurs et investissez sur les futurs TOP 10
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un article..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Toutes les catégories</SelectItem>
                {Object.entries(CATEGORIES).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={priceFilter} onValueChange={setPriceFilter}>
              <SelectTrigger className="w-full md:w-32">
                <SelectValue placeholder="Prix" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous prix</SelectItem>
                <SelectItem value="0.2">0,20€</SelectItem>
                <SelectItem value="0.5">0,50€</SelectItem>
                <SelectItem value="1">1€</SelectItem>
                <SelectItem value="2">2€</SelectItem>
                <SelectItem value="3">3€</SelectItem>
                <SelectItem value="4">4€</SelectItem>
                <SelectItem value="5">5€</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Solde VISUpoints si connecté en tant qu'investi-lecteur */}
      {investiLecteurProfile?.profile && balanceData && (
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Star className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-semibold">Votre solde VISUpoints</p>
                  <p className="text-sm text-muted-foreground">
                    Profil : {investiLecteurProfile.profile.displayName}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-purple-600">
                  {balanceData.balance?.toLocaleString()} VP
                </p>
                <p className="text-sm text-muted-foreground">
                  ≈ {balanceData.balanceEuros?.toFixed(2)}€
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liste des articles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article) => {
          const tags = article.tags ? JSON.parse(article.tags) : [];
          const priceEuros = parseFloat(article.priceEuros);
          
          return (
            <Card key={article.id} className="hover:shadow-lg transition-all duration-200 group">
              {article.coverImage && (
                <div className="aspect-video bg-muted rounded-t-lg overflow-hidden">
                  <img 
                    src={article.coverImage} 
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <Badge variant="outline" className="text-xs">
                    {CATEGORIES[article.category as keyof typeof CATEGORIES] || article.category}
                  </Badge>
                  {getPopularityBadge(article.totalSales)}
                </div>
                
                <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                  {article.title}
                </CardTitle>
                
                {article.excerpt && (
                  <CardDescription className="line-clamp-2">
                    {article.excerpt}
                  </CardDescription>
                )}
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Métadonnées */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {article.readingTime && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{article.readingTime} min</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    <span>{article.totalSales} ventes</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    <span>{article.totalRevenue}€</span>
                  </div>
                </div>

                {/* Tags */}
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {tags.slice(0, 3).map((tag: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        <Tag className="h-2 w-2 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                    {tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Prix et action */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div>
                    <p className={`text-xl font-bold ${getPriceColor(article.priceEuros)}`}>
                      {priceEuros.toFixed(2)}€
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {Math.floor(priceEuros * 100)} VP • {Math.floor(priceEuros * 10)} votes
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedArticle(article)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Lire
                    </Button>
                    
                    {investiLecteurProfile?.profile && (
                      <Button 
                        size="sm"
                        onClick={() => {
                          setSelectedArticle(article);
                          setShowPurchaseDialog(true);
                        }}
                        disabled={!balanceData?.balance || balanceData.balance < priceEuros * 100}
                      >
                        <ShoppingCart className="h-3 w-3 mr-1" />
                        Acheter
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {articles.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Aucun article trouvé</p>
            <p className="text-sm text-muted-foreground mt-2">
              Essayez de modifier vos filtres ou revenez plus tard
            </p>
          </CardContent>
        </Card>
      )}

      {/* Dialog d'aperçu d'article */}
      {selectedArticle && !showPurchaseDialog && (
        <Dialog open={!!selectedArticle} onOpenChange={() => setSelectedArticle(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">{selectedArticle.title}</DialogTitle>
              <DialogDescription>
                {CATEGORIES[selectedArticle.category as keyof typeof CATEGORIES]} • 
                Publié {formatDistanceToNow(new Date(selectedArticle.publishedAt), { addSuffix: true, locale: fr })}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {selectedArticle.coverImage && (
                <img 
                  src={selectedArticle.coverImage} 
                  alt={selectedArticle.title}
                  className="w-full max-h-64 object-cover rounded-lg"
                />
              )}
              
              <div className="prose max-w-none">
                {selectedArticle.content.split('\n').map((paragraph, index) => (
                  paragraph.trim() && <p key={index} className="mb-4">{paragraph}</p>
                ))}
              </div>
              
              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">
                      Prix : <span className={getPriceColor(selectedArticle.priceEuros)}>
                        {parseFloat(selectedArticle.priceEuros).toFixed(2)}€
                      </span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedArticle.totalSales} ventes • {selectedArticle.totalRevenue}€ générés
                    </p>
                  </div>
                  
                  {investiLecteurProfile?.profile && (
                    <Button 
                      onClick={() => setShowPurchaseDialog(true)}
                      disabled={!balanceData?.balance || balanceData.balance < parseFloat(selectedArticle.priceEuros) * 100}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Acheter cet article
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog de confirmation d'achat */}
      {showPurchaseDialog && selectedArticle && (
        <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmer l'achat</DialogTitle>
              <DialogDescription>
                Vous êtes sur le point d'acheter cet article
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <p className="font-medium">{selectedArticle.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {CATEGORIES[selectedArticle.category as keyof typeof CATEGORIES]}
                  </p>
                </CardContent>
              </Card>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Prix de l'article :</span>
                  <span className="font-semibold">{parseFloat(selectedArticle.priceEuros).toFixed(2)}€</span>
                </div>
                <div className="flex justify-between">
                  <span>VISUpoints requis :</span>
                  <span className="font-semibold">{Math.floor(parseFloat(selectedArticle.priceEuros) * 100)} VP</span>
                </div>
                <div className="flex justify-between">
                  <span>Votes générés :</span>
                  <span className="font-semibold">{Math.floor(parseFloat(selectedArticle.priceEuros) * 10)} votes</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span>Votre solde actuel :</span>
                  <span className={`font-semibold ${
                    balanceData?.balance >= Math.floor(parseFloat(selectedArticle.priceEuros) * 100) 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {balanceData?.balance?.toLocaleString()} VP
                  </span>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowPurchaseDialog(false)}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button 
                  onClick={handlePurchase}
                  disabled={purchaseArticle.isPending || !balanceData?.balance || 
                           balanceData.balance < Math.floor(parseFloat(selectedArticle.priceEuros) * 100)}
                  className="flex-1"
                >
                  {purchaseArticle.isPending ? 'Achat...' : 'Confirmer l\'achat'}
                </Button>
              </div>
              
              {purchaseArticle.error && (
                <p className="text-sm text-red-600 text-center">
                  {purchaseArticle.error.message}
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};