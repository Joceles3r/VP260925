/**
 * API Routes pour les Agents IA
 * 
 * Endpoints pour l'orchestration et l'administration des agents
 */

import express from 'express';
import { z } from 'zod';
import { agentOrchestrator } from '../services/agentOrchestrator';
import { adminConsole } from '../services/adminConsole';
import { visualAI } from '../services/visualAI';
import { visualFinanceAI } from '../services/visualFinanceAI';
import { storage } from '../storage';
import { isAuthenticated } from '../replitAuth';

const router = express.Router();

// MIDDLEWARE SÉCURITÉ ADMIN - CRITIQUE POUR PROTECTION
const requireAdminAccess = async (req: any, res: any, next: any) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ error: 'Authentification requise' });
    }

    const user = await storage.getUser(userId);
    if (!user || user.profileType !== 'admin') {
      // Log tentative d'accès non autorisé pour sécurité
      await storage.createAuditLogEntry({
        agentType: 'admin',
        action: 'policy_updated',
        subjectType: 'unauthorized_access',
        subjectId: userId,
        details: {
          endpoint: req.originalUrl,
          method: req.method,
          userAgent: req.get('User-Agent'),
          ip: req.ip,
          profileType: user?.profileType || 'none'
        },
        actor: `security:${userId}`,
        currentHash: '',
        previousHash: ''
      });
      return res.status(403).json({ error: 'Accès administrateur requis' });
    }

    req.adminUser = user;
    next();
  } catch (error) {
    console.error('[AgentRoutes] Erreur vérification admin:', error);
    res.status(500).json({ error: 'Erreur de vérification des droits' });
  }
};

// MIDDLEWARE ORCHESTRATION - Seulement pour systèmes autorisés
const requireOrchestrationAccess = async (req: any, res: any, next: any) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ error: 'Authentification requise' });
    }

    const user = await storage.getUser(userId);
    if (!user || !['admin', 'system'].includes(user.profileType)) {
      return res.status(403).json({ error: 'Accès orchestration non autorisé' });
    }

    req.orchestrationUser = user;
    next();
  } catch (error) {
    console.error('[AgentRoutes] Erreur vérification orchestration:', error);
    res.status(500).json({ error: 'Erreur de vérification des droits' });
  }
};

// ===== ENDPOINTS ORCHESTRATION =====

/**
 * POST /api/agents/orchestrate/category-close
 * Déclencher workflow automatique de clôture catégorie
 */
router.post('/orchestrate/category-close', isAuthenticated, requireOrchestrationAccess, async (req, res) => {
  try {
    const { categoryId, projects, investments } = req.body;
    
    if (!categoryId || !projects || !investments) {
      return res.status(400).json({ error: 'Paramètres manquants' });
    }

    const execution = await agentOrchestrator.executeCategoryCloseWorkflow(
      categoryId,
      projects,
      investments
    );

    res.json({
      workflow_id: execution.id,
      status: execution.status,
      steps: execution.steps.map(step => ({
        name: step.name,
        agent: step.agent,
        status: step.status,
        duration_ms: step.duration_ms,
        slo_met: !step.duration_ms || step.duration_ms <= step.slo_target_ms
      })),
      requires_approval: execution.status === 'requires_approval'
    });

  } catch (error) {
    console.error('[AgentRoutes] Erreur workflow clôture:', error);
    res.status(500).json({ error: 'Erreur lors du workflow' });
  }
});

/**
 * POST /api/agents/orchestrate/extension
 * Traiter extension payante 168h
 */
router.post('/orchestrate/extension', isAuthenticated, requireOrchestrationAccess, async (req, res) => {
  try {
    const { projectId, userId, paymentIntentId } = req.body;
    
    const execution = await agentOrchestrator.executeExtensionWorkflow(
      projectId,
      userId,
      paymentIntentId
    );

    res.json({
      workflow_id: execution.id,
      status: execution.status,
      extension_granted: execution.status === 'completed'
    });

  } catch (error) {
    console.error('[AgentRoutes] Erreur workflow extension:', error);
    res.status(500).json({ error: 'Erreur lors de l\'extension' });
  }
});

