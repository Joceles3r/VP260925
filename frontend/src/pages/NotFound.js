import React from 'react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { Home, ArrowLeft, Search } from 'lucide-react';

const NotFound = () => {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center px-4">
      <div className="text-center max-w-md w-full">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-white/20 mb-4">404</h1>
          <h2 className="text-3xl font-bold text-white mb-4">
            Page non trouvée
          </h2>
          <p className="text-gray-300 mb-8">
            Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
          </p>
        </div>

        <div className="space-y-4">
          <Button
            onClick={() => navigate('/')}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            size="lg"
          >
            <Home className="mr-2 h-5 w-5" />
            Retour à l'accueil
          </Button>
          
          <Button
            onClick={() => window.history.back()}
            variant="outline"
            className="w-full border-white text-white hover:bg-white hover:text-purple-900"
            size="lg"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Page précédente
          </Button>
          
          <Button
            onClick={() => navigate('/projects')}
            variant="ghost"
            className="w-full text-white hover:bg-white/10"
            size="lg"
          >
            <Search className="mr-2 h-5 w-5" />
            Explorer les projets
          </Button>
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-400 text-sm">
            Ou contactez notre{' '}
            <a href="#" className="text-purple-400 hover:text-purple-300 underline">
              support client
            </a>{' '}
            pour obtenir de l'aide
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;