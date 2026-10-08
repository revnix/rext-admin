/**
 * The one role a session carries (task 915). The route guard and the admin area's gates read it,
 * so a platform role this order doesn't name is a role nobody can use: a support admin also holds
 * "user", like every account, and was a "user" to the whole app.
 */
jest.mock("next-auth/react", () => ({
  getSession: jest.fn(),
  getCsrfToken: jest.fn(async () => "csrf"),
}));
jest.mock("@/auth", () => ({ auth: jest.fn() }));
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
jest.mock("@/stores/auth-store", () => ({
  useAuthStore: {
    getState: () => ({ accessToken: null, clearTokens: jest.fn() }),
  },
}));
jest.mock("@/lib/logout-utils", () => ({
  performLogout: jest.fn(async () => undefined),
}));
jest.mock("@/lib/auth/go-to", () => ({ goTo: jest.fn() }));

import { getPrimaryRole } from "@/lib/auth-utils";
import { ADMIN_ROLES } from "@/types/admin-invitation";

describe("the session's one role", () => {
  it("is the platform role for every role an invitation can give, beside the account's own", () => {
    for (const { value } of ADMIN_ROLES) {
      expect(getPrimaryRole({ roles: ["user", value] })).toBe(value);
      expect(getPrimaryRole({ roles: [value, "user"] })).toBe(value);
    }
  });

  it("is the higher of two platform roles, and user when there is no other", () => {
    expect(getPrimaryRole({ roles: ["support", "admin"] })).toBe("admin");
    expect(getPrimaryRole({ roles: ["admin", "super_admin"] })).toBe(
      "super_admin",
    );
    expect(getPrimaryRole({ roles: ["user"] })).toBe("user");
    expect(getPrimaryRole({ roles: [] })).toBe("user");
  });
});
