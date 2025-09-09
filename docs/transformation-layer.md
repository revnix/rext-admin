# Transformation Layer Documentation

## Overview

The transformation layer provides robust data conversion between frontend and backend formats with comprehensive error handling, validation, and performance monitoring. This layer ensures type safety and data integrity when converting between different schema formats.

## Architecture

### Key Components

1. **Core Transformation Utilities** (`/lib/transformation-utils.ts`)
   - Enhanced transformation functions with error handling
   - Performance metrics and benchmarking
   - Batch processing capabilities

2. **Schema Definitions** (`/types/schemas.ts`)
   - Zod validation schemas
   - Basic transformation helpers
   - Field mapping utilities

3. **Type Definitions** (`/types/transformation.ts`)
   - Comprehensive error types
   - Options interfaces
   - Performance metric types

## Schema Mappings

### Frontend to Backend Topic Conversion

**Frontend Format**: `GeneratedTopic`
```typescript
{
  id: string,
  title: string,
  angle: string,
  description?: string,  // Excluded from backend
  scores: { relevance: number, freshness: number, novelty: number },
  channel_fit: string[],
  audience_fit: string[],
  why_it_works: string,
  tags: string[],
  generated_at: string,
  metadata?: object
}
```

**Backend Format**: `SaveTopicItem`
```typescript
{
  // No 'id' field (backend assigns IDs)
  title: string,
  angle: string,
  scores: { relevance: number, freshness: number, novelty: number },
  channel_fit: string[],
  audience_fit: string[],
  why_it_works: string,
  tags: string[]
}
```

**Key Differences**:
- Backend format excludes `id`, `description`, `generated_at`, and `metadata` fields
- All arrays must be non-empty in backend format
- Text fields have length limits (title: 200, angle: 500, why_it_works: 1000 chars)

### Form Data to Backend Payload Conversion

**Frontend Format**: `TopicBuilderFormData`
- User-friendly field names and formats
- Optional fields with fallbacks
- Arrays and enums for user selections

**Backend Format**: `BackendTopicGenerationPayload`
- Snake_case field naming
- Required timestamp field
- Specific field transformations (e.g., audience array → comma-separated string)

## Core Functions

### Single Topic Transformation

```typescript
import { transformTopicForSavingEnhanced } from '@/lib/transformation-utils';

const result = transformTopicForSavingEnhanced(generatedTopic, {
  autoFix: true,
  includeMetrics: true,
  fallbackBehavior: 'lenient'
});

if (result.success) {
  console.log('Transformed topic:', result.data);
  console.log('Duration:', result.metrics?.durationMs, 'ms');
} else {
  console.error('Transformation failed:', result.error.message);
  console.log('Recovery actions:', result.error.recoveryActions);
}
```

### Batch Topic Transformation

```typescript
import { transformTopicsForSavingEnhanced } from '@/lib/transformation-utils';

const result = await transformTopicsForSavingEnhanced(generatedTopics, {
  continueOnError: true,
  maxConcurrency: 5,
  includeMetrics: true
});

console.log(`Successfully transformed: ${result.data.length}`);
console.log(`Errors: ${result.errors.length}`);
console.log(`Average duration: ${result.metrics?.avgDurationMs}ms`);
```

### Form Data Transformation

```typescript
import { transformFormDataToBackendEnhanced } from '@/lib/transformation-utils';

const result = transformFormDataToBackendEnhanced(formData, {
  normalizeFields: true,
  validateRequired: true,
  defaultValues: {
    num_ideas: 5
  }
});
```

## Error Handling

### Error Types

The transformation layer provides detailed error classification:

- `validation`: Schema validation failures
- `type_mismatch`: Incorrect field types
- `field_required`: Missing required fields
- `array_empty`: Required arrays are empty
- `size_limit_exceeded`: Text fields exceed limits
- `circular_reference`: Circular object references

### Error Structure

```typescript
interface TransformationError {
  type: TransformationErrorType;
  message: string;
  originalData?: unknown;
  fieldPath?: string;
  recoveryActions: string[];
  isRecoverable: boolean;
  validationIssues?: ZodIssue[];
  expectedType?: string;
  actualType?: string;
  context?: Record<string, unknown>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
}
```

### Recovery Actions

Each error includes specific recovery suggestions:

```typescript
if (!result.success) {
  result.error.recoveryActions.forEach(action => {
    console.log(`Suggestion: ${action}`);
  });
}
```

## Integration Points

### Backend Service Integration

