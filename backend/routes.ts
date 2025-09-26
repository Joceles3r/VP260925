import express, { type Request, Response } from "express";
import { z } from "zod";
import { eq, desc, and, gte, lte, asc, count, sum } from "drizzle-orm";
import { db } from "./db";
import { 
  users, 
  projects, 
  investments, 
  transactions,
  socialPosts,
  socialComments,
  socialLikes,
  contentReports,
  notifications,
  liveShows,
  auditLogs
} from "@shared/schema";
import { 
  requireAuth, 
  requireAdminAccess, 
  optionalAuth, 
  getCurrentUser 
} from "./replitAuth";
import { upload, validateUploadedFile, getFileUrl } from "./storage";
import { calculateProjectScore, getProjectRecommendation } from "./services/mlScoring";
import { NotificationService } from "./services/notificationService";
import { ComplianceService } from "./services/compliance";
import { getWebSocketService } from "./websocket";
import { 
  calculateVotes, 
  formatCurrency, 
  calculateROI,
  getReportTypeInfo 
} from "@shared/utils";
import type { 
  ApiResponse, 
  PaginatedResponse,
  InvestmentRequest,
  CreateSocialPostRequest,
  ModerationAction,
  BattleInvestment
} from "@shared/types";

export async function registerRoutes(app: express.Application) {
  // Parse JSON bodies (but not for Stripe webhooks)
  app.use('/api', express.json({ limit: '10mb' }));
  
  // =============================================================================
  // AUTHENTICATION ROUTES
  // =============================================================================
  
  app.get('/api/auth/me', requireAuth, async (req: Request, res: Response) => {
    try {
      const user = getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          error: 'Not authenticated' 
        });
      }

      res.json({ 
        success: true, 
        data: user 
      });
    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to get user information' 
      });
    }
  });

  app.post('/api/auth/logout', (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to logout' 
        });
      }
      res.json({ 
        success: true, 
        message: 'Logged out successfully' 
      });
    });
  });

  // =============================================================================
  // PROJECT ROUTES
  // =============================================================================

  // Get all projects with optional filtering
  app.get('/api/projects', optionalAuth, async (req: Request, res: Response) => {
    try {
      const { 
        category, 
        status = 'active', 
        limit = '20', 
        page = '1',
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const pageNumber = parseInt(page as string, 10);
      const limitNumber = parseInt(limit as string, 10);
      const offset = (pageNumber - 1) * limitNumber;

      let query = db
        .select({
          project: projects,
          creator: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            profileImageUrl: users.profileImageUrl
          }
        })
        .from(projects)
        .leftJoin(users, eq(projects.creatorId, users.id));

      // Apply filters
      const conditions = [];
      if (status) conditions.push(eq(projects.status, status as any));
      if (category) conditions.push(eq(projects.category, category as string));

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      // Apply sorting
      const orderByField = projects[sortBy as keyof typeof projects] || projects.createdAt;
      query = query.orderBy(
        sortOrder === 'asc' ? asc(orderByField) : desc(orderByField)
      );

      // Apply pagination
      const results = await query.limit(limitNumber).offset(offset);

      // Get total count
      const totalResults = await db
        .select({ count: count() })
        .from(projects)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      const total = totalResults[0]?.count || 0;
      const totalPages = Math.ceil(total / limitNumber);

      const response: PaginatedResponse<any> = {
        success: true,
        data: results.map(row => ({
          ...row.project,
          creator: row.creator
        })),
        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total,
          totalPages
        }
      };

      res.json(response);
    } catch (error) {
      console.error('Get projects error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch projects' 
      });
    }
  });

  // Get single project
  app.get('/api/projects/:id', optionalAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = getCurrentUser(req);

      const result = await db
        .select({
          project: projects,
          creator: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            profileImageUrl: users.profileImageUrl
          }
        })
        .from(projects)
        .leftJoin(users, eq(projects.creatorId, users.id))
        .where(eq(projects.id, id))
        .limit(1);

      if (result.length === 0) {
        return res.status(404).json({ 
          success: false, 
          error: 'Project not found' 
        });
      }

      const projectData = {
        ...result[0].project,
        creator: result[0].creator
      };

      // If user is authenticated, check if they've invested
      if (user) {
        const userInvestment = await db
          .select()
          .from(investments)
          .where(and(
            eq(investments.projectId, id),
            eq(investments.userId, user.id)
          ))
          .limit(1);

        Object.assign(projectData, {
          isInvested: userInvestment.length > 0,
          userInvestment: userInvestment[0] || null
        });
      }

      res.json({ 
        success: true, 
        data: projectData 
      });
    } catch (error) {
      console.error('Get project error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch project' 
      });
    }
  });

  // Create new project
  const createProjectSchema = z.object({
    title: z.string().min(1).max(255),
    description: z.string().min(50).max(5000),
    category: z.string().min(1),
    targetAmount: z.number().min(100).max(100000),
    videoUrl: z.string().url().optional(),
    thumbnailUrl: z.string().url().optional()
  });

  app.post('/api/projects', requireAuth, async (req: Request, res: Response) => {
    try {
      const user = getCurrentUser(req)!;
      const validatedData = createProjectSchema.parse(req.body);

      // Calculate ML score
      const scoringResult = calculateProjectScore({
        category: validatedData.category,
        targetAmount: validatedData.targetAmount,
        description: validatedData.description,
        hasVideo: !!validatedData.videoUrl,
        hasThumbnail: !!validatedData.thumbnailUrl
      });

      // Create project
      const [project] = await db
        .insert(projects)
        .values({
          ...validatedData,
          creatorId: user.id,
          mlScore: scoringResult.score.toString(),
          status: scoringResult.score >= 6 ? 'active' : 'pending'
        })
        .returning();

      // Send notification to admins if needs review
      if (scoringResult.score < 6) {
        const wsService = getWebSocketService();
        if (wsService) {
          wsService.broadcastToAdmins({
            type: 'project_review',
            payload: {
              projectId: project.id,
              projectTitle: project.title,
              score: scoringResult.score
            },
            timestamp: Date.now()
          });
        }
      }

      res.status(201).json({ 
        success: true, 
        data: project,
        scoringResult 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          success: false, 
          error: 'Validation failed',
          details: error.errors 
        });
      }
      console.error('Create project error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to create project' 
      });
    }
  });

  // =============================================================================
  // INVESTMENT ROUTES
  // =============================================================================

  const investmentSchema = z.object({
    projectId: z.string().uuid(),
    amount: z.number().min(1).max(20)
  });

  app.post('/api/investments', requireAuth, async (req: Request, res: Response) => {
    try {
      const user = getCurrentUser(req)!;
      const validatedData = investmentSchema.parse(req.body);

      // Check user balance
      const currentBalance = parseFloat(user.balanceEUR || '0');
      if (currentBalance < validatedData.amount) {
        return res.status(400).json({ 
          success: false, 
          error: 'Insufficient balance' 
        });
      }

      // Check if project exists and is active
      const [project] = await db
        .select()
        .from(projects)
        .where(eq(projects.id, validatedData.projectId))
        .limit(1);

      if (!project) {
        return res.status(404).json({ 
          success: false, 
          error: 'Project not found' 
        });
      }

      if (project.status !== 'active') {
        return res.status(400).json({ 
          success: false, 
          error: 'Project is not accepting investments' 
        });
      }

      // Calculate votes and VISUpoints
      const votes = calculateVotes(validatedData.amount);
      const visuPoints = validatedData.amount * 100; // 1 EUR = 100 VISUpoints

      // Create investment
      const [investment] = await db
        .insert(investments)
        .values({
          userId: user.id,
          projectId: validatedData.projectId,
          amount: validatedData.amount.toString(),
          visuPoints,
          currentValue: validatedData.amount.toString(),
          votesGiven: votes
        })
        .returning();

      // Update user balance and totals
      await db
        .update(users)
        .set({
          balanceEUR: (currentBalance - validatedData.amount).toString(),
          totalInvested: (parseFloat(user.totalInvested || '0') + validatedData.amount).toString()
        })
        .where(eq(users.id, user.id));

      // Update project totals and vote count
      await db
        .update(projects)
        .set({
          currentAmount: (parseFloat(project.currentAmount || '0') + validatedData.amount).toString(),
          investorCount: (project.investorCount || 0) + 1,
          votesCount: (project.votesCount || 0) + votes
        })
        .where(eq(projects.id, validatedData.projectId));

      // Create transaction record
      await db
        .insert(transactions)
        .values({
          userId: user.id,
          type: 'investment',
          amount: validatedData.amount.toString(),
          projectId: validatedData.projectId,
          investmentId: investment.id
        });

      // Send notifications
      await NotificationService.sendNotification({
        userId: project.creatorId,
        type: 'new_investment',
        title: 'Nouvel investissement !',
        message: `${user.firstName} ${user.lastName} a investi ${formatCurrency(validatedData.amount)} dans votre projet "${project.title}".`,
        priority: 'medium',
        projectId: validatedData.projectId,
        data: {
          investorName: `${user.firstName} ${user.lastName}`,
          amount: validatedData.amount,
          votes
        }
      });

      // WebSocket notification
      const wsService = getWebSocketService();
      if (wsService) {
        wsService.notifyInvestment(
          validatedData.projectId,
          `${user.firstName} ${user.lastName}`,
          validatedData.amount
        );
      }

      res.status(201).json({ 
        success: true, 
        data: investment 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          success: false, 
          error: 'Validation failed',
          details: error.errors 
        });
      }
      console.error('Create investment error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to create investment' 
      });
    }
  });

  // Get user investments
  app.get('/api/investments', requireAuth, async (req: Request, res: Response) => {
    try {
      const user = getCurrentUser(req)!;
      const { page = '1', limit = '20' } = req.query;

      const pageNumber = parseInt(page as string, 10);
      const limitNumber = parseInt(limit as string, 10);
      const offset = (pageNumber - 1) * limitNumber;

      const result = await db
        .select({
          investment: investments,
          project: {
            id: projects.id,
            title: projects.title,
            category: projects.category,
            status: projects.status,
            thumbnailUrl: projects.thumbnailUrl
          }
        })
        .from(investments)
        .leftJoin(projects, eq(investments.projectId, projects.id))
        .where(eq(investments.userId, user.id))
        .orderBy(desc(investments.createdAt))
        .limit(limitNumber)
        .offset(offset);

      // Get total count
      const totalResults = await db
        .select({ count: count() })
        .from(investments)
        .where(eq(investments.userId, user.id));

      const total = totalResults[0]?.count || 0;
      const totalPages = Math.ceil(total / limitNumber);

      const response: PaginatedResponse<any> = {
        success: true,
        data: result.map(row => ({
          ...row.investment,
          project: row.project
        })),
        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total,
          totalPages
        }
      };

      res.json(response);
    } catch (error) {
      console.error('Get investments error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch investments' 
      });
    }
  });

  // =============================================================================
  // FILE UPLOAD ROUTES
  // =============================================================================

  app.post('/api/upload/video', requireAuth, upload.single('video'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          error: 'No video file provided' 
        });
      }

      const validation = validateUploadedFile(req.file);
      if (!validation.valid) {
        return res.status(400).json({ 
          success: false, 
          error: validation.error 
        });
      }

      const videoUrl = getFileUrl(req.file.filename, 'video');

      res.json({
        success: true,
        data: {
          url: videoUrl,
          filename: req.file.filename,
          size: req.file.size
        }
      });
    } catch (error) {
      console.error('Video upload error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to upload video' 
      });
    }
  });

  app.post('/api/upload/image', requireAuth, upload.single('image'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          error: 'No image file provided' 
        });
      }

      const validation = validateUploadedFile(req.file);
      if (!validation.valid) {
        return res.status(400).json({ 
          success: false, 
          error: validation.error 
        });
      }

      const imageUrl = getFileUrl(req.file.filename, 'image');

      res.json({
        success: true,
        data: {
          url: imageUrl,
          filename: req.file.filename,
          size: req.file.size
        }
      });
    } catch (error) {
      console.error('Image upload error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to upload image' 
      });
    }
  });

  // =============================================================================
  // ADMIN ROUTES
  // =============================================================================

  // Admin dashboard stats
  app.get('/api/admin/stats', requireAdminAccess, async (req: Request, res: Response) => {
    try {
      // Get user stats
      const totalUsersResult = await db.select({ count: count() }).from(users);
      const verifiedUsersResult = await db
        .select({ count: count() })
        .from(users)
        .where(eq(users.kycVerified, true));

      // Get project stats
      const pendingProjectsResult = await db
        .select({ count: count() })
        .from(projects)
        .where(eq(projects.status, 'pending'));

      const activeProjectsResult = await db
        .select({ count: count() })
        .from(projects)
        .where(eq(projects.status, 'active'));

      const completedProjectsResult = await db
        .select({ count: count() })
        .from(projects)
        .where(eq(projects.status, 'completed'));

      // Get transaction stats (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const transactionStats = await db
        .select({
          volume: sum(transactions.amount),
          count: count(),
          commission: sum(transactions.commission)
        })
        .from(transactions)
        .where(gte(transactions.createdAt, thirtyDaysAgo));

      // Get pending reports
      const pendingReportsResult = await db
        .select({ count: count() })
        .from(contentReports)
        .where(eq(contentReports.status, 'pending'));

      const stats = {
        users: {
          total: totalUsersResult[0]?.count || 0,
          verified: verifiedUsersResult[0]?.count || 0,
          active: totalUsersResult[0]?.count || 0 // Placeholder
        },
        projects: {
          pending: pendingProjectsResult[0]?.count || 0,
          active: activeProjectsResult[0]?.count || 0,
          completed: completedProjectsResult[0]?.count || 0
        },
        transactions: {
          volume: parseFloat(transactionStats[0]?.volume || '0'),
          count: transactionStats[0]?.count || 0,
          commission: parseFloat(transactionStats[0]?.commission || '0')
        },
        reports: {
          pending: pendingReportsResult[0]?.count || 0,
          resolved: 0 // Placeholder
        }
      };

      res.json({ 
        success: true, 
        data: stats 
      });
    } catch (error) {
      console.error('Admin stats error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch admin stats' 
      });
    }
  });

  // Health check endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ 
      success: true, 
      message: 'VISUAL API is healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  return app;
}