import { db } from '../db';
import { 
  liveShows, 
  liveShowFinalists, 
  liveShowNotifications, 
  liveShowPenalties, 
  liveShowAudit,
  users 
} from '@shared/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import type { 
  LiveShow, 
  LiveShowFinalist, 
  InsertLiveShowFinalist, 
  InsertLiveShowNotification,
  InsertLiveShowPenalty,
  InsertLiveShowAudit 
} from '@shared/schema';

export type ReplacementScenario = 'S1' | 'S2' | 'S3' | 'S4';
export type FinalistRole = 'finalist' | 'alternate';
export type FinalistStatus = 'selected' | 'confirmed' | 'cancelled' | 'promoted' | 'standby';
export type ShowFallbackMode = 'battle' | 'showcase' | 'report' | 'cancelled';

interface LineupState {
  F1?: LiveShowFinalist;
  F2?: LiveShowFinalist;
  A1?: LiveShowFinalist;
  A2?: LiveShowFinalist;
  locked: boolean;
  fallbackMode: ShowFallbackMode;
}

export class LiveShowOrchestrator {
  
  async createLiveShow(data: {
    weekNumber: number;
    title: string;
    description?: string;
    scheduledStart: Date;
    scheduledEnd: Date;
  }): Promise<LiveShow> {
    const [show] = await db.insert(liveShows).values({
      weekNumber: data.weekNumber,
      title: data.title,
      description: data.description,
      scheduledStart: data.scheduledStart,
      scheduledEnd: data.scheduledEnd,
      lineupLocked: false,
      fallbackMode: 'battle',
    }).returning();

    await this.auditLog(show.id, 'show_created', 'system', 'system', null, `Live Show créé pour semaine ${data.weekNumber}`);
    
    return show;
  }

  async designateFinalists(
    showId: string, 
    finalists: Array<{ userId: string; artistName: string; rank: number; role: FinalistRole }>
  ): Promise<LiveShowFinalist[]> {
    const results: LiveShowFinalist[] = [];
    
    for (const f of finalists) {
      const [finalist] = await db.insert(liveShowFinalists).values({
        liveShowId: showId,
        userId: f.userId,
        artistName: f.artistName,
        rank: f.rank,
        role: f.role,
        status: 'selected',
        availabilityConfirmed: false,
      }).returning();
      
      results.push(finalist);
      
      await this.auditLog(
        showId, 
        'finalist_designated', 
        'system', 
        'system', 
        f.userId, 
        `${f.role === 'finalist' ? 'Finaliste' : 'Remplaçant'} désigné: ${f.artistName} (rang ${f.rank})`
      );
    }
    
    return results;
  }

  async requestConfirmations(showId: string): Promise<void> {
    const finalists = await db
      .select()
      .from(liveShowFinalists)
      .where(and(
        eq(liveShowFinalists.liveShowId, showId),
        eq(liveShowFinalists.role, 'finalist'),
        eq(liveShowFinalists.status, 'selected')
      ));

    const now = new Date();
    
    for (const finalist of finalists) {
      await db.insert(liveShowNotifications).values({
        liveShowId: showId,
        recipientId: finalist.userId,
        notificationType: 'finalist_confirmation',
        subject: 'Confirmation de participation - VISUAL Studio Live Show',
        message: `Félicitations ! Vous êtes finaliste ${finalist.rank === 1 ? 'F1' : 'F2'}. Veuillez confirmer votre participation avant J-2 18:00.`,
        actionUrl: `/live-show/confirm/${finalist.id}`,
        metadata: { deadline: this.getConfirmationDeadline(showId) }
      });

      await db.update(liveShowFinalists)
        .set({ confirmationRequestedAt: now })
        .where(eq(liveShowFinalists.id, finalist.id));

      await this.auditLog(
        showId, 
        'confirmation_requested', 
        'system', 
        'system', 
        finalist.userId, 
        `Demande de confirmation envoyée à ${finalist.artistName}`
      );
    }
  }

  async confirmParticipation(finalistId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    const finalist = await db
      .select()
      .from(liveShowFinalists)
      .where(eq(liveShowFinalists.id, finalistId))
      .limit(1);

    if (!finalist.length) {
      return { success: false, error: 'Finaliste non trouvé' };
    }

    const f = finalist[0];

    if (f.userId !== userId) {
      return { success: false, error: 'Non autorisé' };
    }

    if (f.status !== 'selected') {
      return { success: false, error: 'Statut invalide pour confirmation' };
    }

    const show = await db.select().from(liveShows).where(eq(liveShows.id, f.liveShowId)).limit(1);
    if (show[0]?.lineupLocked) {
      return { success: false, error: 'Line-up verrouillé' };
    }

    const now = new Date();
    
    await db.update(liveShowFinalists)
      .set({ 
        status: 'confirmed',
        confirmedAt: now,
        availabilityConfirmed: true
      })
      .where(eq(liveShowFinalists.id, finalistId));

    await this.auditLog(
      f.liveShowId, 
      'finalist_confirmed', 
      userId, 
      'user', 
      userId, 
      `${f.artistName} a confirmé sa participation`
    );

    return { success: true };
  }

