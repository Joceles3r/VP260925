import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Briefcase, MapPin, Clock, Euro, Camera, Users, Settings, Search, ListFilter as Filter, Plus } from 'lucide-react';
import { formatCurrency } from '@shared/utils';
import { ToggleGate } from '@/components/ToggleGate';
import { useEmojiSystem } from '@/hooks/useEmojiSystem';

interface Ad {
  id: string;
  title: string;
  description: string;
  category: 'job' | 'service' | 'location' | 'equipment' | 'formation';
  author: {
    id: string;
    firstName: string;
    lastName: string;
  };
  location: string;
  price?: number;
  status: string;
  photos: Array<{
    id: string;
    url: string;
    alt: string;
    isCover: boolean;
  }>;
  viewsCount: number;
  createdAt: string;
  expiresAt: string;
}

const categoryLabels = {
  job: 'Emploi',
  service: 'Service',
  location: 'Lieu',
  equipment: 'Matériel',
  formation: 'Formation'
};

const categoryIcons = {
  job: Briefcase,
  service: Settings,
  location: MapPin,
  equipment: Camera,
  formation: Users
};

export default function PetitesAnnonces() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const { triggerCategoryOpen } = useEmojiSystem();

  // Mock data for demonstration
  const mockAds: Ad[] = [
    {
      id: '1',
      title: 'Recherche Cadreur Expérimenté',
      description: 'Nous recherchons un cadreur expérimenté pour un documentaire sur l\'art contemporain. Tournage prévu sur 5 jours à Paris.',
      category: 'job',
      author: { id: '1', firstName: 'Marie', lastName: 'Dubois' },
      location: 'Paris, France',
      price: 2500,
      status: 'active',
      photos: [
        {
          id: '1',
          url: 'https://images.pexels.com/photos/66134/pexels-photo-66134.jpeg?auto=compress&cs=tinysrgb&w=400',
          alt: 'Équipe de tournage',
          isCover: true
        }
      ],
      viewsCount: 45,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '2',
      title: 'Location Studio Photo 100m²',
      description: 'Studio photo professionnel avec cyclo, éclairage complet et matériel de prise de vue. Idéal pour shootings mode, portraits et produits.',
      category: 'location',
      author: { id: '2', firstName: 'Thomas', lastName: 'Martin' },
      location: 'Lyon, France',
      price: 150,
      status: 'active',
      photos: [
        {
          id: '2',
          url: 'https://images.pexels.com/photos/1117452/pexels-photo-1117452.jpeg?auto=compress&cs=tinysrgb&w=400',
          alt: 'Studio photo',
          isCover: true
        }
      ],
      viewsCount: 78,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '3',
      title: 'Formation Montage Vidéo Avancé',
      description: 'Formation intensive de 3 jours sur les techniques de montage vidéo professionnel avec Avid Media Composer et DaVinci Resolve.',
      category: 'formation',
      author: { id: '3', firstName: 'Sophie', lastName: 'Leroy' },
      location: 'Marseille, France',
      price: 890,
      status: 'active',
      photos: [
        {
          id: '3',
          url: 'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=400',
          alt: 'Formation montage',
          isCover: true
        }
      ],
      viewsCount: 32,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  const { data: ads = mockAds, isLoading } = useQuery({
    queryKey: ['ads', selectedCategory, searchQuery],
    queryFn: async () => {
      // This would be replaced with actual API call
      let filtered = mockAds;
      
      if (selectedCategory) {
        filtered = filtered.filter(ad => ad.category === selectedCategory);
      }
      
      if (searchQuery) {
        filtered = filtered.filter(ad => 
          ad.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ad.description.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      return filtered.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    },
    staleTime: 1000 * 60 * 5,
  });

  const categories = Object.keys(categoryLabels) as Array<keyof typeof categoryLabels>;

  const getDaysRemaining = (expiresAt: string) => {
    const days = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    triggerCategoryOpen('petites_annonces', x, y);
    return Math.max(0, days);
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
    <ToggleGate section="petites_annonces" profile="visitor">
      <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Briefcase className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold">Petites Annonces</h1>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              Audiovisuel & Spectacle
            </Badge>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Publier une annonce
          </Button>
        </div>
        
        <p className="text-muted-foreground mb-6">
          Trouvez des talents, services, lieux et matériel pour vos projets audiovisuels
        </p>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une annonce..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="shrink-0"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtres
          </Button>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            Toutes
          </Button>
          {categories.map(category => {
            const Icon = categoryIcons[category];
            return (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="flex items-center gap-2"
              >
                <Icon className="h-4 w-4" />
                {categoryLabels[category]}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Ads Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ads.map((ad) => {
          const Icon = categoryIcons[ad.category];
          const daysRemaining = getDaysRemaining(ad.expiresAt);
          
          return (
            <Card key={ad.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {ad.photos.length > 0 && (
                <div className="aspect-[4/3] overflow-hidden relative">
                  <img
                    src={ad.photos[0].url}
                    alt={ad.photos[0].alt}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2">
                    <Badge variant="secondary" className="bg-white/90 text-gray-800">
                      <Icon className="h-3 w-3 mr-1" />
                      {categoryLabels[ad.category]}
                    </Badge>
                  </div>
                  {ad.photos.length > 1 && (
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary" className="bg-white/90 text-gray-800">
                        +{ad.photos.length - 1}
                      </Badge>
                    </div>
                  )}
                </div>
              )}
              
              <CardHeader className="pb-3">
                <CardTitle className="text-lg line-clamp-2">{ad.title}</CardTitle>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>par {ad.author.firstName} {ad.author.lastName}</span>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{daysRemaining}j restants</span>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                  {ad.description}
                </p>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{ad.location}</span>
                  </div>
                  {ad.price && (
                    <div className="text-lg font-bold text-blue-600">
                      {formatCurrency(ad.price)}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {ad.viewsCount} vues
                  </span>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    Voir l'annonce
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {ads.length === 0 && (
        <div className="text-center py-12">
          <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            Aucune annonce trouvée avec les critères sélectionnés.
          </p>
        </div>
      )}
      </div>
    </ToggleGate>
  );
}