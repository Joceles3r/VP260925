/**
 * Service de séquestre (escrow) pour transactions sécurisées
 * Path: server/services/escrowService.ts
 * Assure la sécurité des paiements entre acheteurs et vendeurs
 */

import { auditTrail } from './auditTrail';

export type EscrowStatus = 'pending' | 'funded' | 'released' | 'disputed' | 'refunded' | 'cancelled';
export type DisputeStatus = 'open' | 'pending_evidence' | 'under_review' | 'resolved_buyer' | 'resolved_seller' | 'resolved_split';

// Stockage temporaire (à remplacer par la vraie DB)
const tempEscrowStorage = new Map<string, any>();
const tempDisputeStorage = new Map<string, any>();

export interface EscrowCreationParams {
  transactionId: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  currency: 'EUR' | 'USD';
  description: string;
  listingId?: string;
  paymentMethodId?: string;
}

export interface DisputeCreationParams {
  escrowId: string;
  initiatorId: string;
  reason: string;
  evidence?: string;
  requestedResolution: 'refund' | 'release' | 'split';
}

export class EscrowService {
  /**
   * Crée une nouvelle transaction escrow
   */
  async createEscrow(params: EscrowCreationParams): Promise<{ success: boolean; escrowId?: string; error?: string }> {
    try {
      const escrowId = `escrow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const escrow = {
        id: escrowId,
        transactionId: params.transactionId,
        buyerId: params.buyerId,
        sellerId: params.sellerId,
        amount: params.amount,
        currency: params.currency,
        description: params.description,
        listingId: params.listingId,
        paymentMethodId: params.paymentMethodId,
        status: 'pending' as EscrowStatus,
        createdAt: new Date(),
        updatedAt: new Date(),
        releaseConditions: {},
        metadata: {},
      };

      // Stocker temporairement
      tempEscrowStorage.set(escrowId, escrow);

      // Audit trail
      await auditTrail.appendAudit('escrow_created', params.buyerId, {
        escrowId,
        sellerId: params.sellerId,
        amount: params.amount,
        currency: params.currency,
      });

      return { success: true, escrowId };
    } catch (error) {
      console.error('Erreur création escrow:', error);
      return { success: false, error: 'Erreur interne' };
    }
  }

  /**
   * Confirme le financement d'un escrow
   */
  async fundEscrow(escrowId: string, paymentProof: string, fundedBy: string): Promise<{ success: boolean; error?: string }> {
    try {
      const escrow = tempEscrowStorage.get(escrowId);
      if (!escrow) {
        return { success: false, error: 'Transaction escrow introuvable' };
      }

      if (escrow.status !== 'pending') {
        return { success: false, error: 'Transaction escrow non éligible au financement' };
      }

      // Mise à jour du statut
      escrow.status = 'funded';
      escrow.fundedAt = new Date();
      escrow.updatedAt = new Date();
      escrow.paymentProof = paymentProof;
      escrow.fundedBy = fundedBy;

      tempEscrowStorage.set(escrowId, escrow);

      // Audit trail
      await auditTrail.appendAudit('escrow_funded', fundedBy, {
        escrowId,
        amount: escrow.amount,
        paymentProof,
      });

      return { success: true };
    } catch (error) {
      console.error('Erreur financement escrow:', error);
      return { success: false, error: 'Erreur interne' };
    }
  }

  /**
   * Libère les fonds à destination du vendeur
   */
  async releaseEscrow(escrowId: string, releaser: string, reason: string): Promise<{ success: boolean; error?: string }> {
    try {
      const escrow = tempEscrowStorage.get(escrowId);
      if (!escrow) {
        return { success: false, error: 'Transaction escrow introuvable' };
      }

      if (escrow.status !== 'funded') {
        return { success: false, error: 'Transaction escrow non éligible à la libération' };
      }

      // Vérifier que c'est l'acheteur ou un admin qui libère
      if (releaser !== escrow.buyerId && !this.isAdmin(releaser)) {
        return { success: false, error: 'Non autorisé à libérer ces fonds' };
      }

      // Mise à jour du statut
      escrow.status = 'released';
      escrow.releasedAt = new Date();
      escrow.updatedAt = new Date();
      escrow.releasedBy = releaser;
      escrow.releaseReason = reason;

      tempEscrowStorage.set(escrowId, escrow);

      // Audit trail
      await auditTrail.appendAudit('escrow_released', releaser, {
        escrowId,
        sellerId: escrow.sellerId,
        amount: escrow.amount,
        reason,
      });

      return { success: true };
    } catch (error) {
      console.error('Erreur libération escrow:', error);
      return { success: false, error: 'Erreur interne' };
    }
  }

  /**
   * Initie un litige sur une transaction escrow
   */
  async createDispute(params: DisputeCreationParams): Promise<{ success: boolean; disputeId?: string; error?: string }> {
    try {
      const escrow = tempEscrowStorage.get(params.escrowId);
      if (!escrow) {
        return { success: false, error: 'Transaction escrow introuvable' };
      }

      if (escrow.status !== 'funded') {
        return { success: false, error: 'Seules les transactions financées peuvent faire l\'objet d\'un litige' };
      }

      // Vérifier que l'initiateur est partie prenante
      if (params.initiatorId !== escrow.buyerId && params.initiatorId !== escrow.sellerId) {
        return { success: false, error: 'Seuls les participants peuvent initier un litige' };
      }

      const disputeId = `dispute_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const dispute = {
        id: disputeId,
        escrowId: params.escrowId,
        initiatorId: params.initiatorId,
        reason: params.reason,
        evidence: params.evidence || '',
        requestedResolution: params.requestedResolution,
        status: 'open' as DisputeStatus,
        createdAt: new Date(),
        updatedAt: new Date(),
        messages: [],
        resolution: null,
      };

      // Stocker le litige
      tempDisputeStorage.set(disputeId, dispute);

      // Marquer l'escrow comme disputé
      escrow.status = 'disputed';
      escrow.disputeId = disputeId;
      escrow.updatedAt = new Date();
      tempEscrowStorage.set(params.escrowId, escrow);

      // Audit trail
      await auditTrail.appendAudit('dispute_created', params.initiatorId, {
        disputeId,
        escrowId: params.escrowId,
        reason: params.reason,
        requestedResolution: params.requestedResolution,
      });

      return { success: true, disputeId };
    } catch (error) {
      console.error('Erreur création litige:', error);
      return { success: false, error: 'Erreur interne' };
    }
  }

