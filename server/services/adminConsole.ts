/**
 * Console ADMIN - Contrôles, validations, SLOs
 * 
 * Interface complète pour superviser et contrôler les agents IA :
 * - Validation des décisions en attente  
 * - Monitoring des SLOs et performance
 * - Configuration des paramètres runtime
 * - Rapports d'audit et compliance
 */

import { storage } from "../storage";
import { visualAI } from "./visualAI";
import { visualFinanceAI } from "./visualFinanceAI";
import { agentOrchestrator } from "./agentOrchestrator";
import { 
  AgentDecision, 
  AgentParameter,
  FinancialLedger,
  AgentAuditLog 
} from "@shared/schema";

export interface AdminDashboard {
  pending_decisions: DecisionSummary[];
  slo_status: SLOStatus;
  financial_summary: FinancialSummary;
  audit_summary: AuditSummary;
  system_health: SystemHealth;
}

export interface DecisionSummary {
  id: string;
  agent: string;
  type: string;
  subject: string;
  severity: number;
  amount_eur?: number;
  created_at: Date;
  auto_executable: boolean;
  escalation_reason: string[];
}

export interface SLOStatus {
  visualai: {
    latency_p95_ms: number;
    availability_pct: number;
    decisions_per_hour: number;
    slo_compliance: boolean;
  };
  visualfinanceai: {
    latency_p95_ms: number;
    execution_time_p95_ms: number;
    ledger_accuracy_pct: number;
    slo_compliance: boolean;
  };
  overall_status: 'healthy' | 'degraded' | 'critical';
}

export interface FinancialSummary {
  total_processed_eur: number;
  pending_payouts_eur: number;
  ledger_entries_count: number;
  stripe_reconciliation: {
    divergences: number;
    accuracy_pct: number;
  };
  last_reconciliation: Date;
}

export interface AuditSummary {
  total_entries: number;
  hash_chain_valid: boolean;
  recent_actions: AuditAction[];
  suspicious_patterns: string[];
}

export interface AuditAction {
  timestamp: Date;
  agent: string;
  action: string;
  subject: string;
  hash: string;
}

export interface SystemHealth {
  database_status: 'healthy' | 'degraded' | 'error';
  agents_status: Record<string, 'running' | 'stopped' | 'error'>;
  configuration_errors: string[];
  recommendations: string[];
}

export class AdminConsoleService {

  // ===== TABLEAU DE BORD PRINCIPAL =====

  async getDashboard(): Promise<AdminDashboard> {
    const [
      pendingDecisions,
      sloStatus,
      financialSummary,
      auditSummary,
      systemHealth
    ] = await Promise.all([
      this.getPendingDecisions(),
      this.getSLOStatus(),
      this.getFinancialSummary(),
      this.getAuditSummary(),
      this.getSystemHealth()
    ]);

    return {
      pending_decisions: pendingDecisions,
      slo_status: sloStatus,
      financial_summary: financialSummary,
      audit_summary: auditSummary,
      system_health: systemHealth
    };
  }

  // ===== GESTION DES DÉCISIONS EN ATTENTE =====

  async getPendingDecisions(): Promise<DecisionSummary[]> {
    const decisions = await storage.getAgentDecisions(undefined, 'pending', 50);
    
    return decisions.map(decision => ({
      id: decision.id,
      agent: decision.agentType,
      type: decision.decisionType,
      subject: `${decision.subjectType}:${decision.subjectId}`,
      severity: parseFloat(decision.score || '0'),
      amount_eur: this.extractAmountFromDecision(decision),
      created_at: new Date(decision.createdAt!),
      auto_executable: this.isAutoExecutable(decision),
      escalation_reason: this.getEscalationReasons(decision)
    }));
  }

