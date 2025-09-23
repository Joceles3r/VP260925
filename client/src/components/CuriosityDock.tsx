import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";

interface CuriosityStats {
  liveViewers: number;
  activeLives: number;
  newProjectsCount: number;
  topCategoryActive: boolean;
  todayQuestCompleted: boolean;
}

interface CuriosityDockProps {
  stats?: CuriosityStats;
  onGoLive?: () => void;
  onTop10?: () => void;
  onNew?: () => void;
  onRandom?: () => void;
  onQuest?: () => void;
}

export default function CuriosityDock({
  stats,
  onGoLive,
  onTop10,
  onNew,
  onRandom,
  onQuest,
}: CuriosityDockProps) {
  const [, setLocation] = useLocation();
  
  // Récupérer les stats en temps réel
  const { data: liveStats } = useQuery({
    queryKey: ['/api/curiosity/stats'],
    refetchInterval: 30000, // Refresh toutes les 30 secondes
    staleTime: 20000,
  });

  const defaultStats: CuriosityStats = {
    liveViewers: 0,
    activeLives: 0,
    newProjectsCount: 0,
    topCategoryActive: true,
    todayQuestCompleted: false
  };

  const finalStats: CuriosityStats = {
    ...defaultStats,
    ...(stats || {}),
    ...(liveStats || {})
  };

  const handleGoLive = () => {
    if (onGoLive) {
      onGoLive();
    } else {
      setLocation('/live');
    }
  };

  const handleTop10 = () => {
    if (!finalStats.topCategoryActive) return;
    
    if (onTop10) {
      onTop10();
    } else {
      setLocation('/top10');
    }
  };

  const handleNew = () => {
    if (onNew) {
      onNew();
    } else {
      setLocation('/projects?filter=new');
    }
  };

  const handleRandom = async () => {
    if (onRandom) {
      onRandom();
    } else {
      try {
        const response = await fetch('/api/projects/random');
        const data = await response.json();
        if (data.projectId) {
          // Navigate to projects page with the random project as a highlight
          setLocation(`/projects?highlight=${data.projectId}`);
        } else {
          // Fallback to general projects page
          setLocation('/projects');
        }
      } catch (error) {
        console.error('Erreur lors de la récupération du projet aléatoire:', error);
        // Fallback to general projects page on error
        setLocation('/projects');
      }
    }
  };

  const handleQuest = () => {
    if (onQuest) {
      onQuest();
    } else {
      setLocation('/fidelity?tab=quest');
    }
  };

  // Masquer le dock sur certaines pages (admin, KYC, etc.)
  const [currentLocation] = useLocation();
  const hiddenPaths = ['/admin', '/kyc'];
  const shouldHide = hiddenPaths.some(path => currentLocation.startsWith(path));

  if (shouldHide) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-3 z-40 mx-auto max-w-5xl px-3" data-testid="curiosity-dock">
      <div className="rounded-2xl shadow-xl bg-white/90 dark:bg-gray-900/90 backdrop-blur border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-4 py-2 gap-2 overflow-x-auto">
          {/* En Direct */}
          <button 
            onClick={handleGoLive}
            className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
            data-testid="button-live"
          >
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">En direct</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {finalStats.liveViewers} spectateurs · {finalStats.activeLives} lives
            </span>
          </button>

          {/* Top 10 */}
          <button 
            onClick={handleTop10}
            disabled={!finalStats.topCategoryActive}
            className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors flex-shrink-0 ${
              finalStats.topCategoryActive 
                ? "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100" 
                : "opacity-40 cursor-not-allowed text-gray-400"
            }`}
            data-testid="button-top10"
          >
            Top 10 🔥
          </button>

          {/* Nouveau */}
          <button 
            onClick={handleNew}
            className="px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-medium transition-colors flex-shrink-0 text-gray-900 dark:text-gray-100"
            data-testid="button-new"
          >
            Nouveau{' '}
            <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
              +{finalStats.newProjectsCount}
            </span>
          </button>

          {/* Surprends-moi */}
          <button 
            onClick={handleRandom}
            className="px-3 py-2 rounded-xl bg-black dark:bg-white text-white dark:text-black text-sm font-semibold hover:opacity-90 transition-opacity flex-shrink-0"
            data-testid="button-random"
          >
            Surprends-moi
          </button>

          {/* Surprise du jour */}
          <button 
            onClick={handleQuest}
            disabled={finalStats.todayQuestCompleted}
            className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors flex-shrink-0 ${
              finalStats.todayQuestCompleted
                ? "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
                : "bg-amber-100 dark:bg-amber-900 text-amber-900 dark:text-amber-100 hover:bg-amber-200 dark:hover:bg-amber-800"
            }`}
            data-testid="button-quest"
          >
            🎁 {finalStats.todayQuestCompleted ? "Terminé !" : "Surprise du jour · +20 VISUpoints"}
          </button>
        </div>
      </div>
    </div>
  );
}