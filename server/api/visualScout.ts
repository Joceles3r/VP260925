import { Router, Request, Response } from "express";
import { z } from "zod";
import { 
  visualScoutAI, 
  createSegmentSchema, 
  simulateCampaignSchema, 
  createCampaignSchema 
} from "../services/visualScoutAI";

export const router = Router();

// Middleware pour vérifier les droits admin
const requireAdminAccess = (req: Request, res: Response, next: any) => {
  // Mock admin check - en production, vérifier la session et les droits
  const isAdmin = req.headers['x-admin-token'] === 'admin-token' || 
                  req.query.admin === 'true'; // Pour les tests
  
  if (!isAdmin) {
    return res.status(403).json({ 
      success: false, 
      error: 'Admin access required for VisualScoutAI operations' 
    });
  }
  next();
};

// Créer un segment d'audience
router.post("/api/admin/tc/segments", requireAdminAccess, async (req: Request, res: Response) => {
  try {
    const data = createSegmentSchema.parse(req.body);
    
    // Mock création - en production, insérer en DB
    const segment = {
      id: `segment-${Date.now()}`,
      ...data,
      status: 'active' as const,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Log de l'action admin
    console.log(`📊 VisualScoutAI: Segment created by admin`, { segmentId: segment.id, name: data.name });

    res.status(201).json({
      success: true,
      data: segment
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Invalid segment data'
    });
  }
});

// Lister les segments
router.get("/api/admin/tc/segments", requireAdminAccess, async (req: Request, res: Response) => {
  try {
    // Mock data - en production, récupérer depuis DB
    const segments = [
      {
        id: 'segment-1',
        name: 'Créateurs Francophones',
        rules: {
          keywords: ['court-métrage', 'documentaire', 'réalisateur'],
          lang: ['fr'],
          zones: ['FR', 'BE', 'CH']
        },
        locale: 'fr-FR',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    res.json({
      success: true,
      data: segments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch segments'
    });
  }
});

// Simuler une campagne
router.post("/api/admin/tc/simulate", requireAdminAccess, async (req: Request, res: Response) => {
  try {
    const data = simulateCampaignSchema.parse(req.body);
    
    // Simulation basée sur les algorithmes de VisualScoutAI
    const mockSignals = await visualScoutAI.detectSignals(['court-métrage'], 'fr-FR');
    const interestScore = visualScoutAI.calculateInterestScore(mockSignals);
    const ctrPred = visualScoutAI.predictCTR(interestScore, data.channel);
    const cvrPred = visualScoutAI.predictCVR(interestScore, ctrPred);
    const cpi = visualScoutAI.estimateCPI(data.channel);
    
    const reachPred = Math.floor(data.budget / cpi);
    const clicksPred = Math.floor(reachPred * (ctrPred / 100));
    const conversionsPred = Math.floor(clicksPred * (cvrPred / 100));

    res.json({
      success: true,
      data: {
        segmentId: data.segmentId,
        budget: data.budget,
        reachPred,
        ctrPred,
        cvrPred,
        cpiEst: cpi,
        clicksPred,
        conversionsPred,
        interestScore
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Invalid simulation data'
    });
  }
});

// Créer une campagne
router.post("/api/admin/tc/campaigns", requireAdminAccess, async (req: Request, res: Response) => {
  try {
    const data = createCampaignSchema.parse(req.body);
    
    // Validation de conformité
    const compliance = visualScoutAI.validateCompliance(data);
    if (!compliance.valid) {
      return res.status(400).json({
        success: false,
        error: 'Compliance validation failed',
        issues: compliance.issues
      });
    }

    // Mock création - en production, insérer en DB
    const campaign = {
      id: `campaign-${Date.now()}`,
      ...data,
      currency: 'EUR',
      status: 'draft' as const,
      createdBy: 'admin-user-id', // En production, récupérer depuis session
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Log de l'action admin
    console.log(`📊 VisualScoutAI: Campaign created by admin`, { 
      campaignId: campaign.id, 
      channel: data.channel,
      budget: data.budgetCents / 100 
    });

    res.status(201).json({
      success: true,
      data: campaign
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Invalid campaign data'
    });
  }
});

// Dashboard métriques
router.get("/api/admin/tc/dashboard", requireAdminAccess, async (req: Request, res: Response) => {
  try {
    const metrics = await visualScoutAI.getDashboardMetrics();
    
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard metrics'
    });
  }
});

// Kill switch - arrêt d'urgence
router.post("/api/admin/tc/kill", requireAdminAccess, async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;
    
    if (!reason || typeof reason !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Reason required for emergency stop'
      });
    }

    await visualScoutAI.emergencyStop('admin-user-id', reason);

    res.json({
      success: true,
      message: 'VisualScoutAI emergency stop activated',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to execute emergency stop'
    });
  }
});

// Générer template d'outreach
router.post("/api/admin/tc/outreach-template", requireAdminAccess, async (req: Request, res: Response) => {
  try {
    const { locale, theme, firstName } = req.body;
    
    const template = visualScoutAI.generateOutreachTemplate(locale || 'fr-FR', theme || 'cinéma', firstName);
    
    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate outreach template'
    });
  }
});

// Statut de coordination des agents
router.get("/api/admin/agents/status", requireAdminAccess, async (req: Request, res: Response) => {
  try {
    const { agentCoordinator } = await import("../services/agentCoordinator");
    const systemHealth = await agentCoordinator.getSystemHealth();
    
    res.json({
      success: true,
      data: systemHealth
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch agents status'
    });
  }
});

// Commande inter-agents
router.post("/api/admin/agents/command", requireAdminAccess, async (req: Request, res: Response) => {
  try {
    const { agentName, action, parameters, priority = 'medium' } = req.body;
    const { agentCoordinator } = await import("../services/agentCoordinator");
    
    const result = await agentCoordinator.sendCommand({
      agentName,
      action,
      parameters,
      priority,
      requestedBy: 'admin-user-id' // En production, récupérer depuis session
    });
    
    res.json({
      success: result.success,
      data: result.result,
      error: result.error
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to execute agent command'
    });
  }
}
)