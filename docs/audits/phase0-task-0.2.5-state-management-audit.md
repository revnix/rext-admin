# Phase 0 - Task 0.2.5: State Management Audit

**Task:** Review state management for subscription system
**Date:** 2025-10-17
**Status:** ✅ Complete

---

## Executive Summary

This audit analyzes the state management architecture for subscription-related features in the `wrext-admin` frontend. The application uses a **hybrid approach** combining **React Query** for server state and **Zustand** for client state, following modern React best practices.

### Key Findings

1. **✅ Modern Architecture**: React Query + Zustand hybrid approach
2. **✅ Optimized Configuration**: 2-minute stale time for collaborative features
3. **✅ Proper Separation**: Server state (React Query) vs. Client state (Zustand)
4. **❌ No Subscription Store**: No Zustand store for subscription-specific client state
5. **❌ Manual Cache Invalidation**: Query invalidation done manually in components
6. **⚠️ No Real-Time Updates**: No webhook-to-frontend push mechanism

### Impact Assessment

- **New stores needed:** 1 Zustand store for subscription UI state (optional)
- **Cache strategy updates:** Minor optimizations for subscription queries
- **Real-time updates:** Webhook polling or WebSocket integration needed
- **Estimated effort:** 2-3 hours

---

## Table of Contents