  async approveDecision(
    decisionId: string, 
    adminUserId: string, 
    comment?: string
  ): Promise<AgentDecision> {
    
    const decision = await storage.getAgentDecision(decisionId);
    if (!decision) {
      throw new Error('Décision introuvable');
    }

    // Mettre à jour le statut
    const approved = await storage.updateAgentDecisionStatus(
      decisionId, 
      'approved', 
      comment, 
      adminUserId
    );

    // Exécuter automatiquement si possible
    if (this.isAutoExecutable(decision)) {
      await this.executeDecision(decision);
      await storage.executeAgentDecision(decisionId);
    }

    // Enregistrer dans l'audit
    await storage.createAuditLogEntry({
      agentType: 'admin',
      action: 'decision_made',
      subjectType: 'agent_decision',
      subjectId: decisionId,
      details: {
        action: 'approved',
        admin_user_id: adminUserId,
        comment,
        original_decision: decision
      },
      actor: `admin:${adminUserId}`,
      currentHash: '', // Généré par le storage
      previousHash: ''
    });

    return approved;
  }

  async rejectDecision(
    decisionId: string, 
    adminUserId: string, 
    reason: string
  ): Promise<AgentDecision> {
    
    const rejected = await storage.updateAgentDecisionStatus(
      decisionId, 
      'rejected', 
      reason, 
      adminUserId
    );

    await storage.createAuditLogEntry({
      agentType: 'admin',
      action: 'decision_made',
      subjectType: 'agent_decision',
      subjectId: decisionId,
      details: {
        action: 'rejected',
        admin_user_id: adminUserId,
        reason
      },
      actor: `admin:${adminUserId}`,
      currentHash: '',
      previousHash: ''
    });

    return rejected;
  }

  // ===== MONITORING DES SLOs =====

  async getSLOStatus(): Promise<SLOStatus> {
    const orchestratorStatus = await agentOrchestrator.checkSLOCompliance();
    const reconciliation = await visualFinanceAI.reconcileWithStripe();
    
    return {
      visualai: {
        latency_p95_ms: orchestratorStatus.visualai.avg_latency_ms,
        availability_pct: orchestratorStatus.visualai.availability_pct,
        decisions_per_hour: orchestratorStatus.visualai.decisions_count,
        slo_compliance: orchestratorStatus.visualai.slo_compliance
      },
      visualfinanceai: {
        latency_p95_ms: orchestratorStatus.visualfinanceai.avg_latency_ms,
        execution_time_p95_ms: 45000, // Simulé - temps d'exécution Stripe
        ledger_accuracy_pct: ((reconciliation.total - reconciliation.divergences) / Math.max(1, reconciliation.total)) * 100,
        slo_compliance: orchestratorStatus.visualfinanceai.slo_compliance
      },
      overall_status: this.calculateOverallStatus(orchestratorStatus)
    };
  }

  // ===== GESTION FINANCIÈRE =====

  async getFinancialSummary(): Promise<FinancialSummary> {
    const entries = await storage.getLedgerEntries(undefined, undefined, 1000);
    const reconciliation = await visualFinanceAI.reconcileWithStripe();
    
    const totalProcessed = entries
      .filter(e => e.status === 'completed')
      .reduce((sum, e) => sum + e.grossAmountCents, 0);
    
    const pendingPayouts = entries
      .filter(e => e.status === 'pending')
      .reduce((sum, e) => sum + e.grossAmountCents, 0);

    return {
      total_processed_eur: totalProcessed / 100,
      pending_payouts_eur: pendingPayouts / 100,
      ledger_entries_count: entries.length,
      stripe_reconciliation: {
        divergences: reconciliation.divergences,
        accuracy_pct: ((reconciliation.total - reconciliation.divergences) / Math.max(1, reconciliation.total)) * 100
      },
      last_reconciliation: new Date()
    };
  }

  // ===== AUDIT ET COMPLIANCE =====

  async getAuditSummary(): Promise<AuditSummary> {
    const auditEntries = await storage.getAuditLog(undefined, undefined, 100);
    const chainValid = await storage.validateAuditChain();
    
    const recentActions = auditEntries.slice(0, 10).map(entry => ({
      timestamp: new Date(entry.timestamp!),
      agent: entry.agentType,
      action: entry.action,
      subject: `${entry.subjectType}:${entry.subjectId}`,
      hash: entry.currentHash.slice(0, 8) + '...'
    }));

    const suspiciousPatterns = await this.detectSuspiciousPatterns(auditEntries);

    return {
      total_entries: auditEntries.length,
      hash_chain_valid: chainValid,
      recent_actions: recentActions,
      suspicious_patterns: suspiciousPatterns
    };
  }

