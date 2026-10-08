/**
 * The streams and the session (rext-control tasks 879 and 858). A stream opened with its own
 * headers asked every five seconds with a token the backend had already refused, for as long as
 * the tab stayed open: one tab on live, 54 times in three minutes. It opens through the wrapper
 * every request goes through now, waits while the page has no session, and stops on a refusal
 * that is the stream's own.
 */

import { act, render } from "@testing-library/react";
import { useEffect } from "react";
import { reportSignedIn, reportSignedOut } from "@/lib/auth/signed-out";
import { SSEProvider, useSSE } from "@/providers/sse-provider";

jest.mock("@/lib/auth/go-to", () => ({ goTo: jest.fn() }));
jest.mock("@/lib/auth-utils", () => ({ authenticatedFetch: jest.fn() }));
jest.mock("@/lib/logger", () => {
  const quiet = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
  const logger = { ...quiet, forComponent: () => quiet };
  return { logger, log: logger };
});

type Opening = {
  fetch: (input: string, init?: RequestInit) => Promise<Response>;
  headers: Record<string, string>;
  signal: AbortSignal;
  onopen: (response: Response) => Promise<void>;
};
// Each connection the provider opens: the wrapper is asked, the answer goes to `onopen`, and an
// accepted stream stays open until the provider gives it up.
const mockOpened: string[] = [];
jest.mock("@microsoft/fetch-event-source", () => ({
  fetchEventSource: jest.fn(async (url: string, options: Opening) => {
    mockOpened.push(url);
    const response = await options.fetch(url, {
      headers: options.headers,
      signal: options.signal,
    });
    await options.onopen(response);
    await new Promise<void>((resolve) => {
      options.signal.addEventListener("abort", () => resolve(), { once: true });
    });
  }),
}));

const send = jest.requireMock("@/lib/auth-utils")
  .authenticatedFetch as jest.Mock;

/** An answer to the stream's opening, as much of a Response as the provider reads. */
function answer(status: number, body: unknown = {}) {
  const response = {
    ok: status < 400,
    status,
    json: async () => body,
    clone: () => response,
  };
  return response;
}
const noSession = () =>
  answer(401, {
    success: false,
    error: { code: "signed_out", message: "You've been signed out." },
  });

const statuses: Array<{ connected: boolean; error?: string }> = [];

function Listener({ channel }: { channel: string }) {
  const { subscribe } = useSSE();
  useEffect(
    () =>
      subscribe(
        channel,
        () => undefined,
        (status) => statuses.push(status),
      ),
    [subscribe, channel],
  );
  return null;
}

async function listenTo(channel: string) {
  const view = render(
    <SSEProvider baseUrl="https://api.example.test">
      <Listener channel={channel} />
    </SSEProvider>,
  );
  await act(async () => {
    await jest.advanceTimersByTimeAsync(0);
  });
  return view;
}
const later = (ms: number) =>
  act(async () => {
    await jest.advanceTimersByTimeAsync(ms);
  });

const NOTIFICATIONS = "user-notifications-u1";

beforeEach(() => {
  jest.useFakeTimers();
  send.mockReset();
  mockOpened.length = 0;
  statuses.length = 0;
  reportSignedIn();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("a stream's opening", () => {
  it("goes through the wrapper every request goes through, with no token of its own", async () => {
    send.mockResolvedValue(answer(200));
    const view = await listenTo(NOTIFICATIONS);

    expect(send).toHaveBeenCalledTimes(1);
    const [url, init] = send.mock.calls[0];
    expect(url).toBe(
      "https://api.example.test/api/v1/events/user-notifications-u1",
    );
    expect(init.headers).toEqual({ Accept: "text/event-stream" });
    expect(statuses.at(-1)).toMatchObject({ connected: true });
    view.unmount();
  });

  it("asks nobody while the page has no session, and opens again once it has one", async () => {
    // The wrapper's own answer for a page with no session; it says so as it gives it.
    send.mockImplementationOnce(async () => {
      reportSignedOut();
      return noSession();
    });
    const view = await listenTo(NOTIFICATIONS);
    expect(send).toHaveBeenCalledTimes(1);

    // Minutes pass: nothing more is asked, of the wrapper or of anyone.
    await later(180_000);
    expect(send).toHaveBeenCalledTimes(1);
    expect(mockOpened).toHaveLength(1);

    // The person signed in again from another tab.
    send.mockResolvedValue(answer(200));
    await act(async () => {
      reportSignedIn();
      await jest.advanceTimersByTimeAsync(0);
    });
    expect(send).toHaveBeenCalledTimes(2);
    expect(statuses.at(-1)).toMatchObject({ connected: true });
    view.unmount();
  });

  it("stops on a refusal that is the stream's own, with a session in hand", async () => {
    send.mockResolvedValue(
      answer(401, { error: { code: "unauthorized", message: "Not yours" } }),
    );
    const view = await listenTo(NOTIFICATIONS);

    await later(180_000);

    expect(send).toHaveBeenCalledTimes(1);
    expect(statuses.at(-1)).toMatchObject({
      connected: false,
      error: "Connection refused",
    });
    view.unmount();
  });

  it("keeps trying through a server that is away: the notification channel lives as long as the page", async () => {
    send.mockResolvedValue(answer(503));
    const view = await listenTo(NOTIFICATIONS);

    // Well past the five tries an operation's stream gets.
    await later(120_000);

    expect(send.mock.calls.length).toBeGreaterThan(8);
    view.unmount();
  });
});
