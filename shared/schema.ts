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
  check,
  bigserial,
  bigint,
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
  'performance_alert',
  'admin_alert',
  'security'
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

// Feature toggle kind enum
export const toggleKindEnum = pgEnum('toggle_kind', ['category', 'rubrique']);

// Feature toggle message variant enum
export const messageVariantEnum = pgEnum('message_variant', ['en_cours', 'en_travaux', 'custom']);

// Book category enum for LIVRES category
export const bookCategoryEnum = pgEnum('book_category', ['fiction', 'non_fiction', 'poetry', 'essay', 'biography', 'other']);

// Book status enum for lifecycle management
export const bookStatusEnum = pgEnum('book_status', ['pending', 'active', 'top10', 'completed', 'rejected']);

// Download token status enum for security
export const downloadTokenStatusEnum = pgEnum('download_token_status', ['active', 'used', 'expired', 'revoked']);

// Mini social panel position enum for responsive layout
export const socialPanelPositionEnum = pgEnum('social_panel_position', ['sidebar', 'drawer']);

// Mini social panel state enum for default display
export const socialPanelStateEnum = pgEnum('social_panel_state', ['expanded', 'collapsed']);

// High traffic fallback mode enum for mini social panel
export const socialPanelFallbackEnum = pgEnum('social_panel_fallback', ['highlights', 'disabled']);

// Content filter level enum for moderation
export const contentFilterEnum = pgEnum('content_filter_level', ['strict', 'moderate', 'lenient']);

// Audit action enum for tracking administrative operations
export const auditActionEnum = pgEnum('audit_action', [
  'purge_manual', 'purge_scheduled', 'purge_projects', 'purge_live_shows', 'purge_articles', 
  'purge_technical', 'purge_financial', 'admin_access', 'user_role_change', 'project_status_change',
  'compliance_report', 'video_moderation', 'financial_operation', 'security_alert',
  'receipts_viewed', 'receipt_generated', 'receipt_downloaded', 'bulk_receipts_generated', 'auto_receipt_generated',
  'category_created', 'category_updated', 'cycle_started', 'cycle_extended', 'category_closed', 'threshold_check',
  'threshold_check_skipped', 'threshold_check_error', 'unauthorized_admin_access_attempt', 
  'withdrawal_request_created', 'withdrawal_processed',
  'content_reported', 'report_validated', 'report_rejected', 'visupoints_awarded',
  'mini_social_autoshow_toggled', 'mini_social_position_changed', 'mini_social_settings_updated'
]);

// Stripe transfer status enum for idempotent financial operations
export const stripeTransferStatusEnum = pgEnum('stripe_transfer_status', [
  'scheduled', 'pending', 'processing', 'completed', 'failed', 'cancelled'
]);

// Renewal status enum for project renewal system (25€)
export const renewalStatusEnum = pgEnum('renewal_status', ['pending', 'paid', 'active', 'expired', 'cancelled']);

// ===== PETITES ANNONCES ENUMS =====

// Petites annonces category enum (thématique audiovisuel/spectacle uniquement)
export const annoncesCategoryEnum = pgEnum('annonces_category', [
  'talents_jobs',      // Casting, comédiens, figurants, réalisateurs, cadreurs, etc.
  'services',          // Compositeur, voix off, étalonnage, montage, etc.
  'lieux_tournage',    // Locations maisons, appartements, studios, etc.
  'materiel'           // Caméras, optiques, lumières, véhicules d'époque, etc.
]);

// Petites annonces status enum
export const annoncesStatusEnum = pgEnum('annonces_status', [
  'pending',           // En attente de modération
  'active',            // Publiée et visible
  'rejected',          // Refusée par modération
  'expired',           // Expirée
  'archived',          // Archivée par l'auteur
  'suspended'          // Suspendue pour violation
]);

// Moderation decision enum for petites annonces
export const annonceModerationEnum = pgEnum('annonce_moderation', [
  'auto_approved',     // Approuvé automatiquement par IA
  'manual_review',     // Nécessite révision manuelle
  'rejected_theme',    // Refusé : hors thématique audiovisuel
  'rejected_content',  // Refusé : contenu inapproprié
  'rejected_fraud',    // Refusé : suspicion de fraude
  'rejected_duplicate' // Refusé : doublon détecté
]);

// Escrow status enum for protected payments
export const escrowStatusEnum = pgEnum('escrow_status', [
  'pending',           // En attente de paiement
  'funded',            // Fonds déposés
  'released',          // Paiement libéré au vendeur
  'refunded',          // Remboursé à l'acheteur
  'disputed',          // En litige
  'cancelled'          // Annulé
]);

// Sanctions enum for user violations
export const annonceSanctionEnum = pgEnum('annonce_sanction', [
  'warning',           // Avertissement
  'temporary_ban',     // Suspension temporaire
  'permanent_ban'      // Bannissement définitif
]);

// ===== MESSAGERIE INTERNE ENUMS =====

// Internal message subject enum with priority levels
export const messageSubjectEnum = pgEnum('message_subject', [
  'probleme_paiement',        // URGENT - Problème de paiement/virement
  'escroquerie_fraude',       // URGENT - Signalement d'escroquerie/fraude  
  'erreur_prelevement',       // URGENT - Erreur de prélèvement/remboursement
  'probleme_compte',          // URGENT - Problème d'accès compte
  'signalement_bug',          // MOYEN - Signalement de bug
  'question_projet',          // BAS - Question sur un projet
  'question_investissement',  // BAS - Question sur un investissement
  'demande_aide',            // BAS - Demande d'aide générale
  'autre_demande'            // BAS - Autre demande
]);

// Internal message priority enum
export const messagePriorityEnum = pgEnum('message_priority', [
  'urgent',    // Rouge - Problèmes financiers critiques
  'medium',    // Orange - Bugs techniques
  'low'        // Vert - Questions générales
]);

// Internal message status enum
export const messageStatusEnum = pgEnum('message_status', [
  'unread',      // Non lu
  'read',        // Lu
  'in_progress', // En cours de traitement
  'resolved',    // Résolu
  'archived'     // Archivé
]);

// ===== VOIX DE L'INFO ENUMS =====

// Article category enum for infoporteurs
export const articleCategoryEnum = pgEnum('article_category', [
  'actualite',        // Actualités
  'politique',        // Politique
  'economie',         // Économie
  'tech',            // Technologie
  'sport',           // Sport
  'culture',         // Culture
  'science',         // Science
  'sante',           // Santé
  'environnement',   // Environnement
  'societe',         // Société
  'international',   // International
  'autre'            // Autre
]);

// Article status enum
export const articleStatusEnum = pgEnum('article_status', [
  'draft',      // Brouillon
  'pending',    // En attente de modération
  'active',     // Actif et visible
  'paused',     // Mis en pause par l'auteur
  'rejected',   // Rejeté par modération
  'archived'    // Archivé
]);

// Golden ticket status enum
export const goldenTicketStatusEnum = pgEnum('golden_ticket_status', [
  'active',     // Ticket actif dans la compétition
  'completed',  // Compétition terminée - en attente de résultats
  'refunded',   // Ticket remboursé selon classement
  'expired'     // Ticket expiré
]);

// Daily ranking status enum
export const rankingStatusEnum = pgEnum('ranking_status', [
  'ongoing',    // Journée en cours
  'calculating', // Calcul en cours
  'completed',  // Classement finalisé
  'distributed' // Gains distribués
]);

// Platform settings table for admin overrides  
export const platformSettings = pgTable("platform_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: varchar("key", { length: 100 }).unique().notNull(),
  value: text("value"),
  updatedBy: varchar("updated_by"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type PlatformSetting = typeof platformSettings.$inferSelect;
export type InsertPlatformSetting = typeof platformSettings.$inferInsert;

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  nickname: varchar("nickname", { length: 50 }),
  profileImageUrl: varchar("profile_image_url"),
  avatarUrl: varchar("avatar_url"),
  profileTypes: profileTypeEnum("profile_types").array().notNull().default(sql`ARRAY['investor']::profile_type[]`),
  kycVerified: boolean("kyc_verified").default(false),
  kycDocuments: jsonb("kyc_documents"),
  balanceEUR: decimal("balance_eur", { precision: 10, scale: 2 }).default('10000.00'), // Simulation mode starts with €10,000
  simulationMode: boolean("simulation_mode").default(true),
  cautionEUR: decimal("caution_eur", { precision: 10, scale: 2 }).default('0.00'),
  totalInvested: decimal("total_invested", { precision: 10, scale: 2 }).default('0.00'),
  totalGains: decimal("total_gains", { precision: 10, scale: 2 }).default('0.00'),
  rankGlobal: integer("rank_global"),
  themePreference: varchar("theme_preference", { length: 10 }).default('dark'),
  preferredLanguage: varchar("preferred_language", { length: 5 }).default('fr'),
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

// Live Show finalist status enum
export const finalistStatusEnum = pgEnum('finalist_status', [
  'selected',      // Désigné comme finaliste/remplaçant
  'confirmed',     // A confirmé sa participation
  'cancelled',     // S'est désisté
  'promoted',      // Remplaçant promu en finaliste
  'standby'        // En attente (remplaçant)
]);

// Live Show fallback mode enum
export const showFallbackEnum = pgEnum('show_fallback_mode', [
  'battle',        // Battle normale (2 artistes)
  'showcase',      // Showcase spécial (1 artiste)
  'report',        // Report à la semaine suivante
  'cancelled'      // Annulé
]);

// Notification type for Live Show system
export const liveShowNotificationTypeEnum = pgEnum('live_show_notification_type', [
  'finalist_confirmation',    // Demande de confirmation finaliste
  'alternate_standby',        // Alerte stand-by remplaçant
  'lineup_update',            // Mise à jour line-up
  'promotion',                // Promotion d'un remplaçant
  'cancellation',             // Annulation
  'final_reminder',           // Rappel final
  'penalty_warning'           // Avertissement de pénalité
]);

// Live Show phase enum (weekly selection cycle)
export const liveShowPhaseEnum = pgEnum('live_show_phase', [
  'phase1',      // Dim 12:00 → Lun 00:00 (100 → 50 candidats)
  'phase2',      // Lun 00:00 → Mar 00:00 (50 → 2 finalistes)
  'phase3',      // Mar 00:00 → Ven 20:30 (préparation)
  'live',        // Ven 21:00 → 00:00 (bataille)
  'ended'        // Post-show
]);

// Live Show orchestrator state enum
export const liveShowStateEnum = pgEnum('live_show_state', [
  'planned',       // Show planifié
  'pre_show',      // Préparation (Ven 20:30-21:00)
  'live_running',  // En direct (21:00-23:45)
  'votes_closed',  // Votes fermés (23:45)
  'result_ready',  // Résultats calculés
  'ended'          // Terminé
]);

// Candidate status enum for selection phases
export const candidateStatusEnum = pgEnum('candidate_status', [
  'submitted',     // Soumis (Phase 1)
  'ai_selected',   // Sélectionné par IA (Phase 1 → Phase 2)
  'finalist',      // Finaliste (Phase 2 → Phase 3)
  'eliminated',    // Éliminé
  'withdrawn'      // Retiré
]);

// Ad type enum for Live Show advertising
export const adTypeEnum = pgEnum('ad_type', [
  'standard',      // Pub standard
  'premium',       // Pub premium
  'interactive'    // Pub interactive avec CTA
]);

// Live shows table (extended)
export const liveShows = pgTable("live_shows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  weekNumber: integer("week_number"), // Semaine de l'année
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  streamUrl: varchar("stream_url"),
  isActive: boolean("is_active").default(false),
  viewerCount: integer("viewer_count").default(0),
  artistA: varchar("artist_a"),
  artistB: varchar("artist_b"),
  artistAId: varchar("artist_a_id").references(() => users.id),
  artistBId: varchar("artist_b_id").references(() => users.id),
  investmentA: decimal("investment_a", { precision: 10, scale: 2 }).default('0.00'),
  investmentB: decimal("investment_b", { precision: 10, scale: 2 }).default('0.00'),
  votesA: integer("votes_a").default(0),
  votesB: integer("votes_b").default(0),
  scheduledStart: timestamp("scheduled_start"), // Vendredi 21:00 (optionnel pour compatibilité)
  scheduledEnd: timestamp("scheduled_end"),     // Vendredi 00:00 (optionnel pour compatibilité)
  lineupLocked: boolean("lineup_locked").default(false),
  lineupLockedAt: timestamp("lineup_locked_at"),
  fallbackMode: showFallbackEnum("fallback_mode").default('battle'),
  fallbackReason: text("fallback_reason"),
  penaltiesEnabled: boolean("penalties_enabled").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Live chat messages table
export const liveChatMessages = pgTable("live_chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  liveShowId: varchar("live_show_id").notNull().references(() => liveShows.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  messageType: varchar("message_type", { length: 50 }).default('chat'), // 'chat', 'system', 'highlight'
  isModerated: boolean("is_moderated").default(false),
  moderationReason: varchar("moderation_reason", { length: 255 }),
  reactionCount: integer("reaction_count").default(0),
  highlightScore: integer("highlight_score").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Message reactions table
export const messageReactions = pgTable("message_reactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  messageId: varchar("message_id").notNull().references(() => liveChatMessages.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id),
  reaction: varchar("reaction", { length: 50 }).notNull(), // 'like', 'love', 'laugh', 'wow', 'sad', 'angry'
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueUserMessageReaction: unique().on(table.userId, table.messageId, table.reaction),
}));

// Live polls table
export const livePolls = pgTable("live_polls", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  liveShowId: varchar("live_show_id").notNull().references(() => liveShows.id, { onDelete: 'cascade' }),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  question: varchar("question", { length: 500 }).notNull(),
  options: jsonb("options").notNull(), // Array of poll options
  isActive: boolean("is_active").default(true),
  totalVotes: integer("total_votes").default(0),
  endsAt: timestamp("ends_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Poll votes table
export const pollVotes = pgTable("poll_votes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pollId: varchar("poll_id").notNull().references(() => livePolls.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id),
  optionIndex: integer("option_index").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueUserPoll: unique().on(table.userId, table.pollId),
}));

// User engagement points table
export const engagementPoints = pgTable("engagement_points", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  liveShowId: varchar("live_show_id").references(() => liveShows.id, { onDelete: 'set null' }),
  pointType: varchar("point_type", { length: 50 }).notNull(), // 'message', 'reaction', 'poll_vote', 'prediction', 'investment'
  points: integer("points").notNull(),
  description: varchar("description", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// User badges table
export const userBadges = pgTable("user_badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  badgeType: varchar("badge_type", { length: 50 }).notNull(), // 'early_bird', 'top_investor', 'chat_master', 'predictor'
  badgeName: varchar("badge_name", { length: 100 }).notNull(),
  badgeDescription: varchar("badge_description", { length: 255 }),
  earnedAt: timestamp("earned_at").defaultNow(),
  liveShowId: varchar("live_show_id").references(() => liveShows.id, { onDelete: 'set null' }),
}, (table) => ({
  uniqueUserBadge: unique().on(table.userId, table.badgeType, table.liveShowId),
}));

// Live predictions/bets table
export const livePredictions = pgTable("live_predictions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  liveShowId: varchar("live_show_id").notNull().references(() => liveShows.id, { onDelete: 'cascade' }),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  question: varchar("question", { length: 500 }).notNull(),
  outcomes: jsonb("outcomes").notNull(), // Array of possible outcomes
  isActive: boolean("is_active").default(true),
  resolvedOutcome: integer("resolved_outcome"), // Index of winning outcome
  totalBets: integer("total_bets").default(0),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).default('0.00'),
  endsAt: timestamp("ends_at"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Prediction bets table
export const predictionBets = pgTable("prediction_bets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  predictionId: varchar("prediction_id").notNull().references(() => livePredictions.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id),
  outcomeIndex: integer("outcome_index").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  potentialWin: decimal("potential_win", { precision: 10, scale: 2 }).notNull(),
  isWinner: boolean("is_winner"),
  paidOut: boolean("paid_out").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueUserPrediction: unique().on(table.userId, table.predictionId),
}));

// Live Show Finalists/Alternates table
export const liveShowFinalists = pgTable("live_show_finalists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  liveShowId: varchar("live_show_id").notNull().references(() => liveShows.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id),
  artistName: varchar("artist_name", { length: 255 }).notNull(),
  rank: integer("rank"), // 1=F1, 2=F2, 3=A1, 4=A2 (nullable to allow slot release on cancellation)
  role: varchar("role", { length: 20 }).notNull(), // 'finalist' or 'alternate'
  status: finalistStatusEnum("status").default('selected'),
  confirmationRequestedAt: timestamp("confirmation_requested_at"),
  confirmedAt: timestamp("confirmed_at"),
  cancelledAt: timestamp("cancelled_at"),
  cancellationReason: text("cancellation_reason"),
  promotedAt: timestamp("promoted_at"),
  promotedFrom: varchar("promoted_from"), // ID du finaliste promu depuis remplaçant
  availabilityConfirmed: boolean("availability_confirmed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueShowUser: unique().on(table.liveShowId, table.userId),
}));

// Live Show Notifications table
export const liveShowNotifications = pgTable("live_show_notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  liveShowId: varchar("live_show_id").notNull().references(() => liveShows.id, { onDelete: 'cascade' }),
  recipientId: varchar("recipient_id").notNull().references(() => users.id),
  notificationType: liveShowNotificationTypeEnum("notification_type").notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  message: text("message").notNull(),
  actionUrl: varchar("action_url"),
  isRead: boolean("is_read").default(false),
  emailSent: boolean("email_sent").default(false),
  emailSentAt: timestamp("email_sent_at"),
  metadata: jsonb("metadata"), // Données supplémentaires (deadline, etc.)
  createdAt: timestamp("created_at").defaultNow(),
});

