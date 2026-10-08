/**
 * "Log in" pressed while the backend is away (revnix/rext-control#858): the form says Rext is
 * updating and tries once more by itself, instead of ending in silence.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen } from "@testing-library/react";

const signIn = jest.fn();
const toast = {
  success: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  dismiss: jest.fn(),
};
const push = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push, back: jest.fn(), replace: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
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
import {
  BACKEND_AWAY_CODE,
  SIGN_IN_AGAIN_AFTER_MS,
} from "@/lib/auth/backend-away";

const away = { error: "CredentialsSignin", code: BACKEND_AWAY_CODE };
const signedIn = { error: undefined, ok: true };

async function pressLogIn() {
  const { container } = render(
    <QueryClientProvider client={new QueryClient()}>
      <LoginForm />
    </QueryClientProvider>,
  );
  const field = (name: string) =>
    container.querySelector(`input[name="${name}"]`) as HTMLInputElement;
  fireEvent.change(field("email"), { target: { value: "ana@example.com" } });
  fireEvent.change(field("password"), { target: { value: "a-password" } });
  await act(async () => {
    fireEvent.submit(container.querySelector("form") as HTMLFormElement);
    await jest.advanceTimersByTimeAsync(0);
  });
}

const wait = (ms: number) =>
  act(async () => {
    await jest.advanceTimersByTimeAsync(ms);
  });

beforeEach(() => {
  jest.useFakeTimers();
  signIn.mockReset();
  push.mockReset();
  for (const mock of Object.values(toast)) mock.mockReset();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("Log in while the backend is away", () => {
  it("says Rext is updating, tries once more by itself, and signs in when it is back", async () => {
    signIn.mockResolvedValueOnce(away).mockResolvedValueOnce(signedIn);

    await pressLogIn();

    expect(signIn).toHaveBeenCalledTimes(1);
    expect(toast.info).toHaveBeenCalledWith(
      "Rext is updating",
      expect.objectContaining({
        description: "Signing you in again in a few seconds.",
      }),
    );
    expect(toast.error).not.toHaveBeenCalled();

    await wait(SIGN_IN_AGAIN_AFTER_MS);
    await wait(0);

    expect(signIn).toHaveBeenCalledTimes(2);
    expect(toast.success).toHaveBeenCalledWith("Login successful!");
    expect(toast.error).not.toHaveBeenCalled();
    expect(toast.dismiss).toHaveBeenCalledTimes(1);
  });

  it("says so plainly when it is still away, and gives the button back", async () => {
    signIn.mockResolvedValue(away);

    await pressLogIn();
    await wait(SIGN_IN_AGAIN_AFTER_MS);
    await wait(0);

    expect(signIn).toHaveBeenCalledTimes(2);
    expect(toast.error).toHaveBeenCalledWith(
      "Rext is updating",
      expect.objectContaining({ description: "Try again in a few seconds." }),
    );
    expect(toast.success).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Log in" })).toBeEnabled();

    // Not a third time by itself.
    await wait(SIGN_IN_AGAIN_AFTER_MS * 3);
    expect(signIn).toHaveBeenCalledTimes(2);
  });

  it("does not try again for a wrong password", async () => {
    signIn.mockResolvedValue({
      error: "CredentialsSignin",
      code: "Invalid email or password",
    });

    await pressLogIn();
    await wait(SIGN_IN_AGAIN_AFTER_MS * 2);

    expect(signIn).toHaveBeenCalledTimes(1);
    expect(toast.info).not.toHaveBeenCalled();
  });
});
