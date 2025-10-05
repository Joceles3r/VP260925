import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Star, 
  Trophy,
  Calendar,
  Target,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Coins
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface GoldenTicket {
  id: string;
  tier: number;
  amountEuros: string;
  votes: number;
  visuPointsSpent: number;
  monthYear: string;
  targetInfoporteurId?: string;
  finalRank?: number;
  refundPercentage: number;
  refundAmount: string;
  status: string;
  createdAt: string;
}

interface InvestiLecteurProfile {
  id: string;
  visuPoints: number;
}

interface GoldenTicketManagerProps {
  profile: InvestiLecteurProfile;
}

const GOLDEN_TICKET_TIERS = [
  { 
    tier: 1, 
    euros: 50, 
    votes: 20, 
    points: 5000,
    color: 'bg-gradient-to-r from-yellow-100 to-yellow-200 border-yellow-300',
    buttonColor: 'bg-yellow-600 hover:bg-yellow-700'
  },
  { 
    tier: 2, 
    euros: 75, 
    votes: 30, 
    points: 7500,
    color: 'bg-gradient-to-r from-orange-100 to-orange-200 border-orange-300',
    buttonColor: 'bg-orange-600 hover:bg-orange-700',
    popular: true
  },
  { 
    tier: 3, 
    euros: 100, 
    votes: 40, 
    points: 10000,
    color: 'bg-gradient-to-r from-red-100 to-red-200 border-red-300',
    buttonColor: 'bg-red-600 hover:bg-red-700'
  }
];

