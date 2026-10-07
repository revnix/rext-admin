import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      full_name: string;
      display_name?: string | null;
      image: string | null;
      accessToken: string;
      role?: string; // User's primary role
      permissions?: string[]; // User's permissions array
    } & Omit<NonNullable<DefaultSession["user"]>, "refreshToken">;
    accessTokenExpires?: number; // Timestamp when access token expires
    error?: string; // Error code if token refresh fails
    /** The last Google or GitHub login: which, whether it created the account, and when. */
    oauthLogin?: OAuthLogin;
  }

  interface User {
    id: string;
    email: string;
    full_name: string;
    display_name?: string | null;
    image: string | null;
    accessToken: string;
    refreshToken: string;
    expiresIn?: number; // Token lifetime in seconds (from backend)
    expiresAt?: string | number; // Token expiry as ISO string or epoch (from backend)
    role?: string; // User's primary role
    permissions?: string[]; // User's permissions array
    rememberMe?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    full_name: string;
    display_name?: string | null;
    picture: string | null;
    accessToken: string;
    refreshToken: string;
    role?: string; // User's primary role
    permissions?: string[]; // User's permissions array
    accessTokenExpires?: number; // Timestamp when access token expires
    rememberMe?: boolean; // Whether user chose "remember me"
    error?: string; // Error code if token refresh fails
    oauthLogin?: OAuthLogin;
  }
}

/**
 * Set when Google or GitHub logs someone in; analytics records it once (`OAuthLoginRecord` in
 * providers/posthog-provider.tsx).
 */
interface OAuthLogin {
  provider: string;
  /** The backend created the account on this login: a sign-up, not a sign-in. */
  isNew: boolean;
  /** When, so the record is made once per login. */
  at: number;
}
