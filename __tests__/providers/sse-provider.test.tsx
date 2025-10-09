import type { FetchEventSourceInit } from "@microsoft/fetch-event-source";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { getAuthHeaders } from "@/lib/auth-utils";
import { SSEProvider, useSSE } from "@/providers/sse-provider";
import type { SSEEvent } from "@/types/sse";

jest.mock("@microsoft/fetch-event-source");
jest.mock("@/lib/auth-utils", () => ({
  getAuthHeaders: jest.fn(),
}));

const fetchEventSourceMock = fetchEventSource as jest.MockedFunction<
  typeof fetchEventSource
>;
const getAuthHeadersMock = getAuthHeaders as jest.MockedFunction<
  typeof getAuthHeaders
>;

type FetchControl = {
  options: FetchEventSourceInit;
  reject: (error: unknown) => void;
};

describe("SSEProvider", () => {
  let controls: FetchControl[] = [];

  beforeEach(() => {
    jest.resetAllMocks();
    controls = [];
    getAuthHeadersMock.mockResolvedValue({});

    fetchEventSourceMock.mockImplementation((_url, init) => {
      const options = (init ?? {}) as FetchEventSourceInit;
      const { signal } = options;
      let settled = false;

      return new Promise<void>((_resolve, reject) => {
        const rejectOnce = (error: unknown) => {
          if (settled) {
            return;
          }
          settled = true;
          reject(error);
        };

        if (signal) {
          if (signal.aborted) {
            rejectOnce(new DOMException("Aborted", "AbortError"));
            return;
          }

          signal.addEventListener("abort", () => {
            rejectOnce(new DOMException("Aborted", "AbortError"));
          });
        }

        controls.push({
          options,
          reject: rejectOnce,
        });
      });
    });
  });

  const renderUseSSE = (baseUrl?: string) =>
    renderHook(() => useSSE(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <SSEProvider baseUrl={baseUrl}>{children}</SSEProvider>
      ),
    });

  it("opens a subscription with auth headers and correct endpoint", async () => {
    getAuthHeadersMock.mockResolvedValue({
      Authorization: "Bearer test-token",
    });

    const { result } = renderUseSSE("https://api.example.com");

    let unsubscribe: (() => void) | undefined;

    await act(async () => {
      unsubscribe = result.current.subscribe("op-123", jest.fn(), jest.fn());
      await Promise.resolve();
    });

    expect(fetchEventSourceMock).toHaveBeenCalledTimes(1);

    const [url, options] = fetchEventSourceMock.mock.calls[0];

    expect(url).toBe("https://api.example.com/api/v1/events/op-123");
    expect(options?.headers).toEqual({
      Accept: "text/event-stream",
      Authorization: "Bearer test-token",
    });

    act(() => {
      unsubscribe?.();
    });
  });

  it("forwards events and stops on pipeline completion", async () => {
    const onEvent = jest.fn();
    const onStatus = jest.fn();

    const { result } = renderUseSSE("https://api.example.com");

    await act(async () => {
      result.current.subscribe("op-456", onEvent, onStatus);
      await Promise.resolve();
    });

    expect(fetchEventSourceMock).toHaveBeenCalledTimes(1);
    const control = controls[0];
    const { options } = control;

    await act(async () => {
      options.onopen?.({ ok: true, status: 200 } as Response);
    });

    expect(onStatus).toHaveBeenCalledWith({ connected: true, retryCount: 0 });

    const progressEvent: SSEEvent = {
      id: "evt-1",
      operation_id: "op-456",
      scope: "workspace",
      step: "scrape.progress",
      status: "progress",
      message: "Scraping",
      progress: 25,
      timestamp: new Date().toISOString(),
    };

    await act(async () => {
      options.onmessage?.({
        data: JSON.stringify(progressEvent),
        event: progressEvent.step,
        id: progressEvent.id,
      });
    });

    expect(onEvent).toHaveBeenLastCalledWith(progressEvent);

    const completionEvent: SSEEvent = {
      id: "evt-2",
      operation_id: "op-456",
      scope: "workspace",
      step: "pipeline.completed",
      status: "completed",
      message: "Done",
      progress: 100,
      timestamp: new Date().toISOString(),
    };

    await act(async () => {
      options.onmessage?.({
        data: JSON.stringify(completionEvent),
        event: completionEvent.step,
        id: completionEvent.id,
      });
    });

    expect(onEvent).toHaveBeenLastCalledWith(completionEvent);

    await waitFor(() =>
      expect(onStatus).toHaveBeenCalledWith({
        connected: false,
        retryCount: 0,
      }),
    );
  });

  it("retries with exponential backoff up to the limit", async () => {
    jest.useFakeTimers();

    const onStatus = jest.fn();
    const { result } = renderUseSSE("https://api.example.com");

    await act(async () => {
      result.current.subscribe("op-789", jest.fn(), onStatus);
      await Promise.resolve();
    });

    expect(fetchEventSourceMock).toHaveBeenCalledTimes(1);

    const triggerError = async (control: FetchControl, error: unknown) => {
      await act(async () => {
        try {
          control.options.onerror?.(error);
        } catch {
          // Expected - onerror throws to signal retry
        }
        control.reject(error);
        await Promise.resolve();
      });
    };

    const advanceDelay = async (attempt: number) => {
      const delay = Math.min(1000 * 2 ** (attempt - 1), 10_000);
      await act(async () => {
        jest.advanceTimersByTime(delay);
        await Promise.resolve();
      });
    };

    const error = new Error("network failure");

    for (let attempt = 1; attempt <= 5; attempt += 1) {
      const control = controls[attempt - 1];
      await triggerError(control, error);

      if (attempt < 5) {
        expect(onStatus).toHaveBeenLastCalledWith({
          connected: false,
          retryCount: attempt,
          error: "Connection lost, retrying...",
        });

        await advanceDelay(attempt);

        await waitFor(() =>
          expect(fetchEventSourceMock).toHaveBeenCalledTimes(attempt + 1),
        );
      } else {
        expect(onStatus).toHaveBeenLastCalledWith({
          connected: false,
          retryCount: attempt,
          error: "Connection failed after multiple retries",
        });
      }
    }

    jest.useRealTimers();
  });
});