export const GoldenTicketManager: React.FC<GoldenTicketManagerProps> = ({ profile }) => {
  const [selectedTier, setSelectedTier] = useState<number | null>(null);
  const [selectedInfoporteurId, setSelectedInfoporteurId] = useState<string>('');
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const queryClient = useQueryClient();
  
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

  // Récupérer les Golden Tickets de l'utilisateur
  const { data: ticketsData } = useQuery({
    queryKey: ['voix-info', 'my-golden-tickets'],
    queryFn: async () => {
      const response = await fetch('/api/voix-info/golden-tickets/my-tickets', { 
        credentials: 'include' 
      });
      if (!response.ok) throw new Error('Erreur lors du chargement des Golden Tickets');
      return response.json();
    }
  });

  // Récupérer la liste des infoporteurs pour sélection
  const { data: infoporteursData } = useQuery({
    queryKey: ['voix-info', 'current-rankings'],
    queryFn: async () => {
      const response = await fetch('/api/voix-info/rankings/current?limit=50');
      if (!response.ok) return { rankings: [] };
      return response.json();
    }
  });

  // Mutation pour acheter un Golden Ticket
  const purchaseTicket = useMutation({
    mutationFn: async (data: { tier: number; targetInfoporteurId?: string }) => {
      const response = await fetch('/api/voix-info/golden-tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de l\'achat');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voix-info'] });
      setShowPurchaseDialog(false);
      setSelectedTier(null);
      setSelectedInfoporteurId('');
    }
  });

  const tickets: GoldenTicket[] = ticketsData?.tickets || [];
  const infoporteurs = infoporteursData?.rankings || [];
  const currentMonthTicket = tickets.find(t => t.monthYear === currentMonth);
  const hasCurrentMonthTicket = !!currentMonthTicket;

  const handlePurchase = () => {
    if (!selectedTier) return;
    
    purchaseTicket.mutate({
      tier: selectedTier,
      targetInfoporteurId: selectedInfoporteurId || undefined
    });
  };

  const getStatusBadge = (ticket: GoldenTicket) => {
    switch (ticket.status) {
      case 'active':
        return <Badge className="bg-blue-100 text-blue-800">🎯 Actif</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">✅ Terminé</Badge>;
      case 'refunded':
        return <Badge className="bg-purple-100 text-purple-800">💰 Remboursé</Badge>;
      default:
        return <Badge variant="outline">{ticket.status}</Badge>;
    }
  };

  const getRefundInfo = (ticket: GoldenTicket) => {
    if (ticket.finalRank === null || ticket.finalRank === undefined) return null;
    
    let refundText = '';
    let colorClass = '';
    
    if (ticket.finalRank >= 1 && ticket.finalRank <= 10) {
      refundText = '🏆 TOP 10 - 100% remboursé';
      colorClass = 'text-green-600';
    } else if (ticket.finalRank === 11) {
      refundText = '🥉 Rang 11 - 100% remboursé';
      colorClass = 'text-green-600';
    } else if (ticket.finalRank >= 12 && ticket.finalRank <= 20) {
      refundText = '🥈 Rangs 12-20 - 50% remboursé';
      colorClass = 'text-orange-600';
    } else {
      refundText = '❌ Rang 21+ - Aucun remboursement';
      colorClass = 'text-red-600';
    }
    
    return <p className={`text-sm ${colorClass} font-medium`}>{refundText}</p>;
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Golden Tickets Premium
          </CardTitle>
          <CardDescription>
            Paris premium mensuels • Remboursements selon classement final • Limite : 1 ticket/mois
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Ticket du mois en cours */}
      {hasCurrentMonthTicket && (
        <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-600" />
              Votre Golden Ticket - {currentMonthTicket.monthYear}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600">
                    Tier {currentMonthTicket.tier}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {currentMonthTicket.amountEuros}€ • {currentMonthTicket.votes} votes
                  </p>
                </div>
                {getStatusBadge(currentMonthTicket)}
              </div>
              
              <div className="text-right">
                {currentMonthTicket.targetInfoporteurId && (
                  <p className="text-sm text-muted-foreground mb-1">
                    🎯 Cible : Infoporteur #{currentMonthTicket.targetInfoporteurId.slice(-6)}
                  </p>
                )}
                {currentMonthTicket.finalRank && (
                  <p className="text-sm font-medium">
                    Rang final : #{currentMonthTicket.finalRank}
                  </p>
                )}
              </div>
            </div>
            
            {getRefundInfo(currentMonthTicket)}
            
            {currentMonthTicket.status === 'active' && (
              <div className="bg-white/50 p-3 rounded border">
                <p className="text-sm text-muted-foreground">
                  ⏳ En cours... Résultats disponibles à la fin du mois
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Achat de nouveau ticket */}
      {!hasCurrentMonthTicket && (
        <Card>
          <CardHeader>
            <CardTitle>Acheter un Golden Ticket pour {currentMonth}</CardTitle>
            <CardDescription>
              Choisissez votre tier et optionnellement un infoporteur cible
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {GOLDEN_TICKET_TIERS.map((tier) => (
                <Card key={tier.tier} className={`relative cursor-pointer transition-all ${tier.color} ${
                  selectedTier === tier.tier ? 'ring-2 ring-primary' : ''
                }`} onClick={() => setSelectedTier(tier.tier)}>
                  {tier.popular && (
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                      <Badge>⭐ Populaire</Badge>
                    </div>
                  )}
                  <CardContent className="p-6 text-center">
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <Star className="h-6 w-6 text-yellow-600" />
                      <p className="text-xl font-bold">Tier {tier.tier}</p>
                    </div>
                    
                    <p className="text-2xl font-bold mb-2">{tier.euros}€</p>
                    <p className="text-muted-foreground mb-4">{tier.votes} votes</p>
                    
                    <div className="text-sm space-y-1 mb-4">
                      <p className="flex items-center gap-1">
                        <Coins className="h-3 w-3" />
                        {tier.points.toLocaleString()} VP requis
                      </p>
                    </div>
                    
                    <div className="text-xs space-y-1">
                      <p>• TOP 1-10: <span className="text-green-600 font-medium">100%</span></p>
                      <p>• Rang 11: <span className="text-green-600 font-medium">100%</span></p>
                      <p>• Rangs 12-20: <span className="text-orange-600 font-medium">50%</span></p>
                      <p>• Rang 21+: <span className="text-red-600 font-medium">0%</span></p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {selectedTier && (
              <div className="mt-6 space-y-4">
                <div>
                  <Label className="text-sm font-medium">
                    Infoporteur cible (optionnel)
                  </Label>
                  <Select value={selectedInfoporteurId} onValueChange={setSelectedInfoporteurId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir un infoporteur (ou laisser vide pour parier sur le TOP 10 général)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Aucun infoporteur spécifique</SelectItem>
                      {infoporteurs.slice(0, 20).map((infoporteur: any) => (
                        <SelectItem key={infoporteur.infoporteurId} value={infoporteur.infoporteurId}>
                          #{infoporteur.rank} - Infoporteur #{infoporteur.infoporteurId.slice(-6)} 
                          ({infoporteur.totalSales} ventes)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  onClick={() => setShowPurchaseDialog(true)}
                  disabled={profile.visuPoints < GOLDEN_TICKET_TIERS.find(t => t.tier === selectedTier)!.points}
                  className="w-full"
                >
                  {profile.visuPoints < GOLDEN_TICKET_TIERS.find(t => t.tier === selectedTier)!.points ? (
                    'Solde VISUpoints insuffisant'
                  ) : (
                    `Acheter Golden Ticket Tier ${selectedTier} (${GOLDEN_TICKET_TIERS.find(t => t.tier === selectedTier)?.points.toLocaleString()} VP)`
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Historique des Golden Tickets */}
      {tickets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Historique de vos Golden Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">Tier {ticket.tier}</Badge>
                      {getStatusBadge(ticket)}
                    </div>
                    <p className="font-medium">{ticket.monthYear}</p>
                    <p className="text-sm text-muted-foreground">
                      {ticket.amountEuros}€ • {ticket.votes} votes
                    </p>
                    {getRefundInfo(ticket)}
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true, locale: fr })}
                    </p>
                    {parseFloat(ticket.refundAmount) > 0 && (
                      <p className="text-sm font-medium text-green-600">
                        +{ticket.refundAmount}€ remboursé
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog de confirmation */}
      {showPurchaseDialog && selectedTier && (
        <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmer l'achat du Golden Ticket</DialogTitle>
              <DialogDescription>
                Tier {selectedTier} pour le mois {currentMonth}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {(() => {
                const tier = GOLDEN_TICKET_TIERS.find(t => t.tier === selectedTier)!;
                return (
                  <Card>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Golden Ticket Tier {selectedTier} :</span>
                          <span className="font-semibold">{tier.euros}€</span>
                        </div>
                        <div className="flex justify-between">
                          <span>VISUpoints requis :</span>
                          <span className="font-semibold">{tier.points.toLocaleString()} VP</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Votes générés :</span>
                          <span className="font-semibold">{tier.votes} votes</span>
                        </div>
                        {selectedInfoporteurId && (
                          <div className="flex justify-between border-t pt-2">
                            <span>Infoporteur cible :</span>
                            <span className="font-semibold">#{selectedInfoporteurId.slice(-6)}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}
              
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowPurchaseDialog(false)} className="flex-1">
                  Annuler
                </Button>
                <Button onClick={handlePurchase} disabled={purchaseTicket.isPending} className="flex-1">
                  {purchaseTicket.isPending ? 'Achat...' : 'Confirmer l\'achat'}
                </Button>
              </div>
              
              {purchaseTicket.error && (
                <p className="text-sm text-red-600 text-center">
                  {purchaseTicket.error.message}
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {hasCurrentMonthTicket && (
        <Card className="bg-muted/30">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              Vous avez déjà un Golden Ticket pour ce mois.<br />
              Le prochain achat sera disponible le mois prochain.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};