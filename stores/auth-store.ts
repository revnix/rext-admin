import { create } from "zustand";
import { registerStoreReset } from "@/lib/store-registry";

interface AuthStore {
  accessToken: string | null;
  refreshToken: string | null;
  setTokens: (accessToken: string, refreshToken: string) => void;
  clearTokens: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  accessToken: null,
  refreshToken: null,
  setTokens: (accessToken: string, refreshToken: string) => {
    set({ accessToken, refreshToken });
    // Store in localStorage for persistence
    if (typeof window !== "undefined") {
      localStorage.setItem("access_token", accessToken);
      localStorage.setItem("refresh_token", refreshToken);
    }
  },
  clearTokens: () => {
    set({ accessToken: null, refreshToken: null });
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    }
  },
}));

// Register with global store registry for logout cleanup
const initialAuthState = useAuthStore.getInitialState();
registerStoreReset(() => useAuthStore.setState(initialAuthState, true));