// Live Show Penalties table
export const liveShowPenalties = pgTable("live_show_penalties", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  liveShowId: varchar("live_show_id").references(() => liveShows.id, { onDelete: 'set null' }),
  penaltyType: varchar("penalty_type", { length: 50 }).notNull(), // 'late_cancellation', 'no_show'
  severity: varchar("severity", { length: 20 }).notNull(), // 'warning', 'temporary_ban', 'permanent_ban'
  description: text("description").notNull(),
  editionsAffected: integer("editions_affected"), // Nombre d'éditions de suspension
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Live Show Audit Log table
export const liveShowAudit = pgTable("live_show_audit", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  liveShowId: varchar("live_show_id").references(() => liveShows.id, { onDelete: 'set null' }),
  actionType: varchar("action_type", { length: 100 }).notNull(), // 'finalist_confirmed', 'alternate_promoted', 'lineup_locked', 'fallback_activated', etc.
  performedBy: varchar("performed_by").references(() => users.id), // User ID or 'system' or 'ai'
  performedByType: varchar("performed_by_type", { length: 20 }).default('user'), // 'user', 'admin', 'system', 'ai'
  targetUserId: varchar("target_user_id").references(() => users.id), // User affecté par l'action
  description: text("description").notNull(),
  metadata: jsonb("metadata"), // Données détaillées de l'action
  timestamp: timestamp("timestamp").defaultNow(),
});

// ===== LIVE SHOW WEEKLY SYSTEM TABLES =====

// Live Show Editions (weekly cycles with orchestrator state)
export const liveShowEditions = pgTable("live_show_editions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  liveShowId: varchar("live_show_id").notNull().references(() => liveShows.id, { onDelete: 'cascade' }),
  weekNumber: integer("week_number").notNull(), // ISO week number
  year: integer("year").notNull(), // Year
  currentPhase: liveShowPhaseEnum("current_phase").default('phase1'),
  currentState: liveShowStateEnum("current_state").default('planned'),
  phase1StartsAt: timestamp("phase1_starts_at").notNull(), // Dim 12:00
  phase1EndsAt: timestamp("phase1_ends_at").notNull(), // Lun 00:00
  phase2StartsAt: timestamp("phase2_starts_at").notNull(), // Lun 00:00
  phase2EndsAt: timestamp("phase2_ends_at").notNull(), // Mar 00:00
  phase3StartsAt: timestamp("phase3_starts_at").notNull(), // Mar 00:00
  phase3EndsAt: timestamp("phase3_ends_at").notNull(), // Ven 20:30
  liveStartsAt: timestamp("live_starts_at").notNull(), // Ven 21:00
  liveEndsAt: timestamp("live_ends_at").notNull(), // Sam 00:00
  votingOpensAt: timestamp("voting_opens_at").notNull(), // Ven 21:00
  votingClosesAt: timestamp("voting_closes_at").notNull(), // Ven 23:45
  totalCandidates: integer("total_candidates").default(0),
  selectedCandidates: integer("selected_candidates").default(0),
  finalistsSelected: boolean("finalists_selected").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueWeek: unique().on(table.year, table.weekNumber),
}));

// Live Show Candidates (for phases 1-3 selection)
export const liveShowCandidates = pgTable("live_show_candidates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  editionId: varchar("edition_id").notNull().references(() => liveShowEditions.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id),
  artistName: varchar("artist_name", { length: 255 }).notNull(),
  videoUrl: varchar("video_url").notNull(), // 3min video
  videoDuration: integer("video_duration"), // seconds
  status: candidateStatusEnum("status").default('submitted'),
  aiScore: decimal("ai_score", { precision: 3, scale: 2 }), // 0.00 to 1.00
  activityScore: decimal("activity_score", { precision: 3, scale: 2 }),
  qualityScore: decimal("quality_score", { precision: 3, scale: 2 }),
  engagementScore: decimal("engagement_score", { precision: 3, scale: 2 }),
  creativityScore: decimal("creativity_score", { precision: 3, scale: 2 }),
  communityVotes: integer("community_votes").default(0),
  totalScore: decimal("total_score", { precision: 5, scale: 2 }).default('0.00'), // aiScore + communityVotes
  rank: integer("rank"), // Classement final dans la sélection
  eliminatedAt: timestamp("eliminated_at"),
  eliminatedInPhase: liveShowPhaseEnum("eliminated_in_phase"),
  submittedAt: timestamp("submitted_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueEditionUser: unique().on(table.editionId, table.userId),
}));

// Live Show Community Votes (during phases 1-2)
export const liveShowCommunityVotes = pgTable("live_show_community_votes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  candidateId: varchar("candidate_id").notNull().references(() => liveShowCandidates.id, { onDelete: 'cascade' }),
  voterId: varchar("voter_id").notNull().references(() => users.id),
  phase: liveShowPhaseEnum("phase").notNull(), // 'phase1' or 'phase2'
  voteWeight: decimal("vote_weight", { precision: 3, scale: 2 }).default('1.00'), // Pour votes pondérés
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueVoterCandidatePhase: unique().on(table.voterId, table.candidateId, table.phase),
}));

// Live Show Battle Investments (during Live 21:00-23:45)
export const liveShowBattleInvestments = pgTable("live_show_battle_investments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  editionId: varchar("edition_id").notNull().references(() => liveShowEditions.id, { onDelete: 'cascade' }),
  liveShowId: varchar("live_show_id").notNull().references(() => liveShows.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id),
  finalist: varchar("finalist", { length: 1 }).notNull(), // 'A' or 'B'
  amountEUR: decimal("amount_eur", { precision: 10, scale: 2 }).notNull(), // 2-20€ tranches
  votes: integer("votes").notNull(), // 1-10 votes (converted from amount)
  paymentIntentId: varchar("payment_intent_id"), // Stripe payment intent
  paidAt: timestamp("paid_at"),
  isWinner: boolean("is_winner"), // True si a investi sur le gagnant
  payoutAmount: decimal("payout_amount", { precision: 10, scale: 2 }), // Gain distribué
  payoutProcessed: boolean("payout_processed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Live Show Ads (scheduled advertising breaks)
export const liveShowAds = pgTable("live_show_ads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  editionId: varchar("edition_id").notNull().references(() => liveShowEditions.id, { onDelete: 'cascade' }),
  slotNumber: integer("slot_number").notNull(), // 1-6
  scheduledAt: varchar("scheduled_at", { length: 10 }).notNull(), // "21:30", "22:00", etc.
  durationMinutes: integer("duration_minutes").notNull(), // 2-5 min
  adType: adTypeEnum("ad_type").default('standard'),
  advertiserId: varchar("advertiser_id").references(() => users.id),
  adContent: jsonb("ad_content"), // {title, description, videoUrl, ctaUrl, etc.}
  isTriggered: boolean("is_triggered").default(false),
  triggeredAt: timestamp("triggered_at"),
  triggeredBy: varchar("triggered_by").references(() => users.id), // Admin qui a déclenché
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueEditionSlot: unique().on(table.editionId, table.slotNumber),
}));

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

// ===== MESSAGERIE INTERNE TABLES =====

// Internal messages table - Messagerie interne pour contacter les responsables
export const internalMessages = pgTable("internal_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  userType: varchar("user_type").notNull(), // Type de profil utilisateur au moment de l'envoi
  subject: messageSubjectEnum("subject").notNull(),
  subjectCustom: varchar("subject_custom"), // Pour "autre_demande"
  message: text("message").notNull(),
  priority: messagePriorityEnum("priority").notNull().default('low'),
  status: messageStatusEnum("status").notNull().default('unread'),
  adminNotes: text("admin_notes"), // Notes internes de l'admin
  handledBy: varchar("handled_by").references(() => users.id), // Admin qui traite le message
  handledAt: timestamp("handled_at"),
  emailSent: boolean("email_sent").default(false), // Notification email envoyée
  emailSentAt: timestamp("email_sent_at"),
  ipAddress: varchar("ip_address"), // Sécurité
  userAgent: text("user_agent"), // Sécurité
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_internal_messages_user").on(table.userId),
  index("idx_internal_messages_status").on(table.status),
  index("idx_internal_messages_priority").on(table.priority),
  index("idx_internal_messages_created").on(table.createdAt),
  index("idx_internal_messages_subject").on(table.subject),
]);

// Message rate limiting table - Anti-spam
export const messageRateLimit = pgTable("message_rate_limit", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  date: varchar("date", { length: 10 }).notNull(), // Format YYYY-MM-DD
  messageCount: integer("message_count").default(1),
  maxMessages: integer("max_messages").default(3), // Limite par jour
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  unique("unique_user_date_limit").on(table.userId, table.date),
  index("idx_rate_limit_user").on(table.userId),
  index("idx_rate_limit_date").on(table.date),
]);

