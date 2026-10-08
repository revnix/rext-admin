/**
 * rext-control#845: the wait for a new workspace's analysis never sits silent. Its stream can die
 * with the server (a deploy restarts it) without an error reaching the page; on staging a create
 * that was answered left no workspace at all, and the page counted for ever. When nothing has come
 * for a while the page looks the workspace up and says what it finds.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WorkspaceCreateWizard } from "@/components/workspace/workspace-create-wizard";
import { apiClient } from "@/lib/api-client";
import { ApiError } from "@/lib/api-client/core";
import type { SSEEvent } from "@/types/sse";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));
jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));
jest.mock("@/components/subscription/limit-check-wrapper", () => ({
  useCheckLimit: () => ({
    checkLimit: () => true,
    canCreate: true,
    isLimitReached: false,
  }),
}));
let mockEvents: SSEEvent[] = [];
jest.mock("@/hooks/use-sse-channel", () => ({
  useSSEChannel: () => ({
    events: mockEvents,
    connect: jest.fn(),
    disconnect: jest.fn(),
  }),
}));
jest.mock("@/providers/sse-provider", () => ({
  useSSE: () => ({ clearCompletedOperation: jest.fn() }),
}));
jest.mock("@/lib/analytics", () => ({ analytics: { track: jest.fn() } }));
jest.mock("@/hooks/use-personas", () => ({
  usePersonas: () => ({ isSuccess: false, data: undefined }),
}));
jest.mock("@/lib/api-client", () => ({
  apiClient: {
    workspaces: {
      get: jest.fn(),
      getBySlug: jest.fn(),
      getBrandVoice: jest.fn().mockResolvedValue({ brand_voice: {} }),
      updateBrandVoice: jest.fn(),
    },
  },
}));
const mockCreate = jest.fn();
const mockSetCurrent = jest.fn();
jest.mock("@/stores/workspace", () => {
  const state = {
    createWorkspace: (data: unknown) => mockCreate(data),
    workspaceList: [],
    setCurrentWorkspace: (workspace: unknown) => mockSetCurrent(workspace),
  };
  return {
    useWorkspaceStore: (selector: (s: typeof state) => unknown) =>
      selector(state),
    useWorkspaceCrudStore: {
      getState: () => ({ currentOperation: { operationId: "op-1" } }),
    },
  };
});

const lookUp = apiClient.workspaces.get as jest.Mock;
const WORKSPACE_ID = "0b9a6c9e-1d5f-4f0e-9a7b-3c2d1e0f4a5b";

const tree = () => (
  <QueryClientProvider
    client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
  >
    <WorkspaceCreateWizard />
  </QueryClientProvider>
);

async function create() {
  const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
  const view = render(tree());
  await user.type(
    screen.getByRole("textbox", { name: /Workspace name/ }),
    "My company",
  );
  await user.type(
    screen.getByRole("textbox", { name: /Website/ }),
    "mysite.com",
  );
  await user.click(screen.getByRole("button", { name: "Create workspace" }));
  await screen.findByText(/Reading https:\/\/mysite.com/);
  return { user, view };
}

/** Time passes with nothing on the stream. */
const pass = (ms: number) =>
  act(async () => {
    await jest.advanceTimersByTimeAsync(ms);
  });

beforeEach(() => {
  jest.useFakeTimers();
  mockEvents = [];
  mockCreate.mockReset();
  mockSetCurrent.mockReset();
  mockCreate.mockResolvedValue({ id: WORKSPACE_ID, slug: "my-company" });
  lookUp.mockReset();
});
afterEach(() => jest.useRealTimers());

describe("The wait for a new workspace's analysis, when nothing comes", () => {
  it("says nothing while the first event may still be on its way", async () => {
    await create();
    await pass(15_000);
    expect(screen.queryByText("We lost touch with the analysis")).toBeNull();
    expect(lookUp).not.toHaveBeenCalled();
  });

  it("says it lost touch, and looks the workspace up, when no event ever comes", async () => {
    lookUp.mockResolvedValue({
      workspace: { pipeline: { status: "running" } },
    });
    await create();
    await pass(21_000);
    expect(
      screen.getByText("We lost touch with the analysis"),
    ).toBeInTheDocument();
    expect(lookUp).toHaveBeenCalledWith(WORKSPACE_ID);
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("says the workspace wasn't saved when it isn't there, and goes back to the form with what was typed", async () => {
    lookUp.mockRejectedValue(new ApiError(404, "Workspace not found"));
    const { user } = await create();
    await pass(21_000);
    expect(
      await screen.findByText("This workspace wasn't saved"),
    ).toBeInTheDocument();
    expect(screen.queryByText("We lost touch with the analysis")).toBeNull();
    // The wait's own words would now be false: "already created, so you can leave this page".
    expect(screen.queryByText(/already created/)).toBeNull();
    await user.click(screen.getByRole("button", { name: "Create it again" }));
    // The shell lets go of it too: no sidebar naming a workspace that isn't there.
    expect(mockSetCurrent).toHaveBeenLastCalledWith(null);
    expect(screen.getByRole("textbox", { name: /Workspace name/ })).toHaveValue(
      "My company",
    );
    expect(screen.getByRole("textbox", { name: /Website/ })).toHaveValue(
      "mysite.com",
    );
    expect(
      screen.getByRole("button", { name: "Create workspace" }),
    ).toBeEnabled();
  });

  it("goes on to the review when the run finished without the page hearing of it", async () => {
    lookUp.mockResolvedValue({
      workspace: { pipeline: { status: "completed" } },
    });
    await create();
    await pass(21_000);
    expect(
      await screen.findByRole("button", { name: "Finish" }),
    ).toBeInTheDocument();
  });

  it("waits much longer once events have come: a long step is not a lost one", async () => {
    const { view } = await create();
    mockEvents = [
      {
        id: "1",
        operation_id: "op-1",
        scope: "workspace",
        step: "scrape.started",
        status: "started",
        message: "",
        timestamp: new Date().toISOString(),
      },
    ];
    view.rerender(tree());
    await pass(60_000);
    expect(screen.queryByText("We lost touch with the analysis")).toBeNull();
    await pass(95_000);
    expect(
      screen.getByText("We lost touch with the analysis"),
    ).toBeInTheDocument();
  });
});