/**
 * POST /api/agents/orchestrate/points-conversion
 * Convertir VISUpoints en euros
 */
router.post('/orchestrate/points-conversion', isAuthenticated, requireOrchestrationAccess, async (req, res) => {
  try {
    const { userId, availablePoints } = req.body;
    
    const execution = await agentOrchestrator.executePointsConversionWorkflow(
      userId,
      availablePoints
    );

    res.json({
      workflow_id: execution.id,
      status: execution.status,
      conversion_executed: execution.status === 'completed'
    });

  } catch (error) {
    console.error('[AgentRoutes] Erreur conversion points:', error);
    res.status(500).json({ error: 'Erreur lors de la conversion' });
  }
});

/**
 * POST /api/agents/orchestrate/golden-ticket
 * Traiter remboursement Golden Ticket
 */
router.post('/orchestrate/golden-ticket', isAuthenticated, requireOrchestrationAccess, async (req, res) => {
  try {
    const { userId, categoryId, purchaseAmountCents, finalRank } = req.body;
    
    if (!userId || !categoryId || !purchaseAmountCents || finalRank === undefined) {
      return res.status(400).json({ error: 'Paramètres manquants pour Golden Ticket' });
    }

    // Calcul du remboursement selon les règles de rang
    const refundResult = await visualFinanceAI.calculateGoldenTicketRefund({
      userId,
      categoryId, 
      purchaseAmountCents,
      finalRank
    });

    // Orchestration : Décision VisualAI puis exécution VisualFinanceAI
    const orchestrationResult = await agentOrchestrator.executeGoldenTicketWorkflow({
      userId,
      categoryId,
      refundData: refundResult
    });

    res.json({
      success: true,
      refundPercentage: refundResult.refundPercentage,
      refundAmountCents: refundResult.refundAmountCents,
      executionId: orchestrationResult.executionId,
      status: orchestrationResult.status
    });
  } catch (error) {
    console.error('[AgentRoutes] Erreur Golden Ticket:', error);
    res.status(500).json({ error: 'Erreur lors du remboursement Golden Ticket' });
  }
});

/**
 * POST /api/agents/orchestrate/article-sale
 * Traiter vente d'article avec partage 30/70
 */
router.post('/orchestrate/article-sale', isAuthenticated, requireOrchestrationAccess, async (req, res) => {
  try {
    const { articleId, buyerId, priceEUR } = req.body;
    
    if (!articleId || !buyerId || !priceEUR) {
      return res.status(400).json({ error: 'Paramètres manquants pour vente article' });
    }

    // Calcul de la répartition 30% plateforme / 70% créateur
    const saleResult = await visualFinanceAI.processArticleSale({
      articleId,
      buyerId,
      priceEUR
    });

    // Orchestration complète de la vente
    const orchestrationResult = await agentOrchestrator.executeArticleSaleWorkflow({
      articleId,
      buyerId,
      saleData: saleResult
    });

    res.json({
      success: true,
      platformShare: saleResult.platformShareCents,
      creatorShare: saleResult.creatorShareCents,
      totalPriceCents: saleResult.totalPriceCents,
      executionId: orchestrationResult.executionId,
      status: orchestrationResult.status
    });
  } catch (error) {
    console.error('[AgentRoutes] Erreur vente article:', error);
    res.status(500).json({ error: 'Erreur lors de la vente article' });
  }
});

// ===== ENDPOINTS ADMIN CONSOLE =====

/**
 * GET /api/agents/admin/dashboard
 * Tableau de bord administrateur complet
 */
