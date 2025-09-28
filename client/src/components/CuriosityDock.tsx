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
  Eye,
  Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useEmojiSystem } from '@/hooks/useEmojiSystem';

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
  const emoji = useEmojiSystem();

  const handleGoLive = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    emoji.triggerLiveShowStart(x, y);
    onGoLive();
  };

  const handleTop10 = (e: React.MouseEvent) => {
    if (!stats.topActive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    emoji.triggerCategoryOpen('films', x, y); // Assume films for demo
    onTop10();
  };

  const handleNew = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    emoji.triggerAnnouncement(x, y);
    onNew();
  };

  const handleRandom = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    emoji.trigger('invest_success', { x, y });
    onRandom();
  };

  const handleQuest = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    emoji.trigger('purchase_success', { x, y });
    onQuest();
  };

  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed inset-x-0 bottom-4 z-50 mx-auto max-w-6xl px-4"
    >
      <div className="mx-auto rounded-2xl shadow-2xl bg-slate-800/90 backdrop-blur-md border border-slate-700/50">
        <div className="flex items-center justify-between px-6 py-3 gap-3">
          {/* En Direct */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
            variant="ghost"
            size="sm"
            onClick={handleGoLive}
            className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-red-500/10 transition-all duration-200 text-white live-pulse"
            >
            <div className="flex items-center gap-2">
              <div className="relative">
                <Radio className="h-4 w-4 text-red-500" />
                <motion.div 
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500"
                />
              </div>
              <span className="text-sm font-medium text-white">En direct</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Users className="h-3 w-3" />
              <span>{stats.liveViewers}</span>
              <span>•</span>
              <span>{stats.liveShows} lives</span>
            </div>
            </Button>
          </motion.div>

          {/* TOP 10 */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
            variant="ghost"
            size="sm"
            onClick={handleTop10}
            disabled={!stats.topActive}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 ${
              stats.topActive 
                ? 'hover:bg-amber-500/10 text-white' 
                : 'opacity-40 cursor-not-allowed'
            }`}
            >
            <Trophy className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium text-white">TOP 10</span>
            {stats.topActive && (
              <Badge variant="secondary" className="text-xs bg-amber-500/20 text-amber-300 border-amber-500/30">
                <Zap className="h-3 w-3" />
              </Badge>
            )}
            </Button>
          </motion.div>

          {/* Nouveau */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
            variant="ghost"
            size="sm"
            onClick={handleNew}
            className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-blue-500/10 transition-all duration-200 text-white"
            >
            <Sparkles className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium text-white">Nouveau</span>
            {stats.newCount > 0 && (
              <Badge variant="secondary" className="text-xs bg-blue-500/20 text-blue-300 border-blue-500/30">
                +{stats.newCount}
              </Badge>
            )}
            </Button>
          </motion.div>

          {/* Surprends-moi */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
            size="sm"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = rect.left + rect.width / 2;
              const y = rect.top + rect.height / 2;
              emoji.triggerSurprise(x, y);
              onRandom();
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl neon-glow"
            >
            <Shuffle className="h-4 w-4" />
            <span className="text-sm font-semibold">Surprends-moi</span>
            </Button>
          </motion.div>

          {/* Surprise du jour */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = rect.left + rect.width / 2;
              const y = rect.top + rect.height / 2;
              emoji.triggerSurprise(x, y);
              onQuest();
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30 text-amber-300 hover:from-amber-500/20 hover:to-orange-500/20 transition-all duration-200"
            >
            <Gift className="h-4 w-4" />
            <span className="text-sm font-medium">🎁 Surprise du jour</span>
            <Badge variant="secondary" className="text-xs bg-amber-500/20 text-amber-300 border-amber-500/30">
              +20 VP
            </Badge>
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}