  async cancelParticipation(
    finalistId: string, 
    userId: string, 
    reason?: string
  ): Promise<{ success: boolean; scenario?: { scenario: ReplacementScenario; targetSlot?: 'F1' | 'F2' } | null; error?: string }> {
    const finalist = await db
      .select()
      .from(liveShowFinalists)
      .where(eq(liveShowFinalists.id, finalistId))
      .limit(1);

    if (!finalist.length) {
      return { success: false, error: 'Finaliste non trouvé' };
    }

    const f = finalist[0];

    if (f.userId !== userId) {
      return { success: false, error: 'Non autorisé' };
    }

    if (f.status === 'cancelled') {
      return { success: false, error: 'Déjà annulé' };
    }

    const show = await db.select().from(liveShows).where(eq(liveShows.id, f.liveShowId)).limit(1);
    if (show[0]?.lineupLocked) {
      return { success: false, error: 'Line-up verrouillé - annulation impossible' };
    }

    const now = new Date();
    
    await db.update(liveShowFinalists)
      .set({ 
        status: 'cancelled',
        cancelledAt: now,
        cancellationReason: reason || 'Non spécifié'
      })
      .where(eq(liveShowFinalists.id, finalistId));

    await this.auditLog(
      f.liveShowId, 
      'finalist_cancelled', 
      userId, 
      'user', 
      userId, 
      `${f.artistName} s'est désisté: ${reason || 'Non spécifié'}`
    );

    const scenario = await this.determineReplacementScenario(f.liveShowId);
    
    if (scenario) {
      await this.executeReplacementScenario(f.liveShowId, scenario);
    }

    return { success: true, scenario };
  }

  async determineReplacementScenario(showId: string): Promise<{ scenario: ReplacementScenario; targetSlot?: 'F1' | 'F2' } | null> {
    const lineup = await this.getLineupState(showId);
    
    const f1Status = lineup.F1?.status;
    const f2Status = lineup.F2?.status;
    const hasA1 = !!lineup.A1;
    const hasA2 = !!lineup.A2;

    if (f1Status === 'cancelled' && f2Status === 'cancelled') {
      if (hasA1 && hasA2) return { scenario: 'S4' };
      if (hasA1 || hasA2) return { scenario: 'S3' };
      return null;
    }

    if (f1Status === 'cancelled') {
      if (hasA1) return { scenario: 'S1', targetSlot: 'F1' };
      if (hasA2) return { scenario: 'S2', targetSlot: 'F1' };
    }

    if (f2Status === 'cancelled') {
      if (hasA1) return { scenario: 'S1', targetSlot: 'F2' };
      if (hasA2) return { scenario: 'S2', targetSlot: 'F2' };
    }

    return null;
  }

  async executeReplacementScenario(showId: string, replacementInfo: { scenario: ReplacementScenario; targetSlot?: 'F1' | 'F2' }): Promise<void> {
    const lineup = await this.getLineupState(showId);
    const { scenario, targetSlot } = replacementInfo;
    
    switch (scenario) {
      case 'S1':
        if (!targetSlot || !lineup.A1) throw new Error('Invalid S1 scenario state');
        await this.promoteAlternate(showId, lineup.A1, targetSlot);
        break;
      
      case 'S2':
        if (!targetSlot || !lineup.A2) throw new Error('Invalid S2 scenario state');
        await this.promoteAlternate(showId, lineup.A2, targetSlot);
        break;
      
      case 'S3':
        const alternate = lineup.A1 || lineup.A2!;
        await this.activateShowcaseMode(showId, alternate);
        break;
      
      case 'S4':
        if (!lineup.A1 || !lineup.A2) throw new Error('Invalid S4 scenario state');
        await this.promoteAlternate(showId, lineup.A1, 'F1');
        await this.promoteAlternate(showId, lineup.A2, 'F2');
        break;
    }

    await this.auditLog(
      showId, 
      'replacement_scenario_executed', 
      'system', 
      'system', 
      null, 
      `Scénario ${scenario} exécuté${targetSlot ? ` vers ${targetSlot}` : ''}`
    );
  }

  async promoteAlternate(showId: string, alternate: LiveShowFinalist, targetSlot: 'F1' | 'F2'): Promise<void> {
    const now = new Date();
    
    await db.update(liveShowFinalists)
      .set({ 
        status: 'promoted',
        role: 'finalist',
        rank: targetSlot === 'F1' ? 1 : 2,
        promotedAt: now
      })
      .where(eq(liveShowFinalists.id, alternate.id));

    await db.insert(liveShowNotifications).values({
      liveShowId: showId,
      recipientId: alternate.userId,
      notificationType: 'promotion',
      subject: 'Promotion en finaliste - VISUAL Studio Live Show',
      message: `Vous êtes promu finaliste ${targetSlot} ! Préparez-vous pour le show.`,
      actionUrl: `/live-show/${showId}`
    });

    await this.auditLog(
      showId, 
      'alternate_promoted', 
      'system', 
      'system', 
      alternate.userId, 
      `${alternate.artistName} promu en ${targetSlot}`
    );
  }

