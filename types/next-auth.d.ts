import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image: string | null;
      accessToken: string;
      refreshToken: string;
    } & DefaultSession["user"];
    error?: string; // Error code if token refresh fails
  }

  interface User {
    id: string;
    email: string;
    name: string;
    image: string | null;
    accessToken: string;
    refreshToken: string;
    rememberMe?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    name: string;
    picture: string | null;
    accessToken: string;
    refreshToken: string;
    accessTokenExpires?: number; // Timestamp when access token expires
    rememberMe?: boolean; // Whether user chose "remember me"
    error?: string; // Error code if token refresh fails
  }
}