// Floating button configuration table - Configuration du bouton flottant
export const floatingButtonConfig = pgTable("floating_button_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  isEnabled: boolean("is_enabled").default(true),
  buttonText: varchar("button_text").default('Contacter le Responsable'),
  buttonColor: varchar("button_color").default('#dc2626'), // Rouge par défaut
  position: varchar("position").default('bottom-right'), // bottom-right, bottom-left
  updatedBy: varchar("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ===== VOIX DE L'INFO TABLES =====

// Infoporteur profiles - Profils des créateurs de contenu
export const infoporteurProfiles = pgTable("infoporteur_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  displayName: varchar("display_name", { length: 100 }).notNull(),
  bio: text("bio"),
  avatar: varchar("avatar"), // URL de l'avatar
  specialties: text("specialties"), // JSON array des spécialités
  cautionPaid: boolean("caution_paid").default(false),
  cautionAmount: decimal("caution_amount", { precision: 10, scale: 2 }).default('10.00'),
  cautionPaidAt: timestamp("caution_paid_at"),
  totalArticles: integer("total_articles").default(0),
  totalSales: decimal("total_sales", { precision: 12, scale: 2 }).default('0.00'),
  top10Count: integer("top10_count").default(0), // Nombre de fois dans le TOP 10
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_infoporteur_user").on(table.userId),
  index("idx_infoporteur_active").on(table.isActive),
  index("idx_infoporteur_top10").on(table.top10Count),
]);

// Investi-lecteur profiles - Profils des investisseurs/lecteurs
export const investiLecteurProfiles = pgTable("investi_lecteur_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  displayName: varchar("display_name", { length: 100 }).notNull(),
  avatar: varchar("avatar"), // URL de l'avatar
  cautionPaid: boolean("caution_paid").default(false),
  cautionAmount: decimal("caution_amount", { precision: 10, scale: 2 }).default('20.00'),
  cautionPaidAt: timestamp("caution_paid_at"),
  visuPoints: integer("visu_points").default(0), // Solde VISUpoints
  totalInvested: decimal("total_invested", { precision: 12, scale: 2 }).default('0.00'),
  totalWinnings: decimal("total_winnings", { precision: 12, scale: 2 }).default('0.00'),
  winningStreaks: integer("winning_streaks").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_investi_lecteur_user").on(table.userId),
  index("idx_investi_lecteur_active").on(table.isActive),
  index("idx_investi_lecteur_points").on(table.visuPoints),
]);

// Articles créés par les infoporteurs
export const voixInfoArticles = pgTable("voix_info_articles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  infoporteurId: varchar("infoporteur_id").notNull().references(() => infoporteurProfiles.id),
  title: varchar("title", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 250 }).notNull().unique(),
  excerpt: varchar("excerpt", { length: 500 }),
  content: text("content").notNull(),
  category: articleCategoryEnum("category").notNull(),
  priceEuros: decimal("price_euros", { precision: 5, scale: 2 }).notNull(), // 0.2 à 5.00
  coverImage: varchar("cover_image"), // URL image de couverture
  tags: text("tags"), // JSON array des tags
  status: articleStatusEnum("status").default('draft'),
  moderatedBy: varchar("moderated_by").references(() => users.id),
  moderatedAt: timestamp("moderated_at"),
  moderationNotes: text("moderation_notes"),
  readingTime: integer("reading_time"), // Minutes estimées
  totalSales: integer("total_sales").default(0),
  totalRevenue: decimal("total_revenue", { precision: 10, scale: 2 }).default('0.00'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  publishedAt: timestamp("published_at"),
}, (table) => [
  index("idx_articles_infoporteur").on(table.infoporteurId),
  index("idx_articles_status").on(table.status),
  index("idx_articles_category").on(table.category),
  index("idx_articles_price").on(table.priceEuros),
  index("idx_articles_sales").on(table.totalSales),
  index("idx_articles_published").on(table.publishedAt),
]);

// Achats d'articles par les investi-lecteurs
export const articlePurchases = pgTable("article_purchases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  articleId: varchar("article_id").notNull().references(() => voixInfoArticles.id),
  investiLecteurId: varchar("investi_lecteur_id").notNull().references(() => investiLecteurProfiles.id),
  priceEuros: decimal("price_euros", { precision: 5, scale: 2 }).notNull(),
  visuPointsSpent: integer("visu_points_spent").notNull(),
  votes: integer("votes").notNull(), // Calculé selon le barème
  paymentIntentId: varchar("payment_intent_id"), // Stripe payment intent
  refunded: boolean("refunded").default(false),
  refundedAt: timestamp("refunded_at"),
  refundAmount: decimal("refund_amount", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_purchases_article").on(table.articleId),
  index("idx_purchases_investi").on(table.investiLecteurId),
  index("idx_purchases_date").on(table.createdAt),
  unique("unique_article_investi").on(table.articleId, table.investiLecteurId), // Un achat par article par utilisateur
]);

// Daily rankings - Classements quotidiens TOP 10
export const dailyRankings = pgTable("daily_rankings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  rankingDate: varchar("ranking_date", { length: 10 }).notNull(), // Format YYYY-MM-DD
  infoporteurId: varchar("infoporteur_id").notNull().references(() => infoporteurProfiles.id),
  rank: integer("rank").notNull(), // 1 à 100+
  totalSales: integer("total_sales").notNull(), // Nombre de ventes
  totalRevenue: decimal("total_revenue", { precision: 10, scale: 2 }).notNull(),
  isTop10: boolean("is_top10").notNull().default(false),
  bonusEarned: decimal("bonus_earned", { precision: 10, scale: 2 }).default('0.00'),
  status: rankingStatusEnum("status").default('ongoing'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_rankings_date").on(table.rankingDate),
  index("idx_rankings_infoporteur").on(table.infoporteurId),
  index("idx_rankings_rank").on(table.rank),
  index("idx_rankings_top10").on(table.isTop10),
  unique("unique_ranking_date_infoporteur").on(table.rankingDate, table.infoporteurId),
]);

// Golden tickets - Tickets premium mensuels
export const goldenTickets = pgTable("golden_tickets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  investiLecteurId: varchar("investi_lecteur_id").notNull().references(() => investiLecteurProfiles.id),
  monthYear: varchar("month_year", { length: 7 }).notNull(), // Format YYYY-MM
  tier: integer("tier").notNull(), // 1=50€, 2=75€, 3=100€
  amountEuros: decimal("amount_euros", { precision: 5, scale: 2 }).notNull(),
  votes: integer("votes").notNull(), // 20, 30, ou 40 selon le tier
  visuPointsSpent: integer("visu_points_spent").notNull(),
  targetInfoporteurId: varchar("target_infoporteur_id").references(() => infoporteurProfiles.id),
  finalRank: integer("final_rank"), // Rang final de l'infoporteur ciblé
  refundPercentage: integer("refund_percentage").default(0), // 0, 50, ou 100%
  refundAmount: decimal("refund_amount", { precision: 5, scale: 2 }).default('0.00'),
  status: goldenTicketStatusEnum("status").default('active'),
  paymentIntentId: varchar("payment_intent_id"), // Stripe payment intent
  refundedAt: timestamp("refunded_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_golden_tickets_investi").on(table.investiLecteurId),
  index("idx_golden_tickets_month").on(table.monthYear),
  index("idx_golden_tickets_tier").on(table.tier),
  index("idx_golden_tickets_status").on(table.status),
  unique("unique_ticket_user_month").on(table.investiLecteurId, table.monthYear), // Un ticket par mois par utilisateur
]);

// VISUpoints transactions - Historique des achats/dépenses de VISUpoints
export const visuPointsTransactions = pgTable("visu_points_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: varchar("type").notNull(), // 'purchase', 'spend', 'refund', 'bonus', 'cashout'
  amount: integer("amount").notNull(), // Peut être négatif pour les dépenses
  balanceBefore: integer("balance_before").notNull(),
  balanceAfter: integer("balance_after").notNull(),
  euroAmount: decimal("euro_amount", { precision: 10, scale: 2 }), // Montant en euros si applicable
  description: text("description").notNull(),
  relatedId: varchar("related_id"), // ID de l'élément associé (achat, article, etc.)
  relatedType: varchar("related_type"), // 'article_purchase', 'golden_ticket', 'pack_purchase', etc.
  paymentIntentId: varchar("payment_intent_id"), // Stripe payment intent si applicable
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_vp_transactions_user").on(table.userId),
  index("idx_vp_transactions_type").on(table.type),
  index("idx_vp_transactions_date").on(table.createdAt),
  index("idx_vp_transactions_related").on(table.relatedId, table.relatedType),
]);

// Daily pot distribution - Distribution quotidienne des gains
export const dailyPotDistribution = pgTable("daily_pot_distribution", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  distributionDate: varchar("distribution_date", { length: 10 }).notNull(), // Format YYYY-MM-DD
  totalPotEuros: decimal("total_pot_euros", { precision: 12, scale: 2 }).notNull(),
  top10InfoporteurShare: decimal("top10_infoporteur_share", { precision: 12, scale: 2 }).notNull(), // 50%
  investiLecteurShare: decimal("investi_lecteur_share", { precision: 12, scale: 2 }).notNull(), // 50%
  totalWinningVotes: integer("total_winning_votes").notNull(),
  totalWinningInvestiLecteurs: integer("total_winning_investi_lecteurs").notNull(),
  visualCommission: decimal("visual_commission", { precision: 12, scale: 2 }).default('0.00'), // 0% selon validation
  status: rankingStatusEnum("status").default('calculating'),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_pot_distribution_date").on(table.distributionDate),
  index("idx_pot_distribution_status").on(table.status),
]);

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

// Daily quest system for "Surprise du jour"
export const dailyQuests = pgTable("daily_quests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  questDate: varchar("quest_date", { length: 10 }).notNull(), // "2025-09-23" format
  questType: varchar("quest_type", { length: 50 }).notNull(), // "explore_projects", "make_investment", "social_activity"
  questTitle: varchar("quest_title", { length: 200 }).notNull(),
  questDescription: varchar("quest_description", { length: 500 }).notNull(),
  targetCount: integer("target_count").default(1), // Nombre d'actions à réaliser
  currentCount: integer("current_count").default(0), // Progression actuelle
  rewardVP: integer("reward_vp").default(20), // VISUpoints à gagner
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  isRewardClaimed: boolean("is_reward_claimed").default(false),
  rewardClaimedAt: timestamp("reward_claimed_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_daily_quests_user").on(table.userId),
  index("idx_daily_quests_date").on(table.questDate),
  unique("unique_user_quest_date").on(table.userId, table.questDate),
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

// ===== CATÉGORIE LIVRES - NOUVELLES TABLES =====

// Book categories table - Catégories LIVRES avec cycle 30 jours
export const bookCategories = pgTable("book_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).unique().notNull(), // "LIVRES_2025_Q1"
  displayName: varchar("display_name").notNull(), // "Livres T1 2025"
  description: text("description"),
  status: categoryStatusEnum("status").default('waiting'), // waiting, active, closed
  currentAuthorCount: integer("current_author_count").default(0),
  targetAuthorCount: integer("target_author_count").default(100), // 100 auteurs pour démarrer
  maxAuthorCount: integer("max_author_count").default(100), // Extensible à 200 (TOP 20)
  cycleStartedAt: timestamp("cycle_started_at"), // Début cycle 30j
  cycleEndsAt: timestamp("cycle_ends_at"), // Fin cycle 30j
  potTotalEUR: decimal("pot_total_eur", { precision: 10, scale: 2 }).default('0.00'), // Pot commun
  top10Calculated: boolean("top10_calculated").default(false), // TOP 10 déjà calculé?
  isActive: boolean("is_active").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_book_categories_status").on(table.status),
  index("idx_book_categories_active").on(table.isActive),
  index("idx_book_categories_cycle").on(table.cycleStartedAt, table.cycleEndsAt),
]);

// Books table - Livres numériques des auteurs
export const books = pgTable("books", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  category: bookCategoryEnum("category").notNull(), // fiction, non_fiction, etc.
  categoryId: varchar("category_id").notNull().references(() => bookCategories.id), // Catégorie LIVRES active
  authorId: varchar("author_id").notNull().references(() => users.id),
  unitPriceEUR: decimal("unit_price_eur", { precision: 5, scale: 2 }).notNull(), // {2, 3, 4, 5, 8}€
  status: bookStatusEnum("status").default('pending'), // pending, active, top10, completed, rejected
  fileUrl: varchar("file_url"), // URL stockage auteur (PDF/EPUB)
  thumbnailUrl: varchar("thumbnail_url"),
  fileSize: integer("file_size"), // Taille en bytes
  fileFormat: varchar("file_format", { length: 10 }), // pdf, epub, etc.
  pageCount: integer("page_count"),
  totalVotes: integer("total_votes").default(0), // Total votes reçus
  totalSalesEUR: decimal("total_sales_eur", { precision: 10, scale: 2 }).default('0.00'), // CA total
  uniqueBuyers: integer("unique_buyers").default(0), // Nb acheteurs uniques
  finalRank: integer("final_rank"), // Rang final dans TOP 10 (1-10)
  engagementCoeff: decimal("engagement_coeff", { precision: 10, scale: 2 }), // montantTotal / max(1, uniqueBuyers)
  autoReportNextCycle: boolean("auto_report_next_cycle").default(false), // TOP 10 auto-inscrit
  endDate: timestamp("end_date"), // Fin de la catégorie LIVRES
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_books_author").on(table.authorId),
  index("idx_books_category").on(table.categoryId),
  index("idx_books_status").on(table.status),
  index("idx_books_votes").on(table.totalVotes),
  index("idx_books_sales").on(table.totalSalesEUR),
  index("idx_books_rank").on(table.finalRank),
  index("idx_books_engagement").on(table.engagementCoeff),
]);

// Book purchases table - Achats/investissements dans les livres
export const bookPurchases = pgTable("book_purchases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id), // Investi-lecteur
  bookId: varchar("book_id").notNull().references(() => books.id),
  categoryId: varchar("category_id").notNull().references(() => bookCategories.id),
  amountEUR: decimal("amount_eur", { precision: 10, scale: 2 }).notNull(), // Montant payé {2→20}€
  votesGranted: integer("votes_granted").notNull(), // Votes accordés selon barème
  unitPriceEUR: decimal("unit_price_eur", { precision: 5, scale: 2 }).notNull(), // Prix livre
  tipEUR: decimal("tip_eur", { precision: 5, scale: 2 }).default('0.00'), // Soutien au-dessus prix
  paymentMethod: varchar("payment_method", { length: 20 }).default('stripe'), // stripe, visupoints
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  downloadTokenUsed: boolean("download_token_used").default(false), // Token déjà utilisé?
  isWinner: boolean("is_winner").default(false), // Acheté livre du TOP 10?
  potRedistributionEUR: decimal("pot_redistribution_eur", { precision: 10, scale: 2 }).default('0.00'), // Part du pot
  potPaid: boolean("pot_paid").default(false), // Redistribution pot payée?
  potPaidAt: timestamp("pot_paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_book_purchases_user").on(table.userId),
  index("idx_book_purchases_book").on(table.bookId),
  index("idx_book_purchases_category").on(table.categoryId),
  index("idx_book_purchases_amount").on(table.amountEUR),
  index("idx_book_purchases_winner").on(table.isWinner),
  index("idx_book_purchases_created").on(table.createdAt),
  unique("unique_book_purchase").on(table.userId, table.bookId), // 1 achat par livre/user
]);

