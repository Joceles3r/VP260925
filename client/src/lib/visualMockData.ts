// Mock data pour l'interface VISUAL

export interface CategoryToggle {
  visible: boolean;
  message: string;
}

export interface CategoryToggles {
  films: CategoryToggle;
  videos: CategoryToggle;
  documentaires: CategoryToggle;
  voix_info: CategoryToggle;
  live_show: CategoryToggle;
  livres: CategoryToggle;
  petites_annonces: CategoryToggle;
}

export interface VisualProject {
  id: string;
  title: string;
  creator: string;
  category: keyof CategoryToggles;
  thumbnail: string;
  description: string;
  price?: number;
  investmentRanges: number[];
  currentAmount: number;
  targetAmount: number;
  investorCount: number;
  engagementCoeff: number;
  badges: ('trending' | 'top10' | 'new')[];
  videoUrl?: string;
  votesMapping: { [key: number]: number };
}

export interface VisualCategory {
  id: keyof CategoryToggles;
  name: string;
  icon: string;
  description: string;
  investmentRange: string;
  priceRange?: string;
}

// Mock des toggles de catégories (endpoint factice)
export const mockCategoryToggles: CategoryToggles = {
  films: { visible: true, message: "" },
  videos: { visible: true, message: "" },
  documentaires: { visible: true, message: "" },
  voix_info: { visible: true, message: "" },
  live_show: { visible: true, message: "" },
  livres: { visible: false, message: "Catégorie en cours de préparation" },
  petites_annonces: { visible: true, message: "" }
};

// Mapping des votes selon investissement
export const votesMapping = {
  2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 8: 6, 10: 7, 12: 8, 15: 9, 20: 10
};

// Micro-montants pour Voix de l'Info
export const voixInfoMapping = {
  0.2: 1, 0.5: 2, 1: 3, 2: 4, 3: 5, 4: 6, 5: 7
};

// Catégories avec leurs métadonnées
export const visualCategories: VisualCategory[] = [
  {
    id: 'films',
    name: 'Films',
    icon: '🎬',
    description: 'Soutenez les films indépendants et partagez leur succès',
    investmentRange: '2€ - 20€',
    priceRange: '2€ - 10€'
  },
  {
    id: 'videos',
    name: 'Vidéos',
    icon: '🎥',
    description: 'Découvrez des créateurs vidéo uniques',
    investmentRange: '2€ - 20€',
    priceRange: '2€ - 10€'
  },
  {
    id: 'documentaires',
    name: 'Documentaires',
    icon: '📹',
    description: 'Investissez dans des documentaires percutants',
    investmentRange: '2€ - 20€',
    priceRange: '2€ - 10€'
  },
  {
    id: 'voix_info',
    name: 'Les Voix de l\'Info',
    icon: '📰',
    description: 'Articles d\'information à micro-prix',
    investmentRange: '0,20€ - 5€',
    priceRange: '0,20€ - 5€'
  },
  {
    id: 'live_show',
    name: 'Visual Studio Live Show',
    icon: '🎭',
    description: 'Présentations live avec investissements en temps réel',
    investmentRange: '2€ - 20€'
  },
  {
    id: 'livres',
    name: 'Livres',
    icon: '📚',
    description: 'E-books d\'auteurs indépendants',
    investmentRange: '2€ - 20€',
    priceRange: '2€ - 8€'
  },
  {
    id: 'petites_annonces',
    name: 'Petites Annonces',
    icon: '📢',
    description: 'Annonces pro audiovisuelles (hors compétition)',
    investmentRange: 'Options payantes'
  }
];

