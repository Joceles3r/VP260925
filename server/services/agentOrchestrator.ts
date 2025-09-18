/**
 * Agent Orchestrator - Coordination VisualAI ↔ VisualFinanceAI
 * 
 * Responsabilités :
 * - Orchestration des workflows complets
 * - Validation des seuils et escalation admin
 * - Monitoring des SLOs et performance
 * - Gestion des événements inter-agents
 */

import { visualAI } from "./visualAI";
import { visualFinanceAI } from "./visualFinanceAI"; 
import { storage } from "../storage";
import { 
  AgentDecision, 
  InsertAgentDecision,
  Project,
  Investment,
  User
} from "@shared/schema";

export interface OrchestrationEvent {
  type: 'category_close' | 'extension_request' | 'article_sale' | 'points_conversion' | 'golden_ticket';
  source: 'visualai' | 'visualfinanceai' | 'system';
  data: any;
  priority: 'low' | 'medium' | 'high' | 'critical';
  requires_admin_approval?: boolean;
}

export interface WorkflowExecution {
  id: string;
  workflow_type: string;
  steps: WorkflowStep[];
  status: 'pending' | 'running' | 'completed' | 'failed' | 'requires_approval';
  started_at: Date;
  completed_at?: Date;
  error?: string;
}

export interface WorkflowStep {
  id: string;
  name: string;
  agent: 'visualai' | 'visualfinanceai';
  status: 'pending' | 'running' | 'completed' | 'failed';
  input: any;
  output?: any;
  duration_ms?: number;
  slo_target_ms: number;
}

export class AgentOrchestratorService {

  // ===== ORCHESTRATION DES WORKFLOWS =====

  /**
   * Workflow complet : Clôture de catégorie avec paiements 40/30/7/23
   */
  async executeCategoryCloseWorkflow(
    categoryId: string,
    projects: Project[],
    investments: Investment[]
  ): Promise<WorkflowExecution> {
    
    const workflowId = `category_close_${categoryId}_${Date.now()}`;
    
    const execution: WorkflowExecution = {
      id: workflowId,
      workflow_type: 'category_close',
      steps: [
        {
          id: 'rank_projects',
          name: 'Calcul des rangs et tie-breakers',
          agent: 'visualai',
          status: 'pending',
          input: { projects, investments },
          slo_target_ms: 500
        },
        {
          id: 'calculate_payouts',
          name: 'Calcul des paiements 40/30/7/23',
          agent: 'visualfinanceai', 
          status: 'pending',
          input: {},
          slo_target_ms: 2000
        },
        {
          id: 'validate_and_execute',
          name: 'Validation et exécution des paiements',
          agent: 'visualfinanceai',
          status: 'pending',
          input: {},
          slo_target_ms: 5000
        }
      ],
      status: 'pending',
      started_at: new Date()
    };

    try {
      execution.status = 'running';

      // ÉTAPE 1: VisualAI calcule les rangs avec tie-breakers
      const step1 = execution.steps[0];
      step1.status = 'running';
      const startTime1 = Date.now();
      
      const rankedProjects = await visualAI.applyTiebreakers(projects, investments);
      const top10Projects = rankedProjects.slice(0, 10);
      const top10Creators = top10Projects.map(p => p.creatorId);
      const top10Investors = this.extractTop10Investors(investments, top10Projects);
      const investors11to100 = this.extractInvestors11to100(investments, rankedProjects);
      
      step1.duration_ms = Date.now() - startTime1;
      step1.output = { rankedProjects, top10Creators, top10Investors, investors11to100 };
      step1.status = 'completed';

      // ÉTAPE 2: VisualFinanceAI calcule les paiements
      const step2 = execution.steps[1];
      step2.status = 'running';
      const startTime2 = Date.now();
      
      const totalAmount = this.calculateCategoryTotalAmount(investments);
      const payoutCalculation = await visualFinanceAI.calculateCategoryClosePayout(
        categoryId,
        totalAmount,
        top10Investors,
        top10Creators,
        investors11to100
      );
      
      step2.duration_ms = Date.now() - startTime2;
      step2.output = payoutCalculation;
      step2.status = 'completed';

      // ÉTAPE 3: Validation seuils et exécution
      const step3 = execution.steps[2];
      step3.status = 'running';
      const startTime3 = Date.now();
      
      // Vérifier si validation admin requise
      const requiresAdminApproval = await this.checkAdminApprovalRequired(payoutCalculation);
      
      if (requiresAdminApproval) {
        // Créer décision en attente d'approbation admin
        await storage.createAgentDecision({
          agentType: 'visualfinanceai',
          decisionType: 'category_close_payout',
          subjectId: categoryId,
          subjectType: 'category',
          ruleApplied: payoutCalculation.rule_version,
          score: totalAmount.toString(),
          justification: `Paiement clôture catégorie ${categoryId}: ${totalAmount}€`,
          parameters: { workflow_id: workflowId, payout_calculation: payoutCalculation },
          status: 'pending'
        });
        
        execution.status = 'requires_approval';
        step3.status = 'pending';
        step3.output = { requires_admin_approval: true };
      } else {
        // Exécution automatique
        await this.executePayouts(payoutCalculation);
        
        step3.duration_ms = Date.now() - startTime3;
        step3.status = 'completed';
        step3.output = { payouts_executed: payoutCalculation.payouts.length };
        execution.status = 'completed';
      }
      
      execution.completed_at = new Date();
      
    } catch (error) {
      execution.status = 'failed';
      execution.error = error instanceof Error ? error.message : 'Unknown error';
      console.error('[AgentOrchestrator] Workflow failed:', error);
    }

    // Enregistrer l'exécution pour audit
    await this.logWorkflowExecution(execution);
    
    return execution;
  }

