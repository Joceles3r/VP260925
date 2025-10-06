/**
 * Composant Logo Officiel VISUAL
 * Affiche le logo uniquement si activé dans les paramètres admin
 */

import React from 'react';
import { useLogoVisibility } from '@/hooks/usePlatformSettings';
import { cn } from '@/lib/utils';

interface OfficialLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showFallback?: boolean;
}

const sizeClasses = {
  xs: 'h-4 w-4',
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
};

export default function OfficialLogo({ 
  className, 
  size = 'md',
  showFallback = false 
}: OfficialLogoProps) {
  const { isVisible, isLoading } = useLogoVisibility();

  // Si le logo n'est pas visible et pas de fallback
  if (!isVisible && !showFallback) {
    return null;
  }

  // Pendant le chargement, ne rien afficher
  if (isLoading) {
    return null;
  }

  // Si pas visible mais fallback demandé, afficher un placeholder
  if (!isVisible && showFallback) {
    return (
      <div
        className={cn(
          'rounded-lg bg-gradient-to-br from-[#00D1FF] to-[#7B2CFF] flex items-center justify-center',
          sizeClasses[size],
          className
        )}
        data-testid="logo-placeholder"
      >
        <span className="text-white font-bold text-xs">V</span>
      </div>
    );
  }

  // Logo officiel visible
  return (
    <img
      src="/logo.svg"
      alt="VISUAL Official Logo"
      className={cn(
        'object-contain',
        sizeClasses[size],
        className
      )}
      data-testid="official-logo"
    />
  );
}

/**
 * Composant pour afficher logo + texte
 */
export function OfficialLogoWithText({ 
  className,
  logoSize = 'md',
  textSize = 'text-xl'
}: {
  className?: string;
  logoSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  textSize?: string;
}) {
  const { isVisible } = useLogoVisibility();

  return (
    <div className={cn('flex items-center gap-2', className)} data-testid="logo-with-text">
      <OfficialLogo size={logoSize} showFallback />
      <span className={cn('font-bold visual-text-gradient', textSize)}>
        VISUAL
      </span>
      {isVisible && (
        <span className="ml-1 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
          Official
        </span>
      )}
    </div>
  );
}

/**
 * Badge indiquant que le logo est officiel
 */
export function OfficialBadge() {
  const { isVisible } = useLogoVisibility();

  if (!isVisible) {
    return null;
  }

  return (
    <span 
      className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full"
      data-testid="official-badge"
    >
      <svg 
        className="h-3 w-3" 
        fill="currentColor" 
        viewBox="0 0 20 20"
      >
        <path 
          fillRule="evenodd" 
          d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
          clipRule="evenodd" 
        />
      </svg>
      Officiel
    </span>
  );
}
