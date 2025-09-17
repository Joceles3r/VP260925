# VISUAL Project - Investment Platform for Visual Content

## Overview

VISUAL is a web application that enables users to invest in visual content projects with small amounts (€1-€20) while influencing rankings through a voting system. The platform supports traditional project investments, live shows/battles between artists, and provides a comprehensive dashboard for portfolio management. Built with a modern full-stack architecture using React, Express, TypeScript, and PostgreSQL.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Full-Stack TypeScript Architecture
- **Frontend**: React with Vite build system and TypeScript
- **Backend**: Express.js server with TypeScript
- **Shared Types**: Common schema definitions shared between frontend and backend
- **Build System**: ESM modules throughout, with esbuild for production bundling

### Authentication & Authorization
- **Replit Auth Integration**: OpenID Connect with session-based authentication
- **Session Management**: PostgreSQL-based session storage using connect-pg-simple
- **Role-Based Access**: Admin/investor/creator profile types with route protection
- **KYC Verification**: User identity verification system for investment compliance

### Database Architecture
- **ORM**: Drizzle ORM with code-first schema approach
- **Database**: PostgreSQL with Neon serverless connection pooling
- **Schema Management**: Type-safe database operations with automatic TypeScript generation
- **Migration System**: Drizzle Kit for database schema migrations

### Frontend Architecture
- **UI Framework**: React with Wouter for client-side routing
- **State Management**: Zustand stores for complex state (admin, portfolio)
- **Data Fetching**: TanStack Query for server state management with caching
- **Component Library**: Radix UI primitives with shadcn/ui styling system
- **Styling**: Tailwind CSS with custom design tokens and dark mode support

### API Design
- **RESTful Architecture**: Express routes with consistent error handling
- **File Upload**: Multer middleware for video/image handling with type validation
- **Middleware Stack**: Request logging, JSON parsing, and authentication guards
- **Error Handling**: Centralized error middleware with structured responses

### Business Logic Services
- **ML Scoring**: Automated project scoring based on category, content quality, and target amount
- **Compliance Reporting**: AMF-compliant reporting system for financial regulations
- **Investment Processing**: Portfolio calculations with ROI tracking and redistribution logic
- **Live Shows**: Real-time investment tracking for artist battles
- **Advanced Features**: Referral system, gamification with login streaks, visitor activity tracking, and enhanced user roles

### Development Workflow
- **Hot Reloading**: Vite HMR for development with runtime error overlays
- **Type Safety**: Strict TypeScript configuration with shared types
- **Code Quality**: ESLint configuration with React and TypeScript rules
- **Path Aliases**: Organized imports with @ aliases for clean code structure

## External Dependencies

### Core Framework Dependencies
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Replit Auth**: Integrated authentication service with OpenID Connect
- **Drizzle ORM**: Type-safe database ORM with PostgreSQL adapter

### UI and Styling Libraries
- **Radix UI**: Headless component primitives for accessibility
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **Lucide React**: Icon library for consistent iconography

### Development and Build Tools
- **Vite**: Fast build tool with React plugin and development server
- **TypeScript**: Static typing with strict configuration
- **ESBuild**: Production bundling for server-side code

### Third-Party Integrations
- **Stripe**: Payment processing integration (client-side components included)
- **File Upload System**: Multer for handling video and image uploads
- **Session Storage**: PostgreSQL-backed session management for authentication

## Environment Variables Required

### Core Application
- `DATABASE_URL`: PostgreSQL database connection string (auto-configured by Replit)
- `STRIPE_SECRET_KEY`: Stripe secret key for payment processing
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook secret for payment validation

### Module 3 - Automated Purge System
- `PURGE_CRON_AUTH_KEY`: Authentication key for scheduled purge operations (must be set for production)
- `PURGE_ADMIN_TOKEN`: Admin token for internal API calls during purge operations

### Security Features
- **Dry-run by default**: All purge operations default to simulation mode
- **€100 financial safety limit**: Financial purges capped at €100 to prevent accidental large balance removal
- **Audit logging**: All purge operations are logged with full details for compliance

### Monitoring and Development
- **TanStack Query**: Robust data fetching with caching and background updates
- **Replit Development Tools**: Integrated development environment features
- **Runtime Error Handling**: Development overlay for debugging

## Advanced Features System

### Referral System with VISUpoints Economy
- **Unique Referral Links**: Each user can generate personalized referral codes (6-character alphanumeric)
- **Monthly Limitations**: Maximum of 20 successful referrals per user per month to prevent abuse
- **VISUpoints Rewards**: 100 VP for sponsors, 50 VP for new referees upon first meaningful action
- **Link Expiration**: Referral links expire after 30 days to maintain system freshness
- **Status Tracking**: Complete referral lifecycle tracking (pending → completed → expired)

### Gamification Features
- **Daily Login Streaks**: Consecutive login tracking with escalating rewards
  - Daily bonus: 5 VISUpoints for each login
  - Weekly milestone: +50 VP bonus every 7 consecutive days
  - Monthly milestone: +200 VP bonus every 30 consecutive days
- **Streak Management**: Automatic streak reset if user misses a day
- **Achievement Tracking**: Long-term statistics for longest streak and total logins earned

### Visitor Activity System
- **Activity Tracking**: Comprehensive logging of user and visitor interactions
  - Page views, video watches, project interactions, investment actions
- **Points System**: Different activity types award varying VISUpoints
  - Page view: 1 VP
  - Video watch: 3 VP
  - Project interaction: 5 VP
  - Investment action: 10 VP
- **Visitor of the Month**: Monthly leaderboard with 25€ equivalent VISUpoints reward
- **Analytics Support**: Detailed activity metrics for platform insights

### Enhanced User Roles and Pricing
- **Infoporteurs Role**: Content creators with tiered article pricing
  - Pricing tiers: {0€, 0.2€, 0.5€, 1€, 2€, 3€, 4€, 5€}
  - Specialized content creation and monetization tools
- **Investi-lecteurs Role**: Article investment specialists
  - Dedicated interface for discovering and investing in written content
  - Enhanced portfolio management for article-based investments

### Database Schema Extensions
- **New Tables Added**:
  - `referrals`: Complete referral system management
  - `referral_limits`: Monthly referral quota tracking
  - `login_streaks`: Daily login streak and milestone tracking
  - `visitor_activities`: Comprehensive activity logging
  - `visitor_of_month`: Monthly visitor ranking system
  - `articles`: Content management for Infoporteurs
  - `article_investments`: Investment tracking for written content
  - `user_roles`: Enhanced role-based access control
  - `emotional_filters`: Advanced content filtering system

### API Endpoints Added
- **Referral System**: `/api/referral/*` - Complete referral management
- **Streak System**: `/api/streaks/*` - Login streak tracking and rewards
- **Visitor Tracking**: `/api/visitor/*` - Activity monitoring and rankings
- **Enhanced Roles**: Extended user management with new role types

### Integration with Existing Systems
- **VISUpoints Economy**: All new features award points through existing transaction system
- **Compliance Integration**: Activity tracking supports regulatory reporting requirements
- **Investment Platform**: New roles extend existing investment functionality
- **Real-time Features**: Visitor tracking supports live activity monitoring