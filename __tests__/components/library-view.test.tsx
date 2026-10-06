import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { LibraryView } from "@/components/keywords/library-view";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));
// The workspace as the provider has it: its record, or nothing yet, or the error reading it ended in.
let workspace: { id: string } | undefined = { id: "w1" };
let workspaceError: Error | null = null;
jest.mock("@/providers/workspace-provider", () => ({
  useWorkspace: () => ({
    workspace,
    workspaceSlug: "acme",
    error: workspaceError,
  }),
}));
jest.mock("@/hooks/use-auth-session", () => ({
  useAuthSession: () => ({ user: { id: "u1" } }),
}));
jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: { success: jest.fn(), error: jest.fn() } }),
}));

const granted = new Set<string>();
jest.mock("@/hooks/use-permission", () => ({
  useWorkspacePermission: (permission: string) => ({
    hasPermission: granted.has(permission),
    isLoading: false,
  }),
}));

const searchLibrary = jest.fn();
jest.mock("@/lib/generate-content/library-item", () => ({
  searchLibrary: (...args: unknown[]) => searchLibrary(...args),
  deleteLibraryItem: jest.fn(),
  libraryStartQuery: (key: string) => `library=${encodeURIComponent(key)}`,
}));

const renderLibrary = () =>
  render(
    <NuqsTestingAdapter>
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { queries: { retry: false } } })
        }
      >
        <LibraryView />
      </QueryClientProvider>
    </NuqsTestingAdapter>,
  );

beforeEach(() => {
  jest.clearAllMocks();
  granted.clear();
  workspace = { id: "w1" };
  workspaceError = null;
});

describe("LibraryView", () => {
  it("lists the saved research in the keyword table, with Use", async () => {
    granted.add("content.read");
    granted.add("content.create");
    searchLibrary.mockResolvedValue([
      {
        key: "library_seo tools_1",
        value: {
          original_query: "seo tools",
          recommendations: [],
          seo_state: {
            keyword_difficulty: 42,
            intent: ["commercial"],
            volume: 1200,
            volume_status: "ok",
            backlinks: 10,
            referring_domains: 4,
          },
          timestamp: "2026-10-05T09:00:00Z",
        },
      },
    ]);
    renderLibrary();

    const table = await screen.findByRole("table", {
      name: "Researched keywords",
    });
    expect(await within(table).findByText("seo tools")).toBeInTheDocument();
    expect(within(table).getByText("1.2K")).toBeInTheDocument();
    expect(
      within(table).getByRole("button", { name: "Use: seo tools" }),
    ).toBeInTheDocument();
    expect(searchLibrary).toHaveBeenCalledWith("u1", "w1");
  });

  it("reads nothing for a member who may not read the workspace's content", async () => {
    renderLibrary();
    expect(
      await screen.findByRole("heading", {
        name: "You can't see this workspace's keywords",
      }),
    ).toBeInTheDocument();
    expect(searchLibrary).not.toHaveBeenCalled();
  });

  it("offers no Use without the right to generate", async () => {
    granted.add("content.read");
    searchLibrary.mockResolvedValue([
      {
        key: "k1",
        value: {
          original_query: "crm",
          recommendations: [],
          seo_state: { keyword_difficulty: 5, intent: "informational" },
          timestamp: "2026-10-05T09:00:00Z",
        },
      },
    ]);
    renderLibrary();
    const table = await screen.findByRole("table", {
      name: "Researched keywords",
    });
    expect(await within(table).findByText("crm")).toBeInTheDocument();
    expect(within(table).queryByRole("button", { name: /^Use/ })).toBeNull();
  });

  it("waits for the workspace before it says anything", async () => {
    // A member's rights come with the workspace: before it, the global check refuses.
    workspace = undefined;
    const { container } = renderLibrary();
    await waitFor(() =>
      expect(
        container.querySelector('[data-slot="skeleton"]'),
      ).toBeInTheDocument(),
    );
    expect(screen.queryByText("No keywords yet")).toBeNull();
    expect(searchLibrary).not.toHaveBeenCalled();
  });

  it("says the keywords didn't load when the workspace couldn't be read", async () => {
    workspace = undefined;
    workspaceError = new Error("Bad gateway");
    renderLibrary();
    expect(
      await screen.findByText("Your keywords didn't load"),
    ).toBeInTheDocument();
    expect(screen.queryByText("No keywords yet")).toBeNull();
  });
});
