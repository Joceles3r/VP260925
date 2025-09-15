import express, { type Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { db } from "./db";
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
  updateSocialCommentSchema
} from "@shared/schema";
import { getMinimumCautionAmount } from "@shared/utils";
import { z } from "zod";
import multer from "multer";
import path from "path";
import { mlScoreProject } from "./services/mlScoring";
import { initializeWebSocket } from "./websocket";
import { notificationService } from "./services/notificationService";
import { VideoDepositService } from "./services/videoDepositService";
import { bunnyVideoService } from "./services/bunnyVideoService";
import { validateVideoToken, checkVideoAccess } from "./middleware/videoTokenValidator";
import { registerPurgeRoutes } from "./purge/routes";

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-08-27.basil",
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
              await storage.createTransaction({
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
              await storage.createTransaction({
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

  // Project routes
  app.get('/api/projects', async (req, res) => {
    try {
      const { limit = 50, offset = 0, category } = req.query;
      const projects = await storage.getProjects(
        parseInt(limit as string),
        parseInt(offset as string),
        category as string
      );
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get('/api/projects/:id', async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Failed to fetch project" });
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
        videoUrl: req.file ? `/uploads/${req.file.filename}` : undefined,
      });

      // Calculate ML score
      const mlScore = await mlScoreProject(projectData);
      projectData.mlScore = mlScore.toString();

      const project = await storage.createProject(projectData);
      res.status(201).json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid project data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create project" });
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

      // Validate investment amount (€1-20)
      const amount = parseFloat(req.body.amount);
      if (amount < 1 || amount > 20) {
        return res.status(400).json({ message: "Investment amount must be between €1 and €20" });
      }

      // Check if user has sufficient balance
      if (parseFloat(user.balanceEUR || '0') < amount) {
        return res.status(400).json({ message: "Insufficient balance" });
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

      // Check for milestone notifications
      const project = await storage.getProject(req.body.projectId);
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
      if (investmentAmount < 1 || investmentAmount > 20) {
        return res.status(400).json({ message: "Investment amount must be between €1 and €20" });
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
        // TODO: Implement general feed fetch
        posts = [];
      }
      
      res.json(posts);
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

  return httpServer;
}
