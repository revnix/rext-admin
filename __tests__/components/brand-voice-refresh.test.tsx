/**
 * Reading a workspace's website again (D5a): each workspace keeps its own refresh state, so a run or
 * a failure in one workspace, even one that finishes after another workspace's run began, doesn't
 * lock the button, open the progress dialog or show "The website couldn't be read" in another.
 *
 * A run found on mount (D5b): it was started before the section last unmounted, so it may have ended
 * while nobody listened. Its dialog opens only once the stream shows it still going; a stream that
 * says it's complete, or stays silent, settles it.
 *
 * The pipeline's record (D21, G20): a run the record shows ended settles at once, with no silence to
 * wait out, and a refresh refused because a run is going follows that run.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import {
  BrandVoiceRefreshControl,
  RESUMED_RUN_SILENCE_MS,
} from "@/components/workspace/brand-voice-refresh-control";
import { ApiError } from "@/lib/api-client/core";
import {
  brandVoiceRefreshFor,
  useBrandVoiceRefreshStore,
} from "@/stores/workspace";
import type { SSEEvent } from "@/types/sse";

jest.mock("@/lib/api-client", () => ({
  apiClient: {
    workspaces: { refreshBrandVoice: jest.fn(), getBySlug: jest.fn() },
  },
}));

// What the stream has delivered for the control's operation, and the control's callbacks.
let mockStreamEvents: SSEEvent[] = [];
let mockStreamOptions: {
  onComplete?: () => unknown;
  onEnded?: () => unknown;
} = {};
const mockDisconnect = jest.fn();

jest.mock("@/hooks/use-sse-channel", () => ({
  useSSEChannel: (
    _operationId: string | null,
    options: { onComplete?: () => unknown; onEnded?: () => unknown },
  ) => {
    mockStreamOptions = options;
    return {
      events: mockStreamEvents,
      status: { connected: false, retryCount: 0 },
      disconnect: mockDisconnect,
      isConnected: false,
    };
  },
}));

jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn(), info: jest.fn() },
}));

const toast = jest.requireMock("sonner").toast as {
  success: jest.Mock;
  error: jest.Mock;
  info: jest.Mock;
};

const api = jest.requireMock("@/lib/api-client").apiClient as {
  workspaces: { refreshBrandVoice: jest.Mock; getBySlug: jest.Mock };
};

/** The workspace's pipeline record, as GET /workspaces/slug/{slug} returns it (G20). */
function recordShows(
  pipeline: { status: string; operation_id: string } | null,
) {
  api.workspaces.getBySlug.mockResolvedValue({ workspace: { pipeline } });
}

const idle = { isRefreshing: false };

function streamEvent(step: string, status: SSEEvent["status"]): SSEEvent {
  return {
    id: step,
    operation_id: "op-1",
    scope: step === "connected" ? "connection" : "workspace",
    step,
    status,
    message: step,
    timestamp: "2026-10-07T05:00:00Z",
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockStreamEvents = [];
  mockStreamOptions = {};
  useBrandVoiceRefreshStore.setState({ brandVoiceRefresh: {} });
  recordShows(null);
});

describe("the brand voice refresh state", () => {
  it("keeps a failure with the workspace it happened in", async () => {
    api.workspaces.refreshBrandVoice.mockRejectedValue(
      new Error("The site didn't answer."),
    );

    await expect(
      useBrandVoiceRefreshStore.getState().refreshBrandVoice("ws-a"),
    ).rejects.toThrow();

    const refresh = useBrandVoiceRefreshStore.getState().brandVoiceRefresh;
    expect(brandVoiceRefreshFor(refresh, "ws-a")).toMatchObject({
      isRefreshing: false,
      refreshError: "The site didn't answer.",
    });
    expect(brandVoiceRefreshFor(refresh, "ws-b")).toEqual(idle);
    expect(brandVoiceRefreshFor(refresh, undefined)).toEqual(idle);
  });

  it("starts a run for one workspace, clearing that workspace's earlier failure", async () => {
    useBrandVoiceRefreshStore.setState({
      brandVoiceRefresh: {
        "ws-a": {
          isRefreshing: false,
          refreshError: "The site didn't answer.",
        },
      },
    });
    api.workspaces.refreshBrandVoice.mockResolvedValue({
      operation_id: "op-1",
    });

    await useBrandVoiceRefreshStore.getState().refreshBrandVoice("ws-a");

    expect(
      useBrandVoiceRefreshStore.getState().brandVoiceRefresh["ws-a"],
    ).toEqual({
      isRefreshing: true,
      operationId: "op-1",
      refreshError: undefined,
    });
  });

  it("leaves another workspace's run alone when an earlier start fails late", async () => {
    let failA!: (error: Error) => void;
    api.workspaces.refreshBrandVoice
      .mockReturnValueOnce(
        new Promise((_resolve, reject) => {
          failA = reject;
        }),
      )
      .mockResolvedValueOnce({ operation_id: "op-b" });
    const store = useBrandVoiceRefreshStore.getState();

    const startA = store.refreshBrandVoice("ws-a");
    await store.refreshBrandVoice("ws-b");
    failA(new Error("The site didn't answer."));
    await expect(startA).rejects.toThrow();

    const refresh = useBrandVoiceRefreshStore.getState().brandVoiceRefresh;
    expect(brandVoiceRefreshFor(refresh, "ws-b")).toEqual({
      isRefreshing: true,
      operationId: "op-b",
      refreshError: undefined,
    });
    expect(brandVoiceRefreshFor(refresh, "ws-a")).toMatchObject({
      isRefreshing: false,
      refreshError: "The site didn't answer.",
    });
  });
});

