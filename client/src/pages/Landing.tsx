import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Film, 
  Newspaper, 
  Radio, 
  BookOpen, 
  MessageSquare,
  Eye,
  TrendingUp,
  Users,
  ArrowRight,
  Star,
  Zap,
  Shield,
  Info,
  DollarSign,
  Trophy,
  Clock,
  Target,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useEmojiSystem } from '@/hooks/useEmojiSystem';

// Catégories avec explications claires
const categories = [
  {
    id: 'films',
    title: 'Films',
    subtitle: '100 films en compétition',
    description: 'Regardez des extraits, investissez 2-20€, TOP 10 gagnants',
    duration: '168h de plus si TOP 10',
    icon: Film,
    color: 'from-blue-500 to-cyan-400',
    glowColor: 'shadow-blue-500/20',
    visible: true,
    projects: 87,
    topPrice: '5€',
    example: 'Court-métrage, Long-métrage'
  },
  {
    id: 'videos',
    title: 'Vidéos/Clips',
    subtitle: '100 vidéos en compétition',
    description: 'Clips musicaux, vidéos créatives, micro-investissements',
    duration: '168h de plus si TOP 10',
    icon: Play,
    color: 'from-purple-500 to-violet-400',
    glowColor: 'shadow-purple-500/20',
    visible: true,
    projects: 94,
    topPrice: '3€',
    example: 'Clip musical, Vidéo créative'
  },
  {
    id: 'documentaires',
    title: 'Documentaires',
    subtitle: '100 documentaires en compétition',
    description: 'Reportages, enquêtes, documentaires éducatifs',
    duration: '168h de plus si TOP 10',
    icon: Eye,
    color: 'from-orange-500 to-amber-400',
    glowColor: 'shadow-orange-500/20',
    visible: true,
    projects: 76,
    topPrice: '8€',
    example: 'Enquête, Documentaire nature'
  },
  {
    id: 'voix_info',
    title: 'Les Voix de l\'Info',
    subtitle: 'Articles • Cycle 24h',
    description: 'Articles d\'actualité, micro-prix 0,20-5€',
    duration: 'Redistribution toutes les 24h',
    icon: Newspaper,
    color: 'from-red-500 to-pink-400',
    glowColor: 'shadow-red-500/20',
    visible: true,
    projects: 156,
    topPrice: '0,50€',
    example: 'Article politique, Enquête'
  },
  {
    id: 'livres',
    title: 'Livres',
    subtitle: '100 livres • Cycle mensuel',
    description: 'E-books, guides, romans numériques',
    duration: 'Redistribution fin de mois',
    icon: BookOpen,
    color: 'from-green-500 to-emerald-400',
    glowColor: 'shadow-green-500/20',
    visible: true,
    projects: 43,
    topPrice: '8€',
    example: 'Roman, Guide technique'
  },
  {
    id: 'live_show',
    title: 'Visual Studio Live',
    subtitle: 'Shows live • Cycle hebdo',
    description: 'Émissions en direct, battles d\'artistes',
    duration: 'Investissement temps réel',
    icon: Radio,
    color: 'from-pink-500 to-rose-400',
    glowColor: 'shadow-pink-500/20',
    visible: true,
    projects: 12,
    topPrice: '20€',
    example: 'Battle rap, Showcase'
  }
];

// Projets en vedette avec données réalistes
const featuredProjects = [
  {
    id: '1',
    title: 'Documentaire IA & Société',
    creator: 'Marie Dubois',
    category: 'Documentaire',
    thumbnail: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=800',
    price: 5,
    invested: 1250,
    target: 5000,
    investors: 42,
    rank: 3,
    trending: true,
    description: 'Exploration de l\'impact de l\'IA sur notre quotidien'
  },
  {
    id: '2',
    title: 'Animation 3D "L\'Amitié"',
    creator: 'Thomas Martin',
    category: 'Film',
    thumbnail: 'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=800',
    price: 8,
    invested: 4200,
    target: 8000,
    investors: 67,
    rank: 1,
    topTen: true,
    description: 'Histoire touchante en animation 3D'
  },
  {
    id: '3',
    title: 'Guide du Réalisateur',
    creator: 'Sophie Leroy',
    category: 'Livre',
    thumbnail: 'https://images.pexels.com/photos/1029141/pexels-photo-1029141.jpeg?auto=compress&cs=tinysrgb&w=800',
    price: 4,
    invested: 890,
    target: 2000,
    investors: 28,
    rank: 7,
    isNew: true,
    description: 'Techniques avancées de réalisation'
  }
];

