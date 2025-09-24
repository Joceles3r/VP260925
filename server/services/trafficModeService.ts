import { storage } from '../storage';
import { miniSocialConfigService } from './miniSocialConfigService';
import { highlightsService } from './highlightsService';
import { getNotificationService } from '../websocket';

/**
 * Service de gestion des modes de trafic pour le mini réseau social
 * Gère DND, trafic élevé, mode highlights, et basculements automatiques
 */
export class TrafficModeService {
  private currentModes: Map<string, TrafficMode> = new Map(); // liveShowId -> mode actuel
  private manualOverrides: Map<string, ManualOverride> = new Map(); // liveShowId -> override admin
  private modeHistory: Map<string, ModeHistoryEntry[]> = new Map(); // liveShowId -> historique
  
  private readonly MODE_CHANGE_COOLDOWN = 30000; // 30 secondes entre changements automatiques

  /**
   * Détermine le mode approprié pour un live show selon les conditions
   */
  async determineMode(liveShowId: string, viewerCount: number, forceRefresh = false): Promise<TrafficMode> {
    try {
      // Vérifier s'il y a un override manuel
      const manualOverride = this.manualOverrides.get(liveShowId);
      if (manualOverride && manualOverride.expiresAt > Date.now()) {
        console.log(`[TrafficMode] Override manuel actif pour ${liveShowId}: ${manualOverride.mode}`);
        return {
          mode: manualOverride.mode,
          reason: 'manual_override',
          viewerCount,
          timestamp: new Date(),
          isManual: true,
          setBy: manualOverride.setBy
        };
      }

      // Récupérer la configuration
      const config = await miniSocialConfigService.getConfig();
      
      // Vérifier le cooldown si pas forcé
      if (!forceRefresh && !this.canChangeModeNow(liveShowId)) {
        const currentMode = this.currentModes.get(liveShowId);
        if (currentMode) {
          return currentMode;
        }
      }

      // Déterminer le mode selon les règles automatiques
      const newMode = await this.calculateAutoMode(liveShowId, viewerCount, config);
      
      // Enregistrer le nouveau mode
      this.currentModes.set(liveShowId, newMode);
      await this.recordModeChange(liveShowId, newMode);

      // Notifier du changement de mode
      await this.notifyModeChange(liveShowId, newMode);

      return newMode;

    } catch (error) {
      console.error(`[TrafficMode] Erreur lors de la détermination du mode pour ${liveShowId}:`, error);
      
      // Mode de fallback en cas d'erreur
      const fallbackMode: TrafficMode = {
        mode: 'normal',
        reason: 'error_fallback',
        viewerCount,
        timestamp: new Date(),
        isManual: false
      };
      
      this.currentModes.set(liveShowId, fallbackMode);
      return fallbackMode;
    }
  }

  /**
   * Calcule le mode automatique selon les règles de trafic
   */
  private async calculateAutoMode(liveShowId: string, viewerCount: number, config: any): Promise<TrafficMode> {
    const timestamp = new Date();

    // Vérifier le mode DND global (heures de pointe, maintenances, etc.)
    const isDNDTime = await this.isDNDTimeWindow();
    if (isDNDTime) {
      return {
        mode: 'dnd',
        reason: 'dnd_time_window',
        viewerCount,
        timestamp,
        isManual: false
      };
    }

    // Vérifier le trafic élevé
    const isHighTraffic = viewerCount >= config.highTrafficThreshold;
    if (isHighTraffic) {
      // Analyser la qualité des highlights disponibles
      const highlights = highlightsService.getHighlights(liveShowId);
      
      if (highlights.length >= 3) {
        // Mode highlights si on a assez de contenu de qualité
        return {
          mode: 'highlights_only',
          reason: 'high_traffic_with_highlights',
          viewerCount,
          timestamp,
          isManual: false,
          highlightsCount: highlights.length
        };
      } else {
        // Mode lecture seule si pas assez de highlights
        return {
          mode: 'read_only',
          reason: 'high_traffic_no_highlights',
          viewerCount,
          timestamp,
          isManual: false
        };
      }
    }

    // Mode normal ou normal avec slow-mode
    const baseMode = config.slowMode ? 'normal_with_slow_mode' : 'normal';
    return {
      mode: baseMode,
      reason: 'normal_traffic',
      viewerCount,
      timestamp,
      isManual: false
    };
  }

  /**
   * Vérifie si on est dans une fenêtre DND (Do Not Disturb)
   */
  private async isDNDTimeWindow(): Promise<boolean> {
    // Récupérer les paramètres DND depuis la configuration
    const dndParams = (await miniSocialConfigService.getParamValue('live_show.social.dnd_hours', '[]')) || '[]';
    
    try {
      const dndHours: number[] = JSON.parse(dndParams);
      if (dndHours.length === 0) return false;
      
      const currentHour = new Date().getHours();
      return dndHours.includes(currentHour);
      
    } catch (error) {
      console.error('[TrafficMode] Erreur parsing DND hours:', error);
      return false;
    }
  }

  /**
   * Vérifie si on peut changer de mode maintenant (cooldown)
   */
  private canChangeModeNow(liveShowId: string): boolean {
    const history = this.modeHistory.get(liveShowId) || [];
    if (history.length === 0) return true;
    
    const lastChange = history[history.length - 1];
    const timeSinceLastChange = Date.now() - lastChange.timestamp.getTime();
    
    return timeSinceLastChange >= this.MODE_CHANGE_COOLDOWN;
  }

