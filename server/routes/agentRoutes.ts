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

const router = express.Router();

// ===== ENDPOINTS ORCHESTRATION =====

/**
 * POST /api/agents/orchestrate/category-close
 * Déclencher workflow automatique de clôture catégorie
 */
router.post('/orchestrate/category-close', async (req, res) => {
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
router.post('/orchestrate/extension', async (req, res) => {
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
router.post('/orchestrate/points-conversion', async (req, res) => {
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

// ===== ENDPOINTS ADMIN CONSOLE =====

/**
 * GET /api/agents/admin/dashboard
 * Tableau de bord administrateur complet
 */
router.get('/admin/dashboard', async (req, res) => {
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
router.get('/admin/decisions/pending', async (req, res) => {
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
router.post('/admin/decisions/:decisionId/approve', async (req, res) => {
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
router.post('/admin/decisions/:decisionId/reject', async (req, res) => {
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
router.get('/admin/slo-status', async (req, res) => {
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
router.get('/admin/financial-summary', async (req, res) => {
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
router.get('/admin/parameters', async (req, res) => {
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
router.put('/admin/parameters/:parameterKey', async (req, res) => {
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
router.get('/admin/system-health', async (req, res) => {
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
router.post('/admin/reports/compliance', async (req, res) => {
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
router.post('/visualai/manual-moderation', async (req, res) => {
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
router.post('/visualfinanceai/manual-payout', async (req, res) => {
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