/**
 * Revenue Engine - VISUAL Platform
 * Encapsule toutes les formules mathématiques et répartitions de revenus
 * Compatible avec Stripe webhooks idempotents
 */

// Vecteurs TOP 10 normalisés (en pourcentages absolus de S)
const INV_TOP10 = [13.66, 6.83, 4.55, 3.41, 2.73, 2.28, 1.95, 1.71, 1.52, 1.37]; // sum ≈ 40
const PORT_TOP10 = [10.24, 5.12, 3.41, 2.56, 2.05, 1.71, 1.46, 1.28, 1.14, 1.02]; // sum ≈ 30

export interface SplitItem {
  accountId: string;
  role: string;
  amountCents: number;
  note: string;
}

/**
 * Arrondi à l'euro inférieur (centimes → centimes)
 * Exemple: 699 → 600, 100 → 100, 999 → 900
 */
export function euroFloor(cents: number): number {
  return cents - (cents % 100);
}

/**
 * Vente d'article (Infoporteurs) - Formule 70/30
 * 
 * @param priceCents - Prix brut en centimes
 * @param porterAccount - ID compte du porteur
 * @param visualAccount - ID compte VISUAL
 * @returns Plan de répartition [porteur, VISUAL]
 * 
 * Règle: 70% porteur (arrondi euro inf.) / 30% VISUAL + restes
 */
export function saleArticleSplit(
  priceCents: number, 
  porterAccount: string, 
  visualAccount: string
): SplitItem[] {
  const porterRaw = Math.round(0.70 * priceCents);
  const porterPay = euroFloor(porterRaw);
  const visualPay = priceCents - porterPay; // ~30% + résiduel d'arrondi
  
  return [
    {
      accountId: porterAccount,
      role: 'porter_sale',
      amountCents: porterPay,
      note: '70% sale (euro_floor)'
    },
    {
      accountId: visualAccount,
      role: 'visual_sale',
      amountCents: visualPay,
      note: '30% + rounding residual'
    }
  ];
}

/**
 * Répartition pondérée pour TOP 10
 * 
 * @param totalCents - Montant total à répartir
 * @param weights - Poids individuels (ex: INV_TOP10)
 * @param weightsSum - Somme des poids (40 ou 30)
 * @param accounts - Liste des comptes TOP 10
 * @param role - Rôle (investor_top10 ou porter_top10)
 * @returns Liste des splits avec arrondi euro inférieur
 */
function weightedSplit(
  totalCents: number,
  weights: number[],
  weightsSum: number,
  accounts: string[],
  role: string
): SplitItem[] {
  const out: SplitItem[] = [];
  
  for (let i = 0; i < Math.min(accounts.length, 10); i++) {
    const weight = weights[i] || 0;
    const share = euroFloor(Math.floor(totalCents * (weight / weightsSum)));
    out.push({
      accountId: accounts[i],
      role,
      amountCents: share,
      note: `rank#${i + 1}`
    });
  }
  
  return out;
}

/**
 * Clôture de catégorie - Formule 40/30/7/23
 * 
 * @param SCents - Pot total en centimes
 * @param investorTop10Accounts - Comptes investisseurs TOP 10
 * @param porterTop10Accounts - Comptes porteurs TOP 10
 * @param investorRanks11_100Accounts - Comptes investisseurs rangs 11-100
 * @param visualAccount - Compte VISUAL
 * @returns Plan de répartition complet
 * 
 * Règles:
 * - 40% Investisseurs TOP 10 (répartition pondérée)
 * - 30% Porteurs TOP 10 (répartition pondérée)
 * - 7% Investisseurs rangs 11-100 (équipartition)
 * - 23% VISUAL + tous les restes d'arrondis
 */
