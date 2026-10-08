/**
 * The incident banner in the shell (rext-control#728): it shows what the backend says is showing,
 * and it can never hold or break a page: a failed read, a slow one, an answer that isn't a banner
 * and anything thrown inside it all show nothing, with the page beside it untouched.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor } from "@testing-library/react";

import { IncidentBanner } from "@/components/shell/incident-banner";
import { apiClient } from "@/lib/api-client";
import {
  INCIDENT_BANNER_POLL_MS,
  INCIDENT_BANNER_TIMEOUT_MS,
} from "@/lib/incident-banner";

jest.mock("@/lib/api-client", () => ({
  apiClient: { incidentBanner: { get: jest.fn() } },
}));

const read = apiClient.incidentBanner.get as jest.Mock;

const soon = () => new Date(Date.now() + 30 * 60 * 1000).toISOString();
const banner = (changes: Record<string, unknown> = {}) => ({
  active: true,
  message: "Article writing is slower than usual. We're working on it.",
  areas: ["generation", "keyword_research"],
  started_at: new Date().toISOString(),
  expires_at: soon(),
  ...changes,
});
const NONE = {
  active: false,
  message: null,
  areas: [],
  started_at: null,
  expires_at: null,
};

function renderShell() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <IncidentBanner />
      <main>The page</main>
    </QueryClientProvider>,
  );
}

beforeEach(() => jest.clearAllMocks());
afterEach(() => jest.useRealTimers());

describe("IncidentBanner", () => {
  it("shows the banner the backend says is showing, with what is affected", async () => {
    read.mockResolvedValue(banner());
    renderShell();

    const notice = await screen.findByRole("alert");
    expect(notice).toHaveTextContent("We're having trouble right now");
    expect(notice).toHaveTextContent(
      "Article writing is slower than usual. We're working on it.",
    );
    expect(notice).toHaveTextContent(
      "Affected: writing articles, keyword research.",
    );
  });

  it("shows nothing when there is no banner", async () => {
    read.mockResolvedValue(NONE);
    renderShell();
    await waitFor(() => expect(read).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByText("The page")).toBeVisible();
  });

  it("shows the message as text, never as markup", async () => {
    read.mockResolvedValue(
      banner({
        message:
          '<img src=x onerror="alert(1)"> <a href="https://x.test">x</a>',
      }),
    );
    renderShell();
    const notice = await screen.findByRole("alert");
    expect(notice).toHaveTextContent('<img src=x onerror="alert(1)">');
    expect(notice.querySelector("img")).toBeNull();
    expect(notice.querySelector("a")).toBeNull();
  });

  it("shows nothing, and leaves the page alone, when the read fails", async () => {
    read.mockRejectedValue(new Error("We couldn't reach the server."));
    renderShell();
    await waitFor(() => expect(read).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByText("The page")).toBeVisible();
    // Not tried again before the next minute.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    expect(read).toHaveBeenCalledTimes(1);
  });

  it("shows nothing for an answer that isn't a banner", async () => {
    read.mockResolvedValue({ active: true, message: { text: "an object" } });
    renderShell();
    await waitFor(() => expect(read).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByText("The page")).toBeVisible();
  });

  it("drops a read that hasn't answered in four seconds, with the page up all along", async () => {
    jest.useFakeTimers();
    let dropped = false;
    read.mockImplementation(
      (signal: AbortSignal) =>
        new Promise((_resolve, reject) => {
          signal.addEventListener("abort", () => {
            dropped = true;
            reject(new DOMException("Aborted", "AbortError"));
          });
        }),
    );
    renderShell();

    // The page is there at once: the banner's read is not in its way.
    expect(screen.getByText("The page")).toBeVisible();
    await act(async () => {
      await jest.advanceTimersByTimeAsync(INCIDENT_BANNER_TIMEOUT_MS - 1);
    });
    expect(dropped).toBe(false);
    await act(async () => {
      await jest.advanceTimersByTimeAsync(2);
    });
    expect(dropped).toBe(true);
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByText("The page")).toBeVisible();
  });

  it("reads again each minute: a banner switched on shows, and one switched off goes", async () => {
    jest.useFakeTimers();
    read.mockResolvedValue(NONE);
    renderShell();
    await act(async () => {
      await jest.advanceTimersByTimeAsync(10);
    });
    expect(screen.queryByRole("alert")).toBeNull();

    read.mockResolvedValue(banner());
    await act(async () => {
      await jest.advanceTimersByTimeAsync(INCIDENT_BANNER_POLL_MS);
    });
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Article writing is slower than usual.",
    );

    read.mockResolvedValue(NONE);
    await act(async () => {
      await jest.advanceTimersByTimeAsync(INCIDENT_BANNER_POLL_MS);
    });
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("turns anything thrown inside it into no banner", async () => {
    const error = jest.spyOn(console, "error").mockImplementation(() => {});
    // A value whose reading throws: the banner's own boundary takes it.
    read.mockResolvedValue({
      active: true,
      get message(): string {
        throw new Error("a getter that throws");
      },
    });
    renderShell();
    await waitFor(() => expect(read).toHaveBeenCalledTimes(1));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByText("The page")).toBeVisible();
    error.mockRestore();
  });
});
