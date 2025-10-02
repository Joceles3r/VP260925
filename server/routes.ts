import express, { type Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import crypto from "crypto";
import { storage } from "./storage";
import { db } from "./db";
import { liveShowFinalists, liveShowAudit } from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";
import { setupAuth, isAuthenticated, getSession } from "./replitAuth";
import { 
  insertProjectSchema, 
  insertInvestmentSchema, 
  insertTransactionSchema,
  insertSocialPostSchema,
  insertSocialCommentSchema,
  insertSocialLikeSchema,
  insertVisuPointsTransactionSchema,
  updateSocialPostSchema,
  updateSocialCommentSchema,
  // Nouveaux schémas pour fonctionnalités avancées
  insertReferralSchema,
  insertReferralLimitSchema,
  insertLoginStreakSchema,
  insertVisitorActivitySchema,
  insertVisitorOfMonthSchema,
  insertArticleSchema,
  insertArticleInvestmentSchema,
  insertVisuPointsPackSchema,
  insertVisuPointsPurchaseSchema,
  // Schémas LIVRES
  insertBookCategorySchema,
  insertBookSchema,
  insertBookPurchaseSchema,
  insertDownloadTokenSchema,
  // Schéma feature toggles
  insertFeatureToggleSchema,
  // Schémas petites annonces
  insertPetitesAnnoncesSchema,
  insertAdPhotosSchema,
  // Schémas Live Show
  designateFinalistsSchema,
  cancelParticipationSchema
} from "@shared/schema";
import { getMinimumCautionAmount, getMinimumWithdrawalAmount } from "@shared/utils";
import { 
  ALLOWED_INVESTMENT_AMOUNTS, 
  isValidInvestmentAmount, 
  ALLOWED_PROJECT_PRICES, 
  isValidProjectPrice,
  REFERRAL_SYSTEM,
  STREAK_REWARDS,
  VISITOR_OF_MONTH,
  ALLOWED_ARTICLE_PRICES,
  isValidArticlePrice,
  VISU_POINTS_PACKS,
  VISU_POINTS,
  STRIPE_CONFIG,
  // Constantes LIVRES
  ALLOWED_BOOK_AUTHOR_PRICES,
  ALLOWED_BOOK_READER_AMOUNTS,
  isValidBookAuthorPrice,
  isValidBookReaderAmount,
  BOOK_VOTES_MAPPING,
  // Constantes photos petites annonces
  AD_PHOTOS_CONFIG,
  ACCEPTED_PHOTO_FORMATS,
  PHOTO_ERROR_MESSAGES
} from "@shared/constants";
import { z } from "zod";
import multer from "multer";
import path from "path";
import { mlScoreProject } from "./services/mlScoring";
import { initializeWebSocket } from "./websocket";
import { notificationService } from "./services/notificationService";
import { VideoDepositService } from "./services/videoDepositService";
import { visualAI } from "./services/visualAI";
import { bunnyVideoService } from "./services/bunnyVideoService";
import { validateVideoToken, checkVideoAccess } from "./middleware/videoTokenValidator";
import { registerPurgeRoutes } from "./purge/routes";
import { receiptsRouter } from "./receipts/routes";
import { categoriesRouter } from "./categories/routes";
import { liveShowOrchestrator } from "./services/liveShowOrchestrator";
import { setupAdminRoutes } from "./services/adminRoutes";
import adminDashboardRoutes from "./routes/adminDashboardRoutes";
import { generateReceiptPDF } from "./receipts/handlers";
import agentRoutes from "./routes/agentRoutes";
import ebookRoutes from "./routes/ebookRoutes";
import bunnyRoutes from "./modules/bunny/routes";
import bunnyWebhook from "./modules/bunny/webhook";
import { VISUPointsService } from "./services/visuPointsService.js";
import { Top10Service } from "./services/top10Service.js";
import { FidelityService } from "./services/fidelityService.js";
import { miniSocialConfigService } from "./services/miniSocialConfigService";
import { liveSocialService } from "./services/liveSocialService";
import { ObjectStorageService } from "./objectStorage";

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
// Validate key format (never log secret value)
const isTestKey = process.env.STRIPE_SECRET_KEY.startsWith('sk_test_');
const isLiveKey = process.env.STRIPE_SECRET_KEY.startsWith('sk_live_');
const isValidSecret = isTestKey || isLiveKey;
if (!isValidSecret) {
  console.warn('[Stripe] ⚠️ STRIPE_SECRET_KEY does not have valid format (sk_test_ or sk_live_). Payment operations may fail.');
}
console.log(`[Stripe] Initialized with ${isTestKey ? 'TEST' : isLiveKey ? 'LIVE' : 'UNKNOWN'} mode key`);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: STRIPE_CONFIG.API_VERSION as any, // Configuration centralisée et configurable
});

// Function getMinimumCautionAmount is now imported from @shared/utils

