/**
 * Tests for CustomerPortalButton Component
 */

import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CustomerPortalButton } from "@/components/subscription/customer-portal-button";
import { apiClient } from "@/lib/api-client";
import { useSubscriptionStore } from "@/stores/subscription-store";
import {
  createMockSubscriptionStore,
  createMockUserSubscription,
  render,
} from "../../utils/test-utils";

// Mock dependencies
jest.mock("@/lib/api-client");
jest.mock("@/stores/subscription-store");

// Mock window.open
const mockWindowOpen = jest.fn();
window.open = mockWindowOpen;

describe("CustomerPortalButton", () => {
  const mockStore = createMockSubscriptionStore();

  beforeEach(() => {
    jest.clearAllMocks();
    mockWindowOpen.mockClear();
    (useSubscriptionStore as unknown as jest.Mock).mockReturnValue(mockStore);
  });

  describe("Rendering", () => {
    it("should render with default text", () => {
      render(<CustomerPortalButton />);
      expect(
        screen.getByRole("button", { name: /manage billing/i }),
      ).toBeInTheDocument();
    });

    it("should render with custom text", () => {
      render(<CustomerPortalButton>Custom Text</CustomerPortalButton>);
      expect(
        screen.getByRole("button", { name: /custom text/i }),
      ).toBeInTheDocument();
    });

    it("should render with icon by default", () => {
      const { container } = render(<CustomerPortalButton />);
      expect(container.querySelector("svg")).toBeInTheDocument();
    });

    it("should render without icon when showIcon is false", () => {
      const { container } = render(<CustomerPortalButton showIcon={false} />);
      expect(container.querySelector("svg")).not.toBeInTheDocument();
    });

    it("should be disabled when no subscription exists", () => {
      (useSubscriptionStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        subscription: null,
      });

      render(<CustomerPortalButton />);
      expect(screen.getByRole("button")).toBeDisabled();
    });
  });

  describe("Portal URL Generation", () => {
    it("should fetch portal URL from API when clicked", async () => {
      const user = userEvent.setup();
      const subscription = createMockUserSubscription({
        customer_portal_url: undefined,
      });
      const mockGetPortalUrl = jest.fn().mockResolvedValue({
        portal_url: "https://portal.lemonsqueezy.com/generated",
      });

      (apiClient.subscriptions.getCustomerPortalUrl as jest.Mock) =
        mockGetPortalUrl;

      (useSubscriptionStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        subscription,
      });

      render(<CustomerPortalButton />);

      const button = screen.getByRole("button");
      await user.click(button);

      await waitFor(() => {
        expect(mockGetPortalUrl).toHaveBeenCalled();
      });
    });

    it("should open portal URL in new tab", async () => {
      const user = userEvent.setup();
      const mockGetPortalUrl = jest.fn().mockResolvedValue({
        portal_url: "https://portal.lemonsqueezy.com/test",
      });

      (apiClient.subscriptions.getCustomerPortalUrl as jest.Mock) =
        mockGetPortalUrl;

      render(<CustomerPortalButton />);

      const button = screen.getByRole("button");
      await user.click(button);

      await waitFor(() => {
        expect(mockWindowOpen).toHaveBeenCalledWith(
          "https://portal.lemonsqueezy.com/test",
          "_blank",
          "noopener,noreferrer",
        );
      });
    });

    it("should use direct portal URL if available in subscription", async () => {
      const user = userEvent.setup();
      const subscription = createMockUserSubscription({
        customer_portal_url: "https://portal.lemonsqueezy.com/direct",
      });

      (useSubscriptionStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        subscription,
      });

      render(<CustomerPortalButton />);

      const button = screen.getByRole("button");
      await user.click(button);

      expect(mockWindowOpen).toHaveBeenCalledWith(
        "https://portal.lemonsqueezy.com/direct",
        "_blank",
        "noopener,noreferrer",
      );
    });
  });

  describe("Loading States", () => {
    it("should show loading state while fetching portal URL", async () => {
      const user = userEvent.setup();
      const subscription = createMockUserSubscription({
        customer_portal_url: undefined,
      });
      const mockGetPortalUrl = jest.fn(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () => resolve({ portal_url: "https://portal.test.com" }),
              100,
            ),
          ),
      );

      (apiClient.subscriptions.getCustomerPortalUrl as jest.Mock) =
        mockGetPortalUrl;

      (useSubscriptionStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        subscription,
      });

      render(<CustomerPortalButton />);

      const button = screen.getByRole("button");
      await user.click(button);

      expect(screen.getByText(/opening/i)).toBeInTheDocument();
      expect(button).toBeDisabled();
    });
  });

  describe("Error Handling", () => {
    it("should handle API errors gracefully", async () => {
      const user = userEvent.setup();
      const subscription = createMockUserSubscription({
        customer_portal_url: undefined,
      });
      const mockGetPortalUrl = jest
        .fn()
        .mockRejectedValue(new Error("API Error"));

      (apiClient.subscriptions.getCustomerPortalUrl as jest.Mock) =
        mockGetPortalUrl;

      const onError = jest.fn();
      (useSubscriptionStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        subscription,
      });

      render(<CustomerPortalButton onError={onError} />);

      const button = screen.getByRole("button");
      await user.click(button);

      await waitFor(
        () => {
          expect(onError).toHaveBeenCalled();
        },
        { timeout: 3000 },
      );

      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should handle missing portal URL in response", async () => {
      const user = userEvent.setup();
      const subscription = createMockUserSubscription({
        customer_portal_url: undefined,
      });
      const mockGetPortalUrl = jest.fn().mockResolvedValue({});

      (apiClient.subscriptions.getCustomerPortalUrl as jest.Mock) =
        mockGetPortalUrl;

      const onError = jest.fn();
      (useSubscriptionStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        subscription,
      });

      render(<CustomerPortalButton onError={onError} />);

      const button = screen.getByRole("button");
      await user.click(button);

      await waitFor(
        () => {
          expect(onError).toHaveBeenCalled();
        },
        { timeout: 3000 },
      );

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("portal"),
        }),
      );
    });
  });

  describe("Callbacks", () => {
    it("should call onOpen callback when portal opens successfully", async () => {
      const user = userEvent.setup();
      const mockGetPortalUrl = jest.fn().mockResolvedValue({
        portal_url: "https://portal.test.com",
      });

      (apiClient.subscriptions.getCustomerPortalUrl as jest.Mock) =
        mockGetPortalUrl;

      const onOpen = jest.fn();
      render(<CustomerPortalButton onOpen={onOpen} />);

      const button = screen.getByRole("button");
      await user.click(button);

      await waitFor(() => {
        expect(onOpen).toHaveBeenCalled();
      });
    });
  });

  describe("Variants", () => {
    it("should render with different button variants", () => {
      const { rerender } = render(<CustomerPortalButton variant="default" />);
      expect(screen.getByRole("button")).toBeInTheDocument();

      rerender(<CustomerPortalButton variant="outline" />);
      expect(screen.getByRole("button")).toBeInTheDocument();

      rerender(<CustomerPortalButton variant="ghost" />);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("should render with different sizes", () => {
      const { rerender } = render(<CustomerPortalButton size="sm" />);
      expect(screen.getByRole("button")).toBeInTheDocument();

      rerender(<CustomerPortalButton size="default" />);
      expect(screen.getByRole("button")).toBeInTheDocument();

      rerender(<CustomerPortalButton size="lg" />);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });
});
