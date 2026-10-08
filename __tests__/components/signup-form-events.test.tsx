/**
 * The sign-up form's own account of itself (rext-control task 712). The page is never recorded, so
 * the form says that a person began, which fields they left filled, that they pressed the button,
 * and what turned them away, by kind. Nothing a person typed is in any event.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SignupForm } from "@/components/signup-form";
import { analytics } from "@/lib/analytics";
import { ApiError } from "@/lib/api-client";
import { SERVER_UNREACHABLE } from "@/lib/api-client/server-away";

const push = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push, back: jest.fn(), replace: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const signIn = jest.fn();
jest.mock("next-auth/react", () => ({
  signIn: (...args: unknown[]) => signIn(...args),
}));

const toast = { success: jest.fn(), error: jest.fn() };
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

const breach = jest.fn();
jest.mock("@/lib/password-utils", () => ({
  checkPasswordBreach: (password: string) => breach(password),
}));

const register = jest.fn();
const listWorkspaces = jest.fn();
jest.mock("@/lib/auth-utils", () => ({ getAuthHeaders: async () => ({}) }));
jest.mock("@/lib/api-client", () => {
  const actual = jest.requireActual("@/lib/api-client");
  return {
    ...actual,
    apiClient: {
      users: { register: (data: unknown) => register(data) },
      profile: { resendVerification: jest.fn() },
      workspaces: { list: () => listWorkspaces() },
      request: jest.fn(),
    },
  };
});

const NAME = "New Writer";
const EMAIL = "new.writer@example.com";
const PASSWORD = "A-long-passphrase-1";

const track = analytics.track as jest.Mock;
const sent = (name: string) =>
  track.mock.calls
    .filter(([event]) => event === name)
    .map(([, properties]) => properties);

function show() {
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { mutations: { retry: false } } })
      }
    >
      <SignupForm />
    </QueryClientProvider>,
  );
}

const pressCreate = () =>
  userEvent.click(screen.getByRole("button", { name: "Create account" }));

async function fillIn() {
  await userEvent.type(screen.getByLabelText(/Full name/), NAME);
  await userEvent.type(screen.getByLabelText(/^\*?Email/), EMAIL);
  await userEvent.type(screen.getByLabelText(/^\*?Password/), PASSWORD);
  await userEvent.type(screen.getByLabelText(/Confirm password/), PASSWORD);
}

beforeEach(() => {
  jest.clearAllMocks();
  breach.mockResolvedValue({ breached: false, count: 0 });
  listWorkspaces.mockResolvedValue({ workspaces: [] });
});

describe("SignupForm, what it reports", () => {
  it("says once that the person began, and each field once when it is left filled", async () => {
    show();

    await userEvent.type(screen.getByLabelText(/Full name/), NAME);
    expect(sent("signup_started")).toEqual([
      { method: "credentials", invited: false },
    ]);
    expect(sent("signup_field_filled")).toEqual([]);

    await userEvent.type(screen.getByLabelText(/^\*?Email/), EMAIL);
    expect(sent("signup_field_filled")).toEqual([{ field: "full_name" }]);

    await userEvent.type(screen.getByLabelText(/^\*?Password/), PASSWORD);
    await userEvent.type(screen.getByLabelText(/Confirm password/), PASSWORD);
    await userEvent.click(screen.getByLabelText(/Full name/));

    expect(sent("signup_field_filled")).toEqual([
      { field: "full_name" },
      { field: "email" },
      { field: "password" },
      { field: "confirm_password" },
    ]);
    expect(sent("signup_started")).toHaveLength(1);
  });

  it("calls a backend it could not reach unreachable, not a refusal of the details", async () => {
    register.mockRejectedValue(
      new ApiError(0, "Couldn't reach the server", SERVER_UNREACHABLE),
    );
    show();
    await fillIn();

    await pressCreate();

    await waitFor(() =>
      expect(sent("signup_refused")).toEqual([
        { kind: "unreachable", invited: false },
      ]),
    );
  });

  it("puts nothing a person typed in any event", async () => {
    register.mockRejectedValue(new ApiError(503, "Service unavailable"));
    show();
    await fillIn();
    await pressCreate();
    await waitFor(() => expect(sent("signup_refused")).toHaveLength(1));

    const everything = JSON.stringify(track.mock.calls);
    for (const typed of [NAME, EMAIL, PASSWORD]) {
      expect(everything).not.toContain(typed);
    }
  });

  it("calls a press on an unfinished form a refusal of the form's own, at its first field in error", async () => {
    show();
    await userEvent.type(screen.getByLabelText(/Full name/), NAME);

    await pressCreate();

    await waitFor(() =>
      expect(sent("signup_refused")).toEqual([
        { kind: "form", field: "email", invited: false },
      ]),
    );
    expect(sent("signup_submitted")).toEqual([]);
    expect(register).not.toHaveBeenCalled();
  });

  it("says the form was sent, and that the email already has an account", async () => {
    register.mockRejectedValue(new ApiError(409, "Conflict"));
    show();
    await fillIn();

    await pressCreate();

    await waitFor(() =>
      expect(sent("signup_refused")).toEqual([
        { kind: "exists", status: 409, invited: false },
      ]),
    );
    expect(sent("signup_submitted")).toEqual([
      { method: "credentials", invited: false },
    ]);
    expect(sent("user_signed_up")).toEqual([]);
  });

  it("tells a failing backend from details it turned down", async () => {
    register
      .mockRejectedValueOnce(new ApiError(500, "Internal error"))
      .mockRejectedValueOnce(new ApiError(422, "Password too short"));
    show();
    await fillIn();

    await pressCreate();
    await waitFor(() => expect(sent("signup_refused")).toHaveLength(1));
    await pressCreate();
    await waitFor(() => expect(sent("signup_refused")).toHaveLength(2));

    expect(sent("signup_refused")).toEqual([
      { kind: "backend", status: 500, invited: false },
      { kind: "rejected", status: 422, invited: false },
    ]);
  });

  it("says when the password was one found in a breach, before anything is sent to the backend", async () => {
    breach.mockResolvedValue({ breached: true, count: 12 });
    show();
    await fillIn();

    await pressCreate();

    await waitFor(() =>
      expect(sent("signup_refused")).toEqual([
        { kind: "password_breached", field: "password", invited: false },
      ]),
    );
    expect(register).not.toHaveBeenCalled();
  });

  // The live backend refuses a name that starts in lower case; on launch day that refused one
  // person three times in nine seconds (rext-control task 933). Until its rule is gone the name
  // is sent with its first letter raised, and the form keeps what was typed.
  it("sends a name typed in lower case so that the backend takes it, and leaves the field as typed", async () => {
    register.mockRejectedValue(new ApiError(503, "Service unavailable"));
    show();
    await userEvent.type(screen.getByLabelText(/Full name/), "john smith");
    await userEvent.type(screen.getByLabelText(/^\*?Email/), EMAIL);
    await userEvent.type(screen.getByLabelText(/^\*?Password/), PASSWORD);
    await userEvent.type(screen.getByLabelText(/Confirm password/), PASSWORD);

    await pressCreate();

    await waitFor(() => expect(register).toHaveBeenCalledTimes(1));
    expect(register.mock.calls[0][0]).toMatchObject({
      full_name: "John smith",
      email: EMAIL,
    });
    expect(screen.getByLabelText(/Full name/)).toHaveValue("john smith");
  });

  // The backend refuses a password without all four kinds of character; the form said only
  // "At least 8 characters" (rext-control task 938).
  it("says everything a password still needs before anything is sent", async () => {
    show();
    await userEvent.type(screen.getByLabelText(/Full name/), NAME);
    await userEvent.type(screen.getByLabelText(/^\*?Email/), EMAIL);
    await userEvent.type(
      screen.getByLabelText(/^\*?Password/),
      "blueberry pancakes",
    );
    await userEvent.type(
      screen.getByLabelText(/Confirm password/),
      "blueberry pancakes",
    );

    await pressCreate();

    expect(
      await screen.findByText(
        "Add an uppercase letter, a number and a special character such as ! or #",
      ),
    ).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
    expect(breach).not.toHaveBeenCalled();
  });

  it("does not call it a refused sign-up when the account exists and only the login after it fails", async () => {
    register.mockResolvedValue({
      user: { id: "u1", email: EMAIL, email_verified: true },
      message: "ok",
    });
    signIn.mockResolvedValue({
      ok: false,
      error: "CredentialsSignin",
      code: "Invalid email or password",
    });
    show();
    await fillIn();

    await pressCreate();

    await waitFor(() =>
      expect(sent("signin_refused")).toEqual([
        { kind: "credentials", after_sign_up: true },
      ]),
    );
    expect(sent("user_signed_up")).toEqual([{ method: "credentials" }]);
    expect(sent("signup_refused")).toEqual([]);
  });

  it("reports the login after a sign-up when it throws, and still no refused sign-up", async () => {
    register.mockResolvedValue({
      user: { id: "u1", email: EMAIL, email_verified: true },
      message: "ok",
    });
    signIn.mockRejectedValue(new TypeError("Failed to fetch"));
    show();
    await fillIn();

    await pressCreate();

    await waitFor(() =>
      expect(sent("signin_refused")).toEqual([
        { kind: "unreachable", after_sign_up: true },
      ]),
    );
    expect(sent("user_signed_up")).toHaveLength(1);
    expect(sent("signup_refused")).toEqual([]);
  });
});
