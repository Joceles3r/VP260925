// ===== SERVICE DE GESTION DES CATÉGORIES ET CONTENUS =====

export interface ContentCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  parentId?: string;
  isActive: boolean;
  sortOrder: number;
  projectCount: number;
  avgInvestment: number;
  successRate: number;
}

export interface ProjectType {
  id: string;
  name: string;
  slug: string;
  description: string;
  categoryIds: string[];
  minInvestment: number;
  maxInvestment: number;
  avgDuration: number; // en minutes
  features: string[];
  requirements: string[];
  examples: string[];
}

export interface ContentTag {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  usage: number;
  trending: boolean;
}

// ===== TAXONOMIE COMPLÈTE DES CATÉGORIES =====

export const CONTENT_CATEGORIES: ContentCategory[] = [
  // CATÉGORIES PRINCIPALES
  {
    id: 'documentaries',
    name: 'Documentaires',
    slug: 'documentaires',
    description: 'Documentaires sur tous sujets : société, nature, histoire, sciences',
    icon: '🎬',
    color: 'bg-blue-500',
    isActive: true,
    sortOrder: 1,
    projectCount: 0,
    avgInvestment: 0,
    successRate: 0
  },
  {
    id: 'short-films',
    name: 'Courts-métrages',
    slug: 'courts-metrages',
    description: 'Films courts de fiction, expérimentaux ou artistiques',
    icon: '🎭',
    color: 'bg-purple-500',
    isActive: true,
    sortOrder: 2,
    projectCount: 0,
    avgInvestment: 0,
    successRate: 0
  },
  {
    id: 'music-videos',
    name: 'Clips Musicaux',
    slug: 'clips-musicaux',
    description: 'Vidéos musicales pour artistes émergents et confirmés',
    icon: '🎵',
    color: 'bg-pink-500',
    isActive: true,
    sortOrder: 3,
    projectCount: 0,
    avgInvestment: 0,
    successRate: 0
  },
  {
    id: 'animations',
    name: 'Animations',
    slug: 'animations',
    description: '2D, 3D, motion design et animations créatives',
    icon: '🎨',
    color: 'bg-orange-500',
    isActive: true,
    sortOrder: 4,
    projectCount: 0,
    avgInvestment: 0,
    successRate: 0
  },
  {
    id: 'live-shows',
    name: 'Live Shows',
    slug: 'live-shows',
    description: 'Spectacles en direct, battles créatives temps réel',
    icon: '🔴',
    color: 'bg-red-500',
    isActive: true,
    sortOrder: 5,
    projectCount: 0,
    avgInvestment: 0,
    successRate: 0
  },

  // SOUS-CATÉGORIES DOCUMENTAIRES
  {
    id: 'doc-society',
    name: 'Société & Actualités',
    slug: 'documentaires-societe',
    description: 'Enjeux sociétaux, politique, économie',
    icon: '🌍',
    color: 'bg-blue-400',
    parentId: 'documentaries',
    isActive: true,
    sortOrder: 11,
    projectCount: 0,
    avgInvestment: 0,
    successRate: 0
  },
  {
    id: 'doc-nature',
    name: 'Nature & Environnement',
    slug: 'documentaires-nature',
    description: 'Faune, flore, écologie, changement climatique',
    icon: '🌿',
    color: 'bg-green-500',
    parentId: 'documentaries',
    isActive: true,
    sortOrder: 12,
    projectCount: 0,
    avgInvestment: 0,
    successRate: 0
  },
  {
    id: 'doc-history',
    name: 'Histoire & Culture',
    slug: 'documentaires-histoire',
    description: 'Événements historiques, patrimoine, civilisations',
    icon: '🏛️',
    color: 'bg-amber-500',
    parentId: 'documentaries',
    isActive: true,
    sortOrder: 13,
    projectCount: 0,
    avgInvestment: 0,
    successRate: 0
  },
  {
    id: 'doc-science',
    name: 'Sciences & Technologies',
    slug: 'documentaires-science',
    description: 'Découvertes scientifiques, innovations, recherche',
    icon: '🔬',
    color: 'bg-cyan-500',
    parentId: 'documentaries',
    isActive: true,
    sortOrder: 14,
    projectCount: 0,
    avgInvestment: 0,
    successRate: 0
  },

  // SOUS-CATÉGORIES COURTS-MÉTRAGES  
  {
    id: 'film-fiction',
    name: 'Fiction Narrative',
    slug: 'courts-metrages-fiction',
    description: 'Histoires courtes, drames, comédies',
    icon: '🎪',
    color: 'bg-purple-400',
    parentId: 'short-films',
    isActive: true,
    sortOrder: 21,
    projectCount: 0,
    avgInvestment: 0,
    successRate: 0
  },
  {
    id: 'film-experimental',
    name: 'Expérimental & Artistique',
    slug: 'courts-metrages-experimental',
    description: 'Approches créatives, art vidéo, avant-garde',
    icon: '🎭',
    color: 'bg-indigo-500',
    parentId: 'short-films',
    isActive: true,
    sortOrder: 22,
    projectCount: 0,
    avgInvestment: 0,
    successRate: 0
  }
];

