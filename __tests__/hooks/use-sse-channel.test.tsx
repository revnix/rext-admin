import { act, renderHook } from "@testing-library/react";
import { useSSEChannel } from "@/hooks/use-sse-channel";
import type { SSEConnectionStatus, SSEEvent } from "@/types/sse";
import { SSE_ERROR_CODES } from "@/types/sse";

const subscribeMock = jest.fn<
  () => void,
  [string, (event: SSEEvent) => void, (status: SSEConnectionStatus) => void]
>();

jest.mock("@/providers/sse-provider", () => ({
  useSSE: () => ({
    subscribe: subscribeMock,
  }),
}));

jest.mock("@/services/notification-api", () => ({
  fetchNotifications: jest.fn().mockResolvedValue([]),
}));

jest.mock("@/stores/notification-store", () => ({
  useNotificationStore: {
    getState: () => ({
      mergeNotifications: jest.fn(),
    }),
  },
}));

const mockEvent = (overrides: Partial<SSEEvent> = {}): SSEEvent => ({
  id: overrides.id ?? "evt-1",
  operation_id: overrides.operation_id ?? "op-1",
  scope: overrides.scope ?? "workspace",
  step: overrides.step ?? "scrape.progress",
  status: overrides.status ?? "progress",
  message: overrides.message ?? "Processing",
  progress: overrides.progress ?? 10,
  payload: overrides.payload,
  timestamp: overrides.timestamp ?? new Date().toISOString(),
});

