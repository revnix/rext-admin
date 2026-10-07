import { PageSkeleton } from "@/components/layouts";

/**
 * Loading state for /w, the workspace list, inside the shell: the list's shape, not the root's bare
 * spinner (C11 #554). Creating a workspace has its own, form-shaped.
 */
export default function WorkspacesLoading() {
  return <PageSkeleton layout="list" />;
}
