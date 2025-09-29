import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Search, 
  Filter, 
  TrendingUp, 
  Star, 
  Users, 
  Eye, 
  Heart, 
  Share2,
  Euro,
  BarChart3,
  PieChart,
  Calendar,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEmojiSystem } from '@/hooks/useEmojiSystem';
import { useAuth } from '@/hooks/useAuth';
import { projectsApi } from '@/lib/api';
import { formatCurrency } from '@shared/utils';
import ProjectModal from '@/components/ProjectModal';

interface ProjectFilters {
  category: string;
  status: string;
  priceMin: number;
  priceMax: number;
  progressMin: number;
  progressMax: number;
  badges: {
    trending: boolean;
    topTen: boolean;
    new: boolean;
  };
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

const defaultFilters: ProjectFilters = {
  category: 'all',
  status: 'all',
  priceMin: 0,
  priceMax: 20,
  progressMin: 0,
  progressMax: 100,
  badges: {
    trending: false,
    topTen: false,
    new: false,
  },
  sortBy: 'engagementCoeff',
  sortOrder: 'desc',
};

// Mock data enrichi pour la démonstration
const mockProjects = [
  {
    id: '1',
    title: 'Documentaire sur l\'Intelligence Artificielle',
    description: 'Une exploration fascinante de l\'impact de l\'IA sur notre société moderne, avec des interviews d\'experts et des cas concrets d\'application.',
    category: 'documentaire',
    creator: { id: '1', firstName: 'Marie', lastName: 'Dubois', profileImageUrl: null },
    targetAmount: '5000.00',
    currentAmount: '1750.00',
    status: 'active',
    thumbnailUrl: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=800',
    price: 5,
    investmentOptions: [2, 3, 4, 5, 6, 8, 10, 12, 15, 20],
    votes: 156,
    investors: 42,
    engagementCoeff: 41.67,
    trending: true,
    topTen: false,
    isNew: false,
    mlScore: '7.5',
    createdAt: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    title: 'Court-métrage Animation 3D',
    description: 'Une histoire touchante en animation 3D sur l\'amitié et le courage face à l\'adversité. Techniques d\'animation avancées.',
    category: 'animation',
    creator: { id: '2', firstName: 'Thomas', lastName: 'Martin', profileImageUrl: null },
    targetAmount: '8000.00',
    currentAmount: '4200.00',
    status: 'active',
    thumbnailUrl: 'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=800',
    price: 8,
    investmentOptions: [2, 3, 4, 5, 6, 8, 10, 12, 15, 20],
    votes: 203,
    investors: 67,
    engagementCoeff: 62.69,
    trending: false,
    topTen: true,
    isNew: false,
    mlScore: '8.2',
    createdAt: '2024-01-10T14:30:00Z'
  },
  {
    id: '3',
    title: 'Série Web Thriller Psychologique',
    description: 'Un thriller psychologique en 6 épisodes qui vous tiendra en haleine. Enquête sur des secrets enfouis dans une petite ville.',
    category: 'série',
    creator: { id: '3', firstName: 'Sophie', lastName: 'Leroy', profileImageUrl: null },
    targetAmount: '12000.00',
    currentAmount: '2400.00',
    status: 'active',
    thumbnailUrl: 'https://images.pexels.com/photos/1029141/pexels-photo-1029141.jpeg?auto=compress&cs=tinysrgb&w=800',
    price: 4,
    investmentOptions: [2, 3, 4, 5, 6, 8, 10, 12, 15, 20],
    votes: 89,
    investors: 28,
    engagementCoeff: 85.71,
    trending: false,
    topTen: false,
    isNew: true,
    mlScore: '6.8',
    createdAt: '2024-01-20T09:15:00Z'
  },
  {
    id: '4',
    title: 'Clip Musical Expérimental',
    description: 'Un clip musical innovant mêlant réalité virtuelle et performance live. Collaboration avec des artistes émergents.',
    category: 'clip',
    creator: { id: '4', firstName: 'Lucas', lastName: 'Bernard', profileImageUrl: null },
    targetAmount: '3000.00',
    currentAmount: '1800.00',
    status: 'active',
    thumbnailUrl: 'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?auto=compress&cs=tinysrgb&w=800',
    price: 3,
    investmentOptions: [2, 3, 4, 5, 6, 8, 10, 12, 15, 20],
    votes: 124,
    investors: 35,
    engagementCoeff: 51.43,
    trending: true,
    topTen: false,
    isNew: false,
    mlScore: '7.1',
    createdAt: '2024-01-12T16:45:00Z'
  },
  {
    id: '5',
    title: 'Documentaire Écologique',
    description: 'Exploration des solutions innovantes pour lutter contre le changement climatique. Tournage dans 5 pays.',
    category: 'documentaire',
    creator: { id: '5', firstName: 'Emma', lastName: 'Rousseau', profileImageUrl: null },
    targetAmount: '15000.00',
    currentAmount: '8500.00',
    status: 'active',
    thumbnailUrl: 'https://images.pexels.com/photos/1108572/pexels-photo-1108572.jpeg?auto=compress&cs=tinysrgb&w=800',
    price: 10,
    investmentOptions: [2, 3, 4, 5, 6, 8, 10, 12, 15, 20],
    votes: 312,
    investors: 89,
    engagementCoeff: 95.51,
    trending: true,
    topTen: true,
    isNew: false,
    mlScore: '9.1',
    createdAt: '2024-01-05T11:20:00Z'
  }
];

export default function Home() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<ProjectFilters>(defaultFilters);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const emoji = useEmojiSystem();