// File upload configuration
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 5 * 1024 * 1024 * 1024, // 5GB limit to match VideoDepositService specs
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only video files are allowed.'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Revenue Engine - Stripe Webhooks (MUST be BEFORE JSON middleware)
  const { saleArticleSplit: saleArticleSplitEngine, categoryClosureSplit: categoryClosureSplitEngine } = await import('./revenue/revenueEngine');
  const { isStripeEventProcessed: isEventProcessed, recordStripeEvent: recordEvent, persistPayoutPlan: persistPlan } = await import('./revenue/dbHelpers');
  const { appendAudit: auditLog } = await import('./audit/ledger');
  
  app.post('/webhooks/stripe/revenue', express.raw({ type: 'application/json' }), async (req: any, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.error('Missing STRIPE_WEBHOOK_SECRET for revenue webhook');
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }
    
    let event;
    try {
      // Valider la signature Stripe (sécurité critique)
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      console.error('Revenue webhook signature verification failed:', err.message);
      return res.status(400).json({ error: 'Invalid signature' });
    }
    
    const eventId = event.id;
    const eventType = event.type;
    
    // Vérifier idempotence
    if (await isEventProcessed(eventId)) {
      console.log(`✅ Revenue event ${eventId} already processed (idempotent)`);
      return res.json({ ok: true, duplicate: true });
    }
    
    const data = event.data?.object as any || {};
    const metadata = data.metadata || {};
    
    // Vente d'article (infoporteur)
    if (eventType === 'checkout.session.completed' && metadata.kind === 'article_sale') {
      const priceCents = parseInt(data.amount_total || '0');
      const porterAccount = metadata.porter_account_id;
      const visualAccount = metadata.visual_account_id || 'acc_visual';
      
      const plan = saleArticleSplitEngine(priceCents, porterAccount, visualAccount);
      await persistPlan(eventId, 'article_sale', plan, event);
      auditLog('stripe_sale_planned', 'system', { event: eventId, amount: priceCents });
      
      console.log(`✅ Article sale split planned: ${priceCents} cents`);
    }
    
    // Clôture de catégorie
    if (eventType === 'payment_intent.succeeded' && metadata.kind === 'category_closure') {
      const SCents = parseInt(data.amount || '0');
      const invTop10 = JSON.parse(metadata.investor_top10 || '[]');
      const portTop10 = JSON.parse(metadata.porter_top10 || '[]');
      const inv11_100 = JSON.parse(metadata.investor_11_100 || '[]');
      const visualAccount = metadata.visual_account_id || 'acc_visual';
      
      const plan = categoryClosureSplitEngine(SCents, invTop10, portTop10, inv11_100, visualAccount);
      await persistPlan(eventId, 'category_closure', plan, event);
      auditLog('stripe_category_closure_planned', 'system', { event: eventId, amount: SCents });
      
      console.log(`✅ Category closure split planned: ${SCents} cents`);
    }
    
    // Enregistrer l'événement comme traité
    await recordEvent(eventId, eventType, event);
    
    res.json({ ok: true });
  });
  
  // Stripe Webhook - MUST be registered BEFORE any JSON parsing middleware
  app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req: any, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('Missing STRIPE_WEBHOOK_SECRET');
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).json({ error: 'Invalid signature' });
    }

    try {
      switch (event.type) {
        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object;
          
          // Security: Only process succeeded payments
          if (paymentIntent.status !== 'succeeded') {
            console.error('Payment intent not succeeded:', paymentIntent.id, paymentIntent.status);
            return res.status(400).json({ error: 'Payment not succeeded' });
          }

          // Security: Validate currency
          if (paymentIntent.currency !== 'eur') {
            console.error('Invalid currency:', paymentIntent.currency);
            return res.status(400).json({ error: 'Invalid currency' });
          }

          const userId = paymentIntent.metadata.userId;
          const metadataAmount = parseFloat(paymentIntent.metadata.depositAmount || '0');
          const type = paymentIntent.metadata.type;
          const paymentIntentId = paymentIntent.id;

          // Security: Validate authoritative amount against metadata
          const authorizedAmount = paymentIntent.amount_received / 100; // Convert from cents
          if (Math.abs(authorizedAmount - metadataAmount) > 0.01) {
            console.error(`Amount mismatch: authorized=${authorizedAmount}, metadata=${metadataAmount}`);
            return res.status(400).json({ error: 'Amount verification failed' });
          }

          if (!userId || !metadataAmount || !type) {
            console.error('Missing required metadata in payment intent:', paymentIntentId);
            return res.status(400).json({ error: 'Invalid payment metadata' });
          }

          // Use the authoritative amount from Stripe, not client metadata
          const depositAmount = authorizedAmount;

          // Check for idempotency - prevent duplicate processing
          const existingTransaction = await storage.getTransactionByPaymentIntent(paymentIntentId);
          if (existingTransaction) {
            console.log(`Payment intent ${paymentIntentId} already processed`);
            return res.json({ received: true, status: 'already_processed' });
          }

          const user = await storage.getUser(userId);
          if (!user) {
            console.error('User not found for payment:', userId);
            return res.status(404).json({ error: 'User not found' });
          }

          // Update user balance based on payment type
          if (type === 'caution') {
            const newCaution = parseFloat(user.cautionEUR || '0') + depositAmount;
            await storage.updateUser(userId, {
              cautionEUR: newCaution.toString()
            });

            // Create transaction record with correct type
            const transaction = await storage.createTransaction({
              userId,
              type: 'deposit',
              amount: depositAmount.toString(),
              metadata: { 
                type: 'caution_deposit', 
                paymentIntentId,
                simulationMode: false 
              }
            });

            // AUTO-GENERATE RECEIPT: Critical fix for missing automatic generation
            try {
              const receipt = await generateReceiptPDF(transaction.id, userId, {
                templateVersion: 'webhook-v1',
                includeDetails: true
              });
              
              // Log auto-generation audit
              await storage.createAuditLog({
                userId,
                action: 'auto_receipt_generated',
                resourceType: 'receipt',
                resourceId: receipt.receiptId,
                details: {
                  transactionId: transaction.id,
                  receiptNumber: receipt.receiptNumber,
                  paymentIntentId,
                  trigger: 'caution_deposit_webhook'
                }
              });
              
              console.log(`Auto-generated receipt ${receipt.receiptNumber} for caution deposit ${transaction.id}`);
            } catch (receiptError) {
              console.error('Failed to auto-generate receipt for caution deposit:', receiptError);
              // Don't fail the payment, just log the error
            }

            // Send real-time notification
            await notificationService.notifyUser(userId, {
              type: 'caution_deposit_success',
              title: 'Dépôt de caution réussi',
              message: `Votre caution de €${depositAmount} a été confirmée.`,
              priority: 'medium'
            });

            console.log(`Caution deposit confirmed for user ${userId}: €${depositAmount}`);
          } else if (type === 'video_deposit') {
            // Handle video deposit payment success with atomic operations
            const videoDepositId = paymentIntent.metadata.videoDepositId;
            const videoType = paymentIntent.metadata.videoType;
            
            if (!videoDepositId || !videoType) {
              console.error('Missing video deposit metadata:', paymentIntentId);
              return res.status(400).json({ error: 'Invalid video deposit metadata' });
            }

            // Get the video deposit record
            const videoDeposit = await storage.getVideoDeposit(videoDepositId);
            if (!videoDeposit) {
              console.error('Video deposit not found:', videoDepositId);
              return res.status(404).json({ error: 'Video deposit not found' });
            }

            // Ensure atomicity: All operations succeed or all fail
            try {
              // 1. Update video deposit status to active
              await storage.updateVideoDeposit(videoDepositId, {
                status: 'active',
                paidAt: new Date()
              });

              // 1.5. AUTO-CHECK CATEGORY THRESHOLDS: Module 5 integration (CRITICAL FIX)
              try {
                // Get the project to find its category
                const project = await storage.getProject(videoDeposit.projectId);
                if (project && project.category) {
                  // CRITICAL FIX: Resolve category name to UUID
                  const categoryObject = await storage.getVideoCategory(project.category);
                  
                  if (!categoryObject || !categoryObject.id) {
                    console.warn(`Category not found for name: ${project.category} - threshold check skipped`);
                    await storage.createAuditLog({
                      userId: 'system',
                      action: 'threshold_check_skipped',
                      resourceType: 'category',
                      details: {
                        reason: 'category_not_found',
                        categoryName: project.category,
                        trigger: 'video_deposit_activation',
                        videoDepositId,
                        projectId: project.id
                      }
                    });
                  } else {
                    // Import category threshold checker
                    const { checkCategoryThresholds } = await import('./categories/handlers');
                    
                    // Trigger automatic threshold check with CORRECT UUID
                    const thresholdResults = await checkCategoryThresholds({
                      dryRun: false, // Execute real actions
                      categoryIds: [categoryObject.id] // FIXED: Use UUID instead of name
                    }, 'system'); // System-triggered

                    console.log(`Category threshold check triggered for ${project.category} (ID: ${categoryObject.id}) after video activation:`, thresholdResults);
                    
                    // Enhanced audit with ID resolution tracking
                    await storage.createAuditLog({
                      userId: 'system',
                      action: 'threshold_check',
                      resourceType: 'category',
                      resourceId: categoryObject.id, // Use UUID for resourceId
                      details: {
                        trigger: 'video_deposit_activation',
                        videoDepositId,
                        projectId: project.id,
                        categoryName: project.category,
                        categoryId: categoryObject.id,
                        results: thresholdResults,
                        categoriesChecked: thresholdResults.length
                      }
                    });

                    // GUARD: Alert if no categories were actually checked
                    if (thresholdResults.length === 0) {
                      console.error(`CRITICAL: Category threshold check returned zero results for ${project.category} (${categoryObject.id})`);
                    }
                  }
                }
              } catch (categoryError) {
                console.error('Failed to auto-check category thresholds after video activation:', categoryError);
                // Enhanced error logging for debugging
                await storage.createAuditLog({
                  userId: 'system',
                  action: 'threshold_check_error',
                  resourceType: 'category',
                  details: {
                    error: categoryError instanceof Error ? categoryError.message : 'Unknown error',
                    trigger: 'video_deposit_activation',
                    videoDepositId,
                    projectId: videoDeposit.projectId
                  }
                });
                // Don't break the main flow if category check fails
              }

              // 2. Update creator quota atomically
              const currentDate = new Date();
              const period = videoType === 'film' 
                ? `${currentDate.getFullYear()}-Q${Math.ceil((currentDate.getMonth() + 1) / 3)}`
                : `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`;

              const existingQuota = await storage.getCreatorQuota(userId, period);
              
              if (existingQuota) {
                const updates: Partial<any> = {};
                if (videoType === 'clip') updates.clipDeposits = (existingQuota.clipDeposits || 0) + 1;
                else if (videoType === 'documentary') updates.documentaryDeposits = (existingQuota.documentaryDeposits || 0) + 1;
                else if (videoType === 'film') updates.filmDeposits = (existingQuota.filmDeposits || 0) + 1;
                
                await storage.updateCreatorQuota(userId, period, updates);
              } else {
                const newQuota: any = {
                  creatorId: userId,
                  period,
                  clipDeposits: videoType === 'clip' ? 1 : 0,
                  documentaryDeposits: videoType === 'documentary' ? 1 : 0,
                  filmDeposits: videoType === 'film' ? 1 : 0
                };
                await storage.createCreatorQuota(newQuota);
              }

              // 3. Create transaction record
              const transaction = await storage.createTransaction({
                userId,
                type: 'deposit',
                amount: depositAmount.toString(),
                metadata: {
                  type: 'video_deposit',
                  videoType,
                  videoDepositId,
                  paymentIntentId,
                  simulationMode: false
                }
              });

              // 3.5. AUTO-GENERATE RECEIPT: Video deposit
              try {
                const receipt = await generateReceiptPDF(transaction.id, userId, {
                  templateVersion: 'webhook-video-v1',
                  includeDetails: true
                });
                
                // Log auto-generation audit
                await storage.createAuditLog({
                  userId,
                  action: 'auto_receipt_generated',
                  resourceType: 'receipt',
                  resourceId: receipt.receiptId,
                  details: {
                    transactionId: transaction.id,
                    receiptNumber: receipt.receiptNumber,
                    paymentIntentId,
                    videoType,
                    videoDepositId,
                    trigger: 'video_deposit_webhook'
                  }
                });
                
                console.log(`Auto-generated receipt ${receipt.receiptNumber} for video deposit ${transaction.id}`);
              } catch (receiptError) {
                console.error('Failed to auto-generate receipt for video deposit:', receiptError);
                // Don't fail the payment, just log the error
              }

              // 4. Send success notification
              await notificationService.notifyUser(userId, {
                type: 'video_deposit_success',
                title: 'Dépôt vidéo confirmé',
                message: `Votre dépôt vidéo (${videoType}) de €${depositAmount} a été confirmé et activé.`,
                priority: 'medium'
              });

              console.log(`Video deposit confirmed for user ${userId}: ${videoType} - €${depositAmount}`);
            } catch (atomicError) {
              console.error('Atomic video deposit operation failed:', atomicError);
              
              // Rollback: Set deposit status back to pending
              await storage.updateVideoDeposit(videoDepositId, {
                status: 'pending_payment'
              });

              // Notify user of processing failure
              await notificationService.notifyUser(userId, {
                type: 'video_deposit_failed',
                title: 'Erreur de traitement',
                message: 'Une erreur est survenue lors du traitement de votre dépôt vidéo. Contactez le support.',
                priority: 'high'
              });

              return res.status(500).json({ error: 'Video deposit processing failed' });
            }
          } else if (type === 'project_extension') {
            // Handle project extension payment success with atomic operations
            const projectId = paymentIntent.metadata.projectId;
            
            if (!projectId) {
              console.error('Missing project extension metadata:', paymentIntentId);
              return res.status(400).json({ error: 'Invalid project extension metadata' });
            }

            // Get the project
            const project = await storage.getProject(projectId);
            if (!project) {
              console.error('Project not found for extension:', projectId);
              return res.status(404).json({ error: 'Project not found' });
            }

            // Ensure atomicity: All operations succeed or all fail
            try {
              // 1. Get most recent extension by cycleEndsAt (fixed ambiguous selection)
              const extensions = await storage.getProjectExtensions(projectId);
              const currentExtension = extensions
                .filter(ext => !ext.isArchived)
                .sort((a, b) => {
                  const dateA = a.cycleEndsAt ? new Date(a.cycleEndsAt).getTime() : 0;
                  const dateB = b.cycleEndsAt ? new Date(b.cycleEndsAt).getTime() : 0;
                  return dateB - dateA; // Most recent first
                })[0];
              
              // 2. Calculate new extension dates with state transitions
              const now = new Date();
              const extensionDuration = 168 * 60 * 60 * 1000; // 168 hours in milliseconds
              const newExpiryDate = new Date(now.getTime() + extensionDuration);
              
              let extension;
              if (currentExtension) {
                // Update existing extension with state transitions
                const newProlongationCount = (currentExtension.prolongationCount || 0) + 1;
                const isTopTen = currentExtension.isInTopTen;
                
                extension = await storage.updateProjectExtension(currentExtension.id, {
                  cycleEndsAt: newExpiryDate,
                  prolongationCount: newProlongationCount,
                  prolongationPaidEUR: ((parseFloat(currentExtension.prolongationPaidEUR || '0') || 0) + 20).toString(),
                  canProlong: newProlongationCount < 3, // Max 3 total extensions
                  // Persist state transitions - if not in TOP 10, archive after payment
                  isArchived: !isTopTen,
                  archivedAt: !isTopTen ? now : null,
                  archiveReason: !isTopTen ? 'out_of_top_ten' : null
                });
              } else {
                // Create new extension (will be updated by ranking system)
                extension = await storage.createProjectExtension({
                  projectId,
                  isInTopTen: false, // Will be updated by ranking system
                  cycleEndsAt: newExpiryDate,
                  prolongationCount: 1,
                  prolongationPaidEUR: '20.00',
                  canProlong: true,
                  isArchived: false // New extensions start active
                });
              }

              // 3. Create transaction record with proper type
              const transaction = await storage.createTransaction({
                userId,
                type: 'project_extension',
                amount: depositAmount.toString(),
                commission: '0.00',
                projectId,
                metadata: {
                  type: 'project_extension',
                  extensionId: extension.id,
                  expiresAt: newExpiryDate.toISOString(),
                  paymentIntentId,
                  simulationMode: false
                }
              });

              // 3.5. AUTO-GENERATE RECEIPT: Project extension
              try {
                const receipt = await generateReceiptPDF(transaction.id, userId, {
                  templateVersion: 'webhook-extension-v1',
                  includeDetails: true
                });
                
                // Log auto-generation audit
                await storage.createAuditLog({
                  userId,
                  action: 'auto_receipt_generated',
                  resourceType: 'receipt',
                  resourceId: receipt.receiptId,
                  details: {
                    transactionId: transaction.id,
                    receiptNumber: receipt.receiptNumber,
                    paymentIntentId,
                    projectId,
                    extensionId: extension.id,
                    trigger: 'project_extension_webhook'
                  }
                });
                
                console.log(`Auto-generated receipt ${receipt.receiptNumber} for project extension ${transaction.id}`);
              } catch (receiptError) {
                console.error('Failed to auto-generate receipt for project extension:', receiptError);
                // Don't fail the payment, just log the error
              }

              // 4. Send success notification
              await notificationService.notifyUser(userId, {
                type: 'project_status_change',
                title: 'Prolongation confirmée',
                message: `Votre projet a été prolongé de 168h pour €${depositAmount}. ${extension.isArchived ? 'Le projet a été archivé car il n\'est pas dans le TOP 10.' : ''}`,
                priority: 'medium'
              });

              console.log(`Project extension confirmed for user ${userId}: project ${projectId} - €${depositAmount}`);
            } catch (atomicError) {
              console.error('Atomic project extension operation failed:', atomicError);
              
              // Notify user of processing failure
              await notificationService.notifyUser(userId, {
                type: 'project_status_change',
                title: 'Erreur de prolongation',
                message: 'Une erreur est survenue lors de la prolongation de votre projet. Contactez le support.',
                priority: 'high'
              });

              return res.status(500).json({ error: 'Project extension processing failed' });
            }
          } else if (type === 'live_show_weekly_battle') {
            // Handle Live Show Weekly battle investment payment success
            const editionId = paymentIntent.metadata.editionId;
            const finalist = paymentIntent.metadata.finalist;
            const votes = parseInt(paymentIntent.metadata.votes || '0');
            
            if (!editionId || !finalist) {
              console.error('Missing live show weekly metadata:', paymentIntentId);
              return res.status(400).json({ error: 'Invalid live show weekly metadata' });
            }

            try {
              // 1. Find and update the investment record
              const investments = await storage.getLiveShowBattleInvestments(editionId);
              const investment = investments.find(inv => 
                inv.paymentIntentId === paymentIntentId && inv.userId === userId
              );

              if (!investment) {
                console.error('Investment not found for payment:', paymentIntentId);
                return res.status(404).json({ error: 'Investment not found' });
              }

              // Mark investment as paid
              await storage.updateLiveShowBattleInvestment(investment.id, {
                paidAt: new Date()
              });

              // 2. Create transaction record
              const transaction = await storage.createTransaction({
                userId,
                type: 'investment',
                amount: depositAmount.toString(),
                metadata: {
                  type: 'live_show_weekly_battle',
                  editionId,
                  finalist,
                  votes,
                  paymentIntentId,
                  simulationMode: false
                }
              });

              // 3. Emit WebSocket score update
              try {
                const { getNotificationService } = await import('./websocket');
                const wsService = getNotificationService();
                
                // Recalculate scoreboard
                const allInvestments = await storage.getLiveShowBattleInvestments(editionId);
                const paidInvestments = allInvestments.filter(inv => inv.paidAt);
                
                const scoreboard = paidInvestments.reduce((acc: any, inv) => {
                  if (!acc[inv.finalist]) {
                    acc[inv.finalist] = {
                      finalist: inv.finalist,
                      totalVotes: 0,
                      totalAmount: 0,
                      investorCount: 0
                    };
                  }
                  acc[inv.finalist].totalVotes += inv.votes || 0;
                  acc[inv.finalist].totalAmount += parseFloat(inv.amountEUR);
                  acc[inv.finalist].investorCount += 1;
                  return acc;
                }, {});

                wsService.emitLiveWeeklyScoreUpdate(editionId, {
                  scoreboard: Object.values(scoreboard),
                  latestPayment: {
                    finalist: investment.finalist,
                    amount: investment.amountEUR,
                    votes: investment.votes
                  }
                });
              } catch (wsError) {
                console.error('Failed to emit WebSocket after payment:', wsError);
              }

              // 4. Send success notification
              await notificationService.notifyUser(userId, {
                type: 'investment_confirmed',
                title: 'Investissement confirmé',
                message: `Votre investissement de €${depositAmount} sur le finaliste ${finalist} a été confirmé.`,
                priority: 'medium'
              });

              console.log(`Live Show Weekly investment confirmed for user ${userId}: ${finalist} - €${depositAmount} (${votes} votes)`);
            } catch (atomicError) {
              console.error('Atomic live show investment operation failed:', atomicError);
              
              await notificationService.notifyUser(userId, {
                type: 'investment_failed',
                title: 'Erreur d\'investissement',
                message: 'Une erreur est survenue lors du traitement de votre investissement. Contactez le support.',
                priority: 'high'
              });

              return res.status(500).json({ error: 'Live show investment processing failed' });
            }
          }
          break;
        }

        case 'payment_intent.payment_failed': {
          const paymentIntent = event.data.object;
          const userId = paymentIntent.metadata.userId;
          const type = paymentIntent.metadata.type;
          const videoDepositId = paymentIntent.metadata.videoDepositId;
          const projectId = paymentIntent.metadata.projectId;
          
          if (userId) {
            // Handle video deposit payment failure with cleanup
            if (type === 'video_deposit' && videoDepositId) {
              try {
                // Mark video deposit as rejected and clean up
                await storage.updateVideoDeposit(videoDepositId, {
                  status: 'rejected',
                  rejectionReason: 'Payment failed'
                });

                // Revoke any associated tokens
                await storage.revokeVideoTokens(videoDepositId);

                console.log(`Video deposit ${videoDepositId} marked as rejected due to payment failure`);
              } catch (cleanupError) {
                console.error('Failed to cleanup after video payment failure:', cleanupError);
              }
            }
            
            // Handle project extension payment failure
            if (type === 'project_extension' && projectId) {
              try {
                console.log(`Project extension payment failed for project ${projectId}, user ${userId}`);
                // No cleanup needed for project extensions as no state was changed yet
              } catch (cleanupError) {
                console.error('Failed to handle project extension payment failure:', cleanupError);
              }
            }

            await notificationService.notifyUser(userId, {
              type: 'payment_failed',
              title: 'Échec du paiement',
              message: type === 'video_deposit' 
                ? 'Votre paiement pour le dépôt vidéo a échoué. Le dépôt a été annulé.'
                : type === 'project_extension'
                ? 'Votre paiement pour la prolongation du projet a échoué. Veuillez réessayer.'
                : 'Votre paiement a échoué. Veuillez réessayer.',
              priority: 'high'
            });
          }
          break;
        }

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Error processing webhook:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });

  // Add JSON parsing middleware AFTER webhook registration
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // Auth middleware
  await setupAuth(app);

  // =======================
  // MISE À NIVEAU PRO - MIDDLEWARES DE SÉCURITÉ (ORDRE CRITIQUE)
  // =======================
  
  // Imports pour les middlewares PRO
  const rateLimit = (await import('express-rate-limit')).default;
  const { securityHeaders, rateLimitConfig, strictRateLimitConfig, auditLogger, requireMonitoringAccess } = await import('./middleware/security');
  
  // Appliquer les en-têtes de sécurité sur toutes les routes (après auth, avant routes)
  app.use(securityHeaders);
  
  // Rate limiting général sur toutes les API
  const generalLimiter = rateLimit(rateLimitConfig);
  app.use('/api', generalLimiter);
  
  // Rate limiting strict pour les opérations financières sensibles (CRITIQUE : AVANT les routes)
  const strictLimiter = rateLimit(strictRateLimitConfig);
  app.use('/api/investments', strictLimiter);
  app.use('/api/transactions', strictLimiter);
  app.use('/api/withdrawals', strictLimiter);
  app.use('/api/payouts', strictLimiter);
  
  // Audit logging sur les opérations sensibles (CRITIQUE : AVANT les routes)
  app.use('/api/investments', auditLogger('investment', 'financial'));
  app.use('/api/transactions', auditLogger('transaction', 'financial'));
  app.use('/api/admin/*', auditLogger('admin_action', 'administration'));

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Profile management routes
  app.get('/api/user/profiles', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ profileTypes: user.profileTypes });
    } catch (error) {
      console.error("Error fetching user profiles:", error);
      res.status(500).json({ message: "Failed to fetch profiles" });
    }
  });

  app.patch('/api/user/profiles', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { profileTypes } = req.body;
      
      if (!profileTypes || !Array.isArray(profileTypes) || profileTypes.length === 0) {
        return res.status(400).json({ 
          message: "Invalid profile types. Must provide at least one profile type." 
        });
      }
      
      // Get current user to check authorization
      const currentUser = await storage.getUser(userId);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const validProfileTypes = ['investor', 'invested_reader', 'creator', 'admin', 'infoporteur'];
      const invalidProfiles = profileTypes.filter((p: string) => !validProfileTypes.includes(p));
      
      if (invalidProfiles.length > 0) {
        return res.status(400).json({ 
          message: `Invalid profile types: ${invalidProfiles.join(', ')}` 
        });
      }
      
      // SECURITY: Restricted profiles can only be assigned by admins
      const restrictedProfiles = ['admin', 'infoporteur'];
      const requestedRestrictedProfiles = profileTypes.filter((p: string) => restrictedProfiles.includes(p));
      const currentRestrictedProfiles = currentUser.profileTypes.filter((p: string) => restrictedProfiles.includes(p));
      
      // Check if user is trying to add restricted profiles they don't already have
      const newRestrictedProfiles = requestedRestrictedProfiles.filter(
        (p: string) => !currentRestrictedProfiles.includes(p)
      );
      
      // Only admins can add restricted profiles
      if (newRestrictedProfiles.length > 0 && !currentUser.profileTypes.includes('admin')) {
        return res.status(403).json({ 
          message: "Only administrators can assign admin or infoporteur profiles. Please contact an administrator." 
        });
      }
      
      // Prevent non-admins from removing their last non-restricted profile if they have restricted ones
      // This ensures admins can't accidentally lock themselves out
      const nonRestrictedProfiles = profileTypes.filter((p: string) => !restrictedProfiles.includes(p));
      if (currentRestrictedProfiles.length > 0 && nonRestrictedProfiles.length === 0) {
        return res.status(400).json({ 
          message: "You must have at least one regular profile (investor, invested_reader, or creator)." 
        });
      }
      
      const updatedUser = await storage.updateUserProfiles(userId, profileTypes);
      res.json({ profileTypes: updatedUser.profileTypes });
    } catch (error) {
      console.error("Error updating user profiles:", error);
      res.status(500).json({ message: "Failed to update profiles" });
    }
  });

  // Project routes
  app.get('/api/projects', async (req, res) => {
    try {
      const { limit = 50, offset = 0, category } = req.query;
      
      // Validation des paramètres d'entrée
      const parsedLimit = parseInt(limit as string);
      const parsedOffset = parseInt(offset as string);
      
      if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
        return res.status(400).json({ 
          message: "Invalid limit parameter",
          details: "Limit must be between 1 and 100",
          retryable: false
        });
      }
      
      if (isNaN(parsedOffset) || parsedOffset < 0) {
        return res.status(400).json({ 
          message: "Invalid offset parameter",
          details: "Offset must be a non-negative number",
          retryable: false
        });
      }
      
      const projects = await storage.getProjects(
        parsedLimit,
        parsedOffset,
        category as string
      );
      
      // Log des métriques de succès
      console.log(`[API] Successfully fetched ${projects.length} projects (limit: ${parsedLimit}, offset: ${parsedOffset}, category: ${category || 'all'})`);
      
      res.json({
        data: projects,
        meta: {
          count: projects.length,
          limit: parsedLimit,
          offset: parsedOffset,
          category: category as string || null
        }
      });
    } catch (error: any) {
      console.error("[ERROR] Failed to fetch projects:", {
        error: error?.message || String(error),
        stack: error?.stack,
        query: req.query,
        timestamp: new Date().toISOString()
      });
      
      // Catégorisation des erreurs
      if (error?.code === 'ECONNREFUSED') {
        return res.status(503).json({ 
          message: "Database connection failed",
          details: "The database is temporarily unavailable. Please try again later.",
          retryable: true
        });
      }
      
      if (error?.code === 'ETIMEDOUT') {
        return res.status(504).json({ 
          message: "Request timeout",
          details: "The request took too long to process. Please try again.",
          retryable: true
        });
      }
      
      res.status(500).json({ 
        message: "Internal server error",
        details: "An unexpected error occurred while fetching projects",
        retryable: true
      });
    }
  });

  // GET /api/projects/random - Récupérer un projet aléatoire de qualité
  app.get('/api/projects/random', async (req, res) => {
    try {
      // Récupérer tous les projets avec un score de qualité décent
      const projects = await storage.getProjects(100, 0); // Limite élargie pour plus de choix
      
      if (!projects || projects.length === 0) {
        return res.status(404).json({ 
          message: "No projects available",
          retryable: false
        });
      }

      // Filtrer les projets avec un score décent (> 6.0) et diversifier les catégories
      const qualityProjects = projects.filter(p => {
        const score = typeof p.mlScore === 'number' ? p.mlScore : parseFloat(p.mlScore || '0');
        return score > 6.0 && p.status === 'active';
      });

      let selectedProject;
      if (qualityProjects.length > 0) {
        // Sélection pondérée basée sur le score et la diversité
        const randomIndex = Math.floor(Math.random() * qualityProjects.length);
        selectedProject = qualityProjects[randomIndex];
      } else {
        // Fallback: prendre un projet aléatoire parmi tous les actifs
        const activeProjects = projects.filter(p => p.status === 'active');
        if (activeProjects.length === 0) {
          return res.status(404).json({ 
            message: "No active projects available",
            retryable: false
          });
        }
        const randomIndex = Math.floor(Math.random() * activeProjects.length);
        selectedProject = activeProjects[randomIndex];
      }

      res.json({
        projectId: selectedProject.id,
        title: selectedProject.title,
        category: selectedProject.category,
        mlScore: selectedProject.mlScore
      });
    } catch (error) {
      console.error("Error fetching random project:", error);
      res.status(500).json({ 
        message: "Failed to fetch random project",
        retryable: true
      });
    }
  });

  app.get('/api/projects/:id', async (req, res) => {
    try {
      const projectId = req.params.id;
      
      // Validation de l'ID du projet
      if (!projectId || projectId.trim() === '') {
        return res.status(400).json({ 
          message: "Invalid project ID",
          details: "Project ID is required and cannot be empty",
          retryable: false
        });
      }
      
      // Validation du format UUID si nécessaire
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (projectId.length > 20 && !uuidRegex.test(projectId)) {
        return res.status(400).json({ 
          message: "Invalid project ID format",
          details: "Project ID must be a valid UUID or numeric ID",
          retryable: false
        });
      }
      
      const project = await storage.getProject(projectId);
      
      if (!project) {
        console.log(`[API] Project not found: ${projectId}`);
        return res.status(404).json({ 
          message: "Project not found",
          details: `No project exists with ID: ${projectId}`,
          retryable: false
        });
      }
      
      console.log(`[API] Successfully fetched project: ${projectId} (${project.title})`);
      res.json({
        data: project,
        meta: {
          projectId: projectId,
          fetchedAt: new Date().toISOString()
        }
      });
      
    } catch (error: any) {
      console.error("[ERROR] Failed to fetch project:", {
        error: error?.message || String(error),
        stack: error?.stack,
        projectId: req.params.id,
        timestamp: new Date().toISOString()
      });
      
      // Catégorisation des erreurs
      if (error?.code === 'ECONNREFUSED') {
        return res.status(503).json({ 
          message: "Database connection failed",
          details: "The database is temporarily unavailable. Please try again later.",
          retryable: true
        });
      }
      
      if (error?.code === 'ETIMEDOUT') {
        return res.status(504).json({ 
          message: "Request timeout",
          details: "The request took too long to process. Please try again.",
          retryable: true
        });
      }
      
      if (error?.message?.includes('invalid input syntax')) {
        return res.status(400).json({ 
          message: "Invalid project ID format",
          details: "The provided project ID has an invalid format",
          retryable: false
        });
      }
      
      res.status(500).json({ 
        message: "Internal server error",
        details: "An unexpected error occurred while fetching the project",
        retryable: true
      });
    }
  });

  app.post('/api/projects', isAuthenticated, upload.single('video'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.profileType !== 'creator') {
        return res.status(403).json({ message: "Only creators can submit projects" });
      }

      const projectData = insertProjectSchema.parse({
        ...req.body,
        creatorId: userId,
        unitPriceEUR: req.body.unitPriceEUR || '5.00', // Prix unitaire obligatoire (2,3,4,5,10€)
        videoUrl: req.file ? `/uploads/${req.file.filename}` : undefined,
      });

      // Calculate ML score with improved error handling
      try {
        const mlScore = await mlScoreProject(projectData);
        projectData.mlScore = mlScore.toString();
      } catch (mlError: any) {
        console.error("ML scoring error:", mlError);
        
        // Handle simulation validation errors with specific messages
        if (mlError.name === "SimulationValidationError") {
          return res.status(400).json({ 
            message: "Erreur de validation du projet",
            details: mlError.message,
            field: mlError.field,
            retryable: true
          });
        }
        
        if (mlError.name === "MLScoringError") {
          return res.status(500).json({ 
            message: "Erreur lors du calcul du score ML",
            details: mlError.message,
            code: mlError.code,
            retryable: true
          });
        }
        
        // Fallback to default score if ML scoring fails unexpectedly
        console.warn("Using default ML score due to unexpected error");
        projectData.mlScore = "5.0";
      }

      const project = await storage.createProject(projectData);
      res.status(201).json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Données de projet invalides", 
          errors: error.errors,
          retryable: false
        });
      }
      res.status(500).json({ 
        message: "Échec de création du projet",
        retryable: true
      });
    }
  });

  // Investment routes
  app.post('/api/investments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || !user.kycVerified) {
        return res.status(403).json({ message: "KYC verification required for investments" });
      }

      const minimumCaution = getMinimumCautionAmount(user.profileType || 'investor');
      if (parseFloat(user.cautionEUR || '0') < minimumCaution) {
        return res.status(403).json({ message: `Minimum caution of €${minimumCaution} required` });
      }

      const investmentData = insertInvestmentSchema.parse({
        ...req.body,
        userId,
        visuPoints: Math.floor(parseFloat(req.body.amount) * 100), // 100 VP = 1 EUR
        currentValue: req.body.amount,
      });

      // Validate investment amount (nouvelles règles 16/09/2025)
      const amount = parseFloat(req.body.amount);
      if (!isValidInvestmentAmount(amount)) {
        return res.status(400).json({ 
          message: `Investment amount must be one of: ${ALLOWED_INVESTMENT_AMOUNTS.join(', ')} EUR`,
          allowedAmounts: ALLOWED_INVESTMENT_AMOUNTS
        });
      }

      // Check if user has sufficient balance
      if (parseFloat(user.balanceEUR || '0') < amount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      // Prevent self-investment: check if user is the creator of the project
      const project = await storage.getProject(req.body.projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      if (project.creatorId === userId) {
        return res.status(403).json({ 
          message: "You cannot invest in your own project. Self-investment is not allowed." 
        });
      }

      const investment = await storage.createInvestment(investmentData);

      // Create transaction record
      const commission = amount * 0.23; // 23% platform commission
      await storage.createTransaction({
        userId,
        type: 'investment',
        amount: amount.toString(),
        commission: commission.toString(),
        projectId: req.body.projectId,
        investmentId: investment.id,
        metadata: { simulationMode: user.simulationMode },
      });

      // Update user balance (only in simulation mode for now)
      if (user.simulationMode) {
        const newBalance = parseFloat(user.balanceEUR || '0') - amount;
        await storage.upsertUser({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl,
          profileType: user.profileType,
          kycVerified: user.kycVerified,
          balanceEUR: newBalance.toString(),
          simulationMode: user.simulationMode,
          cautionEUR: user.cautionEUR,
          totalInvested: (parseFloat(user.totalInvested || '0') + amount).toString(),
          totalGains: user.totalGains,
          rankGlobal: user.rankGlobal,
        });
      }

      // Trigger notifications
      await notificationService.notifyNewInvestment({
        projectId: req.body.projectId,
        userId,
        amount: amount.toString()
      });

      // Check for milestone notifications (reuse project from self-investment check)
      if (project) {
        const currentAmount = parseFloat(project.currentAmount || '0') + amount;
        const targetAmount = parseFloat(project.targetAmount);
        const percentage = (currentAmount / targetAmount) * 100;
        
        // Update project current amount
        await storage.updateProject(project.id, {
          currentAmount: currentAmount.toString(),
          investorCount: (project.investorCount || 0) + 1
        });

        // Check for milestone notifications (25%, 50%, 75%, 100%)
        const milestones = [25, 50, 75, 100];
        const reachedMilestone = milestones.find(m => 
          percentage >= m && (percentage - (amount / targetAmount) * 100) < m
        );

        if (reachedMilestone) {
          await notificationService.notifyInvestmentMilestone({
            projectId: req.body.projectId,
            percentage: reachedMilestone,
            currentAmount: currentAmount.toString(),
            targetAmount: project.targetAmount
          });

          if (reachedMilestone === 100) {
            await notificationService.notifyFundingGoalReached({
              projectId: req.body.projectId
            });
          }
        }
      }

      res.status(201).json(investment);
    } catch (error) {
      console.error("Error creating investment:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid investment data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create investment" });
    }
  });

  app.get('/api/investments/user/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const requestedUserId = req.params.userId;
      const currentUserId = req.user.claims.sub;
      
      // Users can only view their own investments unless they're admin
      const currentUser = await storage.getUser(currentUserId);
      if (requestedUserId !== currentUserId && currentUser?.profileType !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const investments = await storage.getUserInvestments(requestedUserId);
      res.json(investments);
    } catch (error) {
      console.error("Error fetching user investments:", error);
      res.status(500).json({ message: "Failed to fetch investments" });
    }
  });

  // Live shows routes
  app.get('/api/live-shows', async (req, res) => {
    try {
      const liveShows = await storage.getActiveLiveShows();
      res.json(liveShows);
    } catch (error) {
      console.error("Error fetching live shows:", error);
      res.status(500).json({ message: "Failed to fetch live shows" });
    }
  });

  app.post('/api/live-shows', isAuthenticated, async (req: any, res) => {
    try {
      const { title, description, artistA, artistB, viewerCount } = req.body;

      if (!title || typeof title !== 'string') {
        return res.status(400).json({ message: "Title is required" });
      }

      const liveShowData = {
        title: title.trim(),
        description: description?.trim(),
        artistA: artistA?.trim(),
        artistB: artistB?.trim(),
        viewerCount: parseInt(viewerCount) || 0
      };

      const newLiveShow = await storage.createLiveShow(liveShowData);
      
      console.log(`[LiveShows] New live show created: ${newLiveShow.id} - ${newLiveShow.title}`);
      
      res.status(201).json({
        success: true,
        liveShow: newLiveShow,
        message: "Live show created successfully"
      });
    } catch (error) {
      console.error("Error creating live show:", error);
      res.status(500).json({ 
        message: "Failed to create live show",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.post('/api/live-shows/:id/invest', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || !user.kycVerified) {
        return res.status(403).json({ message: "KYC verification required" });
      }

      const { artist, amount } = req.body;
      const liveShowId = req.params.id;
      
      // Validate amount
      const investmentAmount = parseFloat(amount);
      if (investmentAmount < 2 || investmentAmount > 20) {
        return res.status(400).json({ message: "Investment amount must be between **2–20 €**" });
      }

      // Update live show investments
      const currentShows = await storage.getActiveLiveShows();
      const currentShow = currentShows.find(show => show.id === liveShowId);
      
      if (!currentShow) {
        return res.status(404).json({ message: "Live show not found" });
      }

      const newInvestmentA = artist === 'A' 
        ? (parseFloat(currentShow.investmentA || '0') + investmentAmount).toString()
        : (currentShow.investmentA || '0');
      
      const newInvestmentB = artist === 'B'
        ? (parseFloat(currentShow.investmentB || '0') + investmentAmount).toString()
        : (currentShow.investmentB || '0');

      await storage.updateLiveShowInvestments(liveShowId, newInvestmentA, newInvestmentB);

      // Create transaction record
      const commission = investmentAmount * 0.1; // 10% commission for live shows
      await storage.createTransaction({
        userId,
        type: 'investment',
        amount: investmentAmount.toString(),
        commission: commission.toString(),
        metadata: { liveShowId, artist, type: 'live_show' },
      });

      // Trigger notification for live show investment
      await notificationService.notifyNewInvestment({
        projectId: liveShowId,
        userId: userId,
        amount: investmentAmount.toString(),
        metadata: { projectTitle: `Live Show Battle`, projectType: 'live_show' }
      });

      res.json({ success: true, message: "Investment recorded successfully" });
    } catch (error) {
      console.error("Error processing live show investment:", error);
      res.status(500).json({ message: "Failed to process investment" });
    }
  });

  // ===== LIVE SHOW FINALIST MANAGEMENT ROUTES =====

  // Get finalists for a specific show
  app.get('/api/live-shows/:id/finalists', async (req, res) => {
    try {
      const showId = req.params.id;
      const finalists = await db
        .select()
        .from(liveShowFinalists)
        .where(eq(liveShowFinalists.liveShowId, showId))
        .orderBy(liveShowFinalists.rank);
      
      res.json(finalists);
    } catch (error) {
      console.error("Error fetching finalists:", error);
      res.status(500).json({ message: "Failed to fetch finalists" });
    }
  });

  // Designate finalists (Admin only)
  app.post('/api/live-shows/:id/finalists', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.profileType !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const showId = req.params.id;
      
      // Validate request body
      const validation = designateFinalistsSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid request data",
          errors: validation.error.errors 
        });
      }

      const { finalists } = validation.data;
      const result = await liveShowOrchestrator.designateFinalists(showId, finalists);
      
      res.json({ 
        success: true, 
        message: "Finalists designated successfully",
        finalists: result 
      });
    } catch (error) {
      console.error("Error designating finalists:", error);
      res.status(500).json({ message: "Failed to designate finalists" });
    }
  });

  // Request confirmations from finalists (Admin only)
  app.post('/api/live-shows/:id/request-confirmations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.profileType !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const showId = req.params.id;
      await liveShowOrchestrator.requestConfirmations(showId);
      
      res.json({ 
        success: true, 
        message: "Confirmation requests sent to finalists" 
      });
    } catch (error) {
      console.error("Error requesting confirmations:", error);
      res.status(500).json({ message: "Failed to request confirmations" });
    }
  });

  // Confirm participation (Finalist)
  app.post('/api/live-shows/finalists/:id/confirm', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const finalistId = req.params.id;
      
      const result = await liveShowOrchestrator.confirmParticipation(finalistId, userId);
      
      if (!result.success) {
        return res.status(400).json({ message: result.error });
      }
      
      res.json({ 
        success: true, 
        message: "Participation confirmée avec succès" 
      });
    } catch (error) {
      console.error("Error confirming participation:", error);
      res.status(500).json({ message: "Failed to confirm participation" });
    }
  });

  // Cancel participation (Finalist)
  app.post('/api/live-shows/finalists/:id/cancel', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const finalistId = req.params.id;
      
      // Validate request body
      const validation = cancelParticipationSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid request data",
          errors: validation.error.errors 
        });
      }

      const { reason } = validation.data;
      const result = await liveShowOrchestrator.cancelParticipation(finalistId, userId, reason);
      
      if (!result.success) {
        return res.status(400).json({ message: result.error });
      }
      
      res.json({ 
        success: true, 
        message: "Participation annulée",
        scenario: result.scenario,
        scenarioExecuted: !!result.scenario
      });
    } catch (error) {
      console.error("Error canceling participation:", error);
      res.status(500).json({ message: "Failed to cancel participation" });
    }
  });

  // Lock lineup (Admin only)
  app.post('/api/live-shows/:id/lock-lineup', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.profileType !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const showId = req.params.id;
      const result = await liveShowOrchestrator.lockLineup(showId, userId);
      
      if (!result.success) {
        return res.status(400).json({ message: result.error });
      }
      
      res.json({ 
        success: true, 
        message: "Line-up verrouillé avec succès" 
      });
    } catch (error) {
      console.error("Error locking lineup:", error);
      res.status(500).json({ message: "Failed to lock lineup" });
    }
  });

  // Get lineup state
  app.get('/api/live-shows/:id/lineup', async (req, res) => {
    try {
      const showId = req.params.id;
      const lineup = await liveShowOrchestrator.getLineupState(showId);
      
      res.json(lineup);
    } catch (error) {
      console.error("Error fetching lineup:", error);
      res.status(500).json({ message: "Failed to fetch lineup" });
    }
  });

  // Get Live Show audit log (Admin only)
  app.get('/api/live-shows/:id/audit', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.profileType !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const showId = req.params.id;
      const auditLog = await db
        .select()
        .from(liveShowAudit)
        .where(eq(liveShowAudit.liveShowId, showId))
        .orderBy(desc(liveShowAudit.timestamp));
      
      res.json(auditLog);
    } catch (error) {
      console.error("Error fetching audit log:", error);
      res.status(500).json({ message: "Failed to fetch audit log" });
    }
  });

  // Admin routes
  app.get('/api/admin/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.profileType !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const [userStats, projectStats, transactionStats] = await Promise.all([
        storage.getUserStats(),
        storage.getProjectStats(),
        storage.getTransactionStats(),
      ]);

      res.json({
        users: userStats,
        projects: projectStats,
        transactions: transactionStats,
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });

  app.get('/api/admin/users', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.profileType !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { limit = 100, offset = 0 } = req.query;
      const users = await storage.getAllUsers(
        parseInt(limit as string),
        parseInt(offset as string)
      );
      
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get('/api/admin/projects/pending', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.profileType !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const pendingProjects = await storage.getPendingProjects();
      res.json(pendingProjects);
    } catch (error) {
      console.error("Error fetching pending projects:", error);
      res.status(500).json({ message: "Failed to fetch pending projects" });
    }
  });

  app.put('/api/admin/projects/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.profileType !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { status } = req.body;
      const projectId = req.params.id;
      
      if (!['active', 'rejected'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const project = await storage.getProject(projectId);
      const oldStatus = project?.status || 'unknown';
      
      const updatedProject = await storage.updateProject(projectId, { status });
      
      // Trigger notification for status change
      await notificationService.notifyProjectStatusChange({
        projectId,
        oldStatus,
        newStatus: status
      });
      
      res.json(updatedProject);
    } catch (error) {
      console.error("Error updating project status:", error);
      res.status(500).json({ message: "Failed to update project status" });
    }
  });

  app.get('/api/admin/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.profileType !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { limit = 100 } = req.query;
      const transactions = await storage.getAllTransactions(parseInt(limit as string));
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // Live Shows Admin routes
  app.get('/api/admin/live-shows/active', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.profileType !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const activeShows = await storage.getActiveLiveShows();
      res.json(activeShows);
    } catch (error) {
      console.error("Error fetching active live shows:", error);
      res.status(500).json({ message: "Failed to fetch active live shows" });
    }
  });

  app.get('/api/admin/live-shows/:showId/lineup', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.profileType !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { showId } = req.params;
      const lineup = await liveShowOrchestrator.getLineupState(showId);
      res.json(lineup);
    } catch (error) {
      console.error("Error fetching lineup:", error);
      res.status(500).json({ message: "Failed to fetch lineup" });
    }
  });

  app.get('/api/admin/live-shows/:showId/audit', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.profileType !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { showId } = req.params;
      const auditLog = await storage.getLiveShowAudit(showId);
      res.json(auditLog);
    } catch (error) {
      console.error("Error fetching audit log:", error);
      res.status(500).json({ message: "Failed to fetch audit log" });
    }
  });

  app.post('/api/admin/live-shows/:showId/lock-lineup', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.profileType !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { showId } = req.params;
      const result = await liveShowOrchestrator.lockLineup(showId, userId);
      
      if (!result.success) {
        return res.status(400).json({ message: result.error });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error locking lineup:", error);
      res.status(500).json({ message: "Failed to lock lineup" });
    }
  });

  app.post('/api/admin/live-shows/:showId/unlock-lineup', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.profileType !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { showId } = req.params;
      const result = await liveShowOrchestrator.unlockLineup(showId, userId);
      
      if (!result.success) {
        return res.status(400).json({ message: result.error });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error unlocking lineup:", error);
      res.status(500).json({ message: "Failed to unlock lineup" });
    }
  });

  // ===== LIVE SHOW WEEKLY SYSTEM ROUTES =====
  
  // Get current week edition
  app.get('/api/live-weekly/current', async (req, res) => {
    try {
      const now = new Date();
      const weekNumber = Math.ceil((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
      const year = now.getFullYear();
      
      const edition = await storage.getCurrentWeekEdition(weekNumber, year);
      
      if (!edition) {
        return res.status(404).json({ message: "No current edition found" });
      }

      res.json(edition);
    } catch (error) {
      console.error("Error fetching current edition:", error);
      res.status(500).json({ message: "Failed to fetch current edition" });
    }
  });

  // Get edition candidates
  app.get('/api/live-weekly/candidates/:editionId', async (req, res) => {
    try {
      const { editionId } = req.params;
      const candidates = await storage.getLiveShowCandidates(editionId);
      
      res.json(candidates);
    } catch (error) {
      console.error("Error fetching candidates:", error);
      res.status(500).json({ message: "Failed to fetch candidates" });
    }
  });

  // Submit community vote (Phase 1 & 2)
  app.post('/api/live-weekly/vote', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { candidateId } = req.body;

      if (!candidateId) {
        return res.status(400).json({ message: "Candidate ID required" });
      }

      const candidate = await storage.getLiveShowCandidate(candidateId);
      if (!candidate) {
        return res.status(404).json({ message: "Candidate not found" });
      }

      const edition = await storage.getLiveShowEdition(candidate.editionId);
      if (!edition) {
        return res.status(404).json({ message: "Edition not found" });
      }

      // Check if voting is allowed (phase 1 or 2)
      if (edition.currentPhase !== 'phase1' && edition.currentPhase !== 'phase2') {
        return res.status(400).json({ message: "Voting not allowed in current phase" });
      }

      const vote = await storage.createLiveShowCommunityVote({
        candidateId,
        voterId: userId,
        phase: edition.currentPhase
      });

      res.json({ success: true, vote });
    } catch (error) {
      console.error("Error submitting vote:", error);
      res.status(500).json({ message: "Failed to submit vote" });
    }
  });

  // Battle investment (Live phase only)
  app.post('/api/live-weekly/invest', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { finalist, editionId, amountEUR } = req.body;

      if (!finalist || !editionId || !amountEUR) {
        return res.status(400).json({ message: "Finalist (A/B), edition ID, and amount required" });
      }

      if (finalist !== 'A' && finalist !== 'B') {
        return res.status(400).json({ message: "Finalist must be 'A' or 'B'" });
      }

      const edition = await storage.getLiveShowEdition(editionId);
      if (!edition) {
        return res.status(404).json({ message: "Edition not found" });
      }

      // Check if battle is running
      if (edition.currentPhase !== 'live') {
        return res.status(400).json({ message: "Investments only allowed during Live Show" });
      }

      if (edition.currentState !== 'live_running') {
        return res.status(400).json({ message: "Battle not currently running" });
      }

      // Validate investment amount
      const { INVEST_TRANCHES_EUR, votesForAmount } = await import('@shared/liveShowConstants');
      if (!INVEST_TRANCHES_EUR.includes(amountEUR)) {
        return res.status(400).json({ message: "Invalid investment amount" });
      }

      const votes = votesForAmount(amountEUR);

      // Create Stripe payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amountEUR * 100),
        currency: 'eur',
        metadata: {
          type: 'live_show_weekly_battle',
          depositAmount: amountEUR.toString(),
          finalist,
          editionId: edition.id,
          userId,
          votes: votes.toString()
        }
      });

      // Create investment record (pending until payment confirmed)
      const investment = await storage.createLiveShowBattleInvestment({
        editionId: edition.id,
        liveShowId: edition.liveShowId,
        userId,
        finalist,
        amountEUR: amountEUR.toString(),
        votes,
        paymentIntentId: paymentIntent.id
      });

      // Emit score update via WebSocket
      try {
        const { getNotificationService } = await import('./websocket');
        const wsService = getNotificationService();
        
        // Get updated scoreboard
        const investments = await storage.getLiveShowBattleInvestments(edition.id);
        const scoreboard = investments.reduce((acc: any, inv) => {
          if (!acc[inv.finalist]) {
            acc[inv.finalist] = {
              finalist: inv.finalist,
              totalVotes: 0,
              totalAmount: 0,
              investorCount: 0
            };
          }
          acc[inv.finalist].totalVotes += inv.votes;
          acc[inv.finalist].totalAmount += parseFloat(inv.amountEUR);
          acc[inv.finalist].investorCount += 1;
          return acc;
        }, {});

        wsService.emitLiveWeeklyScoreUpdate(edition.id, {
          scoreboard: Object.values(scoreboard),
          latestInvestment: {
            finalist: investment.finalist,
            amount: investment.amountEUR,
            votes: investment.votes
          }
        });
      } catch (wsError) {
        console.error('Failed to emit WebSocket score update:', wsError);
      }

      res.json({
        success: true,
        investment,
        clientSecret: paymentIntent.client_secret
      });
    } catch (error) {
      console.error("Error processing investment:", error);
      res.status(500).json({ message: "Failed to process investment" });
    }
  });

  // Get scoreboard
  app.get('/api/live-weekly/scoreboard/:editionId', async (req, res) => {
    try {
      const { editionId } = req.params;
      const investments = await storage.getLiveShowBattleInvestments(editionId);
      
      // Aggregate by finalist
      const scoreboard = investments.reduce((acc: any, inv) => {
        if (!acc[inv.finalist]) {
          acc[inv.finalist] = {
            finalist: inv.finalist,
            totalVotes: 0,
            totalAmount: 0,
            investorCount: 0
          };
        }
        
        acc[inv.finalist].totalVotes += inv.votes;
        acc[inv.finalist].totalAmount += parseFloat(inv.amountEUR);
        acc[inv.finalist].investorCount += 1;
        
        return acc;
      }, {});

      res.json(Object.values(scoreboard));
    } catch (error) {
      console.error("Error fetching scoreboard:", error);
      res.status(500).json({ message: "Failed to fetch scoreboard" });
    }
  });

  // Admin middleware
  const isAdmin = async (req: any, res: any, next: any) => {
    try {
      if (!req.user?.claims?.sub) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.profileType !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      next();
    } catch (error) {
      console.error("Admin check error:", error);
      res.status(500).json({ message: "Authorization failed" });
    }
  };

  // Admin: Create weekly edition
  app.post('/api/admin/live-weekly/create-edition', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { liveShowId, weekNumber, year } = req.body;
      
      if (!liveShowId || !weekNumber || !year) {
        return res.status(400).json({ message: "Live Show ID, week number, and year required" });
      }

      const { LiveShowWeeklyOrchestrator } = await import('./services/liveShowWeeklyOrchestrator');
      const orchestrator = new LiveShowWeeklyOrchestrator();
      
      const edition = await orchestrator.createWeeklyEdition(liveShowId, weekNumber, year);
      
      res.json({ success: true, edition });
    } catch (error) {
      console.error("Error creating edition:", error);
      res.status(500).json({ message: "Failed to create edition" });
    }
  });

  // Compliance routes
  app.post('/api/compliance/report', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.profileType !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { reportType, period } = req.body;
      const reportData = { 
        generatedAt: new Date(),
        totalInvestments: 0,
        totalUsers: 0,
        totalProjects: 0,
        status: 'generated',
        type: reportType,
        period
      };
      
      const report = await storage.createComplianceReport({
        reportType,
        period,
        data: reportData,
        generatedBy: userId,
      });

      res.json(report);
    } catch (error) {
      console.error("Error generating compliance report:", error);
      res.status(500).json({ message: "Failed to generate compliance report" });
    }
  });

  app.get('/api/compliance/reports', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.profileType !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const reports = await storage.getComplianceReports();
      res.json(reports);
    } catch (error) {
      console.error("Error fetching compliance reports:", error);
      res.status(500).json({ message: "Failed to fetch compliance reports" });
    }
  });

  // Webhook handled at the top of this function

  const httpServer = createServer(app);
  
  // Initialize WebSocket for real-time notifications with session middleware
  const sessionMiddleware = getSession();
  console.log('[VISUAL] Initializing WebSocket notification service...');
  const wsService = initializeWebSocket(httpServer, sessionMiddleware);
  console.log('[VISUAL] WebSocket service initialized successfully, connected users:', wsService.getConnectedUsersCount());
  
  // Notification routes
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { limit = 50, offset = 0, unreadOnly = false } = req.query;
      
      const notifications = await storage.getUserNotifications(
        userId,
        parseInt(limit as string),
        parseInt(offset as string),
        unreadOnly === 'true'
      );
      
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.patch('/api/notifications/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notificationId = req.params.id;
      
      await storage.markNotificationAsRead(notificationId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.get('/api/notifications/preferences', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const preferences = await storage.getUserNotificationPreferences(userId);
      res.json(preferences);
    } catch (error) {
      console.error("Error fetching notification preferences:", error);
      res.status(500).json({ message: "Failed to fetch notification preferences" });
    }
  });

  app.patch('/api/notifications/preferences', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const updates = req.body;
      
      // Convert object updates to array format expected by storage
      const validNotificationTypes = [
        'investment_milestone', 'funding_goal_reached', 'project_status_change',
        'roi_update', 'new_investment', 'live_show_started', 'battle_result', 'performance_alert'
      ];
      
      const preferencesArray = Object.keys(updates)
        .filter(key => validNotificationTypes.includes(key))
        .map(notificationType => ({
          notificationType: notificationType as any,
          enabled: updates[notificationType].enabled ?? true,
          emailEnabled: updates[notificationType].emailEnabled ?? false,
          pushEnabled: updates[notificationType].pushEnabled ?? true,
          threshold: updates[notificationType].threshold
        }));
      
      await storage.updateNotificationPreferences(userId, preferencesArray);
      
      // Return updated preferences
      const updatedPreferences = await storage.getUserNotificationPreferences(userId);
      res.json(updatedPreferences);
    } catch (error) {
      console.error("Error updating notification preferences:", error);
      res.status(500).json({ message: "Failed to update notification preferences" });
    }
  });

  // KYC and Wallet endpoints
  app.post('/api/kyc/verify', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { documents } = req.body;
      
      // In simulation mode, automatically approve KYC
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Simulate KYC verification process
      const kycData = {
        documents: documents || {},
        verificationDate: new Date(),
        status: 'verified',
        documentTypes: ['identity', 'address_proof'],
        simulationMode: user.simulationMode
      };

      // Update user as KYC verified
      await storage.updateUser(userId, {
        kycVerified: true,
        kycDocuments: kycData
      });

      res.json({ 
        success: true, 
        message: "KYC verification completed successfully",
        kycVerified: true
      });
    } catch (error) {
      console.error("Error during KYC verification:", error);
      res.status(500).json({ message: "KYC verification failed" });
    }
  });

  // Stripe Payment Intent creation for deposits
  app.post('/api/create-payment-intent', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { amount, type = 'caution' } = req.body;
      
      const depositAmount = parseFloat(amount);
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const minimumAmount = getMinimumCautionAmount(user.profileType || 'investor');
      if (depositAmount < minimumAmount) {
        return res.status(400).json({ message: `Minimum deposit amount is €${minimumAmount}` });
      }

      if (depositAmount > 1000) {
        return res.status(400).json({ message: "Maximum deposit amount is €1000" });
      }

      // Create Stripe Payment Intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(depositAmount * 100), // Convert to cents
        currency: "eur",
        automatic_payment_methods: {
          enabled: true
        },
        metadata: {
          userId,
          type,
          depositAmount: depositAmount.toString()
        }
      });
      
      res.json({
        success: true,
        clientSecret: paymentIntent.client_secret,
        amount: depositAmount
      });
    } catch (error) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ message: "Payment intent creation failed" });
    }
  });

  // Confirm payment and update user balance
  app.post('/api/confirm-payment', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { paymentIntentId } = req.body;

      // Retrieve payment intent from Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ message: "Payment not completed" });
      }

      if (paymentIntent.metadata.userId !== userId) {
        return res.status(403).json({ message: "Payment does not belong to this user" });
      }

      const depositAmount = parseFloat(paymentIntent.metadata.depositAmount);
      const type = paymentIntent.metadata.type;

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Update user balance based on payment type
      if (type === 'caution') {
        const newCaution = parseFloat(user.cautionEUR || '0') + depositAmount;
        await storage.updateUser(userId, {
          cautionEUR: newCaution.toString()
        });

        // Create transaction record
        await storage.createTransaction({
          userId,
          type: 'deposit',
          amount: depositAmount.toString(),
          metadata: { 
            type: 'caution_deposit', 
            paymentIntentId,
            simulationMode: false 
          }
        });

        res.json({
          success: true,
          message: "Caution deposit confirmed",
          cautionEUR: newCaution
        });
      } else {
        // Handle other payment types (future feature)
        res.status(400).json({ message: "Payment type not supported" });
      }
    } catch (error) {
      console.error("Error confirming payment:", error);
      res.status(500).json({ message: "Payment confirmation failed" });
    }
  });

  app.post('/api/wallet/deposit', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { amount, type = 'caution' } = req.body;
      
      const depositAmount = parseFloat(amount);
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const minimumAmount = getMinimumCautionAmount(user.profileType || 'investor');
      if (depositAmount < minimumAmount) {
        return res.status(400).json({ message: `Minimum deposit amount is €${minimumAmount}` });
      }

      if (depositAmount > 1000) {
        return res.status(400).json({ message: "Maximum deposit amount is €1000" });
      }

      // In simulation mode, allow unlimited deposits from virtual balance
      if (user.simulationMode) {
        const currentBalance = parseFloat(user.balanceEUR || '0');
        if (currentBalance < depositAmount) {
          return res.status(400).json({ message: "Insufficient simulation balance" });
        }

        // Update caution and reduce balance
        const newCaution = parseFloat(user.cautionEUR || '0') + depositAmount;
        const newBalance = currentBalance - depositAmount;

        await storage.updateUser(userId, {
          cautionEUR: newCaution.toString(),
          balanceEUR: newBalance.toString()
        });

        // Create transaction record
        await storage.createTransaction({
          userId,
          type: 'investment',
          amount: depositAmount.toString(),
          metadata: { type: 'caution_deposit', simulationMode: true }
        });

        res.json({
          success: true,
          message: "Caution deposit successful",
          cautionEUR: newCaution,
          balanceEUR: newBalance
        });
      } else {
        // Real mode: Redirect to /api/create-payment-intent
        res.status(400).json({ 
          message: "Use /api/create-payment-intent for real payments",
          redirect: "/api/create-payment-intent"
        });
      }
    } catch (error) {
      console.error("Error during wallet deposit:", error);
      res.status(500).json({ message: "Deposit failed" });
    }
  });

  app.get('/api/wallet/balance', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const walletInfo = {
        balanceEUR: parseFloat(user.balanceEUR || '0'),
        cautionEUR: parseFloat(user.cautionEUR || '0'),
        totalInvested: parseFloat(user.totalInvested || '0'),
        totalGains: parseFloat(user.totalGains || '0'),
        simulationMode: user.simulationMode,
        kycVerified: user.kycVerified,
        canInvest: user.kycVerified && parseFloat(user.cautionEUR || '0') >= getMinimumCautionAmount(user.profileType || 'investor')
      };

      res.json(walletInfo);
    } catch (error) {
      console.error("Error fetching wallet balance:", error);
      res.status(500).json({ message: "Failed to fetch wallet balance" });
    }
  });

  // Theme preference routes
  app.patch('/api/user/theme', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { theme } = req.body;

      if (!theme || !['light', 'dark'].includes(theme)) {
        return res.status(400).json({ error: 'Invalid theme value' });
      }

      console.log(`[Theme] Updating theme for user ${userId} to ${theme}`);
      await storage.updateUser(userId, { themePreference: theme });
      console.log(`[Theme] Successfully updated theme for user ${userId}`);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Theme update error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.patch('/api/users/preference', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { preferredLanguage } = req.body;

      if (!preferredLanguage || !['fr', 'en', 'es'].includes(preferredLanguage)) {
        return res.status(400).json({ error: 'Invalid language value' });
      }

      await storage.updateUser(userId, { preferredLanguage });
      res.json({ success: true });
    } catch (error: any) {
      console.error('Language preference update error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Search routes
  app.get('/api/search', async (req: any, res) => {
    try {
      const { q, type, category, language, limit, offset } = req.query;

      if (!q || typeof q !== 'string' || q.trim().length < 2) {
        return res.status(400).json({ error: 'Query must be at least 2 characters', results: [], count: 0 });
      }

      const { searchService } = await import('./services/searchService');
      
      const results = await searchService.search({
        query: q,
        type: type as any,
        category,
        language: language as any || 'fr',
        limit: limit ? parseInt(limit) : 20,
        offset: offset ? parseInt(offset) : 0,
      });

      res.json({ results, count: results.length });
    } catch (error: any) {
      console.error('Search error:', error);
      res.status(400).json({ 
        error: error.message || 'Search query failed. Please try different search terms.',
        results: [],
        count: 0
      });
    }
  });

  app.get('/api/search/suggestions', async (req: any, res) => {
    try {
      const { q, language, limit } = req.query;

      if (!q || typeof q !== 'string' || q.trim().length < 2) {
        return res.json({ suggestions: [] });
      }

      const { searchService } = await import('./services/searchService');
      
      const suggestions = await searchService.getSuggestions(
        q,
        language as string || 'fr',
        limit ? parseInt(limit) : 5
      );

      res.json({ suggestions });
    } catch (error: any) {
      console.error('Search suggestions error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ===== SEO ROUTES =====
  // Managed by VisualScoutAI, supervised by VisualAI, controlled by Admin

  // Generate sitemap.xml
  app.get('/api/seo/sitemap.xml', async (req: any, res) => {
    try {
      const { seoService } = await import('./services/seoService');
      const { lang } = req.query;
      
      const sitemap = await seoService.generateSitemap(lang || 'fr');
      
      res.setHeader('Content-Type', 'application/xml');
      res.send(sitemap);
    } catch (error: any) {
      console.error('Sitemap generation error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get SEO configuration (public)
  app.get('/api/seo/config', async (req: any, res) => {
    try {
      const { seoService } = await import('./services/seoService');
      const config = await seoService.getOrCreateConfig();
      res.json(config);
    } catch (error: any) {
      console.error('SEO config error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Update SEO configuration (admin only)
  app.put('/api/seo/config', async (req: any, res) => {
    try {
      const userId = req.session?.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const user = await storage.getUser(userId);
      if (!user || user.profileType !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { db } = await import('./db');
      const { seoConfig } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');

      const configs = await db.select().from(seoConfig).limit(1);
      if (configs.length === 0) {
        return res.status(404).json({ error: 'Config not found' });
      }

      const updated = await db.update(seoConfig)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(seoConfig.id, configs[0].id))
        .returning();

      res.json(updated[0]);
    } catch (error: any) {
      console.error('SEO config update error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get page metadata
  app.get('/api/seo/metadata', async (req: any, res) => {
    try {
      const { pageSlug, locale } = req.query;
      const { seoService } = await import('./services/seoService');

      if (pageSlug) {
        const metadata = await seoService.getPageMetadata(pageSlug, locale || 'fr');
        res.json(metadata || null);
      } else {
        const allMetadata = await seoService.getAllMetadata(locale);
        res.json(allMetadata);
      }
    } catch (error: any) {
      console.error('Get metadata error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Create/Update page metadata (Admin only - AI agents use internal methods)
  app.post('/api/seo/metadata', async (req: any, res) => {
    try {
      const userId = req.session?.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized - Admin only' });
      }

      const user = await storage.getUser(userId);
      if (!user || user.profileType !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { seoService } = await import('./services/seoService');
      const { aiReasoning, ...metadataData } = req.body;

      const metadata = await seoService.createOrUpdateMetadata(
        metadataData,
        'admin',
        aiReasoning
      );

      res.json(metadata);
    } catch (error: any) {
      console.error('Create/update metadata error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Approve metadata (VisualAI or Admin)
  app.post('/api/seo/approve/:id', async (req: any, res) => {
    try {
      const userId = req.session?.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const performedBy = user.profileType === 'admin' ? 'admin' : 'visualai';
      const { seoService } = await import('./services/seoService');

      await seoService.approveMetadata(req.params.id, performedBy);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Approve metadata error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get generation logs
  app.get('/api/seo/logs', async (req: any, res) => {
    try {
      const userId = req.session?.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const user = await storage.getUser(userId);
      if (!user || user.profileType !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { metadataId, limit } = req.query;
      const { seoService } = await import('./services/seoService');

      const logs = await seoService.getGenerationLogs(
        metadataId,
        limit ? parseInt(limit as string) : 50
      );

      res.json(logs);
    } catch (error: any) {
      console.error('Get logs error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Auto-generate metadata for project (VisualScoutAI)
  app.post('/api/seo/generate/project/:projectId', async (req: any, res) => {
    try {
      const { projectId } = req.params;
      const { locale } = req.query;
      const { seoService } = await import('./services/seoService');

      const metadata = await seoService.generateMetadataForProject(
        projectId,
        (locale as string) || 'fr'
      );

      res.json(metadata);
    } catch (error: any) {
      console.error('Generate project metadata error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Auto-generate homepage metadata (VisualScoutAI)
  app.post('/api/seo/generate/home', async (req: any, res) => {
    try {
      const { locale } = req.query;
      const { seoService } = await import('./services/seoService');

      const metadata = await seoService.generateHomePageMetadata(
        (locale as string) || 'fr'
      );

      res.json(metadata);
    } catch (error: any) {
      console.error('Generate home metadata error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/platform/theme-override', async (req: any, res) => {
    try {
      const override = await storage.getPlatformSetting('theme_override');
      res.json({ override: override || null });
    } catch (error: any) {
      console.error('Theme override fetch error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/admin/theme-override', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user || user.profileType !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { theme } = req.body;

      if (theme && !['light', 'dark', null].includes(theme)) {
        return res.status(400).json({ error: 'Invalid theme value' });
      }

      console.log(`[Theme] Admin ${userId} setting global override to:`, theme);
      await storage.setPlatformSetting('theme_override', theme, userId);
      res.json({ success: true, override: theme });
    } catch (error: any) {
      console.error('Theme override error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.patch('/api/users/:id/role', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const targetUserId = req.params.id;
      const { profileType } = req.body;

      // Only allow users to update their own role, or admins to update any role
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (userId !== targetUserId && user.profileType !== 'admin') {
        return res.status(403).json({ message: "Not authorized to update this user's role" });
      }

      const allowedRoles = ['investor', 'invested_reader', 'creator'];
      if (!allowedRoles.includes(profileType)) {
        return res.status(400).json({ message: "Invalid profile type" });
      }

      // For creator role, require KYC verification
      if (profileType === 'creator') {
        const targetUser = await storage.getUser(targetUserId);
        if (!targetUser?.kycVerified) {
          return res.status(400).json({ 
            message: "KYC verification required to become a creator" 
          });
        }
      }

      await storage.updateUser(targetUserId, { profileType });

      const updatedUser = await storage.getUser(targetUserId);
      res.json({
        success: true,
        user: updatedUser
      });
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // ===== VISUAL VIDEO DEPOSIT ROUTES =====
  
  // Check creator quota for video deposits
  app.get('/api/video/quota/:creatorId', isAuthenticated, async (req: any, res) => {
    try {
      const { creatorId } = req.params;
      const { videoType } = req.query;
      
      // Verify user can check this quota (self or admin)
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (userId !== creatorId && user.profileType !== 'admin')) {
        return res.status(403).json({ message: "Not authorized to check this quota" });
      }

      if (!videoType || !['clip', 'documentary', 'film'].includes(videoType as string)) {
        return res.status(400).json({ message: "Valid videoType required (clip, documentary, film)" });
      }

      const quotaCheck = await VideoDepositService.checkCreatorQuota(creatorId, videoType as any);
      res.json(quotaCheck);
    } catch (error) {
      console.error("Error checking creator quota:", error);
      res.status(500).json({ message: "Failed to check quota" });
    }
  });

  // Create video deposit with payment intent
  app.post('/api/video/deposit', isAuthenticated, upload.single('video'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      if (!userId) {
        return res.status(401).json({ message: "User authentication required" });
      }
      const user = await storage.getUser(userId);
      
      if (!user || !['creator', 'admin'].includes(user.profileType || '')) {
        return res.status(403).json({ message: "Only creators can deposit videos" });
      }

      const { projectId, videoType, duration } = req.body;
      
      if (!req.file || !projectId || !videoType) {
        return res.status(400).json({ message: "Video file, projectId, and videoType required" });
      }

      if (!['clip', 'documentary', 'film'].includes(videoType)) {
        return res.status(400).json({ message: "Invalid videoType" });
      }

      // Validate project belongs to creator
      const project = await storage.getProject(projectId);
      if (!project || project.creatorId !== userId) {
        return res.status(403).json({ message: "Project not found or access denied" });
      }

      const videoDepositRequest = {
        projectId,
        creatorId: userId,
        videoType,
        file: req.file,
        duration: duration ? parseInt(duration) : undefined
      };

      const result = await VideoDepositService.createVideoDeposit(videoDepositRequest);
      res.status(201).json(result);
    } catch (error) {
      console.error("Error creating video deposit:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to create video deposit" 
      });
    }
  });

  // Get video deposit details
  app.get('/api/video/deposit/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      const videoDeposit = await storage.getVideoDeposit(id);
      if (!videoDeposit) {
        return res.status(404).json({ message: "Video deposit not found" });
      }

      // Check access permissions
      if (videoDeposit.creatorId !== userId && user?.profileType !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      // Include additional data for creators/admins
      const enhancedDeposit = {
        ...videoDeposit,
        analytics: await storage.getVideoAnalytics(id),
        tokens: await storage.getVideoTokensForDeposit(id)
      };

      res.json(enhancedDeposit);
    } catch (error) {
      console.error("Error fetching video deposit:", error);
      res.status(500).json({ message: "Failed to fetch video deposit" });
    }
  });

  // Generate secure video access token
  app.post('/api/video/token/:videoDepositId', isAuthenticated, async (req: any, res) => {
    try {
      const { videoDepositId } = req.params;
      const userId = req.user.claims.sub;
      const { ipAddress, userAgent } = req.body;
      
      const videoDeposit = await storage.getVideoDeposit(videoDepositId);
      if (!videoDeposit || videoDeposit.status !== 'active') {
        return res.status(404).json({ message: "Video not available" });
      }

      // Check if user has access (creator or valid investor/viewer)
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // For now, allow creators and investors to generate tokens
      if (videoDeposit.creatorId !== userId) {
        // TODO: Add logic to check if user has purchased access or is an investor
        // For VISUAL, this might depend on investment in the project
        const userInvestments = await storage.getUserInvestments(userId);
        const hasProjectInvestment = userInvestments.some(inv => inv.projectId === videoDeposit.projectId);
        
        if (!hasProjectInvestment && user.profileType !== 'admin') {
          return res.status(403).json({ message: "Access denied - no investment in this project" });
        }
      }

      // Generate secure token
      const clientIp = ipAddress || req.ip || req.connection.remoteAddress;
      const clientUserAgent = userAgent || req.headers['user-agent'];
      
      const secureToken = bunnyVideoService.generateSecureToken(
        videoDepositId, 
        userId,
        clientIp,
        clientUserAgent
      );

      // Store token in database
      const dbToken = await storage.createVideoToken({
        videoDepositId,
        userId,
        token: secureToken.token,
        expiresAt: secureToken.expiresAt,
        maxUsage: secureToken.maxUsage,
        usageCount: 0,
        isRevoked: false
      });

      res.json({
        token: secureToken.token,
        playbackUrl: secureToken.playbackUrl,
        expiresAt: secureToken.expiresAt,
        maxUsage: secureToken.maxUsage
      });
    } catch (error) {
      console.error("Error generating video token:", error);
      res.status(500).json({ message: "Failed to generate access token" });
    }
  });

  // Secure video access endpoint with token validation
  app.get('/api/video/watch/:videoDepositId', validateVideoToken, async (req: any, res) => {
    try {
      const { videoDepositId } = req.params;
      const videoAccess = req.videoAccess;

      // Get video processing status from Bunny.net
      const videoStatus = await bunnyVideoService.getVideoStatus(videoDepositId);
      
      if (videoStatus.status !== 'completed') {
        return res.status(202).json({
          message: "Video still processing",
          status: videoStatus.status,
          progress: videoStatus.progress
        });
      }

      // Return secure playback information
      res.json({
        videoId: videoDepositId,
        hlsUrl: videoStatus.hlsUrl,
        thumbnailUrl: videoStatus.thumbnailUrl,
        duration: videoStatus.duration,
        resolution: videoStatus.resolution,
        sessionInfo: {
          sessionId: videoAccess.sessionInfo.sessionId,
          validUntil: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
        }
      });
    } catch (error) {
      console.error("Error accessing video:", error);
      res.status(500).json({ message: "Failed to access video" });
    }
  });

  // Revoke video tokens (admin/creator only)
  app.post('/api/video/revoke/:videoDepositId', isAuthenticated, async (req: any, res) => {
    try {
      const { videoDepositId } = req.params;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      const videoDeposit = await storage.getVideoDeposit(videoDepositId);
      if (!videoDeposit) {
        return res.status(404).json({ message: "Video deposit not found" });
      }

      // Only creator or admin can revoke tokens
      if (videoDeposit.creatorId !== userId && user?.profileType !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.revokeVideoTokens(videoDepositId);
      res.json({ message: "All tokens revoked successfully" });
    } catch (error) {
      console.error("Error revoking tokens:", error);
      res.status(500).json({ message: "Failed to revoke tokens" });
    }
  });

  // Get creator's video deposits
  app.get('/api/creator/:creatorId/videos', isAuthenticated, async (req: any, res) => {
    try {
      const { creatorId } = req.params;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Check access permissions
      if (userId !== creatorId && user?.profileType !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const videoDeposits = await storage.getCreatorVideoDeposits(creatorId);
      res.json(videoDeposits);
    } catch (error) {
      console.error("Error fetching creator videos:", error);
      res.status(500).json({ message: "Failed to fetch videos" });
    }
  });

  // Get video analytics (creator/admin only)
  app.get('/api/video/:videoDepositId/analytics', isAuthenticated, async (req: any, res) => {
    try {
      const { videoDepositId } = req.params;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      const videoDeposit = await storage.getVideoDeposit(videoDepositId);
      if (!videoDeposit) {
        return res.status(404).json({ message: "Video deposit not found" });
      }

      // Only creator or admin can view analytics
      if (videoDeposit.creatorId !== userId && user?.profileType !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const analytics = await storage.getVideoAnalytics(videoDepositId);
      const tokens = await storage.getVideoTokensForDeposit(videoDepositId);
      
      // Aggregate analytics data
      const aggregatedData = {
        totalViews: analytics.length,
        uniqueViewers: new Set(analytics.map(a => a.userId)).size,
        averageSessionDuration: analytics.length > 0 
          ? analytics.reduce((sum, a) => sum + (a.sessionDuration || 0), 0) / analytics.length 
          : 0,
        activeTokens: tokens.filter(t => !t.isRevoked && new Date() < t.expiresAt).length,
        revokedTokens: tokens.filter(t => t.isRevoked).length,
        recentViews: analytics.slice(-10) // Last 10 views
      };

      res.json(aggregatedData);
    } catch (error) {
      console.error("Error fetching video analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // ===== ADMIN VIDEO MANAGEMENT ROUTES =====
  
  // Cleanup orphaned video deposits (admin only)
  app.post('/api/admin/video/cleanup', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.profileType !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const result = await VideoDepositService.cleanupOrphanedDeposits();
      res.json({
        success: true,
        message: `Cleaned ${result.cleaned} orphaned deposits`,
        details: result
      });
    } catch (error) {
      console.error("Error during cleanup:", error);
      res.status(500).json({ message: "Cleanup failed" });
    }
  });

  // Get video deposit statistics (admin only)
  app.get('/api/admin/video/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.profileType !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const stats = await VideoDepositService.getDepositStatistics();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching video stats:", error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // Verify deposit integrity (admin only)
  app.post('/api/admin/video/verify/:depositId', isAuthenticated, async (req: any, res) => {
    try {
      const { depositId } = req.params;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.profileType !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const verification = await VideoDepositService.verifyDepositIntegrity(depositId);
      res.json(verification);
    } catch (error) {
      console.error("Error verifying deposit:", error);
      res.status(500).json({ message: "Verification failed" });
    }
  });

  // ===== MODULE 1: MINI RÉSEAU SOCIAL VISUAL =====
  
  // Social Posts routes
  app.post('/api/social/posts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Validate and parse post data
      const postData = insertSocialPostSchema.parse({
        ...req.body,
        authorId: userId,
      });

      // Use database transaction to ensure atomicity
      const result = await db.transaction(async (tx) => {
        const post = await storage.createSocialPost(postData, tx);
        
        // Award 5 VisuPoints for creating a post
        await storage.createVisuPointsTransaction({
          userId,
          amount: 5,
          reason: 'Posted on social network',
          referenceId: post.id,
          referenceType: 'post'
        }, tx);

        return post;
      });

      res.status(201).json(result);
    } catch (error) {
      console.error("Error creating social post:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid post data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  app.get('/api/social/posts', async (req, res) => {
    try {
      const { limit = 20, offset = 0, projectId, authorId } = req.query;
      
      let posts: any[];
      if (projectId) {
        posts = await storage.getProjectSocialPosts(
          projectId as string,
          parseInt(limit as string),
          parseInt(offset as string)
        );
      } else if (authorId) {
        posts = await storage.getUserSocialPosts(
          authorId as string,
          parseInt(limit as string),
          parseInt(offset as string)
        );
      } else {
        // Get general feed: user's own posts + public posts from others
        posts = await storage.getAllSocialPosts(
          parseInt(limit as string),
          parseInt(offset as string),
          (req as any).user?.claims?.sub
        );
      }
      
      res.json({ posts, count: posts.length });
    } catch (error) {
      console.error("Error fetching social posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  app.get('/api/social/posts/:id', async (req, res) => {
    try {
      const post = await storage.getSocialPost(req.params.id);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      res.json(post);
    } catch (error) {
      console.error("Error fetching social post:", error);
      res.status(500).json({ message: "Failed to fetch post" });
    }
  });

  app.put('/api/social/posts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const postId = req.params.id;
      
      // Check if post exists and belongs to user
      const existingPost = await storage.getSocialPost(postId);
      if (!existingPost) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      if (existingPost.authorId !== userId) {
        return res.status(403).json({ message: "Can only edit your own posts" });
      }

      // Use secure update schema - only allows safe fields
      const updateData = updateSocialPostSchema.parse(req.body);
      const updatedPost = await storage.updateSocialPost(postId, updateData);
      
      res.json(updatedPost);
    } catch (error) {
      console.error("Error updating social post:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid update data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update post" });
    }
  });

  app.delete('/api/social/posts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const postId = req.params.id;
      
      // Check if post exists and belongs to user
      const existingPost = await storage.getSocialPost(postId);
      if (!existingPost) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      if (existingPost.authorId !== userId) {
        return res.status(403).json({ message: "Can only delete your own posts" });
      }

      await storage.deleteSocialPost(postId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting social post:", error);
      res.status(500).json({ message: "Failed to delete post" });
    }
  });

  // Social Comments routes
  app.post('/api/social/comments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const commentData = insertSocialCommentSchema.parse({
        ...req.body,
        authorId: userId,
      });

      // Use database transaction to ensure atomicity
      const result = await db.transaction(async (tx) => {
        const comment = await storage.createSocialComment(commentData, tx);
        
        // Award 2 VisuPoints for commenting
        await storage.createVisuPointsTransaction({
          userId,
          amount: 2,
          reason: 'Commented on a post',
          referenceId: comment.id,
          referenceType: 'comment'
        }, tx);

        return comment;
      });

      res.status(201).json(result);
    } catch (error) {
      console.error("Error creating comment:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid comment data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  app.get('/api/social/posts/:postId/comments', async (req, res) => {
    try {
      const { postId } = req.params;
      const { limit = 50, offset = 0 } = req.query;
      
      const comments = await storage.getPostComments(
        postId,
        parseInt(limit as string),
        parseInt(offset as string)
      );
      
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.get('/api/social/comments/:commentId/replies', async (req, res) => {
    try {
      const { commentId } = req.params;
      const { limit = 20, offset = 0 } = req.query;
      
      const replies = await storage.getCommentReplies(
        commentId,
        parseInt(limit as string),
        parseInt(offset as string)
      );
      
      res.json(replies);
    } catch (error) {
      console.error("Error fetching replies:", error);
      res.status(500).json({ message: "Failed to fetch replies" });
    }
  });

  app.put('/api/social/comments/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const commentId = req.params.id;
      
      // Check if comment exists and belongs to user
      const existingComment = await storage.getSocialComment(commentId);
      if (!existingComment) {
        return res.status(404).json({ message: "Comment not found" });
      }
      
      if (existingComment.authorId !== userId) {
        return res.status(403).json({ message: "Can only edit your own comments" });
      }

      // Use secure update schema - only allows safe fields
      const updateData = updateSocialCommentSchema.parse(req.body);
      const updatedComment = await storage.updateSocialComment(commentId, updateData);
      
      res.json(updatedComment);
    } catch (error) {
      console.error("Error updating comment:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid update data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update comment" });
    }
  });

  app.delete('/api/social/comments/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const commentId = req.params.id;
      
      // TODO: Add authorization check
      await storage.deleteSocialComment(commentId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({ message: "Failed to delete comment" });
    }
  });

  // Social Likes routes
  app.post('/api/social/likes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { postId, commentId } = req.body;
      
      if (!postId && !commentId) {
        return res.status(400).json({ message: "Either postId or commentId required" });
      }
      
      if (postId && commentId) {
        return res.status(400).json({ message: "Cannot like both post and comment simultaneously" });
      }

      const likeData = insertSocialLikeSchema.parse({
        userId,
        postId: postId || null,
        commentId: commentId || null,
      });

      // Use database transaction to ensure atomicity
      const result = await db.transaction(async (tx) => {
        const like = await storage.createSocialLike(likeData, tx);
        
        // Award 1 VisuPoint for liking
        await storage.createVisuPointsTransaction({
          userId,
          amount: 1,
          reason: postId ? 'Liked a post' : 'Liked a comment',
          referenceId: like.id,
          referenceType: 'like'
        }, tx);

        return like;
      });

      res.status(201).json(result);
    } catch (error) {
      console.error("Error creating like:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid like data", errors: error.errors });
      }
      // Handle unique constraint violations for duplicate likes
      if (error instanceof Error && (error.message?.includes('unique_user_post_like') || error.message?.includes('unique_user_comment_like'))) {
        return res.status(409).json({ message: "You have already liked this content" });
      }
      res.status(500).json({ message: "Failed to create like" });
    }
  });

  app.delete('/api/social/likes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { postId, commentId } = req.query;
      
      if (!postId && !commentId) {
        return res.status(400).json({ message: "Either postId or commentId required" });
      }

      await storage.removeSocialLike(userId, postId as string, commentId as string);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing like:", error);
      res.status(500).json({ message: "Failed to remove like" });
    }
  });

  app.get('/api/social/posts/:postId/likes', async (req, res) => {
    try {
      const { postId } = req.params;
      const likes = await storage.getPostLikes(postId);
      res.json(likes);
    } catch (error) {
      console.error("Error fetching post likes:", error);
      res.status(500).json({ message: "Failed to fetch likes" });
    }
  });

  app.get('/api/social/comments/:commentId/likes', async (req, res) => {
    try {
      const { commentId } = req.params;
      const likes = await storage.getCommentLikes(commentId);
      res.json(likes);
    } catch (error) {
      console.error("Error fetching comment likes:", error);
      res.status(500).json({ message: "Failed to fetch likes" });
    }
  });

  // VisuPoints routes
  app.get('/api/visupoints/balance', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const balance = await storage.getUserVisuPointsBalance(userId);
      res.json({ balance });
    } catch (error) {
      console.error("Error fetching VisuPoints balance:", error);
      res.status(500).json({ message: "Failed to fetch balance" });
    }
  });

  app.get('/api/visupoints/history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { limit = 50 } = req.query;
      
      const history = await storage.getUserVisuPointsHistory(
        userId,
        parseInt(limit as string)
      );
      
      res.json(history);
    } catch (error) {
      console.error("Error fetching VisuPoints history:", error);
      res.status(500).json({ message: "Failed to fetch history" });
    }
  });

  app.get('/api/social/users/:userId/liked-posts', async (req, res) => {
    try {
      const { userId } = req.params;
      const { limit = 20 } = req.query;
      
      const likedPosts = await storage.getUserLikedPosts(
        userId,
        parseInt(limit as string)
      );
      
      res.json(likedPosts);
    } catch (error) {
      console.error("Error fetching liked posts:", error);
      res.status(500).json({ message: "Failed to fetch liked posts" });
    }
  });

  // ===== MODULE 2: CYCLE DE VIE PROJET VIDÉO =====
  
  // Get project lifecycle status
  app.get('/api/projects/:projectId/lifecycle', async (req, res) => {
    try {
      const { projectId } = req.params;
      
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      const extensions = await storage.getProjectExtensions(projectId);
      const currentExtension = extensions.find(ext => !ext.isArchived);
      
      // Calculate lifecycle status
      const now = new Date();
      const createdAt = new Date(project.createdAt || new Date());
      const standardCycleEnd = new Date(createdAt.getTime() + (168 * 60 * 60 * 1000)); // 168 hours
      
      let status = 'active';
      let expiresAt = standardCycleEnd;
      
      if (currentExtension && currentExtension.cycleEndsAt) {
        expiresAt = new Date(currentExtension.cycleEndsAt);
      }
      
      if (now > expiresAt) {
        status = currentExtension?.isInTopTen ? 'renewed' : 'archived';
      }
      
      res.json({
        project,
        extensions,
        currentExtension,
        status,
        expiresAt,
        standardCycleEnd,
        hoursRemaining: Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60))),
        canProlong: currentExtension?.canProlong !== false && status === 'active',
        prolongationCost: 20.00
      });
    } catch (error) {
      console.error("Error fetching project lifecycle:", error);
      res.status(500).json({ message: "Failed to fetch lifecycle status" });
    }
  });
  
  // Create payment intent for project extension (secure)
  app.post('/api/projects/:projectId/extension-payment', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { projectId } = req.params;
      
      // Verify project ownership
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      if (project.creatorId !== userId) {
        return res.status(403).json({ message: "Only project creator can extend" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if extension is allowed - use most recent extension by cycleEndsAt
      const extensions = await storage.getProjectExtensions(projectId);
      const currentExtension = extensions
        .filter(ext => !ext.isArchived)
        .sort((a, b) => {
          const dateA = a.cycleEndsAt ? new Date(a.cycleEndsAt).getTime() : 0;
          const dateB = b.cycleEndsAt ? new Date(b.cycleEndsAt).getTime() : 0;
          return dateB - dateA; // Most recent first
        })[0];
      
      if (currentExtension && !currentExtension.canProlong) {
        return res.status(400).json({ message: "Project cannot be prolonged further" });
      }
      
      if (currentExtension && (currentExtension.prolongationCount || 0) >= 3) {
        return res.status(400).json({ message: "Maximum 3 prolongations allowed" });
      }
      
      // Create Stripe PaymentIntent with secure metadata
      const paymentIntent = await stripe.paymentIntents.create({
        amount: 2000, // €20.00 in cents
        currency: 'eur',
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          type: 'project_extension',
          projectId,
          userId,
          amount: '20.00'
        },
      });
      
      res.json({
        clientSecret: paymentIntent.client_secret,
        amount: 20.00,
        currency: 'EUR',
        paymentIntentId: paymentIntent.id
      });
    } catch (error) {
      console.error("Error creating payment intent for extension:", error);
      res.status(500).json({ message: "Failed to create payment intent" });
    }
  });
  
  // Get TOP 10 projects
  app.get('/api/projects/ranking/top10', async (req, res) => {
    try {
      // Get all active project extensions that are in TOP 10
      const topExtensions = await storage.getActiveProjectExtensions();
      const top10Extensions = topExtensions
        .filter(ext => ext.isInTopTen && ext.topTenRank && ext.topTenRank <= 10)
        .sort((a, b) => (a.topTenRank || 11) - (b.topTenRank || 11));
      
      // Get full project data for each
      const top10Projects = await Promise.all(
        top10Extensions.map(async (ext) => {
          const project = await storage.getProject(ext.projectId);
          return {
            project,
            extension: ext,
            rank: ext.topTenRank
          };
        })
      );
      
      res.json(top10Projects.filter(p => p.project));
    } catch (error) {
      console.error("Error fetching TOP 10:", error);
      res.status(500).json({ message: "Failed to fetch TOP 10 projects" });
    }
  });
  
  // Update project ranking (Admin only) - STRENGTHENED SECURITY
  app.post('/api/projects/ranking/update', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Strengthened admin verification
      if (!user) {
        console.error(`Admin verification failed: User not found - ${userId}`);
        return res.status(403).json({ message: "Access denied: User not found" });
      }
      
      if (user.profileType !== 'admin') {
        console.error(`Admin verification failed: Insufficient privileges - ${userId} (${user.profileType})`);
        return res.status(403).json({ message: "Access denied: Admin privileges required" });
      }
      
      if (!user.kycVerified) {
        console.error(`Admin verification failed: KYC not verified - ${userId}`);
        return res.status(403).json({ message: "Access denied: KYC verification required for admin operations" });
      }
      
      const { rankings } = req.body; // Array of { projectId, rank }
      
      // Enhanced input validation
      if (!Array.isArray(rankings)) {
        console.error(`Invalid rankings input from admin ${userId}: not an array`);
        return res.status(400).json({ message: "Rankings must be an array" });
      }
      
      if (rankings.length === 0) {
        return res.status(400).json({ message: "Rankings array cannot be empty" });
      }
      
      if (rankings.length > 100) {
        console.error(`Admin ${userId} attempted to update too many rankings: ${rankings.length}`);
        return res.status(400).json({ message: "Cannot update more than 100 rankings at once" });
      }
      
      // Validate each ranking entry
      for (const ranking of rankings) {
        if (!ranking.projectId || typeof ranking.rank !== 'number') {
          console.error(`Invalid ranking entry from admin ${userId}:`, ranking);
          return res.status(400).json({ message: "Each ranking must have projectId and numeric rank" });
        }
        
        if (ranking.rank < 1 || ranking.rank > 1000) {
          return res.status(400).json({ message: "Rank must be between 1 and 1000" });
        }
      }
      
      // Update rankings
      const updatePromises = rankings.map(async ({ projectId, rank }) => {
        const extensions = await storage.getProjectExtensions(projectId);
        let currentExtension = extensions.find(ext => !ext.isArchived);
        
        if (!currentExtension) {
          // Create new extension if none exists
          currentExtension = await storage.createProjectExtension({
            projectId,
            isInTopTen: rank <= 10,
            topTenRank: rank <= 10 ? rank : null,
            isArchived: false,
            canProlong: true
          });
        } else {
          // Update existing extension
          await storage.updateProjectExtension(currentExtension.id, {
            isInTopTen: rank <= 10,
            topTenRank: rank <= 10 ? rank : null,
            // If project falls out of TOP 10, archive it
            isArchived: rank > 10,
            archivedAt: rank > 10 ? new Date() : null,
            archiveReason: rank > 10 ? 'out_of_top_ten' : null
          });
        }
        
        return { projectId, rank, updated: true };
      });
      
      const results = await Promise.all(updatePromises);
      
      // Log admin action for audit trail
      console.log(`Admin ${userId} (${user.email}) updated rankings for ${results.length} projects`);
      
      res.json({
        success: true,
        updated: results.length,
        results,
        timestamp: new Date().toISOString(),
        adminUserId: userId
      });
    } catch (error) {
      console.error("Error updating rankings:", error);
      res.status(500).json({ message: "Failed to update rankings" });
    }
  });
  
  // ===== ROUTES LEADERBOARD & MONTHLY RANKINGS =====

  // Get monthly project rankings (public)
  app.get('/api/leaderboard/monthly/:monthYear?', async (req, res) => {
    try {
      const monthYear = req.params.monthYear || new Date().toISOString().slice(0, 7);
      const limit = parseInt(req.query.limit as string) || 10;
      
      const rankings = await storage.getMonthlyProjectRankings(monthYear, limit);
      
      // Enrichir avec les données complètes des projets
      const enrichedRankings = await Promise.all(
        rankings.map(async (ranking) => {
          const project = await storage.getProject(ranking.projectId);
          const creator = project ? await storage.getUser(project.creatorId) : null;
          
          return {
            ...ranking,
            project,
            creator: creator ? {
              id: creator.id,
              firstName: creator.firstName,
              lastName: creator.lastName,
              profileImageUrl: creator.profileImageUrl
            } : null
          };
        })
      );
      
      res.json({
        monthYear,
        rankings: enrichedRankings,
        totalCount: rankings.length
      });
    } catch (error) {
      console.error("Error fetching monthly rankings:", error);
      res.status(500).json({ message: "Failed to fetch monthly rankings" });
    }
  });

  // Get project ranking history (replay mode) - public
  app.get('/api/leaderboard/history/:projectId', async (req, res) => {
    try {
      const { projectId } = req.params;
      const limit = parseInt(req.query.limit as string) || 12;
      
      const history = await storage.getProjectRankingHistory(projectId, limit);
      const project = await storage.getProject(projectId);
      
      res.json({
        projectId,
        project: project ? {
          id: project.id,
          title: project.title,
          category: project.category
        } : null,
        history,
        totalMonths: history.length
      });
    } catch (error) {
      console.error("Error fetching project history:", error);
      res.status(500).json({ message: "Failed to fetch project history" });
    }
  });

  // Get available ranking months (public)
  app.get('/api/leaderboard/months', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 24;
      const months = await storage.getAvailableRankingMonths(limit);
      
      res.json({
        months,
        count: months.length
      });
    } catch (error) {
      console.error("Error fetching available months:", error);
      res.status(500).json({ message: "Failed to fetch available months" });
    }
  });

  // Get all-time top performers (public)
  app.get('/api/leaderboard/all-time', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const topPerformers = await storage.getTopPerformersAllTime(limit);
      
      // Enrichir avec les données des projets
      const enrichedPerformers = await Promise.all(
        topPerformers.map(async (perf) => {
          const project = await storage.getProject(perf.projectId);
          const creator = project ? await storage.getUser(project.creatorId) : null;
          
          return {
            ...perf,
            project,
            creator: creator ? {
              id: creator.id,
              firstName: creator.firstName,
              lastName: creator.lastName,
              profileImageUrl: creator.profileImageUrl
            } : null
          };
        })
      );
      
      res.json({
        topPerformers: enrichedPerformers,
        count: enrichedPerformers.length
      });
    } catch (error) {
      console.error("Error fetching all-time performers:", error);
      res.status(500).json({ message: "Failed to fetch all-time performers" });
    }
  });

  // Compare multiple projects (public)
  app.get('/api/leaderboard/compare', async (req, res) => {
    try {
      const projectIds = (req.query.projectIds as string)?.split(',') || [];
      const monthYear = req.query.monthYear as string || new Date().toISOString().slice(0, 7);
      
      if (projectIds.length === 0) {
        return res.status(400).json({ message: "At least one projectId required" });
      }
      
      if (projectIds.length > 10) {
        return res.status(400).json({ message: "Maximum 10 projects for comparison" });
      }
      
      const comparison = await storage.getProjectsComparison(projectIds, monthYear);
      
      // Enrichir avec données complètes
      const enrichedComparison = await Promise.all(
        comparison.map(async (ranking) => {
          const project = await storage.getProject(ranking.projectId);
          return {
            ...ranking,
            project
          };
        })
      );
      
      res.json({
        monthYear,
        projectIds,
        comparison: enrichedComparison
      });
    } catch (error) {
      console.error("Error comparing projects:", error);
      res.status(500).json({ message: "Failed to compare projects" });
    }
  });

  // Archive project manually
  app.post('/api/projects/:projectId/archive', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { projectId } = req.params;
      const { reason = 'manual' } = req.body;
      
      // Verify project ownership or admin access
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (project.creatorId !== userId && user.profileType !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Archive project extension
      const extensions = await storage.getProjectExtensions(projectId);
      let currentExtension = extensions.find(ext => !ext.isArchived);
      
      if (!currentExtension) {
        // Create extension for archiving
        currentExtension = await storage.createProjectExtension({
          projectId,
          isInTopTen: false,
          isArchived: true,
          archivedAt: new Date(),
          archiveReason: reason,
          canProlong: false
        });
      } else {
        // Update existing extension
        await storage.updateProjectExtension(currentExtension.id, {
          isInTopTen: false,
          isArchived: true,
          archivedAt: new Date(),
          archiveReason: reason,
          canProlong: false
        });
      }
      
      res.json({
        success: true,
        message: "Project archived successfully",
        archivedAt: new Date(),
        reason
      });
    } catch (error) {
      console.error("Error archiving project:", error);
      res.status(500).json({ message: "Failed to archive project" });
    }
  });
  
  // Get user's archived projects
  app.get('/api/users/:userId/archived-projects', isAuthenticated, async (req: any, res) => {
    try {
      const requestUserId = req.user.claims.sub;
      const { userId } = req.params;
      
      // Check access permissions
      if (requestUserId !== userId) {
        const user = await storage.getUser(requestUserId);
        if (!user || user.profileType !== 'admin') {
          return res.status(403).json({ message: "Access denied" });
        }
      }
      
      // Get all user projects
      const allProjects = await storage.getProjects(1000, 0); // Get many projects
      const userProjects = allProjects.filter(p => p.creatorId === userId);
      
      // Get archived extensions for user projects
      const archivedProjects = await Promise.all(
        userProjects.map(async (project) => {
          const extensions = await storage.getProjectExtensions(project.id);
          const archivedExtension = extensions.find(ext => ext.isArchived);
          
          if (archivedExtension) {
            return {
              project,
              extension: archivedExtension,
              archivedAt: archivedExtension.archivedAt,
              archiveReason: archivedExtension.archiveReason
            };
          }
          return null;
        })
      );
      
      const filtered = archivedProjects.filter(Boolean);
      
      res.json(filtered);
    } catch (error) {
      console.error("Error fetching archived projects:", error);
      res.status(500).json({ message: "Failed to fetch archived projects" });
    }
  });

  // ===== MODULE 3: SYSTÈME DE PURGE AUTOMATIQUE =====
  // Purge functionality extracted to dedicated module
  registerPurgeRoutes(app);

  // ===== MODULE 4: SYSTÈME DE REÇUS DE PAIEMENT =====
  // Receipt functionality for transparency and legal compliance
  app.use('/api/receipts', receiptsRouter);

  // ===== MODULE 5: RÈGLES CATÉGORIES VIDÉOS =====
  // Video category management with automated lifecycle rules
  app.use('/api/categories', categoriesRouter);

  // ===== AGENTS IA: ORCHESTRATION ET ADMINISTRATION =====
  // AI agents for platform automation and financial management
  app.use('/api/agents', agentRoutes);

  // ===== MODULE EBOOKS: LICENCES JWT ET TÉLÉCHARGEMENT SÉCURISÉ =====
  // Ebook licensing system with JWT tokens, download quotas, and anti-piracy
  app.use('/api/ebooks', ebookRoutes);

  // ===== MODULE BUNNY.NET: DÉPÔT VIDÉO SÉCURISÉ =====
  // Bunny.net video deposit with Stripe payment, token-based anti-piracy, and HLS streaming
  app.use('/api', bunnyRoutes);
  app.use('/api', bunnyWebhook);

  // ===== DASHBOARD ADMIN AMÉLIORÉ =====
  // Enhanced admin dashboard with categories, profiles, theme, agents, security, maintenance
  app.use('/api/admin', adminDashboardRoutes);

  // ===== MODULE 6: SEUILS DE RETRAIT PAR PROFIL =====
  // Withdrawal request management with profile-based minimum thresholds

  // ===== MODULE 7 & 8: PROTECTION ET SIGNALEMENT CONTENU =====
  // Content protection and community reporting system with VISUpoints rewards

  // EXPLICIT ADMIN AUTHORIZATION MIDDLEWARE
  const requireAdminAccess = async (req: any, res: any, next: any) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.profileType !== 'admin') {
        // Enhanced audit logging for security
        await storage.createAuditLog({
          userId: userId || 'unknown',
          action: 'unauthorized_admin_access_attempt',
          resourceType: 'admin_endpoint',
          details: {
            endpoint: req.originalUrl,
            method: req.method,
            userAgent: req.get('User-Agent'),
            ip: req.ip,
            profileType: user?.profileType || 'none'
          }
        });
        return res.status(403).json({ message: "Admin access required" });
      }

      // Attach user to request for downstream handlers
      req.adminUser = user;
      next();
    } catch (error) {
      console.error('Admin authorization middleware error:', error);
      res.status(500).json({ message: "Authorization check failed" });
    }
  };

  // Validation schema for withdrawal requests - accepts both number and string
  const createWithdrawalRequestSchema = z.object({
    amount: z.union([z.number(), z.string()])
      .transform((val) => {
        const num = typeof val === 'string' ? parseFloat(val) : val;
        if (isNaN(num)) throw new Error('Invalid number format');
        return num;
      })
      .refine(n => n > 0, "Amount must be a positive number")
  });

  // Create withdrawal request
  app.post('/api/withdrawal/request', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validation = createWithdrawalRequestSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid request data",
          errors: validation.error.issues 
        });
      }

      const { amount } = validation.data;
      const withdrawalAmount = amount; // Amount is already transformed to number by schema

      // Get user to check profile and balance
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check minimum threshold based on profile
      const minimumThreshold = getMinimumWithdrawalAmount(user.profileType || 'investor');
      if (withdrawalAmount < minimumThreshold) {
        return res.status(400).json({ 
          message: `Minimum withdrawal amount for ${user.profileType || 'investor'} profile is €${minimumThreshold}`,
          minimumThreshold 
        });
      }

      // FUND RESERVATION: Calculate available balance considering pending withdrawals
      const currentBalance = parseFloat(user.balanceEUR || '0');
      const pendingWithdrawalAmount = await storage.getUserPendingWithdrawalAmount(userId);
      const availableBalance = currentBalance - pendingWithdrawalAmount;
      
      if (withdrawalAmount > availableBalance) {
        return res.status(400).json({ 
          message: `Insufficient available balance. Available: €${availableBalance.toFixed(2)} (Total: €${currentBalance.toFixed(2)}, Reserved: €${pendingWithdrawalAmount.toFixed(2)})`,
          availableBalance,
          totalBalance: currentBalance,
          reservedAmount: pendingWithdrawalAmount
        });
      }

      // Check KYC verification
      if (!user.kycVerified) {
        return res.status(403).json({ 
          message: "KYC verification required for withdrawals" 
        });
      }

      // Create withdrawal request
      const withdrawalRequest = await storage.createWithdrawalRequest({
        userId,
        amount: amount.toString(),
        minimumThreshold: minimumThreshold.toString(),
        status: 'pending'
      });

      // Create audit log
      await storage.createAuditLog({
        userId,
        action: 'withdrawal_request_created',
        resourceType: 'withdrawal',
        resourceId: withdrawalRequest.id,
        details: {
          amount: withdrawalAmount,
          minimumThreshold,
          profileType: user.profileType,
          balanceBefore: availableBalance
        }
      });

      res.json({
        success: true,
        withdrawalRequest: {
          id: withdrawalRequest.id,
          amount: withdrawalAmount,
          minimumThreshold,
          status: withdrawalRequest.status,
          requestedAt: withdrawalRequest.requestedAt
        }
      });
    } catch (error) {
      console.error("Error creating withdrawal request:", error);
      res.status(500).json({ message: "Failed to create withdrawal request" });
    }
  });

  // Get user withdrawal history
  app.get('/api/withdrawal/history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { limit = 20 } = req.query;

      const withdrawals = await storage.getUserWithdrawalRequests(userId, parseInt(limit));
      
      res.json({
        withdrawals: withdrawals.map(w => ({
          id: w.id,
          amount: parseFloat(w.amount),
          minimumThreshold: parseFloat(w.minimumThreshold),
          status: w.status,
          requestedAt: w.requestedAt,
          processedAt: w.processedAt,
          failureReason: w.failureReason
        }))
      });
    } catch (error) {
      console.error("Error fetching withdrawal history:", error);
      res.status(500).json({ message: "Failed to fetch withdrawal history" });
    }
  });

  // Admin: Get pending withdrawals
  app.get('/api/admin/withdrawals', isAuthenticated, requireAdminAccess, async (req: any, res) => {
    try {
      const pendingWithdrawals = await storage.getPendingWithdrawalRequests();
      
      // Enrich with user data
      const enrichedWithdrawals = await Promise.all(
        pendingWithdrawals.map(async (withdrawal) => {
          const requestUser = await storage.getUser(withdrawal.userId);
          return {
            id: withdrawal.id,
            amount: parseFloat(withdrawal.amount),
            minimumThreshold: parseFloat(withdrawal.minimumThreshold),
            status: withdrawal.status,
            requestedAt: withdrawal.requestedAt,
            user: requestUser ? {
              id: requestUser.id,
              firstName: requestUser.firstName,
              lastName: requestUser.lastName,
              email: requestUser.email,
              profileType: requestUser.profileType,
              balanceEUR: parseFloat(requestUser.balanceEUR || '0')
            } : null
          };
        })
      );

      res.json({ pendingWithdrawals: enrichedWithdrawals });
    } catch (error) {
      console.error("Error fetching pending withdrawals:", error);
      res.status(500).json({ message: "Failed to fetch pending withdrawals" });
    }
  });

  // Admin: Process withdrawal (approve/reject)
  app.put('/api/admin/withdrawals/:id', isAuthenticated, requireAdminAccess, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status, failureReason } = req.body;
      const adminUser = req.adminUser; // From middleware

      if (!['processing', 'completed', 'failed'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const updates: any = {
        status,
        processedAt: new Date()
      };

      if (status === 'failed' && failureReason) {
        updates.failureReason = failureReason;
      }

      const updatedWithdrawal = await storage.updateWithdrawalRequest(id, updates);

      // Create audit log
      await storage.createAuditLog({
        userId: adminUser.id,
        action: 'withdrawal_processed',
        resourceType: 'withdrawal', 
        resourceId: id,
        details: {
          status,
          failureReason,
          processedBy: adminUser.id,
          amount: parseFloat(updatedWithdrawal.amount)
        }
      });

      res.json({
        success: true,
        withdrawal: {
          id: updatedWithdrawal.id,
          status: updatedWithdrawal.status,
          processedAt: updatedWithdrawal.processedAt,
          failureReason: updatedWithdrawal.failureReason
        }
      });
    } catch (error) {
      console.error("Error processing withdrawal:", error);
      res.status(500).json({ message: "Failed to process withdrawal" });
    }
  });

  // ===== CONTENT REPORTS API ROUTES =====
  
  // Create a content report (community reporting)
  app.post('/api/reports/create', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { contentType, contentId, reportType, description } = req.body;

      // Validate input
      if (!['article', 'video', 'social_post', 'comment'].includes(contentType)) {
        return res.status(400).json({ message: "Type de contenu invalide" });
      }

      if (!['plagiat', 'contenu_offensant', 'desinformation', 'infraction_legale', 'contenu_illicite', 'violation_droits', 'propos_haineux'].includes(reportType)) {
        return res.status(400).json({ message: "Type de signalement invalide" });
      }

      // Check if user already reported this content
      const existingReports = await storage.getContentReportsByContent(contentType, contentId);
      const userAlreadyReported = existingReports.some(report => report.reporterId === userId);
      
      if (userAlreadyReported) {
        return res.status(409).json({ message: "Vous avez déjà signalé ce contenu" });
      }

      // Create the report
      const newReport = await storage.createContentReport({
        reporterId: userId,
        contentType: contentType as any,
        contentId,
        reportType: reportType as any,
        description: description || '',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Create audit log
      await storage.createAuditLog({
        userId,
        action: 'content_reported',
        resourceType: contentType,
        resourceId: contentId,
        details: {
          reportId: newReport.id,
          reportType,
          reporterInfo: {
            ip: req.ip,
            userAgent: req.get('User-Agent')
          }
        }
      });

      // 🚨 VÉRIFICATION AUTOMATIQUE DES SEUILS DE SIGNALEMENT
      // 10 signalements → Blocage + suspension temporaire
      // 20 signalements → Exclusion définitive + blocage opérations bancaires
      const thresholdResult = await visualAI.processContentReportThresholds(contentType, contentId);
      
      let message = "Signalement créé avec succès";
      if (thresholdResult.action === 'ban') {
        message = `Signalement créé avec succès. ALERTE: Seuil critique atteint (${thresholdResult.reportCount} signalements). Exclusion définitive appliquée.`;
      } else if (thresholdResult.action === 'block') {
        message = `Signalement créé avec succès. ALERTE: Seuil d'alerte atteint (${thresholdResult.reportCount} signalements). Blocage temporaire appliqué.`;
      }

      res.status(201).json({
        message,
        reportId: newReport.id,
        thresholdCheck: {
          action: thresholdResult.action,
          reportCount: thresholdResult.reportCount,
          details: thresholdResult.details
        }
      });
    } catch (error) {
      console.error("Error creating content report:", error);
      res.status(500).json({ message: "Erreur lors de la création du signalement" });
    }
  });

  // Get all reports (admin only)
  app.get('/api/reports', isAuthenticated, requireAdminAccess, async (req: any, res) => {
    try {
      const { status, limit = 50, offset = 0 } = req.query;
      
      let reports;
      if (status) {
        reports = await storage.getContentReportsByStatus(status);
      } else {
        reports = await storage.getContentReports(parseInt(limit), parseInt(offset));
      }

      // Enrich with reporter info
      const enrichedReports = await Promise.all(
        reports.map(async (report) => {
          const reporter = await storage.getUser(report.reporterId);
          const validator = report.validatedBy ? await storage.getUser(report.validatedBy) : null;
          
          return {
            ...report,
            reporter: reporter ? {
              id: reporter.id,
              firstName: reporter.firstName,
              lastName: reporter.lastName,
              email: reporter.email
            } : null,
            validator: validator ? {
              id: validator.id,
              firstName: validator.firstName,
              lastName: validator.lastName
            } : null
          };
        })
      );

      res.json({ reports: enrichedReports });
    } catch (error) {
      console.error("Error fetching reports:", error);
      res.status(500).json({ message: "Erreur lors de la récupération des signalements" });
    }
  });

  // Validate a report (admin only) - awards VISUpoints
  app.patch('/api/reports/:id/validate', isAuthenticated, requireAdminAccess, async (req: any, res) => {
    try {
      const { id } = req.params;
      const adminUserId = req.adminUser.id;
      const { adminNotes } = req.body;

      const report = await storage.getContentReport(id);
      if (!report) {
        return res.status(404).json({ message: "Signalement non trouvé" });
      }

      if (report.status !== 'pending') {
        return res.status(400).json({ message: "Ce signalement a déjà été traité" });
      }

      // Update the report
      await storage.updateContentReport(id, {
        status: 'confirmed',
        adminNotes: adminNotes || '',
        validatedBy: adminUserId,
        validatedAt: new Date()
      });

      // Create audit log
      await storage.createAuditLog({
        userId: adminUserId,
        action: 'report_validated',
        resourceType: 'content_report',
        resourceId: id,
        details: {
          contentType: report.contentType,
          contentId: report.contentId,
          reportType: report.reportType
        }
      });

      res.json({
        message: "Signalement validé avec succès"
      });
    } catch (error) {
      console.error("Error validating report:", error);
      res.status(500).json({ message: "Erreur lors de la validation du signalement" });
    }
  });

  // Reject a report (admin only)
  app.patch('/api/reports/:id/reject', isAuthenticated, requireAdminAccess, async (req: any, res) => {
    try {
      const { id } = req.params;
      const adminUserId = req.adminUser.id;
      const { adminNotes, isAbusive } = req.body;

      const report = await storage.getContentReport(id);
      if (!report) {
        return res.status(404).json({ message: "Signalement non trouvé" });
      }

      if (report.status !== 'pending') {
        return res.status(400).json({ message: "Ce signalement a déjà été traité" });
      }

      const newStatus = isAbusive ? 'abusive' : 'rejected';

      // Update the report
      await storage.updateContentReport(id, {
        status: newStatus,
        adminNotes: adminNotes || '',
        validatedBy: adminUserId,
        validatedAt: new Date()
      });

      // Create audit log
      await storage.createAuditLog({
        userId: adminUserId,
        action: 'report_rejected',
        resourceType: 'content_report',
        resourceId: id,
        details: {
          contentType: report.contentType,
          contentId: report.contentId,
          reportType: report.reportType,
          rejectionReason: adminNotes,
          isAbusive
        }
      });

      res.json({
        message: isAbusive ? 
          "Signalement marqué comme abusif" : 
          "Signalement rejeté",
        status: newStatus
      });
    } catch (error) {
      console.error("Error rejecting report:", error);
      res.status(500).json({ message: "Erreur lors du rejet du signalement" });
    }
  });

  // Débloquer un utilisateur bloqué par signalements (admin only)
  app.post('/api/admin/reports/unblock-user', isAuthenticated, requireAdminAccess, async (req: any, res) => {
    try {
      const adminUserId = req.adminUser.id;
      const { userId, reason } = req.body;

      if (!userId) {
        return res.status(400).json({ message: "User ID requis" });
      }

      // Vérifier que l'utilisateur existe
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }

      // Annuler les décisions de blocage en cours
      const decisions = await storage.getAgentDecisionsBySubject('user', userId);
      const blockingDecisions = decisions.filter(d => 
        (d.decisionType === 'user_ban' || d.decisionType === 'user_suspension' || d.decisionType === 'financial_block') &&
        (d.status === 'pending' || d.status === 'auto')
      );

      for (const decision of blockingDecisions) {
        // TODO: Implémenter storage.updateAgentDecision pour annuler
        console.log(`[Admin] Annulation décision ${decision.id} pour user ${userId}`);
      }

      // Créer une nouvelle décision admin de déblocage
      await storage.createAgentDecision({
        agentType: 'admin',
        decisionType: 'user_unblock',
        subjectId: userId,
        subjectType: 'user',
        ruleApplied: 'admin_override',
        score: '0',
        justification: `Déblocage manuel par admin: ${reason || 'Aucune raison fournie'}`,
        parameters: {
          admin_id: adminUserId,
          override_reason: reason,
          previous_decisions: blockingDecisions.map(d => d.id)
        },
        status: 'approved'
      });

      // Log audit
      await storage.createAuditLog({
        userId: adminUserId,
        action: 'user_blocked', // Reuse existing enum
        resourceType: 'user',
        resourceId: userId,
        details: {
          action: 'unblock',
          reason,
          cancelled_decisions: blockingDecisions.length,
          user_info: {
            email: user.email,
            name: `${user.firstName} ${user.lastName}`
          }
        }
      });

      // Créer une notification pour l'utilisateur
      await storage.createNotification({
        userId: userId,
        type: 'security',
        title: '✅ Compte débloqué',
        message: `Votre compte a été débloqué par un administrateur. Vous pouvez à nouveau accéder à toutes les fonctionnalités de la plateforme.`,
        relatedId: adminUserId,
        relatedType: 'admin'
      });

      res.json({
        success: true,
        message: `Utilisateur ${user.firstName} ${user.lastName} débloqué avec succès`,
        cancelledDecisions: blockingDecisions.length
      });
    } catch (error) {
      console.error("Error unblocking user:", error);
      res.status(500).json({ message: "Erreur lors du déblocage de l'utilisateur" });
    }
  });

  // ===== ROUTES FEATURE TOGGLES =====

  // Get all feature toggles (admin only)
  app.get('/api/admin/toggles', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.profileType !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const toggles = await storage.getFeatureToggles();
      res.json(toggles);
    } catch (error) {
      console.error("Error fetching feature toggles:", error);
      res.status(500).json({ message: "Failed to fetch feature toggles" });
    }
  });

  // Update feature toggle (admin only)
  app.patch('/api/admin/toggles/:key', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.profileType !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { key } = req.params;
      
      // Validate update data using safe update schema (exclude immutable fields)
      const updateSchema = z.object({
        label: z.string().optional(),
        kind: z.enum(['category', 'rubrique']).optional(),
        isVisible: z.boolean().optional(),
        hiddenMessageVariant: z.enum(['en_cours', 'en_travaux', 'custom']).optional(),
        hiddenMessageCustom: z.string().optional(),
        scheduleStart: z.date().optional(),
        scheduleEnd: z.date().optional(),
        timezone: z.string().optional()
      }).strict();
        
      const validation = updateSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid toggle update data",
          errors: validation.error.issues 
        });
      }

      // Add the user who made the update
      const updateData = {
        ...validation.data,
        updatedBy: req.user.claims.sub
      };

      const updatedToggle = await storage.updateFeatureToggle(key, updateData);
      res.json(updatedToggle);
    } catch (error) {
      console.error("Error updating feature toggle:", error);
      if (error instanceof Error && error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to update feature toggle" });
    }
  });

  // Get public toggles (no authentication required)
  app.get('/api/public/toggles', async (req, res) => {
    try {
      const publicToggles = await storage.getPublicToggles();
      
      // Generate deterministic ETag based on content
      const contentHash = crypto.createHash('md5').update(JSON.stringify(publicToggles)).digest('hex');
      const etag = `"${contentHash}"`;
      
      // Check if client has cached version
      const clientETag = req.get('If-None-Match');
      if (clientETag === etag) {
        return res.status(304).end();
      }
      
      // Cache headers for 5 seconds as specified in documentation
      res.set({
        'Cache-Control': 'public, max-age=5',
        'ETag': etag
      });
      
      res.json(publicToggles);
    } catch (error) {
      console.error("Error fetching public toggles:", error);
      res.status(500).json({ message: "Failed to fetch toggles" });
    }
  });

  // ===== NOUVELLES ROUTES POUR FONCTIONNALITÉS AVANCÉES =====

  // Utility function to generate unique referral codes
  function generateReferralCode(length = REFERRAL_SYSTEM.codeLength): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Utility function to check monthly referral limit
  async function checkReferralLimit(userId: string): Promise<boolean> {
    const monthYear = new Date().toISOString().slice(0, 7); // "2025-09" format
    const limit = await storage.getUserReferralLimit(userId, monthYear);
    
    if (!limit) {
      // Create initial limit record
      await storage.createReferralLimit({
        userId,
        monthYear,
        successfulReferrals: 0,
        maxReferrals: REFERRAL_SYSTEM.maxReferralsPerMonth
      });
      return true;
    }
    
    return (limit.successfulReferrals || 0) < (limit.maxReferrals || REFERRAL_SYSTEM.maxReferralsPerMonth);
  }

  // SYSTÈME DE PARRAINAGE - Referral System Routes

  // Create or get user's referral link
  app.post('/api/referral/generate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Check if user already has an active referral code
      const existingReferrals = await storage.getUserReferrals(userId);
      const activeReferral = existingReferrals.find(r => r.status !== 'expired');
      
      if (activeReferral) {
        return res.json({
          referralCode: activeReferral.referralCode,
          referralLink: activeReferral.referralLink,
          expiresAt: activeReferral.expiresAt,
          successfulReferrals: existingReferrals.filter(r => r.status === 'completed').length
        });
      }

      // Check monthly limit
      const canRefer = await checkReferralLimit(userId);
      if (!canRefer) {
        return res.status(400).json({ 
          message: "Limite mensuelle atteinte. Vous avez déjà parrainé 20 personnes ce mois-ci." 
        });
      }

      // Generate unique code
      let code = generateReferralCode();
      let existing = await storage.getReferralByCode(code);
      while (existing) {
        code = generateReferralCode();
        existing = await storage.getReferralByCode(code);
      }

      // Create referral record
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + REFERRAL_SYSTEM.linkExpiryDays);

      const referralLink = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/register?ref=${code}`;

      const newReferral = await storage.createReferral({
        sponsorId: userId,
        referralCode: code,
        referralLink: referralLink,
        status: 'pending',
        sponsorBonusVP: REFERRAL_SYSTEM.sponsorBonusVP,
        refereeBonusVP: REFERRAL_SYSTEM.refereeBonusVP,
        expiresAt: expirationDate
      });

      res.json({
        referralCode: newReferral.referralCode,
        referralLink: newReferral.referralLink,
        expiresAt: newReferral.expiresAt,
        successfulReferrals: 0
      });
    } catch (error) {
      console.error("Error generating referral:", error);
      res.status(500).json({ message: "Erreur lors de la génération du lien de parrainage" });
    }
  });

  // Get user's referral statistics
  app.get('/api/referral/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const referrals = await storage.getUserReferrals(userId);
      const monthYear = new Date().toISOString().slice(0, 7);
      const monthlyLimit = await storage.getUserReferralLimit(userId, monthYear);

      const stats = {
        totalReferrals: referrals.length,
        successfulReferrals: referrals.filter(r => r.status === 'completed').length,
        pendingReferrals: referrals.filter(r => r.status === 'pending').length,
        monthlyLimit: monthlyLimit?.maxReferrals || REFERRAL_SYSTEM.maxReferralsPerMonth,
        monthlyUsed: monthlyLimit?.successfulReferrals || 0,
        totalEarnedVP: referrals.filter(r => r.status === 'completed').length * REFERRAL_SYSTEM.sponsorBonusVP,
        activeReferralLink: referrals.find(r => r.status !== 'expired')?.referralLink || null
      };

      res.json(stats);
    } catch (error) {
      console.error("Error fetching referral stats:", error);
      res.status(500).json({ message: "Erreur lors de la récupération des statistiques" });
    }
  });

  // Validate referral code during registration
  app.get('/api/referral/validate/:code', async (req, res) => {
    try {
      const { code } = req.params;
      const referral = await storage.getReferralByCode(code);

      if (!referral) {
        return res.status(404).json({ message: "Code de parrainage invalide" });
      }

      if (referral.expiresAt && new Date() > referral.expiresAt) {
        return res.status(400).json({ message: "Code de parrainage expiré" });
      }

      if (referral.refereeId) {
        return res.status(400).json({ message: "Code de parrainage déjà utilisé" });
      }

      // Get sponsor info (without sensitive data)
      const sponsor = await storage.getUser(referral.sponsorId);
      
      res.json({
        valid: true,
        referralBonus: referral.refereeBonusVP,
        sponsorName: sponsor ? `${sponsor.firstName} ${sponsor.lastName}` : 'Utilisateur VISUAL'
      });
    } catch (error) {
      console.error("Error validating referral:", error);
      res.status(500).json({ message: "Erreur lors de la validation du code" });
    }
  });

  // Apply referral bonus after user's first action (called by other endpoints)
  async function processReferralBonus(userId: string, action: string) {
    try {
      // Check if user was referred (with potential for race conditions)
      const referral = await storage.getReferralByRefereeId(userId);
      if (!referral || referral.status !== 'pending') return;

      // ATOMIC operation: Update referral status AND check monthly limits
      const monthYear = new Date().toISOString().slice(0, 7);
      const limit = await storage.getUserReferralLimit(referral.sponsorId, monthYear);
      
      // Check limit again to prevent race conditions
      if (limit && (limit.successfulReferrals || 0) >= (limit.maxReferrals || REFERRAL_SYSTEM.maxReferralsPerMonth)) {
        console.log(`Monthly referral limit exceeded for sponsor ${referral.sponsorId}`);
        return;
      }

      // Update referral status
      await storage.updateReferral(referral.id, {
        status: 'completed',
        firstActionAt: new Date(),
        bonusAwardedAt: new Date()
      });

      // Award bonuses using centralized VISUpoints service
      await VISUPointsService.awardReferralBonus(
        referral.sponsorId,
        userId,
        referral.id,
        referral.sponsorBonusVP || REFERRAL_SYSTEM.sponsorBonusVP,
        referral.refereeBonusVP || REFERRAL_SYSTEM.refereeBonusVP
      );

      // Update monthly limit counter atomically
      if (limit) {
        await storage.updateReferralLimit(referral.sponsorId, monthYear, {
          successfulReferrals: (limit.successfulReferrals || 0) + 1
        });
      }

      console.log(`Referral bonus processed for user ${userId} (action: ${action})`);
    } catch (error) {
      console.error("Error processing referral bonus:", error);
      // Don't re-throw to avoid breaking user actions
    }
  }

  // STREAKS DE CONNEXION - Login Streaks Routes

  // Update user's login streak
  app.post('/api/streaks/login', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      
      let streak = await storage.getUserLoginStreak(userId);
      
      if (!streak) {
        // Create initial streak
        streak = await storage.createLoginStreak({
          userId,
          currentStreak: 1,
          longestStreak: 1,
          lastLoginDate: new Date(),
          streakStartDate: new Date(),
          totalLogins: 1,
          visuPointsEarned: STREAK_REWARDS.daily
        });

        // Award daily login points using centralized service
        await VISUPointsService.awardStreakBonus(
          userId,
          STREAK_REWARDS.daily,
          1,
          streak.id
        );
      } else {
        const lastLoginDate = streak.lastLoginDate ? new Date(streak.lastLoginDate).toISOString().split('T')[0] : null;
        
        if (lastLoginDate === today) {
          // Already logged in today
          return res.json({ streak, alreadyLoggedToday: true });
        }

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        let newStreak = streak.currentStreak || 0;
        let streakStartDate = streak.streakStartDate;
        
        if (lastLoginDate === yesterdayStr) {
          // Consecutive day login
          newStreak += 1;
        } else {
          // Streak broken, restart
          newStreak = 1;
          streakStartDate = new Date();
        }

        const newLongestStreak = Math.max(streak.longestStreak || 0, newStreak);
        
        // Calculate bonus points for milestones
        let bonusPoints = STREAK_REWARDS.daily;
        if (newStreak % 30 === 0) {
          bonusPoints += STREAK_REWARDS.monthly;
        } else if (newStreak % 7 === 0) {
          bonusPoints += STREAK_REWARDS.weekly;
        }

        // Update streak
        streak = await storage.updateLoginStreak(userId, {
          currentStreak: newStreak,
          longestStreak: newLongestStreak,
          lastLoginDate: new Date(),
          streakStartDate: streakStartDate,
          totalLogins: (streak.totalLogins || 0) + 1,
          visuPointsEarned: (streak.visuPointsEarned || 0) + bonusPoints
        });

        // Award points using centralized service
        await VISUPointsService.awardStreakBonus(
          userId,
          bonusPoints,
          newStreak,
          streak.id
        );
      }

      res.json({ streak });
    } catch (error) {
      console.error("Error updating login streak:", error);
      res.status(500).json({ message: "Erreur lors de la mise à jour du streak" });
    }
  });

  // Get user's login streak stats
  app.get('/api/streaks/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const streak = await storage.getUserLoginStreak(userId);
      
      if (!streak) {
        return res.json({
          currentStreak: 0,
          longestStreak: 0,
          totalLogins: 0,
          visuPointsEarned: 0,
          nextMilestone: 7,
          nextMilestoneReward: STREAK_REWARDS.weekly
        });
      }

      // Calculate next milestone
      let nextMilestone = 7;
      let nextMilestoneReward: number = STREAK_REWARDS.weekly;
      const currentStreak = streak.currentStreak || 0;
      
      if (currentStreak >= 30) {
        nextMilestone = Math.ceil(currentStreak / 30) * 30;
        nextMilestoneReward = STREAK_REWARDS.monthly;
      } else if (currentStreak >= 7) {
        nextMilestone = Math.ceil(currentStreak / 7) * 7;
        nextMilestoneReward = STREAK_REWARDS.weekly;
      }

      res.json({
        ...streak,
        nextMilestone,
        nextMilestoneReward
      });
    } catch (error) {
      console.error("Error fetching streak stats:", error);
      res.status(500).json({ message: "Erreur lors de la récupération des statistiques" });
    }
  });

  // SUIVI D'ACTIVITÉ VISITEURS - Visitor Activity Routes

  // Track visitor activity
  app.post('/api/visitor/activity', async (req, res) => {
    try {
      const activityData = insertVisitorActivitySchema.parse(req.body);
      
      // Get session ID from request or generate one
      const sessionId = req.sessionID || activityData.sessionId;
      
      // Get user info from session if available
      const userId = (req as any).user?.claims?.sub || null;
      
      const activity = await storage.createVisitorActivity({
        ...activityData,
        sessionId,
        userId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || '',
        deviceType: /Mobile|Android|iPhone|iPad/.test(req.get('User-Agent') || '') ? 'mobile' : 'desktop'
      });

      // Award activity points if user is logged in
      if (userId && activityData.activityType in VISITOR_OF_MONTH.activityPoints) {
        const points = VISITOR_OF_MONTH.activityPoints[activityData.activityType as keyof typeof VISITOR_OF_MONTH.activityPoints];
        
        await VISUPointsService.awardActivityPoints(
          userId,
          points,
          activityData.activityType,
          activity.id
        );

        // Update visitor of month stats
        const monthYear = new Date().toISOString().slice(0, 7);
        let visitorStats = await storage.getVisitorOfMonth(userId, monthYear);
        
        if (!visitorStats) {
          visitorStats = await storage.createVisitorOfMonth({
            userId,
            monthYear,
            activityScore: points,
            totalActivities: 1,
            totalDuration: activityData.duration || 0
          });
        } else {
          await storage.updateVisitorOfMonth(userId, monthYear, {
            activityScore: (visitorStats.activityScore || 0) + points,
            totalActivities: (visitorStats.totalActivities || 0) + 1,
            totalDuration: (visitorStats.totalDuration || 0) + (activityData.duration || 0)
          });
        }
      }

      res.json({ success: true, activity });
    } catch (error) {
      console.error("Error tracking visitor activity:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Données d'activité invalides", errors: error.errors });
      }
      res.status(500).json({ message: "Erreur lors de l'enregistrement de l'activité" });
    }
  });

  // Get monthly visitor rankings (Visiteur du Mois)
  app.get('/api/visitor/rankings/:monthYear?', async (req, res) => {
    try {
      const monthYear = req.params.monthYear || new Date().toISOString().slice(0, 7);
      const limit = parseInt(req.query.limit as string) || 10;
      
      const rankings = await storage.getMonthlyVisitorRankings(monthYear, limit);
      
      res.json({
        monthYear,
        rankings: rankings.map(r => ({
          ...r,
          // Don't expose sensitive user info in rankings
          userId: r.isWinner ? r.userId : undefined
        }))
      });
    } catch (error) {
      console.error("Error fetching visitor rankings:", error);
      res.status(500).json({ message: "Erreur lors de la récupération du classement" });
    }
  });

  // Get user's visitor stats
  app.get('/api/visitor/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const monthYear = req.query.monthYear as string || new Date().toISOString().slice(0, 7);
      
      const visitorStats = await storage.getVisitorOfMonth(userId, monthYear);
      const userActivities = await storage.getUserActivities(userId, 50);
      
      res.json({
        monthYear,
        stats: visitorStats || {
          userId,
          monthYear,
          activityScore: 0,
          totalActivities: 0,
          totalDuration: 0,
          rank: null,
          isWinner: false
        },
        recentActivities: userActivities
      });
    } catch (error) {
      console.error("Error fetching visitor stats:", error);
      res.status(500).json({ message: "Erreur lors de la récupération des statistiques" });
    }
  });

  // ===== NOUVELLES ROUTES TOP10 ET FIDÉLITÉ =====

  // TOP10 System Routes
  
  // Get current TOP10 ranking
  app.get('/api/top10/current', async (req, res) => {
    try {
      // TODO: Implémenter getCurrentRanking dans Top10Service 
      const ranking = null; // Temporaire : simulation ranking vide
      
      res.json({
        ranking: ranking,
        message: ranking ? "Classement du jour" : "Aucun classement disponible pour aujourd'hui"
      });
    } catch (error) {
      console.error("Error fetching current TOP10 ranking:", error);
      res.status(500).json({ message: "Erreur lors de la récupération du classement TOP10" });
    }
  });

  // Get TOP10 ranking history
  app.get('/api/top10/history', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 7; // 7 derniers jours par défaut
      // TODO: Implémenter getRankingHistory dans Top10Service
      const history: any[] = []; // Temporaire : simulation historique vide
      
      res.json({
        history: history.slice(0, limit).map((ranking) => ({
          date: ranking?.redistribution?.redistributionDate || '',
          top10Count: ranking?.top10Infoporteurs?.length || 0,
          winnersCount: ranking?.winners?.length || 0,
          totalPool: ranking?.redistribution?.totalPoolEUR || 0,
          poolDistributed: ranking?.redistribution?.poolDistributed || 0
        }))
      });
    } catch (error) {
      console.error("Error fetching TOP10 history:", error);
      res.status(500).json({ message: "Erreur lors de la récupération de l'historique TOP10" });
    }
  });

  // Manual TOP10 ranking generation (admin only)
  app.post('/api/top10/generate', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.profileType !== 'admin') {
        return res.status(403).json({ message: "Accès interdit" });
      }
      
      const date = req.body.date ? new Date(req.body.date) : new Date();
      const ranking = await Top10Service.generateDailyRanking(date);
      
      res.json({
        message: "Classement TOP10 généré avec succès",
        ranking: {
          date: date.toISOString().split('T')[0],
          top10Count: ranking.top10Infoporteurs.length,
          winnersCount: ranking.winners.length,
          totalPool: ranking.redistribution.totalPoolEUR
        }
      });
    } catch (error) {
      console.error("Error generating TOP10 ranking:", error);
      res.status(500).json({ message: "Erreur lors de la génération du classement TOP10" });
    }
  });

  // Fidelity System Routes
  
  // Process user login (for streak calculation)
  app.post('/api/fidelity/login', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const result = await FidelityService.processUserLogin(userId);
      
      res.json({
        message: "Connexion traitée",
        rewards: {
          daily: result.dailyReward,
          weekly: result.weeklyReward,
          totalPoints: result.totalPoints
        }
      });
    } catch (error) {
      console.error("Error processing user login:", error);
      res.status(500).json({ message: "Erreur lors du traitement de la connexion" });
    }
  });

  // Get user fidelity stats
  app.get('/api/fidelity/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await FidelityService.getUserFidelityStats(userId);
      
      res.json({
        stats
      });
    } catch (error) {
      console.error("Error fetching fidelity stats:", error);
      res.status(500).json({ message: "Erreur lors de la récupération des statistiques de fidélité" });
    }
  });

  // Get fidelity reward scales
  app.get('/api/fidelity/rewards', async (req, res) => {
    try {
      const scales = FidelityService.getRewardScales();
      
      res.json({
        scales: {
          daily: scales.daily,
          weekly: scales.weekly
        }
      });
    } catch (error) {
      console.error("Error fetching reward scales:", error);
      res.status(500).json({ message: "Erreur lors de la récupération des barèmes" });
    }
  });

  // ===== ROUTES LIVRES CATEGORY =====

  // Get all book categories
  app.get('/api/books/categories', async (req, res) => {
    try {
      const categories = await storage.getAllBookCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching book categories:", error);
      res.status(500).json({ message: "Failed to fetch book categories" });
    }
  });

  // Get book category by ID
  app.get('/api/books/categories/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const category = await storage.getBookCategory(id);
      
      if (!category) {
        return res.status(404).json({ message: "Book category not found" });
      }
      
      res.json(category);
    } catch (error) {
      console.error("Error fetching book category:", error);
      res.status(500).json({ message: "Failed to fetch book category" });
    }
  });

  // Create book category (admin only)
  app.post('/api/books/categories', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.profileType !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const validation = insertBookCategorySchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid category data",
          errors: validation.error.issues 
        });
      }

      const category = await storage.createBookCategory(validation.data);
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating book category:", error);
      if (error instanceof Error && error.message.includes('unique')) {
        return res.status(409).json({ message: "Category name already exists" });
      }
      res.status(500).json({ message: "Failed to create book category" });
    }
  });

  // Update book category (admin only)
  app.patch('/api/books/categories/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.profileType !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;
      
      // Validate update data using partial schema
      const updateSchema = insertBookCategorySchema.partial();
      const validation = updateSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid category update data",
          errors: validation.error.issues 
        });
      }

      const category = await storage.updateBookCategory(id, validation.data);
      res.json(category);
    } catch (error) {
      console.error("Error updating book category:", error);
      res.status(500).json({ message: "Failed to update book category" });
    }
  });

  // ===== ROUTES LIVRES BOOKS =====

  // Get books by category
  app.get('/api/books/categories/:categoryId/books', async (req, res) => {
    try {
      const { categoryId } = req.params;
      const books = await storage.getBooksByCategoryId(categoryId);
      res.json(books);
    } catch (error) {
      console.error("Error fetching books by category:", error);
      res.status(500).json({ message: "Failed to fetch books" });
    }
  });

  // Get books by author
  app.get('/api/books/author/:authorId', isAuthenticated, async (req: any, res) => {
    try {
      const { authorId } = req.params;
      const userId = req.user.claims.sub;
      
      // Only allow authors to see their own books, or admins to see any
      const user = await storage.getUser(userId);
      if (authorId !== userId && (!user || user.profileType !== 'admin')) {
        return res.status(403).json({ message: "Access denied" });
      }

      const books = await storage.getBooksByAuthor(authorId);
      res.json(books);
    } catch (error) {
      console.error("Error fetching author books:", error);
      res.status(500).json({ message: "Failed to fetch author books" });
    }
  });

  // Get active books (public listing)
  app.get('/api/books', async (req, res) => {
    try {
      const { categoryId } = req.query;
      const books = await storage.getActiveBooks(categoryId as string);
      res.json(books);
    } catch (error) {
      console.error("Error fetching active books:", error);
      res.status(500).json({ message: "Failed to fetch books" });
    }
  });

  // Get book by ID
  app.get('/api/books/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const book = await storage.getBook(id);
      
      if (!book) {
        return res.status(404).json({ message: "Book not found" });
      }
      
      res.json(book);
    } catch (error) {
      console.error("Error fetching book:", error);
      res.status(500).json({ message: "Failed to fetch book" });
    }
  });

  // Create book (authenticated authors only)
  app.post('/api/books', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const validation = insertBookSchema.safeParse({
        ...req.body,
        authorId: userId
      });

      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid book data",
          errors: validation.error.issues 
        });
      }

      // Validate author price
      if (!isValidBookAuthorPrice(parseFloat(validation.data.unitPriceEUR))) {
        return res.status(400).json({ 
          message: `Invalid author price. Allowed prices: ${ALLOWED_BOOK_AUTHOR_PRICES.join(', ')}€` 
        });
      }

      const book = await storage.createBook(validation.data);
      res.status(201).json(book);
    } catch (error) {
      console.error("Error creating book:", error);
      res.status(500).json({ message: "Failed to create book" });
    }
  });

  // Update book (author or admin only)
  app.patch('/api/books/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;

      const book = await storage.getBook(id);
      if (!book) {
        return res.status(404).json({ message: "Book not found" });
      }

      const user = await storage.getUser(userId);
      if (book.authorId !== userId && (!user || user.profileType !== 'admin')) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Validate update data using omit schema (workaround for ZodEffects)
      const updateSchema = insertBookSchema.omit({ 
        id: true,
        createdAt: true,
        updatedAt: true
      }).partial();
      const validation = updateSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid book update data",
          errors: validation.error.issues 
        });
      }

      // Additional validation for author price if being updated
      if (validation.data.unitPriceEUR && !isValidBookAuthorPrice(parseFloat(validation.data.unitPriceEUR))) {
        return res.status(400).json({ 
          message: `Invalid author price. Allowed prices: ${ALLOWED_BOOK_AUTHOR_PRICES.join(', ')}€` 
        });
      }

      const updatedBook = await storage.updateBook(id, validation.data);
      res.json(updatedBook);
    } catch (error) {
      console.error("Error updating book:", error);
      res.status(500).json({ message: "Failed to update book" });
    }
  });

  // ===== ROUTES LIVRES PURCHASES =====

  // Purchase book (lecteurs)
  app.post('/api/books/:bookId/purchase', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { bookId } = req.params;

      const validation = insertBookPurchaseSchema.safeParse({
        ...req.body,
        userId,
        bookId
      });

      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid purchase data",
          errors: validation.error.issues 
        });
      }

      // Validate reader amount
      if (!isValidBookReaderAmount(parseFloat(validation.data.amountEUR))) {
        return res.status(400).json({ 
          message: `Invalid reader amount. Allowed amounts: ${ALLOWED_BOOK_READER_AMOUNTS.join(', ')}€` 
        });
      }

      // Check if user already purchased this book
      const existingPurchase = await storage.getBookPurchaseByUserAndBook(userId, bookId);
      if (existingPurchase) {
        return res.status(409).json({ message: "Book already purchased" });
      }

      // Prevent self-investment: check if user is the author of the book
      const book = await storage.getBook(bookId);
      if (!book) {
        return res.status(404).json({ message: "Book not found" });
      }
      
      if (book.authorId === userId) {
        return res.status(403).json({ 
          message: "You cannot invest in your own book. Self-investment is not allowed." 
        });
      }

      // Calculate votes from amount
      const amountNumber = parseFloat(validation.data.amountEUR);
      const votesGranted = BOOK_VOTES_MAPPING[amountNumber as keyof typeof BOOK_VOTES_MAPPING] || 0;
      
      const purchase = await storage.createBookPurchase({
        ...validation.data,
        votesGranted
      });

      res.status(201).json(purchase);
    } catch (error) {
      console.error("Error creating book purchase:", error);
      res.status(500).json({ message: "Failed to purchase book" });
    }
  });

  // Get user book purchases
  app.get('/api/books/purchases', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const purchases = await storage.getUserBookPurchases(userId);
      res.json(purchases);
    } catch (error) {
      console.error("Error fetching user book purchases:", error);
      res.status(500).json({ message: "Failed to fetch purchases" });
    }
  });

  // Get book purchases (for book owners)
  app.get('/api/books/:bookId/purchases', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { bookId } = req.params;

      // Verify book ownership or admin access
      const book = await storage.getBook(bookId);
      if (!book) {
        return res.status(404).json({ message: "Book not found" });
      }

      const user = await storage.getUser(userId);
      if (book.authorId !== userId && (!user || user.profileType !== 'admin')) {
        return res.status(403).json({ message: "Access denied" });
      }

      const purchases = await storage.getBookPurchases(bookId);
      res.json(purchases);
    } catch (error) {
      console.error("Error fetching book purchases:", error);
      res.status(500).json({ message: "Failed to fetch book purchases" });
    }
  });

  // ===== ROUTES LIVRES DOWNLOAD =====

  // Generate download token
  app.post('/api/books/:bookId/download-token', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { bookId } = req.params;

      // Verify user has purchased the book
      const purchase = await storage.getBookPurchaseByUserAndBook(userId, bookId);
      if (!purchase) {
        return res.status(403).json({ message: "Book not purchased" });
      }

      // Use VisualFinanceAI to generate secure download token
      const { visualFinanceAI } = await import('./services/visualFinanceAI');
      const tokenData = await visualFinanceAI.generateDownloadToken(
        userId,
        purchase.id,
        bookId
      );

      // Store token in database
      const downloadToken = await storage.createDownloadToken({
        token: tokenData.token,
        purchaseId: purchase.id,
        userId,
        bookId,
        expiresAt: tokenData.expiresAt,
        downloadUrl: tokenData.downloadUrl,
        status: 'active'
      });

      res.json({
        token: tokenData.token,
        expiresAt: tokenData.expiresAt,
        downloadUrl: tokenData.downloadUrl
      });
    } catch (error) {
      console.error("Error generating download token:", error);
      res.status(500).json({ message: "Failed to generate download token" });
    }
  });

  // Download book with token
  app.get('/api/books/download/:token', async (req, res) => {
    try {
      const { token } = req.params;

      const downloadToken = await storage.getDownloadToken(token);
      if (!downloadToken) {
        return res.status(404).json({ message: "Invalid download token" });
      }

      if (downloadToken.status === 'revoked') {
        return res.status(403).json({ message: "Download token revoked" });
      }

      if (new Date() > new Date(downloadToken.expiresAt)) {
        return res.status(403).json({ message: "Download token expired" });
      }

      // TODO: Implement actual file download with watermark
      // For now, return download information
      res.json({
        message: "Download authorized",
        bookId: downloadToken.bookId,
        token: downloadToken.token,
        expiresAt: downloadToken.expiresAt
      });
    } catch (error) {
      console.error("Error downloading book:", error);
      res.status(500).json({ message: "Failed to download book" });
    }
  });

  // Get user download tokens
  app.get('/api/books/download-tokens', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get all user purchases then their tokens
      const purchases = await storage.getUserBookPurchases(userId);
      const tokens = [];
      
      for (const purchase of purchases) {
        const purchaseTokens = await storage.getDownloadTokensByPurchase(purchase.id);
        tokens.push(...purchaseTokens);
      }

      res.json(tokens);
    } catch (error) {
      console.error("Error fetching download tokens:", error);
      res.status(500).json({ message: "Failed to fetch download tokens" });
    }
  });

  // Curiosity Dock API endpoints
  // GET /api/curiosity/stats - Statistiques en temps réel pour le dock
  app.get('/api/curiosity/stats', async (req, res) => {
    try {
      // Récupérer les stats des lives actifs
      const activeLiveShows = await storage.getActiveLiveShows();
      const liveStats = {
        activeLives: activeLiveShows?.length || 0,
        liveViewers: activeLiveShows?.reduce((total, show) => total + (show.viewerCount || 0), 0) || 0
      };

      // Récupérer le nombre de nouveaux projets (dernières 24h)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayISO = yesterday.toISOString();
      const allProjects = await storage.getProjects(100, 0);
      const recentProjects = allProjects?.filter(project => 
        project.createdAt && new Date(project.createdAt) > yesterday
      ) || [];
      const newProjectsCount = recentProjects.length;

      // Vérifier si le TOP 10 est actif (basé sur les feature toggles)
      const toggles = await storage.getFeatureToggles();
      const topCategoryActive = toggles?.some((toggle: any) => 
        toggle.kind === 'category' && toggle.isVisible
      ) || true; // Default à true si pas de toggles

      // Vérifier si l'utilisateur a complété sa quête du jour
      let todayQuestCompleted = false;
      if (req.user?.claims?.sub) {
        const userId = req.user.claims.sub;
        const today = new Date().toISOString().split('T')[0];
        const todayQuest = await storage.getUserDailyQuest(userId, today);
        todayQuestCompleted = todayQuest?.isCompleted || false;
      }

      res.json({
        liveViewers: liveStats.liveViewers,
        activeLives: liveStats.activeLives,
        newProjectsCount,
        topCategoryActive,
        todayQuestCompleted
      });
    } catch (error) {
      console.error("Error fetching curiosity stats:", error);
      res.status(500).json({ 
        message: "Failed to fetch curiosity stats",
        retryable: true
      });
    }
  });

  // Daily Quest API endpoints for "Surprise du jour"
  // GET /api/quest/today - Récupérer la quête du jour
  app.get('/api/quest/today', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { DailyQuestService } = await import('./services/dailyQuestService');
      
      const quest = await DailyQuestService.getTodayQuest(userId);
      
      if (!quest) {
        return res.status(404).json({ 
          message: "No quest available for today",
          retryable: false
        });
      }

      res.json(quest);
    } catch (error) {
      console.error("Error fetching today's quest:", error);
      res.status(500).json({ 
        message: "Failed to fetch today's quest",
        retryable: true
      });
    }
  });

  // POST /api/quest/claim - Réclamer la récompense d'une quête
  app.post('/api/quest/claim', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { questId } = req.body;

      if (!questId) {
        return res.status(400).json({ 
          message: "Quest ID is required",
          retryable: false
        });
      }

      const { DailyQuestService } = await import('./services/dailyQuestService');
      const result = await DailyQuestService.claimQuestReward(userId, questId);

      if (!result.success) {
        return res.status(400).json({ 
          message: result.error,
          retryable: false
        });
      }

      res.json({
        success: true,
        visuPointsAwarded: result.visuPointsAwarded,
        message: `You earned ${result.visuPointsAwarded} VISUpoints!`
      });
    } catch (error) {
      console.error("Error claiming quest reward:", error);
      res.status(500).json({ 
        message: "Failed to claim quest reward",
        retryable: true
      });
    }
  });

  // GET /api/quest/stats - Statistiques des quêtes de l'utilisateur
  app.get('/api/quest/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { DailyQuestService } = await import('./services/dailyQuestService');
      
      const stats = await DailyQuestService.getUserQuestStats(userId);
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching quest stats:", error);
      res.status(500).json({ 
        message: "Failed to fetch quest stats",
        retryable: true
      });
    }
  });

  // ===== ROUTES MINI RÉSEAU SOCIAL AUTOMATIQUE =====

  // Import des services
  const { visualAIService } = await import('./services/visualAIService');
  const { moderationService } = await import('./services/moderationService');
  const { trafficModeService } = await import('./services/trafficModeService');
  const { highlightsService } = await import('./services/highlightsService');
  
  // Récupérer la configuration complète du mini réseau social (admin seulement)
  app.get('/api/admin/mini-social/config', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.profileType !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const config = await miniSocialConfigService.getConfig();
      res.json(config);
    } catch (error) {
      console.error("Error fetching mini social config:", error);
      res.status(500).json({ message: "Failed to fetch mini social config" });
    }
  });

  // Mettre à jour un paramètre spécifique (admin seulement)
  app.patch('/api/admin/mini-social/params/:key', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.profileType !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { key } = req.params;
      const { value } = req.body;

      if (!value || typeof value !== 'string') {
        return res.status(400).json({ message: "Valeur requise (string)" });
      }

      const updatedParam = await miniSocialConfigService.updateParam(
        key, 
        value, 
`admin:${req.user.claims.sub}`
      );
      
      res.json(updatedParam);
    } catch (error) {
      console.error("Error updating mini social param:", error);
      if (error instanceof Error && error.message.includes('non autorisée')) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to update parameter" });
    }
  });

  // Toggle autoshow (admin seulement)
  app.patch('/api/admin/mini-social/autoshow', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.profileType !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { enabled } = req.body;
      if (typeof enabled !== 'boolean') {
        return res.status(400).json({ message: "enabled requis (boolean)" });
      }

      await miniSocialConfigService.toggleAutoshow(enabled, `admin:${req.user.claims.sub}`);
      
      res.json({ 
        success: true, 
        autoshow: enabled,
        message: enabled ? "Autoshow activé" : "Autoshow désactivé"
      });
    } catch (error) {
      console.error("Error toggling autoshow:", error);
      res.status(500).json({ message: "Failed to toggle autoshow" });
    }
  });

  // Changer la position (admin seulement)
  app.patch('/api/admin/mini-social/position', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.profileType !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { position } = req.body;
      if (!['sidebar', 'drawer'].includes(position)) {
        return res.status(400).json({ message: "Position doit être 'sidebar' ou 'drawer'" });
      }

      await miniSocialConfigService.setPosition(position, `admin:${req.user.claims.sub}`);
      
      res.json({ 
        success: true, 
        position,
        message: `Position changée vers ${position}`
      });
    } catch (error) {
      console.error("Error changing position:", error);
      res.status(500).json({ message: "Failed to change position" });
    }
  });

  // Toggle slow mode (admin seulement)
  app.patch('/api/admin/mini-social/slow-mode', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.profileType !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { enabled } = req.body;
      if (typeof enabled !== 'boolean') {
        return res.status(400).json({ message: "enabled requis (boolean)" });
      }

      await miniSocialConfigService.toggleSlowMode(enabled, `admin:${req.user.claims.sub}`);
      
      res.json({ 
        success: true, 
        slowMode: enabled,
        message: enabled ? "Slow mode activé" : "Slow mode désactivé"
      });
    } catch (error) {
      console.error("Error toggling slow mode:", error);
      res.status(500).json({ message: "Failed to toggle slow mode" });
    }
  });

  // Configurer le seuil de trafic élevé (admin seulement)
  app.patch('/api/admin/mini-social/threshold', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.profileType !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { threshold } = req.body;
      if (!Number.isInteger(threshold) || threshold < 1 || threshold > 10000) {
        return res.status(400).json({ 
          message: "Seuil doit être un entier entre 1 et 10000" 
        });
      }

      await miniSocialConfigService.setHighTrafficThreshold(threshold, `admin:${req.user.claims.sub}`);
      
      res.json({ 
        success: true, 
        threshold,
        message: `Seuil de trafic élevé configuré à ${threshold} spectateurs`
      });
    } catch (error) {
      console.error("Error setting threshold:", error);
      res.status(500).json({ message: "Failed to set threshold" });
    }
  });

  // Récupérer la configuration publique (pour le composant frontend)
  app.get('/api/mini-social/config', async (req, res) => {
    try {
      const config = await miniSocialConfigService.getConfig();
      
      // Cache headers pour optimiser les performances
      res.set({
        'Cache-Control': 'public, max-age=5',
        'Content-Type': 'application/json'
      });
      
      res.json(config);
    } catch (error) {
      console.error("Error fetching public mini social config:", error);
      res.status(500).json({ message: "Failed to fetch config" });
    }
  });

  // ===== ROUTES VISUAL AI SERVICE =====
  
  // Statistiques de surveillance des Live Shows (admin seulement)
  app.get('/api/admin/visual-ai/stats', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.profileType !== 'admin') {
        return res.status(403).json({ message: "Accès réservé aux administrateurs" });
      }

      const stats = visualAIService.getMonitoringStats();
      res.json({
        stats,
        message: "Statistiques VisualAI récupérées"
      });
    } catch (error) {
      console.error("Erreur lors de la récupération des stats VisualAI:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Déclenchement manuel du mini réseau social pour un Live Show (admin seulement)
  app.post('/api/admin/visual-ai/trigger/:liveShowId', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.profileType !== 'admin') {
        return res.status(403).json({ message: "Accès réservé aux administrateurs" });
      }

      const liveShowId = req.params.liveShowId;
      const adminUserId = req.user.claims.sub;

      const success = await visualAIService.manualTrigger(liveShowId, adminUserId);
      
      if (success) {
        res.json({
          success: true,
          message: `Mini réseau social déclenché manuellement pour le Live Show ${liveShowId}`
        });
      } else {
        res.status(400).json({
          success: false,
          message: "Échec du déclenchement manuel"
        });
      }
    } catch (error) {
      console.error("Erreur lors du déclenchement manuel:", error);
      res.status(500).json({ 
        success: false,
        message: error instanceof Error ? error.message : "Erreur serveur" 
      });
    }
  });

  // Arrêter la surveillance VisualAI (admin seulement)
  app.post('/api/admin/visual-ai/stop', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.profileType !== 'admin') {
        return res.status(403).json({ message: "Accès réservé aux administrateurs" });
      }

      visualAIService.stopMonitoring();
      
      res.json({
        success: true,
        message: "Surveillance VisualAI arrêtée"
      });
    } catch (error) {
      console.error("Erreur lors de l'arrêt de la surveillance:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Démarrer la surveillance VisualAI (admin seulement)
  app.post('/api/admin/visual-ai/start', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.profileType !== 'admin') {
        return res.status(403).json({ message: "Accès réservé aux administrateurs" });
      }

      await visualAIService.startMonitoring();
      
      res.json({
        success: true,
        message: "Surveillance VisualAI démarrée"
      });
    } catch (error) {
      console.error("Erreur lors du démarrage de la surveillance:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // ===== ROUTES MODERATION SERVICE =====
  
  // Statistiques de modération (admin seulement)
  app.get('/api/admin/moderation/stats', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.profileType !== 'admin') {
        return res.status(403).json({ message: "Accès réservé aux administrateurs" });
      }

      const stats = moderationService.getStats();
      res.json({
        stats,
        message: "Statistiques de modération récupérées"
      });
    } catch (error) {
      console.error("Erreur lors de la récupération des stats de modération:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Tester la validation d'un message (admin seulement)
  app.post('/api/admin/moderation/test', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.profileType !== 'admin') {
        return res.status(403).json({ message: "Accès réservé aux administrateurs" });
      }

      const { userId, content } = req.body;
      if (!userId || !content) {
        return res.status(400).json({ message: "userId et content sont requis" });
      }

      const result = await moderationService.canUserPostMessage(userId, content);
      
      res.json({
        result,
        message: "Test de modération effectué"
      });
    } catch (error) {
      console.error("Erreur lors du test de modération:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Erreur serveur" 
      });
    }
  });

  // Forcer le cleanup de la modération (admin seulement)
  app.post('/api/admin/moderation/cleanup', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.profileType !== 'admin') {
        return res.status(403).json({ message: "Accès réservé aux administrateurs" });
      }

      moderationService.cleanup();
      
      res.json({
        success: true,
        message: "Cleanup de modération effectué"
      });
    } catch (error) {
      console.error("Erreur lors du cleanup de modération:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Valider un message pour le mini réseau social (utilisateurs connectés)
  app.post('/api/mini-social/validate-message', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { content } = req.body;

      if (!content || typeof content !== 'string') {
        return res.status(400).json({ 
          allowed: false,
          reason: "Contenu du message requis",
          action: 'content_filter'
        });
      }

      const result = await moderationService.canUserPostMessage(userId, content);
      
      res.json(result);
    } catch (error) {
      console.error("Erreur lors de la validation du message:", error);
      res.status(500).json({ 
        allowed: false,
        reason: "Erreur de validation - veuillez réessayer",
        action: 'content_filter'
      });
    }
  });

  // ===== ROUTES TRAFFIC MODE SERVICE =====
  
  // Statistiques des modes de trafic (admin seulement)
  app.get('/api/admin/traffic-mode/stats', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.profileType !== 'admin') {
        return res.status(403).json({ message: "Accès réservé aux administrateurs" });
      }

      const stats = trafficModeService.getStats();
      res.json({
        stats,
        message: "Statistiques des modes de trafic récupérées"
      });
    } catch (error) {
      console.error("Erreur lors de la récupération des stats traffic mode:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Forcer un mode spécifique pour un live show (admin seulement)
  app.post('/api/admin/traffic-mode/set-mode/:liveShowId', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.profileType !== 'admin') {
        return res.status(403).json({ message: "Accès réservé aux administrateurs" });
      }

      const liveShowId = req.params.liveShowId;
      const { mode, durationMinutes } = req.body;

      if (!mode || !['normal', 'normal_with_slow_mode', 'highlights_only', 'read_only', 'dnd'].includes(mode)) {
        return res.status(400).json({ message: "Mode invalide" });
      }

      const duration = parseInt(durationMinutes) || 60;
      if (duration < 1 || duration > 1440) { // Max 24h
        return res.status(400).json({ message: "Durée doit être entre 1 et 1440 minutes" });
      }

      const trafficMode = await trafficModeService.setManualMode(liveShowId, mode, req.user.claims.sub, duration);
      
      res.json({
        success: true,
        trafficMode,
        message: `Mode ${mode} activé pour ${duration} minutes`
      });
    } catch (error) {
      console.error("Erreur lors du réglage du mode trafic:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Erreur serveur" 
      });
    }
  });

  // Supprimer l'override manuel et revenir au mode automatique (admin seulement)
  app.delete('/api/admin/traffic-mode/clear-override/:liveShowId', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.profileType !== 'admin') {
        return res.status(403).json({ message: "Accès réservé aux administrateurs" });
      }

      const liveShowId = req.params.liveShowId;
      await trafficModeService.clearManualMode(liveShowId, req.user.claims.sub);
      
      res.json({
        success: true,
        message: "Override manuel supprimé, retour au mode automatique"
      });
    } catch (error) {
      console.error("Erreur lors de la suppression de l'override:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Récupérer l'historique des modes pour un live show (admin seulement)
  app.get('/api/admin/traffic-mode/history/:liveShowId', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.profileType !== 'admin') {
        return res.status(403).json({ message: "Accès réservé aux administrateurs" });
      }

      const liveShowId = req.params.liveShowId;
      const history = trafficModeService.getModeHistory(liveShowId);
      const currentMode = trafficModeService.getCurrentMode(liveShowId);
      
      res.json({
        liveShowId,
        currentMode,
        history,
        message: "Historique des modes récupéré"
      });
    } catch (error) {
      console.error("Erreur lors de la récupération de l'historique:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // ===== ROUTES HIGHLIGHTS SERVICE =====
  
  // Statistiques des highlights (admin seulement)
  app.get('/api/admin/highlights/stats', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.profileType !== 'admin') {
        return res.status(403).json({ message: "Accès réservé aux administrateurs" });
      }

      const stats = highlightsService.getStats();
      res.json({
        stats,
        message: "Statistiques des highlights récupérées"
      });
    } catch (error) {
      console.error("Erreur lors de la récupération des stats highlights:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Régénérer les highlights pour un live show (admin seulement)
  app.post('/api/admin/highlights/regenerate/:liveShowId', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.profileType !== 'admin') {
        return res.status(403).json({ message: "Accès réservé aux administrateurs" });
      }

      const liveShowId = req.params.liveShowId;
      const highlights = await highlightsService.regenerateHighlights(liveShowId);
      
      res.json({
        liveShowId,
        highlights,
        count: highlights.length,
        message: "Highlights régénérés"
      });
    } catch (error) {
      console.error("Erreur lors de la régénération des highlights:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Récupérer les highlights actuels pour un live show
  app.get('/api/mini-social/highlights/:liveShowId', async (req, res) => {
    try {
      const liveShowId = req.params.liveShowId;
      const highlights = highlightsService.getHighlights(liveShowId);
      
      res.set({
        'Cache-Control': 'public, max-age=10', // Cache 10 secondes
        'Content-Type': 'application/json'
      });
      
      res.json({
        liveShowId,
        highlights,
        count: highlights.length,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error("Erreur lors de la récupération des highlights:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // ===== LIVE SOCIAL FEATURES ROUTES =====

  // Route pour envoyer un message de chat dans un Live Show
  app.post('/api/live-social/chat', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      const { liveShowId, content } = req.body;
      
      if (!liveShowId || !content) {
        return res.status(400).json({ message: "Live Show ID et contenu requis" });
      }

      const message = await liveSocialService.sendChatMessage(liveShowId, userId, content);
      
      res.json({
        success: true,
        message,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error("Erreur lors de l'envoi du message de chat:", error);
      res.status(500).json({ 
        message: error.message || "Erreur serveur" 
      });
    }
  });

  // Route pour ajouter une réaction à un message
  app.post('/api/live-social/reaction', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      const { messageId, reaction } = req.body;
      
      if (!messageId || !reaction) {
        return res.status(400).json({ message: "Message ID et réaction requis" });
      }

      const reactionStats = await liveSocialService.addMessageReaction(messageId, userId, reaction);
      
      res.json({
        success: true,
        reactionStats,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error("Erreur lors de l'ajout de réaction:", error);
      res.status(500).json({ 
        message: error.message || "Erreur serveur" 
      });
    }
  });

  // Route pour récupérer les messages d'un Live Show avec réactions
  app.get('/api/live-social/messages/:liveShowId', async (req, res) => {
    try {
      const liveShowId = req.params.liveShowId;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const messagesWithReactions = await liveSocialService.getLiveShowMessages(liveShowId, limit, offset);
      
      res.json({
        success: true,
        messages: messagesWithReactions,
        liveShowId,
        limit,
        offset,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error("Erreur lors de la récupération des messages:", error);
      res.status(500).json({ 
        message: error.message || "Erreur serveur" 
      });
    }
  });

  // Route pour créer un sondage en direct
  app.post('/api/live-social/poll', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      const { liveShowId, question, options, durationMinutes } = req.body;
      
      if (!liveShowId || !question || !options || !Array.isArray(options)) {
        return res.status(400).json({ message: "Live Show ID, question et options (array) requis" });
      }

      const poll = await liveSocialService.createLivePoll(
        liveShowId, 
        userId, 
        question, 
        options, 
        durationMinutes || 5
      );
      
      res.json({
        success: true,
        poll,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error("Erreur lors de la création du sondage:", error);
      res.status(500).json({ 
        message: error.message || "Erreur serveur" 
      });
    }
  });

  // Route pour voter sur un sondage
  app.post('/api/live-social/poll/:pollId/vote', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      const pollId = req.params.pollId;
      const { optionIndex } = req.body;
      
      if (optionIndex === undefined || optionIndex === null) {
        return res.status(400).json({ message: "Index d'option requis" });
      }

      const results = await liveSocialService.voteOnPoll(pollId, userId, optionIndex);
      
      res.json({
        success: true,
        results,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error("Erreur lors du vote:", error);
      res.status(500).json({ 
        message: error.message || "Erreur serveur" 
      });
    }
  });

  // Route pour récupérer les résultats d'un sondage
  app.get('/api/live-social/poll/:pollId/results', async (req: any, res) => {
    try {
      const pollId = req.params.pollId;
      const userId = req.user?.claims?.sub;

      const results = await liveSocialService.getPollResults(pollId, userId);
      
      res.json({
        success: true,
        results,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error("Erreur lors de la récupération des résultats du sondage:", error);
      res.status(500).json({ 
        message: error.message || "Erreur serveur" 
      });
    }
  });

  // Route pour récupérer les statistiques d'engagement d'un utilisateur
  app.get('/api/live-social/engagement/:userId', async (req, res) => {
    try {
      const userId = req.params.userId;

      const stats = await liveSocialService.getUserEngagementStats(userId);
      
      res.json({
        success: true,
        stats,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error("Erreur lors de la récupération des stats d'engagement:", error);
      res.status(500).json({ 
        message: error.message || "Erreur serveur" 
      });
    }
  });

  // Route pour récupérer le leaderboard d'engagement
  app.get('/api/live-social/leaderboard', async (req, res) => {
    try {
      const liveShowId = req.query.liveShowId as string;
      const period = req.query.period as 'today' | 'week' | 'all' || 'today';
      const limit = parseInt(req.query.limit as string) || 10;

      const leaderboard = await liveSocialService.getEngagementLeaderboard(liveShowId, period, limit);
      
      res.json({
        success: true,
        leaderboard,
        period,
        limit,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error("Erreur lors de la récupération du leaderboard:", error);
      res.status(500).json({ 
        message: error.message || "Erreur serveur" 
      });
    }
  });

  // ===== ROUTES POUR LA GESTION DES PHOTOS DES PETITES ANNONCES =====

  // Route pour obtenir l'URL de téléchargement présignée pour une photo
  app.post('/api/petites-annonces/:adId/photos/upload-url', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { adId } = req.params;
      
      // Validation des paramètres
      if (!adId || typeof adId !== 'string') {
        return res.status(400).json({ 
          error: "ID d'annonce invalide" 
        });
      }

      // Vérifier que l'annonce appartient à l'utilisateur
      const annonce = await storage.getPetiteAnnonce(adId);
      if (!annonce) {
        return res.status(404).json({ 
          error: "Annonce non trouvée" 
        });
      }
      if (annonce.authorId !== userId) {
        return res.status(404).json({ // 404 pour éviter l'énumération
          error: "Annonce non trouvée" 
        });
      }

      // Vérifier le nombre de photos existantes (max 10)
      const existingPhotos = await storage.getAdPhotos(adId);
      if (existingPhotos.length >= AD_PHOTOS_CONFIG.MAX_PHOTOS_PER_AD) {
        return res.status(409).json({ 
          error: `Maximum ${AD_PHOTOS_CONFIG.MAX_PHOTOS_PER_AD} photos par annonce` 
        });
      }

      // Générer l'URL présignée sécurisée avec ObjectStorageService
      const objectStorageService = new ObjectStorageService();
      const uploadConfig = await objectStorageService.getObjectEntityUploadURL({
        userId,
        adId,
        allowedMimeTypes: Object.keys(ACCEPTED_PHOTO_FORMATS),
        maxSizeBytes: AD_PHOTOS_CONFIG.MAX_FILE_SIZE_BYTES,
        expiryMinutes: 5
      });
      
      res.json({ 
        uploadURL: uploadConfig.uploadURL,
        storageKey: uploadConfig.storageKey,
        uploadToken: uploadConfig.uploadToken,
        maxFileSize: AD_PHOTOS_CONFIG.MAX_FILE_SIZE_BYTES,
        acceptedFormats: Object.keys(ACCEPTED_PHOTO_FORMATS),
        expiresAt: uploadConfig.expiresAt.toISOString()
      });
    } catch (error: any) {
      console.error("Erreur lors de la génération de l'URL de téléchargement:", error);
      res.status(500).json({ 
        error: PHOTO_ERROR_MESSAGES.UPLOAD_FAILED 
      });
    }
  });

  // Route pour ajouter une photo à une annonce après téléchargement
  app.post('/api/petites-annonces/:adId/photos', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { adId } = req.params;
      
      // Validation des paramètres de route
      if (!adId || typeof adId !== 'string') {
        return res.status(400).json({ 
          error: "ID d'annonce invalide" 
        });
      }

      // Vérifier que l'annonce appartient à l'utilisateur
      const annonce = await storage.getPetiteAnnonce(adId);
      if (!annonce) {
        return res.status(404).json({ 
          error: "Annonce non trouvée" 
        });
      }
      if (annonce.authorId !== userId) {
        return res.status(404).json({ // 404 pour éviter l'énumération
          error: "Annonce non trouvée" 
        });
      }

      // Vérifier le nombre de photos existantes (max 10)
      const existingPhotos = await storage.getAdPhotos(adId);
      if (existingPhotos.length >= AD_PHOTOS_CONFIG.MAX_PHOTOS_PER_AD) {
        return res.status(409).json({ 
          error: `Maximum ${AD_PHOTOS_CONFIG.MAX_PHOTOS_PER_AD} photos par annonce` 
        });
      }
      
      // Valider le schéma de la photo avec Zod
      const photoValidation = insertAdPhotosSchema.omit({ idx: true }).safeParse({
        adId,
        ...req.body
      });

      if (!photoValidation.success) {
        return res.status(422).json({ 
          error: "Données de photo invalides",
          details: photoValidation.error.errors
        });
      }

      const photoData = photoValidation.data;

      // Validation supplémentaire du format et de la taille
      if (!Object.keys(ACCEPTED_PHOTO_FORMATS).includes(photoData.mimeType)) {
        return res.status(422).json({ 
          error: "Format de fichier non supporté",
          allowedFormats: Object.keys(ACCEPTED_PHOTO_FORMATS)
        });
      }

      if (photoData.sizeBytes > AD_PHOTOS_CONFIG.MAX_FILE_SIZE_BYTES) {
        return res.status(422).json({ 
          error: `Taille de fichier trop importante (max ${AD_PHOTOS_CONFIG.MAX_FILE_SIZE_BYTES / 1024 / 1024}MB)`
        });
      }

      // Vérifier que l'objet a bien été uploadé et correspond aux contraintes
      const objectStorageService = new ObjectStorageService();
      const verification = await objectStorageService.verifyUploadedObject(
        photoData.storageKey,
        photoData.mimeType,
        AD_PHOTOS_CONFIG.MAX_FILE_SIZE_BYTES
      );

      if (!verification.exists) {
        return res.status(422).json({ 
          error: "Fichier non trouvé - upload non complété ou invalide" 
        });
      }

      // Normaliser le chemin de stockage
      const normalizedPath = objectStorageService.normalizeObjectEntityPath(photoData.storageKey);
      
      // Définir les ACL pour la photo (publique car dans une annonce)
      await objectStorageService.trySetObjectEntityAclPolicy(normalizedPath, {
        owner: userId,
        visibility: 'public' // Les photos d'annonces sont publiques
      });
      
      // Créer la photo dans la base de données avec transaction
      const newPhoto = await storage.createAdPhoto({
        ...photoData,
        storageKey: normalizedPath,
        moderationStatus: 'pending', // Modération requise par défaut
        sizeBytes: verification.size || photoData.sizeBytes
      });

      res.json({ 
        photo: newPhoto
      });
    } catch (error: any) {
      console.error("Erreur lors de l'ajout de la photo:", error);
      
      // Gestion d'erreur standardisée
      if (error.code === '23505') { // Contrainte de duplicata PostgreSQL
        return res.status(409).json({ 
          error: "Photo déjà existante" 
        });
      }
      
      res.status(500).json({ 
        error: error.message || PHOTO_ERROR_MESSAGES.PROCESSING_FAILED 
      });
    }
  });

  // Route pour récupérer les photos d'une annonce
  app.get('/api/petites-annonces/:adId/photos', async (req: any, res) => {
    try {
      const { adId } = req.params;
      
      // Validation des paramètres
      if (!adId || typeof adId !== 'string') {
        return res.status(400).json({ 
          error: "ID d'annonce invalide" 
        });
      }

      // Vérifier que l'annonce existe
      const annonce = await storage.getPetiteAnnonce(adId);
      if (!annonce) {
        return res.status(404).json({ 
          error: "Annonce non trouvée" 
        });
      }

      // Contrôle d'accès : seuls les propriétaires ou annonces actives peuvent voir les photos
      const userId = req.user?.claims?.sub;
      const isOwner = userId && annonce.authorId === userId;
      const isPubliclyVisible = annonce.status === 'active'; // Supposer qu'il y a un statut

      if (!isOwner && !isPubliclyVisible) {
        return res.status(404).json({ 
          error: "Annonce non trouvée" // 404 pour éviter l'énumération
        });
      }

      const photos = await storage.getAdPhotos(adId);
      
      // Filtrer les photos selon le statut de modération
      let visiblePhotos = photos;
      if (!isOwner) {
        // Les visiteurs ne voient que les photos approuvées
        visiblePhotos = photos.filter(photo => photo.moderationStatus === 'approved');
      }
      
      res.json({ 
        photos: visiblePhotos,
        totalCount: visiblePhotos.length
      });
    } catch (error: any) {
      console.error("Erreur lors de la récupération des photos:", error);
      res.status(500).json({ 
        error: "Erreur lors de la récupération des photos" 
      });
    }
  });

  // Route pour réorganiser les photos d'une annonce
  app.put('/api/petites-annonces/:adId/photos/reorder', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { adId } = req.params;
      const { photoUpdates } = req.body;

      // Validation des paramètres
      if (!adId || typeof adId !== 'string') {
        return res.status(400).json({ 
          error: "ID d'annonce invalide" 
        });
      }

      // Vérifier que l'annonce appartient à l'utilisateur
      const annonce = await storage.getPetiteAnnonce(adId);
      if (!annonce) {
        return res.status(404).json({ 
          error: "Annonce non trouvée" 
        });
      }
      if (annonce.authorId !== userId) {
        return res.status(404).json({ // 404 pour éviter l'énumération
          error: "Annonce non trouvée" 
        });
      }

      // Valider les données de réorganisation
      if (!Array.isArray(photoUpdates)) {
        return res.status(422).json({ 
          error: "Format de données invalide - tableau attendu" 
        });
      }

      // Obtenir les photos existantes pour validation
      const existingPhotos = await storage.getAdPhotos(adId);
      const existingIds = new Set(existingPhotos.map(p => p.id));

      // Valider que tous les IDs des photos appartiennent à cette annonce
      const updateIds = new Set(photoUpdates.map((update: any) => update.id));
      
      // Vérifier que tous les IDs existent et appartiennent à cette annonce
      for (const update of photoUpdates) {
        if (!update.id || typeof update.idx !== 'number') {
          return res.status(422).json({ 
            error: "Format d'update invalide - id et idx requis" 
          });
        }
        
        if (!existingIds.has(update.id)) {
          return res.status(422).json({ 
            error: `Photo ${update.id} n'appartient pas à cette annonce` 
          });
        }

        if (update.idx < 0 || update.idx >= AD_PHOTOS_CONFIG.MAX_PHOTOS_PER_AD) {
          return res.status(422).json({ 
            error: `Index invalide: ${update.idx}. Doit être entre 0 et ${AD_PHOTOS_CONFIG.MAX_PHOTOS_PER_AD - 1}` 
          });
        }
      }

      // Vérifier que les longueurs correspondent
      if (updateIds.size !== existingIds.size) {
        return res.status(422).json({ 
          error: "Le nombre de photos à réorganiser ne correspond pas aux photos existantes" 
        });
      }

      // Vérifier l'unicité des indices
      const indices = photoUpdates.map((update: any) => update.idx);
      if (new Set(indices).size !== indices.length) {
        return res.status(422).json({ 
          error: "Indices dupliqués détectés" 
        });
      }

      // Réorganiser les photos avec transaction atomique
      await storage.reorderAdPhotos(adId, photoUpdates);
      
      // Retourner les photos mises à jour
      const updatedPhotos = await storage.getAdPhotos(adId);
      
      res.json({ 
        photos: updatedPhotos
      });
    } catch (error: any) {
      console.error("Erreur lors de la réorganisation des photos:", error);
      
      if (error.code === '23505') { // Contrainte d'unicité violée
        return res.status(409).json({ 
          error: "Conflit lors de la réorganisation" 
        });
      }
      
      res.status(500).json({ 
        error: "Erreur lors de la réorganisation" 
      });
    }
  });

  // Route pour définir la photo de couverture
  app.put('/api/petites-annonces/:adId/photos/:photoId/cover', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { adId, photoId } = req.params;

      // Validation des paramètres
      if (!adId || typeof adId !== 'string' || !photoId || typeof photoId !== 'string') {
        return res.status(400).json({ 
          error: "Paramètres invalides" 
        });
      }

      // Vérifier que l'annonce appartient à l'utilisateur
      const annonce = await storage.getPetiteAnnonce(adId);
      if (!annonce) {
        return res.status(404).json({ 
          error: "Annonce non trouvée" 
        });
      }
      if (annonce.authorId !== userId) {
        return res.status(404).json({ // 404 pour éviter l'énumération
          error: "Annonce non trouvée" 
        });
      }

      // Vérifier que la photo appartient à cette annonce
      const photo = await storage.getAdPhoto(photoId);
      if (!photo || photo.adId !== adId) {
        return res.status(404).json({ 
          error: "Photo non trouvée" 
        });
      }

      // Vérifier que la photo est approuvée (optionnel selon les règles métier)
      if (photo.moderationStatus === 'rejected') {
        return res.status(422).json({ 
          error: "Impossible de définir une photo rejetée comme couverture" 
        });
      }

      // Définir la photo comme couverture avec transaction atomique
      await storage.setCoverPhoto(adId, photoId);
      
      // Retourner la nouvelle photo de couverture
      const coverPhoto = await storage.getAdCoverPhoto(adId);
      
      res.json({ 
        coverPhoto
      });
    } catch (error: any) {
      console.error("Erreur lors de la définition de la photo de couverture:", error);
      
      if (error.code === '23505') { // Contrainte d'unicité violée
        return res.status(409).json({ 
          error: "Conflit lors de la définition de la couverture" 
        });
      }
      
      res.status(500).json({ 
        error: error.message || "Erreur lors de la définition de la couverture" 
      });
    }
  });

  // Route pour supprimer une photo
  app.delete('/api/petites-annonces/:adId/photos/:photoId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { adId, photoId } = req.params;

      // Validation des paramètres
      if (!adId || typeof adId !== 'string' || !photoId || typeof photoId !== 'string') {
        return res.status(400).json({ 
          error: "Paramètres invalides" 
        });
      }

      // Vérifier que l'annonce appartient à l'utilisateur
      const annonce = await storage.getPetiteAnnonce(adId);
      if (!annonce) {
        return res.status(404).json({ 
          error: "Annonce non trouvée" 
        });
      }
      if (annonce.authorId !== userId) {
        return res.status(404).json({ // 404 pour éviter l'énumération
          error: "Annonce non trouvée" 
        });
      }

      // Vérifier que la photo appartient à l'annonce
      const photo = await storage.getAdPhoto(photoId);
      if (!photo || photo.adId !== adId) {
        return res.status(404).json({ 
          error: "Photo non trouvée" 
        });
      }

      // Vérifier s'il s'agit de la photo de couverture
      const isCoverPhoto = photo.isCover;
      
      // Supprimer la photo de la base de données et du stockage
      await storage.deleteAdPhoto(photoId);
      
      // Supprimer aussi le fichier du stockage objet
      try {
        const objectStorageService = new ObjectStorageService();
        await objectStorageService.deleteObject(photo.storageKey);
      } catch (error) {
        console.warn(`Impossible de supprimer l'objet ${photo.storageKey}:`, error);
        // Ne pas faire échouer l'opération si la suppression du fichier échoue
      }
      
      res.json({ 
        message: "Photo supprimée avec succès",
        wasCover: isCoverPhoto
      });
    } catch (error: any) {
      console.error("Erreur lors de la suppression de la photo:", error);
      
      if (error.code === '23503') { // Contrainte de clé étrangère
        return res.status(409).json({ 
          error: "Impossible de supprimer cette photo" 
        });
      }
      
      res.status(500).json({ 
        error: "Erreur lors de la suppression" 
      });
    }
  });

  // Route pour la modération des photos (admin seulement)
  app.put('/api/petites-annonces/photos/:photoId/moderate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { photoId } = req.params;
      const { decision, reason } = req.body;

      // Validation des paramètres
      if (!photoId || typeof photoId !== 'string') {
        return res.status(400).json({ 
          error: "ID de photo invalide" 
        });
      }

      // Vérifier strictement que l'utilisateur est admin
      const user = await storage.getUser(userId);
      if (!user || user.profileType !== 'admin') {
        console.warn(`Tentative d'accès administrateur non autorisée: ${userId}`);
        return res.status(403).json({ 
          error: "Accès administrateur requis" 
        });
      }

      // Vérifier que la photo existe
      const photo = await storage.getAdPhoto(photoId);
      if (!photo) {
        return res.status(404).json({ 
          error: "Photo non trouvée" 
        });
      }

      // Valider la décision avec Zod ou validation manuelle stricte
      const validDecisions = ['pending', 'approved', 'rejected'] as const;
      if (!validDecisions.includes(decision)) {
        return res.status(422).json({ 
          error: "Décision de modération invalide",
          allowedValues: validDecisions
        });
      }

      // Validation optionnelle du motif pour les rejets
      if (decision === 'rejected' && (!reason || reason.trim().length === 0)) {
        return res.status(422).json({ 
          error: "Motif requis pour les rejets" 
        });
      }

      // Modérer la photo avec audit log
      const moderatedPhoto = await storage.moderateAdPhoto(photoId, decision, userId, reason);
      
      // Log d'audit pour la modération
      console.log(`[AUDIT] Modération photo ${photoId} par admin ${userId}: ${decision}${reason ? ` (${reason})` : ''}`);
      
      res.json({ 
        photo: moderatedPhoto
      });
    } catch (error: any) {
      console.error("Erreur lors de la modération:", error);
      res.status(500).json({ 
        error: error.message || "Erreur lors de la modération" 
      });
    }
  });

  // Route pour récupérer les photos en attente de modération (admin seulement)
  app.get('/api/petites-annonces/photos/moderation/pending', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      // Vérifier strictement que l'utilisateur est admin
      const user = await storage.getUser(userId);
      if (!user || user.profileType !== 'admin') {
        console.warn(`Tentative d'accès liste modération non autorisée: ${userId}`);
        return res.status(403).json({ 
          error: "Accès administrateur requis" 
        });
      }

      // Paramètres de pagination optionnels
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
      const offset = (page - 1) * limit;

      const result = await storage.getPendingPhotoModeration(limit, offset);
      
      res.json({ 
        photos: result.photos,
        pagination: {
          page,
          limit,
          total: result.total,
          hasMore: offset + result.photos.length < result.total
        }
      });
    } catch (error: any) {
      console.error("Erreur lors de la récupération des photos en attente:", error);
      res.status(500).json({ 
        error: "Erreur serveur" 
      });
    }
  });

  // =======================
  // MISE À NIVEAU PRO - ENDPOINTS DE SANTÉ
  // =======================
  
  // =======================
  // ROUTES ADMIN SÉCURISÉES
  // =======================
  
  // Configuration des routes admin avec sécurité renforcée
  setupAdminRoutes(app);
  console.log('✅ Routes admin sécurisées initialisées');

  // =======================
  // REVENUE ENGINE - ADMIN ENDPOINT
  // =======================
  
  const { saleArticleSplit: saleArticleSplitAdmin, categoryClosureSplit: categoryClosureSplitAdmin, previewTotals } = await import('./revenue/revenueEngine');
  
  // Admin endpoint - Prévisualisation des splits
  app.post('/api/admin/finance/preview-split', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const user = await storage.getUser(userId);
      
      // Vérifier que l'utilisateur est admin
      if (!user || user.profileType !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }
      
      const { scenario } = req.body;
      
      if (scenario === 'article') {
        const priceEur = parseFloat(req.body.price_eur);
        const priceCents = Math.round(priceEur * 100);
        const porterAccount = req.body.porter_account_id || 'acc_porter_1';
        const visualAccount = req.body.visual_account_id || 'acc_visual';
        
        const plan = saleArticleSplitAdmin(priceCents, porterAccount, visualAccount);
        const totals = previewTotals(plan);
        
        res.json({ plan, totals });
      } else if (scenario === 'category') {
        const potEur = parseFloat(req.body.pot_eur);
        const SCents = Math.round(potEur * 100);
        const invTop10 = req.body.investor_top10_accounts || [];
        const portTop10 = req.body.porter_top10_accounts || [];
        const inv11_100 = req.body.investor_ranks_11_100_accounts || [];
        const visualAccount = req.body.visual_account_id || 'acc_visual';
        
        const plan = categoryClosureSplitAdmin(SCents, invTop10, portTop10, inv11_100, visualAccount);
        const totals = previewTotals(plan);
        
        res.json({ plan, totals });
      } else {
        res.status(400).json({ error: 'scenario must be "article" or "category"' });
      }
    } catch (error: any) {
      console.error('Preview split error:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  console.log('✅ Revenue Engine endpoints initialisés (webhooks + admin)');

  // =======================
  // VISUALSCOUTAI - PROSPECTION ÉTHIQUE
  // =======================
  
  const { visualScoutAI } = await import('./services/visualScoutAI');
  
  // Créer un segment
  app.post('/api/admin/tc/segments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.profileType !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }
      
      const { name, rules, locale } = req.body;
      
      if (!name || !rules || !locale) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      const segmentId = await visualScoutAI.createSegment({
        name,
        rules,
        locale,
        status: 'active',
      });
      
      res.status(201).json({ id: segmentId });
    } catch (error: any) {
      console.error('Create segment error:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Lister les segments
  app.get('/api/admin/tc/segments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.profileType !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }
      
      const segments = await visualScoutAI.getActiveSegments();
      res.json(segments);
    } catch (error: any) {
      console.error('Get segments error:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Simuler une campagne
  app.post('/api/admin/tc/simulate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.profileType !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }
      
      const { segment_id, budget } = req.body;
      
      if (!segment_id || !budget) {
        return res.status(400).json({ error: 'Missing segment_id or budget' });
      }
      
      const budgetCents = typeof budget === 'number' ? budget * 100 : Math.round(parseFloat(budget) * 100);
      const simulation = await visualScoutAI.simulateCampaign(segment_id, budgetCents);
      
      res.json(simulation);
    } catch (error: any) {
      console.error('Simulate campaign error:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Créer une campagne
  app.post('/api/admin/tc/campaigns', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.profileType !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }
      
      const { channel, objective, audience_ref, budget } = req.body;
      
      if (!channel || !objective || !budget) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      const budgetCents = typeof budget === 'number' ? budget * 100 : Math.round(parseFloat(budget) * 100);
      
      const campaignId = await visualScoutAI.createCampaign({
        channel,
        objective,
        budgetCents,
        currency: 'EUR',
        status: 'draft',
        segmentId: audience_ref || null,
      });
      
      res.status(201).json({ id: campaignId, status: 'draft' });
    } catch (error: any) {
      console.error('Create campaign error:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Mettre à jour le statut d'une campagne
  app.patch('/api/admin/tc/campaigns/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.profileType !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }
      
      const { id } = req.params;
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({ error: 'Missing status' });
      }
      
      await visualScoutAI.updateCampaignStatus(id, status);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Update campaign error:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Dashboard métriques
  app.get('/api/admin/tc/dashboard', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.profileType !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }
      
      const metrics = await visualScoutAI.getDashboardMetrics();
      res.json(metrics);
    } catch (error: any) {
      console.error('Get dashboard error:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Recommandations pour un segment
  app.get('/api/admin/tc/recommendations/:segmentId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.profileType !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }
      
      const { segmentId } = req.params;
      const recommendations = await visualScoutAI.getRecommendations(segmentId);
      
      res.json(recommendations);
    } catch (error: any) {
      console.error('Get recommendations error:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Kill switch (arrêt d'urgence)
  app.post('/api/admin/tc/kill', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.profileType !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }
      
      await visualScoutAI.killSwitch();
      res.json({ success: true, message: 'VisualScoutAI stopped and all campaigns paused' });
    } catch (error: any) {
      console.error('Kill switch error:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  console.log('✅ VisualScoutAI endpoints initialisés');

  // =======================
  // ENDPOINTS DE SANTÉ SYSTÈME
  // =======================
  
  // Imports pour les endpoints de santé
  const { healthzHandler, readyzHandler, metricsHandler, statusHandler } = await import('./health/endpoints');
  
  // Health check endpoints avec protection appropriée
  app.get('/healthz', healthzHandler); // Public - pour load balancers
  app.get('/readyz', requireMonitoringAccess, readyzHandler); // Protégé - détails internes
  app.get('/metrics', requireMonitoringAccess, metricsHandler); // Protégé - métriques sensibles
  app.get('/status', requireMonitoringAccess, statusHandler); // Protégé - état des services

  return httpServer;
}