// Download tokens table - Tokens de téléchargement sécurisé avec watermark
export const downloadTokens = pgTable("download_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  purchaseId: varchar("purchase_id").notNull().references(() => bookPurchases.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  bookId: varchar("book_id").notNull().references(() => books.id),
  token: varchar("token", { length: 128 }).unique().notNull(), // Token sécurisé
  status: downloadTokenStatusEnum("status").default('active'), // active, used, expired, revoked
  expiresAt: timestamp("expires_at").notNull(), // TTL 72h par défaut
  usedAt: timestamp("used_at"),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  watermarkData: jsonb("watermark_data"), // Info pour filigrane: userId, timestamp, etc.
  downloadUrl: varchar("download_url"), // URL signée temporaire
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_download_tokens_purchase").on(table.purchaseId),
  index("idx_download_tokens_user").on(table.userId),
  index("idx_download_tokens_book").on(table.bookId),
  index("idx_download_tokens_status").on(table.status),
  index("idx_download_tokens_expires").on(table.expiresAt),
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

// ===== PETITES ANNONCES TABLES =====

// Table principale des petites annonces (périmètre audiovisuel/spectacle uniquement)
export const petitesAnnonces = pgTable("petites_annonces", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  authorId: varchar("author_id").notNull().references(() => users.id),
  
  // Contenu de l'annonce
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  category: annoncesCategoryEnum("category").notNull(),
  subcategory: varchar("subcategory", { length: 100 }), // Ex: "cameraman", "studio", "voix-off"
  
  // Informations pratiques
  location: varchar("location", { length: 255 }).notNull(), // Ville/pays
  availableDates: text("available_dates"), // Dates proposées (format texte libre)
  priceIndicative: varchar("price_indicative", { length: 100 }), // Tarif indicatif/échelle
  
  // Médias
  imageUrls: text("image_urls").array(), // Photos de l'annonce
  videoUrl: varchar("video_url"), // Vidéo Bunny Stream (optionnelle, coût à l'annonceur)
  
  // Métadonnées
  status: annoncesStatusEnum("status").default('pending'),
  moderationDecision: annonceModerationEnum("moderation_decision"),
  moderationReason: text("moderation_reason"),
  moderatedBy: varchar("moderated_by").references(() => users.id), // Modérateur humain si applicable
  moderatedAt: timestamp("moderated_at"),
  
  // Autorisations (pour lieux/matériel soumis à autorisation)
  hasAuthorization: boolean("has_authorization").default(false),
  authorizationDetails: text("authorization_details"),
  
  // Gestion des expiration et archives
  expiresAt: timestamp("expires_at"), // Auto-calculé à la publication
  isPromoted: boolean("is_promoted").default(false), // Mise en avant payante
  viewCount: integer("view_count").default(0),
  contactCount: integer("contact_count").default(0), // Nombre de contacts via messagerie
  
  // Escrow disponible
  escrowAvailable: boolean("escrow_available").default(false),
  escrowMinimumEUR: decimal("escrow_minimum_eur", { precision: 10, scale: 2 }),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_petites_annonces_category").on(table.category),
  index("idx_petites_annonces_location").on(table.location),
  index("idx_petites_annonces_status").on(table.status),
  index("idx_petites_annonces_author").on(table.authorId),
  index("idx_petites_annonces_expires").on(table.expiresAt),
  index("idx_petites_annonces_active").on(table.status, table.expiresAt), // Annonces actives non expirées
]);

// Historique de modération des annonces
export const annoncesModeration = pgTable("annonces_moderation", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  annonceId: varchar("annonce_id").notNull().references(() => petitesAnnonces.id, { onDelete: 'cascade' }),
  moderatorId: varchar("moderator_id").references(() => users.id), // null si IA
  
  // Décision de modération
  decision: annonceModerationEnum("decision").notNull(),
  reason: text("reason"),
  moderationType: varchar("moderation_type", { length: 20 }).notNull(), // 'ai' ou 'human'
  
  // Détails pour IA
  aiScore: decimal("ai_score", { precision: 5, scale: 2 }), // Score de confiance IA (0-100)
  aiFlags: text("ai_flags").array(), // Drapeaux détectés ['hors_theme', 'contenu_suspect', etc.]
  
  // Sanction appliquée si rejet
  sanctionApplied: annonceSanctionEnum("sanction_applied"),
  sanctionDuration: integer("sanction_duration"), // Durée en heures pour suspension temporaire
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_annonces_moderation_annonce").on(table.annonceId),
  index("idx_annonces_moderation_decision").on(table.decision),
  index("idx_annonces_moderation_type").on(table.moderationType),
]);

// Signalements d'annonces par les utilisateurs
export const annoncesReports = pgTable("annonces_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  annonceId: varchar("annonce_id").notNull().references(() => petitesAnnonces.id, { onDelete: 'cascade' }),
  reporterId: varchar("reporter_id").notNull().references(() => users.id),
  
  // Type et détails du signalement
  reportType: reportTypeEnum("report_type").notNull(),
  reportDetails: text("report_details").notNull(),
  status: reportStatusEnum("status").default('pending'),
  
  // Résolution du signalement
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_annonces_reports_annonce").on(table.annonceId),
  index("idx_annonces_reports_reporter").on(table.reporterId),
  index("idx_annonces_reports_status").on(table.status),
  // Empêcher les signalements multiples d'un même utilisateur pour une même annonce
  unique("unique_user_annonce_report").on(table.reporterId, table.annonceId),
]);

// Transactions escrow pour paiements protégés (optionnels)
export const escrowTransactions = pgTable("escrow_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  annonceId: varchar("annonce_id").notNull().references(() => petitesAnnonces.id),
  buyerId: varchar("buyer_id").notNull().references(() => users.id),
  sellerId: varchar("seller_id").notNull().references(() => users.id),
  
  // Montants
  amountEUR: decimal("amount_eur", { precision: 10, scale: 2 }).notNull(),
  serviceFeeEUR: decimal("service_fee_eur", { precision: 10, scale: 2 }).notNull(), // 5% min 1€
  stripeFeeEUR: decimal("stripe_fee_eur", { precision: 10, scale: 2 }).notNull(),
  totalAmountEUR: decimal("total_amount_eur", { precision: 10, scale: 2 }).notNull(),
  
  // Gestion du statut
  status: escrowStatusEnum("status").default('pending'),
  description: text("description").notNull(), // Description de la prestation
  
  // IDs Stripe pour suivi
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  stripeTransferId: varchar("stripe_transfer_id"), // Transfer vers le vendeur
  
  // Délais et résolution
  deliveryExpectedAt: timestamp("delivery_expected_at"),
  releasedAt: timestamp("released_at"), // Quand libéré au vendeur
  refundedAt: timestamp("refunded_at"), // Quand remboursé à l'acheteur
  
  // Litige et médiation
  disputeReason: text("dispute_reason"),
  disputeResolvedBy: varchar("dispute_resolved_by").references(() => users.id), // Admin médiateur
  disputeResolution: text("dispute_resolution"),
  disputeResolvedAt: timestamp("dispute_resolved_at"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_escrow_transactions_annonce").on(table.annonceId),
  index("idx_escrow_transactions_buyer").on(table.buyerId),
  index("idx_escrow_transactions_seller").on(table.sellerId),
  index("idx_escrow_transactions_status").on(table.status),
  index("idx_escrow_transactions_delivery").on(table.deliveryExpectedAt),
]);

