/**
 * The sign-in form's own account of itself (rext-control task 712). The page is never recorded, so
 * the form says that "Log in" was pressed and, when it turns a person away, why: by kind, never by
 * the words of the answer and never with what was typed.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render } from "@testing-library/react";

const signIn = jest.fn();
const toast = {
  success: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  dismiss: jest.fn(),
};
const push = jest.fn();
// The address's query, as the page arrived with it.
let query = "";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push, back: jest.fn(), replace: jest.fn() }),
  useSearchParams: () => new URLSearchParams(query),
  usePathname: () => "/login",
}));
jest.mock("next-auth/react", () => ({
  signIn: (...args: unknown[]) => signIn(...args),
}));
jest.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast }) }));
jest.mock("@/hooks/use-invitation-validation", () => ({
  useInvitationValidation: () => ({
    invitationToken: null,
    invitation: null,
    isLoading: false,
    isValid: false,
    error: null,
  }),
}));
jest.mock("@/lib/analytics", () => ({ analytics: { track: jest.fn() } }));
jest.mock("@/lib/auth-utils", () => ({
  getAuthHeaders: async () => ({}),
  resetAuthRedirectState: jest.fn(),
}));
jest.mock("@/lib/api-client", () => ({
  apiClient: {
    workspaces: { list: async () => ({ workspaces: [{ slug: "acme" }] }) },
    account: { requestRecovery: jest.fn() },
  },
}));

import { LoginForm } from "@/components/login-form";
import { analytics } from "@/lib/analytics";
import {
  BACKEND_AWAY_CODE,
  SIGN_IN_AGAIN_AFTER_MS,
} from "@/lib/auth/backend-away";

const EMAIL = "ana@example.com";
const PASSWORD = "a-password";
const UNVERIFIED =
  "Please verify your email address before logging in. Check your inbox for the verification link.";

const track = analytics.track as jest.Mock;
const sent = (name: string) =>
  track.mock.calls
    .filter(([event]) => event === name)
    .map(([, properties]) => properties);

const wait = (ms: number) =>
  act(async () => {
    await jest.advanceTimersByTimeAsync(ms);
  });

async function pressLogIn(filled = true) {
  const { container } = render(
    <QueryClientProvider client={new QueryClient()}>
      <LoginForm />
    </QueryClientProvider>,
  );
  const field = (name: string) =>
    container.querySelector(`input[name="${name}"]`) as HTMLInputElement;
  if (filled) {
    fireEvent.change(field("email"), { target: { value: EMAIL } });
    fireEvent.change(field("password"), { target: { value: PASSWORD } });
  }
  await act(async () => {
    fireEvent.submit(container.querySelector("form") as HTMLFormElement);
    await jest.advanceTimersByTimeAsync(0);
  });
  await wait(0);
}

beforeEach(() => {
  jest.useFakeTimers();
  query = "";
  signIn.mockReset();
  push.mockReset();
  track.mockClear();
  for (const mock of Object.values(toast)) mock.mockReset();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("LoginForm, what it reports", () => {
  it("says that Log in was pressed, and that the details were wrong", async () => {
    signIn.mockResolvedValue({
      error: "CredentialsSignin",
      code: "Invalid email or password",
    });

    await pressLogIn();

    expect(sent("signin_submitted")).toEqual([{ method: "credentials" }]);
    expect(sent("signin_refused")).toEqual([{ kind: "credentials" }]);
    expect(sent("user_signed_in")).toEqual([]);
  });

  it("names an account whose email was never verified, without the backend's sentence or what was typed", async () => {
    signIn.mockResolvedValue({ error: "CredentialsSignin", code: UNVERIFIED });

    await pressLogIn();

    expect(sent("signin_refused")).toEqual([{ kind: "unverified" }]);
    const everything = JSON.stringify(track.mock.calls);
    for (const kept of [UNVERIFIED, EMAIL, PASSWORD]) {
      expect(everything).not.toContain(kept);
    }
  });

  it("calls a press on an empty form a refusal of the form's own, at its first field", async () => {
    await pressLogIn(false);

    expect(sent("signin_refused")).toEqual([{ kind: "form", field: "email" }]);
    expect(sent("signin_submitted")).toEqual([]);
    expect(signIn).not.toHaveBeenCalled();
  });

  it("says once that the backend was away, only when the second try found it away too", async () => {
    signIn.mockResolvedValue({
      error: "CredentialsSignin",
      code: BACKEND_AWAY_CODE,
    });

    await pressLogIn();
    expect(sent("signin_refused")).toEqual([]);

    await wait(SIGN_IN_AGAIN_AFTER_MS);
    await wait(0);

    expect(signIn).toHaveBeenCalledTimes(2);
    expect(sent("signin_refused")).toEqual([{ kind: "away" }]);
    expect(sent("signin_submitted")).toHaveLength(1);
  });

  it("says which error the page arrived with, by its code and once", async () => {
    query = "error=OAuthError";

    await pressLogIn(false);

    expect(sent("signin_error_shown")).toEqual([{ error: "OAuthError" }]);
  });

  it('calls an error that is not a plain code "other", and reports none when there is none', async () => {
    query = `error=${encodeURIComponent("Ana, your account ana@example.com is locked")}`;
    await pressLogIn(false);
    expect(sent("signin_error_shown")).toEqual([{ error: "other" }]);

    track.mockClear();
    query = "";
    await pressLogIn(false);
    expect(sent("signin_error_shown")).toEqual([]);
  });

  it("reports no refusal when the second try signs the person in", async () => {
    signIn
      .mockResolvedValueOnce({
        error: "CredentialsSignin",
        code: BACKEND_AWAY_CODE,
      })
      .mockResolvedValueOnce({ error: undefined, ok: true });

    await pressLogIn();
    await wait(SIGN_IN_AGAIN_AFTER_MS);
    await wait(0);

    expect(sent("signin_refused")).toEqual([]);
    expect(sent("user_signed_in")).toEqual([{ method: "credentials" }]);
  });
});
