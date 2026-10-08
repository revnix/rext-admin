/**
 * A page that stayed open through a sign-out and has a session again (revnix/rext-control#858).
 * The sign-out's promise was kept for good, which did no harm while such a page could never work
 * again. Now it can: the person stays to copy their text, signs in from another tab, and the
 * page is alive. Its next sign-out has to be a new one.
 */

import { isSignedOut, reportSignedIn } from "@/lib/auth/signed-out";
import { putLeaveGuard } from "@/lib/leave-guard";
import { performLogout } from "@/lib/logout-utils";

jest.mock("next-auth/react", () => ({
  signOut: jest.fn(async () => undefined),
}));
jest.mock("@/lib/logger", () => {
  const quiet = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
  const logger = { ...quiet, forComponent: () => quiet };
  return { logger, log: logger };
});
jest.mock("@/lib/query-client", () => ({
  getQueryClient: () => ({ cancelQueries: jest.fn(), clear: jest.fn() }),
}));
jest.mock("@/lib/auth-utils", () => ({ clearAuthHeadersCache: jest.fn() }));
jest.mock("@/lib/api-client", () => ({
  apiClient: { users: { logout: jest.fn(async () => undefined) } },
}));
jest.mock("@/lib/support-chat/chat", () => ({ resetSupportChat: jest.fn() }));
jest.mock("@/lib/store-registry", () => ({ resetAllStores: jest.fn() }));
jest.mock("@/lib/analytics", () => ({
  analytics: { reset: jest.fn(), clearStoredEvents: jest.fn() },
}));
jest.mock("@/lib/auth/go-to", () => ({ goTo: jest.fn() }));

const signOut = jest.requireMock("next-auth/react").signOut as jest.Mock;
const goTo = jest.requireMock("@/lib/auth/go-to").goTo as jest.Mock;

describe("signing out of a page that holds unsaved text", () => {
  it("stays on the page, and signs out anew once the page has had a session again", async () => {
    const lift = putLeaveGuard(() => undefined);

    await performLogout("/login");
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(goTo).not.toHaveBeenCalled();
    expect(isSignedOut()).toBe(true);

    // Asked again while still signed out: the same sign-out, not a second one.
    await performLogout("/login");
    expect(signOut).toHaveBeenCalledTimes(1);

    // The person signed in from another tab: a read found a token.
    reportSignedIn();
    expect(isSignedOut()).toBe(false);

    await performLogout("/login");
    expect(signOut).toHaveBeenCalledTimes(2);
    lift();
  });
});
