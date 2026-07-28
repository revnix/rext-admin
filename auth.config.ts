import type { NextAuthConfig } from "next-auth";
import { CredentialsSignin } from "next-auth";
import type { JWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { AUTH_PAGES, isAuthPage } from "@/lib/auth-routes";
import { log } from "@/lib/logger";
import { loginSchema } from "@/schemas/auth-schemas";
import {
  AUTH_SESSION_TOKEN_SWAP_ACTION,
  AUTH_SESSION_UPDATE_ACTION,
  getPrimaryRole,
} from "@/lib/auth-utils";
import { safeJsonParse } from "@/lib/utils";
import { extractApiError, safeParseErrorBody } from "@/lib/error-utils";

const authSecret =
  process.env.AUTH_SECRET ??
  process.env.NEXTAUTH_SECRET ??
  (process.env.NODE_ENV !== "production" ? "development_auth_secret" : undefined);

const authApiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.NEXT_PUBLIC_BACKEND_API_URL ??
  (process.env.NODE_ENV !== "production" ? "http://127.0.0.1:2024" : undefined);

if (!authApiBaseUrl && process.env.NODE_ENV !== "production") {
  log.warn(
    "No NEXT_PUBLIC_API_BASE_URL or NEXT_PUBLIC_BACKEND_API_URL set; falling back to http://127.0.0.1:2024",
  );
}

// Substrings of backend rejection messages that mean the refresh token is
// genuinely dead — retrying will never help, the user must log in again.
// Anything else (network error, 5xx, a lost concurrent-refresh race, etc.)
// is treated as transient and retried before giving up.
const DEFINITIVE_REFRESH_REJECTIONS = [
  "refresh token has expired",
  "refresh token has been revoked",
  "invalid refresh token",
  "invalid token type",
  "token missing jti",
  "user account is not active",
  "user not found",
];

function isDefinitiveRefreshRejection(message: string): boolean {
  const normalized = message.toLowerCase();
  return DEFINITIVE_REFRESH_REJECTIONS.some((pattern) =>
    normalized.includes(pattern),
  );
}

// Decodes a JWT payload without verifying its signature — for debug logging
// only (jti/exp are not secret and let us correlate frontend refresh logs
// with backend token_blacklist rows, e.g. "was this jti already rotated by
// another session before we tried to use it?"). Never use this for auth
// decisions; the frontend has no way to verify the signature.
function decodeJwtPayloadForLogging(
  token: string | undefined,
): { jti?: string; exp?: number; sub?: string } | null {
  if (!token) return null;
  try {
    const payloadSegment = token.split(".")[1];
    if (!payloadSegment) return null;
    const base64 = payloadSegment.replace(/-/g, "+").replace(/_/g, "/");
    const json =
      typeof atob === "function"
        ? atob(base64)
        : Buffer.from(base64, "base64").toString("utf-8");
    const payload = JSON.parse(json);
    return { jti: payload.jti, exp: payload.exp, sub: payload.id };
  } catch {
    return null;
  }
}

class RefreshAttemptError extends Error {
  definitive: boolean;
  constructor(message: string, definitive: boolean) {
    super(message);
    this.definitive = definitive;
  }
}

/**
 * Single attempt to exchange the refresh token for a new token pair.
 * Throws RefreshAttemptError with `definitive` set when the backend has
 * explicitly rejected the refresh token (vs. a transient/race failure).
 */
async function attemptRefresh(token: JWT): Promise<JWT> {
  const refreshPayload = {
    refresh_token: token.refreshToken,
  };

  // NOTE: key names deliberately avoid the substring "token" (and
  // "refresh_token"/"access_token") — lib/logger.ts's sanitize() redacts any
  // key containing those substrings, which would blank out these timestamps.
  const outgoingJwt = decodeJwtPayloadForLogging(token.refreshToken as string);
  log.debug("[Auth] Sending refresh request", {
    refreshJti: outgoingJwt?.jti,
    refreshExpiryIso: outgoingJwt?.exp
      ? new Date(outgoingJwt.exp * 1000).toISOString()
      : undefined,
    accessExpiryIso: token.accessTokenExpires
      ? new Date(token.accessTokenExpires as number).toISOString()
      : undefined,
    msUntilAccessExpiry: token.accessTokenExpires
      ? (token.accessTokenExpires as number) - Date.now()
      : undefined,
  });

  const response = await fetch(
    `${authApiBaseUrl}/api/v1/user/refresh`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(refreshPayload),
    },
  );

  log.debug("[Auth] Refresh response received", {
    refreshJti: outgoingJwt?.jti,
    status: response.status,
    ok: response.ok,
  });

  if (!response.ok) {
    const errorText = await response.text();
    const errorData = safeJsonParse(
      errorText,
      { rawError: errorText },
      "[Auth] refresh response error",
    );
    const message = extractApiError(
      errorData,
      `Token refresh failed with status ${response.status}`,
    );

    // PostgreSQL-authoritative replay now absorbs concurrent rotation races.
    // A refresh-endpoint 401/403 therefore means this credential is genuinely
    // unusable; network failures and 5xx responses remain transient.
    const definitive =
      response.status === 401 ||
      response.status === 403 ||
      isDefinitiveRefreshRejection(message);

    log.debug("[Auth] Refresh rejected", {
      refreshJti: outgoingJwt?.jti,
      status: response.status,
      message,
      definitive,
    });

    throw new RefreshAttemptError(message, definitive);
  }

  const refreshResponseText = await response.text();

  // biome-ignore lint/suspicious/noExplicitAny: dynamic backend auth response
  const refreshResponseData = safeJsonParse<{ data?: any }>(
    refreshResponseText,
    null,
    "[Auth] refresh response",
  );
  if (!refreshResponseData) {
    throw new RefreshAttemptError("Invalid refresh response format", false);
  }

  // Extract data from wrapped response
  const refreshedTokens = refreshResponseData.data || refreshResponseData;

  if (!refreshedTokens.access_token || !refreshedTokens.refresh_token) {
    throw new RefreshAttemptError(
      "Refresh response did not contain a complete token pair",
      false,
    );
  }

  // Derive expiry from backend response: prefer `expires_in` (seconds), fall back to `expires_at` (ISO/epoch)
  const expiresIn = refreshedTokens.expires_in;
  const expiresAt = refreshedTokens.expires_at;
  const accessTokenExpires = expiresIn
    ? Date.now() + expiresIn * 1000
    : expiresAt
      ? new Date(expiresAt).getTime()
      : token.accessTokenExpires; // keep previous if backend doesn't provide one

  const incomingJwt = decodeJwtPayloadForLogging(refreshedTokens.refresh_token);
  const incomingAccessJwt = decodeJwtPayloadForLogging(
    refreshedTokens.access_token,
  );
  log.debug("[Auth] Refresh succeeded", {
    oldRefreshJti: outgoingJwt?.jti,
    newRefreshJti: incomingJwt?.jti,
    newAccessJti: incomingAccessJwt?.jti,
    newAccessExpiryIso: accessTokenExpires
      ? new Date(accessTokenExpires).toISOString()
      : undefined,
  });

  const refreshedUser = refreshedTokens.user ?? {};
  const refreshedRoles = refreshedTokens.roles ?? refreshedUser.roles;
  const refreshedPermissions =
    refreshedTokens.permissions ?? refreshedUser.permissions;

  return {
    ...token,
    accessToken: refreshedTokens.access_token,
    refreshToken: refreshedTokens.refresh_token,
    accessTokenExpires,
    role: Array.isArray(refreshedRoles)
      ? getPrimaryRole({ roles: refreshedRoles })
      : token.role,
    permissions: Array.isArray(refreshedPermissions)
      ? refreshedPermissions
      : token.permissions,
    // A successful exchange is authoritative; do not preserve an earlier
    // terminal error through the object spread above.
    error: undefined,
  };
}

