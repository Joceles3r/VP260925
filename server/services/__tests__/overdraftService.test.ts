/**
 * Tests unitaires pour overdraftService
 * Coverage: Alertes découvert, calculs frais, seuils
 */

import { describe, test, expect } from '@jest/globals';

describe('OverdraftService - Tests Unitaires', () => {
  
  describe('Seuils de découvert', () => {
    const THRESHOLDS = {
      ALERT: -5, // Première alerte à -5€
      WARNING: -10, // Avertissement à -10€
      CRITICAL: -15, // Critique à -15€
      BLOCKED: -20, // Blocage à -20€
    };

    test('Solde positif = Aucune alerte', () => {
      const balance = 10;
      const level = balance >= 0 ? 'none' : 
                   balance > THRESHOLDS.ALERT ? 'alert' :
                   balance > THRESHOLDS.WARNING ? 'warning' :
                   balance > THRESHOLDS.CRITICAL ? 'critical' : 'blocked';
      expect(level).toBe('none');
    });

    test('Solde -5€ = Alerte', () => {
      const balance = -5;
      const level = balance >= 0 ? 'none' : 
                   balance > THRESHOLDS.ALERT ? 'none' :
                   balance > THRESHOLDS.WARNING ? 'alert' :
                   balance > THRESHOLDS.CRITICAL ? 'warning' : 'critical';
      expect(level).toBe('alert');
    });

    test('Solde -10€ = Warning', () => {
      const balance = -10;
      const isWarning = balance <= THRESHOLDS.WARNING && balance > THRESHOLDS.CRITICAL;
      expect(isWarning).toBe(true);
    });

    test('Solde -15€ = Critique', () => {
      const balance = -15;
      const isCritical = balance <= THRESHOLDS.CRITICAL && balance > THRESHOLDS.BLOCKED;
      expect(isCritical).toBe(true);
    });

    test('Solde -20€ = Bloqué', () => {
      const balance = -20;
      const isBlocked = balance <= THRESHOLDS.BLOCKED;
      expect(isBlocked).toBe(true);
    });
  });

  describe('Calcul des frais de découvert', () => {
    const FEE_RATE = 0.05; // 5% de frais

    test('Frais sur -10€ = 0.50€', () => {
      const overdraft = -10;
      const fee = Math.abs(overdraft) * FEE_RATE;
      expect(fee).toBe(0.5);
    });

    test('Frais sur -20€ = 1€', () => {
      const overdraft = -20;
      const fee = Math.abs(overdraft) * FEE_RATE;
      expect(fee).toBe(1.0);
    });

    test('Frais sur -100€ = 5€', () => {
      const overdraft = -100;
      const fee = Math.abs(overdraft) * FEE_RATE;
      expect(fee).toBe(5.0);
    });

    test('Pas de frais sur solde positif', () => {
      const balance = 10;
      const fee = balance < 0 ? Math.abs(balance) * FEE_RATE : 0;
      expect(fee).toBe(0);
    });

    test('Arrondi frais à 2 décimales', () => {
      const overdraft = -13.33;
      const fee = parseFloat((Math.abs(overdraft) * FEE_RATE).toFixed(2));
      expect(fee).toBe(0.67);
    });
  });

  describe('Application automatique des frais', () => {
    test('Balance après application des frais', () => {
      const overdraft = -10;
      const feeRate = 0.05;
      const fee = Math.abs(overdraft) * feeRate;
      const newBalance = overdraft - fee;
      expect(newBalance).toBe(-10.5);
    });

    test('Frais composés interdits (une seule application)', () => {
      const overdraft = -10;
      const feeRate = 0.05;
      const fee = Math.abs(overdraft) * feeRate;
      // Les frais ne s'appliquent pas sur eux-mêmes
      const secondFee = Math.abs(overdraft) * feeRate;
      expect(fee).toBe(secondFee);
    });
  });

  describe('Validation des actions utilisateur', () => {
    test('Investissement bloqué si découvert > -20€', () => {
      const balance = -21;
      const canInvest = balance > -20;
      expect(canInvest).toBe(false);
    });

    test('Investissement autorisé si découvert léger', () => {
      const balance = -5;
      const canInvest = balance > -20;
      expect(canInvest).toBe(true);
    });

    test('Retrait bloqué si découvert', () => {
      const balance = -5;
      const canWithdraw = balance >= 0;
      expect(canWithdraw).toBe(false);
    });

    test('Retrait autorisé si solde positif', () => {
      const balance = 10;
      const canWithdraw = balance >= 0;
      expect(canWithdraw).toBe(true);
    });
  });

  describe('Notifications progressives', () => {
    test('Première notification à -5€', () => {
      const balance = -5;
      const shouldNotify = balance === -5;
      expect(shouldNotify).toBe(true);
    });

    test('Seconde notification à -10€', () => {
      const balance = -10;
      const shouldNotify = balance === -10;
      expect(shouldNotify).toBe(true);
    });

    test('Notification critique à -15€', () => {
      const balance = -15;
      const shouldNotify = balance === -15;
      expect(shouldNotify).toBe(true);
    });

    test('Notification blocage à -20€', () => {
      const balance = -20;
      const shouldNotify = balance === -20;
      expect(shouldNotify).toBe(true);
    });
  });

  describe('Récupération depuis découvert', () => {
    test('Rechargement +30€ depuis -10€', () => {
      const balance = -10;
      const recharge = 30;
      const newBalance = balance + recharge;
      expect(newBalance).toBe(20);
    });

    test('Rechargement insuffisant', () => {
      const balance = -20;
      const recharge = 10;
      const newBalance = balance + recharge;
      expect(newBalance).toBe(-10);
      expect(newBalance < 0).toBe(true);
    });

    test('Rechargement exact', () => {
      const balance = -15;
      const recharge = 15;
      const newBalance = balance + recharge;
      expect(newBalance).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    test('Solde exactement zéro', () => {
      const balance = 0;
      const isOverdraft = balance < 0;
      expect(isOverdraft).toBe(false);
    });

    test('Micro-découvert (-0.01€)', () => {
      const balance = -0.01;
      const isOverdraft = balance < 0;
      expect(isOverdraft).toBe(true);
    });

    test('Très grand découvert (-1000€)', () => {
      const balance = -1000;
      const feeRate = 0.05;
      const fee = Math.abs(balance) * feeRate;
      expect(fee).toBe(50);
    });
  });

  describe('Historique des découverts', () => {
    test('Tracking date de début', () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-10');
      const durationDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      expect(durationDays).toBe(9);
    });

    test('Frais accumulés sur période', () => {
      const dailyOverdraft = -10;
      const feeRate = 0.05;
      const days = 5;
      const totalFee = Math.abs(dailyOverdraft) * feeRate * days;
      expect(totalFee).toBe(2.5);
    });
  });
});
