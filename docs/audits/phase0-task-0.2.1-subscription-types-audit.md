# Phase 0 - Task 0.2.1: Subscription Types & Interfaces Audit

**Task:** Audit subscription types and interfaces in `wrext-admin` (Frontend)
**Date:** 2025-10-17
**Status:** ✅ Complete

---

## Executive Summary

This audit analyzes the TypeScript type definitions for subscription management in the `wrext-admin` frontend. The current implementation uses provider-agnostic types but contains **legacy Stripe naming** that must be updated for LemonSqueezy integration.

### Key Findings

1. **✅ Strong Foundation**: Well-structured type system with comprehensive interfaces
2. **❌ Legacy Stripe References**: Field names contain "stripe_price_id" instead of provider-agnostic naming
3. **❌ Missing LemonSqueezy Fields**: Types lack LemonSqueezy-specific data (variant IDs, URLs, payment details)
4. **✅ API Client Ready**: Clean API client structure that will require minimal changes
5. **❌ No Payment Provider Types**: Missing types for checkout sessions, webhooks, and payment methods

### Impact Assessment

- **Files requiring changes:** 3 files ([types/subscription.ts](types/subscription.ts), [lib/api-client/subscriptions.ts](lib/api-client/subscriptions.ts), [types/index.ts](types/index.ts))
- **New types required:** 8-10 new interfaces (checkout, webhooks, licenses)
- **Breaking changes:** Field naming updates (stripe → lemonsqueezy or provider-agnostic)
- **Estimated effort:** 2-3 hours

---

## Table of Contents

