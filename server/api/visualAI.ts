import { Router, Request, Response } from "express";
import { z } from "zod";
import { visualAI } from "../services/visualAI";
import { visualFinanceAI } from "../services/visualFinanceAI";

export const router = Router();

// Middleware pour vérifier les droits admin
const requireAdminAccess = (req: Request, res: Response, next: any) => {
  const isAdmin = req.headers['x-admin-token'] === 'admin-token' || 
                  req.query.admin === 'true';
  
  if (!isAdmin) {
    return res.status(403).json({ 
      success: false, 
      error: 'Admin access required for VisualAI operations' 
    });
  }
  next();
};

// ===== MÉTRIQUES & MONITORING =====

router.get("/api/admin/visual-ai/metrics", requireAdminAccess, async (req: Request, res: Response) => {
  try {
    const metrics = await visualAI.getPerformanceMetrics();
    
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch VisualAI metrics'
    });
  }
});

// ===== DÉCISIONS IA =====

router.get("/api/admin/visual-ai/decisions", requireAdminAccess, async (req: Request, res: Response) => {
  try {
    const decisions = visualAI.getPendingDecisions();
    
    res.json({
      success: true,
      data: decisions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending decisions'
    });
  }
});

router.post("/api/admin/visual-ai/decisions/validate", requireAdminAccess, async (req: Request, res: Response) => {
  try {
    const { decisionId, approved, notes } = req.body;
    
    if (!decisionId || typeof approved !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'decisionId and approved status required'
      });
    }

    const result = await visualAI.validateDecision(
      decisionId, 
      'admin-user-id', // En production, récupérer depuis session
      approved, 
      notes
    );
    
    res.json({
      success: true,
      data: { validated: result, decisionId, approved }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Validation failed'
    });
  }
});

// ===== TESTS & SIMULATIONS =====

router.post("/api/admin/visual-ai/test-category-close", requireAdminAccess, async (req: Request, res: Response) => {
  try {
    const { categoryId, dryRun = true } = req.body;
    
    // Mock data pour test
    const mockProjects = [
      { id: 'proj-1', totalAmount: 1000, uniqueInvestors: 25, votes: 150, createdAt: '2024-01-15T10:00:00Z' },
      { id: 'proj-2', totalAmount: 2000, uniqueInvestors: 40, votes: 280, createdAt: '2024-01-10T14:30:00Z' },
      { id: 'proj-3', totalAmount: 500, uniqueInvestors: 15, votes: 89, createdAt: '2024-01-20T09:15:00Z' }
    ];

    const decision = await visualAI.orchestrateCategoryClose(categoryId, mockProjects);
    
    res.json({
      success: true,
      data: {
        decisionId: decision.id,
        categoryId,
        dryRun,
        payoutsCount: decision.parameters.finalRanking?.length || 0,
        totalAmount: decision.parameters.totalAmount,
        requiresValidation: decision.requiresValidation
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Test failed'
    });
  }
});

// ===== KILL SWITCH =====

router.post("/api/admin/visual-ai/kill", requireAdminAccess, async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;
    
    if (!reason || typeof reason !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Reason required for emergency stop'
      });
    }

    await visualAI.emergencyStop('admin-user-id', reason);

    res.json({
      success: true,
      message: 'VisualAI emergency stop activated',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to execute emergency stop'
    });
  }
});

// ===== FINANCE AI ENDPOINTS =====

router.get("/api/admin/finance/metrics", requireAdminAccess, async (req: Request, res: Response) => {
  try {
    const metrics = await visualFinanceAI.getFinancialMetrics();
    
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch financial metrics'
    });
  }
});

router.get("/api/admin/finance/recipes", requireAdminAccess, async (req: Request, res: Response) => {
  try {
    const recipes = visualFinanceAI.getPayoutRecipes();
    
    res.json({
      success: true,
      data: recipes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payout recipes'
    });
  }
});

router.get("/api/admin/finance/ledger", requireAdminAccess, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const entries = visualFinanceAI.getLedgerEntries(limit);
    
    res.json({
      success: true,
      data: entries
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ledger entries'
    });
  }
});

router.post("/api/admin/finance/test-redistribution", requireAdminAccess, async (req: Request, res: Response) => {
  try {
    const { amount, dryRun = true } = req.body;
    
    if (!amount || amount < 100) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be at least 100€'
      });
    }

    // Mock data pour test
    const mockInvTop10 = Array.from({ length: 10 }, (_, i) => `investor-${i + 1}`);
    const mockPortTop10 = Array.from({ length: 10 }, (_, i) => `creator-${i + 1}`);
    const mockInv11to100 = Array.from({ length: 20 }, (_, i) => `investor-${i + 11}`);

    const result = await visualFinanceAI.executeCloseCategory(
      'test-category',
      amount,
      mockInvTop10,
      mockPortTop10,
      mockInv11to100
    );
    
    res.json({
      success: true,
      data: {
        recipeId: result.id,
        payoutsCount: result.payouts.length,
        totalAmount: amount,
        dryRun,
        breakdown: {
          investorsTop10: result.payouts.filter(p => p.type === 'investor_top10').length,
          creatorsTop10: result.payouts.filter(p => p.type === 'creator_top10').length,
          investors11_100: result.payouts.filter(p => p.type === 'investor_11_100').length,
          visualPlatform: result.payouts.filter(p => p.type === 'visual_platform').length
        }
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Test failed'
    });
  }
});

router.post("/api/admin/finance/convert-points", requireAdminAccess, async (req: Request, res: Response) => {
  try {
    const { userId, points } = req.body;
    
    if (!userId || !points || points < 2500) {
      return res.status(400).json({
        success: false,
        error: 'Valid userId and minimum 2500 points required'
      });
    }

    const result = await visualFinanceAI.convertVisuPoints(userId, points);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Conversion failed'
    });
  }
});

router.post("/api/admin/finance/verify-ledger", requireAdminAccess, async (req: Request, res: Response) => {
  try {
    const verification = await visualFinanceAI.verifyLedgerIntegrity();
    
    res.json({
      success: true,
      data: verification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Ledger verification failed'
    });
  }
});

router.post("/api/admin/finance/kill", requireAdminAccess, async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;
    
    if (!reason || typeof reason !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Reason required for emergency stop'
      });
    }

    await visualFinanceAI.emergencyStop('admin-user-id', reason);

    res.json({
      success: true,
      message: 'VisualFinanceAI emergency stop activated',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to execute emergency stop'
    });
  }
});