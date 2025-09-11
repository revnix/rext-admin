# Types Documentation

This directory contains all TypeScript type definitions for the WREXT Admin application.

## File Structure

```
types/
├── index.ts              # Central export hub for all types
├── shared.ts             # Common interfaces used across modules
├── data-table.ts         # Data table row interfaces
├── topic-builder.ts      # Topic Builder specific types
├── topic-builder.ts       # Topic Builder specific types
├── api.ts               # API request/response types
├── components.ts        # React component prop types
└── README.md           # This documentation
```

## Usage Guidelines

### Importing Types

**Recommended:** Import from the central index file for cleaner imports:

```typescript
import type { TopicData, SelectOption, TopicBuilderFormData } from "@/types";
```

**Alternative:** Import directly from specific files when needed:

```typescript
import type { TopicBuilderFormData } from "@/types/topic-builder";
import type { SelectOption } from "@/types/shared";
```

### Type Categories

#### 1. Shared Types (`shared.ts`)
Common interfaces used throughout the application:
- `SelectOption` - Standard interface for all select/dropdown options
- `ValidationResult` - Form validation results
- `AsyncState` - Loading/error states for async operations
- `BaseTableRow` - Base interface for data table rows

#### 2. Data Table Types (`data-table.ts`)
Interfaces for data displayed in tables:
- `ContentData` - Content management data
- `TopicData` - Topic/concept data
- `UserData` - User account data
- `FlowData` - Workflow/automation data
- And more...

#### 3. Form Types (`topic-builder.ts`, `topic-builder.ts`)
Complex form data structures:
- `TopicBuilderFormData` - Multi-step topic generation form
- `TopicBuilderFormData` - Multi-step topic development form
- Associated enums and option constants

#### 4. API Types (`api.ts`)
Request/response interfaces for API communication:
- `ApiResponse<T>` - Standard API response wrapper
- `ErrorResponse` - Structured error responses
- Service-specific request/response types

#### 5. Component Props (`components.ts`)
React component prop interfaces:
- Form component props
- UI component props
- Event handler types

## Best Practices

### 1. Use Proper Type Definitions

❌ **Don't** use `any`:
```typescript
const data: any = someApiCall();
```

✅ **Do** use proper types:
```typescript
const data: TopicData[] = someApiCall();
```

### 2. Leverage Union Types

Use union types for controlled values:
```typescript
type Priority = "low" | "medium" | "high" | "urgent";
```

### 3. Use Type Guards

Implement type guards for runtime validation:
```typescript
export const isValidPriority = (value: string): value is Priority => {
  return ["low", "medium", "high", "urgent"].includes(value);
};
```

### 4. Consistent Option Interfaces

Always use `SelectOption` for dropdown/select options:
```typescript
const priorityOptions: SelectOption[] = [
  { label: "Low Priority", value: "low" },
  { label: "High Priority", value: "high" },
];
```

### 5. Generic Interfaces

Use generics for reusable interfaces:
```typescript
interface DataTableProps<T extends BaseTableRow> {
  data: T[];
  onRowClick: (row: T) => void;
}
```

## Migration Guide

If you encounter deprecated types in existing code:

### MultiSelectOption → SelectOption
```typescript
// Old
import type { MultiSelectOption } from "@/types/topic-builder";

// New
import type { SelectOption } from "@/types";
```

### TopicBuilderOption → SelectOption
```typescript
// Old
const options: TopicBuilderOption[] = [...];

// New  
const options: SelectOption[] = [...];
```

## Type Safety Features

### 1. Enum Validation
Most enum types have corresponding type guards:
```typescript
if (isValidPriority(userInput)) {
  // userInput is now typed as Priority
  handlePriority(userInput);
}
```

### 2. Form Validation
Form types include validation utilities:
```typescript
const result = validateTopicFormData(formData);
if (result.isValid) {
  // Form is valid, proceed
} else {
  // Show errors: result.errors
}
```

### 3. API Type Safety
All API calls are typed:
```typescript
const response: ApiResponse<TopicData[]> = await fetchTopics();
if (response.success) {
  // response.data is typed as TopicData[]
}
```

## Event Handler Types

The type system includes comprehensive event handler types for consistent callback patterns:

### Common Event Handlers (from `shared.ts`)
- **ClickHandler**: Simple click callbacks `() => void`
- **ChangeHandler<T>**: Value change callbacks with generic type support `(value: T) => void`
- **SelectHandler<T>**: Selection callbacks with generic type support `(value: T) => void`
- **SubmitHandler**: Form submission callbacks (sync/async) `() => void | Promise<void>`
- **FormEventHandlers<T>**: Complete form interaction callbacks interface
- **DataTableEventHandlers<T>**: Data table interaction callbacks interface
- **DialogEventHandlers**: Modal/dialog interaction callbacks interface

### Component-specific Handlers (from `components.ts`)
- **FormEventHandlers**: Topic Builder form interaction callbacks (different from shared)
- **ResultsEventHandlers**: Topic results and interaction callbacks
- **Component-specific handlers**: Specialized callbacks for specific components

## Contributing

When adding new types:

1. **Place in appropriate file** based on the type category
2. **Update `index.ts`** to export new types
3. **Add type guards** for runtime validation when applicable
4. **Document complex types** with JSDoc comments
5. **Use consistent naming** following existing patterns

### Naming Conventions

- **Interfaces:** PascalCase, descriptive names (`UserData`, `FormStepProps`)
- **Types:** PascalCase for union types (`Priority`, `FlowType`)
- **Constants:** SCREAMING_SNAKE_CASE for option arrays (`PRIORITY_OPTIONS`)
- **Functions:** camelCase (`isValidPriority`, `createInitialFormData`)

## Testing Types

TypeScript types are validated at compile time, but you can also test type guards:

```typescript
describe('Type Guards', () => {
  it('should validate priority correctly', () => {
    expect(isValidPriority('high')).toBe(true);
    expect(isValidPriority('invalid')).toBe(false);
  });
});
```