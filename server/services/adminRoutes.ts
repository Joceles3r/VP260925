import express from 'express';
import rateLimit from 'express-rate-limit';
import { adminAccessService } from './adminAccessService';
import { storage } from '../storage';
import { auditTrail } from './auditTrail';

// Rate limiting spécifique admin (très restrictif)
const adminRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 3, // Max 3 tentatives par heure
  message: { error: 'Trop de tentatives d\'accès admin. Réessayez dans 1 heure.' },
  standardHeaders: true,
  legacyHeaders: false,
  // Pas de keyGenerator custom pour éviter problème IPv6
});

// Rate limiting pour génération OTP (encore plus restrictif)
const otpGenerationRateLimit = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 heures
  max: 2, // Max 2 OTPs par jour
  message: { error: 'Limite de génération OTP atteinte. Contactez le support.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware de vérification admin
export const requireAdminAccess = async (req: any, res: any, next: any) => {
  try {
    // Vérifier session admin d'abord
    if (req.session && req.session.isAdmin && req.session.userId) {
      const isAdmin = await adminAccessService.isAdmin(req.session.userId);
      if (isAdmin) {
        // Audit trail accès autorisé
        await auditTrail.appendAudit('admin_access_granted', req.session.userId, {
          route: req.path,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
        return next();
      }
    }

    // Fallback: vérifier req.user (Replit auth standard)
    if (req.user && req.user.id) {
      const isAdmin = await adminAccessService.isAdmin(req.user.id);
      if (isAdmin) {
        await auditTrail.appendAudit('admin_access_granted', req.user.id, {
          route: req.path,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
        return next();
      }
    }

    // Accès refusé
    await auditTrail.appendAudit('admin_access_denied', req.user?.id || 'anonymous', {
      route: req.path,
      ip: req.ip,
      reason: 'not_authenticated_or_not_admin'
    });
    return res.status(403).json({ error: 'Accès admin requis' });

  } catch (error) {
    console.error('Erreur middleware admin:', error);
    res.status(500).json({ error: 'Erreur de vérification admin' });
  }
};

/**
 * Routes admin sécurisées
 */
export function setupAdminRoutes(app: express.Application) {

  // ===== GÉNÉRATION OTP BREAK-GLASS (CONSOLE/CLI UNIQUEMENT) =====
  
  /**
   * Générer un OTP temporaire d'accès admin
   * USAGE: Accès via console serveur uniquement
   */
  app.post('/api/admin/break-glass/generate', otpGenerationRateLimit, async (req, res) => {
    try {
      const { adminEmail, secret } = req.body;

      // SÉCURITÉ CRITIQUE: Vérifier secret fort obligatoire
      const serverSecret = process.env.ADMIN_CONSOLE_SECRET;
      if (!serverSecret || serverSecret === 'dev_secret_change_me') {
        console.error('❌ ADMIN_CONSOLE_SECRET manquant ou faible!');
        await auditTrail.appendAudit('admin_otp_generation_denied', 'system', {
          email: adminEmail,
          ip: req.ip,
          reason: 'missing_or_weak_secret'
        });
        return res.status(500).json({ error: 'Configuration sécurité invalide' });
      }

      if (secret !== serverSecret) {
        await auditTrail.appendAudit('admin_otp_generation_denied', 'system', {
          email: adminEmail,
          ip: req.ip,
          reason: 'invalid_server_secret'
        });
        return res.status(403).json({ error: 'Secret serveur requis' });
      }

      if (!adminEmail) {
        return res.status(400).json({ error: 'Email admin requis' });
      }

      const result = await adminAccessService.generateBreakGlassOtp(adminEmail);
      
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.json({
        success: true,
        message: 'OTP généré avec succès (voir console serveur)',
        expiresAt: result.expiresAt
      });

    } catch (error) {
      console.error('Erreur génération OTP:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  // ===== AUTHENTIFICATION ADMIN =====

  /**
   * Authentification admin avec OTP ou 2FA
   */
  app.post('/api/admin/auth', adminRateLimit, async (req, res) => {
    try {
      const { email, otpCode, totpCode, backupCode } = req.body;
      const ipAddress = req.ip;
      const userAgent = req.get('User-Agent');

      const result = await adminAccessService.authenticateAdmin({
        email,
        otpCode,
        totpCode,
        backupCode,
        ipAddress,
        userAgent
      });

      if (!result.success) {
        return res.status(401).json({ error: result.error });
      }

      // Mettre à jour la session avec l'ID admin
      if (req.session && result.userId) {
        req.session.userId = result.userId;
        req.session.isAdmin = true;
      }

      res.json({
        success: true,
        message: 'Accès admin accordé',
        userId: result.userId
      });

    } catch (error) {
      console.error('Erreur auth admin:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  // ===== ROUTES ADMIN PROTÉGÉES =====

  /**
   * Dashboard admin avec statistiques système
   */
  app.get('/api/admin/dashboard', requireAdminAccess, async (req, res) => {
    try {
      // Statistiques générales
      const users = await storage.getAllUsers();
      const projects = await storage.getProjects(1000, 0);
      const investments = await storage.getAllInvestments();
      const transactions = await storage.getAllTransactions();

      // Statistiques admin
      const adminUsers = users.filter(u => u.profileType === 'admin');
      const otpHistory = await adminAccessService.getAccessHistory(10);
      const recentAudits = await auditTrail.getAuditEntries(20, 0);

      const stats = {
        users: {
          total: users.length,
          admins: adminUsers.length,
          creators: users.filter(u => u.profileType === 'creator').length,
          investors: users.filter(u => u.profileType === 'investor').length,
        },
        projects: {
          total: projects.length,
          active: projects.filter(p => p.status === 'active').length,
          completed: projects.filter(p => p.status === 'completed').length,
        },
        financial: {
          totalInvestments: investments.length,
          totalTransactions: transactions.length,
          totalAmount: investments.reduce((sum, inv) => sum + inv.amount, 0),
        },
        security: {
          recentOtpUsage: otpHistory.length,
          recentAudits: recentAudits.length,
        }
      };

      res.json({
        success: true,
        stats,
        recentActivity: {
          otps: otpHistory.slice(0, 5).map(otp => ({
            id: otp.id,
            email: otp.email,
            status: otp.status,
            createdAt: otp.createdAt,
            usedAt: otp.usedAt,
            usedBy: otp.usedBy,
            expiresAt: otp.expiresAt,
            // otpCode exclu pour sécurité (même hashé)
          })),
          audits: recentAudits.slice(0, 10)
        }
      });

    } catch (error) {
      console.error('Erreur dashboard admin:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  /**
   * Gestion des utilisateurs
   */
  app.get('/api/admin/users/management', requireAdminAccess, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      
      res.json({
        success: true,
        users: users.map(user => ({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profileType: user.profileType,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }))
      });

    } catch (error) {
      console.error('Erreur gestion utilisateurs:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  /**
   * Audit trail complet
   */
  app.get('/api/admin/audit', requireAdminAccess, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;
      const actorId = req.query.actorId as string;

      const audits = await auditTrail.getAuditEntries(limit, offset, actorId);

      res.json({
        success: true,
        audits,
        pagination: {
          limit,
          offset,
          hasMore: audits.length === limit
        }
      });

    } catch (error) {
      console.error('Erreur audit trail:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  /**
   * Historique accès admin
   */
  app.get('/api/admin/access-history', requireAdminAccess, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const history = await adminAccessService.getAccessHistory(limit);

      res.json({
        success: true,
        history: history.map(otp => ({
          id: otp.id,
          email: otp.email,
          status: otp.status,
          createdAt: otp.createdAt,
          usedAt: otp.usedAt,
          usedBy: otp.usedBy,
          expiresAt: otp.expiresAt,
          ipAddress: otp.ipAddress,
          userAgent: otp.userAgent,
          // otpCode exclu pour sécurité
        }))
      });

    } catch (error) {
      console.error('Erreur historique accès:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  /**
   * Logout admin
   */
  app.post('/api/admin/logout', requireAdminAccess, async (req: any, res) => {
    try {
      await auditTrail.appendAudit('admin_logout', req.user.id, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      if (req.session) {
        req.session.destroy();
      }

      res.json({ success: true, message: 'Déconnexion admin réussie' });

    } catch (error) {
      console.error('Erreur logout admin:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  console.log('✅ Routes admin sécurisées configurées');
}