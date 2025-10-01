/**
 * VISUAL Studio Live Show - Weekly Orchestrator
 * 
 * Manages the complete weekly cycle:
 * - Phase 1 (Dim 12:00 → Lun 00:00): 100 → 50 candidates (AI + community votes)
 * - Phase 2 (Lun 00:00 → Mar 00:00): 50 → 2 finalists
 * - Phase 3 (Mar 00:00 → Ven 20:30): Preparation
 * - Live Show (Ven 21:00 → Sam 00:00): Battle A vs B
 * 
 * State machine: PLANNED → PRE_SHOW → LIVE_RUNNING → VOTES_CLOSED → RESULT_READY → ENDED
 */

import { storage } from '../storage';
import { 
  LIVE_SHOW_STATES,
  LIVE_SHOW_PHASES, 
  getCurrentPhaseForTime,
  calculateBattlePayouts,
  AI_WEIGHTS
} from '@shared/liveShowConstants';
import type { 
  LiveShowEdition, 
  LiveShowCandidate,
  LiveShowBattleInvestment
} from '@shared/schema';

export class LiveShowWeeklyOrchestrator {
  
  /**
   * Create a new weekly edition with proper timestamps (Europe/Paris timezone)
   */
  async createWeeklyEdition(liveShowId: string, weekNumber: number, year: number): Promise<LiveShowEdition> {
    // Calculate timestamps for Europe/Paris timezone
    const phase1Start = this.getNextDayOfWeek(0, 12); // Sunday 12:00
    const phase1End = this.getNextDayOfWeek(1, 0);    // Monday 00:00
    const phase2Start = phase1End;
    const phase2End = this.getNextDayOfWeek(2, 0);    // Tuesday 00:00
    const phase3Start = phase2End;
    const phase3End = this.getNextDayOfWeek(5, 20, 30); // Friday 20:30
    const liveStart = this.getNextDayOfWeek(5, 21);   // Friday 21:00
    const liveEnd = this.getNextDayOfWeek(6, 0);      // Saturday 00:00

    const edition = await storage.createLiveShowEdition({
      liveShowId,
      weekNumber,
      year,
      currentPhase: 'phase1',
      currentState: 'planned',
      phase1StartsAt: phase1Start,
      phase1EndsAt: phase1End,
      phase2StartsAt: phase2Start,
      phase2EndsAt: phase2End,
      phase3StartsAt: phase3Start,
      phase3EndsAt: phase3End,
      liveStartsAt: liveStart,
      liveEndsAt: liveEnd,
      votingOpensAt: liveStart,
      votingClosesAt: new Date(liveStart.getTime() + 2 * 60 * 60 * 1000 + 45 * 60 * 1000), // +2h45 = 23:45
      totalCandidates: 0,
      selectedCandidates: 0,
      finalistsSelected: false
    });

    console.log(`[LiveShowOrchestrator] Created weekly edition ${edition.id} for week ${weekNumber}/${year}`);
    return edition;
  }

  /**
   * Check and update edition state based on current time
   */
  async updateEditionState(editionId: string): Promise<void> {
    const edition = await storage.getLiveShowEdition(editionId);
    if (!edition) throw new Error('Edition not found');

    const now = new Date();
    const currentPhase = getCurrentPhaseForTime(now, {
      phase1StartsAt: new Date(edition.phase1StartsAt),
      phase1EndsAt: new Date(edition.phase1EndsAt),
      phase2StartsAt: new Date(edition.phase2StartsAt),
      phase2EndsAt: new Date(edition.phase2EndsAt),
      phase3StartsAt: new Date(edition.phase3StartsAt),
      phase3EndsAt: new Date(edition.phase3EndsAt),
      liveStartsAt: new Date(edition.liveStartsAt),
      liveEndsAt: new Date(edition.liveEndsAt)
    });

    let newState = edition.currentState;

    // State transitions based on phase and time
    if (currentPhase === 'phase1' || currentPhase === 'phase2' || currentPhase === 'phase3') {
      newState = 'planned';
    } else if (currentPhase === 'live') {
      const liveStart = new Date(edition.liveStartsAt);
      const votesClose = new Date(edition.votingClosesAt);
      
      if (now.getTime() < liveStart.getTime() + 30 * 60 * 1000) { // First 30min
        newState = 'pre_show';
      } else if (now.getTime() < votesClose.getTime()) {
        newState = 'live_running';
      } else if (now.getTime() >= votesClose.getTime()) {
        newState = 'votes_closed';
      }
    } else if (currentPhase === 'ended') {
      newState = 'ended';
    }

    if (newState !== edition.currentState || currentPhase !== edition.currentPhase) {
      await storage.updateLiveShowEdition(editionId, {
        currentPhase: currentPhase as any,
        currentState: newState as any
      });
      console.log(`[LiveShowOrchestrator] Edition ${editionId} transitioned to ${currentPhase}/${newState}`);
    }
  }

