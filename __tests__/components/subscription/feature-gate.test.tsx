/**
 * Tests for FeatureGate Component
 */

import userEvent from "@testing-library/user-event";
import {
  FeatureGate,
  useFeatureAccess,
} from "@/components/subscription/feature-gate";
import { useSubscriptionStore } from "@/stores/subscription-store";
import {
  createMockSubscriptionStore,
  createMockUserSubscription,
  render,
  screen,
} from "../../utils/test-utils";

// Mock the subscription store
jest.mock("@/stores/subscription-store");

// Mock next/navigation
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe("FeatureGate", () => {
  const mockStore = createMockSubscriptionStore();

  beforeEach(() => {
    jest.clearAllMocks();
    (useSubscriptionStore as unknown as jest.Mock).mockReturnValue(mockStore);
  });

  describe("Loading State", () => {
    it("should show loading spinner when subscription is null", () => {
      (useSubscriptionStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        subscription: null,
      });

      render(
        <FeatureGate feature="advanced_ai">
          <div>Premium Content</div>
        </FeatureGate>,
      );

      expect(screen.getByRole("status", { hidden: true })).toBeInTheDocument();
    });
  });

  describe("Feature Access - Boolean Features", () => {
    it("should render children when user has boolean feature access", () => {
      const subscription = createMockUserSubscription({
        plan_features: {
          advanced_ai: true,
        },
      });

      (useSubscriptionStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        subscription,
      });

      render(
        <FeatureGate feature="advanced_ai">
          <div>Advanced AI Content</div>
        </FeatureGate>,
      );

      expect(screen.getByText("Advanced AI Content")).toBeInTheDocument();
    });

    it("should show upgrade prompt when user lacks boolean feature", () => {
      const subscription = createMockUserSubscription({
        plan_features: {
          advanced_ai: false,
        },
      });

      (useSubscriptionStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        subscription,
      });

      render(
        <FeatureGate feature="advanced_ai">
          <div>Advanced AI Content</div>
        </FeatureGate>,
      );

      expect(screen.queryByText("Advanced AI Content")).not.toBeInTheDocument();
      expect(screen.getByText("Upgrade Required")).toBeInTheDocument();
    });
  });

  describe("Feature Access - Numeric Features", () => {
    it("should grant access when numeric feature > 0", () => {
      const subscription = createMockUserSubscription({
        plan_features: {
          api_limit: 1000,
        },
      });

      (useSubscriptionStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        subscription,
      });

      render(
        <FeatureGate feature="api_limit">
          <div>API Access</div>
        </FeatureGate>,
      );

      expect(screen.getByText("API Access")).toBeInTheDocument();
    });

    it("should deny access when numeric feature is 0", () => {
      const subscription = createMockUserSubscription({
        plan_features: {
          api_limit: 0,
        },
      });

      (useSubscriptionStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        subscription,
      });

      render(
        <FeatureGate feature="api_limit">
          <div>API Access</div>
        </FeatureGate>,
      );

      expect(screen.queryByText("API Access")).not.toBeInTheDocument();
      expect(screen.getByText("Upgrade Required")).toBeInTheDocument();
    });
  });

  describe("Plan-Based Access", () => {
    it("should grant access when user is on required plan", () => {
      const subscription = createMockUserSubscription({
        plan_name: "pro",
      });

      (useSubscriptionStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        subscription,
      });

      render(
        <FeatureGate feature="test_feature" requiredPlan="pro">
          <div>Pro Content</div>
        </FeatureGate>,
      );

      expect(screen.getByText("Pro Content")).toBeInTheDocument();
    });

    it("should deny access when user is on wrong plan", () => {
      const subscription = createMockUserSubscription({
        plan_name: "free",
      });

      (useSubscriptionStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        subscription,
      });

      render(
        <FeatureGate feature="test_feature" requiredPlan="pro">
          <div>Pro Content</div>
        </FeatureGate>,
      );

      expect(screen.queryByText("Pro Content")).not.toBeInTheDocument();
      expect(screen.getByText("Upgrade Required")).toBeInTheDocument();
    });

    it("should grant access when user is on one of multiple required plans", () => {
      const subscription = createMockUserSubscription({
        plan_name: "enterprise",
      });

      (useSubscriptionStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        subscription,
      });

      render(
        <FeatureGate
          feature="test_feature"
          requiredPlan={["pro", "enterprise"]}
        >
          <div>Premium Content</div>
        </FeatureGate>,
      );

      expect(screen.getByText("Premium Content")).toBeInTheDocument();
    });
  });

  describe("Soft Gate Mode", () => {
    it("should show warning and children in soft mode", () => {
      const subscription = createMockUserSubscription({
        plan_features: {
          test_feature: false,
        },
      });

      (useSubscriptionStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        subscription,
      });

      render(
        <FeatureGate
          feature="test_feature"
          soft={true}
          upgradeDescription="This feature is limited"
        >
          <div>Limited Content</div>
        </FeatureGate>,
      );

      expect(screen.getByText("Limited Content")).toBeInTheDocument();
      expect(screen.getByText(/This feature is limited/)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /upgrade/i }),
      ).toBeInTheDocument();
    });
  });

  describe("Display Modes", () => {
    it("should render as inline alert when mode is inline", () => {
      const subscription = createMockUserSubscription({
        plan_features: {
          test_feature: false,
        },
      });

      (useSubscriptionStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        subscription,
      });

      const { container } = render(
        <FeatureGate feature="test_feature" mode="inline">
          <div>Content</div>
        </FeatureGate>,
      );

      expect(container.querySelector('[role="alert"]')).toBeInTheDocument();
      expect(screen.getByText("Feature Locked")).toBeInTheDocument();
    });

    it("should render as card when mode is card (default)", () => {
      const subscription = createMockUserSubscription({
        plan_features: {
          test_feature: false,
        },
      });

      (useSubscriptionStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        subscription,
      });

      render(
        <FeatureGate feature="test_feature" mode="card">
          <div>Content</div>
        </FeatureGate>,
      );

      expect(screen.getByText("Upgrade Required")).toBeInTheDocument();
      expect(
        screen.getByText(/not available on your current plan/),
      ).toBeInTheDocument();
    });
  });

  describe("Custom Messaging", () => {
    it("should display custom upgrade title and description", () => {
      const subscription = createMockUserSubscription({
        plan_features: {
          test_feature: false,
        },
      });

      (useSubscriptionStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        subscription,
      });

      render(
        <FeatureGate
          feature="test_feature"
          upgradeTitle="Custom Title"
          upgradeDescription="Custom description text"
        >
          <div>Content</div>
        </FeatureGate>,
      );

      expect(screen.getByText("Custom Title")).toBeInTheDocument();
      expect(screen.getByText("Custom description text")).toBeInTheDocument();
    });
  });

  describe("Custom Fallback", () => {
    it("should render custom fallback instead of default prompt", () => {
      const subscription = createMockUserSubscription({
        plan_features: {
          test_feature: false,
        },
      });

      (useSubscriptionStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        subscription,
      });

      render(
        <FeatureGate
          feature="test_feature"
          fallback={<div>Custom Fallback UI</div>}
        >
          <div>Content</div>
        </FeatureGate>,
      );

      expect(screen.getByText("Custom Fallback UI")).toBeInTheDocument();
      expect(screen.queryByText("Upgrade Required")).not.toBeInTheDocument();
    });
  });

  describe("User Interactions", () => {
    it("should navigate to pricing page when upgrade button is clicked", async () => {
      const user = userEvent.setup();
      const subscription = createMockUserSubscription({
        plan_features: {
          test_feature: false,
        },
      });

      (useSubscriptionStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        subscription,
      });

      render(
        <FeatureGate feature="test_feature">
          <div>Content</div>
        </FeatureGate>,
      );

      const upgradeButton = screen.getByRole("button", { name: /view plans/i });
      await user.click(upgradeButton);

      expect(mockPush).toHaveBeenCalledWith("/pricing");
    });

    it("should navigate to subscription management when manage button is clicked", async () => {
      const user = userEvent.setup();
      const subscription = createMockUserSubscription({
        plan_features: {
          test_feature: false,
        },
      });

      (useSubscriptionStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        subscription,
      });

      render(
        <FeatureGate feature="test_feature">
          <div>Content</div>
        </FeatureGate>,
      );

      const manageButton = screen.getByRole("button", {
        name: /manage subscription/i,
      });
      await user.click(manageButton);

      expect(mockPush).toHaveBeenCalledWith("/dashboard/subscription");
    });

    it("should refresh subscription when refresh link is clicked", async () => {
      const user = userEvent.setup();
      const subscription = createMockUserSubscription({
        plan_features: {
          test_feature: false,
        },
      });

      const fetchSubscription = jest.fn();
      (useSubscriptionStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        subscription,
        fetchSubscription,
      });

      render(
        <FeatureGate feature="test_feature">
          <div>Content</div>
        </FeatureGate>,
      );

      const refreshButton = screen.getByRole("button", {
        name: /refresh subscription/i,
      });
      await user.click(refreshButton);

      expect(fetchSubscription).toHaveBeenCalled();
    });
  });

  describe("Default Access Behavior", () => {
    it("should grant access when feature is not found in plan features", () => {
      const subscription = createMockUserSubscription({
        plan_features: {},
      });

      (useSubscriptionStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        subscription,
      });

      render(
        <FeatureGate feature="nonexistent_feature">
          <div>Content</div>
        </FeatureGate>,
      );

      expect(screen.getByText("Content")).toBeInTheDocument();
    });
  });
});

