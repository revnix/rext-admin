import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import WorkspaceContentPage from "@/app/w/[workspaceSlug]/content/page";

// The workspace as the provider has it: null until its record has loaded.
let workspace: { id: string; name: string } | null = null;
let workspaceError: Error | null = null;
jest.mock("@/providers/workspace-provider", () => ({
  useWorkspace: () => ({
    workspace,
    workspaceSlug: "acme",
    error: workspaceError,
  }),
}));
jest.mock("@/hooks/use-permission", () => ({
  useWorkspacePermission: () => ({ hasPermission: true, isLoading: false }),
}));
jest.mock("@/hooks/use-page-title", () => ({ usePageTitle: jest.fn() }));
jest.mock("@/components/permission/permission-guard", () => ({
  PermissionGuard: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock("@/stores/subscription-store", () => ({
  useSubscriptionStore: () => ({ fetchCredits: jest.fn() }),
}));

const listContent = jest.fn();
jest.mock("@/lib/api-client", () => ({
  apiClient: {
    content: { list: (...args: unknown[]) => listContent(...args) },
    personas: { list: jest.fn().mockResolvedValue({ personas: [] }) },
  },
}));

const renderPage = (searchParams = "") =>
  render(
    <NuqsTestingAdapter searchParams={searchParams}>
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { queries: { retry: false } } })
        }
      >
        <WorkspaceContentPage />
      </QueryClientProvider>
    </NuqsTestingAdapter>,
  );

beforeEach(() => {
  listContent.mockReset();
  workspace = null;
  workspaceError = null;
});

describe("The content list before its workspace has loaded", () => {
  it('shows its skeleton, not "No content yet"', async () => {
    const { container } = renderPage();

    // The table's skeleton shows after 200 ms (useShowAfter).
    await waitFor(() =>
      expect(
        container.querySelector('[data-slot="skeleton"]'),
      ).toBeInTheDocument(),
    );
    expect(screen.queryByText("No content yet")).toBeNull();
    expect(listContent).not.toHaveBeenCalled();
  });

  it('says "No content yet" once an empty workspace has answered', async () => {
    workspace = { id: "w1", name: "Acme" };
    listContent.mockResolvedValue({ content: [], total_count: 0 });
    renderPage();

    expect(await screen.findByText("No content yet")).toBeInTheDocument();
    expect(listContent).toHaveBeenCalledWith("w1", expect.anything());
  });

  it("says the content didn't load when the workspace couldn't be read, not an endless skeleton", async () => {
    workspaceError = new Error("Bad gateway");
    renderPage();

    expect(await screen.findByText("Content didn't load")).toBeInTheDocument();
    expect(screen.queryByText("No content yet")).toBeNull();
  });

  it("keeps the loaded list when a background refetch of the workspace fails", async () => {
    workspace = { id: "w1", name: "Acme" };
    workspaceError = new Error("Bad gateway");
    listContent.mockResolvedValue({ content: [], total_count: 0 });
    renderPage();

    expect(await screen.findByText("No content yet")).toBeInTheDocument();
    expect(screen.queryByText("Content didn't load")).toBeNull();
  });
});

describe("The content list on the server (rext-control#381)", () => {
  it("asks the backend for one page, with the URL's search, filters and sort", async () => {
    workspace = { id: "w1", name: "Acme" };
    listContent.mockResolvedValue({ content: [], total_count: 0 });
    renderPage("?q=seo&status=draft,review&sort=title.asc&page=2");

    await waitFor(() =>
      expect(listContent).toHaveBeenCalledWith("w1", {
        q: "seo",
        status: ["draft", "review"],
        persona: [],
        sort: "title.asc",
        limit: 25,
        offset: 25,
      }),
    );
  });
});
