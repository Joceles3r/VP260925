import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

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

export interface ScratchTicketListResponse {
  success: boolean;
  tickets: ScratchTicketData[];
  count: number;
  pending: number;
}

export interface ScratchResponse {
  success: boolean;
  reward: string;
  rewardVP: number;
  message: string;
  newBalance: number;
}

export interface UseScratchTicketsReturn {
  tickets: ScratchTicketData[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  canScratchCount: number;
  totalCount: number;
  scratchedCount: number;
  expiredCount: number;
  fetchTickets: (showRefreshing?: boolean) => Promise<void>;
  scratchTicket: (ticketId: string) => Promise<ScratchResponse>;
  refresh: () => Promise<void>;
}

export const useScratchTickets = (): UseScratchTicketsReturn => {
  const [tickets, setTickets] = useState<ScratchTicketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchTickets = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      const response = await fetch('/api/scratch-tickets', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expirée, veuillez vous reconnecter');
        }
        throw new Error('Erreur lors du chargement des tickets');
      }

      const data: ScratchTicketListResponse = await response.json();
      
      if (data.success) {
        setTickets(data.tickets.map(ticket => ({
          ...ticket,
          createdAt: new Date(ticket.createdAt),
          expiresAt: new Date(ticket.expiresAt),
          scratchedAt: ticket.scratchedAt ? new Date(ticket.scratchedAt) : undefined,
        })));
      } else {
        throw new Error('Erreur lors de la récupération des tickets');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      
      // Ne pas montrer de toast si c'est juste un refresh en arrière-plan
      if (!showRefreshing) {
        toast({
          title: "❌ Erreur",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  const scratchTicket = useCallback(async (ticketId: string): Promise<ScratchResponse> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      const response = await fetch(`/api/scratch-tickets/${ticketId}/scratch`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data: ScratchResponse = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Erreur lors du grattage');
      }

      // Mettre à jour le ticket local avec le résultat
      setTickets(prevTickets => 
        prevTickets.map(ticket => 
          ticket.id === ticketId 
            ? {
                ...ticket,
                status: 'scratched' as const,
                reward: data.reward as any,
                rewardVP: data.rewardVP,
                scratchedAt: new Date(),
                canScratch: false
              }
            : ticket
        )
      );

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du grattage';
      throw new Error(errorMessage);
    }
  }, []);

  const refresh = useCallback(() => {
    return fetchTickets(true);
  }, [fetchTickets]);

  // Auto-fetch au montage du composant
  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Auto-refresh périodique (toutes les 60 secondes)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        refresh();
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [loading, refresh]);

  // Calculs dérivés
  const canScratchCount = tickets.filter(ticket => ticket.canScratch).length;
  const totalCount = tickets.length;
  const scratchedCount = tickets.filter(ticket => ticket.status === 'scratched').length;
  const expiredCount = tickets.filter(ticket => ticket.status === 'expired').length;

  return {
    tickets,
    loading,
    refreshing,
    error,
    canScratchCount,
    totalCount,
    scratchedCount,
    expiredCount,
    fetchTickets,
    scratchTicket,
    refresh,
  };
};

export default useScratchTickets;