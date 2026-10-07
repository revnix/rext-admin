import { PageSkeleton } from "@/components/layouts";

/**
 * Loading state for creating a workspace, a new account's first page after login: the shell and the
 * form's shape at once, not the root's bare spinner (C11 #554).
 */
export default function CreateWorkspaceLoading() {
  return <PageSkeleton layout="form" />;
}
