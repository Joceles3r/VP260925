import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from './use-toast';

// ===== TYPES =====

interface MinorStatus {
  isMinor: boolean;
  age?: number;
  status?: string;
  visuPoints: number;
  capReached: boolean;
  canEarnMore: boolean;
  majorityDate?: string;
  lockUntil?: string;
  canCashOut: boolean;
}

interface MinorProfile {
  id: string;
  userId: string;
  birthDate: string;
  parentEmail?: string;
  parentalConsent: boolean;
  visuPointsEarned: number;
  visuPointsCap: number;
  status: string;
  majorityDate: string;
  createdAt: string;
}

interface MinorNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface AwardPointsRequest {
  amount: number;
  source: string;
  sourceId?: string;
  description: string;
}

interface AwardPointsResult {
  granted: number;
  blocked: number;
  reason: string;
  newBalance: number;
  triggerNotification?: string;
}

// ===== HOOKS PRINCIPAUX =====

/**
 * Hook pour gérer le statut du visiteur mineur
 */
export function useMinorStatus() {
  return useQuery({
    queryKey: ['minor-visitor', 'status'],
    queryFn: async (): Promise<MinorStatus> => {
      const response = await fetch('/api/minor-visitors/status', { 
        credentials: 'include' 
      });
      if (!response.ok) throw new Error('Erreur lors du chargement du statut');
      const data = await response.json();
      return data.status;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook pour gérer le profil du visiteur mineur
 */
export function useMinorProfile() {
  return useQuery({
    queryKey: ['minor-visitor', 'profile'],
    queryFn: async (): Promise<MinorProfile | null> => {
      const response = await fetch('/api/minor-visitors/profile', { 
        credentials: 'include' 
      });
      if (response.status === 404) return null;
      if (!response.ok) throw new Error('Erreur lors du chargement du profil');
      const data = await response.json();
      return data.profile;
    },
  });
}

/**
 * Hook pour créer un profil mineur
 */
export function useCreateMinorProfile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (profileData: {
      birthDate: string;
      parentEmail?: string;
      parentalConsent?: boolean;
    }): Promise<MinorProfile> => {
      const response = await fetch('/api/minor-visitors/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la création du profil');
      }

      const data = await response.json();
      return data.profile;
    },
    onSuccess: (profile) => {
      queryClient.invalidateQueries({ queryKey: ['minor-visitor'] });
      toast({
        title: "✅ Profil créé",
        description: "Ton profil visiteur mineur a été créé avec succès !",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook pour mettre à jour un profil mineur
 */
export function useUpdateMinorProfile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (updates: {
      parentEmail?: string;
      parentalConsent?: boolean;
      socialPostingEnabled?: boolean;
      accountTypeChosen?: 'investor' | 'investi_lecteur';
    }): Promise<MinorProfile> => {
      const response = await fetch('/api/minor-visitors/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la mise à jour');
      }

      const data = await response.json();
      return data.profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['minor-visitor'] });
      toast({
        title: "✅ Profil mis à jour",
        description: "Tes informations ont été sauvegardées.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook pour attribuer des VISUpoints à un mineur
 */
export function useAwardMinorPoints() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (request: AwardPointsRequest): Promise<AwardPointsResult> => {
      const response = await fetch('/api/minor-visitors/award-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de l\'attribution des points');
      }

      const data = await response.json();
      return data.result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['minor-visitor'] });
      
      if (result.granted > 0) {
        toast({
          title: "🎉 Points gagnés !",
          description: `+${result.granted} VISUpoints (${(result.granted / 100).toFixed(2)}€)`,
        });
      } else {
        toast({
          title: "🛑 Plafond atteint",
          description: "Tu as atteint la limite de 200€. Plus de gains à tes 18 ans !",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook pour traiter la transition vers la majorité
 */
export function useTransitionToMajority() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (): Promise<{ success: boolean; lockUntil?: string }> => {
      const response = await fetch('/api/minor-visitors/transition-to-majority', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la transition');
      }

      const data = await response.json();
      return data.result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['minor-visitor'] });
      
      if (result.lockUntil) {
        toast({
          title: "🎂 Majorité atteinte !",
          description: "Verrou de 6 mois appliqué. Tu pourras récupérer tes 200€ après cette période.",
        });
      } else {
        toast({
          title: "🎉 Bienvenue parmi les majeurs !",
          description: "Tu peux maintenant utiliser tes VISUpoints normalement.",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook pour récupérer les notifications d'un mineur
 */
export function useMinorNotifications() {
  return useQuery({
    queryKey: ['minor-visitor', 'notifications'],
    queryFn: async (): Promise<MinorNotification[]> => {
      const response = await fetch('/api/minor-visitors/notifications', { 
        credentials: 'include' 
      });
      if (!response.ok) throw new Error('Erreur lors du chargement des notifications');
      const data = await response.json();
      return data.notifications || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// ===== HOOKS UTILITAIRES =====

/**
 * Hook pour calculer les statistiques des VISUpoints
 */
export function useMinorVisuPointsStats(visuPoints: number) {
  const capVP = 20000; // 200€
  const euroEquivalent = visuPoints / 100;
  const capPercentage = Math.min((visuPoints / capVP) * 100, 100);
  const remainingVP = Math.max(capVP - visuPoints, 0);
  const remainingEUR = remainingVP / 100;

  return {
    visuPoints,
    euroEquivalent: euroEquivalent.toFixed(2),
    capPercentage: capPercentage.toFixed(1),
    remainingVP,
    remainingEUR: remainingEUR.toFixed(2),
    isNearCap: capPercentage >= 80,
    isCapReached: visuPoints >= capVP,
  };
}

/**
 * Hook pour formater la date de majorité
 */
export function useMajorityCountdown(majorityDate?: string) {
  if (!majorityDate) return null;
  
  try {
    const majority = new Date(majorityDate + 'T00:00:00.000Z');
    const now = new Date();
    
    if (majority <= now) {
      return { 
        text: "🎉 Majorité atteinte !", 
        isReached: true,
        daysRemaining: 0 
      };
    }
    
    const diffTime = majority.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (daysRemaining <= 7) {
      return { 
        text: `${daysRemaining} jour${daysRemaining > 1 ? 's' : ''}`, 
        isReached: false,
        daysRemaining,
        isNear: true 
      };
    }
    
    const monthsRemaining = Math.floor(daysRemaining / 30);
    return { 
      text: `${monthsRemaining} mois`, 
      isReached: false,
      daysRemaining,
      isNear: false 
    };
  } catch {
    return { 
      text: "Date invalide", 
      isReached: false,
      daysRemaining: 0 
    };
  }
}

/**
 * Hook pour vérifier l'éligibilité aux activités
 */
export function useMinorActivityEligibility(status?: MinorStatus) {
  if (!status?.isMinor) {
    return {
      canParticipate: false,
      reason: 'not_minor',
      message: 'Réservé aux visiteurs mineurs (16-17 ans)'
    };
  }
  
  if (status.capReached) {
    return {
      canParticipate: false,
      reason: 'cap_reached',
      message: 'Plafond de 200€ atteint - Gains en pause jusqu\'à tes 18 ans'
    };
  }
  
  if (!status.canEarnMore) {
    return {
      canParticipate: false,
      reason: 'cannot_earn',
      message: 'Gains temporairement bloqués'
    };
  }
  
  return {
    canParticipate: true,
    reason: 'eligible',
    message: 'Tu peux participer aux activités !'
  };
}