/**
 * Reading a workspace's website again (D5a): the refresh's state is kept once for the whole app, so
 * it carries the workspace it belongs to. A run or a failure in one workspace doesn't lock the
 * button, open the progress dialog or show "The website couldn't be read" in another.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen } from "@testing-library/react";
import { BrandVoiceRefreshControl } from "@/components/workspace";
import {
  brandVoiceRefreshFor,
  useBrandVoiceRefreshStore,
} from "@/stores/workspace";

jest.mock("@/lib/api-client", () => ({
  apiClient: { workspaces: { refreshBrandVoice: jest.fn() } },
}));

jest.mock("@/hooks/use-sse-channel", () => ({
  useSSEChannel: () => ({
    events: [],
    status: { connected: false, retryCount: 0 },
    disconnect: jest.fn(),
    isConnected: false,
  }),
}));

jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const api = jest.requireMock("@/lib/api-client").apiClient as {
  workspaces: { refreshBrandVoice: jest.Mock };
};

const idle = { isRefreshing: false };

beforeEach(() => {
  jest.clearAllMocks();
  useBrandVoiceRefreshStore.setState({ brandVoiceRefresh: idle });
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
      workspaceId: "ws-a",
      isRefreshing: false,
      refreshError: "The site didn't answer.",
    });
    expect(brandVoiceRefreshFor(refresh, "ws-b")).toEqual(idle);
    expect(brandVoiceRefreshFor(refresh, undefined)).toEqual(idle);
  });

  it("starts a run for one workspace, clearing that workspace's earlier failure", async () => {
    useBrandVoiceRefreshStore.setState({
      brandVoiceRefresh: {
        workspaceId: "ws-a",
        isRefreshing: false,
        refreshError: "The site didn't answer.",
      },
    });
    api.workspaces.refreshBrandVoice.mockResolvedValue({
      operation_id: "op-1",
    });

    await useBrandVoiceRefreshStore.getState().refreshBrandVoice("ws-a");

    expect(
      useBrandVoiceRefreshStore.getState().brandVoiceRefresh,
    ).toMatchObject({
      workspaceId: "ws-a",
      isRefreshing: true,
      operationId: "op-1",
      refreshError: undefined,
    });
  });
});

describe("the refresh button", () => {
  function renderControl(workspaceId: string) {
    const client = new QueryClient();
    return render(
      <QueryClientProvider client={client}>
        <BrandVoiceRefreshControl workspaceId={workspaceId}>
          Read the website again
        </BrandVoiceRefreshControl>
      </QueryClientProvider>,
    );
  }

  it("shows its own workspace's run", () => {
    act(() => {
      useBrandVoiceRefreshStore.setState({
        brandVoiceRefresh: {
          workspaceId: "ws-a",
          isRefreshing: true,
          operationId: "op-1",
        },
      });
    });
    renderControl("ws-a");

    // The open dialog hides the page behind it from the accessibility tree.
    expect(
      screen.getByRole("button", { name: /Reading/, hidden: true }),
    ).toBeDisabled();
    expect(
      screen.getByRole("dialog", { name: "Reading your website" }),
    ).toBeInTheDocument();
  });

  it("isn't locked by another workspace's run", () => {
    act(() => {
      useBrandVoiceRefreshStore.setState({
        brandVoiceRefresh: {
          workspaceId: "ws-a",
          isRefreshing: true,
          operationId: "op-1",
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
