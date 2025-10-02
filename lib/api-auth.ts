/**
 * API Authentication and Bearer Token Management
 *
 * Handles authentication tokens, automatic refresh, and secure storage
 * for all API operations including workspace and knowledge management.
 */

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { logger } from "@/lib/logger";

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface AuthToken {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number; // Unix timestamp
  tokenType: "Bearer" | "API-Key";
  scope?: string[];
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
}

export interface AuthState {
  token: AuthToken | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  lastRefresh: number;
}

export interface AuthActions {
  setToken: (token: AuthToken) => void;
  setUser: (user: AuthUser) => void;
  clearAuth: () => void;
  refreshToken: () => Promise<void>;
  isTokenExpired: () => boolean;
  getAuthHeaders: () => Record<string, string>;
  logout: () => void;
}

// ============================================================================
// AUTH STORE
// ============================================================================

// SSR-safe storage
const getStorage = () => {
  if (typeof window === "undefined") {
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    };
  }
  return localStorage;
};

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      // Initial state
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      lastRefresh: 0,

      // Actions
      setToken: (token: AuthToken) => {
        set({
          token,
          isAuthenticated: true,
          lastRefresh: Date.now(),
        });
      },

      setUser: (user: AuthUser) => {
        set({ user });
      },

      clearAuth: () => {
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          isLoading: false,
          lastRefresh: 0,
        });
      },

      refreshToken: async () => {
        const state = get();
        if (!state.token?.refreshToken) {
          state.clearAuth();
          return;
        }

        set({ isLoading: true });

        try {
          const response = await fetch("/api/auth/refresh", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              refreshToken: state.token.refreshToken,
            }),
          });

          if (!response.ok) {
            throw new Error("Token refresh failed");
          }

          const data = await response.json();
          state.setToken(data.token);

          if (data.user) {
            state.setUser(data.user);
          }
        } catch (error) {
          logger
            .forComponent("AuthStore")
            .error("Token refresh failed", { error });
          state.clearAuth();
          // Redirect to login
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
        } finally {
          set({ isLoading: false });
        }
      },

      isTokenExpired: () => {
        const { token } = get();
        if (!token) return true;

        // Add 5 minute buffer before expiration
        const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
        return Date.now() >= token.expiresAt - bufferTime;
      },

      getAuthHeaders: (): Record<string, string> => {
        const { token } = get();
        if (!token) return {};

        return {
          Authorization: `${token.tokenType} ${token.accessToken}`,
        };
      },

      logout: () => {
        const state = get();

        // Clear token on server if possible
        if (state.token) {
          fetch("/api/auth/logout", {
            method: "POST",
            headers: state.getAuthHeaders(),
          }).catch(() => {
            // Ignore errors on logout
          });
        }

        state.clearAuth();

        // Redirect to login
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      },
    }),
    {
      name: "auth-store",
      storage: createJSONStorage(() => getStorage()),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        lastRefresh: state.lastRefresh,
      }),
    },
  ),
);

// ============================================================================
// AUTH MANAGER CLASS
// ============================================================================

export class AuthManager {
  private readonly log = logger.forComponent("AuthManager");
  private refreshPromise: Promise<void> | null = null;

  /**
   * Get authentication headers for API requests
   */
  getAuthHeaders(): Record<string, string> {
    const store = useAuthStore.getState();
    return store.getAuthHeaders();
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const store = useAuthStore.getState();
    return store.isAuthenticated && !store.isTokenExpired();
  }

  /**
   * Ensure token is valid, refresh if needed
   */
  async ensureValidToken(): Promise<void> {
    const store = useAuthStore.getState();

    if (!store.token) {
      throw new Error("No authentication token available");
    }

    if (store.isTokenExpired()) {
      // Prevent multiple concurrent refresh attempts
      if (!this.refreshPromise) {
        this.refreshPromise = store.refreshToken();
      }

      try {
        await this.refreshPromise;
      } finally {
        this.refreshPromise = null;
      }
    }
  }

  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<AuthUser> {
    this.log.info("Attempting login", { email });

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:2024"}/api/user/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Login failed");
      }

      const responseData = await response.json();

      // The backend returns the data in a "data" property
      const data = responseData.data;

      // Create token object from response
      const token: AuthToken = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        tokenType: "Bearer",
        expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour expiry
      };

      // Create user object
      const user: AuthUser = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.username,
        role: data.user.roles?.[0] || "user",
        permissions: [], // Empty until backend provides permission resolution
      };

      // Store token and user
      const store = useAuthStore.getState();
      store.setToken(token);
      store.setUser(user);

      this.log.info("Login successful", {
        userId: user.id,
        role: user.role,
        permissionsCount: user.permissions.length,
      });
      return user;
    } catch (error) {
      this.log.error("Login failed", { email, error });
      throw error;
    }
  }

  /**
   * Login with API key
   */
  async loginWithApiKey(apiKey: string): Promise<AuthUser> {
    this.log.info("Attempting API key login");

    try {
      const response = await fetch("/api/auth/api-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ apiKey }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "API key authentication failed");
      }

      const data = await response.json();

      // Create token object for API key
      const token: AuthToken = {
        accessToken: apiKey,
        tokenType: "API-Key",
        expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
      };

      // Store token and user
      const store = useAuthStore.getState();
      store.setToken(token);
      store.setUser(data.user);

      this.log.info("API key login successful", { userId: data.user.id });
      return data.user;
    } catch (error) {
      this.log.error("API key login failed", { error });
      throw error;
    }
  }

  /**
   * Register a new user
   */
  async signup(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }): Promise<void> {
    this.log.info("Attempting signup", { email: data.email });

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:2024"}/api/user/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            first_name: data.firstName,
            last_name: data.lastName,
            username: data.email.split("@")[0], // Generate username from email
            email: data.email,
            password: data.password,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Signup failed");
      }

      this.log.info("Signup successful", { email: data.email });
    } catch (error) {
      this.log.error("Signup failed", { email: data.email, error });
      throw error;
    }
  }

  /**
   * Request password reset
   */
  async forgotPassword(email: string): Promise<void> {
    this.log.info("Requesting password reset", { email });

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:2024"}/api/user/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to send reset email");
      }

      this.log.info("Password reset email sent", { email });
    } catch (error) {
      this.log.error("Password reset request failed", { email, error });
      throw error;
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    this.log.info("Resetting password");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:2024"}/api/user/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
            new_password: newPassword,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Password reset failed");
      }

      this.log.info("Password reset successful");
    } catch (error) {
      this.log.error("Password reset failed", { error });
      throw error;
    }
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<void> {
    this.log.info("Verifying email");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:2024"}/api/user/verify-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Email verification failed");
      }

      this.log.info("Email verification successful");
    } catch (error) {
      this.log.error("Email verification failed", { error });
      throw error;
    }
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    this.log.info("Logging out user");
    const store = useAuthStore.getState();
    store.logout();
  }

  /**
   * Get current user
   */
  getCurrentUser(): AuthUser | null {
    const store = useAuthStore.getState();
    return store.user;
  }

  /**
   * Check if user has permission
   */
  hasPermission(permission: string): boolean {
    const user = this.getCurrentUser();

    // Check actual permissions first (when backend provides them)
    if (user?.permissions.includes(permission)) {
      return true;
    }

    // Fallback: Admin role has all permissions
    // TODO: Remove this once proper permission resolution is implemented
    if (user?.role === "admin") {
      this.log.debug("Using role-based permission check", {
        permission,
        userRole: user.role,
        granted: true,
      });
      return true;
    }

    return false;
  }

  /**
   * Check if user has role
   */
  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }
}

