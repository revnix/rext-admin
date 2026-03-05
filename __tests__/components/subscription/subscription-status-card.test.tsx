/**
 * Tests for SubscriptionStatusCard Component
 */

import { SubscriptionStatusCard } from "@/components/subscription/subscription-status-card";
import { useSubscriptionData } from "@/hooks/use-subscription-data";
import { BillingPeriod, SubscriptionStatus } from "@/types/subscription";
import {
  createMockUserSubscription,
  render,
  screen,
} from "../../utils/test-utils";

// Mock the dependencies
jest.mock("@/hooks/use-subscription-data");
jest.mock("@/lib/subscription/portal", () => ({
  openCustomerPortal: jest.fn(),
}));

describe("SubscriptionStatusCard", () => {
  describe("Active Subscription", () => {
    it("should display active subscription status", () => {
      const subscription = createMockUserSubscription({
        status: SubscriptionStatus.ACTIVE,
        plan_display_name: "Pro Plan",
        billing_period: BillingPeriod.MONTHLY,
      });

      (useSubscriptionData as jest.Mock).mockReturnValue({
        subscription,
        isLoading: false,
      });

      render(<SubscriptionStatusCard />);

      expect(screen.getByText("Pro Plan")).toBeInTheDocument();
      expect(screen.getByText(/active/i)).toBeInTheDocument();
      expect(screen.getByText(/monthly/i)).toBeInTheDocument();
    });

    it("should show renewal date for active subscription", () => {
      const subscription = createMockUserSubscription({
        status: SubscriptionStatus.ACTIVE,
        renews_at: "2025-02-01T00:00:00Z",
      });

      (useSubscriptionData as jest.Mock).mockReturnValue({
        subscription,
        isLoading: false,
      });

      render(<SubscriptionStatusCard />);

      expect(screen.getByText(/renews/i)).toBeInTheDocument();
    });
  });

  describe("Trial Subscription", () => {
    it("should display trial status", () => {
      const subscription = createMockUserSubscription({
        status: SubscriptionStatus.TRIAL,
        trial_end_date: "2025-02-01T00:00:00Z",
      });

      (useSubscriptionData as jest.Mock).mockReturnValue({
        subscription,
        isLoading: false,
      });

      render(<SubscriptionStatusCard />);

      expect(screen.getByText(/trial/i)).toBeInTheDocument();
    });

    it("should show trial end date", () => {
      const subscription = createMockUserSubscription({
        status: SubscriptionStatus.TRIAL,
        trial_end_date: "2025-02-01T00:00:00Z",
      });

      (useSubscriptionData as jest.Mock).mockReturnValue({
        subscription,
        isLoading: false,
      });

      render(<SubscriptionStatusCard />);

      expect(screen.getByText(/trial ends/i)).toBeInTheDocument();
    });
  });

  describe("Cancelled Subscription", () => {
    it("should display cancelled status", () => {
      const subscription = createMockUserSubscription({
        status: SubscriptionStatus.CANCELLED,
        cancelled_at: "2025-01-15T00:00:00Z",
      });

      (useSubscriptionData as jest.Mock).mockReturnValue({
        subscription,
        isLoading: false,
      });

      render(<SubscriptionStatusCard />);

      expect(screen.getByText(/cancelled/i)).toBeInTheDocument();
    });

    it("should show cancellation date", () => {
      const subscription = createMockUserSubscription({
        status: SubscriptionStatus.CANCELLED,
        cancelled_at: "2025-01-15T00:00:00Z",
      });

      (useSubscriptionData as jest.Mock).mockReturnValue({
        subscription,
        isLoading: false,
      });

      render(<SubscriptionStatusCard />);

      expect(screen.getByText(/cancelled on/i)).toBeInTheDocument();
    });

    it("should show access end date for cancelled subscription", () => {
      const subscription = createMockUserSubscription({
        status: SubscriptionStatus.CANCELLED,
        ends_at: "2025-02-01T00:00:00Z",
      });

      (useSubscriptionData as jest.Mock).mockReturnValue({
        subscription,
        isLoading: false,
      });

      render(<SubscriptionStatusCard />);

      expect(screen.getByText(/access until/i)).toBeInTheDocument();
    });
  });

  describe("Expired Subscription", () => {
    it("should display expired status", () => {
      const subscription = createMockUserSubscription({
        status: SubscriptionStatus.EXPIRED,
        end_date: "2024-12-31T00:00:00Z",
      });

      (useSubscriptionData as jest.Mock).mockReturnValue({
        subscription,
        isLoading: false,
      });

      render(<SubscriptionStatusCard />);

      expect(screen.getByText(/expired/i)).toBeInTheDocument();
    });
  });

  describe("Billing Period Display", () => {
    it("should display monthly billing period", () => {
      const subscription = createMockUserSubscription({
        billing_period: BillingPeriod.MONTHLY,
      });

      (useSubscriptionData as jest.Mock).mockReturnValue({
        subscription,
        isLoading: false,
      });

      render(<SubscriptionStatusCard />);

      expect(screen.getByText(/monthly/i)).toBeInTheDocument();
    });

    it("should display yearly billing period", () => {
      const subscription = createMockUserSubscription({
        billing_period: BillingPeriod.YEARLY,
      });

      (useSubscriptionData as jest.Mock).mockReturnValue({
        subscription,
        isLoading: false,
      });

      render(<SubscriptionStatusCard />);

      expect(screen.getByText(/yearly/i)).toBeInTheDocument();
    });
  });
});
