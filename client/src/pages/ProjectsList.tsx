import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Play, Search, ListFilter as Filter, TrendingUp, Star, Users, Eye, Heart, Share2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEmojiSystem } from '@/hooks/useEmojiSystem';
import ProjectModal from '@/components/ProjectModal';

// Mock data pour les toggles de catégories
const mockToggles = {
  films: { visible: true, message: "" },
  videos: { visible: true, message: "" },
  documentaires: { visible: true, message: "" },
  voix_info: { visible: false, message: "Catégorie en travaux" },
  live_show: { visible: true, message: "" },
  livres: { visible: true, message: "" },
  petites_annonces: { visible: true, message: "" }
};

// Mock projets avec données complètes
const mockProjects = [
  {
    id: '1',
    title: 'Documentaire sur l\'Intelligence Artificielle',
    creator: 'Marie Dubois',
    category: 'documentaires',
    thumbnail: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=800',
    videoTeaser: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
    price: 5,
    investmentOptions: [2, 3, 4, 5, 6, 8, 10, 12, 15, 20],
    votes: 156,
    investors: 42,
    amountRaised: 1250,
    targetAmount: 5000,
    engagementCoeff: 29.76,
    trending: true,
    topTen: false,
    isNew: false,
    description: 'Une exploration fascinante de l\'impact de l\'IA sur notre société moderne, avec des interviews d\'experts et des cas concrets.',
    pitch: 'Ce documentaire révèle comment l\'intelligence artificielle transforme notre quotidien...',
    createdAt: '2024-01-15'
  },
  {
    id: '2',
    title: 'Court-métrage Animation 3D',
    creator: 'Thomas Martin',
    category: 'films',
    thumbnail: 'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=800',
    price: 8,
    investmentOptions: [2, 3, 4, 5, 6, 8, 10, 12, 15, 20],
    votes: 203,
    investors: 67,
    amountRaised: 3200,
    targetAmount: 8000,
    engagementCoeff: 47.76,
    trending: false,
    topTen: true,
    isNew: false,
    description: 'Une histoire touchante en animation 3D sur l\'amitié et le courage face à l\'adversité.',
    pitch: 'L\'histoire de deux amis qui découvrent un monde magique...',
    createdAt: '2024-01-10'
  },
  {
    id: '3',
    title: 'Série Web Thriller',
    creator: 'Sophie Leroy',
    category: 'videos',
    thumbnail: 'https://images.pexels.com/photos/1029141/pexels-photo-1029141.jpeg?auto=compress&cs=tinysrgb&w=800',
    price: 4,
    investmentOptions: [2, 3, 4, 5, 6, 8, 10, 12, 15, 20],
    votes: 89,
    investors: 28,
    amountRaised: 890,
    targetAmount: 3000,
    engagementCoeff: 31.79,
    trending: false,
    topTen: false,
    isNew: true,
    description: 'Un thriller psychologique en 6 épisodes qui vous tiendra en haleine.',
    pitch: 'Une enquête qui révèle des secrets enfouis...',
    createdAt: '2024-01-20'
  }
];

// Mapping votes selon les montants d'investissement
const getVotesFromAmount = (amount: number): number => {
  const mapping: { [key: number]: number } = {
    2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 8: 6, 10: 7, 12: 8, 15: 9, 20: 10
  };
  return mapping[amount] || 1;
};

export default function ProjectsList() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const emoji = useEmojiSystem();

  // Récupération des toggles de catégories
  const { data: toggles = mockToggles } = useQuery({
    queryKey: ['category-toggles'],
    queryFn: async () => mockToggles,
    staleTime: 1000 * 60 * 5,
  });

  // Récupération des projets
  const { data: projects = mockProjects, isLoading } = useQuery({
    queryKey: ['projects', selectedCategory, searchQuery],
    queryFn: async () => {
      let filtered = mockProjects;
      
      if (selectedCategory !== 'all') {
        filtered = filtered.filter(p => p.category === selectedCategory);
      }
      
      if (searchQuery) {
        filtered = filtered.filter(p => 
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.creator.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      return filtered.sort((a, b) => b.engagementCoeff - a.engagementCoeff);
    },
    staleTime: 1000 * 60 * 5,
  });

  const categories = [
    { id: 'all', name: 'Toutes les catégories', visible: true },
    { id: 'films', name: 'Films', visible: toggles.films?.visible },
    { id: 'videos', name: 'Vidéos', visible: toggles.videos?.visible },
    { id: 'documentaires', name: 'Documentaires', visible: toggles.documentaires?.visible },
    { id: 'voix_info', name: 'Voix de l\'Info', visible: toggles.voix_info?.visible },
    { id: 'live_show', name: 'Live Show', visible: toggles.live_show?.visible },
    { id: 'livres', name: 'Livres', visible: toggles.livres?.visible },
  ];

  const handleCategoryClick = (categoryId: string, e: React.MouseEvent) => {
    if (categoryId === 'all') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    if (categories.find(c => c.id === categoryId)?.visible) {
      emoji.triggerCategoryOpen(categoryId, x, y);
    } else {
      emoji.triggerCategoryOff(x, y);
    }
  };

  const handleProjectClick = (project: any, e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    emoji.triggerPurchaseSuccess(x, y);
    setSelectedProject(project);
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
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Découvrez les projets</h1>
          <p className="text-gray-400 mb-6">
            Explorez, soutenez et investissez dans les créations qui vous passionnent
          </p>

          {/* Search and Filters */}
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
              Filtres
            </Button>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={(e) => {
                  handleCategoryClick(category.id, e);
                  setSelectedCategory(category.id);
                }}
                disabled={!category.visible}
                className={`${
                  selectedCategory === category.id
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600'
                    : category.visible
                    ? 'border-slate-600 text-gray-300 hover:bg-slate-700'
                    : 'border-slate-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                {category.name}
                {!category.visible && category.id !== 'all' && (
                  <span className="ml-2 text-xs">(en travaux)</span>
                )}
              </Button>
            ))}
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, index) => (
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
                    src={project.thumbnail} 
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
                        Nouveau
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
                  <p className="text-gray-400 text-sm mb-2">par {project.creator}</p>
                  <p className="text-gray-500 text-sm mb-3 line-clamp-2">{project.description}</p>
                  
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
                    <Button size="sm" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                      Voir le projet
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {projects.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎬</div>
            <h3 className="text-xl font-semibold text-white mb-2">Aucun projet trouvé</h3>
            <p className="text-gray-400">
              Essayez de modifier vos critères de recherche ou explorez d'autres catégories.
            </p>
          </div>
        )}
      </div>

      {/* Project Modal */}
      <ProjectModal 
        project={selectedProject}
        isOpen={!!selectedProject}
        onClose={() => setSelectedProject(null)}
      />
    </div>
  );
}