1. [Files Analyzed](#files-analyzed)
2. [Current Type System Architecture](#current-type-system-architecture)
3. [Detailed Analysis by Category](#detailed-analysis-by-category)
4. [Gap Analysis](#gap-analysis)
5. [Required Changes](#required-changes)
6. [Migration Strategy](#migration-strategy)
7. [Testing Recommendations](#testing-recommendations)

---

## Files Analyzed

### 1. [types/subscription.ts](types/subscription.ts) (232 lines)

**Purpose:** Core subscription type definitions
**Status:** ⚠️ Needs Updates
**Key Content:**
- Enums: `SubscriptionStatus`, `BillingPeriod`
- Plan interfaces: `SubscriptionPlan`, `SubscriptionPlanCreate`, `SubscriptionPlanUpdate`
- User subscription interfaces: `UserSubscription`, `SubscriptionCreateRequest`, `SubscriptionUpgradeRequest`, `SubscriptionCancelRequest`
- Usage tracking: `UsageStats`, `TrialStatus`
- History: `SubscriptionHistoryEntry`, `SubscriptionHistoryResponse`
- Helper functions: `isUnlimited()`, `formatLimit()`, `calculateTrialDaysRemaining()`, `isSubscriptionActive()`, `getUsageStatusColor()`

**Issues Found:**
```typescript
// ❌ ISSUE: Legacy Stripe naming in SubscriptionPlanCreate (lines 60-61)
export interface SubscriptionPlanCreate {
  // ... other fields ...
  stripe_price_id_monthly?: string;  // ❌ Should be provider-agnostic
  stripe_price_id_yearly?: string;   // ❌ Should be provider-agnostic
}

// ❌ ISSUE: Same in SubscriptionPlanUpdate (lines 77-78)
export interface SubscriptionPlanUpdate {
  // ... other fields ...
  stripe_price_id_monthly?: string;  // ❌ Should be provider-agnostic
  stripe_price_id_yearly?: string;   // ❌ Should be provider-agnostic
}
```

**Missing LemonSqueezy Fields:**
```typescript
// UserSubscription interface (lines 85-99) is missing:
// - provider_order_id: LemonSqueezy order ID
// - provider_variant_id: LemonSqueezy variant ID
// - cancel_at_period_end: Boolean flag
// - renews_at: Next renewal timestamp
// - paused_at: Pause timestamp (for paused subscriptions)
// - card_brand: Payment method brand (Visa, Mastercard)
// - card_last_four: Last 4 digits of card
// - urls: Customer portal and invoice URLs
```

### 2. [lib/api-client/subscriptions.ts](lib/api-client/subscriptions.ts) (139 lines)

**Purpose:** API client methods for subscription operations
**Status:** ✅ Mostly Ready (minor additions needed)
**Key Content:**
- `getCurrentPlan()`: Get current subscription
- `getPlans()`: Get available plans
- `getPlan(planId)`: Get specific plan
- `subscribe(data)`: Create subscription
- `upgrade(data)`: Upgrade subscription
- `cancel(data)`: Cancel subscription
- `getHistory()`: Get subscription history
- `getUsageStats()`: Get usage statistics
- `getTrialStatus()`: Get trial status

**Current Implementation:**
```typescript
// Line 59-72: Subscribe method
subscribe: async (data: {
  plan_id: string;
  payment_method_id?: string;  // ⚠️ Generic, may need LemonSqueezy checkout session ID
}) => {
  return client.request<{
    id: string;
    plan_id: string;
    status: string;
  }>("/api/v1/subscriptions/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
},
```

**Missing Methods:**
```typescript
// MISSING: Create checkout session
createCheckoutSession: async (data: { plan_id: string, billing_period: string }) => {
  // Returns checkout_url for LemonSqueezy redirect
}

// MISSING: Get customer portal URL
getCustomerPortalUrl: async () => {
  // Returns LemonSqueezy customer portal URL
}

// MISSING: Validate license key (if using LemonSqueezy licenses)
validateLicense: async (licenseKey: string) => {
  // Returns license validation result
}
```

### 3. [types/backend.ts](types/backend.ts) (660 lines)

**Purpose:** Backend API type definitions
**Status:** ✅ No subscription-specific types (generic API types only)
**Key Content:**
- Generic error handling types
- Consistent response format integration
- Backend service configuration
- Not subscription-specific

**No Changes Required:** This file handles generic backend communication patterns.

### 4. [types/api.ts](types/api.ts) (1,204 lines)

**Purpose:** API request/response interfaces for Topic Builder
**Status:** ✅ No subscription-specific types (topic builder only)
**Key Content:**
- Topic generation request/response types
- Error handling interfaces
- API response wrappers
- Not subscription-specific

**No Changes Required:** This file is dedicated to topic builder functionality.

### 5. [types/index.ts](types/index.ts) (277 lines)

**Purpose:** Centralized type exports
**Status:** ⚠️ Needs Updates (must export new subscription types)
**Key Content:**
- Exports from all type modules
- Currently does NOT export subscription types

**Missing Exports:**
```typescript
// MISSING: No subscription type exports!
// Need to add:
export type {
  BillingPeriod,
  SubscriptionCancelRequest,
  SubscriptionCreateRequest,
  SubscriptionHistoryEntry,
  SubscriptionHistoryResponse,
  SubscriptionListResponse,
  SubscriptionPlan,
  SubscriptionPlanCreate,
  SubscriptionPlanUpdate,
  SubscriptionStatus,
  SubscriptionUpgradeRequest,
  SubscriptionWithPlan,
  TrialStatus,
  UsageStats,
  UserSubscription,
} from "./subscription";

export {
  calculateTrialDaysRemaining,
  formatLimit,
  getUsageStatusColor,
  isSubscriptionActive,
  isUnlimited,
} from "./subscription";
```

---

## Current Type System Architecture

### Enum Definitions

#### SubscriptionStatus Enum
```typescript
export enum SubscriptionStatus {
  ACTIVE = "active",      // ✅ Matches backend
  CANCELLED = "cancelled", // ✅ Matches backend
  EXPIRED = "expired",     // ✅ Matches backend
  TRIAL = "trial",         // ✅ Matches backend
  SUSPENDED = "suspended", // ✅ Matches backend
}
```
**Analysis:** ✅ **Perfect alignment** with backend enum values.

#### BillingPeriod Enum
```typescript
export enum BillingPeriod {
  MONTHLY = "monthly",   // ✅ Matches backend
  YEARLY = "yearly",     // ✅ Matches backend
  LIFETIME = "lifetime", // ✅ Matches backend
}
```
**Analysis:** ✅ **Perfect alignment** with backend enum values.

### Core Interfaces

#### 1. SubscriptionPlan Interface
```typescript
export interface SubscriptionPlan extends Record<string, unknown> {
  id: string;
  name: string;                      // ✅ Unique identifier
  display_name: string;              // ✅ Human-readable name
  description: string | null;        // ✅ Optional description
  price_monthly: number;             // ✅ Monthly price
  price_yearly: number;              // ✅ Yearly price
  features: Record<string, unknown>; // ✅ Flexible JSON features
  max_workspaces: number;            // ✅ Workspace limit (-1 = unlimited)
  max_members_per_workspace: number; // ✅ Member limit
  max_topics: number;                // ✅ Topic limit
  max_knowledge_items: number;       // ✅ Knowledge limit
  max_api_calls_per_month: number;   // ✅ API call limit
  is_active: boolean;                // ✅ Active status
  is_public: boolean;                // ✅ Public visibility
  created_at: string;                // ✅ Creation timestamp
}
```
**Analysis:** ✅ **Comprehensive plan definition**, matches backend schema.

**Missing Fields for LemonSqueezy:**
```typescript
// RECOMMENDED ADDITIONS:
lemonsqueezy_product_id?: string;          // NEW: LemonSqueezy product ID
lemonsqueezy_variant_id_monthly?: string;  // NEW: Monthly variant ID
lemonsqueezy_variant_id_yearly?: string;   // NEW: Yearly variant ID
lemonsqueezy_store_id?: string;            // NEW: LemonSqueezy store ID
```

#### 2. UserSubscription Interface
```typescript
export interface UserSubscription {
  id: string;                         // ✅ Subscription ID
  user_id: string;                    // ✅ User ID
  plan_id: string;                    // ✅ Plan reference
  plan_name: string | null;           // ✅ Plan name (denormalized)
  plan_display_name: string | null;   // ✅ Display name (denormalized)
  status: SubscriptionStatus;         // ✅ Current status
  billing_period: BillingPeriod;      // ✅ Billing cycle
  start_date: string;                 // ✅ Subscription start
  end_date: string | null;            // ✅ Subscription end
  trial_end_date: string | null;      // ✅ Trial expiration
  cancelled_at: string | null;        // ✅ Cancellation timestamp
  current_api_calls: number;          // ✅ API usage tracking
  created_at: string;                 // ✅ Creation timestamp
}
```
**Analysis:** ✅ **Solid foundation**, but missing critical LemonSqueezy fields.

**Missing Fields for LemonSqueezy:**
```typescript
// REQUIRED ADDITIONS:
provider_order_id: string | null;          // NEW: LemonSqueezy order ID
provider_subscription_id: string | null;   // NEW: LemonSqueezy subscription ID
provider_variant_id: string | null;        // NEW: LemonSqueezy variant ID
cancel_at_period_end: boolean;             // NEW: Deferred cancellation flag
renews_at: string | null;                  // NEW: Next renewal date
paused_at: string | null;                  // NEW: Pause timestamp
card_brand: string | null;                 // NEW: Payment method brand
card_last_four: string | null;             // NEW: Last 4 card digits
urls: {                                    // NEW: LemonSqueezy URLs
  customer_portal?: string;
  update_payment_method?: string;
  invoice_url?: string;
} | null;
```

#### 3. UsageStats Interface
```typescript
export interface UsageStats {
  subscription_id: string;          // ✅ Subscription reference
  plan_name: string;                // ✅ Current plan
  billing_period: BillingPeriod;    // ✅ Billing cycle

  // Current usage
  current_workspaces: number;       // ✅ Workspace count
  current_topics: number;           // ✅ Topic count
  current_knowledge_items: number;  // ✅ Knowledge item count
  current_api_calls: number;        // ✅ API call count

  // Limits
  max_workspaces: number;                // ✅ Workspace limit
  max_topics: number;                    // ✅ Topic limit
  max_knowledge_items: number;           // ✅ Knowledge limit
  max_api_calls_per_month: number;       // ✅ API limit

  // Usage percentages
  workspaces_usage_percent: number;      // ✅ Workspace usage %
  topics_usage_percent: number;          // ✅ Topic usage %
  knowledge_items_usage_percent: number; // ✅ Knowledge usage %
  api_calls_usage_percent: number;       // ✅ API usage %

  // Reset date
  usage_reset_date: string;              // ✅ Next reset date
}
```
**Analysis:** ✅ **Perfect**, comprehensive usage tracking, no changes needed.

#### 4. TrialStatus Interface
```typescript
export interface TrialStatus {
  is_in_trial: boolean;           // ✅ Trial active flag
  trial_end_date: string | null;  // ✅ Trial expiration
  days_remaining: number | null;  // ✅ Days left in trial
  trial_expired: boolean;         // ✅ Trial expired flag
}
```
**Analysis:** ✅ **Perfect**, no changes needed.

### Request/Response Interfaces

#### 1. SubscriptionCreateRequest
```typescript
export interface SubscriptionCreateRequest {
  plan_id: string;                    // ✅ Plan to subscribe to
  billing_period?: BillingPeriod;     // ✅ Optional billing cycle
}
```
**Analysis:** ⚠️ **Too simple** for LemonSqueezy checkout flow.

**Recommended Changes:**
```typescript
export interface SubscriptionCreateRequest {
  plan_id: string;
  billing_period: BillingPeriod;      // CHANGE: Make required
  success_url?: string;               // NEW: Checkout success redirect
  cancel_url?: string;                // NEW: Checkout cancel redirect
  metadata?: Record<string, string>;  // NEW: Custom metadata
}
```

#### 2. SubscriptionUpgradeRequest
```typescript
export interface SubscriptionUpgradeRequest {
  new_plan_id: string;                // ✅ New plan ID
  billing_period?: BillingPeriod;     // ✅ Optional billing cycle
}
```
**Analysis:** ✅ **Adequate**, may want to add:
```typescript
proration_behavior?: "create_prorations" | "none" | "always_invoice";
```

#### 3. SubscriptionCancelRequest
```typescript
export interface SubscriptionCancelRequest {
  reason?: string;               // ✅ Optional cancellation reason
  cancel_immediately?: boolean;  // ✅ Immediate vs. end-of-period
}
```
**Analysis:** ✅ **Perfect**, no changes needed.

### Helper Functions Analysis

#### 1. isUnlimited()
```typescript
export function isUnlimited(value: number): boolean {
  return value === -1;
}
```
**Analysis:** ✅ **Perfect**, matches backend convention.

#### 2. formatLimit()
```typescript
export function formatLimit(value: number): string {
  return isUnlimited(value) ? "Unlimited" : value.toLocaleString();
}
```
**Analysis:** ✅ **Perfect**, good UX helper.

#### 3. calculateTrialDaysRemaining()
```typescript
export function calculateTrialDaysRemaining(
  trialEndDate: string | null,
): number | null {
  if (!trialEndDate) return null;

  const now = new Date();
  const end = new Date(trialEndDate);
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}
```
**Analysis:** ✅ **Perfect**, handles edge cases correctly.

#### 4. isSubscriptionActive()
```typescript
export function isSubscriptionActive(subscription: UserSubscription): boolean {
  return (
    subscription.status === SubscriptionStatus.ACTIVE ||
    subscription.status === SubscriptionStatus.TRIAL
  );
}
```
**Analysis:** ✅ **Perfect**, clear business logic.

#### 5. getUsageStatusColor()
```typescript
export function getUsageStatusColor(
  usagePercent: number,
): "success" | "warning" | "destructive" {
  if (usagePercent >= 90) return "destructive";
  if (usagePercent >= 75) return "warning";
  return "success";
}
```
**Analysis:** ✅ **Perfect**, good thresholds for UX.

---

## Detailed Analysis by Category

### Category 1: Subscription Plans

**Current State:**
- ✅ Comprehensive plan fields
- ✅ All feature limits included
- ❌ Legacy Stripe naming in create/update interfaces
- ❌ Missing LemonSqueezy provider fields

**Required Changes:**

1. **Rename Provider Fields** ([types/subscription.ts:60-61](types/subscription.ts#L60-L61), [types/subscription.ts:77-78](types/subscription.ts#L77-L78)):
```typescript
// BEFORE (❌ Current)
export interface SubscriptionPlanCreate {
  // ... other fields ...
  stripe_price_id_monthly?: string;
  stripe_price_id_yearly?: string;
}

// AFTER (✅ Provider-agnostic)
export interface SubscriptionPlanCreate {
  // ... other fields ...
  provider_price_id_monthly?: string;      // OR lemonsqueezy_variant_id_monthly
  provider_price_id_yearly?: string;       // OR lemonsqueezy_variant_id_yearly
  // LemonSqueezy-specific additions:
  lemonsqueezy_product_id?: string;
  lemonsqueezy_store_id?: string;
}
```

2. **Add LemonSqueezy Fields to SubscriptionPlan Response**:
```typescript
export interface SubscriptionPlan extends Record<string, unknown> {
  // ... existing fields ...

  // NEW: LemonSqueezy integration fields
  lemonsqueezy_product_id?: string | null;
  lemonsqueezy_variant_id_monthly?: string | null;
  lemonsqueezy_variant_id_yearly?: string | null;
  lemonsqueezy_store_id?: string | null;
}
```

**Effort Estimate:** 30 minutes

---

### Category 2: User Subscriptions

**Current State:**
- ✅ Core subscription fields present
- ✅ Status tracking implemented
- ❌ Missing provider-specific metadata
- ❌ No payment method information
- ❌ No customer portal URLs

**Required Changes:**

1. **Enhance UserSubscription Interface** ([types/subscription.ts:85-99](types/subscription.ts#L85-L99)):
```typescript
export interface UserSubscription {
  // ... existing fields ...

  // NEW: Provider integration fields
  provider_order_id: string | null;          // LemonSqueezy order ID
  provider_subscription_id: string | null;   // LemonSqueezy subscription ID
  provider_variant_id: string | null;        // LemonSqueezy variant ID
  provider_customer_id: string | null;       // LemonSqueezy customer ID

  // NEW: Subscription management
  cancel_at_period_end: boolean;             // Deferred cancellation
  renews_at: string | null;                  // Next renewal date
  paused_at: string | null;                  // Pause timestamp

  // NEW: Payment method info
  card_brand: string | null;                 // "Visa", "Mastercard", etc.
  card_last_four: string | null;             // "4242"

  // NEW: LemonSqueezy URLs
  urls: {
    customer_portal?: string;                // Customer portal URL
    update_payment_method?: string;          // Update payment URL
    invoice_url?: string;                    // Latest invoice URL
  } | null;

  // NEW: Metadata (for custom data)
  metadata: Record<string, unknown> | null;
}
```

**Effort Estimate:** 45 minutes

---

### Category 3: Checkout & Payment

**Current State:**
- ❌ No checkout session types
- ❌ No payment method types
- ❌ Subscribe method returns incomplete data

**Required Changes:**

1. **Create CheckoutSession Interface** (NEW file or in [types/subscription.ts](types/subscription.ts)):
```typescript
/**
 * Checkout session for creating new subscriptions
 * Returned when user initiates subscription flow
 */
export interface CheckoutSession {
  session_id: string;           // Unique checkout session ID
  checkout_url: string;         // LemonSqueezy checkout URL (redirect here)
  customer_id: string;          // Customer ID
  plan_id: string;              // Selected plan ID
  billing_period: BillingPeriod; // Selected billing period
  expires_at: string;           // Checkout session expiration
  metadata?: Record<string, string>; // Custom metadata
}

/**
 * Request to create checkout session
 */
export interface CreateCheckoutSessionRequest {
  plan_id: string;
  billing_period: BillingPeriod;
  success_url?: string;         // Redirect on success
  cancel_url?: string;          // Redirect on cancel
  metadata?: Record<string, string>;
}

/**
 * Response from checkout session creation
 */
export interface CreateCheckoutSessionResponse {
  session: CheckoutSession;
}
```

2. **Create PaymentMethod Interface**:
```typescript
/**
 * Payment method information
 * Subset of data available from LemonSqueezy
 */
export interface PaymentMethod {
  brand: string;                // "visa", "mastercard", "amex"
  last_four: string;            // Last 4 digits
  exp_month: number;            // Expiration month (1-12)
  exp_year: number;             // Expiration year (2025, 2026, etc.)
  is_default: boolean;          // Default payment method flag
}
```

3. **Update API Client** ([lib/api-client/subscriptions.ts](lib/api-client/subscriptions.ts)):
```typescript
// ADD new method:
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

// ADD customer portal method:
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

**Effort Estimate:** 1 hour

---

### Category 4: Webhooks & Events

**Current State:**
- ❌ No webhook event types defined
- ❌ No subscription event types

**Required Changes:**

1. **Create Webhook Event Types** (NEW in [types/subscription.ts](types/subscription.ts)):
```typescript
/**
 * LemonSqueezy webhook event types
 */
export type WebhookEventType =
  | "subscription_created"
  | "subscription_updated"
  | "subscription_cancelled"
  | "subscription_resumed"
  | "subscription_expired"
  | "subscription_paused"
  | "subscription_unpaused"
  | "subscription_payment_success"
  | "subscription_payment_failed"
  | "subscription_payment_recovered"
  | "order_created"
  | "license_key_created";

/**
 * Webhook event payload structure
 */
export interface WebhookEvent {
  event_type: WebhookEventType;
  event_id: string;
  timestamp: string;
  data: Record<string, unknown>;  // Event-specific data
}

/**
 * Subscription event for UI updates
 */
export interface SubscriptionEvent {
  type: WebhookEventType;
  subscription_id: string;
  timestamp: string;
  message: string;  // User-friendly message
  severity: "info" | "warning" | "error" | "success";
}
```

**Effort Estimate:** 30 minutes

---

### Category 5: License Management (Optional)

**Current State:**
- ❌ No license types (LemonSqueezy supports license keys)

**Required Changes (if using licenses):**

1. **Create License Types** (NEW in [types/subscription.ts](types/subscription.ts)):
```typescript
/**
 * LemonSqueezy license key status
 */
export enum LicenseStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  EXPIRED = "expired",
  DISABLED = "disabled",
}

/**
 * License key information
 */
export interface LicenseKey {
  key: string;                    // License key string
  status: LicenseStatus;          // Current status
  activation_limit: number;       // Max activations
  activation_count: number;       // Current activations
  expires_at: string | null;      // Expiration date
  created_at: string;             // Creation date
  instance_id: string | null;     // Activated instance ID
}

/**
 * License validation request
 */
export interface ValidateLicenseRequest {
  license_key: string;
  instance_id?: string;
}

/**
 * License validation response
 */
export interface ValidateLicenseResponse {
  valid: boolean;
  license: LicenseKey | null;
  error?: string;
}
```

2. **Update API Client**:
```typescript
// ADD license validation method:
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

// ADD license activation method:
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

// ADD license deactivation method:
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

**Effort Estimate:** 45 minutes (if licenses are used)

---

## Gap Analysis

### Critical Gaps (Must Fix)

1. **❌ Legacy Stripe Naming**
   - **Location:** [types/subscription.ts:60-61](types/subscription.ts#L60-L61), [types/subscription.ts:77-78](types/subscription.ts#L77-L78)
   - **Impact:** HIGH - Breaks LemonSqueezy integration
   - **Fix:** Rename `stripe_price_id_*` to `lemonsqueezy_variant_id_*` or `provider_price_id_*`
   - **Effort:** 15 minutes

2. **❌ Missing Provider Metadata in UserSubscription**
   - **Location:** [types/subscription.ts:85-99](types/subscription.ts#L85-L99)
   - **Impact:** HIGH - Cannot store LemonSqueezy order/subscription IDs
   - **Fix:** Add `provider_order_id`, `provider_subscription_id`, `provider_variant_id` fields
   - **Effort:** 30 minutes

3. **❌ Missing Checkout Session Types**
   - **Location:** [types/subscription.ts](types/subscription.ts) (new interfaces needed)
   - **Impact:** HIGH - Cannot implement checkout flow
   - **Fix:** Create `CheckoutSession`, `CreateCheckoutSessionRequest`, `CreateCheckoutSessionResponse` interfaces
   - **Effort:** 30 minutes

4. **❌ Missing Subscription Types Exports**
   - **Location:** [types/index.ts](types/index.ts)
   - **Impact:** HIGH - Types not accessible to components
   - **Fix:** Add subscription type exports to central index
   - **Effort:** 10 minutes

### High Priority Gaps

5. **❌ No Payment Method Types**
   - **Impact:** MEDIUM - Cannot display payment info to users
   - **Fix:** Create `PaymentMethod` interface
   - **Effort:** 15 minutes

6. **❌ No Customer Portal URL in UserSubscription**
   - **Impact:** MEDIUM - Cannot link to LemonSqueezy customer portal
   - **Fix:** Add `urls` object to `UserSubscription`
   - **Effort:** 15 minutes

7. **❌ No Webhook Event Types**
   - **Impact:** MEDIUM - Cannot handle LemonSqueezy webhooks properly
   - **Fix:** Create `WebhookEventType`, `WebhookEvent` types
   - **Effort:** 20 minutes

### Medium Priority Gaps

8. **❌ Incomplete API Client Methods**
   - **Impact:** MEDIUM - Missing checkout and portal methods
   - **Fix:** Add `createCheckoutSession()` and `getCustomerPortalUrl()` methods
   - **Effort:** 30 minutes

9. **❌ No Cancellation Metadata**
   - **Impact:** LOW - Cannot track deferred cancellations
   - **Fix:** Add `cancel_at_period_end` and `renews_at` to `UserSubscription`
   - **Effort:** 10 minutes

### Low Priority Gaps (Optional)

10. **❌ No License Key Types** (if using licenses)
    - **Impact:** LOW - Only needed if using LemonSqueezy licenses
    - **Fix:** Create `LicenseKey`, `LicenseStatus`, `ValidateLicenseRequest/Response` types
    - **Effort:** 45 minutes

---

## Required Changes

### Change Set 1: Fix Legacy Stripe Naming (CRITICAL)

**File:** [types/subscription.ts](types/subscription.ts)
**Lines:** 60-61, 77-78

**Before:**
```typescript
export interface SubscriptionPlanCreate {
  // ... other fields ...
  stripe_price_id_monthly?: string;
  stripe_price_id_yearly?: string;
}

export interface SubscriptionPlanUpdate {
  // ... other fields ...
  stripe_price_id_monthly?: string;
  stripe_price_id_yearly?: string;
}
```

**After:**
```typescript
export interface SubscriptionPlanCreate {
  // ... other fields ...
  lemonsqueezy_variant_id_monthly?: string;  // LemonSqueezy variant ID for monthly
  lemonsqueezy_variant_id_yearly?: string;   // LemonSqueezy variant ID for yearly
  lemonsqueezy_product_id?: string;          // LemonSqueezy product ID
  lemonsqueezy_store_id?: string;            // LemonSqueezy store ID
}

export interface SubscriptionPlanUpdate {
  // ... other fields ...
  lemonsqueezy_variant_id_monthly?: string;
  lemonsqueezy_variant_id_yearly?: string;
  lemonsqueezy_product_id?: string;
  lemonsqueezy_store_id?: string;
}
```

**Breaking Change:** YES - Frontend components using these interfaces must update field names.

---

### Change Set 2: Enhance UserSubscription Interface (CRITICAL)

**File:** [types/subscription.ts](types/subscription.ts)
**Lines:** 85-99

**Before:**
```typescript
export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  plan_name: string | null;
  plan_display_name: string | null;
  status: SubscriptionStatus;
  billing_period: BillingPeriod;
  start_date: string;
  end_date: string | null;
  trial_end_date: string | null;
  cancelled_at: string | null;
  current_api_calls: number;
  created_at: string;
}
```

**After:**
```typescript
export interface UserSubscription {
  // Existing fields
  id: string;
  user_id: string;
  plan_id: string;
  plan_name: string | null;
  plan_display_name: string | null;
  status: SubscriptionStatus;
  billing_period: BillingPeriod;
  start_date: string;
  end_date: string | null;
  trial_end_date: string | null;
  cancelled_at: string | null;
  current_api_calls: number;
  created_at: string;

  // NEW: Provider integration fields
  provider_order_id: string | null;
  provider_subscription_id: string | null;
  provider_variant_id: string | null;
  provider_customer_id: string | null;

  // NEW: Subscription management
  cancel_at_period_end: boolean;
  renews_at: string | null;
  paused_at: string | null;

  // NEW: Payment method info
  card_brand: string | null;
  card_last_four: string | null;

  // NEW: LemonSqueezy URLs
  urls: {
    customer_portal?: string;
    update_payment_method?: string;
    invoice_url?: string;
  } | null;

  // NEW: Metadata
  metadata: Record<string, unknown> | null;
}
```

**Breaking Change:** NO - All new fields are nullable, backward compatible.

---

### Change Set 3: Add Checkout Session Types (CRITICAL)

**File:** [types/subscription.ts](types/subscription.ts)
**Location:** Add after line 114 (after `SubscriptionCancelRequest`)

**New Code:**
```typescript
// ============================================================================
// CHECKOUT SESSION INTERFACES
// ============================================================================

/**
 * Checkout session for creating new subscriptions
 */
export interface CheckoutSession {
  /** Unique checkout session ID */
  session_id: string;
  /** LemonSqueezy checkout URL (redirect user here) */
  checkout_url: string;
  /** Customer ID */
  customer_id: string;
  /** Selected plan ID */
  plan_id: string;
  /** Selected billing period */
  billing_period: BillingPeriod;
  /** Checkout session expiration timestamp */
  expires_at: string;
  /** Custom metadata */
  metadata?: Record<string, string>;
}

/**
 * Request to create checkout session
 */
export interface CreateCheckoutSessionRequest {
  /** Plan to subscribe to */
  plan_id: string;
  /** Billing period (monthly/yearly) */
  billing_period: BillingPeriod;
  /** Success redirect URL */
  success_url?: string;
  /** Cancel redirect URL */
  cancel_url?: string;
  /** Custom metadata */
  metadata?: Record<string, string>;
}

/**
 * Response from checkout session creation
 */
export interface CreateCheckoutSessionResponse {
  /** Checkout session details */
  session: CheckoutSession;
}
```

**Breaking Change:** NO - New types, no impact on existing code.

---

### Change Set 4: Add Payment Method Types (HIGH PRIORITY)

**File:** [types/subscription.ts](types/subscription.ts)
**Location:** Add after checkout session types

**New Code:**
```typescript
// ============================================================================
// PAYMENT METHOD INTERFACES
// ============================================================================

/**
 * Payment method information
 */
export interface PaymentMethod {
  /** Card brand (visa, mastercard, amex, etc.) */
  brand: string;
  /** Last 4 digits of card */
  last_four: string;
  /** Expiration month (1-12) */
  exp_month: number;
  /** Expiration year */
  exp_year: number;
  /** Whether this is the default payment method */
  is_default: boolean;
}
```

**Breaking Change:** NO - New type, no impact on existing code.

---

### Change Set 5: Add Webhook Event Types (MEDIUM PRIORITY)

**File:** [types/subscription.ts](types/subscription.ts)
**Location:** Add after payment method types

**New Code:**
```typescript
// ============================================================================
// WEBHOOK EVENT INTERFACES
// ============================================================================

/**
 * LemonSqueezy webhook event types
 */
export type WebhookEventType =
  | "subscription_created"
  | "subscription_updated"
  | "subscription_cancelled"
  | "subscription_resumed"
  | "subscription_expired"
  | "subscription_paused"
  | "subscription_unpaused"
  | "subscription_payment_success"
  | "subscription_payment_failed"
  | "subscription_payment_recovered"
  | "order_created"
  | "license_key_created";

/**
 * Webhook event payload structure
 */
export interface WebhookEvent {
  /** Event type */
  event_type: WebhookEventType;
  /** Unique event ID */
  event_id: string;
  /** Event timestamp */
  timestamp: string;
  /** Event-specific data */
  data: Record<string, unknown>;
}

/**
 * Subscription event for UI updates
 */
export interface SubscriptionEvent {
  /** Event type */
  type: WebhookEventType;
  /** Subscription ID */
  subscription_id: string;
  /** Event timestamp */
  timestamp: string;
  /** User-friendly message */
  message: string;
  /** Event severity */
  severity: "info" | "warning" | "error" | "success";
}
```

**Breaking Change:** NO - New types, no impact on existing code.

---

### Change Set 6: Update API Client (HIGH PRIORITY)

**File:** [lib/api-client/subscriptions.ts](lib/api-client/subscriptions.ts)
**Location:** Add new methods to namespace

**Add Methods:**
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

**Breaking Change:** NO - Adds new methods, doesn't modify existing ones.

---

### Change Set 7: Update Type Exports (CRITICAL)

**File:** [types/index.ts](types/index.ts)
**Location:** Add new section after line 223

**Add Exports:**
```typescript
// ============================================================================
// SUBSCRIPTION TYPES
// ============================================================================
export type {
  BillingPeriod,
  CheckoutSession,
  CreateCheckoutSessionRequest,
  CreateCheckoutSessionResponse,
  PaymentMethod,
  SubscriptionCancelRequest,
  SubscriptionCreateRequest,
  SubscriptionEvent,
  SubscriptionHistoryEntry,
  SubscriptionHistoryResponse,
  SubscriptionListResponse,
  SubscriptionPlan,
  SubscriptionPlanCreate,
  SubscriptionPlanUpdate,
  SubscriptionStatus,
  SubscriptionUpgradeRequest,
  SubscriptionWithPlan,
  TrialStatus,
  UsageStats,
  UserSubscription,
  WebhookEvent,
  WebhookEventType,
} from "./subscription";

export {
  calculateTrialDaysRemaining,
  formatLimit,
  getUsageStatusColor,
  isSubscriptionActive,
  isUnlimited,
} from "./subscription";
```

**Breaking Change:** NO - Only adds exports, doesn't remove or rename existing ones.

---

### Change Set 8: Add License Types (OPTIONAL - if using licenses)

**File:** [types/subscription.ts](types/subscription.ts)
**Location:** Add after webhook types

**New Code:**
```typescript
// ============================================================================
// LICENSE KEY INTERFACES (Optional - for LemonSqueezy licenses)
// ============================================================================

/**
 * LemonSqueezy license key status
 */
export enum LicenseStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  EXPIRED = "expired",
  DISABLED = "disabled",
}

/**
 * License key information
 */
export interface LicenseKey {
  /** License key string */
  key: string;
  /** Current status */
  status: LicenseStatus;
  /** Maximum number of activations allowed */
  activation_limit: number;
  /** Current number of activations */
  activation_count: number;
  /** License expiration date */
  expires_at: string | null;
  /** License creation date */
  created_at: string;
  /** Activated instance ID (if activated) */
  instance_id: string | null;
}

/**
 * License validation request
 */
export interface ValidateLicenseRequest {
  /** License key to validate */
  license_key: string;
  /** Instance ID (for activation tracking) */
  instance_id?: string;
}

/**
 * License validation response
 */
export interface ValidateLicenseResponse {
  /** Whether the license is valid */
  valid: boolean;
  /** License details (if valid) */
  license: LicenseKey | null;
  /** Error message (if invalid) */
  error?: string;
}
```

**Breaking Change:** NO - New optional types.

---

## Migration Strategy

### Phase 1: Type System Updates (Week 1, 2-3 hours)

**Objective:** Update all type definitions without breaking existing code.

**Tasks:**
1. ✅ **Update SubscriptionPlanCreate/Update** (15 min)
   - Rename `stripe_price_id_*` → `lemonsqueezy_variant_id_*`
   - Add `lemonsqueezy_product_id` and `lemonsqueezy_store_id`
   - File: [types/subscription.ts:60-78](types/subscription.ts#L60-L78)

2. ✅ **Enhance UserSubscription Interface** (30 min)
   - Add all LemonSqueezy fields (provider IDs, URLs, payment info)
   - All new fields nullable for backward compatibility
   - File: [types/subscription.ts:85-99](types/subscription.ts#L85-L99)

3. ✅ **Add New Interfaces** (45 min)
   - CheckoutSession types
   - PaymentMethod type
   - WebhookEvent types
   - File: [types/subscription.ts](types/subscription.ts) (append)

4. ✅ **Update Type Exports** (10 min)
   - Add all subscription types to [types/index.ts](types/index.ts)
   - Ensure tree-shaking compatibility

5. ✅ **Run Type Checks** (5 min)
   ```bash
   npm run type-check
   ```

**Deliverable:** ✅ All types updated, no build errors

---

### Phase 2: API Client Updates (Week 1, 30 minutes)

**Objective:** Add new API client methods for LemonSqueezy checkout flow.

**Tasks:**
1. ✅ **Add createCheckoutSession Method** (15 min)
   - File: [lib/api-client/subscriptions.ts](lib/api-client/subscriptions.ts)
   - Returns `CreateCheckoutSessionResponse`

2. ✅ **Add getCustomerPortalUrl Method** (10 min)
   - File: [lib/api-client/subscriptions.ts](lib/api-client/subscriptions.ts)
   - Returns `{ url: string }`

3. ✅ **Test API Methods** (5 min)
   - Verify types are correctly inferred
   - Check autocomplete works

**Deliverable:** ✅ API client ready for LemonSqueezy integration

---

### Phase 3: Component Updates (Week 2, varies by component)

**Objective:** Update components to use new types (handled in Task 0.2.3).

**Tasks:**
1. Update subscription display components to show new fields
2. Update checkout flow to use new checkout session types
3. Add customer portal link components
4. Add payment method display components

**Note:** This will be covered in **Task 0.2.3: Audit existing subscription UI components**.

---

### Phase 4: Testing & Validation (Week 2, 1 hour)

**Objective:** Ensure all type changes work correctly.

**Tasks:**
1. ✅ **Unit Tests for Helper Functions** (20 min)
   - Test `calculateTrialDaysRemaining()`
   - Test `isSubscriptionActive()`
   - Test `getUsageStatusColor()`

2. ✅ **Integration Tests for API Client** (20 min)
   - Mock API responses with new types
   - Verify type inference works

3. ✅ **Type Coverage Report** (10 min)
   ```bash
   npm run type-coverage
   ```

4. ✅ **Manual Testing** (10 min)
   - Verify IDE autocomplete works
   - Check type errors are caught

**Deliverable:** ✅ All tests passing, type coverage > 95%

---

## Testing Recommendations

### Unit Tests

**File:** `tests/types/subscription.test.ts` (create new)

```typescript
import { describe, expect, it } from "vitest";
import {
  calculateTrialDaysRemaining,
  formatLimit,
  getUsageStatusColor,
  isSubscriptionActive,
  isUnlimited,
  SubscriptionStatus,
  type UserSubscription,
} from "@/types/subscription";

describe("Subscription Helper Functions", () => {
  describe("isUnlimited", () => {
    it("should return true for -1", () => {
      expect(isUnlimited(-1)).toBe(true);
    });

    it("should return false for positive numbers", () => {
      expect(isUnlimited(100)).toBe(false);
      expect(isUnlimited(0)).toBe(false);
    });
  });

  describe("formatLimit", () => {
    it("should return 'Unlimited' for -1", () => {
      expect(formatLimit(-1)).toBe("Unlimited");
    });

    it("should format numbers with locale string", () => {
      expect(formatLimit(1000)).toBe("1,000");
      expect(formatLimit(100)).toBe("100");
    });
  });

  describe("calculateTrialDaysRemaining", () => {
    it("should return null for null input", () => {
      expect(calculateTrialDaysRemaining(null)).toBeNull();
    });

    it("should return 0 for past dates", () => {
      const pastDate = new Date("2020-01-01").toISOString();
      expect(calculateTrialDaysRemaining(pastDate)).toBe(0);
    });

    it("should calculate correct days for future dates", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      const result = calculateTrialDaysRemaining(futureDate.toISOString());
      expect(result).toBeGreaterThanOrEqual(4);
      expect(result).toBeLessThanOrEqual(6);
    });
  });

  describe("isSubscriptionActive", () => {
    it("should return true for ACTIVE status", () => {
      const subscription: UserSubscription = {
        id: "1",
        user_id: "user1",
        plan_id: "pro",
        plan_name: "Pro",
        plan_display_name: "Professional",
        status: SubscriptionStatus.ACTIVE,
        billing_period: "monthly",
        start_date: "2025-01-01",
        end_date: null,
        trial_end_date: null,
        cancelled_at: null,
        current_api_calls: 0,
        created_at: "2025-01-01",
      };
      expect(isSubscriptionActive(subscription)).toBe(true);
    });

    it("should return true for TRIAL status", () => {
      const subscription: UserSubscription = {
        id: "1",
        user_id: "user1",
        plan_id: "pro",
        plan_name: "Pro",
        plan_display_name: "Professional",
        status: SubscriptionStatus.TRIAL,
        billing_period: "monthly",
        start_date: "2025-01-01",
        end_date: null,
        trial_end_date: "2025-02-01",
        cancelled_at: null,
        current_api_calls: 0,
        created_at: "2025-01-01",
      };
      expect(isSubscriptionActive(subscription)).toBe(true);
    });

    it("should return false for CANCELLED status", () => {
      const subscription: UserSubscription = {
        id: "1",
        user_id: "user1",
        plan_id: "pro",
        plan_name: "Pro",
        plan_display_name: "Professional",
        status: SubscriptionStatus.CANCELLED,
        billing_period: "monthly",
        start_date: "2025-01-01",
        end_date: null,
        trial_end_date: null,
        cancelled_at: "2025-01-15",
        current_api_calls: 0,
        created_at: "2025-01-01",
      };
      expect(isSubscriptionActive(subscription)).toBe(false);
    });
  });

  describe("getUsageStatusColor", () => {
    it("should return 'destructive' for >= 90%", () => {
      expect(getUsageStatusColor(90)).toBe("destructive");
      expect(getUsageStatusColor(95)).toBe("destructive");
      expect(getUsageStatusColor(100)).toBe("destructive");
    });

    it("should return 'warning' for >= 75% and < 90%", () => {
      expect(getUsageStatusColor(75)).toBe("warning");
      expect(getUsageStatusColor(80)).toBe("warning");
      expect(getUsageStatusColor(89)).toBe("warning");
    });

    it("should return 'success' for < 75%", () => {
      expect(getUsageStatusColor(0)).toBe("success");
      expect(getUsageStatusColor(50)).toBe("success");
      expect(getUsageStatusColor(74)).toBe("success");
    });
  });
});
```

### Type Tests

**File:** `tests/types/subscription-types.test-d.ts` (create new)

```typescript
import { describe, expectTypeOf, it } from "vitest";
import type {
  BillingPeriod,
  CheckoutSession,
  CreateCheckoutSessionRequest,
  PaymentMethod,
  SubscriptionPlan,
  SubscriptionStatus,
  UserSubscription,
} from "@/types/subscription";

describe("Subscription Type Definitions", () => {
  it("should have correct UserSubscription type", () => {
    expectTypeOf<UserSubscription>().toHaveProperty("id").toBeString();
    expectTypeOf<UserSubscription>().toHaveProperty("status").toMatchTypeOf<SubscriptionStatus>();
    expectTypeOf<UserSubscription>().toHaveProperty("billing_period").toMatchTypeOf<BillingPeriod>();

    // NEW: LemonSqueezy fields
    expectTypeOf<UserSubscription>().toHaveProperty("provider_order_id").toEqualTypeOf<string | null>();
    expectTypeOf<UserSubscription>().toHaveProperty("card_brand").toEqualTypeOf<string | null>();
    expectTypeOf<UserSubscription>().toHaveProperty("urls").toEqualTypeOf<{
      customer_portal?: string;
      update_payment_method?: string;
      invoice_url?: string;
    } | null>();
  });

  it("should have correct SubscriptionPlan type", () => {
    expectTypeOf<SubscriptionPlan>().toHaveProperty("id").toBeString();
    expectTypeOf<SubscriptionPlan>().toHaveProperty("name").toBeString();
    expectTypeOf<SubscriptionPlan>().toHaveProperty("price_monthly").toBeNumber();

    // NEW: LemonSqueezy fields
    expectTypeOf<SubscriptionPlan>().toHaveProperty("lemonsqueezy_product_id");
    expectTypeOf<SubscriptionPlan>().toHaveProperty("lemonsqueezy_variant_id_monthly");
  });

  it("should have correct CheckoutSession type", () => {
    expectTypeOf<CheckoutSession>().toHaveProperty("session_id").toBeString();
    expectTypeOf<CheckoutSession>().toHaveProperty("checkout_url").toBeString();
    expectTypeOf<CheckoutSession>().toHaveProperty("billing_period").toMatchTypeOf<BillingPeriod>();
  });

  it("should have correct PaymentMethod type", () => {
    expectTypeOf<PaymentMethod>().toHaveProperty("brand").toBeString();
    expectTypeOf<PaymentMethod>().toHaveProperty("last_four").toBeString();
    expectTypeOf<PaymentMethod>().toHaveProperty("exp_month").toBeNumber();
  });
});
```

---

## Summary

### Files Requiring Changes

| File | Lines | Priority | Effort | Changes |
|------|-------|----------|--------|---------|
| [types/subscription.ts](types/subscription.ts) | 232 | CRITICAL | 2h | Rename Stripe fields, add LemonSqueezy types |
| [lib/api-client/subscriptions.ts](lib/api-client/subscriptions.ts) | 139 | HIGH | 30m | Add checkout and portal methods |
| [types/index.ts](types/index.ts) | 277 | CRITICAL | 10m | Export subscription types |
| **TOTAL** | **648** | - | **2.5-3h** | **3 files** |

### New Types Required

1. ✅ `CheckoutSession` - Checkout session data
2. ✅ `CreateCheckoutSessionRequest` - Checkout creation request
3. ✅ `CreateCheckoutSessionResponse` - Checkout creation response
4. ✅ `PaymentMethod` - Payment method information
5. ✅ `WebhookEventType` - LemonSqueezy event types
6. ✅ `WebhookEvent` - Webhook event payload
7. ✅ `SubscriptionEvent` - UI subscription events
8. ⚠️ `LicenseKey` (optional) - License information
9. ⚠️ `ValidateLicenseRequest` (optional) - License validation
10. ⚠️ `ValidateLicenseResponse` (optional) - License validation result

### Breaking Changes

**Field Renaming (Breaking):**
- `stripe_price_id_monthly` → `lemonsqueezy_variant_id_monthly`
- `stripe_price_id_yearly` → `lemonsqueezy_variant_id_yearly`

**Impact:**
- ❌ Any component using `SubscriptionPlanCreate` or `SubscriptionPlanUpdate` must update field references
- ❌ Backend API must match new field names
- ✅ All new fields in `UserSubscription` are nullable (backward compatible)

**Migration Path:**
1. Update backend first to support both old and new field names
2. Update frontend types and components
3. Remove old field name support from backend

### Non-Breaking Additions

**All new interfaces and fields are additions:**
- ✅ `CheckoutSession` types (new)
- ✅ `PaymentMethod` type (new)
- ✅ `WebhookEvent` types (new)
- ✅ New fields in `UserSubscription` (all nullable)
- ✅ New API client methods (additions, not modifications)

---

## Next Steps

### Immediate Actions (This Task)

1. ✅ **Update [types/subscription.ts](types/subscription.ts)** (2 hours)
   - Fix Stripe naming
   - Add LemonSqueezy fields
   - Add new interfaces

2. ✅ **Update [lib/api-client/subscriptions.ts](lib/api-client/subscriptions.ts)** (30 minutes)
   - Add checkout session method
   - Add customer portal method

3. ✅ **Update [types/index.ts](types/index.ts)** (10 minutes)
   - Export all subscription types

4. ✅ **Run Type Checks** (5 minutes)
   ```bash
   npm run type-check
   ```

### Follow-up Tasks (Next Tasks)

1. **Task 0.2.2:** Audit API client implementation
   - Review full API client architecture
   - Identify all subscription-related API calls
   - Plan error handling improvements

2. **Task 0.2.3:** Audit existing subscription UI components
   - Identify components using subscription types
   - Plan component updates for new fields
   - Design customer portal integration

3. **Task 0.2.4:** Audit routing and pages
   - Review subscription-related pages
   - Plan checkout flow pages
   - Plan billing settings page updates

---

## Conclusion

The frontend subscription type system has a **strong foundation** with well-structured interfaces and comprehensive coverage of subscription features. However, **legacy Stripe naming** must be removed, and **LemonSqueezy-specific fields** must be added to support the new payment provider.

The changes are **largely non-breaking** due to the use of nullable fields for all new additions. The only breaking changes are the **field name updates** for Stripe → LemonSqueezy, which can be handled with a coordinated backend-frontend deployment.

**Total Effort:** 2.5-3 hours
**Risk Level:** LOW (backward compatible except naming changes)
**Recommendation:** Proceed with changes as outlined in this audit.

---

**Task Status:** ✅ COMPLETE
**Audit Completed:** 2025-10-17
**Next Task:** 0.2.2 - Audit API client implementation