The backend service automatically uses transformation utilities:

```typescript
// services/backend.ts
async saveTopics(topics: GeneratedTopic[]): Promise<SaveTopicResponse> {
  // Automatically transforms GeneratedTopic[] → SaveTopicItem[]
  const transformationResult = await transformTopicsForSavingEnhanced(topics, {
    autoFix: true,
    continueOnError: false
  });
  
  if (!transformationResult.success) {
    throw new Error(`Transformation failed: ${transformationResult.errors[0]?.error.message}`);
  }
  
  const payload = { topics: transformationResult.data };
  // Send to backend API...
}
```

### API Route Integration

```typescript
// app/api/topic/save-topic/route.ts
export async function POST(request: NextRequest) {
  const body = await request.json();
  const topics = body.topics as GeneratedTopic[];
  
  // Transformation happens automatically in backendService.saveTopics()
  const result = await backendService.saveTopics(topics);
  
  return Response.json({
    success: result.success,
    saved_count: result.saved_count,
    message: result.message,
  });
}
```

## Performance Optimization

### Auto-Fix Features

The transformation layer includes automatic data fixes:

- **Text Truncation**: Automatically truncates oversized text fields
- **Array Defaults**: Populates empty required arrays with defaults
- **Score Clamping**: Ensures scores stay within 0-100 range
- **Whitespace Trimming**: Removes leading/trailing whitespace

### Batch Processing

- **Concurrency Control**: Process multiple topics in parallel with configurable limits
- **Error Isolation**: Continue processing when individual items fail
- **Performance Metrics**: Track processing time and throughput

### Caching and Optimization

- **Schema Validation Caching**: Zod schemas are compiled once and reused
- **Memory Management**: Large text handling with size limits
- **Performance Benchmarking**: Built-in performance measurement tools

## Testing Strategy

### Unit Tests

Located in `__tests__/lib/`:
- `transformation-utils.test.ts`: Core transformation logic
- `transformation-validation.test.ts`: Zod validation integration
- `transformation-edge-cases.test.ts`: Edge case handling

### Test Coverage

- ✅ Valid input transformation
- ✅ Error handling and recovery
- ✅ Auto-fix functionality
- ✅ Batch processing
- ✅ Performance metrics
- ✅ Edge cases (null, circular refs, oversized data)

## Maintenance Guidelines

### Adding New Transformations

1. **Define Types**: Add new interfaces in `/types/transformation.ts`
2. **Create Schema**: Add Zod validation in `/types/schemas.ts`
3. **Implement Logic**: Add transformation function in `/lib/transformation-utils.ts`
4. **Add Tests**: Create comprehensive tests covering success/failure cases
5. **Update Documentation**: Document the new transformation pattern

### Debugging Transformations

Use the built-in debugging utilities:

```typescript
import { debugTransformation } from '@/lib/transformation-utils';

const result = transformTopicForSavingEnhanced(input);
debugTransformation(input, result);
```

### Performance Monitoring

Monitor transformation performance in production:

```typescript
const result = transformTopicsForSavingEnhanced(topics, {
  includeMetrics: true
});

if (result.metrics?.avgDurationMs > 100) {
  console.warn('Slow transformation detected:', result.metrics);
}
```

## Best Practices

1. **Always Use Enhanced Functions**: Use the `*Enhanced` functions for production code
2. **Enable Auto-Fix**: Use `autoFix: true` for user-facing operations
3. **Handle Errors Gracefully**: Always check `result.success` before using data
4. **Log Performance Metrics**: Monitor transformation performance in production
5. **Use Batch Processing**: Process multiple items with `transformTopicsForSavingEnhanced`
6. **Validate Early**: Transform data as close to the API boundary as possible

## Troubleshooting

### Common Issues

1. **Schema Validation Failures**
   - Check field types match expected schema
   - Ensure required fields are present
   - Verify array fields are not empty

2. **Performance Issues**
   - Use batch processing for multiple items
   - Enable metrics to identify bottlenecks
   - Consider reducing `maxConcurrency` for memory-constrained environments

3. **Type Errors**
   - Ensure proper imports from `/types/` directories
   - Check that transformation utilities are up to date
   - Verify backend API contracts match transformation outputs

### Debug Commands

```bash
# Run transformation tests
npm test __tests__/lib/transformation-utils.test.ts

# Run validation tests
npm test __tests__/lib/transformation-validation.test.ts

# Run edge case tests
npm test __tests__/lib/transformation-edge-cases.test.ts
```