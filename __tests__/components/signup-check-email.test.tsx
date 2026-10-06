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
jest.mock("@/lib/api-client", () => {
  const actual = jest.requireActual("@/lib/api-client");
  return {
    ...actual,
    apiClient: {
      users: { register: (data: unknown) => register(data) },
      profile: {
        resendVerification: (email: string) => resendVerification(email),
      },
    },
  };
});

const EMAIL = "new.writer@example.com";

async function signUp() {
  render(<SignupForm />);
  await userEvent.type(screen.getByLabelText(/Full name/), "New Writer");
  await userEvent.type(screen.getByLabelText(/^\*?Email/), EMAIL);
  await userEvent.type(
    screen.getByLabelText(/^\*?Password/),
    "a-long-passphrase-1",
  );
  await userEvent.type(
    screen.getByLabelText(/Confirm password/),
    "a-long-passphrase-1",
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

  it("shows the same page when the login after sign-up is refused", async () => {
    register.mockResolvedValue({
      user: { id: "u1", email: EMAIL, email_verified: true },
      message: "ok",
    });
    // next-auth answers a refused login with ok and an error.
    signIn.mockResolvedValue({ ok: true, error: "CredentialsSignin" });
    await signUp();

    expect(
      await screen.findByRole("heading", { name: "Check your email" }),
    ).toBeInTheDocument();
    expect(toast.success).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });
});