const REFRESH_RETRY_DELAYS_MS = [300, 800];

// De-dupes concurrent refresh attempts for the same refresh token. Without
// this, multiple jwt() callback invocations that land within the same ~30s
// expiry buffer (e.g. SessionTimeoutWarning's proactive update() racing a
// normal per-request expiry check, or several server components calling
// auth() at once) each read the same not-yet-rotated refresh token from
// their own invocation and independently hit the backend. The backend's
// refresh tokens are single-use: the first call rotates it, and every other
// concurrent call is rejected as "revoked" — which previously counted as a
// *definitive* rejection and forced an immediate logout, even though the
// session was never actually invalid. Sharing one in-flight promise per jti
// means every concurrent caller gets the same successful result instead of
// racing each other.
// NOTE: process-local only — does not de-dupe across multiple server
// instances, only concurrent calls within this one Node process.
const inFlightRefreshes = new Map<string, Promise<JWT>>();

/**
 * Refresh the access token using the refresh token.
 *
 * Retries transient failures (network errors, 5xx) before forcing the user
 * out. Only a definitive backend rejection — refresh token actually
 * expired/revoked/invalid — sets RefreshAccessTokenError immediately.
 * Concurrent callers for the same refresh token share one in-flight attempt
 * (see `inFlightRefreshes`) rather than racing the backend's single-use
 * rotation against each other.
 */
