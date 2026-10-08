/**
 * Workspace settings, General, for a workspace with no website (rext-control#853: one made from a
 * description of the business). The Website field is empty and can stay so; adding a website saves
 * it and starts nothing, and the page then offers to read it; a website can't be removed here.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GeneralInfoSection } from "@/components/workspace-settings/general-info-section";

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: jest.fn(),
    refresh: jest.fn(),
    push: jest.fn(),
  }),
  usePathname: () => "/w/acme-forge/settings",
  useSearchParams: () => new URLSearchParams(),
}));
type TestWorkspace = {
  id: string;
  name: string;
  slug: string;
  url: string | null;
  favicon_url: string | null;
};
let mockWorkspace: TestWorkspace;
jest.mock("@/providers/workspace-provider", () => ({
  useWorkspace: () => ({ workspace: mockWorkspace, workspaceId: "ws-1" }),
}));
jest.mock("@/hooks/use-permission", () => ({
  useWorkspacePermission: () => ({ hasPermission: true, isLoading: false }),
}));
const mockUpdate = jest.fn();
jest.mock("@/lib/api-client", () => ({
  apiClient: {
    workspaces: {
      update: (...args: unknown[]) => mockUpdate(...args),
    },
  },
}));
jest.mock("@/stores/workspace", () => {
  const state = {
    setCurrentWorkspace: jest.fn(),
    updateWorkspaceInList: jest.fn(),
    brandVoiceRefresh: {},
  };
  return {
    useWorkspaceStore: (selector: (s: typeof state) => unknown) =>
      selector(state),
    brandVoiceRefreshFor: () => ({ refreshError: null }),
  };
});
// The control that starts a read and shows its progress has its own tests (brand-voice-refresh).
jest.mock("@/components/workspace/brand-voice-refresh-control", () => ({
  BrandVoiceRefreshControl: ({
    workspaceId,
    children,
  }: {
    workspaceId: string;
    children: React.ReactNode;
  }) => (
    <button type="button" data-workspace={workspaceId}>
      {children}
    </button>
  ),
}));

const tree = () => (
  <QueryClientProvider client={new QueryClient()}>
    <GeneralInfoSection />
  </QueryClientProvider>
);
const website = () => screen.getByRole("textbox", { name: /Website/ });
const save = () =>
  userEvent.click(screen.getByRole("button", { name: "Save changes" }));

beforeEach(() => {
  mockWorkspace = {
    id: "ws-1",
    name: "Acme Forge",
    slug: "acme-forge",
    url: null,
    favicon_url: null,
  };
  mockUpdate.mockReset();
  // The backend's answer: the workspace as saved.
  mockUpdate.mockImplementation(
    async (_id: string, data: { name?: string; url?: string }) => {
      mockWorkspace = { ...mockWorkspace, ...data };
      return { workspace: mockWorkspace };
    },
  );
});

describe("General settings of a workspace with no website", () => {
  it("shows the field empty, not required, and says what adding one does", () => {
    render(tree());
    expect(website()).toHaveValue("");
    expect(website()).not.toBeRequired();
    expect(
      screen.getByText(
        "None yet. Add your website and we can read it for the brand voice, the people named on it and your competitors.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "The name's first letter stands in until there is a website to take an icon from.",
      ),
    ).toBeInTheDocument();
  });

  it("saves a new name without a website", async () => {
    render(tree());
    const name = screen.getByRole("textbox", { name: /Workspace name/ });
    await userEvent.clear(name);
    await userEvent.type(name, "Acme Forge Co");
    await save();

    await waitFor(() => expect(mockUpdate).toHaveBeenCalledTimes(1));
    const [id, sent] = mockUpdate.mock.calls[0];
    expect(id).toBe("ws-1");
    expect(sent).toEqual({ name: "Acme Forge Co" });
    expect(screen.queryByText(/Read it now/)).toBeNull();
  });

  it("takes a bare domain, saves it, starts no read, and offers one", async () => {
    const view = render(tree());
    await userEvent.type(website(), "acme-forge.com");
    await save();

    await waitFor(() => expect(mockUpdate).toHaveBeenCalledTimes(1));
    expect(mockUpdate.mock.calls[0][1]).toEqual({
      name: "Acme Forge",
      url: "https://acme-forge.com",
    });
    view.rerender(tree());
    expect(
      await screen.findByText("Your website is saved. Read it now?"),
    ).toBeInTheDocument();
    // What a read replaces is said before the person says yes.
    expect(
      screen.getByText(
        /replaces the brand voice as it is now, your own changes included, and the list of competitors; personas you added yourself stay/,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Read the website" }),
    ).toHaveAttribute("data-workspace", "ws-1");
  });

  it("says what to type when it isn't an address, and saves nothing", async () => {
    render(tree());
    await userEvent.type(website(), "just some words");
    await save();
    expect(
      await screen.findByText(
        "Enter your website's address, like yoursite.com",
      ),
    ).toBeInTheDocument();
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

describe("General settings of a workspace with a website", () => {
  beforeEach(() => {
    mockWorkspace = { ...mockWorkspace, url: "http://acme-forge.com" };
  });

  it("keeps an address typed with its scheme as it is, and offers no read for a change of name", async () => {
    render(tree());
    expect(website()).toHaveValue("http://acme-forge.com");
    const name = screen.getByRole("textbox", { name: /Workspace name/ });
    await userEvent.type(name, " Co");
    await save();
    await waitFor(() => expect(mockUpdate).toHaveBeenCalledTimes(1));
    expect(mockUpdate.mock.calls[0][1]).toEqual({
      name: "Acme Forge Co",
      url: "http://acme-forge.com",
    });
    expect(screen.queryByText(/Read it now/)).toBeNull();
  });

  it("doesn't take the website away: it says so and saves nothing", async () => {
    render(tree());
    await userEvent.clear(website());
    await save();
    expect(
      await screen.findByText(
        "A website can be changed here, but not removed.",
      ),
    ).toBeInTheDocument();
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
