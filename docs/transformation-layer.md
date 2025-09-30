# Transformation Layer Documentation

## Overview

The transformation layer converts frontend topic structures into the payloads the
FastAPI backend expects. Earlier iterations implemented a large, feature-heavy
module that handled batching, auto-fix routines, performance metrics, and
bespoke error types. That complexity made the code difficult to maintain and
added unnecessary bundle weight. We now rely on a minimal set of helpers that do
exactly one job: map `GeneratedTopic` objects into backend save requests.

## Core Functions

### `transformTopicForBackend`

```typescript
import { transformTopicForBackend } from '@/lib/transformation-utils';

const payload = transformTopicForBackend(generatedTopic);
// payload is ready to be sent to the FastAPI backend
```

Key behaviour:
- Preserves required fields (`title`, `angle`, `scores`, `channel_fit`, `audience_fit`).
- Falls back to the topic title when a description is missing.
- Normalises optional arrays (`channel_fit`, `audience_fit`, `tags`) to empty arrays.
- Leaves score data untouched so the backend can apply its own validation rules.

### `transformTopicsForBackend`

```typescript
import { transformTopicsForBackend } from '@/lib/transformation-utils';

const request = transformTopicsForBackend(generatedTopics);
// request === { topics: BackendSaveTopicRequest[] }
```

The helper simply maps every topic through `transformTopicForBackend` and wraps
it in the structure required by the save API.

## Form Data Conversion

Form data (`TopicBuilderFormData`) is now converted inside
`BackendService.transformFormDataToBackendFormat`. Keeping the mapping close to
the service ensures the payload always matches the network client’s behaviour,
without exposing another public helper.

## Validation Helpers

`types/schemas.ts` still exposes `transformTopicForSaving` for tests and schema
validation scenarios. It performs stricter checks (for example ensuring arrays
are non-empty) before constructing a backend payload. Use that helper when you
need explicit validation errors instead of the lightweight mapping above.

## Testing

The simplified helpers are covered by `__tests__/lib/transformation-utils.test.ts`.
The edge-case and enhanced-validation suites were removed because those features
no longer exist in production code.

Run the updated tests with:

```bash
npm test __tests__/lib/transformation-utils.test.ts
```

## Maintenance Notes

- New backend fields only require updates in `transformTopicForBackend`.
- If additional validation is needed, extend the schemas in `types/schemas.ts`
  rather than reintroducing a heavy transformation layer.
- Keep the helpers pure—they should remain synchronous and side-effect free so
  they are easy to reason about and test.
