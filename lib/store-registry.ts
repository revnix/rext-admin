/**
 * Store Reset Registry
 *
 * Maintains a set of reset functions for all Zustand stores.
 * Used during logout to ensure all in-memory state is cleared
 * without requiring a hard page reload.
 *
 * @see https://zustand.docs.pmnd.rs/guides/how-to-reset-state
 */

import { log } from "@/lib/logger";

const storeResetFunctions = new Set<() => void>();

/**
 * Register a store reset function.
 * Call this when creating a Zustand store to register it for global reset.
 */
export function registerStoreReset(resetFn: () => void): void {
  storeResetFunctions.add(resetFn);
}

/**
 * Unregister a store reset function.
 * Call this if a store is destroyed (unlikely in most apps).
 */
export function unregisterStoreReset(resetFn: () => void): void {
  storeResetFunctions.delete(resetFn);
}

/**
 * Reset all registered Zustand stores to their initial state.
 * Call this during logout to purge all in-memory user data.
 */
export function resetAllStores(): void {
  storeResetFunctions.forEach((resetFn) => {
    try {
      resetFn();
    } catch (error) {
      log.error("[StoreRegistry] Failed to reset store:", error);
    }
  });
}
