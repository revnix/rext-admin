# Frontend Codebase Assessment (wrext-admin)

## Architecture Snapshot
- Next.js 15.5 with React 19.1 (`package.json`) plus App Router, client-heavy data fetching, Zustand for wizard state, TanStack Query for server state, Tailwind CSS v4 (alpha) and Radix UI.
- Tooling: Biome for lint/format, Jest + Testing Library, but Jest config still relies on `ts-jest` instead of the `next/jest` SWC pipeline.
- Service layer intends to wrap backend access via `BackendService`, yet hooks/components frequently bypass it with direct `fetch`, leading to duplicated logic paths.

## Gaps & High-Risk Issues
- **Secrets exposed in repo and browser**: Real API keys live in `wrext-admin/.env:2-19`, and the same value is mirrored as `NEXT_PUBLIC_CONTENT_API_KEY`, so it is bundled into the client via `hooks/use-topics.ts:7-28` and `services/backend.ts:331-343`. This violates best practices and OpenAI/Groq ToS; move secrets to a git-ignored `.env.local` and proxy calls through server routes.
- **Backend service misconfiguration**: The default validation config skips output validation (`services/backend.ts:89-96`), erasing the safety net Zod schemas were written for. The health check also always POSTs (`services/backend.ts:844-858`), which will fail against standard GET health endpoints.
- **Client shipping dev tooling**: `ReactQueryDevtools` is mounted unconditionally in production (`providers/query-provider.tsx:23-26`), bloating bundles and exposing diagnostics. Gate it behind `process.env.NODE_ENV`.
- **Reload-based error recovery**: `app/topics/page.tsx:48-53` calls `window.location.reload()` instead of invalidating the query. This breaks SPA expectations and loses state; call `queryClient.invalidateQueries()` or expose a `refetch` from `useTopics`.
- **Topic transformer fabricates metadata**: `lib/simple-topic-transformer.ts:72-85` replaces backend timestamps/actors with `new Date()` defaults, which corrupts audit trails and ordering. Preserve backend fields (or mark missing ones as null).
- **Wizard validation stub**: `stores/topic-builder-store.ts:190-194` returns `true`, so the TypeForm flow never blocks invalid progression. Implement per-step validation aligned with `React Hook Form` schema to avoid garbage payloads.
- **LocalStorage usage without SSR guard**: The persisted store calls `createJSONStorage(() => localStorage)` at module load (`stores/topic-builder-store.ts:343-354`). When imported in a server component this will throw; wrap access in a `typeof window !== "undefined"` guard or dynamically import the store client-side.
- **Inconsistent query defaults**: Global query config forces `refetchOnMount/windowFocus` to `true` (`lib/query-client.ts:17-27`), but both topic hooks override to `false` (`hooks/use-topics.ts:52-57`, `109-113`). Consolidate behaviour or you will see stale caches in some flows and double fetches in others.
- **Testing suppression hides bugs**: The Jest setup swallows unhandled rejections and `console.error` for backend errors (`jest.setup.js:62-80`), masking legitimate failures. Remove these overrides once flaky tests are fixed.

## Redundancies & Structural Smells
- **Parallel data paths**: `BackendService` already manages retries, analytics, and response normalization, yet hooks bypass it with raw `fetch` and manual shape handling (`hooks/use-topics.ts:23-56`). Consolidate on a single abstraction to reduce drift.
- **Duplicated error metadata**: `lib/error-utils.ts` and `lib/response-utils.ts` both define request-id helpers (`lib/response-utils.ts:40-58`) and mappings. Centralize to avoid inconsistent IDs across logs.
- **Legacy exports**: `generateTopicsWithBackend` is flagged deprecated but still exported (`services/backend.ts:898-901`). If no call-sites remain, remove it to prevent regressions when the signature changes.

## Documentation, Types & Test Drift
- README advertises `npm run type-check` and `/api/topics/*` endpoints that do not exist (`wrext-admin/README.md:50-118`), causing onboarding confusion. Align docs with current routes (`/api/topic/*`) and scripts.
- Tailwind v4 is still in alpha; call this out in docs and define a downgrade path. CSS tokens in `app/globals.css` rely on that pipeline.
- Component architecture spec (`docs/component-architecture.md:29-78`) references folders like `question-parts/OptionCard.tsx` that are no longer present, so contributors will chase dead ends. Refresh the doc to match `components/topic-builder/wizard`.
- TypeScript excludes tests from type-checking (`tsconfig.json:25-33`), yet Jest runs `.ts` tests. Reinstate tests in the include set or add a separate `tsconfig.test.json`.
- Jest still uses `ts-jest` (`jest.config.js:38-48`), which is incompatible with React 19 features and slower than SWC. Switch to the default `createJestConfig` transform and remove the explicit preset/transform block.

## Refactoring & Improvement Ideas
- Introduce a server-side BFF layer (e.g. Next Route Handlers or Server Actions) that owns backend communication, so API keys remain server-side and clients call `/api/*` without credentials.
- Flip `skipOutputValidation` back to `false` and track validation metrics with logging (the plumbing already exists in `BackendService`). Use the Zod issues to power UI error states instead of silent failures.
- Replace reload button with a reusable `ErrorState` component that calls `queryClient.invalidateQueries(['topics'])` or `useTopics().refetch()`.
- Extract the score weighting in `transformTopicForDisplay` into shared config with the backend to avoid diverging logic when weights change.
- Implement real step validation by reusing the existing Zod schema from `schemas/topic-builder` so the wizard can highlight missing fields before API calls.
- Guard Zustand persistence with `if (typeof window === 'undefined') return undefined;` or load the store dynamically to keep SSR safe.
- Gate `ReactQueryDevtools` and any analytics logging behind an environment flag to keep production lean.
- Introduce automated schema drift tests comparing frontend `BackendTopicGenerationPayload` against backend Pydantic models (see backend analysis) to prevent payload mismatch.

## Additional Suggestions
- Add a sanitized `.env.example` (no real keys) and remove `NODE_ENV` from the committed `.env` — Next injects it automatically.
- Consider waiting for Next.js 15 stable before shipping; if you stay on the canary, follow the release notes for breaking changes (React 19 concurrent behaviours still evolving).
- Document Tailwind v4 migration steps and add a PostCSS fallback until v4 leaves alpha to avoid editor/tooling mismatches.
- Add smoke tests for the topic list query using MSW to assert consistent response handling once the service layer is unified.
