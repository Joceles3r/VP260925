import React from 'react';
import { motion } from 'framer-motion';
import { Gift, ArrowRight, Clock, Star } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useScratchTickets } from '@/hooks/useScratchTickets';

interface ScratchTicketWidgetProps {
  onNavigateToTickets: () => void;
}

export const ScratchTicketWidget: React.FC<ScratchTicketWidgetProps> = ({
  onNavigateToTickets
}) => {
  const { 
    canScratchCount, 
    totalCount, 
    scratchedCount, 
    loading 
  } = useScratchTickets();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="space-y-1">
                <div className="w-32 h-4 bg-gray-200 rounded"></div>
                <div className="w-24 h-3 bg-gray-200 rounded"></div>
              </div>
            </div>
            <div className="w-full h-8 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`relative overflow-hidden transition-all duration-300 ${
        canScratchCount > 0 
          ? 'border-yellow-300 shadow-lg shadow-yellow-100' 
          : 'border-gray-200'
      }`}>
        {canScratchCount > 0 && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 to-orange-500"></div>
        )}
        
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                animate={canScratchCount > 0 ? { 
                  rotate: [0, -5, 5, -5, 0],
                  scale: [1, 1.05, 1] 
                } : {}}
                transition={{ 
                  duration: 2, 
                  repeat: canScratchCount > 0 ? Infinity : 0,
                  repeatDelay: 3 
                }}
                className={`p-2 rounded-full ${
                  canScratchCount > 0 
                    ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white' 
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                <Gift className="h-5 w-5" />
              </motion.div>
              
              <div>
                <h3 className="font-semibold">Scratch Tickets</h3>
                <p className="text-sm text-muted-foreground">
                  Mini-tickets de récompense
                </p>
              </div>
            </div>

            {canScratchCount > 0 && (
              <Badge variant="default" className="bg-yellow-500 text-white animate-pulse">
                {canScratchCount} nouveau{canScratchCount > 1 ? 'x' : ''}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="space-y-4">
            {/* Statistiques rapides */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-blue-50 rounded-lg">
                <div className="text-lg font-bold text-blue-600">{totalCount}</div>
                <div className="text-xs text-blue-600">Total</div>
              </div>
              <div className={`p-2 rounded-lg ${
                canScratchCount > 0 ? 'bg-yellow-50' : 'bg-gray-50'
              }`}>
                <div className={`text-lg font-bold ${
                  canScratchCount > 0 ? 'text-yellow-600' : 'text-gray-600'
                }`}>
                  {canScratchCount}
                </div>
                <div className={`text-xs ${
                  canScratchCount > 0 ? 'text-yellow-600' : 'text-gray-600'
                }`}>
                  À gratter
                </div>
              </div>
              <div className="p-2 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-600">{scratchedCount}</div>
                <div className="text-xs text-green-600">Grattés</div>
              </div>
            </div>

            {/* Message contextuel */}
            <div className="text-center">
              {canScratchCount > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2 text-yellow-700">
                    <Star className="h-4 w-4" />
                    <span className="font-medium">
                      {canScratchCount} ticket{canScratchCount > 1 ? 's' : ''} prêt{canScratchCount > 1 ? 's' : ''} !
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Grattez-les pour gagner des VISUpoints
                  </p>
                </div>
              ) : totalCount > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2 text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">Tous vos tickets sont grattés</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Prochains tickets à 100 VP cumulés
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Aucun ticket pour le moment
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Tickets créés tous les 100 VISUpoints
                  </p>
                </div>
              )}
            </div>

            {/* Bouton d'action */}
            <Button
              onClick={onNavigateToTickets}
              variant={canScratchCount > 0 ? "default" : "outline"}
              className={`w-full ${
                canScratchCount > 0 
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white' 
                  : ''
              }`}
              size="sm"
            >
              {canScratchCount > 0 ? (
                <>
                  Gratter maintenant ✨
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              ) : (
                <>
                  Voir mes tickets
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ScratchTicketWidget;