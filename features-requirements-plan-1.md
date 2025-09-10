# Feature Requirements Plan

This plan is based on a full repo audit and a quick check of current library docs and patterns in use. The project is a Next.js App Router app for generating topics, saving them, and using them to generate content.

## Architecture Snapshot (Verified)

- App: Next.js 15 App Router, React 19, Turbopack scripts in `package.json`.
- UI: Tailwind CSS 4, Radix UI, shadcn/ui patterns, lucide-react icons.
- Forms/Validation: React Hook Form v7 + Zod v4.
- State: Zustand v5 (client UI) + TanStack Query v5 (server state) with `gcTime` usage.
- Data Layer: Strong Zod schemas and transformation utilities in `lib/` and `types/` with tests.
- Backend: Separate Python service; Next API routes proxy and validate (`CONTENT_API_KEY`, `BACKEND_API_URL`).

Docs‑confirmed notes: TanStack Query v5 options used match current docs (gcTime, retry, staleTime). Tailwind v4 PostCSS plugin present. Next App Router patterns in use (providers, app/ routes) are compatible with React 19.

---

## Milestones & Deliverables

### M1 — Topic Builder UX Corrections and Copy

- Audience step should not auto‑select any audiences (current behavior is auto‑selecting top 2 on industry change).
  - Change logic in `lib/topic-builder-utils.ts:824` (updateFormDataForIndustryChange) to never pre‑select; retain only user-selected values that remain valid.
  - Update tests under `__tests__/topic-builder-utils.test.ts` that assert auto‑defaults.
  - Acceptance: Switching industry does not add any audiences; manual selections persist if valid.

- Remove geographic focus input from “Your Audience” step.
  - Remove field from the step UI, and drop related warnings in `lib/topic-builder-utils.ts` validation for step 2.
  - Acceptance: No “Geographic focus” UI or validation; form remains valid without it.

- Restrict “Type of Content” options and tie platform to Social Media only.
  - Show only:
    - Blog Post or Article
    - Social Media Post → platforms: Facebook, Instagram, Twitter, LinkedIn, TikTok, YouTube
  - Implement at UI level (do not break enums in schemas); enforce platform required only when Social Media selected.
  - Files: `components/topic-builder/steps/ContentFormatStep.tsx`, `lib/topic-builder-utils.ts` (content_type/platform rules), `types/topic-builder.ts` (labels only), `types/schemas.ts` (no enum changes; UI restricts choices).
  - Acceptance: Only listed content types appear; platform shown/required only for Social Media.

- Goals & Style “Other” input fields should be scoped per question.
  - Ensure separate “other” inputs for Purpose and Tone already present in `components/topic-builder/steps/GoalsStep.tsx:1`; add one only if Content Goal needs it; ensure fields don’t collide.
  - Acceptance: Selecting “Other” for one group does not show inputs for others; each has its own field and validation.

- Step 5 renaming + content adjustments
  - Rename “Fine Tuning” to “Advanced Options”.
  - Remove Content Language and Target Region from UI.
    - Files: `components/topic-builder/steps/AdvancedStep.tsx:1` (remove UI), `components/topic-builder/steps/ReviewStep.tsx:240` (remove display), `lib/topic-builder-utils.ts` (prompt builder: omit language/region lines), keep optional fields in payload mapping for backward compatibility but unused by UI.
  - Make “Any other requirements?” first and larger; add slider for number of topics.
    - Files: `components/topic-builder/steps/AdvancedStep.tsx:1` (reorder; slider for `num_topics` with 1–20 and live value).
  - Acceptance: Step label updated, no Language/Region UI, first control is large notes area, slider controls topic count.

- Step 6 review: switch from 3 cards to a compact grid summary.
  - Replace current cards in `components/topic-builder/steps/ReviewStep.tsx:1` with a responsive grid of labeled chips/fields with icons.
  - Acceptance: All chosen inputs visible in a single grid with clear field labels and icons.

