import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ScratchTicketNotificationProps {
  newTicketsCount: number;
  onDismiss: () => void;
  onViewTickets: () => void;
  show: boolean;
}

export const ScratchTicketNotification: React.FC<ScratchTicketNotificationProps> = ({
  newTicketsCount,
  onDismiss,
  onViewTickets,
  show
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show && newTicketsCount > 0) {
      setVisible(true);
      
      // Auto-dismiss après 10 secondes
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onDismiss, 300); // Délai pour l'animation
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [show, newTicketsCount, onDismiss]);

  if (!show || newTicketsCount === 0) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          transition={{ 
            type: "spring", 
            stiffness: 500, 
            damping: 30 
          }}
          className="fixed bottom-6 right-6 z-50 max-w-sm"
        >
          <Card className="bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 text-white shadow-2xl border-0">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ 
                      rotate: [0, -10, 10, -10, 0],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 1
                    }}
                    className="p-2 bg-white/20 rounded-full"
                  >
                    <Gift className="h-6 w-6" />
                  </motion.div>
                  
                  <div>
                    <h3 className="font-bold text-lg">
                      🎉 Nouveau{newTicketsCount > 1 ? 'x' : ''} Ticket{newTicketsCount > 1 ? 's' : ''} !
                    </h3>
                    <p className="text-white/90 text-sm">
                      {newTicketsCount} Mini-Ticket{newTicketsCount > 1 ? 's' : ''} Scratch 
                      {newTicketsCount > 1 ? ' sont' : ' est'} prêt{newTicketsCount > 1 ? 's' : ''} !
                    </p>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setVisible(false);
                    setTimeout(onDismiss, 300);
                  }}
                  className="text-white hover:bg-white/20 h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-white/90 text-sm">
                  <Sparkles className="h-4 w-4" />
                  <span>Grattez pour gagner des VISUpoints !</span>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      onViewTickets();
                      setVisible(false);
                      setTimeout(onDismiss, 300);
                    }}
                    className="flex-1 bg-white text-orange-600 hover:bg-white/90 font-bold"
                    size="sm"
                  >
                    Voir les tickets
                  </Button>
                  
                  <Button
                    onClick={() => {
                      setVisible(false);
                      setTimeout(onDismiss, 300);
                    }}
                    variant="outline"
                    size="sm"
                    className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                  >
                    Plus tard
                  </Button>
                </div>
              </div>

              {/* Particules animées */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-white/60 rounded-full"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                      y: [0, -20, 0],
                      opacity: [0, 1, 0],
                      scale: [0, 1, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.3,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ScratchTicketNotification;