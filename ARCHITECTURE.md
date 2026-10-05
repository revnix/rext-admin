# Architecture: the Rext AI dashboard

A map of how this repository is put together, for whoever is about to change it. It describes the code on `staging` as it is (checked 2026-10-05) and names what the rework in `revnix/rext-control` is changing; the audit behind it is that repository's `reports/app/01-rext-admin-audit.md`. Where this file and the code disagree, the code wins: say so and fix the file.

## Overview

A Next.js 16 App Router application (16.3 in the lockfile, Turbopack), mostly client-rendered (46 of the 55 pages outside `app/admin` are `"use client"`), that talks to one backend, `rextaihq/rext-backend` (FastAPI mounted in a LangGraph server). It holds no database.

- **Backend address:** `lib/api-base-url.ts` resolves it from `NEXT_PUBLIC_BACKEND_API_URL`, then `NEXT_PUBLIC_API_BASE_URL`, then `http://127.0.0.1:2024` outside production. The generation routes reach the LangGraph API through `LANGGRAPH_API_URL` (`lib/generate-content/thread-access.ts`).
- **Authentication:** next-auth 5 beta (`auth.config.ts`, `auth.ts`): a Credentials provider that calls the backend's login, plus Google and GitHub; JWT sessions with refresh-token rotation against the backend. The root layout seeds the client `SessionProvider` from `auth()`.
- **The route guard** is `proxy.ts` (Next 16's replacement for middleware). It reads the token with `getToken` from `next-auth/jwt`, sets a CSP with a per-request nonce (`lib/csp.ts`), redirects to `/login` outside `publicRoutes`, checks `/w/*` against the workspace, and gates `/admin/*` by role or permission (`PROTECTED_ROUTES`). Its matcher skips `/api`, `_next`, the favicons and `/logos`.

```text
app/
  layout.tsx                fonts, the provider stack (Lemon Squeezy script, theme, auth, PostHog, SSE, Query, tooltip), the toaster
  page.tsx                  the dashboard (/), inside the shell
  w/[workspaceSlug]/        the workspace pages: generate_content (+ library), content (+ [id] the editor, calendar, create),
                            personas (+ [personaId], create), brand_voice, members, integrations, knowledge (+ [kbId]),
                            topics (+ [id], create, create/results), settings (+ trash); page.tsx redirects to /
  w/, w/create              all workspaces; create a workspace
  settings/                 the account hub, security, sessions, subscription, trash (billing redirects to subscription)
  subscription/, billing/, usage/, licenses/, pricing/, checkout/{success,cancel}, profile/ (redirects to /settings)
  login/, signup/, forgot-password/, reset-password/, verify-email/, account-recovery/,
  invitations/accept/, accept-invitation/, accept-admin-invitation/      the auth pages, outside the shell
  legal/                    terms, privacy, refund policy, subscription terms
  admin/                    the 16 super-admin pages (guarded in proxy.ts and app/admin/layout.tsx)
  topics/                   no route: the client components and the one server action the /w/[slug]/topics pages use
  api/auth/[...nextauth]    next-auth
  api/generate/**           the generation proxy: threads (start), [threadId]/{stream,join,resume,status,cancel}
  coming-soon/, maintenance/, examples/permission-ux/                     reachable only by typing the address
components/
  ui/                       the shadcn-based primitives, plus duplicates the rework retires (see AGENTS.md)
  page-layout.tsx           the shell today: sidebar, header, page header, the dock (46 importers)
  app-sidebar.tsx, workspace-switcher.tsx, page-header.tsx, background-generation-dock.tsx, data-table.tsx
  <feature>/                one folder per area: generate-content, content, personas, integrations, knowledge, …
lib/                        api-client/ (the typed client), query-keys.ts, query-options/, routes.ts (workspaceRoutes,
                            settingsRoutes), permissions.ts, generate-content/, analytics.ts (PostHog), logger.ts (pino), utils.ts (cn)
hooks/                      data hooks (use-content, use-personas, …), mutations/, use-sse-channel, use-credit-gate, use-permission
stores/                     Zustand stores (README.md sets the import rule)
services/                   the older API wrappers, being retired in favour of lib/api-client
schemas/                    zod schemas for forms and for server-sent events
providers/                  the context providers mounted in app/layout.tsx and the workspace layout
types/                      the API types, written by hand (no generated client)
```

## The shell

There is no shell layout yet. `app/w/[workspaceSlug]/layout.tsx` checks the session and mounts `WorkspaceProvider` and an error boundary, with no chrome; every page mounts `components/page-layout.tsx` itself, so each page decides its title, width (`fullWidth`, `max-w-[1600px]` otherwise) and whether the header shows (`hideTitle`). `PageLayout` composes shadcn's sidebar (`components/app-sidebar.tsx`, nav groups written in the component and filtered by `useFilteredNavigation`), a sticky header (sidebar trigger, the credit widget, notifications, the settings, help, theme and profile menus; the search is switched off), `PageHeader`, the page, and the background-generation dock. `app/settings/layout.tsx`, `app/legal/layout.tsx` and the workspace settings layout mount `PageLayout` for their pages.

The workspace comes from the slug in the URL (`WorkspaceProvider`, `stores/workspace`); the switcher lists the user's workspaces and keeps the current page when switching (`lib/routes.ts`). Under 1024 px (`hooks/use-mobile.ts`) the sidebar becomes a sheet.

The rework's plan C (tasks C1 and C2) moves the sidebar, the header and the dock into the workspace and account layouts and gives every page one of five layouts (`ListPage`, `DetailPage`, `FormPage`, `SettingsPage`, `WorkingSurface`).

## Data

- **Server state** lives in TanStack Query: key factories in `lib/query-keys.ts` (some areas still use inline keys), `lib/query-options/`, and `useMutationWithToast` / `useOptimisticMutation` in `hooks/mutations/`. A component reads data through a hook.
- **The API client** (`lib/api-client/`, written by hand: `core.ts` for the base request and `ApiError`, one file per area, `endpoints.ts` for the paths) is the one place that knows the backend's URLs, headers and error shapes; `lib/api-error-middleware.ts` turns errors into toasts and redirects. Two older paths remain and are being retired: `services/*` (about ten importers) and raw `fetch(` calls in components. New code uses the client only.
- **UI state** lives in Zustand stores under `stores/`. The exception is `stores/subscription-store.ts` (870 lines), which fetches the subscription and usage itself with its own throttling; plan F moves it to TanStack Query.
- **Forms** use react-hook-form with a zod schema from `schemas/` and shadcn's `Form` (`components/ui/form.tsx`; `form-field.tsx` is a second version).
- **Permissions:** `lib/permissions.ts` names the actions; `hooks/use-permission` and `components/permission/*` (`PermissionGuard`, `RoleGuard`, …) gate the UI; the backend enforces them again. `scripts/audit_action_buttons.mjs` checks that workspace-page actions sit behind a guard.
- **Notifications** arrive as server-sent events: `providers/sse-provider.tsx` opens `/api/v1/events/{operationId}` on the backend with `@microsoft/fetch-event-source`, validates events with `schemas/sse-schemas.ts`, and `hooks/use-sse-channel.ts` routes them into `stores/notification-store.ts`.
- **Analytics:** `lib/analytics.ts` wraps `posthog-js`; `providers/posthog-provider.tsx` records page views.

## The generation flow

`/w/[slug]/generate_content` runs the keyword-to-article pipeline as a LangGraph thread. The page starts a thread through `app/api/generate/threads` (which stamps `metadata.owner` with the user's id), streams `updates`, `messages` and `custom` events from `app/api/generate/[threadId]/stream` (`client.runs.stream` with `streamResumable` and `onDisconnect: "continue"`), and answers the four gates (keyword, content type, topic, outline) through `resume`. The routes call LangGraph with the signed-in user's backend access token (`getGenerationClient` in `lib/generate-content/thread-access.ts`), and every `[threadId]` route calls `requireThreadOwner` first, which refuses a thread whose `metadata.owner` is not that user. The backend's LangGraph auth (rext-control#195) stamps and filters the same field from the same token; until it is on, this check is the only one. An expired token answers `TOKEN_EXPIRED`, which `authenticatedFetch` turns into a session refresh and a retry.

The page component is `components/generate-content/fresh-generation-view.tsx` (about 2,300 lines, a reducer in `lib/generate-content/generation-reducer.ts`); the article is edited again at `/w/[slug]/content/[id]` with the same `ContentEditor` (`components/generate-content/content.tsx`, Lexical). The user can leave: the run continues on the server, the dock (`components/background-generation-dock.tsx`, `stores/background-generation-store.ts`, persisted, synced across tabs through localStorage) polls `status` and shows progress, and a notification arrives when the backend has written the draft to the content library. `BACKGROUND_CONTENT_GENERATION.md` describes the lifecycle in full.

Credits are charged by the backend, per pipeline stage. `hooks/use-credit-gate.tsx` is the one gate before a run starts or continues; it asks for a whole article's worth of credits before a start.

## Styling

Tailwind CSS v4 through `@tailwindcss/postcss`, configured in `app/globals.css` (about 1,860 lines): a TailAdmin-derived `@theme inline` with full scales for brand (`#465fff`), gray and the status colours, shadcn's semantic variables in `:root` and `.dark`, then component classes, the wizard's media queries and the `.blog-content` article styles. The fonts are Outfit, Inter and Geist Mono through `next/font/google`. A dark theme exists, switched by the app's own `ThemeProvider` and a `.dark` class. Components still use about 1,800 stock palette classes and over a hundred colour literals.

The rework replaces this underneath (plan B): three token layers in `globals.css` (primitives, roles, component tokens), Tailwind's palette switched off, light only, and `pnpm tokens:check` failing a literal. Until then, AGENTS.md says how new code is written.

## Tests and tooling

- **Tests:** Jest 30 through `next/jest` with jsdom (`jest.config.ts`, `jest.setup.ts` mocks the router, `matchMedia`, the observers, the query client and `next-auth/react`); 14 test files in `__tests__/`.
- **Lint and format:** Biome 2 (`biome.json`); `lint:imports` adds the stores import rule (it needs `rg`); `lint:ui-comments` refuses TODO, FIXME, XXX and HACK comments in `components/ui` and `lib`.
- **Pre-commit:** Husky runs format, lint, `lint:ui-comments` and `tsc --noEmit` on every commit.
- **CI:** `.github/workflows/ci_cd.yaml` deploys on pushes to `main` (production) and `staging` (the staging target) through the Vercel CLI, and runs no checks on pull requests yet (rework task 0.4 adds them).
- **TypeScript:** strict, `typedRoutes: true` in `next.config.ts`, the `@/*` path alias.

## Traps

- A new public page must be added to `publicRoutes` in `proxy.ts`, or it redirects to `/login`.
- `typedRoutes` is on: a path built at run time needs `as Route`, and a removed page leaves stale types in `.next/dev/types` that fail the type check until they are deleted (`../rext-control/scripts/app/check.sh` deletes them).
- `next.config.ts` redirects `/settings/billing` to `/settings/subscription`: the billing page under `app/settings/billing` is unreachable.
- Import stores from their domain barrel (`@/stores/workspace`) or their own file, never from `@/stores`.
- `NEXT_PUBLIC_*` values are compiled into the browser bundle wherever client code reads them. `lib/api-middleware.ts` reads the content key as `NEXT_PUBLIC_CONTENT_API_KEY` in a server route; keep every read of it on the server.
- A merge into `staging` deploys the staging app; a merge into `main` deploys app.rext.ai.
- pnpm is the package manager and `pnpm-lock.yaml` the only lockfile (Vercel installs from it). The `Dockerfile` still copies `package*.json` and runs `npm ci`, so it no longer builds; nothing in CI or the Vercel deploy uses it.
- `lucide-react` 1.x is the one icon library. It has no brand icons and sets `aria-hidden` on every icon by default, so an icon-only button needs its own label.
