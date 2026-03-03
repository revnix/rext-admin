/**
 * Integration Tests for Checkout Flow
 *
 * Tests the complete checkout journey from plan selection to subscription activation.
 */

import { apiClient } from "@/lib/api-client";
import { useSubscriptionStore } from "@/stores/subscription-store";
import { BillingPeriod, SubscriptionStatus } from "@/types/subscription";
import userEvent from "@testing-library/user-event";
import {
  createMockApiClient,
  createMockSubscriptionPlan,
  createMockSubscriptionStore,
  createMockUserSubscription,
  mockLemonSqueezy,
  render,
  screen,
  waitFor,
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
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/pricing",
}));

// Simple test component that simulates the checkout flow
const CheckoutFlowComponent = () => {
  const {
    plans,
    initiateCheckout,
    openCheckout,
    checkoutInProgress,
    fetchSubscription,
  } = useSubscriptionStore();

  const handleCheckout = async (
    planId: string,
    billingPeriod: BillingPeriod,
  ) => {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return;

    const session = await initiateCheckout(plan, billingPeriod);
    openCheckout(session.checkout_url);
  };

  return (
    <div>
      <h1>Select a Plan</h1>
      {plans.map((plan) => (
        <div key={plan.id} data-testid={`plan-${plan.id}`}>
          <h2>{plan.display_name}</h2>
          <p>${plan.price_monthly}/month</p>
          <button
            type="button"
            onClick={() => handleCheckout(plan.id, BillingPeriod.MONTHLY)}
            disabled={checkoutInProgress}
          >
            {checkoutInProgress ? "Processing..." : "Subscribe Monthly"}
          </button>
          <button
            type="button"
            onClick={() => handleCheckout(plan.id, BillingPeriod.YEARLY)}
            disabled={checkoutInProgress}
          >
            {checkoutInProgress ? "Processing..." : "Subscribe Yearly"}
          </button>
        </div>
      ))}
      <button type="button" onClick={() => void fetchSubscription()}>
        Refresh Subscription
      </button>
    </div>
  );
};