  /**
   * Résout un litige (admin seulement)
   */
  async resolveDispute(
    disputeId: string, 
    resolverId: string, 
    resolution: 'buyer' | 'seller' | 'split', 
    reason: string,
    splitPercentageBuyer?: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.isAdmin(resolverId)) {
        return { success: false, error: 'Seuls les administrateurs peuvent résoudre les litiges' };
      }

      const dispute = tempDisputeStorage.get(disputeId);
      if (!dispute) {
        return { success: false, error: 'Litige introuvable' };
      }

      const escrow = tempEscrowStorage.get(dispute.escrowId);
      if (!escrow) {
        return { success: false, error: 'Transaction escrow introuvable' };
      }

      // Mettre à jour le litige
      dispute.status = `resolved_${resolution}`;
      dispute.resolution = {
        type: resolution,
        reason,
        resolverId,
        resolvedAt: new Date(),
        splitPercentageBuyer: resolution === 'split' ? splitPercentageBuyer : undefined,
      };
      dispute.updatedAt = new Date();
      tempDisputeStorage.set(disputeId, dispute);

      // Mettre à jour l'escrow selon la résolution
      if (resolution === 'buyer') {
        escrow.status = 'refunded';
      } else if (resolution === 'seller') {
        escrow.status = 'released';
      } else if (resolution === 'split') {
        escrow.status = 'released'; // Split géré côté paiement
        escrow.splitPercentageBuyer = splitPercentageBuyer;
      }

