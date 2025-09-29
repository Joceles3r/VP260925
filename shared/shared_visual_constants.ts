// VISUAL — Shared constants (single source of truth)
export const VISUAL_CONSTANTS = {
  currency: "EUR",
  rounding: {
    userPayoutFloorEuro: true,   // arrondi à l'euro inférieur pour paiements utilisateurs
    residualToVisual: true
  },
  extension_price_eur: 25,       // maintien/repêchage (modifiable runtime)

  featureKeys: ["films","videos","documentaires","voix_info","live_show","livres","petites_annonces"],

  priceTiers: {
    videoPorter: [2,3,4,5,10],        // EUR (max 10)
    livresAuthor: [2,3,4,5,8],        // EUR (max 8)
    voixInfoCreator: [0.2,0.5,1,2,3,4,5]  // EUR
  },

  investmentTiers: {
    standard: [2,3,4,5,6,8,10,12,15,20],
    voixInfo: [0.2,0.5,1,2,3,4,5,10]
  },

  votesMapping: { "2":1,"3":2,"4":3,"5":4,"6":5,"8":6,"10":7,"12":8,"15":9,"20":10 },

  splits: {
    videoEvent: { investorsTop10:0.40, portersTop10:0.30, investors11_100:0.07, visual:0.23 },
    perSale:    { creator:0.70, visual:0.30 },
    livresMonthlyPot: { authors:0.60, readers:0.40 }
  },

  schedule: {
    livres: {
      openRRULE:  "FREQ=MONTHLY;BYMONTHDAY=1;BYHOUR=0;BYMINUTE=0;BYSECOND=0",
      closeRRULE: "FREQ=MONTHLY;BYMONTHDAY=-1;BYHOUR=23;BYMINUTE=59;BYSECOND=59",
      timezone:   "Europe/Paris"
    }
  },

  i18n: {
    defaultLocale: "fr-FR",
    supportedLocales: ["fr-FR","en-US","es-ES"],
    urlStrategy: "path-prefix",
    fallbackOrder: ["fr-FR","en-US"]
  }
} as const;

export type VisualConstants = typeof VISUAL_CONSTANTS;