# useDeleteHandler Hook

Generic hook for handling delete operations with consistent UX patterns across the application.

## Features

- Automatic loading state management
- Toast notifications (success/error)
- Error handling and logging
- Customizable success/error callbacks
- Type-safe with TypeScript generics
- Consistent user experience

## Installation

The hook is located at `hooks/useDeleteHandler.ts` and ready to use.

## Basic Usage

```typescript
import { useDeleteHandler } from '@/hooks/useDeleteHandler';

function MyComponent({ item }) {
  const removeItem = useStore((state) => state.removeItem);

  const { handleDelete, isDeleting } = useDeleteHandler({
    deleteFunction: (id) => myService.delete(workspaceId, id),
    resourceName: "item",
    onSuccess: () => {
      removeItem(item.id);
    },
  });

  return (
    <Button
      onClick={() => handleDelete(item.id)}
      disabled={isDeleting}
    >
      {isDeleting ? "Deleting..." : "Delete"}
    </Button>
  );
}
```

## API Reference

### Options

```typescript
interface UseDeleteHandlerOptions<TData = void> {
  // Required: The delete function to execute
  deleteFunction: (id: string) => Promise<TData>;

  // Optional: Resource name for messages (default: "item")
  resourceName?: string;

  // Optional: Callback after successful deletion
  onSuccess?: (data: TData) => void | Promise<void>;

  // Optional: Callback when deletion fails
  onError?: (error: Error) => void;

  // Optional: Custom success message
  successMessage?: string;

  // Optional: Custom error message
  errorMessage?: string;
}
```

### Return Value

```typescript
interface UseDeleteHandlerReturn<TData = void> {
  // Execute the delete operation
  handleDelete: (id: string) => Promise<void>;

  // Whether deletion is in progress
  isDeleting: boolean;

  // Last error that occurred (if any)
  error: Error | null;

  // Clear the error state
  clearError: () => void;
}
```

## Examples

### 1. Basic Delete with Store Update

```typescript
const { handleDelete, isDeleting } = useDeleteHandler({
  deleteFunction: (id) => webKnowledgeService.delete(workspaceId, id),
  resourceName: "web knowledge",
  onSuccess: () => {
    removeItem(item.id);
  },
});
```

**Generated messages:**
- Success: "web knowledge deleted successfully"
- Error: "Failed to delete web knowledge: [error message]"

### 2. Custom Messages

```typescript
const { handleDelete } = useDeleteHandler({
  deleteFunction: (id) => topicService.delete(id),
  successMessage: "Topic removed from your library",
  errorMessage: "Couldn't remove topic. Please try again.",
});
```

### 3. With Navigation

```typescript
const router = useRouter();

const { handleDelete, isDeleting } = useDeleteHandler({
  deleteFunction: (id) => topicService.delete(id),
  resourceName: "topic",
  onSuccess: () => {
    router.push('/topics');
  },
});
```

### 4. With Specific Error Handling

```typescript
const { handleDelete, error, clearError } = useDeleteHandler({
  deleteFunction: (id) => deleteContent(id),
  resourceName: "content",
  onError: (error) => {
    // Custom error handling
    if (error.message.includes("permission")) {
      showPermissionDialog();
    }
  },
  onSuccess: () => {
    invalidateQueries();
  },
});
```

### 5. With Return Data

```typescript
interface DeleteResponse {
  deletedCount: number;
  relatedItems: string[];
}

const { handleDelete } = useDeleteHandler<DeleteResponse>({
  deleteFunction: (id) => bulkDeleteService.delete(id),
  resourceName: "workspace",
  onSuccess: (data) => {
    console.log(`Deleted ${data.deletedCount} items`);
    removeRelatedItems(data.relatedItems);
  },
});
```

## Real-World Examples

### Knowledge Card Component

**Before (web-knowledge-card.tsx - OLD):**
```typescript
const removeItem = useWebKnowledgeStore((state) => state.removeItem);

const cardConfig = {
  // ... other config
  onDelete: async (item) => {
    try {
      await webKnowledgeService.delete(item.workspace_id, item.id);
      removeItem(item.id);
      toast.success("Web knowledge deleted successfully");
    } catch (error) {
      toast.error(`Failed to delete: ${error.message}`);
    }
  },
};
```

**After (web-knowledge-card.tsx - NEW):**
```typescript
const removeItem = useWebKnowledgeStore((state) => state.removeItem);

const { handleDelete: deleteWebKnowledge } = useDeleteHandler({
  deleteFunction: (id) => webKnowledgeService.delete(item.workspace_id, id),
  resourceName: "web knowledge",
  onSuccess: () => {
    removeItem(item.id);
  },
});

const cardConfig = {
  // ... other config
  onDelete: async (item) => {
    await deleteWebKnowledge(item.id);
  },
};
```

