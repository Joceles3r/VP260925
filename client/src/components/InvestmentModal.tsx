import React, { useState } from 'react';
import { Info, X, TrendingUp, DollarSign, Award, Shield, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { getMinimumCautionAmount } from '@shared/utils';
import { ALLOWED_INVESTMENT_AMOUNTS, isValidInvestmentAmount } from '@shared/constants';
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

    if (!isValidInvestmentAmount(amount)) {
      toast({
        title: "Montant invalide",
        description: `L'investissement doit être l'un des montants suivants : ${ALLOWED_INVESTMENT_AMOUNTS.join(', ')} €`,
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
    <Modal isOpen={isOpen} onClose={onClose} title="" className="max-w-lg">
      {project && (
        <div className="space-y-6">
          {/* Enhanced Header */}
          <div className="text-center space-y-3 pb-4 border-b border-border/50">
            <div className="bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Investir dans le Projet</h2>
            <p className="text-sm text-muted-foreground">Sélectionnez votre montant d'investissement</p>
          </div>
          {/* Simulation Mode Banner */}
          {user?.simulationMode && (
            <div className="bg-gradient-to-r from-accent/10 to-accent/5 border border-accent/30 rounded-xl p-4 backdrop-blur-sm" data-testid="simulation-banner">
              <div className="flex items-center space-x-3">
                <div className="bg-accent/20 rounded-full p-2">
                  <Info className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-accent block">Mode Simulation</span>
                  <p className="text-xs text-muted-foreground">
                    Portefeuille virtuel: €{parseFloat(String(user.balanceEUR ?? '0')).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Project Info */}
          <div className="bg-gradient-to-br from-muted/40 to-muted/20 rounded-xl p-5 border border-border/50">
            <div className="flex items-start space-x-4">
              <img 
                src={project.thumbnailUrl || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=80&h=80&fit=crop'} 
                alt={project.title}
                className="w-16 h-16 rounded-lg object-cover border border-border/50"
              />
              <div className="flex-1">
                <h4 className="font-bold text-foreground text-lg" data-testid="project-title">{project.title}</h4>
                <p className="text-sm text-muted-foreground" data-testid="project-category">{project.category}</p>
                {project.roiEstimated != null && (
                  <div className="flex items-center space-x-2 mt-2">
                    <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-1.5">
                      <TrendingUp className="h-3 w-3 text-green-600 dark:text-green-400" />
                    </div>
                    <p className="text-sm font-semibold text-green-700 dark:text-green-300">
                      ROI estimé: {Number.parseFloat(String(project.roiEstimated)).toFixed(1)}%
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Enhanced Investment Amount */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-foreground flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-primary" />
              <span>Montant d'investissement</span>
            </label>
            <Select value={amount.toString()} onValueChange={(value) => setAmount(parseInt(value))}>
              <SelectTrigger className="w-full h-12 bg-gradient-to-r from-background to-muted/20 border-2 border-border/50 hover:border-primary/50 transition-colors" data-testid="investment-amount">
                <SelectValue placeholder="Sélectionnez un montant" />
              </SelectTrigger>
              <SelectContent className="bg-card border border-border/50">
                {ALLOWED_INVESTMENT_AMOUNTS.map(amount => (
                  <SelectItem key={amount} value={amount.toString()} className="cursor-pointer hover:bg-muted/50">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold">{amount} €</span>
                      <span className="text-xs text-muted-foreground">→ {amount * 100} VP</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Enhanced Investment Summary */}
          <div className="bg-gradient-to-br from-muted/40 to-muted/20 rounded-xl p-5 border border-border/50">
            <div className="flex items-center space-x-2 mb-4">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Récapitulatif de l'investissement</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-border/30">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-muted-foreground">Montant investi</span>
                </div>
                <span className="font-bold text-lg text-foreground" data-testid="amount-invested">€{amount.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-border/30">
                <div className="flex items-center space-x-2">
                  <Award className="h-4 w-4 text-purple-500" />
                  <span className="text-sm text-muted-foreground">VISUpoints reçus</span>
                </div>
                <span className="font-semibold text-purple-600 dark:text-purple-400" data-testid="visu-points">{visuPoints} VP</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-border/30">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-orange-500" />
                  <span className="text-sm text-muted-foreground">Commission plateforme (23%)</span>
                </div>
                <span className="font-medium text-orange-600 dark:text-orange-400" data-testid="commission">€{commission.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-center py-3 bg-primary/5 rounded-lg px-3 border border-primary/20">
                <span className="font-bold text-foreground">Total à payer</span>
                <span className="font-bold text-xl text-primary" data-testid="total">€{amount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Enhanced Action Buttons */}
          <div className="flex gap-4 pt-4">
            <Button
              variant="outline"
              className="flex-1 h-12 border-2 border-border/50 hover:border-border text-muted-foreground hover:text-foreground transition-all"
              onClick={onClose}
              disabled={isInvesting}
              data-testid="cancel-investment"
            >
              Annuler
            </Button>
            <Button
              className="flex-1 h-12 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300"
              onClick={handleInvestment}
              disabled={isInvesting}
              data-testid="confirm-investment"
            >
              <div className="flex items-center space-x-2">
                <TrendingUp className={`h-4 w-4 ${isInvesting ? 'animate-spin' : ''}`} />
                <span>{isInvesting ? 'Investissement...' : 'Confirmer l\'investissement'}</span>
              </div>
            </Button>
          </div>

          {/* Enhanced Disclaimer */}
          <div className="text-center pt-4 border-t border-border/50">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <Shield className="h-3 w-3 inline mr-1" />
              Investissement soumis aux conditions générales. Aucun jeu de hasard.
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
}