  /**
   * Run AI preselection for Phase 1 → Phase 2 (100 → 50 candidates)
   */
  async runPhase1Selection(editionId: string): Promise<void> {
    console.log(`[LiveShowOrchestrator] Running Phase 1 selection for edition ${editionId}`);
    
    const candidates = await storage.getLiveShowCandidates(editionId, 'submitted');
    
    if (candidates.length === 0) {
      console.log('[LiveShowOrchestrator] No candidates for Phase 1 selection');
      return;
    }

    // Score each candidate (AI + community votes)
    const scoredCandidates = await Promise.all(candidates.map(async (c) => {
      const aiScore = await this.calculateAIScore(c);
      const communityVotes = c.communityVotes || 0;
      const totalScore = aiScore + communityVotes;
      
      return { ...c, aiScore, totalScore };
    }));

    // Sort by total score and select top 50
    scoredCandidates.sort((a, b) => b.totalScore - a.totalScore);
    const selected = scoredCandidates.slice(0, 50);
    const eliminated = scoredCandidates.slice(50);

    // Update candidates status
    for (const candidate of selected) {
      await storage.updateLiveShowCandidate(candidate.id, {
        status: 'ai_selected',
        aiScore: candidate.aiScore.toFixed(2),
        totalScore: candidate.totalScore.toFixed(2),
        rank: selected.indexOf(candidate) + 1
      });
    }

    for (const candidate of eliminated) {
      await storage.updateLiveShowCandidate(candidate.id, {
        status: 'eliminated',
        eliminatedAt: new Date(),
        eliminatedInPhase: 'phase1',
        rank: scoredCandidates.indexOf(candidate) + 1
      });
    }

    await storage.updateLiveShowEdition(editionId, {
      selectedCandidates: selected.length
    });

    console.log(`[LiveShowOrchestrator] Phase 1 complete: ${selected.length} selected, ${eliminated.length} eliminated`);
  }

  /**
   * Run community selection for Phase 2 → Finalists (50 → 2)
   */
  async runPhase2Selection(editionId: string): Promise<void> {
    console.log(`[LiveShowOrchestrator] Running Phase 2 selection for edition ${editionId}`);
    
    const candidates = await storage.getLiveShowCandidates(editionId, 'ai_selected');
    
    if (candidates.length === 0) {
      console.log('[LiveShowOrchestrator] No candidates for Phase 2 selection');
      return;
    }

    // Sort by community votes (enhanced voting in Phase 2)
    const sorted = [...candidates].sort((a, b) => (b.communityVotes || 0) - (a.communityVotes || 0));
    const finalists = sorted.slice(0, 2);
    const eliminated = sorted.slice(2);

    // Update finalists
    for (const finalist of finalists) {
      await storage.updateLiveShowCandidate(finalist.id, {
        status: 'finalist',
        rank: finalists.indexOf(finalist) + 1
      });
    }

    // Update eliminated
    for (const candidate of eliminated) {
      await storage.updateLiveShowCandidate(candidate.id, {
        status: 'eliminated',
        eliminatedAt: new Date(),
        eliminatedInPhase: 'phase2'
      });
    }

    await storage.updateLiveShowEdition(editionId, {
      finalistsSelected: true
    });

    console.log(`[LiveShowOrchestrator] Phase 2 complete: 2 finalists selected`);
  }

  /**
   * Close votes and calculate winner (called at 23:45)
   */
  async closeVotesAndCalculateWinner(editionId: string): Promise<{
    winner: 'A' | 'B',
    scoreA: number,
    scoreB: number,
    totalPot: number
  }> {
    console.log(`[LiveShowOrchestrator] Closing votes for edition ${editionId}`);

    const edition = await storage.getLiveShowEdition(editionId);
    if (!edition) throw new Error('Edition not found');

    // Get all battle investments
    const investments = await storage.getLiveShowBattleInvestments(editionId);
    
    const investmentsA = investments.filter(inv => inv.finalist === 'A');
    const investmentsB = investments.filter(inv => inv.finalist === 'B');
    
    const votesA = investmentsA.reduce((sum, inv) => sum + (inv.votes || 0), 0);
    const votesB = investmentsB.reduce((sum, inv) => sum + (inv.votes || 0), 0);
    
    const amountA = investmentsA.reduce((sum, inv) => sum + parseFloat(inv.amountEUR), 0);
    const amountB = investmentsB.reduce((sum, inv) => sum + parseFloat(inv.amountEUR), 0);

    // Determine winner (votes first, then € if tied)
    let winner: 'A' | 'B';
    if (votesA > votesB) {
      winner = 'A';
    } else if (votesB > votesA) {
      winner = 'B';
    } else {
      // Tie: use € amount
      winner = amountA >= amountB ? 'A' : 'B';
    }

    const totalPot = amountA + amountB;

    // Update edition state
    await storage.updateLiveShowEdition(editionId, {
      currentState: 'result_ready'
    });

    // Update Live Show with final scores
    await storage.updateLiveShow(edition.liveShowId, {
      votesA,
      votesB,
      investmentA: amountA.toFixed(2),
      investmentB: amountB.toFixed(2)
    });

    console.log(`[LiveShowOrchestrator] Winner: ${winner} (${votesA} vs ${votesB} votes, ${amountA}€ vs ${amountB}€)`);

    return {
      winner,
      scoreA: votesA,
      scoreB: votesB,
      totalPot
    };
  }

