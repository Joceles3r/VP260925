// Extension du schéma pour les découverts de solde
import { sql } from 'drizzle-orm';
import {
  pgTable,
  varchar,
  decimal,
  boolean,
  timestamp,
  text,
  pgEnum,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ===== ENUMS =====

// Types d'alertes de découvert
export const overdraftAlertTypeEnum = pgEnum('overdraft_alert_type', [
  'warning',    // 75% de la limite atteinte
  'critical',   // 90% de la limite atteinte  
  'blocked'     // 100% de la limite dépassée
]);

// Types d'incidents de découvert
export const overdraftIncidentTypeEnum = pgEnum('overdraft_incident_type', [
  'account_blocked',      // Compte bloqué pour dépassement
  'payment_failed',       // Paiement échoué par manque de fonds
  'automatic_recovery',   // Récupération automatique
  'manual_intervention'   // Intervention manuelle admin
]);

// Statut des incidents
export const incidentStatusEnum = pgEnum('incident_status', [
  'open',        // Incident ouvert
  'investigating', // En cours d'investigation
  'resolved',    // Résolu
  'closed'       // Fermé
]);

// ===== TABLES =====

// Limites de découvert par utilisateur
export const overdraftLimits = pgTable("overdraft_limits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(), // Référence à users.id
  limitAmount: decimal("limit_amount", { precision: 10, scale: 2 }).notNull(),
  isActive: boolean("is_active").default(true),
  setByAdmin: boolean("set_by_admin").default(false),
  setBy: varchar("set_by").notNull(), // ID de l'utilisateur ou admin qui a défini
  reason: text("reason"), // Raison de la modification
  validFrom: timestamp("valid_from").defaultNow(),
  validUntil: timestamp("valid_until"), // Optionnel pour limites temporaires
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_overdraft_limits_user").on(table.userId),
  index("idx_overdraft_limits_active").on(table.isActive),
]);

// Alertes de découvert envoyées
export const overdraftAlerts = pgTable("overdraft_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(), // Référence à users.id
  alertType: overdraftAlertTypeEnum("alert_type").notNull(),
  overdraftAmount: decimal("overdraft_amount", { precision: 10, scale: 2 }).notNull(),
  limitAmount: decimal("limit_amount", { precision: 10, scale: 2 }).notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  emailSent: boolean("email_sent").default(false),
  emailSentAt: timestamp("email_sent_at"),
  smsSent: boolean("sms_sent").default(false),
  smsSentAt: timestamp("sms_sent_at"),
  pushSent: boolean("push_sent").default(false),
  pushSentAt: timestamp("push_sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_overdraft_alerts_user").on(table.userId),
  index("idx_overdraft_alerts_type").on(table.alertType),
  index("idx_overdraft_alerts_date").on(table.createdAt),
  index("idx_overdraft_alerts_unread").on(table.isRead),
]);

// Incidents de découvert (blocages, échecs de paiement, etc.)
export const overdraftIncidents = pgTable("overdraft_incidents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(), // Référence à users.id
  incidentType: overdraftIncidentTypeEnum("incident_type").notNull(),
  status: incidentStatusEnum("status").default('open'),
  overdraftAmount: decimal("overdraft_amount", { precision: 10, scale: 2 }).notNull(),
  limitAmount: decimal("limit_amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  adminNotes: text("admin_notes"), // Notes internes admin
  isResolved: boolean("is_resolved").default(false),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: varchar("resolved_by"), // ID admin qui a résolu
  autoResolved: boolean("auto_resolved").default(false),
  
  // Métadonnées pour tracking
  transactionId: varchar("transaction_id"), // Transaction qui a causé l'incident
  paymentIntentId: varchar("payment_intent_id"), // Stripe payment intent
  errorCode: varchar("error_code"), // Code d'erreur technique
  errorMessage: text("error_message"), // Message d'erreur détaillé
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_overdraft_incidents_user").on(table.userId),
  index("idx_overdraft_incidents_type").on(table.incidentType),
  index("idx_overdraft_incidents_status").on(table.status),
  index("idx_overdraft_incidents_resolved").on(table.isResolved),
  index("idx_overdraft_incidents_date").on(table.createdAt),
]);

