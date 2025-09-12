import React, { useState } from 'react';
import { Info, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { getMinimumCautionAmount } from '@shared/utils';
import type { Project } from '@shared/schema';

interface InvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onSuccess?: () => void;
}

export default function InvestmentModal({ isOpen, onClose, project, onSuccess }: InvestmentModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [amount, setAmount] = useState(10);
  const [isInvesting, setIsInvesting] = useState(false);

  // Function getMinimumCautionAmount is now imported from @shared/utils

  const handleInvestment = async () => {
    if (!project || !user) return;

    if (!user.kycVerified) {
      toast({
        title: "KYC requis",
        description: "Vous devez vérifier votre identité pour investir",
        variant: "destructive",
      });
      return;
    }

    const minimumCaution = getMinimumCautionAmount(user.profileType || 'investor');
    const userCaution = parseFloat(String(user.cautionEUR ?? '0'));
    if (userCaution < minimumCaution) {
      toast({
        title: "Caution insuffisante",
        description: `Une caution minimale de €${minimumCaution} est requise pour investir`,
        variant: "destructive",
      });
      return;
    }

    if (amount < 1 || amount > 20) {
      toast({
        title: "Montant invalide",
        description: "L'investissement doit être entre €1 et €20",
        variant: "destructive",
      });
      return;
    }

    const userBalance = parseFloat(String(user.balanceEUR ?? '0'));
    if (userBalance < amount) {
      toast({
        title: "Solde insuffisant",
        description: "Votre solde est insuffisant pour cet investissement",
        variant: "destructive",
      });
      return;
    }

    setIsInvesting(true);
    
    try {
      await apiRequest('POST', '/api/investments', {
        projectId: project.id,
        amount: amount.toString(),
      });

      toast({
        title: "Investissement réussi",
        description: `€${amount} investi dans ${project.title}`,
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de traiter l'investissement",
        variant: "destructive",
      });
    } finally {
      setIsInvesting(false);
    }
  };

  const commission = amount * 0.23;
  const visuPoints = amount * 100;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Investir dans le Projet" className="max-w-md">
      {project && (
        <div className="space-y-4">
          {/* Simulation Mode Banner */}
          {user?.simulationMode && (
            <div className="bg-accent/10 border border-accent/20 rounded-lg p-3" data-testid="simulation-banner">
              <div className="flex items-center">
                <Info className="h-4 w-4 text-accent mr-2" />
                <span className="text-sm font-medium text-accent">Mode Simulation</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Portefeuille virtuel: €{parseFloat(String(user.balanceEUR ?? '0')).toLocaleString()}
              </p>
            </div>
          )}

          {/* Project Info */}
          <div className="bg-muted/30 rounded-lg p-3">
            <h4 className="font-medium text-foreground" data-testid="project-title">{project.title}</h4>
            <p className="text-sm text-muted-foreground" data-testid="project-category">{project.category}</p>
            {project.roiEstimated != null && (
              <p className="text-sm text-secondary">ROI estimé: {Number.parseFloat(String(project.roiEstimated)).toFixed(1)}%</p>
            )}
          </div>

          {/* Investment Amount */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Montant (€1 - €20)
            </label>
            <Input
              type="number"
              min="1"
              max="20"
              value={amount}
              onChange={(e) => setAmount(parseInt(e.target.value) || 1)}
              className="w-full"
              data-testid="investment-amount"
            />
          </div>

          {/* Investment Summary */}
          <div className="bg-muted/30 rounded-lg p-3">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Montant investi:</span>
              <span className="text-foreground" data-testid="amount-invested">€{amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">VISUpoints reçus:</span>
              <span className="text-foreground" data-testid="visu-points">{visuPoints} VP</span>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Commission plateforme (23%):</span>
              <span className="text-foreground" data-testid="commission">€{commission.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-medium border-t border-border pt-2 mt-2">
              <span className="text-foreground">Total:</span>
              <span className="text-foreground" data-testid="total">€{amount.toFixed(2)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={isInvesting}
              data-testid="cancel-investment"
            >
              Annuler
            </Button>
            <Button
              className="flex-1"
              onClick={handleInvestment}
              disabled={isInvesting}
              data-testid="confirm-investment"
            >
              {isInvesting ? 'Investissement...' : 'Confirmer'}
            </Button>
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-muted-foreground text-center">
            Investissement soumis aux conditions générales. Aucun jeu de hasard.
          </p>
        </div>
      )}
    </Modal>
  );
}
