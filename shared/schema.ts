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
export const profileTypeEnum = pgEnum('profile_type', ['investor', 'invested_reader', 'creator', 'admin']);

// Project status enum
export const projectStatusEnum = pgEnum('project_status', ['pending', 'active', 'completed', 'rejected']);

// Transaction type enum
export const transactionTypeEnum = pgEnum('transaction_type', ['investment', 'withdrawal', 'commission', 'redistribution', 'deposit']);

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
