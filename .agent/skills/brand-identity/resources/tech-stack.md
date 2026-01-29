# Preferred Tech Stack & Implementation Rules

When generating code or UI components for this brand, you **MUST** strictly adhere to the following technology choices.

## Core Stack

* **Framework:** Next.js 16 (React 19)
* **Styling Engine:** Tailwind CSS v4 (Mandatory. Do not use plain CSS or styled-components unless explicitly asked.)
* **Component Library:** shadcn/ui (Use these primitives as the base for all new components.)
* **Icons:** Lucide React
* **Language:** TypeScript (Mandatory for all new files)

## Implementation Guidelines

### 1. Tailwind Usage

* Use utility classes directly in JSX
* Utilize the color tokens defined in `design-tokens.json` (e.g., use `bg-primary text-primary-foreground` instead of hardcoded hex values)
* **Dark Mode:** Support dark mode using Tailwind's `dark:` variant modifier
* Use Tailwind's spacing scale (`gap-4`, `p-6`, `m-8`) based on the 4px base unit
* Leverage Tailwind's responsive breakpoints (`sm:`, `md:`, `lg:`, `xl:`, `2xl:`)

### 2. Component Patterns

#### Buttons
* **Primary actions:** Use solid Primary color (`bg-primary text-primary-foreground`)
* **Secondary actions:** Use 'Ghost' or 'Outline' variants from shadcn/ui
* **Destructive actions:** Use `bg-destructive text-destructive-foreground`
* All buttons must have hover states and focus rings for accessibility

#### Forms
* **Labels:** Always placed *above* input fields
* **Spacing:** Use `gap-4` between form items
* **Validation:** Show error messages below inputs in `text-destructive`
* **Required fields:** Mark with asterisk (*) in label

#### Cards
* Use consistent border radius from design tokens
* Apply subtle shadows for elevation (`shadow-sm` or `shadow-md`)
* Maintain consistent padding (`p-6` for standard cards)

#### Layout
* Use Flexbox and CSS Grid via Tailwind utilities for all layout structures
* Prefer `flex` and `grid` over absolute positioning
* Use container queries where appropriate

### 3. TypeScript Standards

* Use strict mode (`"strict": true` in tsconfig.json)
* Define proper interfaces for all props
* Avoid `any` type; use `unknown` if type is truly unknown
* Export types alongside components

Example:
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
}

export function Button({ variant = 'primary', size = 'md', children, onClick }: ButtonProps) {
  // Implementation
}
```

### 4. File Structure

* Components in `components/` directory
* Utilities in `lib/` directory
* Types in `types/` directory
* Hooks in `hooks/` directory
* Keep components small and focused (single responsibility)

### 5. Accessibility Requirements

* All interactive elements must be keyboard accessible
* Use semantic HTML (`<button>`, `<nav>`, `<main>`, etc.)
* Include ARIA labels where needed
* Maintain WCAG 2.1 AA contrast ratios (minimum 4.5:1 for normal text)
* Test with screen readers

### 6. Performance Guidelines

* Use Next.js Image component for all images
* Implement lazy loading for below-fold content
* Minimize client-side JavaScript
* Use Server Components by default (Next.js App Router)
* Only use 'use client' when necessary (interactivity, hooks, browser APIs)

## Forbidden Patterns

* ❌ Do NOT use jQuery
* ❌ Do NOT use Bootstrap classes
* ❌ Do NOT create new CSS files; keep styles within component files via Tailwind
* ❌ Do NOT use inline styles (except for dynamic values that can't be expressed in Tailwind)
* ❌ Do NOT use `any` type in TypeScript
* ❌ Do NOT ignore accessibility requirements
* ❌ Do NOT hardcode colors; always use design tokens

## Code Quality Checklist

Before finalizing any component:

- [ ] TypeScript types are properly defined
- [ ] Tailwind classes are used (no custom CSS)
- [ ] Design tokens are referenced correctly
- [ ] Component is accessible (keyboard + screen reader)
- [ ] Responsive breakpoints are implemented
- [ ] Dark mode is supported
- [ ] No console errors or warnings
- [ ] Code follows single responsibility principle

## Example Component

```typescript
// components/ui/custom-button.tsx
import { cn } from '@/lib/utils';

interface CustomButtonProps {
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function CustomButton({ 
  variant = 'primary', 
  children, 
  onClick,
  className 
}: CustomButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-6 py-3 rounded-lg font-semibold transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        variant === 'primary' && 'bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary',
        variant === 'secondary' && 'bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:ring-secondary',
        className
      )}
    >
      {children}
    </button>
  );
}
```

---

**Remember**: Consistency in technical implementation is as important as visual consistency. Follow these rules without exception.