// ===== TYPES DE PROJETS =====

export const PROJECT_TYPES: ProjectType[] = [
  {
    id: 'documentary-standard',
    name: 'Documentaire Standard',
    slug: 'documentaire-standard',
    description: 'Documentaire de 20-60 minutes sur sujet d\'intérêt général',
    categoryIds: ['documentaries'],
    minInvestment: 5,
    maxInvestment: 20,
    avgDuration: 45,
    features: ['Narration professionnelle', 'Recherche approfondie', 'Interviews exclusives'],
    requirements: ['Synopsis détaillé', 'Plan de tournage', 'Équipe technique'],
    examples: ['Documentaire sur l\'art urbain', 'Portrait d\'artisan local', 'Enquête sociétale']
  },
  {
    id: 'music-video-indie',
    name: 'Clip Musical Indépendant',
    slug: 'clip-musical-independant',
    description: 'Clip pour artiste émergent avec approche créative',
    categoryIds: ['music-videos'],
    minInvestment: 3,
    maxInvestment: 15,
    avgDuration: 4,
    features: ['Direction artistique originale', 'Post-production soignée', 'Concept visuel fort'],
    requirements: ['Accord artiste', 'Droits musicaux', 'Storyboard'],
    examples: ['Clip concept narrative', 'Performance live stylisée', 'Animation sur musique']
  },
  {
    id: 'animation-2d',
    name: 'Animation 2D Créative',
    slug: 'animation-2d-creative',
    description: 'Court-métrage d\'animation 2D original',
    categoryIds: ['animations'],
    minInvestment: 4,
    maxInvestment: 18,
    avgDuration: 8,
    features: ['Animation fluide', 'Character design original', 'Bande sonore adaptée'],
    requirements: ['Animatic complet', 'Chara-design finalisé', 'Équipe animation'],
    examples: ['Histoire courte animée', 'Clip promotionnel animé', 'Série épisodique']
  },
  {
    id: 'live-battle',
    name: 'Battle Live Créative',
    slug: 'battle-live-creative',
    description: 'Compétition créative en direct entre artistes',
    categoryIds: ['live-shows'],
    minInvestment: 1,
    maxInvestment: 10,
    avgDuration: 120,
    features: ['Streaming temps réel', 'Vote communautaire', 'Interactions live'],
    requirements: ['Matériel streaming', 'Artistes confirmés', 'Modération live'],
    examples: ['Battle de dessin', 'Duel musical impro', 'Défi création vidéo']
  }
];

// ===== TAGS POPULAIRES =====

export const CONTENT_TAGS: ContentTag[] = [
  // Tags Documentaires
  { id: 'tag-ecology', name: 'Écologie', slug: 'ecologie', categoryId: 'doc-nature', usage: 156, trending: true },
  { id: 'tag-urban', name: 'Urbain', slug: 'urbain', categoryId: 'doc-society', usage: 89, trending: false },
  { id: 'tag-portrait', name: 'Portrait', slug: 'portrait', categoryId: 'documentaries', usage: 234, trending: true },
  { id: 'tag-investigation', name: 'Enquête', slug: 'enquete', categoryId: 'doc-society', usage: 67, trending: false },
  
  // Tags Courts-métrages
  { id: 'tag-drama', name: 'Drame', slug: 'drame', categoryId: 'film-fiction', usage: 143, trending: false },
  { id: 'tag-comedy', name: 'Comédie', slug: 'comedie', categoryId: 'film-fiction', usage: 98, trending: true },
  { id: 'tag-surreal', name: 'Surréalisme', slug: 'surrealisme', categoryId: 'film-experimental', usage: 45, trending: true },
  
  // Tags Musique
  { id: 'tag-rap', name: 'Rap', slug: 'rap', categoryId: 'music-videos', usage: 187, trending: true },
  { id: 'tag-electronic', name: 'Électronique', slug: 'electronique', categoryId: 'music-videos', usage: 76, trending: false },
  { id: 'tag-indie', name: 'Indépendant', slug: 'independant', categoryId: 'music-videos', usage: 145, trending: true },
  
  // Tags Animation
  { id: 'tag-2d', name: '2D', slug: '2d', categoryId: 'animations', usage: 123, trending: false },
  { id: 'tag-3d', name: '3D', slug: '3d', categoryId: 'animations', usage: 89, trending: true },
  { id: 'tag-motion', name: 'Motion Design', slug: 'motion-design', categoryId: 'animations', usage: 67, trending: true },
  
  // Tags Live
  { id: 'tag-battle', name: 'Battle', slug: 'battle', categoryId: 'live-shows', usage: 234, trending: true },
  { id: 'tag-impro', name: 'Improvisation', slug: 'improvisation', categoryId: 'live-shows', usage: 156, trending: true }
];

