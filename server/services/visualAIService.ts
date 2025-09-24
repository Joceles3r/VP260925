import { storage } from '../storage';
import { getNotificationService } from '../websocket';
import { miniSocialConfigService } from './miniSocialConfigService';
import type { LiveShow } from '@shared/schema';

/**
 * Service VisualAI - Système d'intelligence artificielle autonome pour VISUAL
 * Gère l'affichage automatique du mini réseau social pendant les Live Shows
 */
export class VisualAIService {
  private activeLiveShows: Set<string> = new Set(); // Cache des live shows actifs
  private intervalId: NodeJS.Timeout | null = null;
  private monitoring = false;

  private readonly MONITORING_INTERVAL = 5000; // Vérification toutes les 5 secondes
  private readonly DECISION_ACTOR = 'visualai';

  /**
   * Démarre la surveillance des Live Shows pour déclenchement automatique
   */
  async startMonitoring(): Promise<void> {
    if (this.monitoring) {
      console.log('[VisualAI] Surveillance déjà active');
      return;
    }

    this.monitoring = true;
    console.log('[VisualAI] Démarrage de la surveillance des Live Shows...');

    // Initialiser le cache avec les live shows déjà actifs
    const currentActive = await storage.getActiveLiveShows();
    this.activeLiveShows = new Set(currentActive.map(show => show.id));
    console.log(`[VisualAI] ${this.activeLiveShows.size} Live Shows actifs détectés`);

    // Démarrer la surveillance périodique
    this.intervalId = setInterval(async () => {
      await this.checkLiveShowUpdates();
    }, this.MONITORING_INTERVAL);

    console.log('[VisualAI] Surveillance des Live Shows activée');
  }

