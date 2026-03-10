# Store Import Policy

To ensure clear boundaries and maintainable code, follow these import patterns for stores:

## 1. Domain Barrel Imports
Use grouped imports for stores within a specific functional domain:
- `@/stores/workspace`
- `@/stores/knowledge`

## 2. Direct Store Imports
Import from the specific store file for standalone or independent stores:
- `@/stores/auth-store`
- `@/stores/permission-store`
- `@/stores/subscription-store`
- `@/stores/topic-builder-store`
- `@/stores/notification-store`

> [!IMPORTANT]
> **Do not import from `@/stores` or `@/stores/index`.**
> The root barrel has been intentionally removed to prevent misleading API contracts and accidental partial imports.
