# replit.md

## Overview

Pillars of Truth is a React-based youth community website built for learning, teaching, and preaching God's word. The application features a modern, responsive design with authentication via Google OAuth, content management through Google Drive integration, and email functionality for contact forms and messaging.

## System Architecture

### Frontend Architecture
- **React 18** with TypeScript for type safety
- **Vite** as the build tool and development server
- **TailwindCSS** for styling with shadcn/ui component library
- **Wouter** for client-side routing (lightweight React Router alternative)
- **TanStack Query** for server state management and caching
- **React Hook Form** with Zod validation for form handling

### Backend Architecture
- **Express.js** server with TypeScript
- **Google APIs** integration for authentication and file storage
- **Nodemailer** with Gmail OAuth for email functionality
- **Session-based authentication** using in-memory storage
- RESTful API design with comprehensive error handling

### Database Strategy
- **External API-first approach** - No traditional database
- **Google Drive** serves as content storage and management system
- **Gmail** handles all email communications
- **In-memory session storage** for authenticated users
- Drizzle ORM configured for potential PostgreSQL addition later

## Key Components

### Authentication System
- Google OAuth 2.0 integration for secure sign-in
- Session management with Bearer token support
- Role-based access control for content viewing
- Automatic session persistence across page reloads

### Content Management
- Google Drive API integration for session recordings and chapter materials
- Dynamic content fetching with caching via TanStack Query
- Organized by sessions (1-3) with multiple content types
- Support for both audio/video recordings and PDF chapters

### Communication Features
- Contact form with comprehensive validation and email routing
- Chatbot widget for direct messaging to admin or members
- Gmail integration for automated email processing
- Toast notifications for user feedback

### UI/UX Design
- Responsive design with mobile-first approach
- Modern glassmorphism effects and smooth animations
- Comprehensive component library via shadcn/ui
- Accessibility-focused with ARIA labels and keyboard navigation

## Data Flow

1. **User Authentication**: Google OAuth → Session creation → Access token storage
2. **Content Access**: Authentication check → Google Drive API → Content rendering
3. **Contact Forms**: Form validation → Email via Nodemailer → Success notification
4. **Gallery Display**: Google Drive API → Image fetching → Responsive grid layout

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Database connector (configured for future use)
- **googleapis**: Google Drive and Gmail API integration
- **nodemailer**: Email delivery system
- **drizzle-orm**: Type-safe database toolkit
- **@tanstack/react-query**: Server state management

### UI/Styling
- **@radix-ui/***: Accessible primitive components
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **lucide-react**: Icon library

### Development Tools
- **tsx**: TypeScript execution for development
- **esbuild**: Fast JavaScript bundling
- **vite**: Frontend build tool and dev server

## Deployment Strategy

### Build Process
- Frontend builds to `dist/public` directory
- Backend bundles to `dist/index.js` with ESM format
- Environment variables managed through `.env` files
- Production builds optimized with tree-shaking

### Environment Configuration
- **Development**: Vite dev server with HMR
- **Production**: Express serves static files + API
- **Database**: Configured for PostgreSQL via DATABASE_URL
- **Google APIs**: OAuth credentials and service account keys

### Scaling Considerations
- Stateless server design for horizontal scaling
- External API dependency minimizes server resource usage
- Caching strategies implemented for API responses
- CDN-ready static asset organization

## Changelog
- July 08, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.