import { PageSkeleton } from "@/components/layouts";

/**
 * Loading state for /w (the workspace list, creating a workspace), inside the shell: a new
 * account's first page after login shows the shell at once, not the root's bare spinner (C11 #554).
 */
export default function WorkspacesLoading() {
  return <PageSkeleton layout="form" />;
}
