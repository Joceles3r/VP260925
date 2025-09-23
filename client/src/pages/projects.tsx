import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ProjectCard from '@/components/ProjectCard';
import InvestmentModal from '@/components/InvestmentModal';
import VideoDepositModal from '@/components/VideoDepositModal';
import { FeatureToggle } from '@/components/FeatureToggle';
import { useAuth } from '@/hooks/useAuth';
import { useTogglesByKind, useFeatureToggles } from '@/hooks/useFeatureToggles';
import type { Project } from '@shared/schema';

export default function Projects() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('roi_desc');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isInvestmentModalOpen, setIsInvestmentModalOpen] = useState(false);
  const [isVideoDepositModalOpen, setIsVideoDepositModalOpen] = useState(false);
  
  const { user } = useAuth();
  const { toggles: categoryToggles, isLoading: isLoadingToggles } = useTogglesByKind('category');
  const { error: togglesError } = useFeatureToggles();

  const { data: projects, refetch } = useQuery<Project[]>({
    queryKey: ['projects', selectedCategory],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory) {
        params.set('category', selectedCategory);
      }
      const url = `/api/projects${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    refetchOnWindowFocus: false,
  });

  // Map feature toggle keys to category info
  const categoryMappings = [
    { toggleKey: 'films', categoryId: 'documentaire', label: 'Documentaire' },
    { toggleKey: 'videos', categoryId: 'clip', label: 'Clip Musical' },
    { toggleKey: 'documentaires', categoryId: 'court-métrage', label: 'Court-métrage' },
    { toggleKey: 'voix_info', categoryId: 'animation', label: 'Animation' },
    { toggleKey: 'live_show', categoryId: 'live', label: 'Live Shows' },
  ];

  // Build dynamic categories list based on enabled feature toggles
  // Pendant le chargement ou en cas d'erreur, afficher toutes les catégories pour éviter la dégradation UX
  const availableCategories = (isLoadingToggles || togglesError) ? [
    { id: '', label: 'Toutes catégories' },
    ...categoryMappings.map(mapping => ({
      id: mapping.categoryId,
      label: mapping.label
    }))
  ] : [
    { id: '', label: 'Toutes catégories' },
    ...categoryMappings
      .filter(mapping => {
        const toggle = categoryToggles.find(t => t.key === mapping.toggleKey);
        return toggle?.isVisible ?? false;
      })
      .map(mapping => ({
        id: mapping.categoryId,
        label: mapping.label
      }))
  ];

  const categories = availableCategories;

  const sortOptions = [
    { value: 'roi_desc', label: 'ROI décroissant' },
    { value: 'roi_asc', label: 'ROI croissant' },
    { value: 'recent', label: 'Récents' },
    { value: 'amount_desc', label: 'Objectif décroissant' },
  ];

  const handleInvest = (project: Project) => {
    setSelectedProject(project);
    setIsInvestmentModalOpen(true);
  };
  
  const handleVideoDeposit = (project: Project) => {
    setSelectedProject(project);
    setIsVideoDepositModalOpen(true);
  };

  const handleInvestmentSuccess = () => {
    refetch();
  };
  
  const handleVideoDepositSuccess = () => {
    refetch();
  };

  // Filter and sort projects
  const filteredProjects = projects?.filter((project: Project) => {
    const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || project.category === selectedCategory;
    const isActive = project.status === 'active';
    
    return matchesSearch && matchesCategory && isActive;
  }) || [];

  const sortedProjects = [...filteredProjects].sort((a, b) => {
    switch (sortBy) {
      case 'roi_desc':
        return parseFloat(b.roiEstimated || '0') - parseFloat(a.roiEstimated || '0');
      case 'roi_asc':
        return parseFloat(a.roiEstimated || '0') - parseFloat(b.roiEstimated || '0');
      case 'recent':
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      case 'amount_desc':
        return parseFloat(b.targetAmount) - parseFloat(a.targetAmount);
      default:
        return 0;
    }
  });

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="projects-page">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-foreground" data-testid="projects-title">
          Projets Audiovisuels
        </h2>
        
        {/* Search and Filter Controls */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Rechercher des projets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
                data-testid="search-input"
              />
            </div>
            <Button variant="outline" size="sm" data-testid="search-button">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap gap-4 mb-6">
        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          data-testid="category-filter"
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.label}
            </option>
          ))}
        </select>

        {/* Sort Options */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          data-testid="sort-filter"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 bg-muted rounded-lg p-1 mb-6 w-fit">
        {categories.slice(0, 5).map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              selectedCategory === category.id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-background/50'
            }`}
            data-testid={`category-tab-${category.id || 'all'}`}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* Disabled Categories Info */}
      {!isLoadingToggles && categoryMappings.some(mapping => {
        const toggle = categoryToggles.find(t => t.key === mapping.toggleKey);
        return !toggle?.isVisible;
      }) && (
        <div className="mb-6 p-4 bg-muted/30 rounded-lg border border-border">
          <h4 className="text-sm font-medium text-foreground mb-2">Sections temporairement indisponibles:</h4>
          <div className="flex flex-wrap gap-2">
            {categoryMappings
              .filter(mapping => {
                const toggle = categoryToggles.find(t => t.key === mapping.toggleKey);
                return !toggle?.isVisible;
              })
              .map(mapping => {
                const toggle = categoryToggles.find(t => t.key === mapping.toggleKey);
                const message = toggle?.hiddenMessageVariant === 'custom' 
                  ? toggle.hiddenMessageCustom 
                  : toggle?.hiddenMessageVariant === 'en_cours'
                  ? 'En cours de développement'
                  : 'En travaux, disponible bientôt';
                
                return (
                  <span
                    key={mapping.toggleKey}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-muted text-muted-foreground"
                    title={message || 'Temporairement indisponible'}
                    data-testid={`disabled-category-${mapping.toggleKey}`}
                  >
                    {mapping.label}
                  </span>
                );
              })}
          </div>
        </div>
      )}

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="projects-grid">
        {sortedProjects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onInvest={handleInvest}
            onVideoDeposit={user?.id === project.creatorId ? handleVideoDeposit : undefined}
            isCreator={user?.id === project.creatorId}
          />
        ))}
      </div>

      {/* Example usage of FeatureToggle for a specific feature */}
      <FeatureToggle 
        feature="live_show" 
        messageVariant="minimal"
        showMessage={true}
      >
        <div className="mt-6 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-200 dark:border-purple-800" data-testid="live-shows-promo">
          <h3 className="text-lg font-semibold text-foreground mb-2">🎉 Nouveau: Live Shows disponibles!</h3>
          <p className="text-sm text-muted-foreground">
            Participez aux battles en direct et investissez en temps réel sur vos artistes préférés.
          </p>
        </div>
      </FeatureToggle>

      {sortedProjects.length === 0 && (
        <div className="text-center py-12" data-testid="no-projects">
          <div className="text-muted-foreground">
            {searchQuery || selectedCategory
              ? 'Aucun projet ne correspond à vos critères de recherche'
              : 'Aucun projet disponible pour le moment'
            }
          </div>
        </div>
      )}

      {/* Investment Modal */}
      <InvestmentModal
        isOpen={isInvestmentModalOpen}
        onClose={() => setIsInvestmentModalOpen(false)}
        project={selectedProject}
        onSuccess={handleInvestmentSuccess}
      />
      
      {/* Video Deposit Modal */}
      {isVideoDepositModalOpen && selectedProject && user && (
        <VideoDepositModal
          project={selectedProject}
          user={user}
          isOpen={isVideoDepositModalOpen}
          onClose={() => {
            setIsVideoDepositModalOpen(false);
            setSelectedProject(null);
          }}
        />
      )}
    </main>
  );
}