router.get('/admin/dashboard', isAuthenticated, requireAdminAccess, async (req, res) => {
  try {
    const dashboard = await adminConsole.getDashboard();
    res.json(dashboard);
  } catch (error) {
    console.error('[AgentRoutes] Erreur dashboard:', error);
    res.status(500).json({ error: 'Erreur lors du chargement dashboard' });
  }
});

/**
 * GET /api/agents/admin/decisions/pending
 * Récupérer décisions en attente de validation
 */
router.get('/admin/decisions/pending', isAuthenticated, requireAdminAccess, async (req, res) => {
  try {
    const pendingDecisions = await adminConsole.getPendingDecisions();
    res.json(pendingDecisions);
  } catch (error) {
    console.error('[AgentRoutes] Erreur décisions en attente:', error);
    res.status(500).json({ error: 'Erreur lors du chargement des décisions' });
  }
});

/**
 * POST /api/agents/admin/decisions/:decisionId/approve
 * Approuver une décision en attente
 */
router.post('/admin/decisions/:decisionId/approve', isAuthenticated, requireAdminAccess, async (req, res) => {
  try {
    const { decisionId } = req.params;
    const { adminUserId, comment } = req.body;
    
    if (!adminUserId) {
      return res.status(400).json({ error: 'ID administrateur requis' });
    }

    const approved = await adminConsole.approveDecision(decisionId, adminUserId, comment);
    
    res.json({
      decision_id: approved.id,
      status: approved.status,
      approved_by: adminUserId,
      approved_at: new Date()
    });

  } catch (error) {
    console.error('[AgentRoutes] Erreur approbation décision:', error);
    res.status(500).json({ error: 'Erreur lors de l\'approbation' });
  }
});

/**
 * POST /api/agents/admin/decisions/:decisionId/reject
 * Rejeter une décision en attente
 */
router.post('/admin/decisions/:decisionId/reject', isAuthenticated, requireAdminAccess, async (req, res) => {
  try {
    const { decisionId } = req.params;
    const { adminUserId, reason } = req.body;
    
    if (!adminUserId || !reason) {
      return res.status(400).json({ error: 'ID administrateur et raison requis' });
    }

    const rejected = await adminConsole.rejectDecision(decisionId, adminUserId, reason);
    
    res.json({
      decision_id: rejected.id,
      status: rejected.status,
      rejected_by: adminUserId,
      rejected_at: new Date(),
      reason
    });

  } catch (error) {
    console.error('[AgentRoutes] Erreur rejet décision:', error);
    res.status(500).json({ error: 'Erreur lors du rejet' });
  }
});

/**
 * GET /api/agents/admin/slo-status
 * Statut des SLOs et performance
 */
router.get('/admin/slo-status', isAuthenticated, requireAdminAccess, async (req, res) => {
  try {
    const sloStatus = await adminConsole.getSLOStatus();
    res.json(sloStatus);
  } catch (error) {
    console.error('[AgentRoutes] Erreur SLO status:', error);
    res.status(500).json({ error: 'Erreur lors du chargement SLO' });
  }
});

/**
 * GET /api/agents/admin/financial-summary
 * Résumé financier et réconciliation
 */
router.get('/admin/financial-summary', isAuthenticated, requireAdminAccess, async (req, res) => {
  try {
    const summary = await adminConsole.getFinancialSummary();
    res.json(summary);
  } catch (error) {
    console.error('[AgentRoutes] Erreur résumé financier:', error);
    res.status(500).json({ error: 'Erreur lors du résumé financier' });
  }
});

/**
 * GET /api/agents/admin/parameters
 * Récupérer paramètres configurables
 */
router.get('/admin/parameters', isAuthenticated, requireAdminAccess, async (req, res) => {
  try {
    const parameters = await adminConsole.getAgentParameters();
    res.json(parameters);
  } catch (error) {
    console.error('[AgentRoutes] Erreur paramètres:', error);
    res.status(500).json({ error: 'Erreur lors du chargement des paramètres' });
  }
});

