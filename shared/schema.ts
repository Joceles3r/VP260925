import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  pgEnum,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { ALLOWED_PROJECT_PRICES, isValidProjectPrice } from "./constants";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User profile types enum
export const profileTypeEnum = pgEnum('profile_type', ['investor', 'invested_reader', 'creator', 'admin', 'infoporteur']);

// Project status enum
export const projectStatusEnum = pgEnum('project_status', ['pending', 'active', 'completed', 'rejected']);

// Transaction type enum
export const transactionTypeEnum = pgEnum('transaction_type', ['investment', 'withdrawal', 'commission', 'redistribution', 'deposit', 'project_extension']);

// Notification type enum
export const notificationTypeEnum = pgEnum('notification_type', [
  'investment_milestone', 
  'funding_goal_reached', 
  'project_status_change',
  'roi_update',
  'new_investment',
  'live_show_started',
  'battle_result',
  'performance_alert'
]);

// Notification priority enum
export const notificationPriorityEnum = pgEnum('notification_priority', ['low', 'medium', 'high', 'urgent']);

// Video deposit type enum (based on VISUAL pricing: 2€, 5€, 10€)
export const videoTypeEnum = pgEnum('video_type', ['clip', 'documentary', 'film']);

// Video deposit status enum
export const videoDepositStatusEnum = pgEnum('video_deposit_status', ['pending_payment', 'processing', 'active', 'rejected', 'archived']);

// Video protection type enum
export const videoProtectionEnum = pgEnum('video_protection', ['token', 'hls_encrypted', 'watermarked']);

// Post type enum for social network
export const postTypeEnum = pgEnum('post_type', ['announcement', 'teaser', 'article', 'discussion', 'update']);

// Post status enum
export const postStatusEnum = pgEnum('post_status', ['draft', 'published', 'archived', 'moderated']);

// Comment type enum
export const commentTypeEnum = pgEnum('comment_type', ['comment', 'reply', 'reaction']);

// Receipt type enum 
export const receiptTypeEnum = pgEnum('receipt_type', ['deposit', 'investment', 'withdrawal', 'prolongation', 'visupoints']);

// Receipt format enum
export const receiptFormatEnum = pgEnum('receipt_format', ['pdf', 'txt']);

// Category status enum
export const categoryStatusEnum = pgEnum('category_status', ['waiting', 'active', 'first_cycle', 'second_cycle', 'closed']);

// Purge type enum
export const purgeTypeEnum = pgEnum('purge_type', ['projects', 'live_shows', 'articles', 'technical', 'financial']);

// Content report type enum for signalement modules
export const reportTypeEnum = pgEnum('report_type', ['plagiat', 'contenu_offensant', 'desinformation', 'infraction_legale', 'contenu_illicite', 'violation_droits', 'propos_haineux']);

// Content report status enum
export const reportStatusEnum = pgEnum('report_status', ['pending', 'validating', 'confirmed', 'rejected', 'abusive']);

// Content type enum for reports
export const contentTypeEnum = pgEnum('content_type', ['article', 'video', 'social_post', 'comment']);

// Emotional filters enum for content
export const emotionTypeEnum = pgEnum('emotion_type', ['joie', 'tristesse', 'colère', 'peur', 'surprise', 'dégoût', 'confiance', 'anticipation']);

// Referral status enum
export const referralStatusEnum = pgEnum('referral_status', ['pending', 'completed', 'expired']);

// Visitor activity type enum for tracking
export const activityTypeEnum = pgEnum('activity_type', ['page_view', 'project_view', 'investment', 'social_interaction', 'login']);

// Article type enum for Infoporteurs
export const articleTypeEnum = pgEnum('article_type', ['news', 'analysis', 'tutorial', 'opinion', 'review']);

// Audit action enum for tracking administrative operations
export const auditActionEnum = pgEnum('audit_action', [
  'purge_manual', 'purge_scheduled', 'purge_projects', 'purge_live_shows', 'purge_articles', 
  'purge_technical', 'purge_financial', 'admin_access', 'user_role_change', 'project_status_change',
  'compliance_report', 'video_moderation', 'financial_operation', 'security_alert',
  'receipts_viewed', 'receipt_generated', 'receipt_downloaded', 'bulk_receipts_generated', 'auto_receipt_generated',
  'category_created', 'category_updated', 'cycle_started', 'cycle_extended', 'category_closed', 'threshold_check',
  'threshold_check_skipped', 'threshold_check_error', 'unauthorized_admin_access_attempt', 
  'withdrawal_request_created', 'withdrawal_processed',
  'content_reported', 'report_validated', 'report_rejected', 'visupoints_awarded'
]);

// Stripe transfer status enum for idempotent financial operations
export const stripeTransferStatusEnum = pgEnum('stripe_transfer_status', [
  'scheduled', 'pending', 'processing', 'completed', 'failed', 'cancelled'
]);

// Renewal status enum for project renewal system (25€)
export const renewalStatusEnum = pgEnum('renewal_status', ['pending', 'paid', 'active', 'expired', 'cancelled']);

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  profileType: profileTypeEnum("profile_type").default('investor'),
  kycVerified: boolean("kyc_verified").default(false),
  kycDocuments: jsonb("kyc_documents"),
  balanceEUR: decimal("balance_eur", { precision: 10, scale: 2 }).default('10000.00'), // Simulation mode starts with €10,000
  simulationMode: boolean("simulation_mode").default(true),
  cautionEUR: decimal("caution_eur", { precision: 10, scale: 2 }).default('0.00'),
  totalInvested: decimal("total_invested", { precision: 10, scale: 2 }).default('0.00'),
  totalGains: decimal("total_gains", { precision: 10, scale: 2 }).default('0.00'),
  rankGlobal: integer("rank_global"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Projects table
export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  creatorId: varchar("creator_id").notNull().references(() => users.id),
  targetAmount: decimal("target_amount", { precision: 10, scale: 2 }).notNull(),
  unitPriceEUR: decimal("unit_price_eur", { precision: 10, scale: 2 }).notNull().default('5.00'), // Prix unitaire (2,3,4,5,10€)
  currentAmount: decimal("current_amount", { precision: 10, scale: 2 }).default('0.00'),
  status: projectStatusEnum("status").default('pending'),
  videoUrl: varchar("video_url"),
  thumbnailUrl: varchar("thumbnail_url"),
  mlScore: decimal("ml_score", { precision: 3, scale: 1 }), // 0.0 to 10.0
  roiEstimated: decimal("roi_estimated", { precision: 5, scale: 2 }).default('0.00'),
  roiActual: decimal("roi_actual", { precision: 5, scale: 2 }),
  investorCount: integer("investor_count").default(0),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Investments table
export const investments = pgTable("investments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  projectId: varchar("project_id").notNull().references(() => projects.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  visuPoints: integer("visu_points").notNull(), // 100 VP = 1 EUR
  currentValue: decimal("current_value", { precision: 10, scale: 2 }).notNull(),
  roi: decimal("roi", { precision: 5, scale: 2 }).default('0.00'),
  createdAt: timestamp("created_at").defaultNow(),
});

// Transactions table for audit trail
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: transactionTypeEnum("type").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  commission: decimal("commission", { precision: 10, scale: 2 }).default('0.00'),
  projectId: varchar("project_id").references(() => projects.id),
  investmentId: varchar("investment_id").references(() => investments.id),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Live shows table
export const liveShows = pgTable("live_shows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  streamUrl: varchar("stream_url"),
  isActive: boolean("is_active").default(false),
  viewerCount: integer("viewer_count").default(0),
  artistA: varchar("artist_a"),
  artistB: varchar("artist_b"),
  investmentA: decimal("investment_a", { precision: 10, scale: 2 }).default('0.00'),
  investmentB: decimal("investment_b", { precision: 10, scale: 2 }).default('0.00'),
  createdAt: timestamp("created_at").defaultNow(),
});

