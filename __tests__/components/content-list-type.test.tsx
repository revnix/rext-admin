import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
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

const renderPage = () =>
  render(
    <NuqsTestingAdapter>
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { queries: { retry: false } } })
        }
      >
        <WorkspaceContentPage />
      </QueryClientProvider>
    </NuqsTestingAdapter>,
  );

const ARTICLE = {
  workspace_id: "w1",
  created_by_user_id: "u1",
  slug: "",
  status: "draft",
  content_language: "en",
  created_at: "2026-10-07T10:00:00Z",
};

beforeEach(() => {
  listContent.mockReset();
  workspace = { id: "w1", name: "Acme" };
  workspaceError = null;
});

describe("The content library's Type column (D2c #468)", () => {
  it("names each article's type as Generate does, and an older article's as unknown", async () => {
    listContent.mockResolvedValue({
      content: [
        {
          ...ARTICLE,
          id: "a1",
          title: "How to plan a content calendar",
          content_type: "how-to-guide",
        },
        { ...ARTICLE, id: "a2", title: "Saved before types were kept" },
      ],
      total_count: 2,
    });
    renderPage();

    // The table, and under 640 px the same rows as cards.
    await screen.findAllByText("How to plan a content calendar");
    const table = screen.getByRole("table");
    const typed = within(table)
      .getByText("How to plan a content calendar")
      .closest("tr");
    const older = within(table)
      .getByText("Saved before types were kept")
      .closest("tr");
    expect(
      within(table).getByRole("columnheader", { name: /Type/ }),
    ).toBeInTheDocument();
    expect(
      within(typed as HTMLElement).getByText("How-to guide"),
    ).toBeInTheDocument();
    expect(within(typed as HTMLElement).queryByText("how-to-guide")).toBeNull();
    expect(
      within(older as HTMLElement).getAllByText("—").length,
    ).toBeGreaterThan(0);
    expect(screen.getByText(/^How-to guide · /)).toBeInTheDocument();
  });
});