// ===== FONCTIONS UTILITAIRES =====

export class CategoryService {
  
  /**
   * Obtenir toutes les catégories principales (sans parent)
   */
  static getMainCategories(): ContentCategory[] {
    return CONTENT_CATEGORIES.filter(cat => !cat.parentId);
  }

  /**
   * Obtenir les sous-catégories d'une catégorie
   */
  static getSubCategories(parentId: string): ContentCategory[] {
    return CONTENT_CATEGORIES.filter(cat => cat.parentId === parentId);
  }

  /**
   * Obtenir une catégorie par son slug
   */
  static getCategoryBySlug(slug: string): ContentCategory | undefined {
    return CONTENT_CATEGORIES.find(cat => cat.slug === slug);
  }

  /**
   * Obtenir les tags d'une catégorie
   */
  static getCategoryTags(categoryId: string): ContentTag[] {
    return CONTENT_TAGS.filter(tag => tag.categoryId === categoryId);
  }

  /**
   * Obtenir les tags trending
   */
  static getTrendingTags(): ContentTag[] {
    return CONTENT_TAGS.filter(tag => tag.trending).sort((a, b) => b.usage - a.usage);
  }

  /**
   * Obtenir les types de projets pour une catégorie
   */
  static getProjectTypesForCategory(categoryId: string): ProjectType[] {
    return PROJECT_TYPES.filter(type => type.categoryIds.includes(categoryId));
  }

  /**
   * Rechercher des catégories
   */
  static searchCategories(query: string): ContentCategory[] {
    const lowercaseQuery = query.toLowerCase();
    return CONTENT_CATEGORIES.filter(cat => 
      cat.name.toLowerCase().includes(lowercaseQuery) ||
      cat.description.toLowerCase().includes(lowercaseQuery) ||
      cat.slug.includes(lowercaseQuery)
    );
  }

  /**
   * Obtenir les statistiques d'une catégorie
   */
  static getCategoryStats(categoryId: string) {
    const category = CONTENT_CATEGORIES.find(cat => cat.id === categoryId);
    if (!category) return null;

    return {
      projectCount: category.projectCount,
      avgInvestment: category.avgInvestment,
      successRate: category.successRate,
      subCategories: this.getSubCategories(categoryId).length,
      tags: this.getCategoryTags(categoryId).length,
      trendingTags: this.getCategoryTags(categoryId).filter(tag => tag.trending).length
    };
  }

  /**
   * Valider qu'un projet correspond aux critères d'une catégorie
   */
  static validateProjectCategory(projectData: any, categoryId: string): {
    isValid: boolean;
    errors: string[];
    suggestions: string[];
  } {
    const category = CONTENT_CATEGORIES.find(cat => cat.id === categoryId);
    const projectTypes = this.getProjectTypesForCategory(categoryId);
    
    const errors: string[] = [];
    const suggestions: string[] = [];

    if (!category) {
      errors.push('Catégorie non trouvée');
      return { isValid: false, errors, suggestions };
    }

    // Validation des investissements
    if (projectTypes.length > 0) {
      const applicableTypes = projectTypes.filter(type => 
        projectData.minInvestment >= type.minInvestment && 
        projectData.maxInvestment <= type.maxInvestment
      );

      if (applicableTypes.length === 0) {
        errors.push('Montants d\'investissement incompatibles avec la catégorie');
        suggestions.push(`Ajustez les montants entre ${Math.min(...projectTypes.map(t => t.minInvestment))}€ et ${Math.max(...projectTypes.map(t => t.maxInvestment))}€`);
      }
    }

    // Validation de la durée
    if (projectData.duration) {
      const avgDurations = projectTypes.map(t => t.avgDuration);
      const isReasonableDuration = avgDurations.some(avg => 
        Math.abs(projectData.duration - avg) / avg < 2 // ±200% de variation acceptable
      );

      if (!isReasonableDuration && avgDurations.length > 0) {
        errors.push('Durée inhabituelle pour cette catégorie');
        suggestions.push(`Durée recommandée: ${Math.round(avgDurations.reduce((a, b) => a + b) / avgDurations.length)} minutes`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      suggestions
    };
  }

  /**
   * Recommander des catégories pour un projet
   */
  static recommendCategories(projectData: any): ContentCategory[] {
    return CONTENT_CATEGORIES
      .map(category => {
        const validation = this.validateProjectCategory(projectData, category.id);
        return {
          category,
          score: validation.isValid ? 1 : Math.max(0, 1 - validation.errors.length * 0.3)
        };
      })
      .filter(item => item.score > 0.5)
      .sort((a, b) => b.score - a.score)
      .map(item => item.category);
  }
}