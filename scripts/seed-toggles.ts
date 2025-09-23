#!/usr/bin/env tsx

/**
 * Script pour initialiser les données par défaut des feature toggles
 */

import { storage } from '../server/storage';
import { insertFeatureToggleSchema } from '../shared/schema';

const defaultToggles = [
  {
    key: 'films',
    label: 'Films et cinéma',
    kind: 'category' as const,
    isVisible: true,
    hiddenMessageVariant: 'en_cours' as const,
    timezone: 'Europe/Paris',
    updatedBy: 'system-seed'
  },
  {
    key: 'videos',
    label: 'Vidéos créatives',
    kind: 'category' as const,
    isVisible: true,
    hiddenMessageVariant: 'en_cours' as const,
    timezone: 'Europe/Paris',
    updatedBy: 'system-seed'
  },
  {
    key: 'documentaires',
    label: 'Documentaires',
    kind: 'category' as const,
    isVisible: true,
    hiddenMessageVariant: 'en_cours' as const,
    timezone: 'Europe/Paris',
    updatedBy: 'system-seed'
  },
  {
    key: 'voix_info',
    label: 'Voix et information',
    kind: 'category' as const,
    isVisible: true,
    hiddenMessageVariant: 'en_cours' as const,
    timezone: 'Europe/Paris',
    updatedBy: 'system-seed'
  },
  {
    key: 'live_show',
    label: 'Live Shows',
    kind: 'category' as const,
    isVisible: true,
    hiddenMessageVariant: 'en_cours' as const,
    timezone: 'Europe/Paris',
    updatedBy: 'system-seed'
  },
  {
    key: 'livres',
    label: 'Livres et écriture',
    kind: 'category' as const,
    isVisible: true,
    hiddenMessageVariant: 'en_cours' as const,
    timezone: 'Europe/Paris',
    updatedBy: 'system-seed'
  },
  {
    key: 'petites_annonces',
    label: 'Petites annonces',
    kind: 'rubrique' as const,
    isVisible: true,
    hiddenMessageVariant: 'en_cours' as const,
    timezone: 'Europe/Paris',
    updatedBy: 'system-seed'
  }
];

async function seedFeatureToggles() {
  console.log('🌱 Initialisation des feature toggles par défaut...');
  
  try {
    // Vérifier les toggles existants
    const existingToggles = await storage.getFeatureToggles();
    console.log(`📊 ${existingToggles.length} toggles existants trouvés`);
    
    let created = 0;
    let skipped = 0;
    
    for (const toggleData of defaultToggles) {
      const exists = existingToggles.find(t => t.key === toggleData.key);
      
      if (exists) {
        console.log(`⏭️  Toggle "${toggleData.key}" existe déjà, ignoré`);
        skipped++;
        continue;
      }
      
      // Valider les données avec le schéma
      const validatedData = insertFeatureToggleSchema.parse(toggleData);
      
      await storage.createFeatureToggle(validatedData);
      console.log(`✅ Toggle "${toggleData.key}" créé avec succès`);
      created++;
    }
    
    console.log(`\n🎉 Seed terminé !`);
    console.log(`📈 ${created} nouveaux toggles créés`);
    console.log(`⏭️  ${skipped} toggles ignorés (déjà existants)`);
    console.log(`🔧 Total: ${existingToggles.length + created} toggles dans la base`);
    
  } catch (error) {
    console.error('❌ Erreur lors du seed des toggles:', error);
    process.exit(1);
  }
}

// Exécuter le script
if (import.meta.url === `file://${process.argv[1]}`) {
  seedFeatureToggles()
    .then(() => {
      console.log('✨ Seed terminé avec succès');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erreur fatale:', error);
      process.exit(1);
    });
}

export { seedFeatureToggles };