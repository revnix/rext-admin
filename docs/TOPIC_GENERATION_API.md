# Topic Generation API Integration

This document describes the TanStack Query integration for topic generation in the WREXT Admin application.

## Overview

The topic generation feature now uses TanStack Query mutations for better user experience with:
- Loading states and progress indicators
- Automatic retry logic for network errors
- Error handling with user-friendly messages
- Rate limiting support
- Mock responses for development

## Usage

### Basic Usage

```tsx
import { useTopicGenerationMutation } from "@/hooks/useTopicGenerationMutation";

function MyComponent() {
  const generateMutation = useTopicGenerationMutation();

  const handleGenerate = async (formData: TopicBuilderFormData) => {
    try {
      const result = await generateMutation.mutateAsync({ formData });
      console.log(`Generated ${result.topics.length} topics`);
    } catch (error) {
      console.error('Generation failed:', error);
    }
  };

  return (
    <button 
      onClick={() => handleGenerate(myFormData)}
      disabled={generateMutation.isPending}
    >
      {generateMutation.isPending ? 'Generating...' : 'Generate Topics'}
    </button>
  );
}
```

### Integration with Topic Builder Hook

The `useTopicBuilder` hook automatically uses the new mutation:

```tsx
import { useTopicBuilder } from "@/hooks/use-topic-builder";

function TopicBuilderForm() {
  const { generateTopics, isGenerating, generationError } = useTopicBuilder();

  const handleSubmit = async (formData: TopicBuilderFormData) => {
    await generateTopics(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button type="submit" disabled={isGenerating}>
        {isGenerating ? 'Generating...' : 'Generate Topics'}
      </button>
      {generationError && (
        <p className="error">{generationError.message}</p>
      )}
    </form>
  );
}
```

## Development Setup

The mutation hook connects directly to the existing API endpoints:
- Uses the real `/api/topics/generate` endpoint in all environments
- No mock responses needed - the backend API is always available
- Consistent behavior across development, testing, and production

## Error Handling

The mutation automatically handles various error scenarios:

### Network Errors
- Automatic retry with exponential backoff
- User-friendly error messages
- Retry suggestions when appropriate

### Rate Limiting
- Detects rate limit responses (HTTP 429)
- Shows appropriate user messaging
- Suggests retry timing

### Validation Errors
- Displays form validation errors
- Suggests corrections to user input
- No automatic retry for client errors

### Server Errors
- Automatic retry for 5xx errors
- Fallback error messages
- Option to contact support

## API Contract

### Request Format

```typescript
interface TopicGenerationRequest {
  formData: TopicBuilderFormData;
  requestId?: string;
}
```

### Response Format

```typescript
interface TopicGenerationResponse {
  topics: GeneratedTopic[];
  request_id: string;
  generated_at: string;
  model_used?: string;
  generation_time_ms?: number;
}
```

### Error Response Format

```typescript
interface APIErrorResponse {
  error: string;
  error_code: string;
  details?: string;
  request_id?: string;
  retry_after?: number;
}
```

## Performance Considerations

### Caching
- TanStack Query handles response caching automatically
- Duplicate requests are deduplicated
- Stale data is refetched based on configuration

### Request Deduplication
- Multiple identical requests are merged
- Reduces server load and improves UX
- Automatic cleanup after completion

### Background Updates
- Failed requests retry in background
- Users can continue working while retries happen
- Success/failure feedback via toast notifications

## Migration Notes

### From Direct Fetch to TanStack Query

The migration maintains backward compatibility:
- All existing hook interfaces remain the same
- Error handling behavior is preserved
- Session management continues to work
- Navigation flow is unchanged

### Breaking Changes

None. The integration is designed to be a drop-in replacement.

## Troubleshooting

### Common Issues

1. **API not responding**
   - Check `BACKEND_API_URL` environment variable
   - Verify `CONTENT_API_KEY` is set correctly
   - Check network connectivity
   - Review browser console for errors

2. **Rate limiting errors**
   - Wait for the suggested retry period
   - Check if backend rate limits are configured correctly
   - Consider implementing request queuing for high-volume usage

### Debug Mode

Enable debug logging:

```bash
# In browser console
localStorage.setItem('debug', 'topic-generation:*');
```

This will show detailed logs for:
- Request/response cycles
- Error classification
- Retry attempts
- Cache operations