import { useQuery } from "@tanstack/react-query";
import type { FeatureToggle } from "@shared/schema";

// Structure de réponse de l'API publique
type PublicTogglesResponse = Record<string, { visible: boolean; message: string }>;

// Métadonnées statiques pour chaque toggle (pour reconstituer les objets FeatureToggle)
const TOGGLE_METADATA = {
  films: { label: 'Films et cinéma', kind: 'category' as const },
  videos: { label: 'Vidéos créatives', kind: 'category' as const },
  documentaires: { label: 'Documentaires', kind: 'category' as const },
  voix_info: { label: 'Voix et information', kind: 'category' as const },
  live_show: { label: 'Live Shows', kind: 'category' as const },
  livres: { label: 'Livres et écriture', kind: 'category' as const },
  petites_annonces: { label: 'Petites annonces', kind: 'rubrique' as const },
} as const;

/**
 * Hook pour récupérer tous les feature toggles publics
 * Utilise l'endpoint public avec mise en cache
 */
export function useFeatureToggles() {
  const { data: publicToggles, isLoading, error } = useQuery<PublicTogglesResponse>({
    queryKey: ["/api/public/toggles"],
    staleTime: 5000, // Cache pendant 5 secondes (en accord avec l'API)
    gcTime: 60000, // Garde en cache pendant 1 minute
  });

  // Transformer la réponse publique en array de FeatureToggle partiels
  const toggles: FeatureToggle[] = publicToggles ? 
    Object.entries(publicToggles).map(([key, data]) => {
      const metadata = TOGGLE_METADATA[key as keyof typeof TOGGLE_METADATA];
      return {
        id: `toggle-${key}`,
        key,
        label: metadata?.label || key,
        kind: metadata?.kind || 'category',
        isVisible: data.visible,
        hiddenMessageVariant: 'en_cours' as const,
        hiddenMessageCustom: data.message || null,
        scheduleStart: null,
        scheduleEnd: null,
        timezone: 'Europe/Paris',
        version: 1,
        updatedBy: null,
        updatedAt: new Date(),
      } as FeatureToggle;
    }) : [];

  return {
    toggles,
    isLoading,
    error,
  };
}

/**
 * Hook pour vérifier si une fonctionnalité spécifique est activée
 * @param key - La clé du feature toggle à vérifier
 * @returns boolean - true si la fonctionnalité est visible/activée (default true pendant le chargement ou erreur)
 */
export function useToggle(key: string): boolean {
  const { toggles, isLoading, error } = useFeatureToggles();
  
  // Pendant le chargement ou en cas d'erreur, on assume que la fonctionnalité est activée
  // pour éviter de cacher du contenu par défaut
  if (isLoading || error) {
    return true;
  }
  
  const toggle = toggles.find(t => t.key === key);
  return toggle?.isVisible ?? false;
}

/**
 * Hook pour récupérer les informations détaillées d'un toggle
 * @param key - La clé du feature toggle
 * @returns FeatureToggle | undefined
 */
export function useToggleInfo(key: string): FeatureToggle | undefined {
  const { toggles } = useFeatureToggles();
  
  return toggles.find(t => t.key === key);
}

/**
 * Hook pour récupérer les toggles par type (category ou rubrique)
 * @param kind - Le type de toggle ('category' | 'rubrique')
 * @returns { toggles: FeatureToggle[], isLoading: boolean } - Toggles filtrés par type avec état de chargement
 */
export function useTogglesByKind(kind: 'category' | 'rubrique'): { toggles: FeatureToggle[], isLoading: boolean } {
  const { toggles, isLoading } = useFeatureToggles();
  
  return {
    toggles: toggles.filter(t => t.kind === kind),
    isLoading
  };
}

/**
 * Hook pour récupérer le message à afficher quand une fonctionnalité est désactivée
 * @param key - La clé du feature toggle
 * @returns string | null - Le message à afficher ou null si la fonctionnalité est activée
 */
export function useToggleMessage(key: string): string | null {
  const { isLoading, error } = useFeatureToggles();
  const toggle = useToggleInfo(key);
  
  // Si on est en chargement ou erreur et qu'on n'a pas de toggle, considérer comme activé
  if ((isLoading || error) && !toggle) {
    return null;
  }
  
  if (!toggle || toggle.isVisible) {
    return null;
  }
  
  switch (toggle.hiddenMessageVariant) {
    case 'en_cours':
      return 'Section en cours de développement';
    case 'en_travaux':
      return 'Section en travaux, disponible bientôt';
    case 'custom':
      return toggle.hiddenMessageCustom || 'Section temporairement indisponible';
    default:
      return 'Section temporairement indisponible';
  }
}

/**
 * Hook pour vérifier plusieurs toggles en même temps
 * @param features - Array des clés de feature toggles à vérifier
 * @returns { states: Record<string, boolean>, isLoading: boolean, isError: boolean } - État de chaque feature avec indicateurs
 */
export function useMultipleToggles(features: string[]): { states: Record<string, boolean>, isLoading: boolean, isError: boolean } {
  const { toggles, isLoading, error } = useFeatureToggles();
  
  const states = features.reduce((acc, feature) => {
    // Pendant le chargement ou en cas d'erreur, on assume que la fonctionnalité est activée
    if (isLoading || error) {
      acc[feature] = true;
    } else {
      const toggle = toggles.find((t: FeatureToggle) => t.key === feature);
      acc[feature] = toggle?.isVisible ?? false;
    }
    return acc;
  }, {} as Record<string, boolean>);

  return { states, isLoading, isError: !!error };
}