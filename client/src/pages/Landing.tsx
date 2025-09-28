import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  Info
} from 'lucide-react';
import { motion } from 'framer-motion';

// Mock data pour les catégories
const categories = [
  {
    id: 'films',
    title: 'Films / Vidéos / Documentaires',
    description: 'Investissements 2–20 € • Prix porteur 2/3/4/5/10 €',
    icon: Film,
    color: 'from-blue-500 to-cyan-400',
    glowColor: 'shadow-blue-500/20',
    visible: true
  },
  {
    id: 'voix_info',
    title: 'Les Voix de l\'Info',
    description: 'Articles • Micro-prix 0,20–5 € • 70% créateur / 30% VISUAL',
    icon: Newspaper,
    color: 'from-purple-500 to-violet-400',
    glowColor: 'shadow-purple-500/20',
    visible: true
  },
  {
    id: 'live_show',
    title: 'Visual Studio Live Show',
    description: 'Présentations live • Investissements temps réel',
    icon: Radio,
    color: 'from-pink-500 to-rose-400',
    glowColor: 'shadow-pink-500/20',
    visible: true
  },
  {
    id: 'livres',
    title: 'Livres',
    description: 'Ebooks • Prix auteur 2/3/4/5/8 € • Tranches lecteur 2–20 €',
    icon: BookOpen,
    color: 'from-green-500 to-emerald-400',
    glowColor: 'shadow-green-500/20',
    visible: true
  },
  {
    id: 'petites_annonces',
    title: 'Petites Annonces',
    description: 'Hors compétition • Options payantes',
    icon: MessageSquare,
    color: 'from-orange-500 to-amber-400',
    glowColor: 'shadow-orange-500/20',
    visible: true
  }
];

// Mock projets populaires
const featuredProjects = [
  {
    id: '1',
    title: 'Documentaire sur l\'IA',
    creator: 'Marie Dubois',
    category: 'Documentaire',
    thumbnail: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=800',
    price: 5,
    votes: 156,
    trending: true,
    description: 'Une exploration fascinante de l\'intelligence artificielle'
  },
  {
    id: '2',
    title: 'Court-métrage Animation',
    creator: 'Thomas Martin',
    category: 'Animation',
    thumbnail: 'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=800',
    price: 8,
    votes: 203,
    topTen: true,
    description: 'Une histoire touchante en animation 3D'
  },
  {
    id: '3',
    title: 'Guide du Réalisateur',
    creator: 'Sophie Leroy',
    category: 'Livre',
    thumbnail: 'https://images.pexels.com/photos/1029141/pexels-photo-1029141.jpeg?auto=compress&cs=tinysrgb&w=800',
    price: 4,
    votes: 89,
    isNew: true,
    description: 'Techniques avancées de réalisation'
  }
];

