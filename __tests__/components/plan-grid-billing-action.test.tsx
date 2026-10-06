/**
 * The plan grid (F3, F11.6) offers no checkout while the backend would refuse one: it waits for the
 * billing action, offers the action instead of a checkout, and holds checkout when the action
 * couldn't be read.
 */

import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PlanGrid } from "@/components/billing/plan-grid";
import { apiClient } from "@/lib/api-client";

jest.mock("@/lib/api-client", () => ({
  apiClient: {
    subscriptions: {
      getCatalog: jest.fn(),
      getPlans: jest.fn(),
      getCurrentPlan: jest.fn(),
      getBillingAction: jest.fn(),
      getBillingUrls: jest.fn(),
      resumeSubscription: jest.fn(),
    },
  },
}));
jest.mock("@/components/subscription/checkout-with-discount", () => ({
  CheckoutWithDiscount: ({ buttonText }: { buttonText: string }) => (
    <button type="button">{buttonText}</button>
  ),
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

const growth = {
  name: "growth",
  display_name: "Growth",
  description: null,
  price_monthly: 89,
  price_yearly: 890,
  price_monthly_billed_yearly: 74.17,
  yearly_saving_percent: 17,
  credits_per_month: 600,
  articles_per_month: 40,
  price_per_article_monthly: 2.23,
  price_per_article_yearly: 1.85,
  max_workspaces: 3,
  max_members_per_workspace: 5,
};

function renderGrid() {
  subscriptions.getCatalog.mockResolvedValue({
    currency: "USD",
    plans: [growth],
    trial: null,
    credits: {},
    offer: null,
  });
  subscriptions.getPlans.mockResolvedValue({
    plans: [
      { id: "plan-growth", name: "growth", is_active: true, is_public: true },
    ],
  });
  subscriptions.getCurrentPlan.mockResolvedValue({ subscription: null });
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <PlanGrid />
    </QueryClientProvider>,
  );
}

describe("PlanGrid and the billing action", () => {
  beforeEach(() => jest.clearAllMocks());

  it("offers no checkout before the billing action is known", async () => {
    subscriptions.getBillingAction.mockReturnValue(new Promise(() => {}));
    renderGrid();

    await waitFor(() => expect(subscriptions.getCatalog).toHaveBeenCalled());
    expect(
      screen.queryByRole("button", { name: "Choose Growth" }),
    ).not.toBeInTheDocument();
  });

  it("offers checkout when nothing is unfinished", async () => {
    subscriptions.getBillingAction.mockResolvedValue({ billing_action: null });
    renderGrid();

    expect(
      await screen.findByRole("button", { name: "Choose Growth" }),
    ).toBeEnabled();
  });

  it("offers Resume in place of a checkout for a cancelled plan", async () => {
    subscriptions.getBillingAction.mockResolvedValue({
      billing_action: {
        action: "resume",
        status: "cancelled",
        payment_failed_at: null,
        ends_at: "2026-10-20T12:00:00Z",
      },
    });
    renderGrid();

    expect(
      await screen.findByText("Your subscription ends on October 20"),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Resume" }).length).toBe(2);
    expect(
      screen.queryByRole("button", { name: "Choose Growth" }),
    ).not.toBeInTheDocument();
  });

  it("holds checkout when the billing action couldn't be read", async () => {
    subscriptions.getBillingAction.mockRejectedValue(new Error("boom"));
    renderGrid();

    expect(
      await screen.findByText("Your billing status didn't load"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Choose Growth" }),
    ).toBeDisabled();
  });
});
