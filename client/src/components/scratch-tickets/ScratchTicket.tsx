import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Gift, X, Clock, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface ScratchTicketData {
  id: string;
  status: 'pending' | 'scratched' | 'expired';
  triggeredAtVP: number;
  reward?: '5vp' | '10vp' | '20vp' | '50vp' | 'nothing';
  rewardVP?: number;
  scratchedAt?: Date;
  expiresAt: Date;
  createdAt: Date;
  canScratch: boolean;
  daysUntilExpiry: number;
}

interface ScratchTicketProps {
  ticket: ScratchTicketData;
  onScratch: (ticketId: string) => Promise<void>;
  disabled?: boolean;
}

export const ScratchTicket: React.FC<ScratchTicketProps> = ({
  ticket,
  onScratch,
  disabled = false
}) => {
  const [isScratching, setIsScratching] = useState(false);
  const [isScratched, setIsScratched] = useState(ticket.status === 'scratched');

  const handleScratch = async () => {
    if (!ticket.canScratch || isScratching || disabled) return;

    setIsScratching(true);

    try {
      await onScratch(ticket.id);
      setIsScratched(true);
      
      // Animation de celebration si récompense
      if (ticket.reward && ticket.reward !== 'nothing') {
        toast({
          title: "🎉 Félicitations !",
          description: `Vous avez gagné ${ticket.rewardVP} VISUpoints !`,
          duration: 5000,
        });
      } else {
        toast({
          title: "😊 Pas de chance !",
          description: "Rien gagné cette fois, mais rejouez à 100 VISUpoints !",
          duration: 3000,
        });
      }
    } catch (error) {
      toast({
        title: "❌ Erreur",
        description: "Impossible de gratter le ticket. Réessayez plus tard.",
        variant: "destructive",
      });
    } finally {
      setIsScratching(false);
    }
  };

  const getStatusColor = () => {
    switch (ticket.status) {
      case 'pending':
        return ticket.canScratch ? 'bg-gradient-to-br from-yellow-400 to-orange-500' : 'bg-gradient-to-br from-gray-400 to-gray-500';
      case 'scratched':
        return ticket.reward !== 'nothing' ? 'bg-gradient-to-br from-green-400 to-emerald-500' : 'bg-gradient-to-br from-blue-400 to-blue-500';
      case 'expired':
        return 'bg-gradient-to-br from-red-400 to-red-500';
      default:
        return 'bg-gradient-to-br from-gray-400 to-gray-500';
    }
  };

  const getStatusIcon = () => {
    switch (ticket.status) {
      case 'pending':
        return ticket.canScratch ? <Gift className="h-6 w-6" /> : <Clock className="h-6 w-6" />;
      case 'scratched':
        return ticket.reward !== 'nothing' ? <Star className="h-6 w-6" /> : <X className="h-6 w-6" />;
      case 'expired':
        return <X className="h-6 w-6" />;
      default:
        return <Gift className="h-6 w-6" />;
    }
  };

  const getRewardMessage = () => {
    if (!isScratched || !ticket.reward) return null;

    switch (ticket.reward) {
      case '5vp':
      case '10vp':
      case '20vp':
      case '50vp':
        return (
          <div className="flex items-center gap-2 text-green-700 font-bold">
            <Coins className="h-5 w-5" />
            <span>+{ticket.rewardVP} VP</span>
          </div>
        );
      case 'nothing':
        return (
          <div className="text-blue-600 font-medium">
            Rien gagné, rejouez bientôt !
          </div>
        );
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`relative overflow-hidden ${getStatusColor()} text-white`}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-full">
                {getStatusIcon()}
              </div>
              <div>
                <h3 className="font-bold text-lg">Mini-Ticket Scratch</h3>
                <p className="text-white/80 text-sm">
                  Déclenché à {ticket.triggeredAtVP} VP
                </p>
              </div>
            </div>

            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              {ticket.status === 'pending' && ticket.canScratch && 'À gratter'}
              {ticket.status === 'pending' && !ticket.canScratch && 'En attente'}
              {ticket.status === 'scratched' && 'Gratté'}
              {ticket.status === 'expired' && 'Expiré'}
            </Badge>
          </div>

          {/* Zone de grattage ou résultat */}
          <div className="relative">
            <AnimatePresence mode="wait">
              {!isScratched && (
                <motion.div
                  key="scratch-area"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.5 }}
                  className="bg-white/30 rounded-lg p-4 mb-4 text-center"
                >
                  <div className="text-2xl mb-2">🎫</div>
                  <p className="text-white/90 font-medium">
                    Grattez pour découvrir votre récompense !
                  </p>
                </motion.div>
              )}

              {isScratched && (
                <motion.div
                  key="result-area"
                  initial={{ opacity: 0, scale: 0.8, rotateY: -90 }}
                  animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                  transition={{ 
                    duration: 0.6, 
                    type: "spring", 
                    stiffness: 100 
                  }}
                  className="bg-white/30 rounded-lg p-4 mb-4 text-center"
                >
                  <div className="text-3xl mb-2">
                    {ticket.reward !== 'nothing' ? '🎉' : '😊'}
                  </div>
                  {getRewardMessage()}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Actions et informations */}
          <div className="space-y-3">
            {ticket.canScratch && !isScratched && (
              <Button
                onClick={handleScratch}
                disabled={isScratching || disabled}
                className="w-full bg-white text-gray-800 hover:bg-white/90 font-bold"
                size="lg"
              >
                {isScratching ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="h-5 w-5 border-2 border-gray-600 border-t-transparent rounded-full"
                  />
                ) : (
                  'Gratter maintenant ✨'
                )}
              </Button>
            )}

            <div className="text-xs text-white/70 space-y-1">
              <div className="flex justify-between">
                <span>Créé :</span>
                <span>{formatDistanceToNow(new Date(ticket.createdAt), { 
                  addSuffix: true, 
                  locale: fr 
                })}</span>
              </div>
              
              {ticket.status === 'pending' && (
                <div className="flex justify-between">
                  <span>Expire :</span>
                  <span className={ticket.daysUntilExpiry <= 3 ? 'text-red-200 font-bold' : ''}>
                    {ticket.daysUntilExpiry > 0 
                      ? `dans ${ticket.daysUntilExpiry} jour${ticket.daysUntilExpiry > 1 ? 's' : ''}`
                      : 'aujourd\'hui'
                    }
                  </span>
                </div>
              )}

              {ticket.scratchedAt && (
                <div className="flex justify-between">
                  <span>Gratté :</span>
                  <span>{formatDistanceToNow(new Date(ticket.scratchedAt), { 
                    addSuffix: true, 
                    locale: fr 
                  })}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ScratchTicket;