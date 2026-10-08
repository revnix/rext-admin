/**
 * Setting up a workspace made with "Skip for now" (rext-control task 905): the create page's own
 * form, without the name, for a workspace that is there already. A website is saved and then
 * read; a description starts the voice's draft. No workspace is made, and none of the create
 * form's events are sent.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WorkspaceCreateWizard } from "@/components/workspace/workspace-create-wizard";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));
jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));
jest.mock("@/components/subscription/limit-check-wrapper", () => ({
  useCheckLimit: () => ({
    checkLimit: () => true,
    canCreate: false,
    // The account's one workspace is this one: its plan is full, and that stops nothing here.
    isLimitReached: false,
  }),
}));
const connected: string[] = [];
jest.mock("@/hooks/use-sse-channel", () => ({
  useSSEChannel: (operationId: string | null) => {
    if (operationId && !connected.includes(operationId)) {
      connected.push(operationId);
    }
    return { events: [], connect: jest.fn(), disconnect: jest.fn() };
  },
}));
jest.mock("@/providers/sse-provider", () => ({
  useSSE: () => ({ clearCompletedOperation: jest.fn() }),
}));
jest.mock("@/lib/analytics", () => ({ analytics: { track: jest.fn() } }));
const analytics = jest.requireMock("@/lib/analytics").analytics as {
  track: jest.Mock;
};
const createWorkspace = jest.fn();
jest.mock("@/stores/workspace", () => {
  const state = {
    createWorkspace: (...args: unknown[]) => createWorkspace(...args),
    workspaceList: [{ id: "w1" }],
    setCurrentWorkspace: jest.fn(),
  };
  return {
    useWorkspaceStore: (selector: (s: typeof state) => unknown) =>
      selector(state),
    useWorkspaceCrudStore: { getState: () => ({ currentOperation: null }) },
  };
});
const calls: string[] = [];
const update = jest.fn(async () => {
  calls.push("update");
  return {};
});
const refreshBrandVoice = jest.fn(async () => {
  calls.push("refresh");
  return { operation_id: "op-read" };
});
const describeLater = jest.fn(async () => {
  calls.push("describe");
  return { operation_id: "op-draft" };
});
jest.mock("@/lib/api-client", () => ({
  apiClient: {
    workspaces: {
      update: (...args: unknown[]) => update(...(args as [])),
      refreshBrandVoice: (...args: unknown[]) =>
        refreshBrandVoice(...(args as [])),
      describeLater: (...args: unknown[]) => describeLater(...(args as [])),
    },
  },
}));

const EXISTING = { id: "w1", slug: "my-workspace", name: "My workspace" };
const open = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <WorkspaceCreateWizard existing={EXISTING} />
    </QueryClientProvider>,
  );

beforeEach(() => {
  window.history.replaceState(null, "", "/w/my-workspace/setup");
  calls.length = 0;
  connected.length = 0;
  createWorkspace.mockClear();
  update.mockClear();
  refreshBrandVoice.mockClear();
  describeLater.mockClear();
  analytics.track.mockClear();
});

describe("Setting up a workspace that is there already", () => {
  it("asks for the website or the description only: the workspace has its name, and nothing is skipped", () => {
    open();

    expect(
      screen.queryByRole("textbox", { name: /What is your business called/ }),
    ).toBeNull();
    expect(
      screen.getByRole("textbox", { name: /What is its website/ }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Skip for now" })).toBeNull();
    // It has somewhere to go back to.
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("saves the website, then reads it, and follows that run", async () => {
    open();
    await userEvent.type(
      screen.getByRole("textbox", { name: /What is its website/ }),
      "lunabakery.com",
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Read my website" }),
    );

    await waitFor(() => expect(connected).toContain("op-read"));
    expect(calls).toEqual(["update", "refresh"]);
    expect(update).toHaveBeenCalledWith("w1", {
      url: "https://lunabakery.com",
    });
    expect(refreshBrandVoice).toHaveBeenCalledWith("w1");
    expect(createWorkspace).not.toHaveBeenCalled();
  });

  it("drafts the voice from a description, and follows that run", async () => {
    open();
    await userEvent.click(
      screen.getByRole("button", { name: "I don't have a website yet" }),
    );
    await userEvent.type(
      screen.getByRole("textbox", { name: /What does the business do/ }),
      "We bake sourdough for cafes in Leeds.",
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Draft my brand voice" }),
    );

    await waitFor(() => expect(connected).toContain("op-draft"));
    expect(calls).toEqual(["describe"]);
    expect(describeLater).toHaveBeenCalledWith(
      "w1",
      "We bake sourdough for cafes in Leeds.",
    );
    expect(createWorkspace).not.toHaveBeenCalled();
  });

  it("picks a set-up up where it is when the page is opened again during its wait", async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <WorkspaceCreateWizard
          existing={{
            ...EXISTING,
            resume: { operationId: "op-under-way", website: null },
          }}
        />
      </QueryClientProvider>,
    );

    // The wait, following the run that is under way: no form to fill in again.
    await waitFor(() => expect(connected).toContain("op-under-way"));
    expect(
      screen.queryByRole("textbox", { name: /What does the business do/ }),
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Draft my brand voice" }),
    ).toBeNull();
    expect(calls).toEqual([]);
    expect(createWorkspace).not.toHaveBeenCalled();
  });

  it("sends none of the create form's events, and keeps no draft for the tab", async () => {
    open();
    await userEvent.type(
      screen.getByRole("textbox", { name: /What is its website/ }),
      "lunabakery.com",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Read my website" }),
    );
    await waitFor(() => expect(connected).toContain("op-read"));

    const names = analytics.track.mock.calls.map(([name]) => name as string);
    expect(names.filter((name) => name.startsWith("workspace_create"))).toEqual(
      [],
    );
    expect(names).not.toContain("workspace_created");
    expect(
      window.sessionStorage.getItem("rext:workspace-create-draft"),
    ).toBeNull();
  });
});
