import React from 'react';
import { useToggle, useToggleMessage } from '@/hooks/useFeatureToggles';
import { AlertCircle, Construction, Wrench } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FeatureToggleProps {
  /**
   * La clé du feature toggle à vérifier
   */
  feature: string;
  /**
   * Contenu à afficher quand la fonctionnalité est activée
   */
  children: React.ReactNode;
  /**
   * Contenu alternatif à afficher quand la fonctionnalité est désactivée
   * Si non fourni, affiche un message par défaut
   */
  fallback?: React.ReactNode;
  /**
   * Afficher ou non le message de désactivation
   * @default true
   */
  showMessage?: boolean;
  /**
   * Style du message de désactivation
   * @default 'alert' 
   */
  messageVariant?: 'alert' | 'minimal' | 'none';
}

/**
 * Composant pour conditionner l'affichage basé sur un feature toggle
 * 
 * @example
 * <FeatureToggle feature="livres">
 *   <LivresSection />
 * </FeatureToggle>
 * 
 * @example
 * <FeatureToggle 
 *   feature="live_show" 
 *   fallback={<div>Live shows bientôt disponibles!</div>}
 * >
 *   <LiveShowComponent />
 * </FeatureToggle>
 */
export function FeatureToggle({ 
  feature, 
  children, 
  fallback, 
  showMessage = true, 
  messageVariant = 'alert' 
}: FeatureToggleProps) {
  const isEnabled = useToggle(feature);
  const message = useToggleMessage(feature);

  // Si la fonctionnalité est activée, afficher le contenu
  if (isEnabled) {
    return <>{children}</>;
  }

  // Si un fallback personnalisé est fourni, l'utiliser
  if (fallback) {
    return <>{fallback}</>;
  }

  // Si on ne veut pas afficher de message, ne rien afficher
  if (!showMessage || messageVariant === 'none') {
    return null;
  }

  // Afficher le message de désactivation selon le variant
  if (messageVariant === 'minimal') {
    return (
      <div className="text-center py-8 text-muted-foreground" data-testid={`feature-disabled-${feature}`}>
        <Construction className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
        <p className="text-sm">{message}</p>
      </div>
    );
  }

  // Variant 'alert' par défaut
  return (
    <Alert className="my-4" data-testid={`feature-disabled-${feature}`}>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        {message}
      </AlertDescription>
    </Alert>
  );
}

/**
 * Composant pour afficher une section désactivée avec un style spécifique
 */
interface DisabledSectionProps {
  /**
   * La clé du feature toggle
   */
  feature: string;
  /**
   * Titre de la section
   */
  title?: string;
  /**
   * Description personnalisée
   */
  description?: string;
  /**
   * Icône à afficher
   */
  icon?: React.ReactNode;
  /**
   * Classes CSS additionnelles
   */
  className?: string;
}

export function DisabledSection({ 
  feature, 
  title, 
  description, 
  icon, 
  className = "" 
}: DisabledSectionProps) {
  const message = useToggleMessage(feature);
  
  return (
    <div 
      className={`text-center py-16 px-8 bg-muted/20 rounded-lg border-2 border-dashed border-muted-foreground/20 ${className}`}
      data-testid={`disabled-section-${feature}`}
    >
      <div className="mx-auto mb-6 w-16 h-16 bg-muted rounded-full flex items-center justify-center">
        {icon || <Wrench className="h-8 w-8 text-muted-foreground" />}
      </div>
      
      {title && (
        <h3 className="text-xl font-semibold text-foreground mb-3">
          {title}
        </h3>
      )}
      
      <p className="text-muted-foreground max-w-md mx-auto">
        {description || message}
      </p>
    </div>
  );
}

