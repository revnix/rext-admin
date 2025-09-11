Task Implementation

- Task ID: 11
- Subtask ID: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6
- Related plan files: `@features-requirements-plan.md`

Authoritative references

- Codebase: `src/app/**` 
- Plan, Context and Questions: `@features-requirements-plan.md`
- Latest official docs (read before each implementation): Next.js App Router, Zod, Tailwind CSS 4, shadcn/ui 3, Radix UI, Zustand, TanStack Query, React Hook Form

Project guardrails (must follow)

- TypeScript everywhere; Next.js App Router
- Always add types/interfaces etc in "types" folder
- Always use shadcn/ui 3 and Radix UI for components
- Always use Zustand for yesyeglobal state management
- Always use TanStack Query for server state management
- Always use React Hook Form for forms
- Always use Zod for validation

Workflow

1. Discovery (read-only)
   - Retrieve the task/subtask details from Taskmaster and read any linked context.
   - Read the relevant `@features-requirements-plan.md` plan to confirm constraints and acceptance criteria.
   - Explore the exact files to be changed (APIs, services, db schema/migrations, auth, types). Quote small snippets and line ranges where helpful.
   - Consult latest docs (Next.js, Zod, Tailwind CSS 4, shadcn/ui 3, Radix UI, Zustand, TanStack Query, React Hook Form) to validate patterns and APIs you will use.

2. Implementation plan (for approval)
   Produce a concise, diff-oriented plan that includes:
   - Overview: what is being implemented and why (tie to plan file(s))
   - Impacted files/modules (absolute paths)
   - Exact edits (per file): what to add/remove/replace;
   - Observability: key logs and error handling approach
   - Acceptance criteria: binary, verifiable checks
   - Make sure to check if the task is already done or not.
   - Answers to these questions:
     - Is this must-have or nice-to-have?
     - Which files/modules/folders are impacted?
     - When should this be done (now vs later) and why?
     - What are this task’s dependencies?
     - Is this task already done or not?

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
