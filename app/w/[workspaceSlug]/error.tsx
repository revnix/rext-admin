"use client";

import { RouteError } from "@/components/ui/route-error";

/**
 * Workspace Error Boundary
 *
 * Catches errors within workspace-scoped pages.
 */
export default function WorkspaceError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteError
      {...props}
      title="Workspace Error"
      logContext="WorkspaceError"
      navigationType="link"
      navigationLink="/"
      navigationLabel="Workspaces"
    />
  );
}