  /**
   * Enregistre un changement de mode dans l'historique
   */
  private async recordModeChange(liveShowId: string, mode: TrafficMode): Promise<void> {
    if (!this.modeHistory.has(liveShowId)) {
      this.modeHistory.set(liveShowId, []);
    }
    
    const history = this.modeHistory.get(liveShowId)!;
    history.push({
      mode: mode.mode,
      reason: mode.reason,
      viewerCount: mode.viewerCount,
      timestamp: mode.timestamp,
      isManual: mode.isManual || false
    });
    
    // Garder seulement les 20 derniers changements
    if (history.length > 20) {
      history.splice(0, history.length - 20);
    }

    // Log pour audit
    await this.logModeChange(liveShowId, mode);
  }

  /**
   * Notifie tous les clients du changement de mode
   */
  private async notifyModeChange(liveShowId: string, mode: TrafficMode): Promise<void> {
    try {
      const notificationService = getNotificationService();
      
      notificationService.sendLiveShowUpdate(liveShowId, {
        event: 'mini_social_mode_change',
        liveShowId,
        mode: mode.mode,
        reason: mode.reason,
        viewerCount: mode.viewerCount,
        isManual: mode.isManual || false,
        timestamp: mode.timestamp.toISOString(),
        highlightsCount: mode.highlightsCount
      });

      console.log(`[TrafficMode] Mode changé pour ${liveShowId}: ${mode.mode} (${mode.reason})`);

    } catch (error) {
      console.error('[TrafficMode] Erreur lors de la notification de changement de mode:', error);
    }
  }

  /**
   * Enregistre le changement de mode dans l'audit log
   */
  private async logModeChange(liveShowId: string, mode: TrafficMode): Promise<void> {
    try {
      await storage.createAuditLog({
        userId: mode.setBy || 'system',
        action: 'admin_access',
        details: `Mode trafic changé pour Live Show ${liveShowId}: ${mode.mode} (${mode.reason})`,
        ipAddress: '127.0.0.1',
        userAgent: 'TrafficModeService/1.0'
      });
    } catch (error) {
      console.error('[TrafficMode] Erreur lors de l\'audit log:', error);
    }
  }

  /**
   * Force un mode spécifique pour un live show (admin override)
   */
  async setManualMode(liveShowId: string, mode: ModeType, adminUserId: string, durationMinutes = 60): Promise<TrafficMode> {
    const expiresAt = Date.now() + (durationMinutes * 60 * 1000);
    
    // Enregistrer l'override
    this.manualOverrides.set(liveShowId, {
      mode,
      setBy: adminUserId,
      setAt: Date.now(),
      expiresAt,
      durationMinutes
    });

    // Créer le mode manuel
    const manualMode: TrafficMode = {
      mode,
      reason: 'manual_override',
      viewerCount: 0, // Sera mis à jour par la prochaine évaluation
      timestamp: new Date(),
      isManual: true,
      setBy: adminUserId
    };

    // Enregistrer et notifier
    this.currentModes.set(liveShowId, manualMode);
    await this.recordModeChange(liveShowId, manualMode);
    await this.notifyModeChange(liveShowId, manualMode);

    console.log(`[TrafficMode] Mode manuel ${mode} activé pour ${liveShowId} par ${adminUserId} (${durationMinutes} min)`);
    
    return manualMode;
  }

  /**
   * Supprime un override manuel pour revenir au mode automatique
   */
  async clearManualMode(liveShowId: string, adminUserId: string): Promise<void> {
    this.manualOverrides.delete(liveShowId);
    
    console.log(`[TrafficMode] Override manuel supprimé pour ${liveShowId} par ${adminUserId}`);
    
    // Réévaluer le mode automatiquement
    const liveShows = await storage.getActiveLiveShows();
    const liveShow = liveShows.find(show => show.id === liveShowId);
    
    if (liveShow) {
      await this.determineMode(liveShowId, liveShow.viewerCount || 0, true);
    }
  }

  /**
   * Récupère le mode actuel d'un live show
   */
  getCurrentMode(liveShowId: string): TrafficMode | null {
    return this.currentModes.get(liveShowId) || null;
  }

  /**
   * Récupère l'historique des modes pour un live show
   */
  getModeHistory(liveShowId: string): ModeHistoryEntry[] {
    return this.modeHistory.get(liveShowId) || [];
  }

  /**
   * Nettoie les données d'un live show terminé
   */
  async cleanupLiveShow(liveShowId: string): Promise<void> {
    this.currentModes.delete(liveShowId);
    this.manualOverrides.delete(liveShowId);
    this.modeHistory.delete(liveShowId);
    
    console.log(`[TrafficMode] Nettoyage pour live show ${liveShowId}`);
  }

  /**
   * Obtient les statistiques des modes de trafic
   */
  getStats() {
    const activeModes = Array.from(this.currentModes.values());
    const manualOverridesCount = this.manualOverrides.size;
    
    const modeDistribution = activeModes.reduce((acc, mode) => {
      acc[mode.mode] = (acc[mode.mode] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      activeLiveShows: this.currentModes.size,
      manualOverridesCount,
      modeDistribution,
      totalModeChanges: Array.from(this.modeHistory.values())
        .reduce((total, history) => total + history.length, 0)
    };
  }
}

// Types pour la gestion des modes
type ModeType = 'normal' | 'normal_with_slow_mode' | 'highlights_only' | 'read_only' | 'dnd';

interface TrafficMode {
  mode: ModeType;
  reason: string;
  viewerCount: number;
  timestamp: Date;
  isManual: boolean;
  setBy?: string;
  highlightsCount?: number;
}

interface ManualOverride {
  mode: ModeType;
  setBy: string;
  setAt: number;
  expiresAt: number;
  durationMinutes: number;
}

interface ModeHistoryEntry {
  mode: ModeType;
  reason: string;
  viewerCount: number;
  timestamp: Date;
  isManual: boolean;
}

// Instance singleton
export const trafficModeService = new TrafficModeService();