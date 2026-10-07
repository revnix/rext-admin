/**
 * The billing action (plan F11): a failed renewal's banner names the day it failed and offers
 * Update card; a cancelled or paused subscription offers Resume; nothing shows without an action.
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BillingActionNotice,
  ShellBillingBanner,
} from "@/components/billing/billing-action-notice";
import { apiClient } from "@/lib/api-client";
import type { BillingAction } from "@/types/subscription";

jest.mock("@/lib/api-client", () => ({
  apiClient: {
    subscriptions: {
      getBillingAction: jest.fn(),
      getBillingUrls: jest.fn(),
      resumeSubscription: jest.fn(),
    },
  },
}));

jest.mock("@/components/billing/trial-banner", () => ({
  TrialBanner: () => <p>The trial banner</p>,
}));

const mockOpenPaymentMethodDialog = jest.fn();
jest.mock("@/stores/subscription-store", () => ({
  useSubscriptionStore: (select: (state: unknown) => unknown) =>
    select({
      openPaymentMethodDialog: mockOpenPaymentMethodDialog,
      fetchSubscription: jest.fn().mockResolvedValue(undefined),
      subscription: null,
    }),
}));

const subscriptions = apiClient.subscriptions as unknown as Record<
  string,
  jest.Mock
>;

function renderWith(action: BillingAction | null, ui: React.ReactElement) {
  subscriptions.getBillingAction.mockResolvedValue({ billing_action: action });
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      {ui}
    </QueryClientProvider>,
  );
}

const pastDue: BillingAction = {
  action: "update_payment_method",
  status: "past_due",
  payment_failed_at: "2026-10-01T09:00:00Z",
  ends_at: null,
};

describe("ShellBillingBanner", () => {
  beforeEach(() => jest.clearAllMocks());

  it("names the day a renewal failed and opens the card form", async () => {
    subscriptions.getBillingUrls.mockResolvedValue({
      update_payment_method: "https://pay.example/card",
      customer_portal: null,
    });
    renderWith(pastDue, <ShellBillingBanner />);

    expect(
      await screen.findByText("Your payment on October 1 failed"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/retry automatically over the next two weeks/),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Update card" }));
    await waitFor(() =>
      expect(mockOpenPaymentMethodDialog).toHaveBeenCalledWith(
        "https://pay.example/card",
      ),
    );
  });

  it("says an unpaid plan is on hold", async () => {
    renderWith({ ...pastDue, status: "unpaid" }, <ShellBillingBanner />);

    expect(
      await screen.findByText("Your renewal couldn't be collected"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Your plan is on hold. Update your card to reactivate it.",
      ),
    ).toBeInTheDocument();
  });

  it("shows a failed renewal instead of the trial banner", async () => {
    renderWith(pastDue, <ShellBillingBanner />);

    expect(
      await screen.findByText("Your payment on October 1 failed"),
    ).toBeInTheDocument();
    expect(screen.queryByText("The trial banner")).not.toBeInTheDocument();
  });

  it("leaves a cancelled plan to Billing and the plan grid", async () => {
    renderWith(
      {
        action: "resume",
        status: "cancelled",
        payment_failed_at: null,
        ends_at: "2026-10-20T00:00:00Z",
      },
      <ShellBillingBanner />,
    );

    await waitFor(() =>
      expect(subscriptions.getBillingAction).toHaveBeenCalled(),
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    // The slot falls back to the trial's banner.
    expect(screen.getByText("The trial banner")).toBeInTheDocument();
  });
});

describe("BillingActionNotice", () => {
  beforeEach(() => jest.clearAllMocks());

  it("offers Resume for a cancelled subscription before its end", async () => {
    subscriptions.resumeSubscription.mockResolvedValue({});
    renderWith(
      {
        action: "resume",
        status: "cancelled",
        payment_failed_at: null,
        ends_at: "2026-10-20T12:00:00Z",
      },
      <BillingActionNotice kinds={["resume"]} />,
    );

    expect(
      await screen.findByText("Your subscription ends on October 20"),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Resume" }));
    await waitFor(() =>
      expect(subscriptions.resumeSubscription).toHaveBeenCalled(),
    );
  });

  it("shows nothing when nothing is unfinished", async () => {
    renderWith(null, <BillingActionNotice kinds={["resume"]} />);

    await waitFor(() =>
      expect(subscriptions.getBillingAction).toHaveBeenCalled(),
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
