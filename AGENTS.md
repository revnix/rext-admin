<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Working on this repository

The Rext AI dashboard (app.rext.ai): Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS v4, shadcn on Radix, TanStack Query, Zustand, react-hook-form with zod, next-auth 5 (beta), Lexical for the editor. It holds no database: everything comes from the backend (`rextaihq/rext-backend`, FastAPI and LangGraph) over HTTP and server-sent events, so nothing past `/login` renders without it.

Codex and Claude Code both read this file (`CLAUDE.md` imports it). Keep it under 150 lines; procedures live in skills, the map of the code in `ARCHITECTURE.md`. The rework's plan, rules and tasks are in the private repository `revnix/rext-control` (`app/BRIEF.md`, and the design language in `design/app-language.md`); a session working one of its tasks reads the brief before anything else. Its clone sits beside this one, so from a rework worktree its scripts are `../rext-control/scripts/app/`.

## Branches

- **`main` is what app.rext.ai runs.** Never branch from it, target it or push to it.
- **`staging` is the base branch.** Every branch starts from `origin/staging` and every pull request targets `staging`. **A merge is a deploy:** a push to `staging` deploys the staging app (`.github/workflows/ci_cd.yaml`, a Vercel deploy with `--no-wait`), so a broken build shows in the Vercel dashboard, not in Actions.
- One task, one branch, one pull request, kept small. Rework branches are named `app/<task>-<slug>`, each in a worktree of its own, and are merged by `../rext-control/scripts/app/merge.sh` (rebase and merge), never by hand.
- The team merges here daily. Rebase on `origin/staging` before your checks and before your merge, push your own branch with `--force-with-lease`, and never rewrite a commit that is not yours. A rework clone keeps no tracking ref for a task branch, so the bare flag is refused as stale: name the head you last pushed (the pull request shows it), `git push --force-with-lease=<branch>:<that sha> origin <branch>`.
- For Claude Code sessions, `.claude/settings.json` and the hooks in `.claude/hooks/` refuse reading an env file (every `.env` name and `.envrc` but `*.example`, through any tool or program; `test -s` and `grep -c` stay allowed), every `vercel` command, a push to `main`, `staging` or `stage` or of every branch, and a forced push other than `--force-with-lease`. They read each command as text, so they stop mistakes, not a program written to get round them.

## Secrets and services

- `.env` and `.env.local` hold the backend's address and keys. Never commit, print or paste a value from them; `test -s .env` checks that one exists, and `.env.example` lists the names. A variable starting with `NEXT_PUBLIC_` is compiled into the browser's code wherever client code reads it, so a secret never takes that prefix.
- `env.ts` lists every variable the code reads, with its check (`@t3-oss/env-nextjs`); `next.config.ts` imports it, so `next build` stops on a missing or malformed one and names it. A new variable is added there first.
- Rework sessions run against the local stack (the backend at `http://127.0.0.1:2024`), never a live service. Lemon Squeezy stays in sandbox mode. A real generation run spends the founder's OpenAI, DataForSEO and Tavily keys: run one only when the task is about the generation workflow.
- No AI attribution anywhere: no co-author trailers, no "generated with" lines, no mention of AI tools in commits, pull requests, comments or code.

## Commands

Node 24 and pnpm 12; `pnpm-lock.yaml` is the lockfile.

```sh
pnpm install --frozen-lockfile
pnpm dev                     # needs the backend; rework sessions use ../rext-control/scripts/app/run.sh admin
pnpm exec tsc --noEmit       # type check
pnpm lint                    # biome check; pnpm format writes the fixes
pnpm lint:imports            # biome, plus the stores import rule in stores/README.md
pnpm test                    # jest; pnpm test:ci adds coverage
pnpm build                   # production build; about 2 GB of memory
pnpm tokens:check            # design values outside the tokens; a per-file ratchet (scripts/tokens-baseline.json)
pnpm layout:check            # pages outside the five layouts, hand-written page widths, headings, tables, fields; a ratchet
pnpm api:types               # lib/api-client/schema.d.ts from api/openapi.json, the backend's spec (ARCHITECTURE.md, the API client)
pnpm a11y                    # axe, focus and reduced motion in Playwright, on a build started with REXT_DEV_PAGES=1 (playwright.config.ts)
pnpm perf                    # Lighthouse CI's budgets on five pages, after a build (lighthouserc.json)
```

- The Husky pre-commit hook runs Biome on the staged files only (their fixes are staged with them); never skip it with `--no-verify`. The type check, the full lint and the tests run in CI (`pr-checks.yaml`) and in `check.sh`, not on commit.
- `pnpm tokens:check` fails when a file gains a stock palette class, a colour literal, a `dark:` class or an off-scale radius, shadow or font size; mark a line that must stay with `tokens-ok: the reason`. After lowering a file's count, run `pnpm tokens:check --update` (it only ever lowers the baseline). `pnpm layout:check` works the same way (`layout-ok: the reason`, `--update`, `scripts/layout-baseline.json`).
- A dev server takes over 1 GB of memory: stop it when you are done.

## Code

