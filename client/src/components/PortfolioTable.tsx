import React from 'react';
import type { Investment, Project } from '@shared/schema';

interface PortfolioTableProps {
  investments: Investment[];
  projects: Project[];
}

export default function PortfolioTable({ investments, projects }: PortfolioTableProps) {
  const getProjectInfo = (projectId: string) => {
    return projects.find(p => p.id === projectId);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'active': 'bg-accent/10 text-accent',
      'completed': 'bg-secondary/10 text-secondary',
      'pending': 'bg-muted text-muted-foreground',
    };
    return colors[status] || 'bg-muted text-muted-foreground';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'active': 'En production',
      'completed': 'Publié',
      'pending': 'Finalisation',
    };
    return labels[status] || 'Inconnu';
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'documentaire': 'bg-secondary/10 text-secondary',
      'court-métrage': 'bg-chart-4/10 text-purple-600',
      'clip': 'bg-accent/10 text-accent',
    };
    return colors[category?.toLowerCase()] || 'bg-muted text-muted-foreground';
  };

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <h3 className="text-lg font-semibold text-foreground" data-testid="portfolio-table-title">
          Mes Investissements
        </h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full" data-testid="portfolio-table">
          <thead className="bg-muted/30">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Projet
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Investissement
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Valeur Actuelle
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                ROI
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Statut
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          
          <tbody className="divide-y divide-border">
            {investments.map((investment) => {
              const project = getProjectInfo(investment.projectId);
              const roi = parseFloat(investment.roi);
              const roiColor = roi >= 0 ? 'text-secondary' : 'text-destructive';
              
              return (
                <tr 
                  key={investment.id} 
                  className="hover:bg-muted/10"
                  data-testid={`investment-row-${investment.id}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img 
                        src={project?.thumbnailUrl || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=50&h=50&fit=crop'} 
                        alt={`${project?.title} thumbnail`}
                        className="w-10 h-10 rounded object-cover"
                        data-testid="project-thumbnail"
                      />
                      <div className="ml-4">
                        <div className="text-sm font-medium text-foreground" data-testid="project-title">
                          {project?.title || 'Projet inconnu'}
                        </div>
                        <div className="text-sm text-muted-foreground" data-testid="project-category">
                          {project?.category || 'Non spécifié'}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span 
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(project?.category || '')}`}
                      data-testid="category-badge"
                    >
                      {project?.category || 'Non spécifié'}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground" data-testid="investment-amount">
                    €{parseFloat(investment.amount).toFixed(2)}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground" data-testid="current-value">
                    €{parseFloat(investment.currentValue).toFixed(2)}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${roiColor}`} data-testid="roi-value">
                      {roi >= 0 ? '+' : ''}{roi.toFixed(1)}%
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span 
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project?.status || 'pending')}`}
                      data-testid="project-status"
                    >
                      {getStatusLabel(project?.status || 'pending')}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      className="text-primary hover:text-primary/80"
                      data-testid="view-details-button"
                    >
                      Détails
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {investments.length === 0 && (
          <div className="text-center py-8 text-muted-foreground" data-testid="no-investments">
            Aucun investissement pour le moment
          </div>
        )}
      </div>
    </div>
  );
}
