/**
 * VISUAL — Shared constants (single source of truth)
 * Use from both client & server via a shared package or symlink.
 * Locale: FR defaults; use dots for decimals in code.
 */

export const VISUAL_CONSTANTS = {
  // General
  currency: "EUR",
  rounding: {
    userPayoutFloorEuro: true,  // floor to whole euros on user payouts
    residualToVisual: true
  },
  extension_price_eur: 25, // repêchage / maintien (configurable)

  // Categories & Rubriques visibility keys (must match DB seeds)
  featureKeys: [
    "films","videos","documentaires","voix_info","live_show","livres","petites_annonces"
  ],

  // Price tiers
  priceTiers: {
    // Porters (video categories)
    videoPorter: [2,3,4,5,10],                 // EUR
    // Authors (Livres)
    livresAuthor: [2,3,4,5,8],                 // EUR
    // Infoporteurs (articles)
    voixInfoCreator: [0.2,0.5,1,2,3,4,5]       // EUR
  },

  investmentTiers: {
    // Standard tiers for videos & livres
    standard: [2,3,4,5,6,8,10,12,15,20],       // EUR
    // Micro-tiers for "Les Voix de l'Info"
    voixInfo: [0.2,0.5,1,2,3,4,5,10]           // EUR
  },

  votesMapping: {
    // Map amount => votes (used by standard categories & livres)
    // 2→1, 3→2, 4→3, 5→4, 6→5, 8→6, 10→7, 12→8, 15→9, 20→10
    "2": 1, "3": 2, "4": 3, "5": 4, "6": 5, "8": 6, "10": 7, "12": 8, "15": 9, "20": 10
  },

  // Splits & rules
  splits: {
    // Event redistribution (video categories)
    videoEvent: {
      investorsTop10: 0.40,
      portersTop10:   0.30,
      investors11_100:0.07,
      visual:         0.23
    },
    // Per-sale splits (articles, livres)
    perSale: {
      creator: 0.70,
      visual:  0.30
    },
    // Livres monthly pot
    livresMonthlyPot: {
      authors: 0.60,
      readers: 0.40
    }
  },

  // Livres monthly schedule (Europe/Paris)
  schedule: {
    livres: {
      openRRULE:  "FREQ=MONTHLY;BYMONTHDAY=1;BYHOUR=0;BYMINUTE=0;BYSECOND=0",
      closeRRULE: "FREQ=MONTHLY;BYMONTHDAY=-1;BYHOUR=23;BYMINUTE=59;BYSECOND=59",
      timezone:   "Europe/Paris"
    }
  },

  // i18n
  i18n: {
    defaultLocale: "fr-FR",
    supportedLocales: ["fr-FR","en-US","es-ES"],
    urlStrategy: "path-prefix", // /fr, /en, /es
    fallbackOrder: ["fr-FR","en-US"]
  },

  // Agents IA configuration
  agents: {
    visualAI: {
      enabled: true,
      maxDecisionsPerMinute: 100,
      validationThresholds: {
        userBlock: true,
        massEmail: 10000,
        highPayment: 500,
        policyChange: true,
        securityIncident: true
      }
    },
    visualFinanceAI: {
      enabled: true,
      maxSinglePayout: 50000, // 500€ en centimes
      auditRetentionDays: 2555, // 7 ans
      extensionPriceEur: 25
    },
    visualScoutAI: {
      enabled: true,
      maxBudgetEur: 1000,
      scoreThreshold: 62
    }
  }
} as const;

export type VisualConstants = typeof VISUAL_CONSTANTS;