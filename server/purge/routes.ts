// PURGE_ROUTES - API routes for VISUAL purge operations
// Contains all purge endpoints with constant-time authentication

import express, { type Express } from "express";
import { timingSafeEqual } from "crypto";
import { isAuthenticated } from "../replitAuth";
import { storage } from "../storage";
import { 
  purgeRequestSchema, 
  scheduledPurgeSchema,
  type PurgeRequest,
  type PurgeResults 
} from "./schemas";
import {
  purgeProjects,
  purgeLiveShows,
  purgeArticles,
  purgeTechnical,
  purgeFinancial,
  generatePurgeStats
} from "./handlers";

// Rate limiting for scheduled purge (simple in-memory)
const scheduledPurgeRateLimit = {
  lastAttempt: 0,
  attempts: 0,
  windowMs: 60000, // 1 minute window
  maxAttempts: 5
};

// CONSTANT_TIME_AUTH - Secure comparison to prevent timing attacks
function compareAuthKeys(provided: string, expected: string): boolean {
  if (provided.length !== expected.length) {
    return false;
  }
  
  try {
    const providedBuffer = Buffer.from(provided, 'utf8');
    const expectedBuffer = Buffer.from(expected, 'utf8');
    return timingSafeEqual(providedBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

// Rate limiting check for scheduled purge
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  
  // Reset window if expired
  if (now - scheduledPurgeRateLimit.lastAttempt > scheduledPurgeRateLimit.windowMs) {
    scheduledPurgeRateLimit.attempts = 0;
  }
  
  scheduledPurgeRateLimit.lastAttempt = now;
  scheduledPurgeRateLimit.attempts++;
  
  return scheduledPurgeRateLimit.attempts <= scheduledPurgeRateLimit.maxAttempts;
}

export function registerPurgeRoutes(app: Express): void {
  // ROUTE: /api/purge/manual - Manual purge trigger (Admin only with KYC verification)
  app.post('/api/purge/manual', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Critical security check: Admin + KYC verification required
      if (!user || user.profileType !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      if (!user.kycVerified) {
        return res.status(403).json({ message: "KYC verification required for destructive operations" });
      }

      // Validate request body with Zod
      const validationResult = purgeRequestSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid request parameters",
          errors: validationResult.error.issues
        });
      }

      const { types, dryRun, dateFrom, dateTo, limit, offset } = validationResult.data;
      
      // Log the purge attempt for audit trail
      await storage.createAuditLog({
        userId,
        action: 'purge_manual',
        resourceType: 'purge_operation',
        details: {
          types,
          dryRun,
          dateFrom,
          dateTo,
          limit,
          offset,
          triggeredBy: user.email || user.id,
          userAgent: req.headers['user-agent']
        },
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        dryRun,
        success: true
      });
      
      // Enhanced results tracking with date validation
      const now = new Date();
      const fromDate = dateFrom ? new Date(dateFrom) : null;
      const toDate = dateTo ? new Date(dateTo) : null;
      
      // Date validation with robust error handling
      if (fromDate && isNaN(fromDate.getTime())) {
        return res.status(400).json({ message: "Invalid dateFrom format. Use ISO 8601." });
      }
      if (toDate && isNaN(toDate.getTime())) {
        return res.status(400).json({ message: "Invalid dateTo format. Use ISO 8601." });
      }
      if (fromDate && toDate && fromDate > toDate) {
        return res.status(400).json({ message: "dateFrom cannot be after dateTo" });
      }
      if (fromDate && fromDate > now) {
        return res.status(400).json({ message: "dateFrom cannot be in the future" });
      }

      const results: PurgeResults = {
        dryRun,
        dateFilter: { from: fromDate, to: toDate },
        pagination: { limit, offset },
        projects: { processed: 0, purged: 0, errors: [], affectedIds: [] },
        liveShows: { processed: 0, purged: 0, errors: [], affectedIds: [] },
        articles: { processed: 0, purged: 0, errors: [], affectedIds: [] },
        technical: { processed: 0, purged: 0, errors: [], affectedIds: [] },
        financial: { processed: 0, purged: 0, errors: [], affectedIds: [] },
        startedAt: new Date(),
        completedAt: null
      };
      
      const request: PurgeRequest = { types, dryRun, dateFrom, dateTo, limit, offset };
      
      // Execute purge operations based on requested types
      if (types.includes('projects') || types.includes('all')) {
        await purgeProjects(request, userId, results);
      }
      
      if (types.includes('live_shows') || types.includes('all')) {
        await purgeLiveShows(request, userId, results);
      }
      
      if (types.includes('articles') || types.includes('all')) {
        await purgeArticles(request, userId, results);
      }
      
      if (types.includes('technical') || types.includes('all')) {
        await purgeTechnical(request, userId, results);
      }
      
      if (types.includes('financial') || types.includes('all')) {
        await purgeFinancial(request, userId, results);
      }
      
      results.completedAt = new Date();
      
      // Calculate total affected items for audit
      const totalAffected = results.projects.purged + results.liveShows.purged + 
                           results.articles.purged + results.technical.purged + results.financial.purged;
      
      // Comprehensive audit logging
      await storage.createAuditLog({
        userId,
        action: 'purge_manual',
        resourceType: 'purge_operation',
        details: {
          types,
          dryRun,
          dateFilter: { from: fromDate, to: toDate },
          pagination: { limit, offset },
          results: {
            totalProcessed: results.projects.processed + results.liveShows.processed + 
                           results.articles.processed + results.technical.processed + results.financial.processed,
            totalPurged: totalAffected,
            projectsPurged: results.projects.purged,
            liveShowsPurged: results.liveShows.purged,
            articlesPurged: results.articles.purged,
            technicalPurged: results.technical.purged,
            financialPurged: results.financial.purged,
            totalErrors: results.projects.errors.length + results.liveShows.errors.length + 
                        results.articles.errors.length + results.technical.errors.length + results.financial.errors.length
          },
          executionTime: results.completedAt.getTime() - results.startedAt.getTime()
        },
        success: true,
        dryRun
      });
      
      // Enhanced console logging for debugging
      console.log('[PURGE] Manual purge completed:', {
        triggeredBy: userId,
        userEmail: user.email,
        types,
        dryRun,
        totalAffected,
        executionTime: results.completedAt.getTime() - results.startedAt.getTime(),
        results
      });
      
      res.json({
        success: true,
        message: dryRun ? "Dry-run purge simulation completed" : "Purge completed successfully",
        dryRun,
        totalAffected,
        results
      });
    } catch (error) {
      console.error("Error during manual purge:", error);
      res.status(500).json({ message: "Failed to execute purge" });
    }
  });

  // ROUTE: /api/purge/stats - Get purge statistics with proper validation and security
  app.get('/api/purge/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Critical security check: Admin + KYC verification required
      if (!user || user.profileType !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      if (!user.kycVerified) {
        return res.status(403).json({ message: "KYC verification required for purge operations" });
      }

      // Validate query parameters with robust error handling
      const { limit = 100, offset = 0, dateFrom, dateTo } = req.query;
      const parsedLimit = Math.min(parseInt(limit as string) || 100, 1000); // Max 1000
      const parsedOffset = Math.max(parseInt(offset as string) || 0, 0);
      
      // Date validation
      let fromDate: Date | null = null;
      let toDate: Date | null = null;
      
      if (dateFrom) {
        fromDate = new Date(dateFrom as string);
        if (isNaN(fromDate.getTime())) {
          return res.status(400).json({ message: "Invalid dateFrom format. Use ISO 8601." });
        }
      }
      
      if (dateTo) {
        toDate = new Date(dateTo as string);
        if (isNaN(toDate.getTime())) {
          return res.status(400).json({ message: "Invalid dateTo format. Use ISO 8601." });
        }
      }
      
      if (fromDate && toDate && fromDate > toDate) {
        return res.status(400).json({ message: "dateFrom cannot be after dateTo" });
      }

      // Log stats access for audit trail
      await storage.createAuditLog({
        userId,
        action: 'admin_access',
        resourceType: 'purge_stats',
        details: {
          action: 'view_purge_statistics',
          pagination: { limit: parsedLimit, offset: parsedOffset },
          dateFilter: { from: fromDate, to: toDate },
          accessedBy: user.email || user.id
        },
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        success: true
      });
      
      // Generate comprehensive statistics
      const stats = await generatePurgeStats(parsedLimit, parsedOffset, fromDate, toDate);
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching purge stats:", error);
      res.status(500).json({ message: "Failed to fetch purge statistics" });
    }
  });

  // ROUTE: /api/purge/scheduled - Scheduled automatic purge with robust authentication and validation
  app.post('/api/purge/scheduled', async (req, res) => {
    try {
      // Rate limiting check
      const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
      if (!checkRateLimit(clientIp)) {
        console.warn('[SECURITY] Rate limit exceeded for scheduled purge:', {
          ip: clientIp,
          timestamp: new Date().toISOString()
        });
        return res.status(429).json({ message: "Rate limit exceeded" });
      }

      // CONSTANT_TIME_AUTH - Enhanced security with timing attack protection
      const authHeader = req.headers.authorization;
      const expectedKey = process.env.PURGE_CRON_AUTH_KEY || 'default-purge-key';
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.warn('[SECURITY] Invalid auth format for scheduled purge:', {
          ip: clientIp,
          userAgent: req.headers['user-agent'],
          timestamp: new Date().toISOString()
        });
        return res.status(401).json({ message: "Unauthorized purge access" });
      }

      const providedKey = authHeader.substring(7); // Remove 'Bearer ' prefix
      
      if (!compareAuthKeys(providedKey, expectedKey)) {
        // Log unauthorized access attempt
        console.warn('[SECURITY] Unauthorized scheduled purge attempt:', {
          ip: clientIp,
          userAgent: req.headers['user-agent'],
          timestamp: new Date().toISOString(),
          providedKeyLength: providedKey.length,
          expectedKeyLength: expectedKey.length
        });
        return res.status(401).json({ message: "Unauthorized purge access" });
      }
      
      // Validate request body with Zod
      const validationResult = scheduledPurgeSchema.safeParse({
        ...req.body,
        authKey: expectedKey
      });
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid request parameters",
          errors: validationResult.error.issues
        });
      }
      
      const { dryRun } = validationResult.data;
      
      // Create system audit log for scheduled purge
      const systemAuditLog = {
        userId: 'system',
        action: 'purge_scheduled' as const,
        resourceType: 'purge_operation',
        details: {
          triggeredBy: 'scheduled_job',
          dryRun,
          scheduledAt: new Date().toISOString(),
          expectedKey: expectedKey.substring(0, 8) + '***' // Masked for security
        },
        ipAddress: clientIp,
        userAgent: req.headers['user-agent'] || 'scheduled-job',
        success: true,
        dryRun
      };
      
      // Create audit log entry
      await storage.createAuditLog(systemAuditLog);
      
      if (dryRun) {
        // Safe simulation mode - get statistics without changes
        try {
          const stats = await generatePurgeStats(100, 0, null, null);
          
          res.json({
            success: true,
            dryRun: true,
            wouldPurge: stats,
            scheduledAt: new Date(),
            message: "Scheduled dry run completed - no changes made"
          });
        } catch (statsError) {
          console.error('Error fetching stats for scheduled purge:', statsError);
          res.status(500).json({ 
            message: "Failed to fetch purge statistics",
            dryRun: true,
            error: statsError instanceof Error ? statsError.message : 'Unknown error'
          });
        }
      } else {
        // DANGER: Actual purge execution with safety checks
        console.warn('[PURGE] EXECUTING REAL SCHEDULED PURGE - NOT A DRILL');
        
        try {
          // Execute purge with system context using internal API
          const results: PurgeResults = {
            dryRun: false,
            dateFilter: { from: null, to: null },
            pagination: { limit: 100, offset: 0 },
            projects: { processed: 0, purged: 0, errors: [], affectedIds: [] },
            liveShows: { processed: 0, purged: 0, errors: [], affectedIds: [] },
            articles: { processed: 0, purged: 0, errors: [], affectedIds: [] },
            technical: { processed: 0, purged: 0, errors: [], affectedIds: [] },
            financial: { processed: 0, purged: 0, errors: [], affectedIds: [] },
            startedAt: new Date(),
            completedAt: null
          };

          const request: PurgeRequest = {
            types: ['all'],
            dryRun: false,
            limit: 100, // Conservative limit for scheduled operations
            offset: 0
          };

          // Execute all purge operations
          await purgeProjects(request, 'system', results);
          await purgeLiveShows(request, 'system', results);
          await purgeArticles(request, 'system', results);
          await purgeTechnical(request, 'system', results);
          await purgeFinancial(request, 'system', results);

          results.completedAt = new Date();

          const totalAffected = results.projects.purged + results.liveShows.purged + 
                               results.articles.purged + results.technical.purged + results.financial.purged;
          
          // Enhanced logging for scheduled purge
          console.log('[PURGE] Scheduled automatic purge completed:', {
            totalAffected,
            executionTime: results.completedAt.getTime() - results.startedAt.getTime(),
            timestamp: new Date().toISOString()
          });
          
          res.json({
            success: true,
            message: "Scheduled purge completed successfully",
            dryRun: false,
            totalAffected,
            results,
            scheduledExecution: true,
            scheduledAt: new Date()
          });
        } catch (purgeError) {
          console.error('Error executing scheduled purge:', purgeError);
          
          // Log critical failure
          await storage.createAuditLog({
            ...systemAuditLog,
            success: false,
            errorMessage: purgeError instanceof Error ? purgeError.message : 'Unknown error',
            details: {
              ...systemAuditLog.details,
              error: purgeError instanceof Error ? purgeError.message : 'Unknown error'
            }
          });
          
          res.status(500).json({ 
            message: "Failed to execute scheduled purge",
            error: purgeError instanceof Error ? purgeError.message : 'Unknown error',
            scheduledAt: new Date()
          });
        }
      }
    } catch (error) {
      console.error("Critical error during scheduled purge:", error);
      res.status(500).json({ 
        message: "Critical failure in scheduled purge system",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}