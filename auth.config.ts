import type { NextAuthConfig } from "next-auth";
import type { JWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { log } from "@/lib/logger";
import { loginSchema } from "@/schemas/auth-schemas";

/**
 * Refresh the access token using the refresh token
 */
async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    log.info("[Auth] Refreshing access token...");

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/user/refresh`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refresh_token: token.refreshToken,
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      log.error(
        "[Auth] Token refresh failed with status:",
        response.status,
        errorData,
      );
      throw new Error("Token refresh failed");
    }

    const refreshResponseData = await response.json();
    // Extract data from wrapped response
    const refreshedTokens = refreshResponseData.data || refreshResponseData;

    log.info("[Auth] Access token refreshed successfully");

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
      accessTokenExpires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours from now
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
  trustHost: true, // Trust all hosts in development, use AUTH_TRUST_HOST in production
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
            // Extract detailed error message from backend
            const errorData = await response.json().catch(() => ({}));
            const errorMessage =
              errorData?.error?.message ||
              errorData?.message ||
              "Invalid email or password";
            log.error("[AuthJS] Login failed:", response.status, errorMessage);
            return null;
          }

          const responseData = await response.json();

          // Extract data from wrapped response (backend returns { success, data: {...}, meta, error })
          const data = responseData.data || responseData;

          if (!data.user) {
            log.error("[AuthJS] No user in response");
            return null;
          }

          log.info(
            "[AuthJS] User authenticated:",
            data.user.email,
            "Remember me:",
            rememberMe,
            "Roles:",
            data.user.roles,
          );

          // Extract primary role (first in list) for role-based checks
          const primaryRole =
            data.user.roles && data.user.roles.length > 0
              ? data.user.roles[0]
              : undefined;

          // Return user object with backend tokens, role, and permissions
          return {
            id: data.user.id,
            email: data.user.email,
            name: `${data.user.first_name || ""} ${data.user.last_name || ""}`.trim(),
            image: data.user.avatar_url || null,
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            role: primaryRole,
            permissions: data.user.permissions || [],
            rememberMe,
          };
        } catch (error) {
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
    signIn: "/login",
    signOut: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // On initial sign in, store backend tokens
      if (user) {
        // For credentials provider, we already have backend tokens
        if (account?.provider === "credentials") {
          token.id = user.id;
          token.email = user.email;
          token.name = user.name;
          token.picture = user.image;
          token.accessToken = user.accessToken;
          token.refreshToken = user.refreshToken;
          token.role = user.role;
          token.permissions = user.permissions;
          token.rememberMe = user.rememberMe;
          // Set expiry: 30 days if remember me, 24 hours otherwise
          const expiryDuration = user.rememberMe
            ? 30 * 24 * 60 * 60 * 1000 // 30 days
            : 24 * 60 * 60 * 1000; // 24 hours
          token.accessTokenExpires = Date.now() + expiryDuration;
          log.info(
            "[Auth] Remember me:",
            token.rememberMe,
            "Expires in:",
            expiryDuration / (24 * 60 * 60 * 1000),
            "days",
            "Role:",
            token.role,
          );
        } else {
          // For OAuth providers, use dedicated OAuth login endpoint
          try {
            log.info("[AuthJS] OAuth sign-in with", account?.provider);

            // Call dedicated OAuth login endpoint
            // This handles: login existing user, link to existing email, or create new user
            const oauthResponse = await fetch(
              `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/user/oauth/login`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
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
                }),
              },
            );

            if (!oauthResponse.ok) {
              const errorData = await oauthResponse.json().catch(() => ({}));
              const errorMessage =
                errorData?.error?.message ||
                errorData?.message ||
                "OAuth login failed";
              log.error("[AuthJS] OAuth login failed:", errorMessage);
              return token;
            }

            const oauthResponseData = await oauthResponse.json();
            // Extract data from wrapped response
            const oauthData = oauthResponseData.data || oauthResponseData;

            token.id = oauthData.user.id;
            token.email = oauthData.user.email;
            token.name =
              `${oauthData.user.first_name} ${oauthData.user.last_name}`.trim();
            token.picture = oauthData.user.avatar_url || user.image;
            token.accessToken = oauthData.access_token;
            token.refreshToken = oauthData.refresh_token;
            token.role = oauthData.user.roles?.[0];
            token.permissions = oauthData.user.permissions || [];

            log.info("[AuthJS] OAuth login successful for user:", token.id);
          } catch (error) {
            log.error("[AuthJS] OAuth backend integration error:", error);
            // Fall back to OAuth-only data (no backend tokens)
            token.id = user.id;
            token.email = user.email;
            token.name = user.name;
            token.picture = user.image;
          }
        }
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
      log.info("[Auth] Access token expired, attempting refresh...");
      return await refreshAccessToken(token);
    },
    async session({ session, token }) {
      // Expose user info and backend tokens in session
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string | null;
        session.user.accessToken = token.accessToken as string;
        session.user.refreshToken = token.refreshToken as string;
        session.user.role = token.role as string | undefined;
        session.user.permissions = token.permissions as string[] | undefined;
        session.error = token.error as string | undefined;
      }
      return session;
    },
    async authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const hasRefreshError = auth?.error === "RefreshAccessTokenError";
      const isOnAuthPage = [
        "/login",
        "/signup",
        "/forgot-password",
        "/reset-password",
        "/verify-email",
      ].some((path) => nextUrl.pathname.startsWith(path));

      // If refresh error, force redirect to login
      if (hasRefreshError && !isOnAuthPage) {
        return Response.redirect(
          new URL("/login?error=SessionExpired", nextUrl),
        );
      }

      // Redirect authenticated users away from auth pages
      if (isLoggedIn && isOnAuthPage) {
        return Response.redirect(new URL("/", nextUrl));
      }

      // Require authentication for protected pages
      if (!isLoggedIn && !isOnAuthPage) {
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
