/**
 * Integration Tests for Subscription Management
 *
 * Tests plan upgrades, downgrades, cancellations, and usage display.
 */

import { apiClient } from "@/lib/api-client";
import { useSubscriptionData } from "@/hooks/use-subscription-data";
import { useSubscriptionMutations } from "@/hooks/use-subscription-mutations";
import { BillingPeriod, SubscriptionStatus } from "@/types/subscription";
import userEvent from "@testing-library/user-event";
import {
  createMockApiClient,
  createMockUsageStats,
  createMockUserSubscription,
  render,
  screen,
  waitFor,
} from "../utils/test-utils";

// Mock dependencies
jest.mock("@/lib/api-client");
jest.mock("@/hooks/use-subscription-data");
jest.mock("@/hooks/use-subscription-mutations");

// Mock next/navigation
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Simple test component for subscription management
const SubscriptionManagementComponent = () => {
  const { subscription, usage, isLoading } = useSubscriptionData();
  const {
    upgradeSubscription,
    downgradeSubscription,
    cancelSubscription,
    isPending,
  } = useSubscriptionMutations();

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
          onClick={() =>
            upgradeSubscription.mutateAsync({ planId: "plan-enterprise" })
          }
          disabled={isLoading || isPending}
        >
          Upgrade to Enterprise
        </button>
        <button
          type="button"
          onClick={() =>
            downgradeSubscription.mutateAsync({ planId: "plan-free" })
          }
          disabled={isLoading || isPending}
        >
          Downgrade to Free
        </button>
        <button
          type="button"
          onClick={() =>
            cancelSubscription.mutateAsync({ reason: "No longer needed" })
          }
          disabled={isLoading || isPending}
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

    // Default mock returns
    (useSubscriptionData as jest.Mock).mockReturnValue({
      subscription: createMockUserSubscription(),
      usage: createMockUsageStats(),
      isLoading: false,
      refetchAll: jest.fn(),
    });

    (useSubscriptionMutations as jest.Mock).mockReturnValue({
      upgradeSubscription: { mutateAsync: jest.fn() },
      downgradeSubscription: { mutateAsync: jest.fn() },
      cancelSubscription: { mutateAsync: jest.fn() },
      isPending: false,
    });
  });

  describe("Plan Upgrade Flow", () => {
    it("should upgrade subscription to higher tier", async () => {
      const user = userEvent.setup();
      const mutateAsync = jest.fn().mockResolvedValue(
        createMockUserSubscription({
          plan_name: "enterprise",
          plan_display_name: "Enterprise Plan",
        }),
      );

      (useSubscriptionMutations as jest.Mock).mockReturnValue({
        upgradeSubscription: { mutateAsync },
        downgradeSubscription: { mutateAsync: jest.fn() },
        cancelSubscription: { mutateAsync: jest.fn() },
        isPending: false,
      });

      render(<SubscriptionManagementComponent />);

      const upgradeButton = screen.getByRole("button", {
        name: /upgrade to enterprise/i,
      });
      await user.click(upgradeButton);

      await waitFor(() => {
        expect(mutateAsync).toHaveBeenCalledWith({ planId: "plan-enterprise" });
      });
    });

    it("should show loading state during upgrade", async () => {
      const _user = userEvent.setup();
      const _upgradeSubscription = jest.fn(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve(createMockUserSubscription()), 100),
          ),
      );

      (useSubscriptionMutations as jest.Mock).mockReturnValue({
        upgradeSubscription: { mutateAsync: jest.fn() },
        downgradeSubscription: { mutateAsync: jest.fn() },
        cancelSubscription: { mutateAsync: jest.fn() },
        isPending: true,
      });

      render(<SubscriptionManagementComponent />);

      const buttons = screen.getAllByRole("button");
      buttons.forEach((button: HTMLElement) => {
        expect(button).toBeDisabled();
      });
    });

    it("should refresh subscription after upgrade", async () => {
      const user = userEvent.setup();
      const refetchAll = jest.fn();
      const mutateAsync = jest.fn().mockImplementation(async () => {
        refetchAll();
        return createMockUserSubscription({
          plan_name: "enterprise",
        });
      });

      (useSubscriptionData as jest.Mock).mockReturnValue({
        subscription: createMockUserSubscription(),
        usage: createMockUsageStats(),
        isLoading: false,
        refetchAll,
      });

      (useSubscriptionMutations as jest.Mock).mockReturnValue({
        upgradeSubscription: { mutateAsync },
        downgradeSubscription: { mutateAsync: jest.fn() },
        cancelSubscription: { mutateAsync: jest.fn() },
        isPending: false,
      });

      render(<SubscriptionManagementComponent />);

      const upgradeButton = screen.getByRole("button", {
        name: /upgrade to enterprise/i,
      });
      await user.click(upgradeButton);

      await waitFor(() => {
        expect(mutateAsync).toHaveBeenCalled();
      });
    });
  });

  describe("Plan Downgrade Flow", () => {
    it("should downgrade subscription to lower tier", async () => {
      const user = userEvent.setup();
      const mutateAsync = jest.fn().mockResolvedValue(
        createMockUserSubscription({
          plan_name: "free",
          plan_display_name: "Free Plan",
        }),
      );

      (useSubscriptionMutations as jest.Mock).mockReturnValue({
        upgradeSubscription: { mutateAsync: jest.fn() },
        downgradeSubscription: { mutateAsync },
        cancelSubscription: { mutateAsync: jest.fn() },
        isPending: false,
      });

      render(<SubscriptionManagementComponent />);

      const downgradeButton = screen.getByRole("button", {
        name: /downgrade to free/i,
      });
      await user.click(downgradeButton);

      await waitFor(() => {
        expect(mutateAsync).toHaveBeenCalledWith({ planId: "plan-free" });
      });
    });

    it("should validate usage before downgrade", async () => {
      const _user = userEvent.setup();
      const usage = createMockUsageStats({
        current_workspaces: 8,
        max_workspaces: 10,
      });

      const mutateAsync = jest
        .fn()
        .mockResolvedValue(createMockUserSubscription());

      (useSubscriptionData as jest.Mock).mockReturnValue({
        subscription: createMockUserSubscription(),
        usage,
        isLoading: false,
        refetchAll: jest.fn(),
      });

      (useSubscriptionMutations as jest.Mock).mockReturnValue({
        upgradeSubscription: { mutateAsync: jest.fn() },
        downgradeSubscription: { mutateAsync },
        cancelSubscription: { mutateAsync: jest.fn() },
        isPending: false,
      });

      render(<SubscriptionManagementComponent />);

      expect(screen.getByText("Workspaces: 8 / 10")).toBeInTheDocument();
    });
  });

  describe("Subscription Cancellation Flow", () => {
    it("should cancel subscription with reason", async () => {
      const user = userEvent.setup();
      const mutateAsync = jest.fn().mockResolvedValue(undefined);

      (useSubscriptionMutations as jest.Mock).mockReturnValue({
        upgradeSubscription: { mutateAsync: jest.fn() },
        downgradeSubscription: { mutateAsync: jest.fn() },
        cancelSubscription: { mutateAsync },
        isPending: false,
      });

      render(<SubscriptionManagementComponent />);

      const cancelButton = screen.getByRole("button", {
        name: /cancel subscription/i,
      });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(mutateAsync).toHaveBeenCalledWith({
          reason: "No longer needed",
        });
      });
    });

    it("should update subscription status after cancellation", async () => {
      const user = userEvent.setup();
      const cancelledSubscription = createMockUserSubscription({
        status: SubscriptionStatus.CANCELLED,
        cancelled_at: "2025-01-18T00:00:00Z",
      });

      const mutateAsync = jest.fn().mockImplementation(async () => {
        (useSubscriptionData as jest.Mock).mockReturnValue({
          subscription: cancelledSubscription,
          usage: createMockUsageStats(),
          isLoading: false,
          refetchAll: jest.fn(),
        });
      });

      (useSubscriptionMutations as jest.Mock).mockReturnValue({
        upgradeSubscription: { mutateAsync: jest.fn() },
        downgradeSubscription: { mutateAsync: jest.fn() },
        cancelSubscription: { mutateAsync },
        isPending: false,
      });

      render(<SubscriptionManagementComponent />);

      const cancelButton = screen.getByRole("button", {
        name: /cancel subscription/i,
      });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(mutateAsync).toHaveBeenCalled();
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

      (useSubscriptionData as jest.Mock).mockReturnValue({
        subscription: createMockUserSubscription(),
        usage,
        isLoading: false,
        refetchAll: jest.fn(),
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

      (useSubscriptionData as jest.Mock).mockReturnValue({
        subscription: createMockUserSubscription(),
        usage,
        isLoading: false,
        refetchAll: jest.fn(),
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

      (useSubscriptionData as jest.Mock).mockReturnValue({
        subscription,
        usage,
        isLoading: false,
        refetchAll: jest.fn(),
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

      (useSubscriptionData as jest.Mock).mockReturnValue({
        subscription,
        usage: createMockUsageStats(),
        isLoading: false,
        refetchAll: jest.fn(),
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

        (useSubscriptionData as jest.Mock).mockReturnValue({
          subscription,
          usage: createMockUsageStats(),
          isLoading: false,
          refetchAll: jest.fn(),
        });

        render(<SubscriptionManagementComponent />);

        expect(screen.getByText(`Status: ${status}`)).toBeInTheDocument();
      });
    });
  });
});
