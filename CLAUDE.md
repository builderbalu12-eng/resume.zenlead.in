# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
pnpm dev                  # Web app dev server at localhost:8080
pnpm dev:extension        # Watch-mode build for Chrome extension

# Build
pnpm build                # Build all three targets (client + server + extension)
pnpm build:client         # Web SPA → dist/spa/
pnpm build:server         # Express server → dist/server/
pnpm build:extension      # Chrome extension → dist/extension/
pnpm package:extension    # build:extension + zip → landyourjob-extension.zip

# Quality
pnpm typecheck            # TypeScript type check (tsc)
pnpm test                 # Vitest (run once)
pnpm format.fix           # Prettier

# Production
pnpm start                # node dist/server/node-build.mjs
```

The backend API is a **separate Python/FastAPI project** at `../resumematch-api/`. This repo is frontend-only (React SPA + Express thin server + Chrome extension). Start the Python API independently; `VITE_API_URL` points to it.

## Architecture

### Three build targets, one repo

| Target | Entry | Output | Config |
|---|---|---|---|
| Web SPA | `client/main.tsx` | `dist/spa/` | `vite.config.ts` |
| Node server | `server/node-build.ts` | `dist/server/` | `vite.config.server.ts` |
| Chrome extension | `client/extension/{background,content,popup,sidebar}.ts` | `dist/extension/` | `vite.config.extension.ts` |

The Express server in `server/` is a thin host — it serves the SPA and proxies/handles payments. Almost all business logic lives in the Python FastAPI backend (`../resumematch-api/`).

### Frontend structure

- `client/App.tsx` — all React Router routes. Public routes: `/`, `/login`, `/register`, `/pricing`, `/extension`, etc. Protected routes wrapped in `<ProtectedRoute>` + `<AppShell>`.
- `client/contexts/AuthContext.tsx` — auth state. JWT stored in `localStorage` (`auth_token`). `useAuth()` is the primary hook.
- `client/contexts/AppConfigContext.tsx` — fetches `/api/settings/app-config` on load for dynamic app name, support email, etc.
- `client/services/api.ts` — single `APIClient` class (`apiClient` singleton). All backend calls go here. Reads token from localStorage; falls back to `chrome.storage.sync` when running inside the extension.
- `client/pages/` — full-page React components. Most pages use inline styles (not Tailwind) for layout — see Dashboard.tsx as the pattern.
- `client/components/ui/` — shadcn/Radix components. Don't modify these directly.

### Mobile responsiveness pattern

Pages use a shared `useIsMobile()` hook (defined at the top of `Dashboard.tsx` and duplicated inline where needed). The pattern is:
```ts
const isMobile = useIsMobile(); // threshold: 768px
// then use isMobile ? mobileValue : desktopValue inline in style props
```
Pages use **inline styles throughout** (not Tailwind classes for layout). When fixing mobile on any page, add `useIsMobile()` and conditionally swap padding, grid columns, font sizes.

### Chrome extension

- **Manifest V3**, sidebar-first UX (no popup).
- `background.ts` — service worker. Manages auth token relay and chrome.storage.
- `content.ts` — injected on job board pages (LinkedIn, Indeed, Naukri, Glassdoor, etc.). Extracts job description DOM, sends to sidebar via `chrome.runtime.sendMessage`.
- `sidebar.ts` — main extension UI. Calls the Python API directly using `APP_URL` constant.
- Auth bridge: web app sends credentials via `window.postMessage({ source: 'resumematch-web-app', ... })`, content script relays to `chrome.storage.sync`.
- Icons: `public/icon-16.png`, `icon-48.png`, `icon-128.png` (generated from `public/logo/lo9o.png` via `scripts/generate_icons.py`).
- `debug.html` is intentionally excluded from the production build.

### Data flow for resume tailoring

1. User uploads DOCX → parsed by `mammoth.js` in `client/services/resumeParser.ts`
2. Parsed JSON (`ResumeData`) saved to backend via `PUT /api/user/master-resume`
3. On a job page, extension extracts job description → POST to `/api/resume/tailor`
4. Python backend calls Google Gemini → returns tailored `ResumeData`
5. `client/services/resumeGenerator.ts` converts `ResumeData` → DOCX via `docx.js`

### Key types

Defined in `shared/api.ts` and `client/types/index.ts`:
- `ResumeData` — full resume structure (contact, summary, skills, experience, education, projects, certifications)
- `User` — includes `credits`, `has_payments`, `firstName`, `lastName`, `email`
- `JobDescription` — extracted job info (title, company, requirements, keywords)

### Credits system

Every AI feature costs credits (defined in admin panel at `/admin`). `user.credits` is decremented server-side per operation. Free plan users have limited credits; paid plans add credits on cycle. Check `user.credits` before triggering expensive API calls.

### Environment variables

```
MONGODB_URI            # Not used by this frontend directly
VITE_API_URL           # Python FastAPI base URL (e.g. https://api.zenlead.in)
VITE_API_BASE_URL      # Same + /api suffix
VITE_CASHFREE_ENV      # "sandbox" or "production"
VITE_GA_MEASUREMENT_ID # GA4
CASHFREE_APP_ID        # Server-side only
CASHFREE_SECRET_KEY    # Server-side only
FRONTEND_BASE_URL      # For payment redirects
PAYMENT_SUCCESS_URL    # Cashfree redirect
PORT                   # Express server (default 8080)
```

### Path aliases

`@` → `./client`, `@shared` → `./shared` (configured in all three vite configs and tsconfig).
