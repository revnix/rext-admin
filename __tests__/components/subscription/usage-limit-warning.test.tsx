/**
 * Tests for UsageLimitWarning Component and useResourceLimit Hook
 */

import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  UsageLimitWarning,
  useResourceLimit,
} from "@/components/subscription/usage-limit-warning";
import { useSubscriptionStore } from "@/stores/subscription-store";
import {
  createMockSubscriptionStore,
  createMockUsageStats,
  createMockUserSubscription,
  render,
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

// Mock localStorage
const mockSetItem = jest.fn();
Object.defineProperty(window, "localStorage", {
  value: {
    getItem: jest.fn(),
    setItem: mockSetItem,
  },
  writable: true,
});

describe("UsageLimitWarning", () => {
  const mockStore = createMockSubscriptionStore();

  beforeEach(() => {
    jest.clearAllMocks();
    mockSetItem.mockClear();
    (useSubscriptionStore as unknown as jest.Mock).mockReturnValue(mockStore);
  });

  describe("Threshold Display Logic", () => {
    it("should not display when usage is below warning threshold (< 75%)", () => {
      const usage = createMockUsageStats({
        current_workspaces: 7,
        max_workspaces: 10,
        workspaces_usage_percent: 70,
      });

      (useSubscriptionStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        usage,
      });

      const { container } = render(<UsageLimitWarning resource="workspaces" />);

      expect(container.firstChild).toBeNull();
    });

    it("should display warning when usage is at 75%", () => {
      const usage = createMockUsageStats({
        current_workspaces: 8,
        max_workspaces: 10,
        workspaces_usage_percent: 80,
      });

      (useSubscriptionStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        usage,
      });

      render(<UsageLimitWarning resource="workspaces" />);

      expect(screen.getByText(/Workspaces Usage Warning/)).toBeInTheDocument();
      expect(screen.getByText(/80%/)).toBeInTheDocument();
    });

    it("should display critical warning when usage is at 90%", () => {
      const usage = createMockUsageStats({
        current_workspaces: 9,
        max_workspaces: 10,
        workspaces_usage_percent: 90,
      });

      (useSubscriptionStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        usage,
      });

      render(<UsageLimitWarning resource="workspaces" />);

      expect(
        screen.getByText(/Workspaces Limit Almost Reached/),
      ).toBeInTheDocument();
      expect(screen.getByText(/90/)).toBeInTheDocument();
    });

    it("should display exceeded warning when usage is at 100%", () => {
      const usage = createMockUsageStats({
        current_workspaces: 10,
        max_workspaces: 10,
        workspaces_usage_percent: 100,
      });

      (useSubscriptionStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        usage,
      });

      render(<UsageLimitWarning resource="workspaces" />);

      expect(screen.getByText(/Workspaces Limit Exceeded/)).toBeInTheDocument();
      expect(screen.getByText(/Upgrade to continue/)).toBeInTheDocument();
    });
  });

  describe("Resource Types", () => {
    it("should handle topics resource", () => {
      const usage = createMockUsageStats({
        current_topics: 80,
        max_topics: 100,
        topics_usage_percent: 80,
      });

      (useSubscriptionStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        usage,
      });

      render(<UsageLimitWarning resource="topics" />);

      expect(screen.getByText(/Topics/)).toBeInTheDocument();
      expect(screen.getByText("80 / 100")).toBeInTheDocument();
    });

    it("should handle knowledge_items resource", () => {
      const usage = createMockUsageStats({
        current_knowledge_items: 450,
        max_knowledge_items: 500,
        knowledge_items_usage_percent: 90,
      });

      (useSubscriptionStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        usage,
      });

      render(<UsageLimitWarning resource="knowledge_items" />);

      expect(screen.getByText(/Knowledge Items/)).toBeInTheDocument();
      expect(screen.getByText("450 / 500")).toBeInTheDocument();
    });

    it("should handle ai_requests resource", () => {
      const usage = createMockUsageStats({
        current_api_calls: 9000,
        max_api_calls_per_month: 10000,
        api_calls_usage_percent: 90,
      });

      (useSubscriptionStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        usage,
      });

      render(<UsageLimitWarning resource="ai_requests" />);

      expect(screen.getByText(/AI Requests/)).toBeInTheDocument();
      expect(screen.getByText("9000 / 10000")).toBeInTheDocument();
    });
  });

  describe("Unlimited Resources", () => {
    it("should not display when limit is -1 (unlimited)", () => {
      const subscription = createMockUserSubscription({
        plan_limits: {
          max_workspaces: -1,
          max_members_per_workspace: 5,
          max_topics: 100,
          max_knowledge_items: 500,
          max_api_calls_per_month: 10000,
        },
      });

      (useSubscriptionStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        subscription,
      });

      const { container } = render(<UsageLimitWarning resource="workspaces" />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe("Custom Thresholds", () => {
    it("should respect custom warning threshold", () => {
      const usage = createMockUsageStats({
        current_workspaces: 5,
        max_workspaces: 10,
        workspaces_usage_percent: 50,
      });

      (useSubscriptionStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        usage,
      });

      render(<UsageLimitWarning resource="workspaces" warningThreshold={50} />);

      expect(screen.getByText(/Workspaces Usage Warning/)).toBeInTheDocument();
    });

    it("should respect custom critical threshold", () => {
      const usage = createMockUsageStats({
        current_workspaces: 8,
        max_workspaces: 10,
        workspaces_usage_percent: 80,
      });

      (useSubscriptionStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        usage,
      });

      render(
        <UsageLimitWarning resource="workspaces" criticalThreshold={80} />,
      );

      expect(
        screen.getByText(/Workspaces Limit Almost Reached/),
      ).toBeInTheDocument();
    });
  });

  describe("Compact Mode", () => {
    it("should render compact alert", () => {
      const usage = createMockUsageStats({
        current_workspaces: 8,
        max_workspaces: 10,
        workspaces_usage_percent: 80,
      });

      (useSubscriptionStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        usage,
      });

      render(<UsageLimitWarning resource="workspaces" compact={true} />);

      expect(screen.getByText(/Workspaces:/)).toBeInTheDocument();
      expect(screen.getByText(/8 \/ 10/)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /upgrade/i }),
      ).toBeInTheDocument();
    });
  });

  describe("Progress Bar", () => {
    it("should show progress bar by default", () => {
      const usage = createMockUsageStats({
        current_workspaces: 8,
        max_workspaces: 10,
        workspaces_usage_percent: 80,
      });

      (useSubscriptionStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        usage,
      });

      const { container } = render(<UsageLimitWarning resource="workspaces" />);

      expect(
        container.querySelector('[role="progressbar"]'),
      ).toBeInTheDocument();
    });

    it("should hide progress bar when showProgress is false", () => {
      const usage = createMockUsageStats({
        current_workspaces: 8,
        max_workspaces: 10,
        workspaces_usage_percent: 80,
      });

      (useSubscriptionStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        usage,
      });

      const { container } = render(
        <UsageLimitWarning resource="workspaces" showProgress={false} />,
      );

      expect(
        container.querySelector('[role="progressbar"]'),
      ).not.toBeInTheDocument();
    });
  });

  describe("Dismissible Behavior", () => {
    it("should be dismissible by default", () => {
      const usage = createMockUsageStats({
        current_workspaces: 8,
        max_workspaces: 10,
        workspaces_usage_percent: 80,
      });

      (useSubscriptionStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        usage,
      });

      render(<UsageLimitWarning resource="workspaces" />);

      const dismissButton = screen
        .getAllByRole("button")
        .find((btn) => btn.querySelector("svg"));
      expect(dismissButton).toBeInTheDocument();
    });

    it("should hide warning when dismissed", async () => {
      const user = userEvent.setup();
      const usage = createMockUsageStats({
        current_workspaces: 8,
        max_workspaces: 10,
        workspaces_usage_percent: 80,
      });

      (useSubscriptionStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        usage,
      });

      const { container } = render(<UsageLimitWarning resource="workspaces" />);

      const dismissButton = screen
        .getAllByRole("button")
        .find((btn) => btn.querySelector("svg"));

      if (dismissButton) {
        await user.click(dismissButton);
      }

      expect(container.firstChild).toBeNull();
      expect(mockSetItem).toHaveBeenCalledWith(
        "usage-warning-workspaces",
        expect.any(String),
      );
    });

    it("should not show dismiss button when dismissible is false", () => {
      const usage = createMockUsageStats({
        current_workspaces: 8,
        max_workspaces: 10,
        workspaces_usage_percent: 80,
      });

      (useSubscriptionStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        usage,
      });

      render(<UsageLimitWarning resource="workspaces" dismissible={false} />);

      const dismissButtons = screen
        .getAllByRole("button")
        .filter((btn) => btn.querySelector("svg"));
      expect(dismissButtons.length).toBe(0);
    });
  });

  describe("User Actions", () => {
    it("should navigate to pricing when upgrade button is clicked", async () => {
      const user = userEvent.setup();
      const usage = createMockUsageStats({
        current_workspaces: 9,
        max_workspaces: 10,
        workspaces_usage_percent: 90,
      });

      (useSubscriptionStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        usage,
      });

      render(<UsageLimitWarning resource="workspaces" />);

      const upgradeButton = screen.getByRole("button", {
        name: /upgrade plan/i,
      });
      await user.click(upgradeButton);

      expect(mockPush).toHaveBeenCalledWith("/pricing");
    });

    it("should navigate to subscription page when view usage is clicked", async () => {
      const user = userEvent.setup();
      const usage = createMockUsageStats({
        current_workspaces: 9,
        max_workspaces: 10,
        workspaces_usage_percent: 90,
      });

      (useSubscriptionStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        usage,
      });

      render(<UsageLimitWarning resource="workspaces" />);

      const viewUsageButton = screen.getByRole("button", {
        name: /view usage/i,
      });
      await user.click(viewUsageButton);

      expect(mockPush).toHaveBeenCalledWith("/dashboard/subscription");
    });
  });
});

