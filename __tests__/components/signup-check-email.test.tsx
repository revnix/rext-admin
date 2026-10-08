import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SignupForm } from "@/components/signup-form";

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
jest.mock("@/lib/password-utils", () => ({
  checkPasswordBreach: async () => ({ breached: false, count: 0 }),
}));

const register = jest.fn();
const resendVerification = jest.fn();
const listWorkspaces = jest.fn();
const request = jest.fn();
jest.mock("@/lib/auth-utils", () => ({ getAuthHeaders: async () => ({}) }));
jest.mock("@/lib/api-client", () => {
  const actual = jest.requireActual("@/lib/api-client");
  return {
    ...actual,
    apiClient: {
      users: { register: (data: unknown) => register(data) },
      profile: {
        resendVerification: (email: string) => resendVerification(email),
      },
      workspaces: { list: () => listWorkspaces() },
      request: (path: string, init?: unknown) => request(path, init),
    },
  };
});

const EMAIL = "new.writer@example.com";

async function signUp() {
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { mutations: { retry: false } } })
      }
    >
      <SignupForm />
    </QueryClientProvider>,
  );
  await userEvent.type(screen.getByLabelText(/Full name/), "New Writer");
  await userEvent.type(screen.getByLabelText(/^\*?Email/), EMAIL);
  await userEvent.type(
    screen.getByLabelText(/^\*?Password/),
    "A-long-passphrase-1",
  );
  await userEvent.type(
    screen.getByLabelText(/Confirm password/),
    "A-long-passphrase-1",
  );
  await userEvent.click(screen.getByRole("button", { name: "Create account" }));
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("SignupForm, an account that must verify its email", () => {
  it("says where the link went and doesn't try to log in", async () => {
    register.mockResolvedValue({
      user: { id: "u1", email: EMAIL, email_verified: false },
      message: "ok",
    });
    await signUp();

    expect(
      await screen.findByRole("heading", { name: "Check your email" }),
    ).toBeInTheDocument();
    expect(screen.getByText(EMAIL)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute(
      "href",
      `/login?email=${encodeURIComponent(EMAIL)}`,
    );
    expect(signIn).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("sends the email again and says so", async () => {
    register.mockResolvedValue({
      user: { id: "u1", email: EMAIL, email_verified: false },
      message: "ok",
    });
    resendVerification.mockResolvedValue({ success: true });
    await signUp();

    await userEvent.click(
      await screen.findByRole("button", { name: "resend the email" }),
    );
    expect(resendVerification).toHaveBeenCalledWith(EMAIL);
    expect(
      await screen.findByText(
        `Sent again to ${EMAIL}. It can take a minute to arrive.`,
      ),
    ).toBeInTheDocument();
  });

  it("says when the email couldn't be sent again", async () => {
    register.mockResolvedValue({
      user: { id: "u1", email: EMAIL, email_verified: false },
      message: "ok",
    });
    resendVerification.mockRejectedValue(new Error("Too many requests"));
    await signUp();

    await userEvent.click(
      await screen.findByRole("button", { name: "resend the email" }),
    );
    expect(
      await screen.findByText(
        "The email couldn't be sent again just now. Wait a minute and try again.",
      ),
    ).toBeInTheDocument();
  });

  it("sends a verified account whose login was refused to the login form, saying so", async () => {
    register.mockResolvedValue({
      user: { id: "u1", email: EMAIL, email_verified: true },
      message: "ok",
    });
    // next-auth answers a refused login with ok and an error.
    signIn.mockResolvedValue({ ok: true, error: "CredentialsSignin" });
    await signUp();

    await screen.findByRole("button", { name: "Create account" });
    expect(toast.error).toHaveBeenCalledWith(
      "Your account is ready, but logging in didn't work. Log in to continue.",
    );
    expect(push).toHaveBeenCalledWith(
      `/login?email=${encodeURIComponent(EMAIL)}`,
    );
    expect(toast.success).not.toHaveBeenCalled();
    // No "check your email" for an account that is already verified.
    expect(
      screen.queryByRole("heading", { name: "Check your email" }),
    ).toBeNull();
  });

  it("logs a verified account in and opens its workspace, with no audit write of its own", async () => {
    register.mockResolvedValue({
      user: { id: "u1", email: EMAIL, email_verified: true },
      message: "ok",
    });
    signIn.mockResolvedValue({ ok: true, error: undefined });
    listWorkspaces.mockResolvedValue({
      workspaces: [{ slug: "acme", name: "Acme" }],
    });
    await signUp();

    await screen.findByRole("button", { name: "Create account" });
    expect(push).toHaveBeenCalledWith("/w/acme/generate-content");
    // The backend's register endpoint records user.create; the form adds no second entry.
    expect(request).not.toHaveBeenCalled();
    expect(listWorkspaces).toHaveBeenCalledTimes(1);
    expect(signIn.mock.invocationCallOrder[0]).toBeLessThan(
      listWorkspaces.mock.invocationCallOrder[0],
    );
  });
});
