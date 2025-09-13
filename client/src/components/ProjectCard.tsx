import React from 'react';
import { Clock } from 'lucide-react';
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
      className="bg-card rounded-lg border border-border overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
      data-testid={`project-card-${project.id}`}
    >
      {/* Project Image */}
      <div className="relative">
        <img 
          src={project.thumbnailUrl || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=240&fit=crop'} 
          alt={`${project.title} thumbnail`}
          className="w-full h-48 object-cover"
          data-testid="project-thumbnail"
        />
        {project.mlScore && (
          <div className="absolute top-3 right-3 bg-black/70 text-white px-2 py-1 rounded text-xs font-medium">
            Score: {parseFloat(project.mlScore).toFixed(1)}/10
          </div>
        )}
      </div>

      <div className="p-6">
        <div className="flex items-center justify-between mb-2">
          <span 
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(project.category)}`}
            data-testid="project-category"
          >
            {project.category}
          </span>
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="h-4 w-4 mr-1" />
            <span data-testid="time-remaining">{getTimeRemaining()}</span>
          </div>
        </div>

        <h3 className="text-lg font-semibold text-foreground mb-2" data-testid="project-title">
          {project.title}
        </h3>
        
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2" data-testid="project-description">
          {project.description}
        </p>

        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Objectif:</span>
            <span className="font-medium text-foreground" data-testid="target-amount">
              €{parseFloat(project.targetAmount).toLocaleString()}
            </span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Collecté:</span>
            <span className="font-medium text-foreground" data-testid="current-amount">
              €{parseFloat(project.currentAmount || '0').toLocaleString()}
            </span>
          </div>
          
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-secondary h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              data-testid="progress-bar"
            />
          </div>
          
          {project.roiEstimated && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">ROI estimé:</span>
              <span className="font-medium text-secondary" data-testid="estimated-roi">
                {parseFloat(project.roiEstimated).toFixed(1)}%
              </span>
            </div>
          )}

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Investisseurs:</span>
            <span className="font-medium text-foreground" data-testid="investor-count">
              {project.investorCount || 0}
            </span>
          </div>
        </div>

        {project.status === 'active' && onInvest && (
          <Button 
            className="w-full mt-4"
            onClick={() => onInvest(project)}
            data-testid="invest-button"
          >
            Investir maintenant
          </Button>
        )}
        
        {isCreator && onVideoDeposit && (
          <Button 
            className="w-full mt-4"
            variant="outline"
            onClick={() => onVideoDeposit(project)}
            data-testid="video-deposit-button"
          >
            Déposer une vidéo
          </Button>
        )}

        {project.status === 'pending' && (
          <div className="w-full mt-4 px-4 py-2 bg-muted/50 text-muted-foreground rounded-lg text-center text-sm">
            En attente d'approbation
          </div>
        )}
      </div>
    </div>
  );
}
