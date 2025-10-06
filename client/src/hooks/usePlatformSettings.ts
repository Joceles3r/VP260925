/**
 * Hook React pour accéder aux paramètres de plateforme
 * Gère le cache et la synchronisation avec le backend
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface PlatformSettings {
  logo_official_visible: boolean;
  maintenance_mode: boolean;
  new_registration_enabled: boolean;
  live_shows_enabled: boolean;
  voix_info_enabled: boolean;
  petites_annonces_enabled: boolean;
}

/**
 * Hook pour récupérer tous les paramètres
 */
export function usePlatformSettings() {
  const { data, isLoading, error } = useQuery<PlatformSettings>({
    queryKey: ['platformSettings'],
    queryFn: async () => {
      const response = await fetch('/api/platform-settings');
      if (!response.ok) {
        throw new Error('Failed to fetch platform settings');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // Cache 5 minutes
    refetchOnWindowFocus: true,
  });

  return {
    settings: data,
    isLoading,
    error,
  };
}

/**
 * Hook pour vérifier la visibilité du logo
 */
export function useLogoVisibility() {
  const { settings, isLoading } = usePlatformSettings();
  
  return {
    isVisible: settings?.logo_official_visible ?? false,
    isLoading,
  };
}

/**
 * Hook pour mettre à jour un paramètre (admin only)
 */
export function useUpdatePlatformSetting() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: boolean | string }) => {
      const response = await fetch('/api/platform-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key, value }),
      });

      if (!response.ok) {
        throw new Error('Failed to update platform setting');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalider le cache pour rafraîchir
      queryClient.invalidateQueries({ queryKey: ['platformSettings'] });
    },
  });

  return mutation;
}

/**
 * Hook simple pour toggle le logo (admin)
 */
export function useToggleLogoVisibility() {
  const updateSetting = useUpdatePlatformSetting();

  const toggleLogo = (visible: boolean) => {
    return updateSetting.mutateAsync({
      key: 'logo_official_visible',
      value: visible,
    });
  };

  return {
    toggleLogo,
    isLoading: updateSetting.isPending,
    error: updateSetting.error,
  };
}
