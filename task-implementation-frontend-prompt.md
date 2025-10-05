# Frontend Task Implementation Prompt - WREXT User Management System

**Last Updated:** 2025-10-02

---

## Context

This prompt is invoked by the universal task orchestrator (`@task-implementation-universal-prompt.md`) when a frontend task is identified. You are executing a specific frontend task from the user management implementation plan.

---

## Input from Universal Orchestrator

You receive:
- Task ID and description from `@user-management-frontend-plan.md`
- Current phase and dependencies status
- Confirmation that all blockers are resolved
- Backend API readiness (if task depends on backend)

---

## Workflow

### 1. Discovery (Read-Only)

**CRITICAL: This step is READ-ONLY. Make NO changes.**

#### 1.1: Review Task Details
- Retrieve the task/subtask details from the frontend plan
- Read task description, acceptance criteria, and dependencies
- Understand what problem this solves and why it's needed

#### 1.2: Examine Existing Code
Explore the exact files to be changed:
- **Pages**: Check `app/` for existing page components
- **Components**: Check `components/` for UI components
- **Schemas**: Check `schemas/` for Zod validation schemas
- **Services**: Check `services/` for API service classes
- **Stores**: Check `lib/` for Zustand stores and state management
- **Types**: Check `types/` for TypeScript interfaces

**Quote small snippets and line ranges where helpful.**

Example:
```
Reading components/signup-form.tsx:28-45...
Found static markup with no validation
```

#### 1.3: Analyze Existing Patterns
- **Forms**: How are forms implemented? (React Hook Form + Zod)
- **State Management**: What pattern is used? (Zustand stores)
- **API Calls**: How are API calls made? (`authenticatedFetch` wrapper)
- **Error Handling**: How are errors handled? (`api-error-middleware.ts`)
- **Routing**: What routing pattern is used? (Next.js 15 App Router)
- **Styling**: How are components styled? (Tailwind CSS + shadcn/ui)
- **Loading States**: How are loading states managed?

#### 1.4: Check Configuration
```bash
# Check Next.js configuration
cat next.config.js

# Review package.json for dependencies
cat package.json

# Check environment variables
cat .env.local.example
```

#### 1.5: Consult Latest Documentation
**Use WebSearch or WebFetch** to check latest docs for:
- **Next.js 15**: App Router patterns, Server/Client Components
- **React 19**: Latest hooks and patterns
- **TanStack Query v5**: Data fetching, caching patterns
- **Zustand**: State management patterns
- **AuthJS v5 (next-auth)**: Authentication setup
- **React Hook Form**: Form handling
- **Zod**: Validation patterns
- **shadcn/ui v3**: Component usage
- **Tailwind CSS 4**: Styling patterns

**Document which sources you consulted.**

#### 1.6: Verify Task Status
**Check if task is already done:**
```bash
# Search for related code
grep -r "keyword" app/ components/ lib/

# Find similar implementations
find . -name "*pattern*.tsx"

# Check for TODO comments
grep -r "TODO" app/ components/
```

---

### 2. Implementation Plan (For Approval)

**DO NOT implement anything until user approves this plan.**

Produce a concise, diff-oriented plan that includes:

#### 2.1: Overview
- **What** is being implemented (feature/fix/refactor)
- **Why** it's needed (tie to `@user-management-frontend-plan.md`)
- **How** it fits into the overall system

#### 2.2: Impacted Files/Modules
**List absolute paths:**

**Create:**
- `/Users/mobeen/Work/Products/wrext/wrext-admin/path/to/new-file.tsx` - Purpose

**Modify:**
- `/Users/mobeen/Work/Products/wrext/wrext-admin/path/to/file.tsx:123-150` - Description of changes

**Dependencies:**
- No new packages required / New packages: `package-name@version`

#### 2.3: Exact Edits (Per File)
For each file, specify what to:
- **Add**: New components, functions, imports
- **Remove**: Deprecated code, static markup
- **Replace**: Updated logic, refactored code

**Include code snippets** showing before/after.

#### 2.4: Observability
- **Logging**: What console logs will be added?
  ```typescript
  console.log('[Component] Action performed')
  console.error('[Component] Error occurred:', error)
  ```
- **Error handling**: How will errors be caught and displayed?
  ```typescript
  try { ... } catch (error) { handleApiError(error); toast.error('...') }
  ```
- **Loading states**: How will loading be indicated?

#### 2.5: Acceptance Criteria
**Binary, verifiable checks:**
- [ ] Form validates all fields correctly
- [ ] API integration works with backend
- [ ] Success/error states display properly
- [ ] Loading states show appropriately
- [ ] Accessibility requirements met (ARIA labels, keyboard navigation)
- [ ] Responsive design works on mobile