function renderControl(workspaceId: string) {
  const client = new QueryClient();
  const invalidate = jest.spyOn(client, "invalidateQueries");
  const control = () => (
    <QueryClientProvider client={client}>
      <BrandVoiceRefreshControl workspaceId={workspaceId}>
        Read the website again
      </BrandVoiceRefreshControl>
    </QueryClientProvider>
  );
  const view = render(control());
  return { client, invalidate, rerender: () => view.rerender(control()) };
}

/** A run of workspace A's, started before its section mounted. */
function runFoundOnMount() {
  act(() => {
    useBrandVoiceRefreshStore.setState({
      brandVoiceRefresh: {
        "ws-a": { isRefreshing: true, operationId: "op-1" },
      },
    });
  });
}

describe("the refresh button", () => {
  it("shows its own workspace's run", () => {
    runFoundOnMount();
    renderControl("ws-a");

    expect(screen.getByRole("button", { name: /Reading/ })).toBeDisabled();
  });

  it("isn't locked by another workspace's run", () => {
    act(() => {
      useBrandVoiceRefreshStore.setState({
        brandVoiceRefresh: {
          "ws-a": { isRefreshing: true, operationId: "op-1" },
        },
      });
    });
    renderControl("ws-b");

    expect(
      screen.getByRole("button", { name: "Read the website again" }),
    ).toBeEnabled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("a run found on mount", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("opens its dialog once the stream shows it still going", () => {
    runFoundOnMount();
    const view = renderControl("ws-a");

    // Nothing from the run yet: no dialog stuck on "Connecting…".
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    mockStreamEvents = [
      streamEvent("connected", "connected"),
      streamEvent("scrape.started", "started"),
    ];
    view.rerender();

    expect(
      screen.getByRole("dialog", { name: "Reading your website" }),
    ).toBeInTheDocument();
  });

  it("settles when the stream says it's already complete", async () => {
    runFoundOnMount();
    const view = renderControl("ws-a");

    // A reconnect after the run ended: the backend replays its completion.
    mockStreamEvents = [
      streamEvent("connected", "connected"),
      streamEvent("pipeline.completed", "completed"),
    ];
    view.rerender();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await act(async () => {
      await mockStreamOptions.onComplete?.();
    });

    expect(
      screen.getByRole("button", { name: "Read the website again" }),
    ).toBeEnabled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      brandVoiceRefreshFor(
        useBrandVoiceRefreshStore.getState().brandVoiceRefresh,
        "ws-a",
      ),
    ).toMatchObject({ isRefreshing: false, operationId: undefined });
    expect(view.invalidate).toHaveBeenCalledWith({
      queryKey: ["workspaces", "brand-voice", "ws-a"],
    });
  });

  it("settles with no success toast when the stream says only that it ended", async () => {
    runFoundOnMount();
    const view = renderControl("ws-a");

    // The provider's answer for an ended run carries no outcome: it may have failed.
    await act(async () => {
      await mockStreamOptions.onEnded?.();
    });

    expect(toast.success).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Read the website again" }),
    ).toBeEnabled();
    expect(view.invalidate).toHaveBeenCalledWith({
      queryKey: ["workspaces", "brand-voice", "ws-a"],
    });
  });

  it("settles and reads the brand voice again when the backend no longer holds it", () => {
    jest.useFakeTimers();
    runFoundOnMount();
    const view = renderControl("ws-a");

    // The backend forgot the ended run: the stream opens and says nothing more.
    mockStreamEvents = [streamEvent("connected", "connected")];
    view.rerender();

    act(() => {
      jest.advanceTimersByTime(RESUMED_RUN_SILENCE_MS);
    });

    expect(
      screen.getByRole("button", { name: "Read the website again" }),
    ).toBeEnabled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(view.invalidate).toHaveBeenCalledWith({
      queryKey: ["workspaces", "brand-voice", "ws-a"],
    });
  });

  it("waits while the stream hasn't opened (the backend down, a retry)", () => {
    jest.useFakeTimers();
    runFoundOnMount();
    renderControl("ws-a");

    act(() => {
      jest.advanceTimersByTime(RESUMED_RUN_SILENCE_MS * 2);
    });

    // Nothing proves the run ended, so a second refresh can't be started over it.
    expect(screen.getByRole("button", { name: /Reading/ })).toBeDisabled();
    expect(
      brandVoiceRefreshFor(
        useBrandVoiceRefreshStore.getState().brandVoiceRefresh,
        "ws-a",
      ),
    ).toMatchObject({ isRefreshing: true, operationId: "op-1" });
  });

  it("keeps a going run's dialog open past the silence limit", () => {
    jest.useFakeTimers();
    runFoundOnMount();
    const view = renderControl("ws-a");
    mockStreamEvents = [
      streamEvent("connected", "connected"),
      streamEvent("scrape.started", "started"),
    ];
    view.rerender();

    act(() => {
      jest.advanceTimersByTime(RESUMED_RUN_SILENCE_MS);
    });

    expect(
      screen.getByRole("dialog", { name: "Reading your website" }),
    ).toBeInTheDocument();
  });
});

describe("a run started here", () => {
  it("opens its dialog at once", async () => {
    api.workspaces.refreshBrandVoice.mockResolvedValue({
      operation_id: "op-2",
    });
    renderControl("ws-a");

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Read the website again" }),
      );
    });

    expect(
      screen.getByRole("dialog", { name: "Reading your website" }),
    ).toBeInTheDocument();
  });
});