      escrow.updatedAt = new Date();
      tempEscrowStorage.set(dispute.escrowId, escrow);

      // Audit trail
      await auditTrail.appendAudit('dispute_resolved', resolverId, {
        disputeId,
        escrowId: dispute.escrowId,
        resolution,
        reason,
        splitPercentageBuyer,
      });

      return { success: true };
    } catch (error) {
      console.error('Erreur résolution litige:', error);
      return { success: false, error: 'Erreur interne' };
    }
  }

  /**
   * Récupère une transaction escrow
   */
  async getEscrow(escrowId: string): Promise<any | null> {
    return tempEscrowStorage.get(escrowId) || null;
  }

  /**
   * Récupère un litige
   */
  async getDispute(disputeId: string): Promise<any | null> {
    return tempDisputeStorage.get(disputeId) || null;
  }

  /**
   * Liste les escrows d'un utilisateur
   */
  async getUserEscrows(userId: string, limit: number = 50): Promise<any[]> {
    const escrows = Array.from(tempEscrowStorage.values());
    return escrows
      .filter(escrow => escrow.buyerId === userId || escrow.sellerId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  /**
   * Liste les litiges en cours (admin)
   */
  async getActiveDisputes(): Promise<any[]> {
    const disputes = Array.from(tempDisputeStorage.values());
    return disputes
      .filter(dispute => dispute.status === 'open' || dispute.status === 'under_review')
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  /**
   * Annule une transaction escrow
   */
  async cancelEscrow(escrowId: string, cancelledBy: string, reason: string): Promise<{ success: boolean; error?: string }> {
    try {
      const escrow = tempEscrowStorage.get(escrowId);
      if (!escrow) {
        return { success: false, error: 'Transaction escrow introuvable' };
      }

      if (escrow.status !== 'pending') {
        return { success: false, error: 'Seules les transactions non financées peuvent être annulées' };
      }

      // Vérifier les autorisations
      if (cancelledBy !== escrow.buyerId && 
          cancelledBy !== escrow.sellerId && 
          !this.isAdmin(cancelledBy)) {
        return { success: false, error: 'Non autorisé à annuler cette transaction' };
      }

      escrow.status = 'cancelled';
      escrow.cancelledAt = new Date();
      escrow.updatedAt = new Date();
      escrow.cancelledBy = cancelledBy;
      escrow.cancellationReason = reason;

      tempEscrowStorage.set(escrowId, escrow);

      // Audit trail
      await auditTrail.appendAudit('escrow_cancelled', cancelledBy, {
        escrowId,
        reason,
      });

      return { success: true };
    } catch (error) {
      console.error('Erreur annulation escrow:', error);
      return { success: false, error: 'Erreur interne' };
    }
  }

  /**
   * Vérifie si un utilisateur est administrateur
   */
  private isAdmin(userId: string): boolean {
    // TODO: Implémenter la vérification admin réelle
    return userId.startsWith('admin_') || userId === 'system';
  }

  /**
   * Calcule les statistiques escrow
   */
  async getEscrowStats(): Promise<{
    total: number;
    pending: number;
    funded: number;
    released: number;
    disputed: number;
    totalVolume: number;
  }> {
    const escrows = Array.from(tempEscrowStorage.values());
    
    const stats = {
      total: escrows.length,
      pending: escrows.filter(e => e.status === 'pending').length,
      funded: escrows.filter(e => e.status === 'funded').length,
      released: escrows.filter(e => e.status === 'released').length,
      disputed: escrows.filter(e => e.status === 'disputed').length,
      totalVolume: escrows.reduce((sum, e) => sum + e.amount, 0),
    };

    return stats;
  }
}

// Instance singleton
export const escrowService = new EscrowService();