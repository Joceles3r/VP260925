import { storage } from '../storage';
import { CATEGORY_RULES, CATEGORY_EVENTS } from './schemas';
import type { 
  CreateCategoryRequest, 
  UpdateCategoryRequest, 
  StartCycleRequest,
  CloseCategoryRequest,
  CheckThresholdsRequest,
  CategoryStatsRequest,
  CategoryPayoutRequest 
} from './schemas';

/**
 * MODULE 5: Règles catégories vidéos - Handlers de logique métier
 * 
 * Implémentation des règles :
 * 1. Activation automatique à 30 vidéos
 * 2. Gestion des cycles de 168h 
 * 3. Extension automatique au 2ème cycle
 * 4. Clôture et paiements Stripe Connect
 */

// Créer une nouvelle catégorie vidéo
export async function createVideoCategory(data: CreateCategoryRequest, adminId: string) {
  // Vérifier que l'admin existe et a les droits
  const admin = await storage.getUser(adminId);
  if (!admin || admin.profileType !== 'admin') {
    throw new Error('Seuls les administrateurs peuvent créer des catégories');
  }

  // Créer la catégorie
  const category = await storage.createVideoCategory({
    name: data.name,
    displayName: data.displayName,
    description: data.description,
    targetVideoCount: data.targetVideoCount,
    maxVideoCount: data.maxVideoCount,
    status: 'waiting',
    currentVideoCount: 0,
    currentCycle: 0,
    isActive: false,
  });

  // Audit log
  await storage.createAuditLog({
    action: CATEGORY_EVENTS.CATEGORY_CREATED,
    userId: adminId,
    resourceType: 'category',
    resourceId: category.id!,
    details: { 
      message: `Catégorie créée: ${category.displayName}`,
      categoryData: data 
    },
  });

  return category;
}

// Mettre à jour une catégorie existante
export async function updateVideoCategory(categoryId: string, data: UpdateCategoryRequest, adminId: string) {
  const admin = await storage.getUser(adminId);
  if (!admin || admin.profileType !== 'admin') {
    throw new Error('Seuls les administrateurs peuvent modifier les catégories');
  }

  const category = await storage.updateVideoCategoryById(categoryId, data);

  await storage.createAuditLog({
    action: CATEGORY_EVENTS.CATEGORY_UPDATED,
    userId: adminId,
    resourceType: 'category',
    resourceId: categoryId,
    details: { 
      message: `Catégorie mise à jour: ${category.displayName}`,
      updates: data 
    },
  });

  return category;
}

