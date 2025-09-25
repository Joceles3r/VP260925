import { useState, useEffect } from 'react';
import { Play, Star, TrendingUp, Users, Eye, Info, Zap, Target } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogHeader } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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

// Composant pour les catégories
const CategoryCard = ({ category, onSelect }: { category: VisualCategory; onSelect: (categoryId: string) => void }) => {
  const isVisible = mockCategoryToggles[category.id].visible;
  
  return (
    <Card className={`visual-card p-6 cursor-pointer visual-fade-in ${!isVisible ? 'opacity-50' : ''}`} 
          onClick={() => isVisible && onSelect(category.id)}>
      <div className="text-center space-y-3">
        <div className="text-4xl mb-3">{category.icon}</div>
        <h3 className="font-semibold text-lg text-white">{category.name}</h3>
        <p className="text-sm text-gray-400 line-clamp-2">{category.description}</p>
        {isVisible ? (
          <div className="space-y-2">
            <p className="text-xs text-blue-400">
              📈 {category.investmentRange}
            </p>
            {category.priceRange && (
              <p className="text-xs text-violet-400">
                💰 {category.priceRange}
              </p>
            )}
            <Button className="visual-btn w-full" size="sm">
              Découvrir
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <Badge variant="outline" className="text-gray-500">
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
    <Card className="visual-card overflow-hidden cursor-pointer"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={() => onView(project)}>
      <div className="relative">
        <img 
          src={project.thumbnail} 
          alt={project.title}
          className="w-full h-48 object-cover transition-transform duration-200"
          style={{ transform: isHovered ? 'scale(1.05)' : 'scale(1)' }}
        />
        <div className="absolute top-2 left-2 flex gap-1">
          {project.badges.map(badge => (
            <Badge key={badge} className={`visual-badge ${badge}`}>
              {badge === 'trending' && '🔥 Tendance'}
              {badge === 'top10' && '⭐ TOP 10'}
              {badge === 'new' && '✨ Nouveau'}
            </Badge>
          ))}
        </div>
        <div className="absolute bottom-2 right-2 bg-black/50 backdrop-blur-sm rounded-full p-2">
          <Play className="w-4 h-4 text-white" />
        </div>
      </div>
      
      <div className="p-4 space-y-3">
        <div>
          <h4 className="font-semibold text-white line-clamp-1">{project.title}</h4>
          <p className="text-sm text-gray-400">par {project.creator}</p>
        </div>
        
        <p className="text-sm text-gray-300 line-clamp-2">{project.description}</p>
        
        {project.price && (
          <div className="text-sm font-medium text-blue-400">
            À partir de {project.price}€
          </div>
        )}
        
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-400">
            <span>{project.currentAmount.toLocaleString()}€ levés</span>
            <span>{progressPercent.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Users className="w-3 h-3" />
            <span>{project.investorCount}</span>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <div className="flex items-center gap-1 text-xs">
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
  if (!project) return null;

  const handleInvest = (amount: number) => {
    mockEndpoints.investInProject(project.id, amount);
  };

  const handlePurchase = () => {
    mockEndpoints.purchaseContent(project.id);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="visual-dark border-l border-gray-800 w-full sm:max-w-lg overflow-y-auto">
        <div className="space-y-6">
          <div className="relative">
            <img 
              src={project.thumbnail} 
              alt={project.title}
              className="w-full h-64 object-cover rounded-lg"
            />
            <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center">
              <Button className="visual-btn">
                <Play className="w-4 h-4 mr-2" />
                Voir l'extrait
              </Button>
            </div>
          </div>

          <div>
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-xl font-bold text-white">{project.title}</h3>
              <div className="flex gap-1">
                {project.badges.map(badge => (
                  <Badge key={badge} className={`visual-badge ${badge}`} />
                ))}
              </div>
            </div>
            <p className="text-gray-400 mb-3">par {project.creator}</p>
            <p className="text-gray-300">{project.description}</p>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="visual-border-gradient">
              <div>
                <div className="text-lg font-bold text-blue-400">
                  {project.currentAmount.toLocaleString()}€
                </div>
                <div className="text-xs text-gray-400">Montant levé</div>
              </div>
            </div>
            <div className="visual-border-gradient">
              <div>
                <div className="text-lg font-bold text-violet-400">
                  {project.investorCount}
                </div>
                <div className="text-xs text-gray-400">Investisseurs</div>
              </div>
            </div>
            <div className="visual-border-gradient">
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
              >
                Accéder pour {project.price}€
              </Button>
            </div>
          )}

          <div className="space-y-3">
            <h4 className="font-semibold text-white">Investir dans ce projet</h4>
            <div className="grid grid-cols-4 gap-2">
              {project.investmentRanges.map(amount => (
                <Button
                  key={amount}
                  variant="outline"
                  size="sm"
                  className="border-gray-700 hover:border-blue-500 text-white"
                  onClick={() => handleInvest(amount)}
                >
                  {amount < 1 ? `${(amount * 100).toFixed(0)}¢` : `${amount}€`}
                </Button>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              Vous obtenez {project.category === 'voix_info' ? 'entre 1-7' : '1-10'} votes selon le montant
            </p>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300">
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
    <div className="fixed bottom-4 left-4 right-4 bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-full p-2 flex justify-center gap-2 z-50">
      <Button 
        size="sm" 
        className="visual-btn visual-pulse"
        onClick={() => onAction('live')}
      >
        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></span>
        En direct ({liveCount})
      </Button>
      
      <Button 
        size="sm" 
        variant="ghost"
        className="text-white hover:bg-white/10"
        onClick={() => onAction('top10')}
      >
        <Star className="w-4 h-4 mr-1" />
        Top 10
      </Button>
      
      <Button 
        size="sm" 
        variant="ghost"
        className="text-white hover:bg-white/10"
        onClick={() => onAction('nouveau')}
      >
        <Zap className="w-4 h-4 mr-1" />
        Nouveau
      </Button>
      
      <Button 
        size="sm" 
        variant="ghost"
        className="text-white hover:bg-white/10 visual-bounce"
        onClick={() => onAction('surprise')}
      >
        <span className="mr-2">🎲</span>
        Surprends-moi
      </Button>
      
      <Button 
        size="sm" 
        className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black hover:from-yellow-400 hover:to-orange-400"
        onClick={() => onAction('bonus')}
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
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  useEffect(() => {
    if (selectedCategory) {
      mockEndpoints.getProjects(selectedCategory).then(setProjects);
    } else {
      setProjects(mockProjects);
    }
  }, [selectedCategory]);

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const handleDockAction = (action: string) => {
    console.log(`Dock action: ${action}`);
    // Implémentation des actions du dock
  };

  return (
    <div className="min-h-screen visual-dark visual-gradient-bg">
      <div className="container mx-auto px-4 py-8 pb-24">
        
        {/* Hero Section */}
        <section className="text-center mb-16 visual-fade-in">
          <h1 className="text-6xl font-bold mb-6 visual-text-gradient">
            VISUAL
          </h1>
          <h2 className="text-2xl font-semibold mb-4 text-white">
            Streaming + Investissement créatif
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Regarde. Soutiens. Partage la réussite.
          </p>
          <p className="text-gray-400 max-w-3xl mx-auto">
            VISUAL combine streaming et micro-investissement : regarde des extraits gratuits, 
            paie pour voir l'œuvre complète, et soutiens les créateurs avec des petites mises 
            pour partager leur succès selon les règles de chaque catégorie.
          </p>
        </section>

        {/* Categories */}
        {!selectedCategory && (
          <section className="mb-16">
            <h3 className="text-2xl font-bold text-center mb-8 text-white">
              Explorez les catégories
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              <h3 className="text-2xl font-bold text-white">
                {visualCategories.find(c => c.id === selectedCategory)?.name}
              </h3>
              <Button 
                variant="ghost"
                onClick={() => setSelectedCategory(null)}
                className="text-gray-400 hover:text-white"
              >
                ← Retour aux catégories
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map(project => (
                <ProjectCard 
                  key={project.id}
                  project={project}
                  onView={setSelectedProject}
                />
              ))}
            </div>
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