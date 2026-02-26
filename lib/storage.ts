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
export const getStorage = (): Storage => {
  if (typeof window === "undefined") {
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