  /**
   * Distribute payouts to winners and losers
   */
  async distributeBattlePayouts(editionId: string, winner: 'A' | 'B'): Promise<void> {
    console.log(`[LiveShowOrchestrator] Distributing payouts for edition ${editionId}`);

    const edition = await storage.getLiveShowEdition(editionId);
    if (!edition) throw new Error('Edition not found');

    const investments = await storage.getLiveShowBattleInvestments(editionId);
    
    const winnerInvestments = investments
      .filter(inv => inv.finalist === winner)
      .map(inv => ({ userId: inv.userId, amount: parseFloat(inv.amountEUR) }));
    
    const loserInvestments = investments
      .filter(inv => inv.finalist !== winner)
      .map(inv => ({ userId: inv.userId, amount: parseFloat(inv.amountEUR) }));

    const totalPot = investments.reduce((sum, inv) => sum + parseFloat(inv.amountEUR), 0);

    const distribution = calculateBattlePayouts(totalPot, winnerInvestments, loserInvestments);

    // Update investment records with payout amounts
    for (const payout of distribution.winnerPayouts) {
      const investment = investments.find(inv => inv.userId === payout.userId && inv.finalist === winner);
      if (investment) {
        await storage.updateLiveShowBattleInvestment(investment.id, {
          isWinner: true,
          payoutAmount: payout.payout.toFixed(2)
        });
      }
    }

    for (const payout of distribution.loserPayouts) {
      const investment = investments.find(inv => inv.userId === payout.userId && inv.finalist !== winner);
      if (investment) {
        await storage.updateLiveShowBattleInvestment(investment.id, {
          isWinner: false,
          payoutAmount: payout.payout.toFixed(2)
        });
      }
    }

    console.log(`[LiveShowOrchestrator] Distributed ${distribution.totalDistributed}€ to ${distribution.winnerPayouts.length + distribution.loserPayouts.length} investors`);
  }

  /**
   * Calculate AI score for a candidate (activity + quality + engagement + creativity)
   */
  private async calculateAIScore(candidate: LiveShowCandidate): Promise<number> {
    // These would be real ML models in production
    const activityScore = Math.random() * 1.0;
    const qualityScore = Math.random() * 1.0;
    const engagementScore = Math.random() * 1.0;
    const creativityScore = Math.random() * 1.0;

    const aiScore = 
      activityScore * AI_WEIGHTS.activity +
      qualityScore * AI_WEIGHTS.quality +
      engagementScore * AI_WEIGHTS.engagement +
      creativityScore * AI_WEIGHTS.creativity;

    // Update candidate with individual scores
    await storage.updateLiveShowCandidate(candidate.id, {
      activityScore: activityScore.toFixed(2),
      qualityScore: qualityScore.toFixed(2),
      engagementScore: engagementScore.toFixed(2),
      creativityScore: creativityScore.toFixed(2)
    });

    return aiScore;
  }

  /**
   * Helper: Get next occurrence of a day of week at specific time (Europe/Paris)
   */
  private getNextDayOfWeek(dayOfWeek: number, hour: number, minute: number = 0): Date {
    const now = new Date();
    const result = new Date(now);
    result.setHours(hour, minute, 0, 0);
    
    const currentDay = now.getDay();
    let daysToAdd = dayOfWeek - currentDay;
    
    if (daysToAdd < 0 || (daysToAdd === 0 && now.getHours() >= hour)) {
      daysToAdd += 7;
    }
    
    result.setDate(now.getDate() + daysToAdd);
    return result;
  }
}

export const liveShowWeeklyOrchestrator = new LiveShowWeeklyOrchestrator();