async function refreshAccessToken(token: JWT): Promise<JWT> {
  if (!token.refreshToken) {
    log.error("[Auth] No refresh token available");
    return { ...token, error: "RefreshAccessTokenError" };
  }

  const refreshJti = decodeJwtPayloadForLogging(
    token.refreshToken as string,
  )?.jti;

  if (refreshJti) {
    const existing = inFlightRefreshes.get(refreshJti);
    if (existing) {
      log.debug("[Auth] Reusing in-flight refresh for this token", {
        refreshJti,
      });
      return existing;
    }
  }

  const refreshPromise = performRefreshWithRetries(token, refreshJti);

  if (refreshJti) {
    inFlightRefreshes.set(refreshJti, refreshPromise);
    refreshPromise.finally(() => {
      inFlightRefreshes.delete(refreshJti);
    });
  }

  return refreshPromise;
}

async function performRefreshWithRetries(
  token: JWT,
  refreshJti: string | undefined,
): Promise<JWT> {
  const maxAttempts = REFRESH_RETRY_DELAYS_MS.length + 1;
  let lastError: unknown;
  let wasDefinitive = false;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await attemptRefresh(token);
    } catch (error) {
      lastError = error;
      const definitive =
        error instanceof RefreshAttemptError && error.definitive;

      log.error(
        `[Auth] Token refresh attempt ${attempt}/${maxAttempts} failed`,
        error,
        { refreshJti, definitive },
      );

      if (definitive) {
        wasDefinitive = true;
        break;
      }

      if (attempt < maxAttempts) {
        await new Promise((resolve) =>
          setTimeout(resolve, REFRESH_RETRY_DELAYS_MS[attempt - 1]),
        );
      }
    }
  }

  if (wasDefinitive) {
    log.error(
      "[Auth] Token refresh definitively rejected, forcing re-login",
      lastError,
      { refreshJti },
    );
    return { ...token, error: "RefreshAccessTokenError" };
  }

  // Every attempt failed transiently (network error, 5xx, a lost
  // concurrent-refresh race) — the backend never definitively rejected the
  // refresh token. Setting the error flag here was itself a bug: this same
  // flag is what the middleware's `authorized` callback (auth.config.ts)
  // uses to force an IMMEDIATE redirect to /login on the very next page
  // navigation — a much more aggressive trigger than anything in the React
  // component tree, and completely bypasses any client-side retry/verify
  // logic. A momentary backend/network blip should never end a session
  // whose refresh token is still valid for days. Return the token
  // unchanged — accessTokenExpires is still in the past, so the next
  // expiry check (proactive, reactive-401, or the next middleware
  // invocation) will simply try again.
  log.error(
    "[Auth] Token refresh exhausted all attempts without a definitive rejection — will retry later",
    lastError,
    { refreshJti },
  );

  return token;
}

