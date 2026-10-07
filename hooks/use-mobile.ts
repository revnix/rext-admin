import * as React from "react";

/**
 * The shell's one mobile cutoff (design/app-language.md §5 and §9): under
 * 1024 px (Tailwind's `lg`) the sidebar is a sheet with a bottom bar; from
 * 1024 to 1279 px (`lg` to `xl`) it shows icons only.
 */
export const MOBILE_BREAKPOINT = 1024;
export const COMPACT_BREAKPOINT = 1280;

function useMediaQuery(query: string): boolean {
  const subscribe = React.useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );
  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export function useIsMobile() {
  return useMediaQuery(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
}

/** From 1024 to 1279 px, where the sidebar shows icons unless the person chose otherwise. */
export function useIsCompact() {
  return useMediaQuery(
    `(min-width: ${MOBILE_BREAKPOINT}px) and (max-width: ${COMPACT_BREAKPOINT - 1}px)`,
  );
}
