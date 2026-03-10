/**
 * Subscription Zod Schemas
 *
 * Runtime validation schemas for subscription API responses.
 * These schemas ensure type safety at runtime and provide automatic
 * validation for data coming from the backend API.
 *
 * @module schemas/subscription-schemas
 */

import { z } from "zod";
import { BillingPeriod, SubscriptionStatus } from "@/types/subscription";

const InvoiceStatusSchema = z
  .enum(["pending", "paid", "void", "refunded", "partial_refunded", "unknown"])
  .catch("unknown");
const FeatureItemsSchema = z.array(z.string().trim().min(1));

export const SubscriptionStatusSchema = z.enum(SubscriptionStatus);
export const BillingPeriodSchema = z.enum(BillingPeriod);
// ============================================================================
// ENUMS
// ============================================================================

// ============================================================================
// CHECKOUT SCHEMAS
// ============================================================================

/**
 * Schema for checkout session request
 */
export const CheckoutSessionRequestSchema = z.object({
  plan_id: z.string().uuid("Invalid plan ID format"),
  billing_period: BillingPeriodSchema,
  success_url: z.string().url("Invalid success URL"),
  cancel_url: z.string().url("Invalid cancel URL"),
});

/**
 * Schema for checkout session response
 */
export const CheckoutSessionResponseSchema = z.object({
  checkout_url: z.string().url("Invalid checkout URL"),
  session_id: z.string().min(1, "Session ID is required"),
});

// ============================================================================
// CUSTOMER PORTAL SCHEMAS
// ============================================================================

/**
 * Schema for customer portal response
 */
export const CustomerPortalResponseSchema = z.object({
  portal_url: z.string().url("Invalid portal URL"),
});

// ============================================================================
// SUBSCRIPTION SCHEMAS
// ============================================================================

/**
 * Schema for user subscription response
 */
export const UserSubscriptionSchema = z.object({
  id: z.string().uuid("Invalid subscription ID"),
  user_id: z.string().uuid("Invalid user ID"),
  plan_id: z.string().uuid("Invalid plan ID"),
  plan_name: z.string().nullable(),
  plan_display_name: z.string().nullable(),
  status: SubscriptionStatusSchema,
  billing_period: BillingPeriodSchema,
  start_date: z.string(), // ISO date string
  end_date: z.string().nullable(),
  trial_end_date: z.string().nullable(),
  cancelled_at: z.string().nullable(),
  current_api_calls: z.number().int().nonnegative(),
  created_at: z.string(), // ISO date string
  // LemonSqueezy fields
  lemonsqueezy_subscription_id: z.string().nullable(),
  lemonsqueezy_customer_id: z.string().nullable(),
  renews_at: z.string().nullable(),
  ends_at: z.string().nullable(),
  current_period_end: z.string().nullable(), // Alias for renews_at
  // Plan details (included in API response)
  plan_features: z.record(z.string(), z.unknown()).optional(),
  plan_limits: z
    .object({
      max_workspaces: z.number().int(),
      max_members_per_workspace: z.number().int(),
      max_topics: z.number().int(),
      max_knowledge_items: z.number().int(),
      max_api_calls_per_month: z.number().int(),
    })
    .optional(),
  customer_portal_url: z.string().nullable().optional(),
});

/**
 * Schema for subscription plan
 */

export const PlanFeaturesSchema = z
  .union([
    z.object({ items: FeatureItemsSchema }),
    z.object({ list: FeatureItemsSchema }),
    z.record(z.string(), z.string()),
  ])
  .transform((raw): { items: string[] } => {
    if ("items" in raw) return { items: raw.items as string[] };
    if ("list" in raw) return { items: (raw as { list: string[] }).list };
    return { items: Object.values(raw as Record<string, string>) };
  });

export const SubscriptionPlanSchema = z.object({
  id: z.string().uuid("Invalid plan ID"),
  name: z.string().min(1, "Plan name is required"),
  display_name: z.string().min(1, "Display name is required"),
  description: z.string().nullable(),
  price_monthly: z.number().nonnegative(),
  price_yearly: z.number().nonnegative(),
  features: PlanFeaturesSchema,
  max_workspaces: z.number().int(),
  max_members_per_workspace: z.number().int(),
  max_topics: z.number().int(),
  max_knowledge_items: z.number().int(),
  max_api_calls_per_month: z.number().int(),
  is_active: z.boolean(),
  is_public: z.boolean(),
  created_at: z.string(),
});
/**
 * Schema for subscription list response
 */
export const SubscriptionListResponseSchema = z.object({
  plans: z.array(SubscriptionPlanSchema),
});

// ============================================================================
// USAGE SCHEMAS
// ============================================================================

/**
 * Schema for usage statistics
 */
export const UsageStatsSchema = z.object({
  subscription_id: z.string().uuid("Invalid subscription ID"),
  plan_name: z.string(),
  billing_period: BillingPeriodSchema,
  // Current usage
  current_workspaces: z.number().int().nonnegative(),
  current_topics: z.number().int().nonnegative(),
  current_knowledge_items: z.number().int().nonnegative(),
  current_api_calls: z.number().int().nonnegative(),
  // Limits
  max_workspaces: z.number().int(),
  max_topics: z.number().int(),
  max_knowledge_items: z.number().int(),
  max_api_calls_per_month: z.number().int(),
  // Usage percentages
  workspaces_usage_percent: z.number().min(0).max(100),
  topics_usage_percent: z.number().min(0).max(100),
  knowledge_items_usage_percent: z.number().min(0).max(100),
  api_calls_usage_percent: z.number().min(0).max(100),
  // Reset date
  usage_reset_date: z.string(),
});

/**
 * Schema for trial status
 */
