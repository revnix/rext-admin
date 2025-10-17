# Phase 0 - Task 0.2.2: API Client Implementation Audit

**Task:** Audit API client implementation for subscription operations
**Date:** 2025-10-17
**Status:** ✅ Complete

---

## Executive Summary

This audit analyzes the API client infrastructure used for subscription management in the `wrext-admin` frontend. The current implementation uses a **unified API client architecture** with namespace-based organization, centralized error handling, and integration with Next.js authentication via AuthJS.

### Key Findings

1. **✅ Excellent Architecture**: Modern, unified API client with namespace pattern
2. **✅ Robust Error Handling**: Comprehensive error classification, retry logic, and user-friendly messaging
3. **✅ Clean Authentication**: AuthJS integration with automatic token management
4. **✅ Type-Safe**: Full TypeScript support with proper type inference
5. **⚠️ Missing LemonSqueezy Methods**: No checkout session or customer portal endpoints
6. **⚠️ No Retry Logic in Core Client**: Error utils exist but not integrated into API client
7. **⚠️ Limited Request Cancellation**: AbortController tracked but not fully utilized

### Impact Assessment

- **Architecture**: ✅ Solid foundation, ready for LemonSqueezy integration
- **Required Additions**: 2-3 new API methods (checkout, portal, license validation)
- **Error Handling**: ⚠️ Needs integration of retry logic into core client
- **Estimated Effort**: 2-3 hours

---

## Table of Contents