Read `ARCHITECTURE.md` before your first change: routes, the shell, the data layer, the generation stream, styling and the traps.

- **Next.js:** read the guide in `node_modules/next/dist/docs/` for the API you are about to use. The route guard is `proxy.ts` (Next 16's replacement for middleware); a new public page is added to its `publicRoutes`. `typedRoutes` is on, so a computed path needs `as Route`.
- **Styling:** Tailwind CSS v4, configured in `app/globals.css`. The rework (plan B) moves every colour, size, radius and shadow into tokens there and switches Tailwind's palette off. New and changed code follows that already: semantic classes (`bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-primary`, `text-destructive`), no stock palette class (`text-slate-900`, `bg-blue-600`), no `bg-[#…]` or other colour literal, no new `dark:` class (the rework retires dark mode; it returns later as one block of roles), no gradient, glow or coloured icon chip. A value with no token yet goes into `globals.css` through the token tasks, not into a component.
- **Primitives:** `components/ui/` holds the shadcn-based primitives. The states are one each: `Notice` (info, warning, danger, success), `EmptyState`, `Skeleton` with `useShowAfter` (or a layout's `PageSkeleton` in a `loading.tsx`), `ErrorBoundary`, `RouteError` for `error.tsx`, `Meter`, `ScoreRing`, and `Badge` as a word with no icon. A confirmation's buttons name the action. Before writing a component, look for one that already does the job; never add another copy.
- **Pages:** the route layouts mount the shell (`components/shell/`: the sidebar, the header, the dock); a page never does. A page renders one of the five page layouts from `components/layouts/` (`ListPage`, `DetailPage`, `FormPage`, `SettingsPage`, `WorkingSurface`; `ARCHITECTURE.md` says which is for what), and sets no widths, paddings, heading sizes, card, table or field styles of its own. A new area outside these folders gets the shell by rendering `ShellLayout` from its `layout.tsx`.
- **Filters in the URL:** a list's search, filters and page live in the URL through `nuqs` (the adapter is in `app/layout.tsx`), so a reload or a shared link keeps them. Each list's parsers are one module in `lib/search-params/` (a table's built from `dataTableParams`), read in the page by `useDataTableUrlState` (or `useQueryStates` outside a table) and by its `createLoader` on the server.
- **Data:** server state through TanStack Query (`lib/query-keys.ts`, `lib/query-options/`, `hooks/mutations/`); UI state through Zustand (`stores/`; its README sets the import rule); the API client in `lib/api-client/`. New code never `fetch`es the backend from a component and never imports `@/services` (both older paths are being retired).
- **Forms:** a zod schema in `schemas/`, `useZodForm(schema)` (validation on blur, then on change; focus to the first error), each field a `FieldController` on shadcn's Field, the whole a `FormShell` (sections, the submit row, the leave guard) in `components/forms/`; create and edit on pages, a dialog only for a single-purpose action of four fields or fewer. Every form is on the field set; the older `components/ui/form.tsx` wrappers are gone.
- **Icons:** `lucide-react` only, 16 or 20 px, never inside a coloured square. It is the only icon library installed; lucide 1.x has no brand marks (draw one with lucide's `createLucideIcon` if a page needs it).
- **Words:** sentence case in titles, buttons and navigation; no "AI" badges and no sparkle icons.
- Match the code around your change: its naming, its structure, how much it comments.

## Before a pull request

1. The branch holds the current `origin/staging`, and `../rext-control/scripts/app/check.sh` passes (add `--build` for dependencies, `next.config.ts`, `app/globals.css`, the shell or a layout). Outside the rework, the commands above pass, the build included.
2. You clicked through the pages you changed on the dev server at 390, 820 and 1440 px (rework sessions capture them with the `rext-app-visual-check` skill).
3. The pull request body says what changed, why, how it was checked and what is not in it, and names the task.
4. On GitHub, `pr-checks` (`.github/workflows/pr-checks.yaml`) runs the route types, the type check, Biome, `tokens:check` / `layout:check` (once they exist), Jest, the production build, and `pnpm a11y` and `pnpm perf` against that build on every push. If the repository goes private again, Jest, the build and the checks against it run only with the label `build`, since the Free plan's Actions minutes are then shared with the deploys.

## Code Review Rules

For the reviewer (Codex reads this section). Flag, in the lines a pull request adds or changes:

- an auth or permission check moved after the work it guards, or a page or action that skips `proxy.ts`, `PermissionGuard` or the backend's own check;
- a route handler or server action that trusts a user, workspace or role id sent by the client;
- a secret or token in a log line, in a `NEXT_PUBLIC_` variable or in client code;
- a request or response shape the backend does not have (`lib/api-client/endpoints.ts` lists the paths);
- a component that fetches the backend directly instead of through `lib/api-client` and a query hook;
- a price, a credit amount or a plan name typed into the code instead of read from the backend;
- a colour, size, radius or shadow written as a literal, a stock palette class, or a `dark:` class;
- a page that writes its own layout, table or field instead of the shared ones;
- a change that would push or deploy to `main`.

Do not repeat what Biome and the type check already enforce.
