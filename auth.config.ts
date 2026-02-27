import type { NextAuthConfig } from "next-auth";
import { CredentialsSignin } from "next-auth";
import type { JWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { AUTH_PAGES, isAuthPage } from "@/lib/auth-routes";
import { log } from "@/lib/logger";
import { loginSchema } from "@/schemas/auth-schemas";
import { getPrimaryRole } from "@/lib/auth-utils";
import { safeJsonParse } from "@/lib/utils";
import { extractApiError, safeParseErrorBody } from "@/lib/error-utils";


/**
 * Refresh the access token using the refresh token
 */
async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    if (!token.refreshToken) {
      log.error("[Auth] No refresh token available");
      throw new Error("No refresh token available");
    }

    const refreshPayload = {
      refresh_token: token.refreshToken,
    };

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/user/refresh`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(refreshPayload),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      log.error("[Auth] Refresh response error text:", errorText);

      const errorData = safeJsonParse(
        errorText,
        { rawError: errorText },
        "[Auth] refresh response error",
      );

      log.error("[Auth] Token refresh failed with status:", response.status);
      log.error("[Auth] Token refresh error data:", errorData);
      throw new Error("Token refresh failed");
    }

    const refreshResponseText = await response.text();

    // biome-ignore lint/suspicious/noExplicitAny: dynamic backend auth response
    const refreshResponseData = safeJsonParse<{ data?: any }>(
      refreshResponseText,
      null,
      "[Auth] refresh response",
    );
    if (!refreshResponseData) {
      throw new Error("Invalid refresh response format");
    }

    // Extract data from wrapped response
    const refreshedTokens = refreshResponseData.data || refreshResponseData;

    if (!refreshedTokens.access_token) {
      log.error("[Auth] No access token in refresh response");
      throw new Error("No access token in refresh response");
    }

    // Derive expiry from backend response: prefer `expires_in` (seconds), fall back to `expires_at` (ISO/epoch)
    const expiresIn = refreshedTokens.expires_in;
    const expiresAt = refreshedTokens.expires_at;
    const accessTokenExpires = expiresIn
      ? Date.now() + expiresIn * 1000
      : expiresAt
        ? new Date(expiresAt).getTime()
        : token.accessTokenExpires; // keep previous if backend doesn't provide one

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
      accessTokenExpires,
    };
  } catch (error) {
    log.error("[Auth] Error refreshing access token:", error);

    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
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

          // Call backend login endpoint
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/user/login`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email, password }),
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

            // Throw CredentialsSignin with the message as the code
            // This allows the client to access the specific message
            const error = new CredentialsSignin(errorMessage);
            error.code = errorMessage;
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
              `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/user/oauth/login`,
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
              return token;
            }

            const oauthResponseText = await oauthResponse.text();

            // biome-ignore lint/suspicious/noExplicitAny: dynamic backend auth response
            const oauthResponseData = safeJsonParse<{ data?: any }>(
              oauthResponseText,
              null,
              "[AuthJS] OAuth response",
            );

            if (!oauthResponseData) {
              return token;
            }

            // Extract data from wrapped response
            const oauthData = oauthResponseData.data || oauthResponseData;

            if (!oauthData.user) {
              log.error("[AuthJS] No user object in OAuth response");
              return token;
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
            token.permissions = oauthData.user.permissions || [];
            // Derive expiry from backend OAuth response: prefer `expires_in` (seconds), fall back to `expires_at`
            token.accessTokenExpires = oauthData.expires_at
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
            // Fall back to OAuth-only data (no backend tokens)
            token.id = user.id;
            token.email = user.email;
            token.name = user.name;
            token.picture = user.image;
          }
        }
      }

      // Handle session updates (e.g., impersonation token swap)
      if (trigger === "update" && session) {
        if (session.accessToken) token.accessToken = session.accessToken;
        if (session.refreshToken) token.refreshToken = session.refreshToken;

        // Update non-sensitive user details only
        // SECURITY: Do NOT accept role or permissions from client-side update()
        // calls — these must come from the backend to prevent privilege escalation
        if (session.user) {
          if (session.user.id) token.id = session.user.id;
          if (session.user.email) token.email = session.user.email;
          if (session.user.name) token.name = session.user.name;
          if (session.user.image) token.picture = session.user.image;
        }

        return token;
      }

      if (trigger === "update") {
        log.info("[Auth] Session update triggered manually");
        if (token.refreshToken) {
          log.info("[Auth] Refreshing backend token via refresh token...");
          return await refreshAccessToken(token);
        }

        if (token.accessTokenExpires) {
          // No refresh token available — cannot obtain a fresh expiry from the backend.
          // Return the token as-is; the existing expiry will drive the next refresh check.
          log.warn("[Auth] No refresh token for manual update — keeping existing token expiry.");
          return token;
        }

        return token;
      }

      // If there's a previous refresh error, don't retry - just return the error token
      // This prevents infinite loops
      if (token.error === "RefreshAccessTokenError") {
        return token;
      }

      // Return previous token if the access token has not expired yet
      if (token.accessTokenExpires && Date.now() < token.accessTokenExpires) {
        return token;
      }

      // Only attempt refresh if we have a refresh token
      if (!token.refreshToken) {
        return token;
      }

      // Access token has expired, try to refresh it
      return await refreshAccessToken(token);
    },
    async session({ session, token }) {
      // Expose user info and backend tokens in session
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.full_name = token.full_name as string;
        session.user.display_name = (token.display_name as string) || null;
        session.user.image = token.picture as string | null;
        session.user.accessToken = token.accessToken as string;
        session.user.refreshToken = token.refreshToken as string;
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
      const isLoggedIn = !!auth?.user;
      const hasRefreshError = auth?.error === "RefreshAccessTokenError";
      const pathname = nextUrl.pathname;
      const isOnAuthPage = isAuthPage(pathname);
      const isInvitationPage =
        pathname.startsWith("/invitations/accept") ||
        pathname.startsWith("/accept-invitation") ||
        pathname.startsWith("/accept-admin-invitation");

      // CRITICAL: If there is a refresh error, the session is essentially invalid.
      // We must force the user to the login page and NOT allow them to be redirected
      // back to the dashboard even if NextAuth technically still considers them "logged in".
      if (hasRefreshError) {
        if (isOnAuthPage || isInvitationPage) {
          // Allow them to stay on the auth/invitation page to log in again
          return true;
        }
        // Redirect to login from any protected page
        return Response.redirect(
          new URL("/login?error=SessionExpired", nextUrl),
        );
      }

      // Redirect authenticated users away from auth pages (login, signup, etc.)
      // but NOT from invitation routes which support auto-acceptance
      if (isLoggedIn && isOnAuthPage && !isInvitationPage) {
        return Response.redirect(new URL("/", nextUrl));
      }

      // Require authentication for protected pages
      // Public paths are auth pages or invitation pages
      if (!isLoggedIn && !isOnAuthPage && !isInvitationPage) {
        return false; // Will redirect to /login
      }

      return true;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // Default 30 days max
    // Note: Actual session duration is controlled by JWT expiry
    // which we set dynamically in the JWT callback based on rememberMe
  },
} satisfies NextAuthConfig;
