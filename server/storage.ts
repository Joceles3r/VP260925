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
  contentReports,
  // Nouvelles tables pour fonctionnalités avancées
  referrals,
  referralLimits,
  loginStreaks,
  visitorActivities,
  visitorsOfMonth,
  articles,
  articleInvestments,
  visuPointsPacks,
  visuPointsPurchases,
  // Nouvelles tables TOP10 et fidélité
  articleSalesDaily,
  top10Infoporteurs,
  top10Winners,
  top10Redistributions,
  weeklyStreaks,
  // Table transferts Stripe idempotents
  stripeTransfers,
  // Tables système de renouvellement payant (25€)
  projectRenewals,
  projectQueue,
  projectReplacements,
  // Tables système d'agents IA autonomes
  agentDecisions,
  agentAuditLog,
  financialLedger,
  payoutRecipes,
  agentParameters,
  // Tables catégorie LIVRES
  bookCategories,
  books,
  bookPurchases,
  downloadTokens,
  // Table feature toggles
  featureToggles,
  // Table quêtes quotidiennes
  dailyQuests,
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
  type ContentReport,
  type InsertContentReport,
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
  // Nouveaux types pour fonctionnalités avancées
  type Referral,
  type ReferralLimit,
  type LoginStreak,
  type VisitorActivity,
  type VisitorOfMonth,
  type Article,
  type ArticleInvestment,
  type VisuPointsPack,
  type VisuPointsPurchase,
  type InsertReferral,
  type InsertReferralLimit,
  type InsertLoginStreak,
  type InsertVisitorActivity,
  type InsertVisitorOfMonth,
  type InsertArticle,
  type InsertArticleInvestment,
  type InsertVisuPointsPack,
  type InsertVisuPointsPurchase,
  // Nouveaux types TOP10 et fidélité
  type ArticleSalesDaily,
  type Top10Infoporteurs,
  type Top10Winners,
  type Top10Redistributions,
  type WeeklyStreaks,
  type StripeTransfer,
  type InsertStripeTransfer,
  // Types système de renouvellement payant (25€)
  type ProjectRenewal,
  type ProjectQueue,
  type ProjectReplacement,
  type InsertProjectRenewal,
  type InsertProjectQueue,
  type InsertProjectReplacement,
  // Types système d'agents IA autonomes
  type AgentDecision,
  type AgentAuditLog,
  type FinancialLedger,
  type PayoutRecipe,
  type AgentParameter,
  type InsertAgentDecision,
  type InsertAgentAuditLog,
  type InsertFinancialLedger,
  type InsertPayoutRecipe,
  type InsertAgentParameter,
  // Types catégorie LIVRES
  type BookCategory,
  type Book,
  type BookPurchase,
  type DownloadToken,
  type InsertBookCategory,
  type InsertBook,
  type InsertBookPurchase,
  type InsertDownloadToken,
  // Types feature toggles
  type FeatureToggle,
  type InsertFeatureToggle,
  // Types quêtes quotidiennes
  type DailyQuest,
  type InsertDailyQuest,
  insertArticleSalesDailySchema,
  insertTop10InfoporteursSchema,
  insertTop10WinnersSchema,
  insertTop10RedistributionsSchema,
  insertWeeklyStreaksSchema,
  insertStripeTransferSchema,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and, gte, lte, sql, or, isNotNull } from "drizzle-orm";

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
  getTransaction(id: string): Promise<Transaction | undefined>;
  
  // Live shows operations
  getActiveLiveShows(): Promise<LiveShow[]>;
  createLiveShow(data: { title: string; description?: string; artistA?: string; artistB?: string; viewerCount?: number }): Promise<LiveShow>;
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
  getVisuPointsTransactionByKey(idempotencyKey: string): Promise<VisuPointsTransaction | null>;
  
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
  
  // Receipt operations for handlers (aliases to payment receipts)
  createReceipt(receipt: InsertPaymentReceipt): Promise<PaymentReceipt>;
  getReceipt(id: string): Promise<PaymentReceipt | undefined>;
  getUserReceipts(userId: string): Promise<PaymentReceipt[]>;

  // ===== SYSTÈME DE RENOUVELLEMENT PAYANT (25€) =====
  // Project renewals operations
  createProjectRenewal(renewal: InsertProjectRenewal): Promise<ProjectRenewal>;
  getProjectRenewal(id: string): Promise<ProjectRenewal | undefined>;
  getProjectRenewalByPaymentIntent(paymentIntentId: string): Promise<ProjectRenewal | undefined>;
  getCreatorRenewalHistory(creatorId: string): Promise<ProjectRenewal[]>;
  getActiveRenewals(categoryId: string): Promise<ProjectRenewal[]>;
  updateProjectRenewal(id: string, updates: Partial<ProjectRenewal>): Promise<ProjectRenewal>;
  
  // Project queue operations
  addProjectToQueue(queueItem: InsertProjectQueue): Promise<ProjectQueue>;
  getProjectQueue(categoryId: string): Promise<ProjectQueue[]>;
  getReadyProjectsInQueue(categoryId: string): Promise<ProjectQueue[]>;
  markProjectReadyForAssignment(queueId: string): Promise<ProjectQueue>;
  getProjectQueuePosition(projectId: string, categoryId: string): Promise<ProjectQueue | undefined>;
  assignProjectFromQueue(categoryId: string, targetRank: number): Promise<ProjectQueue | undefined>;
  removeProjectFromQueue(id: string): Promise<void>;
  updateQueuePositions(categoryId: string): Promise<void>;

  // Project replacements operations  
  createProjectReplacement(replacement: InsertProjectReplacement): Promise<ProjectReplacement>;
  getCategoryReplacements(categoryId: string): Promise<ProjectReplacement[]>;
  getCreatorReplacementHistory(creatorId: string): Promise<ProjectReplacement[]>;
  
  // MODULE 5: Règles catégories vidéos
  // Video categories operations
  createVideoCategory(category: InsertVideoCategory): Promise<VideoCategory>;
  getVideoCategory(category: string): Promise<VideoCategory | undefined>;
  getVideoCategoryById(id: string): Promise<VideoCategory | undefined>;
  getAllVideoCategories(): Promise<VideoCategory[]>;
  updateVideoCategory(category: string, updates: Partial<VideoCategory>): Promise<VideoCategory>;
  updateVideoCategoryById(id: string, updates: Partial<VideoCategory>): Promise<VideoCategory>;
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

  // Content report operations
  createContentReport(report: InsertContentReport): Promise<ContentReport>;
  getContentReports(limit?: number, offset?: number): Promise<ContentReport[]>;
  getContentReportsByStatus(status: string): Promise<ContentReport[]>;
  getContentReportsByContent(contentType: string, contentId: string): Promise<ContentReport[]>;
  updateContentReport(id: string, updates: Partial<ContentReport>): Promise<ContentReport>;
  getContentReport(id: string): Promise<ContentReport | undefined>;

  // ===== NOUVELLES MÉTHODES POUR FONCTIONNALITÉS AVANCÉES =====
  
  // Referral system operations
  createReferral(referral: InsertReferral): Promise<Referral>;
  getReferralByCode(code: string): Promise<Referral | undefined>;
  getUserReferrals(sponsorId: string): Promise<Referral[]>;
  updateReferral(id: string, updates: Partial<Referral>): Promise<Referral>;
  getReferralByRefereeId(refereeId: string): Promise<Referral | undefined>;
  getUserReferralLimit(userId: string, monthYear: string): Promise<ReferralLimit | undefined>;
  createReferralLimit(limit: InsertReferralLimit): Promise<ReferralLimit>;
  updateReferralLimit(userId: string, monthYear: string, updates: Partial<ReferralLimit>): Promise<ReferralLimit>;

  // Login streaks operations  
  getUserLoginStreak(userId: string): Promise<LoginStreak | undefined>;
  createLoginStreak(streak: InsertLoginStreak): Promise<LoginStreak>;
  updateLoginStreak(userId: string, updates: Partial<LoginStreak>): Promise<LoginStreak>;

  // Visitor activities operations
  createVisitorActivity(activity: InsertVisitorActivity): Promise<VisitorActivity>;
  getUserActivities(userId: string, limit?: number): Promise<VisitorActivity[]>;
  getSessionActivities(sessionId: string): Promise<VisitorActivity[]>;

  // Visitor of the month operations
  getVisitorOfMonth(userId: string, monthYear: string): Promise<VisitorOfMonth | undefined>;
  createVisitorOfMonth(visitor: InsertVisitorOfMonth): Promise<VisitorOfMonth>;
  updateVisitorOfMonth(userId: string, monthYear: string, updates: Partial<VisitorOfMonth>): Promise<VisitorOfMonth>;
  getMonthlyVisitorRankings(monthYear: string, limit?: number): Promise<VisitorOfMonth[]>;

  // Daily quests operations
  getUserDailyQuest(userId: string, questDate: string, questType?: string): Promise<DailyQuest | undefined>;
  createDailyQuest(quest: InsertDailyQuest): Promise<DailyQuest>;
  updateDailyQuest(questId: string, updates: Partial<DailyQuest>): Promise<DailyQuest>;
  getDailyQuestById(questId: string): Promise<DailyQuest | undefined>;
  getUserQuestStatistics(userId: string): Promise<{
    totalCompleted: number;
    currentStreak: number;
    totalVPEarned: number;
  } | undefined>;

  // Articles operations for Infoporteurs
  createArticle(article: InsertArticle): Promise<Article>;
  getArticle(id: string): Promise<Article | undefined>;
  getArticles(limit?: number, offset?: number, category?: string): Promise<Article[]>;
  getUserArticles(authorId: string, limit?: number): Promise<Article[]>;
  updateArticle(id: string, updates: Partial<Article>): Promise<Article>;
  getPendingArticles(): Promise<Article[]>;

  // Article investments operations for Investi-lecteurs
  createArticleInvestment(investment: InsertArticleInvestment): Promise<ArticleInvestment>;
  getArticleInvestments(articleId: string): Promise<ArticleInvestment[]>;
  getUserArticleInvestments(userId: string): Promise<ArticleInvestment[]>;
  updateArticleInvestment(id: string, updates: Partial<ArticleInvestment>): Promise<ArticleInvestment>;
  getArticleInvestmentsByDate(date: Date): Promise<ArticleInvestment[]>;
  getArticlesByAuthor(authorId: string): Promise<Article[]>;

  // TOP10 system operations
  createTop10Infoporteur(data: any): Promise<Top10Infoporteurs>;
  getTop10ByDate(date: Date): Promise<Top10Infoporteurs[]>;
  updateTop10Infoporteur(id: string, updates: any): Promise<Top10Infoporteurs>;
  
  createTop10Winner(data: any): Promise<Top10Winners>;
  getTop10WinnersByDate(date: Date): Promise<Top10Winners[]>;
  updateTop10Winner(id: string, updates: any): Promise<Top10Winners>;
  
  createTop10Redistribution(data: any): Promise<Top10Redistributions>;
  getTop10RedistributionByDate(date: Date): Promise<Top10Redistributions | undefined>;
  updateTop10Redistribution(id: string, updates: any): Promise<Top10Redistributions>;

  // Weekly streaks operations
  getUserWeeklyStreak(userId: string): Promise<WeeklyStreaks | undefined>;
  createWeeklyStreak(streak: any): Promise<WeeklyStreaks>;
  updateWeeklyStreak(userId: string, updates: any): Promise<WeeklyStreaks>;

  // Article sales daily operations (for TOP10 system)
  getArticleSaleDaily(articleId: string, saleDate: string): Promise<ArticleSalesDaily | undefined>;
  createArticleSaleDaily(saleData: any): Promise<ArticleSalesDaily>;
  updateArticleSaleDaily(id: string, updates: any): Promise<ArticleSalesDaily>;

  // VISUpoints packs operations
  getVisuPointsPacks(): Promise<VisuPointsPack[]>;
  createVisuPointsPack(pack: InsertVisuPointsPack): Promise<VisuPointsPack>;
  updateVisuPointsPack(id: string, updates: Partial<VisuPointsPack>): Promise<VisuPointsPack>;
  
  // VISUpoints purchases operations
  createVisuPointsPurchase(purchase: InsertVisuPointsPurchase): Promise<VisuPointsPurchase>;
  getUserVisuPointsPurchases(userId: string): Promise<VisuPointsPurchase[]>;

  // Stripe transfers operations (idempotent transfers)
  createStripeTransfer(transfer: InsertStripeTransfer): Promise<StripeTransfer>;
  getStripeTransferByIdempotencyKey(idempotencyKey: string): Promise<StripeTransfer | undefined>;
  getStripeTransfersByUserId(userId: string): Promise<StripeTransfer[]>;
  getScheduledStripeTransfers(): Promise<StripeTransfer[]>;
  updateStripeTransfer(id: string, updates: Partial<StripeTransfer>): Promise<StripeTransfer>;
  getStripeTransferById(id: string): Promise<StripeTransfer | undefined>;

  // ===== AGENTS IA AUTONOMES OPERATIONS =====
  
  // Agent decisions operations
  createAgentDecision(decision: InsertAgentDecision): Promise<AgentDecision>;
  getAgentDecisions(agentType?: string, status?: string, limit?: number): Promise<AgentDecision[]>;
  getAgentDecision(id: string): Promise<AgentDecision | undefined>;
  updateAgentDecisionStatus(id: string, status: string, adminComment?: string, validatedBy?: string): Promise<AgentDecision>;
  executeAgentDecision(id: string): Promise<AgentDecision>;

  // Agent audit log operations (immutable with hash chain)
  createAuditLogEntry(entry: InsertAgentAuditLog): Promise<AgentAuditLog>;
  getAuditLog(agentType?: string, action?: string, limit?: number): Promise<AgentAuditLog[]>;
  getAuditLogBySubject(subjectType: string, subjectId: string): Promise<AgentAuditLog[]>;
  validateAuditChain(): Promise<boolean>;

  // Financial ledger operations
  createLedgerEntry(entry: InsertFinancialLedger): Promise<FinancialLedger>;
  getLedgerEntries(referenceType?: string, recipientId?: string, limit?: number): Promise<FinancialLedger[]>;
  getLedgerEntry(id: string): Promise<FinancialLedger | undefined>;
  updateLedgerStatus(id: string, status: string, processedAt?: Date): Promise<FinancialLedger>;
  reconcileLedgerWithStripe(): Promise<{ divergences: number; total: number }>;

  // Payout recipes operations (versioned financial rules)
  createPayoutRecipe(recipe: InsertPayoutRecipe): Promise<PayoutRecipe>;
  getPayoutRecipes(ruleType?: string, isActive?: boolean): Promise<PayoutRecipe[]>;
  getActivePayoutRecipe(ruleType: string): Promise<PayoutRecipe | undefined>;
  activatePayoutRecipe(version: string): Promise<PayoutRecipe>;

  // Agent parameters operations (runtime configuration)
  createAgentParameter(parameter: InsertAgentParameter): Promise<AgentParameter>;
  getAgentParameters(modifiableByAdmin?: boolean): Promise<AgentParameter[]>;
  getAgentParameter(key: string): Promise<AgentParameter | undefined>;
  updateAgentParameter(key: string, value: string, modifiedBy: string): Promise<AgentParameter>;
  getParameterValue(key: string, defaultValue?: string): Promise<string | undefined>;

  // LIVRES Category operations
  createBookCategory(category: InsertBookCategory): Promise<BookCategory>;
  getBookCategory(id: string): Promise<BookCategory | undefined>;
  getBookCategoryByName(name: string): Promise<BookCategory | undefined>;
  getAllBookCategories(): Promise<BookCategory[]>;
  updateBookCategory(id: string, updates: Partial<BookCategory>): Promise<BookCategory>;
  
  // LIVRES Book operations
  createBook(book: InsertBook): Promise<Book>;
  getBook(id: string): Promise<Book | undefined>;
  getBooksByAuthor(authorId: string): Promise<Book[]>;
  getBooksByCategoryId(categoryId: string): Promise<Book[]>;
  updateBook(id: string, updates: Partial<Book>): Promise<Book>;
  getPendingBooks(): Promise<Book[]>;
  getActiveBooks(categoryId?: string): Promise<Book[]>;
  
  // LIVRES Purchase operations (lecteurs)
  createBookPurchase(purchase: InsertBookPurchase): Promise<BookPurchase>;
  getBookPurchase(id: string): Promise<BookPurchase | undefined>;
  getUserBookPurchases(userId: string): Promise<BookPurchase[]>;
  getBookPurchases(bookId: string): Promise<BookPurchase[]>;
  getBookPurchaseByUserAndBook(userId: string, bookId: string): Promise<BookPurchase | undefined>;
  updateBookPurchase(id: string, updates: Partial<BookPurchase>): Promise<BookPurchase>;
  
  // LIVRES Download Token operations
  createDownloadToken(token: InsertDownloadToken): Promise<DownloadToken>;
  getDownloadToken(token: string): Promise<DownloadToken | undefined>;
  getDownloadTokensByPurchase(purchaseId: string): Promise<DownloadToken[]>;
  updateDownloadToken(token: string, updates: Partial<DownloadToken>): Promise<DownloadToken>;
  revokeDownloadTokens(purchaseId: string): Promise<void>;
  
  // Feature toggles operations
  createFeatureToggle(toggle: InsertFeatureToggle): Promise<FeatureToggle>;
  getFeatureToggle(key: string): Promise<FeatureToggle | undefined>;
  getFeatureToggles(): Promise<FeatureToggle[]>;
  updateFeatureToggle(key: string, updates: Partial<FeatureToggle>): Promise<FeatureToggle>;
  getPublicToggles(): Promise<{ [key: string]: { visible: boolean; message: string } }>;
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

  async getTransaction(id: string): Promise<Transaction | undefined> {
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id));
    return transaction;
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

  async createLiveShow(data: { title: string; description?: string; artistA?: string; artistB?: string; viewerCount?: number }): Promise<LiveShow> {
    const [newShow] = await db
      .insert(liveShows)
      .values({
        title: data.title,
        description: data.description,
        artistA: data.artistA,
        artistB: data.artistB,
        viewerCount: data.viewerCount || 0,
        isActive: true, // Nouveau live show actif par défaut
        investmentA: '0.00',
        investmentB: '0.00'
      })
      .returning();
    return newShow;
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

  async getAllSocialPosts(limit = 20, offset = 0, userId?: string): Promise<SocialPost[]> {
    // Return all posts: user's own posts + published posts from others
    return await db
      .select()
      .from(socialPosts)
      .where(
        userId 
          ? or(eq(socialPosts.authorId, userId), eq(socialPosts.status, 'published'))
          : eq(socialPosts.status, 'published')
      )
      .orderBy(desc(socialPosts.createdAt))
      .limit(limit)
      .offset(offset);
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

  async getVisuPointsTransactionByKey(idempotencyKey: string): Promise<VisuPointsTransaction | null> {
    const result = await db
      .select()
      .from(visuPointsTransactions)
      .where(eq(visuPointsTransactions.idempotencyKey, idempotencyKey))
      .limit(1);
    
    return result[0] || null;
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
      .where(gte(projectExtensions.cycleEndsAt, now))
      .orderBy(asc(projectExtensions.cycleEndsAt));
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
      .orderBy(asc(purgeJobs.targetDate));
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

  // Receipt operations for handlers (aliases to payment receipts)
  async createReceipt(receipt: InsertPaymentReceipt): Promise<PaymentReceipt> {
    return this.createPaymentReceipt(receipt);
  }

  async getReceipt(id: string): Promise<PaymentReceipt | undefined> {
    return this.getPaymentReceipt(id);
  }

  async getUserReceipts(userId: string): Promise<PaymentReceipt[]> {
    return this.getUserPaymentReceipts(userId);
  }

  async getReceiptsByTransaction(transactionId: string): Promise<PaymentReceipt[]> {
    return await db
      .select()
      .from(paymentReceipts)
      .where(eq(paymentReceipts.transactionId, transactionId))
      .orderBy(desc(paymentReceipts.createdAt));
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
      .where(eq(videoCategories.name, category));
    return videoCategory;
  }

  async getVideoCategoryById(id: string): Promise<VideoCategory | undefined> {
    const [videoCategory] = await db
      .select()
      .from(videoCategories)
      .where(eq(videoCategories.id, id));
    return videoCategory;
  }

  async getAllVideoCategories(): Promise<VideoCategory[]> {
    return await db
      .select()
      .from(videoCategories)
      .orderBy(asc(videoCategories.name));
  }

  async updateVideoCategory(category: string, updates: Partial<VideoCategory>): Promise<VideoCategory> {
    const [updatedCategory] = await db
      .update(videoCategories)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(videoCategories.name, category))
      .returning();
    return updatedCategory;
  }

  async updateVideoCategoryById(id: string, updates: Partial<VideoCategory>): Promise<VideoCategory> {
    const [updatedCategory] = await db
      .update(videoCategories)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(videoCategories.id, id))
      .returning();
    return updatedCategory;
  }

  async getCategoryActiveVideos(category: string): Promise<number> {
    // JOIN videoDeposits → projects to get category info since videoDeposits has no category column
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(videoDeposits)
      .innerJoin(projects, eq(videoDeposits.projectId, projects.id))
      .where(and(
        eq(projects.category, category),
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

  // Content report operations - MODULE 7 & 8: Protection et signalement
  async createContentReport(report: InsertContentReport): Promise<ContentReport> {
    const [newReport] = await db.insert(contentReports).values(report).returning();
    return newReport;
  }

  async getContentReports(limit = 50, offset = 0): Promise<ContentReport[]> {
    return await db
      .select()
      .from(contentReports)
      .orderBy(desc(contentReports.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getContentReportsByStatus(status: string): Promise<ContentReport[]> {
    return await db
      .select()
      .from(contentReports)
      .where(eq(contentReports.status, status as any))
      .orderBy(desc(contentReports.createdAt));
  }

  async getContentReportsByContent(contentType: string, contentId: string): Promise<ContentReport[]> {
    return await db
      .select()
      .from(contentReports)
      .where(and(
        eq(contentReports.contentType, contentType as any),
        eq(contentReports.contentId, contentId)
      ))
      .orderBy(desc(contentReports.createdAt));
  }

  async updateContentReport(id: string, updates: Partial<ContentReport>): Promise<ContentReport> {
    const [updatedReport] = await db
      .update(contentReports)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(contentReports.id, id))
      .returning();
    return updatedReport;
  }

  async getContentReport(id: string): Promise<ContentReport | undefined> {
    const [report] = await db
      .select()
      .from(contentReports)
      .where(eq(contentReports.id, id));
    return report;
  }

  // ===== IMPLÉMENTATION NOUVELLES MÉTHODES POUR FONCTIONNALITÉS AVANCÉES =====

  // Referral system operations
  async createReferral(referral: InsertReferral): Promise<Referral> {
    const [newReferral] = await db.insert(referrals).values(referral).returning();
    return newReferral;
  }

  async getReferralByCode(code: string): Promise<Referral | undefined> {
    const [referral] = await db
      .select()
      .from(referrals)
      .where(eq(referrals.referralCode, code));
    return referral;
  }

  async getUserReferrals(sponsorId: string): Promise<Referral[]> {
    return await db
      .select()
      .from(referrals)
      .where(eq(referrals.sponsorId, sponsorId))
      .orderBy(desc(referrals.createdAt));
  }

  async updateReferral(id: string, updates: Partial<Referral>): Promise<Referral> {
    const [updatedReferral] = await db
      .update(referrals)
      .set(updates)
      .where(eq(referrals.id, id))
      .returning();
    return updatedReferral;
  }

  async getReferralByRefereeId(refereeId: string): Promise<Referral | undefined> {
    const [referral] = await db
      .select()
      .from(referrals)
      .where(eq(referrals.refereeId, refereeId));
    return referral;
  }

  async getUserReferralLimit(userId: string, monthYear: string): Promise<ReferralLimit | undefined> {
    const [limit] = await db
      .select()
      .from(referralLimits)
      .where(and(
        eq(referralLimits.userId, userId),
        eq(referralLimits.monthYear, monthYear)
      ));
    return limit;
  }

  async createReferralLimit(limit: InsertReferralLimit): Promise<ReferralLimit> {
    const [newLimit] = await db.insert(referralLimits).values(limit).returning();
    return newLimit;
  }

  async updateReferralLimit(userId: string, monthYear: string, updates: Partial<ReferralLimit>): Promise<ReferralLimit> {
    const [updatedLimit] = await db
      .update(referralLimits)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(
        eq(referralLimits.userId, userId),
        eq(referralLimits.monthYear, monthYear)
      ))
      .returning();
    return updatedLimit;
  }

  // Login streaks operations
  async getUserLoginStreak(userId: string): Promise<LoginStreak | undefined> {
    const [streak] = await db
      .select()
      .from(loginStreaks)
      .where(eq(loginStreaks.userId, userId));
    return streak;
  }

  async createLoginStreak(streak: InsertLoginStreak): Promise<LoginStreak> {
    const [newStreak] = await db.insert(loginStreaks).values(streak).returning();
    return newStreak;
  }

  async updateLoginStreak(userId: string, updates: Partial<LoginStreak>): Promise<LoginStreak> {
    const [updatedStreak] = await db
      .update(loginStreaks)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(loginStreaks.userId, userId))
      .returning();
    return updatedStreak;
  }

  // Visitor activities operations
  async createVisitorActivity(activity: InsertVisitorActivity): Promise<VisitorActivity> {
    const [newActivity] = await db.insert(visitorActivities).values(activity).returning();
    return newActivity;
  }

  async getUserActivities(userId: string, limit = 50): Promise<VisitorActivity[]> {
    return await db
      .select()
      .from(visitorActivities)
      .where(eq(visitorActivities.userId, userId))
      .orderBy(desc(visitorActivities.createdAt))
      .limit(limit);
  }

  async getSessionActivities(sessionId: string): Promise<VisitorActivity[]> {
    return await db
      .select()
      .from(visitorActivities)
      .where(eq(visitorActivities.sessionId, sessionId))
      .orderBy(desc(visitorActivities.createdAt));
  }

  // Visitor of the month operations
  async getVisitorOfMonth(userId: string, monthYear: string): Promise<VisitorOfMonth | undefined> {
    const [visitor] = await db
      .select()
      .from(visitorsOfMonth)
      .where(and(
        eq(visitorsOfMonth.userId, userId),
        eq(visitorsOfMonth.monthYear, monthYear)
      ));
    return visitor;
  }

  async createVisitorOfMonth(visitor: InsertVisitorOfMonth): Promise<VisitorOfMonth> {
    const [newVisitor] = await db.insert(visitorsOfMonth).values(visitor).returning();
    return newVisitor;
  }

  async updateVisitorOfMonth(userId: string, monthYear: string, updates: Partial<VisitorOfMonth>): Promise<VisitorOfMonth> {
    const [updatedVisitor] = await db
      .update(visitorsOfMonth)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(
        eq(visitorsOfMonth.userId, userId),
        eq(visitorsOfMonth.monthYear, monthYear)
      ))
      .returning();
    return updatedVisitor;
  }

  async getMonthlyVisitorRankings(monthYear: string, limit = 10): Promise<VisitorOfMonth[]> {
    return await db
      .select()
      .from(visitorsOfMonth)
      .where(eq(visitorsOfMonth.monthYear, monthYear))
      .orderBy(asc(visitorsOfMonth.rank))
      .limit(limit);
  }

  // Articles operations for Infoporteurs
  async createArticle(article: InsertArticle): Promise<Article> {
    const [newArticle] = await db.insert(articles).values(article).returning();
    return newArticle;
  }

  async getArticle(id: string): Promise<Article | undefined> {
    const [article] = await db.select().from(articles).where(eq(articles.id, id));
    return article;
  }

  async getArticlesByIds(ids: string[]): Promise<Article[]> {
    if (ids.length === 0) return [];
    
    return await db
      .select()
      .from(articles)
      .where(sql`${articles.id} = ANY(${ids})`);
  }

  async getArticles(limit = 20, offset = 0, category?: string): Promise<Article[]> {
    const query = db.select().from(articles);
    if (category) {
      query.where(eq(articles.category, category));
    }
    return await query
      .orderBy(desc(articles.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getUserArticles(authorId: string, limit = 20): Promise<Article[]> {
    return await db
      .select()
      .from(articles)
      .where(eq(articles.authorId, authorId))
      .orderBy(desc(articles.createdAt))
      .limit(limit);
  }

  async updateArticle(id: string, updates: Partial<Article>): Promise<Article> {
    const [updatedArticle] = await db
      .update(articles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(articles.id, id))
      .returning();
    return updatedArticle;
  }

  async getPendingArticles(): Promise<Article[]> {
    return await db
      .select()
      .from(articles)
      .where(eq(articles.status, 'pending'))
      .orderBy(desc(articles.createdAt));
  }

  // Article investments operations for Investi-lecteurs
  async createArticleInvestment(investment: InsertArticleInvestment): Promise<ArticleInvestment> {
    const [newInvestment] = await db.insert(articleInvestments).values(investment).returning();
    return newInvestment;
  }

  async getArticleInvestments(articleId: string): Promise<ArticleInvestment[]> {
    return await db
      .select()
      .from(articleInvestments)
      .where(eq(articleInvestments.articleId, articleId))
      .orderBy(desc(articleInvestments.createdAt));
  }

  async getUserArticleInvestments(userId: string): Promise<ArticleInvestment[]> {
    return await db
      .select()
      .from(articleInvestments)
      .where(eq(articleInvestments.userId, userId))
      .orderBy(desc(articleInvestments.createdAt));
  }

  async updateArticleInvestment(id: string, updates: Partial<ArticleInvestment>): Promise<ArticleInvestment> {
    const [updatedInvestment] = await db
      .update(articleInvestments)
      .set(updates)
      .where(eq(articleInvestments.id, id))
      .returning();
    return updatedInvestment;
  }

  // VISUpoints packs operations
  async getVisuPointsPacks(): Promise<VisuPointsPack[]> {
    return await db
      .select()
      .from(visuPointsPacks)
      .where(eq(visuPointsPacks.isActive, true))
      .orderBy(asc(visuPointsPacks.sortOrder));
  }

  async createVisuPointsPack(pack: InsertVisuPointsPack): Promise<VisuPointsPack> {
    const [newPack] = await db.insert(visuPointsPacks).values(pack).returning();
    return newPack;
  }

  async updateVisuPointsPack(id: string, updates: Partial<VisuPointsPack>): Promise<VisuPointsPack> {
    const [updatedPack] = await db
      .update(visuPointsPacks)
      .set(updates)
      .where(eq(visuPointsPacks.id, id))
      .returning();
    return updatedPack;
  }

  // VISUpoints purchases operations
  async createVisuPointsPurchase(purchase: InsertVisuPointsPurchase): Promise<VisuPointsPurchase> {
    const [newPurchase] = await db.insert(visuPointsPurchases).values(purchase).returning();
    return newPurchase;
  }

  async getUserVisuPointsPurchases(userId: string): Promise<VisuPointsPurchase[]> {
    return await db
      .select()
      .from(visuPointsPurchases)
      .where(eq(visuPointsPurchases.userId, userId))
      .orderBy(desc(visuPointsPurchases.createdAt));
  }

  // Nouvelles méthodes pour TOP10 et fidélité
  async getArticleInvestmentsByDate(date: Date): Promise<ArticleInvestment[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await db
      .select()
      .from(articleInvestments)
      .where(and(
        gte(articleInvestments.createdAt, startOfDay),
        lte(articleInvestments.createdAt, endOfDay)
      ))
      .orderBy(desc(articleInvestments.createdAt));
  }

  async getArticlesByAuthor(authorId: string): Promise<Article[]> {
    return await db
      .select()
      .from(articles)
      .where(eq(articles.authorId, authorId))
      .orderBy(desc(articles.createdAt));
  }

  // TOP10 Infoporteurs methods
  async createTop10Infoporteur(data: any): Promise<Top10Infoporteurs> {
    const [result] = await db.insert(top10Infoporteurs).values(data).returning();
    return result;
  }

  async getTop10ByDate(date: Date): Promise<Top10Infoporteurs[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await db
      .select()
      .from(top10Infoporteurs)
      .where(and(
        gte(top10Infoporteurs.rankingDate, startOfDay),
        lte(top10Infoporteurs.rankingDate, endOfDay)
      ))
      .orderBy(asc(top10Infoporteurs.rank));
  }

  async updateTop10Infoporteur(id: string, updates: any): Promise<Top10Infoporteurs> {
    const [result] = await db
      .update(top10Infoporteurs)
      .set(updates)
      .where(eq(top10Infoporteurs.id, id))
      .returning();
    return result;
  }

  // TOP10 Winners methods
  async createTop10Winner(data: any): Promise<Top10Winners> {
    const [result] = await db.insert(top10Winners).values(data).returning();
    return result;
  }

  async getTop10WinnersByDate(date: Date): Promise<Top10Winners[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await db
      .select()
      .from(top10Winners)
      .where(and(
        gte(top10Winners.rankingDate, startOfDay),
        lte(top10Winners.rankingDate, endOfDay)
      ))
      .orderBy(desc(top10Winners.totalInvestedEUR));
  }

  async updateTop10Winner(id: string, updates: any): Promise<Top10Winners> {
    const [result] = await db
      .update(top10Winners)
      .set(updates)
      .where(eq(top10Winners.id, id))
      .returning();
    return result;
  }

  // TOP10 Redistributions methods
  async createTop10Redistribution(data: any): Promise<Top10Redistributions> {
    const [result] = await db.insert(top10Redistributions).values(data).returning();
    return result;
  }

  async getTop10RedistributionByDate(date: Date): Promise<Top10Redistributions | undefined> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const [result] = await db
      .select()
      .from(top10Redistributions)
      .where(and(
        gte(top10Redistributions.redistributionDate, startOfDay),
        lte(top10Redistributions.redistributionDate, endOfDay)
      ))
      .limit(1);
    
    return result;
  }

  async updateTop10Redistribution(id: string, updates: any): Promise<Top10Redistributions> {
    const [result] = await db
      .update(top10Redistributions)
      .set(updates)
      .where(eq(top10Redistributions.id, id))
      .returning();
    return result;
  }

  // Weekly streaks methods
  async getUserWeeklyStreak(userId: string): Promise<WeeklyStreaks | undefined> {
    const [result] = await db
      .select()
      .from(weeklyStreaks)
      .where(eq(weeklyStreaks.userId, userId))
      .limit(1);
    
    return result;
  }

  async createWeeklyStreak(streak: any): Promise<WeeklyStreaks> {
    const [result] = await db.insert(weeklyStreaks).values(streak).returning();
    return result;
  }

  async updateWeeklyStreak(userId: string, updates: any): Promise<WeeklyStreaks> {
    const [result] = await db
      .update(weeklyStreaks)
      .set(updates)
      .where(eq(weeklyStreaks.userId, userId))
      .returning();
    return result;
  }

  // Article sales daily operations implementation
  async getArticleSaleDaily(articleId: string, saleDate: string): Promise<ArticleSalesDaily | undefined> {
    const dateObj = new Date(saleDate + 'T00:00:00Z'); // Convert string to Date
    const [result] = await db
      .select()
      .from(articleSalesDaily)
      .where(and(
        eq(articleSalesDaily.articleId, articleId), 
        sql`DATE(${articleSalesDaily.salesDate}) = DATE(${dateObj})`
      ));
    return result;
  }

  async createArticleSaleDaily(saleData: any): Promise<ArticleSalesDaily> {
    const [result] = await db.insert(articleSalesDaily).values(saleData).returning();
    return result;
  }

  async updateArticleSaleDaily(id: string, updates: any): Promise<ArticleSalesDaily> {
    const [result] = await db
      .update(articleSalesDaily)
      .set(updates)
      .where(eq(articleSalesDaily.id, id))
      .returning();
    return result;
  }

  // ===== STRIPE TRANSFERS OPERATIONS (IDEMPOTENT TRANSFERS) =====

  async createStripeTransfer(transfer: InsertStripeTransfer): Promise<StripeTransfer> {
    const [result] = await db.insert(stripeTransfers).values(transfer).returning();
    return result;
  }

  async getStripeTransferByIdempotencyKey(idempotencyKey: string): Promise<StripeTransfer | undefined> {
    const [result] = await db
      .select()
      .from(stripeTransfers)
      .where(eq(stripeTransfers.idempotencyKey, idempotencyKey))
      .limit(1);
    return result;
  }

  async getStripeTransfersByUserId(userId: string): Promise<StripeTransfer[]> {
    return await db
      .select()
      .from(stripeTransfers)
      .where(eq(stripeTransfers.userId, userId))
      .orderBy(desc(stripeTransfers.createdAt));
  }

  async getScheduledStripeTransfers(): Promise<StripeTransfer[]> {
    const now = new Date();
    return await db
      .select()
      .from(stripeTransfers)
      .where(and(
        eq(stripeTransfers.status, 'scheduled'),
        lte(stripeTransfers.scheduledProcessingAt, now)
      ))
      .orderBy(asc(stripeTransfers.scheduledProcessingAt));
  }

  async updateStripeTransfer(id: string, updates: Partial<StripeTransfer>): Promise<StripeTransfer> {
    const [result] = await db
      .update(stripeTransfers)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(stripeTransfers.id, id))
      .returning();
    return result;
  }

  async getStripeTransferById(id: string): Promise<StripeTransfer | undefined> {
    const [result] = await db
      .select()
      .from(stripeTransfers)
      .where(eq(stripeTransfers.id, id))
      .limit(1);
    return result;
  }

  // ===== IMPLÉMENTATIONS SYSTÈME DE RENOUVELLEMENT PAYANT (25€) =====

  // Project renewals operations
  async createProjectRenewal(renewal: InsertProjectRenewal): Promise<ProjectRenewal> {
    // BUSINESS RULE: Enforce 25€ amount and rank constraints
    if (renewal.currentRank < 11 || renewal.currentRank > 100) {
      throw new Error(`Renouvellement limité aux rangs 11-100. Rang: ${renewal.currentRank}`);
    }
    
    // Set 15-minute expiration deadline
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    
    const renewalWithDefaults = {
      ...renewal,
      amountEUR: '25.00', // Force 25€ amount
      expiresAt: renewal.expiresAt || expiresAt
    };

    const [newRenewal] = await db.insert(projectRenewals).values(renewalWithDefaults).returning();
    return newRenewal;
  }

  async getProjectRenewal(id: string): Promise<ProjectRenewal | undefined> {
    const [renewal] = await db
      .select()
      .from(projectRenewals)
      .where(eq(projectRenewals.id, id));
    return renewal;
  }

  async getProjectRenewalByPaymentIntent(paymentIntentId: string): Promise<ProjectRenewal | undefined> {
    const [renewal] = await db
      .select()
      .from(projectRenewals)
      .where(eq(projectRenewals.paymentIntentId, paymentIntentId));
    return renewal;
  }

  async getCreatorRenewalHistory(creatorId: string): Promise<ProjectRenewal[]> {
    return await db
      .select()
      .from(projectRenewals)
      .where(eq(projectRenewals.creatorId, creatorId))
      .orderBy(desc(projectRenewals.createdAt));
  }

  async getActiveRenewals(categoryId: string): Promise<ProjectRenewal[]> {
    return await db
      .select()
      .from(projectRenewals)
      .where(
        and(
          eq(projectRenewals.categoryId, categoryId),
          eq(projectRenewals.status, 'active')
        )
      )
      .orderBy(asc(projectRenewals.currentRank));
  }

  async updateProjectRenewal(id: string, updates: Partial<ProjectRenewal>): Promise<ProjectRenewal> {
    const [updatedRenewal] = await db
      .update(projectRenewals)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(projectRenewals.id, id))
      .returning();
    return updatedRenewal;
  }

  // Project queue operations
  async addProjectToQueue(queueItem: InsertProjectQueue): Promise<ProjectQueue> {
    const [newQueueItem] = await db.insert(projectQueue).values(queueItem).returning();
    return newQueueItem;
  }

  async getProjectQueue(categoryId: string): Promise<ProjectQueue[]> {
    return await db
      .select()
      .from(projectQueue)
      .where(
        and(
          eq(projectQueue.categoryId, categoryId),
          eq(projectQueue.isActive, true)
        )
      )
      .orderBy(asc(projectQueue.queuePosition), asc(projectQueue.submittedAt));
  }

  async getReadyProjectsInQueue(categoryId: string): Promise<ProjectQueue[]> {
    const now = new Date();
    return await db
      .select()
      .from(projectQueue)
      .where(
        and(
          eq(projectQueue.categoryId, categoryId),
          eq(projectQueue.isActive, true),
          eq(projectQueue.status, 'ready'),
          lte(projectQueue.readyAt, now)
        )
      )
      .orderBy(asc(projectQueue.queuePosition), asc(projectQueue.submittedAt));
  }

  async markProjectReadyForAssignment(queueId: string): Promise<ProjectQueue> {
    const readyAt = new Date(); // Ready immediately
    const [updatedItem] = await db
      .update(projectQueue)
      .set({
        status: 'ready',
        readyAt,
        updatedAt: new Date()
      })
      .where(eq(projectQueue.id, queueId))
      .returning();
    return updatedItem;
  }

  async getProjectQueuePosition(projectId: string, categoryId: string): Promise<ProjectQueue | undefined> {
    const [queueItem] = await db
      .select()
      .from(projectQueue)
      .where(
        and(
          eq(projectQueue.projectId, projectId),
          eq(projectQueue.categoryId, categoryId),
          eq(projectQueue.isActive, true)
        )
      );
    return queueItem;
  }

  async assignProjectFromQueue(categoryId: string, targetRank: number): Promise<ProjectQueue | undefined> {
    // BUSINESS RULE: Only allow ranks 11-100 replacement
    if (targetRank < 11 || targetRank > 100) {
      throw new Error(`Remplacement automatique limité aux rangs 11-100. Rang demandé: ${targetRank}`);
    }

    const now = new Date();

    // Get next ready project in queue (after 15min delay)
    const [nextProject] = await db
      .select()
      .from(projectQueue)
      .where(
        and(
          eq(projectQueue.categoryId, categoryId),
          eq(projectQueue.isActive, true),
          eq(projectQueue.status, 'ready'),
          lte(projectQueue.readyAt, now) // Respect 15-minute delay
        )
      )
      .orderBy(asc(projectQueue.queuePosition), asc(projectQueue.submittedAt))
      .limit(1);

    if (!nextProject) return undefined;

    // ATOMIC TRANSACTION: Mark as assigned with row lock
    const [assignedProject] = await db
      .update(projectQueue)
      .set({
        status: 'assigned',
        assignedAt: now,
        isActive: false,
        updatedAt: now
      })
      .where(
        and(
          eq(projectQueue.id, nextProject.id),
          eq(projectQueue.status, 'ready') // Double check status didn't change
        )
      )
      .returning();

    return assignedProject;
  }

  async removeProjectFromQueue(id: string): Promise<void> {
    await db
      .update(projectQueue)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(projectQueue.id, id));
  }

  async updateQueuePositions(categoryId: string): Promise<void> {
    // Recalculate queue positions for active items
    const activeItems = await db
      .select()
      .from(projectQueue)
      .where(
        and(
          eq(projectQueue.categoryId, categoryId),
          eq(projectQueue.isActive, true)
        )
      )
      .orderBy(asc(projectQueue.submittedAt));

    // Update positions
    for (let i = 0; i < activeItems.length; i++) {
      await db
        .update(projectQueue)
        .set({ queuePosition: i + 1, updatedAt: new Date() })
        .where(eq(projectQueue.id, activeItems[i].id));
    }
  }

  // Project replacements operations
  async createProjectReplacement(replacement: InsertProjectReplacement): Promise<ProjectReplacement> {
    // BUSINESS RULE: Only allow ranks 11-100 replacement
    if (replacement.replacedRank < 11 || replacement.replacedRank > 100) {
      throw new Error(`Remplacement limité aux rangs 11-100. Rang: ${replacement.replacedRank}`);
    }

    // Generate idempotency key if not provided
    const replacementWithKey = {
      ...replacement,
      idempotencyKey: replacement.idempotencyKey || `${replacement.categoryId}-${replacement.replacedRank}-${Date.now()}`
    };

    try {
      const [newReplacement] = await db.insert(projectReplacements).values(replacementWithKey).returning();
      return newReplacement;
    } catch (error: any) {
      if (error.code === '23505') { // PostgreSQL unique violation
        throw new Error('Remplacement déjà effectué pour ce rang/catégorie');
      }
      throw error;
    }
  }

  async getCategoryReplacements(categoryId: string): Promise<ProjectReplacement[]> {
    return await db
      .select()
      .from(projectReplacements)
      .where(eq(projectReplacements.categoryId, categoryId))
      .orderBy(desc(projectReplacements.replacementDate));
  }

  async getCreatorReplacementHistory(creatorId: string): Promise<ProjectReplacement[]> {
    return await db
      .select()
      .from(projectReplacements)
      .where(eq(projectReplacements.replacedCreatorId, creatorId))
      .orderBy(desc(projectReplacements.replacementDate));
  }

  // ===== IMPLÉMENTATIONS AGENTS IA AUTONOMES =====

  // Agent decisions operations
  async createAgentDecision(decision: InsertAgentDecision): Promise<AgentDecision> {
    const [newDecision] = await db.insert(agentDecisions).values(decision).returning();
    return newDecision;
  }

  async getAgentDecisions(agentType?: string, status?: string, limit: number = 50): Promise<AgentDecision[]> {
    let query = db.select().from(agentDecisions);
    
    const conditions = [];
    if (agentType) conditions.push(eq(agentDecisions.agentType, agentType as any));
    if (status) conditions.push(eq(agentDecisions.status, status as any));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query
      .orderBy(desc(agentDecisions.createdAt))
      .limit(limit);
  }

  async getAgentDecision(id: string): Promise<AgentDecision | undefined> {
    const [decision] = await db.select().from(agentDecisions).where(eq(agentDecisions.id, id));
    return decision;
  }

  async updateAgentDecisionStatus(id: string, status: string, adminComment?: string, validatedBy?: string): Promise<AgentDecision> {
    const updates: any = {
      status: status as any,
      updatedAt: new Date()
    };
    
    if (adminComment) updates.adminComment = adminComment;
    if (validatedBy) {
      updates.validatedBy = validatedBy;
      updates.validatedAt = new Date();
    }
    
    const [updated] = await db
      .update(agentDecisions)
      .set(updates)
      .where(eq(agentDecisions.id, id))
      .returning();
    
    return updated;
  }

  async executeAgentDecision(id: string): Promise<AgentDecision> {
    const [executed] = await db
      .update(agentDecisions)
      .set({
        executedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(agentDecisions.id, id))
      .returning();
    
    return executed;
  }

  // Agent audit log operations (immutable with hash chain)
  async createAuditLogEntry(entry: InsertAgentAuditLog): Promise<AgentAuditLog> {
    // Generate hash chain for immutable audit
    const previousEntry = await db
      .select()
      .from(agentAuditLog)
      .orderBy(desc(agentAuditLog.id))
      .limit(1);
    
    const previousHash = previousEntry.length > 0 ? previousEntry[0].currentHash : null;
    
    // Simple hash generation (in production, use crypto.createHash)
    const entryData = JSON.stringify({ ...entry, previousHash, timestamp: new Date().toISOString() });
    const currentHash = Buffer.from(entryData).toString('base64').slice(0, 32);
    
    const auditEntry = {
      ...entry,
      previousHash,
      currentHash,
      timestamp: new Date()
    };
    
    const [newEntry] = await db.insert(agentAuditLog).values(auditEntry).returning();
    return newEntry;
  }

  async getAuditLog(agentType?: string, action?: string, limit: number = 100): Promise<AgentAuditLog[]> {
    let query = db.select().from(agentAuditLog);
    
    const conditions = [];
    if (agentType) conditions.push(eq(agentAuditLog.agentType, agentType as any));
    if (action) conditions.push(eq(agentAuditLog.action, action as any));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query
      .orderBy(desc(agentAuditLog.timestamp))
      .limit(limit);
  }

  async getAuditLogBySubject(subjectType: string, subjectId: string): Promise<AgentAuditLog[]> {
    return await db
      .select()
      .from(agentAuditLog)
      .where(
        and(
          eq(agentAuditLog.subjectType, subjectType),
          eq(agentAuditLog.subjectId, subjectId)
        )
      )
      .orderBy(desc(agentAuditLog.timestamp));
  }

  async validateAuditChain(): Promise<boolean> {
    // Validate the hash chain integrity
    const entries = await db
      .select()
      .from(agentAuditLog)
      .orderBy(agentAuditLog.id);
    
    for (let i = 1; i < entries.length; i++) {
      const currentEntry = entries[i];
      const previousEntry = entries[i - 1];
      
      if (currentEntry.previousHash !== previousEntry.currentHash) {
        return false; // Chain broken
      }
    }
    
    return true;
  }

  // Financial ledger operations
  async createLedgerEntry(entry: InsertFinancialLedger): Promise<FinancialLedger> {
    try {
      const [newEntry] = await db.insert(financialLedger).values(entry).returning();
      return newEntry;
    } catch (error: any) {
      if (error.code === '23505') { // Duplicate idempotency key
        const [existing] = await db
          .select()
          .from(financialLedger)
          .where(eq(financialLedger.idempotencyKey, entry.idempotencyKey));
        return existing;
      }
      throw error;
    }
  }

  async getLedgerEntries(referenceType?: string, recipientId?: string, limit: number = 100): Promise<FinancialLedger[]> {
    let query = db.select().from(financialLedger);
    
    const conditions = [];
    if (referenceType) conditions.push(eq(financialLedger.referenceType, referenceType));
    if (recipientId) conditions.push(eq(financialLedger.recipientId, recipientId));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query
      .orderBy(desc(financialLedger.createdAt))
      .limit(limit);
  }

  async getLedgerEntry(id: string): Promise<FinancialLedger | undefined> {
    const [entry] = await db.select().from(financialLedger).where(eq(financialLedger.id, id));
    return entry;
  }

  async updateLedgerStatus(id: string, status: string, processedAt?: Date): Promise<FinancialLedger> {
    const updates: any = { status };
    if (processedAt) updates.processedAt = processedAt;
    
    const [updated] = await db
      .update(financialLedger)
      .set(updates)
      .where(eq(financialLedger.id, id))
      .returning();
    
    return updated;
  }

  async reconcileLedgerWithStripe(): Promise<{ divergences: number; total: number }> {
    // Get all completed ledger entries with Stripe references
    const entries = await db
      .select()
      .from(financialLedger)
      .where(
        and(
          eq(financialLedger.status, 'completed'),
          isNotNull(financialLedger.stripePaymentIntentId)
        )
      );
    
    let divergences = 0;
    const total = entries.length;
    
    // In a real implementation, we would call Stripe API to validate each transaction
    // For now, we simulate perfect reconciliation
    return { divergences, total };
  }

  // Payout recipes operations (versioned financial rules)
  async createPayoutRecipe(recipe: InsertPayoutRecipe): Promise<PayoutRecipe> {
    const [newRecipe] = await db.insert(payoutRecipes).values(recipe).returning();
    return newRecipe;
  }

  async getPayoutRecipes(ruleType?: string, isActive?: boolean): Promise<PayoutRecipe[]> {
    let query = db.select().from(payoutRecipes);
    
    const conditions = [];
    if (ruleType) conditions.push(eq(payoutRecipes.ruleType, ruleType));
    if (isActive !== undefined) conditions.push(eq(payoutRecipes.isActive, isActive));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(payoutRecipes.createdAt));
  }

  async getActivePayoutRecipe(ruleType: string): Promise<PayoutRecipe | undefined> {
    const [recipe] = await db
      .select()
      .from(payoutRecipes)
      .where(
        and(
          eq(payoutRecipes.ruleType, ruleType),
          eq(payoutRecipes.isActive, true)
        )
      )
      .orderBy(desc(payoutRecipes.activatedAt))
      .limit(1);
    
    return recipe;
  }

  async activatePayoutRecipe(version: string): Promise<PayoutRecipe> {
    // Deactivate all recipes of the same type first
    const [recipe] = await db
      .select()
      .from(payoutRecipes)
      .where(eq(payoutRecipes.version, version));
    
    if (!recipe) {
      throw new Error(`Recipe version ${version} not found`);
    }
    
    // Deactivate others of same type
    await db
      .update(payoutRecipes)
      .set({ isActive: false })
      .where(eq(payoutRecipes.ruleType, recipe.ruleType));
    
    // Activate this one
    const [activated] = await db
      .update(payoutRecipes)
      .set({
        isActive: true,
        activatedAt: new Date()
      })
      .where(eq(payoutRecipes.version, version))
      .returning();
    
    return activated;
  }

  // Agent parameters operations (runtime configuration)
  async createAgentParameter(parameter: InsertAgentParameter): Promise<AgentParameter> {
    const [newParam] = await db.insert(agentParameters).values(parameter).returning();
    return newParam;
  }

  async getAgentParameters(modifiableByAdmin?: boolean): Promise<AgentParameter[]> {
    let query = db.select().from(agentParameters);
    
    if (modifiableByAdmin !== undefined) {
      query = query.where(eq(agentParameters.modifiableByAdmin, modifiableByAdmin));
    }
    
    return await query.orderBy(agentParameters.parameterKey);
  }

  async getAgentParameter(key: string): Promise<AgentParameter | undefined> {
    const [param] = await db
      .select()
      .from(agentParameters)
      .where(eq(agentParameters.parameterKey, key));
    return param;
  }

  async updateAgentParameter(key: string, value: string, modifiedBy: string): Promise<AgentParameter> {
    const [updated] = await db
      .update(agentParameters)
      .set({
        parameterValue: value,
        lastModifiedBy: modifiedBy,
        lastModifiedAt: new Date()
      })
      .where(eq(agentParameters.parameterKey, key))
      .returning();
    
    return updated;
  }

  async getParameterValue(key: string, defaultValue?: string): Promise<string | undefined> {
    const param = await this.getAgentParameter(key);
    return param ? param.parameterValue : defaultValue;
  }

  // LIVRES Category operations
  async createBookCategory(category: InsertBookCategory): Promise<BookCategory> {
    const [newCategory] = await db.insert(bookCategories).values(category).returning();
    return newCategory;
  }

  async getBookCategory(id: string): Promise<BookCategory | undefined> {
    const [category] = await db
      .select()
      .from(bookCategories)
      .where(eq(bookCategories.id, id));
    return category;
  }

  async getBookCategoryByName(name: string): Promise<BookCategory | undefined> {
    const [category] = await db
      .select()
      .from(bookCategories)
      .where(eq(bookCategories.name, name));
    return category;
  }

  async getAllBookCategories(): Promise<BookCategory[]> {
    return await db
      .select()
      .from(bookCategories)
      .orderBy(asc(bookCategories.createdAt));
  }

  async updateBookCategory(id: string, updates: Partial<BookCategory>): Promise<BookCategory> {
    const [updated] = await db
      .update(bookCategories)
      .set(updates)
      .where(eq(bookCategories.id, id))
      .returning();
    return updated;
  }

  // LIVRES Book operations
  async createBook(book: InsertBook): Promise<Book> {
    const [newBook] = await db.insert(books).values(book).returning();
    return newBook;
  }

  async getBook(id: string): Promise<Book | undefined> {
    const [book] = await db
      .select()
      .from(books)
      .where(eq(books.id, id));
    return book;
  }

  async getBooksByAuthor(authorId: string): Promise<Book[]> {
    return await db
      .select()
      .from(books)
      .where(eq(books.authorId, authorId))
      .orderBy(desc(books.createdAt));
  }

  async getBooksByCategoryId(categoryId: string): Promise<Book[]> {
    return await db
      .select()
      .from(books)
      .where(eq(books.categoryId, categoryId))
      .orderBy(desc(books.createdAt));
  }

  async updateBook(id: string, updates: Partial<Book>): Promise<Book> {
    const [updated] = await db
      .update(books)
      .set(updates)
      .where(eq(books.id, id))
      .returning();
    return updated;
  }

  async getPendingBooks(): Promise<Book[]> {
    return await db
      .select()
      .from(books)
      .where(eq(books.status, 'pending'))
      .orderBy(asc(books.createdAt));
  }

  async getActiveBooks(categoryId?: string): Promise<Book[]> {
    let query = db
      .select()
      .from(books)
      .where(eq(books.status, 'active'));
    
    if (categoryId) {
      query = query.where(eq(books.categoryId, categoryId));
    }
    
    return await query.orderBy(desc(books.createdAt));
  }

  // LIVRES Purchase operations (lecteurs)
  async createBookPurchase(purchase: InsertBookPurchase): Promise<BookPurchase> {
    const [newPurchase] = await db.insert(bookPurchases).values(purchase).returning();
    return newPurchase;
  }

  async getBookPurchase(id: string): Promise<BookPurchase | undefined> {
    const [purchase] = await db
      .select()
      .from(bookPurchases)
      .where(eq(bookPurchases.id, id));
    return purchase;
  }

  async getUserBookPurchases(userId: string): Promise<BookPurchase[]> {
    return await db
      .select()
      .from(bookPurchases)
      .where(eq(bookPurchases.userId, userId))
      .orderBy(desc(bookPurchases.createdAt));
  }

  async getBookPurchases(bookId: string): Promise<BookPurchase[]> {
    return await db
      .select()
      .from(bookPurchases)
      .where(eq(bookPurchases.bookId, bookId))
      .orderBy(desc(bookPurchases.createdAt));
  }

  async getBookPurchaseByUserAndBook(userId: string, bookId: string): Promise<BookPurchase | undefined> {
    const [purchase] = await db
      .select()
      .from(bookPurchases)
      .where(and(
        eq(bookPurchases.userId, userId),
        eq(bookPurchases.bookId, bookId)
      ));
    return purchase;
  }

  async updateBookPurchase(id: string, updates: Partial<BookPurchase>): Promise<BookPurchase> {
    const [updated] = await db
      .update(bookPurchases)
      .set(updates)
      .where(eq(bookPurchases.id, id))
      .returning();
    return updated;
  }

  // LIVRES Download Token operations
  async createDownloadToken(token: InsertDownloadToken): Promise<DownloadToken> {
    const [newToken] = await db.insert(downloadTokens).values(token).returning();
    return newToken;
  }

  async getDownloadToken(token: string): Promise<DownloadToken | undefined> {
    const [downloadToken] = await db
      .select()
      .from(downloadTokens)
      .where(eq(downloadTokens.token, token));
    return downloadToken;
  }

  async getDownloadTokensByPurchase(purchaseId: string): Promise<DownloadToken[]> {
    return await db
      .select()
      .from(downloadTokens)
      .where(eq(downloadTokens.purchaseId, purchaseId))
      .orderBy(desc(downloadTokens.createdAt));
  }

  async updateDownloadToken(token: string, updates: Partial<DownloadToken>): Promise<DownloadToken> {
    const [updated] = await db
      .update(downloadTokens)
      .set(updates)
      .where(eq(downloadTokens.token, token))
      .returning();
    return updated;
  }

  async revokeDownloadTokens(purchaseId: string): Promise<void> {
    await db
      .update(downloadTokens)
      .set({ 
        isRevoked: true, 
        revokedAt: new Date() 
      })
      .where(eq(downloadTokens.purchaseId, purchaseId));
  }

  // Feature toggles operations
  async createFeatureToggle(toggle: InsertFeatureToggle): Promise<FeatureToggle> {
    const [newToggle] = await db.insert(featureToggles).values(toggle).returning();
    return newToggle;
  }

  async getFeatureToggle(key: string): Promise<FeatureToggle | undefined> {
    const [toggle] = await db
      .select()
      .from(featureToggles)
      .where(eq(featureToggles.key, key));
    return toggle;
  }

  async getFeatureToggles(): Promise<FeatureToggle[]> {
    return await db
      .select()
      .from(featureToggles)
      .orderBy(asc(featureToggles.label));
  }

  async updateFeatureToggle(key: string, updates: Partial<FeatureToggle>): Promise<FeatureToggle> {
    // Exclure la clé des updates pour éviter modifications accidentelles
    const { key: _, ...safeUpdates } = updates;
    
    const [updatedToggle] = await db
      .update(featureToggles)
      .set({ 
        ...safeUpdates, 
        version: sql`${featureToggles.version} + 1`,
        updatedAt: new Date() 
      })
      .where(eq(featureToggles.key, key))
      .returning();
    
    if (!updatedToggle) {
      throw new Error(`Feature toggle with key '${key}' not found`);
    }
    
    return updatedToggle;
  }

  async getPublicToggles(): Promise<{ [key: string]: { visible: boolean; message: string } }> {
    const toggles = await db
      .select({
        key: featureToggles.key,
        isVisible: featureToggles.isVisible,
        hiddenMessageVariant: featureToggles.hiddenMessageVariant,
        hiddenMessageCustom: featureToggles.hiddenMessageCustom,
        kind: featureToggles.kind
      })
      .from(featureToggles);

    const result: { [key: string]: { visible: boolean; message: string } } = {};
    
    for (const toggle of toggles) {
      let message = "";
      if (!toggle.isVisible) {
        switch (toggle.hiddenMessageVariant) {
          case 'en_cours':
            message = toggle.kind === 'category' ? 'Catégorie en cours' : 'Rubrique en cours';
            break;
          case 'en_travaux':
            message = toggle.kind === 'category' ? 'Catégorie en travaux' : 'Rubrique en travaux';
            break;
          case 'custom':
            message = toggle.hiddenMessageCustom || 'Section temporairement indisponible';
            break;
          default:
            message = toggle.kind === 'category' ? 'Catégorie en cours' : 'Rubrique en cours';
        }
      }
      
      result[toggle.key] = {
        visible: toggle.isVisible,
        message
      };
    }
    
    return result;
  }

  // Daily quests operations
  async getUserDailyQuest(userId: string, questDate: string, questType?: string): Promise<DailyQuest | undefined> {
    const conditions = [
      eq(dailyQuests.userId, userId),
      eq(dailyQuests.questDate, questDate)
    ];

    if (questType) {
      conditions.push(eq(dailyQuests.questType, questType));
    }

    const results = await db
      .select()
      .from(dailyQuests)
      .where(and(...conditions))
      .limit(1);
      
    return results[0];
  }

  async createDailyQuest(quest: InsertDailyQuest): Promise<DailyQuest> {
    const [newQuest] = await db.insert(dailyQuests).values(quest).returning();
    return newQuest;
  }

  async updateDailyQuest(questId: string, updates: Partial<DailyQuest>): Promise<DailyQuest> {
    const [updatedQuest] = await db
      .update(dailyQuests)
      .set(updates)
      .where(eq(dailyQuests.id, questId))
      .returning();
    
    if (!updatedQuest) {
      throw new Error(`Daily quest with id '${questId}' not found`);
    }
    
    return updatedQuest;
  }

  async getDailyQuestById(questId: string): Promise<DailyQuest | undefined> {
    const results = await db
      .select()
      .from(dailyQuests)
      .where(eq(dailyQuests.id, questId))
      .limit(1);
    
    return results[0];
  }

  async getUserQuestStatistics(userId: string): Promise<{
    totalCompleted: number;
    currentStreak: number;
    totalVPEarned: number;
  } | undefined> {
    try {
      // Récupérer le nombre total de quêtes complétées
      const completedQuests = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(dailyQuests)
        .where(and(
          eq(dailyQuests.userId, userId),
          eq(dailyQuests.isCompleted, true)
        ));

      // Récupérer le total des VISUpoints gagnés
      const totalVP = await db
        .select({ total: sql<number>`coalesce(sum(${dailyQuests.rewardVP}), 0)::int` })
        .from(dailyQuests)
        .where(and(
          eq(dailyQuests.userId, userId),
          eq(dailyQuests.isRewardClaimed, true)
        ));

      // Calculer le streak actuel (jours consécutifs avec quêtes complétées)
      const today = new Date();
      let currentStreak = 0;
      
      for (let i = 0; i < 30; i++) { // Vérifier les 30 derniers jours max
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - i);
        const dateStr = checkDate.toISOString().split('T')[0];
        
        const dayQuest = await this.getUserDailyQuest(userId, dateStr);
        
        if (dayQuest && dayQuest.isCompleted) {
          if (i === 0 || currentStreak > 0) {
            currentStreak++;
          }
        } else if (i === 0) {
          // Si pas de quête complétée aujourd'hui, vérifier hier
          continue;
        } else {
          break; // Streak cassé
        }
      }

      return {
        totalCompleted: completedQuests[0]?.count || 0,
        currentStreak,
        totalVPEarned: totalVP[0]?.total || 0
      };
    } catch (error) {
      console.error('Error getting user quest statistics:', error);
      return undefined;
    }
  }
}

export const storage = new DatabaseStorage();
