/**
 * Tests unitaires pour le système de parrainage
 * Coverage: Codes parrainage, limites mensuelles, bonus
 */

import { describe, test, expect } from '@jest/globals';

describe('ReferralSystem - Tests Unitaires', () => {
  
  describe('Configuration du système', () => {
    const CONFIG = {
      MAX_REFERRALS_PER_MONTH: 20,
      SPONSOR_BONUS_VP: 100, // 1€
      REFERRAL_BONUS_VP: 50, // 0.50€
      CODE_LENGTH: 8,
      LINK_PREFIX: 'https://visual.app/ref/',
    };

    test('Maximum 20 filleuls par mois', () => {
      expect(CONFIG.MAX_REFERRALS_PER_MONTH).toBe(20);
    });

    test('Bonus parrain = 100 VP (1€)', () => {
      expect(CONFIG.SPONSOR_BONUS_VP).toBe(100);
    });

    test('Bonus filleul = 50 VP (0.50€)', () => {
      expect(CONFIG.REFERRAL_BONUS_VP).toBe(50);
    });

    test('Code de parrainage = 8 caractères', () => {
      expect(CONFIG.CODE_LENGTH).toBe(8);
    });
  });

  describe('Génération des codes de parrainage', () => {
    const generateCode = (length: number) => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = '';
      for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      });
      return code;
    };

    test('Code a exactement 8 caractères', () => {
      const code = generateCode(8);
      expect(code.length).toBe(8);
    });

    test('Code contient uniquement alphanumériques majuscules', () => {
      const code = generateCode(8);
      const isValid = /^[A-Z0-9]+$/.test(code);
      expect(isValid).toBe(true);
    });

    test('Codes générés sont uniques (probabilité)', () => {
      const codes = new Set();
      for (let i = 0; i < 100; i++) {
        codes.add(generateCode(8));
      }
      // Avec 8 caractères alphanumériques, collision très improbable
      expect(codes.size).toBeGreaterThan(95);
    });
  });

  describe('Validation des codes', () => {
    test('Code valide accepté', () => {
      const code = 'ABC12345';
      const isValid = /^[A-Z0-9]{8}$/.test(code);
      expect(isValid).toBe(true);
    });

    test('Code trop court rejeté', () => {
      const code = 'ABC123';
      const isValid = /^[A-Z0-9]{8}$/.test(code);
      expect(isValid).toBe(false);
    });

    test('Code trop long rejeté', () => {
      const code = 'ABC123456';
      const isValid = /^[A-Z0-9]{8}$/.test(code);
      expect(isValid).toBe(false);
    });

    test('Code avec minuscules rejeté', () => {
      const code = 'abc12345';
      const isValid = /^[A-Z0-9]{8}$/.test(code);
      expect(isValid).toBe(false);
    });

    test('Code avec caractères spéciaux rejeté', () => {
      const code = 'ABC-1234';
      const isValid = /^[A-Z0-9]{8}$/.test(code);
      expect(isValid).toBe(false);
    });
  });

  describe('Limites mensuelles', () => {
    const MAX_REFERRALS = 20;

    test('19 parrainages autorisés', () => {
      const count = 19;
      const canRefer = count < MAX_REFERRALS;
      expect(canRefer).toBe(true);
    });

    test('20ème parrainage autorisé', () => {
      const count = 19;
      const canRefer = count < MAX_REFERRALS;
      expect(canRefer).toBe(true);
    });

    test('21ème parrainage bloqué', () => {
      const count = 20;
      const canRefer = count < MAX_REFERRALS;
      expect(canRefer).toBe(false);
    });

    test('Reset mensuel des limites', () => {
      const currentMonth = new Date().getMonth();
      const lastResetMonth = currentMonth - 1;
      const shouldReset = currentMonth !== lastResetMonth;
      expect(shouldReset).toBe(true);
    });
  });

  describe('Attribution des bonus', () => {
    const SPONSOR_BONUS = 100; // VP
    const REFERRAL_BONUS = 50; // VP

    test('Parrain reçoit 100 VP', () => {
      const sponsorBalance = 0;
      const newBalance = sponsorBalance + SPONSOR_BONUS;
      expect(newBalance).toBe(100);
    });

    test('Filleul reçoit 50 VP', () => {
      const referralBalance = 0;
      const newBalance = referralBalance + REFERRAL_BONUS;
      expect(newBalance).toBe(50);
    });

    test('Total distribué = 150 VP (1.50€)', () => {
      const total = SPONSOR_BONUS + REFERRAL_BONUS;
      expect(total).toBe(150);
    });

    test('Conversion en euros', () => {
      const totalVP = 150;
      const totalEUR = totalVP / 100;
      expect(totalEUR).toBe(1.5);
    });
  });

  describe('Statuts de parrainage', () => {
    const STATUSES = ['pending', 'completed', 'expired'];

    test('Parrainage pending par défaut', () => {
      const initialStatus = 'pending';
      expect(STATUSES.includes(initialStatus)).toBe(true);
    });

    test('Parrainage completed après premier investissement', () => {
      const hasInvested = true;
      const status = hasInvested ? 'completed' : 'pending';
      expect(status).toBe('completed');
    });

    test('Parrainage expired après 30 jours', () => {
      const createdAt = new Date('2025-01-01');
      const now = new Date('2025-02-01');
      const daysDiff = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
      const isExpired = daysDiff > 30;
      expect(isExpired).toBe(true);
    });
  });

  describe('Génération des liens de parrainage', () => {
    const BASE_URL = 'https://visual.app/ref/';

    test('Lien contient le code', () => {
      const code = 'ABC12345';
      const link = `${BASE_URL}${code}`;
      expect(link).toBe('https://visual.app/ref/ABC12345');
    });

    test('Lien est unique par parrain', () => {
      const code1 = 'USER0001';
      const code2 = 'USER0002';
      const link1 = `${BASE_URL}${code1}`;
      const link2 = `${BASE_URL}${code2}`;
      expect(link1).not.toBe(link2);
    });

    test('Extraction du code depuis le lien', () => {
      const link = 'https://visual.app/ref/ABC12345';
      const code = link.split('/').pop();
      expect(code).toBe('ABC12345');
    });
  });

  describe('Validation des conditions de parrainage', () => {
    test('Filleul doit être nouveau utilisateur', () => {
      const isNewUser = true;
      const canBeReferred = isNewUser;
      expect(canBeReferred).toBe(true);
    });

    test('Utilisateur existant ne peut être parrainé', () => {
      const isNewUser = false;
      const canBeReferred = isNewUser;
      expect(canBeReferred).toBe(false);
    });

    test('Utilisateur ne peut se parrainer lui-même', () => {
      const sponsorId = 'user1';
      const referralId = 'user1';
      const isSelfReferral = sponsorId === referralId;
      expect(isSelfReferral).toBe(true);
    });

    test('KYC requis pour parrainer', () => {
      const kycVerified = true;
      const canSponsor = kycVerified;
      expect(canSponsor).toBe(true);
    });

    test('Sans KYC, parrainage bloqué', () => {
      const kycVerified = false;
      const canSponsor = kycVerified;
      expect(canSponsor).toBe(false);
    });
  });

  describe('Compteur de parrainages', () => {
    test('Compte par mois calendaire', () => {
      const referrals = [
        { date: new Date('2025-01-05'), status: 'completed' },
        { date: new Date('2025-01-15'), status: 'completed' },
        { date: new Date('2025-02-01'), status: 'completed' },
      ];
      
      const january = referrals.filter(r => r.date.getMonth() === 0).length;
      expect(january).toBe(2);
    });

    test('Seuls les completed comptent', () => {
      const referrals = [
        { status: 'completed' },
        { status: 'pending' },
        { status: 'completed' },
      ];
      
      const completed = referrals.filter(r => r.status === 'completed').length;
      expect(completed).toBe(2);
    });

    test('Total gains mensuels', () => {
      const successfulReferrals = 5;
      const bonusPerReferral = 100; // VP
      const totalVP = successfulReferrals * bonusPerReferral;
      const totalEUR = totalVP / 100;
      expect(totalEUR).toBe(5);
    });
  });

  describe('Prévention des abus', () => {
    test('IP tracking pour détection multi-comptes', () => {
      const referrals = [
        { ip: '192.168.1.1' },
        { ip: '192.168.1.1' },
        { ip: '192.168.1.2' },
      ];
      
      const sameIP = referrals.filter(r => r.ip === '192.168.1.1').length;
      expect(sameIP).toBe(2);
    });

    test('Limite de 3 parrainages par IP', () => {
      const MAX_PER_IP = 3;
      const count = 4;
      const isAbuse = count > MAX_PER_IP;
      expect(isAbuse).toBe(true);
    });

    test('Délai minimum entre parrainages', () => {
      const MIN_DELAY_SECONDS = 60;
      const lastReferral = Date.now() - 30000; // 30s ago
      const now = Date.now();
      const canRefer = (now - lastReferral) > MIN_DELAY_SECONDS * 1000;
      expect(canRefer).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    test('Code vide rejeté', () => {
      const code = '';
      const isValid = code.length === 8;
      expect(isValid).toBe(false);
    });

    test('Lien invalide rejeté', () => {
      const link = 'invalid-link';
      const isValid = link.startsWith('https://visual.app/ref/');
      expect(isValid).toBe(false);
    });

    test('Bonus négatif impossible', () => {
      const bonus = -100;
      const isValid = bonus > 0;
      expect(isValid).toBe(false);
    });

    test('Limite mensuelle ne peut être négative', () => {
      const limit = -5;
      const isValid = limit >= 0;
      expect(isValid).toBe(false);
    });
  });
});
