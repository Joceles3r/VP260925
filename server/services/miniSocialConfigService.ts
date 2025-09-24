import { storage } from '../storage';
import { MINI_SOCIAL_RUNTIME_PARAMS } from '@shared/constants';
import type { AgentParameter, InsertAgentParameter } from '@shared/schema';

/**
 * Service pour la gestion des paramètres de configuration du mini réseau social automatique
 * Utilise la table agentParameters pour stocker les paramètres runtime
 */
export class MiniSocialConfigService {
  
  /**
   * Initialise tous les paramètres par défaut du mini réseau social s'ils n'existent pas
   */
  async initializeDefaultParams(): Promise<void> {
    const existingParams = await storage.getAgentParameters(true);
    const existingKeys = new Set(existingParams.map(p => p.parameterKey));
    
    // Initialiser tous les paramètres qui n'existent pas encore
    for (const [key, config] of Object.entries(MINI_SOCIAL_RUNTIME_PARAMS)) {
      if (!existingKeys.has(key)) {
        const param: InsertAgentParameter = {
          parameterKey: config.key,
          parameterValue: config.value,
          parameterType: config.type,
          description: config.description,
          modifiableByAdmin: config.modifiableByAdmin,
          lastModifiedBy: 'system'
        };
        
        await storage.createAgentParameter(param);
        console.log(`[MiniSocial] Paramètre initialisé: ${key} = ${config.value}`);
      }
    }
  }
  
  /**
   * Récupère la configuration complète du mini réseau social
   */
  async getConfig(): Promise<MiniSocialConfig> {
    const params = await this.getMiniSocialParams();
    
    return {
      autoshow: this.parseBoolean(params['live_show.social.autoshow'], true),
      position: this.parseString(params['live_show.social.position'], 'sidebar') as 'sidebar' | 'drawer',
      defaultState: this.parseString(params['live_show.social.default_state'], 'expanded') as 'expanded' | 'collapsed', 
      highlightsFallback: this.parseString(params['live_show.social.highload_fallback'], 'highlights') as 'highlights' | 'disabled',
      slowMode: this.parseBoolean(params['live_show.social.slow_mode'], true),
      highTrafficThreshold: this.parseNumber(params['live_show.social.high_traffic_threshold'], 1000),
      aiModeration: this.parseBoolean(params['live_show.social.ai_moderation'], true)
    };
  }
  
  /**
   * Met à jour un paramètre spécifique
   */
  async updateParam(key: string, value: string, modifiedBy: string): Promise<AgentParameter> {
    // Vérifier que la clé est autorisée
    if (!Object.keys(MINI_SOCIAL_RUNTIME_PARAMS).includes(key)) {
      throw new Error(`Clé de paramètre non autorisée: ${key}`);
    }
    
    return await storage.updateAgentParameter(key, value, modifiedBy);
  }
  
  /**
   * Récupère la valeur d'un paramètre avec valeur par défaut
   */
  async getParamValue(key: string, defaultValue?: string): Promise<string | undefined> {
    return await storage.getParameterValue(key, defaultValue);
  }
  
  /**
   * Active/désactive l'affichage automatique
   */
  async toggleAutoshow(enabled: boolean, modifiedBy: string): Promise<void> {
    await this.updateParam('live_show.social.autoshow', enabled.toString(), modifiedBy);
  }
  
  /**
   * Change la position du panel (sidebar ou drawer)
   */
  async setPosition(position: 'sidebar' | 'drawer', modifiedBy: string): Promise<void> {
    await this.updateParam('live_show.social.position', position, modifiedBy);
  }
  
  /**
   * Change l'état par défaut (expanded ou collapsed)
   */
  async setDefaultState(state: 'expanded' | 'collapsed', modifiedBy: string): Promise<void> {
    await this.updateParam('live_show.social.default_state', state, modifiedBy);
  }
  
  /**
   * Configure le mode de fallback pour trafic élevé
   */
  async setHighloadFallback(mode: 'highlights' | 'disabled', modifiedBy: string): Promise<void> {
    await this.updateParam('live_show.social.highload_fallback', mode, modifiedBy);
  }
  
  /**
   * Active/désactive le slow mode anti-spam
   */
  async toggleSlowMode(enabled: boolean, modifiedBy: string): Promise<void> {
    await this.updateParam('live_show.social.slow_mode', enabled.toString(), modifiedBy);
  }
  
  /**
   * Configure le seuil de trafic élevé
   */
  async setHighTrafficThreshold(threshold: number, modifiedBy: string): Promise<void> {
    if (threshold < 1 || threshold > 10000) {
      throw new Error('Le seuil doit être entre 1 et 10000 spectateurs');
    }
    await this.updateParam('live_show.social.high_traffic_threshold', threshold.toString(), modifiedBy);
  }
  
  /**
   * Active/désactive la modération IA
   */
  async toggleAiModeration(enabled: boolean, modifiedBy: string): Promise<void> {
    await this.updateParam('live_show.social.ai_moderation', enabled.toString(), modifiedBy);
  }
  
  // Méthodes utilitaires privées
  
  private async getMiniSocialParams(): Promise<Record<string, string>> {
    const allParams = await storage.getAgentParameters(true);
    const miniSocialParams: Record<string, string> = {};
    
    for (const param of allParams) {
      if (param.parameterKey.startsWith('live_show.social.')) {
        miniSocialParams[param.parameterKey] = param.parameterValue;
      }
    }
    
    return miniSocialParams;
  }
  
  private parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
    if (!value) return defaultValue;
    return value.toLowerCase() === 'true';
  }
  
  private parseString(value: string | undefined, defaultValue: string): string {
    return value || defaultValue;
  }
  
  private parseNumber(value: string | undefined, defaultValue: number): number {
    if (!value) return defaultValue;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }
}

// Type pour la configuration complète
export type MiniSocialConfig = {
  autoshow: boolean;
  position: 'sidebar' | 'drawer';
  defaultState: 'expanded' | 'collapsed';
  highlightsFallback: 'highlights' | 'disabled';
  slowMode: boolean;
  highTrafficThreshold: number;
  aiModeration: boolean;
};

// Instance singleton
export const miniSocialConfigService = new MiniSocialConfigService();