// Sanctions utilisateurs pour violations des règles petites annonces
export const annoncesSanctions = pgTable("annonces_sanctions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  annonceId: varchar("annonce_id").references(() => petitesAnnonces.id), // Peut être null pour sanctions globales
  
  // Type et durée de sanction
  sanctionType: annonceSanctionEnum("sanction_type").notNull(),
  reason: text("reason").notNull(),
  duration: integer("duration"), // Durée en heures pour suspensions temporaires
  
  // Appliquée par
  appliedBy: varchar("applied_by").notNull().references(() => users.id),
  isActive: boolean("is_active").default(true),
  
  // Dates
  appliedAt: timestamp("applied_at").defaultNow(),
  expiresAt: timestamp("expires_at"), // Calculé automatiquement pour suspensions temporaires
  liftedAt: timestamp("lifted_at"), // Si levée avant expiration
  liftedBy: varchar("lifted_by").references(() => users.id),
}, (table) => [
  index("idx_annonces_sanctions_user").on(table.userId),
  index("idx_annonces_sanctions_active").on(table.isActive, table.expiresAt),
  index("idx_annonces_sanctions_type").on(table.sanctionType),
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
  // Relations pour petites annonces
  petitesAnnonces: many(petitesAnnonces),
  annoncesModeration: many(annoncesModeration),
  annoncesReports: many(annoncesReports),
  escrowTransactionsBuyer: many(escrowTransactions, { relationName: "buyer" }),
  escrowTransactionsSeller: many(escrowTransactions, { relationName: "seller" }),
  annoncesSanctions: many(annoncesSanctions),
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

// ===== RELATIONS POUR CATÉGORIE LIVRES =====

export const bookCategoriesRelations = relations(bookCategories, ({ many }) => ({
  books: many(books),
  purchases: many(bookPurchases),
}));

export const booksRelations = relations(books, ({ one, many }) => ({
  author: one(users, {
    fields: [books.authorId],
    references: [users.id],
  }),
  category: one(bookCategories, {
    fields: [books.categoryId],
    references: [bookCategories.id],
  }),
  purchases: many(bookPurchases),
  downloadTokens: many(downloadTokens),
}));

export const bookPurchasesRelations = relations(bookPurchases, ({ one, many }) => ({
  user: one(users, {
    fields: [bookPurchases.userId],
    references: [users.id],
  }),
  book: one(books, {
    fields: [bookPurchases.bookId],
    references: [books.id],
  }),
  category: one(bookCategories, {
    fields: [bookPurchases.categoryId],
    references: [bookCategories.id],
  }),
  downloadTokens: many(downloadTokens),
}));

export const downloadTokensRelations = relations(downloadTokens, ({ one }) => ({
  purchase: one(bookPurchases, {
    fields: [downloadTokens.purchaseId],
    references: [bookPurchases.id],
  }),
  user: one(users, {
    fields: [downloadTokens.userId],
    references: [users.id],
  }),
  book: one(books, {
    fields: [downloadTokens.bookId],
    references: [books.id],
  }),
}));

// ===== RELATIONS POUR PETITES ANNONCES =====

export const petitesAnnoncesRelations = relations(petitesAnnonces, ({ one, many }) => ({
  author: one(users, {
    fields: [petitesAnnonces.authorId],
    references: [users.id],
  }),
  moderator: one(users, {
    fields: [petitesAnnonces.moderatedBy],
    references: [users.id],
  }),
  moderationHistory: many(annoncesModeration),
  reports: many(annoncesReports),
  escrowTransactions: many(escrowTransactions),
}));

export const annoncesModerationRelations = relations(annoncesModeration, ({ one }) => ({
  annonce: one(petitesAnnonces, {
    fields: [annoncesModeration.annonceId],
    references: [petitesAnnonces.id],
  }),
  moderator: one(users, {
    fields: [annoncesModeration.moderatorId],
    references: [users.id],
  }),
}));

export const annoncesReportsRelations = relations(annoncesReports, ({ one }) => ({
  annonce: one(petitesAnnonces, {
    fields: [annoncesReports.annonceId],
    references: [petitesAnnonces.id],
  }),
  reporter: one(users, {
    fields: [annoncesReports.reporterId],
    references: [users.id],
  }),
  reviewer: one(users, {
    fields: [annoncesReports.reviewedBy],
    references: [users.id],
  }),
}));

export const escrowTransactionsRelations = relations(escrowTransactions, ({ one }) => ({
  annonce: one(petitesAnnonces, {
    fields: [escrowTransactions.annonceId],
    references: [petitesAnnonces.id],
  }),
  buyer: one(users, {
    fields: [escrowTransactions.buyerId],
    references: [users.id],
    relationName: "buyer",
  }),
  seller: one(users, {
    fields: [escrowTransactions.sellerId],
    references: [users.id],
    relationName: "seller",
  }),
  disputeResolver: one(users, {
    fields: [escrowTransactions.disputeResolvedBy],
    references: [users.id],
  }),
}));

export const annoncesSanctionsRelations = relations(annoncesSanctions, ({ one }) => ({
  user: one(users, {
    fields: [annoncesSanctions.userId],
    references: [users.id],
  }),
  annonce: one(petitesAnnonces, {
    fields: [annoncesSanctions.annonceId],
    references: [petitesAnnonces.id],
  }),
  appliedBy: one(users, {
    fields: [annoncesSanctions.appliedBy],
    references: [users.id],
  }),
  liftedBy: one(users, {
    fields: [annoncesSanctions.liftedBy],
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

export const insertLiveShowSchema = createInsertSchema(liveShows).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLiveShowFinalistSchema = createInsertSchema(liveShowFinalists).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLiveShowNotificationSchema = createInsertSchema(liveShowNotifications).omit({
  id: true,
  createdAt: true,
});

export const insertLiveShowPenaltySchema = createInsertSchema(liveShowPenalties).omit({
  id: true,
  createdAt: true,
});

export const insertLiveShowAuditSchema = createInsertSchema(liveShowAudit).omit({
  id: true,
  timestamp: true,
});

export const insertLiveShowEditionSchema = createInsertSchema(liveShowEditions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLiveShowCandidateSchema = createInsertSchema(liveShowCandidates).omit({
  id: true,
  submittedAt: true,
  updatedAt: true,
});

export const insertLiveShowCommunityVoteSchema = createInsertSchema(liveShowCommunityVotes).omit({
  id: true,
  createdAt: true,
});

export const insertLiveShowBattleInvestmentSchema = createInsertSchema(liveShowBattleInvestments).omit({
  id: true,
  createdAt: true,
});

export const insertLiveShowAdSchema = createInsertSchema(liveShowAds).omit({
  id: true,
  createdAt: true,
});

// Validation schema for designating finalists
export const designateFinalistsSchema = z.object({
  finalists: z.array(z.object({
    userId: z.string().min(1, "User ID required"),
    artistName: z.string().min(1, "Artist name required").max(255),
    rank: z.number().int().min(1).max(4, "Rank must be between 1 and 4"),
    role: z.enum(['finalist', 'alternate'], { required_error: "Role must be 'finalist' or 'alternate'" })
  })).min(2, "At least 2 finalists required").max(4, "Maximum 4 finalists allowed")
});

// Validation schema for cancellation
export const cancelParticipationSchema = z.object({
  reason: z.string().optional()
});

export const insertLiveChatMessageSchema = createInsertSchema(liveChatMessages).omit({
  id: true,
  createdAt: true,
});

export const insertMessageReactionSchema = createInsertSchema(messageReactions).omit({
  id: true,
  createdAt: true,
});

export const insertLivePollSchema = createInsertSchema(livePolls).omit({
  id: true,
  createdAt: true,
});

export const insertPollVoteSchema = createInsertSchema(pollVotes).omit({
  id: true,
  createdAt: true,
});

export const insertEngagementPointSchema = createInsertSchema(engagementPoints).omit({
  id: true,
  createdAt: true,
});

export const insertUserBadgeSchema = createInsertSchema(userBadges).omit({
  id: true,
  earnedAt: true,
});

export const insertLivePredictionSchema = createInsertSchema(livePredictions).omit({
  id: true,
  createdAt: true,
});

export const insertPredictionBetSchema = createInsertSchema(predictionBets).omit({
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

export const insertArticleSchema = createInsertSchema(voixInfoArticles).omit({
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

// ===== SCHÉMAS D'INSERTION POUR CATÉGORIE LIVRES =====

export const insertBookCategorySchema = createInsertSchema(bookCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBookSchema = createInsertSchema(books).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).refine((data) => {
  // Validation des prix autorisés pour les auteurs LIVRES
  const price = parseFloat(data.unitPriceEUR);
  return [2, 3, 4, 5, 8].includes(price);
}, {
  message: "Le prix unitaire du livre doit être 2€, 3€, 4€, 5€ ou 8€",
  path: ["unitPriceEUR"],
});

export const insertBookPurchaseSchema = createInsertSchema(bookPurchases).omit({
  id: true,
  createdAt: true,
}).refine((data) => {
  // Validation des tranches d'engagement pour investi-lecteurs LIVRES
  const amount = parseFloat(data.amountEUR);
  return [2, 3, 4, 5, 6, 8, 10, 12, 15, 20].includes(amount);
}, {
  message: "Le montant d'engagement doit être entre 2€ et 20€ selon les tranches autorisées",
  path: ["amountEUR"],
}).refine((data) => {
  // Validation cohérence prix unitaire vs montant payé
  const amount = parseFloat(data.amountEUR);
  const unitPrice = parseFloat(data.unitPriceEUR);
  return amount >= unitPrice;
}, {
  message: "Le montant payé doit être supérieur ou égal au prix unitaire du livre",
  path: ["amountEUR"],
});

export const insertDownloadTokenSchema = createInsertSchema(downloadTokens).omit({
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
export type InsertLiveShow = z.infer<typeof insertLiveShowSchema>;
export type LiveShowFinalist = typeof liveShowFinalists.$inferSelect;
export type InsertLiveShowFinalist = z.infer<typeof insertLiveShowFinalistSchema>;
export type LiveShowNotification = typeof liveShowNotifications.$inferSelect;
export type InsertLiveShowNotification = z.infer<typeof insertLiveShowNotificationSchema>;
export type LiveShowPenalty = typeof liveShowPenalties.$inferSelect;
export type InsertLiveShowPenalty = z.infer<typeof insertLiveShowPenaltySchema>;
export type LiveShowAudit = typeof liveShowAudit.$inferSelect;
export type InsertLiveShowAudit = z.infer<typeof insertLiveShowAuditSchema>;
export type LiveShowEdition = typeof liveShowEditions.$inferSelect;
export type InsertLiveShowEdition = z.infer<typeof insertLiveShowEditionSchema>;
export type LiveShowCandidate = typeof liveShowCandidates.$inferSelect;
export type InsertLiveShowCandidate = z.infer<typeof insertLiveShowCandidateSchema>;
export type LiveShowCommunityVote = typeof liveShowCommunityVotes.$inferSelect;
export type InsertLiveShowCommunityVote = z.infer<typeof insertLiveShowCommunityVoteSchema>;
export type LiveShowBattleInvestment = typeof liveShowBattleInvestments.$inferSelect;
export type InsertLiveShowBattleInvestment = z.infer<typeof insertLiveShowBattleInvestmentSchema>;
export type LiveShowAd = typeof liveShowAds.$inferSelect;
export type InsertLiveShowAd = z.infer<typeof insertLiveShowAdSchema>;
export type LiveChatMessage = typeof liveChatMessages.$inferSelect;
export type MessageReaction = typeof messageReactions.$inferSelect;
export type LivePoll = typeof livePolls.$inferSelect;
export type PollVote = typeof pollVotes.$inferSelect;
export type EngagementPoint = typeof engagementPoints.$inferSelect;
export type UserBadge = typeof userBadges.$inferSelect;
export type LivePrediction = typeof livePredictions.$inferSelect;
export type PredictionBet = typeof predictionBets.$inferSelect;
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

// ===== TYPES D'INSERTION POUR CATÉGORIE LIVRES =====

export type InsertBookCategory = z.infer<typeof insertBookCategorySchema>;
export type BookCategory = typeof bookCategories.$inferSelect;

export type InsertBook = z.infer<typeof insertBookSchema>;
export type Book = typeof books.$inferSelect;

export type InsertBookPurchase = z.infer<typeof insertBookPurchaseSchema>;
export type BookPurchase = typeof bookPurchases.$inferSelect;

export type InsertDownloadToken = z.infer<typeof insertDownloadTokenSchema>;
export type DownloadToken = typeof downloadTokens.$inferSelect;

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

// ===== SYSTÈME DE DÉTECTION DE FRAUDE ET MACHINE LEARNING =====

// Énums pour le système de fraude
export const riskLevelEnum = pgEnum("risk_level", ["low", "medium", "high", "critical"]);
export const fraudTypeEnum = pgEnum("fraud_type", [
  "multi_account", "coordinated_investment", "bot_activity", "financial_fraud", 
  "vote_manipulation", "identity_theft", "suspicious_pattern", "chargeback_fraud"
]);
export const fraudActionEnum = pgEnum("fraud_action", [
  "monitor", "restrict", "suspend", "block", "investigate"
]);

// Scores de risque utilisateur - Mis à jour en temps réel par VisualAI
export const userRiskScores = pgTable("user_risk_scores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  riskScore: decimal("risk_score", { precision: 5, scale: 4 }).notNull(), // 0.0000 à 1.0000
  riskLevel: riskLevelEnum("risk_level").notNull(),
  contributingFactors: jsonb("contributing_factors").notNull(), // Détails des facteurs de risque
  lastIncidentDate: timestamp("last_incident_date"),
  incidentCount: integer("incident_count").notNull().default(0),
  falsePositiveCount: integer("false_positive_count").notNull().default(0), // Pour l'apprentissage
  adminOverride: boolean("admin_override").default(false),
  adminNotes: text("admin_notes"),
  calculatedAt: timestamp("calculated_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
}, (table) => [
  unique("unique_user_risk").on(table.userId),
  index("idx_risk_level").on(table.riskLevel),
  index("idx_risk_score").on(table.riskScore),
  index("idx_risk_updated").on(table.updatedAt)
]);

// Événements de fraude détectés
export const fraudEvents = pgTable("fraud_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventType: fraudTypeEnum("event_type").notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }),
  relatedUserIds: text("related_user_ids").array(), // IDs des comptes liés détectés
  projectId: varchar("project_id").references(() => projects.id, { onDelete: 'set null' }),
  transactionId: varchar("transaction_id"),
  
  severityScore: decimal("severity_score", { precision: 5, scale: 4 }).notNull(),
  confidence: decimal("confidence", { precision: 5, scale: 4 }).notNull(), // Confiance de la détection
  
  evidenceData: jsonb("evidence_data").notNull(), // Preuves techniques
  detectionMethod: varchar("detection_method").notNull(), // 'rule_based', 'ml_model', 'pattern_analysis'
  modelVersion: varchar("model_version"), // Version du modèle ML utilisé
  
  recommendedAction: fraudActionEnum("recommended_action").notNull(),
  actionTaken: fraudActionEnum("action_taken"),
  actionTakenBy: varchar("action_taken_by"), // 'visualai' ou 'admin:{userId}'
  actionTakenAt: timestamp("action_taken_at"),
  
  adminReviewed: boolean("admin_reviewed").default(false),
  adminVerdict: varchar("admin_verdict"), // 'confirmed', 'false_positive', 'insufficient_evidence'
  adminComment: text("admin_comment"),
  reviewedBy: varchar("reviewed_by").references(() => users.id, { onDelete: 'set null' }),
  reviewedAt: timestamp("reviewed_at"),
  
  createdAt: timestamp("created_at").defaultNow()
}, (table) => [
  index("idx_fraud_user").on(table.userId),
  index("idx_fraud_type").on(table.eventType),
  index("idx_fraud_severity").on(table.severityScore),
  index("idx_fraud_reviewed").on(table.adminReviewed),
  index("idx_fraud_created").on(table.createdAt)
]);

// Patterns comportementaux appris - Système d'apprentissage
export const behaviorPatterns = pgTable("behavior_patterns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patternType: varchar("pattern_type").notNull(), // 'investment', 'voting', 'timing', 'network'
  patternSignature: text("pattern_signature").notNull(), // Signature unique du pattern
  
  isAnomaly: boolean("is_anomaly").notNull(), // true = suspect, false = normal
  riskWeight: decimal("risk_weight", { precision: 5, scale: 4 }).notNull(), // Poids dans le calcul de risque
  
  featureVector: jsonb("feature_vector").notNull(), // Caractéristiques du pattern
  exampleInstances: jsonb("example_instances"), // Exemples de ce pattern
  
  detectionCount: integer("detection_count").notNull().default(0),
  truePositiveCount: integer("true_positive_count").notNull().default(0),
  falsePositiveCount: integer("false_positive_count").notNull().default(0),
  
  accuracy: decimal("accuracy", { precision: 5, scale: 4 }), // Précision du pattern
  lastSeenAt: timestamp("last_seen_at"),
  
  learnedFrom: varchar("learned_from"), // 'supervised', 'unsupervised', 'admin_feedback'
  modelVersion: varchar("model_version").notNull(),
  
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
}, (table) => [
  unique("unique_pattern_signature").on(table.patternSignature),
  index("idx_pattern_type_active").on(table.patternType, table.isActive),
  index("idx_pattern_anomaly").on(table.isAnomaly),
  index("idx_pattern_accuracy").on(table.accuracy)
]);

// Graphe de relations entre utilisateurs (détection multi-comptes)
export const userRelationships = pgTable("user_relationships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId1: varchar("user_id1").notNull().references(() => users.id, { onDelete: 'cascade' }),
  userId2: varchar("user_id2").notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  relationshipType: varchar("relationship_type").notNull(), // 'ip_match', 'device_match', 'timing_correlation', 'investment_pattern'
  relationshipStrength: decimal("relationship_strength", { precision: 5, scale: 4 }).notNull(), // 0-1
  
  evidenceData: jsonb("evidence_data").notNull(),
  firstDetectedAt: timestamp("first_detected_at").notNull().defaultNow(),
  lastSeenAt: timestamp("last_seen_at").notNull().defaultNow(),
  occurrenceCount: integer("occurrence_count").notNull().default(1),
  
  isSuspicious: boolean("is_suspicious").notNull().default(false),
  adminVerified: boolean("admin_verified").default(false),
  adminNotes: text("admin_notes"),
  
  createdAt: timestamp("created_at").defaultNow()
}, (table) => [
  index("idx_relationship_user1").on(table.userId1),
  index("idx_relationship_user2").on(table.userId2),
  index("idx_relationship_suspicious").on(table.isSuspicious),
  index("idx_relationship_strength").on(table.relationshipStrength)
]);

// Métadonnées des modèles ML
export const mlModels = pgTable("ml_models", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  modelName: varchar("model_name").notNull(),
  modelVersion: varchar("model_version").notNull(),
  modelType: varchar("model_type").notNull(), // 'fraud_detection', 'risk_scoring', 'pattern_recognition'
  
  trainingDataSize: integer("training_data_size"),
  trainingDate: timestamp("training_date"),
  
  performance: jsonb("performance").notNull(), // Métriques: accuracy, precision, recall, F1
  hyperparameters: jsonb("hyperparameters"),
  
  isActive: boolean("is_active").notNull().default(false),
  activatedBy: varchar("activated_by"), // 'visualai' ou 'admin:{userId}'
  activatedAt: timestamp("activated_at"),
  
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow()
}, (table) => [
  unique("unique_model_version").on(table.modelName, table.modelVersion),
  index("idx_model_active").on(table.isActive),
  index("idx_model_type").on(table.modelType)
]);

// Sessions d'apprentissage
export const learningSession = pgTable("learning_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionType: varchar("session_type").notNull(), // 'supervised', 'unsupervised', 'reinforcement'
  modelId: varchar("model_id").references(() => mlModels.id, { onDelete: 'cascade' }),
  
  dataSourceQuery: text("data_source_query"), // Requête SQL pour les données d'entraînement
  dataCount: integer("data_count"),
  
  learningMetrics: jsonb("learning_metrics").notNull(), // Métriques de la session
  patternsDiscovered: integer("patterns_discovered").default(0),
  patternsUpdated: integer("patterns_updated").default(0),
  
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  durationMs: integer("duration_ms"),
  
  status: varchar("status").notNull().default('running'), // 'running', 'completed', 'failed'
  errorMessage: text("error_message"),
  
  triggeredBy: varchar("triggered_by").notNull(), // 'schedule', 'manual', 'auto'
  notes: text("notes")
}, (table) => [
  index("idx_learning_status").on(table.status),
  index("idx_learning_completed").on(table.completedAt)
]);

// Feature toggles pour visibilité des catégories et rubriques
export const featureToggles = pgTable("feature_toggles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").unique().notNull(),
  label: text("label").notNull(),
  kind: toggleKindEnum("kind").notNull(),
  isVisible: boolean("is_visible").notNull().default(true),
  
  // Message lorsqu'off
  hiddenMessageVariant: messageVariantEnum("hidden_message_variant").notNull().default('en_cours'),
  hiddenMessageCustom: text("hidden_message_custom"),
  
  // Programmation (optionnelle)  
  scheduleStart: timestamp("schedule_start", { withTimezone: true }),
  scheduleEnd: timestamp("schedule_end", { withTimezone: true }),
  timezone: text("timezone").notNull().default('Europe/Paris'),
  
  // Métadonnées
  version: integer("version").notNull().default(1),
  updatedBy: varchar("updated_by"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  index("idx_toggles_key").on(table.key),
  index("idx_toggles_visible").on(table.isVisible)
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

// Schéma d'insertion pour feature toggles avec validation des clés
export const insertFeatureToggleSchema = createInsertSchema(featureToggles).omit({
  id: true,
  updatedAt: true
}).refine((data) => {
  // Validation des clés autorisées selon spec
  const allowedKeys = ['films', 'videos', 'documentaires', 'voix_info', 'live_show', 'livres', 'petites_annonces'];
  return allowedKeys.includes(data.key);
}, {
  message: "Clé de toggle non autorisée. Clés valides: films, videos, documentaires, voix_info, live_show, livres, petites_annonces",
  path: ["key"]
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

// Schémas d'insertion pour système de détection de fraude et ML
export const insertUserRiskScoreSchema = createInsertSchema(userRiskScores).omit({
  id: true,
  calculatedAt: true,
  updatedAt: true
});

export const insertFraudEventSchema = createInsertSchema(fraudEvents).omit({
  id: true,
  createdAt: true
});

export const insertBehaviorPatternSchema = createInsertSchema(behaviorPatterns).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertUserRelationshipSchema = createInsertSchema(userRelationships).omit({
  id: true,
  createdAt: true
});

export const insertMlModelSchema = createInsertSchema(mlModels).omit({
  id: true,
  createdAt: true
});

export const insertLearningSessionSchema = createInsertSchema(learningSession).omit({
  id: true,
  startedAt: true
});

// Types d'insertion et de sélection pour système de fraude et ML
export type InsertUserRiskScore = z.infer<typeof insertUserRiskScoreSchema>;
export type UserRiskScore = typeof userRiskScores.$inferSelect;

export type InsertFraudEvent = z.infer<typeof insertFraudEventSchema>;
export type FraudEvent = typeof fraudEvents.$inferSelect;

export type InsertBehaviorPattern = z.infer<typeof insertBehaviorPatternSchema>;
export type BehaviorPattern = typeof behaviorPatterns.$inferSelect;

export type InsertUserRelationship = z.infer<typeof insertUserRelationshipSchema>;
export type UserRelationship = typeof userRelationships.$inferSelect;

export type InsertMlModel = z.infer<typeof insertMlModelSchema>;
export type MlModel = typeof mlModels.$inferSelect;

export type InsertLearningSession = z.infer<typeof insertLearningSessionSchema>;
export type LearningSession = typeof learningSession.$inferSelect;

// Schéma d'insertion pour quêtes quotidiennes
export const insertDailyQuestSchema = createInsertSchema(dailyQuests).omit({
  id: true,
  createdAt: true
});

// Types d'insertion et de sélection pour feature toggles
export type InsertFeatureToggle = z.infer<typeof insertFeatureToggleSchema>;
export type FeatureToggle = typeof featureToggles.$inferSelect;

// Types d'insertion et de sélection pour quêtes quotidiennes
export type InsertDailyQuest = z.infer<typeof insertDailyQuestSchema>;
export type DailyQuest = typeof dailyQuests.$inferSelect;

// ===== TABLE PHOTOS POUR PETITES ANNONCES =====

// Enum pour statut de modération des photos
export const photoModerationStatusEnum = pgEnum('photo_moderation_status', ['pending', 'approved', 'rejected']);

// Table des photos d'annonces (jusqu'à 10 par annonce)
export const adPhotos = pgTable("ad_photos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adId: varchar("ad_id").notNull().references(() => petitesAnnonces.id, { onDelete: 'cascade' }),
  
  // Ordre et affichage (0-9, photo de couverture obligatoire)
  idx: integer("idx").notNull(), // Position 0-9 pour ordre drag-and-drop
  isCover: boolean("is_cover").notNull().default(false),
  alt: text("alt"), // Texte alternatif pour l'accessibilité
  
  // Stockage et métadonnées techniques
  storageKey: text("storage_key").notNull(), // Chemin dans le stockage objet
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  bytes: integer("bytes").notNull(),
  contentType: varchar("content_type").notNull(), // image/jpeg|png|webp
  sha256: varchar("sha256").notNull(), // Hash pour déduplication
  
  // Modération IA + humaine
  moderationStatus: photoModerationStatusEnum("moderation_status").default('pending'),
  moderationReason: text("moderation_reason"), // Raison du refus si rejected
  moderatedBy: varchar("moderated_by").references(() => users.id),
  moderatedAt: timestamp("moderated_at"),
  aiConfidenceScore: decimal("ai_confidence_score", { precision: 5, scale: 4 }), // Score IA NSFW/fraude
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  // Index uniques et contraintes
  unique("unique_ad_idx").on(table.adId, table.idx), // Pas de doublons d'index par annonce
  index("idx_ad_photos_ad_id").on(table.adId),
  index("idx_ad_photos_status").on(table.moderationStatus),
  // Contraintes métier critiques pour l'intégrité des données
  check("idx_range", sql`${table.idx} >= 0 AND ${table.idx} <= 9`), // Limite index 0-9 (max 10 photos)
  check("bytes_limit", sql`${table.bytes} > 0 AND ${table.bytes} <= 10485760`), // 10MB max
  // Note: unique cover constraint enforced by application logic with transactions
]);

// ===== SCHÉMAS D'INSERTION POUR PETITES ANNONCES =====

// Schéma d'insertion pour petites annonces avec validation du périmètre
export const insertPetitesAnnoncesSchema = createInsertSchema(petitesAnnonces).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  moderationDecision: true, // Sera défini par la modération
  moderatedBy: true,
  moderatedAt: true,
  viewCount: true,
  contactCount: true,
}).extend({
  // Validation obligatoire du périmètre audiovisuel/spectacle
  category: z.enum(['talents_jobs', 'services', 'lieux_tournage', 'materiel']),
  // Validation de la conformité au périmètre
  confirmsAudiovisualScope: z.boolean().refine(val => val === true, {
    message: "Vous devez confirmer que votre annonce respecte le périmètre audiovisuel/spectacle",
  }),
});

export const insertAnnoncesModerationSchema = createInsertSchema(annoncesModeration).omit({
  id: true,
  createdAt: true,
});

export const insertAnnoncesReportsSchema = createInsertSchema(annoncesReports).omit({
  id: true,
  createdAt: true,
  reviewedAt: true,
});

export const insertEscrowTransactionsSchema = createInsertSchema(escrowTransactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  releasedAt: true,
  refundedAt: true,
  disputeResolvedAt: true,
});

export const insertAnnoncesSanctionsSchema = createInsertSchema(annoncesSanctions).omit({
  id: true,
  appliedAt: true,
  liftedAt: true,
});

// ===== SCHÉMA D'INSERTION POUR PHOTOS =====

// Schéma d'insertion pour photos d'annonces avec validation
export const insertAdPhotosSchema = createInsertSchema(adPhotos).omit({
  id: true,
  createdAt: true,
  moderatedBy: true,
  moderatedAt: true,
  aiConfidenceScore: true,
  moderationReason: true
}).extend({
  // Validation du format de fichier
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  // Validation de la taille (10MB max)
  bytes: z.number().min(1).max(10485760),
  // Validation de l'index (0-9)
  idx: z.number().min(0).max(9),
  // Validation des dimensions minimales
  width: z.number().min(320),
  height: z.number().min(240),
});

// ===== NOUVELLES TABLES POUR MODERNISATION PRO =====

// Enums pour nouveaux systèmes
export const stripeEventTypeEnum = pgEnum('stripe_event_type', [
  'payment_intent.succeeded', 'payment_intent.payment_failed', 
  'checkout.session.completed', 'charge.refunded', 'payout.paid'
]);

export const twoFAStatusEnum = pgEnum('twofa_status', ['disabled', 'enabled', 'backup_only']);

export const gdprRequestTypeEnum = pgEnum('gdpr_request_type', ['export', 'deletion']);
export const gdprRequestStatusEnum = pgEnum('gdpr_request_status', ['pending', 'processing', 'completed', 'failed']);

// Stripe events pour idempotence webhooks
export const stripeEvents = pgTable("stripe_events", {
  id: text("id").primaryKey(),
  type: stripeEventTypeEnum("type").notNull(),
  processed: boolean("processed").notNull().default(false),
  data: jsonb("data"),
  receivedAt: timestamp("received_at").notNull().defaultNow(),
});

// Trail d'audit sécurisé HMAC pour nouveaux systèmes
export const securityAuditLog = pgTable("security_audit_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  actorId: varchar("actor_id").notNull(),
  actionType: varchar("action_type").notNull(),
  resourceType: varchar("resource_type").notNull(),
  resourceId: varchar("resource_id"),
  details: jsonb("details"),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  hmacSignature: text("hmac_signature").notNull(),
}, (table) => [
  index("idx_security_audit_timestamp").on(table.timestamp),
  index("idx_security_audit_actor").on(table.actorId),
  index("idx_security_audit_action").on(table.actionType),
]);

// 2FA TOTP pour authentification renforcée  
export const user2FA = pgTable("user_2fa", {
  userId: varchar("user_id").primaryKey(),
  totpSecret: text("totp_secret").notNull(),
  backupCodes: text("backup_codes").array().notNull().default(sql`'{}'`),
  status: twoFAStatusEnum("status").notNull().default('disabled'),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastUsedAt: timestamp("last_used_at"),
});

// Requêtes RGPD export/suppression
export const gdprRequests = pgTable("gdpr_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  requestType: gdprRequestTypeEnum("request_type").notNull(),
  status: gdprRequestStatusEnum("status").notNull().default('pending'),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  filePath: text("file_path"),
  expiryDate: timestamp("expiry_date"),
}, (table) => [
  index("idx_gdpr_user").on(table.userId),
  index("idx_gdpr_status").on(table.status),
]);

// OTPs temporaires pour accès admin d'urgence (break-glass)
export const adminBreakGlassOtpStatusEnum = pgEnum('admin_otp_status', ['active', 'used', 'expired']);

export const adminBreakGlassOtp = pgTable("admin_break_glass_otp", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  otpCode: varchar("otp_code", { length: 64 }).notNull().unique(), // SHA-256 = 64 chars
  email: varchar("email").notNull(), // Email de l'admin qui peut l'utiliser
  status: adminBreakGlassOtpStatusEnum("status").notNull().default('active'),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  usedAt: timestamp("used_at"),
  usedBy: varchar("used_by"), // User ID qui a utilisé l'OTP
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
}, (table) => [
  index("idx_admin_otp_status").on(table.status),
  index("idx_admin_otp_expires").on(table.expiresAt),
]);

// ===== MODULE LIVRES NUMÉRIQUES (EBOOKS) AVEC LICENCES JWT ET ANTI-PIRATAGE =====

// Enums pour le système de ebooks
export const ebookStatusEnum = pgEnum('ebook_status', ['draft', 'published', 'archived']);
export const ebookFormatEnum = pgEnum('ebook_format', ['pdf', 'epub', 'mobi']);
export const ebookLicenseStatusEnum = pgEnum('ebook_license_status', ['active', 'revoked', 'expired']);
export const ebookDlAttemptStatusEnum = pgEnum('ebook_dl_attempt_status', ['pending', 'success', 'expired', 'failed']);

// Table des livres numériques (catalogue)
export const ebooks = pgTable("ebooks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 255 }).notNull(),
  author: varchar("author", { length: 255 }).notNull(),
  description: text("description"),
  coverImageUrl: text("cover_image_url"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(), // Prix en euros
  format: ebookFormatEnum("format").notNull().default('pdf'),
  fileSize: integer("file_size"), // Taille en octets
  storageKey: text("storage_key").notNull(), // Clé dans le stockage objet (Bunny/S3)
  status: ebookStatusEnum("status").notNull().default('draft'),
  categoryId: varchar("category_id"), // Catégorie VISUAL (peut lier à projects)
  isbn: varchar("isbn", { length: 20 }),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_ebooks_status").on(table.status),
  index("idx_ebooks_category").on(table.categoryId),
]);

// Table des licences (JWT) - une par achat de ebook
export const ebookLicenses = pgTable("ebook_licenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(), // Propriétaire de la licence
  ebookId: varchar("ebook_id").notNull(), // Ebook acheté
  orderId: varchar("order_id"), // Référence commande Stripe
  status: ebookLicenseStatusEnum("status").notNull().default('active'),
  // Quotas de téléchargement
  dlLimit: integer("dl_limit").notNull().default(3), // Max téléchargements
  dlUsed: integer("dl_used").notNull().default(0), // Téléchargements consommés
  windowDays: integer("window_days").notNull().default(7), // Fenêtre de quota (jours)
  windowStartAt: timestamp("window_start_at").notNull().defaultNow(),
  // Watermark info (pour personnalisation)
  watermarkData: jsonb("watermark_data"), // {email_hash, order_id, date}
  // JWT tracking
  jwtIssued: integer("jwt_issued").notNull().default(0), // Nombre de JWT émis
  lastJwtAt: timestamp("last_jwt_at"), // Dernier JWT généré
  // Métadonnées
  createdAt: timestamp("created_at").notNull().defaultNow(),
  revokedAt: timestamp("revoked_at"),
  revokedReason: text("revoked_reason"),
}, (table) => [
  index("idx_ebook_licenses_user").on(table.userId),
  index("idx_ebook_licenses_ebook").on(table.ebookId),
  index("idx_ebook_licenses_status").on(table.status),
  unique("unique_user_ebook_order").on(table.userId, table.ebookId, table.orderId),
]);

// Table des tentatives de téléchargement (tracking + anti-abus)
export const ebookDownloadAttempts = pgTable("ebook_download_attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  licenseId: varchar("license_id").notNull(), // Licence utilisée
  userId: varchar("user_id").notNull(), // Utilisateur (redondant pour perf)
  ebookId: varchar("ebook_id").notNull(), // Ebook (redondant pour perf)
  status: ebookDlAttemptStatusEnum("status").notNull().default('pending'),
  nonce: varchar("nonce", { length: 32 }).notNull().unique(), // Nonce pour URL signée
  jwtToken: text("jwt_token").notNull(), // JWT RS256 pour vérification
  jwtJti: varchar("jwt_jti", { length: 32 }).notNull().unique(), // JWT ID pour anti-replay
  // Tracking
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(), // Expiration tentative (2-5 min)
  completedAt: timestamp("completed_at"), // Confirmation CDN/beacon
  // Métadonnées audit
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  cdnResponse: integer("cdn_response"), // Code HTTP CDN (200, 404, etc.)
  errorMessage: text("error_message"),
}, (table) => [
  index("idx_ebook_dl_attempts_license").on(table.licenseId),
  index("idx_ebook_dl_attempts_status").on(table.status),
  index("idx_ebook_dl_attempts_created").on(table.createdAt),
  index("idx_ebook_dl_attempts_nonce").on(table.nonce),
]);

// Insert schemas
export const insertEbookSchema = createInsertSchema(ebooks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEbookLicenseSchema = createInsertSchema(ebookLicenses).omit({
  id: true,
  createdAt: true,
  revokedAt: true,
});

export const insertEbookDownloadAttemptSchema = createInsertSchema(ebookDownloadAttempts).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

// Types
export type Ebook = typeof ebooks.$inferSelect;
export type EbookLicense = typeof ebookLicenses.$inferSelect;
export type EbookDownloadAttempt = typeof ebookDownloadAttempts.$inferSelect;

export type InsertEbook = z.infer<typeof insertEbookSchema>;
export type InsertEbookLicense = z.infer<typeof insertEbookLicenseSchema>;
export type InsertEbookDownloadAttempt = z.infer<typeof insertEbookDownloadAttemptSchema>;

// ===== SCHÉMAS D'INSERTION PRO =====

export const insertStripeEventsSchema = createInsertSchema(stripeEvents).omit({
  receivedAt: true,
});

export const insertSecurityAuditLogSchema = createInsertSchema(securityAuditLog).omit({
  id: true,
  timestamp: true,
});

export const insertUser2FASchema = createInsertSchema(user2FA).omit({
  createdAt: true,
  lastUsedAt: true,
});

export const insertGdprRequestsSchema = createInsertSchema(gdprRequests).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertAdminBreakGlassOtpSchema = createInsertSchema(adminBreakGlassOtp).omit({
  id: true,
  createdAt: true,
  usedAt: true,
});

// ===== TYPES POUR PETITES ANNONCES =====

// Types d'insertion
export type InsertPetitesAnnonces = z.infer<typeof insertPetitesAnnoncesSchema>;
export type InsertAnnoncesModeration = z.infer<typeof insertAnnoncesModerationSchema>;
export type InsertAnnoncesReports = z.infer<typeof insertAnnoncesReportsSchema>;
export type InsertEscrowTransactions = z.infer<typeof insertEscrowTransactionsSchema>;
export type InsertAnnoncesSanctions = z.infer<typeof insertAnnoncesSanctionsSchema>;
export type InsertAdPhotos = z.infer<typeof insertAdPhotosSchema>;

// Types d'insertion PRO
export type InsertStripeEvents = z.infer<typeof insertStripeEventsSchema>;
export type InsertSecurityAuditLog = z.infer<typeof insertSecurityAuditLogSchema>;
export type InsertUser2FA = z.infer<typeof insertUser2FASchema>;
export type InsertGdprRequests = z.infer<typeof insertGdprRequestsSchema>;
export type InsertAdminBreakGlassOtp = z.infer<typeof insertAdminBreakGlassOtpSchema>;

// Types de sélection
export type PetitesAnnonces = typeof petitesAnnonces.$inferSelect;
export type AnnoncesModeration = typeof annoncesModeration.$inferSelect;
export type AnnoncesReports = typeof annoncesReports.$inferSelect;
export type EscrowTransactions = typeof escrowTransactions.$inferSelect;
export type AnnoncesSanctions = typeof annoncesSanctions.$inferSelect;
export type AdPhotos = typeof adPhotos.$inferSelect;

// Types de sélection PRO
export type StripeEvents = typeof stripeEvents.$inferSelect;
export type SecurityAuditLog = typeof securityAuditLog.$inferSelect;
export type User2FA = typeof user2FA.$inferSelect;
export type GdprRequests = typeof gdprRequests.$inferSelect;
export type AdminBreakGlassOtp = typeof adminBreakGlassOtp.$inferSelect;

// ===== SYSTÈME VISUALSCOUTAI - PROSPECTION ÉTHIQUE =====

// Enums pour VisualScoutAI
export const tcSegmentStatusEnum = pgEnum('tc_segment_status', ['active', 'paused']);
export const tcCampaignChannelEnum = pgEnum('tc_campaign_channel', ['meta_ads', 'tiktok_ads', 'youtube_ads', 'x_ads', 'seo_content']);
export const tcCampaignObjectiveEnum = pgEnum('tc_campaign_objective', ['traffic', 'video_views', 'leads']);
export const tcCampaignStatusEnum = pgEnum('tc_campaign_status', ['draft', 'active', 'paused', 'stopped', 'archived']);
export const tcCreativeStatusEnum = pgEnum('tc_creative_status', ['draft', 'approved', 'rejected', 'running']);
export const tcConsentSourceEnum = pgEnum('tc_consent_source', ['form', 'lead_ads', 'import']);

// Table des signaux agrégés des réseaux sociaux
export const tcSignals = pgTable("tc_signals", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  platform: text("platform").notNull(), // meta, tiktok, youtube, x, reddit
  keyword: text("keyword"),
  hashtag: text("hashtag"),
  lang: text("lang"), // fr, en, es
  ts: timestamp("ts").notNull(),
  engagementJson: jsonb("engagement_json").notNull(), // counts agrégés uniquement
  sampleUrlHash: text("sample_url_hash"), // hash SHA-256, pas d'URL brute
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_tc_signals_platform_ts").on(table.platform, table.ts),
  index("idx_tc_signals_keyword").on(table.keyword),
  index("idx_tc_signals_lang").on(table.lang),
]);

// Table des segments d'audience
export const tcSegments = pgTable("tc_segments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  rules: jsonb("rules").notNull(), // {keywords:[...], lang:["fr"], zones:[...]}
  locale: text("locale").notNull(),
  status: tcSegmentStatusEnum("status").notNull().default('active'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_tc_segments_status").on(table.status),
  index("idx_tc_segments_locale").on(table.locale),
]);

// Table des scores d'intérêt par segment
export const tcScores = pgTable("tc_scores", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  segmentId: varchar("segment_id").references(() => tcSegments.id, { onDelete: 'cascade' }),
  window: text("window").notNull(), // "last_7d"
  interestScoreAvg: decimal("interest_score_avg", { precision: 5, scale: 2 }).notNull(),
  ctrPred: decimal("ctr_pred", { precision: 5, scale: 2 }),
  cvrPred: decimal("cvr_pred", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_tc_scores_segment").on(table.segmentId),
  index("idx_tc_scores_created").on(table.createdAt),
]);

// Table des campagnes d'activation
export const tcCampaigns = pgTable("tc_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  channel: tcCampaignChannelEnum("channel").notNull(),
  objective: tcCampaignObjectiveEnum("objective").notNull(),
  budgetCents: bigint("budget_cents", { mode: "number" }).notNull(),
  currency: text("currency").notNull().default('EUR'),
  startAt: timestamp("start_at"),
  endAt: timestamp("end_at"),
  status: tcCampaignStatusEnum("status").notNull().default('draft'),
  segmentId: varchar("segment_id").references(() => tcSegments.id, { onDelete: 'set null' }),
  kpiJson: jsonb("kpi_json"), // KPIs actuels de la campagne
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_tc_campaigns_status").on(table.status),
  index("idx_tc_campaigns_channel").on(table.channel),
  index("idx_tc_campaigns_segment").on(table.segmentId),
]);

// Table des créatifs pour campagnes
export const tcCreatives = pgTable("tc_creatives", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").references(() => tcCampaigns.id, { onDelete: 'cascade' }),
  locale: text("locale").notNull(),
  copy: text("copy").notNull(),
  assetRef: text("asset_ref"), // Référence à l'asset (image/video)
  kpiJson: jsonb("kpi_json"), // KPIs spécifiques au créatif
  status: tcCreativeStatusEnum("status").notNull().default('draft'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_tc_creatives_campaign").on(table.campaignId),
  index("idx_tc_creatives_status").on(table.status),
]);

// Table des leads opt-in avec consentement
export const tcConsentLeads = pgTable("tc_consent_leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  source: tcConsentSourceEnum("source").notNull(),
  emailHash: text("email_hash").unique(), // SHA-256
  consentTs: timestamp("consent_ts").notNull(),
  locale: text("locale"),
  topics: text("topics").array(), // Sujets d'intérêt
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_tc_consent_source").on(table.source),
  index("idx_tc_consent_locale").on(table.locale),
]);

