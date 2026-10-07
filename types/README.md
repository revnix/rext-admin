# Types

TypeScript types shared across the dashboard. There is no barrel: import a type from its own file (`import type { Workspace } from "@/types/workspace"`).

| File | What it holds |
|---|---|
| `generate-content.ts` | The keyword-to-article flow: the run's state, its stream updates, the review and the article's checklist |
| `content.ts` | Articles in the content library: items, statuses, publishing |
| `workspace.ts`, `workspace-stats.ts` | Workspaces, their brand voice and personas, the stores' state, the onboarding counts |
| `subscription.ts` | Plans, subscriptions, credits and usage |
| `notifications.ts`, `sse.ts` | Notifications and the server-sent events behind them |
| `backend.ts`, `consistent-response.ts` | The backend's error and response shapes |
| `data-table.ts`, `detail-page.ts` | Rows and props for the shared table and detail components |
| `shared.ts` | Small shared shapes: `SelectOption`, `ValidationResult`, form field values |
| `role.ts`, `navigation.ts`, `security.ts`, `audit-log.ts`, `admin-invitation.ts`, `license.ts`, `profile.ts`, `user-session.ts`, `onboarding.ts` | Their area, as named |
| `env.d.ts`, `next-auth.d.ts`, `react-css-properties.d.ts` | Declarations for the environment, next-auth and CSS custom properties |

Zod schemas for API responses and forms live in `schemas/`, not here; a type derived from a schema uses `z.infer`.
