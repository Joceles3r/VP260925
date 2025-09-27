import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Eye, Heart, TrendingUp, Filter } from 'lucide-react';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'Tous' },
    { id: 'documentaire', name: 'Documentaires' },
    { id: 'animation', name: 'Animation' },
    { id: 'fiction', name: 'Fiction' },
    { id: 'musique', name: 'Musique' }
  ];

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await api.get('/projects', {
          params: {
            category: selectedCategory === 'all' ? undefined : selectedCategory,
            status: 'active'
          }
        });
        if (response.data.success) {
          setProjects(response.data.data);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des projets:', error);
        // Fallback data
        setProjects([
          {
            id: "proj-1",
            title: "Documentaire sur l'IA",
            description: "Un documentaire innovant explorant l'impact de l'intelligence artificielle sur notre société.",
            category: "documentaire",
            targetAmount: 5000.0,
            currentAmount: 1250.0,
            status: "active",
            creatorId: "creator-1",
            mlScore: 7.5,
            thumbnailUrl: null,
            videoUrl: null,
            investorCount: 25,
            votesCount: 150,
            creator: {
              id: "creator-1",
              firstName: "Marie",
              lastName: "Dubois",
              profileImageUrl: null
            }
          },
          {
            id: "proj-2",
            title: "Court-métrage Animation",
            description: "Une histoire touchante en animation 3D sur l'amitié et le courage.",
            category: "animation",
            targetAmount: 8000.0,
            currentAmount: 3200.0,
            status: "active",
            creatorId: "creator-2",
            mlScore: 8.2,
            thumbnailUrl: null,
            videoUrl: null,
            investorCount: 42,
            votesCount: 280,
            creator: {
              id: "creator-2",
              firstName: "Thomas",
              lastName: "Martin",
              profileImageUrl: null
            }
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [selectedCategory]);

  const handleInvest = (projectId) => {
    // Simulate investment
    alert(`Investissement dans le projet ${projectId} - Fonctionnalité à implémenter`);
  };

  const handleLike = (projectId) => {
    // Simulate like
    setProjects(prev => prev.map(project => 
      project.id === projectId 
        ? { ...project, votesCount: project.votesCount + 1 }
        : project
    ));
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Projets d'investissement
        </h1>
        <p className="text-gray-600">
          Découvrez les projets créatifs et investissez dans ceux qui vous inspirent
        </p>
      </div>

      {/* Filters */}
      <div className="mb-8">
        <div className="flex items-center space-x-4">
          <Filter className="h-5 w-5 text-gray-400" />
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => {
          const progressPercentage = (project.currentAmount / project.targetAmount) * 100;
          
          return (
            <Card key={project.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {/* Project Thumbnail */}
              <div className="h-48 bg-gradient-to-br from-purple-400 to-blue-500 relative">
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <Eye className="h-12 w-12 text-white" />
                </div>
                <Badge className="absolute top-2 left-2 bg-white/90 text-gray-900">
                  {project.category}
                </Badge>
                <div className="absolute top-2 right-2 bg-white/90 rounded-full px-2 py-1">
                  <span className="text-xs font-medium text-gray-900">
                    Score ML: {project.mlScore}/10
                  </span>
                </div>
              </div>

              <CardHeader>
                <CardTitle className="text-lg">{project.title}</CardTitle>
                <CardDescription className="text-sm">
                  {project.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Creator */}
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-purple-600">
                      {project.creator.firstName[0]}{project.creator.lastName[0]}
                    </span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {project.creator.firstName} {project.creator.lastName}
                  </span>
                </div>

                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{formatCurrency(project.currentAmount)}</span>
                    <span className="text-gray-500">
                      {formatCurrency(project.targetAmount)}
                    </span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                  <div className="text-xs text-gray-500">
                    {progressPercentage.toFixed(1)}% financé
                  </div>
                </div>

                {/* Stats */}
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{project.investorCount} investisseurs</span>
                  <span>{project.votesCount} votes</span>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <Button 
                    className="flex-1"
                    onClick={() => handleInvest(project.id)}
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Investir
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => handleLike(project.id)}
                  >
                    <Heart className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Load More */}
      {projects.length > 0 && (
        <div className="text-center mt-8">
          <Button variant="outline" size="lg">
            Charger plus de projets
          </Button>
        </div>
      )}
    </div>
  );
};

export default Projects;