// ===== RELATIONS VISUALSCOUTAI =====

export const tcSegmentsRelations = relations(tcSegments, ({ many }) => ({
  scores: many(tcScores),
  campaigns: many(tcCampaigns),
}));

export const tcScoresRelations = relations(tcScores, ({ one }) => ({
  segment: one(tcSegments, {
    fields: [tcScores.segmentId],
    references: [tcSegments.id],
  }),
}));

export const tcCampaignsRelations = relations(tcCampaigns, ({ one, many }) => ({
  segment: one(tcSegments, {
    fields: [tcCampaigns.segmentId],
    references: [tcSegments.id],
  }),
  creatives: many(tcCreatives),
}));

export const tcCreativesRelations = relations(tcCreatives, ({ one }) => ({
  campaign: one(tcCampaigns, {
    fields: [tcCreatives.campaignId],
    references: [tcCampaigns.id],
  }),
}));

// ===== SCHÉMAS D'INSERTION VISUALSCOUTAI =====

export const insertTcSignalSchema = createInsertSchema(tcSignals).omit({
  id: true,
  createdAt: true,
});

export const insertTcSegmentSchema = createInsertSchema(tcSegments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTcScoreSchema = createInsertSchema(tcScores).omit({
  id: true,
  createdAt: true,
});

export const insertTcCampaignSchema = createInsertSchema(tcCampaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTcCreativeSchema = createInsertSchema(tcCreatives).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTcConsentLeadSchema = createInsertSchema(tcConsentLeads).omit({
  id: true,
  createdAt: true,
});

// ===== TYPES VISUALSCOUTAI =====

// Types d'insertion
export type InsertTcSignal = z.infer<typeof insertTcSignalSchema>;
export type InsertTcSegment = z.infer<typeof insertTcSegmentSchema>;
export type InsertTcScore = z.infer<typeof insertTcScoreSchema>;
export type InsertTcCampaign = z.infer<typeof insertTcCampaignSchema>;
export type InsertTcCreative = z.infer<typeof insertTcCreativeSchema>;
export type InsertTcConsentLead = z.infer<typeof insertTcConsentLeadSchema>;

// Types de sélection
export type TcSignal = typeof tcSignals.$inferSelect;
export type TcSegment = typeof tcSegments.$inferSelect;
export type TcScore = typeof tcScores.$inferSelect;
export type TcCampaign = typeof tcCampaigns.$inferSelect;
export type TcCreative = typeof tcCreatives.$inferSelect;
export type TcConsentLead = typeof tcConsentLeads.$inferSelect;

// ===== SEO MODULE =====
// Managed by VisualScoutAI under VisualAI supervision, Admin has full control

// SEO page type enum
export const seoPageTypeEnum = pgEnum('seo_page_type', [
  'home',
  'project',
  'projects_list',
  'live_show',
  'about',
  'blog',
  'social_post',
  'custom'
]);

// SEO generation status enum
export const seoStatusEnum = pgEnum('seo_status', ['draft', 'active', 'archived', 'ai_generated', 'admin_override']);

// Global SEO configuration table (managed by Admin, suggested by VisualScoutAI)
export const seoConfig = pgTable("seo_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  siteName: varchar("site_name", { length: 100 }).notNull().default('VISUAL'),
  siteUrl: varchar("site_url", { length: 255 }).notNull().default('https://visual-platform.replit.app'),
  defaultLocale: varchar("default_locale", { length: 5 }).notNull().default('fr'),
  supportedLocales: text("supported_locales").array().notNull().default(sql`ARRAY['fr', 'en', 'es']`),
  ogImageDefault: varchar("og_image_default", { length: 500 }),
  twitterHandle: varchar("twitter_handle", { length: 50 }),
  organizationSchema: jsonb("organization_schema"), // Schema.org Organization markup
  enableSitemap: boolean("enable_sitemap").default(true),
  enableRobotsTxt: boolean("enable_robots_txt").default(true),
  aiGenerationEnabled: boolean("ai_generation_enabled").default(true), // VisualScoutAI auto-generation
  visualAIOverride: boolean("visual_ai_override").default(false), // VisualAI can override VisualScoutAI
  adminOverrideAll: boolean("admin_override_all").default(true), // Admin always wins
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Page-specific metadata table (managed by VisualScoutAI, overridable by Admin)
export const pageMetadata = pgTable("page_metadata", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pageType: seoPageTypeEnum("page_type").notNull(),
  pageSlug: varchar("page_slug", { length: 255 }).notNull(), // e.g., "/projects/123", "/live-show"
  locale: varchar("locale", { length: 5 }).notNull().default('fr'),
  
  // SEO Meta Tags
  title: varchar("title", { length: 160 }).notNull(),
  description: text("description").notNull(),
  keywords: text("keywords").array(),
  canonicalUrl: varchar("canonical_url", { length: 500 }),
  
  // Open Graph Tags
  ogTitle: varchar("og_title", { length: 160 }),
  ogDescription: text("og_description"),
  ogImage: varchar("og_image", { length: 500 }),
  ogType: varchar("og_type", { length: 50 }).default('website'),
  
  // Twitter Card Tags
  twitterCard: varchar("twitter_card", { length: 50 }).default('summary_large_image'),
  twitterTitle: varchar("twitter_title", { length: 160 }),
  twitterDescription: text("twitter_description"),
  twitterImage: varchar("twitter_image", { length: 500 }),
  
  // Schema.org structured data
  schemaMarkup: jsonb("schema_markup"),
  
  // Management
  status: seoStatusEnum("status").notNull().default('draft'),
  generatedBy: varchar("generated_by", { length: 50 }), // 'admin', 'visualscoutai', 'visualai', 'manual'
  adminApproved: boolean("admin_approved").default(false),
  visualAIApproved: boolean("visual_ai_approved").default(false),
  
  // Metrics
  viewCount: integer("view_count").default(0),
  clickRate: decimal("click_rate", { precision: 5, scale: 2 }),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_page_metadata_slug").on(table.pageSlug),
  index("idx_page_metadata_type").on(table.pageType),
  index("idx_page_metadata_locale").on(table.locale),
  index("idx_page_metadata_status").on(table.status),
  unique("unique_page_locale").on(table.pageSlug, table.locale),
]);

// SEO generation logs (VisualScoutAI activity tracking)
export const seoGenerationLogs = pgTable("seo_generation_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pageMetadataId: varchar("page_metadata_id").references(() => pageMetadata.id, { onDelete: 'cascade' }),
  action: varchar("action", { length: 50 }).notNull(), // 'generated', 'updated', 'approved', 'rejected'
  performedBy: varchar("performed_by", { length: 50 }).notNull(), // 'visualscoutai', 'visualai', 'admin'
  previousData: jsonb("previous_data"),
  newData: jsonb("new_data"),
  aiReasoning: text("ai_reasoning"), // Why VisualScoutAI made this decision
  approvalStatus: varchar("approval_status", { length: 50 }).default('pending'),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_seo_logs_page").on(table.pageMetadataId),
  index("idx_seo_logs_action").on(table.action),
  index("idx_seo_logs_performer").on(table.performedBy),
]);

// ===== RELATIONS SEO =====

export const pageMetadataRelations = relations(pageMetadata, ({ many }) => ({
  generationLogs: many(seoGenerationLogs),
}));

export const seoGenerationLogsRelations = relations(seoGenerationLogs, ({ one }) => ({
  pageMetadata: one(pageMetadata, {
    fields: [seoGenerationLogs.pageMetadataId],
    references: [pageMetadata.id],
  }),
}));

// ===== PROJECT MONTHLY RANKINGS (Leaderboard & Replay) =====

// Table pour le classement mensuel des projets avec historique
export const projectMonthlyRankings = pgTable("project_monthly_rankings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id),
  monthYear: varchar("month_year", { length: 7 }).notNull(), // "2025-10" format
  rank: integer("rank").notNull(), // Position dans le classement
  
  // Métriques du mois
  totalInvestedEUR: decimal("total_invested_eur", { precision: 12, scale: 2 }).default('0.00'),
  investorCount: integer("investor_count").default(0),
  avgRoi: decimal("avg_roi", { precision: 5, scale: 2 }).default('0.00'),
  visuPointsGenerated: integer("visu_points_generated").default(0),
  
  // Métriques de performance comparatives
  growthRate: decimal("growth_rate", { precision: 5, scale: 2 }).default('0.00'), // % croissance vs mois précédent
  engagementScore: integer("engagement_score").default(0), // Score d'engagement (vues, partages, etc.)
  successScore: integer("success_score").default(0), // Score global de succès (0-100)
  
  // Données pour graphiques
  dailyInvestments: jsonb("daily_investments"), // [{day: 1, amount: 100}, ...] pour graphique
  investorGrowth: jsonb("investor_growth"), // [{day: 1, count: 5}, ...] pour graphique
  
  // Awards et badges
  isTopPerformer: boolean("is_top_performer").default(false), // Top 3
  badge: varchar("badge", { length: 50 }), // 'gold', 'silver', 'bronze', 'rising_star', etc.
  
  // Métadonnées
  snapshotDate: timestamp("snapshot_date").defaultNow(), // Date de capture du classement
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_project_rankings_month").on(table.monthYear),
  index("idx_project_rankings_project").on(table.projectId),
  index("idx_project_rankings_rank").on(table.rank),
  unique("unique_project_month_ranking").on(table.projectId, table.monthYear),
]);

