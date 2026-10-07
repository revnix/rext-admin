import { render, screen } from "@testing-library/react";
import { GuestGuard } from "@/components/auth-guard";

const push = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams(),
}));

let session = { isAuthenticated: false, isLoading: false };
jest.mock("@/hooks/use-auth-session", () => ({
  useAuthSession: () => session,
}));

const page = () => (
  <GuestGuard>
    <p>Log in to your account</p>
  </GuestGuard>
);

beforeEach(() => {
  push.mockReset();
  session = { isAuthenticated: false, isLoading: false };
});

describe("GuestGuard", () => {
  it("sends on someone already signed in when the page opens", () => {
    session = { isAuthenticated: true, isLoading: false };
    render(page());
    expect(screen.queryByText("Log in to your account")).toBeNull();
    expect(push).toHaveBeenCalledWith("/");
  });

  it("keeps the page on screen for someone who signs in on it, and leaves the navigation to the form", () => {
    const { rerender } = render(page());
    expect(screen.getByText("Log in to your account")).toBeInTheDocument();

    // The form's sign-in succeeds: the session turns authenticated while the page is open.
    session = { isAuthenticated: true, isLoading: false };
    rerender(page());

    expect(screen.getByText("Log in to your account")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it("treats a session still loading when the page opens as the arrival", () => {
    session = { isAuthenticated: false, isLoading: true };
    const { rerender } = render(page());
    session = { isAuthenticated: true, isLoading: false };
    rerender(page());
    expect(screen.queryByText("Log in to your account")).toBeNull();
    expect(push).toHaveBeenCalledWith("/");
  });
});
