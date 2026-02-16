import { create } from "zustand";

interface AuthStore {
  accessToken: string | null;
  refreshToken: string | null;
  setTokens: (accessToken: string, refreshToken: string) => void;
  clearTokens: () => void;
}

/**
 * In-memory auth store for impersonation tokens only.
 *
 * SECURITY: Tokens are stored in memory only — never in localStorage or sessionStorage.
 * This limits exposure to the current page lifecycle. On page reload, tokens are cleared
 * and must be re-obtained from the server.
 *
 * For normal authentication, use the NextAuth session (HTTP-only cookies).
 * This store is ONLY used during active impersonation sessions.
 */
export const useAuthStore = create<AuthStore>((set) => ({
  accessToken: null,
  refreshToken: null,
  setTokens: (accessToken: string, refreshToken: string) => {
    set({ accessToken, refreshToken });
  },
  clearTokens: () => {
    set({ accessToken: null, refreshToken: null });
  },
}));