// Compliance reports table
export const complianceReports = pgTable("compliance_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reportType: varchar("report_type", { length: 100 }).notNull(),
  period: varchar("period", { length: 50 }).notNull(),
  data: jsonb("data").notNull(),
  generatedBy: varchar("generated_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications table for real-time project performance alerts
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  projectId: varchar("project_id").references(() => projects.id),
  type: notificationTypeEnum("type").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  priority: notificationPriorityEnum("priority").default('medium'),
  isRead: boolean("is_read").default(false),
  data: jsonb("data"), // Additional context data for the notification
  createdAt: timestamp("created_at").defaultNow(),
});

// User notification preferences table
export const notificationPreferences = pgTable("notification_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  notificationType: notificationTypeEnum("notification_type").notNull(),
  enabled: boolean("enabled").default(true),
  emailEnabled: boolean("email_enabled").default(false),
  pushEnabled: boolean("push_enabled").default(true),
  threshold: decimal("threshold", { precision: 10, scale: 2 }), // For percentage-based notifications
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Video deposits table - tracks video uploads with VISUAL pricing system
export const videoDeposits = pgTable("video_deposits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id),
  creatorId: varchar("creator_id").notNull().references(() => users.id),
  videoType: videoTypeEnum("video_type").notNull(), // clip, documentary, film
  originalFilename: varchar("original_filename").notNull(),
  bunnyVideoId: varchar("bunny_video_id").unique(), // Bunny.net video ID
  bunnyLibraryId: varchar("bunny_library_id"), // Bunny.net library ID
  duration: integer("duration"), // Duration in seconds
  fileSize: integer("file_size"), // File size in bytes
  status: videoDepositStatusEnum("status").default('pending_payment'),
  depositFee: decimal("deposit_fee", { precision: 5, scale: 2 }).notNull(), // 2€, 5€, or 10€
  paymentIntentId: varchar("payment_intent_id"), // Stripe payment intent
  protectionLevel: videoProtectionEnum("protection_level").default('token'),
  hlsPlaylistUrl: varchar("hls_playlist_url"),
  thumbnailUrl: varchar("thumbnail_url"),
  processingData: jsonb("processing_data"), // Bunny.net processing info
  paidAt: timestamp("paid_at"), // When payment was confirmed
  rejectionReason: varchar("rejection_reason"), // Reason for rejection if applicable
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Video access tokens table - for secure token-based video access
export const videoTokens = pgTable("video_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  videoDepositId: varchar("video_deposit_id").notNull().references(() => videoDeposits.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  token: varchar("token").notNull().unique(), // Signed token for Bunny.net
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: varchar("ip_address"),
  userAgent: varchar("user_agent"),
  sessionId: varchar("session_id"),
  deviceFingerprint: varchar("device_fingerprint"),
  usageCount: integer("usage_count").default(0),
  maxUsage: integer("max_usage").default(3), // Limit token usage
  isRevoked: boolean("is_revoked").default(false),
  lastAccessedAt: timestamp("last_accessed_at"), // Track last access time
  createdAt: timestamp("created_at").defaultNow(),
});

// Creator quotas table - manages monthly/quarterly video deposit limits
export const creatorQuotas = pgTable("creator_quotas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").notNull().references(() => users.id),
  period: varchar("period", { length: 7 }).notNull(), // "2024-01" format
  clipDeposits: integer("clip_deposits").default(0), // Max 2/month
  documentaryDeposits: integer("documentary_deposits").default(0), // Max 1/month
  filmDeposits: integer("film_deposits").default(0), // Max 1/quarter
  totalSpentEUR: decimal("total_spent_eur", { precision: 10, scale: 2 }).default('0.00'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Video analytics table - track views, performance for better ROI calculation
export const videoAnalytics = pgTable("video_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  videoDepositId: varchar("video_deposit_id").notNull().references(() => videoDeposits.id),
  userId: varchar("user_id").references(() => users.id), // Null for anonymous views
  viewDate: timestamp("view_date").defaultNow(),
  watchDuration: integer("watch_duration"), // Seconds watched
  completionRate: decimal("completion_rate", { precision: 5, scale: 2 }), // % watched
  deviceType: varchar("device_type"), // mobile, desktop, tablet
  location: varchar("location"), // Country/region
  referrer: varchar("referrer"),
  ipAddress: varchar("ip_address"),
  sessionId: varchar("session_id"),
  userAgent: varchar("user_agent"), // Browser user agent
  tokenId: varchar("token_id"), // Reference to video token used
  sessionDuration: integer("session_duration"), // Total session duration in seconds
});

// Social posts table - Mini réseau social VISUAL
export const socialPosts = pgTable("social_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  authorId: varchar("author_id").notNull().references(() => users.id),
  projectId: varchar("project_id").references(() => projects.id), // Optional project link
  type: postTypeEnum("type").notNull(),
  status: postStatusEnum("status").default('published'),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  mediaUrls: text("media_urls").array(), // Array of media URLs
  tags: varchar("tags").array(), // Array of tags
  likesCount: integer("likes_count").default(0),
  commentsCount: integer("comments_count").default(0),
  visuPointsEarned: integer("visu_points_earned").default(0), // Rewards for interactions
  isModerated: boolean("is_moderated").default(false),
  moderationReason: varchar("moderation_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Social comments table
export const socialComments = pgTable("social_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").notNull().references(() => socialPosts.id),
  parentId: varchar("parent_id"), // For replies - self-reference handled in relations
  authorId: varchar("author_id").notNull().references(() => users.id),
  type: commentTypeEnum("type").default('comment'),
  content: text("content").notNull(),
  likesCount: integer("likes_count").default(0),
  visuPointsEarned: integer("visu_points_earned").default(0),
  isModerated: boolean("is_moderated").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Social likes table
export const socialLikes = pgTable("social_likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  postId: varchar("post_id").references(() => socialPosts.id),
  commentId: varchar("comment_id").references(() => socialComments.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  // Prevent duplicate likes on posts
  unique("unique_user_post_like").on(table.userId, table.postId),
  // Prevent duplicate likes on comments  
  unique("unique_user_comment_like").on(table.userId, table.commentId),
]);

// VISUPoints transactions table
export const visuPointsTransactions = pgTable("visu_points_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(), // Can be positive (earned) or negative (spent)
  reason: varchar("reason").notNull(), // 'post_like', 'comment_helpful', 'investment', etc.
  referenceId: varchar("reference_id"), // ID of the post/comment/project that earned points
  referenceType: varchar("reference_type"), // 'post', 'comment', 'project', etc.
  idempotencyKey: varchar("idempotency_key").unique(), // For preventing duplicate awards
  createdAt: timestamp("created_at").defaultNow(),
});

// Payment receipts table
export const paymentReceipts = pgTable("payment_receipts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  transactionId: varchar("transaction_id").references(() => transactions.id),
  type: receiptTypeEnum("type").notNull(),
  format: receiptFormatEnum("format").default('pdf'),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default('EUR'),
  description: varchar("description").notNull(),
  content: text("content"), // PDF/TXT content for receipts
  metadata: jsonb("metadata"), // Additional receipt metadata
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  receiptNumber: varchar("receipt_number").unique().notNull(), // Sequential receipt number
  filePath: varchar("file_path"), // Path to generated PDF/TXT file
  downloadCount: integer("download_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Video categories table - Rules for category activation and cycles
export const videoCategories = pgTable("video_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).unique().notNull(),
  displayName: varchar("display_name").notNull(),
  description: text("description"),
  status: categoryStatusEnum("status").default('waiting'),
  currentVideoCount: integer("current_video_count").default(0),
  targetVideoCount: integer("target_video_count").default(30), // 30 to activate, 100 max
  maxVideoCount: integer("max_video_count").default(100),
  cycleStartedAt: timestamp("cycle_started_at"), // When 168h cycle started
  cycleEndsAt: timestamp("cycle_ends_at"), // When current cycle ends
  currentCycle: integer("current_cycle").default(0), // 0, 1, or 2
  isActive: boolean("is_active").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Project extensions table - For cycle of life, prolongation, TOP 10
export const projectExtensions = pgTable("project_extensions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id),
  isInTopTen: boolean("is_in_top_ten").default(false),
  topTenRank: integer("top_ten_rank"), // 1-10 for TOP 10 projects
  cycleEndsAt: timestamp("cycle_ends_at"), // 168 hours from activation
  prolongationCount: integer("prolongation_count").default(0), // How many times prolonged
  prolongationPaidEUR: decimal("prolongation_paid_eur", { precision: 10, scale: 2 }).default('0.00'),
  isArchived: boolean("is_archived").default(false),
  archivedAt: timestamp("archived_at"),
  archiveReason: varchar("archive_reason"), // 'out_of_top_ten', 'cycle_ended', 'manual'
  canProlong: boolean("can_prolong").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Purge jobs table - Automatic cleanup system
export const purgeJobs = pgTable("purge_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: purgeTypeEnum("type").notNull(),
  status: varchar("status").default('pending'), // pending, running, completed, failed
  targetDate: timestamp("target_date"), // When to run this purge
  criteria: jsonb("criteria"), // Rules for what to purge
  itemsProcessed: integer("items_processed").default(0),
  itemsPurged: integer("items_purged").default(0),
  errorMessage: text("error_message"),
  executedAt: timestamp("executed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ===== AUDIT SYSTEM: SECURITY & COMPLIANCE LOGGING =====
// TABLE: audit_logs - Persistent audit trail for administrative operations  
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  action: auditActionEnum("action").notNull(),
  resourceType: varchar("resource_type"), // 'project', 'user', 'live_show', 'post', etc.
  resourceId: varchar("resource_id"), // ID of the affected resource
  details: jsonb("details"), // Detailed information about the action
  ipAddress: varchar("ip_address"),
  userAgent: varchar("user_agent"),
  success: boolean("success").default(true),
  errorMessage: text("error_message"),
  dryRun: boolean("dry_run").default(false),
  affectedCount: integer("affected_count").default(0), // Number of items affected
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_audit_logs_user_id").on(table.userId),
  index("idx_audit_logs_action").on(table.action),
  index("idx_audit_logs_created_at").on(table.createdAt),
]);

// Content reports table - System de signalement communautaire
export const contentReports = pgTable("content_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reporterId: varchar("reporter_id").notNull().references(() => users.id),
  contentType: contentTypeEnum("content_type").notNull(),
  contentId: varchar("content_id").notNull(), // ID of reported content
  reportType: reportTypeEnum("report_type").notNull(),
  status: reportStatusEnum("status").default('pending'),
  description: text("description"), // Optional details from reporter
  adminNotes: text("admin_notes"), // Admin validation notes
  validatedBy: varchar("validated_by").references(() => users.id), // Admin who validated
  validatedAt: timestamp("validated_at"),
  rewardAwarded: boolean("reward_awarded").default(false),
  awardPosition: integer("award_position"), // Position in reward queue (1-5 for articles, 1-10 for videos)
  visuPointsAwarded: integer("visu_points_awarded").default(0),
  ipAddress: varchar("ip_address"),
  userAgent: varchar("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_content_reports_reporter").on(table.reporterId),
  index("idx_content_reports_content").on(table.contentType, table.contentId),
  index("idx_content_reports_status").on(table.status),
  index("idx_content_reports_created").on(table.createdAt),
  unique("unique_report_per_content").on(table.reporterId, table.contentType, table.contentId), // One report per user per content
]);

// Withdrawal requests table - Seuils minimaux de retrait
export const withdrawalRequests = pgTable("withdrawal_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  minimumThreshold: decimal("minimum_threshold", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status").default('pending'), // pending, processing, completed, failed
  stripeConnectTransferId: varchar("stripe_connect_transfer_id"),
  requestedAt: timestamp("requested_at").defaultNow(),
  processedAt: timestamp("processed_at"),
  failureReason: varchar("failure_reason"),
});

// ===== NOUVELLES TABLES POUR FONCTIONNALITÉS AVANCÉES =====

// Referral system table - Système de parrainage
export const referrals = pgTable("referrals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sponsorId: varchar("sponsor_id").notNull().references(() => users.id), // Le parrain
  refereeId: varchar("referee_id").references(() => users.id), // Le filleul (null avant inscription)
  referralCode: varchar("referral_code").unique().notNull(), // Code unique du parrain
  referralLink: varchar("referral_link").unique().notNull(), // Lien unique généré
  status: referralStatusEnum("status").default('pending'),
  sponsorBonusVP: integer("sponsor_bonus_vp").default(100), // Bonus parrain (100 VP = 1€)
  refereeBonusVP: integer("referee_bonus_vp").default(50), // Bonus filleul (50 VP = 0.50€)
  firstActionAt: timestamp("first_action_at"), // Première action du filleul
  bonusAwardedAt: timestamp("bonus_awarded_at"),
  expiresAt: timestamp("expires_at"), // Expiration du lien
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_referrals_sponsor").on(table.sponsorId),
  index("idx_referrals_code").on(table.referralCode),
  unique("unique_referral_code").on(table.referralCode),
]);

// Monthly referral limits table
export const referralLimits = pgTable("referral_limits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  monthYear: varchar("month_year", { length: 7 }).notNull(), // "2025-09" format
  successfulReferrals: integer("successful_referrals").default(0),
  maxReferrals: integer("max_referrals").default(20), // Limite de 20/mois
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  unique("unique_user_month_limit").on(table.userId, table.monthYear),
]);

// Daily login streaks table - Gamification
export const loginStreaks = pgTable("login_streaks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  currentStreak: integer("current_streak").default(0),
  longestStreak: integer("longest_streak").default(0),
  lastLoginDate: timestamp("last_login_date"),
  streakStartDate: timestamp("streak_start_date"),
  totalLogins: integer("total_logins").default(0),
  visuPointsEarned: integer("visu_points_earned").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  unique("unique_user_streak").on(table.userId),
]);

