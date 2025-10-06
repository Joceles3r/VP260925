/**
 * Contrôle Admin - Visibilité du Logo Officiel
 * Permet aux admins de rendre le logo visible/invisible
 */

import React, { useState } from 'react';
import { Eye, EyeOff, Info, Check, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLogoVisibility, useToggleLogoVisibility } from '@/hooks/usePlatformSettings';
import OfficialLogo from '@/components/OfficialLogo';
import { useToast } from '@/hooks/use-toast';

export default function LogoVisibilityControl() {
  const { isVisible, isLoading: loadingVisibility } = useLogoVisibility();
  const { toggleLogo, isLoading: togglingLogo } = useToggleLogoVisibility();
  const { toast } = useToast();
  const [localVisible, setLocalVisible] = useState(isVisible);

  // Synchroniser l'état local avec l'état remote
  React.useEffect(() => {
    if (!loadingVisibility && isVisible !== undefined) {
      setLocalVisible(isVisible);
    }
  }, [isVisible, loadingVisibility]);

  const handleToggle = async (checked: boolean) => {
    setLocalVisible(checked);

    try {
      await toggleLogo(checked);
      
      toast({
        title: checked ? '✅ Logo rendu visible' : '👁️ Logo masqué',
        description: checked 
          ? 'Le logo officiel est maintenant visible sur toute la plateforme'
          : 'Le logo officiel est maintenant masqué',
      });
    } catch (error) {
      console.error('Error toggling logo:', error);
      setLocalVisible(!checked); // Rollback
      
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier la visibilité du logo',
        variant: 'destructive',
      });
    }
  };

  const isProcessing = loadingVisibility || togglingLogo;

  return (
    <Card data-testid="logo-visibility-control">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {localVisible ? (
            <Eye className="h-5 w-5 text-primary" />
          ) : (
            <EyeOff className="h-5 w-5 text-muted-foreground" />
          )}
          Logo Officiel VISUAL
        </CardTitle>
        <CardDescription>
          Contrôlez l'affichage du logo officiel sur la plateforme
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Preview du logo */}
        <div className="space-y-2">
          <Label>Aperçu</Label>
          <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/30">
            <OfficialLogo size="lg" showFallback />
            <div>
              <p className="text-sm font-medium">
                {localVisible ? 'Logo visible' : 'Logo masqué (placeholder)'}
              </p>
              <p className="text-xs text-muted-foreground">
                {localVisible 
                  ? 'Le logo officiel sera affiché'
                  : 'Un placeholder sera affiché à la place'}
              </p>
            </div>
          </div>
        </div>

        {/* Toggle principal */}
        <div className="flex items-center justify-between border-t pt-4">
          <div className="space-y-0.5">
            <Label htmlFor="logo-visible" className="text-base">
              Rendre le logo visible
            </Label>
            <p className="text-sm text-muted-foreground">
              Active l'affichage du logo sur toute la plateforme
            </p>
          </div>
          <Switch
            id="logo-visible"
            checked={localVisible}
            onCheckedChange={handleToggle}
            disabled={isProcessing}
            data-testid="logo-visibility-toggle"
          />
        </div>

        {/* Emplacements du logo */}
        <div className="space-y-3 border-t pt-4">
          <Label className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            Emplacements du logo
          </Label>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <Check className="h-3 w-3 text-primary" />
              <span>Navigation (header)</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-3 w-3 text-primary" />
              <span>Landing page</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-3 w-3 text-primary" />
              <span>Footer</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-3 w-3 text-primary" />
              <span>Pages About/Info</span>
            </div>
          </div>
        </div>

        {/* Informations */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>Note:</strong> Le changement est appliqué instantanément pour tous les utilisateurs.
            Le logo officiel doit être placé dans <code className="bg-muted px-1 rounded">/public/logo.svg</code>
          </AlertDescription>
        </Alert>

        {/* Statut actuel */}
        <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-4">
          <span>Statut actuel:</span>
          <span className={localVisible ? 'text-green-600 font-medium' : 'text-orange-600 font-medium'}>
            {localVisible ? '✅ Visible' : '⏸️ Masqué'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