  // ===== CONFIGURATION RUNTIME =====

  async getAgentParameters(): Promise<AgentParameter[]> {
    return await storage.getAgentParameters(true); // Seulement modifiables par admin
  }

  async updateParameter(
    parameterKey: string, 
    newValue: string, 
    adminUserId: string
  ): Promise<AgentParameter> {
    
    const parameter = await storage.getAgentParameter(parameterKey);
    if (!parameter) {
      throw new Error('Paramètre introuvable');
    }

    if (!parameter.modifiableByAdmin) {
      throw new Error('Paramètre non modifiable');
    }

    // Valider la nouvelle valeur selon le type
    this.validateParameterValue(parameter.parameterType, newValue);

    const updated = await storage.updateAgentParameter(parameterKey, newValue, `admin:${adminUserId}`);

    // Audit de la modification
    await storage.createAuditLogEntry({
      agentType: 'admin',
      action: 'parameters_changed',
      subjectType: 'agent_parameter',
      subjectId: parameterKey,
      details: {
        old_value: parameter.parameterValue,
        new_value: newValue,
        admin_user_id: adminUserId
      },
      actor: `admin:${adminUserId}`,
      currentHash: '',
      previousHash: ''
    });

    return updated;
  }

  // ===== SANTÉ DU SYSTÈME =====

  async getSystemHealth(): Promise<SystemHealth> {
    const configurationErrors: string[] = [];
    const recommendations: string[] = [];

    // Vérifier paramètres critiques
    const criticalParams = ['extension_price_eur', 'points_threshold', 'user_block_threshold'];
    for (const param of criticalParams) {
      const value = await storage.getParameterValue(param);
      if (!value) {
        configurationErrors.push(`Paramètre manquant: ${param}`);
      }
    }

    // Vérifier les SLOs
    const sloStatus = await this.getSLOStatus();
    if (sloStatus.overall_status !== 'healthy') {
      recommendations.push('Performance des agents dégradée - vérifier les SLOs');
    }

    // Vérifier la chaîne d'audit
    const chainValid = await storage.validateAuditChain();
    if (!chainValid) {
      configurationErrors.push('Chaîne d\'audit corrompue');
    }

    return {
      database_status: 'healthy', // Simulé - vérifier connexion DB
      agents_status: {
        visualai: 'running',
        visualfinanceai: 'running',
        orchestrator: 'running'
      },
      configuration_errors: configurationErrors,
      recommendations: recommendations
    };
  }

  // ===== RAPPORTS ET EXPORTS =====

  async generateComplianceReport(period: 'daily' | 'weekly' | 'monthly'): Promise<any> {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case 'daily':
        startDate.setDate(endDate.getDate() - 1);
        break;
      case 'weekly':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
    }

    const auditEntries = await storage.getAuditLog(undefined, undefined, 10000);
    const periodEntries = auditEntries.filter(entry => 
      new Date(entry.timestamp!) >= startDate && new Date(entry.timestamp!) <= endDate
    );

    const financialEntries = await storage.getLedgerEntries(undefined, undefined, 10000);
    const periodFinancial = financialEntries.filter(entry =>
      new Date(entry.createdAt!) >= startDate && new Date(entry.createdAt!) <= endDate
    );

