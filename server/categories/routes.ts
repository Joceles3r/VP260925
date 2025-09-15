import { Router } from 'express';
import { 
  createCategorySchema, 
  updateCategorySchema, 
  startCycleSchema,
  closeCategorySchema,
  checkThresholdsSchema,
  categoryStatsSchema,
  CATEGORY_RULES
} from './schemas';
import { 
  createVideoCategory,
  updateVideoCategory,
  checkCategoryThresholds,
  startCycleManually,
  closeCategoryManually,
  getCategoryStats
} from './handlers';
import { storage } from '../storage';
import { isAuthenticated } from '../replitAuth';

/**
 * MODULE 5: Règles catégories vidéos - Routes API
 * 
 * Routes pour administration des catégories avec règles :
 * 1. Activation ≥30 vidéos → cycle 168h
 * 2. Extension 2ème cycle si <100 vidéos
 * 3. Clôture après 2×168h ou 100 vidéos
 * 4. Paiements automatiques via Stripe Connect
 */

export const categoriesRouter = Router();

// GET /api/categories/rules - Obtenir les règles métier (accessible à tous - PUBLIC)
categoriesRouter.get('/rules', (req, res) => {
  res.json({
    success: true,
    rules: {
      ...CATEGORY_RULES,
      description: {
        activation: "Une catégorie est activée dès qu'au moins 30 vidéos y sont déposées",
        firstCycle: "Premier cycle de 168 heures (7 jours) démarre automatiquement",
        maxVideos: "Maximum 100 vidéos par cycle",
        secondCycle: "Si <100 vidéos après le premier cycle, deuxième cycle automatique",
        closure: "Clôture automatique après 2×168h ou quand 100 vidéos sont atteintes",
        payments: "Paiements automatiques via Stripe Connect lors de la clôture"
      }
    }
  });
});

// Middleware d'authentification pour les routes protégées
categoriesRouter.use(isAuthenticated);

// GET /api/categories - Lister toutes les catégories vidéos
categoriesRouter.get('/', async (req, res) => {
  try {
    const categories = await storage.getAllVideoCategories();
    
    // Enrichir avec les comptes vidéos actuels
    const enrichedCategories = await Promise.all(
      categories.map(async (category) => {
        const currentCount = await storage.getCategoryActiveVideos(category.name || '');
        const now = new Date();
        
        let timeRemaining = null;
        if (category.cycleEndsAt && ['first_cycle', 'second_cycle'].includes(category.status || '')) {
          timeRemaining = Math.max(0, category.cycleEndsAt.getTime() - now.getTime());
        }
        
        return {
          ...category,
          currentVideoCount: currentCount,
          timeRemainingMs: timeRemaining,
          timeRemainingHours: timeRemaining ? Math.round(timeRemaining / (1000 * 60 * 60)) : null,
        };
      })
    );
    
    res.json({
      success: true,
      categories: enrichedCategories,
      rules: CATEGORY_RULES
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des catégories:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la récupération des catégories' 
    });
  }
});

// GET /api/categories/:categoryId - Obtenir une catégorie spécifique
categoriesRouter.get('/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    const category = await storage.getVideoCategoryById(categoryId);
    if (!category) {
      return res.status(404).json({ error: 'Catégorie introuvable' });
    }
    
    const currentCount = await storage.getCategoryActiveVideos(category.name || '');
    const now = new Date();
    
    let timeRemaining = null;
    if (category.cycleEndsAt && category.status && ['first_cycle', 'second_cycle'].includes(category.status)) {
      timeRemaining = Math.max(0, category.cycleEndsAt.getTime() - now.getTime());
    }
    
    res.json({
      success: true,
      category: {
        ...category,
        currentVideoCount: currentCount,
        timeRemainingMs: timeRemaining,
        timeRemainingHours: timeRemaining ? Math.round(timeRemaining / (1000 * 60 * 60)) : null,
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la catégorie:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la récupération de la catégorie' 
    });
  }
});

// POST /api/categories - Créer une nouvelle catégorie (admin uniquement)
categoriesRouter.post('/', async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);
    
    // Vérifier les permissions admin
    if (!user || user.profileType !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé. Administrateur requis.' });
    }
    
    // Valider les données
    const validation = createCategorySchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Données invalides',
        details: validation.error.errors
      });
    }
    
    const category = await createVideoCategory(validation.data, userId);
    
    res.status(201).json({
      success: true,
      category,
      message: `Catégorie "${category.displayName}" créée avec succès`
    });
  } catch (error) {
    console.error('Erreur lors de la création de la catégorie:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Erreur serveur lors de la création'
    });
  }
});

