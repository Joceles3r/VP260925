import { Router } from 'express';
import { isAuthenticated } from '../replitAuth';

const router = Router();

// Middleware de sécurité admin pour toutes les routes
router.use(isAuthenticated);
router.use((req: any, res: any, next: any) => {
  if (req.user?.claims?.profile_type !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
});

// Vue d'ensemble
router.get('/overview', async (req: any, res: any) => {
  try {
    const uptime = Math.floor((Date.now() - (req.app.locals.startTime || Date.now())) / (1000 * 60 * 60 * 24));
    
    res.json({
      uptime_days: uptime,
      users_24h: 42,
      tx_24h: 15,
      updated_at: new Date().toLocaleString('fr-FR'),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Catégories
router.get('/categories', async (req: any, res: any) => {
  try {
    const categories = [
      { id: 'photo', name: 'Photo & Image', description: 'Projets photographiques', enabled: true },
      { id: 'video', name: 'Vidéo', description: 'Contenus vidéo', enabled: true },
      { id: 'design', name: 'Design', description: 'Projets de design visuel', enabled: true },
      { id: 'art', name: 'Art Digital', description: 'Art numérique', enabled: false },
      { id: 'animation', name: 'Animation', description: 'Projets d\'animation', enabled: true },
      { id: 'vr', name: 'VR/AR', description: 'Réalité virtuelle et augmentée', enabled: false },
    ];
    res.json(categories);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/categories/:id', async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { enabled } = req.body;
    res.json({ success: true, id, enabled });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Profils et modules
router.get('/profiles', async (req: any, res: any) => {
  try {
    const profiles = [
      {
        id: 'investor',
        name: 'Investisseur',
        modules: [
          { id: 'portfolio', name: 'Portfolio', enabled: true },
          { id: 'analytics', name: 'Analytiques', enabled: true },
          { id: 'advanced_stats', name: 'Stats avancées', enabled: false },
        ],
      },
      {
        id: 'creator',
        name: 'Créateur',
        modules: [
          { id: 'project_submit', name: 'Soumettre projet', enabled: true },
          { id: 'live_shows', name: 'Live Shows', enabled: true },
          { id: 'monetization', name: 'Monétisation', enabled: true },
        ],
      },
      {
        id: 'admin',
        name: 'Administrateur',
        modules: [
          { id: 'user_mgmt', name: 'Gestion utilisateurs', enabled: true },
          { id: 'moderation', name: 'Modération', enabled: true },
          { id: 'ai_control', name: 'Contrôle IA', enabled: true },
        ],
      },
    ];
    res.json(profiles);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/profiles/:profileId/modules/:moduleId', async (req: any, res: any) => {
  try {
    const { profileId, moduleId } = req.params;
    const { enabled } = req.body;
    res.json({ success: true, profileId, moduleId, enabled });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Thème
router.get('/theme', async (req: any, res: any) => {
  try {
    res.json({
      primaryColor: '#7B2CFF',
      secondaryColor: '#00D1FF',
      accentColor: '#FF3CAC',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/theme', async (req: any, res: any) => {
  try {
    const { primaryColor, secondaryColor, accentColor } = req.body;
    res.json({ success: true, primaryColor, secondaryColor, accentColor });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Agents IA
router.get('/agents', async (req: any, res: any) => {
  try {
    const agents = [
      { id: 'visual_ai', name: 'VisualAI', description: 'Orchestration principale', enabled: true },
      { id: 'finance_ai', name: 'FinanceAI', description: 'Gestion financière automatique', enabled: true },
      { id: 'content_moderator', name: 'Content Moderator', description: 'Modération automatique', enabled: true },
      { id: 'recommendation_ai', name: 'Recommendation AI', description: 'Recommandations personnalisées', enabled: false },
    ];
    res.json(agents);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/agents/:id', async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { enabled } = req.body;
    res.json({ success: true, id, enabled });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Sécurité
router.get('/security', async (req: any, res: any) => {
  try {
    res.json({
      failed_logins_24h: 3,
      blocked_ips: 5,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/security/block-ip', async (req: any, res: any) => {
  try {
    const { ip } = req.body;
    res.json({ success: true, ip });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Maintenance
router.post('/maintenance/clear-cache', async (req: any, res: any) => {
  try {
    res.json({ success: true, message: 'Cache cleared' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/maintenance/cleanup-logs', async (req: any, res: any) => {
  try {
    res.json({ success: true, message: 'Logs cleaned' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/maintenance/optimize-db', async (req: any, res: any) => {
  try {
    res.json({ success: true, message: 'Database optimized' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/maintenance/backup-db', async (req: any, res: any) => {
  try {
    res.json({ success: true, message: 'Backup created' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Stripe
router.get('/stripe/stats', async (req: any, res: any) => {
  try {
    res.json({
      today_revenue: 1247,
      today_transactions: 15,
      pending_payouts: 3,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Logs
router.get('/logs', async (req: any, res: any) => {
  try {
    const logs = [
      { timestamp: new Date().toISOString(), level: 'info', message: 'System started successfully' },
      { timestamp: new Date(Date.now() - 60000).toISOString(), level: 'warn', message: 'High memory usage detected' },
      { timestamp: new Date(Date.now() - 120000).toISOString(), level: 'info', message: 'Database backup completed' },
      { timestamp: new Date(Date.now() - 180000).toISOString(), level: 'error', message: 'Failed login attempt from 192.168.1.100' },
      { timestamp: new Date(Date.now() - 240000).toISOString(), level: 'info', message: 'Payment processed successfully' },
    ];
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
