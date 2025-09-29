/**
 * Composant de tour d'introduction interactif pour VISUAL Platform
 * Guides les nouveaux utilisateurs à travers les fonctionnalités principales
 */

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, Play, Users, Wallet, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface TourStep {
  id: string;
  target: string;
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  action?: 'click' | 'hover' | 'none';
  highlight?: boolean;
  offset?: { x: number; y: number };
}

export interface TourConfig {
  id: string;
  title: string;
  description: string;
  icon: typeof Play;
  steps: TourStep[];
  autoStart?: boolean;
  skipable?: boolean;
}

// Configurations des tours prédéfinis
export const TOUR_CONFIGS: Record<string, TourConfig> = {
  welcome: {
    id: 'welcome',
    title: 'Bienvenue sur VISUAL',
    description: 'Découvrez comment investir dans des projets créatifs innovants',
    icon: Play,
    autoStart: true,
    skipable: true,
    steps: [
      {
        id: 'welcome-intro',
        target: '[data-testid="logo-visual"]',
        title: '🎬 Bienvenue sur VISUAL Platform',
        content: 'La plateforme de financement participatif pour projets audiovisuels et créatifs. Investissez dès 2€ et soutenez la créativité !',
        position: 'bottom',
        highlight: true,
      },
      {
        id: 'explore-projects',
        target: '[data-testid="nav-visual"]',
        title: '🔍 Explorer les Projets',
        content: 'Découvrez des centaines de projets créatifs dans 6 catégories : Films, Musique, Jeux, Art, Tech et Lifestyle.',
        position: 'bottom',
        action: 'hover',
        highlight: true,
      },
      {
        id: 'investment-amount',
        target: '[data-testid="filter-price-range"]',
        title: '💰 Investissements Accessibles',
        content: 'Investissez selon votre budget avec des montants de 2€ à 20€. Chaque euro compte pour soutenir la créativité !',
        position: 'top',
        highlight: true,
      },
      {
        id: 'project-categories',
        target: '[data-testid="filter-category"]',
        title: '🎯 Catégories Diversifiées',
        content: 'Filtrez par catégorie pour trouver les projets qui vous passionnent le plus.',
        position: 'right',
        highlight: true,
      },
      {
        id: 'engagement-system',
        target: '[data-testid="project-card-0"]',
        title: '⭐ Système d\'Engagement',
        content: 'Votez pour vos projets favoris ! Plus un projet reçoit de votes, plus il monte dans le classement.',
        position: 'left',
        highlight: true,
      },
    ],
  },
  
  investment: {
    id: 'investment',
    title: 'Guide d\'Investissement',
    description: 'Apprenez à investir efficacement dans les projets créatifs',
    icon: Wallet,
    steps: [
      {
        id: 'choose-project',
        target: '[data-testid="project-card-0"]',
        title: '1️⃣ Choisir un Projet',
        content: 'Sélectionnez un projet qui vous inspire. Consultez la description, le budget demandé et l\'avancement.',
        position: 'top',
        action: 'click',
        highlight: true,
      },
      {
        id: 'investment-modal',
        target: '[data-testid="button-invest"]',
        title: '2️⃣ Définir votre Investissement',
        content: 'Choisissez le montant que vous souhaitez investir. Minimum 2€, maximum 20€ selon la catégorie.',
        position: 'bottom',
        highlight: true,
      },
      {
        id: 'vote-power',
        target: '[data-testid="vote-buttons"]',
        title: '3️⃣ Exercer votre Vote',
        content: 'Votre investissement vous donne un pouvoir de vote. Influencez le classement des projets !',
        position: 'top',
        highlight: true,
      },
      {
        id: 'portfolio-tracking',
        target: '[data-testid="nav-portfolio"]',
        title: '4️⃣ Suivre votre Portfolio',
        content: 'Gérez tous vos investissements depuis votre portfolio personnel.',
        position: 'bottom',
        highlight: true,
      },
    ],
  },

  community: {
    id: 'community',
    title: 'Rejoindre la Communauté',
    description: 'Maximisez votre impact en rejoignant la communauté VISUAL',
    icon: Users,
    steps: [
      {
        id: 'trending-projects',
        target: '[data-testid="filter-badge-trending"]',
        title: '🔥 Projets Tendance',
        content: 'Suivez les projets qui ont le vent en poupe grâce aux badges Trending.',
        position: 'bottom',
        highlight: true,
      },
      {
        id: 'top-performers',
        target: '[data-testid="filter-badge-top10"]',
        title: '⭐ TOP 10',
        content: 'Découvrez les 10 meilleurs projets de chaque catégorie, élus par la communauté.',
        position: 'bottom',
        highlight: true,
      },
      {
        id: 'new-projects',
        target: '[data-testid="filter-badge-new"]',
        title: '✨ Nouveautés',
        content: 'Soyez parmi les premiers à découvrir et soutenir les nouveaux projets.',
        position: 'bottom',
        highlight: true,
      },
      {
        id: 'social-impact',
        target: '[data-testid="project-stats"]',
        title: '🌟 Impact Social',
        content: 'Votre participation contribue à financer la créativité et l\'innovation culturelle.',
        position: 'top',
        highlight: true,
      },
    ],
  },
};

