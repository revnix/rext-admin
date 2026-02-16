import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      full_name?: string;
      image: string | null;
      accessToken: string;
      role?: string; // User's primary role
      permissions?: string[]; // User's permissions array
    } & DefaultSession["user"];
    accessTokenExpires?: number; // Timestamp when access token expires
    error?: string; // Error code if token refresh fails
  }

  interface User {
    id: string;
    email: string;
    name: string;
    full_name?: string;
    image: string | null;
    accessToken: string;
    refreshToken: string;
    role?: string; // User's primary role
    permissions?: string[]; // User's permissions array
    rememberMe?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    name: string;
    full_name?: string;
    picture: string | null;
    accessToken: string;
    refreshToken: string;
    role?: string; // User's primary role
    permissions?: string[]; // User's permissions array
    accessTokenExpires?: number; // Timestamp when access token expires
    rememberMe?: boolean; // Whether user chose "remember me"
    error?: string; // Error code if token refresh fails
  }
}
