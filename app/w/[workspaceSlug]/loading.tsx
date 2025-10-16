import { RouteLoading } from "@/components/ui/route-loading";

/**
 * Workspace overview loading state
 */
export default function WorkspaceLoading() {
  return <RouteLoading variant="workspace" statCards={4} />;
}