export default function Landing() {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      <div className="relative z-10">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              VISUAL
            </h1>
            <p className="text-2xl md:text-3xl text-gray-300 mb-4 font-light">
              Streaming + Investissement créatif
            </p>
            <p className="text-xl text-blue-300 mb-12 font-medium">
              Regarde. Soutiens. Partage la réussite.
            </p>
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
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-blue-500/25 transition-all duration-200"
            >
              <Play className="mr-2 h-5 w-5" />
              Découvrir les projets
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="border-purple-400 text-purple-300 hover:bg-purple-500/10 px-8 py-4 text-lg font-semibold"
            >
              Comment ça marche ?
            </Button>
          </motion.div>
        </section>

        {/* Categories Grid */}
        <section className="container mx-auto px-4 py-16">
          <motion.h2 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-bold text-center mb-12 text-white"
          >
            Explorez nos catégories
          </motion.h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {categories.map((category, index) => {
              const Icon = category.icon;
              return (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  onHoverStart={() => setHoveredCategory(category.id)}
                  onHoverEnd={() => setHoveredCategory(null)}
                >
                  <Card className={`bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-all duration-200 backdrop-blur-sm ${category.glowColor} hover:shadow-2xl`}>
                    <CardHeader className="pb-4">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${category.color} flex items-center justify-center mb-4`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <CardTitle className="text-xl text-white mb-2">{category.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-400 mb-4 text-sm leading-relaxed">
                        {category.description}
                      </p>
                      <Button 
                        className={`w-full bg-gradient-to-r ${category.color} hover:opacity-90 text-white font-semibold transition-all duration-200`}
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

        {/* How it works */}
        <section className="container mx-auto px-4 py-16">
          <motion.h2 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-bold text-center mb-12 text-white"
          >
            Comment ça marche ?
          </motion.h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {[
              {
                step: '1',
                title: 'Regarde un extrait',
                description: 'Découvre le contenu gratuitement, puis paie un petit montant pour voir l\'œuvre complète',
                icon: Eye,
                color: 'from-blue-500 to-cyan-400'
              },
              {
                step: '2',
                title: 'Investis une petite somme',
                description: 'Soutiens les créateurs avec 0,20–20 € selon la catégorie et gagne des votes',
                icon: TrendingUp,
                color: 'from-purple-500 to-violet-400'
              },
              {
                step: '3',
                title: 'Partage la réussite',
                description: 'Gagne potentiellement si ton projet sélectionné termine dans le TOP selon les règles',
                icon: Star,
                color: 'from-pink-500 to-rose-400'
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="text-center"
              >
                <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${item.color} flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                  <item.icon className="h-8 w-8 text-white" />
                </div>
                <div className={`text-2xl font-bold mb-2 bg-gradient-to-r ${item.color} bg-clip-text text-transparent`}>
                  Étape {item.step}
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                <p className="text-gray-400 leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>

          <div className="text-center">
            <Button 
              variant="outline"
              onClick={() => setShowDisclaimer(true)}
              className="border-gray-600 text-gray-300 hover:bg-gray-800/50"
            >
              <Info className="mr-2 h-4 w-4" />
              En savoir plus sur les règles
            </Button>
          </div>
        </section>

        {/* Featured Projects */}
        <section className="container mx-auto px-4 py-16">
          <motion.h2 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-bold text-center mb-12 text-white"
          >
            Projets en vedette
          </motion.h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredProjects.map((project, index) => (
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
                          TOP 10
                        </Badge>
                      )}
                      {project.isNew && (
                        <Badge className="bg-green-500/90 text-white">
                          Nouveau
                        </Badge>
                      )}
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                      <Play className="h-12 w-12 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    </div>
                  </div>
                  
                  <CardContent className="p-4">
                    <h3 className="text-lg font-semibold text-white mb-1">{project.title}</h3>
                    <p className="text-gray-400 text-sm mb-2">par {project.creator}</p>
                    <p className="text-gray-500 text-sm mb-3">{project.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {project.votes}
                        </span>
                        <span className="text-blue-400 font-semibold">{project.price}€</span>
                      </div>
                      <Button size="sm" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                        Voir
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Legal Banner */}
        <section className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="bg-slate-800/30 border border-slate-700 rounded-lg p-6 backdrop-blur-sm"
          >
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-400 leading-relaxed">
                <p className="mb-2">
                  <strong className="text-gray-300">Avertissement :</strong> Les investissements comportent des risques. 
                  Aucune promesse de gains n'est garantie. Les redistributions sont arrondies à l\'euro inférieur pour les utilisateurs, 
                  les restes reviennent à VISUAL.
                </p>
                <p>
                  Partage des revenus : 70% créateur / 30% VISUAL sur les ventes d'articles. 
                  23% VISUAL sur les événements de catégorie.
                </p>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="container mx-auto px-4 py-12 border-t border-slate-800">
          <div className="text-center text-gray-500">
            <p className="mb-4">
              VISUAL combine streaming et micro-investissement : regarde, soutiens les créateurs, 
              et partage les résultats selon les règles de chaque catégorie.
            </p>
            <p className="text-sm">
              © 2024 VISUAL Platform. Tous droits réservés.
            </p>
          </div>
        </footer>
      </div>

      {/* Disclaimer Modal */}
      {showDisclaimer && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowDisclaimer(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-slate-800 border border-slate-700 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold text-white mb-4">Règles et Conditions</h3>
            <div className="text-gray-300 space-y-4 text-sm leading-relaxed">
              <p>
                <strong>Risques d'investissement :</strong> Tout investissement comporte des risques de perte. 
                Les performances passées ne préjugent pas des performances futures.
              </p>
              <p>
                <strong>Répartition des revenus :</strong>
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Articles (Voix de l'Info) : 70% créateur / 30% VISUAL</li>
                <li>Événements de catégorie : 23% VISUAL sur redistributions</li>
                <li>Arrondis à l'euro inférieur pour utilisateurs, restes → VISUAL</li>
              </ul>
              <p>
                <strong>Système de votes :</strong> Les investissements donnent des votes selon un barème défini. 
                Plus vous investissez, plus vous avez d'influence sur le classement.
              </p>
              <p>
                <strong>Conditions générales :</strong> En utilisant VISUAL, vous acceptez nos conditions d'utilisation 
                et notre politique de confidentialité.
              </p>
            </div>
            <div className="mt-6 flex justify-end">
              <Button 
                onClick={() => setShowDisclaimer(false)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                J'ai compris
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}