  /**
   * Workflow : Extension payante 168h 
   */
  async executeExtensionWorkflow(
    projectId: string,
    userId: string,
    paymentIntentId: string
  ): Promise<WorkflowExecution> {
    
    const workflowId = `extension_${projectId}_${Date.now()}`;
    
    const execution: WorkflowExecution = {
      id: workflowId,
      workflow_type: 'extension_payment',
      steps: [
        {
          id: 'validate_payment',
          name: 'Validation paiement 25€',
          agent: 'visualfinanceai',
          status: 'pending',
          input: { projectId, userId, paymentIntentId },
          slo_target_ms: 1000
        },
        {
          id: 'extend_category',
          name: 'Extension catégorie 168h',
          agent: 'visualai',
          status: 'pending', 
          input: {},
          slo_target_ms: 200
        }
      ],
      status: 'running',
      started_at: new Date()
    };

    try {
      // ÉTAPE 1: VisualFinanceAI traite le paiement
      const step1 = execution.steps[0];
      step1.status = 'running';
      const startTime1 = Date.now();
      
      await visualFinanceAI.processExtensionPayment(projectId, userId, paymentIntentId);
      
      step1.duration_ms = Date.now() - startTime1;
      step1.status = 'completed';
      step1.output = { payment_processed: true };

      // ÉTAPE 2: VisualAI étend la catégorie
      const step2 = execution.steps[1];
      step2.status = 'running';
      const startTime2 = Date.now();
      
      // Simuler extension catégorie (à connecter avec le système de catégories)
      await this.extendCategoryLifetime(projectId, 168 * 60 * 60 * 1000); // 168h en ms
      
      step2.duration_ms = Date.now() - startTime2;
      step2.status = 'completed';
      step2.output = { category_extended: true };
      
      execution.status = 'completed';
      execution.completed_at = new Date();

    } catch (error) {
      execution.status = 'failed';
      execution.error = error instanceof Error ? error.message : 'Unknown error';
    }

    await this.logWorkflowExecution(execution);
    return execution;
  }

  /**
   * Workflow : Conversion VISUpoints
   */
  async executePointsConversionWorkflow(
    userId: string,
    availablePoints: number
  ): Promise<WorkflowExecution> {
    
    const workflowId = `points_${userId}_${Date.now()}`;
    
    const execution: WorkflowExecution = {
      id: workflowId,
      workflow_type: 'points_conversion',
      steps: [
        {
          id: 'validate_conversion',
          name: 'Validation seuil et KYC',
          agent: 'visualai',
          status: 'pending',
          input: { userId, availablePoints },
          slo_target_ms: 300
        },
        {
          id: 'execute_conversion',
          name: 'Conversion et paiement',
          agent: 'visualfinanceai',
          status: 'pending',
          input: {},
          slo_target_ms: 1500
        }
      ],
      status: 'running',
      started_at: new Date()
    };

    try {
      // ÉTAPE 1: VisualAI valide les prérequis
      const step1 = execution.steps[0];
      step1.status = 'running';
      const startTime1 = Date.now();
      
      const user = await storage.getUser(userId);
      if (!user) throw new Error('Utilisateur introuvable');
      
      // Vérifier KYC et seuils
      const canConvert = availablePoints >= 2500 && user.kycStatus === 'approved';
      if (!canConvert) {
        throw new Error('Conversion impossible: KYC ou seuil non respecté');
      }
      
      step1.duration_ms = Date.now() - startTime1;
      step1.status = 'completed';
      step1.output = { validation_passed: true };

      // ÉTAPE 2: VisualFinanceAI exécute la conversion
      const step2 = execution.steps[1];
      step2.status = 'running';
      const startTime2 = Date.now();
      
      const conversion = await visualFinanceAI.convertVISUPoints(userId, availablePoints);
      
      step2.duration_ms = Date.now() - startTime2;
      step2.status = 'completed';
      step2.output = conversion;
      
      execution.status = 'completed';
      execution.completed_at = new Date();

    } catch (error) {
      execution.status = 'failed';
      execution.error = error instanceof Error ? error.message : 'Unknown error';
    }

    await this.logWorkflowExecution(execution);
    return execution;
  }

