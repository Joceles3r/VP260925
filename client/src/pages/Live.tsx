import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Radio, 
  Users, 
  Eye, 
  TrendingUp,
  Play,
  Pause,
  Volume2,
  Heart,
  Share2,
  MessageCircle,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEmojiSystem } from '@/hooks/useEmojiSystem';
import { useWebSocket, useLiveUpdates } from '@/hooks/useWebSocket';
import { formatCurrency } from '@shared/utils';

interface LiveShow {
  id: string;
  title: string;
  description: string;
  artistA: string;
  artistB: string;
  investmentA: number;
  investmentB: number;
  viewerCount: number;
  isActive: boolean;
  streamUrl?: string;
  thumbnailUrl: string;
  startedAt: string;
}

interface BattleInvestment {
  showId: string;
  artist: 'A' | 'B';
  amount: number;
}

export default function Live() {
  const [selectedShow, setSelectedShow] = useState<LiveShow | null>(null);
  const [selectedArtist, setSelectedArtist] = useState<'A' | 'B' | null>(null);
  const [investmentAmount, setInvestmentAmount] = useState<number>(5);
  const [isInvesting, setIsInvesting] = useState(false);
  const emoji = useEmojiSystem();
  const { isConnected, joinLiveShow, leaveLiveShow, sendLiveInvestment } = useWebSocket();
  const liveUpdates = useLiveUpdates('investment');

  // Mock live shows data
  const mockLiveShows: LiveShow[] = [
    {
      id: 'live-1',
      title: 'Battle des Réalisateurs Émergents',
      description: 'Deux jeunes réalisateurs s\'affrontent en direct avec leurs projets de court-métrage',
      artistA: 'Alex Moreau',
      artistB: 'Camille Durand',
      investmentA: 1250.50,
      investmentB: 980.25,
      viewerCount: 234,
      isActive: true,
      thumbnailUrl: 'https://images.pexels.com/photos/66134/pexels-photo-66134.jpeg?auto=compress&cs=tinysrgb&w=800',
      startedAt: new Date(Date.now() - 1800000).toISOString() // Started 30 minutes ago
    },
    {
      id: 'live-2',
      title: 'Showcase Documentaires Nature',
      description: 'Présentation de 3 documentaires sur la biodiversité avec vote du public',
      artistA: 'Marie Forestier',
      artistB: 'Jean Océan',
      investmentA: 2100.75,
      investmentB: 1890.00,
      viewerCount: 156,
      isActive: true,
      thumbnailUrl: 'https://images.pexels.com/photos/1108572/pexels-photo-1108572.jpeg?auto=compress&cs=tinysrgb&w=800',
      startedAt: new Date(Date.now() - 900000).toISOString() // Started 15 minutes ago
    },
    {
      id: 'live-3',
      title: 'Animation 3D Workshop',
      description: 'Atelier en direct sur les techniques d\'animation 3D avancées',
      artistA: 'Studio Pixel',
      artistB: 'Team Render',
      investmentA: 750.00,
      investmentB: 820.50,
      viewerCount: 89,
      isActive: false,
      thumbnailUrl: 'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=800',
      startedAt: new Date(Date.now() - 3600000).toISOString() // Ended 1 hour ago
    }
  ];

  const { data: liveShows = mockLiveShows, isLoading } = useQuery({
    queryKey: ['live-shows'],
    queryFn: async () => mockLiveShows,
    refetchInterval: 10000, // Refresh every 10 seconds
    staleTime: 5000,
  });

  const handleJoinShow = (show: LiveShow, e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    emoji.triggerLiveShowStart(x, y);
    
    setSelectedShow(show);
    if (isConnected) {
      joinLiveShow(show.id);
    }
  };

  const handleInvest = async (e: React.MouseEvent) => {
    if (!selectedShow || !selectedArtist) return;
    
    setIsInvesting(true);
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    try {
      // Simulate investment
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const investment: BattleInvestment = {
        showId: selectedShow.id,
        artist: selectedArtist,
        amount: investmentAmount
      };
      
      if (isConnected) {
        sendLiveInvestment(investment);
      }
      
      emoji.triggerInvestSuccess(x, y);
      
      // Update local state
      if (selectedArtist === 'A') {
        selectedShow.investmentA += investmentAmount;
      } else {
        selectedShow.investmentB += investmentAmount;
      }
      
    } catch (error) {
      console.error('Investment failed:', error);
    } finally {
      setIsInvesting(false);
    }
  };

  const getTimeSinceStart = (startedAt: string) => {
    const minutes = Math.floor((Date.now() - new Date(startedAt).getTime()) / 60000);
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}min`;
  };

  const getTotalInvestment = (show: LiveShow) => {
    return show.investmentA + show.investmentB;
  };

  const getWinningArtist = (show: LiveShow): 'A' | 'B' | 'tie' => {
    if (show.investmentA > show.investmentB) return 'A';
    if (show.investmentB > show.investmentA) return 'B';
    return 'tie';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <Radio className="h-8 w-8 text-red-500 live-pulse" />
            <h1 className="text-4xl font-bold text-white">Live Shows</h1>
            <Badge className="bg-red-500/90 text-white live-pulse">
              EN DIRECT
            </Badge>
          </div>
          <p className="text-gray-400">
            Participez aux battles d'artistes en temps réel et soutenez vos favoris
          </p>
        </motion.div>

        {/* Shows en direct */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {liveShows.filter(show => show.isActive).map((show, index) => {
            const totalInvestment = getTotalInvestment(show);
            const winningArtist = getWinningArtist(show);
            
            return (
              <motion.div
                key={show.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                whileHover={{ scale: 1.02 }}
              >
                <Card className="bg-slate-800/50 border-red-500/30 hover:border-red-500/50 transition-all duration-200 overflow-hidden">
                  <div className="relative">
                    <img 
                      src={show.thumbnailUrl} 
                      alt={show.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute top-2 left-2 flex gap-2">
                      <Badge className="bg-red-500/90 text-white live-pulse">
                        <Radio className="h-3 w-3 mr-1" />
                        LIVE
                      </Badge>
                      <Badge variant="secondary" className="bg-black/50 text-white">
                        <Users className="h-3 w-3 mr-1" />
                        {show.viewerCount}
                      </Badge>
                    </div>
                    <div className="absolute bottom-2 left-2 text-white">
                      <p className="text-sm opacity-80">
                        {getTimeSinceStart(show.startedAt)}
                      </p>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Button 
                        onClick={(e) => handleJoinShow(show, e)}
                        className="bg-red-500/80 hover:bg-red-600/80 backdrop-blur-sm neon-glow"
                      >
                        <Play className="h-5 w-5 mr-2" />
                        Rejoindre
                      </Button>
                    </div>
                  </div>
                  
                  <CardContent className="p-4">
                    <h3 className="text-lg font-semibold text-white mb-2">{show.title}</h3>
                    <p className="text-gray-400 text-sm mb-4">{show.description}</p>
                    
                    {/* Battle des artistes */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className={`flex items-center gap-2 ${winningArtist === 'A' ? 'text-green-400' : 'text-gray-300'}`}>
                          <div className="w-3 h-3 rounded-full bg-blue-500" />
                          <span className="font-medium">{show.artistA}</span>
                          {winningArtist === 'A' && <Zap className="h-4 w-4 text-yellow-500" />}
                        </div>
                        <span className="font-bold text-white">
                          {formatCurrency(show.investmentA)}
                        </span>
                      </div>
                      
                      <Progress 
                        value={totalInvestment > 0 ? (show.investmentA / totalInvestment) * 100 : 50} 
                        className="h-2"
                      />
                      
                      <div className="flex items-center justify-between">
                        <div className={`flex items-center gap-2 ${winningArtist === 'B' ? 'text-green-400' : 'text-gray-300'}`}>
                          <div className="w-3 h-3 rounded-full bg-purple-500" />
                          <span className="font-medium">{show.artistB}</span>
                          {winningArtist === 'B' && <Zap className="h-4 w-4 text-yellow-500" />}
                        </div>
                        <span className="font-bold text-white">
                          {formatCurrency(show.investmentB)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Shows terminés */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Shows Récents</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {liveShows.filter(show => !show.isActive).map((show, index) => {
              const winningArtist = getWinningArtist(show);
              
              return (
                <motion.div
                  key={show.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Card className="bg-slate-800/30 border-slate-700 opacity-75">
                    <div className="relative">
                      <img 
                        src={show.thumbnailUrl} 
                        alt={show.title}
                        className="w-full h-32 object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40" />
                      <div className="absolute top-2 left-2">
                        <Badge variant="secondary" className="bg-gray-600 text-white">
                          TERMINÉ
                        </Badge>
                      </div>
                    </div>
                    
                    <CardContent className="p-3">
                      <h4 className="font-semibold text-white mb-1 text-sm">{show.title}</h4>
                      <div className="text-xs text-gray-400 space-y-1">
                        <div className="flex justify-between">
                          <span>{show.artistA}</span>
                          <span className={winningArtist === 'A' ? 'text-green-400 font-semibold' : ''}>
                            {formatCurrency(show.investmentA)}
                            {winningArtist === 'A' && ' 🏆'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>{show.artistB}</span>
                          <span className={winningArtist === 'B' ? 'text-green-400 font-semibold' : ''}>
                            {formatCurrency(show.investmentB)}
                            {winningArtist === 'B' && ' 🏆'}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* État vide si aucun show */}
        {liveShows.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="text-6xl mb-4">📺</div>
            <h3 className="text-xl font-semibold text-white mb-2">Aucun show en direct</h3>
            <p className="text-gray-400 mb-6">
              Les battles d'artistes reprennent bientôt. Revenez plus tard !
            </p>
            <Button 
              onClick={() => window.location.href = '/projects'}
              className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700"
            >
              Découvrir les projets
            </Button>
          </motion.div>
        )}
      </div>

      {/* Modal de show sélectionné */}
      <AnimatePresence>
        {selectedShow && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedShow(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-slate-800 border border-slate-700 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">{selectedShow.title}</h2>
                    <p className="text-gray-400">{selectedShow.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {selectedShow.viewerCount} spectateurs
                      </span>
                      <span className="flex items-center gap-1">
                        <Radio className="h-4 w-4 text-red-500" />
                        En direct depuis {getTimeSinceStart(selectedShow.startedAt)}
                      </span>
                    </div>
                  </div>
                  <Button variant="ghost" onClick={() => setSelectedShow(null)} className="text-gray-400 hover:text-white">
                    ✕
                  </Button>
                </div>
              </div>

              <div className="p-6">
                {/* Battle interface */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Artiste A */}
                  <Card 
                    className={`cursor-pointer transition-all duration-200 ${
                      selectedArtist === 'A' 
                        ? 'border-blue-500 bg-blue-500/10' 
                        : 'border-slate-700 hover:border-blue-400'
                    }`}
                    onClick={() => setSelectedArtist('A')}
                  >
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center mx-auto mb-3">
                          <span className="text-2xl font-bold text-white">A</span>
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">{selectedShow.artistA}</h3>
                        <div className="text-2xl font-bold text-blue-400 mb-2">
                          {formatCurrency(selectedShow.investmentA)}
                        </div>
                        <div className="text-sm text-gray-400">
                          {((selectedShow.investmentA / getTotalInvestment(selectedShow)) * 100).toFixed(1)}% des votes
                        </div>
                        {getWinningArtist(selectedShow) === 'A' && (
                          <Badge className="mt-2 bg-green-500/90 text-white">
                            🏆 En tête
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Artiste B */}
                  <Card 
                    className={`cursor-pointer transition-all duration-200 ${
                      selectedArtist === 'B' 
                        ? 'border-purple-500 bg-purple-500/10' 
                        : 'border-slate-700 hover:border-purple-400'
                    }`}
                    onClick={() => setSelectedArtist('B')}
                  >
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-purple-500 flex items-center justify-center mx-auto mb-3">
                          <span className="text-2xl font-bold text-white">B</span>
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">{selectedShow.artistB}</h3>
                        <div className="text-2xl font-bold text-purple-400 mb-2">
                          {formatCurrency(selectedShow.investmentB)}
                        </div>
                        <div className="text-sm text-gray-400">
                          {((selectedShow.investmentB / getTotalInvestment(selectedShow)) * 100).toFixed(1)}% des votes
                        </div>
                        {getWinningArtist(selectedShow) === 'B' && (
                          <Badge className="mt-2 bg-green-500/90 text-white">
                            🏆 En tête
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Interface d'investissement */}
                {selectedArtist && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-4 rounded-lg bg-slate-900/50 border border-slate-700"
                  >
                    <h4 className="text-lg font-semibold text-white mb-4">
                      Soutenir {selectedArtist === 'A' ? selectedShow.artistA : selectedShow.artistB}
                    </h4>
                    
                    <div className="grid grid-cols-5 gap-2 mb-4">
                      {[2, 5, 10, 15, 20].map((amount) => (
                        <Button
                          key={amount}
                          variant={investmentAmount === amount ? "default" : "outline"}
                          size="sm"
                          onClick={() => setInvestmentAmount(amount)}
                          className={`${
                            investmentAmount === amount 
                              ? 'bg-gradient-to-r from-red-500 to-pink-600 neon-glow' 
                              : 'border-slate-600 text-gray-300 hover:bg-slate-700'
                          }`}
                        >
                          {amount}€
                        </Button>
                      ))}
                    </div>

                    <Button 
                      onClick={handleInvest}
                      disabled={isInvesting}
                      className="w-full bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 hover:neon-glow"
                    >
                      {isInvesting ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Investissement...
                        </div>
                      ) : (
                        <>
                          <TrendingUp className="h-4 w-4 mr-2" />
                          Investir {investmentAmount}€
                        </>
                      )}
                    </Button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}