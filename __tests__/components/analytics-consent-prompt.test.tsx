/**
 * The question about analytics and the answer kept on the account (rext-control task 712): an
 * answer given in another browser is this one's too, a choice made here goes to the account, and
 * nothing of it happens while an admin acts as a customer.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AnalyticsConsentPrompt } from "@/components/privacy/analytics-consent-prompt";
import { readConsent, writeConsent } from "@/lib/analytics-consent";

const store = jest.fn();
jest.mock("@/lib/api-client", () => ({
  apiClient: {
    profile: {
      storeAnalyticsAnswer: (answer: unknown, region: unknown) =>
        store(answer, region),
    },
  },
}));
const mockActing = { asCustomer: false };
jest.mock("@/lib/analytics", () => ({
  isImpersonating: () => mockActing.asCustomer,
}));
jest.mock("next-auth/react", () => ({
  useSession: () => ({
    status: "authenticated",
    data: { user: { id: "u1", role: "owner" } },
  }),
}));

function setCookie(cookie: string) {
  // biome-ignore lint/suspicious/noDocumentCookie: the module under test reads document.cookie
  document.cookie = cookie;
}
const stored = (answer: "granted" | "denied" | null) => ({
  answer,
  region: "eea",
  answered_at: null,
});
const renderPrompt = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <AnalyticsConsentPrompt />
    </QueryClientProvider>,
  );
const question = "May we measure how you use Rext?";
const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const realFetch = global.fetch;

beforeAll(() => {
  process.env.NEXT_PUBLIC_POSTHOG_KEY = "phc_test";
});
afterAll(() => {
  process.env.NEXT_PUBLIC_POSTHOG_KEY = key;
  global.fetch = realFetch;
});
beforeEach(() => {
  jest.clearAllMocks();
  window.localStorage.clear();
  setCookie("rext-consent=; Max-Age=0; Path=/");
  // Asked first here: the EEA.
  setCookie("rext-region=eea; Path=/");
  mockActing.asCustomer = false;
  store.mockResolvedValue(stored(null));
  // The choice's cookie is also set by the app's own server.
  global.fetch = jest
    .fn()
    .mockResolvedValue({ ok: true }) as unknown as typeof fetch;
});

it("asks where nobody has answered, after writing where the person is to their account", async () => {
  renderPrompt();

  expect(await screen.findByText(question)).toBeVisible();
  // A null answer undoes nothing on the account: it writes the region and reads the answer.
  expect(store).toHaveBeenCalledTimes(1);
  expect(store).toHaveBeenCalledWith(null, "eea");
});

it("takes an answer given in another browser, and asks nothing", async () => {
  store.mockResolvedValue(stored("granted"));
  renderPrompt();

  await waitFor(() => expect(readConsent()).toBe("granted"));
  expect(screen.queryByText(question)).toBeNull();
  // Taken over, not chosen here: nothing is written back.
  expect(store).toHaveBeenCalledTimes(1);
});

it("writes this browser's answer to an account that has none, when it is that account's own", async () => {
  setCookie("rext-consent=denied; Path=/");
  window.localStorage.setItem("rext-analytics-answer-of", "u1");
  renderPrompt();

  await waitFor(() => expect(store).toHaveBeenCalledWith("denied", "eea"));
  expect(screen.queryByText(question)).toBeNull();
});

it("never writes an answer someone else left in this browser to this account", async () => {
  // Another account said yes here before; this one has answered nowhere.
  setCookie("rext-consent=granted; Path=/");
  window.localStorage.setItem("rext-analytics-answer-of", "someone-else");
  renderPrompt();

  await waitFor(() => expect(store).toHaveBeenCalledTimes(1));
  await new Promise((resolve) => setTimeout(resolve, 20));
  expect(store.mock.calls).toEqual([[null, "eea"]]);
});

it("ends with the last of two quick choices on the account", async () => {
  renderPrompt();
  await screen.findByText(question);
  // The account answers slowly from here on: each write waits to be let through.
  const waiting: Array<() => void> = [];
  store.mockImplementation(
    () =>
      new Promise((resolve) => {
        waiting.push(() => resolve(stored(null)));
      }),
  );

  const sent = () => store.mock.calls.slice(1);
  const standing = () =>
    window.localStorage.getItem("rext-analytics-answer:u1");

  await act(async () => {
    writeConsent("granted");
    writeConsent("denied");
  });
  // One request at a time: the second waits for the first.
  await waitFor(() => expect(sent()).toEqual([["granted", "eea"]]));
  await act(async () => {
    waiting[0]();
  });

  await waitFor(() =>
    expect(sent()).toEqual([
      ["granted", "eea"],
      ["denied", "eea"],
    ]),
  );
  expect(standing()).toBe("unsent");
  await act(async () => {
    waiting[1]();
  });
  await waitFor(() => expect(standing()).toBe("synced"));
});

it("does nothing with an answer that comes back after the shell has gone", async () => {
  let answer: (value: unknown) => void = () => {};
  store.mockImplementation(
    () =>
      new Promise((resolve) => {
        answer = resolve;
      }),
  );
  const view = renderPrompt();
  await waitFor(() => expect(store).toHaveBeenCalledTimes(1));

  view.unmount();
  answer(stored("granted"));
  await new Promise((resolve) => setTimeout(resolve, 20));

  expect(readConsent()).toBeNull();
  expect(window.localStorage.getItem("rext-analytics-answer:u1")).toBeNull();
});

it("sends a choice made here to the account", async () => {
  renderPrompt();
  await userEvent.click(await screen.findByRole("button", { name: "Allow" }));

  await waitFor(() => expect(store).toHaveBeenCalledWith("granted", "eea"));
  expect(readConsent()).toBe("granted");
  expect(screen.queryByText(question)).toBeNull();
});

it("asks as before where the backend doesn't answer", async () => {
  store.mockRejectedValue(new Error("offline"));
  renderPrompt();

  expect(await screen.findByText(question)).toBeVisible();
});

it("neither reads nor writes the account while an admin acts as a customer", async () => {
  mockActing.asCustomer = true;
  renderPrompt();

  await userEvent.click(
    await screen.findByRole("button", { name: "No thanks" }),
  );

  expect(store).not.toHaveBeenCalled();
});
