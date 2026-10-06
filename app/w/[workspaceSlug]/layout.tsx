import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { WorkspaceProvider } from "@/providers/workspace-provider";
import { APIErrorBoundary } from "@/components/ui/error-boundary";
import type { Route } from "next";

/**
 * Workspace Layout
 *
 * Wraps all workspace-scoped pages with authentication check and workspace context.
 * The shell (sidebar, header, dock) comes from app/w/layout.tsx, so it stays mounted
 * while the workspace's pages change.
 *
 * Features:
 * - Authentication check
 * - Workspace context provider
 */
export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspaceSlug: string }>;
}) {
  // Check authentication
  const session = await auth();
  if (!session) {
    redirect("/login" as Route);
  }

  // Await params (Next.js 15 requirement)
  const { workspaceSlug } = await params;

  // Provide workspace context to all child pages
  return (
    <WorkspaceProvider workspaceId={workspaceSlug}>
      <APIErrorBoundary>{children}</APIErrorBoundary>
    </WorkspaceProvider>
  );
}