  // Utilisation des données mockées avec filtrage côté client
  const { data: projectsData, isLoading } = useQuery({
    queryKey: ['projects', filters, searchQuery],
    queryFn: async () => {
      // Simulation d'un appel API avec filtrage
      let filtered = [...mockProjects];
      
      // Filtrage par catégorie
      if (filters.category !== 'all') {
        filtered = filtered.filter(p => p.category === filters.category);
      }
      
      // Filtrage par statut
      if (filters.status !== 'all') {
        filtered = filtered.filter(p => p.status === filters.status);
      }
      
      // Filtrage par prix
      filtered = filtered.filter(p => 
        p.price >= filters.priceMin && p.price <= filters.priceMax
      );
      
      // Filtrage par progression
      filtered = filtered.filter(p => {
        const progress = (parseFloat(p.currentAmount) / parseFloat(p.targetAmount)) * 100;
        return progress >= filters.progressMin && progress <= filters.progressMax;
      });
      
      // Filtrage par badges
      if (filters.badges.trending) {
        filtered = filtered.filter(p => p.trending);
      }
      if (filters.badges.topTen) {
        filtered = filtered.filter(p => p.topTen);
      }
      if (filters.badges.new) {
        filtered = filtered.filter(p => p.isNew);
      }
      
      // Recherche textuelle
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(p => 
          p.title.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          `${p.creator.firstName} ${p.creator.lastName}`.toLowerCase().includes(query)
        );
      }
      
      // Tri
      filtered.sort((a, b) => {
        let aValue, bValue;
        
        switch (filters.sortBy) {
          case 'title':
            aValue = a.title;
            bValue = b.title;
            break;
          case 'price':
            aValue = a.price;
            bValue = b.price;
            break;
          case 'progress':
            aValue = (parseFloat(a.currentAmount) / parseFloat(a.targetAmount)) * 100;
            bValue = (parseFloat(b.currentAmount) / parseFloat(b.targetAmount)) * 100;
            break;
          case 'investors':
            aValue = a.investors;
            bValue = b.investors;
            break;
          case 'engagementCoeff':
          default:
            aValue = a.engagementCoeff;
            bValue = b.engagementCoeff;
            break;
        }
        
        if (filters.sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
      
      return {
        data: filtered,
        pagination: {
          page: 1,
          limit: 20,
          total: filtered.length,
          totalPages: Math.ceil(filtered.length / 20)
        }
      };
    },
    staleTime: 1000 * 60 * 5,
  });

  const projects = projectsData?.data || [];
  const projectCount = projects.length;

  const updateFilter = (key: keyof ProjectFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const updateBadgeFilter = (badge: keyof ProjectFilters['badges'], value: boolean) => {
    setFilters(prev => ({
      ...prev,
      badges: { ...prev.badges, [badge]: value }
    }));
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
    setSearchQuery('');
  };

  const handleProjectClick = (project: any, e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    emoji.triggerPurchaseSuccess(x, y);
    setSelectedProject(project);
  };

  const getProgressPercentage = (current: string, target: string) => {
    return (parseFloat(current) / parseFloat(target)) * 100;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header avec bienvenue utilisateur */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl font-bold text-white mb-2">
              Bienvenue {user?.firstName || 'sur VISUAL'} 👋
            </h1>
            <p className="text-gray-400 mb-6">
              Découvrez et investissez dans les projets de contenu visuel qui vous passionnent
            </p>
          </motion.div>

          {/* Stats rapides */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Projets actifs</p>
                    <p className="text-2xl font-bold text-white">{projectCount}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Votre solde</p>
                    <p className="text-2xl font-bold text-green-400">
                      {formatCurrency(parseFloat(user?.balanceEUR || '10000'))}
                    </p>
                  </div>
                  <Euro className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Investissements</p>
                    <p className="text-2xl font-bold text-purple-400">
                      {formatCurrency(parseFloat(user?.totalInvested || '0'))}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">ROI Total</p>
                    <p className="text-2xl font-bold text-pink-400">
                      +{formatCurrency(parseFloat(user?.totalGains || '0'))}
                    </p>
                  </div>
                  <Star className="h-8 w-8 text-pink-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Barre de recherche */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher un projet ou un créateur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder-gray-400"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="border-slate-600 text-gray-300 hover:bg-slate-700"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtres avancés
            </Button>
            <Button
              variant="ghost"
              onClick={resetFilters}
              className="text-gray-400 hover:text-white"
            >
              Réinitialiser
            </Button>
          </div>

          {/* Filtres avancés */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6"
              >
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Catégorie */}
                      <div>
                        <label className="text-sm font-medium text-gray-300 mb-2 block">Catégorie</label>
                        <Select value={filters.category} onValueChange={(value) => updateFilter('category', value)}>
                          <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700">
                            <SelectItem value="all">Toutes</SelectItem>
                            <SelectItem value="documentaire">Documentaire</SelectItem>
                            <SelectItem value="animation">Animation</SelectItem>
                            <SelectItem value="série">Série</SelectItem>
                            <SelectItem value="clip">Clip</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Statut */}
                      <div>
                        <label className="text-sm font-medium text-gray-300 mb-2 block">Statut</label>
                        <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
                          <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700">
                            <SelectItem value="all">Tous</SelectItem>
                            <SelectItem value="active">Actif</SelectItem>
                            <SelectItem value="completed">Terminé</SelectItem>
                            <SelectItem value="pending">En attente</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Prix */}
                      <div>
                        <label className="text-sm font-medium text-gray-300 mb-2 block">
                          Prix: {filters.priceMin}€ - {filters.priceMax}€
                        </label>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            min="0"
                            max="20"
                            value={filters.priceMin}
                            onChange={(e) => updateFilter('priceMin', Number(e.target.value))}
                            className="bg-slate-700 border-slate-600 text-white"
                          />
                          <Input
                            type="number"
                            min="0"
                            max="20"
                            value={filters.priceMax}
                            onChange={(e) => updateFilter('priceMax', Number(e.target.value))}
                            className="bg-slate-700 border-slate-600 text-white"
                          />
                        </div>
                      </div>

                      {/* Tri */}
                      <div>
                        <label className="text-sm font-medium text-gray-300 mb-2 block">Trier par</label>
                        <div className="flex gap-2">
                          <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
                            <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700">
                              <SelectItem value="engagementCoeff">Coefficient</SelectItem>
                              <SelectItem value="title">Titre</SelectItem>
                              <SelectItem value="price">Prix</SelectItem>
                              <SelectItem value="progress">Progression</SelectItem>
                              <SelectItem value="investors">Investisseurs</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <Select value={filters.sortOrder} onValueChange={(value) => updateFilter('sortOrder', value as 'asc' | 'desc')}>
                            <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700">
                              <SelectItem value="desc">Décroissant</SelectItem>
                              <SelectItem value="asc">Croissant</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="mt-4 pt-4 border-t border-slate-700">
                      <label className="text-sm font-medium text-gray-300 mb-2 block">Filtres par badges</label>
                      <div className="flex gap-2">
                        <Button
                          variant={filters.badges.trending ? "default" : "outline"}
                          size="sm"
                          onClick={() => updateBadgeFilter('trending', !filters.badges.trending)}
                          className={filters.badges.trending ? 'bg-red-500 hover:bg-red-600' : 'border-slate-600 text-gray-300'}
                        >
                          🔥 Tendance
                        </Button>
                        <Button
                          variant={filters.badges.topTen ? "default" : "outline"}
                          size="sm"
                          onClick={() => updateBadgeFilter('topTen', !filters.badges.topTen)}
                          className={filters.badges.topTen ? 'bg-yellow-500 hover:bg-yellow-600' : 'border-slate-600 text-gray-300'}
                        >
                          ⭐ TOP 10
                        </Button>
                        <Button
                          variant={filters.badges.new ? "default" : "outline"}
                          size="sm"
                          onClick={() => updateBadgeFilter('new', !filters.badges.new)}
                          className={filters.badges.new ? 'bg-green-500 hover:bg-green-600' : 'border-slate-600 text-gray-300'}
                        >
                          ✨ Nouveau
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Compteur de résultats */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-gray-400">
              {projectCount} projet{projectCount !== 1 ? 's' : ''} trouvé{projectCount !== 1 ? 's' : ''}
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Clock className="h-4 w-4" />
              <span>Mis à jour il y a quelques secondes</span>
            </div>
          </div>
        </div>

        {/* Grille de projets */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, index) => {
            const progress = getProgressPercentage(project.currentAmount, project.targetAmount);
            
            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <Card 
                  className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-all duration-200 backdrop-blur-sm overflow-hidden group cursor-pointer"
                  onClick={(e) => handleProjectClick(project, e)}
                >
                  <div className="relative overflow-hidden">
                    <img 
                      src={project.thumbnailUrl} 
                      alt={project.title}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2 flex gap-2">
                      {project.trending && (
                        <Badge className="bg-red-500/90 text-white">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Tendance
                        </Badge>
                      )}
                      {project.topTen && (
                        <Badge className="bg-yellow-500/90 text-black">
                          <Star className="h-3 w-3 mr-1" />
                          TOP 10
                        </Badge>
                      )}
                      {project.isNew && (
                        <Badge className="bg-green-500/90 text-white">
                          ✨ Nouveau
                        </Badge>
                      )}
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                      <Play className="h-12 w-12 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm rounded px-2 py-1 text-white text-sm font-semibold">
                      {project.price}€
                    </div>
                  </div>
                  
                  <CardContent className="p-4">
                    <h3 className="text-lg font-semibold text-white mb-1 line-clamp-1">{project.title}</h3>
                    <p className="text-gray-400 text-sm mb-2">par {project.creator.firstName} {project.creator.lastName}</p>
                    <p className="text-gray-500 text-sm mb-3 line-clamp-2">{project.description}</p>
                    
                    {/* Progression */}
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">Progression</span>
                        <span className="text-white font-semibold">{progress.toFixed(1)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>{formatCurrency(parseFloat(project.currentAmount))}</span>
                        <span>{formatCurrency(parseFloat(project.targetAmount))}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-400 mb-3">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {project.votes} votes
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {project.investors} investisseurs
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        Coeff: {project.engagementCoeff}
                      </div>
                      <Button size="sm" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 hover:neon-glow">
                        Voir le projet
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* État vide */}
        {projects.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="text-6xl mb-4">🎬</div>
            <h3 className="text-xl font-semibold text-white mb-2">Aucun projet trouvé</h3>
            <p className="text-gray-400 mb-4">
              Essayez de modifier vos critères de recherche ou explorez d'autres catégories.
            </p>
            <Button 
              onClick={resetFilters}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              Réinitialiser les filtres
            </Button>
          </motion.div>
        )}
      </div>

      {/* Modal de projet */}
      <ProjectModal 
        project={selectedProject}
        isOpen={!!selectedProject}
        onClose={() => setSelectedProject(null)}
      />
    </div>
  );
}