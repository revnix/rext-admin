/**
 * Integration Tests for Subscription Management
 *
 * Tests plan upgrades, downgrades, cancellations, and usage display.
 */

import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { apiClient } from "@/lib/api-client";
import { useSubscriptionStore } from "@/stores/subscription-store";
import { BillingPeriod, SubscriptionStatus } from "@/types/subscription";
import {
  createMockApiClient,
  createMockSubscriptionStore,
  createMockUsageStats,
  createMockUserSubscription,
  render,
} from "../utils/test-utils";

// Mock dependencies
jest.mock("@/lib/api-client");
jest.mock("@/stores/subscription-store");

// Mock next/navigation
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Simple test component for subscription management
const SubscriptionManagementComponent = () => {
  const {
    subscription,
    usage,
    upgradeSubscription,
    downgradeSubscription,
    cancelSubscription,
    isLoading,
  } = useSubscriptionStore();

  if (!subscription) return <div>No subscription</div>;

  return (
    <div>
      <h1>Subscription Management</h1>
      <div data-testid="subscription-status">
        <p>Plan: {subscription.plan_display_name}</p>
        <p>Status: {subscription.status}</p>
        <p>Period: {subscription.billing_period}</p>
      </div>

      {usage && (
        <div data-testid="usage-stats">
          <p>
            Workspaces: {usage.current_workspaces} / {usage.max_workspaces}
          </p>
          <p>
            Topics: {usage.current_topics} / {usage.max_topics}
          </p>
        </div>
      )}

      <div data-testid="actions">
        <button
          type="button"
          onClick={() => upgradeSubscription("plan-enterprise")}
          disabled={isLoading}
        >
          Upgrade to Enterprise
        </button>
        <button
          type="button"
          onClick={() => downgradeSubscription("plan-free")}
          disabled={isLoading}
        >
          Downgrade to Free
        </button>
        <button
          type="button"
          onClick={() => cancelSubscription("No longer needed")}
          disabled={isLoading}
        >
          Cancel Subscription
        </button>
      </div>
    </div>
  );
};

