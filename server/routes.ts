import express, { type Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, getSession } from "./replitAuth";
import { insertProjectSchema, insertInvestmentSchema, insertTransactionSchema } from "@shared/schema";
import { getMinimumCautionAmount } from "@shared/utils";
import { z } from "zod";
import multer from "multer";
import path from "path";
import { mlScoreProject } from "./services/mlScoring";
import { initializeWebSocket } from "./websocket";
import { notificationService } from "./services/notificationService";

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

// Function getMinimumCautionAmount is now imported from @shared/utils

// File upload configuration
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
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
          }
          break;
        }

        case 'payment_intent.payment_failed': {
          const paymentIntent = event.data.object;
          const userId = paymentIntent.metadata.userId;
          
          if (userId) {
            await notificationService.notifyUser(userId, {
              type: 'payment_failed',
              title: 'Échec du paiement',
              message: 'Votre paiement a échoué. Veuillez réessayer.',
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

      const minimumCaution = getMinimumCautionAmount(user.profileType);
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

      const minimumAmount = getMinimumCautionAmount(user.profileType);
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

      const minimumAmount = getMinimumCautionAmount(user.profileType);
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
        canInvest: user.kycVerified && parseFloat(user.cautionEUR || '0') >= getMinimumCautionAmount(user.profileType)
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

  
  return httpServer;
}