- Generation overlay: modern/minimal with cancel + confirm.
  - Add Cancel (and close icon) to `components/topic-builder/AILoadingScreen.tsx:1`.
  - Wire real cancellation: store `AbortController` in `hooks/use-topic-builder.ts:395` and abort the `/api/generate-topics` fetch; update state accordingly. Optionally pass a `request-id` to allow server‑side cancel in the future.
  - Acceptance: Cancel shows confirm; on confirm, fetch aborts, overlay closes, error state is cleared/handled.

### M2 — Results Flow Separation, Persistence, and Actions

- Split results into a dedicated page with run IDs.
  - Route: `app/topics/create/results/[runId]/page.tsx`.
  - On successful generation, persist run to `localStorage` and navigate to results URL.
  - Provide a recovery banner if a run exists for the current session and deep-link to it.
  - Acceptance: Navigating away and back restores results by `runId`.

- Results layout and interactions
  - Improve card visuals; add expand modal with full metadata (scores, tags, channel_fit, audience_fit, why_it_works).
  - Bulk select/save and single save (already supported) should also offer “Export JSON/CSV”.
  - Add “Write Content” CTA on each result to go to `/flows/create?topicId=<id>`.
    - Files: `components/topic-builder/results/TopicActions.tsx:1`, `components/topic-builder/results/TopicCard.tsx:1`.
  - Acceptance: Dedicated page, modal expands details, CTA navigates to flow creation with topic prefilled.

### M3 — Reusable DataTable Across Pages

- Consolidate on the existing generic table `components/data-table.tsx:1` (already supports search, actions, pagination, empty/loading states).
  - Replace any ad-hoc/dummy tables in other pages (Users, Notifications, Tasks, etc.) with this component, passing columns/actions per page.
  - Ensure skeleton usage via `components/ui/table-skeleton.tsx:1` where loading applies.
  - Acceptance: All list pages share the same table component with working pagination and actions.

### M4 — API and Backend Integration Hardening

- Unify duplicate “get topics” API routes.
  - Prefer `app/api/topics/route.ts:1` as the server‑side proxy (keeps key server‑only) and remove or forward from `app/api/topic/get-topics/route.ts:1`.
  - Update `services/backend.ts:200` getTopics to consistently use the server-proxy route.
  - Acceptance: Single code path for fetching saved topics; tests updated accordingly.

- Tighten error handling and logging
  - Ensure `BackendService` retry + validation paths cover all API routes; keep sanitized logs only (`lib/error-utils.ts:1`).
  - Add basic Sentry (or similar) hooks behind env flags for API route errors (optional, non-blocking for MVP).

### M5 — Save, Storage, and Auth Alignment (Incremental)

- Update UI saves to call backend route then mirror to localStorage for offline access.
  - Use `useTopicSaveMutation` (already present) for optimistic saves, then update local cache via `useTopicStorage` after success.
  - Acceptance: Save writes to backend and persists locally for offline viewing.

- Auth placeholders exist (login/signup). Define acceptance tests but defer implementation details to auth epic.

### M6 — Testing, Accessibility, and Analytics

- Tests
  - Update unit tests for topic‑builder utils (no audience auto‑select; removed geo field; content type/platform rules).
  - Add component tests for Advanced step slider, Review grid, Loading overlay cancel, Results page route param handling.
  - Keep existing transformation tests intact.

- Accessibility
  - Ensure interactive elements have roles/labels (cards, modals, buttons). Audit TopicCards, Actions, and Review grid.

- Analytics/Telemetry (optional)
  - Basic event logging for generation start/cancel/success and saves.

### M7 — Performance and UX Polish

- Debounce local draft saves and topic list search (already debounced; verify timings).
- Validate render cost of Review grid and Results page with many topics; virtualize list if needed later.

---

## Concrete Changes Mapped to Files

- Remove audience auto‑selection on industry change
  - `lib/topic-builder-utils.ts:824` — Delete logic that auto‑selects first 2 audiences; keep only valid retained selections.

- Drop geographic focus from step 2 and warnings
  - `lib/topic-builder-utils.ts:~600` — Step 2 validation: remove demographic_location warning and any required hints.

