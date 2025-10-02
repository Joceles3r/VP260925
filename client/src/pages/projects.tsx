import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ProjectCard from '@/components/ProjectCard';
import InvestmentModal from '@/components/InvestmentModal';
import VideoDepositModal from '@/components/VideoDepositModal';
import CreateProjectModal from '@/components/CreateProjectModal';
import { FeatureToggle } from '@/components/FeatureToggle';
import { useAuth } from '@/hooks/useAuth';
import { useTogglesByKind, useFeatureToggles } from '@/hooks/useFeatureToggles';
import { useErrorLogger } from '@/lib/errorLogger';
import { hasProfile } from '@shared/utils';
import type { Project } from '@shared/schema';

export default function Projects() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('roi_desc');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isInvestmentModalOpen, setIsInvestmentModalOpen] = useState(false);
  const [isVideoDepositModalOpen, setIsVideoDepositModalOpen] = useState(false);
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
  
  const { user } = useAuth();
  const { toggles: categoryToggles, isLoading: isLoadingToggles } = useTogglesByKind('category');
  const { error: togglesError } = useFeatureToggles();
  const { logError, logInfo, logProjectsFetchError } = useErrorLogger('ProjectsPage');

  const { 
    data: projectsResponse, 
    isLoading: isLoadingProjects, 
    error: projectsError,
    refetch,
    isRefetching 
  } = useQuery<{data: Project[], meta: any}>({
    queryKey: ['projects', selectedCategory],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory) {
        params.set('category', selectedCategory);
      }
      const url = `/api/projects${params.toString() ? `?${params.toString()}` : ''}`;
      
      logInfo(`Fetching projects from: ${url}`, {
        category: selectedCategory,
        hasAuth: !!user
      }, 'fetch_projects');
      
      const response = await fetch(url, { credentials: 'include' });
      
      if (!response.ok) {
        let errorMessage = `Erreur HTTP ${response.status}`;
        let errorDetails = 'Une erreur inattendue est survenue';
        let retryable = true;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          errorDetails = errorData.details || errorDetails;
          retryable = errorData.retryable !== false;
        } catch (jsonError) {
          logError('Failed to parse API error response', jsonError, 'parse_error_response');
        }
        
        const customError = new Error(errorMessage);
        (customError as any).details = errorDetails;
        (customError as any).status = response.status;
        (customError as any).retryable = retryable;
        
        // Logger l'erreur API avec plus de contexte
        logProjectsFetchError(customError, {
          category: selectedCategory,
          search: '',  // On pourrait passer searchQuery si nécessaire
          sort: ''     // On pourrait passer sortBy si nécessaire
        });
        
        throw customError;
      }
      
      const data = await response.json();
      const projectCount = data.data?.length || data.length;
      
      logInfo(`Successfully fetched projects`, {
        projectCount,
        category: selectedCategory,
        responseFormat: data.meta ? 'with_metadata' : 'legacy'
      }, 'fetch_projects_success');
      
      // Support pour le nouveau format avec meta ou l'ancien format direct
      if (data.data && data.meta) {
        return data;
      } else {
        return { data: data, meta: { count: data.length } };
      }
    },
    retry: (failureCount, error: any) => {
      // Ne pas retry pour les erreurs 4xx (erreurs client)
      if (error?.status >= 400 && error?.status < 500) {
        return false;
      }
      // Retry max 3 fois pour les erreurs 5xx et network
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Backoff exponentiel
    refetchOnWindowFocus: false,
    staleTime: 30000, // Cache pendant 30 secondes
    gcTime: 300000, // Garde en cache pendant 5 minutes
  });

  // Extraire les projets du nouveau format de réponse
  const projects = projectsResponse?.data || [];

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
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative" data-testid="projects-page">
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#7B2CFF]/5 via-transparent to-[#FF3CAC]/5 pointer-events-none"></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8 visual-fade-in">
          <div>
            <h2 className="text-4xl font-bold visual-text-gradient mb-2" data-testid="projects-title">
              Projets Audiovisuels
            </h2>
            <p className="text-muted-foreground">Découvrez et investissez dans les projets créatifs</p>
          </div>
          
          {/* Search and Filter Controls */}
          <div className="flex items-center space-x-3">
            {user && hasProfile(user.profileTypes, 'creator') && (
              <Button 
                onClick={() => setIsCreateProjectModalOpen(true)}
                className="bg-gradient-to-r from-[#00D1FF] to-[#7B2CFF] hover:opacity-90"
                data-testid="create-project"
              >
                <Plus className="h-4 w-4 mr-2" />
                Créer un projet
              </Button>
            )}
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#00D1FF]" />
                <Input
                  type="text"
                  placeholder="Rechercher des projets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-72 border-[#00D1FF]/30"
                  data-testid="search-input"
                />
              </div>
              <Button variant="glass" size="sm" data-testid="search-button">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap gap-4 mb-6 visual-fade-in visual-delay-100">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2.5 border border-[#7B2CFF]/30 rounded-lg glass-card text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-[#7B2CFF] focus:border-[#7B2CFF] smooth-transition hover:border-[#7B2CFF]/50"
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
            className="px-4 py-2.5 border border-[#FF3CAC]/30 rounded-lg glass-card text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-[#FF3CAC] focus:border-[#FF3CAC] smooth-transition hover:border-[#FF3CAC]/50"
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
        <div className="flex space-x-2 glass-card rounded-xl p-1.5 mb-6 w-fit visual-fade-in visual-delay-200">
          {categories.slice(0, 5).map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-5 py-2.5 text-sm font-semibold rounded-lg smooth-transition ${
                selectedCategory === category.id
                  ? 'bg-gradient-to-r from-[#00D1FF] to-[#7B2CFF] text-white neon-glow-blue'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
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
          <div className="mb-6 p-4 glass-card rounded-xl border border-yellow-500/20 visual-fade-in visual-delay-300">
            <h4 className="text-sm font-bold text-foreground mb-3 flex items-center">
              <span className="mr-2">⚠️</span>
              Sections temporairement indisponibles
            </h4>
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
                      className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium glass-card border border-yellow-500/30 text-yellow-400"
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

      {/* États de chargement et d'erreur */}
      {isLoadingProjects || isRefetching ? (
        <div className="space-y-6" data-testid="projects-loading">
          {/* Skeleton loading state */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-card rounded-xl border border-border/50 overflow-hidden animate-pulse">
                <div className="w-full h-48 bg-muted"></div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="h-6 bg-muted rounded w-20"></div>
                    <div className="h-4 bg-muted rounded w-16"></div>
                  </div>
                  <div className="h-6 bg-muted rounded w-3/4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded"></div>
                    <div className="h-4 bg-muted rounded w-5/6"></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="h-4 bg-muted rounded w-24"></div>
                    <div className="h-4 bg-muted rounded w-16"></div>
                  </div>
                  <div className="h-10 bg-muted rounded"></div>
                </div>
              </div>
            ))}
          </div>
          {isRefetching && (
            <div className="flex items-center justify-center py-4">
              <div className="flex items-center space-x-2 text-muted-foreground">
                <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full"></div>
                <span className="text-sm">Actualisation des projets...</span>
              </div>
            </div>
          )}
        </div>
      ) : projectsError ? (
        <div className="flex flex-col items-center justify-center py-12" data-testid="projects-error">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-destructive/20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-destructive">Erreur de chargement</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {(projectsError as any)?.message || 'Impossible de charger les projets'}
                </p>
              </div>
            </div>
            
            {(projectsError as any)?.details && (
              <div className="mb-4 p-3 bg-muted/50 rounded text-xs text-muted-foreground">
                {(projectsError as any).details}
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <Button 
                onClick={() => refetch()} 
                size="sm" 
                variant="outline"
                className="flex-1"
                data-testid="retry-button"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Réessayer
              </Button>
              
              {(projectsError as any)?.status >= 500 && (
                <Button 
                  onClick={() => window.location.reload()} 
                  size="sm" 
                  variant="secondary"
                  data-testid="refresh-page-button"
                >
                  Actualiser la page
                </Button>
              )}
            </div>
            
            <div className="mt-3 text-xs text-muted-foreground text-center">
              Code d'erreur: {(projectsError as any)?.status || 'UNKNOWN'}
              {(projectsError as any)?.retryable !== false && 
                <span> • Tentative automatique en cours...</span>
              }
            </div>
          </div>
        </div>
      ) : (
        /* Projects Grid */
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
      )}

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
      
      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateProjectModalOpen}
        onClose={() => setIsCreateProjectModalOpen(false)}
        onSuccess={() => {
          refetch();
          setIsCreateProjectModalOpen(false);
        }}
      />
      </div>
    </main>
  );
}