// Visitor activity tracking table
export const visitorActivities = pgTable("visitor_activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id), // null for anonymous
  sessionId: varchar("session_id").notNull(),
  activityType: activityTypeEnum("activity_type").notNull(),
  pageUrl: varchar("page_url"),
  referenceId: varchar("reference_id"), // ID du projet/article visité
  referenceType: varchar("reference_type"), // 'project', 'article', 'social_post'
  duration: integer("duration"), // Durée en secondes
  ipAddress: varchar("ip_address"),
  userAgent: varchar("user_agent"),
  deviceType: varchar("device_type"), // mobile, desktop, tablet
  location: varchar("location"), // Pays/région
  visuPointsEarned: integer("visu_points_earned").default(0),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_visitor_activities_user").on(table.userId),
  index("idx_visitor_activities_session").on(table.sessionId),
  index("idx_visitor_activities_created").on(table.createdAt),
]);

// Visitor of the month tracking
export const visitorsOfMonth = pgTable("visitors_of_month", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  monthYear: varchar("month_year", { length: 7 }).notNull(), // "2025-09" format
  activityScore: integer("activity_score").default(0), // Score d'activité calculé
  totalActivities: integer("total_activities").default(0),
  totalDuration: integer("total_duration").default(0), // En secondes
  rank: integer("rank"), // Position dans le classement
  isWinner: boolean("is_winner").default(false),
  visuPointsReward: integer("visu_points_reward").default(0), // 2500 VP (25€) pour le gagnant
  rewardAwardedAt: timestamp("reward_awarded_at"),
  upgradeProposed: boolean("upgrade_proposed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_visitors_month_user").on(table.userId),
  index("idx_visitors_month_period").on(table.monthYear),
  index("idx_visitors_month_rank").on(table.rank),
  unique("unique_user_month_visitor").on(table.userId, table.monthYear),
]);