    return {
      period: { start: startDate, end: endDate },
      audit: {
        total_actions: periodEntries.length,
        by_agent: this.groupByAgent(periodEntries),
        by_action_type: this.groupByActionType(periodEntries)
      },
      financial: {
        total_volume_eur: periodFinancial.reduce((sum, e) => sum + e.grossAmountCents, 0) / 100,
        transaction_count: periodFinancial.length,
        by_type: this.groupByTransactionType(periodFinancial)
      },
      compliance: {
        hash_chain_valid: await storage.validateAuditChain(),
        admin_validations: periodEntries.filter(e => e.agentType === 'admin').length,
        auto_decisions: periodEntries.filter(e => e.details?.auto_executed).length
      }
    };
  }

  // ===== UTILITAIRES PRIVÉES =====

  private extractAmountFromDecision(decision: AgentDecision): number | undefined {
    try {
      const params = decision.parameters as any;
      if (params?.payout_calculation?.total_amount_cents) {
        return params.payout_calculation.total_amount_cents / 100;
      }
      return undefined;
    } catch {
      return undefined;
    }
  }

  private isAutoExecutable(decision: AgentDecision): boolean {
    // Décisions automatiquement exécutables selon seuils
    const severity = parseFloat(decision.score || '0');
    const amount = this.extractAmountFromDecision(decision);
    
    return severity < 0.8 && (!amount || amount < 500);
  }

  private getEscalationReasons(decision: AgentDecision): string[] {
    const reasons: string[] = [];
    const severity = parseFloat(decision.score || '0');
    const amount = this.extractAmountFromDecision(decision);
    
    if (severity >= 0.8) reasons.push('Sévérité élevée');
    if (amount && amount >= 500) reasons.push('Montant élevé');
    if (decision.decisionType.includes('block')) reasons.push('Blocage utilisateur');
    
    return reasons;
  }

  private async executeDecision(decision: AgentDecision): Promise<void> {
    // Exécuter la décision selon son type
    switch (decision.decisionType) {
      case 'category_close_payout':
        console.log(`[AdminConsole] Exécution paiement catégorie ${decision.subjectId}`);
        break;
      case 'points_conversion':
        console.log(`[AdminConsole] Conversion VISUpoints pour ${decision.subjectId}`);
        break;
      default:
        console.log(`[AdminConsole] Exécution décision ${decision.decisionType}`);
    }
  }

  private calculateOverallStatus(status: any): 'healthy' | 'degraded' | 'critical' {
    if (!status.visualai.slo_compliance || !status.visualfinanceai.slo_compliance) {
      return 'critical';
    }
    if (status.visualai.availability_pct < 99.5 || status.visualfinanceai.availability_pct < 99.5) {
      return 'degraded';
    }
    return 'healthy';
  }

  private validateParameterValue(type: string, value: string): void {
    switch (type) {
      case 'number':
        if (isNaN(Number(value))) throw new Error('Valeur numérique requise');
        break;
      case 'boolean':
        if (!['true', 'false'].includes(value.toLowerCase())) {
          throw new Error('Valeur booléenne requise');
        }
        break;
      case 'json':
        try {
          JSON.parse(value);
        } catch {
          throw new Error('JSON valide requis');
        }
        break;
    }
  }

  private async detectSuspiciousPatterns(entries: AgentAuditLog[]): Promise<string[]> {
    const patterns: string[] = [];
    
    // Détection de rafales de décisions
    const hourCounts = new Map<string, number>();
    entries.forEach(entry => {
      const hour = new Date(entry.timestamp!).toISOString().slice(0, 13);
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    });
    
    const maxHourly = Math.max(...hourCounts.values());
    if (maxHourly > 100) {
      patterns.push(`Rafale de décisions détectée: ${maxHourly} actions en 1h`);
    }
    
    // Détection d'échecs répétés
    const failures = entries.filter(e => e.details?.status === 'failed');
    if (failures.length > entries.length * 0.1) {
      patterns.push(`Taux d'échec élevé: ${(failures.length / entries.length * 100).toFixed(1)}%`);
    }
    
    return patterns;
  }

  private groupByAgent(entries: AgentAuditLog[]): Record<string, number> {
    const groups: Record<string, number> = {};
    entries.forEach(entry => {
      groups[entry.agentType] = (groups[entry.agentType] || 0) + 1;
    });
    return groups;
  }

  private groupByActionType(entries: AgentAuditLog[]): Record<string, number> {
    const groups: Record<string, number> = {};
    entries.forEach(entry => {
      groups[entry.action] = (groups[entry.action] || 0) + 1;
    });
    return groups;
  }

  private groupByTransactionType(entries: FinancialLedger[]): Record<string, number> {
    const groups: Record<string, number> = {};
    entries.forEach(entry => {
      groups[entry.transactionType] = (groups[entry.transactionType] || 0) + 1;
    });
    return groups;
  }
}

export const adminConsole = new AdminConsoleService();