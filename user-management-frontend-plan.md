# User Management Frontend Implementation Plan

This plan synthesizes the current architecture of **@wrext-admin** (Next.js 15, React 19, Tailwind + shadcn, Zustand, TanStack Query, React Hook Form, Zod) and **@wrext-backend** (FastAPI, SQLAlchemy, consistent response helpers) to deliver a complete Users CRUD experience in the admin UI.

## Phase 1 – Backend Contract Alignment

### Task 1: Document user service endpoints
**Subtasks**
1. Review `src/api/routes/users/users_routes.py` to capture HTTP methods, URL patterns, required payloads, and success payload shapes (`success()` wrapper with `data` + `message`).
2. Enumerate error conditions (`DuplicateResourceException`, `WrextAuthenticationException`, generic 500) and map them to frontend error copy and retry strategy.
3. Confirm environment base URL (`NEXT_PUBLIC_API_BASE_URL`, defaults to `http://127.0.0.1:2024`) and final path prefixes (`/api/user/...`).

**Implementation Notes**
- Responses follow the consistent format defined in `src/utils/response_utils.py`; parse `data` and respect `request_id` for logging.
- `GET /api/user/users` returns `{ users: Users[], total_count: number }` while create/update/delete include nested `user` or `id` payloads.
- Authentication tokens expected via `Authorization` header (`AuthManager` already handles access token storage and refresh).

### Task 2: Capture authoritative data model and validation rules
**Subtasks**
1. Map SQLAlchemy model `src/api/models/user_models/users.py` to required UI fields (profile info, status, timestamps, soft-delete semantics).
2. Align password/credential requirements with `RegisterUser`/`UpdateUser`/`ResetPassword` schemas (minimum 8 characters, optional fields on update).
3. Decide which derived fields the UI should show (e.g., display initials from `first_name`/`last_name`, fallback display name, relative timestamps via `date-fns`).

**Implementation Notes**
- Respect soft delete via `deleted_at`; hide deleted users by default but keep ability to surface them via filter later.
- `status`, `email_verified`, `locked_until`, and `failed_login_attempts` allow richer badges and alerts in detail views.
- Role relationships exist (`UserRole`, `Role`, `WorkspaceMembers`) but lack dedicated endpoints; design UI with placeholder hooks for future expansion without blocking CRUD MVP.

### Task 3: Document ancillary flows (auth, password reset, verification)
**Subtasks**
1. Note `POST /api/user/login`, `POST /api/user/forgot-password` (expects `email` query param), `POST /api/user/reset-password`, and `GET /api/user/verify-email`.
2. Decide which flows need surface-level triggers in the admin (e.g., "Send reset link" action triggering `forgot-password`).
3. Capture logging/lockout behaviours (failed attempts, `locked_until`) for admin visibility.

**Implementation Notes**
- Background email sending is handled server-side via `BackgroundTasks`; UI only needs to trigger endpoint and display toast feedback.
- `forgot-password` currently accepts `email` as a query string; service client should enforce this contract until backend accepts JSON body.
- Keep audit-friendly messages (include `request_id` in toast debug details when available).

## Phase 2 – Shared Types & Service Layer

### Task 1: Introduce user domain TypeScript definitions (`types/user.ts`)
**Subtasks**
1. Define `User`, `UserListResponse`, `CreateUserRequest`, `UpdateUserRequest`, `DeleteUserResponse`, `ResetPasswordRequest`, and lightweight `UserRole`/`UserSession` summaries.
2. Add client-only helpers (`UserTableRow`, `UserFilters`, `UserSortOption`, `UserStatus`) to drive UI state and table configuration.
3. Update `types/index.ts` to export new interfaces and keep documentation in `types/README.md` concise.

**Implementation Notes**
- Mirror backend fields (UUID strings, ISO timestamps) and mark optional properties accurately to avoid runtime guards.
- Reuse `ErrorSeverity` (from `types/consistent-response.ts`) for error handling metadata returned by backend.
- Include derived getters (e.g., `fullName`, `initials`) as helper functions, not in type interface, to keep types declarative.

