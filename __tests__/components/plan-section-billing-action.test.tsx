/**
 * Plan's card and the billing action (#529, from the staging run of rext-backend#831): while a
 * renewal is past due it offers Update card, not Change plan; a resume says it went through
 * until Lemon Squeezy's webhook updates the plan.
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PlanSection } from "@/components/billing/plan-section";
import { apiClient } from "@/lib/api-client";
import type { BillingAction } from "@/types/subscription";

jest.mock("@/lib/api-client", () => ({
  apiClient: {
    subscriptions: {
      getCurrentPlan: jest.fn(),
      getCredits: jest.fn(),
      getPlans: jest.fn(),
      getBillingAction: jest.fn(),
      getBillingUrls: jest.fn(),
      resumeSubscription: jest.fn(),
    },
  },
}));
jest.mock("@/components/billing/plan-grid", () => ({ PlanGrid: () => null }));
jest.mock("@/components/subscription/plan-change-modal", () => ({
  PlanChangeModal: () => null,
}));
jest.mock("@/components/subscription/cancel-subscription-modal", () => ({
  CancelSubscriptionModal: () => null,
}));
jest.mock("@/stores/subscription-store", () => ({
  useSubscriptionStore: (select: (state: unknown) => unknown) =>
    select({
      openPaymentMethodDialog: jest.fn(),
      fetchSubscription: jest.fn().mockResolvedValue(undefined),
      subscription: null,
    }),
}));

const subscriptions = apiClient.subscriptions as unknown as Record<
  string,
  jest.Mock
>;

function renderPlan(status: string, action: BillingAction | null) {
  subscriptions.getCurrentPlan.mockResolvedValue({
    subscription: {
      id: "s1",
      plan_id: "p1",
      plan_display_name: "Growth",
      status,
      billing_period: "monthly",
      end_date: status === "cancelled" ? "2026-10-20T12:00:00Z" : null,
      renews_at: status === "cancelled" ? null : "2026-11-01T12:00:00Z",
    },
  });
  subscriptions.getCredits.mockResolvedValue({ credits_per_month: 1000 });
  subscriptions.getPlans.mockResolvedValue({ plans: [] });
  subscriptions.getBillingAction.mockResolvedValue({ billing_action: action });
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <PlanSection />
    </QueryClientProvider>,
  );
}

describe("PlanSection and the billing action", () => {
  beforeEach(() => jest.clearAllMocks());

  it("offers Update card, not Change plan, while a renewal is past due", async () => {
    renderPlan("past_due", {
      action: "update_payment_method",
      status: "past_due",
      payment_failed_at: "2026-10-01T09:00:00Z",
      ends_at: null,
    });

    expect(
      await screen.findByRole("button", { name: "Update card" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Change plan" }),
    ).not.toBeInTheDocument();
  });

  it("never offers Change plan while past due, even when the billing action can't be read", async () => {
    renderPlan("past_due", null);
    subscriptions.getBillingAction.mockRejectedValue(new Error("down"));

    expect(
      await screen.findByRole("button", { name: "Update card" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Change plan" }),
    ).not.toBeInTheDocument();
  });

  it("shows the end date and confirms a resume until the plan updates", async () => {
    subscriptions.resumeSubscription.mockResolvedValue({});
    renderPlan("cancelled", {
      action: "resume",
      status: "cancelled",
      payment_failed_at: null,
      ends_at: "2026-10-20T12:00:00Z",
    });

    expect(
      await screen.findByText(
        /It ends Oct 20, 2026, and nothing more is charged\./,
      ),
    ).toBeInTheDocument();
    await userEvent.click(
      await screen.findByRole("button", { name: "Resume" }),
    );

    await waitFor(() =>
      expect(subscriptions.resumeSubscription).toHaveBeenCalled(),
    );
    expect(
      await screen.findByText("Your subscription is resumed"),
    ).toBeInTheDocument();
  });
});