// ============================================================================
// AUTHENTICATED FETCH WRAPPER
// ============================================================================

export class AuthenticatedFetch {
  private readonly authManager = new AuthManager();
  private readonly log = logger.forComponent("AuthenticatedFetch");

  /**
   * Make authenticated fetch request
   */
  async fetch(url: string, options: RequestInit = {}): Promise<Response> {
    // Ensure we have a valid token
    await this.authManager.ensureValidToken();

    // Add authentication headers
    const authHeaders = this.authManager.getAuthHeaders();
    const headers = {
      ...authHeaders,
      ...options.headers,
    };

    this.log.debug("Making authenticated request", {
      url,
      method: options.method || "GET",
    });

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle authentication errors
      if (response.status === 401) {
        this.log.warn("Received 401, attempting token refresh", { url });

        // Try to refresh token and retry request
        try {
          await this.authManager.ensureValidToken();
          const newHeaders = {
            ...this.authManager.getAuthHeaders(),
            ...options.headers,
          };

          return fetch(url, {
            ...options,
            headers: newHeaders,
          });
        } catch (refreshError) {
          this.log.error("Token refresh failed, redirecting to login", {
            refreshError,
          });
          this.authManager.logout();
          throw new Error("Authentication failed");
        }
      }

      return response;
    } catch (error) {
      this.log.error("Authenticated fetch failed", { url, error });
      throw error;
    }
  }

  /**
   * Make authenticated JSON request
   */
  async fetchJson<T = unknown>(
    url: string,
    options: RequestInit = {},
  ): Promise<T> {
    const response = await this.fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Request failed with status ${response.status}`,
      );
    }

    return response.json();
  }
}

// ============================================================================
// DEFAULT INSTANCES AND EXPORTS
// ============================================================================

export const authManager = new AuthManager();
export const authenticatedFetch = new AuthenticatedFetch();

// ============================================================================
// REACT HOOKS
// ============================================================================

export function useAuth() {
  const {
    token,
    user,
    isAuthenticated,
    isLoading,
    setToken,
    setUser,
    clearAuth,
    refreshToken,
    isTokenExpired,
    getAuthHeaders,
    logout,
  } = useAuthStore();

  const login = async (email: string, password: string) => {
    return authManager.login(email, password);
  };

  const loginWithApiKey = async (apiKey: string) => {
    return authManager.loginWithApiKey(apiKey);
  };

  const signup = async (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) => {
    return authManager.signup(data);
  };

  const forgotPassword = async (email: string) => {
    return authManager.forgotPassword(email);
  };

  const resetPassword = async (token: string, newPassword: string) => {
    return authManager.resetPassword(token, newPassword);
  };

  const verifyEmail = async (token: string) => {
    return authManager.verifyEmail(token);
  };

  const hasPermission = (permission: string) => {
    return authManager.hasPermission(permission);
  };

  const hasRole = (role: string) => {
    return authManager.hasRole(role);
  };

  return {
    // State
    token,
    user,
    isAuthenticated,
    isLoading,
    isTokenExpired: isTokenExpired(),

    // Actions
    login,
    loginWithApiKey,
    signup,
    forgotPassword,
    resetPassword,
    verifyEmail,
    logout,
    refreshToken,
    hasPermission,
    hasRole,
    getAuthHeaders,

    // Internal actions (for advanced use)
    setToken,
    setUser,
    clearAuth,
  };
}

/**
 * Hook for getting authenticated fetch instance
 */
export function useAuthenticatedFetch() {
  return authenticatedFetch;
}