### Task 2: Create validation schemas (`schemas/user.ts`)
**Subtasks**
1. Build Zod schemas for create/update (`userCreateSchema`, `userUpdateSchema`) and password reset forms using backend validation rules.
2. Export TypeScript infer types (`UserCreateFormValues`, `UserUpdateFormValues`) for React Hook Form usage.
3. Add sanitizer helpers (trim whitespace, lower-case emails) mirroring patterns in `schemas/topic-builder.ts`.

**Implementation Notes**
- Enforce password min length, optional confirmation matching, and optional timezone/locale enumerations (extend from constants as needed).
- Provide default values for new forms, aligning with `user-management-tables.md` defaults (`status: "active"`, `language: "en"`, `timezone: "UTC"`).
- Co-locate shared validation messages to facilitate i18n later.

### Task 3: Implement `UserApiService` (`services/user-api.ts`)
**Subtasks**
1. Follow `WorkspaceApiService` pattern: instantiate `AuthenticatedFetch`, request deduplication map, logging via `logger.forComponent`.
2. Implement methods: `healthCheck`, `listUsers`, `getUser` (if backend gets added, fall back to client filtering), `createUser`, `updateUser`, `deleteUser`, `sendPasswordReset`, `verifyEmail`, `login` (for admin-led impersonation checks).
3. Normalize responses (unwrap `success` structure, map to TypeScript types) and surface `WorkspaceApiError`-like class (`UserApiError`).

**Implementation Notes**
- Use `apiErrorHandler` and `withErrorHandling` decorators to propagate consistent error objects and retries (respect rate limiting).
- For `listUsers`, allow optional query params for search/sort once backend supports them; start with client-side filtering but keep signature future-proof.
- Ensure DELETE request handles soft delete semantics (on success, treat as removal in client state, but flag `deleted_at` if re-fetch shows it).

### Task 4: Wire exports and environment plumbing
**Subtasks**
1. Export `UserApiService` and singleton `userApiService` from `services/index.ts`.
2. Re-export new types from `types/index.ts`, add new schemas to `schemas/index.ts`.
3. Document environment expectations in `README.md` (front-end) to clarify required backend variables for user flows.

**Implementation Notes**
- Keep tree-shaking friendly exports (avoid default class export unless necessary).
- Update `workspace-frontend-tasks.md`-style doc reference to point to the new plan for cross-team visibility.
- Validate that bundler (Turbopack) picks up new file paths (restart dev server after adding service file during implementation).

## Phase 3 – State Management & Data Hooks

### Task 1: Create Zustand store for UI state (`stores/user-store.ts`)
**Subtasks**
1. Model UI-centric state: current selection, filter/sort criteria, modal visibility, optimistic update buffers, recent users.
2. Provide async actions that defer to `userApiService` for optimistic workflows (create/update/delete) mirroring workspace store patterns.
3. Persist lightweight preferences (table view mode, column visibility) via `persist` middleware and expose selectors in `stores/index.ts`.

**Implementation Notes**
- Limit stored server state; rely on TanStack Query for authoritative user list to leverage caching and background refresh.
- Reuse `getStorage` SSR guard to avoid hydration issues, as seen in `workspace-store.ts`.
- Include loading flags (`creating`, `updating`, `deleting`, `resettingPassword`) to drive button disabled states and skeletons.

### Task 2: Add query hooks for server state (`hooks/use-users.ts`)
**Subtasks**
1. Implement `useUsers` hook using `useQuery` with key `['users']` (extend with filters when backend supports query params).
2. Return derived loading/error states, flatten consistent response into `User[]`, and push total count into store for pagination UI.
3. Integrate error handler (`useApiErrorHandler`) to surface toast notifications via `sonner`.

**Implementation Notes**
- Use `staleTime` (e.g., 60s) and `refetchOnWindowFocus` false to balance admin usage patterns and backend load.
- Provide optional `enabled` flag so components can defer fetch until modal open if needed.
- Map backend error codes to friendly copy (e.g., `duplicate_resource` → "Email already exists").

