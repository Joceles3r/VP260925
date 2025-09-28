/**
 * Agent Coordinator - Orchestration des agents IA VISUAL
 * Assure la coopération harmonieuse entre tous les agents
 */

import { visualScoutAI } from './visualScoutAI';

export interface AgentStatus {
  name: string;
  enabled: boolean;
  lastActivity: Date;
  health: 'healthy' | 'warning' | 'error';
  metrics: Record<string, any>;
}

export interface AgentCommand {
  agentName: string;
  action: string;
  parameters: Record<string, any>;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  requestedBy: string; // Admin user ID
}

export class AgentCoordinator {
  private agents: Map<string, any> = new Map();
  private commandQueue: AgentCommand[] = [];
  private isProcessing: boolean = false;

  constructor() {
    // Enregistrement des agents VISUAL
    this.registerAgent('VisualScoutAI', visualScoutAI);
    // this.registerAgent('VisualAI', visualAI); // À ajouter quand disponible
    // this.registerAgent('VisualFinanceAI', visualFinanceAI); // À ajouter quand disponible
  }

  // Enregistrement d'un agent
  registerAgent(name: string, agent: any): void {
    this.agents.set(name, agent);
    console.log(`🤖 Agent registered: ${name}`);
  }

  // Statut de tous les agents
  async getAllAgentsStatus(): Promise<AgentStatus[]> {
    const statuses: AgentStatus[] = [];

    for (const [name, agent] of this.agents) {
      try {
        const status: AgentStatus = {
          name,
          enabled: agent.enabled !== false,
          lastActivity: new Date(),
          health: 'healthy',
          metrics: {}
        };

        // Métriques spécifiques par agent
        if (name === 'VisualScoutAI') {
          status.metrics = await agent.getDashboardMetrics();
        }

        statuses.push(status);
      } catch (error) {
        statuses.push({
          name,
          enabled: false,
          lastActivity: new Date(),
          health: 'error',
          metrics: { error: error instanceof Error ? error.message : 'Unknown error' }
        });
      }
    }

    return statuses;
  }

  // Envoi de commande à un agent
  async sendCommand(command: AgentCommand): Promise<{
    success: boolean;
    result?: any;
    error?: string;
  }> {
    const agent = this.agents.get(command.agentName);
    
    if (!agent) {
      return {
        success: false,
        error: `Agent ${command.agentName} not found`
      };
    }

    try {
      // Log de la commande admin
      console.log(`📋 Admin Command: ${command.action} → ${command.agentName}`, {
        requestedBy: command.requestedBy,
        priority: command.priority,
        parameters: command.parameters
      });

      // Exécution de la commande selon l'agent
      let result;
      
      if (command.agentName === 'VisualScoutAI') {
        result = await this.executeScoutCommand(agent, command);
      }
      // Ajouter d'autres agents ici quand disponibles

      return {
        success: true,
        result
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Command execution failed'
      };
    }
  }

  // Exécution des commandes VisualScoutAI
  private async executeScoutCommand(agent: any, command: AgentCommand): Promise<any> {
    switch (command.action) {
      case 'detect_signals':
        return await agent.detectSignals(
          command.parameters.keywords || [],
          command.parameters.locale || 'fr-FR'
        );

      case 'calculate_score':
        return agent.calculateInterestScore(command.parameters.signals || []);

      case 'predict_performance':
        return {
          ctr: agent.predictCTR(command.parameters.interestScore, command.parameters.channel),
          cvr: agent.predictCVR(command.parameters.interestScore, command.parameters.ctr),
          cpi: agent.estimateCPI(command.parameters.channel)
        };

      case 'emergency_stop':
        await agent.emergencyStop(command.requestedBy, command.parameters.reason);
        return { stopped: true, timestamp: new Date().toISOString() };

      default:
        throw new Error(`Unknown VisualScoutAI command: ${command.action}`);
    }
  }

  // Coordination entre agents (éviter les conflits)
  async coordinateAgents(): Promise<void> {
    const statuses = await this.getAllAgentsStatus();
    
    // Vérification des conflits potentiels
    const activeAgents = statuses.filter(s => s.enabled && s.health === 'healthy');
    
    // Règles de coordination
    for (const agent of activeAgents) {
      if (agent.name === 'VisualScoutAI') {
        // VisualScoutAI doit respecter les décisions de VisualAI (maître)
        // Si VisualAI désactive une catégorie, VisualScoutAI doit arrêter la prospection
        await this.ensureScoutCompliance(agent);
      }
    }
  }

  // Assurer la conformité de VisualScoutAI
  private async ensureScoutCompliance(scoutStatus: AgentStatus): Promise<void> {
    // Vérifier que VisualScoutAI respecte les toggles de catégories
    // En production, ici on vérifierait les toggles et on ajusterait les segments
    console.log('🔍 Checking VisualScoutAI compliance with category toggles');
  }

  // Arrêt d'urgence de tous les agents
  async emergencyStopAll(adminUserId: string, reason: string): Promise<void> {
    console.log(`🚨 EMERGENCY STOP ALL AGENTS by ${adminUserId}: ${reason}`);
    
    for (const [name, agent] of this.agents) {
      try {
        if (agent.emergencyStop) {
          await agent.emergencyStop(adminUserId, reason);
        }
      } catch (error) {
        console.error(`Failed to stop agent ${name}:`, error);
      }
    }

    // Log global de l'arrêt d'urgence
    await this.logGlobalAction('emergency_stop_all', {
      adminUserId,
      reason,
      affectedAgents: Array.from(this.agents.keys()),
      timestamp: new Date().toISOString()
    });
  }

  // Logging global des actions de coordination
  private async logGlobalAction(action: string, details: Record<string, any>): Promise<void> {
    console.log(`🎯 AgentCoordinator: ${action}`, details);
    
    // En production, écrire dans audit_logs avec signature
    // pour traçabilité complète des actions inter-agents
  }

  // Santé globale du système d'agents
  async getSystemHealth(): Promise<{
    overall: 'healthy' | 'warning' | 'critical';
    agents: AgentStatus[];
    lastCoordination: Date;
  }> {
    const agents = await this.getAllAgentsStatus();
    const healthyCount = agents.filter(a => a.health === 'healthy').length;
    const totalCount = agents.length;
    
    let overall: 'healthy' | 'warning' | 'critical';
    if (healthyCount === totalCount) {
      overall = 'healthy';
    } else if (healthyCount >= totalCount * 0.7) {
      overall = 'warning';
    } else {
      overall = 'critical';
    }

    return {
      overall,
      agents,
      lastCoordination: new Date()
    };
  }
}

export const agentCoordinator = new AgentCoordinator();