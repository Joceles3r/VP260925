import React from 'react';

const LoadingScreen = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
        <h1 className="text-4xl font-bold text-white mb-2">VISUAL</h1>
        <p className="text-white/70">Chargement de la plateforme...</p>
      </div>
    </div>
  );
};

export default LoadingScreen;