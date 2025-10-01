# VISUAL Project - Investment Platform for Visual Content

## Overview
VISUAL is a web application designed for investing in visual content projects (2–20 € per category) and influencing project rankings via a voting system. It supports traditional project investments, live shows/battles, and offers a comprehensive portfolio management dashboard. The platform aims to provide a modern, full-stack investment experience for visual content creators and investors, built with React, Express, TypeScript, and PostgreSQL. The business vision is to democratize investment in creative content, offering a transparent and engaging platform for small-scale investments with significant market potential in the creator economy.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The platform features a Neon Design System with a dark theme, utilizing signature colors (#00D1FF, #7B2CFF, #FF3CAC). It employs Radix UI primitives with shadcn/ui styling and Tailwind CSS for a modern, responsive, and accessible user interface, supporting dark mode.

### Technical Implementations
- **Full-Stack TypeScript**: React with Vite for the frontend, Express.js for the backend, and shared TypeScript types.
- **Authentication**: Replit Auth with OpenID Connect, session-based authentication using `connect-pg-simple`, role-based access (Admin/Investor/Creator), and KYC verification.
- **Database**: PostgreSQL with Neon serverless connection pooling, Drizzle ORM for type-safe operations, and Drizzle Kit for migrations.
- **Frontend**: React with Wouter for routing, Zustand for state management, TanStack Query for data fetching, and Radix UI with Tailwind CSS for UI.
- **API Design**: RESTful Express routes, Multer for file uploads, centralized error handling, and a robust middleware stack.
- **Business Logic Services**: Includes ML scoring for project evaluation, AMF-compliant reporting, investment processing with ROI tracking, real-time live show tracking, referral system, gamification, and enhanced user roles (e.g., Infoporteurs, Investi-lecteurs).
- **Ebook Licensing System**: Secure anti-piracy solution using JWT RS256 tokens, download quotas, anti-replay protection, and signed URLs for secure content delivery.
- **Advanced Features**: Implemented features include a sophisticated filtering and sorting system for projects, enhanced user experience with confirmation toasts and empty state handling, and a comprehensive activity tracking system.

### Feature Specifications
- **Investment Platform**: Crowdfunding system across 6 project categories, project CRUD operations, and a voting system.
- **Advanced Filtering & Sorting**: Price and progress sliders, badge filters (Trending, TOP 10, New), and sorting by various criteria (title, price, progress, engagement, investor count).
- **Gamification**: Daily login streaks with escalating VISUpoints rewards and achievement tracking.
- **Referral System**: Unique referral links with VISUpoints rewards for sponsors and referees, with monthly limitations.
- **Visitor Activity**: Comprehensive logging of user and visitor interactions, awarding VISUpoints for various activities, and a "Visitor of the Month" leaderboard.
- **Ebook Licensing**: Manages secure distribution of ebooks with JWT-signed downloads, download quotas, and an audit trail.
- **Bunny.net Video Hosting**: Secure video upload and streaming module with:
  - **Pay-per-Upload Pricing**: Clips (2€), Documentaries (5€), Films (10€) with Stripe integration
  - **Two-Tier Anti-Piracy**: TIER 1 (Bunny CDN signed URLs protecting all HLS segments) and TIER 2 (legacy HMAC tokens for manifest-only protection)
  - **Real-time Usage Tracking**: Monthly consumption estimates (storage €0.01/GB, bandwidth €0.005/GB, encoding €0.005/min)
  - **Production Security**: Enforced configuration validation preventing insecure deployments
  - **Creator Dashboard**: `/creator/videos` page with upload form and usage analytics
- **Dark/Light Theme System**: User-customizable theme preferences with:
  - **Global State Management**: Zustand store ensures all ThemeToggle instances stay synchronized
  - **Persistence Priority**: Admin override > User DB preference > localStorage > System preference  
  - **ThemeToggle Component**: Available in Navigation header and Profile page, shows current theme
  - **Database Storage**: users.themePreference column, platformSettings table for admin overrides
  - **Admin Override**: AdminThemeOverride component in admin dashboard for global theme forcing (e.g., dark mode during Live Shows)
  - **Automatic Restoration**: When admin removes override, user preferences automatically restore from database
  - **Comprehensive Logging**: Debug-ready with initialization and persistence flow logging
- **Live Show Finalist Management System**: Production-ready admin UI for managing weekly Live Shows with:
  - **Automated Orchestration**: LiveShowOrchestrator service handles finalist/replacement scenarios (S1: A1→vacant, S2: A2→vacant)
  - **Admin Dashboard**: LiveShowsAdminPanel component displays active shows, lineup state (F1/F2/A1/A2), lock/unlock controls
  - **Database Schema**: liveShowFinalists (rank nullable), liveShowAlternates, liveShowNotifications, liveShowAudit for complete audit trail
  - **API Routes**: GET active shows/lineup/audit, POST lock-lineup/unlock-lineup with admin authentication
  - **Smart Cache Invalidation**: TanStack Query v5 with prefix invalidation ensures automatic UI refresh after operations
  - **Replacement Logic**: Eligibility filtering (selected/confirmed/standby only), slot release before promotion, no unique constraint conflicts
  - **OIDC Admin Auth**: Requires profile_type='admin' claim (underscore, not camelCase) in OIDC token for admin access

### System Design Choices
- **Modularity**: Co-located components and organized imports for maintainable code.
- **Type Safety**: Strict TypeScript configuration throughout the stack.
- **Performance**: Client-side filtering and optimized sorting algorithms for a responsive UI.
- **Scalability**: Utilizes serverless PostgreSQL for database scalability and a clear separation of concerns between frontend and backend services.
- **Security**: Focus on secure authentication, authorization, and content delivery (e.g., JWT for ebooks, no exposure of storage keys).
- **AI Agents**: Strategic Autonomous Intelligence (VisualAI for orchestration, VisualFinanceAI for financial execution) for automated platform management, content moderation, financial rules, and economy management, with dedicated database tables for agent decisions, audit logs, and financial ledgers.
- **Theme System**: Complete dark/light theme system with user preferences stored in localStorage and database, admin override capability for platform-wide theme forcing (e.g., during Live Shows), and synchronized state management across all UI components.

## External Dependencies

- **Neon Database**: Serverless PostgreSQL hosting with connection pooling.
- **Replit Auth**: Integrated authentication service using OpenID Connect.
- **Drizzle ORM**: Type-safe database ORM for PostgreSQL.
- **Radix UI**: Headless component primitives for UI development.
- **Tailwind CSS**: Utility-first CSS framework.
- **Lucide React**: Icon library.
- **Vite**: Fast build tool for React.
- **TypeScript**: For static typing across the project.
- **ESBuild**: For production bundling of server-side code.
- **Stripe**: Payment processing integration.
- **Bunny.net Stream API**: High-performance video hosting with CDN token authentication for anti-piracy protection.
- **Multer**: Middleware for handling video and image uploads.
- **connect-pg-simple**: PostgreSQL-backed session management for authentication.