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
- **Authentication**: Replit Auth with OpenID Connect, session-based authentication using `connect-pg-simple`, role-based access (Admin/Investor/Creator), and KYC verification.
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

### System Design Choices
- **Modularity**: Co-located components and organized imports for maintainability.
- **Type Safety**: Strict TypeScript configuration.
- **Performance**: Client-side filtering and optimized sorting algorithms.
- **Scalability**: Serverless PostgreSQL and clear separation of concerns.
- **Security**: Secure authentication, authorization, content delivery (JWT for ebooks, no exposure of storage keys).
- **AI Agents**: Strategic Autonomous Intelligence (VisualAI, VisualFinanceAI, VisualScoutAI) for automated platform management, content moderation, financial rules, economy management, and ethical audience prospecting, with dedicated database tables for agent decisions and audit logs.
  - **VisualScoutAI**: Ethical prospection agent for detecting, scoring, and activating relevant audiences through official APIs only (Meta, TikTok, YouTube, X), strict GDPR/CCPA compliance, no unsolicited messages, opt-in only contacts, aggregated signals, interest scoring, campaign simulation, and emergency kill-switch.
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