/**
 * PUT /api/agents/admin/parameters/:parameterKey
 * Modifier un paramètre runtime
 */
router.put('/admin/parameters/:parameterKey', isAuthenticated, requireAdminAccess, async (req, res) => {
  try {
    const { parameterKey } = req.params;
    const { value, adminUserId } = req.body;
    
    if (!value || !adminUserId) {
      return res.status(400).json({ error: 'Valeur et ID administrateur requis' });
    }

    const updated = await adminConsole.updateParameter(parameterKey, value, adminUserId);
    
    res.json({
      parameter_key: updated.parameterKey,
      old_value: req.body.oldValue, // À passer depuis le frontend
      new_value: updated.parameterValue,
      updated_by: adminUserId,
      updated_at: updated.lastModifiedAt
    });

  } catch (error) {
    console.error('[AgentRoutes] Erreur mise à jour paramètre:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Erreur lors de la mise à jour' });
  }
});

/**
 * GET /api/agents/admin/system-health
 * Santé du système et recommandations
 */
router.get('/admin/system-health', isAuthenticated, requireAdminAccess, async (req, res) => {
  try {
    const health = await adminConsole.getSystemHealth();
    res.json(health);
  } catch (error) {
    console.error('[AgentRoutes] Erreur santé système:', error);
    res.status(500).json({ error: 'Erreur lors du check santé' });
  }
});

/**
 * POST /api/agents/admin/reports/compliance
 * Générer rapport de compliance
 */
router.post('/admin/reports/compliance', isAuthenticated, requireAdminAccess, async (req, res) => {
  try {
    const { period } = req.body; // 'daily', 'weekly', 'monthly'
    
    if (!['daily', 'weekly', 'monthly'].includes(period)) {
      return res.status(400).json({ error: 'Période invalide' });
    }

    const report = await adminConsole.generateComplianceReport(period);
    
    res.json(report);

  } catch (error) {
    console.error('[AgentRoutes] Erreur rapport compliance:', error);
    res.status(500).json({ error: 'Erreur lors du rapport' });
  }
});

// ===== ENDPOINTS AGENTS INDIVIDUELS =====

/**
 * POST /api/agents/visualai/manual-moderation
 * Modération manuelle via VisualAI
 */
router.post('/visualai/manual-moderation', isAuthenticated, requireAdminAccess, async (req, res) => {
  try {
    const { projectId, reason } = req.body;
    
    const result = await visualAI.moderateContent(projectId, 'manual', {
      manual_review: true,
      reason
    });
    
    res.json(result);

  } catch (error) {
    console.error('[AgentRoutes] Erreur modération manuelle:', error);
    res.status(500).json({ error: 'Erreur lors de la modération' });
  }
});

/**
 * POST /api/agents/visualfinanceai/manual-payout
 * Paiement manuel via VisualFinanceAI  
 */
router.post('/visualfinanceai/manual-payout', isAuthenticated, requireAdminAccess, async (req, res) => {
  try {
    const { userId, amountCents, reason } = req.body;
    
    if (!userId || !amountCents || !reason) {
      return res.status(400).json({ error: 'Paramètres manquants' });
    }

    // Validation admin requise pour paiements manuels
    const decision = await storage.createAgentDecision({
      agentType: 'visualfinanceai',
      decisionType: 'manual_payout',
      subjectId: userId,
      subjectType: 'user',
      ruleApplied: 'manual_admin_v1',
      score: (amountCents / 100).toString(),
      justification: `Paiement manuel: ${reason}`,
      parameters: { amount_cents: amountCents, reason },
      status: 'pending' // Nécessite approbation admin
    });
    
    res.json({
      decision_id: decision.id,
      requires_admin_approval: true,
      amount_eur: amountCents / 100
    });

  } catch (error) {
    console.error('[AgentRoutes] Erreur paiement manuel:', error);
    res.status(500).json({ error: 'Erreur lors du paiement' });
  }
});

export default router;