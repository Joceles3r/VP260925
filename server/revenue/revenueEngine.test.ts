/**
 * Tests unitaires pour Revenue Engine
 * Validation des formules mathématiques et répartitions
 */

import { 
  saleArticleSplit, 
  categoryClosureSplit, 
  euroFloor,
  previewTotals,
  visuPointsToEuros,
  canCashoutVisuPoints,
  dailyStreakBonus,
  weeklyStreakBonus
} from './revenueEngine';

describe('Revenue Engine - Tests Unitaires', () => {
  
  describe('euroFloor - Arrondi à l\'euro inférieur', () => {
    test('699 centimes → 600', () => {
      expect(euroFloor(699)).toBe(600);
    });

    test('100 centimes → 100', () => {
      expect(euroFloor(100)).toBe(100);
    });

    test('999 centimes → 900', () => {
      expect(euroFloor(999)).toBe(900);
    });

    test('0 centimes → 0', () => {
      expect(euroFloor(0)).toBe(0);
    });

    test('50 centimes → 0', () => {
      expect(euroFloor(50)).toBe(0);
    });
  });

  describe('Vente d\'article (70/30)', () => {
    test('Article 2€ - arrondi et résiduel', () => {
      const plan = saleArticleSplit(200, 'porter1', 'visual');
      const totals = previewTotals(plan);
      
      // Vérifications
      expect(totals.ALL).toBe(200); // Somme totale conservée
      expect(totals.porter_sale % 100).toBe(0); // Porteur arrondi à l'euro
      expect(totals.porter_sale).toBe(100); // 70% de 200 = 140 → arrondi à 100
      expect(totals.visual_sale).toBe(100); // 200 - 100 = 100 (résiduel)
    });

    test('Article 9.99€ - vérification arrondi', () => {
      const plan = saleArticleSplit(999, 'porter1', 'visual');
      const totals = previewTotals(plan);
      
      expect(totals.ALL).toBe(999);
      expect(totals.porter_sale % 100).toBe(0); // Euro inférieur
      expect(totals.porter_sale).toBe(600); // 70% de 999 ≈ 699 → 600
      expect(totals.visual_sale).toBe(399); // 999 - 600
    });

    test('Article 19.99€ - cas limite', () => {
      const plan = saleArticleSplit(1999, 'porter1', 'visual');
      const totals = previewTotals(plan);
      
      expect(totals.ALL).toBe(1999);
      expect(totals.porter_sale).toBe(1300); // 70% ≈ 1399 → 1300
      expect(totals.visual_sale).toBe(699); // Résiduel
    });
  });

  describe('Clôture de catégorie (40/30/7/23)', () => {
    test('Pot 10 000€ - répartition complète', () => {
      const S = 1000000; // 10 000 € en centimes
      const invTop10 = Array.from({ length: 10 }, (_, i) => `inv${i + 1}`);
      const portTop10 = Array.from({ length: 10 }, (_, i) => `port${i + 1}`);
      const inv11_100 = Array.from({ length: 90 }, (_, i) => `inv_${i + 11}`);
      
      const plan = categoryClosureSplit(S, invTop10, portTop10, inv11_100, 'visual');
      const totals = previewTotals(plan);
      
      // Vérifications globales
      expect(totals.ALL).toBe(S); // Conservation totale
      
      // Vérification proportions approximatives
      expect(totals.investor_top10).toBeGreaterThanOrEqual(Math.floor(S * 0.39)); // ~40%
      expect(totals.porter_top10).toBeGreaterThanOrEqual(Math.floor(S * 0.29)); // ~30%
      expect(totals.investor_11_100).toBeGreaterThanOrEqual(Math.floor(S * 0.06)); // ~7%
      expect(totals.visual_category).toBeGreaterThanOrEqual(Math.floor(S * 0.23)); // ~23% + restes
    });

    test('Somme préservée même avec arrondis', () => {
      const S = 123456; // Montant arbitraire
      const invTop10 = ['inv1', 'inv2', 'inv3'];
      const portTop10 = ['port1', 'port2'];
      const inv11_100 = ['inv11', 'inv12'];
      
      const plan = categoryClosureSplit(S, invTop10, portTop10, inv11_100, 'visual');
      const total = plan.reduce((sum, item) => sum + item.amountCents, 0);
      
      expect(total).toBe(S); // Somme exacte conservée
    });

    test('Tous les paiements utilisateurs arrondis à l\'euro', () => {
      const S = 500000;
      const invTop10 = Array.from({ length: 10 }, (_, i) => `inv${i + 1}`);
      const portTop10 = Array.from({ length: 10 }, (_, i) => `port${i + 1}`);
      const inv11_100 = Array.from({ length: 50 }, (_, i) => `inv_${i + 11}`);
      
      const plan = categoryClosureSplit(S, invTop10, portTop10, inv11_100, 'visual');
      
      // Vérifier que tous les montants (sauf VISUAL) sont arrondis à l'euro
      plan.forEach(item => {
        if (item.role !== 'visual_category') {
          expect(item.amountCents % 100).toBe(0);
        }
      });
    });
  });

  describe('VISUpoints', () => {
    test('Conversion 100 VP = 1€', () => {
      expect(visuPointsToEuros(100)).toBe(1);
      expect(visuPointsToEuros(1000)).toBe(10);
      expect(visuPointsToEuros(2500)).toBe(25);
    });

    test('Arrondi inférieur', () => {
      expect(visuPointsToEuros(199)).toBe(1);
      expect(visuPointsToEuros(2599)).toBe(25);
    });

    test('Seuil cashout 2500 VP', () => {
      expect(canCashoutVisuPoints(2500)).toBe(true);
      expect(canCashoutVisuPoints(2499)).toBe(false);
      expect(canCashoutVisuPoints(3000)).toBe(true);
    });
  });

  describe('Streaks VISUpoints', () => {
    test('Bonus quotidiens (J1-J7+)', () => {
      expect(dailyStreakBonus(1)).toBe(10);
      expect(dailyStreakBonus(2)).toBe(15);
      expect(dailyStreakBonus(3)).toBe(20);
      expect(dailyStreakBonus(4)).toBe(25);
      expect(dailyStreakBonus(5)).toBe(30);
      expect(dailyStreakBonus(6)).toBe(35);
      expect(dailyStreakBonus(7)).toBe(50);
      expect(dailyStreakBonus(8)).toBe(50); // Constant à 50 après J7
      expect(dailyStreakBonus(100)).toBe(50);
    });

    test('Bonus hebdomadaires (S1-S4+)', () => {
      expect(weeklyStreakBonus(1)).toBe(30);
      expect(weeklyStreakBonus(2)).toBe(40);
      expect(weeklyStreakBonus(3)).toBe(50);
      expect(weeklyStreakBonus(4)).toBe(70);
      expect(weeklyStreakBonus(5)).toBe(70); // Constant à 70 après S4
    });

    test('Streaks invalides', () => {
      expect(dailyStreakBonus(0)).toBe(0);
      expect(dailyStreakBonus(-1)).toBe(0);
      expect(weeklyStreakBonus(0)).toBe(0);
    });
  });

  describe('Cas edge - Vérifications de sécurité', () => {
    test('Montant zéro', () => {
      const plan = saleArticleSplit(0, 'p', 'v');
      expect(previewTotals(plan).ALL).toBe(0);
    });

    test('Pas d\'investisseurs 11-100', () => {
      const plan = categoryClosureSplit(10000, ['i1'], ['p1'], [], 'visual');
      const totals = previewTotals(plan);
      expect(totals.investor_11_100).toBeUndefined(); // Pas de split pour cette catégorie
      expect(totals.ALL).toBe(10000); // Somme conservée
    });

    test('Dédoublonnage investisseurs 11-100', () => {
      const duplicates = ['inv11', 'inv11', 'inv12', 'inv12', 'inv13'];
      const plan = categoryClosureSplit(100000, [], [], duplicates, 'visual');
      
      const inv11_100Items = plan.filter(item => item.role === 'investor_11_100');
      const uniqueAccounts = new Set(inv11_100Items.map(item => item.accountId));
      
      expect(uniqueAccounts.size).toBe(3); // Seulement 3 comptes uniques
    });
  });
});
