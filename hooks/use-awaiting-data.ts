import { useWorkspace } from "@/providers/workspace-provider";

/** The workspace as the provider has it: its record once read, or the error that reading it ended in. */
type WorkspaceState = { id?: string; error: Error | null };

/**
 * Whether a page still waits for a query's data, and so shows its skeleton (D16a).
 * - While the workspace is being read (no id, no error) it waits: the queries need its id.
 * - Once reading the workspace failed it stops: nothing more will come, and the page shows its failure.
 * - Then it waits while the query has no data. A query held back until an id is known is pending but
 *   not loading in TanStack Query v5 (`isLoading` is `isPending && isFetching`), so waiting on
 *   `isLoading` shows an empty or not-found state before anything was asked.
 * - `willRun: false` is a query that never runs here (the member may not read it): no wait for it.
 */
export function awaitingData(
  query: { isPending: boolean },
  workspace: WorkspaceState,
  willRun = true,
): boolean {
  if (workspace.error) return false;
  if (!workspace.id) return true;
  return willRun && query.isPending;
}

/** `awaitingData` for the current workspace: what a list or a detail in a workspace waits on. */
export function useAwaitingData(
  query: { isPending: boolean },
  willRun = true,
): boolean {
  const { workspace, error } = useWorkspace();
  return awaitingData(query, { id: workspace?.id, error }, willRun);
}
