import React from 'react';
import { useQuery } from '@tanstack/react-query';
import LiveStream from '@/components/LiveStream';

export default function Live() {
  const { data: liveShows } = useQuery({
    queryKey: ['/api/live-shows'],
    refetchInterval: 5000, // Refresh every 5 seconds for live data
  });

  const activeLiveShow = (liveShows as any[])?.[0]; // Get the first active live show

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="live-page">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-foreground" data-testid="live-title">
          Live Shows & Battles
        </h2>
        
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-foreground">EN DIRECT</span>
        </div>
      </div>

      {activeLiveShow ? (
        <LiveStream
          showId={activeLiveShow.id}
          title={activeLiveShow.title}
          artistA={activeLiveShow.artistA || 'Emma Rodriguez'}
          artistB={activeLiveShow.artistB || 'Marcus Chen'}
          investmentA={activeLiveShow.investmentA}
          investmentB={activeLiveShow.investmentB}
          viewerCount={activeLiveShow.viewerCount}
        />
      ) : (
        <div className="bg-card rounded-lg border border-border p-12 text-center" data-testid="no-live-shows">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-0 h-0 border-l-[16px] border-l-muted-foreground border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent ml-1" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">Aucun Live Show Actif</h3>
          <p className="text-muted-foreground mb-6">
            Il n'y a actuellement aucun live show en cours. Les prochains événements seront annoncés bientôt.
          </p>
          
          {/* Upcoming Shows Preview */}
          <div className="bg-muted/30 rounded-lg p-6 max-w-md mx-auto">
            <h4 className="font-semibold text-foreground mb-3">Prochains Shows</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Battle Talents #15:</span>
                <span className="text-foreground">Demain 20h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Showcase Nouveaux Artistes:</span>
                <span className="text-foreground">Vendredi 21h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Grand Final de Saison:</span>
                <span className="text-foreground">Dimanche 19h</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live Show Rules */}
      <div className="mt-8 bg-card rounded-lg border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Comment Participer aux Live Shows</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-foreground mb-2">Règles d'Investissement</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Investissement en temps réel de **2–20 €**</li>
              <li>• Choix entre les deux artistes en compétition</li>
              <li>• Commission réduite à 10% pour les live shows</li>
              <li>• Redistribution immédiate après la battle</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-foreground mb-2">Redistribution des Gains</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• 40% pour l'artiste gagnant</li>
              <li>• 30% pour les investisseurs gagnants (TOP 10)</li>
              <li>• 20% pour l'artiste perdant</li>
              <li>• 10% pour les investisseurs perdants</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
