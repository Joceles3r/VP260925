/**
 * Routes API pour les paramètres de plateforme
 */

import { Router, Request, Response } from 'express';
import platformSettingsService from '../services/platformSettingsService';

const router = Router();

/**
 * GET /api/platform-settings
 * Récupérer tous les paramètres de plateforme
 */
router.get('/api/platform-settings', async (req: Request, res: Response) => {
  try {
    const settings = await platformSettingsService.getAllSettings();
    
    // Convertir en format booléen pour le client
    const formattedSettings = {
      logo_official_visible: settings.logo_official_visible === 'true',
      maintenance_mode: settings.maintenance_mode === 'true',
      new_registration_enabled: settings.new_registration_enabled === 'true',
      live_shows_enabled: settings.live_shows_enabled === 'true',
      voix_info_enabled: settings.voix_info_enabled === 'true',
      petites_annonces_enabled: settings.petites_annonces_enabled === 'true',
    };
    
    res.json(formattedSettings);
  } catch (error) {
    console.error('Error fetching platform settings:', error);
    res.status(500).json({ error: 'Failed to fetch platform settings' });
  }
});

/**
 * PUT /api/platform-settings
 * Mettre à jour un paramètre (admin only)
 */
router.put('/api/platform-settings', async (req: Request, res: Response) => {
  try {
    // TODO: Vérifier que l'utilisateur est admin
    // if (!req.user?.isAdmin) {
    //   return res.status(403).json({ error: 'Forbidden' });
    // }

    const { key, value } = req.body;
    
    if (!key) {
      return res.status(400).json({ error: 'Missing key' });
    }
    
    const userId = (req as any).user?.id || 'admin';
    
    await platformSettingsService.setSetting(key, value, userId);
    
    res.json({ 
      success: true,
      message: 'Setting updated successfully' 
    });
  } catch (error) {
    console.error('Error updating platform setting:', error);
    res.status(500).json({ error: 'Failed to update platform setting' });
  }
});

/**
 * GET /api/platform-settings/logo-visible
 * Vérifier uniquement la visibilité du logo (public)
 */
router.get('/api/platform-settings/logo-visible', async (req: Request, res: Response) => {
  try {
    const isVisible = await platformSettingsService.isLogoVisible();
    res.json({ visible: isVisible });
  } catch (error) {
    console.error('Error checking logo visibility:', error);
    res.status(500).json({ error: 'Failed to check logo visibility' });
  }
});

export default router;