// Articles table pour les Infoporteurs
export const articles = pgTable("articles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  excerpt: varchar("excerpt", { length: 500 }), // Résumé
  category: varchar("category", { length: 100 }).notNull(),
  type: articleTypeEnum("type").notNull(),
  authorId: varchar("author_id").notNull().references(() => users.id),
  unitPriceEUR: decimal("unit_price_eur", { precision: 5, scale: 2 }).notNull(), // 0, 0.2-5€
  targetAmount: decimal("target_amount", { precision: 10, scale: 2 }).notNull(),
  currentAmount: decimal("current_amount", { precision: 10, scale: 2 }).default('0.00'),
  status: projectStatusEnum("status").default('pending'),
  thumbnailUrl: varchar("thumbnail_url"),
  readCount: integer("read_count").default(0),
  avgRating: decimal("avg_rating", { precision: 3, scale: 2 }).default('0.00'),
  ratingCount: integer("rating_count").default(0),
  emotionalTags: emotionTypeEnum().array(), // Filtres émotionnels
  investorCount: integer("investor_count").default(0),
  visuPointsEarned: integer("visu_points_earned").default(0),
  endDate: timestamp("end_date"),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_articles_author").on(table.authorId),
  index("idx_articles_status").on(table.status),
  index("idx_articles_category").on(table.category),
  index("idx_articles_created").on(table.createdAt),
]);

// Article investments table pour les Investi-lecteurs
export const articleInvestments = pgTable("article_investments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  articleId: varchar("article_id").notNull().references(() => articles.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  visuPoints: integer("visu_points").notNull(), // 100 VP = 1 EUR
  currentValue: decimal("current_value", { precision: 10, scale: 2 }).notNull(),
  roi: decimal("roi", { precision: 5, scale: 2 }).default('0.00'),
  rating: integer("rating"), // Note 1-5 étoiles
  hasRead: boolean("has_read").default(false),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_article_investments_user").on(table.userId),
  index("idx_article_investments_article").on(table.articleId),
  unique("unique_user_article_investment").on(table.userId, table.articleId),
]);

// VISUpoints packs table for Investi-lecteurs
export const visuPointsPacks = pgTable("visu_points_packs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  pointsAmount: integer("points_amount").notNull(), // Nombre de points
  priceEUR: decimal("price_eur", { precision: 5, scale: 2 }).notNull(), // Prix en euros
  bonusPoints: integer("bonus_points").default(0), // Points bonus
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// VISUpoints pack purchases
export const visuPointsPurchases = pgTable("visu_points_purchases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  packId: varchar("pack_id").notNull().references(() => visuPointsPacks.id),
  pointsPurchased: integer("points_purchased").notNull(),
  bonusPointsReceived: integer("bonus_points_received").default(0),
  totalPointsReceived: integer("total_points_received").notNull(),
  paidAmount: decimal("paid_amount", { precision: 5, scale: 2 }).notNull(),
  paymentIntentId: varchar("payment_intent_id"),
  stripeSessionId: varchar("stripe_session_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ===== NOUVELLES TABLES POUR TOP10 INFOPORTEURS/INVESTILECTEURS =====

// Article sales tracking per day for TOP10 ranking
export const articleSalesDaily = pgTable("article_sales_daily", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  infoporteurId: varchar("infoporteur_id").notNull().references(() => users.id),
  articleId: varchar("article_id").notNull().references(() => articles.id),
  salesDate: timestamp("sales_date").notNull(), // Date de la vente (jour complet)
  totalSalesEUR: decimal("total_sales_eur", { precision: 10, scale: 2 }).default('0.00'),
  salesCount: integer("sales_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_article_sales_infoporteur").on(table.infoporteurId),
  index("idx_article_sales_date").on(table.salesDate),
  unique("unique_article_sales_day").on(table.articleId, table.salesDate),
]);

// Daily TOP10 Infoporteurs ranking
export const top10Infoporteurs = pgTable("top10_infoporteurs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  rankingDate: timestamp("ranking_date").notNull(), // Date du classement (00:00:00)
  infoporteurId: varchar("infoporteur_id").notNull().references(() => users.id),
  rank: integer("rank").notNull(), // Position 1-10
  totalSalesEUR: decimal("total_sales_eur", { precision: 10, scale: 2 }).notNull(),
  totalArticlesSold: integer("total_articles_sold").notNull(),
  redistributionShareEUR: decimal("redistribution_share_eur", { precision: 10, scale: 2 }).default('0.00'),
  redistributionPaid: boolean("redistribution_paid").default(false),
  redistributionPaidAt: timestamp("redistribution_paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_top10_infoporteurs_date").on(table.rankingDate),
  index("idx_top10_infoporteurs_rank").on(table.rank),
  unique("unique_top10_ranking_day").on(table.rankingDate, table.infoporteurId),
]);

// Investi-lecteurs winners (who bought TOP10 articles)
export const top10Winners = pgTable("top10_winners", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  rankingDate: timestamp("ranking_date").notNull(),
  investilecteurId: varchar("investilecteur_id").notNull().references(() => users.id),
  top10ArticlesBought: integer("top10_articles_bought").notNull(), // Nombre d'articles TOP10 achetés
  totalInvestedEUR: decimal("total_invested_eur", { precision: 10, scale: 2 }).notNull(),
  redistributionShareEUR: decimal("redistribution_share_eur", { precision: 10, scale: 2 }).default('0.00'),
  redistributionPaid: boolean("redistribution_paid").default(false),
  redistributionPaidAt: timestamp("redistribution_paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_top10_winners_date").on(table.rankingDate),
  index("idx_top10_winners_user").on(table.investilecteurId),
  unique("unique_top10_winner_day").on(table.rankingDate, table.investilecteurId),
]);

// TOP10 redistribution pool tracking
export const top10Redistributions = pgTable("top10_redistributions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  redistributionDate: timestamp("redistribution_date").notNull(),
  totalPoolEUR: decimal("total_pool_eur", { precision: 10, scale: 2 }).notNull(), // Pot commun des rangs 11-100
  infoporteursCount: integer("infoporteurs_count").notNull(), // Nombre d'infoporteurs TOP10 (max 10)
  winnersCount: integer("winners_count").notNull(), // Nombre d'investi-lecteurs vainqueurs
  poolDistributed: boolean("pool_distributed").default(false),
  distributionCompletedAt: timestamp("distribution_completed_at"),
  metadata: jsonb("metadata"), // Détails de la redistribution
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_top10_redistributions_date").on(table.redistributionDate),
  unique("unique_redistribution_day").on(table.redistributionDate),
]);

// ===== AMÉLIORATION SYSTÈME FIDÉLITÉ VISUPOINTS =====

// Weekly login streaks table
export const weeklyStreaks = pgTable("weekly_streaks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  currentWeeklyStreak: integer("current_weekly_streak").default(0), // Semaines consécutives
  longestWeeklyStreak: integer("longest_weekly_streak").default(0),
  lastWeekDate: varchar("last_week_date", { length: 10 }), // "2025-W37" format
  weeklyStreakStartDate: varchar("weekly_streak_start_date", { length: 10 }),
  totalWeeksLogged: integer("total_weeks_logged").default(0),
  visuPointsEarned: integer("visu_points_earned").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  unique("unique_user_weekly_streak").on(table.userId),
  index("idx_weekly_streaks_user").on(table.userId),
]);

// ===== TABLE IDEMPOTENCE STRIPE TRANSFERS =====