export default function Landing() {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const emoji = useEmojiSystem();

  // Animation automatique des étapes
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleCategoryClick = (categoryId: string, e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    emoji.triggerCategoryOpen(categoryId, x, y);
  };

  const handleProjectClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    emoji.triggerPurchaseSuccess(x, y);
  };

  const steps = [
    {
      icon: Eye,
      title: 'REGARDE',
      subtitle: 'Découvre gratuitement',
      description: 'Visionne les extraits de tous les projets. Comme Netflix, mais avec des créateurs indépendants !',
      color: 'from-blue-500 to-cyan-400'
    },
    {
      icon: DollarSign,
      title: 'INVESTIT',
      subtitle: 'Micro-investissement',
      description: 'Investis 2-20€ pour voir en entier ET soutenir le projet. Plus tu investis, plus tu as de votes !',
      color: 'from-purple-500 to-violet-400'
    },
    {
      icon: Trophy,
      title: 'GAGNE',
      subtitle: 'Partage la réussite',
      description: 'Si ton projet finit dans le TOP 10, tu gagnes ! Redistribution automatique selon les règles.',
      color: 'from-pink-500 to-rose-400'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      <div className="relative z-10">
        {/* Hero Section avec concept clair */}
        <section className="container mx-auto px-4 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              VISUAL
            </h1>
            <p className="text-3xl md:text-4xl text-white mb-4 font-bold">
              Streaming + Micro-Investissement
            </p>
            <p className="text-xl md:text-2xl text-blue-300 mb-8 font-medium">
              « Regarde • Investit • Gagne »
            </p>
            
            {/* Concept explicatif */}
            <div className="max-w-4xl mx-auto mb-12">
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 flex items-center justify-center mx-auto mb-4">
                        <Play className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">Comme Netflix</h3>
                      <p className="text-gray-400 text-sm">
                        Streaming de contenus créatifs avec extraits gratuits
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-violet-400 flex items-center justify-center mx-auto mb-4">
                        <Target className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">+ Investissement</h3>
                      <p className="text-gray-400 text-sm">
                        Micro-investissements 2-20€ pour soutenir les créateurs
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-rose-400 flex items-center justify-center mx-auto mb-4">
                        <Trophy className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">= Gains Partagés</h3>
                      <p className="text-gray-400 text-sm">
                        TOP 10 gagnants, redistribution automatique
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          >
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-blue-500/25 transition-all duration-200 neon-glow"
            >
              <Play className="mr-2 h-5 w-5" />
              Découvrir les projets
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="border-purple-400 text-purple-300 hover:bg-purple-500/10 px-8 py-4 text-lg font-semibold"
            >
              <Info className="mr-2 h-5 w-5" />
              Comment ça marche ?
            </Button>
          </motion.div>
        </section>

        {/* Principe "Regarde-Investit-Gagne" */}
        <section className="container mx-auto px-4 py-16">
          <motion.h2 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-bold text-center mb-4 text-white"
          >
            Le principe VISUAL
          </motion.h2>
          <p className="text-center text-gray-400 mb-12 text-lg">
            Streaming + Investissement = Nouvelle économie créative
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === index;
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  className={`text-center transition-all duration-500 ${
                    isActive ? 'scale-105' : 'scale-100'
                  }`}
                >
                  <div className={`w-20 h-20 rounded-full bg-gradient-to-r ${step.color} flex items-center justify-center mx-auto mb-6 shadow-lg ${
                    isActive ? 'neon-glow' : ''
                  }`}>
                    <Icon className="h-10 w-10 text-white" />
                  </div>
                  <div className={`text-3xl font-bold mb-2 bg-gradient-to-r ${step.color} bg-clip-text text-transparent`}>
                    {step.title}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">{step.subtitle}</h3>
                  <p className="text-gray-400 leading-relaxed max-w-sm mx-auto">{step.description}</p>
                </motion.div>
              );
            })}
          </div>

          {/* Exemple concret */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="max-w-4xl mx-auto"
          >
            <Card className="bg-gradient-to-r from-slate-800/80 to-purple-800/80 border-purple-500/30 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">💡 Exemple concret</h3>
                  <p className="text-purple-300">Voici comment ça marche en pratique</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-blue-900/30 rounded-lg p-4 border border-blue-500/30">
                    <div className="flex items-center gap-2 mb-3">
                      <Eye className="h-5 w-5 text-blue-400" />
                      <span className="font-semibold text-blue-300">1. Tu regardes</span>
                    </div>
                    <p className="text-sm text-gray-300">
                      Un extrait de 2min du documentaire "IA & Société" - <strong>gratuit</strong>
                    </p>
                  </div>
                  
                  <div className="bg-purple-900/30 rounded-lg p-4 border border-purple-500/30">
                    <div className="flex items-center gap-2 mb-3">
                      <DollarSign className="h-5 w-5 text-purple-400" />
                      <span className="font-semibold text-purple-300">2. Tu investis</span>
                    </div>
                    <p className="text-sm text-gray-300">
                      <strong>5€</strong> pour voir en entier + soutenir le projet = <strong>4 votes</strong>
                    </p>
                  </div>
                  
                  <div className="bg-pink-900/30 rounded-lg p-4 border border-pink-500/30">
                    <div className="flex items-center gap-2 mb-3">
                      <Trophy className="h-5 w-5 text-pink-400" />
                      <span className="font-semibold text-pink-300">3. Tu gagnes</span>
                    </div>
                    <p className="text-sm text-gray-300">
                      Si TOP 10 → <strong>redistribution</strong> selon ton investissement !
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </section>

        {/* Categories avec détails */}
        <section className="container mx-auto px-4 py-16">
          <motion.h2 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-bold text-center mb-4 text-white"
          >
            6 Catégories de Contenus
          </motion.h2>
          <p className="text-center text-gray-400 mb-12 text-lg">
            100 projets par catégorie • TOP 10 gagnants • Cycles adaptés
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {categories.map((category, index) => {
              const Icon = category.icon;
              const isHovered = hoveredCategory === category.id;
              
              return (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  onHoverStart={() => setHoveredCategory(category.id)}
                  onHoverEnd={() => setHoveredCategory(null)}
                >
                  <Card className={`bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-all duration-300 backdrop-blur-sm ${category.glowColor} hover:shadow-2xl overflow-hidden`}>
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${category.color} flex items-center justify-center`}>
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                          {category.projects}/100
                        </Badge>
                      </div>
                      
                      <CardTitle className="text-xl text-white mb-1">{category.title}</CardTitle>
                      <p className="text-sm text-gray-400 mb-2">{category.subtitle}</p>
                      <p className="text-xs text-purple-300">{category.example}</p>
                    </CardHeader>
                    
                    <CardContent>
                      <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                        {category.description}
                      </p>
                      
                      <div className="space-y-3 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Prix d'entrée :</span>
                          <span className="text-white font-semibold">{category.topPrice}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Durée bonus :</span>
                          <span className="text-blue-300 font-semibold text-xs">{category.duration}</span>
                        </div>
                      </div>
                      
                      <Button 
                        onClick={(e) => handleCategoryClick(category.id, e)}
                        className={`w-full bg-gradient-to-r ${category.color} hover:opacity-90 text-white font-semibold transition-all duration-200 ${
                          isHovered ? 'neon-glow' : ''
                        }`}
                      >
                        Découvrir
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Projets en vedette avec métriques */}
        <section className="container mx-auto px-4 py-16">
          <motion.h2 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-bold text-center mb-4 text-white"
          >
            Projets Tendance
          </motion.h2>
          <p className="text-center text-gray-400 mb-12 text-lg">
            Découvrez les créations qui cartonnent actuellement
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredProjects.map((project, index) => {
              const progress = (project.invested / project.target) * 100;
              
              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                >
                  <Card className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-all duration-200 backdrop-blur-sm overflow-hidden group">
                    <div className="relative overflow-hidden">
                      <img 
                        src={project.thumbnail} 
                        alt={project.title}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2 left-2 flex gap-2">
                        {project.trending && (
                          <Badge className="bg-red-500/90 text-white">
                            <Zap className="h-3 w-3 mr-1" />
                            Tendance
                          </Badge>
                        )}
                        {project.topTen && (
                          <Badge className="bg-yellow-500/90 text-black">
                            <Star className="h-3 w-3 mr-1" />
                            TOP 10 #{project.rank}
                          </Badge>
                        )}
                        {project.isNew && (
                          <Badge className="bg-green-500/90 text-white">
                            <Sparkles className="h-3 w-3 mr-1" />
                            Nouveau
                          </Badge>
                        )}
                      </div>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                        <div className="bg-white/20 backdrop-blur-sm rounded-full p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <Play className="h-8 w-8 text-white" />
                        </div>
                      </div>
                      <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm rounded px-2 py-1 text-white text-sm font-semibold">
                        {project.price}€
                      </div>
                    </div>
                    
                    <CardContent className="p-4">
                      <h3 className="text-lg font-semibold text-white mb-1 line-clamp-1">{project.title}</h3>
                      <p className="text-gray-400 text-sm mb-2">par {project.creator}</p>
                      <p className="text-gray-500 text-sm mb-3 line-clamp-2">{project.description}</p>
                      
                      {/* Progression du financement */}
                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-400">Financement</span>
                          <span className="text-white font-semibold">{progress.toFixed(0)}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>{project.invested}€</span>
                          <span>{project.target}€</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-gray-400 mb-3">
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {project.investors} investisseurs
                        </span>
                        <span className="flex items-center gap-1">
                          <Trophy className="h-4 w-4" />
                          Rang #{project.rank}
                        </span>
                      </div>

                      <Button 
                        onClick={handleProjectClick}
                        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 hover:neon-glow"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Regarder & Investir
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Avantages VISUAL */}
        <section className="container mx-auto px-4 py-16">
          <motion.h2 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-bold text-center mb-12 text-white"
          >
            Pourquoi VISUAL révolutionne le streaming ?
          </motion.h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 border-green-500/30 h-full">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Shield className="h-8 w-8 text-green-400" />
                    <h3 className="text-xl font-bold text-white">Pour les Créateurs</h3>
                  </div>
                  <ul className="space-y-3 text-gray-300">
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400 mt-2" />
                      <span><strong>Financement direct</strong> par la communauté</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400 mt-2" />
                      <span><strong>70% des revenus</strong> de vente directe</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400 mt-2" />
                      <span><strong>Visibilité garantie</strong> si TOP 10</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400 mt-2" />
                      <span><strong>Pas d'intermédiaire</strong> traditionnel</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card className="bg-gradient-to-r from-blue-900/20 to-cyan-900/20 border-blue-500/30 h-full">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <TrendingUp className="h-8 w-8 text-blue-400" />
                    <h3 className="text-xl font-bold text-white">Pour les Investisseurs</h3>
                  </div>
                  <ul className="space-y-3 text-gray-300">
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-400 mt-2" />
                      <span><strong>Micro-investissements</strong> accessibles (2-20€)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-400 mt-2" />
                      <span><strong>Influence directe</strong> via système de votes</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-400 mt-2" />
                      <span><strong>Gains potentiels</strong> si bon choix</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-400 mt-2" />
                      <span><strong>Découverte</strong> de talents émergents</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* Call to action final */}
        <section className="container mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <Card className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border-purple-500/30 backdrop-blur-sm max-w-4xl mx-auto">
              <CardContent className="pt-8 pb-8">
                <h2 className="text-3xl font-bold text-white mb-4">
                  Prêt à révolutionner votre façon de consommer du contenu ?
                </h2>
                <p className="text-gray-300 mb-6 text-lg">
                  Rejoignez VISUAL et participez à la nouvelle économie créative
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold neon-glow"
                  >
                    <Play className="mr-2 h-5 w-5" />
                    Commencer maintenant
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="border-purple-400 text-purple-300 hover:bg-purple-500/10 px-8 py-4 text-lg font-semibold"
                  >
                    <Info className="mr-2 h-5 w-5" />
                    En savoir plus
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </section>

        {/* Footer avec disclaimer */}
        <footer className="container mx-auto px-4 py-12 border-t border-slate-800">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="bg-slate-800/30 border border-slate-700 rounded-lg p-6 backdrop-blur-sm mb-8"
          >
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-400 leading-relaxed">
                <p className="mb-2">
                  <strong className="text-gray-300">VISUAL révolutionne le streaming :</strong> 
                  Fini le téléchargement illégal ! Soutenez directement les créateurs avec des micro-investissements 
                  et partagez leurs succès. Chaque euro investi donne des votes pour influencer les classements.
                </p>
                <p>
                  <strong className="text-yellow-300">Redistribution transparente :</strong> 
                  TOP 10 = gains partagés • Arrondis à l'euro pour utilisateurs • 
                  Restes → VISUAL pour maintenir la plateforme gratuite.
                </p>
              </div>
            </div>
          </motion.div>
          
          <div className="text-center text-gray-500">
            <p className="mb-4 text-lg">
              <strong className="text-white">VISUAL</strong> - Le futur du streaming participatif
            </p>
            <p className="text-sm">
              © 2024 VISUAL Platform. Streaming + Investissement + Partage des gains.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}