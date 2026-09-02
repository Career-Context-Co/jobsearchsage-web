# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm install          # Install dependencies (uses pnpm 10.21.0)
pnpm dev              # Start dev server on http://localhost:3000
pnpm build            # Production build
pnpm preview          # Preview production build locally
pnpm lint             # Run ESLint
pnpm typecheck        # Run vue-tsc type checking
```

No test framework is configured yet. Validation is done via `pnpm lint` and `pnpm typecheck`.

## Architecture

**Nuxt 4 SPA** (`ssr: false`) with Nitro server for API routes. Built on the Nuxt UI Dashboard Template — template features (customers, inbox, dashboard charts) are temporary reference implementations that will be removed.

### Key Directories

- `app/` — Frontend source (pages, components, composables, stores, utils, types)
- `server/api/` — REST API endpoints (Nitro file-based routing with HTTP method suffixes: `.get.ts`, `.post.ts`, `.delete.ts`, etc.)
- `server/utils/` — Server utilities including AI service integrations, error handling, logging, ID generation, transformers
- `shared/types/` — TypeScript types shared between client and server (`careerId.ts`, `enhancement.ts`)
- `openspec/` — Spec-driven development with OpenSpec (see below)
- `test-scripts/` — Manual API test payloads (JSON files for testing endpoints)

### State Management

Pinia stores in `app/stores/`:
- **`careerIDStore`** — Primary store for all profile data (experience, education, certs, skills, contact, social links, HERO stories/moments). All CRUD operations and AI enhancement actions live here.
- **`sageAIStore`** — AI session management (discovery sessions, enhancement sessions, conversation history). Uses `useLocalStorageState` for session caching with TTL.
- **`accountStore`** — User preferences and feature flags. Persisted to localStorage.

### Feature Flags

Global product flags live in `globalStore.features`, seeded from `runtimeConfig.public` in `account.client.ts`:
- `signupEmailConfirmation` — `NUXT_PUBLIC_SIGNUP_EMAIL_CONFIRMATION` (defaults on unless set to `false`)
- `hero` — `NUXT_PUBLIC_HERO_ENABLED` (defaults **off**; must be the string `true` to show HERO tab, wizard, and experience nudge). Route-guarded by `app/middleware/hero-feature.ts`.
- `sageAssist` — `NUXT_PUBLIC_SAGE_ASSIST_ENABLED` (defaults **off**; must be the string `true` to show experience "Get AI Help").

`accountStore.features` still supports per-user localStorage preferences for future Insiders toggles. Do not gate HERO or Sage Assist through `accountStore` — persisted flags from older Insiders builds would leak features.

Settings > Insiders (`/settings/insiders`) currently has no active toggles.

### Backend / Supabase

- Auth via `@nuxtjs/supabase` module (`serverSupabaseClient(event)` on server)
- Database uses **snake_case** columns; API returns **camelCase** — transformed via `server/utils/career-id-transformer.ts`
- IDs are CUID2-based (generated via `server/utils/id-generator.ts`)
- Soft deletes with `deleted_at`/`is_deleted` fields
- `display_order` fields for sortable lists

### AI Integration

Uses Vercel AI SDK with a custom AI Gateway (`NUXT_AI_GATEWAY_API_KEY` env var):
- **Resume extraction**: Gemini 2.5 Flash Lite (multimodal PDF parsing)
- **Achievement polishing**: GPT-4o-mini (conservative, temp 0.3)
- **Context gathering / XYZ bullets**: Multi-round question generation → bullet writing
- **HERO discovery**: Conversational AI sessions with state persistence

All AI calls use 10-second timeouts via `Promise.race`. Custom error classes: `ExtractionError`, `EnhancementError`, `XYZEnhancementError`, `DiscoveryError`.

### API Endpoint Pattern

```typescript
export default eventHandler(async (event) => {
  const getElapsed = createTimer()
  const body = await readBody(event)
  logRequest('POST', ROUTE_PATH, { context })
  // validate → query DB → transform snake_case ↔ camelCase
  logSuccess('POST', ROUTE_PATH, duration, { metadata })
  return { success: true, data }
})
```

Error responses use structured format: `{ success: false, error: { code, message } }` with codes like `VALIDATION_ERROR`, `NOT_FOUND`, `DUPLICATE_ENTRY`.

## Code Style

- **ESLint**: No trailing commas, 1tbs brace style, max 3 attributes per single-line Vue template element
- **Imports**: Use Nuxt path aliases (`@`/`~` for `app/`, `@@`/`~~` for project root, `#shared` for `shared/`). Never use deep relative paths. Server code uses `@@/server/utils/...`.
- **Auto-imports**: Components, composables, and utils are auto-imported — don't add explicit imports for them
- **Components**: PascalCase filenames, organized by feature domain under `app/components/`
- **API routes**: kebab-case with HTTP method suffix (e.g., `[id].delete.ts`)
- Prefer Nuxt UI components over custom implementations
- Use Tailwind utility classes for styling

## OpenSpec Workflow

This project uses [OpenSpec](https://openspec.dev) for spec-driven development. Read `openspec/AGENTS.md` when:
- Planning new features, breaking changes, or architecture shifts
- Creating change proposals (`openspec/changes/`)
- Working with specs (`openspec/specs/`)

Key commands: `openspec list`, `openspec list --specs`, `openspec validate <change-id> --strict`

Proposals require approval before implementation. See `openspec/AGENTS.md` for the full three-stage workflow (Create → Implement → Archive).
