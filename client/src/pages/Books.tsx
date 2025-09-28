import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BookOpen, 
  Download, 
  Star, 
  Clock, 
  Euro,
  Users,
  Trophy,
  Calendar
} from 'lucide-react';
import { formatCurrency } from '@shared/utils';

interface Book {
  id: string;
  title: string;
  description: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
  };
  price: number;
  status: string;
  coverUrl?: string;
  totalSales: number;
  votesCount: number;
  monthlyRank?: number;
  createdAt: string;
}

export default function Books() {
  const [selectedPrice, setSelectedPrice] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'votes' | 'sales' | 'recent'>('votes');

  // Mock data for demonstration
  const mockBooks: Book[] = [
    {
      id: '1',
      title: 'Guide du Réalisateur Indépendant',
      description: 'Un guide complet pour créer des films avec un budget limité, de la pré-production à la distribution.',
      author: { id: '1', firstName: 'Marie', lastName: 'Dubois' },
      price: 5,
      status: 'active',
      coverUrl: 'https://images.pexels.com/photos/1029141/pexels-photo-1029141.jpeg?auto=compress&cs=tinysrgb&w=400',
      totalSales: 1250.00,
      votesCount: 89,
      monthlyRank: 3,
      createdAt: new Date().toISOString()
    },
    {
      id: '2',
      title: 'Techniques de Montage Créatif',
      description: 'Maîtrisez l\'art du montage vidéo avec des techniques avancées et des astuces de professionnels.',
      author: { id: '2', firstName: 'Thomas', lastName: 'Martin' },
      price: 8,
      status: 'active',
      coverUrl: 'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=400',
      totalSales: 2100.00,
      votesCount: 156,
      monthlyRank: 1,
      createdAt: new Date().toISOString()
    },
    {
      id: '3',
      title: 'Écriture de Scénario pour Documentaires',
      description: 'Apprenez à structurer et écrire des documentaires captivants qui marquent les esprits.',
      author: { id: '3', firstName: 'Sophie', lastName: 'Leroy' },
      price: 4,
      status: 'active',
      coverUrl: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=400',
      totalSales: 890.00,
      votesCount: 67,
      monthlyRank: 7,
      createdAt: new Date().toISOString()
    }
  ];

  const { data: books = mockBooks, isLoading } = useQuery({
    queryKey: ['books', selectedPrice, sortBy],
    queryFn: async () => {
      // This would be replaced with actual API call
      let filtered = mockBooks;
      
      if (selectedPrice) {
        filtered = filtered.filter(book => book.price === selectedPrice);
      }
      
      return filtered.sort((a, b) => {
        switch (sortBy) {
          case 'votes':
            return b.votesCount - a.votesCount;
          case 'sales':
            return b.totalSales - a.totalSales;
          case 'recent':
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          default:
            return 0;
        }
      });
    },
    staleTime: 1000 * 60 * 5,
  });

  const priceOptions = [2, 3, 4, 5, 8];

  // Calculate monthly cycle info
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const daysRemaining = Math.ceil((lastDay.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const handlePurchase = (book: Book) => {
    // This would integrate with the payment system
    console.log('Purchase book:', book.id);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <BookOpen className="h-8 w-8 text-green-600" />
          <h1 className="text-3xl font-bold">Catégorie Livres</h1>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Cycle Mensuel
          </Badge>
        </div>
        
        {/* Monthly cycle info */}
        <Card className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Calendar className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">Cycle en cours</p>
                  <p className="text-sm text-green-700">
                    Clôture le dernier jour du mois à 23:59:59 (Europe/Paris)
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-900">{daysRemaining}</p>
                <p className="text-sm text-green-700">jours restants</p>
              </div>
            </div>
            <div className="mt-4">
              <Progress 
                value={((30 - daysRemaining) / 30) * 100} 
                className="h-2 bg-green-200"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Prix :</span>
          <Button
            variant={selectedPrice === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedPrice(null)}
          >
            Tous
          </Button>
          {priceOptions.map(price => (
            <Button
              key={price}
              variant={selectedPrice === price ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedPrice(price)}
            >
              {price}€
            </Button>
          ))}
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Trier par :</span>
          <Button
            variant={sortBy === 'votes' ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy('votes')}
          >
            Votes
          </Button>
          <Button
            variant={sortBy === 'sales' ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy('sales')}
          >
            Ventes
          </Button>
          <Button
            variant={sortBy === 'recent' ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy('recent')}
          >
            Récent
          </Button>
        </div>
      </div>

      {/* Books Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {books.map((book) => (
          <Card key={book.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            {book.coverUrl && (
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={book.coverUrl}
                  alt={book.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            )}
            
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-lg line-clamp-2">{book.title}</CardTitle>
                {book.monthlyRank && book.monthlyRank <= 10 && (
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800 shrink-0">
                    <Trophy className="h-3 w-3 mr-1" />
                    #{book.monthlyRank}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                par {book.author.firstName} {book.author.lastName}
              </p>
            </CardHeader>
            
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                {book.description}
              </p>
              
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4" />
                    <span>{book.votesCount}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Euro className="h-4 w-4" />
                    <span>{formatCurrency(book.totalSales)}</span>
                  </div>
                </div>
                <div className="text-lg font-bold text-green-600">
                  {book.price}€
                </div>
              </div>
              
              <Button 
                onClick={() => handlePurchase(book)}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Acheter & Télécharger
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {books.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            Aucun livre trouvé avec les filtres sélectionnés.
          </p>
        </div>
      )}
    </div>
  );
}