// ===== SCHÉMAS D'INSERTION SEO =====

export const insertSeoConfigSchema = createInsertSchema(seoConfig).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPageMetadataSchema = createInsertSchema(pageMetadata).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSeoGenerationLogSchema = createInsertSchema(seoGenerationLogs).omit({
  id: true,
  createdAt: true,
});

// ===== TYPES SEO =====

export type InsertSeoConfig = z.infer<typeof insertSeoConfigSchema>;
export type InsertPageMetadata = z.infer<typeof insertPageMetadataSchema>;
export type InsertSeoGenerationLog = z.infer<typeof insertSeoGenerationLogSchema>;

export type SeoConfig = typeof seoConfig.$inferSelect;
export type PageMetadata = typeof pageMetadata.$inferSelect;
export type SeoGenerationLog = typeof seoGenerationLogs.$inferSelect;

// ===== TYPES ET SCHÉMAS LEADERBOARD =====

export const insertProjectMonthlyRankingSchema = createInsertSchema(projectMonthlyRankings).omit({
  id: true,
  createdAt: true,
});

export type ProjectMonthlyRanking = typeof projectMonthlyRankings.$inferSelect;
export type InsertProjectMonthlyRanking = z.infer<typeof insertProjectMonthlyRankingSchema>;

// ===== MESSAGERIE INTERNE SCHEMAS =====