export default {
  trustHost:
    process.env.NODE_ENV === "development" ||
    process.env.AUTH_TRUST_HOST === "true",
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          // Validate credentials with Zod
          const validatedFields = loginSchema.safeParse(credentials);

          if (!validatedFields.success) {
            log.error("[AuthJS] Validation failed:", validatedFields.error);
            return null;
          }

          const { email, password } = validatedFields.data;
          const rememberMe =
            (credentials as { rememberMe?: string }).rememberMe === "true";
          const confirmReactivation =
            (credentials as { confirmReactivation?: string })
              .confirmReactivation === "true";

          // Call backend login endpoint
          const response = await fetch(
            `${authApiBaseUrl}/api/v1/user/login`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email,
                password,
                confirm_reactivation: confirmReactivation,
              }),
            },
          );

          if (!response.ok) {
            // Extract detailed error message from backend using shared utility
            const errorData = await safeParseErrorBody(response);
            const errorMessage = extractApiError(
              errorData,
              "Invalid email or password",
            );
            log.error("[AuthJS] Login failed:", response.status, errorMessage);

            // Deactivated account: surface a distinct code so the login form
            // can show a reactivation confirmation popup instead of a plain
            // error toast.
            const backendCode = (
              errorData as { error?: { code?: string } } | undefined
            )?.error?.code;

            // Throw CredentialsSignin with the code (or message as fallback)
            // as the code. This allows the client to access the specific error.
            const error = new CredentialsSignin(errorMessage);
            error.code =
              backendCode === "account_deactivated"
                ? "ACCOUNT_DEACTIVATED"
                : errorMessage;
            throw error;
          }

          const responseData = await response.json();

          // Extract data from wrapped response (backend returns { success, data: {...}, meta, error })
          const data = responseData.data || responseData;

          if (!data.user) {
            log.error("[AuthJS] No user in response");
            return null;
          }

          // Determine primary role based on hierarchy
          // Support both `roles: string[]` and `role: string` shapes; normalize casing
          const primaryRole = getPrimaryRole(data.user);

          // Return user object with backend tokens, role, and permissions
          return {
            id: data.user.id,
            email: data.user.email,
            name:
              data.user.display_name || data.user.full_name || data.user.email,
            full_name: data.user.full_name,
            display_name: data.user.display_name,
            image: data.user.avatar_url || null,
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresIn: data.expires_in,
            expiresAt: data.expires_at,
            role: primaryRole,
            permissions: data.user.permissions || [],
            rememberMe,
          };
        } catch (error) {
          // Re-throw CredentialsSignin to propagate the specific error message to the client
          if (error instanceof CredentialsSignin) {
            throw error;
          }
          log.error("[AuthJS] Authorization error:", error);
          return null;
        }
      },
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID || "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET || "",
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID || "",
      clientSecret: process.env.AUTH_GITHUB_SECRET || "",
    }),
  ],
  pages: {
    signIn: AUTH_PAGES.LOGIN,
    signOut: AUTH_PAGES.LOGIN,
    error: AUTH_PAGES.LOGIN,
  },
  callbacks: {
    async jwt({ token, user, account, trigger, session }) {
      // On initial sign in, store backend tokens
      if (user) {
        // For credentials provider, we already have backend tokens
        if (account?.provider === "credentials") {
          token.id = user.id;
          token.email = user.email;
          token.name = user.name;
          token.full_name = user.full_name;
          token.display_name = user.display_name;
          token.picture = user.image;
          token.accessToken = user.accessToken;
          token.refreshToken = user.refreshToken;
          token.role = user.role;
          token.permissions = user.permissions;
          token.rememberMe = user.rememberMe;
          // Derive expiry from backend login response: prefer `expires_in` (seconds), fall back to `expires_at`
          token.accessTokenExpires = user.expiresIn
            ? Date.now() + (user.expiresIn as number) * 1000
            : user.expiresAt
              ? new Date(user.expiresAt as string).getTime()
              : undefined;
        } else {
          // For OAuth providers, use dedicated OAuth login endpoint
          try {
            const oauthPayload = {
              provider: account?.provider,
              provider_account_id: account?.providerAccountId,
              provider_email: user.email,
              provider_name: user.name || "",
              provider_avatar_url: user.image,
              // Optional: store OAuth tokens for API calls
              access_token: account?.access_token,
              refresh_token: account?.refresh_token,
              token_expires_at: account?.expires_at
                ? new Date(account.expires_at * 1000).toISOString()
                : null,
            };

            // Call dedicated OAuth login endpoint
            // This handles: login existing user, link to existing email, or create new user
            const oauthResponse = await fetch(
              `${authApiBaseUrl}/api/v1/user/oauth/login`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(oauthPayload),
              },
            );

            if (!oauthResponse.ok) {
              const errorData = await safeParseErrorBody(oauthResponse);
              const errorMessage = extractApiError(
                errorData,
                "OAuth login failed",
              );
              log.error(
                "[AuthJS] OAuth login failed with message:",
                errorMessage,
              );
              return { ...token, error: "OAuthBackendError" };
            }

            const oauthResponseText = await oauthResponse.text();

            // biome-ignore lint/suspicious/noExplicitAny: dynamic backend auth response
            const oauthResponseData = safeJsonParse<{ data?: any }>(
              oauthResponseText,
              null,
              "[AuthJS] OAuth response",
            );

            if (!oauthResponseData) {
              log.error("[AuthJS] Invalid OAuth response format");
              return { ...token, error: "OAuthBackendError" };
            }

            // Extract data from wrapped response
            const oauthData = oauthResponseData.data || oauthResponseData;

            if (!oauthData.user) {
              log.error("[AuthJS] No user object in OAuth response");
              return { ...token, error: "OAuthBackendError" };
            }

            token.id = oauthData.user.id;
            token.email = oauthData.user.email;
            token.full_name = oauthData.user.full_name;
            token.display_name = oauthData.user.display_name;
            token.name =
              oauthData.user.display_name ||
              oauthData.user.full_name ||
              oauthData.user.email;
            token.picture = oauthData.user.avatar_url || user.image;
            token.accessToken = oauthData.access_token;
            token.refreshToken = oauthData.refresh_token;
            token.role = getPrimaryRole(oauthData.user);
            token.permissions =
              oauthData.user.permissions || oauthData.permissions || [];
            // Derive expiry from backend OAuth response: prefer `expires_in`
            // (seconds), then fall back to `expires_at`.
            token.accessTokenExpires = oauthData.expires_in
              ? Date.now() + oauthData.expires_in * 1000
              : oauthData.expires_at
                ? new Date(oauthData.expires_at).getTime()
                : undefined;
          } catch (error) {
            log.error("[AuthJS] OAuth backend integration error:", error);
            log.error(
              "[AuthJS] Error stack:",
              error instanceof Error ? error.stack : "No stack trace",
            );
            log.error("[AuthJS] Error details:", {
              message: error instanceof Error ? error.message : String(error),
              name: error instanceof Error ? error.name : "Unknown",
            });
            return { ...token, error: "OAuthBackendError" };
          }
        }
      }

      const requestedBackendRefresh =
        trigger === "update" &&
        (session as { authAction?: string } | undefined)?.authAction ===
          AUTH_SESSION_UPDATE_ACTION;
      const requestedTokenSwap =
        trigger === "update" &&
        (session as { authAction?: string } | undefined)?.authAction ===
          AUTH_SESSION_TOKEN_SWAP_ACTION;

      // Token replacement is limited to the explicit impersonation action;
      // arbitrary session update payloads cannot overwrite credentials.
      if (requestedTokenSwap && session?.accessToken && session.refreshToken) {
        token.accessToken = session.accessToken;
        token.refreshToken = session.refreshToken;
        if (session.accessTokenExpires) {
          token.accessTokenExpires = session.accessTokenExpires;
        } else if (session.accessToken) {
          const accessPayload = decodeJwtPayloadForLogging(session.accessToken);
          if (accessPayload?.exp) {
            token.accessTokenExpires = accessPayload.exp * 1000;
          }
        }

        token.error = undefined;
        return token;
      }

      if (trigger === "update" && !requestedBackendRefresh && session?.user) {
        // Update non-sensitive user details only
        // SECURITY: Do NOT accept role or permissions from client-side update()
        // calls — these must come from the backend to prevent privilege escalation
        if (session.user.id) token.id = session.user.id;
        if (session.user.email) token.email = session.user.email;
        if (session.user.name) token.name = session.user.name;
        if (session.user.image) token.picture = session.user.image;

        return token;
      }

      if (requestedBackendRefresh) {
        log.info("[Auth] Explicit backend-token refresh requested", {
          refreshJti: decodeJwtPayloadForLogging(token.refreshToken as string)
            ?.jti,
          msUntilAccessExpiry: token.accessTokenExpires
            ? (token.accessTokenExpires as number) - Date.now()
            : undefined,
        });
        if (token.refreshToken) {
          log.info("[Auth] Refreshing backend token via refresh token...");
          return await refreshAccessToken(token);
        }

        if (token.accessTokenExpires) {
          // No refresh token available — cannot obtain a fresh expiry from the backend.
          // Return the token as-is; the existing expiry will drive the next refresh check.
          log.warn(
            "[Auth] No refresh token for manual update — keeping existing token expiry.",
          );
          return token;
        }

        return token;
      }

      if (trigger === "update") {
        log.debug(
          "[Auth] Session metadata update completed without token rotation",
        );
        return token;
      }

      // Ordinary session reads must be side-effect free. Middleware, RSC
      // `auth()`, SessionProvider, and getSession() can all execute this
      // callback concurrently. Rotating a single-use backend refresh token
      // here lets an older Set-Cookie response overwrite the successor and
      // strand every tab with an already-consumed token. Backend rotation is
      // therefore performed only by the explicit update action above; the
      // proactive timer and typed access-token-expiry recovery both use it.
      return token;
    },
    async session({ session, token }) {
      // Expose the access token needed by the API client. The rotating
      // refresh token remains server-only inside the encrypted Auth.js JWT.
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.full_name = token.full_name as string;
        session.user.display_name = (token.display_name as string) || null;
        session.user.image = token.picture as string | null;
        session.user.accessToken = token.accessToken as string;
        session.user.role = token.role as string | undefined;
        session.user.permissions = token.permissions as string[] | undefined;
        session.accessTokenExpires = token.accessTokenExpires as
          | number
          | undefined;
        session.error = token.error as string | undefined;
      }
      return session;
    },
    async authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user && !auth?.error;
      const hasRefreshError = auth?.error === "RefreshAccessTokenError";
      const hasOAuthError = auth?.error === "OAuthBackendError";
      const pathname = nextUrl.pathname;
      const isOnAuthPage = isAuthPage(pathname);
      const isInvitationPage =
        pathname.startsWith("/invitations/accept") ||
        pathname.startsWith("/accept-invitation") ||
        pathname.startsWith("/accept-admin-invitation");
      const isVerifyEmailPage = pathname.startsWith(AUTH_PAGES.VERIFY_EMAIL);

      // CRITICAL: If there is a refresh error, the session is essentially invalid.
      // We must force the user to the login page and NOT allow them to be redirected
      // back to the dashboard even if NextAuth technically still considers them "logged in".
      if (hasRefreshError || hasOAuthError) {
        log.warn("[Auth] Middleware is rejecting the session", {
          pathname,
          sessionError: auth?.error,
          redirectTarget: isOnAuthPage || isInvitationPage ? null : "/login",
        });
        if (isOnAuthPage || isInvitationPage) {
          // Allow them to stay on the auth/invitation page to log in again
          return true;
        }
        // Redirect to login from any protected page
        const errorParam = hasOAuthError ? "OAuthError" : "SessionExpired";
        return Response.redirect(
          new URL(`/login?error=${errorParam}`, nextUrl),
        );
      }

      // Redirect authenticated users away from auth pages (login, signup, etc.)
      // but NOT from invitation or verify-email routes, since a freshly
      // signed-up user is auto-logged-in with an unverified email and must
      // still be able to open the verification link while logged in.
      if (
        isLoggedIn &&
        isOnAuthPage &&
        !isInvitationPage &&
        !isVerifyEmailPage
      ) {
        return Response.redirect(new URL("/", nextUrl));
      }

      // Require authentication for protected pages
      // Public paths are auth pages, invitation pages, or verify-email
      if (!isLoggedIn && !isOnAuthPage && !isInvitationPage) {
        return false; // Will redirect to /login
      }

      return true;
    },
  },
  events: {
    async signOut(message) {
      if (!("token" in message) || !message.token) return;

      const accessToken = message.token.accessToken as string | undefined;
      const refreshToken = message.token.refreshToken as string | undefined;
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!accessToken || !refreshToken || !apiBaseUrl) return;

      try {
        const revoke = (access: string, refresh: string) =>
          fetch(`${apiBaseUrl}/api/v1/user/logout`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${access}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ refresh_token: refresh }),
            signal: AbortSignal.timeout(3_000),
          });

        let response = await revoke(accessToken, refreshToken);

        // Manual sign-out can happen after the access credential expires.
        // Exchange the still-server-only refresh token once, then revoke the
        // resulting pair so clearing the Auth.js cookie does not leave a live
        // backend refresh credential behind.
        if (response.status === 401) {
          const refreshResponse = await fetch(
            `${apiBaseUrl}/api/v1/user/refresh`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ refresh_token: refreshToken }),
              signal: AbortSignal.timeout(3_000),
            },
          );
          if (refreshResponse.ok) {
            const body = await refreshResponse.json();
            const refreshed = body.data ?? body;
            if (refreshed.access_token && refreshed.refresh_token) {
              response = await revoke(
                refreshed.access_token,
                refreshed.refresh_token,
              );
            }
          }
        }

        if (!response.ok) {
          log.warn("[Auth] Backend token revocation during sign-out failed", {
            status: response.status,
          });
        }
      } catch (error) {
        // Auth.js must still clear its cookie if the backend is unavailable.
        // Expired/revoked tokens are already unusable; a manual logout will
        // normally complete this best-effort server-side revocation.
        log.warn("[Auth] Backend token revocation was unavailable", error);
      }
    },
  },
  secret: authSecret,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // Default 30 days max
    // Note: Actual session duration is controlled by JWT expiry
    // which we set dynamically in the JWT callback based on rememberMe
  },
} satisfies NextAuthConfig;