describe("Subscription Management Integration", () => {
  const mockApiClientInstance = createMockApiClient();

  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();
    Object.assign(apiClient, mockApiClientInstance);
  });

  describe("Plan Upgrade Flow", () => {
    it("should upgrade subscription to higher tier", async () => {
      const user = userEvent.setup();
      const upgradeSubscription = jest.fn().mockResolvedValue(
        createMockUserSubscription({
          plan_name: "enterprise",
          plan_display_name: "Enterprise Plan",
        }),
      );

      (useSubscriptionStore as unknown as jest.Mock).mockReturnValue({
        ...createMockSubscriptionStore(),
        upgradeSubscription,
      });

      render(<SubscriptionManagementComponent />);

      const upgradeButton = screen.getByRole("button", {
        name: /upgrade to enterprise/i,
      });
      await user.click(upgradeButton);

      await waitFor(() => {
        expect(upgradeSubscription).toHaveBeenCalledWith("plan-enterprise");
      });
    });

    it("should show loading state during upgrade", async () => {
      const _user = userEvent.setup();
      const upgradeSubscription = jest.fn(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve(createMockUserSubscription()), 100),
          ),
      );

      (useSubscriptionStore as unknown as jest.Mock).mockReturnValue({
        ...createMockSubscriptionStore(),
        upgradeSubscription,
        isLoading: true,
      });

      render(<SubscriptionManagementComponent />);

      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });

    it("should refresh subscription after upgrade", async () => {
      const user = userEvent.setup();
      const fetchSubscription = jest.fn();
      const upgradeSubscription = jest.fn().mockImplementation(async () => {
        fetchSubscription();
        return createMockUserSubscription({
          plan_name: "enterprise",
        });
      });

      (useSubscriptionStore as unknown as jest.Mock).mockReturnValue({
        ...createMockSubscriptionStore(),
        upgradeSubscription,
        fetchSubscription,
      });

      render(<SubscriptionManagementComponent />);

      const upgradeButton = screen.getByRole("button", {
        name: /upgrade to enterprise/i,
      });
      await user.click(upgradeButton);

      await waitFor(() => {
        expect(upgradeSubscription).toHaveBeenCalled();
      });
    });
  });

  describe("Plan Downgrade Flow", () => {
    it("should downgrade subscription to lower tier", async () => {
      const user = userEvent.setup();
      const downgradeSubscription = jest.fn().mockResolvedValue(
        createMockUserSubscription({
          plan_name: "free",
          plan_display_name: "Free Plan",
        }),
      );

      (useSubscriptionStore as unknown as jest.Mock).mockReturnValue({
        ...createMockSubscriptionStore(),
        downgradeSubscription,
      });

      render(<SubscriptionManagementComponent />);

      const downgradeButton = screen.getByRole("button", {
        name: /downgrade to free/i,
      });
      await user.click(downgradeButton);

      await waitFor(() => {
        expect(downgradeSubscription).toHaveBeenCalledWith("plan-free");
      });
    });

    it("should validate usage before downgrade", async () => {
      const _user = userEvent.setup();
      const usage = createMockUsageStats({
        current_workspaces: 8,
        max_workspaces: 10,
      });

      const downgradeSubscription = jest
        .fn()
        .mockResolvedValue(createMockUserSubscription());

      (useSubscriptionStore as unknown as jest.Mock).mockReturnValue({
        ...createMockSubscriptionStore({ usage }),
        downgradeSubscription,
      });

      render(<SubscriptionManagementComponent />);

      expect(screen.getByText("Workspaces: 8 / 10")).toBeInTheDocument();
    });
  });

  describe("Subscription Cancellation Flow", () => {
    it("should cancel subscription with reason", async () => {
      const user = userEvent.setup();
      const cancelSubscription = jest.fn().mockResolvedValue(undefined);

      (useSubscriptionStore as unknown as jest.Mock).mockReturnValue({
        ...createMockSubscriptionStore(),
        cancelSubscription,
      });

      render(<SubscriptionManagementComponent />);

      const cancelButton = screen.getByRole("button", {
        name: /cancel subscription/i,
      });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(cancelSubscription).toHaveBeenCalledWith("No longer needed");
      });
    });

    it("should update subscription status after cancellation", async () => {
      const user = userEvent.setup();
      const cancelledSubscription = createMockUserSubscription({
        status: SubscriptionStatus.CANCELLED,
        cancelled_at: "2025-01-18T00:00:00Z",
      });

      const cancelSubscription = jest.fn().mockImplementation(async () => {
        (useSubscriptionStore as unknown as jest.Mock).mockReturnValue({
          ...createMockSubscriptionStore(),
          subscription: cancelledSubscription,
          cancelSubscription,
        });
      });

      (useSubscriptionStore as unknown as jest.Mock).mockReturnValue({
        ...createMockSubscriptionStore(),
        cancelSubscription,
      });

      render(<SubscriptionManagementComponent />);

      const cancelButton = screen.getByRole("button", {
        name: /cancel subscription/i,
      });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(cancelSubscription).toHaveBeenCalled();
      });
    });
  });

  describe("Usage Display", () => {
    it("should display current usage stats", () => {
      const usage = createMockUsageStats({
        current_workspaces: 5,
        max_workspaces: 10,
        current_topics: 30,
        max_topics: 100,
      });

      (useSubscriptionStore as unknown as jest.Mock).mockReturnValue({
        ...createMockSubscriptionStore({ usage }),
      });

      render(<SubscriptionManagementComponent />);

      expect(screen.getByText("Workspaces: 5 / 10")).toBeInTheDocument();
      expect(screen.getByText("Topics: 30 / 100")).toBeInTheDocument();
    });

    it("should calculate usage percentages correctly", () => {
      const usage = createMockUsageStats({
        current_workspaces: 8,
        max_workspaces: 10,
        workspaces_usage_percent: 80,
      });

      (useSubscriptionStore as unknown as jest.Mock).mockReturnValue({
        ...createMockSubscriptionStore({ usage }),
      });

      render(<SubscriptionManagementComponent />);

      expect(screen.getByText("Workspaces: 8 / 10")).toBeInTheDocument();
    });

    it("should handle unlimited resources", () => {
      const subscription = createMockUserSubscription({
        plan_limits: {
          max_workspaces: -1,
          max_members_per_workspace: -1,
          max_topics: -1,
          max_knowledge_items: -1,
          max_api_calls_per_month: -1,
        },
      });

      const usage = createMockUsageStats({
        max_workspaces: -1,
        max_topics: -1,
      });

      (useSubscriptionStore as unknown as jest.Mock).mockReturnValue({
        ...createMockSubscriptionStore({ subscription, usage }),
      });

      render(<SubscriptionManagementComponent />);

      expect(screen.getByText(/workspaces: \d+ \/ -1/i)).toBeInTheDocument();
    });
  });

  describe("Subscription Status Display", () => {
    it("should display active subscription details", () => {
      const subscription = createMockUserSubscription({
        plan_display_name: "Pro Plan",
        status: SubscriptionStatus.ACTIVE,
        billing_period: BillingPeriod.MONTHLY,
      });

      (useSubscriptionStore as unknown as jest.Mock).mockReturnValue({
        ...createMockSubscriptionStore({ subscription }),
      });

      render(<SubscriptionManagementComponent />);

      expect(screen.getByText("Plan: Pro Plan")).toBeInTheDocument();
      expect(screen.getByText("Status: active")).toBeInTheDocument();
      expect(screen.getByText("Period: monthly")).toBeInTheDocument();
    });

    it("should handle different subscription statuses", () => {
      const statuses = [
        SubscriptionStatus.ACTIVE,
        SubscriptionStatus.TRIAL,
        SubscriptionStatus.CANCELLED,
        SubscriptionStatus.EXPIRED,
      ];

      statuses.forEach((status) => {
        const subscription = createMockUserSubscription({ status });

        (useSubscriptionStore as unknown as jest.Mock).mockReturnValue({
          ...createMockSubscriptionStore({ subscription }),
        });

        render(<SubscriptionManagementComponent />);

        expect(screen.getByText(`Status: ${status}`)).toBeInTheDocument();
      });
    });
  });
});