#### 2.6: Pre-Implementation Checklist
Answer these questions:
- **Is this must-have or nice-to-have?** Must-have - blocks Phase X
- **Which files/modules/folders are impacted?** `components/`, `schemas/`, `services/`
- **When should this be done (now vs later) and why?** Now - dependency for Task X.Y
- **What are this task's dependencies?** Backend Task X.Y must be complete
- **Is this task already done or not?** No - verified in discovery
- **What existing patterns must be followed?** React Hook Form, Zod validation, shadcn/ui
- **What documentation did I consult?** Zod docs (password validation), existing form patterns

---

### 3. Implementation (After Approval)

**Only proceed after user approves the plan.**

#### 3.1: Follow Tech Stack Guardrails

**Must Follow:**
- ✅ TypeScript everywhere
- ✅ Next.js 15 App Router (not Pages Router)
- ✅ Types/interfaces in `types/` folder
- ✅ Use shadcn/ui v3 and Radix UI for components
- ✅ Use Zustand for global state management
- ✅ Use TanStack Query for server state management
- ✅ Use React Hook Form for forms
- ✅ Use Zod for validation
- ✅ Use Tailwind CSS 4 for styling
- ✅ Follow existing file structure in `app/` and `components/`

#### 3.2: Code Quality Standards

**All code must:**
- ✅ Follow existing code patterns
- ✅ Include proper error handling
- ✅ Include logging for important operations
- ✅ Use TypeScript types (no `any`)
- ✅ Be well-commented for complex logic
- ✅ Handle edge cases
- ✅ Validate inputs with Zod
- ✅ Use environment variables for configuration
- ✅ Follow security best practices

**Frontend-specific:**
- ✅ Use React Server Components where appropriate
- ✅ Use Client Components (`"use client"`) only when needed
- ✅ Handle loading and error states
- ✅ Optimize for performance (lazy loading, memoization)
- ✅ Ensure accessibility (ARIA labels, keyboard navigation)
- ✅ Responsive design (mobile-first)

#### 3.3: Apply Edits Per Plan
- Create/modify files according to approved plan
- Make one logical change at a time
- Add proper logging at each step
- Handle errors gracefully

**Example error handling:**
```typescript
try {
  const result = await apiCall()
  // Handle success
} catch (error) {
  handleApiError(error)
  toast.error('Operation failed')
  // Update UI error state
}
```

#### 3.4: Component Patterns

**Client Component (when needed):**
```typescript
"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

export function MyComponent() {
  const [isLoading, setIsLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(mySchema)
  })

  // Component logic
}
```

**Server Component (default):**
```typescript
// No "use client" directive
export default async function MyPage() {
  const data = await fetchData()
  return <div>{/* Render */}</div>
}
```

---

### 4. Completion

#### 4.1: Run Linting and Formatting
```bash
# Always run these for frontend
npm run lint
npm run format
```

#### 4.2: Test Implementation
**Manual testing:**
```bash
# Start dev server
npm run dev

# Navigate to affected pages in browser
# Test all user interactions
# Verify error states
# Check console for errors
# Test on mobile viewport
```

**Check for:**
- ✅ No TypeScript errors
- ✅ No console errors/warnings
- ✅ Forms validate correctly
- ✅ API calls work
- ✅ Loading states display
- ✅ Error states handle gracefully
- ✅ Responsive on mobile

#### 4.3: Verify Acceptance Criteria
Go through each criterion:
- [ ] All criteria met?
- [ ] Edge cases handled?
- [ ] Error states tested?
- [ ] Performance acceptable?
- [ ] Accessibility verified?

#### 4.4: Document Implementation
Mark the subtask as done and append implementation notes to the frontend plan:

```markdown
### Task X.Y: [Task Name] - COMPLETED ✅

**Completed:** 2025-XX-XX

**Implementation Summary:**
- Created: `schemas/auth-schemas.ts`, `services/auth-api.ts`
- Modified: `components/signup-form.tsx` (complete rewrite)
- Dependencies: No new packages

**Key Changes:**
- Added Zod validation schema with password strength
- Integrated React Hook Form
- Connected to backend signup API
- Added loading and error states
- Implemented password strength indicator

**Observations/Learnings:**
- Password strength calculation is reusable for other forms
- React Hook Form with Zod provides excellent DX
- shadcn/ui components work well with form state

**Follow-ups:**
- None - task complete

**Testing:**
- ✅ Manual testing in browser passed
- ✅ Form validation works correctly
- ✅ API integration successful
- ✅ Responsive on mobile
- ✅ Accessibility verified
```

