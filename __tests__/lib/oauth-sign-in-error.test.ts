/**
 * A Google or GitHub sign-in the backend didn't accept (revnix/rext-control#858): the limiter's
 * refusal is told apart from every other failure, from the server's sign-in to the sign-in
 * page's address, and both turn the session away.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import {
  isOAuthSignInError,
  oauthSignInError,
  signInPageError,
} from "@/lib/auth/oauth-sign-in-error";

describe("the session's error for a sign-in call the backend refused", () => {
  it("names the limiter's refusal", () => {
    expect(oauthSignInError(429)).toBe("OAuthRateLimited");
  });

  it.each([400, 401, 403, 404, 500, 502, 503])(
    "is the general error for a %i",
    (status) => {
      expect(oauthSignInError(status)).toBe("OAuthBackendError");
    },
  );
});

describe("a session the route guard turns away", () => {
  it.each(["OAuthBackendError", "OAuthRateLimited"])(
    "is turned away for %s",
    (error) => {
      expect(isOAuthSignInError(error)).toBe(true);
    },
  );

  it.each(["RefreshAccessTokenError", undefined, null, ""])(
    "is not an OAuth failure for %p",
    (error) => {
      expect(isOAuthSignInError(error)).toBe(false);
    },
  );

  it("reaches the sign-in page with the error it had", () => {
    expect(signInPageError("OAuthRateLimited")).toBe("OAuthRateLimited");
    expect(signInPageError("OAuthBackendError")).toBe("OAuthError");
    expect(signInPageError("RefreshAccessTokenError")).toBe("SessionExpired");
    expect(signInPageError(undefined)).toBe("SessionExpired");
  });
});

describe("where the error is set and read", () => {
  const source = (file: string) =>
    readFileSync(path.join(process.cwd(), file), "utf8");

  it("is set from the call's status in the server's sign-in, and read by both guards", () => {
    const config = source("auth.config.ts");
    expect(config).toContain("oauthSignInError(oauthResponse.status)");
    expect(config).toContain("isOAuthSignInError(auth?.error)");
    expect(config).toContain("signInPageError(auth?.error)");
    expect(source("proxy.ts")).toContain("signInPageError(session.error)");
  });

  it("has a sentence on the sign-in page", () => {
    expect(source("components/login-form.tsx")).toContain("OAuthRateLimited:");
  });
});
