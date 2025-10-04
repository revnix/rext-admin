import type { NextAuthConfig } from "next-auth";
import type { JWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { loginSchema } from "@/schemas/auth-schemas";

/**
 * Refresh the access token using the refresh token
 */
async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    console.log("[Auth] Refreshing access token...");

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
      throw new Error("Token refresh failed");
    }

    const refreshResponseData = await response.json();
    // Extract data from wrapped response
    const refreshedTokens = refreshResponseData.data || refreshResponseData;

    console.log("[Auth] Access token refreshed successfully");

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
      accessTokenExpires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours from now
    };
  } catch (error) {
    console.error("[Auth] Error refreshing access token:", error);

    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

export default {
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
            console.error("[AuthJS] Validation failed:", validatedFields.error);
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
            console.error("[AuthJS] Login failed:", response.status);
            return null;
          }

          const responseData = await response.json();

          // Extract data from wrapped response (backend returns { success, data: {...}, meta, error })
          const data = responseData.data || responseData;

          if (!data.user) {
            console.error("[AuthJS] No user in response");
            return null;
          }

          console.log(
            "[AuthJS] User authenticated:",
            data.user.email,
            "Remember me:",
            rememberMe,
          );

          // Return user object with backend tokens
          return {
            id: data.user.id,
            email: data.user.email,
            name: `${data.user.first_name || ""} ${data.user.last_name || ""}`.trim(),
            image: data.user.avatar_url || null,
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            rememberMe,
          };
        } catch (error) {
          console.error("[AuthJS] Authorization error:", error);
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
          token.rememberMe = user.rememberMe;
          // Set expiry: 30 days if remember me, 24 hours otherwise
          const expiryDuration = user.rememberMe
            ? 30 * 24 * 60 * 60 * 1000 // 30 days
            : 24 * 60 * 60 * 1000; // 24 hours
          token.accessTokenExpires = Date.now() + expiryDuration;
          console.log(
            "[Auth] Remember me:",
            token.rememberMe,
            "Expires in:",
            expiryDuration / (24 * 60 * 60 * 1000),
            "days",
          );
        } else {
          // For OAuth providers, register/login user with backend
          try {
            console.log("[AuthJS] OAuth sign-in with", account?.provider);

            // Check if user exists by calling backend login
            // For OAuth users, we'll attempt login first
            const loginResponse = await fetch(
              `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/user/login`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  email: user.email,
                  // For OAuth users without password, use a placeholder
                  password: `oauth_${account?.providerAccountId}`,
                }),
              },
            );

            if (!loginResponse.ok) {
              // User doesn't exist, register them
              console.log("[AuthJS] OAuth user not found, registering...");

              const [firstName, ...lastNameParts] = (user.name || "").split(
                " ",
              );
              const registerResponse = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/user/register`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    email: user.email,
                    password: `oauth_${account?.providerAccountId}_temp`,
                    first_name: firstName || "User",
                    last_name: lastNameParts.join(" ") || "",
                  }),
                },
              );

              if (!registerResponse.ok) {
                console.error("[AuthJS] OAuth registration failed");
                return token;
              }

              const registerResponseData = await registerResponse.json();
              // Extract data from wrapped response
              const registerData =
                registerResponseData.data || registerResponseData;
              token.id = registerData.user.id;
              token.email = registerData.user.email;
              token.name =
                `${registerData.user.first_name} ${registerData.user.last_name}`.trim();
              token.picture = user.image;
              token.accessToken = registerData.access_token;
              token.refreshToken = registerData.refresh_token;
            } else {
              // User exists, use their data
              const loginResponseData = await loginResponse.json();
              // Extract data from wrapped response
              const loginData = loginResponseData.data || loginResponseData;
              token.id = loginData.user.id;
              token.email = loginData.user.email;
              token.name =
                `${loginData.user.first_name} ${loginData.user.last_name}`.trim();
              token.picture = loginData.user.avatar_url || user.image;
              token.accessToken = loginData.access_token;
              token.refreshToken = loginData.refresh_token;
            }
          } catch (error) {
            console.error("[AuthJS] OAuth backend integration error:", error);
            // Fall back to OAuth-only data
            token.id = user.id;
            token.email = user.email;
            token.name = user.name;
            token.picture = user.image;
          }
        }
      }

      // Return previous token if the access token has not expired yet
      if (token.accessTokenExpires && Date.now() < token.accessTokenExpires) {
        return token;
      }

      // Access token has expired, try to refresh it
      console.log("[Auth] Access token expired, attempting refresh...");
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
        session.error = token.error as string | undefined;
      }
      return session;
    },
    async authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnAuthPage = ["/login", "/signup", "/forgot-password"].some(
        (path) => nextUrl.pathname.startsWith(path),
      );
      const isOnPublicPage = nextUrl.pathname === "/";

      // Allow access to public pages
      if (isOnPublicPage) return true;

      // Redirect authenticated users away from auth pages
      if (isLoggedIn && isOnAuthPage) {
        return Response.redirect(new URL("/dashboard", nextUrl));
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
