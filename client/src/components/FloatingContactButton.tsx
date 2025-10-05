import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { MessageCircle, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { InternalMessageForm } from './InternalMessageForm';
import { cn } from '@/lib/utils';

interface FloatingContactButtonProps {
  className?: string;
}

export const FloatingContactButton: React.FC<FloatingContactButtonProps> = ({
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Récupérer la configuration du bouton
  const { data: config } = useQuery({
    queryKey: ['floating-button-config'],
    queryFn: async () => {
      const response = await fetch('/api/internal-messages/floating-button-config');
      if (!response.ok) throw new Error('Erreur lors du chargement de la configuration');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // Cache 5 minutes
  });

  // Ne pas afficher si désactivé par l'admin
  if (!config?.isEnabled) {
    return null;
  }

  const buttonText = config?.buttonText || 'Contacter le Responsable';
  const buttonColor = config?.buttonColor || '#dc2626';
  const position = config?.position || 'bottom-right';

  // Classes de positionnement
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
  };

  const handleSuccess = () => {
    setIsOpen(false);
  };

  const handleCancel = () => {
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          className={cn(
            'fixed z-50 h-14 px-4 shadow-lg hover:shadow-xl transition-all duration-200 rounded-full',
            'flex items-center gap-2 text-white font-medium',
            'animate-pulse hover:animate-none',
            positionClasses[position as keyof typeof positionClasses] || positionClasses['bottom-right'],
            className
          )}
          style={{
            backgroundColor: buttonColor,
            borderColor: buttonColor,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = buttonColor + 'dd';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = buttonColor;
          }}
        >
          <MessageCircle className="h-5 w-5" />
          <span className="hidden sm:inline">{buttonText}</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <div className="relative">
          {/* Bouton de fermeture personnalisé */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 z-10"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Formulaire de contact */}
          <div className="p-6">
            <InternalMessageForm
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};