export function categoryClosureSplit(
  SCents: number,
  investorTop10Accounts: string[],
  porterTop10Accounts: string[],
  investorRanks11_100Accounts: string[],
  visualAccount: string
): SplitItem[] {
  const out: SplitItem[] = [];
  
  // Calcul des montants bruts par catégorie
  const invTotal = Math.floor(0.40 * SCents);
  const portTotal = Math.floor(0.30 * SCents);
  const eqTotal = Math.floor(0.07 * SCents);
  
  // TOP 10 Investisseurs (40%)
  out.push(...weightedSplit(invTotal, INV_TOP10, 40.0, investorTop10Accounts, 'investor_top10'));
  
  // TOP 10 Porteurs (30%)
  out.push(...weightedSplit(portTotal, PORT_TOP10, 30.0, porterTop10Accounts, 'porter_top10'));
  
  // Investisseurs 11-100 (7% équipartition)
  const uniqueAccounts = Array.from(new Set(investorRanks11_100Accounts)); // Dédoublonnage
  if (uniqueAccounts.length > 0) {
    // Calculer la part équitable par compte (arrondi à l'euro inférieur)
    const perAccountCents = euroFloor(Math.floor(eqTotal / uniqueAccounts.length));
    
    if (perAccountCents >= 100) {
      // Cas normal: chaque compte reçoit au moins 1€
      for (const acc of uniqueAccounts) {
        out.push({
          accountId: acc,
          role: 'investor_11_100',
          amountCents: perAccountCents,
          note: 'equipartition'
        });
      }
    } else {
      // Cas limite: distribution round-robin de 1€ jusqu'à épuisement
      const eurosToDistribute = Math.floor(eqTotal / 100);
      for (let i = 0; i < uniqueAccounts.length; i++) {
        const amountCents = i < eurosToDistribute ? 100 : 0;
        out.push({
          accountId: uniqueAccounts[i],
          role: 'investor_11_100',
          amountCents,
          note: i < eurosToDistribute ? 'equipartition (1€)' : 'equipartition (0€ - résiduel)'
        });
      }
    }
  }
  
  // VISUAL = résiduel pour garantir somme exacte == SCents
  const usersSum = out.reduce((sum, item) => sum + item.amountCents, 0);
  const visualAmount = SCents - usersSum;
  
  out.push({
    accountId: visualAccount,
    role: 'visual_category',
    amountCents: visualAmount,
    note: '23% base + rounding residuals'
  });
  
  return out;
}

/**
 * Calcul des totaux par rôle pour prévisualisation
 * 
 * @param items - Liste des splits
 * @returns Dictionnaire {role: total_cents}
 */
export function previewTotals(items: SplitItem[]): Record<string, number> {
  const totals: Record<string, number> = {};
  
  for (const item of items) {
    totals[item.role] = (totals[item.role] || 0) + item.amountCents;
  }
  
  totals['ALL'] = Object.values(totals).reduce((sum, val) => sum + val, 0);
  
  return totals;
}

/**
 * Conversion VISUpoints → EUR
 * 
 * @param points - Nombre de VISUpoints
 * @returns Montant en euros (arrondi inférieur)
 * 
 * Règle: 100 VP = 1€, seuil minimum 2500 VP (25€)
 */
export function visuPointsToEuros(points: number): number {
  return Math.floor(points / 100);
}

/**
 * Vérification seuil cashout VISUpoints
 * 
 * @param points - Nombre de VISUpoints
 * @returns true si >= 2500 VP
 */
export function canCashoutVisuPoints(points: number): boolean {
  return points >= 2500;
}

/**
 * Calcul bonus streak quotidien
 * 
 * @param dayNumber - Jour du streak (1-7+)
 * @returns VISUpoints bonus
 * 
 * Barème: J1=10, J2=15, J3=20, J4=25, J5=30, J6=35, J7+=50 VP/jour
 */
export function dailyStreakBonus(dayNumber: number): number {
  const dailyBonuses = [10, 15, 20, 25, 30, 35, 50];
  if (dayNumber <= 0) return 0;
  if (dayNumber <= 7) return dailyBonuses[dayNumber - 1];
  return 50; // J7+ constant à 50 VP/jour
}

/**
 * Calcul bonus streak hebdomadaire (optionnel)
 * 
 * @param weekNumber - Semaine du streak (1-4+)
 * @returns VISUpoints bonus
 * 
 * Barème: S1=30, S2=40, S3=50, S4+=70 VP/semaine
 */
export function weeklyStreakBonus(weekNumber: number): number {
  const weeklyBonuses = [30, 40, 50, 70];
  if (weekNumber <= 0) return 0;
  if (weekNumber <= 3) return weeklyBonuses[weekNumber - 1];
  return 70; // S4+ constant à 70 VP/semaine
}

/**
 * Paramètres configurables du Revenue Engine
 */
export const REVENUE_CONFIG = {
  // Prix autorisés pour porteurs (en EUR)
  ALLOWED_PORTER_PRICES: [2, 3, 4, 5, 10],
  
  // Tranches d'investissement autorisées (en EUR)
  ALLOWED_INVESTMENT_AMOUNTS: [2, 3, 4, 5, 6, 8, 10, 12, 15, 20],
  
  // Prix d'extension runtime (modulable)
  EXTENSION_PRICE_EUR: 25,
  
  // Seuil cashout VISUpoints
  VISUPOINTS_CASHOUT_THRESHOLD: 2500,
  
  // Taux de conversion VISUpoints
  VISUPOINTS_PER_EURO: 100,
  
  // Récompense "Visiteur du Mois"
  VISITOR_OF_MONTH_REWARD: 2500
};