// Mock des projets
export const mockProjects: VisualProject[] = [
  {
    id: '1',
    title: 'L\'Écho du Silence',
    creator: 'Marie Dubois',
    category: 'films',
    thumbnail: 'https://images.unsplash.com/photo-1489599779717-11ef43651a4d?w=400&h=300&fit=crop',
    description: 'Un thriller psychologique sur les secrets de famille',
    price: 5,
    investmentRanges: [2, 3, 4, 5, 10, 15, 20],
    currentAmount: 12500,
    targetAmount: 25000,
    investorCount: 234,
    engagementCoeff: 8.7,
    badges: ['trending', 'top10'],
    votesMapping
  },
  {
    id: '2',
    title: 'Révolution Digitale',
    creator: 'Tech Studios',
    category: 'documentaires',
    thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop',
    description: 'L\'impact des nouvelles technologies sur notre société',
    price: 4,
    investmentRanges: [2, 3, 4, 5, 10, 15, 20],
    currentAmount: 8750,
    targetAmount: 15000,
    investorCount: 156,
    engagementCoeff: 7.2,
    badges: ['new'],
    votesMapping
  },
  {
    id: '3',
    title: 'Street Art Chronicles',
    creator: 'Urban Vision',
    category: 'videos',
    thumbnail: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=300&fit=crop',
    description: 'Une série documentaire sur l\'art urbain contemporain',
    price: 3,
    investmentRanges: [2, 3, 4, 5, 10, 15, 20],
    currentAmount: 5200,
    targetAmount: 12000,
    investorCount: 89,
    engagementCoeff: 6.8,
    badges: ['trending'],
    votesMapping
  },
  {
    id: '4',
    title: 'L\'Avenir de l\'Énergie',
    creator: 'Éco Journalisme',
    category: 'voix_info',
    thumbnail: 'https://images.unsplash.com/photo-1497436072909-f5e4be375e0d?w=400&h=300&fit=crop',
    description: 'Enquête approfondie sur les énergies renouvelables',
    price: 2,
    investmentRanges: [0.2, 0.5, 1, 2, 3, 4, 5],
    currentAmount: 850,
    targetAmount: 2000,
    investorCount: 125,
    engagementCoeff: 9.1,
    badges: ['top10'],
    votesMapping: voixInfoMapping
  },
  {
    id: '5',
    title: 'Midnight Jazz Sessions',
    creator: 'Jazz Collective',
    category: 'live_show',
    thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
    description: 'Concerts jazz intimistes en direct',
    investmentRanges: [2, 3, 4, 5, 10, 15, 20],
    currentAmount: 3200,
    targetAmount: 8000,
    investorCount: 67,
    engagementCoeff: 7.9,
    badges: ['new'],
    votesMapping
  },
  {
    id: '6',
    title: 'Le Mystère du Phare',
    creator: 'Océane Martin',
    category: 'livres',
    thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
    description: 'Roman mystère sur une île bretonne',
    price: 4,
    investmentRanges: [2, 3, 4, 5, 8, 12, 15, 20],
    currentAmount: 1200,
    targetAmount: 5000,
    investorCount: 28,
    engagementCoeff: 5.4,
    badges: [],
    votesMapping
  }
];

// Mock des stats live
export const mockLiveStats = {
  currentViewers: 1247,
  totalInvestments: 45620,
  activeProjects: 12
};

// Endpoints factices
export const mockEndpoints = {
  getCategoryToggles: () => Promise.resolve(mockCategoryToggles),
  getProjects: (category?: string) => {
    const filtered = category 
      ? mockProjects.filter(p => p.category === category)
      : mockProjects;
    return Promise.resolve(filtered);
  },
  getProject: (id: string) => {
    const project = mockProjects.find(p => p.id === id);
    return Promise.resolve(project);
  },
  getLiveStats: () => Promise.resolve(mockLiveStats),
  investInProject: (projectId: string, amount: number) => {
    console.log(`Mock investment: ${amount}€ in project ${projectId}`);
    return Promise.resolve({ 
      success: true, 
      votes: (votesMapping as any)[amount] || (voixInfoMapping as any)[amount] || 1 
    });
  },
  purchaseContent: (projectId: string) => {
    console.log(`Mock purchase: project ${projectId}`);
    return Promise.resolve({ success: true, accessUrl: `/watch/${projectId}` });
  }
};

// Données pour le disclaimer
export const legalInfo = {
  riskWarning: "Les investissements présentent des risques de perte. Aucun gain n'est garanti.",
  redistribution: "Redistribution selon les règles de chaque catégorie : 23% VISUAL, reste réparti selon performance.",
  rounding: "Montants arrondis à l'euro inférieur pour les utilisateurs, restes versés à VISUAL.",
  voixInfoShare: "Articles : 70% créateur / 30% VISUAL par vente directe.",
  petitesAnnonces: "Petites annonces hors système de redistribution, options payantes séparées."
};