interface IntroTourProps {
  tourId?: string;
  onComplete?: (tourId: string) => void;
  onSkip?: (tourId: string) => void;
  className?: string;
}

export function IntroTour({ 
  tourId = 'welcome', 
  onComplete, 
  onSkip,
  className = '' 
}: IntroTourProps) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const overlayRef = useRef<HTMLDivElement>(null);

  const config = TOUR_CONFIGS[tourId];

  useEffect(() => {
    // Démarrage automatique si configuré
    if (config?.autoStart && !localStorage.getItem(`tour_${tourId}_completed`)) {
      const timer = setTimeout(() => {
        startTour();
      }, 1000); // Délai pour laisser la page se charger
      return () => clearTimeout(timer);
    }
  }, [tourId, config]);

  useEffect(() => {
    if (isActive && config) {
      updateTargetElement();
    }
  }, [isActive, currentStep, config]);

  useEffect(() => {
    if (targetElement) {
      updateTooltipPosition();
      
      // Écouter les redimensionnements pour repositionner
      const handleResize = () => updateTooltipPosition();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [targetElement]);

  const startTour = () => {
    setIsActive(true);
    setCurrentStep(0);
  };

  const nextStep = () => {
    if (currentStep < config.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipTour = () => {
    setIsActive(false);
    localStorage.setItem(`tour_${tourId}_skipped`, 'true');
    onSkip?.(tourId);
  };

  const completeTour = () => {
    setIsActive(false);
    localStorage.setItem(`tour_${tourId}_completed`, 'true');
    onComplete?.(tourId);
  };

  const updateTargetElement = () => {
    const step = config.steps[currentStep];
    if (step) {
      const element = document.querySelector(step.target) as HTMLElement;
      setTargetElement(element);
      
      // Scroll vers l'élément si nécessaire
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const updateTooltipPosition = () => {
    if (!targetElement) return;

    const step = config.steps[currentStep];
    const rect = targetElement.getBoundingClientRect();
    const tooltipWidth = 320;
    const tooltipHeight = 200;
    const offset = step.offset || { x: 0, y: 0 };

    let x = 0;
    let y = 0;

    switch (step.position) {
      case 'top':
        x = rect.left + rect.width / 2 - tooltipWidth / 2 + offset.x;
        y = rect.top - tooltipHeight - 20 + offset.y;
        break;
      case 'bottom':
        x = rect.left + rect.width / 2 - tooltipWidth / 2 + offset.x;
        y = rect.bottom + 20 + offset.y;
        break;
      case 'left':
        x = rect.left - tooltipWidth - 20 + offset.x;
        y = rect.top + rect.height / 2 - tooltipHeight / 2 + offset.y;
        break;
      case 'right':
        x = rect.right + 20 + offset.x;
        y = rect.top + rect.height / 2 - tooltipHeight / 2 + offset.y;
        break;
    }

    // Ajustements pour rester dans l'écran
    x = Math.max(10, Math.min(x, window.innerWidth - tooltipWidth - 10));
    y = Math.max(10, Math.min(y, window.innerHeight - tooltipHeight - 10));

    setTooltipPosition({ x, y });
  };

  if (!isActive || !config) return null;

  const currentStepData = config.steps[currentStep];
  const progress = ((currentStep + 1) / config.steps.length) * 100;

  return createPortal(
    <div className="fixed inset-0 z-[9999]">
      {/* Overlay avec découpe */}
      <div 
        ref={overlayRef}
        className="absolute inset-0 bg-black/80"
        style={{
          maskImage: targetElement && currentStepData.highlight 
            ? `radial-gradient(circle at ${targetElement.getBoundingClientRect().left + targetElement.getBoundingClientRect().width/2}px ${targetElement.getBoundingClientRect().top + targetElement.getBoundingClientRect().height/2}px, transparent ${Math.max(targetElement.getBoundingClientRect().width, targetElement.getBoundingClientRect().height)/2 + 10}px, black ${Math.max(targetElement.getBoundingClientRect().width, targetElement.getBoundingClientRect().height)/2 + 20}px)`
            : undefined
        }}
      />

      {/* Tooltip */}
      <Card 
        className={`absolute w-80 max-w-[90vw] bg-[#0F0F23] border-[#00D1FF] shadow-2xl ${className}`}
        style={{
          left: tooltipPosition.x,
          top: tooltipPosition.y,
        }}
        data-testid={`tour-tooltip-${currentStepData.id}`}
      >
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <config.icon className="w-5 h-5 text-[#00D1FF]" />
              <Badge variant="outline" className="text-xs">
                {currentStep + 1} / {config.steps.length}
              </Badge>
            </div>
            {config.skipable && (
              <Button
                variant="ghost"
                size="icon"
                onClick={skipTour}
                className="h-6 w-6 text-gray-400 hover:text-white"
                data-testid="tour-skip-button"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-700 rounded-full h-1 mb-4">
            <div 
              className="bg-gradient-to-r from-[#00D1FF] to-[#7B2CFF] h-1 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Content */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-2">
              {currentStepData.title}
            </h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              {currentStepData.content}
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={previousStep}
              disabled={currentStep === 0}
              className="text-gray-400 border-gray-600"
              data-testid="tour-previous-button"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Précédent
            </Button>

            <Button
              onClick={nextStep}
              size="sm"
              className="bg-gradient-to-r from-[#00D1FF] to-[#7B2CFF] hover:from-[#00B8E6] hover:to-[#6A25E6]"
              data-testid="tour-next-button"
            >
              {currentStep === config.steps.length - 1 ? (
                'Terminer'
              ) : (
                <>
                  Suivant
                  <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Flèche pointant vers l'élément cible */}
      {targetElement && currentStepData.highlight && (
        <div
          className="absolute w-0 h-0 pointer-events-none"
          style={{
            left: targetElement.getBoundingClientRect().left + targetElement.getBoundingClientRect().width / 2,
            top: targetElement.getBoundingClientRect().top + targetElement.getBoundingClientRect().height / 2,
            borderLeft: '10px solid transparent',
            borderRight: '10px solid transparent',
            borderTop: currentStepData.position === 'bottom' ? '10px solid #00D1FF' : 'none',
            borderBottom: currentStepData.position === 'top' ? '10px solid #00D1FF' : 'none',
            transform: 'translate(-50%, -50%)',
          }}
        />
      )}
    </div>,
    document.body
  );
}

// Hook pour gérer les tours
export function useTour() {
  const [availableTours] = useState(Object.keys(TOUR_CONFIGS));

  const startTour = (tourId: string) => {
    // Créer et monter le composant tour
    const tourElement = document.createElement('div');
    document.body.appendChild(tourElement);
    
    // Le composant se gérera tout seul via React Portal
  };

  const isTourCompleted = (tourId: string) => {
    return localStorage.getItem(`tour_${tourId}_completed`) === 'true';
  };

  const markTourCompleted = (tourId: string) => {
    localStorage.setItem(`tour_${tourId}_completed`, 'true');
  };

  const resetTour = (tourId: string) => {
    localStorage.removeItem(`tour_${tourId}_completed`);
    localStorage.removeItem(`tour_${tourId}_skipped`);
  };

  const resetAllTours = () => {
    availableTours.forEach(resetTour);
  };

  return {
    availableTours,
    startTour,
    isTourCompleted,
    markTourCompleted,
    resetTour,
    resetAllTours,
  };
}

// Composant pour afficher les tours disponibles
export function TourMenu() {
  const { availableTours, startTour, isTourCompleted } = useTour();

  return (
    <Card className="w-full max-w-md">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Tours d'Introduction
        </h3>
        
        <div className="space-y-3">
          {availableTours.map(tourId => {
            const config = TOUR_CONFIGS[tourId];
            const completed = isTourCompleted(tourId);
            
            return (
              <div 
                key={tourId}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
              >
                <div className="flex items-center gap-3">
                  <config.icon className="w-5 h-5 text-[#00D1FF]" />
                  <div>
                    <p className="font-medium">{config.title}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {config.description}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {completed && (
                    <Badge variant="secondary" className="text-xs">
                      Terminé
                    </Badge>
                  )}
                  <Button
                    size="sm"
                    onClick={() => startTour(tourId)}
                    variant={completed ? "outline" : "default"}
                    data-testid={`start-tour-${tourId}`}
                  >
                    {completed ? 'Refaire' : 'Démarrer'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}