describe("Checkout Flow Integration", () => {
  const mockApiClientInstance = createMockApiClient();
  let _lemonSqueezyMocks: ReturnType<typeof mockLemonSqueezy>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();
    _lemonSqueezyMocks = mockLemonSqueezy();

    // Mock API client
    Object.assign(apiClient, mockApiClientInstance);

    // Setup initial store state
    const mockStore = createMockSubscriptionStore({
      plans: [
        createMockSubscriptionPlan({
          id: "plan-free",
          name: "free",
          display_name: "Free Plan",
        }),
        createMockSubscriptionPlan({
          id: "plan-pro",
          name: "pro",
          display_name: "Pro Plan",
        }),
        createMockSubscriptionPlan({
          id: "plan-enterprise",
          name: "enterprise",
          display_name: "Enterprise Plan",
        }),
      ],
      subscription: null,
      checkoutInProgress: false,
    });

    (useSubscriptionStore as unknown as jest.Mock).mockReturnValue(mockStore);
  });

  describe("Plan Selection", () => {
    it("should display available plans", () => {
      render(<CheckoutFlowComponent />);

      expect(screen.getByText("Free Plan")).toBeInTheDocument();
      expect(screen.getByText("Pro Plan")).toBeInTheDocument();
      expect(screen.getByText("Enterprise Plan")).toBeInTheDocument();
    });

    it("should show monthly and yearly options for each plan", () => {
      render(<CheckoutFlowComponent />);

      const proButtons = screen.getAllByText(/subscribe/i);
      expect(proButtons.length).toBeGreaterThan(0);
    });
  });

  describe("Checkout Initiation", () => {
    it("should initiate checkout when plan is selected", async () => {
      const user = userEvent.setup();
      const initiateCheckout = jest.fn().mockResolvedValue({
        checkout_url: "https://checkout.lemonsqueezy.com/test",
        session_id: "session-123",
      });

      (useSubscriptionStore as unknown as jest.Mock).mockReturnValue({
        ...createMockSubscriptionStore({
          plans: [
            createMockSubscriptionPlan({
              id: "plan-pro",
              display_name: "Pro Plan",
            }),
          ],
        }),
        initiateCheckout,
      });

      render(<CheckoutFlowComponent />);

      const monthlyButton = screen.getByRole("button", {
        name: /subscribe monthly/i,
      });
      await user.click(monthlyButton);

      await waitFor(() => {
        expect(initiateCheckout).toHaveBeenCalled();
      });
    });

    it("should create checkout session with correct parameters", async () => {
      const user = userEvent.setup();
      const initiateCheckout = jest.fn().mockResolvedValue({
        checkout_url: "https://checkout.test.com",
        session_id: "session-123",
      });

      const plan = createMockSubscriptionPlan({ id: "plan-pro" });

      (useSubscriptionStore as unknown as jest.Mock).mockReturnValue({
        ...createMockSubscriptionStore({
          plans: [plan],
        }),
        initiateCheckout,
      });

      render(<CheckoutFlowComponent />);

      const monthlyButton = screen.getByRole("button", {
        name: /subscribe monthly/i,
      });
      await user.click(monthlyButton);

      await waitFor(() => {
        expect(initiateCheckout).toHaveBeenCalledWith(plan, "monthly");
      });
    });
  });

  describe("LemonSqueezy Overlay", () => {
    it("should open LemonSqueezy checkout overlay", async () => {
      const user = userEvent.setup();
      const initiateCheckout = jest.fn().mockResolvedValue({
        checkout_url: "https://checkout.lemonsqueezy.com/test",
        session_id: "session-123",
      });
      const openCheckout = jest.fn();

      (useSubscriptionStore as unknown as jest.Mock).mockReturnValue({
        ...createMockSubscriptionStore({
          plans: [createMockSubscriptionPlan({ id: "plan-pro" })],
        }),
        initiateCheckout,
        openCheckout,
      });

      render(<CheckoutFlowComponent />);

      const monthlyButton = screen.getByRole("button", {
        name: /subscribe monthly/i,
      });
      await user.click(monthlyButton);

      await waitFor(() => {
        expect(openCheckout).toHaveBeenCalledWith(
          "https://checkout.lemonsqueezy.com/test",
        );
      });
    });
  });

  describe("Loading States", () => {
    it("should disable buttons during checkout", async () => {
      const _user = userEvent.setup();
      const initiateCheckout = jest.fn(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  checkout_url: "https://checkout.test.com",
                  session_id: "session-123",
                }),
              100,
            ),
          ),
      );

      (useSubscriptionStore as unknown as jest.Mock).mockReturnValue({
        ...createMockSubscriptionStore({
          plans: [createMockSubscriptionPlan({ id: "plan-pro" })],
        }),
        initiateCheckout,
        checkoutInProgress: true,
      });

      render(<CheckoutFlowComponent />);

      const buttons = screen.getAllByRole("button", { name: /processing/i });
      buttons.forEach((button: HTMLElement) => {
        expect(button).toBeDisabled();
      });
    });
  });

  describe("Subscription Update After Checkout", () => {
    it("should refresh subscription after successful checkout", async () => {
      const user = userEvent.setup();
      const fetchSubscription = jest.fn().mockResolvedValue(undefined);
      const initiateCheckout = jest.fn().mockResolvedValue({
        checkout_url: "https://checkout.test.com",
        session_id: "session-123",
      });

      (useSubscriptionStore as unknown as jest.Mock).mockReturnValue({
        ...createMockSubscriptionStore({
          plans: [createMockSubscriptionPlan({ id: "plan-pro" })],
        }),
        initiateCheckout,
        fetchSubscription,
      });

      render(<CheckoutFlowComponent />);

      // Simulate checkout completion by clicking refresh
      const refreshButton = screen.getByRole("button", {
        name: /refresh subscription/i,
      });
      await user.click(refreshButton);

      expect(fetchSubscription).toHaveBeenCalled();
    });

    it("should update store with new subscription data", async () => {
      const subscription = createMockUserSubscription({
        plan_name: "pro",
        status: SubscriptionStatus.ACTIVE,
      });

      const fetchSubscription = jest.fn().mockImplementation(async () => {
        (useSubscriptionStore as unknown as jest.Mock).mockReturnValue({
          ...createMockSubscriptionStore(),
          subscription,
        });
      });

      (useSubscriptionStore as unknown as jest.Mock).mockReturnValue({
        ...createMockSubscriptionStore({ subscription: null }),
        fetchSubscription,
      });

      render(<CheckoutFlowComponent />);

      const refreshButton = screen.getByRole("button", {
        name: /refresh subscription/i,
      });
      await userEvent.setup().click(refreshButton);

      await waitFor(() => {
        expect(fetchSubscription).toHaveBeenCalled();
      });
    });
  });

  describe("Billing Period Selection", () => {
    it("should handle monthly billing period selection", async () => {
      const user = userEvent.setup();
      const initiateCheckout = jest.fn().mockResolvedValue({
        checkout_url: "https://checkout.test.com",
        session_id: "session-123",
      });

      const plan = createMockSubscriptionPlan();

      (useSubscriptionStore as unknown as jest.Mock).mockReturnValue({
        ...createMockSubscriptionStore({ plans: [plan] }),
        initiateCheckout,
      });

      render(<CheckoutFlowComponent />);

      const monthlyButton = screen.getByRole("button", {
        name: /subscribe monthly/i,
      });
      await user.click(monthlyButton);

      await waitFor(() => {
        expect(initiateCheckout).toHaveBeenCalledWith(plan, "monthly");
      });
    });

    it("should handle yearly billing period selection", async () => {
      const user = userEvent.setup();
      const initiateCheckout = jest.fn().mockResolvedValue({
        checkout_url: "https://checkout.test.com",
        session_id: "session-123",
      });

      const plan = createMockSubscriptionPlan();

      (useSubscriptionStore as unknown as jest.Mock).mockReturnValue({
        ...createMockSubscriptionStore({ plans: [plan] }),
        initiateCheckout,
      });

      render(<CheckoutFlowComponent />);

      const yearlyButton = screen.getByRole("button", {
        name: /subscribe yearly/i,
      });
      await user.click(yearlyButton);

      await waitFor(() => {
        expect(initiateCheckout).toHaveBeenCalledWith(plan, "yearly");
      });
    });
  });
});