describe("useSSEChannel", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("auto connects and collects events when operationId provided", async () => {
    let capturedEventHandler: ((event: SSEEvent) => void) | undefined;
    let capturedStatusHandler:
      | ((status: SSEConnectionStatus) => void)
      | undefined;

    subscribeMock.mockImplementation((_operationId, onEvent, onStatus) => {
      capturedEventHandler = onEvent;
      capturedStatusHandler = onStatus;
      return jest.fn();
    });

    const { result } = renderHook(() => useSSEChannel("op-auto"));

    expect(subscribeMock).toHaveBeenCalledWith(
      "op-auto",
      expect.any(Function),
      expect.any(Function),
    );

    const event = mockEvent({ operation_id: "op-auto", message: "Step" });

    await act(async () => {
      capturedEventHandler?.(event);
    });

    expect(result.current.events).toHaveLength(1);
    expect(result.current.latestEvent).toEqual(event);

    const status: SSEConnectionStatus = {
      connected: true,
      retryCount: 0,
    };

    await act(async () => {
      capturedStatusHandler?.(status);
    });

    expect(result.current.status).toEqual(status);
    expect(result.current.isConnected).toBe(true);
  });

  it("invokes onComplete and onError callbacks from events", async () => {
    let handler: ((event: SSEEvent) => void) | undefined;
    subscribeMock.mockImplementation((_operationId, onEvent) => {
      handler = onEvent;
      return jest.fn();
    });

    const onComplete = jest.fn();
    const onError = jest.fn();

    renderHook(() =>
      useSSEChannel("op-test", {
        onComplete,
        onError,
      }),
    );

    await act(async () => {
      handler?.(
        mockEvent({
          operation_id: "op-test",
          step: "pipeline.completed",
          status: "completed",
          payload: { result: "ok" },
        }),
      );
    });

    expect(onComplete).toHaveBeenCalledWith({ result: "ok" });

    await act(async () => {
      handler?.(
        mockEvent({
          operation_id: "op-test",
          step: "pipeline.failed",
          status: "failed",
          payload: { error: "Boom" },
        }),
      );
    });

    expect(onError).toHaveBeenCalledWith("Boom");
  });

  it("supports manual connect/disconnect when autoConnect disabled", async () => {
    const unsubscribe = jest.fn();
    subscribeMock.mockImplementation((_operationId, _onEvent, _onStatus) => {
      return unsubscribe;
    });

    const { result, unmount } = renderHook(() =>
      useSSEChannel("op-manual", { autoConnect: false }),
    );

    expect(subscribeMock).not.toHaveBeenCalled();

    await act(async () => {
      result.current.connect();
    });

    expect(subscribeMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      result.current.disconnect();
    });

    expect(unsubscribe).toHaveBeenCalledTimes(1);

    // Ensure cleanup on unmount does not throw
    expect(() => unmount()).not.toThrow();
  });

  it("does not trigger onComplete for intermediate completion steps", async () => {
    let handler: ((event: SSEEvent) => void) | undefined;
    subscribeMock.mockImplementation((_operationId, onEvent) => {
      handler = onEvent;
      return jest.fn();
    });

    const onComplete = jest.fn();

    renderHook(() => useSSEChannel("op-test", { onComplete }));

    // Send intermediate completion event (scrape.completed)
    await act(async () => {
      handler?.(
        mockEvent({
          operation_id: "op-test",
          step: "scrape.completed",
          status: "completed",
          payload: { url: "https://example.com", word_count: 1500 },
        }),
      );
    });

    // Should NOT trigger onComplete for intermediate steps
    expect(onComplete).not.toHaveBeenCalled();

    // Send another intermediate completion event (vector_store.completed)
    await act(async () => {
      handler?.(
        mockEvent({
          operation_id: "op-test",
          step: "vector_store.completed",
          status: "completed",
          payload: { chunks: 25 },
        }),
      );
    });

    // Should still NOT trigger onComplete
    expect(onComplete).not.toHaveBeenCalled();

    // Send pipeline completion event
    await act(async () => {
      handler?.(
        mockEvent({
          operation_id: "op-test",
          step: "pipeline.completed",
          status: "completed",
          payload: { workspace_id: "ws-123" },
        }),
      );
    });

    // Should trigger onComplete only for pipeline completion
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith({ workspace_id: "ws-123" });
  });

  describe("error classification and suppression", () => {
    it("suppresses non-actionable errors with OPERATION_COMPLETED code", async () => {
      let statusHandler: ((status: SSEConnectionStatus) => void) | undefined;
      subscribeMock.mockImplementation((_operationId, _onEvent, onStatus) => {
        statusHandler = onStatus;
        return jest.fn();
      });

      const onError = jest.fn();
      renderHook(() => useSSEChannel("op-test", { onError }));

      await act(async () => {
        statusHandler?.({
          connected: false,
          retryCount: 0,
          code: SSE_ERROR_CODES.OPERATION_COMPLETED,
          error: "Operation already completed",
        });
      });

      // onError should NOT be called for non-actionable errors
      expect(onError).not.toHaveBeenCalled();
    });

    it("suppresses retry-status messages with CONNECTION_LOST code", async () => {
      let statusHandler: ((status: SSEConnectionStatus) => void) | undefined;
      subscribeMock.mockImplementation((_operationId, _onEvent, onStatus) => {
        statusHandler = onStatus;
        return jest.fn();
      });

      const onError = jest.fn();
      renderHook(() => useSSEChannel("op-test", { onError }));

      await act(async () => {
        statusHandler?.({
          connected: false,
          retryCount: 1,
          code: SSE_ERROR_CODES.CONNECTION_LOST,
          error: "Connection lost, retrying...",
        });
      });

      // onError should NOT be called for retry messages
      expect(onError).not.toHaveBeenCalled();
    });

    it("suppresses retry-status messages with RETRYING code", async () => {
      let statusHandler: ((status: SSEConnectionStatus) => void) | undefined;
      subscribeMock.mockImplementation((_operationId, _onEvent, onStatus) => {
        statusHandler = onStatus;
        return jest.fn();
      });

      const onError = jest.fn();
      renderHook(() => useSSEChannel("op-test", { onError }));

      await act(async () => {
        statusHandler?.({
          connected: false,
          retryCount: 2,
          code: SSE_ERROR_CODES.RETRYING,
          error: "Retrying connection",
        });
      });

      // onError should NOT be called for retry messages
      expect(onError).not.toHaveBeenCalled();
    });

    it("does not route success states through error handler", async () => {
      let statusHandler: ((status: SSEConnectionStatus) => void) | undefined;
      subscribeMock.mockImplementation((_operationId, _onEvent, onStatus) => {
        statusHandler = onStatus;
        return jest.fn();
      });

      const onError = jest.fn();
      renderHook(() => useSSEChannel("op-test", { onError }));

      await act(async () => {
        statusHandler?.({
          connected: true,
          retryCount: 0,
          code: SSE_ERROR_CODES.CONNECTION_ESTABLISHED,
        });
      });

      // onError should NOT be called for successful connection
      expect(onError).not.toHaveBeenCalled();
    });

    it("forwards actionable errors to onError callback", async () => {
      let statusHandler: ((status: SSEConnectionStatus) => void) | undefined;
      subscribeMock.mockImplementation((_operationId, _onEvent, onStatus) => {
        statusHandler = onStatus;
        return jest.fn();
      });

      const onError = jest.fn();
      renderHook(() => useSSEChannel("op-test", { onError }));

      await act(async () => {
        statusHandler?.({
          connected: false,
          retryCount: 0,
          error: "SSE connection failed with status 500",
        });
      });

      // onError should be called for actionable errors
      expect(onError).toHaveBeenCalledWith("SSE connection failed with status 500");
    });

    it("forwards rate limit errors as actionable", async () => {
      let statusHandler: ((status: SSEConnectionStatus) => void) | undefined;
      subscribeMock.mockImplementation((_operationId, _onEvent, onStatus) => {
        statusHandler = onStatus;
        return jest.fn();
      });

      const onError = jest.fn();
      renderHook(() => useSSEChannel("op-test", { onError }));

      await act(async () => {
        statusHandler?.({
          connected: false,
          retryCount: 0,
          code: SSE_ERROR_CODES.RATE_LIMIT_EXCEEDED,
          error: "Rate limit exceeded",
        });
      });

      // onError should be called for rate limit errors
      expect(onError).toHaveBeenCalledWith("Rate limit exceeded");
    });
  });
});
