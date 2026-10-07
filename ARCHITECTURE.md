# Architecture: the Rext AI dashboard

A map of how this repository is put together, for whoever is about to change it. It describes the code on `staging` as it is (checked 2026-10-05) and names what the rework in `revnix/rext-control` is changing; the audit behind it is that repository's `reports/app/01-rext-admin-audit.md`. Where this file and the code disagree, the code wins: say so and fix the file.

## Overview

A Next.js 16 App Router application (16.3 in the lockfile, Turbopack), mostly client-rendered (46 of the 55 pages outside `app/admin` are `"use client"`), that talks to one backend, `rextaihq/rext-backend` (FastAPI mounted in a LangGraph server). It holds no database.

- **Environment:** `env.ts` lists the variables the code reads and checks them when `next.config.ts` loads (`@t3-oss/env-nextjs`); a production build also needs the backend's address as `NEXT_PUBLIC_API_BASE_URL` (the auth pages read it alone) and the session secret as `AUTH_SECRET` or `NEXTAUTH_SECRET` (not Vercel's previews of pull requests, which are built without the deploys' variables). `SKIP_ENV_VALIDATION=1` skips the check.
- **Backend address:** `lib/api-base-url.ts` resolves it from `NEXT_PUBLIC_BACKEND_API_URL`, then `NEXT_PUBLIC_API_BASE_URL`, then `http://127.0.0.1:2024` outside production. The generation routes reach the LangGraph API through `LANGGRAPH_API_URL` (`lib/generate-content/thread-access.ts`).
- **Authentication:** next-auth 5 beta (`auth.config.ts`, `auth.ts`): a Credentials provider that calls the backend's login, plus Google and GitHub; JWT sessions with refresh-token rotation against the backend. The root layout seeds the client `SessionProvider` from `auth()`.
- **The route guard** is `proxy.ts` (Next 16's replacement for middleware). It reads the token with `getToken` from `next-auth/jwt`, sets a CSP with a per-request nonce (`lib/csp.ts`), redirects to `/login` outside `publicRoutes`, checks `/w/*` against the workspace, and gates `/admin/*` by role or permission (`PROTECTED_ROUTES`). Its matcher skips `/api`, `_next`, the favicons and `/logos`.

```text
app/
  layout.tsx                the font variables on <html>, the provider stack (Lemon Squeezy script, auth, PostHog, SSE, Query,
                            Motion, the workspace welcome gate, nuqs), the toaster
  fonts.ts, fonts/          the three faces, self-hosted through next/font/local (licences in public/fonts/licenses)
  globals.css, styles/      the design tokens; the content wizard's and the generated article's own styles
  (home)/                   the dashboard (/): a route group, so the home page gets the shell's layout
  w/[workspaceSlug]/        the workspace pages: generate-content (+ library), content (+ [id] the editor, calendar),
                            personas (+ create, [personaId], [personaId]/edit), integrations, settings (General, brand-voice, members,
                            danger-zone); page.tsx redirects to /; /brand_voice and /members redirect to their settings
                            sections; /topics and /knowledge redirect (both features are removed)
  w/, w/create              all workspaces; create a workspace; w/layout.tsx mounts the shell for every /w page
  edit/[workspaceSlug]/[id] the full-screen article editor, outside the shell (a /w page always gets it): the article
                            saves by itself (hooks/use-autosave.ts), with its text kept on the device until a save works
  settings/                 account settings: Profile, security (and sessions), notifications, subscription (Billing),
                            data (export, the trash, closing the account); /profile, /settings/sessions and
                            /settings/trash redirect to their sections, billing to subscription
  pricing/                  the plan grid and its questions in the shell (components/billing/), every number from
                            the public catalogue GET /api/v1/plans; signed out, proxy.ts sends the site's pricing page
  subscription/, billing/, usage/, checkout/{success,cancel}
  login/, signup/, forgot-password/, reset-password/, verify-email/, account-recovery/,
  invitations/accept/, accept-invitation/, accept-admin-invitation/      the auth pages, outside the shell
  legal/                    terms, privacy, refund policy, subscription terms
  admin/                    the 12 super-admin pages (guarded in proxy.ts and app/admin/layout.tsx)
  api/auth/[...nextauth]    next-auth
  api/generate/**           the generation proxy: threads (start), [threadId]/{stream,join,resume,status,cancel}
  maintenance/              reachable only by typing the address
  dev/                      development only (a production build answers 404): tokens/ (every token and its contrast) and
                            primitives/ (every primitive in each variant and state, the five layouts)
components/
  ui/                       the shadcn-based primitives, plus duplicates the rework retires (see AGENTS.md)
  shell/                    the shell: the frame, sidebar, switcher, header, credits meter, user menu, phone bottom bar
  layouts/                  the five page layouts (ListPage, DetailPage, FormPage, SettingsPage, WorkingSurface), their
                            shared header and frame
  background-generation-dock.tsx
  <feature>/                one folder per area: generate-content, content, personas, integrations, …
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

The route layouts mount the shell, so it stays mounted while pages change: `app/w/layout.tsx` (every /w page), `app/(home)/layout.tsx` (/), and the layouts of settings, pricing, subscription, billing, usage, legal and admin each render `ShellLayout` (`components/shell/shell-layout.tsx`). It reads the sidebar's saved state from the `sidebar_state` cookie on the server and renders `AppShell`: shadcn's sidebar (`components/ui/sidebar/`), the header, the impersonation banner, the page in `main#main-content`, the background-generation dock, and under 1024 px a bottom bar. A page never mounts the shell; going from one of these areas to another mounts it again, which loses nothing (the sidebar state is in the cookie, the data in the query cache).

- **The sidebar** (`app-sidebar.tsx`) follows `design/app-language.md` §5: the wordmark, the switcher (`workspace-switcher.tsx`), Generate (shortcut C, `use-generate-shortcut.ts`), Home, Content with a drafts badge, Keywords (the keyword library, which sits under Generate in the URL), Calendar, the Setup group, Settings, and the admin group for the roles that hold it; the credits meter and the user menu at its foot. The items, their permissions and the current page come from `use-shell-navigation.ts`, which the bottom bar reads too; a new page under a workspace is marked by the longest item URL its path starts with.
- **Widths:** one cutoff, 1024 px (`hooks/use-mobile.ts`, Tailwind's `lg`): below it the sidebar is a sheet. From 1024 to 1279 px it shows icons only until the person clicks the trigger; the choice ("expanded" or "collapsed") then holds at every width. In the sidebar, `data-collapse="hide"` removes an element in the icon rail and `data-collapse="label"` keeps it for screen readers only.
- **The header** (`app-header.tsx`): the breadcrumb (`lib/shell-breadcrumbs.ts` derives it from the path), the credits meter, notifications and help. There is no search and no theme toggle.
- The workspace comes from the slug in the URL (`WorkspaceProvider`, `stores/workspace`); the shell sits above the provider, so it reads the slug with `useParams` and the workspace from the store. The switcher lists the user's workspaces and keeps the current page when switching (`lib/routes.ts`).

## The page layouts

Every page inside the shell renders one of the five layouts of `design/app-language.md` §6 from `components/layouts/`, in its `page.tsx` or in its area's `layout.tsx`. Each draws the page's frame (gutters of 16, 24 and 32 px; `--content-max` wide, or the full width for a working surface) and its header (`PageHeader`: the title as the page's one h1 in the page-title role, an optional status, the description, the actions on the right):

- **`ListPage`**: lists of things; the header, an optional `toolbar`, then the table or card grid. The admin pages, content, personas, the keyword library, integrations, all workspaces.
- **`DetailPage`**: one thing; an optional `aside` of facts beside the main column from 1024 px. Home, a persona, billing, subscription, usage, legal.
- **`FormPage`**: create and edit; the form in one column of `--form-max` (560 px). Creating a workspace; creating and editing a persona (one `PersonaForm`, `components/personas/persona-form.tsx`).
- **`SettingsPage`**: rendered by a settings area's `layout.tsx` with its `sections` (plain `{ label, href }`, so a server layout can pass them): a list on the left from 768 px, a select on a phone, the current section by the longest href the path starts with; each section at most 48 rem wide. Account settings (`app/settings`: Profile, Security and sessions, Notifications, Billing, Data and trash) and workspace settings (`app/w/[workspaceSlug]/settings`: General, Brand voice, Members, Danger zone, each listed only for the people who may open it).
- **`WorkingSurface`**: full width; an optional `side` pane that becomes a sheet under 1024 px. Generate and its keyword library, the editor, the calendar (`components/calendar/`: the month grid on `@dnd-kit/core`, where a scheduled article drags to another day, the board by status and the list; its lens and month in the URL, `lib/search-params/calendar.ts`). `hidden` keeps the title as a screen-reader h1 where the surface draws its own visible heading (an h2); `ownHeading` is for the editor, whose article title is the page's h1; `flush` drops the room above and below.

`loading.tsx` files render `PageSkeleton` (`layout` list, detail or form; `rows`, `stats`), which draws its layout's shapes in `PageFrame`, the same frame; under `SettingsPage` they render `SectionSkeleton`. Both appear only after 200 ms, by a CSS delay, so it works on the server. `pnpm layout:check` (`scripts/check-layout.mjs`) holds the rule: a page in the shell without one of the five fails, and so does a page width written by hand, an `<h1>` outside the layouts' header, a hand-written `<table>` and a field styled by hand; `{/* layout-ok: the reason */}` excuses one element, and `scripts/layout-baseline.json` holds today's tables and fields until C3 and C4 replace them.

## Tables

A list is a `DataTable` (`components/ui/data-table/`), on TanStack Table v9 with one set of features (`features.ts`). Its columns come from `createDataTableColumnHelper<T>()` at module scope, and their `meta` gives `align` and `numeric`. It brings a toolbar (search, faceted filters, the view menu), headers that sort and carry `aria-sort`, a `…` menu per row, selection with bulk actions, and pagination. It also brings the states: a skeleton after 200 ms, an error, the empty state outside the table, and a no-results state with Clear filters. Under 640 px the rows become cards through `renderCard`. The state is local, or in the URL through `useDataTableUrlState(parsers)`; a list's parsers live in `lib/search-params/`, built from `dataTableParams` (`url-state.ts`, safe for server code). `manual` is for lists the server pages. The content library loads every item (`useAllContent`) and filters in the browser, because the backend's list has neither search nor sort. Every list in the app is on it; the admin users list keeps its search, filters and page in the URL too (`lib/search-params/admin-users.ts`), and the server applies them.

## Forms

A form is built from `components/forms/`. Its schema lives in `schemas/` (the persona form's runs the shared rules in `lib/validation/persona-validation.ts`).
- `useZodForm(schema)` sets the timing: `mode: "onTouched"` and `reValidateMode: "onChange"`, so a field is checked when it loses focus and then on each change; `shouldFocusError` moves focus to the first error on a failed submit.
- `FieldController` is one field on shadcn's Field: the label above (a leading asterisk when required), the control, and the help text beneath, which the error replaces; it wires `id`, `aria-invalid` and `aria-describedby`. `maxLength` adds a character count.
- `PasswordInput` is the control of a password field: the Input with a show/hide button at its end.
- `FormShell` owns the rhythm: sections (`FormSection`) 32 px apart, fields 16 px apart, and the submit row, where Save stays enabled until the submission starts and then shows a spinner. The row can be sticky on long forms, and a `status` slot shows the inline "Saved". It guards against leaving with unsaved changes: the browser's prompt on reload or close, and a dialog for a link inside the app or the form's Cancel (`use-leave-guard.ts`; the App Router has no navigation events, so the guard watches link clicks).

The persona form (create and edit), workspace settings (General), and the login and sign-up forms are on it (the sign-in forms use the field set without `FormShell`: they have no leave guard and one full-width button); the forms on the older `components/ui/form.tsx` move later.

## States

One component each (design/app-language.md §8), in `components/ui/`:
- `Notice` is the one box for info, warning, danger and success (icon, title, text, one action, an optional `onDismiss`), with `role="alert"` for danger and warning: a failed load says what happened and what to do, in place of what failed;
- `EmptyState` is a title, one sentence and one action, with no picture, and `as="h1"` on pages outside the shell;
- `Skeleton` shows through `useShowAfter` (`hooks/use-show-after.ts`, 200 ms) in client code, or through `PageSkeleton` and `SectionSkeleton` (`components/layouts`) for a page, so a fast load shows nothing;
- `ErrorBoundary` (`error-boundary.tsx`, on `react-error-boundary`) puts a danger Notice with Try again in place of a part that throws, and retries its failed queries; `title` names what failed;
- `RouteError` is every `error.tsx`: `layout="container"` in the shell (a Notice in the page's frame), `"inline"` under a layout.tsx that draws a page layout (settings), `"fullscreen"` outside the shell (an EmptyState page). It logs the error and shows only its digest;
- `Meter` shows credits and limits, in the warning colour when low;
- `ScoreRing` is the one 0 to 100 score;
- `Badge` is a word: `neutral` by default, or one of the four status tints, text only. shadcn's variant names draw the same quiet badges;
- `ConfirmationDialog` and `useConfirmation` ask before an action, with buttons that name it and its opposite ("Delete article", "Keep article"); a `Dialog` takes the whole screen under 640 px.

`alert.tsx` stays only for `components/account-settings/privacy-settings.tsx`, which rext-admin#416 is rewriting; it goes when that last user moves (C5b #449).


Every primitive renders at `/dev/primitives` (development only), in its variants and states; a change to one is looked at there first, at 390, 820 and 1440 px.

## Data

- **Server state** lives in TanStack Query: key factories in `lib/query-keys.ts` (some areas still use inline keys), `lib/query-options/`, and `useMutationWithToast` / `useOptimisticMutation` in `hooks/mutations/`. A component reads data through a hook.
- **The API client** (`lib/api-client/`, written by hand: `core.ts` for the base request and `ApiError`, one file per area, `endpoints.ts` for the paths) is the one place that knows the backend's URLs, headers and error shapes; `lib/api-error-middleware.ts` turns errors into toasts and redirects. Its request and response shapes come from the backend's OpenAPI spec, area by area: `api/openapi.json` is the spec (exported by the backend's `scripts/export_openapi.py --strict`, which its CI runs), `lib/api-client/schema.d.ts` the types generated from it (`pnpm api:types`; never edit it by hand, and CI fails when it doesn't match the spec), and an area's file aliases `components["schemas"][…]` and checks what it sends with `satisfies` (`integrations.ts` first). After a backend change to a route, export the spec from `stage` into `api/openapi.json` and run `pnpm api:types`. Two older paths remain and are being retired: `services/*` (about ten importers) and raw `fetch(` calls in components. New code uses the client only.
- **A backend deploy** restarts the API for about a minute (the proxy answers 502, then 503, which the browser mostly sees as a failed connection). The client rides it out (`lib/api-client/server-away.ts`, `ridingOutDeploy` in `core.ts`): a GET or HEAD is sent again after about 1, 3 and 8 seconds; anything else is never repeated and fails at once with "We couldn't reach the server. Try again." (`SERVER_UNREACHABLE`). When a GET's retries run out, `components/server-away-notice.tsx` (mounted in `QueryProvider`) shows "Rext is updating", asks the API's `/health/live` every 5 seconds, and reloads the queries that failed once it answers. A query doesn't retry on top of the client (`alreadyRetried`). The generation routes answer 503 with the same code when they can't reach LangGraph, and the page's restore keeps asking for three minutes before it calls a run failed (`lib/generate-content/backend-away.ts`).
- **URL state:** a list's search and filters are search params read and set through `nuqs` (`NuqsAdapter` in `app/layout.tsx`). Each list's parsers are one module in `lib/search-params/` (the content library's is `content.ts`), shared by `useQueryStates` in the page and `createLoader` on the server, so both read the URL the same way.
- **UI state** lives in Zustand stores under `stores/`. The exception is `stores/subscription-store.ts` (870 lines), which fetches the subscription and usage itself with its own throttling; plan F moves it to TanStack Query.
- **Forms** use react-hook-form with a zod schema from `schemas/` and shadcn's `Form` (`components/ui/form.tsx`).
- **Permissions:** `lib/permissions.ts` names the actions; `hooks/use-permission` and `components/permission/*` (`PermissionGuard`, `RoleGuard`, …) gate the UI; the backend enforces them again. `scripts/audit_action_buttons.mjs` checks that workspace-page actions sit behind a guard.
- **Notifications** arrive as server-sent events: `providers/sse-provider.tsx` opens `/api/v1/events/{operationId}` on the backend with `@microsoft/fetch-event-source`, validates events with `schemas/sse-schemas.ts`, and `hooks/use-sse-channel.ts` routes them into `stores/notification-store.ts`.
- **Analytics:** `lib/analytics.ts` wraps `posthog-js`; `providers/posthog-provider.tsx` records page views.

## The generation flow

`/w/[slug]/generate-content` runs the keyword-to-article pipeline as a LangGraph thread. The page starts a thread through `app/api/generate/threads` (which stamps `metadata.owner` with the user's id), streams `updates`, `messages-tuple` and `custom` events from `app/api/generate/[threadId]/stream` (`client.runs.stream` with `streamResumable` and `onDisconnect: "continue"`; the modes are `GENERATION_STREAM_MODES` in `lib/generate-content/run-events.ts`), and answers the four gates (keyword, content type, topic, outline) through `resume`. The routes call LangGraph with the signed-in user's backend access token (`getGenerationClient` in `lib/generate-content/thread-access.ts`), and every `[threadId]` route calls `requireThreadOwner` first, which refuses a thread whose `metadata.owner` is not that user. The backend's LangGraph auth (rext-control#195) stamps and filters the same field from the same token; until it is on, this check is the only one. An expired token answers `TOKEN_EXPIRED`, which `authenticatedFetch` turns into a session refresh and a retry.

The page component is `components/generate-content/fresh-generation-view.tsx` (about 2,300 lines, a reducer in `lib/generate-content/generation-reducer.ts`); the article is edited again at `/w/[slug]/content/[id]` with the same `ContentEditor` (`components/generate-content/content.tsx`, Lexical). The user can leave: the run continues on the server, the dock (`components/background-generation-dock.tsx`, `stores/background-generation-store.ts`, persisted, synced across tabs through localStorage) polls `status` and shows progress, and a notification arrives when the backend has written the draft to the content library. `BACKGROUND_CONTENT_GENERATION.md` describes the lifecycle in full.

While the page waits on the run, it shows `RunProgress` (`components/generate-content/run-progress.tsx`): the phase's stages in words (`RUN_PHASES` in `lib/generate-content/run-stages.ts`), each waiting, running, done, failed or skipped, with its time against the usual time (`run-timings.ts`: this browser's last five runs of the stage, or a typical time), and "still working" with Cancel past 1.5 times that. The stream only says when a node has finished, so a stage ends when one of its `endsAfter` nodes finishes, and a phase's last stage when the run reaches its gate (`useRunStages`).

The box also says what each stage found (rext-control#694). Every node's update carries its results and the title and outline models stream their JSON, so `useRunStages` keeps the run's findings beside its stages: `reduceFindings` in `lib/generate-content/run-findings.ts`, a pure reducer over the updates, the models' text so far, and the thread's saved state for a run picked up after a reload. `describeRun` turns them into `RunProgress`'s `header` (the keyword, a clock, the usual total, a bar of the stages done), each stage's `details` (what it will do, what it is doing, what it found, and the things under it: the top results, the sites being worked out, the titles as they are written, the outline's headings) and a footer. Only what the backend sent shows; nothing moves on a timer. The title stage is two, "Writing five titles" and "Checking each title": the backend sends no signal between them, so the end of the model's text ends the first. The article's stages (the editor's side panel) and the dock show the stages without findings.

Credits are charged by the backend, per pipeline stage. `hooks/use-credit-gate.tsx` is the one gate before a run starts or continues; it asks for a whole article's worth of credits before a start.

## Styling

Tailwind CSS v4 through `@tailwindcss/postcss`, configured in `app/globals.css`: the design tokens in three layers (primitives in `@theme static`, roles and component tokens in `:root`, utilities through `@theme inline`; `design/app-language.md` §3 in rext-control), the type roles (`text-page-title`, `text-section`, `text-body`, `text-table`, `text-label`, `text-caption`, `text-data`, `text-display`, each a size with its line height, tracking and weight) and the `num` utility for tabular figures. shadcn's variable names point at the roles. Tailwind's own palette stays on until the sweep (task B7) has moved the stock classes onto the roles. The faces are Manrope for titles (`font-display`), Inter 4.1 for the interface (`font-sans`, the default) and IBM Plex Mono for data (`font-mono`). `cn()` in `lib/utils.ts` knows the type roles, so `tailwind-merge` keeps them beside a text colour. Dark mode is retired: `dark:` classes apply nowhere until they are removed. Components still use about 1,600 stock palette classes and over a hundred colour literals.

The rework replaces this underneath (plan B): three token layers in `globals.css` (primitives, roles, component tokens), Tailwind's palette switched off, light only, and `pnpm tokens:check` failing a literal. Until then, AGENTS.md says how new code is written.

## Tests and tooling

- **Tests:** Jest 30 through `next/jest` with jsdom (`jest.config.ts`, `jest.setup.ts` mocks the router, `matchMedia`, the observers, the query client and `next-auth/react`); 14 test files in `__tests__/`.
- **Lint and format:** Biome 2 (`biome.json`); `lint:imports` adds the stores import rule (it needs `rg`); `lint:ui-comments` refuses TODO, FIXME, XXX and HACK comments in `components/ui` and `lib`.
- **Pre-commit:** Husky runs format, lint, `lint:ui-comments` and `tsc --noEmit` on every commit.
- **CI:** `.github/workflows/ci_cd.yaml` deploys on pushes to `main` (production) and `staging` (the staging target) through the Vercel CLI. `.github/workflows/pr-checks.yaml` checks pull requests into `staging`: `next typegen`, `tsc --noEmit`, `pnpm lint`, the token and layout checks (once they exist), Jest and `pnpm build` (with dummy env values) on every push; on a private repository, Jest and the build only with the label `build`.
- **Accessibility and performance (task C10):** `pnpm a11y` runs `e2e/a11y/` in Playwright: axe at WCAG 2.2 AA, the tab order (every focused element seen, ringed and uncovered) and reduced motion, at 1440 and 390 px. In pr-checks it starts the build with `REXT_DEV_PAGES=1` and opens the pages that need no backend: the signed-out ones and `/dev/primitives` (`e2e/a11y/routes.ts`). Against the local stack it takes `A11Y_BASE_URL`, `A11Y_ROUTES_FILE`, `A11Y_WORKSPACE` and a login (`A11Y_EMAIL`, `A11Y_PASSWORD`). `pnpm perf` is Lighthouse CI's budgets (`lighthouserc.json`).
- **TypeScript:** strict, `typedRoutes: true` in `next.config.ts`, the `@/*` path alias.

## Traps

- Articles start from keyword research only (`/w/<slug>/generate-content`; the old `generate_content` address redirects with a 308). The old topic-based wizard is retired: `/w/<slug>/content/create` redirects to the keyword flow (`next.config.ts`), and no page starts an article from a topic or a title.
- A new public page must be added to `publicRoutes` in `proxy.ts`, or it redirects to `/login`.
- `typedRoutes` is on: a path built at run time needs `as Route`, and a removed page leaves stale types in `.next/dev/types` that fail the type check until they are deleted (`../rext-control/scripts/app/check.sh` deletes them).
- `next.config.ts` redirects `/settings/billing` to `/settings/subscription`: the billing page under `app/settings/billing` is unreachable.
- Import stores from their domain barrel (`@/stores/workspace`) or their own file, never from `@/stores`.
- `NEXT_PUBLIC_*` values are compiled into the browser bundle wherever client code reads them, so a secret never takes that prefix.
- A merge into `staging` deploys the staging app; a merge into `main` deploys app.rext.ai.
- pnpm is the package manager and `pnpm-lock.yaml` the only lockfile (Vercel installs from it); the app is deployed by Vercel only, with no container image.
- A query held back until an id is known (`enabled: !!workspaceId`) is pending but not loading in TanStack Query v5, so a list or a detail that waits on `isLoading` shows its empty or not-found state before it has asked. Wait on `useAwaitingData(query)` (`hooks/use-awaiting-data.ts`): it also waits for the workspace's record, stops when reading it failed (show the failure then), and takes `willRun: false` where the member may not read the query.
- `lucide-react` 1.x is the one icon library. It has no brand icons and sets `aria-hidden` on every icon by default, so an icon-only button needs its own label.
