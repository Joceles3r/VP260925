// Additional shared types for VISUAL platform

import type { 
  User, 
  Project, 
  Investment, 
  Transaction,
  SocialPost,
  ContentReport,
  Notification,
  LiveShow
} from './schema';

// API Response types
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
  success: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Authentication types
export interface AuthUser extends User {
  firstName: string;
  lastName: string;
  email: string;
  profileImageUrl?: string;
  isAdmin: boolean;
  isCreator: boolean;
}

export interface LoginResponse extends ApiResponse<AuthUser> {
  redirectUrl?: string;
}

// Project related types
export interface ProjectWithCreator extends Project {
  creator: Pick<User, 'id' | 'firstName' | 'lastName' | 'profileImageUrl'>;
  isInvested?: boolean;
  userInvestment?: Investment;
}

export interface ProjectStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalFunding: number;
  averageFunding: number;
}

// Investment types
export interface InvestmentWithProject extends Investment {
  project: Pick<Project, 'id' | 'title' | 'category' | 'status' | 'thumbnailUrl'>;
}

export interface InvestmentStats {
  totalInvestments: number;
  totalAmount: number;
  totalROI: number;
  averageROI: number;
  topPerformingProject?: string;
}

export interface InvestmentRequest {
  projectId: string;
  amount: number;
  paymentMethodId?: string;
}

// Portfolio types
export interface PortfolioSummary {
  totalInvested: number;
  currentValue: number;
  totalROI: number;
  totalGains: number;
  investmentCount: number;
  topPerformer: {
    projectTitle: string;
    roi: number;
  } | null;
}

export interface PortfolioProject {
  projectId: string;
  projectTitle: string;
  category: string;
  investedAmount: number;
  currentValue: number;
  roi: number;
  status: string;
  investmentDate: string;
}

// Social types
export interface SocialPostWithAuthor extends SocialPost {
  author: Pick<User, 'id' | 'firstName' | 'lastName' | 'profileImageUrl'>;
  isLiked?: boolean;
  canEdit?: boolean;
}

export interface CreateSocialPostRequest {
  content: string;
  imageUrl?: string;
}

// Live streaming types
export interface LiveShowWithStats extends LiveShow {
  totalInvestments: number;
  winningArtist?: 'A' | 'B' | null;
}

export interface BattleInvestment {
  showId: string;
  artist: 'A' | 'B';
  amount: number;
}

// Notification types
export interface NotificationWithProject extends Notification {
  project?: Pick<Project, 'id' | 'title' | 'thumbnailUrl'>;
}

// Admin types
export interface AdminStats {
  users: {
    total: number;
    verified: number;
    active: number;
  };
  projects: {
    pending: number;
    active: number;
    completed: number;
  };
  transactions: {
    volume: number;
    count: number;
    commission: number;
  };
  reports: {
    pending: number;
    resolved: number;
  };
}

export interface UserManagement extends User {
  investmentCount: number;
  projectCount: number;
  lastActivity: string;
}

// Content moderation types
export interface ContentReportWithReporter extends ContentReport {
  reporter: Pick<User, 'id' | 'firstName' | 'lastName'>;
  validator?: Pick<User, 'id' | 'firstName' | 'lastName'>;
}

export interface ModerationAction {
  reportId: string;
  action: 'validate' | 'reject' | 'abusive';
  adminNotes?: string;
}

// File upload types
export interface FileUploadResponse extends ApiResponse<{
  url: string;
  filename: string;
  size: number;
}> {}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

// Payment types
export interface PaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: string;
}

export interface PaymentMethod {
  id: string;
  type: string;
  last4?: string;
  expiryMonth?: number;
  expiryYear?: number;
  brand?: string;
}

// Stripe webhook types
export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
  created: number;
}

// Analytics types
export interface AnalyticsData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
  }[];
}

export interface MetricsCard {
  title: string;
  value: string | number;
  change?: {
    value: number;
    positive: boolean;
  };
  icon?: string;
}

// Search and filter types
export interface SearchFilters {
  category?: string;
  status?: string;
  minAmount?: number;
  maxAmount?: number;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResults<T> {
  items: T[];
  totalCount: number;
  filters: SearchFilters;
}

// WebSocket types
export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: number;
  userId?: string;
}

export interface LiveUpdate {
  type: 'investment' | 'vote' | 'comment' | 'battle_result';
  data: any;
}

// Error types
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ApiError extends Error {
  status: number;
  code: string;
  details?: ValidationError[];
}

// Configuration types
export interface AppConfig {
  stripe: {
    publicKey: string;
    testMode: boolean;
  };
  features: {
    liveStreaming: boolean;
    socialNetwork: boolean;
    contentReporting: boolean;
    mlScoring: boolean;
  };
  limits: {
    maxInvestmentAmount: number;
    minInvestmentAmount: number;
    maxFileSize: number;
    rateLimit: number;
  };
}

// Theme and UI types
export type Theme = 'light' | 'dark' | 'system';

export interface UIState {
  theme: Theme;
  sidebarCollapsed: boolean;
  notifications: {
    enabled: boolean;
    sound: boolean;
  };
}

// Form types
export interface FormFieldError {
  message: string;
  type: string;
}

export interface FormState<T> {
  data: T;
  errors: Record<keyof T, FormFieldError | undefined>;
  isSubmitting: boolean;
  isValid: boolean;
}

// Cache types
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface CacheStore {
  get<T>(key: string): CacheEntry<T> | null;
  set<T>(key: string, data: T, ttl?: number): void;
  delete(key: string): void;
  clear(): void;
}