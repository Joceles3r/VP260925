import React from 'react';
import { Clock, TrendingUp, Users, Target, Star, Eye } from 'lucide-react';
import { getCategoryColor } from '@shared/utils';
import type { Project } from '@shared/schema';
import { Button } from '@/components/ui/button';

interface ProjectCardProps {
  project: Project;
  onInvest?: (project: Project) => void;
  onVideoDeposit?: (project: Project) => void;
  isCreator?: boolean;
}

export default function ProjectCard({ project, onInvest, onVideoDeposit, isCreator }: ProjectCardProps) {
  const progressPercentage = project.targetAmount 
    ? (parseFloat(project.currentAmount || '0') / parseFloat(project.targetAmount)) * 100
    : 0;

  // Function getCategoryColor is now imported from @shared/utils

  const getTimeRemaining = () => {
    if (!project.endDate) return 'Temps illimité';
    
    const now = new Date();
    const end = new Date(project.endDate);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Terminé';
    if (diffDays === 0) return 'Dernier jour';
    if (diffDays === 1) return '1j restant';
    return `${diffDays}j restants`;
  };

  return (
    <div 
      className="group bg-gradient-to-b from-card to-card/90 rounded-xl border border-border/50 overflow-hidden hover:shadow-2xl hover:border-border/80 transition-all duration-300 hover:scale-[1.02] cursor-pointer backdrop-blur-sm"
      data-testid={`project-card-${project.id}`}
    >
      {/* Project Image */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent z-10" />
        <img 
          src={project.thumbnailUrl || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=240&fit=crop'} 
          alt={`${project.title} thumbnail`}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          data-testid="project-thumbnail"
        />
        {project.mlScore && (
          <div className="absolute top-3 right-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center space-x-1 z-20 shadow-lg">
            <Star className="h-3 w-3" />
            <span>{parseFloat(project.mlScore).toFixed(1)}</span>
          </div>
        )}
        
        {/* Status badge */}
        <div className="absolute top-3 left-3 z-20">
          <div className={`px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
            project.status === 'active' ? 'bg-green-500/20 text-green-100 border border-green-500/30' :
            project.status === 'pending' ? 'bg-yellow-500/20 text-yellow-100 border border-yellow-500/30' :
            'bg-red-500/20 text-red-100 border border-red-500/30'
          }`}>
            {project.status === 'active' ? 'En cours' : 
             project.status === 'pending' ? 'En attente' : 'Terminé'}
          </div>
        </div>
      </div>

      <div className="p-6 relative">
        {/* Decorative gradient line */}
        <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        
        <div className="flex items-center justify-between mb-3">
          <span 
            className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${getCategoryColor(project.category)} shadow-sm`}
            data-testid="project-category"
          >
            {project.category}
          </span>
          <div className="flex items-center text-sm text-muted-foreground bg-muted/50 px-2 py-1 rounded-lg">
            <Clock className="h-4 w-4 mr-1.5 text-orange-500" />
            <span data-testid="time-remaining" className="font-medium">{getTimeRemaining()}</span>
          </div>
        </div>

        <h3 className="text-xl font-bold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors" data-testid="project-title">
          {project.title}
        </h3>
        
        <p className="text-sm text-muted-foreground/80 mb-6 line-clamp-2 leading-relaxed" data-testid="project-description">
          {project.description}
        </p>

        <div className="space-y-4">
          {/* Progress Section */}
          <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Financement</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {progressPercentage.toFixed(0)}% atteint
              </span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Collecté</span>
                <span className="font-bold text-foreground" data-testid="current-amount">
                  €{parseFloat(project.currentAmount || '0').toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Objectif</span>
                <span className="font-medium text-muted-foreground" data-testid="target-amount">
                  €{parseFloat(project.targetAmount).toLocaleString()}
                </span>
              </div>
            </div>
            
            <div className="w-full bg-muted/60 rounded-full h-3 mt-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-primary to-secondary h-3 rounded-full transition-all duration-500 relative overflow-hidden"
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                data-testid="progress-bar"
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              </div>
            </div>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            {project.roiEstimated && (
              <div className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/10 rounded-lg p-3 border border-green-200/50 dark:border-green-700/30">
                <div className="flex items-center space-x-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-xs text-green-700 dark:text-green-300 font-medium">ROI Estimé</span>
                </div>
                <span className="text-lg font-bold text-green-800 dark:text-green-200" data-testid="estimated-roi">
                  {parseFloat(project.roiEstimated).toFixed(1)}%
                </span>
              </div>
            )}

            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 rounded-lg p-3 border border-blue-200/50 dark:border-blue-700/30">
              <div className="flex items-center space-x-2 mb-1">
                <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">Investisseurs</span>
              </div>
              <span className="text-lg font-bold text-blue-800 dark:text-blue-200" data-testid="investor-count">
                {project.investorCount || 0}
              </span>
            </div>
          </div>
        </div>

        {project.status === 'active' && onInvest && (
          <Button 
            className="w-full mt-6 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-[1.02]"
            onClick={() => onInvest(project)}
            data-testid="invest-button"
          >
            <div className="flex items-center justify-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>Investir maintenant</span>
            </div>
          </Button>
        )}
        
        {isCreator && onVideoDeposit && (
          <Button 
            className="w-full mt-6 border-2 border-primary/20 hover:border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary font-semibold py-3 rounded-xl transition-all duration-300"
            variant="outline"
            onClick={() => onVideoDeposit(project)}
            data-testid="video-deposit-button"
          >
            <div className="flex items-center justify-center space-x-2">
              <Eye className="h-4 w-4" />
              <span>Déposer une vidéo</span>
            </div>
          </Button>
        )}

        {project.status === 'pending' && (
          <div className="w-full mt-6 px-4 py-3 bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 text-yellow-800 dark:text-yellow-200 rounded-xl text-center text-sm font-medium border border-yellow-200 dark:border-yellow-700">
            <div className="flex items-center justify-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>En attente d'approbation</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
