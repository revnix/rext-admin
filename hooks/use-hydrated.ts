import { useSyncExternalStore } from "react";

const noSubscription = () => () => {};

/**
 * False in the server's HTML and while React hydrates it, true once the page runs. A form's submit
 * button waits for it: until then a submit is the browser's own, which skips the page's handler
 * (and, without `method="post"`, would put the fields, a password among them, in the address).
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noSubscription,
    () => true,
    () => false,
  );
}
