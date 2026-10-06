/**
 * Whether a page still waits for a query's data, and so shows its skeleton (D16a). A query held
 * back until an id is known (`enabled: false`) is pending but not loading in TanStack Query v5
 * (`isLoading` is `isPending && isFetching`), so a page that waits on `isLoading` shows its empty or
 * not-found state before it has asked. `willRun: false` is a query that never runs here (the member
 * may not read it): there is nothing to wait for.
 */
export function awaitingData(
  query: { isPending: boolean },
  willRun = true,
): boolean {
  return willRun && query.isPending;
}
