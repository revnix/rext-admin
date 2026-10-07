/**
 * Sign-up offers the same ways in as login, with the same terms, and names the trial (C13): Google
 * and GitHub above "Or continue with email", their terms line between, and the trial's figures
 * from the catalogue, except on an invitation, which joins a workspace that already has its plan.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SignupForm } from "@/components/signup-form";
import { useInvitationValidation } from "@/hooks/use-invitation-validation";
import { analytics, clearOAuthLinking } from "@/lib/analytics";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const signIn = jest.fn();
jest.mock("next-auth/react", () => ({
  signIn: (...args: unknown[]) => signIn(...args),
}));
jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: { success: jest.fn(), error: jest.fn() } }),
}));
jest.mock("@/hooks/use-invitation-validation", () => ({
  useInvitationValidation: jest.fn(),
}));
jest.mock("@/lib/analytics", () => ({
  analytics: { track: jest.fn() },
  clearOAuthLinking: jest.fn(),
}));
jest.mock("@/lib/api-client", () => ({
  ...jest.requireActual("@/lib/api-client"),
  apiClient: {
    subscriptions: {
      getCatalog: async () => ({
        trial: {
          plan_name: "trial",
          days: 7,
          credits: 60,
          articles: 4,
          credits_renew: false,
          card_required: false,
          max_workspaces: 1,
          max_members_per_workspace: 1,
        },
      }),
    },
  },
}));

const invitation = useInvitationValidation as jest.Mock;
const noInvitation = {
  invitationToken: null,
  invitation: null,
  isLoading: false,
  isValid: false,
  error: null,
};

const renderSignup = () =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <SignupForm />
    </QueryClientProvider>,
  );

beforeEach(() => {
  jest.clearAllMocks();
  invitation.mockReturnValue(noInvitation);
});

it("offers Google and GitHub before the email form, with their terms line between", () => {
  renderSignup();
  const google = screen.getByRole("button", { name: "Google" });
  const github = screen.getByRole("button", { name: "GitHub" });
  const terms = screen.getByText(/By continuing with Google or GitHub/);
  const divider = screen.getByText("Or continue with email");
  const email = screen.getByLabelText(/Email/);

  const follows = (a: Node, b: Node) =>
    Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
  expect(follows(google, github)).toBe(true);
  expect(follows(github, terms)).toBe(true);
  expect(follows(terms, divider)).toBe(true);
  expect(follows(divider, email)).toBe(true);
});

it("sends Google back to the dashboard, recording only that it started", async () => {
  renderSignup();
  await userEvent.click(screen.getByRole("button", { name: "Google" }));
  expect(signIn).toHaveBeenCalledWith("google", { callbackUrl: "/" });
  // The sign-up itself is recorded once the backend says it created the account.
  expect(analytics.track).toHaveBeenCalledWith("oauth_started", {
    method: "google",
    page: "signup",
  });
  expect(analytics.track).not.toHaveBeenCalledWith(
    "user_signed_up",
    expect.anything(),
  );
  // A sign-up is never a link: an abandoned link's mark is cleared (C13b).
  expect(clearOAuthLinking).toHaveBeenCalled();
});

it("names the trial from the catalogue", async () => {
  renderSignup();
  expect(
    await screen.findByText(
      "A new account starts with a 7-day trial: 60 credits, about 4 articles, no card needed.",
    ),
  ).toBeInTheDocument();
});

it("names no trial on an invitation, and Google lands on the invitation", async () => {
  invitation.mockReturnValue({
    invitationToken: "tok en",
    invitation: {
      email: "new@example.com",
      workspace: { name: "Acme", slug: "acme" },
      invited_by: { full_name: "Ana" },
      role: { name: "editor" },
    },
    isLoading: false,
    isValid: true,
    error: null,
  });
  renderSignup();

  await userEvent.click(screen.getByRole("button", { name: "GitHub" }));
  expect(signIn).toHaveBeenCalledWith("github", {
    callbackUrl: "/invitations/accept?token=tok%20en",
  });
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(screen.queryByText(/-day trial/)).toBeNull();
});

it("keeps the invitation while it's being checked, with no trial line yet", async () => {
  invitation.mockReturnValue({
    ...noInvitation,
    invitationToken: "tok",
    isLoading: true,
  });
  renderSignup();

  await userEvent.click(screen.getByRole("button", { name: "Google" }));
  expect(signIn).toHaveBeenCalledWith("google", {
    callbackUrl: "/invitations/accept?token=tok",
  });
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(screen.queryByText(/-day trial/)).toBeNull();
});

it("names the trial after an invalid invitation, which signs up as usual", async () => {
  invitation.mockReturnValue({
    ...noInvitation,
    invitationToken: "expired",
    error: "This invitation has expired.",
  });
  renderSignup();

  expect(
    await screen.findByText(/7-day trial: 60 credits/),
  ).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "GitHub" }));
  expect(signIn).toHaveBeenCalledWith("github", { callbackUrl: "/" });
});
