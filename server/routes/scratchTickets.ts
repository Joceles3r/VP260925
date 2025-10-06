/**
 * Routes API pour Mini-Tickets "Scratch"
 */

import { Router, Request, Response } from 'express';
import { scratchTicketService } from '../services/scratchTicketService';

const router = Router();

/**
 * GET /api/scratch-tickets
 * Récupérer les tickets de l'utilisateur
 */
router.get('/api/scratch-tickets', async (req: any, res: Response) => {
  try {
    const userId = req.user?.claims?.sub;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentification requise' });
    }

    const tickets = await scratchTicketService.getUserTickets(userId);
    
    res.json({
      tickets,
      config: {
        triggerThreshold: 100,
        expiryDays: 30,
        maxPending: 5,
      },
    });
  } catch (error: any) {
    console.error('[ScratchTickets] Error getting tickets:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/scratch-tickets/:ticketId/scratch
 * Gratter un ticket
 */
router.post('/api/scratch-tickets/:ticketId/scratch', async (req: any, res: Response) => {
  try {
    const userId = req.user?.claims?.sub;
    const { ticketId } = req.params;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentification requise' });
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    const result = await scratchTicketService.scratchTicket(
      ticketId,
      userId,
      ipAddress,
      userAgent
    );
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json(result);
  } catch (error: any) {
    console.error('[ScratchTickets] Error scratching ticket:', error);
    res.status(500).json({ 
      success: false,
      reward: 'nothing',
      rewardVP: 0,
      message: error.message 
    });
  }
});

/**
 * GET /api/scratch-tickets/stats
 * Statistiques admin
 */
router.get('/api/scratch-tickets/stats', async (req: any, res: Response) => {
  try {
    // TODO: Vérifier que l'utilisateur est admin
    // if (!req.user?.isAdmin) {
    //   return res.status(403).json({ error: 'Admin requis' });
    // }

    const stats = await scratchTicketService.getStatistics();
    
    res.json(stats);
  } catch (error: any) {
    console.error('[ScratchTickets] Error getting stats:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/scratch-tickets/admin/expire
 * Expirer les vieux tickets (admin/cron)
 */
router.post('/api/scratch-tickets/admin/expire', async (req: any, res: Response) => {
  try {
    // TODO: Vérifier que l'utilisateur est admin ou CRON token
    
    const result = await scratchTicketService.expireOldTickets();
    
    res.json(result);
  } catch (error: any) {
    console.error('[ScratchTickets] Error expiring tickets:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