### Task 3: Mutation hooks (`hooks/use-user-mutations.ts`)
**Subtasks**
1. Create `useCreateUser`, `useUpdateUser`, `useDeleteUser`, and `useSendPasswordReset` hooks, each wrapping `useMutation` and invalidating `['users']` cache.
2. Implement optimistic updates via `onMutate`/`onSuccess` with rollback in `onError` (use store helpers where appropriate).
3. Emit toast notifications (`sonner`) and optional analytics events (future hook) on success/failure.

**Implementation Notes**
- For delete, remove row from cache immediately but keep `undo` placeholder to restore on failure.
- Consolidate mutation error mapping in a shared helper to avoid duplication.
- When mutation requires ID (update/delete), guard with `zod`-validated UUID (front-end check) before hitting backend.

### Task 4: Shared selectors and utilities
**Subtasks**
1. Expose typed selectors for table-ready data (e.g., `useUserTableData`) combining store preferences with query result.
2. Add memoized helpers for generating filter chip data, status counts, and quick stats.
3. Document usage patterns in `README` within `hooks` directory.

**Implementation Notes**
- Keep selectors resilient to undefined query data to avoid runtime errors during loading.
- Use `useMemo` to avoid re-render storms in large tables.
- Provide fallbacks for missing optional fields (e.g., `display_name ?? username`).

## Phase 4 – UI Implementation

### Task 1: Scaffold `/users` route
**Subtasks**
1. Create `app/users/page.tsx` (client component) using existing `PageLayout`, breadcrumb, and `usePageTitle` patterns.
2. Integrate sidebar navigation highlight via existing `NavMain` structure.
3. Ensure route is wrapped by `QueryProvider` (already in `app/layout.tsx`) and uses Suspense-friendly skeletons.

**Implementation Notes**
- Structure page sections: header with quick stats + CTA, main table, and detail panels.
- Reuse `PageLayout` or create `AdminListLayout` if shared between other admin pages later.
- Keep metadata (title/description) updated for dynamic head using `generateMetadata` if needed.

### Task 2: Build user listing table
**Subtasks**
1. Compose columns for `DataTable` (`components/data-table.tsx`): avatar/name/email, role badges, status, last login, created date, actions.
2. Implement search (client-side for now) using `searchFields` for `email`, `username`, `display_name`.
3. Add filter popover for status (`active`, `locked`, `invited`, `deleted`) and verification state.

**Implementation Notes**
- Use `components/ui/status-badge.tsx` for status chips; extend if new statuses required.
- Format dates with `date-fns` and centralize in helper (e.g., `formatRelativeTime`).
- Provide table skeleton states via `TableSkeleton` while query is loading.

### Task 3: Create user form modal/drawer
**Subtasks**
1. Build `UserForm` component using `react-hook-form` + `userCreateSchema` with inputs from `components/ui` (Input, Select, Checkbox).
2. Wrap in `Dialog` (for modal) triggered by "Add user" CTA; reuse component for edit flow (prefill values via `defaultValues`).
3. Integrate `useCreateUser`/`useUpdateUser` hooks, showing inline validation errors and toast on success.

**Implementation Notes**
- Provide optional advanced section (timezone, locale, status toggles) collapsed by default.
- Sanitize inputs on submit (trim whitespace, lower-case email) before hitting API.
- If backend auto-assigns default role, communicate in UI (read-only "Role: Admin" badge until role management is available).

### Task 4: Implement user detail surface
**Subtasks**
1. Create `UserDetailDrawer` (using `Sheet`/`Drawer` component) to show profile summary, roles, login activity, associated workspaces.
2. Add actions inside detail view: "Edit", "Send reset link", "Resend verification", "Lock/Unlock" (lock toggle requires backend extension—stub UI with disabled state if unavailable yet).
3. Display audit log placeholders (last login, created by) leveraging data if available; fall back gracefully when null.