describe("useFeatureAccess Hook", () => {
  const TestComponent = ({
    feature,
    requiredPlan,
  }: {
    feature: string;
    requiredPlan?: string | string[];
  }) => {
    const hasAccess = useFeatureAccess(feature, requiredPlan);
    return (
      <div>
        {hasAccess === null && "Loading..."}
        {hasAccess === true && "Access Granted"}
        {hasAccess === false && "Access Denied"}
      </div>
    );
  };

  const mockStore = createMockSubscriptionStore();

  beforeEach(() => {
    (useSubscriptionStore as unknown as jest.Mock).mockReturnValue(mockStore);
  });

  it("should return null when subscription is loading", () => {
    (useSubscriptionStore as unknown as jest.Mock).mockReturnValue({
      ...mockStore,
      subscription: null,
    });

    render(<TestComponent feature="test_feature" />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("should return true when feature is available", () => {
    const subscription = createMockUserSubscription({
      plan_features: {
        test_feature: true,
      },
    });

    (useSubscriptionStore as unknown as jest.Mock).mockReturnValue({
      ...mockStore,
      subscription,
    });

    render(<TestComponent feature="test_feature" />);
    expect(screen.getByText("Access Granted")).toBeInTheDocument();
  });

  it("should return false when feature is not available", () => {
    const subscription = createMockUserSubscription({
      plan_features: {
        test_feature: false,
      },
    });

    (useSubscriptionStore as unknown as jest.Mock).mockReturnValue({
      ...mockStore,
      subscription,
    });

    render(<TestComponent feature="test_feature" />);
    expect(screen.getByText("Access Denied")).toBeInTheDocument();
  });

  it("should respect plan requirements", () => {
    const subscription = createMockUserSubscription({
      plan_name: "free",
    });

    (useSubscriptionStore as unknown as jest.Mock).mockReturnValue({
      ...mockStore,
      subscription,
    });

    render(<TestComponent feature="test_feature" requiredPlan="pro" />);
    expect(screen.getByText("Access Denied")).toBeInTheDocument();
  });
});
