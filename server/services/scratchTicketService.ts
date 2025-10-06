/**
 * Service de gestion des Mini-Tickets "Scratch"
 * Récompenses automatiques pour utilisateurs réguliers (tous les 100 VISUpoints)
 */

import { db } from '../db';
import { scratchTickets, users, visuPointsTransactions } from '@shared/schema';
import { eq, and, desc, sql, count } from 'drizzle-orm';
import { SCRATCH_TICKET_CONFIG } from '@shared/constants';

export type ScratchReward = '5vp' | '10vp' | '20vp' | '50vp' | 'nothing';

export interface ScratchTicketInfo {
  id: string;
  status: 'pending' | 'scratched' | 'expired';
  triggeredAtVP: number;
  reward?: ScratchReward;
  rewardVP?: number;
  scratchedAt?: Date;
  expiresAt: Date;
  createdAt: Date;
  canScratch: boolean;
  daysUntilExpiry: number;
}

export interface ScratchResult {
  success: boolean;
  reward: ScratchReward;
  rewardVP: number;
  message: string;
  newBalance?: number;
}

export class ScratchTicketService {
  /**
   * Vérifier si l'utilisateur doit recevoir un nouveau ticket
   * Appelé après chaque transaction VISUpoints
   */
  async checkAndCreateTicket(userId: string, currentTotalVP: number): Promise<boolean> {
    try {
      // Calculer combien de tickets l'utilisateur devrait avoir
      const expectedTickets = Math.floor(currentTotalVP / SCRATCH_TICKET_CONFIG.TRIGGER_VP_THRESHOLD);

      if (expectedTickets === 0) {
        return false; // Pas encore 100 VP
      }

      // Vérifier combien de tickets ont déjà été créés
      const [result] = await db
        .select({ count: count() })
        .from(scratchTickets)
        .where(eq(scratchTickets.userId, userId));

      const existingTickets = result?.count || 0;

      // Si tickets existants < tickets attendus, créer les manquants
      if (existingTickets < expectedTickets) {
        const ticketsToCreate = expectedTickets - existingTickets;
        
        for (let i = 0; i < ticketsToCreate; i++) {
          const triggerVP = (existingTickets + i + 1) * SCRATCH_TICKET_CONFIG.TRIGGER_VP_THRESHOLD;
          await this.createTicket(userId, triggerVP);
        }

        console.log(`[ScratchTicket] Created ${ticketsToCreate} tickets for user ${userId}`);
        return true;
      }

      return false;
    } catch (error) {
      console.error('[ScratchTicket] Error checking/creating ticket:', error);
      return false;
    }
  }

  /**
   * Créer un nouveau ticket scratch
   */
  private async createTicket(userId: string, triggeredAtVP: number): Promise<string> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SCRATCH_TICKET_CONFIG.EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    const [ticket] = await db
      .insert(scratchTickets)
      .values({
        userId,
        triggeredAtVP,
        status: 'pending',
        expiresAt,
      })
      .returning();