1. [State Management Architecture](#state-management-architecture)
2. [React Query Configuration](#react-query-configuration)
3. [Subscription State Analysis](#subscription-state-analysis)
4. [Cache Invalidation Patterns](#cache-invalidation-patterns)
5. [Real-Time Synchronization](#real-time-synchronization)
6. [Gap Analysis](#gap-analysis)
7. [Recommendations](#recommendations)

---

## State Management Architecture

### Hybrid Approach

```
State Management Strategy
├── Server State (React Query)
│   ├── Subscription data (queries)
│   ├── Plan data (queries)
│   ├── Usage stats (queries)
│   └── Mutations (subscribe, upgrade, cancel)
│
└── Client State (Zustand)
    ├── Auth state (tokens)
    ├── Workspace context
    ├── Knowledge filters
    ├── Topic builder state
    └── ❌ NO subscription UI state
```

### State Classification

| State Type | Management | Examples |
|------------|------------|----------|
| **Server State** | React Query | Subscriptions, plans, usage, invoices |
| **Client State** | Zustand | UI preferences, form state, filters |
| **URL State** | Next.js Router | Query params, search params |
| **Form State** | React Hook Form | Form inputs, validation |

---

## React Query Configuration

**File:** [lib/query-client.ts](lib/query-client.ts)

### Configuration Analysis

```typescript
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Cache configuration
        staleTime: 2 * 60 * 1000,  // 2 minutes
        gcTime: 5 * 60 * 1000,     // 5 minutes (garbage collection)

        // Refetch strategy
        refetchOnMount: true,        // ✅ Good for collaborative features
        refetchOnWindowFocus: true,  // ✅ Always fetch fresh data on focus
        refetchOnReconnect: true,    // ✅ Refetch after network reconnect

        // Error handling
        retry: false,                // ❌ No retries - fail fast
        networkMode: "online",       // ✅ Only when online
      },
      mutations: {
        retry: false,                // ❌ No retries
        networkMode: "online",
      },
    },
  });
}
```

### Strengths

1. **✅ Short Stale Time (2min)**: Good for collaborative features
2. **✅ Refetch on Focus**: Ensures fresh data when user returns
3. **✅ Refetch on Reconnect**: Handles offline/online transitions
4. **✅ Singleton Pattern**: Proper client-side caching

### Issues

1. **❌ No Retry Logic**: Queries don't retry on failure
   - **Impact**: Network hiccups cause immediate failures
   - **Recommendation**: Enable smart retries for GET requests

2. **❌ Generic Configuration**: No subscription-specific optimizations
   - **Impact**: Subscription queries use same stale time as other data
   - **Recommendation**: Subscription data could be fresher (30s-1min)

### Recommendations

```typescript
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 2 * 60 * 1000,
        gcTime: 5 * 60 * 1000,
        refetchOnMount: true,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,

        // ADD: Smart retry strategy
        retry: (failureCount, error) => {
          // Don't retry on 4xx errors (client errors)
          if (error instanceof ApiError && error.statusCode >= 400 && error.statusCode < 500) {
            return false;
          }
          // Retry up to 3 times for network/server errors
          return failureCount < 3;
        },

        // ADD: Exponential backoff
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

        networkMode: "online",
      },
      mutations: {
        retry: false, // Keep mutations fail-fast
        networkMode: "online",
      },
    },
  });
}
```

---

## Subscription State Analysis

### Current React Query Usage

**File:** [app/settings/subscription/page.tsx](app/settings/subscription/page.tsx)

#### Queries

```typescript
// 1. Current subscription
const { data: subscription } = useQuery<UserSubscription>({
  queryKey: ["subscription"],
  queryFn: () => apiClient.subscriptions.getCurrentPlan(),
});

// 2. Usage statistics
const { data: usage } = useQuery<UsageStats>({
  queryKey: ["usage"],
  queryFn: () => apiClient.subscriptions.getUsageStats(),
  enabled: !!subscription, // Only fetch if subscription exists
});

// 3. Trial status
const { data: trialStatus } = useQuery<TrialStatus>({
  queryKey: ["trial-status"],
  queryFn: () => apiClient.subscriptions.getTrialStatus(),
  enabled: !!subscription,
});

// 4. Subscription history
const { data: history } = useQuery<{ subscriptions: SubscriptionHistoryEntry[] }>({
  queryKey: ["subscription-history"],
  queryFn: () => apiClient.subscriptions.getHistory(10, 0),
});

// 5. Available plans (when upgrading)
const { data: plansData } = useQuery<{ plans: SubscriptionPlan[] }>({
  queryKey: ["subscription-plans"],
  queryFn: apiClient.subscriptions.getPlans,
  enabled: showPlans, // Only fetch when modal is open
});
```

#### Mutations

```typescript
// 1. Upgrade subscription
const upgradeMutation = useMutation({
  mutationFn: (planId: string) =>
    apiClient.subscriptions.upgrade({ plan_id: planId }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["subscription"] });
    queryClient.invalidateQueries({ queryKey: ["usage"] });
    toast.success("Plan upgraded successfully");
    setShowPlans(false);
  },
  onError: (error: Error) => {
    toast.error("Failed to upgrade plan", { description: error.message });
  },
});

// 2. Cancel subscription
const cancelMutation = useMutation({
  mutationFn: (data: SubscriptionCancelRequest) =>
    apiClient.subscriptions.cancel(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["subscription"] });
    toast.success("Subscription cancelled");
  },
  onError: (error: Error) => {
    toast.error("Failed to cancel subscription");
  },
});
```

### Query Key Structure

| Query Key | Data | Stale Time | Refetch Strategy |
|-----------|------|------------|------------------|
| `["subscription"]` | UserSubscription | 2min (default) | On mount, focus, reconnect |
| `["usage"]` | UsageStats | 2min (default) | On mount, focus, reconnect |
| `["trial-status"]` | TrialStatus | 2min (default) | On mount, focus, reconnect |
| `["subscription-history"]` | History entries | 2min (default) | On mount, focus, reconnect |
| `["subscription-plans"]` | Available plans | 2min (default) | Only when modal open |

### Issues

1. **❌ No Hierarchical Keys**: Flat structure makes selective invalidation harder
2. **❌ Generic Stale Time**: Subscription status should be fresher (30s-1min)
3. **❌ No Query Params**: History query doesn't include limit/offset in key

### Recommendations

#### Better Query Key Structure

```typescript
// Hierarchical keys for better invalidation control
const queryKeys = {
  all: ["subscriptions"] as const,
  detail: () => [...queryKeys.all, "detail"] as const,
  current: () => [...queryKeys.detail(), "current"] as const,
  usage: (subscriptionId?: string) =>
    [...queryKeys.all, "usage", subscriptionId] as const,
  trial: () => [...queryKeys.all, "trial"] as const,
  history: (filters?: { limit: number; offset: number }) =>
    [...queryKeys.all, "history", filters] as const,
  plans: {
    all: [...queryKeys.all, "plans"] as const,
    list: () => [...queryKeys.plans.all, "list"] as const,
    detail: (id: string) => [...queryKeys.plans.all, id] as const,
  },
};

// Usage
const { data: subscription } = useQuery({
  queryKey: queryKeys.current(),
  queryFn: () => apiClient.subscriptions.getCurrentPlan(),
  staleTime: 1 * 60 * 1000, // 1 minute - fresher than default
});

const { data: usage } = useQuery({
  queryKey: queryKeys.usage(subscription?.id),
  queryFn: () => apiClient.subscriptions.getUsageStats(),
  enabled: !!subscription,
});

// Invalidation becomes easier and more precise
queryClient.invalidateQueries({ queryKey: queryKeys.all }); // All subscription queries
queryClient.invalidateQueries({ queryKey: queryKeys.detail() }); // Just detail queries
queryClient.invalidateQueries({ queryKey: queryKeys.current() }); // Just current subscription
```

---

## Cache Invalidation Patterns

### Current Pattern: Manual Invalidation

```typescript
// Pattern 1: Invalidate after mutation
const upgradeMutation = useMutation({
  mutationFn: (planId: string) => apiClient.subscriptions.upgrade({ plan_id: planId }),
  onSuccess: () => {
    // Manual invalidation
    queryClient.invalidateQueries({ queryKey: ["subscription"] });
    queryClient.invalidateQueries({ queryKey: ["usage"] });
  },
});
```

**Issues:**
1. **❌ Verbose**: Must remember all affected queries
2. **❌ Error-Prone**: Easy to forget a query
3. **❌ No Type Safety**: String keys prone to typos

### Recommended Pattern: Centralized Invalidation

```typescript
// lib/query-invalidation.ts
export const subscriptionInvalidation = {
  all: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.all });
  },

  current: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.current() });
  },

  afterUpgrade: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.detail() });
    queryClient.invalidateQueries({ queryKey: queryKeys.usage() });
  },

  afterCancel: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.current() });
  },

  afterWebhook: (queryClient: QueryClient, eventType: WebhookEventType) => {
    switch (eventType) {
      case "subscription_created":
      case "subscription_updated":
      case "subscription_resumed":
        queryClient.invalidateQueries({ queryKey: queryKeys.current() });
        queryClient.invalidateQueries({ queryKey: queryKeys.usage() });
        break;
      case "subscription_cancelled":
      case "subscription_expired":
        queryClient.invalidateQueries({ queryKey: queryKeys.current() });
        break;
      case "subscription_payment_success":
        queryClient.invalidateQueries({ queryKey: queryKeys.history() });
        break;
    }
  },
};

// Usage in mutation
const upgradeMutation = useMutation({
  mutationFn: (planId: string) => apiClient.subscriptions.upgrade({ plan_id: planId }),
  onSuccess: () => {
    subscriptionInvalidation.afterUpgrade(queryClient);
    toast.success("Plan upgraded successfully");
  },
});
```

### Advanced Pattern: Optimistic Updates

```typescript
// For better UX, update cache immediately (before server confirms)
const cancelMutation = useMutation({
  mutationFn: (data: SubscriptionCancelRequest) =>
    apiClient.subscriptions.cancel(data),

  // Optimistic update
  onMutate: async (data) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: queryKeys.current() });

    // Snapshot current value
    const previousSubscription = queryClient.getQueryData<UserSubscription>(
      queryKeys.current()
    );

    // Optimistically update
    if (previousSubscription) {
      queryClient.setQueryData<UserSubscription>(queryKeys.current(), {
        ...previousSubscription,
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        cancel_at_period_end: !data.cancel_immediately,
      });
    }

    return { previousSubscription };
  },

  // Rollback on error
  onError: (err, variables, context) => {
    if (context?.previousSubscription) {
      queryClient.setQueryData(queryKeys.current(), context.previousSubscription);
    }
    toast.error("Failed to cancel subscription");
  },

  // Refetch to ensure correctness
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.current() });
  },
});
```

---

## Real-Time Synchronization

### Current State: Polling on Checkout Success

**File:** [app/checkout/success/page.tsx](app/checkout/success/page.tsx) (from Task 0.2.3)

```typescript
useEffect(() => {
  const pollSubscription = async () => {
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds

    const interval = setInterval(async () => {
      attempts++;

      try {
        const subscription = await apiClient.subscriptions.getCurrentPlan();

        if (subscription.status === "active" || subscription.status === "trial") {
          setStatus("success");
          clearInterval(interval);
          setTimeout(() => router.push("/settings/subscription"), 2000);
        }
      } catch (error) {
        // Continue polling
      }

      if (attempts >= maxAttempts) {
        setStatus("error");
        clearInterval(interval);
      }
    }, 1000); // Poll every second

    return () => clearInterval(interval);
  };

  pollSubscription();
}, [router]);
```

**Issues:**
1. **⚠️ Inefficient**: Polls every second for 30 seconds
2. **⚠️ Race Conditions**: Multiple tabs could poll simultaneously
3. **❌ No Webhook Push**: Relies on polling instead of push notifications

### Recommended Approaches

#### Option 1: Smart Polling (Immediate Implementation)

```typescript
// hooks/use-subscription-polling.ts
export function useSubscriptionPolling(enabled: boolean) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    let attempts = 0;
    const maxAttempts = 20;
    const baseInterval = 2000; // Start with 2 seconds

    const poll = async () => {
      attempts++;

      // Invalidate queries to trigger refetch
      await queryClient.invalidateQueries({ queryKey: queryKeys.current() });

      const subscription = queryClient.getQueryData<UserSubscription>(
        queryKeys.current()
      );

      if (subscription && (subscription.status === "active" || subscription.status === "trial")) {
        return true; // Success - stop polling
      }

      if (attempts >= maxAttempts) {
        return false; // Timeout - stop polling
      }

      // Exponential backoff: 2s, 4s, 8s, max 10s
      const delay = Math.min(baseInterval * Math.pow(2, attempts - 1), 10000);
      await new Promise((resolve) => setTimeout(resolve, delay));

      return poll(); // Continue polling
    };

    poll();
  }, [enabled, queryClient]);
}
```

#### Option 2: Server-Sent Events (SSE) - Future Enhancement

```typescript
// providers/subscription-events-provider.tsx
export function SubscriptionEventsProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user?.accessToken) return;

    const apiUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://127.0.0.1:2024";
    const eventSource = new EventSource(
      `${apiUrl}/api/v1/subscriptions/events?token=${session.user.accessToken}`
    );

    eventSource.addEventListener("subscription_updated", (event) => {
      const data = JSON.parse(event.data);

      // Update cache immediately
      queryClient.setQueryData<UserSubscription>(queryKeys.current(), data.subscription);

      // Show toast notification
      toast.success("Your subscription has been updated");
    });

    eventSource.addEventListener("subscription_cancelled", (event) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.current() });
      toast.info("Your subscription has been cancelled");
    });

    return () => eventSource.close();
  }, [session, queryClient]);

  return <>{children}</>;
}
```

#### Option 3: WebSocket (Most Advanced)

```typescript
// lib/subscription-websocket.ts
export class SubscriptionWebSocket {
  private ws: WebSocket | null = null;

  connect(token: string) {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://127.0.0.1:2024";
    this.ws = new WebSocket(`${wsUrl}/ws/subscriptions?token=${token}`);

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.type === "subscription_update") {
        // Notify React Query to refetch
        window.dispatchEvent(new CustomEvent("subscription:update", {
          detail: message.data,
        }));
      }
    };
  }

  disconnect() {
    this.ws?.close();
  }
}

// hooks/use-subscription-websocket.ts
export function useSubscriptionWebSocket() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  useEffect(() => {
    const handleUpdate = (event: CustomEvent) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.current() });
    };

    window.addEventListener("subscription:update", handleUpdate as EventListener);

    return () => {
      window.removeEventListener("subscription:update", handleUpdate as EventListener);
    };
  }, [queryClient]);
}
```

### Recommendation: Start with Smart Polling, Add SSE Later

**Phase 1 (MVP):** Smart polling with exponential backoff
**Phase 2 (Enhancement):** Server-Sent Events for real-time updates
**Phase 3 (Optional):** Full WebSocket implementation

---

## Gap Analysis

### Critical Gaps

#### 1. ❌ No Retry Logic in React Query

**Impact:** HIGH - Network failures cause immediate errors

**Current:** `retry: false` (fail fast)

**Recommendation:**
```typescript
retry: (failureCount, error) => {
  if (error instanceof ApiError && error.statusCode >= 400 && error.statusCode < 500) {
    return false; // Don't retry client errors
  }
  return failureCount < 3; // Retry server/network errors up to 3 times
},
retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
```

**Effort:** 15 minutes

---

#### 2. ❌ Manual Cache Invalidation

**Impact:** MEDIUM - Prone to errors and inconsistencies

**Current:** Manual `invalidateQueries` in every mutation

**Recommendation:** Centralized invalidation helpers

**Effort:** 1 hour

---

#### 3. ❌ Flat Query Key Structure

**Impact:** MEDIUM - Difficult to invalidate selectively

**Current:** `["subscription"]`, `["usage"]`

**Recommendation:** Hierarchical query keys

**Effort:** 1 hour

---

### High Priority Gaps

#### 4. ⚠️ No Real-Time Updates

**Impact:** MEDIUM - Users don't see webhook updates until page reload

**Current:** Manual refresh required

**Recommendation:** Smart polling on checkout success (immediate), SSE (future)

**Effort:** 2 hours (polling), 4 hours (SSE)

---

#### 5. ⚠️ Generic Stale Time for Subscriptions

**Impact:** LOW - Subscription data not as fresh as it could be

**Current:** 2-minute stale time for all queries

**Recommendation:** 30s-1min for subscription queries

**Effort:** 15 minutes

---

### Medium Priority Gaps

#### 6. ⚠️ No Subscription UI State Store

**Impact:** LOW - UI state scattered across component state

**Current:** Component-level state (showPlans, checkoutLoading, etc.)

**Recommendation:** Optional Zustand store for UI preferences

**Effort:** 1 hour (optional)

---

## Recommendations

### Immediate Actions (Week 1)

**Priority:** CRITICAL
**Effort:** 2-3 hours

1. **Add Retry Logic to React Query** (15 min)
   - Smart retries for GET requests
   - Exponential backoff
   - Skip retries for 4xx errors

2. **Implement Hierarchical Query Keys** (1 hour)
   - Create queryKeys factory
   - Update all subscription queries
   - Type-safe key structure

3. **Centralize Cache Invalidation** (1 hour)
   - Create invalidation helpers
   - Update all mutations
   - Add webhook invalidation support

4. **Optimize Subscription Stale Time** (15 min)
   - 30s-1min for subscription queries
   - Keep 2min for less critical data

### Future Enhancements (Week 2-3)

**Priority:** HIGH
**Effort:** 4-6 hours

1. **Smart Polling for Checkout Success** (2 hours)
   - Exponential backoff polling
   - Automatic stop on success
   - Timeout handling

2. **Server-Sent Events** (4 hours)
   - Backend SSE endpoint
   - Frontend SSE provider
   - Real-time subscription updates

3. **Subscription UI State Store** (1 hour, optional)
   - Zustand store for UI preferences
   - Persist billing period selection
   - Store modal states

---

## Summary

### State Management Inventory

| Aspect | Current State | Recommendation | Effort |
|--------|--------------|----------------|--------|
| **React Query Config** | ⚠️ No retries | Add smart retry logic | 15min |
| **Query Keys** | ❌ Flat structure | Hierarchical keys | 1h |
| **Cache Invalidation** | ❌ Manual | Centralized helpers | 1h |
| **Real-Time Updates** | ❌ None | Smart polling + SSE | 2-6h |
| **Stale Time** | ⚠️ Generic 2min | 30s-1min for subscriptions | 15min |
| **Zustand Stores** | ⚠️ No subscription store | Optional UI state store | 1h |

### Total Effort

- **Immediate (Week 1):** 2-3 hours
- **Future (Week 2-3):** 4-6 hours
- **Total:** 6-9 hours

---

## Next Steps

### Immediate Actions (This Task)

1. ✅ Document state management architecture
2. ✅ Identify gaps and optimizations
3. ✅ Create implementation plan

### Implementation Tasks

1. **Update React Query Config**
   - Add retry logic with exponential backoff
   - Optimize stale times for subscription queries

2. **Refactor Query Keys**
   - Create hierarchical query key factory
   - Update all subscription queries

3. **Centralize Invalidation**
   - Create invalidation helper functions
   - Update all mutations

4. **Add Smart Polling**
   - Implement polling hook for checkout success
   - Exponential backoff strategy

---

## Conclusion

The state management architecture is **well-designed** using modern best practices (React Query + Zustand). The main gaps are **missing retry logic**, **manual cache invalidation**, and **no real-time updates** from webhooks.

**Key Strengths:**
- ✅ Hybrid approach (React Query + Zustand)
- ✅ Optimized for collaboration (2min stale time, refetch on focus)
- ✅ Proper client-side caching
- ✅ Clean separation of concerns

**Required Improvements:**
- Add retry logic to React Query
- Implement hierarchical query keys
- Centralize cache invalidation
- Add smart polling for checkout success
- Consider SSE for real-time updates

**Total Effort:** 6-9 hours
**Risk Level:** LOW (optimizations, no breaking changes)
**Recommendation:** Proceed with improvements as outlined in this audit.

---

**Task Status:** ✅ COMPLETE
**Audit Completed:** 2025-10-17
**Next Phase:** Complete Phase 0 audits, begin implementation