  /**
   * Arrête la surveillance
   */
  stopMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.monitoring = false;
    console.log('[VisualAI] Surveillance des Live Shows arrêtée');
  }

  /**
   * Vérifie les mises à jour des Live Shows et déclenche les actions automatiques
   */
  private async checkLiveShowUpdates(): Promise<void> {
    try {
      const currentActiveLiveShows = await storage.getActiveLiveShows();
      const currentActiveIds = new Set(currentActiveLiveShows.map(show => show.id));

      // Détecter les nouveaux Live Shows démarrés
      for (const show of currentActiveLiveShows) {
        if (!this.activeLiveShows.has(show.id)) {
          console.log(`[VisualAI] Nouveau Live Show détecté: ${show.id}`);
          await this.handleLiveShowStart(show);
        }
      }

      // Détecter les Live Shows terminés
      for (const previousId of Array.from(this.activeLiveShows)) {
        if (!currentActiveIds.has(previousId)) {
          console.log(`[VisualAI] Live Show terminé: ${previousId}`);
          await this.handleLiveShowEnd(previousId);
        }
      }

      // Mettre à jour le cache
      this.activeLiveShows = currentActiveIds;

    } catch (error) {
      console.error('[VisualAI] Erreur lors de la vérification des Live Shows:', error);
    }
  }

  /**
   * Gère le démarrage d'un Live Show - décision automatique d'affichage mini réseau social
   */
  private async handleLiveShowStart(liveShow: LiveShow): Promise<void> {
    try {
      console.log(`[VisualAI] Traitement démarrage Live Show: ${liveShow.id} - ${liveShow.title}`);

      // Import dynamique du service de modes de trafic
      const { trafficModeService } = await import('./trafficModeService');

      // Récupérer la configuration du mini réseau social
      const config = await miniSocialConfigService.getConfig();

      // Vérifier si l'autoshow est activé
      if (!config.autoshow) {
        console.log(`[VisualAI] Autoshow désactivé - pas d'affichage automatique pour ${liveShow.id}`);
        await this.logDecision(liveShow.id, 'autoshow_disabled', {
          autoshow: config.autoshow,
          reason: 'Autoshow désactivé dans la configuration'
        });
        return;
      }

      // Déterminer le mode de trafic approprié
      const viewerCount = liveShow.viewerCount || 0;
      const trafficMode = await trafficModeService.determineMode(liveShow.id, viewerCount);

      // Émettre l'événement de déclenchement du mini réseau social avec mode de trafic
      const notificationService = getNotificationService();
      const socialPanelEvent = {
        event: 'mini_social_auto_trigger',
        liveShowId: liveShow.id,
        liveShowTitle: liveShow.title,
        config: {
          autoshow: true,
          position: config.position,
          defaultState: config.defaultState,
          mode: trafficMode.mode,
          viewerCount,
          isHighTraffic: viewerCount >= config.highTrafficThreshold,
          slowMode: config.slowMode,
          aiModeration: config.aiModeration
        },
        trafficMode: {
          mode: trafficMode.mode,
          reason: trafficMode.reason,
          isManual: trafficMode.isManual,
          highlightsCount: trafficMode.highlightsCount
        },
        metadata: {
          triggeredBy: this.DECISION_ACTOR,
          triggeredAt: new Date().toISOString(),
          decisionId: `visual-ai-${Date.now()}`
        }
      };

      // Diffuser l'événement à tous les clients connectés
      notificationService.sendLiveShowUpdate(liveShow.id, socialPanelEvent);

      console.log(`[VisualAI] Mini réseau social déclenché automatiquement pour ${liveShow.id}`);
      console.log(`[VisualAI] Mode: ${trafficMode.mode} (${trafficMode.reason}), Spectateurs: ${viewerCount}`);

      // Enregistrer la décision dans l'audit log
      await this.logDecision(liveShow.id, 'mini_social_triggered', {
        config,
        trafficMode,
        viewerCount,
        decision: 'Affichage automatique déclenché avec gestion de mode'
      });

    } catch (error) {
      console.error(`[VisualAI] Erreur lors du traitement du Live Show ${liveShow.id}:`, error);
      await this.logDecision(liveShow.id, 'error', {
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  }

  /**
   * Gère la fin d'un Live Show
   */
  private async handleLiveShowEnd(liveShowId: string): Promise<void> {
    try {
      console.log(`[VisualAI] Traitement fin Live Show: ${liveShowId}`);

      // Émettre l'événement de fermeture du mini réseau social
      const notificationService = getNotificationService();
      notificationService.sendLiveShowUpdate(liveShowId, {
        event: 'mini_social_auto_close',
        liveShowId,
        metadata: {
          triggeredBy: this.DECISION_ACTOR,
          triggeredAt: new Date().toISOString()
        }
      });

      await this.logDecision(liveShowId, 'mini_social_closed', {
        reason: 'Live Show terminé'
      });

    } catch (error) {
      console.error(`[VisualAI] Erreur lors de la fermeture du Live Show ${liveShowId}:`, error);
    }
  }

  /**
   * Détermine le mode d'affichage selon les conditions de trafic
   */
  private determineDisplayMode(config: any, isHighTraffic: boolean, viewerCount: number): string {
    if (isHighTraffic) {
      // Mode trafic élevé - utiliser le fallback configuré
      switch (config.highlightsFallback) {
        case 'highlights':
          return 'highlights_only';
        case 'disabled':
          return 'read_only';
        default:
          return 'highlights_only';
      }
    }

    // Mode normal
    return config.slowMode ? 'normal_with_slow_mode' : 'normal';
  }

  /**
   * Enregistre une décision dans l'audit log des agents IA
   */
  private async logDecision(liveShowId: string, action: string, metadata: any): Promise<void> {
    try {
      // Utiliser directement l'API storage existante au lieu d'agent-specific
      await storage.createAuditLog({
        userId: 'system',
        action: 'admin_access', // Utiliser une action valide du schema
        category: 'mini_social_automation',
        details: `VisualAI: ${action} pour Live Show ${liveShowId}`,
        ipAddress: '127.0.0.1',
        userAgent: 'VisualAI/1.0',
        metadata: {
          liveShowId,
          actor: this.DECISION_ACTOR,
          originalAction: action,
          ...metadata
        }
      });
    } catch (error) {
      console.error('[VisualAI] Erreur lors de l\'enregistrement de la décision:', error);
    }
  }

  /**
   * Déclenche manuellement l'affichage du mini réseau social pour un Live Show
   * (pour tests ou interventions administratives)
   */
  async manualTrigger(liveShowId: string, adminUserId: string): Promise<boolean> {
    try {
      // Récupérer le live show depuis la liste des actifs
      const activeLiveShows = await storage.getActiveLiveShows();
      const liveShow = activeLiveShows.find(show => show.id === liveShowId);
      if (!liveShow || !liveShow.isActive) {
        throw new Error('Live Show non trouvé ou inactif');
      }

      const config = await miniSocialConfigService.getConfig();
      const viewerCount = liveShow.viewerCount || 0;
      const isHighTraffic = viewerCount >= config.highTrafficThreshold;
      const displayMode = this.determineDisplayMode(config, isHighTraffic, viewerCount);

      const notificationService = getNotificationService();
      notificationService.sendLiveShowUpdate(liveShowId, {
        event: 'mini_social_manual_trigger',
        liveShowId,
        liveShowTitle: liveShow.title,
        config: {
          autoshow: true,
          position: config.position,
          defaultState: config.defaultState,
          displayMode,
          viewerCount,
          isHighTraffic,
          slowMode: config.slowMode,
          aiModeration: config.aiModeration
        },
        metadata: {
          triggeredBy: `admin:${adminUserId}`,
          triggeredAt: new Date().toISOString(),
          decisionId: `manual-${Date.now()}`
        }
      });

      await this.logDecision(liveShowId, 'mini_social_manual_triggered', {
        triggeredBy: adminUserId,
        config,
        displayMode,
        viewerCount,
        isHighTraffic
      });

      console.log(`[VisualAI] Déclenchement manuel par admin ${adminUserId} pour Live Show ${liveShowId}`);
      return true;

    } catch (error) {
      console.error('[VisualAI] Erreur lors du déclenchement manuel:', error);
      throw error;
    }
  }

  /**
   * Obtient les statistiques de surveillance
   */
  getMonitoringStats() {
    return {
      monitoring: this.monitoring,
      activeLiveShows: this.activeLiveShows.size,
      monitoringInterval: this.MONITORING_INTERVAL,
      activeLiveShowIds: Array.from(this.activeLiveShows)
    };
  }
}

// Instance singleton
export const visualAIService = new VisualAIService();