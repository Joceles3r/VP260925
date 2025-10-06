/**
 * Service de gestion des paramètres de plateforme
 * Contrôle les feature flags et paramètres globaux
 */

import { db } from '../db';
import { platformSettings } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Clés de paramètres disponibles
export const PLATFORM_SETTING_KEYS = {
  LOGO_OFFICIAL_VISIBLE: 'logo_official_visible',
  MAINTENANCE_MODE: 'maintenance_mode',
  NEW_REGISTRATION_ENABLED: 'new_registration_enabled',
  LIVE_SHOWS_ENABLED: 'live_shows_enabled',
  VOIX_INFO_ENABLED: 'voix_info_enabled',
  PETITES_ANNONCES_ENABLED: 'petites_annonces_enabled',
} as const;

export type PlatformSettingKey = typeof PLATFORM_SETTING_KEYS[keyof typeof PLATFORM_SETTING_KEYS];

/**
 * Récupérer un paramètre par clé
 */
export async function getSetting(key: PlatformSettingKey): Promise<string | null> {
  const [setting] = await db
    .select()
    .from(platformSettings)
    .where(eq(platformSettings.key, key))
    .limit(1);

  return setting?.value || null;
}

/**
 * Récupérer un paramètre booléen
 */
export async function getBooleanSetting(key: PlatformSettingKey, defaultValue = false): Promise<boolean> {
  const value = await getSetting(key);
  
  if (value === null) {
    return defaultValue;
  }
  
  return value === 'true' || value === '1';
}

/**
 * Définir un paramètre
 */
export async function setSetting(
  key: PlatformSettingKey,
  value: string | boolean,
  updatedBy?: string
): Promise<void> {
  const stringValue = typeof value === 'boolean' ? (value ? 'true' : 'false') : value;
  
  const existing = await db
    .select()
    .from(platformSettings)
    .where(eq(platformSettings.key, key))
    .limit(1);

  if (existing.length > 0) {
    // Update
    await db
      .update(platformSettings)
      .set({
        value: stringValue,
        updatedBy,
        updatedAt: new Date(),
      })
      .where(eq(platformSettings.key, key));
  } else {
    // Insert
    await db.insert(platformSettings).values({
      key,
      value: stringValue,
      updatedBy,
      updatedAt: new Date(),
    });
  }
}

/**
 * Récupérer tous les paramètres
 */
export async function getAllSettings(): Promise<Record<string, string>> {
  const settings = await db.select().from(platformSettings);
  
  return settings.reduce((acc, setting) => {
    acc[setting.key] = setting.value || '';
    return acc;
  }, {} as Record<string, string>);
}

/**
 * Initialiser les paramètres par défaut
 */
export async function initializeDefaultSettings(): Promise<void> {
  const defaults: Record<PlatformSettingKey, string> = {
    [PLATFORM_SETTING_KEYS.LOGO_OFFICIAL_VISIBLE]: 'false',
    [PLATFORM_SETTING_KEYS.MAINTENANCE_MODE]: 'false',
    [PLATFORM_SETTING_KEYS.NEW_REGISTRATION_ENABLED]: 'true',
    [PLATFORM_SETTING_KEYS.LIVE_SHOWS_ENABLED]: 'true',
    [PLATFORM_SETTING_KEYS.VOIX_INFO_ENABLED]: 'true',
    [PLATFORM_SETTING_KEYS.PETITES_ANNONCES_ENABLED]: 'true',
  };

  for (const [key, value] of Object.entries(defaults)) {
    const existing = await getSetting(key as PlatformSettingKey);
    if (existing === null) {
      await setSetting(key as PlatformSettingKey, value, 'system');
    }
  }
}

/**
 * Vérifier si le logo officiel est visible
 */
export async function isLogoVisible(): Promise<boolean> {
  return getBooleanSetting(PLATFORM_SETTING_KEYS.LOGO_OFFICIAL_VISIBLE, false);
}

/**
 * Toggle la visibilité du logo officiel
 */
export async function toggleLogoVisibility(visible: boolean, updatedBy?: string): Promise<void> {
  await setSetting(PLATFORM_SETTING_KEYS.LOGO_OFFICIAL_VISIBLE, visible, updatedBy);
}

export default {
  getSetting,
  getBooleanSetting,
  setSetting,
  getAllSettings,
  initializeDefaultSettings,
  isLogoVisible,
  toggleLogoVisibility,
  PLATFORM_SETTING_KEYS,
};
