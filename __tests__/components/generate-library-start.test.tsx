import { render, screen } from "@testing-library/react";
import GeneratePage from "@/app/w/[workspaceSlug]/generate_content/page";

// The address names the workspace by its slug; the Library is kept under its id.
const WORKSPACE_ID = "9f0c2d1e-5b7a-4c3e-8d21-6a4f0b9e1c77";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  useSearchParams: () => new URLSearchParams("library=library_seo%20tools_1"),
}));
jest.mock("@/providers/workspace-provider", () => ({
  useWorkspace: () => ({
    workspace: { id: WORKSPACE_ID, slug: "acme" },
    workspaceId: "acme",
    workspaceSlug: "acme",
  }),
}));
jest.mock("@/hooks/use-auth-session", () => ({
  useAuthSession: () => ({ user: { id: "u1" } }),
}));
jest.mock("@/hooks/use-permission", () => ({
  useWorkspacePermission: () => ({ hasPermission: true, isLoading: false }),
}));

const findLibraryItem = jest.fn();
jest.mock("@/lib/generate-content/library-item", () => ({
  findLibraryItem: (...args: unknown[]) => findLibraryItem(...args),
}));

jest.mock("@/stores/background-generation-store", () => {
  const state = { hasHydrated: true, jobs: [], replaceJobs: jest.fn() };
  const useStore = (selector: (s: typeof state) => unknown) => selector(state);
  useStore.getState = () => state;
  useStore.persist = { rehydrate: jest.fn() };
  return { useBackgroundGenerationStore: useStore };
});
jest.mock("@/lib/generate-content/background-generation-sync", () => ({
  announceBackgroundGenerationRemoval: jest.fn(),
}));
jest.mock("@/components/layouts", () => ({
  WorkingSurface: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));
jest.mock("@/components/permission/permission-guard", () => ({
  PermissionGuard: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock("@/components/generate-content/run-notice", () => ({
  RunNotice: ({ title }: { title: string }) => <p>{title}</p>,
}));
// The run itself is the generation view's: here it shows what the page started it with.
jest.mock("@/components/generate-content/fresh-generation-view", () => ({
  FreshGenerationView: ({
    initialKeyword,
    isLibrary,
    libraryKey,
  }: {
    initialKeyword?: string;
    isLibrary?: boolean;
    libraryKey?: string;
  }) => (
    <p>
      Run: {initialKeyword} · library {String(isLibrary)} · {libraryKey}
    </p>
  ),
}));

beforeEach(() => {
  findLibraryItem.mockReset();
});

describe("Generate's library start", () => {
  it("finds the item under the workspace's id, not the address's slug, and starts from it", async () => {
    findLibraryItem.mockImplementation(
      async (key: string, _userId: string, workspaceId: string) =>
        workspaceId === WORKSPACE_ID ? { key, keyword: "seo tools" } : null,
    );
    render(<GeneratePage />);

    expect(
      await screen.findByText(
        "Run: seo tools · library true · library_seo tools_1",
      ),
    ).toBeInTheDocument();
    expect(findLibraryItem).toHaveBeenCalledWith(
      "library_seo tools_1",
      "u1",
      WORKSPACE_ID,
    );
    expect(screen.queryByText("This keyword isn't in your Library")).toBeNull();
  });

  it("says so when the item isn't in the Library", async () => {
    findLibraryItem.mockResolvedValue(null);
    render(<GeneratePage />);

    expect(
      await screen.findByText("This keyword isn't in your Library"),
    ).toBeInTheDocument();
    expect(screen.queryByText(/^Run:/)).toBeNull();
  });
});
