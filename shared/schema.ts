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

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  investments: many(investments),
  transactions: many(transactions),
  complianceReports: many(complianceReports),
  notifications: many(notifications),
  notificationPreferences: many(notificationPreferences),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  creator: one(users, {
    fields: [projects.creatorId],
    references: [users.id],
  }),
  investments: many(investments),
  notifications: many(notifications),
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

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type InsertInvestment = z.infer<typeof insertInvestmentSchema>;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type InsertNotificationPreference = z.infer<typeof insertNotificationPreferenceSchema>;
