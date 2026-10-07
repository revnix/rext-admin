/**
 * Creating a workspace while the backend restarts (D21, rext-control#549): the analysis runs inside
 * the API process, so a restart ends it without a word on the stream. The wizard reads the
 * workspace's pipeline record (G20) while it follows the run: a run the record shows stopped says
 * so and can be read again, one it shows completed goes on, and without a record the wizard keeps
 * today's reconnect.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WorkspaceCreateWizard } from "@/components/workspace/workspace-create-wizard";
import { ApiError } from "@/lib/api-client/core";

const WORKSPACE_ID = "3486d653-7dc1-4757-9375-93b09c379956";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));
jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn(), info: jest.fn() },
}));
jest.mock("@/components/subscription/limit-check-wrapper", () => ({
  useCheckLimit: () => ({
    checkLimit: () => true,
    canCreate: true,
    isLimitReached: false,
  }),
}));

// The operation the wizard follows, and its stream's callbacks.
const mockStream: {
  operationId: string | null;
  options: { onError?: (error: string) => void };
} = { operationId: null, options: {} };
jest.mock("@/hooks/use-sse-channel", () => ({
  useSSEChannel: (
    operationId: string | null,
    options: { onError?: (error: string) => void },
  ) => {
    mockStream.operationId = operationId;
    mockStream.options = options;
    return { events: [], connect: jest.fn(), disconnect: jest.fn() };
  },
}));
jest.mock("@/providers/sse-provider", () => ({
  useSSE: () => ({ clearCompletedOperation: jest.fn() }),
}));
jest.mock("@/lib/analytics", () => ({ analytics: { track: jest.fn() } }));
jest.mock("@/lib/api-client", () => ({
  apiClient: { workspaces: { get: jest.fn(), retryPipeline: jest.fn() } },
}));
jest.mock("@/stores/workspace", () => {
  const state = {
    createWorkspace: jest.fn(),
    workspaceList: [{ id: "other" }],
    setCurrentWorkspace: jest.fn(),
  };
  return {
    useWorkspaceStore: (selector: (s: typeof state) => unknown) =>
      selector(state),
    useWorkspaceCrudStore: {
      getState: () => ({ currentOperation: { operationId: "op-1" } }),
    },
    mockState: state,
  };
});

const api = jest.requireMock("@/lib/api-client").apiClient as {
  workspaces: { get: jest.Mock; retryPipeline: jest.Mock };
};
const store = jest.requireMock("@/stores/workspace").mockState as {
  createWorkspace: jest.Mock;
};
const toast = jest.requireMock("sonner").toast as { success: jest.Mock };

type Pipeline = {
  status: "running" | "completed" | "failed" | "interrupted";
  operation_id: string;
} | null;

/** The workspace's record on each read, in turn; the last one stays. */
function answerWith(...pipelines: Pipeline[]) {
  const answer = (pipeline: Pipeline) => ({
    workspace: { id: WORKSPACE_ID, slug: "acme", pipeline },
  });
  api.workspaces.get.mockResolvedValue(answer(pipelines[pipelines.length - 1]));
  for (const pipeline of pipelines.slice(0, -1)) {
    api.workspaces.get.mockResolvedValueOnce(answer(pipeline));
  }
}

async function createWorkspace() {
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <WorkspaceCreateWizard />
    </QueryClientProvider>,
  );
  await userEvent.type(
    screen.getByRole("textbox", { name: /Workspace name/ }),
    "Acme",
  );
  await userEvent.type(
    screen.getByRole("textbox", { name: /Website/ }),
    "https://acme.example",
  );
  await userEvent.click(
    screen.getByRole("button", { name: "Create workspace" }),
  );
  await waitFor(() => expect(mockStream.operationId).toBe("op-1"));
}

beforeEach(() => {
  jest.clearAllMocks();
  api.workspaces.get.mockReset();
  mockStream.operationId = null;
  store.createWorkspace.mockResolvedValue({ id: WORKSPACE_ID, slug: "acme" });
});

describe("Creating a workspace when the backend restarts mid-analysis", () => {
  it("says the run was interrupted and follows the retry's new run", async () => {
    answerWith(
      { status: "interrupted", operation_id: "op-1" },
      { status: "running", operation_id: "op-2" },
    );
    api.workspaces.retryPipeline.mockResolvedValue({ operation_id: "op-2" });

    await createWorkspace();

    expect(
      await screen.findByText("Reading the website was interrupted"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /The app restarted while it was reading https:\/\/acme\.example/,
      ),
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: "Read the website again" }),
    );

    expect(api.workspaces.retryPipeline).toHaveBeenCalledWith(WORKSPACE_ID);
    await waitFor(() => expect(mockStream.operationId).toBe("op-2"));
    await waitFor(() =>
      expect(
        screen.queryByText("Reading the website was interrupted"),
      ).not.toBeInTheDocument(),
    );
  });

  it("goes on to the brand voice when the record shows the run completed", async () => {
    answerWith({ status: "completed", operation_id: "op-1" });

    await createWorkspace();

    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith(
        "/w/acme/settings/brand-voice?drafted=1",
      ),
    );
    expect(toast.success).toHaveBeenCalledTimes(1);
  });

  it("follows the run that's going when the retry is refused for one", async () => {
    answerWith(
      { status: "failed", operation_id: "op-1" },
      { status: "running", operation_id: "op-3" },
    );
    api.workspaces.retryPipeline.mockRejectedValue(
      new ApiError(400, "Still being read", "BUSINESS_RULE_VIOLATION", {
        error: { context: { rule_name: "workspace_pipeline_running" } },
      }),
    );

    await createWorkspace();
    await userEvent.click(
      await screen.findByRole("button", { name: "Read the website again" }),
    );

    await waitFor(() => expect(mockStream.operationId).toBe("op-3"));
  });

  it("keeps today's reconnect when the backend keeps no record", async () => {
    answerWith(null);

    await createWorkspace();
    act(() => mockStream.options.onError?.("The stream closed"));

    expect(
      await screen.findByText("We lost touch with the analysis"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Read the website again" }),
    ).not.toBeInTheDocument();
  });
});