export const insertInternalMessageSchema = createInsertSchema(internalMessages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  handledAt: true,
  emailSentAt: true,
}).extend({
  message: z.string().min(10, "Le message doit contenir au moins 10 caractères").max(2000, "Le message ne peut pas dépasser 2000 caractères"),
  subjectCustom: z.string().optional(),
});

export const insertMessageRateLimitSchema = createInsertSchema(messageRateLimit).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFloatingButtonConfigSchema = createInsertSchema(floatingButtonConfig).omit({
  id: true,
  updatedAt: true,
});

// Update internal message schema (for admin use)
export const updateInternalMessageSchema = z.object({
  status: z.enum(['unread', 'read', 'in_progress', 'resolved', 'archived']).optional(),
  adminNotes: z.string().optional(),
  handledBy: z.string().optional(),
});

// ===== MESSAGERIE INTERNE TYPES =====

export type InternalMessage = typeof internalMessages.$inferSelect;
export type InsertInternalMessage = z.infer<typeof insertInternalMessageSchema>;
export type UpdateInternalMessage = z.infer<typeof updateInternalMessageSchema>;

export type MessageRateLimit = typeof messageRateLimit.$inferSelect;
export type InsertMessageRateLimit = z.infer<typeof insertMessageRateLimitSchema>;

export type FloatingButtonConfig = typeof floatingButtonConfig.$inferSelect;
export type InsertFloatingButtonConfig = z.infer<typeof insertFloatingButtonConfigSchema>;

// ===== VOIX DE L'INFO SCHEMAS =====

// Infoporteur profile schemas
export const insertInfoporteurProfileSchema = createInsertSchema(infoporteurProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  displayName: z.string().min(2, "Le nom d'affichage doit contenir au moins 2 caractères").max(100),
  bio: z.string().max(500, "La bio ne peut pas dépasser 500 caractères").optional(),
  specialties: z.string().optional(),
});

// Investi-lecteur profile schemas  
export const insertInvestiLecteurProfileSchema = createInsertSchema(investiLecteurProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  displayName: z.string().min(2, "Le nom d'affichage doit contenir au moins 2 caractères").max(100),
});

// Article schemas
export const insertArticleSchema = createInsertSchema(voixInfoArticles).omit({
  id: true,
  slug: true,
  createdAt: true,
  updatedAt: true,
  publishedAt: true,
  totalSales: true,
  totalRevenue: true,
}).extend({
  title: z.string().min(10, "Le titre doit contenir au moins 10 caractères").max(200),
  excerpt: z.string().max(500, "L'extrait ne peut pas dépasser 500 caractères").optional(),
  content: z.string().min(100, "Le contenu doit contenir au moins 100 caractères"),
  priceEuros: z.number().refine(val => [0.2, 0.5, 1, 2, 3, 4, 5].includes(val), {
    message: "Prix autorisés : 0.2, 0.5, 1, 2, 3, 4, 5 euros"
  }),
  tags: z.string().optional(),
});

export const updateArticleSchema = createInsertSchema(voixInfoArticles).omit({
  id: true,
  infoporteurId: true,
  slug: true,
  createdAt: true,
  totalSales: true,
  totalRevenue: true,
}).partial();

// Article purchase schema
export const insertArticlePurchaseSchema = createInsertSchema(articlePurchases).omit({
  id: true,
  votes: true,
  createdAt: true,
  refunded: true,
  refundedAt: true,
  refundAmount: true,
}).extend({
  priceEuros: z.number().min(0.2).max(10),
  visuPointsSpent: z.number().min(20).max(1000),
});

// Golden ticket schema
export const insertGoldenTicketSchema = createInsertSchema(goldenTickets).omit({
  id: true,
  votes: true,
  finalRank: true,
  refundPercentage: true,
  refundAmount: true,
  status: true,
  refundedAt: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  tier: z.number().int().min(1).max(3, "Tier doit être 1, 2, ou 3"),
  amountEuros: z.number().refine(val => [50, 75, 100].includes(val), {
    message: "Montants autorisés : 50, 75, 100 euros"
  }),
  visuPointsSpent: z.number().refine(val => [5000, 7500, 10000].includes(val), {
    message: "VISUpoints requis : 5000, 7500, 10000"
  }),
});

// VISUpoints transaction schema
export const insertVisuPointsTransactionSchema = createInsertSchema(visuPointsTransactions).omit({
  id: true,
  balanceBefore: true,
  balanceAfter: true,
  createdAt: true,
}).extend({
  amount: z.number().int(),
  euroAmount: z.number().optional(),
  description: z.string().min(1, "Description requise"),
  relatedId: z.string().optional(),
  relatedType: z.string().optional(),
});

// VISUpoints pack schema
export const visuPointsPackSchema = z.object({
  packEuros: z.number().refine(val => [5, 10, 20].includes(val), {
    message: "Packs disponibles : 5, 10, 20 euros"
  }),
  visuPoints: z.number().refine(val => [500, 1000, 2000].includes(val), {
    message: "VISUpoints : 500, 1000, 2000"
  }),
});

// ===== VOIX DE L'INFO TYPES =====

export type InfoporteurProfile = typeof infoporteurProfiles.$inferSelect;
export type InsertInfoporteurProfile = z.infer<typeof insertInfoporteurProfileSchema>;

export type InvestiLecteurProfile = typeof investiLecteurProfiles.$inferSelect;
export type InsertInvestiLecteurProfile = z.infer<typeof insertInvestiLecteurProfileSchema>;

export type VoixInfoArticle = typeof voixInfoArticles.$inferSelect;
export type InsertVoixInfoArticle = z.infer<typeof insertArticleSchema>;
export type UpdateVoixInfoArticle = z.infer<typeof updateArticleSchema>;

export type ArticlePurchase = typeof articlePurchases.$inferSelect;
export type InsertArticlePurchase = z.infer<typeof insertArticlePurchaseSchema>;

export type DailyRanking = typeof dailyRankings.$inferSelect;
export type DailyPotDistribution = typeof dailyPotDistribution.$inferSelect;

export type GoldenTicket = typeof goldenTickets.$inferSelect;
export type InsertGoldenTicket = z.infer<typeof insertGoldenTicketSchema>;

export type VisuPointsTransaction = typeof visuPointsTransactions.$inferSelect;
export type InsertVisuPointsTransaction = z.infer<typeof insertVisuPointsTransactionSchema>;

export type VisuPointsPack = z.infer<typeof visuPointsPackSchema>;
