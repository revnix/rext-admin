/**
 * "Skip for now" (rext-control task 905). Of 27 new accounts on launch day, 26 opened the create
 * form and 4 made a workspace: the form was where people stopped. One plain link makes a
 * workspace with no website, no description and no analysis, and lands the person in the app.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WorkspaceCreateWizard } from "@/components/workspace/workspace-create-wizard";
import { ApiError } from "@/lib/api-client/core";

const push = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));
// The person signed in, as the session names them.
const person: { user: Record<string, string> | null } = { user: null };
jest.mock("next-auth/react", () => ({
  useSession: () => ({
    data: person.user ? { user: person.user } : null,
    status: person.user ? "authenticated" : "unauthenticated",
  }),
}));
jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));
const limit = { isLimitReached: false };
jest.mock("@/components/subscription/limit-check-wrapper", () => ({
  useCheckLimit: () => ({
    checkLimit: () => true,
    canCreate: true,
    isLimitReached: limit.isLimitReached,
  }),
}));
jest.mock("@/hooks/use-sse-channel", () => ({
  useSSEChannel: () => ({
    events: [],
    connect: jest.fn(),
    disconnect: jest.fn(),
  }),
}));
jest.mock("@/providers/sse-provider", () => ({
  useSSE: () => ({ clearCompletedOperation: jest.fn() }),
}));
jest.mock("@/lib/analytics", () => ({ analytics: { track: jest.fn() } }));
const analytics = jest.requireMock("@/lib/analytics").analytics as {
  track: jest.Mock;
};
const createWorkspace = jest.fn();
const setCurrentWorkspace = jest.fn();
const account: { workspaces: Array<{ id: string }> } = { workspaces: [] };
jest.mock("@/stores/workspace", () => {
  const state = {
    createWorkspace: (...args: unknown[]) => createWorkspace(...args),
    get workspaceList() {
      return account.workspaces;
    },
    setCurrentWorkspace: (...args: unknown[]) => setCurrentWorkspace(...args),
  };
  return {
    useWorkspaceStore: (selector: (s: typeof state) => unknown) =>
      selector(state),
    useWorkspaceCrudStore: { getState: () => ({ currentOperation: null }) },
  };
});

const MADE = { id: "w1", slug: "my-workspace", name: "My workspace" };
const open = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <WorkspaceCreateWizard />
    </QueryClientProvider>,
  );
const skip = () => screen.getByRole("button", { name: "Skip for now" });
const sent = (event: string) =>
  analytics.track.mock.calls
    .filter(([name]) => name === event)
    .map(([, said]) => said);

beforeEach(() => {
  window.history.replaceState(null, "", "/w/create");
  person.user = null;
  limit.isLimitReached = false;
  account.workspaces = [];
  push.mockClear();
  createWorkspace.mockReset();
  setCurrentWorkspace.mockClear();
  analytics.track.mockClear();
});

describe("Skip for now", () => {
  it("is offered under the button to an account with no workspace, and to no other", () => {
    const first = open();
    expect(skip()).toBeInTheDocument();
    first.unmount();

    account.workspaces = [{ id: "w0" }];
    open();
    expect(screen.queryByRole("button", { name: "Skip for now" })).toBeNull();
  });

  it("comes before the form on a phone, in the page as on the screen, and under the button on a wide screen", () => {
    const name = () =>
      screen.getByRole("textbox", { name: /What is your business called/ });
    const create = () =>
      screen.getByRole("button", { name: "Read my website" });
    const standsBefore = (a: Element, b: Element) =>
      Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

    // A wide screen: the link follows the form's button.
    const wide = open();
    expect(standsBefore(create(), skip())).toBe(true);
    expect(
      screen.getAllByRole("button", { name: "Skip for now" }),
    ).toHaveLength(1);
    wide.unmount();

    // Under 1024 px the button and anything under it sit below the first screen, so the link
    // comes first: one link, standing before the first field for a keyboard and a screen reader too.
    const matchMedia = window.matchMedia;
    window.matchMedia = ((query: string) => ({
      matches: query.includes("max-width: 1023px"),
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    })) as unknown as typeof window.matchMedia;
    try {
      open();
      expect(standsBefore(skip(), name())).toBe(true);
      expect(
        screen.getAllByRole("button", { name: "Skip for now" }),
      ).toHaveLength(1);
    } finally {
      window.matchMedia = matchMedia;
    }
  });

  it("makes a workspace with a name and nothing else, and goes to the app's home", async () => {
    createWorkspace.mockResolvedValue(MADE);
    open();

    await userEvent.click(skip());

    await waitFor(() => expect(push).toHaveBeenCalledWith("/"));
    expect(createWorkspace).toHaveBeenCalledTimes(1);
    const asked = createWorkspace.mock.calls[0][0];
    expect(asked).toEqual({
      name: "My workspace",
      timezone: expect.any(String),
    });
    expect(asked).not.toHaveProperty("url");
    expect(asked).not.toHaveProperty("description");
    expect(setCurrentWorkspace).toHaveBeenCalledWith(MADE);
    // Counted as its own way, apart from the form's two.
    expect(sent("workspace_create_skipped")).toEqual([
      { first_workspace: true },
    ]);
    expect(sent("workspace_created")).toEqual([
      {
        workspace_id: "w1",
        first_workspace: true,
        with_website: false,
        way: "skipped",
      },
    ]);
    expect(sent("workspace_create_submitted")).toEqual([]);
  });

  it("names the workspace after the person when the session knows their name", async () => {
    person.user = { full_name: "Ana Silva", email: "ana@example.com" };
    createWorkspace.mockResolvedValue(MADE);
    open();

    await userEvent.click(skip());

    await waitFor(() => expect(createWorkspace).toHaveBeenCalled());
    expect(createWorkspace.mock.calls[0][0].name).toBe("Ana's workspace");
  });

  it("keeps the name already typed, when it is one", async () => {
    createWorkspace.mockResolvedValue(MADE);
    open();
    await userEvent.type(
      screen.getByRole("textbox", { name: /What is your business called/ }),
      "Luna Bakery",
    );

    await userEvent.click(skip());

    await waitFor(() => expect(createWorkspace).toHaveBeenCalled());
    expect(createWorkspace.mock.calls[0][0].name).toBe("Luna Bakery");
    // And what was typed is not kept for a form nobody comes back to.
    await waitFor(() =>
      expect(
        window.sessionStorage.getItem("rext:workspace-create-draft"),
      ).toBeNull(),
    );
  });

  it("asks for nothing: no field is checked, whatever the form holds", async () => {
    createWorkspace.mockResolvedValue(MADE);
    open();
    await userEvent.type(
      screen.getByRole("textbox", { name: /What is your business called/ }),
      "12345",
    );

    await userEvent.click(skip());

    await waitFor(() => expect(createWorkspace).toHaveBeenCalled());
    // Not a name by the form's rule, so the person's own takes its place.
    expect(createWorkspace.mock.calls[0][0].name).toBe("My workspace");
    expect(screen.queryByText("Name is required")).toBeNull();
  });

  it("says so above the form when it is refused, and can be pressed again", async () => {
    createWorkspace.mockRejectedValueOnce(new ApiError(500, "Something broke"));
    createWorkspace.mockResolvedValueOnce(MADE);
    open();

    await userEvent.click(skip());

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The workspace wasn't created",
    );
    expect(push).not.toHaveBeenCalled();
    expect(sent("workspace_create_refused")).toEqual([
      expect.objectContaining({ kind: "backend", status: 500, way: "skipped" }),
    ]);

    await userEvent.click(skip());
    await waitFor(() => expect(push).toHaveBeenCalledWith("/"));
  });

  it("is the plan's limit notice when the plan has no workspace left", async () => {
    createWorkspace.mockRejectedValue(
      new ApiError(429, "Workspace limit reached (1/1)."),
    );
    open();

    await userEvent.click(skip());

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Workspace limit reached",
    );
    expect(sent("workspace_create_refused")).toEqual([
      expect.objectContaining({ kind: "limit", status: 429, way: "skipped" }),
    ]);
  });
});
