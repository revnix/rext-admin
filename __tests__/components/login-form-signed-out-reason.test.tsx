/**
 * A person the dashboard signed out lands on the sign-in page with the reason in the address
 * (revnix/rext-control#858): the page says which it was. A session the backend ended is not
 * called "expired", which is untrue for someone who signed in a minute ago.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";

const toast = {
  success: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  dismiss: jest.fn(),
};
// One object per page opened, as the router gives: the page reads it once.
let address = new URLSearchParams();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
  useSearchParams: () => address,
  usePathname: () => "/login",
}));
jest.mock("next-auth/react", () => ({ signIn: jest.fn() }));
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
    workspaces: { list: async () => ({ workspaces: [] }) },
    account: { requestRecovery: jest.fn() },
  },
}));

import { LoginForm } from "@/components/login-form";

function openSignInPage(search: string) {
  address = new URLSearchParams(search);
  render(
    <QueryClientProvider client={new QueryClient()}>
      <LoginForm />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  for (const mock of Object.values(toast)) mock.mockReset();
});

describe("The sign-in page says why the person is there", () => {
  it("says the session was ended when the backend ended it", () => {
    openSignInPage("error=SessionEnded&redirect=%2Fw%2Facme%2Farticles");

    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(toast.error).toHaveBeenCalledWith(
      "You were signed out because this session was ended. Please log in again.",
    );
  });

  it("still says a session expired when it did", () => {
    openSignInPage("error=SessionExpired");

    expect(toast.error).toHaveBeenCalledWith(
      "Your session has expired. Please log in again.",
    );
  });

  it("says what to do when a Google or GitHub sign-in didn't go through", () => {
    // The backend refused the sign-in (its limiter, or a failure of its own): the route guard
    // sends the person here with OAuthError.
    openSignInPage("error=OAuthError");

    expect(toast.error).toHaveBeenCalledWith(
      "Signing in with Google or GitHub didn't work just now. Wait a minute and try again.",
    );
  });

  it("has words a person can act on for a reason it doesn't know", () => {
    openSignInPage("error=SomethingNew");

    expect(toast.error).toHaveBeenCalledWith(
      "Signing in didn't work just now. Wait a minute and try again.",
    );
  });

  it("says nothing when the person came by themselves", () => {
    openSignInPage("");

    expect(toast.error).not.toHaveBeenCalled();
  });
});