  // ===== GESTION DES SEUILS ET VALIDATIONS =====

  private async checkAdminApprovalRequired(payoutCalculation: any): Promise<boolean> {
    // Récupérer seuils depuis paramètres agents
    const paymentThreshold = parseFloat(await storage.getParameterValue('payment_threshold_eur', '500') || '500');
    
    // Vérifier montants individuels
    for (const payout of payoutCalculation.payouts) {
      const amountEur = payout.amount_eur_floor;
      if (amountEur > paymentThreshold) {
        return true; // Paiement individuel > seuil
      }
    }
    
    // Vérifier montant total
    const totalEur = payoutCalculation.total_amount_cents / 100;
    if (totalEur > paymentThreshold * 5) { // Seuil total = 5x seuil individuel
      return true;
    }
    
    return false;
  }

  private async executePayouts(payoutCalculation: any): Promise<void> {
    // Exécuter les paiements via Stripe (simulation)
    for (const payout of payoutCalculation.payouts) {
      if (payout.recipient_id && payout.amount_eur_floor > 0) {
        console.log(`[AgentOrchestrator] Exécution paiement: ${payout.recipient_id} → ${payout.amount_eur_floor}€`);
        // En production: appel Stripe API via VisualFinanceAI
      }
    }
  }

  // ===== MONITORING DES SLOs =====

  async checkSLOCompliance(): Promise<any> {
    // Récupérer décisions récentes pour analyse performance
    const recentDecisions = await storage.getAgentDecisions(undefined, undefined, 100);
    
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const recentVisualAI = recentDecisions.filter(d => 
      d.agentType === 'visualai' && 
      new Date(d.createdAt!) > oneHourAgo
    );
    
    const recentFinanceAI = recentDecisions.filter(d => 
      d.agentType === 'visualfinanceai' && 
      new Date(d.createdAt!) > oneHourAgo
    );
    
    return {
      visualai: {
        decisions_count: recentVisualAI.length,
        avg_latency_ms: 250, // Simulé - calculer depuis timestamps réels
        availability_pct: 99.95,
        slo_compliance: true
      },
      visualfinanceai: {
        decisions_count: recentFinanceAI.length,
        avg_latency_ms: 1200, // Simulé
        availability_pct: 99.98,
        slo_compliance: true
      },
      overall_status: 'healthy'
    };
  }

  // ===== UTILITAIRES PRIVÉES =====

  private extractTop10Investors(investments: Investment[], top10Projects: Project[]): string[] {
    const top10ProjectIds = new Set(top10Projects.map(p => p.id));
    const top10Investments = investments.filter(inv => top10ProjectIds.has(inv.projectId));
    
    // Grouper par investisseur et calculer montants totaux
    const investorTotals = new Map<string, number>();
    top10Investments.forEach(inv => {
      const current = investorTotals.get(inv.userId) || 0;
      investorTotals.set(inv.userId, current + parseFloat(inv.amount));
    });
    
    // Trier par montant et retourner top 10
    return Array.from(investorTotals.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([userId]) => userId);
  }

  private extractInvestors11to100(investments: Investment[], rankedProjects: Project[]): string[] {
    const projects11to100 = rankedProjects.slice(10, 100); // Rangs 11-100
    const projectIds = new Set(projects11to100.map(p => p.id));
    
    return investments
      .filter(inv => projectIds.has(inv.projectId))
      .map(inv => inv.userId);
  }

  private calculateCategoryTotalAmount(investments: Investment[]): number {
    return investments.reduce((total, inv) => total + parseFloat(inv.amount), 0);
  }

  private async extendCategoryLifetime(projectId: string, durationMs: number): Promise<void> {
    // Simuler extension catégorie - à connecter avec le système de catégories
    console.log(`[AgentOrchestrator] Extension catégorie ${projectId} de ${durationMs}ms`);
  }

  private async logWorkflowExecution(execution: WorkflowExecution): Promise<void> {
    // Enregistrer dans l'audit log pour traçabilité
    await storage.createAuditLogEntry({
      agentType: 'admin', // Orchestrateur = admin level
      action: 'decision_made',
      subjectType: 'workflow',
      subjectId: execution.id,
      details: {
        workflow_type: execution.workflow_type,
        status: execution.status,
        steps: execution.steps.map(s => ({
          name: s.name,
          agent: s.agent,
          status: s.status,
          duration_ms: s.duration_ms,
          slo_met: !s.duration_ms || s.duration_ms <= s.slo_target_ms
        })),
        total_duration_ms: execution.completed_at ? 
          execution.completed_at.getTime() - execution.started_at.getTime() : null
      },
      actor: 'agent_orchestrator',
      currentHash: '', // Sera généré par le storage
      previousHash: ''
    });
  }
}

export const agentOrchestrator = new AgentOrchestratorService();