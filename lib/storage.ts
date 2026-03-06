import { safeJsonParse } from "@/lib/utils";

/**
 * SSR-safe storage implementation for Zustand persist middleware.
 *
 * Returns the browser's localStorage when running in a client environment,
 * or a no-op storage stub during SSR (where `window` is undefined).
 *
 * Usage with Zustand persist middleware:
 * ```ts
 * import { createJSONStorage, persist } from "zustand/middleware";
 * import { getStorage } from "@/lib/storage";
 *
 * const useMyStore = create(
 *   persist(
 *     (set) => ({ ... }),
 *     {
 *       name: "my-store",
 *       storage: createJSONStorage(() => getStorage()),
 *     },
 *   ),
 * );
 * ```
 */

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof Storage !== "undefined";
}

function createStorageHelper(getStore: () => Storage) {
  return {
    /**
     * Read a string value from storage.
     * Returns `defaultValue` during SSR or if the key does not exist.
     */
    getString(key: string, defaultValue: string | null = null): string | null {
      if (!isBrowser()) return defaultValue;
      try {
        return getStore().getItem(key) ?? defaultValue;
      } catch {
        return defaultValue;
      }
    },

    /**
     * Read and JSON-parse a typed value from storage.
     * Returns `defaultValue` during SSR, on missing key, or on parse failure.
     */
    getJSON<T>(key: string, defaultValue: T): T {
      if (!isBrowser()) return defaultValue;
      try {
        const raw = getStore().getItem(key);
        if (raw === null) return defaultValue;
        return safeJsonParse<T>(raw, defaultValue) ?? defaultValue;
      } catch {
        return defaultValue;
      }
    },

    /**
     * Write a string value to storage.
     * No-ops during SSR or on storage failure.
     */
    setString(key: string, value: string): void {
      if (!isBrowser()) return;
      try {
        getStore().setItem(key, value);
      } catch {
        // Storage full or disabled — silently ignore
      }
    },

    /**
     * JSON-stringify and write a value to storage.
     * No-ops during SSR or on storage failure.
     */
    setJSON(key: string, value: unknown): void {
      if (!isBrowser()) return;
      try {
        getStore().setItem(key, JSON.stringify(value));
      } catch {
        // Storage full or disabled — silently ignore
      }
    },

    /**
     * Remove a key from storage.
     * No-ops during SSR or on storage failure.
     */
    remove(key: string): void {
      if (!isBrowser()) return;
      try {
        getStore().removeItem(key);
      } catch {
        // Silently ignore
      }
    },

    /**
     * Check whether a key exists and has a truthy value ("true").
     * Returns `false` during SSR.
     */
    getBoolean(key: string): boolean {
      if (!isBrowser()) return false;
      try {
        return getStore().getItem(key) === "true";
      } catch {
        return false;
      }
    },

    /**
     * Set a boolean flag in storage.
     */
    setBoolean(key: string, value: boolean): void {
      if (!isBrowser()) return;
      try {
        if (value) {
          getStore().setItem(key, "true");
        } else {
          getStore().removeItem(key);
        }
      } catch {
        // Silently ignore
      }
    },
  };
}

/** SSR-safe wrapper around `window.localStorage` */
export const local = createStorageHelper(() => localStorage);

/** SSR-safe wrapper around `window.sessionStorage` */
export const session = createStorageHelper(() => sessionStorage);

/** Re-export isBrowser for use by zustand `getStorage()` factories */
export { isBrowser };

export const getStorage = (): Storage => {
  if (!isBrowser()) {
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      key: () => null,
      length: 0,
    };
  }
  return localStorage;
};
