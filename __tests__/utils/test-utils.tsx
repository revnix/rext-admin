/**
 * Test Utilities
 *
 * Common utilities, mocks, and helpers for testing subscription components.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type RenderOptions, render } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import {
  BillingPeriod,
  type SubscriptionPlan,
  SubscriptionStatus,
  type UsageStats,
  type UserSubscription,
} from "@/types/subscription";

// ============================================================================
// MOCK DATA FACTORIES
// ============================================================================

export const createMockSubscriptionPlan = (
  overrides?: Partial<SubscriptionPlan>,
): SubscriptionPlan => ({
  id: "plan-pro",
  name: "pro",
  display_name: "Pro Plan",
  description: "Professional features for growing teams",
  price_monthly: 29.0,
  price_yearly: 290.0,
  features: {
    advanced_ai: true,
    priority_support: true,
    advanced_analytics: true,
  },
  max_workspaces: 10,
  max_members_per_workspace: 5,
  max_topics: 100,
  max_knowledge_items: 500,
  max_api_calls_per_month: 10000,
  is_active: true,
  is_public: true,
  created_at: "2025-01-01T00:00:00Z",
  ...overrides,
});

export const createMockUserSubscription = (
  overrides?: Partial<UserSubscription>,
): UserSubscription => ({
  id: "sub-123",
  user_id: "user-456",
  plan_id: "plan-pro",
  plan_name: "pro",
  plan_display_name: "Pro Plan",
  status: SubscriptionStatus.ACTIVE,
  billing_period: BillingPeriod.MONTHLY,
  start_date: "2025-01-01T00:00:00Z",
  end_date: null,
  trial_end_date: null,
  cancelled_at: null,
  current_api_calls: 0,
  created_at: "2025-01-01T00:00:00Z",
  lemonsqueezy_subscription_id: "ls-sub-123",
  lemonsqueezy_customer_id: "ls-cust-456",
  renews_at: "2025-02-01T00:00:00Z",
  ends_at: null,
  current_period_end: "2025-02-01T00:00:00Z",
  plan_features: {
    advanced_ai: true,
    priority_support: true,
  },
  plan_limits: {
    max_workspaces: 10,
    max_members_per_workspace: 5,
    max_topics: 100,
    max_knowledge_items: 500,
    max_api_calls_per_month: 10000,
  },
  customer_portal_url: "https://portal.lemonsqueezy.com/test",
  ...overrides,
});

export const createMockUsageStats = (
  overrides?: Partial<UsageStats>,
): UsageStats => ({
  subscription_id: "sub-123",
  plan_name: "pro",
  billing_period: BillingPeriod.MONTHLY,
  current_workspaces: 3,
  current_topics: 25,
  current_knowledge_items: 100,
  current_api_calls: 1000,
  max_workspaces: 10,
  max_topics: 100,
  max_knowledge_items: 500,
  max_api_calls_per_month: 10000,
  workspaces_usage_percent: 30,
  topics_usage_percent: 25,
  knowledge_items_usage_percent: 20,
  api_calls_usage_percent: 10,
  usage_reset_date: "2025-02-01T00:00:00Z",
  ...overrides,
});

// ============================================================================
// MOCK API CLIENT
// ============================================================================

export const createMockApiClient = () => ({
  subscriptions: {
    getPlans: jest.fn().mockResolvedValue({
      plans: [
        createMockSubscriptionPlan({ id: "plan-free", name: "free" }),
        createMockSubscriptionPlan({ id: "plan-pro", name: "pro" }),
        createMockSubscriptionPlan({
          id: "plan-enterprise",
          name: "enterprise",
        }),
      ],
    }),
    getCurrentPlan: jest.fn().mockResolvedValue(createMockUserSubscription()),
    getUsageStats: jest.fn().mockResolvedValue(createMockUsageStats()),
    createCheckout: jest.fn().mockResolvedValue({
      checkout_url: "https://checkout.lemonsqueezy.com/test",
      session_id: "session-123",
    }),
    upgradeSubscription: jest
      .fn()
      .mockResolvedValue(createMockUserSubscription()),
    downgradeSubscription: jest
      .fn()
      .mockResolvedValue(createMockUserSubscription()),
    cancelSubscription: jest.fn().mockResolvedValue(undefined),
    getCustomerPortalUrl: jest.fn().mockResolvedValue({
      portal_url: "https://portal.lemonsqueezy.com/test",
    }),
    getInvoices: jest.fn().mockResolvedValue({
      invoices: [],
      count: 0,
    }),
  },
});

// ============================================================================
// MOCK ZUSTAND STORE
// ============================================================================

export const createMockSubscriptionStore = (
  initialState?: Partial<
    ReturnType<
      typeof import("@/stores/subscription-store").useSubscriptionStore
    >
  >,
) => ({
  subscription: createMockUserSubscription(),
  usage: createMockUsageStats(),
  plans: [createMockSubscriptionPlan()],
  isLoading: false,
  error: null,
  checkoutInProgress: false,
  selectedPlan: null,
  selectedPeriod: null,
  checkoutUrl: null,
  invoices: [],
  invoicesLoading: false,
  invoicesError: null,
  fetchSubscription: jest.fn(),
  fetchUsage: jest.fn(),
  fetchPlans: jest.fn(),
  upgradeSubscription: jest.fn(),
  downgradeSubscription: jest.fn(),
  cancelSubscription: jest.fn(),
  getPortalUrl: jest.fn(),
  initiateCheckout: jest.fn(),
  resetCheckout: jest.fn(),
  openCheckout: jest.fn(),
  fetchInvoices: jest.fn(),
  reset: jest.fn(),
  clearError: jest.fn(),
  ...initialState,
});

// ============================================================================
// MOCK WINDOW.LEMONSQUEEZY
// ============================================================================

export const mockLemonSqueezy = () => {
  const mockOpen = jest.fn();
  const mockClose = jest.fn();
  const mockSetup = jest.fn();

  Object.defineProperty(window, "LemonSqueezy", {
    writable: true,
    value: {
      Url: {
        Open: mockOpen,
        Close: mockClose,
      },
      Setup: mockSetup,
    },
  });

  return { mockOpen, mockClose, mockSetup };
};

// ============================================================================
// CUSTOM RENDER FUNCTION
// ============================================================================

interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  queryClient?: QueryClient;
}

function AllTheProviders({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

export function customRender(ui: ReactElement, options?: CustomRenderOptions) {
  return render(ui, { wrapper: AllTheProviders, ...options });
}

// ============================================================================
// RE-EXPORT TESTING LIBRARY
// ============================================================================

export {
  act,
  fireEvent,
  screen,
  waitFor,
  within,
  renderHook,
} from "@testing-library/react";
export { customRender as render };

// ============================================================================
// WAIT HELPERS
// ============================================================================

/**
 * Wait for a specific amount of time
 */
export const wait = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/**
 * Flush all pending promises
 */
export const flushPromises = () =>
  new Promise((resolve) => {
    setImmediate(resolve);
  });

// ============================================================================
// ASSERTION HELPERS
// ============================================================================

/**
 * Assert that an element has a specific class
 */
export const expectToHaveClass = (
  element: HTMLElement | null,
  className: string,
) => {
  expect(element).toHaveClass(className);
};

/**
 * Assert that a mock was called with specific arguments
 */
export const expectToBeCalledWith = (mock: jest.Mock, ...args: unknown[]) => {
  expect(mock).toHaveBeenCalledWith(...args);
};
