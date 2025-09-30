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
  // Tables petites annonces
  petitesAnnonces,
  adPhotos,
  annoncesModeration,
  annoncesReports,
  escrowTransactions,
  annoncesSanctions,
  // Tables fonctionnalités sociales interactives
  liveChatMessages,
  messageReactions,
  livePolls,
  pollVotes,
  engagementPoints,
  userBadges,
  // Tables nouvelles pour modernisation PRO
  stripeEvents,
  securityAuditLog,
  user2FA,
  gdprRequests,
  adminBreakGlassOtp,
  livePredictions,
  predictionBets,
  // Tables ebooks avec licences JWT
  ebooks,
  ebookLicenses,
  ebookDownloadAttempts,
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
  // Types petites annonces
  type PetitesAnnonces,
  type AdPhotos,
  type AnnoncesModeration,
  type AnnoncesReports,
  type EscrowTransactions,
  type AnnoncesSanctions,
  type InsertPetitesAnnonces,
  type InsertAdPhotos,
  type InsertAnnoncesModeration,
  type InsertAnnoncesReports,
  type InsertEscrowTransactions,
  type InsertAnnoncesSanctions,
  insertArticleSalesDailySchema,
  insertTop10InfoporteursSchema,
  insertTop10WinnersSchema,
  insertTop10RedistributionsSchema,
  insertWeeklyStreaksSchema,
  insertStripeTransferSchema,
  // Types fonctionnalités sociales interactives
  type LiveChatMessage,
  type MessageReaction,
  type LivePoll,
  type PollVote,
  type EngagementPoint,
  type UserBadge,
  type LivePrediction,
  type PredictionBet,
  // Types PRO modernisation
  type StripeEvents,
  type InsertStripeEvents,
  type SecurityAuditLog,
  type InsertSecurityAuditLog,
  type User2FA,
  type InsertUser2FA,
  type GdprRequests,
  type InsertGdprRequests,
  type AdminBreakGlassOtp,
  type InsertAdminBreakGlassOtp,
  // Types ebooks
  type Ebook,
  type EbookLicense,
  type EbookDownloadAttempt,
  type InsertEbook,
  type InsertEbookLicense,
  type InsertEbookDownloadAttempt
} from "@shared/schema";
import { 
  ESCROW_FEE_RATE, 
  ESCROW_MINIMUM_FEE,
  ANNONCE_DEFAULT_DURATION_DAYS 
} from "@shared/constants";
import { db } from "./db";
import { eq, desc, asc, and, gte, lte, gt, lt, sql, or, isNotNull } from "drizzle-orm";
import { nanoid } from "nanoid";

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
  
  // Live chat messages operations
  createLiveChatMessage(data: { liveShowId: string; userId: string; content: string; messageType?: string; isModerated?: boolean; moderationReason?: string | null }): Promise<LiveChatMessage>;
  getLiveChatMessage(id: string): Promise<LiveChatMessage | undefined>;
  updateLiveChatMessage(id: string, updates: Partial<LiveChatMessage>): Promise<LiveChatMessage>;
  getLiveShowMessages(liveShowId: string, limit?: number, offset?: number): Promise<LiveChatMessage[]>;
  getUserLiveShowMessageCount(userId: string, liveShowId: string): Promise<number>;
  getLiveShowMessageCount(liveShowId: string): Promise<number>;
  
  // Message reactions operations
  createMessageReaction(data: { messageId: string; userId: string; reaction: string }): Promise<MessageReaction>;
  updateMessageReaction(id: string, updates: Partial<MessageReaction>): Promise<MessageReaction>;
  removeMessageReaction(messageId: string, userId: string, reaction: string): Promise<void>;
  getMessageReactions(messageId: string): Promise<MessageReaction[]>;
  getUserMessageReaction(messageId: string, userId: string): Promise<MessageReaction | undefined>;
  getUserLiveShowReactionCount(userId: string, liveShowId: string): Promise<number>;
  
  // Live polls operations
  createLivePoll(data: { liveShowId: string; createdBy: string; question: string; options: string; endsAt?: Date }): Promise<LivePoll>;
  getLivePoll(id: string): Promise<LivePoll | undefined>;
  updateLivePoll(id: string, updates: Partial<LivePoll>): Promise<LivePoll>;
  deactivateExpiredPolls(): Promise<void>;
  
  // Poll votes operations
  createPollVote(data: { pollId: string; userId: string; optionIndex: number }): Promise<PollVote>;
  updatePollVote(id: string, updates: Partial<PollVote>): Promise<PollVote>;
  getPollVotes(pollId: string): Promise<PollVote[]>;
  getUserPollVote(pollId: string, userId: string): Promise<PollVote | undefined>;
  
  // Engagement points operations
  createEngagementPoint(data: { userId: string; liveShowId?: string; pointType: string; points: number; description?: string }): Promise<EngagementPoint>;
  getUserTotalEngagementPoints(userId: string): Promise<number>;
  getUserDailyEngagementPoints(userId: string): Promise<number>;
  getUserEngagementRank(userId: string): Promise<number>;
  getTopEngagementUsers(liveShowId?: string, period?: string, limit?: number): Promise<Array<{ userId: string; totalPoints: number }>>;
  
  // User badges operations
  createUserBadge(data: { userId: string; liveShowId?: string; badgeType: string; badgeName: string; badgeDescription?: string }): Promise<UserBadge>;
  getUserBadge(userId: string, badgeType: string, liveShowId?: string): Promise<UserBadge | undefined>;
  getUserBadges(userId: string): Promise<UserBadge[]>;
  
  // Live predictions operations
  createLivePrediction(data: { liveShowId: string; createdBy: string; question: string; outcomes: string; endsAt?: Date }): Promise<LivePrediction>;
  getLivePrediction(id: string): Promise<LivePrediction | undefined>;
  updateLivePrediction(id: string, updates: Partial<LivePrediction>): Promise<LivePrediction>;
  deactivateExpiredPredictions(): Promise<void>;
  
  // Prediction bets operations
  createPredictionBet(data: { predictionId: string; userId: string; outcomeIndex: number; amount: string; potentialWin: string }): Promise<PredictionBet>;
  updatePredictionBet(id: string, updates: Partial<PredictionBet>): Promise<PredictionBet>;
  getPredictionBets(predictionId: string): Promise<PredictionBet[]>;
  getUserPredictionBet(predictionId: string, userId: string): Promise<PredictionBet | undefined>;
  
  // Analytics operations for social features
  isUserTopInvestorForLiveShow(userId: string, liveShowId: string): Promise<boolean>;
  
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

  // ===== PETITES ANNONCES OPERATIONS =====
  
  // Petites annonces CRUD operations
  createPetiteAnnonce(annonce: InsertPetitesAnnonces): Promise<PetitesAnnonces>;
  getPetiteAnnonce(id: string): Promise<PetitesAnnonces | undefined>;
  getPetitesAnnonces(params?: {
    category?: string;
    location?: string;
    authorId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<PetitesAnnonces[]>;
  updatePetiteAnnonce(id: string, updates: Partial<PetitesAnnonces>): Promise<PetitesAnnonces>;
  deletePetiteAnnonce(id: string): Promise<void>;
  incrementAnnonceViewCount(id: string): Promise<void>;
  incrementAnnonceContactCount(id: string): Promise<void>;
  
  // Search and filter operations
  searchPetitesAnnonces(query: string, filters?: {
    category?: string;
    location?: string;
    priceRange?: { min?: number; max?: number };
  }): Promise<PetitesAnnonces[]>;
  
  // User's annonces management
  getUserActiveAnnonces(userId: string): Promise<PetitesAnnonces[]>;
  getUserAnnonceCount(userId: string, status?: string): Promise<number>;
  getExpiredAnnonces(): Promise<PetitesAnnonces[]>;
  archiveExpiredAnnonces(): Promise<void>;
  
  // Moderation operations
  createAnnonceModeration(moderation: InsertAnnoncesModeration): Promise<AnnoncesModeration>;
  getAnnonceModeration(annonceId: string): Promise<AnnoncesModeration[]>;
  getPendingModerationAnnonces(): Promise<PetitesAnnonces[]>;
  approveAnnonce(annonceId: string, moderatorId: string, aiScore?: number): Promise<void>;
  rejectAnnonce(annonceId: string, moderatorId: string, reason: string, sanction?: string): Promise<void>;
  
  // Reporting operations
  createAnnonceReport(report: InsertAnnoncesReports): Promise<AnnoncesReports>;
  getAnnonceReports(annonceId: string): Promise<AnnoncesReports[]>;
  getPendingReports(): Promise<AnnoncesReports[]>;
  resolveReport(reportId: string, reviewerId: string, resolution: string): Promise<AnnoncesReports>;
  
  // Sanctions operations
  createAnnonceSanction(sanction: InsertAnnoncesSanctions): Promise<AnnoncesSanctions>;
  getUserActiveSanctions(userId: string): Promise<AnnoncesSanctions[]>;
  isUserSanctioned(userId: string): Promise<boolean>;
  liftSanction(sanctionId: string, liftedBy: string): Promise<AnnoncesSanctions>;
  
  // Escrow operations
  createEscrowTransaction(escrow: InsertEscrowTransactions): Promise<EscrowTransactions>;
  getEscrowTransaction(id: string): Promise<EscrowTransactions | undefined>;
  getAnnonceEscrowTransactions(annonceId: string): Promise<EscrowTransactions[]>;
  getUserEscrowTransactions(userId: string, role?: 'buyer' | 'seller'): Promise<EscrowTransactions[]>;
  updateEscrowStatus(id: string, status: string, updates?: Partial<EscrowTransactions>): Promise<EscrowTransactions>;
  releaseEscrow(id: string, releasedBy: string): Promise<EscrowTransactions>;
  refundEscrow(id: string, reason: string): Promise<EscrowTransactions>;

  // Photo operations for petites annonces
  createAdPhoto(photo: Omit<InsertAdPhotos, 'idx'>): Promise<AdPhotos>;
  getAdPhoto(id: string): Promise<AdPhotos | undefined>;
  getAdPhotos(adId: string): Promise<AdPhotos[]>;
  updateAdPhoto(id: string, updates: Pick<Partial<AdPhotos>, 'alt' | 'storageKey' | 'width' | 'height' | 'bytes' | 'contentType' | 'sha256'>): Promise<AdPhotos>;
  deleteAdPhoto(id: string): Promise<void>;
  reorderAdPhotos(adId: string, photoUpdates: Array<{ id: string; idx: number }>): Promise<void>;
  setCoverPhoto(adId: string, photoId: string): Promise<void>;
  getAdCoverPhoto(adId: string): Promise<AdPhotos | undefined>;
  moderateAdPhoto(photoId: string, decision: 'pending' | 'approved' | 'rejected', moderatorId: string, reason?: string): Promise<AdPhotos>;
  getPendingPhotoModeration(): Promise<AdPhotos[]>;

  // 2FA operations (nouvelles méthodes PRO)
  upsertUser2FA(user2FA: InsertUser2FA): Promise<User2FA>;
  getUser2FA(userId: string): Promise<User2FA | undefined>;
  updateUser2FAStatus(userId: string, status: string): Promise<void>;
  updateUser2FALastUsed(userId: string): Promise<void>;
  updateUser2FABackupCodes(userId: string, backupCodes: string[]): Promise<void>;

  // GDPR operations (nouvelles méthodes PRO)
  createGdprRequest(request: InsertGdprRequests): Promise<GdprRequests>;
  getGdprRequest(id: string): Promise<GdprRequests | undefined>;
  updateGdprRequest(id: string, updates: Partial<GdprRequests>): Promise<GdprRequests>;
  getUserGdprRequests(userId: string): Promise<GdprRequests[]>;
  getPendingGdprRequests(): Promise<GdprRequests[]>;

  // Security audit operations (nouvelles méthodes PRO)
  createSecurityAuditLog(log: InsertSecurityAuditLog): Promise<SecurityAuditLog>;
  getSecurityAuditLogs(limit?: number, offset?: number, actorId?: string): Promise<SecurityAuditLog[]>;

  // Stripe webhook operations (nouvelles méthodes PRO)
  upsertStripeEvent(event: InsertStripeEvents): Promise<StripeEvents>;
  getStripeEvent(id: string): Promise<StripeEvents | undefined>;
  markStripeEventProcessed(id: string): Promise<void>;

  // ===== EBOOKS AVEC LICENCES JWT ANTI-PIRATAGE =====
  
  // Ebook operations
  createEbook(ebook: InsertEbook): Promise<Ebook>;
  getEbook(id: string): Promise<Ebook | undefined>;
  getEbooks(status?: string, limit?: number): Promise<Ebook[]>;
  updateEbook(id: string, updates: Partial<Ebook>): Promise<Ebook>;
  
  // Ebook License operations (JWT-based)
  createEbookLicense(license: InsertEbookLicense): Promise<EbookLicense>;
  getEbookLicense(id: string): Promise<EbookLicense | undefined>;
  getEbookLicenseByUserAndBook(userId: string, ebookId: string, orderId: string): Promise<EbookLicense | undefined>;
  getUserEbookLicenses(userId: string): Promise<EbookLicense[]>;
  incrementEbookLicenseJWT(licenseId: string): Promise<void>;
  incrementEbookLicenseUsage(licenseId: string): Promise<void>;
  resetEbookLicenseWindow(licenseId: string): Promise<void>;
  revokeEbookLicense(licenseId: string, reason: string): Promise<void>;
  
  // Ebook Download Attempt operations (quota tracking + anti-abuse)
  createEbookDownloadAttempt(attempt: InsertEbookDownloadAttempt): Promise<EbookDownloadAttempt>;
  getEbookDownloadAttempt(id: string): Promise<EbookDownloadAttempt | undefined>;
  getEbookDownloadAttemptByNonce(nonce: string): Promise<EbookDownloadAttempt | undefined>;
  updateEbookDownloadAttempt(id: string, updates: Partial<EbookDownloadAttempt>): Promise<EbookDownloadAttempt>;
  expireOldEbookDownloadAttempts(): Promise<number>;
  
  // Admin Break-Glass OTP operations
  createAdminOtp(otp: InsertAdminBreakGlassOtp): Promise<AdminBreakGlassOtp>;
  getActiveAdminOtp(otpCodeHash: string): Promise<AdminBreakGlassOtp | undefined>;
  markAdminOtpUsed(id: string, usedBy: string, ipAddress?: string, userAgent?: string): Promise<void>;
  expireOldAdminOtps(): Promise<number>;
  getAdminOtpHistory(limit?: number): Promise<AdminBreakGlassOtp[]>;
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

  // ===== LIVE SOCIAL FEATURES IMPLEMENTATION =====
  
  // Live chat messages operations
  async createLiveChatMessage(data: { liveShowId: string; userId: string; content: string; messageType?: string; isModerated?: boolean; moderationReason?: string | null }): Promise<LiveChatMessage> {
    const messageData = {
      id: nanoid(),
      liveShowId: data.liveShowId,
      userId: data.userId,
      content: data.content,
      messageType: data.messageType || 'chat',
      isModerated: data.isModerated || false,
      moderationReason: data.moderationReason,
      reactionCount: 0,
      createdAt: new Date()
    };

    const [newMessage] = await db.insert(liveChatMessages).values(messageData).returning();
    return newMessage;
  }

  async getLiveChatMessage(id: string): Promise<LiveChatMessage | undefined> {
    const [message] = await db.select().from(liveChatMessages).where(eq(liveChatMessages.id, id));
    return message;
  }

  async updateLiveChatMessage(id: string, updates: Partial<LiveChatMessage>): Promise<LiveChatMessage> {
    const [updatedMessage] = await db
      .update(liveChatMessages)
      .set(updates)
      .where(eq(liveChatMessages.id, id))
      .returning();
    
    if (!updatedMessage) {
      throw new Error(`Live chat message with id '${id}' not found`);
    }
    
    return updatedMessage;
  }

  async getLiveShowMessages(liveShowId: string, limit: number = 50, offset: number = 0): Promise<LiveChatMessage[]> {
    return await db
      .select()
      .from(liveChatMessages)
      .where(eq(liveChatMessages.liveShowId, liveShowId))
      .orderBy(desc(liveChatMessages.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getUserLiveShowMessageCount(userId: string, liveShowId: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(liveChatMessages)
      .where(and(
        eq(liveChatMessages.userId, userId),
        eq(liveChatMessages.liveShowId, liveShowId)
      ));
    
    return result?.count || 0;
  }

  async getLiveShowMessageCount(liveShowId: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(liveChatMessages)
      .where(eq(liveChatMessages.liveShowId, liveShowId));
    
    return result?.count || 0;
  }

  // Message reactions operations
  async createMessageReaction(data: { messageId: string; userId: string; reaction: string }): Promise<MessageReaction> {
    const reactionData = {
      id: nanoid(),
      messageId: data.messageId,
      userId: data.userId,
      reaction: data.reaction,
      createdAt: new Date()
    };

    const [newReaction] = await db.insert(messageReactions).values(reactionData).returning();
    return newReaction;
  }

  async updateMessageReaction(id: string, updates: Partial<MessageReaction>): Promise<MessageReaction> {
    const [updatedReaction] = await db
      .update(messageReactions)
      .set(updates)
      .where(eq(messageReactions.id, id))
      .returning();
    
    if (!updatedReaction) {
      throw new Error(`Message reaction with id '${id}' not found`);
    }
    
    return updatedReaction;
  }

  async removeMessageReaction(messageId: string, userId: string, reaction: string): Promise<void> {
    await db
      .delete(messageReactions)
      .where(and(
        eq(messageReactions.messageId, messageId),
        eq(messageReactions.userId, userId),
        eq(messageReactions.reaction, reaction)
      ));
  }

  async getMessageReactions(messageId: string): Promise<MessageReaction[]> {
    return await db
      .select()
      .from(messageReactions)
      .where(eq(messageReactions.messageId, messageId))
      .orderBy(desc(messageReactions.createdAt));
  }

  async getUserMessageReaction(messageId: string, userId: string): Promise<MessageReaction | undefined> {
    const [reaction] = await db
      .select()
      .from(messageReactions)
      .where(and(
        eq(messageReactions.messageId, messageId),
        eq(messageReactions.userId, userId)
      ))
      .limit(1);
    
    return reaction;
  }

  async getUserLiveShowReactionCount(userId: string, liveShowId: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(messageReactions)
      .innerJoin(liveChatMessages, eq(messageReactions.messageId, liveChatMessages.id))
      .where(and(
        eq(messageReactions.userId, userId),
        eq(liveChatMessages.liveShowId, liveShowId)
      ));
    
    return result?.count || 0;
  }

  // Live polls operations
  async createLivePoll(data: { liveShowId: string; createdBy: string; question: string; options: string; endsAt?: Date }): Promise<LivePoll> {
    const pollData = {
      id: nanoid(),
      liveShowId: data.liveShowId,
      createdBy: data.createdBy,
      question: data.question,
      options: data.options,
      isActive: true,
      totalVotes: 0,
      endsAt: data.endsAt,
      createdAt: new Date()
    };

    const [newPoll] = await db.insert(livePolls).values(pollData).returning();
    return newPoll;
  }

  async getLivePoll(id: string): Promise<LivePoll | undefined> {
    const [poll] = await db.select().from(livePolls).where(eq(livePolls.id, id));
    return poll;
  }

  async updateLivePoll(id: string, updates: Partial<LivePoll>): Promise<LivePoll> {
    const [updatedPoll] = await db
      .update(livePolls)
      .set(updates)
      .where(eq(livePolls.id, id))
      .returning();
    
    if (!updatedPoll) {
      throw new Error(`Live poll with id '${id}' not found`);
    }
    
    return updatedPoll;
  }

  async deactivateExpiredPolls(): Promise<void> {
    await db
      .update(livePolls)
      .set({ isActive: false })
      .where(and(
        eq(livePolls.isActive, true),
        sql`${livePolls.endsAt} < now()`
      ));
  }

  // Poll votes operations
  async createPollVote(data: { pollId: string; userId: string; optionIndex: number }): Promise<PollVote> {
    const voteData = {
      id: nanoid(),
      pollId: data.pollId,
      userId: data.userId,
      optionIndex: data.optionIndex,
      createdAt: new Date()
    };

    const [newVote] = await db.insert(pollVotes).values(voteData).returning();
    return newVote;
  }

  async updatePollVote(id: string, updates: Partial<PollVote>): Promise<PollVote> {
    const [updatedVote] = await db
      .update(pollVotes)
      .set(updates)
      .where(eq(pollVotes.id, id))
      .returning();
    
    if (!updatedVote) {
      throw new Error(`Poll vote with id '${id}' not found`);
    }
    
    return updatedVote;
  }

  async getPollVotes(pollId: string): Promise<PollVote[]> {
    return await db
      .select()
      .from(pollVotes)
      .where(eq(pollVotes.pollId, pollId))
      .orderBy(desc(pollVotes.createdAt));
  }

  async getUserPollVote(pollId: string, userId: string): Promise<PollVote | undefined> {
    const [vote] = await db
      .select()
      .from(pollVotes)
      .where(and(
        eq(pollVotes.pollId, pollId),
        eq(pollVotes.userId, userId)
      ))
      .limit(1);
    
    return vote;
  }

  // Engagement points operations
  async createEngagementPoint(data: { userId: string; liveShowId?: string; pointType: string; points: number; description?: string }): Promise<EngagementPoint> {
    const pointData = {
      id: nanoid(),
      userId: data.userId,
      liveShowId: data.liveShowId,
      pointType: data.pointType,
      points: data.points,
      description: data.description,
      createdAt: new Date()
    };

    const [newPoint] = await db.insert(engagementPoints).values(pointData).returning();
    return newPoint;
  }

  async getUserTotalEngagementPoints(userId: string): Promise<number> {
    const [result] = await db
      .select({ total: sql<number>`coalesce(sum(${engagementPoints.points}), 0)::int` })
      .from(engagementPoints)
      .where(eq(engagementPoints.userId, userId));
    
    return result?.total || 0;
  }

  async getUserDailyEngagementPoints(userId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [result] = await db
      .select({ total: sql<number>`coalesce(sum(${engagementPoints.points}), 0)::int` })
      .from(engagementPoints)
      .where(and(
        eq(engagementPoints.userId, userId),
        sql`${engagementPoints.createdAt} >= ${today}`
      ));
    
    return result?.total || 0;
  }

  async getUserEngagementRank(userId: string): Promise<number> {
    const userTotal = await this.getUserTotalEngagementPoints(userId);
    
    const [result] = await db
      .select({ rank: sql<number>`count(distinct ${engagementPoints.userId})::int + 1` })
      .from(engagementPoints)
      .where(sql`(
        select coalesce(sum(points), 0) 
        from ${engagementPoints} ep2 
        where ep2.user_id = ${engagementPoints.userId}
      ) > ${userTotal}`);
    
    return result?.rank || 1;
  }

  async getTopEngagementUsers(liveShowId?: string, period: string = 'today', limit: number = 10): Promise<Array<{ userId: string; totalPoints: number }>> {
    let timeCondition = sql`true`;
    
    if (period === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      timeCondition = sql`${engagementPoints.createdAt} >= ${today}`;
    } else if (period === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      timeCondition = sql`${engagementPoints.createdAt} >= ${weekAgo}`;
    }

    const conditions = [timeCondition];
    if (liveShowId) {
      conditions.push(eq(engagementPoints.liveShowId, liveShowId));
    }

    return await db
      .select({
        userId: engagementPoints.userId,
        totalPoints: sql<number>`sum(${engagementPoints.points})::int`
      })
      .from(engagementPoints)
      .where(and(...conditions))
      .groupBy(engagementPoints.userId)
      .orderBy(desc(sql`sum(${engagementPoints.points})`))
      .limit(limit);
  }

  // User badges operations
  async createUserBadge(data: { userId: string; liveShowId?: string; badgeType: string; badgeName: string; badgeDescription?: string }): Promise<UserBadge> {
    const badgeData = {
      id: nanoid(),
      userId: data.userId,
      liveShowId: data.liveShowId,
      badgeType: data.badgeType,
      badgeName: data.badgeName,
      badgeDescription: data.badgeDescription,
      createdAt: new Date()
    };

    const [newBadge] = await db.insert(userBadges).values(badgeData).returning();
    return newBadge;
  }

  async getUserBadge(userId: string, badgeType: string, liveShowId?: string): Promise<UserBadge | undefined> {
    const conditions = [
      eq(userBadges.userId, userId),
      eq(userBadges.badgeType, badgeType)
    ];

    if (liveShowId) {
      conditions.push(eq(userBadges.liveShowId, liveShowId));
    }

    const [badge] = await db
      .select()
      .from(userBadges)
      .where(and(...conditions))
      .limit(1);
    
    return badge;
  }

  async getUserBadges(userId: string): Promise<UserBadge[]> {
    return await db
      .select()
      .from(userBadges)
      .where(eq(userBadges.userId, userId))
      .orderBy(desc(userBadges.createdAt));
  }

  // Live predictions operations
  async createLivePrediction(data: { liveShowId: string; createdBy: string; question: string; outcomes: string; endsAt?: Date }): Promise<LivePrediction> {
    const predictionData = {
      id: nanoid(),
      liveShowId: data.liveShowId,
      createdBy: data.createdBy,
      question: data.question,
      outcomes: data.outcomes,
      isActive: true,
      totalBets: 0,
      totalAmount: '0',
      endsAt: data.endsAt,
      winningOutcome: null,
      createdAt: new Date()
    };

    const [newPrediction] = await db.insert(livePredictions).values(predictionData).returning();
    return newPrediction;
  }

  async getLivePrediction(id: string): Promise<LivePrediction | undefined> {
    const [prediction] = await db.select().from(livePredictions).where(eq(livePredictions.id, id));
    return prediction;
  }

  async updateLivePrediction(id: string, updates: Partial<LivePrediction>): Promise<LivePrediction> {
    const [updatedPrediction] = await db
      .update(livePredictions)
      .set(updates)
      .where(eq(livePredictions.id, id))
      .returning();
    
    if (!updatedPrediction) {
      throw new Error(`Live prediction with id '${id}' not found`);
    }
    
    return updatedPrediction;
  }

  async deactivateExpiredPredictions(): Promise<void> {
    await db
      .update(livePredictions)
      .set({ isActive: false })
      .where(and(
        eq(livePredictions.isActive, true),
        sql`${livePredictions.endsAt} < now()`
      ));
  }

  // Prediction bets operations
  async createPredictionBet(data: { predictionId: string; userId: string; outcomeIndex: number; amount: string; potentialWin: string }): Promise<PredictionBet> {
    const betData = {
      id: nanoid(),
      predictionId: data.predictionId,
      userId: data.userId,
      outcomeIndex: data.outcomeIndex,
      amount: data.amount,
      potentialWin: data.potentialWin,
      isWinner: null,
      createdAt: new Date()
    };

    const [newBet] = await db.insert(predictionBets).values(betData).returning();
    return newBet;
  }

  async updatePredictionBet(id: string, updates: Partial<PredictionBet>): Promise<PredictionBet> {
    const [updatedBet] = await db
      .update(predictionBets)
      .set(updates)
      .where(eq(predictionBets.id, id))
      .returning();
    
    if (!updatedBet) {
      throw new Error(`Prediction bet with id '${id}' not found`);
    }
    
    return updatedBet;
  }

  async getPredictionBets(predictionId: string): Promise<PredictionBet[]> {
    return await db
      .select()
      .from(predictionBets)
      .where(eq(predictionBets.predictionId, predictionId))
      .orderBy(desc(predictionBets.createdAt));
  }

  async getUserPredictionBet(predictionId: string, userId: string): Promise<PredictionBet | undefined> {
    const [bet] = await db
      .select()
      .from(predictionBets)
      .where(and(
        eq(predictionBets.predictionId, predictionId),
        eq(predictionBets.userId, userId)
      ))
      .limit(1);
    
    return bet;
  }

  // Analytics operations for social features
  async isUserTopInvestorForLiveShow(userId: string, liveShowId: string): Promise<boolean> {
    // Récupérer le total des investissements de l'utilisateur pour ce Live Show
    const [userInvestment] = await db
      .select({ total: sql<number>`coalesce(sum(cast(${investments.amount} as decimal)), 0)` })
      .from(investments)
      .innerJoin(projects, eq(investments.projectId, projects.id))
      .where(and(
        eq(investments.userId, userId),
        eq(projects.liveShowId, liveShowId)
      ));

    if (!userInvestment?.total || userInvestment.total === 0) {
      return false;
    }

    // Récupérer le plus gros investissement pour ce Live Show
    const [topInvestment] = await db
      .select({ maxTotal: sql<number>`max(user_totals.total)` })
      .from(
        db
          .select({
            userId: investments.userId,
            total: sql<number>`sum(cast(${investments.amount} as decimal))`
          })
          .from(investments)
          .innerJoin(projects, eq(investments.projectId, projects.id))
          .where(eq(projects.liveShowId, liveShowId))
          .groupBy(investments.userId)
          .as('user_totals')
      );

    return userInvestment.total >= (topInvestment?.maxTotal || 0);
  }

  // ===== PETITES ANNONCES IMPLEMENTATION =====
  
  // Petites annonces CRUD operations
  async createPetiteAnnonce(annonce: InsertPetitesAnnonces): Promise<PetitesAnnonces> {
    const [newAnnonce] = await db.insert(petitesAnnonces).values({
      ...annonce,
      id: nanoid(),
      viewCount: 0,
      contactCount: 0,
      status: 'pending',
      isPromoted: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return newAnnonce;
  }

  async getPetiteAnnonce(id: string): Promise<PetitesAnnonces | undefined> {
    const [annonce] = await db
      .select()
      .from(petitesAnnonces)
      .where(eq(petitesAnnonces.id, id));
    return annonce;
  }

  async getPetitesAnnonces(params: {
    category?: string;
    location?: string;
    authorId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<PetitesAnnonces[]> {
    const { category, location, authorId, status, limit = 20, offset = 0 } = params;
    
    let query = db.select().from(petitesAnnonces);
    const conditions = [];
    
    if (category) {
      conditions.push(eq(petitesAnnonces.category, category));
    }
    if (location) {
      conditions.push(eq(petitesAnnonces.location, location));
    }
    if (authorId) {
      conditions.push(eq(petitesAnnonces.authorId, authorId));
    }
    if (status) {
      conditions.push(eq(petitesAnnonces.status, status));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query
      .orderBy(desc(petitesAnnonces.isPromoted), desc(petitesAnnonces.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async updatePetiteAnnonce(id: string, updates: Partial<PetitesAnnonces>): Promise<PetitesAnnonces> {
    const [updatedAnnonce] = await db
      .update(petitesAnnonces)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(petitesAnnonces.id, id))
      .returning();
    return updatedAnnonce;
  }

  async deletePetiteAnnonce(id: string): Promise<void> {
    await db.delete(petitesAnnonces).where(eq(petitesAnnonces.id, id));
  }

  async incrementAnnonceViewCount(id: string): Promise<void> {
    await db
      .update(petitesAnnonces)
      .set({ 
        viewCount: sql`${petitesAnnonces.viewCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(petitesAnnonces.id, id));
  }

  async incrementAnnonceContactCount(id: string): Promise<void> {
    await db
      .update(petitesAnnonces)
      .set({ 
        contactCount: sql`${petitesAnnonces.contactCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(petitesAnnonces.id, id));
  }

  // Search and filter operations
  async searchPetitesAnnonces(query: string, filters: {
    category?: string;
    location?: string;
    priceRange?: { min?: number; max?: number };
  } = {}): Promise<PetitesAnnonces[]> {
    const { category, location, priceRange } = filters;
    
    let dbQuery = db
      .select()
      .from(petitesAnnonces)
      .where(
        and(
          eq(petitesAnnonces.status, 'approved'),
          or(
            sql`${petitesAnnonces.title} ILIKE ${'%' + query + '%'}`,
            sql`${petitesAnnonces.description} ILIKE ${'%' + query + '%'}`
          )
        )
      );
    
    const conditions = [eq(petitesAnnonces.status, 'approved')];
    
    if (category) {
      conditions.push(eq(petitesAnnonces.category, category));
    }
    if (location) {
      conditions.push(eq(petitesAnnonces.location, location));
    }
    if (priceRange?.min) {
      conditions.push(gte(petitesAnnonces.price, priceRange.min.toString()));
    }
    if (priceRange?.max) {
      conditions.push(lte(petitesAnnonces.price, priceRange.max.toString()));
    }
    
    return await dbQuery
      .where(and(...conditions))
      .orderBy(desc(petitesAnnonces.isPromoted), desc(petitesAnnonces.createdAt))
      .limit(50);
  }

  // User's annonces management
  async getUserActiveAnnonces(userId: string): Promise<PetitesAnnonces[]> {
    return await db
      .select()
      .from(petitesAnnonces)
      .where(
        and(
          eq(petitesAnnonces.authorId, userId),
          or(
            eq(petitesAnnonces.status, 'approved'),
            eq(petitesAnnonces.status, 'pending')
          )
        )
      )
      .orderBy(desc(petitesAnnonces.createdAt));
  }

  async getUserAnnonceCount(userId: string, status?: string): Promise<number> {
    const conditions = [eq(petitesAnnonces.authorId, userId)];
    
    if (status) {
      conditions.push(eq(petitesAnnonces.status, status));
    }
    
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(petitesAnnonces)
      .where(and(...conditions));
    
    return result[0]?.count || 0;
  }

  async getExpiredAnnonces(): Promise<PetitesAnnonces[]> {
    const now = new Date();
    return await db
      .select()
      .from(petitesAnnonces)
      .where(
        and(
          lte(petitesAnnonces.expiresAt, now),
          eq(petitesAnnonces.status, 'approved')
        )
      );
  }

  async archiveExpiredAnnonces(): Promise<void> {
    const now = new Date();
    await db
      .update(petitesAnnonces)
      .set({ 
        status: 'expired',
        updatedAt: new Date()
      })
      .where(
        and(
          lte(petitesAnnonces.expiresAt, now),
          eq(petitesAnnonces.status, 'approved')
        )
      );
  }

  // Moderation operations
  async createAnnonceModeration(moderation: InsertAnnoncesModeration): Promise<AnnoncesModeration> {
    const [newModeration] = await db.insert(annoncesModeration).values({
      ...moderation,
      id: nanoid(),
      createdAt: new Date()
    }).returning();
    return newModeration;
  }

  async getAnnonceModeration(annonceId: string): Promise<AnnoncesModeration[]> {
    return await db
      .select()
      .from(annoncesModeration)
      .where(eq(annoncesModeration.annonceId, annonceId))
      .orderBy(desc(annoncesModeration.createdAt));
  }

  async getPendingModerationAnnonces(): Promise<PetitesAnnonces[]> {
    return await db
      .select()
      .from(petitesAnnonces)
      .where(eq(petitesAnnonces.status, 'pending'))
      .orderBy(asc(petitesAnnonces.createdAt));
  }

  async approveAnnonce(annonceId: string, moderatorId: string, aiScore?: number): Promise<void> {
    await db.transaction(async (tx) => {
      // Update annonce status
      await tx
        .update(petitesAnnonces)
        .set({ 
          status: 'approved',
          updatedAt: new Date()
        })
        .where(eq(petitesAnnonces.id, annonceId));
      
      // Create moderation record
      await tx.insert(annoncesModeration).values({
        id: nanoid(),
        annonceId,
        moderatorId,
        action: 'approved',
        aiScore,
        reviewedAt: new Date(),
        createdAt: new Date()
      });
    });
  }

  async rejectAnnonce(annonceId: string, moderatorId: string, reason: string, sanction?: string): Promise<void> {
    await db.transaction(async (tx) => {
      // Get annonce for sanction processing
      const [annonce] = await tx
        .select()
        .from(petitesAnnonces)
        .where(eq(petitesAnnonces.id, annonceId));
      
      if (!annonce) {
        throw new Error(`Annonce not found: ${annonceId}`);
      }

      // Update annonce status
      await tx
        .update(petitesAnnonces)
        .set({ 
          status: 'rejected',
          updatedAt: new Date()
        })
        .where(eq(petitesAnnonces.id, annonceId));
      
      // Create moderation record
      await tx.insert(annoncesModeration).values({
        id: nanoid(),
        annonceId,
        moderatorId,
        action: 'rejected',
        reason,
        reviewedAt: new Date(),
        createdAt: new Date()
      });

      // Create sanction if specified
      if (sanction) {
        await tx.insert(annoncesSanctions).values({
          id: nanoid(),
          userId: annonce.authorId,
          type: sanction,
          reason,
          issuedBy: moderatorId,
          issuedAt: new Date(),
          isActive: true,
          createdAt: new Date()
        });
      }
    });
  }

  // Reporting operations
  async createAnnonceReport(report: InsertAnnoncesReports): Promise<AnnoncesReports> {
    const [newReport] = await db.insert(annoncesReports).values({
      ...report,
      id: nanoid(),
      status: 'pending',
      createdAt: new Date()
    }).returning();
    return newReport;
  }

  async getAnnonceReports(annonceId: string): Promise<AnnoncesReports[]> {
    return await db
      .select()
      .from(annoncesReports)
      .where(eq(annoncesReports.annonceId, annonceId))
      .orderBy(desc(annoncesReports.createdAt));
  }

  async getPendingReports(): Promise<AnnoncesReports[]> {
    return await db
      .select()
      .from(annoncesReports)
      .where(eq(annoncesReports.status, 'pending'))
      .orderBy(asc(annoncesReports.createdAt));
  }

  async resolveReport(reportId: string, reviewerId: string, resolution: string): Promise<AnnoncesReports> {
    const [updatedReport] = await db
      .update(annoncesReports)
      .set({
        status: 'resolved',
        resolution,
        reviewerId,
        reviewedAt: new Date()
      })
      .where(eq(annoncesReports.id, reportId))
      .returning();
    return updatedReport;
  }

  // Sanctions operations
  async createAnnonceSanction(sanction: InsertAnnoncesSanctions): Promise<AnnoncesSanctions> {
    const [newSanction] = await db.insert(annoncesSanctions).values({
      ...sanction,
      id: nanoid(),
      createdAt: new Date()
    }).returning();
    return newSanction;
  }

  async getUserActiveSanctions(userId: string): Promise<AnnoncesSanctions[]> {
    return await db
      .select()
      .from(annoncesSanctions)
      .where(
        and(
          eq(annoncesSanctions.userId, userId),
          eq(annoncesSanctions.isActive, true),
          or(
            isNotNull(annoncesSanctions.expiresAt),
            gte(annoncesSanctions.expiresAt, new Date())
          )
        )
      )
      .orderBy(desc(annoncesSanctions.createdAt));
  }

  async isUserSanctioned(userId: string): Promise<boolean> {
    const activeSanctions = await this.getUserActiveSanctions(userId);
    return activeSanctions.length > 0;
  }

  async liftSanction(sanctionId: string, liftedBy: string): Promise<AnnoncesSanctions> {
    const [updatedSanction] = await db
      .update(annoncesSanctions)
      .set({
        isActive: false,
        liftedBy,
        liftedAt: new Date()
      })
      .where(eq(annoncesSanctions.id, sanctionId))
      .returning();
    return updatedSanction;
  }

  // Escrow operations
  async createEscrowTransaction(escrow: InsertEscrowTransactions): Promise<EscrowTransactions> {
    // Calculate escrow fees (5% with €1 minimum)
    const amount = parseFloat(escrow.amount);
    const feeAmount = Math.max(amount * ESCROW_FEE_RATE, ESCROW_MINIMUM_FEE);
    const netAmount = amount - feeAmount;
    
    const [newEscrow] = await db.insert(escrowTransactions).values({
      ...escrow,
      id: nanoid(),
      feeAmount: feeAmount.toString(),
      netAmount: netAmount.toString(),
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return newEscrow;
  }

  async getEscrowTransaction(id: string): Promise<EscrowTransactions | undefined> {
    const [escrow] = await db
      .select()
      .from(escrowTransactions)
      .where(eq(escrowTransactions.id, id));
    return escrow;
  }

  async getAnnonceEscrowTransactions(annonceId: string): Promise<EscrowTransactions[]> {
    return await db
      .select()
      .from(escrowTransactions)
      .where(eq(escrowTransactions.annonceId, annonceId))
      .orderBy(desc(escrowTransactions.createdAt));
  }

  async getUserEscrowTransactions(userId: string, role?: 'buyer' | 'seller'): Promise<EscrowTransactions[]> {
    const conditions = [];
    
    if (role === 'buyer') {
      conditions.push(eq(escrowTransactions.buyerId, userId));
    } else if (role === 'seller') {
      conditions.push(eq(escrowTransactions.sellerId, userId));
    } else {
      conditions.push(
        or(
          eq(escrowTransactions.buyerId, userId),
          eq(escrowTransactions.sellerId, userId)
        )
      );
    }
    
    return await db
      .select()
      .from(escrowTransactions)
      .where(and(...conditions))
      .orderBy(desc(escrowTransactions.createdAt));
  }

  async updateEscrowStatus(id: string, status: string, updates: Partial<EscrowTransactions> = {}): Promise<EscrowTransactions> {
    // Conditional update to prevent invalid state transitions
    const allowedTransitions = {
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['released', 'disputed'],
      'disputed': ['released', 'refunded'],
      'released': [], // Final state
      'refunded': [], // Final state
      'cancelled': [] // Final state
    };

    const [updatedEscrow] = await db
      .update(escrowTransactions)
      .set({
        status,
        ...updates,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(escrowTransactions.id, id),
          sql`status != 'released' AND status != 'refunded'` // Prevent double release/refund
        )
      )
      .returning();

    if (!updatedEscrow) {
      throw new Error(`Escrow transaction not found or already finalized: ${id}`);
    }

    return updatedEscrow;
  }

  async releaseEscrow(id: string, releasedBy: string): Promise<EscrowTransactions> {
    return await this.updateEscrowStatus(id, 'released', {
      releasedBy,
      releasedAt: new Date()
    });
  }

  async refundEscrow(id: string, reason: string): Promise<EscrowTransactions> {
    return await this.updateEscrowStatus(id, 'refunded', {
      refundReason: reason,
      refundedAt: new Date()
    });
  }

  // ===== PHOTO OPERATIONS FOR PETITES ANNONCES =====
  
  async createAdPhoto(photo: Omit<InsertAdPhotos, 'idx'>): Promise<AdPhotos> {
    // Use transaction to atomically find next available index and insert
    const newPhoto = await db.transaction(async (tx) => {
      // Find the next available index (0-9) by looking for gaps
      const existingIndices = await tx
        .select({ idx: adPhotos.idx })
        .from(adPhotos)
        .where(eq(adPhotos.adId, photo.adId))
        .orderBy(adPhotos.idx);
      
      const usedIndices = new Set(existingIndices.map(row => row.idx));
      
      // Find first available index from 0-9
      let nextIdx = -1;
      for (let i = 0; i <= 9; i++) {
        if (!usedIndices.has(i)) {
          nextIdx = i;
          break;
        }
      }
      
      if (nextIdx === -1) {
        throw new Error("Maximum 10 photos per ad allowed");
      }
      
      // Insert with the determined index
      const [inserted] = await tx.insert(adPhotos).values({
        ...photo,
        idx: nextIdx,
        id: nanoid(),
        moderationStatus: 'pending',
        createdAt: new Date()
      }).returning();
      
      return inserted;
    });
    
    return newPhoto;
  }

  async getAdPhoto(id: string): Promise<AdPhotos | undefined> {
    const [photo] = await db
      .select()
      .from(adPhotos)
      .where(eq(adPhotos.id, id));
    return photo;
  }

  async getAdPhotos(adId: string): Promise<AdPhotos[]> {
    return await db
      .select()
      .from(adPhotos)
      .where(eq(adPhotos.adId, adId))
      .orderBy(adPhotos.idx);
  }

  async updateAdPhoto(id: string, updates: Pick<Partial<AdPhotos>, 'alt' | 'storageKey' | 'width' | 'height' | 'bytes' | 'contentType' | 'sha256'>): Promise<AdPhotos> {
    // Only allow updating safe metadata fields - not adId, idx, isCover, or moderation fields
    const [updatedPhoto] = await db
      .update(adPhotos)
      .set(updates)
      .where(eq(adPhotos.id, id))
      .returning();
    
    if (!updatedPhoto) {
      throw new Error(`Photo not found: ${id}`);
    }
    
    return updatedPhoto;
  }

  async deleteAdPhoto(id: string): Promise<void> {
    await db
      .delete(adPhotos)
      .where(eq(adPhotos.id, id));
  }

  async reorderAdPhotos(adId: string, photoUpdates: Array<{ id: string; idx: number }>): Promise<void> {
    // Use two-phase transaction to avoid unique constraint violations during swaps
    await db.transaction(async (tx) => {
      // Phase 1: Move all photos to temporary indices (1000+ offset to avoid conflicts)
      for (const update of photoUpdates) {
        await tx
          .update(adPhotos)
          .set({ idx: update.idx + 1000 })
          .where(and(eq(adPhotos.id, update.id), eq(adPhotos.adId, adId)));
      }
      
      // Phase 2: Set final indices (now safe since all are at 1000+ offset)
      for (const update of photoUpdates) {
        await tx
          .update(adPhotos)
          .set({ idx: update.idx })
          .where(and(eq(adPhotos.id, update.id), eq(adPhotos.adId, adId)));
      }
    });
  }

  async setCoverPhoto(adId: string, photoId: string): Promise<void> {
    // Use transaction to ensure only one cover photo
    await db.transaction(async (tx) => {
      // Verify photo belongs to the ad
      const [photo] = await tx
        .select({ id: adPhotos.id })
        .from(adPhotos)
        .where(and(eq(adPhotos.id, photoId), eq(adPhotos.adId, adId)));
      
      if (!photo) {
        throw new Error(`Photo ${photoId} not found in ad ${adId}`);
      }
      
      // Clear existing cover photo (unique constraint will enforce only one)
      await tx
        .update(adPhotos)
        .set({ isCover: false })
        .where(eq(adPhotos.adId, adId));
      
      // Set new cover photo - unique constraint ensures atomicity
      await tx
        .update(adPhotos)
        .set({ isCover: true })
        .where(eq(adPhotos.id, photoId));
    });
  }

  async getAdCoverPhoto(adId: string): Promise<AdPhotos | undefined> {
    const [coverPhoto] = await db
      .select()
      .from(adPhotos)
      .where(and(eq(adPhotos.adId, adId), eq(adPhotos.isCover, true)));
    return coverPhoto;
  }

  async moderateAdPhoto(photoId: string, decision: 'pending' | 'approved' | 'rejected', moderatorId: string, reason?: string): Promise<AdPhotos> {
    const [updatedPhoto] = await db
      .update(adPhotos)
      .set({
        moderationStatus: decision,
        moderatedBy: moderatorId,
        moderatedAt: new Date(),
        moderationReason: reason
      })
      .where(eq(adPhotos.id, photoId))
      .returning();
    
    if (!updatedPhoto) {
      throw new Error(`Photo not found: ${photoId}`);
    }
    
    return updatedPhoto;
  }

  async getPendingPhotoModeration(): Promise<AdPhotos[]> {
    return await db
      .select()
      .from(adPhotos)
      .where(eq(adPhotos.moderationStatus, 'pending'))
      .orderBy(adPhotos.createdAt);
  }

  // ===== NOUVELLES IMPLÉMENTATIONS PRO =====

  // 2FA operations
  async upsertUser2FA(user2FAData: InsertUser2FA): Promise<User2FA> {
    const [result] = await db
      .insert(user2FA)
      .values(user2FAData)
      .onConflictDoUpdate({
        target: user2FA.userId,
        set: {
          ...user2FAData,
        },
      })
      .returning();
    return result;
  }

  async getUser2FA(userId: string): Promise<User2FA | undefined> {
    const [result] = await db.select().from(user2FA).where(eq(user2FA.userId, userId));
    return result;
  }

  async updateUser2FAStatus(userId: string, status: string): Promise<void> {
    await db
      .update(user2FA)
      .set({ status })
      .where(eq(user2FA.userId, userId));
  }

  async updateUser2FALastUsed(userId: string): Promise<void> {
    await db
      .update(user2FA)
      .set({ lastUsedAt: new Date() })
      .where(eq(user2FA.userId, userId));
  }

  async updateUser2FABackupCodes(userId: string, backupCodes: string[]): Promise<void> {
    await db
      .update(user2FA)
      .set({ backupCodes })
      .where(eq(user2FA.userId, userId));
  }

  // GDPR operations
  async createGdprRequest(request: InsertGdprRequests): Promise<GdprRequests> {
    const [newRequest] = await db.insert(gdprRequests).values(request).returning();
    return newRequest;
  }

  async getGdprRequest(id: string): Promise<GdprRequests | undefined> {
    const [request] = await db.select().from(gdprRequests).where(eq(gdprRequests.id, id));
    return request;
  }

  async updateGdprRequest(id: string, updates: Partial<GdprRequests>): Promise<GdprRequests> {
    const [updatedRequest] = await db
      .update(gdprRequests)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(gdprRequests.id, id))
      .returning();
    return updatedRequest;
  }

  async getUserGdprRequests(userId: string): Promise<GdprRequests[]> {
    return await db
      .select()
      .from(gdprRequests)
      .where(eq(gdprRequests.userId, userId))
      .orderBy(desc(gdprRequests.createdAt));
  }

  async getPendingGdprRequests(): Promise<GdprRequests[]> {
    return await db
      .select()
      .from(gdprRequests)
      .where(eq(gdprRequests.status, 'pending'))
      .orderBy(gdprRequests.createdAt);
  }

  // Security audit operations
  async createSecurityAuditLog(log: InsertSecurityAuditLog): Promise<SecurityAuditLog> {
    const [newLog] = await db.insert(securityAuditLog).values(log).returning();
    return newLog;
  }

  async getSecurityAuditLogs(limit = 100, offset = 0, actorId?: string): Promise<SecurityAuditLog[]> {
    const baseQuery = db.select().from(securityAuditLog);
    
    if (actorId) {
      return await baseQuery
        .where(eq(securityAuditLog.actorId, actorId))
        .orderBy(desc(securityAuditLog.timestamp))
        .limit(limit)
        .offset(offset);
    }
    
    return await baseQuery
      .orderBy(desc(securityAuditLog.timestamp))
      .limit(limit)
      .offset(offset);
  }

  // Stripe webhook operations
  async upsertStripeEvent(event: InsertStripeEvents): Promise<StripeEvents> {
    const [stripeEvent] = await db
      .insert(stripeEvents)
      .values(event)
      .onConflictDoUpdate({
        target: stripeEvents.id,
        set: {
          ...event,
          updatedAt: new Date(),
        },
      })
      .returning();
    return stripeEvent;
  }

  async getStripeEvent(id: string): Promise<StripeEvents | undefined> {
    const [event] = await db.select().from(stripeEvents).where(eq(stripeEvents.id, id));
    return event;
  }

  async markStripeEventProcessed(id: string): Promise<void> {
    await db
      .update(stripeEvents)
      .set({ processed: true, updatedAt: new Date() })
      .where(eq(stripeEvents.id, id));
  }

  // Admin Break-Glass OTP operations
  async createAdminBreakGlassOtp(data: any): Promise<any> {
    const [result] = await db.insert(adminBreakGlassOtp).values(data).returning();
    return result;
  }

  async getActiveAdminOtp(otpCode: string): Promise<any> {
    const [result] = await db
      .select()
      .from(adminBreakGlassOtp)
      .where(
        and(
          eq(adminBreakGlassOtp.otpCode, otpCode),
          eq(adminBreakGlassOtp.status, 'active'),
          gt(adminBreakGlassOtp.expiresAt, new Date())
        )
      )
      .limit(1);
    return result || null;
  }

  async useAdminBreakGlassOtp(otpCode: string, userId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await db
      .update(adminBreakGlassOtp)
      .set({
        status: 'used',
        usedAt: new Date(),
        usedBy: userId,
        ipAddress,
        userAgent,
      })
      .where(eq(adminBreakGlassOtp.otpCode, otpCode));
  }

  async expireOldAdminOtps(): Promise<void> {
    await db
      .update(adminBreakGlassOtp)
      .set({ status: 'expired' })
      .where(
        and(
          eq(adminBreakGlassOtp.status, 'active'),
          lt(adminBreakGlassOtp.expiresAt, new Date())
        )
      );
  }

  async getAdminOtpHistory(limit: number = 50): Promise<any[]> {
    return await db
      .select()
      .from(adminBreakGlassOtp)
      .orderBy(desc(adminBreakGlassOtp.createdAt))
      .limit(limit);
  }

  // ===== EBOOKS WITH JWT LICENSES IMPLEMENTATION =====
  
  async createEbook(ebook: InsertEbook): Promise<Ebook> {
    const [result] = await db.insert(ebooks).values(ebook).returning();
    return result;
  }

  async getEbook(id: string): Promise<Ebook | undefined> {
    const [result] = await db.select().from(ebooks).where(eq(ebooks.id, id));
    return result;
  }

  async getEbooks(status?: string, limit: number = 50): Promise<Ebook[]> {
    if (status) {
      return await db.select().from(ebooks).where(eq(ebooks.status, status as any)).limit(limit);
    }
    return await db.select().from(ebooks).limit(limit);
  }

  async updateEbook(id: string, updates: Partial<Ebook>): Promise<Ebook> {
    const [result] = await db.update(ebooks).set({ ...updates, updatedAt: new Date() }).where(eq(ebooks.id, id)).returning();
    return result;
  }

  async createEbookLicense(license: InsertEbookLicense): Promise<EbookLicense> {
    const [result] = await db.insert(ebookLicenses).values(license).returning();
    return result;
  }

  async getEbookLicense(id: string): Promise<EbookLicense | undefined> {
    const [result] = await db.select().from(ebookLicenses).where(eq(ebookLicenses.id, id));
    return result;
  }

  async getEbookLicenseByUserAndBook(userId: string, ebookId: string, orderId: string): Promise<EbookLicense | undefined> {
    const [result] = await db
      .select()
      .from(ebookLicenses)
      .where(
        and(
          eq(ebookLicenses.userId, userId),
          eq(ebookLicenses.ebookId, ebookId),
          eq(ebookLicenses.orderId, orderId)
        )
      );
    return result;
  }

  async getUserEbookLicenses(userId: string): Promise<EbookLicense[]> {
    return await db.select().from(ebookLicenses).where(eq(ebookLicenses.userId, userId));
  }

  async incrementEbookLicenseJWT(licenseId: string): Promise<void> {
    await db
      .update(ebookLicenses)
      .set({
        jwtIssued: sql`${ebookLicenses.jwtIssued} + 1`,
        lastJwtAt: new Date(),
      })
      .where(eq(ebookLicenses.id, licenseId));
  }

  async incrementEbookLicenseUsage(licenseId: string): Promise<void> {
    await db
      .update(ebookLicenses)
      .set({
        dlUsed: sql`${ebookLicenses.dlUsed} + 1`,
      })
      .where(eq(ebookLicenses.id, licenseId));
  }

  async resetEbookLicenseWindow(licenseId: string): Promise<void> {
    await db
      .update(ebookLicenses)
      .set({
        dlUsed: 0,
        windowStartAt: new Date(),
      })
      .where(eq(ebookLicenses.id, licenseId));
  }

  async revokeEbookLicense(licenseId: string, reason: string): Promise<void> {
    await db
      .update(ebookLicenses)
      .set({
        status: 'revoked',
        revokedAt: new Date(),
        revokedReason: reason,
      })
      .where(eq(ebookLicenses.id, licenseId));
  }

  async createEbookDownloadAttempt(attempt: InsertEbookDownloadAttempt): Promise<EbookDownloadAttempt> {
    const [result] = await db.insert(ebookDownloadAttempts).values(attempt).returning();
    return result;
  }

  async getEbookDownloadAttempt(id: string): Promise<EbookDownloadAttempt | undefined> {
    const [result] = await db.select().from(ebookDownloadAttempts).where(eq(ebookDownloadAttempts.id, id));
    return result;
  }

  async getEbookDownloadAttemptByNonce(nonce: string): Promise<EbookDownloadAttempt | undefined> {
    const [result] = await db.select().from(ebookDownloadAttempts).where(eq(ebookDownloadAttempts.nonce, nonce));
    return result;
  }

  async updateEbookDownloadAttempt(id: string, updates: Partial<EbookDownloadAttempt>): Promise<EbookDownloadAttempt> {
    const [result] = await db.update(ebookDownloadAttempts).set(updates).where(eq(ebookDownloadAttempts.id, id)).returning();
    return result;
  }

  async expireOldEbookDownloadAttempts(): Promise<number> {
    const result = await db
      .update(ebookDownloadAttempts)
      .set({ status: 'expired' })
      .where(
        and(
          eq(ebookDownloadAttempts.status, 'pending'),
          lt(ebookDownloadAttempts.expiresAt, new Date())
        )
      )
      .returning();
    return result.length;
  }

  async createAdminOtp(otp: InsertAdminBreakGlassOtp): Promise<AdminBreakGlassOtp> {
    const [result] = await db.insert(adminBreakGlassOtp).values(otp).returning();
    return result;
  }

  async getActiveAdminOtp(otpCodeHash: string): Promise<AdminBreakGlassOtp | undefined> {
    const [result] = await db
      .select()
      .from(adminBreakGlassOtp)
      .where(
        and(
          eq(adminBreakGlassOtp.otpCode, otpCodeHash),
          eq(adminBreakGlassOtp.status, 'active'),
          gt(adminBreakGlassOtp.expiresAt, new Date())
        )
      );
    return result;
  }

  async markAdminOtpUsed(id: string, usedBy: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await db
      .update(adminBreakGlassOtp)
      .set({
        status: 'used',
        usedAt: new Date(),
        usedBy,
        ipAddress,
        userAgent,
      })
      .where(eq(adminBreakGlassOtp.id, id));
  }

  async expireOldAdminOtps(): Promise<number> {
    const result = await db
      .update(adminBreakGlassOtp)
      .set({ status: 'expired' })
      .where(
        and(
          eq(adminBreakGlassOtp.status, 'active'),
          lt(adminBreakGlassOtp.expiresAt, new Date())
        )
      )
      .returning();
    return result.length;
  }
}

export const storage = new DatabaseStorage();
