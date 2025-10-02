# VISUAL Project - Investment Platform for Visual Content

## Overview
VISUAL is a web application for investing in visual content projects (2–20 € per category) and influencing project rankings via a voting system. It supports traditional project investments, live shows/battles, and offers a comprehensive portfolio management dashboard. The platform aims to democratize investment in creative content, providing a transparent and engaging experience for small-scale investments with significant market potential in the creator economy.

## User Preferences
- Preferred communication style: Simple, everyday language.
- **IMPORTANT REMINDER**: Rappeler à l'utilisateur de fournir les identifiants Stripe (STRIPE_SECRET_KEY, VITE_STRIPE_PUBLIC_KEY, STRIPE_WEBHOOK_SECRET) avant ou au déploiement de l'application.

## System Architecture

### UI/UX Decisions
The platform uses a Neon Design System with a dark theme, signature colors (#00D1FF, #7B2CFF, #FF3CAC), Radix UI primitives, shadcn/ui styling, and Tailwind CSS for a modern, responsive, and accessible user interface supporting dark mode.

### Technical Implementations
- **Full-Stack TypeScript**: React with Vite (frontend), Express.js (backend), shared TypeScript types.
- **Authentication**: Replit Auth with OpenID Connect, session-based authentication using `connect-pg-simple`, role-based access (Admin/Investor/Creator), KYC verification, and "Remember me" option for session persistence (browser session vs 7-day session). Login page at `/login` with full i18n support (FR/EN/ES) provides security warnings for trusted vs public devices.
- **Database**: PostgreSQL with Neon serverless connection pooling, Drizzle ORM, and Drizzle Kit for migrations.
- **Frontend**: React with Wouter (routing), Zustand (state management), TanStack Query (data fetching), Radix UI with Tailwind CSS.
- **API Design**: RESTful Express routes, Multer for file uploads, centralized error handling, and robust middleware.
- **Business Logic Services**: Includes ML scoring for project evaluation, AMF-compliant reporting, investment processing with ROI tracking, real-time live show tracking, referral system, gamification, and enhanced user roles.
- **Ebook Licensing System**: Secure anti-piracy solution using JWT RS256 tokens, download quotas, anti-replay protection, and signed URLs.
- **Advanced Features**: Sophisticated filtering and sorting for projects, confirmation toasts, empty state handling, and activity tracking.
- **Bunny.net Video Hosting**: Secure video upload and streaming module with pay-per-upload pricing (Stripe integration), two-tier anti-piracy (signed URLs, HMAC tokens), real-time usage tracking, and production security enforcement.
- **Dark/Light Theme System**: User-customizable theme with global state management (Zustand), persistence priority (Admin override > User DB preference > localStorage > System), database storage, and admin override capability.
- **Live Show Management**: Admin UI for managing weekly Live Shows, automated orchestration, database schema for finalists/alternates/notifications/audit, API routes, smart cache invalidation (TanStack Query v5), replacement logic, and OIDC admin authentication.
- **Live Show Weekly Battle System**: Complete 3-phase candidate selection with Friday live battles, investment tranches, Stripe integration for secure payments (Elements, 3DS, webhooks), real-time scoreboard via WebSockets, and defined distribution rules.
- **Internationalization (i18n)**: Trilingual support (FR/EN/ES) with dynamic language switching, user preference persistence (localStorage + database), LanguageSelector component in Navigation, and translated UI across the platform.
- **Full-Text Search**: PostgreSQL native full-text search using `plainto_tsquery` with multi-language support (french/english/spanish), SearchBar component with real-time suggestions, keyboard shortcuts (Cmd/Ctrl+K), secure wildcard escaping, and graceful error handling.
- **SEO Module**: Comprehensive SEO system managed by VisualScoutAI under VisualAI supervision with Admin control. Features: sitemap XML generation with hreflang (FR/EN/ES), dynamic meta tags (title, description, OG, Twitter Cards), Schema.org markup, auto-generation for projects/pages, Admin UI for approval/override, generation logs with AI reasoning tracking, and hierarchical approval workflow (Admin > VisualAI > VisualScoutAI).
- **Monthly Leaderboard & Hall of Fame**: Complete project ranking system with historical replay mode. Features: monthly snapshots in `project_monthly_rankings` table storing rank, investments, ROI, badges (Gold/Silver/Bronze/Rising Star), growth metrics, and daily data for charts; 5 API endpoints (monthly rankings, project history, available months, all-time top performers, project comparison); Leaderboard page (`/leaderboard`) with 3 view modes (Monthly, All-Time, Replay), Recharts visualizations (Area charts for ranking evolution, Bar charts for performance metrics), social media sharing, and CSV export functionality; highlighted "🏆 Classement" navigation link with trilingual support (FR/EN/ES).

### System Design Choices
- **Modularity**: Co-located components and organized imports for maintainability.
- **Type Safety**: Strict TypeScript configuration.
- **Performance**: Client-side filtering and optimized sorting algorithms.
- **Scalability**: Serverless PostgreSQL and clear separation of concerns.
- **Security**: Secure authentication, authorization, content delivery (JWT for ebooks, no exposure of storage keys).
- **AI Agents**: Strategic Autonomous Intelligence (VisualAI, VisualFinanceAI, VisualScoutAI) for automated platform management, content moderation, financial rules, economy management, and ethical audience prospecting, with dedicated database tables for agent decisions and audit logs.
  - **VisualScoutAI**: Ethical prospection agent for detecting, scoring, and activating relevant audiences through official APIs only (Meta, TikTok, YouTube, X), strict GDPR/CCPA compliance, no unsolicited messages, opt-in only contacts, aggregated signals, interest scoring, campaign simulation, and emergency kill-switch.
  - **VisualAI Fraud Detection**: Advanced ML-based fraud detection system with autonomous learning capabilities, behavior analysis, and multi-account detection—always obedient to ADMIN. Features: real-time risk scoring (0-1 scale), bot activity detection, coordinated investment analysis, pattern recognition, and adaptive learning from admin feedback. Risk levels: low (<0.3), medium (0.3-0.6), high (0.6-0.8), critical (>0.8). All high-risk actions (>0.6) require admin validation with traceable audit signatures.
- **Theme System**: Complete dark/light theme system with user preferences stored in localStorage and database, admin override capability, and synchronized state management.

## External Dependencies

- **Neon Database**: Serverless PostgreSQL hosting.
- **Replit Auth**: Integrated authentication service.
- **Drizzle ORM**: Type-safe database ORM for PostgreSQL.
- **Radix UI**: Headless component primitives.
- **Tailwind CSS**: Utility-first CSS framework.
- **Lucide React**: Icon library.
- **Vite**: Fast build tool for React.
- **TypeScript**: For static typing.
- **ESBuild**: For production bundling.
- **Stripe**: Payment processing integration.
- **Bunny.net Stream API**: High-performance video hosting with CDN token authentication.
- **Multer**: Middleware for handling file uploads.
- **connect-pg-simple**: PostgreSQL-backed session management.
## VisualAI Fraud Detection System (October 2, 2025)

### Architecture Overview
The fraud detection system is integrated into VisualAI service (`server/services/visualAI.ts`) with dedicated database tables for fraud events, risk scores, behavior patterns, and ML metadata.

### Core Components

**1. Risk Scoring Engine**
- Real-time user risk analysis based on behavioral patterns
- 4-tier risk levels: low (<0.3), medium (0.3-0.6), high (0.6-0.8), critical (>0.8)
- Multi-factor analysis: rapid investments, uniform amounts, timing anomalies, volume patterns
- Automatic agent decision creation for risks >0.6

**2. Detection Algorithms**
- **Bot Activity Detection**: Analyzes temporal regularity, action speed, and diversity patterns
- **Coordinated Investment Detection**: Identifies suspicious timing clusters and amount patterns
- **Multi-Account Detection**: Database schema ready for IP/device fingerprinting analysis
- **Rapid Succession Detection**: Flags 5+ investments within configurable time windows (5/15/30/60 min)

**3. Machine Learning Components**
- **Adaptive Learning**: `learnFromAdminFeedback()` adjusts detection thresholds based on admin verdicts
- **Pattern Recognition**: Stores behavior patterns with accuracy metrics (true/false positive tracking)
- **Feature Engineering**: Database tables for `behavior_patterns`, `ml_models`, `learning_session`
- **Continuous Improvement**: Admin feedback loop enables model refinement over time

### Database Schema

**fraud_events**: Event log with evidence data, confidence scores, recommended actions
**user_risk_scores**: Per-user risk profiles with contributing factors
**behavior_patterns**: Reusable patterns with accuracy tracking for ML
**user_relationships**: Multi-account detection via relationship graphs
**ml_models**: Model metadata for version tracking and performance metrics
**learning_session**: Training sessions with feedback incorporation

### API Methods

```typescript
// VisualAI service methods
await visualAI.analyzeUserFraudRisk(userId)
await visualAI.detectCoordinatedInvestments(projectId)
await visualAI.learnFromAdminFeedback(decisionId, 'approved' | 'rejected', comment)
```

### Admin Control & Audit Trail
- **✅ CRITICAL FIX**: All high-risk detections (>= 0.6) now **strictly** create `'pending'` agent decisions requiring admin review (governance bug fixed Oct 2)
- Complete audit log via `agent_audit_log` table with immutable hash chain
- Admin can approve/reject decisions, triggering ML learning adjustments  
- Fraud events logged to console for v1 (full DB persistence coming in v2 via storage.upsertUserRiskScore/createFraudEvent)

### Security Principles
- **Admin Authority**: All critical actions require admin validation
- **Traceable Decisions**: Every fraud detection logged with justification and evidence
- **Obedient AI**: VisualAI always defers to admin judgment, learns from corrections
- **Zero False Blocks**: Automatic actions limited to low-risk monitoring; humans validate high-risk

### Future Enhancements (v2 Roadmap)
1. **Storage Layer**: Implement `storage.upsertUserRiskScore()` and `storage.createFraudEvent()` for full DB persistence
2. **Regression Tests**: Add test coverage to ensure >= 0.6 → 'pending' rule is maintained
3. **ML Training Pipeline**: Implement scheduled retraining based on admin feedback patterns
4. **Multi-Account Detection**: Complete IP/device fingerprinting integration for relationship detection

## Security Implementations (October 1, 2025)

### Completed Security Enhancements

✅ **Secret Validation** (`server/config/secretsValidator.ts`)
- Validates critical secrets at startup
- **Blocks production** if default/insecure secrets detected
- Active: See startup logs for validation status

✅ **CORS Configuration** (`server/config/corsConfig.ts`)
- Production: Strict domain whitelist
- Development: Allows all origins for Vite HMR
- Active: Applied to all requests

✅ **Structured Logger** (`server/config/logger.ts`)
- Environment-aware log levels (DEBUG→INFO in prod)
- Automatic masking of sensitive data
- Implementation complete - Progressive migration needed
- Guide: `server/config/LOGGING_GUIDE.md`

✅ **NPM Vulnerabilities**: Fixed 3 low-severity issues
- Remaining 6 moderate: Development-only (esbuild)
- No production runtime vulnerabilities

### Pre-Production Checklist

**CRITICAL:**
- [ ] Generate & configure production secrets (AUDIT_HMAC_KEY, VISUAL_PLAY_TOKEN_SECRET, ADMIN_CONSOLE_SECRET)
- [ ] Verify Stripe keys use `sk_live_` prefix
- [ ] Configure CORS production domains

**HIGH PRIORITY:**
- [ ] Migrate critical services to structured logger (see LOGGING_GUIDE.md)
- [ ] Test production configuration with NODE_ENV=production

**BEFORE DEPLOYMENT:**
```bash
# Generate secrets
openssl rand -base64 32

# Set in Replit Secrets:
AUDIT_HMAC_KEY=<generated>
VISUAL_PLAY_TOKEN_SECRET=<generated>
ADMIN_CONSOLE_SECRET=<generated>
```