- Content type/platform rules
  - `components/topic-builder/steps/ContentFormatStep.tsx:1` — Restrict options list; require platform only for Social Media.
  - `lib/topic-builder-utils.ts:~900` — Keep `updateFormDataForContentTypeChange` rules; ensure platform cleared when not Social.

- Step 5 adjustments
  - `components/topic-builder/steps/AdvancedStep.tsx:1` — Remove Language/Region controls; move Notes first; add `num_topics` slider.
  - `components/topic-builder/steps/ReviewStep.tsx:240` — Remove Region/Language display; show new fields ordering.
  - `lib/topic-builder-utils.ts:~560` — Prompt builder: omit language/region lines.

- Step 6 review grid
  - `components/topic-builder/steps/ReviewStep.tsx:1` — Replace 3 cards with iconified grid summary.

- Generation cancel UX and behavior
  - `components/topic-builder/AILoadingScreen.tsx:1` — Add cancel + confirmation controls.
  - `hooks/use-topic-builder.ts:395` — Store an `AbortController` and abort the fetch when canceling; clear state.

- Results page + runId persistence
  - Add `app/topics/create/results/[runId]/page.tsx` — Dedicated results view reading from `localStorage` by run ID.
  - `app/topics/create/page.tsx:1` — On success, persist run and navigate to the new route.

- CTA to write content
  - `components/topic-builder/results/TopicActions.tsx:1` — Add action to navigate to `/flows/create?topicId=<id>`.
  - `components/topic-builder/results/TopicCard.tsx:1` — Surface as a visible button when appropriate.

- API route consolidation
  - Keep `app/api/topics/route.ts:1`; deprecate/forward `app/api/topic/get-topics/route.ts:1`.

---

## Acceptance Criteria (Summary)

- Topic Builder UX
  - No default audience pre‑selection; geo field removed; content type options limited; platform required only for Social Media; “Other” inputs scoped; Step 5 renamed/updated; Step 6 shows compact grid.

- Generation Overlay
  - Cancel button and close icon available; confirm dialog appears; cancel truly aborts the in‑flight request; state resets gracefully.

- Results
  - Dedicated URL with `runId` restores results; modal expands details; save single/bulk; export; “Write Content” CTA navigates to flow creation.

- Tables
  - All list pages use shared DataTable with search, actions, working pagination, and loading skeleton.

- API
  - Single “get topics” code path via server proxy; errors sanitized and helpful.

- Tests
  - Topic‑builder utils updated; overlay cancel flow covered; results page route covered.

---

## Notes on Dependencies and Compatibility

- Next.js App Router + React 19: current provider and client components pattern is compatible; keep async server functions in API routes only.
- TanStack Query v5: using `gcTime`, `staleTime`, and `retry` patterns aligns with docs; keep queries client‑side via `QueryProvider`.
- Tailwind CSS 4: PostCSS plugin configured; no Tailwind config required unless customizing.
- Zod v4: keep `.safeParse` validation at API boundaries; schemas already centralized.
- Zustand v5: current `persist`/`devtools` usage remains compatible.

---

## Out of Scope (Follow‑Ups)

- Full auth integration and linking saved topics to user accounts.
- Server‑propagated cancellation (if backend supports cancel by `request_id`).
- i18n and theme customization.

---

## Original Requested Items (Mapped)

- Audience pre‑selection bug — fixed via `lib/topic-builder-utils.ts:824`.
- Remove geographic focus in Audience step — UI + validation updated.
- Type of Content step options — limited and platform rules implemented.
- Step 4 “Other” inputs — per‑question inputs validated separately.
- Step 5 — remove Language/Region, rename step, improve copy, move Notes first, add topics slider.
- Step 6 — grid summary replacing 3 cards.
- Generation popup — modernized + cancel + confirm + true abort.
- Results — separate page, modal details, persistent `runId`, multi/individual save, and “Write Content” CTA.
- Table — reuse the existing DataTable across pages with search/actions/pagination/skeleton.

