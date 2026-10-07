import { act, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import CreateWorkspacePage from "@/app/w/create/page";
import { subscriptionQueries } from "@/lib/query-keys";
import type { UsageReport } from "@/types/subscription";

jest.mock("@/components/workspace", () => ({
  WorkspaceCreateWizard: () => <div>Workspace details</div>,
}));

jest.mock("@/hooks/use-page-title", () => ({
  usePageTitle: jest.fn(),
}));

// The page reads GET /subscriptions/usage through its query; a request that never answers keeps
// a query with no data pending, as a slow network does.
const getUsageStats = jest.fn();
jest.mock("@/lib/api-client", () => ({
  apiClient: {
    subscriptions: { getUsageStats: () => getUsageStats() },
  },
}));

beforeEach(() => {
  getUsageStats.mockReset();
  getUsageStats.mockImplementation(() => new Promise(() => {}));
});

const usage = (used: number, limit: number | null): UsageReport => ({
  workspaces: {
    used,
    limit,
    percentage: limit ? (used / limit) * 100 : 0,
    unlimited: limit === null,
  },
  members: { used: 1, limit: null, percentage: 0, unlimited: true },
});

function renderPage(report?: UsageReport) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  if (report) {
    queryClient.setQueryData(subscriptionQueries.usage().queryKey, report);
  }
  const view = render(
    <QueryClientProvider client={queryClient}>
      <CreateWorkspacePage />
    </QueryClientProvider>,
  );
  return { queryClient, ...view };
}

describe("CreateWorkspacePage", () => {
  it("shows a limit reached state when the plan workspace cap is already used", () => {
    renderPage(usage(1, 1));

    expect(
      screen.getAllByText(/workspace limit reached/i).length,
    ).toBeGreaterThan(0);
    expect(screen.queryByText(/workspace details/i)).not.toBeInTheDocument();
    expect(
      screen.getByText(/Your plan includes 1 workspace, and it's in use/),
    ).toBeInTheDocument();
  });

  it("waits for the limit check to finish before rendering the wizard", () => {
    renderPage();

    expect(screen.getByText(/checking workspace limits/i)).toBeInTheDocument();
    expect(
      screen.queryByText(/workspace limit reached/i),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/workspace details/i)).not.toBeInTheDocument();
  });

  it("counts the plan's workspaces", () => {
    renderPage(usage(1, 3));
    expect(
      screen.getByText(/1 of 3 workspaces on your plan/),
    ).toBeInTheDocument();
  });

  it("shows no count for a plan without a workspace limit", () => {
    renderPage(usage(2, null));
    expect(screen.queryByText(/on your plan/)).not.toBeInTheDocument();
    expect(screen.getByText(/workspace details/i)).toBeInTheDocument();
  });

  it("keeps the wizard mounted, and counts the new workspace, when creating the last allowed one", async () => {
    const { queryClient } = renderPage(usage(0, 1));
    expect(
      screen.getByText(/0 of 1 workspace on your plan/),
    ).toBeInTheDocument();

    // The wizard's refresh after creating: the usage now counts the new workspace.
    act(() => {
      queryClient.setQueryData(
        subscriptionQueries.usage().queryKey,
        usage(1, 1),
      );
    });

    // The query tells its observers on the next tick.
    await waitFor(() =>
      expect(
        screen.getByText(/1 of 1 workspace on your plan/),
      ).toBeInTheDocument(),
    );
    expect(screen.getByText(/workspace details/i)).toBeInTheDocument();
    expect(
      screen.queryByText(/workspace limit reached/i),
    ).not.toBeInTheDocument();
  });

  it("keeps the wizard mounted when the usage is read again after a failed first read", async () => {
    getUsageStats.mockRejectedValueOnce(new Error("Service unavailable"));
    const { queryClient } = renderPage();
    // The failed read decides the gate: the form shows, without a count.
    expect(await screen.findByText(/workspace details/i)).toBeInTheDocument();
    expect(screen.queryByText(/on your plan/)).not.toBeInTheDocument();

    // The wizard's refresh once the workspace exists: a query with no data goes back to pending.
    await act(async () => {
      void queryClient.invalidateQueries({
        queryKey: subscriptionQueries.usage().queryKey,
      });
      // The query tells the page on the next tick: let it render that state.
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(
      queryClient.getQueryState(subscriptionQueries.usage().queryKey)?.status,
    ).toBe("pending");
    expect(screen.getByText(/workspace details/i)).toBeInTheDocument();
    expect(
      screen.queryByText(/checking workspace limits/i),
    ).not.toBeInTheDocument();
  });
});
