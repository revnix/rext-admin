/**
 * Tests for CheckoutButton Component
 */

import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CheckoutButton } from "@/components/subscription/checkout-button";
import { useSubscriptionStore } from "@/stores/subscription-store";
import {
  createMockSubscriptionPlan,
  createMockSubscriptionStore,
  mockLemonSqueezy,
  render,
} from "../../utils/test-utils";

// Mock the subscription store
jest.mock("@/stores/subscription-store");

describe("CheckoutButton", () => {
  const mockPlan = createMockSubscriptionPlan();
  const mockStore = createMockSubscriptionStore();
  let _lemonSqueezyMocks: ReturnType<typeof mockLemonSqueezy>;

  beforeEach(() => {
    jest.clearAllMocks();
    _lemonSqueezyMocks = mockLemonSqueezy();
    (useSubscriptionStore as unknown as jest.Mock).mockReturnValue(mockStore);
  });

  describe("Rendering", () => {
    it("should render checkout button with plan name", () => {
      render(<CheckoutButton plan={mockPlan} billingPeriod="monthly" />);
      expect(
        screen.getByRole("button", { name: /subscribe/i }),
      ).toBeInTheDocument();
    });

    it("should display loading state when checkout is in progress", () => {
      (useSubscriptionStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        checkoutInProgress: true,
      });

      render(<CheckoutButton plan={mockPlan} billingPeriod="monthly" />);
      expect(screen.getByRole("button")).toBeDisabled();
      expect(screen.getByText(/processing/i)).toBeInTheDocument();
    });
  });

  describe("Checkout Flow", () => {
    it("should initiate checkout when button is clicked", async () => {
      const user = userEvent.setup();
      const initiateCheckout = jest.fn().mockResolvedValue({
        checkout_url: "https://checkout.lemonsqueezy.com/test",
        session_id: "session-123",
      });

      (useSubscriptionStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        initiateCheckout,
      });

      render(<CheckoutButton plan={mockPlan} billingPeriod="monthly" />);

      const button = screen.getByRole("button");
      await user.click(button);

      await waitFor(() => {
        expect(initiateCheckout).toHaveBeenCalledWith(mockPlan, "monthly");
      });
    });

    it("should open LemonSqueezy overlay with checkout URL", async () => {
      const user = userEvent.setup();
      const initiateCheckout = jest.fn().mockResolvedValue({
        checkout_url: "https://checkout.lemonsqueezy.com/test",
        session_id: "session-123",
      });
      const openCheckout = jest.fn();

      (useSubscriptionStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        initiateCheckout,
        openCheckout,
      });

      render(<CheckoutButton plan={mockPlan} billingPeriod="monthly" />);

      const button = screen.getByRole("button");
      await user.click(button);

      await waitFor(() => {
        expect(openCheckout).toHaveBeenCalledWith(
          "https://checkout.lemonsqueezy.com/test",
        );
      });
    });

    it("should handle different billing periods", async () => {
      const user = userEvent.setup();
      const initiateCheckout = jest.fn().mockResolvedValue({
        checkout_url: "https://checkout.test.com",
        session_id: "session-123",
      });

      (useSubscriptionStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        initiateCheckout,
      });

      const { rerender } = render(
        <CheckoutButton plan={mockPlan} billingPeriod="monthly" />,
      );

      const button = screen.getByRole("button");
      await user.click(button);

      expect(initiateCheckout).toHaveBeenCalledWith(mockPlan, "monthly");

      initiateCheckout.mockClear();
      rerender(<CheckoutButton plan={mockPlan} billingPeriod="yearly" />);

      await user.click(button);
      expect(initiateCheckout).toHaveBeenCalledWith(mockPlan, "yearly");
    });
  });

  describe("Error Handling", () => {
    it("should handle checkout initiation errors", async () => {
      const user = userEvent.setup();
      const initiateCheckout = jest
        .fn()
        .mockRejectedValue(new Error("Checkout failed"));

      (useSubscriptionStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        initiateCheckout,
        error: "Checkout failed",
      });

      render(<CheckoutButton plan={mockPlan} billingPeriod="monthly" />);

      const button = screen.getByRole("button");
      await user.click(button);

      await waitFor(() => {
        expect(initiateCheckout).toHaveBeenCalled();
      });
    });
  });

  describe("Disabled State", () => {
    it("should be disabled when loading", () => {
      (useSubscriptionStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        isLoading: true,
      });

      render(<CheckoutButton plan={mockPlan} billingPeriod="monthly" />);
      expect(screen.getByRole("button")).toBeDisabled();
    });

    it("should be disabled when checkout is in progress", () => {
      (useSubscriptionStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        checkoutInProgress: true,
      });

      render(<CheckoutButton plan={mockPlan} billingPeriod="monthly" />);
      expect(screen.getByRole("button")).toBeDisabled();
    });
  });
});
