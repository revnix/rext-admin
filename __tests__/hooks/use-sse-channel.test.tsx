/**
 * An operation's end reaches its subscriber once (D5b, rext-control#493). The provider's answer that
 * the operation already ended (the 422 it handles) says nothing of the outcome, so it's reported as
 * an end, never as a completion; a subscriber without an end handler keeps the completion event the
 * provider sends after it. A reconnect that replays the completion doesn't report it again.
 */

import { act, renderHook } from "@testing-library/react";
import { useSSEChannel } from "@/hooks/use-sse-channel";
import { SSE_ERROR_CODES, type SSEEvent } from "@/types/sse";

type OnEvent = (event: SSEEvent) => void;
type OnStatus = (status: {
  connected: boolean;
  retryCount: number;
  code?: string;
}) => void;

const mockSubscribe = jest.fn<
  () => void,
  [string, OnEvent | undefined, OnStatus | undefined]
>();

jest.mock("@/providers/sse-provider", () => ({
  useSSE: () => ({ subscribe: mockSubscribe }),
}));

jest.mock("@/services/notification-api", () => ({
  fetchNotifications: jest.fn().mockResolvedValue([]),
}));

const completion: SSEEvent = {
  id: "op-1_completed",
  operation_id: "op-1",
  scope: "workspace",
  step: "pipeline.completed",
  status: "completed",
  message: "Operation already completed",
  progress: 100,
  timestamp: "2026-10-07T05:00:00Z",
};

const ended = {
  connected: false,
  retryCount: 0,
  code: SSE_ERROR_CODES.OPERATION_COMPLETED,
};

function subscribeTo(operationId: string, withEnded = true) {
  const onComplete = jest.fn();
  const onEnded = jest.fn();
  renderHook(() =>
    useSSEChannel(operationId, {
      onComplete,
      onEnded: withEnded ? onEnded : undefined,
    }),
  );
  act(() => {
    jest.runOnlyPendingTimers(); // the subscribe delay
  });
  act(() => {
    jest.runOnlyPendingTimers(); // what the provider sends after subscribe() returns
  });
  return { onComplete, onEnded };
}

beforeEach(() => {
  jest.useFakeTimers();
  mockSubscribe.mockReset();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("an operation's end", () => {
  it("is reported as an end, not a completion, when the provider answers that it already ended", () => {
    mockSubscribe.mockImplementation((_id, _onEvent, onStatus) => {
      onStatus?.(ended);
      return () => undefined;
    });

    const { onComplete, onEnded } = subscribeTo("op-1");

    expect(onEnded).toHaveBeenCalledTimes(1);
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("is reported once when the provider sends both the answer and its own event", () => {
    // The provider's record of an ended operation: the status during subscribe(), an event after.
    mockSubscribe.mockImplementation((_id, onEvent, onStatus) => {
      setTimeout(() => onEvent?.(completion), 0);
      onStatus?.(ended);
      return () => undefined;
    });

    const { onComplete, onEnded } = subscribeTo("op-1");

    expect(onEnded).toHaveBeenCalledTimes(1);
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("reaches a subscriber without an end handler through the provider's event, once", () => {
    mockSubscribe.mockImplementation((_id, onEvent, onStatus) => {
      setTimeout(() => onEvent?.(completion), 0);
      onStatus?.(ended);
      return () => undefined;
    });

    expect(subscribeTo("op-1", false).onComplete).toHaveBeenCalledTimes(1);
  });

  it("is reported once when a reconnect replays the completion", () => {
    mockSubscribe.mockImplementation((_id, onEvent) => {
      setTimeout(() => {
        onEvent?.(completion);
        onEvent?.(completion);
      }, 0);
      return () => undefined;
    });

    expect(subscribeTo("op-1").onComplete).toHaveBeenCalledTimes(1);
  });
});