**Implementation Notes**
- Use `DetailGrid`/`DetailCard` components already defined for consistent styling.
- When workspace associations are not yet provided, show placeholder message and link to workspace membership docs (prep for future backend work).
- Provide keyboard and ESC support for drawer accessibility.

### Task 5: Delete & bulk actions
**Subtasks**
1. Add row-level delete action using `AlertDialog` confirmation, referencing soft delete semantics (explain that user can be restored later once backend provides endpoint).
2. Enable multi-select in table (leverage DataTable selection pattern) for future bulk operations; initially support bulk delete/reset.
3. Track pending destructive actions in store to disable repeated submissions.

**Implementation Notes**
- After deletion, optimistically remove from table and show toast with undo placeholder (no actual restore yet, but sets expectation for future endpoint).
- Ensure audit log records (if available) should note actor—UI should call backend with admin user ID once session info exposed.
- Guard against deleting self (compare `useAuthStore().user.id`).

### Task 6: Supporting UI pieces
**Subtasks**
1. Build `UserStatusBadge`, `UserAvatar`, and `UserRoleBadges` components in `components/users/` directory for reuse.
2. Create `UserFiltersBar` with quick toggles (All, Active, Locked, Invited, Deleted) syncing with store filters.
3. Add empty state (`PlaceholderPage`) tailored to user management, linking to invite docs.

**Implementation Notes**
- Keep components headless (accept props) for reuse in detail view and table.
- Utilize `sonner` to surface success/failure feedback with actionable CTA (e.g., "View user").
- Follow existing design tokens (spacing, typography) to stay consistent with workspace UI.

## Phase 5 – Quality, Instrumentation, and Documentation

### Task 1: Automated tests
**Subtasks**
1. Add unit tests for service layer (`__tests__/services/user-api.test.ts`) mocking fetch and validating URL construction & error handling.
2. Create React Testing Library specs for `UserForm` and table interactions (`__tests__/users-page.test.tsx`) using Jest + TanStack Query test utils.
3. Add integration smoke test (optional) with backend running locally to ensure create/update/delete flows succeed end-to-end.

**Implementation Notes**
- Mock `AuthenticatedFetch` and `useAuthStore` to avoid touching real storage during tests.
- Use fixtures mirroring backend schema (include timestamps, statuses) to catch serialization issues.
- Maintain coverage thresholds; update `jest.config.ts` if new directories require transformation.

### Task 2: Accessibility, performance, and analytics checks
**Subtasks**
1. Run a11y audit (axe) on the `/users` page ensuring dialogs and tables are accessible (aria labels, focus traps, keyboard navigation).
2. Profile table rendering with large datasets (simulate 200 users) to verify virtualization requirements; plan virtualization if necessary.
3. Instrument critical actions (create, update, delete, reset) with logging via `logger` and optional Analytics hook for future dashboards.

**Implementation Notes**
- Reuse `shouldShowActionsOnHover` patterns to avoid hover-only controls on touch devices.
- Consider lazy-loading detail drawer to reduce initial bundle impact (dynamic import).
- Keep console logging behind `process.env.NODE_ENV === 'development'` checks.

### Task 3: Documentation and DX updates
**Subtasks**
1. Update `README.md` and/or create `users-frontend-tasks.md` referencing this plan and outlining setup instructions.
2. Add API usage examples to `docs/` (e.g., `docs/user-management-api-contract.md`) to keep frontend/backend aligned.
3. Record follow-up items (roles management, workspace membership UI, account unlock endpoint) in backlog.

**Implementation Notes**
- Mirror structure of `workspace-frontend-tasks.md` for familiarity.
- Document known backend gaps (lack of list pagination, role endpoints) so future backend work can prioritize them.
- Encourage adding tracking issue IDs once tasks move to sprint boards.

---

Following this phased roadmap keeps the implementation consistent with existing architectural patterns, ensures reusable abstractions (types, services, stores, UI primitives), and positions the UI for future enhancements like role management and workspace membership controls.
