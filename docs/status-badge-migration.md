# StatusBadge Component Migration Guide

## Overview

This guide documents the standardization of status badge usage across the application. The shared `StatusBadge` component provides consistent styling, behavior, and accessibility for all status indicators.

## Benefits of Using Shared StatusBadge

1. **Consistency** - All status badges look and behave the same way
2. **Maintainability** - Single source of truth for status styling
3. **Accessibility** - Built-in ARIA roles and keyboard support
4. **Features** - Pulse animations, icons, click handlers, and more
5. **Type Safety** - Predefined status configurations with TypeScript

## Current Component Location

```typescript
import { StatusBadge } from "@/components/ui/status-badge";
```

## Migration Pattern

### Before (Custom Implementation)

```typescript
// Old pattern in topic-cell-formatters.tsx
export function StatusBadge({ value }: { value: unknown }): ReactNode {
  const status = String(value || "unknown");
  const displayText = status.charAt(0).toUpperCase() + status.slice(1);

  let variant: "default" | "secondary" | "outline" = "outline";
  let className = "";

  switch (status.toLowerCase()) {
    case "generated":
      variant = "outline";
      className = "border-blue-200 text-blue-800";
      break;
    case "saving":
      variant = "secondary";
      className = "text-yellow-800 border-yellow-200 animate-pulse";
      break;
    // ... more cases
  }

  return (
    <Badge variant={variant} className={className}>
      {displayText}
    </Badge>
  );
}
```

### After (Shared Component)

```typescript
import { StatusBadge } from "@/components/ui/status-badge";

export function TopicStatusCell({ value }: { value: unknown }): ReactNode {
  return <StatusBadge status={String(value || "unknown")} />;
}
```

## Files Requiring Migration

### High Priority (Duplicated Logic)

1. **`components/ui/topic-cell-formatters.tsx`** (Lines 33-70)
   - Custom StatusBadge implementation
   - Should use shared StatusBadge component
   - Status: NEEDS MIGRATION

2. **`components/content/content-status-badge.tsx`** (Full file)
   - Custom content status badge with icons
   - Can be refactored to use shared StatusBadge with custom config
   - Status: NEEDS REFACTORING

### Medium Priority (Using Badge directly)

3. **`components/content-generation/progress-status.tsx`**
   - May contain custom badge logic
   - Review and migrate if applicable
   - Status: NEEDS REVIEW

4. **`app/w/[workspaceSlug]/content/page.tsx`**
   - May use StatusBadge or custom badges
   - Review for consistency
   - Status: NEEDS REVIEW

## Migration Steps

### Step 1: Update topic-cell-formatters.tsx

```typescript
// Before
export function StatusBadge({ value }: { value: unknown }): ReactNode {
  // ... 40 lines of custom logic
}

// After
import { StatusBadge as SharedStatusBadge } from "@/components/ui/status-badge";

export function TopicStatusCell({ value }: { value: unknown }): ReactNode {
  return <SharedStatusBadge status={String(value || "unknown")} />;
}
```

### Step 2: Refactor content-status-badge.tsx

```typescript
// Before - Custom implementation
export function ContentStatusBadge({ status, showIcon, className }: Props) {
  const config = CONTENT_STATUS_CONFIG[status];
  // ... custom logic with icons
}

// After - Using shared component with config
import { StatusBadge } from "@/components/ui/status-badge";
import type { StatusConfig } from "@/types/detail-page";

export function ContentStatusBadge({ status, showIcon, className }: Props) {
  const config = CONTENT_STATUS_CONFIG[status];

  return (
    <StatusBadge
      status={status}
      config={{
        label: config.label,
        variant: config.variant,
        color: config.color,
        icon: showIcon ? config.icon : undefined,
      }}
      className={className}
    />
  );
}
```

### Step 3: Update Import Statements

Replace all occurrences of custom badge components:

```typescript
// Find and replace
import { Badge } from "@/components/ui/badge";
// With
import { StatusBadge } from "@/components/ui/status-badge";
```

## Shared StatusBadge API

### Basic Usage

```typescript
<StatusBadge status="pending" />
<StatusBadge status="in-progress" />
<StatusBadge status="completed" />
```

### With Custom Configuration

```typescript
<StatusBadge
  status="custom"
  config={{
    label: "Custom Status",
    variant: "secondary",
    color: "blue",
    pulse: true,
  }}
/>
```

### With Icon

```typescript
import { CheckCircle } from "lucide-react";

<StatusBadge
  status="completed"
  icon={<CheckCircle />}
/>
```

### Interactive

```typescript
<StatusBadge
  status="pending"
  interactive
  onClick={() => console.log("Clicked!")}
/>
```

### Sizes

```typescript
<StatusBadge status="pending" size="sm" />
<StatusBadge status="pending" size="md" /> // default
<StatusBadge status="pending" size="lg" />
```

## Predefined Status Configurations

The shared StatusBadge includes configurations for:

### Task/Content Statuses
- `pending` - Gray outline
- `in-progress` - Blue with pulse
- `done`/`completed` - Green
- `blocked` - Red
- `deferred` - Gray
- `cancelled` - Gray outline
- `review` - Yellow

### Publication Statuses
- `published` - Green
- `scheduled` - Blue
- `draft` - Gray outline
- `archived` - Gray

### Priority Levels
- `high` - Red
- `medium` - Yellow
- `low` - Gray

### System Statuses
- `online` - Green with pulse
- `offline` - Gray
- `error` - Red
- `warning` - Yellow
- `success` - Green
- `info` - Blue

## Testing Checklist

After migration, verify:

- [ ] All status badges display correctly
- [ ] Colors and variants match expected design
- [ ] Animations work (pulse for in-progress states)
- [ ] Click handlers work (if interactive)
- [ ] Icons display correctly
- [ ] Accessibility attributes are present (role, aria-label)
- [ ] TypeScript types are correct
- [ ] No console errors or warnings

## Example Migrations

### Example 1: Simple Status Display

```typescript
// Before
<Badge variant="outline" className="border-blue-200 text-blue-800">
  In Progress
</Badge>

// After
<StatusBadge status="in-progress" />
```

### Example 2: Priority Badge

```typescript
// Before
const colorClass = getPriorityColorClass(priority);
<Badge variant="outline" className={colorClass}>
  {priority}
</Badge>

// After
<StatusBadge status={priority} />
```

### Example 3: Custom Status with Animation

```typescript
// Before
<Badge className="animate-pulse text-yellow-800">
  Saving...
</Badge>

// After
<StatusBadge
  status="saving"
  config={{ pulse: true, color: "yellow" }}
/>
```

## Migration Timeline

### Phase 1 (Immediate)
- ✅ Create shared StatusBadge component
- ✅ Document migration guide
- ⏳ Migrate topic-cell-formatters.tsx

### Phase 2 (Next Sprint)
- ⏳ Refactor content-status-badge.tsx
- ⏳ Review and update all other usages
- ⏳ Add tests for migrated components

### Phase 3 (Future)
- ⏳ Remove deprecated custom implementations
- ⏳ Add additional status configurations as needed
- ⏳ Performance optimization

## Support and Questions

For questions about this migration:
1. Check the StatusBadge component source code
2. Review examples in this guide
3. Test changes in development environment
4. Update this guide with new patterns discovered

## Conclusion

Standardizing on the shared StatusBadge component will:
- Reduce code duplication by ~90%
- Ensure visual consistency across the app
- Make status displays easier to maintain
- Provide better accessibility out of the box
- Enable easier theming and design updates

**Goal**: Migrate all custom badge implementations to use the shared StatusBadge component by end of next sprint.