1. [Files Analyzed](#files-analyzed)
2. [Architecture Overview](#architecture-overview)
3. [Core API Client Analysis](#core-api-client-analysis)
4. [Subscription Namespace Analysis](#subscription-namespace-analysis)
5. [Error Handling System](#error-handling-system)
6. [Authentication Integration](#authentication-integration)
7. [Usage Patterns](#usage-patterns)
8. [Gap Analysis](#gap-analysis)
9. [Required Changes](#required-changes)
10. [Testing Recommendations](#testing-recommendations)

---

## Files Analyzed

### 1. [lib/api-client/core.ts](lib/api-client/core.ts) (129 lines)

**Purpose:** Core API client class with generic request handling
**Status:** ✅ Excellent foundation, minor enhancements needed

**Key Components:**
- `ApiError` class - Custom error with status code and context
- `ApiClient` class - Base client with request method
- Consistent response format handling
- Request tracking with AbortController

**Code Highlights:**
```typescript
export class ApiClient {
  private readonly baseUrl: string;
  private readonly activeRequests = new Map<string, AbortController>();

  constructor() {
    this.baseUrl =
      process.env.NEXT_PUBLIC_BACKEND_API_URL ||
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      "http://127.0.0.1:2024";
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await authenticatedFetch(url, options);

      // Handle HTTP errors
      if (!response.ok) {
        // ... error parsing ...
        throw new ApiError(response.status, message, code, errorData);
      }

      // Parse successful response
      const result = await response.json();

      // Handle new consistent format: { success: true, data: {...}, meta: {...} }
      if (result && typeof result === "object" && "success" in result) {
        if (result.success === false && "error" in result) {
          throw new ApiError(...);
        }

        if (result.success && "data" in result) {
          return result.data as T;
        }
      }

      // Legacy format or direct data
      return result as T;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      log.error("Request failed", { error, endpoint });
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  cancelAllRequests(): void {
    this.activeRequests.forEach((controller) => {
      controller.abort();
    });
    this.activeRequests.clear();
  }

  getActiveRequestsCount(): number {
    return this.activeRequests.size;
  }
}
```

**Strengths:**
- ✅ Automatic consistent response unwrapping
- ✅ Fallback to legacy format for backward compatibility
- ✅ Request tracking infrastructure
- ✅ Environment variable-based configuration

**Issues:**
- ❌ AbortController created but never used in requests
- ❌ No retry logic (despite retry utils existing)
- ❌ No request timeout configuration
- ❌ No request deduplication

### 2. [lib/api-client/index.ts](lib/api-client/index.ts) (143 lines)

**Purpose:** Unified API client singleton with namespace organization
**Status:** ✅ Excellent design pattern

**Architecture:**
```typescript
function createApiClient() {
  const client = new ApiClient();

  return {
    // Core request method (for custom requests if needed)
    request: client.request.bind(client),

    // Feature namespaces
    topics: createTopicsNamespace(client),
    content: createContentNamespace(client),
    workspaces: createWorkspacesNamespace(client),
    knowledge: createKnowledgeNamespace(client),
    media: createMediaNamespace(client),
    members: createMembersNamespace(client),
    invitations: createInvitationsNamespace(client),
    roles: createRolesNamespace(client),
    subscriptions: createSubscriptionsNamespace(client), // ← Subscription namespace
    profile: createProfileNamespace(client),
    account: createAccountNamespace(client),
    onboarding: createOnboardingNamespace(client),

    // Admin namespaces
    users: createUsersNamespace(client),
    impersonation: createImpersonationNamespace(client),
    auditLogs: createAuditLogsNamespace(client),
    emailTemplates: createEmailTemplatesNamespace(client),

    // Settings namespaces
    notifications: createNotificationsNamespace(client),
    sessions: createSessionsNamespace(client),
    security: createSecurityNamespace(client),
    preferences: createPreferencesNamespace(client),

    // Utility methods
    cancelAllRequests: () => client.cancelAllRequests(),
    getActiveRequestsCount: () => client.getActiveRequestsCount(),
  };
}

export const apiClient = createApiClient(); // Singleton instance
```

**Strengths:**
- ✅ Single responsibility per namespace
- ✅ Clean separation of concerns
- ✅ Easy to test individual namespaces
- ✅ Extensible design pattern

**Usage Example:**
```typescript
// Topics
const topics = await apiClient.topics.list(workspaceId);

// Subscriptions
const subscription = await apiClient.subscriptions.getCurrentPlan();
const plans = await apiClient.subscriptions.getPlans();
await apiClient.subscriptions.upgrade({ plan_id: "pro" });
```

### 3. [lib/api-client/subscriptions.ts](lib/api-client/subscriptions.ts) (139 lines)

**Purpose:** Subscription API namespace
**Status:** ⚠️ Needs LemonSqueezy additions (already analyzed in Task 0.2.1)

**Current Methods:**
```typescript
export function createSubscriptionsNamespace(client: ApiClient) {
  return {
    getCurrentPlan: async () => {
      return client.request<UserSubscription>("/api/v1/subscriptions/my-subscription", { method: "GET" });
    },

    getPlans: async () => {
      return client.request<SubscriptionListResponse>("/api/v1/subscriptions/plans", { method: "GET" });
    },

    getPlan: async (planId: string) => {
      return client.request<{ id: string; name: string; price: number; features: string[] }>(
        `/api/v1/subscriptions/plans/${planId}`,
        { method: "GET" }
      );
    },

    subscribe: async (data: { plan_id: string; payment_method_id?: string }) => {
      return client.request<{ id: string; plan_id: string; status: string }>(
        "/api/v1/subscriptions/subscribe",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );
    },

    upgrade: async (data: { plan_id: string }) => {
      return client.request<{ id: string; plan_id: string; status: string }>(
        "/api/v1/subscriptions/upgrade",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );
    },

    cancel: async (data?: { reason?: string; feedback?: string }) => {
      return client.request<{ success: boolean; message: string }>(
        "/api/v1/subscriptions/cancel",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data || {}),
        }
      );
    },

    getHistory: async (limit = 50, offset = 0) => {
      const params = new URLSearchParams({ limit: limit.toString(), offset: offset.toString() });
      return client.request<SubscriptionHistoryResponse>(
        `/api/v1/subscriptions/history?${params}`,
        { method: "GET" }
      );
    },

    getUsageStats: async () => {
      return client.request<UsageStats>("/api/v1/subscriptions/usage", { method: "GET" });
    },

    getTrialStatus: async () => {
      return client.request<TrialStatus>("/api/v1/subscriptions/trial-status", { method: "GET" });
    },
  };
}
```

**Missing Methods for LemonSqueezy:**
```typescript
// MISSING: Create checkout session
createCheckoutSession: async (data: CreateCheckoutSessionRequest) => {
  return client.request<CreateCheckoutSessionResponse>(
    "/api/v1/subscriptions/checkout-session",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }
  );
},

// MISSING: Get customer portal URL
getCustomerPortalUrl: async (return_url?: string) => {
  const params = return_url ? new URLSearchParams({ return_url }) : undefined;
  return client.request<{ url: string }>(
    `/api/v1/subscriptions/customer-portal${params ? `?${params}` : ""}`,
    { method: "GET" }
  );
},

// MISSING: Validate license (if using LemonSqueezy licenses)
validateLicense: async (licenseKey: string) => {
  return client.request<ValidateLicenseResponse>(
    "/api/v1/subscriptions/validate-license",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ license_key: licenseKey }),
    }
  );
},
```

### 4. [lib/auth-utils.ts](lib/auth-utils.ts) (117 lines)

**Purpose:** Authentication utilities for API requests using AuthJS
**Status:** ✅ Excellent, production-ready

**Key Functions:**
```typescript
// Get authentication headers with caching
export async function getAuthHeaders(skipCache: boolean = false): Promise<Record<string, string>> {
  // Check cache first (only on client-side)
  if (typeof window !== "undefined" && !skipCache && authHeadersCache) {
    const now = Date.now();
    if (now - authHeadersCache.timestamp < CACHE_TTL_MS) {
      return authHeadersCache.headers;
    }
  }

  // Server-side: use auth()
  if (typeof window === "undefined") {
    const session = await auth();
    if (session?.user?.accessToken) {
      return {
        Authorization: `Bearer ${session.user.accessToken}`,
      };
    }
    return {};
  }

  // Client-side: use getSession()
  const session = await getSession();
  const headers: Record<string, string> = {};

  if (session?.user?.accessToken) {
    headers.Authorization = `Bearer ${session.user.accessToken}`;
  }

  // Cache the headers on client-side
  authHeadersCache = { headers, timestamp: Date.now() };
  return headers;
}

// Authenticated fetch wrapper
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const authHeaders = await getAuthHeaders();
  const isFormDataBody = typeof FormData !== "undefined" && options.body instanceof FormData;

  const headers = new Headers(options.headers);
  Object.entries(authHeaders).forEach(([key, value]) => {
    if (value) {
      headers.set(key, value);
    }
  });

  if (!isFormDataBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle 401 Unauthorized - session expired
  if (response.status === 401) {
    log.error("[AuthJS] Session expired, redirecting to login");
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new Error("Session expired");
  }

  return response;
}
```

**Strengths:**
- ✅ Automatic session management
- ✅ Client/server-side compatibility
- ✅ Header caching (10 second TTL) to reduce session checks
- ✅ Automatic 401 handling with login redirect
- ✅ FormData support (preserves multipart boundaries)

**Production-Ready Features:**
- Session expiry detection
- Automatic re-authentication redirect
- Optimized caching strategy

### 5. [lib/error-utils.ts](lib/error-utils.ts) (417 lines)

**Purpose:** Comprehensive error handling utilities
**Status:** ✅ Excellent utilities, NOT integrated into core client

**Key Components:**

#### Error Classification
```typescript
export function classifyError(
  error: unknown,
  requestId?: string,
  retryAttempt?: number
): BackendError {
  // Network and fetch-related errors
  if (error.name === "AbortError") errorType = "abort_error";
  else if (error.name === "TimeoutError") errorType = "timeout_error";
  else if (error.message.includes("fetch")) errorType = "network_error";
  else if (error.message.includes("CORS")) errorType = "cors_error";

  // Backend API specific errors
  else if (error.message.includes("Backend API error:")) {
    const statusCode = parseInt(statusMatch[1], 10);
    if (statusCode >= 500) errorType = "server_error";
    else if (statusCode === 429) errorType = "rate_limit_error";
    else if (statusCode === 401 || statusCode === 403) errorType = "authentication_error";
    else if (statusCode >= 400) errorType = "validation_error";
  }

  return {
    type: errorType,
    message: mapping.userMessage,
    technicalMessage,
    statusCode,
    severity: mapping.severity,
    recoveryActions: mapping.recoveryActions,
    isRetryable: DEFAULT_RETRY_CONFIG.retryableErrors.includes(errorType),
    retryAttempt,
    requestId,
    timestamp,
    originalError: error,
  };
}
```

#### Retry Logic
```typescript
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  jitterFactor: 0.1,
  retryableErrors: [
    "network_error",
    "timeout_error",
    "server_error",
    "rate_limit_error",
    "abort_error",
  ],
};

export function calculateRetryDelay(
  attempt: number,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): number {
  const exponentialDelay = Math.min(
    config.initialDelay * config.backoffMultiplier ** (attempt - 1),
    config.maxDelay
  );

  // Add jitter to prevent thundering herd
  const jitter = exponentialDelay * config.jitterFactor * Math.random();
  return Math.round(exponentialDelay + jitter);
}

export function shouldRetry(
  error: BackendError,
  attempt: number,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): boolean {
  return (
    error.isRetryable &&
    attempt <= config.maxAttempts &&
    config.retryableErrors.includes(error.type)
  );
}
```

**Strengths:**
- ✅ Comprehensive error classification
- ✅ Exponential backoff with jitter
- ✅ User-friendly error messages
- ✅ Recovery action suggestions
- ✅ Sensitive data sanitization

**Issue:**
- ❌ **NOT integrated into core ApiClient** - These utilities exist but aren't used by the core request method

### 6. [lib/api-error-middleware.ts](lib/api-error-middleware.ts) (431 lines)

**Purpose:** API error handling middleware with toast notifications
**Status:** ✅ Excellent for component-level error handling

**Key Components:**
```typescript
export class ApiErrorHandler {
  async handleError(error: unknown, options: ApiErrorHandlerOptions = {}): Promise<never> {
    const {
      showToast = true,
      logError = true,
      throwError = true,
      customMessage,
      context = {},
      onError,
      onRetry,
    } = options;

    // Normalize error
    const normalizedError = this.normalizeError(error);
    const errorCode = this.extractErrorCode(normalizedError);
    const severity = this.getErrorSeverity(errorCode);

    // Log error
    if (logError) {
      this.logError(normalizedError, context, severity);
    }

    // Show user notification
    if (showToast) {
      this.showErrorToast(normalizedError, errorCode, customMessage, onRetry);
    }

    // Call custom error handler
    if (onError) {
      await onError(normalizedError, context);
    }

    // Re-throw error if requested
    if (throwError) {
      throw normalizedError;
    }

    return Promise.reject(normalizedError);
  }

  async withErrorHandling<T>(
    operation: () => Promise<T>,
    options: ApiErrorHandlerOptions = {}
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      await this.handleError(error, options);
      throw error;
    }
  }
}

// React Hook
export function useApiErrorHandler() {
  const handleError = async (error: unknown, options?: ApiErrorHandlerOptions) => {
    return apiErrorHandler.handleError(error, {
      showToast: true,
      logError: true,
      throwError: false,
      ...options,
    });
  };

  return { handleError, withErrorHandling };
}
```

**Strengths:**
- ✅ Toast notification integration (Sonner)
- ✅ Recovery action buttons in toasts
- ✅ React Hook for easy component usage
- ✅ Higher-order function decorator

**Usage in Components:**
```typescript
const { handleError, withErrorHandling } = useApiErrorHandler();

// Wrap operation
await withErrorHandling(
  () => apiClient.subscriptions.upgrade({ plan_id: "pro" }),
  {
    customMessage: "Failed to upgrade subscription",
    onRetry: () => refetch(),
  }
);
```

---

## Architecture Overview

### Unified API Client Pattern

The frontend uses a **namespace-based unified API client** architecture:

```
apiClient (singleton)
├── Core Infrastructure
│   ├── ApiClient class (core.ts)
│   ├── AuthJS integration (auth-utils.ts)
│   └── Request lifecycle management
│
├── Feature Namespaces
│   ├── subscriptions (subscriptions.ts) ← SUBSCRIPTION API
│   ├── workspaces
│   ├── topics
│   ├── content
│   ├── knowledge
│   ├── media
│   ├── members
│   ├── roles
│   ├── profile
│   └── ... (11 more namespaces)
│
└── Error Handling Layer
    ├── Error utilities (error-utils.ts)
    └── Error middleware (api-error-middleware.ts)
```

**Benefits:**
- ✅ Single import: `import { apiClient } from '@/lib/api-client'`
- ✅ Consistent API across all features
- ✅ Easy to mock for testing
- ✅ Type-safe with full IntelliSense

---

## Core API Client Analysis

### Request Lifecycle

```typescript
// 1. User calls API method
await apiClient.subscriptions.getCurrentPlan();

// 2. Namespace method builds request
client.request<UserSubscription>("/api/v1/subscriptions/my-subscription", { method: "GET" });

// 3. Core client adds base URL
const url = `${this.baseUrl}${endpoint}`; // http://127.0.0.1:2024/api/v1/subscriptions/my-subscription

// 4. authenticatedFetch adds auth headers
const authHeaders = await getAuthHeaders(); // { Authorization: "Bearer <token>" }
const headers = new Headers(options.headers);
Object.entries(authHeaders).forEach(([key, value]) => headers.set(key, value));

// 5. Fetch request
const response = await fetch(url, { ...options, headers });

// 6. Error handling
if (!response.ok) {
  throw new ApiError(response.status, message, code, errorData);
}

// 7. Response parsing
const result = await response.json();

// 8. Consistent format unwrapping
if (result.success && "data" in result) {
  return result.data as T; // Return only the data portion
}

return result as T; // Fallback for legacy format
```

### Configuration

**Environment Variables:**
```env
# Backend API URL (primary)
NEXT_PUBLIC_BACKEND_API_URL=http://127.0.0.1:2024

# Fallback API URL
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:2024

# Node environment
NODE_ENV=development
```

**Base URL Priority:**
1. `process.env.NEXT_PUBLIC_BACKEND_API_URL`
2. `process.env.NEXT_PUBLIC_API_BASE_URL`
3. Hardcoded fallback: `"http://127.0.0.1:2024"`

### Consistent Response Handling

The core client automatically handles both formats:

**New Format (Consistent API Response):**
```json
{
  "success": true,
  "data": { "id": "123", "plan_name": "Pro" },
  "meta": {
    "request_id": "req_xyz",
    "timestamp": "2025-10-17T...",
    "processing_time_ms": 45
  }
}
```

**Legacy Format (Direct Data):**
```json
{
  "id": "123",
  "plan_name": "Pro"
}
```

The client automatically unwraps `result.data` when consistent format is detected, providing transparent backward compatibility.

---

## Subscription Namespace Analysis

### Endpoint Mapping

| Method | Endpoint | HTTP Method | Purpose |
|--------|----------|-------------|---------|
| `getCurrentPlan()` | `/api/v1/subscriptions/my-subscription` | GET | Get current user subscription |
| `getPlans()` | `/api/v1/subscriptions/plans` | GET | Get all available plans |
| `getPlan(planId)` | `/api/v1/subscriptions/plans/:id` | GET | Get specific plan details |
| `subscribe(data)` | `/api/v1/subscriptions/subscribe` | POST | Create new subscription |
| `upgrade(data)` | `/api/v1/subscriptions/upgrade` | POST | Upgrade existing subscription |
| `cancel(data)` | `/api/v1/subscriptions/cancel` | POST | Cancel subscription |
| `getHistory(limit, offset)` | `/api/v1/subscriptions/history?limit=X&offset=Y` | GET | Get subscription history |
| `getUsageStats()` | `/api/v1/subscriptions/usage` | GET | Get resource usage statistics |
| `getTrialStatus()` | `/api/v1/subscriptions/trial-status` | GET | Get trial status |

### Type Safety

All methods return properly typed responses:

```typescript
const subscription: UserSubscription = await apiClient.subscriptions.getCurrentPlan();
const plans: SubscriptionListResponse = await apiClient.subscriptions.getPlans();
const usage: UsageStats = await apiClient.subscriptions.getUsageStats();
const trial: TrialStatus = await apiClient.subscriptions.getTrialStatus();
```

TypeScript provides full IntelliSense for all fields.

---

## Error Handling System

### Three-Layer Error Handling

#### Layer 1: Core ApiError Class
```typescript
export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly message: string,
    public readonly code?: string,
    public readonly context?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}
```

**Used in:** Core request method for HTTP errors

#### Layer 2: Error Classification Utilities
```typescript
const error: BackendError = classifyError(originalError, requestId, retryAttempt);

// Returns:
{
  type: "network_error",
  message: "Unable to connect to our servers. Please check your internet connection.",
  technicalMessage: "fetch failed",
  statusCode: undefined,
  severity: "high",
  recoveryActions: ["retry", "check_connection", "reload_page"],
  isRetryable: true,
  retryAttempt: 1,
  requestId: "req_123",
  timestamp: "2025-10-17T..."
}
```

**Used in:** Component-level error handling, logging

#### Layer 3: Error Middleware (Component-Level)
```typescript
const { handleError, withErrorHandling } = useApiErrorHandler();

await withErrorHandling(
  () => apiClient.subscriptions.upgrade({ plan_id: "pro" }),
  {
    showToast: true,
    customMessage: "Failed to upgrade subscription",
    onRetry: () => refetch(),
  }
);
```

**Used in:** React components for user-facing error handling

### Error Classification

| Error Type | HTTP Status | Severity | Retryable | Recovery Actions |
|------------|-------------|----------|-----------|------------------|
| `network_error` | N/A | high | ✅ Yes | retry, check_connection, reload_page |
| `timeout_error` | N/A | medium | ✅ Yes | retry, go_back |
| `server_error` | 500+ | high | ✅ Yes | retry, contact_support |
| `rate_limit_error` | 429 | medium | ✅ Yes | retry (with delay) |
| `authentication_error` | 401, 403 | medium | ❌ No | reload_page, contact_support |
| `validation_error` | 400-499 | low | ❌ No | go_back, retry_with_changes |
| `configuration_error` | N/A | critical | ❌ No | contact_support, reload_page |
| `cors_error` | N/A | critical | ❌ No | contact_support, reload_page |
| `abort_error` | N/A | low | ✅ Yes | retry, go_back |
| `unknown_error` | N/A | medium | ✅ Yes | retry, contact_support |

### Retry Strategy

**Configuration:**
```typescript
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelay: 1000,       // 1 second
  maxDelay: 30000,          // 30 seconds
  backoffMultiplier: 2,     // Exponential: 1s, 2s, 4s
  jitterFactor: 0.1,        // ±10% random jitter
  retryableErrors: [
    "network_error",
    "timeout_error",
    "server_error",
    "rate_limit_error",
    "abort_error",
  ],
};
```

**Exponential Backoff with Jitter:**
```
Attempt 1: 1000ms + random(0-100ms)   ≈ 1.0s
Attempt 2: 2000ms + random(0-200ms)   ≈ 2.0s
Attempt 3: 4000ms + random(0-400ms)   ≈ 4.0s
```

**Jitter Benefits:**
- Prevents thundering herd problem
- Spreads retries across time window
- Reduces server load spikes

---

## Authentication Integration

### AuthJS Session Flow

```typescript
// 1. User logs in (Google/GitHub OAuth)
// Session stored by NextAuth with accessToken

// 2. API request initiated
await apiClient.subscriptions.getCurrentPlan();

// 3. authenticatedFetch gets session
const session = await getSession();

// 4. Extract access token
const accessToken = session?.user?.accessToken;

// 5. Add Authorization header
headers.set("Authorization", `Bearer ${accessToken}`);

// 6. Make request to backend
fetch(url, { headers, ...options });

// 7. Backend validates JWT token
// Returns subscription data
```

### Session Caching

**Cache Strategy:**
- **TTL:** 10 seconds
- **Scope:** Client-side only
- **Purpose:** Reduce session checks for rapid consecutive requests

```typescript
let authHeadersCache: {
  headers: Record<string, string>;
  timestamp: number;
} | null = null;

const CACHE_TTL_MS = 10000; // 10 seconds

// Cache check
if (authHeadersCache && (now - authHeadersCache.timestamp < CACHE_TTL_MS)) {
  return authHeadersCache.headers; // Use cached headers
}

// Otherwise, fetch fresh session
const session = await getSession();
authHeadersCache = { headers, timestamp: Date.now() };
```

**Benefits:**
- Reduces getSession() calls during rapid API interactions
- Improves performance (e.g., loading page with 5+ API calls)
- Still refreshes frequently enough to catch session expiry

### Session Expiry Handling

**Automatic 401 Detection:**
```typescript
// Handle 401 Unauthorized - session expired
if (response.status === 401) {
  log.error("[AuthJS] Session expired, redirecting to login");
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
  throw new Error("Session expired");
}
```

**User Experience:**
1. Session expires (JWT exp claim passed)
2. API request returns 401
3. Automatic redirect to `/login`
4. User re-authenticates
5. Redirect back to original page (via NextAuth callback URLs)

---

## Usage Patterns

### React Query Integration

The subscription API client is primarily used with React Query for data fetching:

```typescript
// Fetch current subscription
const {
  data: subscription,
  isLoading,
  error,
} = useQuery<UserSubscription>({
  queryKey: ["subscription"],
  queryFn: () => apiClient.subscriptions.getCurrentPlan(),
});

// Fetch usage stats
const { data: usage } = useQuery<UsageStats>({
  queryKey: ["usage"],
  queryFn: () => apiClient.subscriptions.getUsageStats(),
  enabled: !!subscription, // Only fetch if subscription exists
});

// Upgrade mutation
const upgradeMutation = useMutation({
  mutationFn: (planId: string) =>
    apiClient.subscriptions.upgrade({ plan_id: planId }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["subscription"] });
    queryClient.invalidateQueries({ queryKey: ["usage"] });
    toast.success("Plan upgraded successfully");
  },
  onError: (error: Error) => {
    toast.error("Failed to upgrade plan", {
      description: error.message,
    });
  },
});

// Trigger upgrade
await upgradeMutation.mutateAsync(selectedPlanId);
```

### Error Handling in Components

**Pattern 1: React Query Error Handling**
```typescript
const { data, error } = useQuery({
  queryKey: ["subscription"],
  queryFn: () => apiClient.subscriptions.getCurrentPlan(),
  retry: 3, // React Query handles retries
});

if (error) {
  return <ErrorState message={error.message} />;
}
```

**Pattern 2: Manual Error Handling with Middleware**
```typescript
const { handleError } = useApiErrorHandler();

try {
  await apiClient.subscriptions.cancel({ reason: "Too expensive" });
  toast.success("Subscription cancelled");
} catch (error) {
  await handleError(error, {
    customMessage: "Failed to cancel subscription",
    onRetry: () => window.location.reload(),
  });
}
```

**Pattern 3: Mutation Error Handling**
```typescript
const cancelMutation = useMutation({
  mutationFn: (data: SubscriptionCancelRequest) =>
    apiClient.subscriptions.cancel(data),
  onError: (error: Error) => {
    // ApiError from core client
    if (error instanceof ApiError) {
      toast.error(`Error ${error.statusCode}: ${error.message}`);
    } else {
      toast.error("An unexpected error occurred");
    }
  },
});
```

---

## Gap Analysis

### Critical Gaps

#### 1. ❌ Missing LemonSqueezy Checkout Method

**Impact:** HIGH - Cannot implement LemonSqueezy checkout flow

**Missing Code:**
```typescript
createCheckoutSession: async (data: CreateCheckoutSessionRequest) => {
  return client.request<CreateCheckoutSessionResponse>(
    "/api/v1/subscriptions/checkout-session",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }
  );
},
```

**Why Needed:**
- LemonSqueezy requires redirect to hosted checkout page
- Need checkout URL generation endpoint
- Must pass success/cancel URLs

**Effort:** 15 minutes

---

#### 2. ❌ Missing Customer Portal Method

**Impact:** HIGH - Cannot link users to LemonSqueezy customer portal

**Missing Code:**
```typescript
getCustomerPortalUrl: async (return_url?: string) => {
  const params = return_url ? new URLSearchParams({ return_url }) : undefined;
  return client.request<{ url: string }>(
    `/api/v1/subscriptions/customer-portal${params ? `?${params}` : ""}`,
    { method: "GET" }
  );
},
```

**Why Needed:**
- Users need to manage payment methods
- Update billing information
- View invoices
- LemonSqueezy provides hosted portal

**Effort:** 10 minutes

---

#### 3. ❌ Retry Logic Not Integrated

**Impact:** MEDIUM - Network failures don't auto-retry

**Current State:**
- Retry utilities exist in `error-utils.ts`
- NOT used by core ApiClient
- Components must implement retry manually

**Required Integration:**
```typescript
async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  let attempt = 0;
  let lastError: Error | null = null;

  while (attempt < DEFAULT_RETRY_CONFIG.maxAttempts) {
    attempt++;

    try {
      const response = await authenticatedFetch(url, options);
      // ... existing logic ...
      return result as T;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      const classifiedError = classifyError(lastError, requestId, attempt);

      if (!shouldRetry(classifiedError, attempt)) {
        throw error;
      }

      const delay = calculateRetryDelay(attempt);
      await new Promise(resolve => setTimeout(resolve, delay));

      log.warn(`Retrying request (attempt ${attempt})`, { endpoint, delay });
    }
  }

  throw lastError;
}
```

**Effort:** 30 minutes

---

### High Priority Gaps

#### 4. ❌ Request Timeout Not Implemented

**Impact:** MEDIUM - Requests can hang indefinitely

**Current State:**
- AbortController tracked but never used
- No timeout configuration

**Required:**
```typescript
async request<T>(
  endpoint: string,
  options: RequestInit & { timeout?: number } = {}
): Promise<T> {
  const { timeout = 30000, ...fetchOptions } = options; // Default 30s timeout
  const url = `${this.baseUrl}${endpoint}`;

  // Create AbortController for this request
  const controller = new AbortController();
  const requestId = generateRequestId();
  this.activeRequests.set(requestId, controller);

  // Set timeout
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);

  try {
    const response = await authenticatedFetch(url, {
      ...fetchOptions,
      signal: controller.signal, // ← Add abort signal
    });

    // ... existing logic ...
  } catch (error) {
    if (error.name === "AbortError") {
      throw new ApiError(0, "Request timeout", "timeout_error");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
    this.activeRequests.delete(requestId);
  }
}
```

**Effort:** 30 minutes

---

#### 5. ❌ No Request Deduplication

**Impact:** MEDIUM - Duplicate simultaneous requests waste resources

**Example Problem:**
```typescript
// Component renders twice (React Strict Mode)
// Both renders call getCurrentPlan() → 2 identical requests
const { data } = useQuery({
  queryKey: ["subscription"],
  queryFn: () => apiClient.subscriptions.getCurrentPlan(),
});
```

**Solution: Request Deduplication**
```typescript
private readonly pendingRequests = new Map<string, Promise<unknown>>();

async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const requestKey = this.getRequestKey(endpoint, options);

  // Check for pending identical request
  if (this.pendingRequests.has(requestKey)) {
    return this.pendingRequests.get(requestKey) as Promise<T>;
  }

  // Create new request promise
  const requestPromise = this.executeRequest<T>(endpoint, options);

  // Store pending request
  this.pendingRequests.set(requestKey, requestPromise);

  try {
    const result = await requestPromise;
    return result;
  } finally {
    this.pendingRequests.delete(requestKey);
  }
}

private getRequestKey(endpoint: string, options: RequestInit): string {
  return `${options.method || "GET"}:${endpoint}`;
}
```

**Effort:** 45 minutes

---

### Medium Priority Gaps

#### 6. ❌ No License Validation Method (Optional)

**Impact:** LOW - Only needed if using LemonSqueezy licenses

**Missing Code:**
```typescript
validateLicense: async (data: ValidateLicenseRequest) => {
  return client.request<ValidateLicenseResponse>(
    "/api/v1/subscriptions/validate-license",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }
  );
},

activateLicense: async (data: { license_key: string; instance_id: string }) => {
  return client.request<{ success: boolean; instance_id: string }>(
    "/api/v1/subscriptions/activate-license",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }
  );
},
```

**Effort:** 20 minutes (if licenses used)

---

#### 7. ❌ Limited Progress Tracking

**Impact:** LOW - No upload/download progress for large requests

**Use Case:**
- File uploads in knowledge management
- Large data exports

**Enhancement:**
```typescript
async requestWithProgress<T>(
  endpoint: string,
  options: RequestInit & { onProgress?: (progress: number) => void } = {}
): Promise<T> {
  const { onProgress, ...fetchOptions } = options;

  // Use XMLHttpRequest for progress tracking
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    if (onProgress) {
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100;
          onProgress(progress);
        }
      });
    }

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new ApiError(xhr.status, xhr.statusText));
      }
    });

    xhr.open(fetchOptions.method || "GET", endpoint);
    xhr.send(fetchOptions.body);
  });
}
```

**Effort:** 1 hour (optional feature)

---

## Required Changes

### Change Set 1: Add LemonSqueezy Checkout Method (CRITICAL)

**File:** [lib/api-client/subscriptions.ts](lib/api-client/subscriptions.ts)
**Location:** Add after `getTrialStatus()` method

**Add Method:**
```typescript
/**
 * Create checkout session for subscription
 */
createCheckoutSession: async (data: CreateCheckoutSessionRequest) => {
  return client.request<CreateCheckoutSessionResponse>(
    "/api/v1/subscriptions/checkout-session",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
  );
},
```

**Required Type Import:**
```typescript
import type {
  CreateCheckoutSessionRequest,
  CreateCheckoutSessionResponse,
  SubscriptionHistoryResponse,
  SubscriptionListResponse,
  TrialStatus,
  UsageStats,
  UserSubscription,
  ValidateLicenseRequest,
  ValidateLicenseResponse,
} from "@/types/subscription";
```

**Effort:** 15 minutes

---

### Change Set 2: Add Customer Portal Method (CRITICAL)

**File:** [lib/api-client/subscriptions.ts](lib/api-client/subscriptions.ts)
**Location:** Add after `createCheckoutSession()` method

**Add Method:**
```typescript
/**
 * Get customer portal URL
 */
getCustomerPortalUrl: async (return_url?: string) => {
  const params = return_url
    ? new URLSearchParams({ return_url })
    : undefined;

  return client.request<{ url: string }>(
    `/api/v1/subscriptions/customer-portal${params ? `?${params}` : ""}`,
    {
      method: "GET",
    },
  );
},
```

**Effort:** 10 minutes

---

### Change Set 3: Integrate Retry Logic (HIGH PRIORITY)

**File:** [lib/api-client/core.ts](lib/api-client/core.ts)
**Lines:** 49-110 (entire `request` method)

**Before:**
```typescript
async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${this.baseUrl}${endpoint}`;

  try {
    const response = await authenticatedFetch(url, options);

    if (!response.ok) {
      // ... error handling ...
      throw new ApiError(...);
    }

    const result = await response.json();
    // ... response parsing ...
    return result as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    log.error("Request failed", { error, endpoint });
    throw error instanceof Error ? error : new Error(String(error));
  }
}
```

**After:**
```typescript
async request<T>(endpoint: string, options: RequestInit & { retryConfig?: Partial<RetryConfig> } = {}): Promise<T> {
  const { retryConfig, ...fetchOptions } = options;
  const config = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  const url = `${this.baseUrl}${endpoint}`;
  const requestId = generateRequestId();

  let attempt = 0;
  let lastError: Error | null = null;

  while (attempt < config.maxAttempts) {
    attempt++;

    try {
      const response = await authenticatedFetch(url, fetchOptions);

      if (!response.ok) {
        // ... existing error parsing ...
        throw new ApiError(...);
      }

      const result = await response.json();
      // ... existing response parsing ...
      return result as T;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Classify error to determine if retryable
      const classifiedError = classifyError(lastError, requestId, attempt);

      // Don't retry if not retryable or max attempts reached
      if (!shouldRetry(classifiedError, attempt, config)) {
        if (error instanceof ApiError) {
          throw error;
        }
        log.error("Request failed", { error, endpoint, attempt });
        throw lastError;
      }

      // Calculate delay with exponential backoff
      const delay = calculateRetryDelay(attempt, config);
      log.warn(`Retrying request (attempt ${attempt}/${config.maxAttempts})`, {
        endpoint,
        delay,
        errorType: classifiedError.type,
      });

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // This should never be reached, but TypeScript requires it
  throw lastError || new Error("Request failed after retries");
}
```

**Required Imports:**
```typescript
import {
  calculateRetryDelay,
  classifyError,
  DEFAULT_RETRY_CONFIG,
  generateRequestId,
  shouldRetry
} from "@/lib/error-utils";
import type { RetryConfig } from "@/types/backend";
```

**Effort:** 30 minutes

---

### Change Set 4: Add Request Timeout (HIGH PRIORITY)

**File:** [lib/api-client/core.ts](lib/api-client/core.ts)
**Enhancement:** Add timeout support to retry-enabled request method

**Updated Signature:**
```typescript
async request<T>(
  endpoint: string,
  options: RequestInit & {
    timeout?: number;
    retryConfig?: Partial<RetryConfig>;
  } = {}
): Promise<T> {
  const { timeout = 30000, retryConfig, ...fetchOptions } = options;
  const config = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  const url = `${this.baseUrl}${endpoint}`;
  const requestId = generateRequestId();

  let attempt = 0;
  let lastError: Error | null = null;

  while (attempt < config.maxAttempts) {
    attempt++;

    // Create AbortController for this attempt
    const controller = new AbortController();
    this.activeRequests.set(requestId, controller);

    // Set timeout
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeout);

    try {
      const response = await authenticatedFetch(url, {
        ...fetchOptions,
        signal: controller.signal, // ← Add abort signal
      });

      clearTimeout(timeoutId);

      // ... existing logic ...
      return result as T;
    } catch (error) {
      clearTimeout(timeoutId);

      // Check for abort/timeout
      if (error instanceof Error && error.name === "AbortError") {
        lastError = new ApiError(0, "Request timeout", "timeout_error");
      } else {
        lastError = error instanceof Error ? error : new Error(String(error));
      }

      // ... existing retry logic ...
    } finally {
      this.activeRequests.delete(requestId);
    }
  }

  throw lastError || new Error("Request failed after retries");
}
```

**Effort:** 20 minutes (integrated with retry logic)

---

### Change Set 5: Add License Validation Methods (OPTIONAL)

**File:** [lib/api-client/subscriptions.ts](lib/api-client/subscriptions.ts)
**Location:** Add after `getCustomerPortalUrl()` method

**Add Methods:**
```typescript
/**
 * Validate license key
 */
validateLicense: async (data: ValidateLicenseRequest) => {
  return client.request<ValidateLicenseResponse>(
    "/api/v1/subscriptions/validate-license",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
  );
},

/**
 * Activate license
 */
activateLicense: async (data: { license_key: string; instance_id: string }) => {
  return client.request<{ success: boolean; instance_id: string }>(
    "/api/v1/subscriptions/activate-license",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
  );
},

/**
 * Deactivate license
 */
deactivateLicense: async (data: { license_key: string; instance_id: string }) => {
  return client.request<{ success: boolean }>(
    "/api/v1/subscriptions/deactivate-license",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
  );
},
```

**Effort:** 20 minutes (if licenses used)

---

## Testing Recommendations

### Unit Tests for Core Client

**File:** `__tests__/lib/api-client/core.test.ts` (create new)

```typescript
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { ApiClient, ApiError } from "@/lib/api-client/core";
import * as authUtils from "@/lib/auth-utils";

// Mock authenticatedFetch
vi.mock("@/lib/auth-utils");

describe("ApiClient", () => {
  let client: ApiClient;

  beforeEach(() => {
    client = new ApiClient();
    vi.clearAllMocks();
  });

  describe("request method", () => {
    it("should make successful GET request", async () => {
      const mockResponse = { id: "123", name: "Test" };
      vi.mocked(authUtils.authenticatedFetch).mockResolvedValue(
        new Response(JSON.stringify(mockResponse), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

      const result = await client.request<{ id: string; name: string }>(
        "/api/v1/test",
        { method: "GET" }
      );

      expect(result).toEqual(mockResponse);
      expect(authUtils.authenticatedFetch).toHaveBeenCalledWith(
        "http://127.0.0.1:2024/api/v1/test",
        { method: "GET" }
      );
    });

    it("should unwrap consistent API response format", async () => {
      const consistentResponse = {
        success: true,
        data: { id: "123", name: "Test" },
        meta: {
          request_id: "req_xyz",
          timestamp: "2025-10-17T...",
        },
      };

      vi.mocked(authUtils.authenticatedFetch).mockResolvedValue(
        new Response(JSON.stringify(consistentResponse), { status: 200 })
      );

      const result = await client.request<{ id: string; name: string }>(
        "/api/v1/test"
      );

      expect(result).toEqual({ id: "123", name: "Test" }); // Only data portion
    });

    it("should throw ApiError on 404", async () => {
      vi.mocked(authUtils.authenticatedFetch).mockResolvedValue(
        new Response(JSON.stringify({ message: "Not found" }), { status: 404 })
      );

      await expect(client.request("/api/v1/test")).rejects.toThrow(ApiError);
      await expect(client.request("/api/v1/test")).rejects.toThrow(
        /Not found/
      );
    });

    it("should handle network errors", async () => {
      vi.mocked(authUtils.authenticatedFetch).mockRejectedValue(
        new Error("fetch failed")
      );

      await expect(client.request("/api/v1/test")).rejects.toThrow(
        /fetch failed/
      );
    });

    it("should retry on retryable errors", async () => {
      // First attempt fails, second succeeds
      vi.mocked(authUtils.authenticatedFetch)
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ success: true }), { status: 200 })
        );

      const result = await client.request("/api/v1/test");

      expect(result).toEqual({ success: true });
      expect(authUtils.authenticatedFetch).toHaveBeenCalledTimes(2);
    });

    it("should timeout after configured duration", async () => {
      vi.mocked(authUtils.authenticatedFetch).mockImplementation(
        () =>
          new Promise((resolve) => setTimeout(() => resolve(new Response()), 5000))
      );

      await expect(
        client.request("/api/v1/test", { timeout: 100 })
      ).rejects.toThrow(/timeout/);
    }, 10000);
  });

  describe("request cancellation", () => {
    it("should cancel all active requests", () => {
      expect(client.getActiveRequestsCount()).toBe(0);

      // Make multiple requests (won't await)
      client.request("/api/v1/test1");
      client.request("/api/v1/test2");

      expect(client.getActiveRequestsCount()).toBeGreaterThan(0);

      client.cancelAllRequests();

      expect(client.getActiveRequestsCount()).toBe(0);
    });
  });
});
```

### Integration Tests for Subscription Namespace

**File:** `__tests__/lib/api-client/subscriptions.test.ts` (create new)

```typescript
import { describe, expect, it, vi } from "vitest";
import { apiClient } from "@/lib/api-client";
import * as authUtils from "@/lib/auth-utils";

vi.mock("@/lib/auth-utils");

describe("Subscription Namespace", () => {
  it("should fetch current plan", async () => {
    const mockSubscription = {
      id: "sub_123",
      plan_id: "pro",
      plan_name: "Professional",
      status: "active",
      billing_period: "monthly",
    };

    vi.mocked(authUtils.authenticatedFetch).mockResolvedValue(
      new Response(JSON.stringify(mockSubscription), { status: 200 })
    );

    const result = await apiClient.subscriptions.getCurrentPlan();

    expect(result).toEqual(mockSubscription);
    expect(authUtils.authenticatedFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/subscriptions/my-subscription"),
      expect.objectContaining({ method: "GET" })
    );
  });

  it("should create checkout session", async () => {
    const mockCheckout = {
      session: {
        session_id: "cs_123",
        checkout_url: "https://lemonsqueezy.com/checkout/cs_123",
        plan_id: "pro",
        billing_period: "monthly",
      },
    };

    vi.mocked(authUtils.authenticatedFetch).mockResolvedValue(
      new Response(JSON.stringify(mockCheckout), { status: 200 })
    );

    const result = await apiClient.subscriptions.createCheckoutSession({
      plan_id: "pro",
      billing_period: "monthly",
    });

    expect(result).toEqual(mockCheckout);
    expect(authUtils.authenticatedFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/subscriptions/checkout-session"),
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("pro"),
      })
    );
  });

  it("should get customer portal URL", async () => {
    const mockPortal = { url: "https://lemonsqueezy.com/portal/xyz" };

    vi.mocked(authUtils.authenticatedFetch).mockResolvedValue(
      new Response(JSON.stringify(mockPortal), { status: 200 })
    );

    const result = await apiClient.subscriptions.getCustomerPortalUrl(
      "https://app.wrext.com/settings/billing"
    );

    expect(result).toEqual(mockPortal);
    expect(authUtils.authenticatedFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/subscriptions/customer-portal"),
      expect.objectContaining({ method: "GET" })
    );
  });
});
```

---

## Summary

### Files Requiring Changes

| File | Lines | Priority | Effort | Changes |
|------|-------|----------|--------|---------|
| [lib/api-client/core.ts](lib/api-client/core.ts) | 129 | HIGH | 1h | Add retry logic and timeout support |
| [lib/api-client/subscriptions.ts](lib/api-client/subscriptions.ts) | 139 | CRITICAL | 45m | Add checkout, portal, license methods |
| **TOTAL** | **268** | - | **1.75h** | **2 files** |

### New Methods Required

1. ✅ `createCheckoutSession(data)` - Create LemonSqueezy checkout session
2. ✅ `getCustomerPortalUrl(return_url?)` - Get customer portal URL
3. ⚠️ `validateLicense(data)` - Validate license key (optional)
4. ⚠️ `activateLicense(data)` - Activate license (optional)
5. ⚠️ `deactivateLicense(data)` - Deactivate license (optional)

### Infrastructure Enhancements

1. ✅ Integrate retry logic into core client (30 min)
2. ✅ Add request timeout support (20 min, integrated with retry)
3. ⚠️ Add request deduplication (45 min, optional)
4. ⚠️ Add progress tracking (1 hour, optional)

### Breaking Changes

**None** - All changes are additive:
- ✅ New methods added to subscription namespace
- ✅ Optional parameters added to core request method
- ✅ Backward compatible with existing code

---

## Next Steps

### Immediate Actions (This Task)

1. ✅ **Add checkout and portal methods** to [lib/api-client/subscriptions.ts](lib/api-client/subscriptions.ts) (45 minutes)
2. ✅ **Integrate retry logic** into [lib/api-client/core.ts](lib/api-client/core.ts) (30 minutes)
3. ✅ **Add timeout support** to [lib/api-client/core.ts](lib/api-client/core.ts) (20 minutes)
4. ✅ **Write unit tests** for new functionality (30 minutes)

**Total Effort:** 2-2.5 hours

### Follow-up Tasks (Next Tasks)

1. **Task 0.2.3:** Audit existing subscription UI components
   - Identify components using subscription API
   - Plan checkout flow integration
   - Design customer portal button

2. **Task 0.2.4:** Audit routing and pages
   - Review subscription-related pages
   - Plan new checkout pages
   - Plan billing settings updates

---

## Conclusion

The frontend API client infrastructure is **well-architected** with a solid foundation for the LemonSqueezy integration. The unified namespace pattern, comprehensive error handling utilities, and AuthJS integration provide an excellent base.

**Key Strengths:**
- ✅ Modern, maintainable architecture
- ✅ Full TypeScript support with type inference
- ✅ Comprehensive error utilities (classification, retry, recovery)
- ✅ Automatic authentication via AuthJS
- ✅ Consistent response format handling

**Required Additions:**
- Add 2-3 new subscription methods (checkout, portal, licenses)
- Integrate existing retry logic into core client
- Add request timeout support

**Total Effort:** 2-2.5 hours
**Risk Level:** LOW (all changes additive and backward compatible)
**Recommendation:** Proceed with changes as outlined in this audit.

---

**Task Status:** ✅ COMPLETE
**Audit Completed:** 2025-10-17
**Next Task:** 0.2.3 - Audit existing subscription UI components
