/**
 * Subscription types for frontend
 * Maps to backend subscription_schema.py
 */

// ============================================================================
// ENUMS
// ============================================================================

export enum SubscriptionStatus {
  ACTIVE = "active",
  CANCELLED = "cancelled",
  EXPIRED = "expired",
  TRIAL = "trial",
  SUSPENDED = "suspended",
}

export enum BillingPeriod {
  MONTHLY = "monthly",
  YEARLY = "yearly",
  LIFETIME = "lifetime",
}

// ============================================================================
// SUBSCRIPTION PLAN INTERFACES
// ============================================================================

export interface SubscriptionPlan extends Record<string, unknown> {
  id: string;
  name: string; // Unique identifier (e.g., "pro", "enterprise")
  display_name: string; // Human-readable name
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  features: Record<string, unknown>; // Flexible JSON features
  max_workspaces: number; // -1 = unlimited
  max_members_per_workspace: number; // -1 = unlimited
  max_topics: number; // -1 = unlimited
  max_knowledge_items: number; // -1 = unlimited
  max_api_calls_per_month: number; // -1 = unlimited
  is_active: boolean;
  is_public: boolean;
  created_at: string;
}

export interface SubscriptionPlanCreate {
  name: string;
  display_name: string;
  description?: string;
  price_monthly: number;
  price_yearly: number;
  features?: Record<string, unknown>;
  max_workspaces?: number;
  max_members_per_workspace?: number;
  max_topics?: number;
  max_knowledge_items?: number;
  max_api_calls_per_month?: number;
  is_active?: boolean;
  is_public?: boolean;
  stripe_price_id_monthly?: string;
  stripe_price_id_yearly?: string;
}

export interface SubscriptionPlanUpdate {
  display_name?: string;
  description?: string;
  price_monthly?: number;
  price_yearly?: number;
  features?: Record<string, unknown>;
  max_workspaces?: number;
  max_members_per_workspace?: number;
  max_topics?: number;
  max_knowledge_items?: number;
  max_api_calls_per_month?: number;
  is_active?: boolean;
  is_public?: boolean;
  stripe_price_id_monthly?: string;
  stripe_price_id_yearly?: string;
}

// ============================================================================
// USER SUBSCRIPTION INTERFACES
// ============================================================================

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
  // LemonSqueezy integration fields
  lemonsqueezy_subscription_id: string | null;
  lemonsqueezy_customer_id: string | null;
  renews_at?: string | null;
  ends_at?: string | null;
  current_period_end?: string | null; // Alias for renews_at
  // Plan details (included in API response)
  plan_features?: Record<string, unknown>;
  plan_limits?: {
    max_workspaces: number;
    max_members_per_workspace: number;
    max_topics: number;
    max_knowledge_items: number;
    max_api_calls_per_month: number;
  };
  customer_portal_url?: string | null;
}

export interface SubscriptionCreateRequest {
  plan_id: string;
  billing_period?: BillingPeriod;
}

export interface SubscriptionUpgradeRequest {
  new_plan_id: string;
  billing_period?: BillingPeriod;
}

export interface SubscriptionCancelRequest {
  reason?: string;
  cancel_immediately?: boolean;
}

// ============================================================================
// USAGE TRACKING INTERFACES
// ============================================================================

export interface UsageStats {
  subscription_id: string;
  plan_name: string;
  billing_period: BillingPeriod;

  // Current usage
  current_workspaces: number;
  current_topics: number;
  current_knowledge_items: number;
  current_api_calls: number;

  // Limits
  max_workspaces: number;
  max_topics: number;
  max_knowledge_items: number;
  max_api_calls_per_month: number;

  // Usage percentages
  workspaces_usage_percent: number;
  topics_usage_percent: number;
  knowledge_items_usage_percent: number;
  api_calls_usage_percent: number;

  // Reset date
  usage_reset_date: string;
}

export interface TrialStatus {
  is_in_trial: boolean;
  trial_end_date: string | null;
  days_remaining: number | null;
  trial_expired: boolean;
}

// ============================================================================
// SUBSCRIPTION HISTORY
// ============================================================================

export interface SubscriptionHistoryEntry {
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
  created_at: string;
}

export interface SubscriptionHistoryResponse {
  subscriptions: SubscriptionHistoryEntry[];
  total: number;
  limit: number;
  offset: number;
}

// ============================================================================
// LEMONSQUEEZY CHECKOUT & BILLING
// ============================================================================

/**
 * Request payload for creating a checkout session
 */
export interface CheckoutSessionRequest {
  plan_id: string;
  billing_period: BillingPeriod;
  success_url: string;
  cancel_url: string;
}

/**
 * Response from creating a checkout session
 */
export interface CheckoutSessionResponse {
  checkout_url: string;
  session_id: string;
}

/**
 * Response for customer portal URL
 */
export interface CustomerPortalResponse {
  portal_url: string;
}

/**
 * Invoice line item
 */
export interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

/**
 * Invoice details
 */
export interface Invoice {
  invoice_id: string;
  invoice_number: string | null;
  status: string; // paid, unpaid, refunded, etc.
  amount: number;
  currency: string;
  tax: number | null;
  subtotal: number | null;
  invoice_url: string | null;
  invoice_date: string; // ISO format
  due_date: string | null; // ISO format
  paid_at: string | null; // ISO format
  customer_email: string | null;
  customer_name: string | null;
  items: InvoiceItem[];
}

/**
 * Response for invoice list
 */
export interface InvoiceListResponse {
  invoices: Invoice[];
  count: number;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

export interface SubscriptionListResponse {
  plans: SubscriptionPlan[];
}

export interface SubscriptionWithPlan extends UserSubscription {
  plan: SubscriptionPlan | null;
}

// Helper function to check if value is unlimited
export function isUnlimited(value: number): boolean {
  return value === -1;
}

// Helper function to format limit display
export function formatLimit(value: number): string {
  return isUnlimited(value) ? "Unlimited" : value.toLocaleString();
}

// Helper function to calculate days until trial ends
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

// Helper function to check if subscription is active
export function isSubscriptionActive(subscription: UserSubscription): boolean {
  return (
    subscription.status === SubscriptionStatus.ACTIVE ||
    subscription.status === SubscriptionStatus.TRIAL
  );
}

// Helper function to get usage status color
export function getUsageStatusColor(
  usagePercent: number,
): "success" | "warning" | "destructive" {
  if (usagePercent >= 90) return "destructive";
  if (usagePercent >= 75) return "warning";
  return "success";
}
