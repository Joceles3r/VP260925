import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

interface CuriosityStats {
  liveViewers: number;
  liveShows: number;
  newCount: number;
  topActive: boolean;
}

export function useCuriosityDock() {
  const [stats, setStats] = useState<CuriosityStats>({
    liveViewers: 0,
    liveShows: 0,
    newCount: 0,
    topActive: true,
  });

  // Mock real-time stats - would be replaced with WebSocket or polling
  const { data: liveStats } = useQuery({
    queryKey: ['curiosity-stats'],
    queryFn: async () => {
      // Simulate API call
      return {
        liveViewers: Math.floor(Math.random() * 100) + 20,
        liveShows: Math.floor(Math.random() * 8) + 2,
        newCount: Math.floor(Math.random() * 15) + 5,
        topActive: Math.random() > 0.2, // 80% chance of being active
      };
    },
    refetchInterval: 30000, // Update every 30 seconds
    staleTime: 25000,
  });

  useEffect(() => {
    if (liveStats) {
      setStats(liveStats);
    }
  }, [liveStats]);

  const actions = {
    goLive: () => {
      // Navigate to live shows
      window.location.href = '/live';
    },
    
    showTop10: () => {
      // Navigate to current category TOP 10
      window.location.href = '/projects?filter=top10';
    },
    
    showNew: () => {
      // Navigate to newest projects
      window.location.href = '/projects?sort=recent';
    },
    
    showRandom: () => {
      // Navigate to random quality project
      window.location.href = '/projects?random=true';
    },
    
    showQuest: () => {
      // Show daily quest modal or navigate to quests
      console.log('Show daily quest');
      // This would open a modal or navigate to quest page
    },
  };

  return {
    stats,
    actions,
  };
}