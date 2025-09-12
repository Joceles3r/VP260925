import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ProjectCard from '@/components/ProjectCard';
import InvestmentModal from '@/components/InvestmentModal';
import type { Project } from '@shared/schema';

export default function Projects() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('roi_desc');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isInvestmentModalOpen, setIsInvestmentModalOpen] = useState(false);

  const { data: projects, refetch } = useQuery({
    queryKey: ['/api/projects', { category: selectedCategory }],
    refetchOnWindowFocus: false,
  });

  const categories = [
    { id: '', label: 'Toutes catégories' },
    { id: 'documentaire', label: 'Documentaire' },
    { id: 'clip', label: 'Clip Musical' },
    { id: 'court-métrage', label: 'Court-métrage' },
    { id: 'animation', label: 'Animation' },
    { id: 'live', label: 'Live Shows' },
  ];

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

  const handleInvestmentSuccess = () => {
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
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
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

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="projects-grid">
        {sortedProjects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onInvest={handleInvest}
          />
        ))}
      </div>

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
    </main>
  );
}
