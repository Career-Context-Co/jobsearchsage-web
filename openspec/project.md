# Project Context

## Purpose
JobSearchSage transforms job searching into a systematic, learnable skill by enabling professionals to build a structured Career Sage Profile once, then use it across their entire job search. Core features include profile creation, dynamic resume generation optimized for each role, application pipeline tracking, professional communication templates with smart prefills, and conversational Sage AI coaching. Together, these features help users master job transitions, dramatically improve response rates, and eliminate redundant data entry across applications.

## Tech Stack

### Core Framework
- **Nuxt 4.2.1** - Vue-based full-stack framework with SSR, file-based routing, and auto-imports
- **Vue 3** - Progressive JavaScript framework (via Nuxt)
- **TypeScript 5.9.3** - Type-safe development with strict typing
- **Vite** - Fast build tool and dev server (bundled with Nuxt)

### UI & Styling
- **Nuxt UI 4.1.0** - Component library built on Reka UI and Tailwind CSS
- **Tailwind CSS** - Utility-first CSS framework (via Nuxt UI)
- **Iconify** - Icon system with Lucide and Simple Icons collections
- **Unovis** - Data visualization library for charts and graphs

### Utilities & Libraries
- **VueUse** - Collection of Vue composition utilities
- **date-fns 4.1.0** - Modern date utility library
- **Zod 4.1.12** - TypeScript-first schema validation

### Development Tools
- **ESLint 9.39.1** - Linting with Nuxt ESLint module
- **vue-tsc 3.1.3** - TypeScript type checking for Vue files
- **pnpm 10.21.0** - Fast, disk space efficient package manager

## Project Conventions

### Code Style
- **ESLint Configuration**: Using `@nuxt/eslint` with stylistic rules
  - Comma dangle: `never` (no trailing commas)
  - Brace style: `1tbs` (one true brace style)
  - Max attributes per line: 3 for single-line Vue templates
  - Multiple template roots allowed in Vue components
- **File Naming**: 
  - Vue components: PascalCase (e.g., `HomeStats.vue`, `AddModal.vue`)
  - Composables: camelCase with `use` prefix (e.g., `useDashboard.ts`)
  - API routes: kebab-case with HTTP method suffix (e.g., `customers.ts`, `notifications.ts`)
  - Types: `index.d.ts` for type definitions
- **Component Organization**: Feature-based folders under `app/components/` (e.g., `home/`, `customers/`, `inbox/`, `settings/`)

### Architecture Patterns

#### Directory Structure (Nuxt Conventions)
- `app/` - Application source code
  - `pages/` - File-based routing (auto-generates routes)
  - `components/` - Auto-imported Vue components
  - `composables/` - Auto-imported composition functions
  - `layouts/` - Application layouts
  - `utils/` - Auto-imported utility functions
  - `types/` - TypeScript type definitions
  - `assets/css/` - Global styles
- `server/` - Server-side code (Nitro engine)
  - `api/` - API endpoints (auto-registered as `/api/*`)
- `public/` - Static assets served at root

#### Auto-Import System
- Components, composables, and utils are automatically imported without explicit import statements
- Server utilities are auto-imported in server context
- Type-safe with full TypeScript support

#### API Route Conventions
- Files in `server/api/` automatically become API endpoints
- HTTP method suffixes: `.get.ts`, `.post.ts`, `.put.ts`, `.delete.ts`
- Dynamic routes use bracket notation: `[id].ts`
- Use `defineEventHandler()` for route handlers
- CORS enabled for all `/api/**` routes

#### Component Patterns
- Client-only components: `.client.vue` suffix (e.g., `HomeChart.client.vue`)
- Server-only components: `.server.vue` suffix (e.g., `HomeChart.server.vue`)
- Modals and slideouts: Separate components (e.g., `AddModal.vue`, `NotificationsSlideover.vue`)
- Feature-specific components grouped in subdirectories

### Testing Strategy
- Type checking: `pnpm typecheck` using `vue-tsc`
- Linting: `pnpm lint` using ESLint
- No test framework currently configured (future: Vitest recommended for Nuxt)

### Git Workflow
- Main branch: `main`
- Renovate integration for automated dependency updates
- CI/CD: GitHub Actions workflow configured (`.github/workflows/ci.yml`)
- Untracked: `.cursor/`, `AGENTS.md`, `openspec/` (new additions)

## Domain Context

### Application Purpose
JobSearchSage is a career management platform that transforms job searching from a chaotic process into a systematic, learnable skill. The application helps professionals:
- Build a structured Career Sage Profile (single source of truth)
- Generate dynamic, role-optimized resumes
- Track application pipelines
- Use professional communication templates with smart prefills
- Access conversational AI coaching (Sage AI)

### User Personas
- **Job Seekers**: Professionals actively searching for new roles
- **Career Transitioners**: People changing industries or roles
- **Passive Job Explorers**: Employed professionals keeping options open

### Current Project State
**Note**: This project is built on the Nuxt UI Dashboard Template starter. The existing features (customers, mail/inbox, etc.) are **reference implementations** that demonstrate Nuxt UI patterns and best practices. These template features will be retained during development to serve as well-fleshed-out examples for building new JobSearchSage features efficiently. Once the actual application features are properly structured and implemented, the template data and example features will be removed.

### Template Features (Temporary Reference)
- Customer management with add/delete modals
- Inbox/mail system
- Home dashboard with charts, stats, and sales data
- Settings pages (members, notifications, security)
- Team and user menus
- Notifications slideover

**Purpose**: These serve as reference patterns for component structure, state management, API integration, and Nuxt UI component usage.

## Important Constraints

### Technical Constraints
- **SSR/SSG**: Application uses Nuxt's hybrid rendering (SSR by default)
- **Type Safety**: All code must be TypeScript-compatible
- **Auto-Import**: Avoid explicit imports for Nuxt auto-imported items
- **Package Manager**: Must use pnpm (lockfile: `pnpm-lock.yaml`)
- **Node Version**: Compatible with Nuxt 4 requirements (Node 18.x+)

### Development Constraints
- **Nuxt Conventions**: Follow Nuxt's opinionated structure (file-based routing, auto-imports)
- **Component Library**: Prefer Nuxt UI components over custom implementations
- **Styling**: Use Tailwind utility classes via Nuxt UI
- **API Design**: RESTful patterns in `server/api/` with proper HTTP methods

### Business Constraints
- **User Privacy**: Career data is sensitive (PII, employment history)
- **Resume Quality**: Generated resumes must be ATS-compatible
- **Response Time**: AI coaching must feel conversational (low latency)

## External Dependencies

### Current External Services
- None currently integrated (template stage)

### Planned/Future Integrations
- **AI/LLM Service**: For Sage AI coaching and resume optimization
- **Authentication Provider**: User accounts and session management
- **Database**: Persistent storage for Career Sage Profiles and applications
- **File Storage**: Resume PDFs, cover letters, documents
- **Email Service**: Notifications and communication templates
- **Job Board APIs**: (Optional) Job listing aggregation
- **ATS Integration**: (Optional) Direct application submission

### Development Services
- **GitHub**: Version control and CI/CD
- **Renovate**: Automated dependency updates
- **Vercel/Netlify**: (Likely) Deployment platform for Nuxt apps
