import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, TrendingUp, Users, Shield, ArrowRight } from 'lucide-react';

const Landing = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleGetStarted = () => {
    setIsLoading(true);
    // Simulate login process
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <h1 className="text-4xl tracking-tight font-extrabold text-white sm:text-5xl md:text-6xl">
                  <span className="block xl:inline">Investissez dans</span>{' '}
                  <span className="block text-purple-400 xl:inline">l'avenir créatif</span>
                </h1>
                <p className="mt-3 text-base text-gray-300 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  VISUAL révolutionne l'investissement dans les contenus visuels. 
                  Soutenez des créateurs talentueux avec des micro-investissements et 
                  participez au succès des projets du futur.
                </p>
                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                  <div className="rounded-md shadow">
                    <Button
                      size="lg"
                      onClick={handleGetStarted}
                      disabled={isLoading}
                      className="w-full flex items-center justify-center px-8 py-3 text-base font-medium bg-purple-600 hover:bg-purple-700"
                    >
                      {isLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      ) : (
                        <Play className="mr-2 h-4 w-4" />
                      )}
                      Commencer maintenant
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-12 bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-purple-400 font-semibold tracking-wide uppercase">
              Fonctionnalités
            </h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-white sm:text-4xl">
              Une plateforme révolutionnaire
            </p>
          </div>

          <div className="mt-10">
            <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
              <Card className="bg-white/10 backdrop-blur border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center text-white">
                    <TrendingUp className="h-6 w-6 mr-2 text-purple-400" />
                    Micro-investissements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-300">
                    Investissez de 1€ à 20€ par projet avec des calculs de ROI automatiques 
                    et un suivi en temps réel de vos performances.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center text-white">
                    <Users className="h-6 w-6 mr-2 text-purple-400" />
                    Communauté active
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-300">
                    Votez pour vos projets préférés, participez aux discussions 
                    et influencez les classements de la plateforme.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center text-white">
                    <Play className="h-6 w-6 mr-2 text-purple-400" />
                    Shows en direct
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-300">
                    Assistez aux battles d'artistes en temps réel et investissez 
                    pendant les performances live.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center text-white">
                    <Shield className="h-6 w-6 mr-2 text-purple-400" />
                    Conformité AMF
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-300">
                    Plateforme sécurisée avec rapports automatiques et 
                    audit trail complet pour votre tranquillité d'esprit.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-purple-800/20 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="text-4xl font-extrabold text-white">500K+</div>
              <div className="text-purple-400">Investisseurs actifs</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-extrabold text-white">2.5M€</div>
              <div className="text-purple-400">Investis à ce jour</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-extrabold text-white">1,200</div>
              <div className="text-purple-400">Projets financés</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-extrabold text-white">8.5%</div>
              <div className="text-purple-400">ROI moyen</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;