// Stripe transfers table for idempotent financial operations
export const stripeTransfers = pgTable("stripe_transfers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Clé d'idempotence UNIQUE - empêche double-transfert
  idempotencyKey: varchar("idempotency_key", { length: 255 }).notNull().unique(),
  
  // Statut du transfert Stripe
  status: stripeTransferStatusEnum("status").default('scheduled'),
  
  // Montant en centimes (arithmétique exacte)
  amountCents: integer("amount_cents").notNull(),
  amountEUR: decimal("amount_eur", { precision: 10, scale: 2 }).notNull(),
  
  // Informations destinataire
  userId: varchar("user_id").notNull().references(() => users.id),
  userStripeAccountId: varchar("user_stripe_account_id"),
  
  // Référence à l'entité source (top10_redistribution, visupoints_conversion, etc.)
  referenceType: varchar("reference_type", { length: 50 }).notNull(), // 'top10_infoporteur', 'top10_winner', 'visupoints_conversion'
  referenceId: varchar("reference_id").notNull(), // ID de l'entité source
  
  // IDs Stripe après traitement
  stripeTransferId: varchar("stripe_transfer_id"), // ID retourné par Stripe
  stripeDestinationPaymentId: varchar("stripe_destination_payment_id"), // Payment ID chez le destinataire
  
  // Planification 24h
  scheduledProcessingAt: timestamp("scheduled_processing_at").notNull(), // Quand traiter le transfert
  processedAt: timestamp("processed_at"), // Quand effectivement traité
  
  // Détails d'erreur si échec
  failureReason: text("failure_reason"),
  retryCount: integer("retry_count").default(0),
  nextRetryAt: timestamp("next_retry_at"),
  
  // Métadonnées pour debug et audit
  transferDescription: varchar("transfer_description", { length: 255 }),
  metadata: jsonb("metadata"), // Données supplémentaires (montants originaux, calculs, etc.)
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  // Index pour requêtes fréquentes
  index("idx_stripe_transfers_status").on(table.status),
  index("idx_stripe_transfers_user").on(table.userId),
  index("idx_stripe_transfers_reference").on(table.referenceType, table.referenceId),
  index("idx_stripe_transfers_scheduled").on(table.scheduledProcessingAt),
  index("idx_stripe_transfers_processing").on(table.status, table.scheduledProcessingAt),
  
  // Contraintes uniques pour sécurité
  unique("unique_idempotency_key").on(table.idempotencyKey),
  unique("unique_reference_transfer").on(table.referenceType, table.referenceId), // Une seule tentative par référence
]);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  investments: many(investments),
  transactions: many(transactions),
  complianceReports: many(complianceReports),
  notifications: many(notifications),
  notificationPreferences: many(notificationPreferences),
  socialPosts: many(socialPosts),
  socialComments: many(socialComments),
  socialLikes: many(socialLikes),
  visuPointsTransactions: many(visuPointsTransactions),
  paymentReceipts: many(paymentReceipts),
  withdrawalRequests: many(withdrawalRequests),
  auditLogs: many(auditLogs),
  contentReports: many(contentReports),
  // Nouvelles relations pour fonctionnalités avancées
  referralsAsSponsor: many(referrals, { relationName: "sponsor" }),
  referralsAsReferee: many(referrals, { relationName: "referee" }),
  referralLimits: many(referralLimits),
  loginStreak: many(loginStreaks),
  visitorActivities: many(visitorActivities),
  visitorsOfMonth: many(visitorsOfMonth),
  articles: many(articles),
  articleInvestments: many(articleInvestments),
  visuPointsPurchases: many(visuPointsPurchases),
  // Nouvelles relations pour TOP10 et fidélité
  articleSalesDaily: many(articleSalesDaily),
  top10Infoporteurs: many(top10Infoporteurs),
  top10Winners: many(top10Winners),
  weeklyStreaks: many(weeklyStreaks),
  // Relations pour transferts Stripe idempotents
  stripeTransfers: many(stripeTransfers),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  creator: one(users, {
    fields: [projects.creatorId],
    references: [users.id],
  }),
  investments: many(investments),
  notifications: many(notifications),
  socialPosts: many(socialPosts),
  extensions: many(projectExtensions),
}));