#### 4.5: Update Master Plan
After updating the frontend plan, also update `@user-management-master-plan.md`:
- Mark task as ✅ complete
- Update phase progress percentage
- Note any blockers or risks discovered

#### 4.6: Commit Changes
```bash
git add .
git commit -m "<type>: <short summary>

- <change 1>
- <change 2>
- <change 3>

Closes: Frontend Phase X, Task X.Y"
```

**Commit types:**
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring
- `docs`: Documentation changes
- `test`: Test additions/changes
- `chore`: Maintenance tasks
- `style`: UI/styling changes

**Example:**
```bash
git commit -m "feat: implement signup form with validation

- Add Zod validation schema for signup
- Integrate React Hook Form
- Connect to backend signup API
- Add password strength indicator
- Implement loading and error states

Closes: Frontend Phase 0, Task 0.2"
```

---

## Authoritative References

**Codebase:** `wrext-admin/**`

**Latest Official Docs (consult before implementation):**
- Next.js: https://nextjs.org/docs
- React: https://react.dev/
- TanStack Query: https://tanstack.com/query/latest
- Zustand: https://zustand.docs.pmnd.rs/
- Zod: https://zod.dev/
- shadcn/ui: https://ui.shadcn.com/
- React Hook Form: https://react-hook-form.com/
- Tailwind CSS: https://tailwindcss.com/docs

---

## Common Patterns

### Form with Validation
```typescript
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { mySchema, MyFormData } from "@/schemas/my-schema"

const { register, handleSubmit, formState: { errors } } = useForm<MyFormData>({
  resolver: zodResolver(mySchema)
})

const onSubmit = async (data: MyFormData) => {
  try {
    await ApiService.myMethod(data)
    // Handle success
  } catch (error) {
    handleApiError(error)
  }
}
```

### API Service
```typescript
import { authenticatedFetch } from "@/lib/api-auth"

export class MyApiService {
  static async myMethod(data: MyData) {
    const response = await authenticatedFetch(
      `${API_BASE_URL}/api/v1/endpoint`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    )
    return response.json()
  }
}
```

### Zustand Store
```typescript
import { create } from "zustand"
import { persist } from "zustand/middleware"

interface MyStore {
  data: MyData | null
  setData: (data: MyData) => void
}

export const useMyStore = create<MyStore>()(
  persist(
    (set) => ({
      data: null,
      setData: (data) => set({ data }),
    }),
    { name: "my-store" }
  )
)
```

### Error Handling
```typescript
import { handleApiError } from "@/lib/api-error-middleware"
import { toast } from "sonner"

try {
  const result = await apiCall()
} catch (error) {
  handleApiError(error) // Logs error
  toast.error("Operation failed") // User notification
  setError("User-friendly message") // Component state
}
```

---

## Quality Checklist

Before marking complete:
- [ ] Code follows existing patterns
- [ ] Proper error handling implemented
- [ ] Logging added for key operations
- [ ] TypeScript types used (no `any`)
- [ ] Edge cases handled
- [ ] Input validation with Zod
- [ ] Environment variables used (no hardcoded values)
- [ ] Security best practices followed
- [ ] Accessibility verified (ARIA, keyboard nav)
- [ ] Responsive design tested
- [ ] No console errors/warnings
- [ ] Linting/formatting passed
- [ ] Frontend plan updated with learnings
- [ ] Master plan updated with progress
- [ ] Changes committed to git

---

## Notes & Tips

- Always analyze the **latest codebase** before planning
- Check **previous tasks** done to understand context
- Consult **latest docs** of libraries/packages involved
- Have the **most accurate and up-to-date information** before making the plan
- When in doubt, **ask the user** rather than guessing
- **Document learnings** for future reference
- Test on **mobile viewport** - mobile-first design
- Ensure **accessibility** - use ARIA labels, keyboard navigation

---

## Special Scenarios

### Task Already Done
If you discover the task is already implemented:
1. Verify it meets all acceptance criteria
2. Update frontend plan to mark complete
3. Document what was found
4. Update master plan
5. Inform user and move to next task

### Dependencies Not Met
If dependencies aren't satisfied (e.g., backend API not ready):
1. Identify the blocking task
2. Ask user: start blocker first, skip to another task, or wait?
3. Update plans with blocker status

### Conflicting Information
Resolution order:
1. Actual codebase = ultimate source of truth
2. Frontend plan = source of truth for implementation details
3. Master plan = source of truth for priorities
4. When in doubt, ask the user

---

**Ready to implement? Wait for user approval of your implementation plan before proceeding.**