// PUT /api/categories/:categoryId - Mettre à jour une catégorie (admin uniquement)
categoriesRouter.put('/:categoryId', async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);
    
    // Vérifier les permissions admin
    if (!user || user.profileType !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé. Administrateur requis.' });
    }
    
    const { categoryId } = req.params;
    
    // Vérifier que la catégorie existe
    const existingCategory = await storage.getVideoCategoryById(categoryId);
    if (!existingCategory) {
      return res.status(404).json({ error: 'Catégorie introuvable' });
    }
    
    // Valider les données
    const validation = updateCategorySchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Données invalides',
        details: validation.error.errors
      });
    }
    
    const updatedCategory = await updateVideoCategory(categoryId, validation.data, userId);
    
    res.json({
      success: true,
      category: updatedCategory,
      message: `Catégorie "${updatedCategory.displayName}" mise à jour avec succès`
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la catégorie:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Erreur serveur lors de la mise à jour'
    });
  }
});

// POST /api/categories/check-thresholds - Vérifier automatiquement les seuils
categoriesRouter.post('/check-thresholds', async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);
    
    // Vérifier les permissions admin
    if (!user || user.profileType !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé. Administrateur requis.' });
    }
    
    // Valider les données (dryRun par défaut)
    const validation = checkThresholdsSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Données invalides',
        details: validation.error.errors
      });
    }
    
    const results = await checkCategoryThresholds(validation.data, userId);
    
    res.json({
      success: true,
      results,
      summary: {
        total: results.length,
        actions: results.filter(r => r.status !== 'no_action').length,
        errors: results.filter(r => r.status === 'error').length,
        dryRun: validation.data.dryRun
      },
      message: validation.data.dryRun 
        ? 'Simulation terminée - aucune action effectuée'
        : 'Vérification des seuils terminée'
    });
  } catch (error) {
    console.error('Erreur lors de la vérification des seuils:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Erreur serveur lors de la vérification'
    });
  }
});

// POST /api/categories/:categoryId/start-cycle - Démarrer un cycle manuellement (admin)
categoriesRouter.post('/:categoryId/start-cycle', async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);
    
    // Vérifier les permissions admin
    if (!user || user.profileType !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé. Administrateur requis.' });
    }
    
    const { categoryId } = req.params;
    
    // Valider les données
    const validation = startCycleSchema.safeParse({ 
      categoryId, 
      ...req.body 
    });
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Données invalides',
        details: validation.error.errors
      });
    }
    
    const result = await startCycleManually(validation.data, userId);
    
    res.json({
      success: true,
      result,
      message: `Cycle démarré pour la catégorie "${result.category}"`
    });
  } catch (error) {
    console.error('Erreur lors du démarrage du cycle:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Erreur serveur lors du démarrage'
    });
  }
});

// POST /api/categories/:categoryId/close - Clôturer une catégorie manuellement (admin)
categoriesRouter.post('/:categoryId/close', async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);
    
    // Vérifier les permissions admin
    if (!user || user.profileType !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé. Administrateur requis.' });
    }
    
    const { categoryId } = req.params;
    
    // Valider les données
    const validation = closeCategorySchema.safeParse({ 
      categoryId, 
      ...req.body 
    });
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Données invalides',
        details: validation.error.errors
      });
    }
    
    const result = await closeCategoryManually(validation.data, userId);
    
    res.json({
      success: true,
      result,
      message: `Catégorie "${result.category}" clôturée avec succès`
    });
  } catch (error) {
    console.error('Erreur lors de la clôture de la catégorie:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Erreur serveur lors de la clôture'
    });
  }
});

// GET /api/categories/:categoryId/stats - Obtenir les statistiques détaillées
categoriesRouter.get('/:categoryId/stats', async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    // Valider les paramètres
    const validation = categoryStatsSchema.safeParse({ 
      categoryId,
      includeVideos: req.query.includeVideos === 'true',
      includeInvestments: req.query.includeInvestments === 'true'
    });
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Paramètres invalides',
        details: validation.error.errors
      });
    }
    
    const stats = await getCategoryStats(validation.data);
    
    res.json({
      success: true,
      stats,
      rules: CATEGORY_RULES
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Erreur serveur lors de la récupération'
    });
  }
});

export default categoriesRouter;