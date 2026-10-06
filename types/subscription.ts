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
  PAST_DUE = "past_due",
  PAUSED = "paused",
}

export enum BillingPeriod {
  MONTHLY = "monthly",
  YEARLY = "yearly",
  LIFETIME = "lifetime",
}

export const INVOICE_STATUSES = [
  "pending",
  "paid",
  "void",
  "refunded",
  "partial_refund",
  "partial_refunded",
  "unknown",
] as const;

export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export interface Invoice {
  invoice_id: string;
  invoice_number: string | null;
  subscription_id?: string | null;
  status: InvoiceStatus;
  amount: number;
  currency: string;
  tax: number | null;
  subtotal: number | null;
  invoice_url: string | null;
  invoice_date: string;
  due_date: string | null;
  paid_at: string | null;
  customer_email: string | null;
  customer_name: string | null;
  items: InvoiceItem[];
}

// ============================================================================
// SUBSCRIPTION PLAN INTERFACES
// ============================================================================

export interface PlanFeatures {
  items: string[];
}

export interface SubscriptionPlan extends Record<string, unknown> {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  features: PlanFeatures;
  max_workspaces: number;
  max_members_per_workspace: number;
  max_topics: number;
  max_knowledge_items: number;
  max_api_calls_per_month: number;
  credits_per_month: number | null;
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
  is_active?: boolean;
  is_public?: boolean;
  lemonsqueezy_product_id?: string;
  lemonsqueezy_variant_id_monthly?: string;
  lemonsqueezy_variant_id_yearly?: string;
}

export interface SubscriptionPlanUpdate {
  display_name?: string;
  description?: string;
  price_monthly?: number;
  price_yearly?: number;
  features?: Record<string, unknown>;
  max_workspaces?: number;
  max_members_per_workspace?: number;
  is_active?: boolean;
  is_public?: boolean;
  lemonsqueezy_product_id?: string;
  lemonsqueezy_variant_id_monthly?: string;
  lemonsqueezy_variant_id_yearly?: string;
}

// ============================================================================
// USER SUBSCRIPTION INTERFACES
// ============================================================================
export interface UserSubscriptionDetail {
  id: string;
  user_id: string;
  plan_id: string;
  plan_name: string | null;
  plan_display_name: string | null;
  status: SubscriptionStatus;
  billing_period: BillingPeriod;
  start_date: string | null;
  end_date: string | null;
  trial_end_date: string | null;
  cancelled_at: string | null;
  current_api_calls: number;
  current_credits: number;
  credits_reset_date: string | null;
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
  card_brand?: string | null;
  card_last_four?: string | null;
  card_last4?: string | null;
}

/**
 * The card LemonSqueezy has on file, reported alongside the subscription.
 *
 * Separate from `subscription` because it outlives it: a refund cancels the
 * subscription and revokes access, but the saved card stays visible as
 * billing history.
 */
export interface BillingAccount {
  lemonsqueezy_subscription_id: string | null;
  card_brand?: string | null;
  card_last_four?: string | null;
}

export interface UserSubscription {
  subscription?: UserSubscriptionDetail;
  billing_account?: BillingAccount | null;
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

  workspaces: {
    used: number;
    limit: number;
    percentage: number;
  };

  knowledge_items: {
    used: number;
    limit: number;
    percentage: number;
  };

  api_calls: {
    used: number;
    limit: number;
    percentage: number;
  };

  members: {
    used: number;
    limit: number;
    percentage: number;
  };

  // Current usage
  current_workspaces: number;
  current_topics: number;
  current_knowledge_items: number;
  current_api_calls: number;
  current_members?: number;

  // Limits
  max_workspaces: number;
  max_topics: number;
  max_knowledge_items: number;
  max_api_calls_per_month: number;
  max_members?: number;

  // Usage percentages
  workspaces_usage_percent: number;
  topics_usage_percent: number;
  knowledge_items_usage_percent: number;
  api_calls_usage_percent: number;
  members_usage_percent?: number;

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
// CREDITS
// ============================================================================

export interface CreditBalance {
  current_credits: number;
  credits_per_month: number | null;
  credits_reset_date: string | null;
  articles_remaining: number | null;
  plan_name: string | null;
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
  affiliate_code?: string;
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
 * Response from upgrade/downgrade subscription endpoints
 */
export interface PlanChangeResponse {
  action: "checkout_required" | "upgraded" | "downgraded";
  checkout_url?: string;
  plan_display_name?: string;
  message?: string;
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
    subscription?.subscription?.status === SubscriptionStatus.ACTIVE ||
    subscription?.subscription?.status === SubscriptionStatus.TRIAL
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

/**
 * A purchase from our own orders table.
 *
 * `can_request_refund` is computed server-side from the same rules the
 * request endpoint enforces, so the UI never has to re-derive eligibility
 * and drift from it.
 */
export interface OrderRow {
  id: string;
  lemonsqueezy_order_id: string;
  product_name: string | null;
  status: string;
  /** Cents, as LemonSqueezy reports them. */
  total: number;
  subtotal: number | null;
  tax: number | null;
  currency: string;
  receipt_url: string | null;
  /** The purchaser's email, filled in by the API from the authenticated user. */
  customer_email: string | null;
  subscription_id: string | null;
  ordered_at: string | null;
  refunded_at: string | null;
  created_at: string;
  refund_request_status:
    | "pending"
    | "approved"
    | "rejected"
    | "processing"
    | "completed"
    | "failed"
    | null;
  refund_requested_at: string | null;
  refund_admin_note: string | null;
  can_request_refund: boolean;
  /** Why a refund can't be requested, written for the customer, or null. */
  refund_ineligible_reason: string | null;
  /** Cents refunded against this order so far. */
  refunded_amount: number;
  /** Cents still refundable. Computed server-side; never re-derive it here. */
  refundable_amount: number;
}