// Historique des frais de découvert
export const overdraftFees = pgTable("overdraft_fees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(), // Référence à users.id
  overdraftAmount: decimal("overdraft_amount", { precision: 10, scale: 2 }).notNull(),
  feeAmount: decimal("fee_amount", { precision: 10, scale: 2 }).notNull(),
  feeRate: decimal("fee_rate", { precision: 5, scale: 4 }).notNull(), // Taux journalier
  daysInOverdraft: integer("days_in_overdraft").notNull(),
  calculatedAt: timestamp("calculated_at").defaultNow(),
  
  // Statut du prélèvement
  isCharged: boolean("is_charged").default(false),
  chargedAt: timestamp("charged_at"),
  transactionId: varchar("transaction_id"), // Transaction du prélèvement
  paymentIntentId: varchar("payment_intent_id"), // Stripe payment intent
  
  // Période couverte
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_overdraft_fees_user").on(table.userId),
  index("idx_overdraft_fees_period").on(table.periodStart, table.periodEnd),
  index("idx_overdraft_fees_charged").on(table.isCharged),
]);

// Configuration des découverts (paramètres globaux)
export const overdraftConfig = pgTable("overdraft_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  configKey: varchar("config_key", { length: 100 }).unique().notNull(),
  configValue: text("config_value").notNull(),
  configType: varchar("config_type").notNull(), // 'number', 'boolean', 'string'
  description: text("description"),
  category: varchar("category").default('general'), // 'limits', 'fees', 'alerts', 'general'
  isEditable: boolean("is_editable").default(true),
  updatedBy: varchar("updated_by"), // Référence à users.id
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_overdraft_config_key").on(table.configKey),
  index("idx_overdraft_config_category").on(table.category),
]);

// ===== SCHÉMAS DE VALIDATION =====

export const insertOverdraftLimitSchema = createInsertSchema(overdraftLimits, {
  limitAmount: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0 && num <= 2000; // Max €2000 de découvert
  }, "Limite doit être entre €0 et €2000"),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOverdraftAlertSchema = createInsertSchema(overdraftAlerts).omit({
  id: true,
  createdAt: true,
});

export const insertOverdraftIncidentSchema = createInsertSchema(overdraftIncidents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const overdraftConfigSchema = z.object({
  defaultLimitInvestor: z.number().min(0).max(1000).default(500),
  defaultLimitCreator: z.number().min(0).max(1000).default(300),
  defaultLimitAdmin: z.number().min(0).max(2000).default(1000),
  warningThreshold: z.number().min(0.5).max(0.9).default(0.75),
  criticalThreshold: z.number().min(0.8).max(0.95).default(0.90),
  dailyFeeRate: z.number().min(0).max(0.01).default(0.001),
  maxMonthlyFees: z.number().min(10).max(100).default(50),
  gracePeriodDays: z.number().min(1).max(30).default(7),
  autoBlockEnabled: z.boolean().default(true),
  alertsEnabled: z.boolean().default(true),
});

// ===== TYPES TYPESCRIPT =====

export type OverdraftLimit = typeof overdraftLimits.$inferSelect;
export type InsertOverdraftLimit = z.infer<typeof insertOverdraftLimitSchema>;

export type OverdraftAlert = typeof overdraftAlerts.$inferSelect;
export type InsertOverdraftAlert = z.infer<typeof insertOverdraftAlertSchema>;

export type OverdraftIncident = typeof overdraftIncidents.$inferSelect;
export type InsertOverdraftIncident = z.infer<typeof insertOverdraftIncidentSchema>;

export type OverdraftFee = typeof overdraftFees.$inferSelect;
export type OverdraftConfig = typeof overdraftConfig.$inferSelect;

export type OverdraftConfigValues = z.infer<typeof overdraftConfigSchema>;