export const investmentsRelations = relations(investments, ({ one }) => ({
  user: one(users, {
    fields: [investments.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [investments.projectId],
    references: [projects.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [transactions.projectId],
    references: [projects.id],
  }),
  investment: one(investments, {
    fields: [transactions.investmentId],
    references: [investments.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [notifications.projectId],
    references: [projects.id],
  }),
}));

export const notificationPreferencesRelations = relations(notificationPreferences, ({ one }) => ({
  user: one(users, {
    fields: [notificationPreferences.userId],
    references: [users.id],
  }),
}));

export const videoDepositsRelations = relations(videoDeposits, ({ one, many }) => ({
  project: one(projects, {
    fields: [videoDeposits.projectId],
    references: [projects.id],
  }),
  creator: one(users, {
    fields: [videoDeposits.creatorId],
    references: [users.id],
  }),
  tokens: many(videoTokens),
  analytics: many(videoAnalytics),
}));

export const videoTokensRelations = relations(videoTokens, ({ one }) => ({
  videoDeposit: one(videoDeposits, {
    fields: [videoTokens.videoDepositId],
    references: [videoDeposits.id],
  }),
  user: one(users, {
    fields: [videoTokens.userId],
    references: [users.id],
  }),
}));

export const creatorQuotasRelations = relations(creatorQuotas, ({ one }) => ({
  creator: one(users, {
    fields: [creatorQuotas.creatorId],
    references: [users.id],
  }),
}));

export const videoAnalyticsRelations = relations(videoAnalytics, ({ one }) => ({
  videoDeposit: one(videoDeposits, {
    fields: [videoAnalytics.videoDepositId],
    references: [videoDeposits.id],
  }),
  user: one(users, {
    fields: [videoAnalytics.userId],
    references: [users.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

// New relations for social features
export const socialPostsRelations = relations(socialPosts, ({ one, many }) => ({
  author: one(users, {
    fields: [socialPosts.authorId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [socialPosts.projectId],
    references: [projects.id],
  }),
  comments: many(socialComments),
  likes: many(socialLikes),
}));

export const socialCommentsRelations = relations(socialComments, ({ one, many }) => ({
  post: one(socialPosts, {
    fields: [socialComments.postId],
    references: [socialPosts.id],
  }),
  author: one(users, {
    fields: [socialComments.authorId],
    references: [users.id],
  }),
  parent: one(socialComments, {
    fields: [socialComments.parentId],
    references: [socialComments.id],
    relationName: "parentComment",
  }),
  replies: many(socialComments, {
    relationName: "parentComment",
  }),
  likes: many(socialLikes),
}));

export const socialLikesRelations = relations(socialLikes, ({ one }) => ({
  user: one(users, {
    fields: [socialLikes.userId],
    references: [users.id],
  }),
  post: one(socialPosts, {
    fields: [socialLikes.postId],
    references: [socialPosts.id],
  }),
  comment: one(socialComments, {
    fields: [socialLikes.commentId],
    references: [socialComments.id],
  }),
}));

export const visuPointsTransactionsRelations = relations(visuPointsTransactions, ({ one }) => ({
  user: one(users, {
    fields: [visuPointsTransactions.userId],
    references: [users.id],
  }),
}));

export const paymentReceiptsRelations = relations(paymentReceipts, ({ one }) => ({
  user: one(users, {
    fields: [paymentReceipts.userId],
    references: [users.id],
  }),
  transaction: one(transactions, {
    fields: [paymentReceipts.transactionId],
    references: [transactions.id],
  }),
}));

export const projectExtensionsRelations = relations(projectExtensions, ({ one }) => ({
  project: one(projects, {
    fields: [projectExtensions.projectId],
    references: [projects.id],
  }),
}));

export const withdrawalRequestsRelations = relations(withdrawalRequests, ({ one }) => ({
  user: one(users, {
    fields: [withdrawalRequests.userId],
    references: [users.id],
  }),
}));

// ===== NOUVELLES RELATIONS POUR FONCTIONNALITÉS AVANCÉES =====

export const referralsRelations = relations(referrals, ({ one }) => ({
  sponsor: one(users, {
    fields: [referrals.sponsorId],
    references: [users.id],
    relationName: "sponsor",
  }),
  referee: one(users, {
    fields: [referrals.refereeId],
    references: [users.id],
    relationName: "referee",
  }),
}));

export const referralLimitsRelations = relations(referralLimits, ({ one }) => ({
  user: one(users, {
    fields: [referralLimits.userId],
    references: [users.id],
  }),
}));

export const loginStreaksRelations = relations(loginStreaks, ({ one }) => ({
  user: one(users, {
    fields: [loginStreaks.userId],
    references: [users.id],
  }),
}));

export const visitorActivitiesRelations = relations(visitorActivities, ({ one }) => ({
  user: one(users, {
    fields: [visitorActivities.userId],
    references: [users.id],
  }),
}));

export const visitorsOfMonthRelations = relations(visitorsOfMonth, ({ one }) => ({
  user: one(users, {
    fields: [visitorsOfMonth.userId],
    references: [users.id],
  }),
}));

export const articlesRelations = relations(articles, ({ one, many }) => ({
  author: one(users, {
    fields: [articles.authorId],
    references: [users.id],
  }),
  investments: many(articleInvestments),
}));

export const articleInvestmentsRelations = relations(articleInvestments, ({ one }) => ({
  user: one(users, {
    fields: [articleInvestments.userId],
    references: [users.id],
  }),
  article: one(articles, {
    fields: [articleInvestments.articleId],
    references: [articles.id],
  }),
}));

export const visuPointsPacksRelations = relations(visuPointsPacks, ({ many }) => ({
  purchases: many(visuPointsPurchases),
}));

export const visuPointsPurchasesRelations = relations(visuPointsPurchases, ({ one }) => ({
  user: one(users, {
    fields: [visuPointsPurchases.userId],
    references: [users.id],
  }),
  pack: one(visuPointsPacks, {
    fields: [visuPointsPurchases.packId],
    references: [visuPointsPacks.id],
  }),
}));

// Nouvelles relations pour TOP10 et fidélité
export const articleSalesDailyRelations = relations(articleSalesDaily, ({ one }) => ({
  infoporteur: one(users, {
    fields: [articleSalesDaily.infoporteurId],
    references: [users.id],
  }),
  article: one(articles, {
    fields: [articleSalesDaily.articleId],
    references: [articles.id],
  }),
}));

export const top10InfoporteursRelations = relations(top10Infoporteurs, ({ one }) => ({
  infoporteur: one(users, {
    fields: [top10Infoporteurs.infoporteurId],
    references: [users.id],
  }),
}));

export const top10WinnersRelations = relations(top10Winners, ({ one }) => ({
  investilecteur: one(users, {
    fields: [top10Winners.investilecteurId],
    references: [users.id],
  }),
}));

export const weeklyStreaksRelations = relations(weeklyStreaks, ({ one }) => ({
  user: one(users, {
    fields: [weeklyStreaks.userId],
    references: [users.id],
  }),
}));

export const stripeTransfersRelations = relations(stripeTransfers, ({ one }) => ({
  user: one(users, {
    fields: [stripeTransfers.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).refine((data) => {
  // Nouvelles règles de prix 16/09/2025 : prix autorisés pour les porteurs
  const price = parseFloat(data.unitPriceEUR || '5.00');
  return isValidProjectPrice(price);
}, {
  message: "Le prix unitaire du projet doit être l'un des montants autorisés : 2, 3, 4, 5, 10 €",
  path: ["unitPriceEUR"],
});

export const insertInvestmentSchema = createInsertSchema(investments).omit({
  id: true,
  createdAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationPreferenceSchema = createInsertSchema(notificationPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVideoDepositSchema = createInsertSchema(videoDeposits).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVideoTokenSchema = createInsertSchema(videoTokens).omit({
  id: true,
  createdAt: true,
});

export const insertCreatorQuotaSchema = createInsertSchema(creatorQuotas).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVideoAnalyticsSchema = createInsertSchema(videoAnalytics).omit({
  id: true,
});

// New insert schemas for 6 modules
export const insertSocialPostSchema = createInsertSchema(socialPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSocialCommentSchema = createInsertSchema(socialComments).omit({
  id: true,
  createdAt: true,
});

// Secure update schemas - only allow safe fields to be modified
export const updateSocialPostSchema = z.object({
  content: z.string().min(1).max(10000).optional(),
  mediaUrls: z.array(z.string().url()).max(10).optional(),
});

export const updateSocialCommentSchema = z.object({
  content: z.string().min(1).max(2000),
});

export const insertSocialLikeSchema = createInsertSchema(socialLikes).omit({
  id: true,
  createdAt: true,
});

export const insertVisuPointsTransactionSchema = createInsertSchema(visuPointsTransactions).omit({
  id: true,
  createdAt: true,
});

export const insertPaymentReceiptSchema = createInsertSchema(paymentReceipts).omit({
  id: true,
  createdAt: true,
});

export const insertVideoCategorySchema = createInsertSchema(videoCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProjectExtensionSchema = createInsertSchema(projectExtensions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPurgeJobSchema = createInsertSchema(purgeJobs).omit({
  id: true,
  createdAt: true,
});

export const insertWithdrawalRequestSchema = createInsertSchema(withdrawalRequests).omit({
  id: true,
  requestedAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

export const insertContentReportSchema = createInsertSchema(contentReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// ===== NOUVEAUX SCHÉMAS D'INSERTION POUR FONCTIONNALITÉS AVANCÉES =====

export const insertReferralSchema = createInsertSchema(referrals).omit({
  id: true,
  createdAt: true,
});

export const insertReferralLimitSchema = createInsertSchema(referralLimits).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLoginStreakSchema = createInsertSchema(loginStreaks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVisitorActivitySchema = createInsertSchema(visitorActivities).omit({
  id: true,
  createdAt: true,
});

export const insertVisitorOfMonthSchema = createInsertSchema(visitorsOfMonth).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertArticleSchema = createInsertSchema(articles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).refine((data) => {
  // Vérification des prix autorisés pour les articles Infoporteurs
  const price = parseFloat(data.unitPriceEUR);
  return [0, 0.2, 0.5, 1, 2, 3, 4, 5].includes(price);
}, {
  message: "Le prix unitaire de l'article doit être 0€, 0.2€, 0.5€, 1€, 2€, 3€, 4€ ou 5€",
  path: ["unitPriceEUR"],
});

export const insertArticleInvestmentSchema = createInsertSchema(articleInvestments).omit({
  id: true,
  createdAt: true,
});

export const insertVisuPointsPackSchema = createInsertSchema(visuPointsPacks).omit({
  id: true,
  createdAt: true,
});

export const insertVisuPointsPurchaseSchema = createInsertSchema(visuPointsPurchases).omit({
  id: true,
  createdAt: true,
});

// ===== NOUVEAUX SCHÉMAS POUR TOP10 ET FIDÉLITÉ =====

export const insertArticleSalesDailySchema = createInsertSchema(articleSalesDaily).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTop10InfoporteursSchema = createInsertSchema(top10Infoporteurs).omit({
  id: true,
  createdAt: true,
});

export const insertTop10WinnersSchema = createInsertSchema(top10Winners).omit({
  id: true,
  createdAt: true,
});

export const insertTop10RedistributionsSchema = createInsertSchema(top10Redistributions).omit({
  id: true,
  createdAt: true,
});

export const insertWeeklyStreaksSchema = createInsertSchema(weeklyStreaks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStripeTransferSchema = createInsertSchema(stripeTransfers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  processedAt: true, // Géré automatiquement par le système
  retryCount: true,  // Géré automatiquement par le système
});

// ===== SYSTÈME DE RENOUVELLEMENT PAYANT (25€) =====

// Table des renouvellements de projets (25€)
export const projectRenewals = pgTable("project_renewals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: 'cascade' }),
  creatorId: varchar("creator_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  categoryId: varchar("category_id").notNull().references(() => videoCategories.id, { onDelete: 'cascade' }),
  currentRank: integer("current_rank").notNull(), // Rang actuel (11-100)
  renewalCount: integer("renewal_count").notNull().default(0), // Nombre de renouvellements utilisés
  maxRenewals: integer("max_renewals").notNull().default(1), // Maximum 1 renouvellement par porteur
  status: renewalStatusEnum("status").notNull().default('pending'),
  paymentIntentId: varchar("payment_intent_id"), // Stripe PaymentIntent ID
  amountEUR: decimal("amount_eur", { precision: 10, scale: 2 }).notNull().default('25.00'),
  paidAt: timestamp("paid_at"),
  activatedAt: timestamp("activated_at"), // Quand le renouvellement devient actif
  expiresAt: timestamp("expires_at").notNull(), // 15 minutes pour décider
  renewalApproved: boolean("renewal_approved").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
}, (table) => [
  // Contraintes business critiques
  unique("unique_payment_intent").on(table.paymentIntentId), // Éviter doublons Stripe
  // Note: Contrainte unique partielle sera appliquée via code - max 1 renouvellement actif par projet/catégorie
  // Vérifier que le montant est exactement 25€
  sql`CHECK (${table.amountEUR} = 25.00)`,
  // Vérifier que le rang est entre 11 et 100
  sql`CHECK (${table.currentRank} >= 11 AND ${table.currentRank} <= 100)`,
  // Index pour performance
  index("idx_renewals_category_status").on(table.categoryId, table.status),
  index("idx_renewals_creator").on(table.creatorId)
]);

// File d'attente des projets en attente
export const projectQueue = pgTable("project_queue", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: 'cascade' }),
  creatorId: varchar("creator_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  categoryId: varchar("category_id").notNull().references(() => videoCategories.id, { onDelete: 'cascade' }),
  queuePosition: integer("queue_position").notNull(), // Position dans la file
  priority: integer("priority").notNull().default(0), // Priorité (0 = normale)
  status: varchar("status", { length: 20 }).notNull().default('waiting'), // 'waiting', 'ready', 'assigned'
  readyAt: timestamp("ready_at"), // Quand le projet sera prêt (après délai 15min)
  isActive: boolean("is_active").notNull().default(true),
  submittedAt: timestamp("submitted_at").defaultNow(),
  assignedAt: timestamp("assigned_at"), // Quand le projet a été assigné à une place
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
}, (table) => [
  // Contraintes d'unicité critiques
  unique("unique_project_category_queue").on(table.projectId, table.categoryId),
  unique("unique_category_position").on(table.categoryId, table.queuePosition),
  // Index pour performance et contraintes
  index("idx_queue_category_status").on(table.categoryId, table.status),
  index("idx_queue_ready_at").on(table.readyAt),
  index("idx_queue_position").on(table.categoryId, table.queuePosition)
]);

// Historique des remplacements automatiques
export const projectReplacements = pgTable("project_replacements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  categoryId: varchar("category_id").notNull().references(() => videoCategories.id, { onDelete: 'cascade' }),
  replacedProjectId: varchar("replaced_project_id").notNull().references(() => projects.id, { onDelete: 'cascade' }),
  replacedCreatorId: varchar("replaced_creator_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  newProjectId: varchar("new_project_id").references(() => projects.id, { onDelete: 'cascade' }),
  newCreatorId: varchar("new_creator_id").references(() => users.id, { onDelete: 'cascade' }),
  replacedRank: integer("replaced_rank").notNull(), // Rang du projet remplacé (11-100)
  reason: varchar("reason").notNull(), // 'auto_replacement', 'renewal_expired', 'manual'
  idempotencyKey: varchar("idempotency_key"), // Pour éviter doubles remplacements
  replacementDate: timestamp("replacement_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow()
}, (table) => [
  // Contraintes pour éviter doublons et assurer cohérence
  unique("unique_category_rank_replacement").on(table.categoryId, table.replacedRank, table.replacementDate),
  unique("unique_idempotency_replacement").on(table.idempotencyKey),
  // Vérifier que le rang remplacé est entre 11 et 100
  sql`CHECK (${table.replacedRank} >= 11 AND ${table.replacedRank} <= 100)`,
  // Index pour performance
  index("idx_replacements_category").on(table.categoryId, table.replacementDate),
  index("idx_replacements_creator").on(table.replacedCreatorId)
]);

// Schémas d'insertion pour système de renouvellement
export const insertProjectRenewalSchema = createInsertSchema(projectRenewals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProjectQueueSchema = createInsertSchema(projectQueue).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProjectReplacementSchema = createInsertSchema(projectReplacements).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema> & { id?: string };
export type User = typeof users.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Investment = typeof investments.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type LiveShow = typeof liveShows.$inferSelect;
export type ComplianceReport = typeof complianceReports.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type VideoDeposit = typeof videoDeposits.$inferSelect;
export type VideoToken = typeof videoTokens.$inferSelect;
export type CreatorQuota = typeof creatorQuotas.$inferSelect;
export type VideoAnalytics = typeof videoAnalytics.$inferSelect;

// New types for 6 modules
export type SocialPost = typeof socialPosts.$inferSelect;
export type SocialComment = typeof socialComments.$inferSelect;
export type SocialLike = typeof socialLikes.$inferSelect;
export type VisuPointsTransaction = typeof visuPointsTransactions.$inferSelect;
export type PaymentReceipt = typeof paymentReceipts.$inferSelect;
export type VideoCategory = typeof videoCategories.$inferSelect;
export type ProjectExtension = typeof projectExtensions.$inferSelect;
export type PurgeJob = typeof purgeJobs.$inferSelect;
export type WithdrawalRequest = typeof withdrawalRequests.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type ContentReport = typeof contentReports.$inferSelect;

// ===== NOUVEAUX TYPES POUR FONCTIONNALITÉS AVANCÉES =====

export type Referral = typeof referrals.$inferSelect;
export type ReferralLimit = typeof referralLimits.$inferSelect;
export type LoginStreak = typeof loginStreaks.$inferSelect;
export type VisitorActivity = typeof visitorActivities.$inferSelect;
export type VisitorOfMonth = typeof visitorsOfMonth.$inferSelect;
export type Article = typeof articles.$inferSelect;
export type ArticleInvestment = typeof articleInvestments.$inferSelect;
export type VisuPointsPack = typeof visuPointsPacks.$inferSelect;
export type VisuPointsPurchase = typeof visuPointsPurchases.$inferSelect;

// Nouveaux types TOP10 et fidélité
export type ArticleSalesDaily = typeof articleSalesDaily.$inferSelect;
export type Top10Infoporteurs = typeof top10Infoporteurs.$inferSelect;
export type Top10Winners = typeof top10Winners.$inferSelect;
export type Top10Redistributions = typeof top10Redistributions.$inferSelect;
export type WeeklyStreaks = typeof weeklyStreaks.$inferSelect;
export type StripeTransfer = typeof stripeTransfers.$inferSelect;

// Types pour système de renouvellement payant (25€)
export type ProjectRenewal = typeof projectRenewals.$inferSelect;
export type ProjectQueue = typeof projectQueue.$inferSelect;
export type ProjectReplacement = typeof projectReplacements.$inferSelect;

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type InsertInvestment = z.infer<typeof insertInvestmentSchema>;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type InsertNotificationPreference = z.infer<typeof insertNotificationPreferenceSchema>;
export type InsertVideoDeposit = z.infer<typeof insertVideoDepositSchema>;
export type InsertVideoToken = z.infer<typeof insertVideoTokenSchema>;
export type InsertCreatorQuota = z.infer<typeof insertCreatorQuotaSchema>;
export type InsertVideoAnalytics = z.infer<typeof insertVideoAnalyticsSchema>;

// New insert types for 6 modules
export type InsertSocialPost = z.infer<typeof insertSocialPostSchema>;
export type InsertSocialComment = z.infer<typeof insertSocialCommentSchema>;
export type InsertSocialLike = z.infer<typeof insertSocialLikeSchema>;
export type InsertVisuPointsTransaction = z.infer<typeof insertVisuPointsTransactionSchema>;
export type InsertPaymentReceipt = z.infer<typeof insertPaymentReceiptSchema>;
export type InsertVideoCategory = z.infer<typeof insertVideoCategorySchema>;
export type InsertProjectExtension = z.infer<typeof insertProjectExtensionSchema>;
export type InsertPurgeJob = z.infer<typeof insertPurgeJobSchema>;
export type InsertWithdrawalRequest = z.infer<typeof insertWithdrawalRequestSchema>;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type InsertContentReport = z.infer<typeof insertContentReportSchema>;

// ===== NOUVEAUX TYPES D'INSERTION POUR FONCTIONNALITÉS AVANCÉES =====

export type InsertReferral = z.infer<typeof insertReferralSchema>;
export type InsertReferralLimit = z.infer<typeof insertReferralLimitSchema>;
export type InsertLoginStreak = z.infer<typeof insertLoginStreakSchema>;
export type InsertVisitorActivity = z.infer<typeof insertVisitorActivitySchema>;
export type InsertVisitorOfMonth = z.infer<typeof insertVisitorOfMonthSchema>;
export type InsertArticle = z.infer<typeof insertArticleSchema>;
export type InsertArticleInvestment = z.infer<typeof insertArticleInvestmentSchema>;
export type InsertVisuPointsPack = z.infer<typeof insertVisuPointsPackSchema>;
export type InsertVisuPointsPurchase = z.infer<typeof insertVisuPointsPurchaseSchema>;

// Nouveaux types d'insertion TOP10 et transferts Stripe
export type InsertStripeTransfer = z.infer<typeof insertStripeTransferSchema>;

// Types d'insertion pour système de renouvellement payant (25€)
export type InsertProjectRenewal = z.infer<typeof insertProjectRenewalSchema>;
export type InsertProjectQueue = z.infer<typeof insertProjectQueueSchema>;
export type InsertProjectReplacement = z.infer<typeof insertProjectReplacementSchema>;

// ===== SYSTÈME D'AGENTS IA AUTONOMES =====

// Énums pour les agents IA
export const agentTypeEnum = pgEnum("agent_type", ["visualai", "visualfinanceai", "admin"]);
export const decisionStatusEnum = pgEnum("decision_status", ["pending", "approved", "rejected", "auto", "escalated"]);
export const agentAuditActionEnum = pgEnum("agent_audit_action", [
  "decision_made", "payout_executed", "user_blocked", "category_closed", 
  "extension_granted", "points_converted", "policy_updated", "parameters_changed"
]);

// Table des décisions des agents IA
export const agentDecisions = pgTable("agent_decisions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentType: agentTypeEnum("agent_type").notNull(),
  decisionType: varchar("decision_type").notNull(), // 'user_block', 'payout', 'extension', etc.
  subjectId: varchar("subject_id"), // ID du sujet concerné (user, project, category)
  subjectType: varchar("subject_type"), // 'user', 'project', 'category', 'transaction'
  ruleApplied: varchar("rule_applied").notNull(),
  score: decimal("score", { precision: 10, scale: 4 }), // Score de confiance/sévérité
  justification: text("justification").notNull(),
  parameters: jsonb("parameters"), // Paramètres de la décision
  status: decisionStatusEnum("status").notNull().default('pending'),
  adminComment: text("admin_comment"), // Commentaire admin si validé/rejeté
  validatedBy: varchar("validated_by").references(() => users.id, { onDelete: 'set null' }),
  validatedAt: timestamp("validated_at"),
  executedAt: timestamp("executed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
}, (table) => [
  index("idx_decisions_agent_status").on(table.agentType, table.status),
  index("idx_decisions_subject").on(table.subjectType, table.subjectId),
  index("idx_decisions_created").on(table.createdAt)
]);

// Table d'audit immuable avec hash chaîné
export const agentAuditLog = pgTable("agent_audit_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`), // ID standard pour cohérence
  agentType: agentTypeEnum("agent_type").notNull(),
  action: agentAuditActionEnum("action").notNull(),
  subjectId: varchar("subject_id"),
  subjectType: varchar("subject_type"),
  details: jsonb("details").notNull(),
  previousHash: varchar("previous_hash"), // Hash de l'entrée précédente
  currentHash: varchar("current_hash").notNull(), // Hash de cette entrée
  idempotencyKey: varchar("idempotency_key"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  actor: varchar("actor").notNull() // 'visualai', 'visualfinanceai', 'admin:{userId}'
}, (table) => [
  unique("unique_idempotency").on(table.idempotencyKey),
  index("idx_audit_timestamp").on(table.timestamp),
  index("idx_audit_subject").on(table.subjectType, table.subjectId),
  index("idx_audit_agent_action").on(table.agentType, table.action)
]);

// Ledger financier pour toutes les transactions
export const financialLedger = pgTable("financial_ledger", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  transactionType: varchar("transaction_type").notNull(), // 'payout', 'fee', 'conversion', 'extension'
  referenceId: varchar("reference_id").notNull(), // ID de référence (orderId, categoryId, etc)
  referenceType: varchar("reference_type").notNull(), // 'category_close', 'article_sale', 'points_conversion'
  recipientId: varchar("recipient_id"), // User ID bénéficiaire (null pour VISUAL)
  grossAmountCents: integer("gross_amount_cents").notNull(),
  netAmountCents: integer("net_amount_cents").notNull(),
  feeCents: integer("fee_cents").notNull().default(0),
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  stripeTransferId: varchar("stripe_transfer_id"),
  idempotencyKey: varchar("idempotency_key").notNull(),
  payoutRule: varchar("payout_rule"), // Version de la règle appliquée
  signature: varchar("signature"), // Signature cryptographique
  status: varchar("status").notNull().default('pending'), // 'pending', 'completed', 'failed'
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow()
}, (table) => [
  unique("unique_ledger_idempotency").on(table.idempotencyKey),
  index("idx_ledger_reference").on(table.referenceType, table.referenceId),
  index("idx_ledger_recipient").on(table.recipientId),
  index("idx_ledger_status").on(table.status),
  index("idx_ledger_created").on(table.createdAt)
]);

// Recettes de paiement versionnées 
export const payoutRecipes = pgTable("payout_recipes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  version: varchar("version").notNull(), // 'cat_close_40_30_7_23_v1'
  ruleType: varchar("rule_type").notNull(), // 'category_close', 'article_sale', 'pot24h', 'points'
  formula: jsonb("formula").notNull(), // Formule complète en JSON
  description: text("description").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: varchar("created_by").notNull(), // 'visualfinanceai' ou 'admin:{userId}'
  createdAt: timestamp("created_at").defaultNow(),
  activatedAt: timestamp("activated_at")
}, (table) => [
  unique("unique_recipe_version").on(table.version),
  index("idx_recipes_type_active").on(table.ruleType, table.isActive)
]);

// Paramètres runtime des agents
export const agentParameters = pgTable("agent_parameters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  parameterKey: varchar("parameter_key").notNull(),
  parameterValue: varchar("parameter_value").notNull(),
  parameterType: varchar("parameter_type").notNull(), // 'number', 'string', 'boolean', 'json'
  description: text("description").notNull(),
  modifiableByAdmin: boolean("modifiable_by_admin").notNull().default(true),
  lastModifiedBy: varchar("last_modified_by"),
  lastModifiedAt: timestamp("last_modified_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow()
}, (table) => [
  unique("unique_parameter_key").on(table.parameterKey),
  index("idx_parameters_modifiable").on(table.modifiableByAdmin)
]);

// Schémas d'insertion pour système d'agents IA
export const insertAgentDecisionSchema = createInsertSchema(agentDecisions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertAgentAuditLogSchema = createInsertSchema(agentAuditLog).omit({
  id: true,
  timestamp: true
});

export const insertFinancialLedgerSchema = createInsertSchema(financialLedger).omit({
  id: true,
  createdAt: true
});

export const insertPayoutRecipeSchema = createInsertSchema(payoutRecipes).omit({
  id: true,
  createdAt: true
});

export const insertAgentParameterSchema = createInsertSchema(agentParameters).omit({
  id: true,
  createdAt: true,
  lastModifiedAt: true
});

// Types d'insertion et de sélection pour agents IA
export type InsertAgentDecision = z.infer<typeof insertAgentDecisionSchema>;
export type AgentDecision = typeof agentDecisions.$inferSelect;

export type InsertAgentAuditLog = z.infer<typeof insertAgentAuditLogSchema>;
export type AgentAuditLog = typeof agentAuditLog.$inferSelect;

export type InsertFinancialLedger = z.infer<typeof insertFinancialLedgerSchema>;
export type FinancialLedger = typeof financialLedger.$inferSelect;

export type InsertPayoutRecipe = z.infer<typeof insertPayoutRecipeSchema>;
export type PayoutRecipe = typeof payoutRecipes.$inferSelect;

export type InsertAgentParameter = z.infer<typeof insertAgentParameterSchema>;
export type AgentParameter = typeof agentParameters.$inferSelect;