export const TrialStatusSchema = z.object({
  is_in_trial: z.boolean(),
  trial_end_date: z.string().nullable(),
  days_remaining: z.number().int().nullable(),
  trial_expired: z.boolean(),
});

// ============================================================================
// INVOICE SCHEMAS
// ============================================================================

/**
 * Schema for invoice item
 */
export const InvoiceItemSchema = z.object({
  description: z.string(),
  quantity: z.number().int().positive(),
  unit_price: z.number().nonnegative(),
  total: z.number().nonnegative(),
});

/**
 * Schema for invoice
 */
export const InvoiceSchema = z.object({
  invoice_id: z.string().min(1, "Invoice ID is required"),
  invoice_number: z.string().nullable(),
  status: InvoiceStatusSchema,
  amount: z.number().nonnegative(),
  currency: z.string().default("USD"),
  tax: z.number().nullable(),
  subtotal: z.number().nullable(),
  invoice_url: z.string().url().nullable(),
  invoice_date: z.string(),
  due_date: z.string().nullable(),
  paid_at: z.string().nullable(),
  customer_email: z.string().email().nullable(),
  customer_name: z.string().nullable(),
  items: z.array(InvoiceItemSchema).default([]),
});

/**
 * Schema for invoice list response
 */
export const InvoiceListResponseSchema = z.object({
  invoices: z.array(InvoiceSchema),
  count: z.number().int().nonnegative(),
});

// ============================================================================
// SUBSCRIPTION HISTORY SCHEMAS
// ============================================================================

/**
 * Schema for subscription history entry
 */
export const SubscriptionHistoryEntrySchema = z.object({
  id: z.string().uuid("Invalid subscription ID"),
  user_id: z.string().uuid("Invalid user ID"),
  plan_id: z.string().uuid("Invalid plan ID"),
  plan_name: z.string().nullable(),
  plan_display_name: z.string().nullable(),
  status: SubscriptionStatusSchema,
  billing_period: BillingPeriodSchema,
  start_date: z.string(),
  end_date: z.string().nullable(),
  trial_end_date: z.string().nullable(),
  cancelled_at: z.string().nullable(),
  created_at: z.string(),
});

/**
 * Schema for subscription history response
 */
export const SubscriptionHistoryResponseSchema = z.object({
  subscriptions: z.array(SubscriptionHistoryEntrySchema),
  total: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  offset: z.number().int().nonnegative(),
});

// ============================================================================
// REQUEST SCHEMAS
// ============================================================================

/**
 * Schema for subscription create request
 */
export const SubscriptionCreateRequestSchema = z.object({
  plan_id: z.string().uuid("Invalid plan ID"),
  billing_period: BillingPeriodSchema.optional(),
});

/**
 * Schema for subscription upgrade request
 */
export const SubscriptionUpgradeRequestSchema = z.object({
  new_plan_id: z.string().uuid("Invalid plan ID"),
  billing_period: BillingPeriodSchema.optional(),
});

/**
 * Schema for subscription cancel request
 */
export const SubscriptionCancelRequestSchema = z.object({
  reason: z.string().max(500).optional(),
  cancel_immediately: z.boolean().optional(),
});

export const SubscriptionPlanCreateSchema = z.object({
  name: z.string().min(1),
  display_name: z.string().min(1),
  description: z.string().optional(),
  price_monthly: z.number().nonnegative(),
  price_yearly: z.number().nonnegative(),
  features: z.record(z.string(), z.unknown()).optional(),
  max_workspaces: z.number().int().optional(),
  max_members_per_workspace: z.number().int().optional(),
  max_topics: z.number().int().optional(),
  max_knowledge_items: z.number().int().optional(),
  max_api_calls_per_month: z.number().int().optional(),
  is_active: z.boolean().optional(),
  is_public: z.boolean().optional(),
  lemonsqueezy_product_id: z.string().max(255).optional(),
  lemonsqueezy_variant_id_monthly: z.string().max(255).optional(),
  lemonsqueezy_variant_id_yearly: z.string().max(255).optional(),
});

export const SubscriptionPlanUpdateSchema =
  SubscriptionPlanCreateSchema.partial().omit({
    name: true,
  });

// ============================================================================
// TYPE EXPORTS (inferred from schemas)
// ============================================================================

export type CheckoutSessionRequest = z.infer<
  typeof CheckoutSessionRequestSchema
>;
export type CheckoutSessionResponse = z.infer<
  typeof CheckoutSessionResponseSchema
>;
export type CustomerPortalResponse = z.infer<
  typeof CustomerPortalResponseSchema
>;
export type UserSubscription = z.infer<typeof UserSubscriptionSchema>;
export type SubscriptionPlan = z.infer<typeof SubscriptionPlanSchema>;
export type SubscriptionListResponse = z.infer<
  typeof SubscriptionListResponseSchema
>;
export type UsageStats = z.infer<typeof UsageStatsSchema>;
export type TrialStatus = z.infer<typeof TrialStatusSchema>;
export type InvoiceItem = z.infer<typeof InvoiceItemSchema>;
export type Invoice = z.infer<typeof InvoiceSchema>;
export type InvoiceListResponse = z.infer<typeof InvoiceListResponseSchema>;
export type SubscriptionHistoryEntry = z.infer<
  typeof SubscriptionHistoryEntrySchema
>;
export type SubscriptionHistoryResponse = z.infer<
  typeof SubscriptionHistoryResponseSchema
>;
export type SubscriptionCreateRequest = z.infer<
  typeof SubscriptionCreateRequestSchema
>;
export type SubscriptionUpgradeRequest = z.infer<
  typeof SubscriptionUpgradeRequestSchema
>;
export type SubscriptionCancelRequest = z.infer<
  typeof SubscriptionCancelRequestSchema
>;
