import { useState, useEffect } from 'react';
import { Play, Star, TrendingUp, Users, Eye, Info, Zap, Target, CheckCircle, CreditCard, Filter, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogHeader } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  visualCategories, 
  mockProjects, 
  mockCategoryToggles, 
  mockLiveStats,
  legalInfo,
  type VisualProject,
  type VisualCategory,
  mockEndpoints
} from '@/lib/visualMockData';

// Interface pour les filtres
interface ProjectFilters {
  priceRange: [number, number];
  progressRange: [number, number];
  badges: string[];
  sortBy: 'title' | 'price' | 'progress' | 'engagement' | 'investors';
  sortOrder: 'asc' | 'desc';
}

// Composant pour les filtres de projets
const ProjectFilters = ({ 
  filters, 
  onFiltersChange, 
  isOpen, 
  onToggle 
}: { 
  filters: ProjectFilters;
  onFiltersChange: (filters: ProjectFilters) => void;
  isOpen: boolean;
  onToggle: () => void;
}) => {
  return (
    <Sheet open={isOpen} onOpenChange={onToggle}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" data-testid="button-filters">
          <SlidersHorizontal className="w-4 h-4 mr-2" />
          Filtres
        </Button>
      </SheetTrigger>
      <SheetContent className="visual-dark border-l border-gray-800 w-full sm:max-w-md" data-testid="filters-panel">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Filtres et tri</h3>
          </div>

          {/* Prix */}
          <div className="space-y-3">
            <Label className="text-white">Gamme de prix (€)</Label>
            <Slider
              value={filters.priceRange}
              onValueChange={(value) => 
                onFiltersChange({ ...filters, priceRange: value as [number, number] })
              }
              max={20}
              min={0}
              step={0.5}
              className="w-full"
              data-testid="filter-price-range"
            />
            <div className="flex justify-between text-sm text-gray-400">
              <span>{filters.priceRange[0]}€</span>
              <span>{filters.priceRange[1]}€</span>
            </div>
          </div>

          {/* Progression */}
          <div className="space-y-3">
            <Label className="text-white">Progression (%)</Label>
            <Slider
              value={filters.progressRange}
              onValueChange={(value) => 
                onFiltersChange({ ...filters, progressRange: value as [number, number] })
              }
              max={100}
              min={0}
              step={5}
              className="w-full"
              data-testid="filter-progress-range"
            />
            <div className="flex justify-between text-sm text-gray-400">
              <span>{filters.progressRange[0]}%</span>
              <span>{filters.progressRange[1]}%</span>
            </div>
          </div>

          {/* Badges */}
          <div className="space-y-3">
            <Label className="text-white">Badges</Label>
            <div className="space-y-2">
              {['trending', 'top10', 'new'].map(badge => (
                <div key={badge} className="flex items-center space-x-2">
                  <Switch
                    id={badge}
                    checked={filters.badges.includes(badge)}
                    onCheckedChange={(checked) => {
                      const newBadges = checked 
                        ? [...filters.badges, badge]
                        : filters.badges.filter(b => b !== badge);
                      onFiltersChange({ ...filters, badges: newBadges });
                    }}
                    data-testid={`filter-badge-${badge}`}
                  />
                  <Label htmlFor={badge} className="text-gray-300">
                    {badge === 'trending' && '🔥 Tendance'}
                    {badge === 'top10' && '⭐ TOP 10'}
                    {badge === 'new' && '✨ Nouveau'}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Tri */}
          <div className="space-y-3">
            <Label className="text-white">Trier par</Label>
            <Select
              value={filters.sortBy}
              onValueChange={(value) => 
                onFiltersChange({ ...filters, sortBy: value as ProjectFilters['sortBy'] })
              }
            >
              <SelectTrigger data-testid="filter-sort-by">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="title">Titre</SelectItem>
                <SelectItem value="price">Prix</SelectItem>
                <SelectItem value="progress">Progression</SelectItem>
                <SelectItem value="engagement">Engagement</SelectItem>
                <SelectItem value="investors">Investisseurs</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Ordre */}
          <div className="space-y-3">
            <Label className="text-white">Ordre</Label>
            <Select
              value={filters.sortOrder}
              onValueChange={(value) => 
                onFiltersChange({ ...filters, sortOrder: value as 'asc' | 'desc' })
              }
            >
              <SelectTrigger data-testid="filter-sort-order">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Croissant</SelectItem>
                <SelectItem value="desc">Décroissant</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reset */}
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => onFiltersChange({
              priceRange: [0, 20],
              progressRange: [0, 100],
              badges: [],
              sortBy: 'title',
              sortOrder: 'asc'
            })}
            data-testid="button-reset-filters"
          >
            Réinitialiser les filtres
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

// Composant pour les catégories
const CategoryCard = ({ category, onSelect }: { category: VisualCategory; onSelect: (categoryId: string) => void }) => {
  const isVisible = mockCategoryToggles[category.id].visible;
  
  return (
    <Card 
      className={`visual-card p-6 cursor-pointer visual-fade-in ${!isVisible ? 'opacity-50' : ''}`} 
      onClick={() => isVisible && onSelect(category.id)}
      data-testid={`category-card-${category.id}`}
    >
      <div className="text-center space-y-3">
        <div className="text-4xl mb-3" data-testid={`category-icon-${category.id}`}>{category.icon}</div>
        <h3 className="font-semibold text-lg text-white" data-testid={`category-name-${category.id}`}>{category.name}</h3>
        <p className="text-sm text-gray-400 line-clamp-2" data-testid={`category-description-${category.id}`}>{category.description}</p>
        {isVisible ? (
          <div className="space-y-2">
            <p className="text-xs text-blue-400" data-testid={`category-investment-range-${category.id}`}>
              📈 {category.investmentRange}
            </p>
            {category.priceRange && (
              <p className="text-xs text-violet-400" data-testid={`category-price-range-${category.id}`}>
                💰 {category.priceRange}
              </p>
            )}
            <Button 
              className="visual-btn w-full" 
              size="sm"
              data-testid={`button-discover-${category.id}`}
            >
              Découvrir
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <Badge variant="outline" className="text-gray-500" data-testid={`category-unavailable-${category.id}`}>
              Catégorie en travaux
            </Badge>
          </div>
        )}
      </div>
    </Card>
  );
};

// Composant pour les cartes de projet
const ProjectCard = ({ project, onView }: { project: VisualProject; onView: (project: VisualProject) => void }) => {
  const [isHovered, setIsHovered] = useState(false);
  const progressPercent = Math.min((project.currentAmount / project.targetAmount) * 100, 100);

  return (
    <Card 
      className="visual-card overflow-hidden cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onView(project)}
      data-testid={`project-card-${project.id}`}
    >
      <div className="relative">
        <img 
          src={project.thumbnail} 
          alt={project.title}
          className="w-full h-48 object-cover transition-transform duration-200"
          style={{ transform: isHovered ? 'scale(1.05)' : 'scale(1)' }}
          data-testid={`project-thumbnail-${project.id}`}
        />
        <div className="absolute top-2 left-2 flex gap-1">
          {project.badges.map(badge => (
            <Badge 
              key={badge} 
              className={`visual-badge ${badge}`}
              data-testid={`project-badge-${project.id}-${badge}`}
            >
              {badge === 'trending' && '🔥 Tendance'}
              {badge === 'top10' && '⭐ TOP 10'}
              {badge === 'new' && '✨ Nouveau'}
            </Badge>
          ))}
        </div>
        <div className="absolute bottom-2 right-2 bg-black/50 backdrop-blur-sm rounded-full p-2">
          <Play className="w-4 h-4 text-white" data-testid={`project-play-icon-${project.id}`} />
        </div>
      </div>
      
      <div className="p-4 space-y-3">
        <div>
          <h4 className="font-semibold text-white line-clamp-1" data-testid={`project-title-${project.id}`}>{project.title}</h4>
          <p className="text-sm text-gray-400" data-testid={`project-creator-${project.id}`}>par {project.creator}</p>
        </div>
        
        <p className="text-sm text-gray-300 line-clamp-2" data-testid={`project-description-${project.id}`}>{project.description}</p>
        
        {project.price && (
          <div className="text-sm font-medium text-blue-400" data-testid={`project-price-${project.id}`}>
            À partir de {project.price}€
          </div>
        )}
        
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-400">
            <span data-testid={`project-current-amount-${project.id}`}>{project.currentAmount.toLocaleString()}€ levés</span>
            <span data-testid={`project-progress-percent-${project.id}`}>{progressPercent.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2" data-testid={`project-progress-bar-${project.id}`}>
            <div 
              className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
              data-testid={`project-progress-fill-${project.id}`}
            />
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Users className="w-3 h-3" />
            <span data-testid={`project-investor-count-${project.id}`}>{project.investorCount}</span>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <div className="flex items-center gap-1 text-xs" data-testid={`project-engagement-${project.id}`}>
                  <Target className="w-3 h-3 text-green-400" />
                  <span className="text-green-400 font-medium">{project.engagementCoeff}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Coefficient d'engagement</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </Card>
  );
};

// Composant pour la fiche projet (sheet)
const ProjectSheet = ({ project, isOpen, onClose }: { 
  project: VisualProject | null; 
  isOpen: boolean; 
  onClose: () => void;
}) => {
  const { toast } = useToast();
  
  if (!project) return null;

  const handleInvest = async (amount: number) => {
    try {
      const result = await mockEndpoints.investInProject(project.id, amount);
      toast({
        title: "🎯 Investissement confirmé !",
        description: `Vous avez investi ${amount < 1 ? `${(amount * 100).toFixed(0)}¢` : `${amount}€`} dans "${project.title}". Vous obtenez ${result.votes} vote${result.votes > 1 ? 's' : ''}.`,
        duration: 5000,
      });
    } catch (error) {
      toast({
        title: "❌ Erreur d'investissement",
        description: "Une erreur s'est produite lors de votre investissement. Veuillez réessayer.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handlePurchase = async () => {
    try {
      const result = await mockEndpoints.purchaseContent(project.id);
      toast({
        title: "🎬 Achat confirmé !",
        description: `Vous avez accès au contenu complet de "${project.title}". Bon visionnage !`,
        duration: 5000,
      });
    } catch (error) {
      toast({
        title: "❌ Erreur d'achat",
        description: "Une erreur s'est produite lors de votre achat. Veuillez réessayer.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="visual-dark border-l border-gray-800 w-full sm:max-w-lg overflow-y-auto" data-testid={`project-sheet-${project.id}`}>
        <div className="space-y-6">
          <div className="relative">
            <img 
              src={project.thumbnail} 
              alt={project.title}
              className="w-full h-64 object-cover rounded-lg"
              data-testid={`sheet-thumbnail-${project.id}`}
            />
            <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center">
              <Button className="visual-btn" data-testid={`button-watch-excerpt-${project.id}`}>
                <Play className="w-4 h-4 mr-2" />
                Voir l'extrait
              </Button>
            </div>
          </div>

          <div>
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-xl font-bold text-white" data-testid={`sheet-title-${project.id}`}>{project.title}</h3>
              <div className="flex gap-1">
                {project.badges.map(badge => (
                  <Badge key={badge} className={`visual-badge ${badge}`} data-testid={`sheet-badge-${project.id}-${badge}`} />
                ))}
              </div>
            </div>
            <p className="text-gray-400 mb-3" data-testid={`sheet-creator-${project.id}`}>par {project.creator}</p>
            <p className="text-gray-300" data-testid={`sheet-description-${project.id}`}>{project.description}</p>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="visual-border-gradient" data-testid={`sheet-stat-amount-${project.id}`}>
              <div>
                <div className="text-lg font-bold text-blue-400">
                  {project.currentAmount.toLocaleString()}€
                </div>
                <div className="text-xs text-gray-400">Montant levé</div>
              </div>
            </div>
            <div className="visual-border-gradient" data-testid={`sheet-stat-investors-${project.id}`}>
              <div>
                <div className="text-lg font-bold text-violet-400">
                  {project.investorCount}
                </div>
                <div className="text-xs text-gray-400">Investisseurs</div>
              </div>
            </div>
            <div className="visual-border-gradient" data-testid={`sheet-stat-engagement-${project.id}`}>
              <div>
                <div className="text-lg font-bold text-green-400">
                  {project.engagementCoeff}
                </div>
                <div className="text-xs text-gray-400">Coeff. engagement</div>
              </div>
            </div>
          </div>

          {project.price && (
            <div className="space-y-3">
              <h4 className="font-semibold text-white">Regarder en entier</h4>
              <Button 
                className="visual-btn w-full" 
                onClick={handlePurchase}
                data-testid={`button-purchase-${project.id}`}
              >
                Accéder pour {project.price}€
              </Button>
            </div>
          )}

          <div className="space-y-3">
            <h4 className="font-semibold text-white">Investir dans ce projet</h4>
            <div className="grid grid-cols-4 gap-2" data-testid={`investment-grid-${project.id}`}>
              {project.investmentRanges.map(amount => (
                <Button
                  key={amount}
                  variant="outline"
                  size="sm"
                  className="border-gray-700 hover:border-blue-500 text-white"
                  onClick={() => handleInvest(amount)}
                  data-testid={`button-invest-${project.id}-${amount}`}
                >
                  {amount < 1 ? `${(amount * 100).toFixed(0)}¢` : `${amount}€`}
                </Button>
              ))}
            </div>
            <p className="text-xs text-gray-500" data-testid={`investment-info-${project.id}`}>
              Vous obtenez {project.category === 'voix_info' ? 'entre 1-7' : '1-10'} votes selon le montant
            </p>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300" data-testid={`button-rules-${project.id}`}>
                <Info className="w-4 h-4 mr-2" />
                Règles de la catégorie
              </Button>
            </DialogTrigger>
            <DialogContent className="visual-dark border-gray-800">
              <DialogHeader>
                <DialogTitle className="text-white">
                  Règles - {visualCategories.find(c => c.id === project.category)?.name}
                </DialogTitle>
              </DialogHeader>
              <div className="text-sm text-gray-300 space-y-2">
                <p>• Redistribution basée sur le classement final</p>
                <p>• 23% pour VISUAL, reste réparti aux investisseurs/créateurs</p>
                <p>• Arrondis à l'euro inférieur pour les utilisateurs</p>
                <p>• Aucun gain n'est garanti - investissement à risques</p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </SheetContent>
    </Sheet>
  );
};

// Dock de curiosité (barre fixe bas)
const CuriosityDock = ({ onAction }: { onAction: (action: string) => void }) => {
  const [liveCount, setLiveCount] = useState(mockLiveStats.currentViewers);

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveCount(prev => prev + Math.floor(Math.random() * 10 - 5));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-full p-2 flex justify-center gap-2 z-50" data-testid="curiosity-dock">
      <Button 
        size="sm" 
        className="visual-btn visual-pulse"
        onClick={() => onAction('live')}
        data-testid="dock-button-live"
      >
        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></span>
        En direct (<span data-testid="live-viewer-count">{liveCount}</span>)
      </Button>
      
      <Button 
        size="sm" 
        variant="ghost"
        className="text-white hover:bg-white/10"
        onClick={() => onAction('top10')}
        data-testid="dock-button-top10"
      >
        <Star className="w-4 h-4 mr-1" />
        Top 10
      </Button>
      
      <Button 
        size="sm" 
        variant="ghost"
        className="text-white hover:bg-white/10"
        onClick={() => onAction('nouveau')}
        data-testid="dock-button-new"
      >
        <Zap className="w-4 h-4 mr-1" />
        Nouveau
      </Button>
      
      <Button 
        size="sm" 
        variant="ghost"
        className="text-white hover:bg-white/10 visual-bounce"
        onClick={() => onAction('surprise')}
        data-testid="dock-button-surprise"
      >
        <span className="mr-2">🎲</span>
        Surprends-moi
      </Button>
      
      <Button 
        size="sm" 
        className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black hover:from-yellow-400 hover:to-orange-400"
        onClick={() => onAction('bonus')}
        data-testid="dock-button-bonus"
      >
        <span className="mr-1">✨</span>
        +20 VP
      </Button>
    </div>
  );
};

// Page principale VISUAL
export default function VisualPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<VisualProject | null>(null);
  const [projects, setProjects] = useState(mockProjects);
  const [filteredProjects, setFilteredProjects] = useState(mockProjects);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<ProjectFilters>({
    priceRange: [0, 20],
    progressRange: [0, 100],
    badges: [],
    sortBy: 'title',
    sortOrder: 'asc'
  });
  const { toast } = useToast();

  useEffect(() => {
    if (selectedCategory) {
      mockEndpoints.getProjects(selectedCategory).then(setProjects);
    } else {
      setProjects(mockProjects);
    }
  }, [selectedCategory]);

  // Effet pour appliquer les filtres et le tri
  useEffect(() => {
    let filtered = [...projects];
    
    // Filtrer par prix
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 20) {
      filtered = filtered.filter(project => {
        const price = project.price || 0;
        return price >= filters.priceRange[0] && price <= filters.priceRange[1];
      });
    }
    
    // Filtrer par progression
    if (filters.progressRange[0] > 0 || filters.progressRange[1] < 100) {
      filtered = filtered.filter(project => {
        const progress = Math.min((project.currentAmount / project.targetAmount) * 100, 100);
        return progress >= filters.progressRange[0] && progress <= filters.progressRange[1];
      });
    }
    
    // Filtrer par badges
    if (filters.badges.length > 0) {
      filtered = filtered.filter(project => 
        filters.badges.some(badge => project.badges.includes(badge as any))
      );
    }
    
    // Trier
    filtered.sort((a, b) => {
      let valueA: any, valueB: any;
      
      switch (filters.sortBy) {
        case 'title':
          valueA = a.title;
          valueB = b.title;
          break;
        case 'price':
          valueA = a.price || 0;
          valueB = b.price || 0;
          break;
        case 'progress':
          valueA = (a.currentAmount / a.targetAmount) * 100;
          valueB = (b.currentAmount / b.targetAmount) * 100;
          break;
        case 'engagement':
          valueA = a.engagementCoeff;
          valueB = b.engagementCoeff;
          break;
        case 'investors':
          valueA = a.investorCount;
          valueB = b.investorCount;
          break;
        default:
          valueA = a.title;
          valueB = b.title;
      }
      
      if (typeof valueA === 'string') {
        return filters.sortOrder === 'asc' 
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      } else {
        return filters.sortOrder === 'asc' 
          ? valueA - valueB
          : valueB - valueA;
      }
    });
    
    setFilteredProjects(filtered);
  }, [projects, filters]);

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const handleDockAction = (action: string) => {
    console.log(`Dock action: ${action}`);
    
    switch (action) {
      case 'live':
        toast({
          title: "🔴 Live en direct",
          description: "Redirection vers les contenus en direct...",
          duration: 3000,
        });
        break;
      case 'top10':
        toast({
          title: "⭐ Top 10",
          description: "Affichage des projets les mieux classés...",
          duration: 3000,
        });
        break;
      case 'nouveau':
        toast({
          title: "✨ Nouveautés",
          description: "Découverte des derniers projets ajoutés...",
          duration: 3000,
        });
        break;
      case 'surprise':
        const randomProject = mockProjects[Math.floor(Math.random() * mockProjects.length)];
        setSelectedProject(randomProject);
        toast({
          title: "🎲 Surprise !",
          description: `Découvrez "${randomProject.title}" par ${randomProject.creator}`,
          duration: 4000,
        });
        break;
      case 'bonus':
        toast({
          title: "✨ Bonus VISUpoints !",
          description: "Vous avez gagné +20 VP pour votre engagement quotidien !",
          duration: 5000,
        });
        break;
      default:
        console.log(`Action inconnue: ${action}`);
    }
  };

  return (
    <div className="min-h-screen visual-dark visual-gradient-bg">
      <div className="container mx-auto px-4 py-8 pb-24">
        
        {/* Hero Section */}
        <section className="text-center mb-16 visual-fade-in" data-testid="hero-section">
          <h1 className="text-6xl font-bold mb-6 visual-text-gradient" data-testid="hero-title">
            VISUAL
          </h1>
          <h2 className="text-2xl font-semibold mb-4 text-white" data-testid="hero-subtitle">
            Streaming + Investissement créatif
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto" data-testid="hero-tagline">
            Regarde. Soutiens. Partage la réussite.
          </p>
          <p className="text-gray-400 max-w-3xl mx-auto" data-testid="hero-description">
            VISUAL combine streaming et micro-investissement : regarde des extraits gratuits, 
            paie pour voir l'œuvre complète, et soutiens les créateurs avec des petites mises 
            pour partager leur succès selon les règles de chaque catégorie.
          </p>
        </section>

        {/* Categories */}
        {!selectedCategory && (
          <section className="mb-16" data-testid="categories-section">
            <h3 className="text-2xl font-bold text-center mb-8 text-white" data-testid="categories-title">
              Explorez les catégories
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="categories-grid">
              {visualCategories.map((category, index) => (
                <div key={category.id} className={`visual-delay-${(index + 1) * 100}`}>
                  <CategoryCard 
                    category={category} 
                    onSelect={handleCategorySelect}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Comment ça marche */}
        {!selectedCategory && (
          <section className="mb-16">
            <h3 className="text-2xl font-bold text-center mb-8 text-white">
              Comment ça marche ?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center visual-fade-in visual-delay-100">
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Play className="w-8 h-8 text-blue-400" />
                </div>
                <h4 className="font-semibold text-white mb-2">1. Regarde un extrait</h4>
                <p className="text-gray-400 text-sm">
                  Découvre gratuitement les extraits, puis paie un petit montant pour voir l'œuvre complète
                </p>
              </div>
              
              <div className="text-center visual-fade-in visual-delay-200">
                <div className="w-16 h-16 bg-violet-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-violet-400" />
                </div>
                <h4 className="font-semibold text-white mb-2">2. Investis une petite somme</h4>
                <p className="text-gray-400 text-sm">
                  Entre 0,20€ et 20€ selon la catégorie pour obtenir des votes et soutenir le projet
                </p>
              </div>
              
              <div className="text-center visual-fade-in visual-delay-300">
                <div className="w-16 h-16 bg-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8 text-pink-400" />
                </div>
                <h4 className="font-semibold text-white mb-2">3. Gagne potentiellement</h4>
                <p className="text-gray-400 text-sm">
                  Si ton projet sélectionné termine dans le top, partage les résultats selon les règles
                </p>
              </div>
            </div>
            
            <div className="text-center mt-8">
              <Button 
                variant="ghost" 
                onClick={() => setShowDisclaimer(true)}
                className="text-blue-400 hover:text-blue-300"
                data-testid="button-learn-more-rules"
              >
                <Info className="w-4 h-4 mr-2" />
                En savoir plus sur les règles
              </Button>
            </div>
          </section>
        )}

        {/* Projects List */}
        {selectedCategory && (
          <section>
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold text-white" data-testid="selected-category-title">
                {visualCategories.find(c => c.id === selectedCategory)?.name}
                <span className="ml-2 text-sm text-gray-400">
                  ({filteredProjects.length} projet{filteredProjects.length > 1 ? 's' : ''})
                </span>
              </h3>
              <div className="flex items-center gap-3">
                <ProjectFilters 
                  filters={filters}
                  onFiltersChange={setFilters}
                  isOpen={showFilters}
                  onToggle={() => setShowFilters(!showFilters)}
                />
                <Button 
                  variant="ghost"
                  onClick={() => setSelectedCategory(null)}
                  className="text-gray-400 hover:text-white"
                  data-testid="button-back-to-categories"
                >
                  ← Retour aux catégories
                </Button>
              </div>
            </div>
            
            {filteredProjects.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Filter className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Aucun projet ne correspond aux filtres</p>
                  <p className="text-sm">Essayez d'ajuster vos critères de recherche</p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setFilters({
                    priceRange: [0, 20],
                    progressRange: [0, 100],
                    badges: [],
                    sortBy: 'title',
                    sortOrder: 'asc'
                  })}
                  data-testid="button-clear-filters"
                >
                  Effacer les filtres
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="projects-grid">
                {filteredProjects.map(project => (
                  <ProjectCard 
                    key={project.id}
                    project={project}
                    onView={setSelectedProject}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Bandeau légal */}
        <div className="mt-16 text-center text-xs text-gray-500 space-y-2">
          <p>⚠️ Les investissements présentent des risques de perte. Aucun gain n'est garanti.</p>
          <p>Montants arrondis à l'euro inférieur pour les utilisateurs, restes versés à VISUAL.</p>
        </div>
      </div>

      {/* Project Sheet */}
      <ProjectSheet 
        project={selectedProject}
        isOpen={!!selectedProject}
        onClose={() => setSelectedProject(null)}
      />

      {/* Disclaimer Dialog */}
      <Dialog open={showDisclaimer} onOpenChange={setShowDisclaimer}>
        <DialogContent className="visual-dark border-gray-800 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Conditions et règles VISUAL</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm text-gray-300">
            <div>
              <h4 className="font-semibold text-white mb-2">⚠️ Avertissement sur les risques</h4>
              <p>{legalInfo.riskWarning}</p>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-2">💰 Redistribution</h4>
              <p>{legalInfo.redistribution}</p>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-2">🔄 Arrondis</h4>
              <p>{legalInfo.rounding}</p>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-2">📰 Les Voix de l'Info</h4>
              <p>{legalInfo.voixInfoShare}</p>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-2">📢 Petites Annonces</h4>
              <p>{legalInfo.petitesAnnonces}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Curiosity Dock */}
      <CuriosityDock onAction={handleDockAction} />
    </div>
  );
}