describe("useResourceLimit Hook", () => {
  const TestComponent = ({
    resource,
  }: {
    resource:
      | "workspaces"
      | "topics"
      | "knowledge_items"
      | "ai_requests"
      | "storage";
  }) => {
    const { isLimitReached, usagePercentage, canCreate } =
      useResourceLimit(resource);
    return (
      <div>
        <div data-testid="limit-reached">
          {isLimitReached ? "true" : "false"}
        </div>
        <div data-testid="usage-percentage">{usagePercentage.toFixed(1)}</div>
        <div data-testid="can-create">{canCreate ? "true" : "false"}</div>
      </div>
    );
  };

  const mockStore = createMockSubscriptionStore();

  beforeEach(() => {
    (useSubscriptionStore as unknown as jest.Mock).mockReturnValue(mockStore);
  });

  it("should return false for isLimitReached when below limit", () => {
    const usage = createMockUsageStats({
      current_workspaces: 5,
      max_workspaces: 10,
    });

    (useSubscriptionStore as unknown as jest.Mock).mockReturnValue({
      ...mockStore,
      usage,
    });

    render(<TestComponent resource="workspaces" />);

    expect(screen.getByTestId("limit-reached")).toHaveTextContent("false");
    expect(screen.getByTestId("can-create")).toHaveTextContent("true");
  });

  it("should return true for isLimitReached when at limit", () => {
    const usage = createMockUsageStats({
      current_workspaces: 10,
      max_workspaces: 10,
    });

    (useSubscriptionStore as unknown as jest.Mock).mockReturnValue({
      ...mockStore,
      usage,
    });

    render(<TestComponent resource="workspaces" />);

    expect(screen.getByTestId("limit-reached")).toHaveTextContent("true");
    expect(screen.getByTestId("can-create")).toHaveTextContent("false");
  });

  it("should calculate usage percentage correctly", () => {
    const usage = createMockUsageStats({
      current_topics: 75,
      max_topics: 100,
    });

    (useSubscriptionStore as unknown as jest.Mock).mockReturnValue({
      ...mockStore,
      usage,
    });

    render(<TestComponent resource="topics" />);

    expect(screen.getByTestId("usage-percentage")).toHaveTextContent("75.0");
  });

  it("should handle unlimited resources (-1)", () => {
    const subscription = createMockUserSubscription({
      plan_limits: {
        max_workspaces: -1,
        max_members_per_workspace: 5,
        max_topics: 100,
        max_knowledge_items: 500,
        max_api_calls_per_month: 10000,
      },
    });

    (useSubscriptionStore as unknown as jest.Mock).mockReturnValue({
      ...mockStore,
      subscription,
    });

    render(<TestComponent resource="workspaces" />);

    expect(screen.getByTestId("limit-reached")).toHaveTextContent("false");
    expect(screen.getByTestId("usage-percentage")).toHaveTextContent("0.0");
    expect(screen.getByTestId("can-create")).toHaveTextContent("true");
  });
});