**Lines saved per component: 8-10 lines**

### Text Knowledge Component

**Before:**
```typescript
const removeItem = useTextKnowledgeStore((state) => state.removeItem);

const onDelete = async (item: TextKnowledge) => {
  try {
    await textKnowledgeService.delete(item.workspace_id, item.id);
    removeItem(item.id);
    toast.success(`Text note "${item.title}" deleted successfully`);
  } catch (error) {
    log.error("Failed to delete text knowledge:", error);
    toast.error("Failed to delete text knowledge");
  }
};
```

**After:**
```typescript
const removeItem = useTextKnowledgeStore((state) => state.removeItem);

const { handleDelete: deleteTextKnowledge } = useDeleteHandler({
  deleteFunction: (id) => textKnowledgeService.delete(item.workspace_id, id),
  resourceName: "text note",
  successMessage: `Text note "${item.title}" deleted successfully`,
  onSuccess: () => {
    removeItem(item.id);
  },
});

const onDelete = async (item: TextKnowledge) => {
  await deleteTextKnowledge(item.id);
};
```

## Integration with BaseKnowledgeCard

The hook works seamlessly with the `BaseKnowledgeCard` component:

```typescript
export function MyKnowledgeCard({ item }) {
  const removeItem = useStore((state) => state.removeItem);

  // Define delete handler
  const { handleDelete } = useDeleteHandler({
    deleteFunction: (id) => myService.delete(item.workspace_id, id),
    resourceName: "knowledge item",
    onSuccess: () => removeItem(item.id),
  });

  const cardConfig: KnowledgeCardConfig<MyKnowledge> = {
    // ... other config
    onDelete: async (item) => {
      await handleDelete(item.id);
    },
  };

  return <BaseKnowledgeCard item={item} config={cardConfig} />;
}
```

## Benefits

### Code Reduction
- **Before**: 10-15 lines of try-catch-finally logic per component
- **After**: 4-6 lines with hook
- **Savings**: ~8-10 lines per component × 8+ components = 64-80 lines saved

### Consistency
- All delete operations show the same toast messages
- Consistent loading state management
- Same error handling pattern across app
- Unified logging format

### Maintainability
- Single source of truth for delete UX
- Easy to update delete behavior globally
- Better error tracking
- Centralized logging

### Developer Experience
- Simple, declarative API
- TypeScript autocomplete support
- Clear function naming
- Reduced boilerplate

## Error Handling

The hook automatically:
1. Catches all errors from the delete function
2. Logs errors with context (resource name, ID, error details)
3. Shows user-friendly error toast
4. Calls custom `onError` callback if provided
5. Preserves error in state for custom handling

```typescript
const { handleDelete, error, clearError } = useDeleteHandler({
  deleteFunction: myDeleteFn,
  onError: (err) => {
    // Custom error handling
    if (err.message.includes('network')) {
      retryLater();
    }
  },
});

// Access error state
if (error) {
  console.log('Last error:', error.message);
  clearError(); // Clear when needed
}
```

## Logging

All delete operations are automatically logged:

```typescript
// On delete start

// On success

// On error
log.error("Failed to delete {resourceName}", {
  id,
  resourceName,
  error: error.message,
  stack: error.stack,
});
```

## TypeScript Support

Full TypeScript support with generics for delete response types:

```typescript
// Simple delete (returns void)
const { handleDelete } = useDeleteHandler({
  deleteFunction: (id) => deleteItem(id),
});

// Delete with response data
interface DeleteResult {
  success: boolean;
  deletedAt: string;
}

const { handleDelete } = useDeleteHandler<DeleteResult>({
  deleteFunction: (id) => deleteItem(id),
  onSuccess: (result) => {
    console.log('Deleted at:', result.deletedAt); // Typed!
  },
});
```

## Best Practices

1. **Always provide `resourceName`** for better user messages
2. **Use `onSuccess` callback** for state updates and navigation
3. **Provide custom messages** when default ones aren't appropriate
4. **Handle `isDeleting` state** in UI to prevent double-clicks
5. **Use type parameter** when delete returns useful data

## Migration Checklist

To migrate existing delete logic to this hook:

- [ ] Identify all delete operations in your component
- [ ] Import `useDeleteHandler` hook
- [ ] Create hook instance with delete function
- [ ] Replace try-catch blocks with `handleDelete` calls
- [ ] Move state updates to `onSuccess` callback
- [ ] Remove manual toast calls
- [ ] Use `isDeleting` for loading states
- [ ] Test error scenarios
- [ ] Remove old error handling code

## Related

- [Formatters](../lib/formatters/README.md) - Date and number formatting utilities
- [BaseKnowledgeCard](../components/knowledge/shared/BaseKnowledgeCard.tsx) - Card component integration
