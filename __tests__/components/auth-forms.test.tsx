import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PasswordInput } from "@/components/forms/password-input";
import { LoginForm } from "@/components/login-form";
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

beforeEach(() => {
  jest.clearAllMocks();
});

describe("PasswordInput", () => {
  it("hides what was typed until asked, then shows it", async () => {
    render(<PasswordInput aria-label="Password" />);
    const input = screen.getByLabelText("Password");
    expect(input).toHaveAttribute("type", "password");

    await userEvent.click(
      screen.getByRole("button", { name: "Show password" }),
    );
    expect(input).toHaveAttribute("type", "text");

    await userEvent.click(
      screen.getByRole("button", { name: "Hide password" }),
    );
    expect(input).toHaveAttribute("type", "password");
  });
});

describe("LoginForm", () => {
  it("says what Google or GitHub agree to, since they create an account for someone new", () => {
    render(<LoginForm />);
    expect(
      screen.getByText(/By continuing with Google or GitHub/),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^Terms/ })).toHaveAttribute(
      "href",
      "https://rext.ai/terms",
    );
  });

  it("names each empty field beside it and sends nothing", async () => {
    render(<LoginForm />);
    await userEvent.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByText("Enter your email address")).toBeVisible();
    expect(screen.getByText("Enter password")).toBeVisible();
    expect(signIn).not.toHaveBeenCalled();
  });

  it("shows wrong details beside the password, not in a toast", async () => {
    signIn.mockResolvedValue({
      error: "CredentialsSignin",
      code: "Invalid email or password",
    });
    render(<LoginForm />);
    await userEvent.type(
      screen.getByLabelText(/Email/),
      "Someone@Example.com ",
    );
    await userEvent.type(
      screen.getByLabelText(/^\*?Password/),
      "not-the-password",
    );
    await userEvent.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByText("Invalid email or password")).toBeVisible();
    expect(screen.getByLabelText(/^\*?Password/)).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(toast.error).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(signIn).toHaveBeenCalledWith(
        "credentials",
        expect.objectContaining({
          email: "someone@example.com",
          password: "not-the-password",
        }),
      ),
    );
  });
});

describe("SignupForm", () => {
  it("says what creating an account agrees to, with the website's legal pages", () => {
    render(<SignupForm />);
    expect(screen.getByRole("link", { name: /^Terms/ })).toHaveAttribute(
      "href",
      "https://rext.ai/terms",
    );
    expect(
      screen.getByRole("link", { name: /^Privacy Policy/ }),
    ).toHaveAttribute("href", "https://rext.ai/privacy");
  });

  it("asks for a length, not character rules", () => {
    render(<SignupForm />);
    expect(screen.getByText("At least 8 characters.")).toBeVisible();
    expect(screen.queryByText(/uppercase/i)).toBeNull();
  });

  it("re-checks a typed confirmation when the password changes", async () => {
    render(<SignupForm />);
    const password = screen.getByLabelText(/^\*?Password/);
    const confirm = screen.getByLabelText(/Confirm password/);
    await userEvent.type(screen.getByLabelText(/Full name/), "Ada Lovelace");
    await userEvent.type(screen.getByLabelText(/Email/), "ada@example.com");
    await userEvent.type(password, "a-long-passphrase");
    await userEvent.type(confirm, "a-long-passphrasx");
    await userEvent.tab();
    expect(await screen.findByText("Passwords don't match")).toBeVisible();

    await userEvent.clear(password);
    await userEvent.type(password, "a-long-passphrasx");
    await waitFor(() =>
      expect(screen.queryByText("Passwords don't match")).toBeNull(),
    );
  });
});