// Vérifier automatiquement les seuils pour toutes les catégories
export async function checkCategoryThresholds(request: CheckThresholdsRequest, triggeredBy?: string) {
  const results = [];
  
  // Récupérer toutes les catégories actives ou en attente
  const categories = await storage.getAllVideoCategories();
  const categoriesToCheck = request.categoryIds 
    ? categories.filter(c => c.id && request.categoryIds!.includes(c.id))
    : categories.filter(c => c.status && ['waiting', 'active', 'first_cycle', 'second_cycle'].includes(c.status));

  for (const category of categoriesToCheck) {
    try {
      const result = await checkSingleCategoryThreshold(category, request.dryRun);
      results.push(result);
    } catch (error) {
      results.push({
        categoryId: category.id,
        status: 'error',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }
  }

  // Audit global de la vérification
  if (triggeredBy) {
    await storage.createAuditLog({
      action: CATEGORY_EVENTS.THRESHOLD_CHECK,
      userId: triggeredBy,
      resourceType: 'category',
      details: { 
        message: `Vérification seuils: ${results.length} catégories vérifiées`,
        dryRun: request.dryRun, 
        categoriesChecked: categoriesToCheck.map(c => c.id).filter(Boolean),
        results
      },
    });
  }

  return results;
}

// Vérifier le seuil d'une catégorie spécifique
async function checkSingleCategoryThreshold(category: any, dryRun: boolean) {
  const currentCount = await storage.getCategoryActiveVideos(category.name!);
  const now = new Date();

  // Cas 1: Catégorie en attente - vérifier activation (≥30 vidéos)
  if (category.status === 'waiting' && currentCount >= CATEGORY_RULES.MIN_VIDEOS_TO_ACTIVATE) {
    if (!dryRun) {
      const cycleStart = new Date();
      const cycleEnd = new Date(cycleStart.getTime() + CATEGORY_RULES.CYCLE_DURATION_HOURS * 60 * 60 * 1000);
      
      await storage.updateVideoCategoryById(category.id, {
        status: 'first_cycle',
        currentVideoCount: currentCount,
        cycleStartedAt: cycleStart,
        cycleEndsAt: cycleEnd,
        currentCycle: 1,
        isActive: true,
      });

      await storage.createAuditLog({
        action: CATEGORY_EVENTS.CYCLE_STARTED,
        userId: 'system', // System-triggered action
        resourceType: 'category',
        resourceId: category.id!,
        details: { 
          message: `Premier cycle démarré pour ${category.displayName} (${currentCount} vidéos)`,
          videoCount: currentCount, 
          cycleEnd 
        },
      });
    }

    return {
      categoryId: category.id,
      status: 'cycle_started',
      action: dryRun ? 'would_start_cycle' : 'cycle_started',
      videoCount: currentCount,
      cycleNumber: 1
    };
  }

  // Cas 2: Premier cycle terminé - vérifier extension ou clôture
  if (category.status === 'first_cycle' && category.cycleEndsAt && now >= category.cycleEndsAt) {
    if (currentCount >= CATEGORY_RULES.MAX_VIDEOS_PER_CYCLE) {
      // Max atteint → Clôture
      return await closeCategoryForMaxVideos(category, currentCount, dryRun);
    } else {
      // Extension au 2ème cycle
      return await extendToSecondCycle(category, currentCount, dryRun);
    }
  }

  // Cas 3: Deuxième cycle terminé - clôture obligatoire
  if (category.status === 'second_cycle' && category.cycleEndsAt && now >= category.cycleEndsAt) {
    return await closeCategoryForEndOfCycles(category, currentCount, dryRun);
  }

  // Cas 4: Catégorie atteint le max pendant un cycle
  const maxVideos = category.maxVideoCount || CATEGORY_RULES.MAX_VIDEOS_PER_CYCLE;
  if (['first_cycle', 'second_cycle'].includes(category.status) && currentCount >= maxVideos) {
    return await closeCategoryForMaxVideos(category, currentCount, dryRun);
  }

  return {
    categoryId: category.id,
    status: 'no_action',
    videoCount: currentCount,
    cycleStatus: category.status
  };
}

// Extension au deuxième cycle
async function extendToSecondCycle(category: any, videoCount: number, dryRun: boolean) {
  if (!dryRun) {
    const cycleStart = new Date();
    const cycleEnd = new Date(cycleStart.getTime() + CATEGORY_RULES.CYCLE_DURATION_HOURS * 60 * 60 * 1000);
    
    await storage.updateVideoCategoryById(category.id, {
      status: 'second_cycle',
      currentVideoCount: videoCount,
      cycleStartedAt: cycleStart,
      cycleEndsAt: cycleEnd,
      currentCycle: 2,
    });

    await storage.createAuditLog({
      action: CATEGORY_EVENTS.CYCLE_EXTENDED,
      userId: 'system', // System-triggered action
      resourceType: 'category',
      resourceId: category.id!,
      details: { 
        message: `Deuxième cycle démarré pour ${category.displayName} (${videoCount} vidéos)`,
        videoCount, 
        cycleEnd 
      },
    });
  }

  return {
    categoryId: category.id,
    status: 'cycle_extended',
    action: dryRun ? 'would_extend_cycle' : 'cycle_extended',
    videoCount,
    cycleNumber: 2
  };
}

// Clôture pour max vidéos atteint
async function closeCategoryForMaxVideos(category: any, videoCount: number, dryRun: boolean) {
  if (!dryRun) {
    await storage.updateVideoCategoryById(category.id, {
      status: 'closed',
      currentVideoCount: videoCount,
      isActive: false,
    });

    await storage.createAuditLog({
      action: CATEGORY_EVENTS.CATEGORY_CLOSED,
      userId: 'system', // System-triggered action
      resourceType: 'category',
      resourceId: category.id!,
      details: { 
        message: `Catégorie clôturée (max 100 vidéos atteint): ${category.displayName}`,
        reason: 'max_videos', 
        videoCount 
      },
    });
  }

  return {
    categoryId: category.id,
    status: 'closed_max_videos',
    action: dryRun ? 'would_close_max' : 'closed_max_videos',
    videoCount,
    reason: 'Maximum de 100 vidéos atteint'
  };
}

// Clôture pour fin des 2 cycles
async function closeCategoryForEndOfCycles(category: any, videoCount: number, dryRun: boolean) {
  if (!dryRun) {
    await storage.updateVideoCategoryById(category.id, {
      status: 'closed',
      currentVideoCount: videoCount,
      isActive: false,
    });

    await storage.createAuditLog({
      action: CATEGORY_EVENTS.CATEGORY_CLOSED,
      userId: 'system', // System-triggered action
      resourceType: 'category',
      resourceId: category.id!,
      details: { 
        message: `Catégorie clôturée (2 cycles terminés): ${category.displayName}`,
        reason: 'cycles_completed', 
        videoCount, 
        cyclesCompleted: 2 
      },
    });
  }

  return {
    categoryId: category.id,
    status: 'closed_cycles_ended',
    action: dryRun ? 'would_close_cycles' : 'closed_cycles_ended',
    videoCount,
    reason: '2 cycles de 168h terminés'
  };
}

// Démarrer un cycle manuellement (admin uniquement)
export async function startCycleManually(request: StartCycleRequest, adminId: string) {
  const admin = await storage.getUser(adminId);
  if (!admin || admin.profileType !== 'admin') {
    throw new Error('Seuls les administrateurs peuvent démarrer un cycle manuellement');
  }

  const category = await storage.getVideoCategoryById(request.categoryId);
  if (!category) {
    throw new Error('Catégorie introuvable');
  }

  const currentCount = await storage.getCategoryActiveVideos(category.name!);
  
  if (!request.forceCycle && currentCount < CATEGORY_RULES.MIN_VIDEOS_TO_ACTIVATE) {
    throw new Error(`Cycle non démarrable: seulement ${currentCount} vidéos (minimum ${CATEGORY_RULES.MIN_VIDEOS_TO_ACTIVATE})`);
  }

  const cycleStart = new Date();
  const cycleEnd = new Date(cycleStart.getTime() + CATEGORY_RULES.CYCLE_DURATION_HOURS * 60 * 60 * 1000);
  
  await storage.updateVideoCategoryById(category.id, {
    status: 'first_cycle',
    currentVideoCount: currentCount,
    cycleStartedAt: cycleStart,
    cycleEndsAt: cycleEnd,
    currentCycle: 1,
    isActive: true,
  });

  await storage.createAuditLog({
    action: CATEGORY_EVENTS.CYCLE_STARTED,
    userId: adminId,
    resourceType: 'category',
    resourceId: category.id!,
    details: { 
      message: `Cycle démarré manuellement pour ${category.displayName} (${currentCount} vidéos)`,
      manual: true, 
      forced: request.forceCycle, 
      videoCount: currentCount 
    },
  });

  return {
    success: true,
    category: category.displayName,
    videoCount: currentCount,
    cycleEnd
  };
}

// Clôturer une catégorie manuellement
export async function closeCategoryManually(request: CloseCategoryRequest, adminId: string) {
  const admin = await storage.getUser(adminId);
  if (!admin || admin.profileType !== 'admin') {
    throw new Error('Seuls les administrateurs peuvent clôturer une catégorie manuellement');
  }

  const category = await storage.getVideoCategoryById(request.categoryId);
  if (!category) {
    throw new Error('Catégorie introuvable');
  }

  const currentCount = await storage.getCategoryActiveVideos(category.name!);

  await storage.updateVideoCategoryById(category.id, {
    status: 'closed',
    currentVideoCount: currentCount,
    isActive: false,
  });

  await storage.createAuditLog({
    action: CATEGORY_EVENTS.CATEGORY_CLOSED,
    userId: adminId,
    resourceType: 'category',
    resourceId: category.id!,
    details: { 
      message: `Catégorie clôturée manuellement: ${category.displayName} - ${request.reason}`,
      manual: true, 
      reason: request.reason, 
      videoCount: currentCount 
    },
  });

  // TODO: Déclencher les paiements si demandé
  if (request.triggerPayments) {
    // Logique de paiement via Stripe Connect à implémenter
  }

  return {
    success: true,
    category: category.displayName,
    videoCount: currentCount,
    reason: request.reason
  };
}

// Obtenir les statistiques d'une catégorie
export async function getCategoryStats(request: CategoryStatsRequest) {
  const category = await storage.getVideoCategoryById(request.categoryId);
  if (!category) {
    throw new Error('Catégorie introuvable');
  }

  const currentCount = await storage.getCategoryActiveVideos(category.name!);
  const now = new Date();

  let timeRemaining = null;
  if (category.cycleEndsAt && category.status && ['first_cycle', 'second_cycle'].includes(category.status)) {
    timeRemaining = Math.max(0, category.cycleEndsAt.getTime() - now.getTime());
  }

  const stats = {
    category: {
      id: category.id,
      name: category.name,
      displayName: category.displayName,
      status: category.status,
      currentCycle: category.currentCycle,
    },
    videos: {
      current: currentCount,
      target: category.targetVideoCount,
      max: category.maxVideoCount,
      remaining: Math.max(0, (category.maxVideoCount || CATEGORY_RULES.MAX_VIDEOS_PER_CYCLE) - currentCount),
    },
    cycle: {
      started: category.cycleStartedAt,
      ends: category.cycleEndsAt,
      timeRemainingMs: timeRemaining,
      timeRemainingHours: timeRemaining ? Math.round(timeRemaining / (1000 * 60 * 60)) : null,
    }
  };

  return stats;
}