  async activateShowcaseMode(showId: string, artist: LiveShowFinalist): Promise<void> {
    await db.update(liveShows)
      .set({ 
        fallbackMode: 'showcase',
        fallbackReason: 'Un seul finaliste disponible - Showcase Spécial activé'
      })
      .where(eq(liveShows.id, showId));

    await this.promoteAlternate(showId, artist, 'F1');

    await this.auditLog(
      showId, 
      'fallback_showcase_activated', 
      'system', 
      'system', 
      null, 
      `Mode Showcase Spécial activé avec ${artist.artistName}`
    );
  }

  async lockLineup(showId: string, adminId: string): Promise<{ success: boolean; error?: string }> {
    const lineup = await this.getLineupState(showId);
    
    const confirmedFinalists = [lineup.F1, lineup.F2].filter(
      f => f && (f.status === 'confirmed' || f.status === 'promoted')
    );

    if (confirmedFinalists.length < 2 && lineup.fallbackMode === 'battle') {
      return { success: false, error: 'Au moins 2 finalistes confirmés requis pour verrouiller en mode battle' };
    }

    const now = new Date();
    
    await db.update(liveShows)
      .set({ 
        lineupLocked: true,
        lineupLockedAt: now
      })
      .where(eq(liveShows.id, showId));

    await this.auditLog(
      showId, 
      'lineup_locked', 
      adminId, 
      'admin', 
      null, 
      'Line-up verrouillé par admin'
    );

    return { success: true };
  }

  async getLineupState(showId: string): Promise<LineupState> {
    const show = await db.select().from(liveShows).where(eq(liveShows.id, showId)).limit(1);
    const finalists = await db
      .select()
      .from(liveShowFinalists)
      .where(eq(liveShowFinalists.liveShowId, showId))
      .orderBy(liveShowFinalists.rank);

    const lineup: LineupState = {
      locked: show[0]?.lineupLocked || false,
      fallbackMode: (show[0]?.fallbackMode as ShowFallbackMode) || 'battle'
    };

    for (const f of finalists) {
      if (f.rank === 1) lineup.F1 = f;
      else if (f.rank === 2) lineup.F2 = f;
      else if (f.rank === 3) lineup.A1 = f;
      else if (f.rank === 4) lineup.A2 = f;
    }

    return lineup;
  }

  async applyPenalty(
    userId: string, 
    showId: string | null, 
    penaltyType: 'late_cancellation' | 'no_show',
    severity: 'warning' | 'temporary_ban' | 'permanent_ban',
    editionsAffected?: number
  ): Promise<void> {
    const expiresAt = editionsAffected 
      ? new Date(Date.now() + editionsAffected * 7 * 24 * 60 * 60 * 1000)
      : null;

    await db.insert(liveShowPenalties).values({
      userId,
      liveShowId: showId,
      penaltyType,
      severity,
      description: this.getPenaltyDescription(penaltyType, severity, editionsAffected),
      editionsAffected,
      expiresAt,
      isActive: true
    });

    if (showId) {
      await this.auditLog(
        showId, 
        'penalty_applied', 
        'system', 
        'system', 
        userId, 
        `Pénalité ${severity} appliquée: ${penaltyType}`
      );
    }
  }

  getPenaltyDescription(
    type: 'late_cancellation' | 'no_show',
    severity: string,
    editions?: number
  ): string {
    const descriptions: Record<string, string> = {
      'late_cancellation_warning': 'Avertissement pour annulation tardive',
      'late_cancellation_temporary_ban': `Suspension de ${editions} éditions pour annulation tardive`,
      'late_cancellation_permanent_ban': 'Exclusion définitive pour annulations répétées',
      'no_show_warning': 'Avertissement pour absence au show',
      'no_show_temporary_ban': `Suspension de ${editions} éditions pour absence`,
      'no_show_permanent_ban': 'Exclusion définitive pour absences répétées'
    };
    
    return descriptions[`${type}_${severity}`] || 'Pénalité appliquée';
  }

  private async auditLog(
    showId: string | null,
    actionType: string,
    performedBy: string,
    performedByType: 'user' | 'admin' | 'system' | 'ai',
    targetUserId: string | null,
    description: string,
    metadata?: any
  ): Promise<void> {
    await db.insert(liveShowAudit).values({
      liveShowId: showId,
      actionType,
      performedBy,
      performedByType,
      targetUserId,
      description,
      metadata
    });
  }

  private getConfirmationDeadline(showId: string): Date {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 5);
    deadline.setHours(18, 0, 0, 0);
    return deadline;
  }
}

export const liveShowOrchestrator = new LiveShowOrchestrator();
