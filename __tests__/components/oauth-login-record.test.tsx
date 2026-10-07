/**
 * A Google or GitHub login is recorded once its session says what it was (C13a): a sign-up when the
 * backend created the account, a sign-in otherwise, and once per login, not on every render.
 */

import { render } from "@testing-library/react";
import { OAuthLoginRecord } from "@/providers/posthog-provider";
import { analytics } from "@/lib/analytics";

jest.mock("posthog-js", () => ({ __esModule: true, default: {} }));
jest.mock("posthog-js/react", () => ({ PostHogProvider: () => null }));
jest.mock("next/navigation", () => ({
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));
jest.mock("@/lib/analytics", () => ({
  analytics: { track: jest.fn() },
  registerPostHog: jest.fn(),
}));
const useSession = jest.fn();
jest.mock("next-auth/react", () => ({ useSession: () => useSession() }));

const track = analytics.track as jest.Mock;

beforeEach(() => {
  track.mockClear();
  window.localStorage.clear();
});

it("records a sign-up when the backend created the account", () => {
  useSession.mockReturnValue({
    data: { oauthLogin: { provider: "google", isNew: true, at: 1001 } },
  });
  render(<OAuthLoginRecord />);
  expect(track).toHaveBeenCalledWith("user_signed_up", { method: "google" });
});

it("records a sign-in for an existing account", () => {
  useSession.mockReturnValue({
    data: { oauthLogin: { provider: "github", isNew: false, at: 1002 } },
  });
  render(<OAuthLoginRecord />);
  expect(track).toHaveBeenCalledWith("user_signed_in", { method: "github" });
});

it("records each login once, across renders and remounts", () => {
  useSession.mockReturnValue({
    data: { oauthLogin: { provider: "google", isNew: true, at: 1003 } },
  });
  const { rerender, unmount } = render(<OAuthLoginRecord />);
  rerender(<OAuthLoginRecord />);
  unmount();
  render(<OAuthLoginRecord />);
  expect(track).toHaveBeenCalledTimes(1);
});

it("records nothing without an OAuth login", () => {
  useSession.mockReturnValue({ data: { user: { id: "u" } } });
  render(<OAuthLoginRecord />);
  useSession.mockReturnValue({ data: null });
  render(<OAuthLoginRecord />);
  expect(track).not.toHaveBeenCalled();
});
