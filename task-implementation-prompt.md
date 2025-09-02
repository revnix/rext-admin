Task/Subtask Implementation Prompt

Inputs (fill before starting)

- Task ID: 3
- Subtask ID: 3.19
- Related plan files: `topic-builder-plan.md`, `topic-builder-context.md`, `topic-questions.md` and `topic-questions.jsonc`

Authoritative references

- Codebase: `src/app/**` 
- Plan, Context and Questions: `topic-builder-plan.md`, `topic-builder-context.md` and `topic-questions.md`
- Latest official docs (read before each implementation): Next.js App Router, Zod, Tailwind CSS 4, shadcn/ui 3, Radix UI, Zustand, TanStack Query, React Hook Form

Project guardrails (must follow)

- TypeScript everywhere; Next.js App Router
- Always add types/interfaces etc in "types" folder
- Always use shadcn/ui 3 and Radix UI for components
- Always use Zustand for global state management
- Always use TanStack Query for server state management
- Always use React Hook Form for forms
- Always use Zod for validation

Workflow

1. Discovery (read-only)
   - Retrieve the task/subtask details from Taskmaster and read any linked context.
   - Read the relevant `topic-builder-plan.md` plan(s) and `topic-builder-context.md` to confirm constraints and acceptance criteria.
   - Explore the exact files to be changed (APIs, services, db schema/migrations, auth, types). Quote small snippets and line ranges where helpful.
   - Consult latest docs (Next.js, Zod, Tailwind CSS 4, shadcn/ui 3, Radix UI, Zustand, TanStack Query, React Hook Form) to validate patterns and APIs you will use.

2. Implementation plan (for approval)
   Produce a concise, diff-oriented plan that includes:
   - Overview: what is being implemented and why (tie to plan file(s))
   - Impacted files/modules (absolute paths)
   - Exact edits (per file): what to add/remove/replace;
   - Observability: key logs and error handling approach
   - Acceptance criteria: binary, verifiable checks
   - Answers to these questions:
     - Is this must-have or nice-to-have?
     - Which files/modules/folders are impacted?
     - When should this be done (now vs later) and why?
     - What are this task’s dependencies?

3. Implementation (after approval)
   - Apply edits per plan; 

4. Completion
   - Run linting and formatting: `npm run lint && npm run format`
   - If tests pass, mark the subtask as done and append implementation notes summarizing:
     - What changed (files/classes/functions)
     - Any follow-ups or risks
   - Commit changes to git with a descriptive commit message (standard format without Claude attribution)

Notes & tips
- Always anlayze the latest codebase, previous tasks done and latest docs of any libraries/packages involved to have the most accurate and up to date information before making the plan.
