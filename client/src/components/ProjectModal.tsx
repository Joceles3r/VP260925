import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, TrendingUp, Heart, Share2, Info, X, Users, Eye } from 'lucide-react';
import { useEmojiSystem } from '@/hooks/useEmojiSystem';
import { useToast } from '@/hooks/use-toast';
import { VISUAL_CONSTANTS } from '@shared/visual-constants';

interface ProjectModalProps {
  project: any;
  isOpen: boolean;
  onClose: () => void;
}

// Mapping votes selon les montants d'investissement
const getVotesFromAmount = (amount: number): number => {
  const mapping = VISUAL_CONSTANTS.votesMapping;
  return mapping[amount.toString() as keyof typeof mapping] || 1;
};

export default function ProjectModal({ project, isOpen, onClose }: ProjectModalProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [isInvesting, setIsInvesting] = useState(false);
  const emoji = useEmojiSystem();
  const { toast } = useToast();

  if (!isOpen || !project) return null;

  const handleInvest = async (e: React.MouseEvent) => {
    if (!selectedAmount) return;
    
    setIsInvesting(true);
    
    // Trigger emoji burst at button location
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Success animation
      emoji.triggerInvestSuccess(x, y);
      
      // Show success toast
      toast({
        title: "Investissement réussi ! 🎉",
        description: `Vous avez investi ${selectedAmount}€ et obtenu ${getVotesFromAmount(selectedAmount)} votes`,
      });
      
      // Close modal after success
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (error) {
      toast({
        title: "Erreur d'investissement",
        description: "Une erreur est survenue. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsInvesting(false);
    }
  };

  const handleWatch = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    emoji.triggerPurchaseSuccess(x, y);
    
    toast({
      title: "Accès débloqué ! 🎬",
      description: `Vous pouvez maintenant regarder "${project.title}" en entier`,
    });
  };

  const handleFollow = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    emoji.triggerFollowCreator(x, y);
    
    toast({
      title: "Créateur suivi ! ⭐",
      description: `Vous suivez maintenant ${project.creator}`,
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
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
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">{project.title}</h2>
                <p className="text-gray-400">par {project.creator}</p>
                <div className="flex items-center gap-2 mt-2">
                  {project.trending && (
                    <Badge className="bg-red-500/90 text-white">Tendance</Badge>
                  )}
                  {project.topTen && (
                    <Badge className="bg-yellow-500/90 text-black">TOP 10</Badge>
                  )}
                  {project.isNew && (
                    <Badge className="bg-green-500/90 text-white">Nouveau</Badge>
                  )}
                </div>
              </div>
              <Button variant="ghost" onClick={onClose} className="text-gray-400 hover:text-white">
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            {/* Visuel */}
            <div>
              <div className="aspect-video bg-slate-900 rounded-lg overflow-hidden mb-4 relative group">
                <img 
                  src={project.thumbnail} 
                  alt={project.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <Button 
                    onClick={handleWatch}
                    className="bg-white/20 backdrop-blur-sm hover:bg-white/30 neon-glow"
                  >
                    <Play className="h-6 w-6 mr-2" />
                    Voir l'extrait
                  </Button>
                </div>
              </div>
              
              <div className="text-sm text-gray-400 mb-4">
                {project.description}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-slate-900/50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-blue-400">{project.votes}</div>
                  <div className="text-sm text-gray-400">Votes</div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-purple-400">{project.investors}</div>
                  <div className="text-sm text-gray-400">Investisseurs</div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-green-400">{project.amountRaised}€</div>
                  <div className="text-sm text-gray-400">Collecté</div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-pink-400">{project.engagementCoeff}</div>
                  <div className="text-sm text-gray-400">Coeff. engagement</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3">Regarder en entier</h3>
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Play className="h-4 w-4 text-blue-400" />
                    <span className="text-sm font-semibold text-blue-300">Principe VISUAL</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Payez {project.price}€ pour voir l'œuvre complète + soutenir le créateur
                  </p>
                </div>
                <Button 
                  onClick={handleWatch}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 mb-2 hover:neon-glow"
                >
                  <Play className="h-4 w-4 mr-2" />
                  🎬 Regarder en entier • {project.price}€
                </Button>
                <p className="text-xs text-gray-500">Accès complet + soutien au créateur</p>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-white">Investir</h3>
                  <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                    TOP 10 = Gains
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowRules(!showRules)}
                    className="text-gray-400 hover:text-white"
                  >
                    <Info className="h-4 w-4 mr-1" />
                    Règles
                  </Button>
                </div>
                
                {showRules && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-slate-900/50 rounded-lg p-3 mb-4 text-sm text-gray-400"
                  >
                    <div className="mb-3">
                      <p className="font-semibold text-white mb-2">🏆 Comment gagner :</p>
                      <div className="bg-green-900/20 border border-green-500/30 rounded p-2 mb-2">
                        <p className="text-xs text-green-300">
                          <strong>Si ce projet finit dans le TOP 10</strong> → Vous gagnez selon votre investissement !
                        </p>
                      </div>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li><strong>100 projets</strong> en compétition → <strong>10 gagnants</strong></li>
                      <li><strong>Plus d'investissement = plus de votes</strong> pour influencer le classement</li>
                      <li><strong>Redistribution automatique</strong> si votre choix gagne</li>
                      <li><strong>Cycle de 168h</strong> puis nouveau classement</li>
                    </ul>
                  </motion.div>
                )}

                <div className="grid grid-cols-5 gap-2 mb-4">
                  {project.investmentOptions.map((amount: number) => (
                    <Button
                      key={amount}
                      variant={selectedAmount === amount ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedAmount(amount)}
                      className={`text-xs transition-all duration-200 ${
                        selectedAmount === amount 
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 neon-glow' 
                          : 'border-slate-600 text-gray-300 hover:bg-slate-700 hover:border-blue-400'
                      }`}
                    >
                      {amount}€
                    </Button>
                  ))}
                </div>

                {selectedAmount && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-900/50 rounded-lg p-3 mb-4"
                  >
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">Montant :</span>
                      <span className="text-white font-semibold">{selectedAmount}€</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Votes obtenus :</span>
                      <span className="text-blue-400 font-semibold">{getVotesFromAmount(selectedAmount)}</span>
                    </div>
                  </motion.div>
                )}

                <Button 
                  onClick={handleInvest}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 hover:neon-glow transition-all duration-200"
                  disabled={!selectedAmount || isInvesting}
                >
                  {isInvesting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Investissement...
                    </div>
                  ) : (
                    <>
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Investir {selectedAmount ? `${selectedAmount}€` : ''}
                    </>
                  )}
                </Button>
              </div>

              {/* Actions secondaires */}
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleFollow}
                  className="flex-1 border-slate-600 text-gray-300 hover:border-amber-400 hover:text-amber-300 transition-all duration-200"
                >
                  <Heart className="h-4 w-4 mr-1" />
                  Suivre
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 border-slate-600 text-gray-300 hover:border-blue-400 hover:text-blue-300 transition-all duration-200"
                >
                  <Share2 className="h-4 w-4 mr-1" />
                  Partager
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}