import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Radio, 
  Trophy, 
  Sparkles, 
  Shuffle, 
  Gift,
  Users,
  Eye
} from 'lucide-react';

interface CuriosityDockProps {
  stats?: {
    liveViewers: number;
    liveShows: number;
    newCount: number;
    topActive: boolean;
  };
  onGoLive: () => void;
  onTop10: () => void;
  onNew: () => void;
  onRandom: () => void;
  onQuest: () => void;
}

export default function CuriosityDock({
  stats = { liveViewers: 0, liveShows: 0, newCount: 0, topActive: true },
  onGoLive,
  onTop10,
  onNew,
  onRandom,
  onQuest,
}: CuriosityDockProps) {
  return (
    <div className="fixed inset-x-0 bottom-4 z-50 mx-auto max-w-6xl px-4">
      <div className="mx-auto rounded-2xl shadow-2xl bg-white/90 backdrop-blur-md border border-gray-200/50 dark:bg-gray-900/90 dark:border-gray-700/50">
        <div className="flex items-center justify-between px-6 py-3 gap-3">
          {/* En Direct */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onGoLive}
            className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-200"
          >
            <div className="flex items-center gap-2">
              <div className="relative">
                <Radio className="h-4 w-4 text-red-500" />
                <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              </div>
              <span className="text-sm font-medium">En direct</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <Users className="h-3 w-3" />
              <span>{stats.liveViewers}</span>
              <span>•</span>
              <span>{stats.liveShows} lives</span>
            </div>
          </Button>

          {/* TOP 10 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onTop10}
            disabled={!stats.topActive}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 ${
              stats.topActive 
                ? 'hover:bg-amber-50 dark:hover:bg-amber-950/20' 
                : 'opacity-40 cursor-not-allowed'
            }`}
          >
            <Trophy className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium">TOP 10</span>
            {stats.topActive && (
              <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                🔥
              </Badge>
            )}
          </Button>

          {/* Nouveau */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onNew}
            className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all duration-200"
          >
            <Sparkles className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium">Nouveau</span>
            {stats.newCount > 0 && (
              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                +{stats.newCount}
              </Badge>
            )}
          </Button>

          {/* Surprends-moi */}
          <Button
            size="sm"
            onClick={onRandom}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Shuffle className="h-4 w-4" />
            <span className="text-sm font-semibold">Surprends-moi</span>
          </Button>

          {/* Surprise du jour */}
          <Button
            variant="outline"
            size="sm"
            onClick={onQuest}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 text-amber-900 hover:from-amber-100 hover:to-orange-100 dark:from-amber-950/20 dark:to-orange-950/20 dark:border-amber-800 dark:text-amber-200 transition-all duration-200"
          >
            <Gift className="h-4 w-4" />
            <span className="text-sm font-medium">🎁 Surprise du jour</span>
            <Badge variant="secondary" className="text-xs bg-amber-200 text-amber-800 dark:bg-amber-800 dark:text-amber-200">
              +20 VP
            </Badge>
          </Button>
        </div>
      </div>
    </div>
  );
}