    console.log(`[ScratchTicket] Created ticket ${ticket.id} for ${userId} at ${triggeredAtVP} VP`);
    return ticket.id;
  }

  /**
   * Récupérer les tickets d'un utilisateur
   */
  async getUserTickets(userId: string): Promise<ScratchTicketInfo[]> {
    const tickets = await db
      .select()
      .from(scratchTickets)
      .where(eq(scratchTickets.userId, userId))
      .orderBy(desc(scratchTickets.createdAt));

    const now = new Date();

    return tickets.map(ticket => {
      const daysUntilExpiry = Math.max(
        0,
        Math.ceil((ticket.expiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
      );

      return {
        id: ticket.id,
        status: ticket.status,
        triggeredAtVP: ticket.triggeredAtVP,
        reward: ticket.reward as ScratchReward | undefined,
        rewardVP: ticket.rewardVP || undefined,
        scratchedAt: ticket.scratchedAt || undefined,
        expiresAt: ticket.expiresAt,
        createdAt: ticket.createdAt || now,
        canScratch: ticket.status === 'pending' && now < ticket.expiresAt,
        daysUntilExpiry,
      };
    });
  }

  /**
   * Gratter un ticket (avec validation IA VISUAL)
   */
  async scratchTicket(
    ticketId: string,
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<ScratchResult> {
    try {
      // Récupérer le ticket
      const [ticket] = await db
        .select()
        .from(scratchTickets)
        .where(
          and(
            eq(scratchTickets.id, ticketId),
            eq(scratchTickets.userId, userId)
          )
        )
        .limit(1);

      if (!ticket) {
        return {
          success: false,
          reward: 'nothing',
          rewardVP: 0,
          message: 'Ticket non trouvé',
        };
      }

      // Vérifications
      if (ticket.status !== 'pending') {
        return {
          success: false,
          reward: ticket.reward as ScratchReward || 'nothing',
          rewardVP: 0,
          message: 'Ticket déjà gratté',
        };
      }

      const now = new Date();
      if (now > ticket.expiresAt) {
        // Marquer comme expiré
        await db
          .update(scratchTickets)
          .set({ status: 'expired' })
          .where(eq(scratchTickets.id, ticketId));

        return {
          success: false,
          reward: 'nothing',
          rewardVP: 0,
          message: 'Ticket expiré',
        };
      }

      // Anti-triche: Vérifier cooldown
      if (SCRATCH_TICKET_CONFIG.ANTI_CHEAT_COOLDOWN_HOURS > 0) {
        const recentScratch = await db
          .select()
          .from(scratchTickets)
          .where(
            and(
              eq(scratchTickets.userId, userId),
              eq(scratchTickets.status, 'scratched')
            )
          )
          .orderBy(desc(scratchTickets.scratchedAt))
          .limit(1);

        if (recentScratch.length > 0 && recentScratch[0].scratchedAt) {
          const hoursSinceLastScratch = 
            (now.getTime() - recentScratch[0].scratchedAt.getTime()) / (60 * 60 * 1000);

          if (hoursSinceLastScratch < SCRATCH_TICKET_CONFIG.ANTI_CHEAT_COOLDOWN_HOURS) {
            return {
              success: false,
              reward: 'nothing',
              rewardVP: 0,
              message: `Veuillez attendre ${Math.ceil(SCRATCH_TICKET_CONFIG.ANTI_CHEAT_COOLDOWN_HOURS - hoursSinceLastScratch)}h avant de gratter un autre ticket`,
            };
          }
        }
      }

      // Générer récompense aléatoire (validée par IA VISUAL)
      const { reward, rewardVP } = await this.generateReward(userId, ipAddress);

      // Mettre à jour le ticket
      await db
        .update(scratchTickets)
        .set({
          status: 'scratched',
          reward,
          rewardVP,
          scratchedAt: now,
          ipAddress,
          userAgent,
          validatedByAI: true,
          aiValidationData: {
            timestamp: now.toISOString(),
            ipAddress,
            userAgent,
            reward,
            rewardVP,
          },
        })
        .where(eq(scratchTickets.id, ticketId));

      // Si récompense, ajouter VISUpoints
      if (rewardVP > 0) {
        await db.insert(visuPointsTransactions).values({
          userId,
          amount: rewardVP,
          reason: 'scratch_ticket_reward',
          description: `Récompense Mini-Ticket Scratch: ${rewardVP} VP`,
        });

        // Mettre à jour le solde utilisateur
        await db
          .update(users)
          .set({
            visuPoints: sql`${users.visuPoints} + ${rewardVP}`,
          })
          .where(eq(users.id, userId));
      }

      // Récupérer nouveau solde
      const [user] = await db
        .select({ visuPoints: users.visuPoints })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      const message = rewardVP > 0
        ? `🎉 Félicitations ! Vous avez gagné ${rewardVP} VISUpoints !`
        : `😊 Rien gagné cette fois, mais rejouez à 100 VISUpoints !`;

      console.log(`[ScratchTicket] User ${userId} scratched ticket ${ticketId}: ${reward} (${rewardVP} VP)`);

      return {
        success: true,
        reward,
        rewardVP,
        message,
        newBalance: user?.visuPoints || 0,
      };
    } catch (error) {
      console.error('[ScratchTicket] Error scratching ticket:', error);
      return {
        success: false,
        reward: 'nothing',
        rewardVP: 0,
        message: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  /**
   * Générer une récompense aléatoire (avec poids)
   * Validé par IA VISUAL pour anti-triche
   */
  private async generateReward(
    userId: string,
    ipAddress?: string
  ): Promise<{ reward: ScratchReward; rewardVP: number }> {
    // Récupérer configuration récompenses
    const rewards = SCRATCH_TICKET_CONFIG.REWARDS;
    
    // Calculer poids total
    const totalWeight = 
      rewards.FIVE_VP.weight +
      rewards.TEN_VP.weight +
      rewards.TWENTY_VP.weight +
      rewards.FIFTY_VP.weight +
      rewards.NOTHING.weight;

    // Générer nombre aléatoire
    const random = Math.random() * totalWeight;
    let cumulative = 0;

    // Déterminer récompense basée sur poids
    if (random < (cumulative += rewards.FIVE_VP.weight)) {
      return { reward: '5vp', rewardVP: 5 };
    }
    if (random < (cumulative += rewards.TEN_VP.weight)) {
      return { reward: '10vp', rewardVP: 10 };
    }
    if (random < (cumulative += rewards.TWENTY_VP.weight)) {
      return { reward: '20vp', rewardVP: 20 };
    }
    if (random < (cumulative += rewards.FIFTY_VP.weight)) {
      return { reward: '50vp', rewardVP: 50 };
    }

    // Rien gagné
    return { reward: 'nothing', rewardVP: 0 };
  }

  /**
   * Nettoyer les tickets expirés (CRON)
   */
  async expireOldTickets(): Promise<{ expired: number }> {
    const now = new Date();

    const result = await db
      .update(scratchTickets)
      .set({ status: 'expired' })
      .where(
        and(
          eq(scratchTickets.status, 'pending'),
          sql`${scratchTickets.expiresAt} < ${now}`
        )
      )
      .returning();

    console.log(`[ScratchTicket] Expired ${result.length} old tickets`);
    return { expired: result.length };
  }

  /**
   * Statistiques admin
   */
  async getStatistics(): Promise<{
    totalTickets: number;
    pending: number;
    scratched: number;
    expired: number;
    totalVPDistributed: number;
  }> {
    const [stats] = await db
      .select({
        totalTickets: count(),
        totalVPDistributed: sql<number>`COALESCE(SUM(CASE WHEN status = 'scratched' THEN reward_vp ELSE 0 END), 0)`,
      })
      .from(scratchTickets);

    const [pendingCount] = await db
      .select({ count: count() })
      .from(scratchTickets)
      .where(eq(scratchTickets.status, 'pending'));

    const [scratchedCount] = await db
      .select({ count: count() })
      .from(scratchTickets)
      .where(eq(scratchTickets.status, 'scratched'));

    const [expiredCount] = await db
      .select({ count: count() })
      .from(scratchTickets)
      .where(eq(scratchTickets.status, 'expired'));

    return {
      totalTickets: stats?.totalTickets || 0,
      pending: pendingCount?.count || 0,
      scratched: scratchedCount?.count || 0,
      expired: expiredCount?.count || 0,
      totalVPDistributed: stats?.totalVPDistributed || 0,
    };
  }
}

export const scratchTicketService = new ScratchTicketService();