describe("the pipeline's record", () => {
  it("settles a run found on mount that a restart interrupted, with no silence to wait out", async () => {
    recordShows({ status: "interrupted", operation_id: "op-1" });
    runFoundOnMount();
    const view = renderControl("ws-a");

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Read the website again" }),
      ).toBeEnabled(),
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(toast.success).not.toHaveBeenCalled();
    expect(view.invalidate).toHaveBeenCalledWith({
      queryKey: ["workspaces", "brand-voice", "ws-a"],
    });
  });

  it("follows the run that's going when a refresh is refused for one", async () => {
    api.workspaces.refreshBrandVoice.mockRejectedValue(
      new ApiError(400, "Still being read", "BUSINESS_RULE_VIOLATION", {
        error: { context: { rule_name: "workspace_pipeline_running" } },
      }),
    );
    recordShows({ status: "running", operation_id: "op-9" });
    renderControl("ws-a");

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Read the website again" }),
      );
    });

    expect(
      await screen.findByRole("dialog", { name: "Reading your website" }),
    ).toBeInTheDocument();
    const refresh = brandVoiceRefreshFor(
      useBrandVoiceRefreshStore.getState().brandVoiceRefresh,
      "ws-a",
    );
    expect(refresh).toMatchObject({ isRefreshing: true, operationId: "op-9" });
    expect(refresh.refreshError).toBeUndefined();
    expect(toast.info).toHaveBeenCalledWith(
      "Your website is being read already",
    );
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("says a run completed once, when the record and then the stream report it", async () => {
    // Review round 2: the record's read shows the run completed first; the stream's completion
    // arrives after it.
    api.workspaces.refreshBrandVoice.mockResolvedValue({
      operation_id: "op-2",
    });
    recordShows({ status: "running", operation_id: "op-2" });
    const view = renderControl("ws-a");
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Read the website again" }),
      );
    });
    await screen.findByRole("dialog", { name: "Reading your website" });

    recordShows({ status: "completed", operation_id: "op-2" });
    await act(async () => {
      await view.client.invalidateQueries({ queryKey: ["workspaces"] });
    });
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    await act(async () => {
      await mockStreamOptions.onComplete?.();
    });

    // Besides the start's own "Reading your website…".
    expect(
      toast.success.mock.calls.filter(
        ([message]) =>
          message === "The brand voice was read from your website again",
      ),
    ).toHaveLength(1);
  });
});
