import {
  users,
  projects,
  investments,
  transactions,
  liveShows,
  complianceReports,
  notifications,
  notificationPreferences,
  videoDeposits,
  videoTokens,
  creatorQuotas,
  videoAnalytics,
  socialPosts,
  socialComments,
  socialLikes,
  visuPointsTransactions,
  paymentReceipts,
  videoCategories,
  projectExtensions,
  purgeJobs,
  withdrawalRequests,
  auditLogs,
  type User,
  type UpsertUser,
  type Project,
  type Investment,
  type Transaction,
  type LiveShow,
  type ComplianceReport,
  type Notification,
  type NotificationPreference,
  type VideoDeposit,
  type VideoToken,
  type CreatorQuota,
  type VideoAnalytics,
  type SocialPost,
  type SocialComment,
  type SocialLike,
  type VisuPointsTransaction,
  type PaymentReceipt,
  type VideoCategory,
  type ProjectExtension,
  type PurgeJob,
  type WithdrawalRequest,
  type AuditLog,
  type InsertProject,
  type InsertInvestment,
  type InsertTransaction,
  type InsertNotification,
  type InsertNotificationPreference,
  type InsertVideoDeposit,
  type InsertVideoToken,
  type InsertCreatorQuota,
  type InsertVideoAnalytics,
  type InsertSocialPost,
  type InsertSocialComment,
  type InsertSocialLike,
  type InsertVisuPointsTransaction,
  type InsertPaymentReceipt,
  type InsertVideoCategory,
  type InsertProjectExtension,
  type InsertPurgeJob,
  type InsertWithdrawalRequest,
  type InsertAuditLog,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and, gte, lte, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Project operations
  getProjects(limit?: number, offset?: number, category?: string): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, updates: Partial<Project>): Promise<Project>;
  getPendingProjects(): Promise<Project[]>;
  
  // Investment operations
  createInvestment(investment: InsertInvestment): Promise<Investment>;
  getUserInvestments(userId: string): Promise<Investment[]>;
  getProjectInvestments(projectId: string): Promise<Investment[]>;
  updateInvestmentValue(id: string, currentValue: string, roi: string): Promise<Investment>;
  
  // Transaction operations
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getUserTransactions(userId: string, limit?: number): Promise<Transaction[]>;
  getAllTransactions(limit?: number): Promise<Transaction[]>;
  
  // Live shows operations
  getActiveLiveShows(): Promise<LiveShow[]>;
  updateLiveShowInvestments(id: string, investmentA: string, investmentB: string): Promise<LiveShow>;
  
  // Admin operations
  getAllUsers(limit?: number, offset?: number): Promise<User[]>;
  getUserStats(): Promise<{ totalUsers: number; activeUsers: number; kycPending: number }>;
  getProjectStats(): Promise<{ totalProjects: number; pendingProjects: number; activeProjects: number }>;
  getTransactionStats(): Promise<{ totalVolume: string; todayVolume: string; totalCommissions: string }>;
  
  // Compliance operations
  createComplianceReport(report: Omit<ComplianceReport, 'id' | 'createdAt'>): Promise<ComplianceReport>;
  getComplianceReports(limit?: number): Promise<ComplianceReport[]>;
  
  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: string, limit?: number, offset?: number, unreadOnly?: boolean): Promise<Notification[]>;
  markNotificationAsRead(notificationId: string, userId: string): Promise<void>;
  getUserNotificationPreferences(userId: string): Promise<NotificationPreference[]>;
  updateNotificationPreferences(userId: string, preferences: Partial<NotificationPreference>[]): Promise<void>;
  
  // Video deposit operations
  createVideoDeposit(deposit: InsertVideoDeposit): Promise<string>;
  getVideoDeposit(id: string): Promise<VideoDeposit | undefined>;
  getVideoDepositByPaymentIntent(paymentIntentId: string): Promise<VideoDeposit | undefined>;
  getProjectVideoDeposits(projectId: string): Promise<VideoDeposit[]>;
  getCreatorVideoDeposits(creatorId: string): Promise<VideoDeposit[]>;
  updateVideoDeposit(id: string, updates: Partial<VideoDeposit>): Promise<VideoDeposit>;
  
  // Video token operations
  createVideoToken(token: InsertVideoToken): Promise<VideoToken>;
  getVideoToken(token: string): Promise<VideoToken | undefined>;
  getVideoTokensForDeposit(videoDepositId: string): Promise<VideoToken[]>;
  updateVideoToken(id: string, updates: Partial<VideoToken>): Promise<VideoToken>;
  revokeVideoTokens(videoDepositId: string): Promise<void>;
  
  // Creator quota operations
  getCreatorQuota(creatorId: string, period: string): Promise<CreatorQuota | undefined>;
  createCreatorQuota(quota: InsertCreatorQuota): Promise<CreatorQuota>;
  updateCreatorQuota(creatorId: string, period: string, updates: Partial<CreatorQuota>): Promise<CreatorQuota>;
  getCreatorQuotaHistory(creatorId: string): Promise<CreatorQuota[]>;
  
  // Video analytics operations
  createVideoAnalytics(analytics: InsertVideoAnalytics): Promise<VideoAnalytics>;
  getVideoAnalytics(videoDepositId: string): Promise<VideoAnalytics[]>;
  getPopularVideos(limit?: number): Promise<{ deposit: VideoDeposit; viewCount: number }[]>;
  
  // MODULE 1: Mini réseau social VISUAL
  // Social posts operations
  createSocialPost(post: InsertSocialPost): Promise<SocialPost>;
  getSocialPost(id: string): Promise<SocialPost | undefined>;
  getProjectSocialPosts(projectId: string, limit?: number, offset?: number): Promise<SocialPost[]>;
  getUserSocialPosts(authorId: string, limit?: number, offset?: number): Promise<SocialPost[]>;
  updateSocialPost(id: string, updates: Partial<SocialPost>): Promise<SocialPost>;
  deleteSocialPost(id: string): Promise<void>;
  
  // Social comments operations
  createSocialComment(comment: InsertSocialComment): Promise<SocialComment>;
  getPostComments(postId: string, limit?: number, offset?: number): Promise<SocialComment[]>;
  getCommentReplies(parentId: string, limit?: number, offset?: number): Promise<SocialComment[]>;
  updateSocialComment(id: string, updates: Partial<SocialComment>): Promise<SocialComment>;
  deleteSocialComment(id: string): Promise<void>;
  
  // Social likes operations
  createSocialLike(like: InsertSocialLike): Promise<SocialLike>;
  removeSocialLike(userId: string, postId?: string, commentId?: string): Promise<void>;
  getPostLikes(postId: string): Promise<SocialLike[]>;
  getCommentLikes(commentId: string): Promise<SocialLike[]>;
  getUserLikedPosts(userId: string, limit?: number): Promise<SocialPost[]>;
  
  // VisuPoints transactions operations
  createVisuPointsTransaction(transaction: InsertVisuPointsTransaction): Promise<VisuPointsTransaction>;
  getUserVisuPointsBalance(userId: string): Promise<number>;
  getUserVisuPointsHistory(userId: string, limit?: number): Promise<VisuPointsTransaction[]>;
  
  // MODULE 2: Cycle de vie projet vidéo
  // Project extensions operations
  createProjectExtension(extension: InsertProjectExtension): Promise<ProjectExtension>;
  getProjectExtensions(projectId: string): Promise<ProjectExtension[]>;
  getActiveProjectExtensions(): Promise<ProjectExtension[]>;
  updateProjectExtension(id: string, updates: Partial<ProjectExtension>): Promise<ProjectExtension>;
  
  // MODULE 3: Purge automatique
  // Purge jobs operations
  createPurgeJob(job: InsertPurgeJob): Promise<PurgeJob>;
  getPendingPurgeJobs(): Promise<PurgeJob[]>;
  getCompletedPurgeJobs(limit?: number): Promise<PurgeJob[]>;
  updatePurgeJob(id: string, updates: Partial<PurgeJob>): Promise<PurgeJob>;
  
  // MODULE 4: Reçus de paiement
  // Payment receipts operations
  createPaymentReceipt(receipt: InsertPaymentReceipt): Promise<PaymentReceipt>;
  getPaymentReceipt(id: string): Promise<PaymentReceipt | undefined>;
  getUserPaymentReceipts(userId: string, limit?: number): Promise<PaymentReceipt[]>;
  getPaymentReceiptByTransaction(transactionId: string): Promise<PaymentReceipt | undefined>;
  
  // MODULE 5: Règles catégories vidéos
  // Video categories operations
  createVideoCategory(category: InsertVideoCategory): Promise<VideoCategory>;
  getVideoCategory(category: string): Promise<VideoCategory | undefined>;
  getAllVideoCategories(): Promise<VideoCategory[]>;
  updateVideoCategory(category: string, updates: Partial<VideoCategory>): Promise<VideoCategory>;
  getCategoryActiveVideos(category: string): Promise<number>;
  
  // MODULE 6: Seuils de retrait
  // Withdrawal requests operations
  createWithdrawalRequest(request: InsertWithdrawalRequest): Promise<WithdrawalRequest>;
  getUserWithdrawalRequests(userId: string, limit?: number): Promise<WithdrawalRequest[]>;
  getPendingWithdrawalRequests(): Promise<WithdrawalRequest[]>;
  updateWithdrawalRequest(id: string, updates: Partial<WithdrawalRequest>): Promise<WithdrawalRequest>;
  getUserPendingWithdrawalAmount(userId: string): Promise<number>;

  // Audit logs operations for security and compliance
  createAuditLog(auditLog: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(limit?: number, offset?: number): Promise<AuditLog[]>;
  getUserAuditLogs(userId: string, limit?: number, offset?: number): Promise<AuditLog[]>;
  getAuditLogsByAction(action: string, limit?: number): Promise<AuditLog[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Project operations
  async getProjects(limit = 50, offset = 0, category?: string): Promise<Project[]> {
    const baseQuery = db.select().from(projects);
    
    if (category) {
      return await baseQuery
        .where(eq(projects.category, category))
        .orderBy(desc(projects.createdAt))
        .limit(limit)
        .offset(offset);
    }
    
    return await baseQuery
      .orderBy(desc(projects.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db.insert(projects).values(project).returning();
    return newProject;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    const [updatedProject] = await db
      .update(projects)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return updatedProject;
  }

  async getPendingProjects(): Promise<Project[]> {
    return await db
      .select()
      .from(projects)
      .where(eq(projects.status, 'pending'))
      .orderBy(desc(projects.createdAt));
  }

  // Investment operations
  async createInvestment(investment: InsertInvestment): Promise<Investment> {
    const [newInvestment] = await db.insert(investments).values(investment).returning();
    
    // Update project current amount and investor count
    await db
      .update(projects)
      .set({
        currentAmount: sql`${projects.currentAmount} + ${investment.amount}`,
        investorCount: sql`${projects.investorCount} + 1`,
      })
      .where(eq(projects.id, investment.projectId));
    
    return newInvestment;
  }

  async getUserInvestments(userId: string): Promise<Investment[]> {
    return await db
      .select()
      .from(investments)
      .where(eq(investments.userId, userId))
      .orderBy(desc(investments.createdAt));
  }

  async getProjectInvestments(projectId: string): Promise<Investment[]> {
    return await db
      .select()
      .from(investments)
      .where(eq(investments.projectId, projectId))
      .orderBy(desc(investments.createdAt));
  }

  async updateInvestmentValue(id: string, currentValue: string, roi: string): Promise<Investment> {
    const [updatedInvestment] = await db
      .update(investments)
      .set({ currentValue, roi })
      .where(eq(investments.id, id))
      .returning();
    return updatedInvestment;
  }

  // Transaction operations
  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db.insert(transactions).values(transaction).returning();
    return newTransaction;
  }

  async getUserTransactions(userId: string, limit = 50): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt))
      .limit(limit);
  }

  async getAllTransactions(limit = 100): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .orderBy(desc(transactions.createdAt))
      .limit(limit);
  }

  async getTransactionByPaymentIntent(paymentIntentId: string): Promise<Transaction | null> {
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(sql`metadata->>'paymentIntentId' = ${paymentIntentId}`)
      .limit(1);
    return transaction || null;
  }

  // Live shows operations
  async getActiveLiveShows(): Promise<LiveShow[]> {
    return await db
      .select()
      .from(liveShows)
      .where(eq(liveShows.isActive, true))
      .orderBy(desc(liveShows.createdAt));
  }

  async updateLiveShowInvestments(id: string, investmentA: string, investmentB: string): Promise<LiveShow> {
    const [updatedShow] = await db
      .update(liveShows)
      .set({ investmentA, investmentB })
      .where(eq(liveShows.id, id))
      .returning();
    return updatedShow;
  }

  // Admin operations
  async getAllUsers(limit = 100, offset = 0): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getUserStats(): Promise<{ totalUsers: number; activeUsers: number; kycPending: number }> {
    const [totalResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);
    
    const [activeResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(gte(users.updatedAt, sql`now() - interval '7 days'`));
    
    const [kycPendingResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.kycVerified, false));
    
    return {
      totalUsers: totalResult.count,
      activeUsers: activeResult.count,
      kycPending: kycPendingResult.count,
    };
  }

  async getProjectStats(): Promise<{ totalProjects: number; pendingProjects: number; activeProjects: number }> {
    const [totalResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(projects);
    
    const [pendingResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(projects)
      .where(eq(projects.status, 'pending'));
    
    const [activeResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(projects)
      .where(eq(projects.status, 'active'));
    
    return {
      totalProjects: totalResult.count,
      pendingProjects: pendingResult.count,
      activeProjects: activeResult.count,
    };
  }

  async getTransactionStats(): Promise<{ totalVolume: string; todayVolume: string; totalCommissions: string }> {
    const [totalResult] = await db
      .select({ 
        volume: sql<string>`coalesce(sum(amount), 0)`,
        commissions: sql<string>`coalesce(sum(commission), 0)`
      })
      .from(transactions);
    
    const [todayResult] = await db
      .select({ volume: sql<string>`coalesce(sum(amount), 0)` })
      .from(transactions)
      .where(gte(transactions.createdAt, sql`current_date`));
    
    return {
      totalVolume: totalResult.volume || '0',
      todayVolume: todayResult.volume || '0',
      totalCommissions: totalResult.commissions || '0',
    };
  }

  // Compliance operations
  async createComplianceReport(report: Omit<ComplianceReport, 'id' | 'createdAt'>): Promise<ComplianceReport> {
    const [newReport] = await db.insert(complianceReports).values(report).returning();
    return newReport;
  }

  async getComplianceReports(limit = 50): Promise<ComplianceReport[]> {
    return await db
      .select()
      .from(complianceReports)
      .orderBy(desc(complianceReports.createdAt))
      .limit(limit);
  }

  // Notification operations
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async getUserNotifications(userId: string, limit = 50, offset = 0, unreadOnly = false): Promise<Notification[]> {
    const query = db
      .select()
      .from(notifications)
      .where(
        unreadOnly 
          ? and(eq(notifications.userId, userId), eq(notifications.isRead, false))
          : eq(notifications.userId, userId)
      )
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);
    
    return await query;
  }

  async markNotificationAsRead(notificationId: string, userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
  }

  async getUserNotificationPreferences(userId: string): Promise<NotificationPreference[]> {
    return await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId));
  }

  async updateNotificationPreferences(userId: string, preferences: Partial<NotificationPreference>[]): Promise<void> {
    for (const pref of preferences) {
      await db
        .insert(notificationPreferences)
        .values({
          userId,
          notificationType: pref.notificationType!,
          enabled: pref.enabled ?? true,
          emailEnabled: pref.emailEnabled ?? false,
          pushEnabled: pref.pushEnabled ?? true,
          threshold: pref.threshold
        })
        .onConflictDoUpdate({
          target: [notificationPreferences.userId, notificationPreferences.notificationType],
          set: {
            enabled: pref.enabled,
            emailEnabled: pref.emailEnabled,
            pushEnabled: pref.pushEnabled,
            threshold: pref.threshold,
            updatedAt: new Date()
          }
        });
    }
  }

  // Video deposit operations
  async createVideoDeposit(deposit: InsertVideoDeposit): Promise<string> {
    const [newDeposit] = await db.insert(videoDeposits).values(deposit).returning({ id: videoDeposits.id });
    return newDeposit.id;
  }

  async getVideoDeposit(id: string): Promise<VideoDeposit | undefined> {
    const [deposit] = await db
      .select()
      .from(videoDeposits)
      .where(eq(videoDeposits.id, id));
    return deposit;
  }

  async getVideoDepositByPaymentIntent(paymentIntentId: string): Promise<VideoDeposit | undefined> {
    const [deposit] = await db
      .select()
      .from(videoDeposits)
      .where(eq(videoDeposits.paymentIntentId, paymentIntentId));
    return deposit;
  }

  async getProjectVideoDeposits(projectId: string): Promise<VideoDeposit[]> {
    return await db
      .select()
      .from(videoDeposits)
      .where(eq(videoDeposits.projectId, projectId))
      .orderBy(desc(videoDeposits.createdAt));
  }

  async getCreatorVideoDeposits(creatorId: string): Promise<VideoDeposit[]> {
    return await db
      .select()
      .from(videoDeposits)
      .where(eq(videoDeposits.creatorId, creatorId))
      .orderBy(desc(videoDeposits.createdAt));
  }

  async updateVideoDeposit(id: string, updates: Partial<VideoDeposit>): Promise<VideoDeposit> {
    const [updatedDeposit] = await db
      .update(videoDeposits)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(videoDeposits.id, id))
      .returning();
    return updatedDeposit;
  }

  // Video token operations
  async createVideoToken(token: InsertVideoToken): Promise<VideoToken> {
    const [newToken] = await db.insert(videoTokens).values(token).returning();
    return newToken;
  }

  async getVideoToken(token: string): Promise<VideoToken | undefined> {
    const [videoToken] = await db
      .select()
      .from(videoTokens)
      .where(eq(videoTokens.token, token));
    return videoToken;
  }

  async getVideoTokensForDeposit(videoDepositId: string): Promise<VideoToken[]> {
    return await db
      .select()
      .from(videoTokens)
      .where(eq(videoTokens.videoDepositId, videoDepositId))
      .orderBy(desc(videoTokens.createdAt));
  }

  async updateVideoToken(id: string, updates: Partial<VideoToken>): Promise<VideoToken> {
    const [updatedToken] = await db
      .update(videoTokens)
      .set(updates)
      .where(eq(videoTokens.id, id))
      .returning();
    return updatedToken;
  }

  async revokeVideoTokens(videoDepositId: string): Promise<void> {
    await db
      .update(videoTokens)
      .set({ isRevoked: true })
      .where(eq(videoTokens.videoDepositId, videoDepositId));
  }

  // Creator quota operations
  async getCreatorQuota(creatorId: string, period: string): Promise<CreatorQuota | undefined> {
    const [quota] = await db
      .select()
      .from(creatorQuotas)
      .where(and(eq(creatorQuotas.creatorId, creatorId), eq(creatorQuotas.period, period)));
    return quota;
  }

  async createCreatorQuota(quota: InsertCreatorQuota): Promise<CreatorQuota> {
    const [newQuota] = await db.insert(creatorQuotas).values(quota).returning();
    return newQuota;
  }

  async updateCreatorQuota(creatorId: string, period: string, updates: Partial<CreatorQuota>): Promise<CreatorQuota> {
    const [updatedQuota] = await db
      .update(creatorQuotas)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(creatorQuotas.creatorId, creatorId), eq(creatorQuotas.period, period)))
      .returning();
    return updatedQuota;
  }

  async getCreatorQuotaHistory(creatorId: string): Promise<CreatorQuota[]> {
    return await db
      .select()
      .from(creatorQuotas)
      .where(eq(creatorQuotas.creatorId, creatorId))
      .orderBy(desc(creatorQuotas.period));
  }

  // Video analytics operations
  async createVideoAnalytics(analytics: InsertVideoAnalytics): Promise<VideoAnalytics> {
    const [newAnalytics] = await db.insert(videoAnalytics).values(analytics).returning();
    return newAnalytics;
  }

  async getVideoAnalytics(videoDepositId: string): Promise<VideoAnalytics[]> {
    return await db
      .select()
      .from(videoAnalytics)
      .where(eq(videoAnalytics.videoDepositId, videoDepositId))
      .orderBy(desc(videoAnalytics.viewDate));
  }

  async getPopularVideos(limit = 10): Promise<{ deposit: VideoDeposit; viewCount: number }[]> {
    const result = await db
      .select({
        deposit: videoDeposits,
        viewCount: sql<number>`count(${videoAnalytics.id})`,
      })
      .from(videoDeposits)
      .leftJoin(videoAnalytics, eq(videoDeposits.id, videoAnalytics.videoDepositId))
      .groupBy(videoDeposits.id)
      .orderBy(desc(sql<number>`count(${videoAnalytics.id})`), desc(videoDeposits.createdAt))
      .limit(limit);
    
    return result.map(r => ({
      deposit: r.deposit,
      viewCount: r.viewCount || 0
    }));
  }

  // MODULE 1: Mini réseau social VISUAL
  // Social posts operations
  async createSocialPost(post: InsertSocialPost, tx?: any): Promise<SocialPost> {
    const dbInstance = tx || db;
    const [newPost] = await dbInstance.insert(socialPosts).values(post).returning();
    return newPost;
  }

  async getSocialPost(id: string): Promise<SocialPost | undefined> {
    const [post] = await db
      .select()
      .from(socialPosts)
      .where(eq(socialPosts.id, id));
    return post;
  }

  async getProjectSocialPosts(projectId: string, limit = 20, offset = 0): Promise<SocialPost[]> {
    return await db
      .select()
      .from(socialPosts)
      .where(eq(socialPosts.projectId, projectId))
      .orderBy(desc(socialPosts.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getUserSocialPosts(authorId: string, limit = 20, offset = 0): Promise<SocialPost[]> {
    return await db
      .select()
      .from(socialPosts)
      .where(eq(socialPosts.authorId, authorId))
      .orderBy(desc(socialPosts.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async updateSocialPost(id: string, updates: Partial<SocialPost>): Promise<SocialPost> {
    const [updatedPost] = await db
      .update(socialPosts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(socialPosts.id, id))
      .returning();
    return updatedPost;
  }

  async deleteSocialPost(id: string): Promise<void> {
    await db.delete(socialPosts).where(eq(socialPosts.id, id));
  }

  // Social comments operations
  async createSocialComment(comment: InsertSocialComment, tx?: any): Promise<SocialComment> {
    const dbInstance = tx || db;
    const [newComment] = await dbInstance.insert(socialComments).values(comment).returning();
    return newComment;
  }

  async getSocialComment(id: string): Promise<SocialComment | undefined> {
    const [comment] = await db
      .select()
      .from(socialComments)
      .where(eq(socialComments.id, id));
    return comment;
  }

  async getPostComments(postId: string, limit = 50, offset = 0): Promise<SocialComment[]> {
    return await db
      .select()
      .from(socialComments)
      .where(eq(socialComments.postId, postId))
      .orderBy(asc(socialComments.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getCommentReplies(parentId: string, limit = 20, offset = 0): Promise<SocialComment[]> {
    return await db
      .select()
      .from(socialComments)
      .where(eq(socialComments.parentId, parentId))
      .orderBy(asc(socialComments.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async updateSocialComment(id: string, updates: Partial<SocialComment>): Promise<SocialComment> {
    const [updatedComment] = await db
      .update(socialComments)
      .set(updates)
      .where(eq(socialComments.id, id))
      .returning();
    return updatedComment;
  }

  async deleteSocialComment(id: string): Promise<void> {
    await db.delete(socialComments).where(eq(socialComments.id, id));
  }

  // Social likes operations
  async createSocialLike(like: InsertSocialLike, tx?: any): Promise<SocialLike> {
    const dbInstance = tx || db;
    const [newLike] = await dbInstance.insert(socialLikes).values(like).returning();
    return newLike;
  }

  async removeSocialLike(userId: string, postId?: string, commentId?: string): Promise<void> {
    if (postId) {
      await db
        .delete(socialLikes)
        .where(and(eq(socialLikes.userId, userId), eq(socialLikes.postId, postId)));
    } else if (commentId) {
      await db
        .delete(socialLikes)
        .where(and(eq(socialLikes.userId, userId), eq(socialLikes.commentId, commentId)));
    }
  }

  async getPostLikes(postId: string): Promise<SocialLike[]> {
    return await db
      .select()
      .from(socialLikes)
      .where(eq(socialLikes.postId, postId))
      .orderBy(desc(socialLikes.createdAt));
  }

  async getCommentLikes(commentId: string): Promise<SocialLike[]> {
    return await db
      .select()
      .from(socialLikes)
      .where(eq(socialLikes.commentId, commentId))
      .orderBy(desc(socialLikes.createdAt));
  }

  async getUserLikedPosts(userId: string, limit = 20): Promise<SocialPost[]> {
    const likedPosts = await db
      .select({
        post: socialPosts,
      })
      .from(socialLikes)
      .innerJoin(socialPosts, eq(socialLikes.postId, socialPosts.id))
      .where(eq(socialLikes.userId, userId))
      .orderBy(desc(socialLikes.createdAt))
      .limit(limit);
    
    return likedPosts.map(lp => lp.post);
  }

  // VisuPoints transactions operations
  async createVisuPointsTransaction(transaction: InsertVisuPointsTransaction, tx?: any): Promise<VisuPointsTransaction> {
    const dbInstance = tx || db;
    const [newTransaction] = await dbInstance.insert(visuPointsTransactions).values(transaction).returning();
    return newTransaction;
  }

  async getUserVisuPointsBalance(userId: string): Promise<number> {
    const result = await db
      .select({ totalPoints: sql<number>`COALESCE(SUM(${visuPointsTransactions.amount}), 0)` })
      .from(visuPointsTransactions)
      .where(eq(visuPointsTransactions.userId, userId));
    
    return result[0]?.totalPoints || 0;
  }

  async getUserVisuPointsHistory(userId: string, limit = 50): Promise<VisuPointsTransaction[]> {
    return await db
      .select()
      .from(visuPointsTransactions)
      .where(eq(visuPointsTransactions.userId, userId))
      .orderBy(desc(visuPointsTransactions.createdAt))
      .limit(limit);
  }

  // MODULE 2: Cycle de vie projet vidéo
  async createProjectExtension(extension: InsertProjectExtension): Promise<ProjectExtension> {
    const [newExtension] = await db.insert(projectExtensions).values(extension).returning();
    return newExtension;
  }

  async getProjectExtensions(projectId: string): Promise<ProjectExtension[]> {
    return await db
      .select()
      .from(projectExtensions)
      .where(eq(projectExtensions.projectId, projectId))
      .orderBy(desc(projectExtensions.createdAt));
  }

  async getActiveProjectExtensions(): Promise<ProjectExtension[]> {
    const now = new Date();
    return await db
      .select()
      .from(projectExtensions)
      .where(gte(projectExtensions.extendsUntil, now))
      .orderBy(asc(projectExtensions.extendsUntil));
  }

  async updateProjectExtension(id: string, updates: Partial<ProjectExtension>): Promise<ProjectExtension> {
    const [updatedExtension] = await db
      .update(projectExtensions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(projectExtensions.id, id))
      .returning();
    return updatedExtension;
  }

  // MODULE 3: Purge automatique
  async createPurgeJob(job: InsertPurgeJob): Promise<PurgeJob> {
    const [newJob] = await db.insert(purgeJobs).values(job).returning();
    return newJob;
  }

  async getPendingPurgeJobs(): Promise<PurgeJob[]> {
    return await db
      .select()
      .from(purgeJobs)
      .where(eq(purgeJobs.status, 'pending'))
      .orderBy(asc(purgeJobs.scheduledAt));
  }

  async getCompletedPurgeJobs(limit = 20): Promise<PurgeJob[]> {
    return await db
      .select()
      .from(purgeJobs)
      .where(eq(purgeJobs.status, 'completed'))
      .orderBy(desc(purgeJobs.executedAt))
      .limit(limit);
  }

  async updatePurgeJob(id: string, updates: Partial<PurgeJob>): Promise<PurgeJob> {
    const [updatedJob] = await db
      .update(purgeJobs)
      .set(updates)
      .where(eq(purgeJobs.id, id))
      .returning();
    return updatedJob;
  }

  // MODULE 4: Reçus de paiement
  async createPaymentReceipt(receipt: InsertPaymentReceipt): Promise<PaymentReceipt> {
    const [newReceipt] = await db.insert(paymentReceipts).values(receipt).returning();
    return newReceipt;
  }

  async getPaymentReceipt(id: string): Promise<PaymentReceipt | undefined> {
    const [receipt] = await db
      .select()
      .from(paymentReceipts)
      .where(eq(paymentReceipts.id, id));
    return receipt;
  }

  async getUserPaymentReceipts(userId: string, limit = 20): Promise<PaymentReceipt[]> {
    return await db
      .select()
      .from(paymentReceipts)
      .where(eq(paymentReceipts.userId, userId))
      .orderBy(desc(paymentReceipts.createdAt))
      .limit(limit);
  }

  async getPaymentReceiptByTransaction(transactionId: string): Promise<PaymentReceipt | undefined> {
    const [receipt] = await db
      .select()
      .from(paymentReceipts)
      .where(eq(paymentReceipts.transactionId, transactionId));
    return receipt;
  }

  // MODULE 5: Règles catégories vidéos
  async createVideoCategory(category: InsertVideoCategory): Promise<VideoCategory> {
    const [newCategory] = await db.insert(videoCategories).values(category).returning();
    return newCategory;
  }

  async getVideoCategory(category: string): Promise<VideoCategory | undefined> {
    const [videoCategory] = await db
      .select()
      .from(videoCategories)
      .where(eq(videoCategories.category, category));
    return videoCategory;
  }

  async getAllVideoCategories(): Promise<VideoCategory[]> {
    return await db
      .select()
      .from(videoCategories)
      .orderBy(asc(videoCategories.category));
  }

  async updateVideoCategory(category: string, updates: Partial<VideoCategory>): Promise<VideoCategory> {
    const [updatedCategory] = await db
      .update(videoCategories)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(videoCategories.category, category))
      .returning();
    return updatedCategory;
  }

  async getCategoryActiveVideos(category: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(videoDeposits)
      .where(and(
        eq(videoDeposits.category, category),
        eq(videoDeposits.status, 'active')
      ));
    
    return result[0]?.count || 0;
  }

  // MODULE 6: Seuils de retrait
  async createWithdrawalRequest(request: InsertWithdrawalRequest): Promise<WithdrawalRequest> {
    const [newRequest] = await db.insert(withdrawalRequests).values(request).returning();
    return newRequest;
  }

  async getUserWithdrawalRequests(userId: string, limit = 20): Promise<WithdrawalRequest[]> {
    return await db
      .select()
      .from(withdrawalRequests)
      .where(eq(withdrawalRequests.userId, userId))
      .orderBy(desc(withdrawalRequests.requestedAt))
      .limit(limit);
  }

  async getPendingWithdrawalRequests(): Promise<WithdrawalRequest[]> {
    return await db
      .select()
      .from(withdrawalRequests)
      .where(eq(withdrawalRequests.status, 'pending'))
      .orderBy(asc(withdrawalRequests.requestedAt));
  }

  async updateWithdrawalRequest(id: string, updates: Partial<WithdrawalRequest>): Promise<WithdrawalRequest> {
    const [updatedRequest] = await db
      .update(withdrawalRequests)
      .set(updates)
      .where(eq(withdrawalRequests.id, id))
      .returning();
    return updatedRequest;
  }

  async getUserPendingWithdrawalAmount(userId: string): Promise<number> {
    const result = await db
      .select({ totalAmount: sql<number>`COALESCE(SUM(${withdrawalRequests.amount}), 0)` })
      .from(withdrawalRequests)
      .where(and(
        eq(withdrawalRequests.userId, userId),
        eq(withdrawalRequests.status, 'pending')
      ));
    
    return result[0]?.totalAmount || 0;
  }

  // ===== AUDIT STORAGE: SECURITY & COMPLIANCE OPERATIONS =====
  // STORAGE: createAuditLog - Creates audit trail entries for administrative actions
  async createAuditLog(auditLog: InsertAuditLog): Promise<AuditLog> {
    const [newAuditLog] = await db.insert(auditLogs).values(auditLog).returning();
    return newAuditLog;
  }

  async getAuditLogs(limit = 100, offset = 0): Promise<AuditLog[]> {
    return await db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getUserAuditLogs(userId: string, limit = 50, offset = 0): Promise<AuditLog[]> {
    return await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.userId, userId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getAuditLogsByAction(action: string, limit = 50): Promise<AuditLog[]> {
    return await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.action, action as any))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();
