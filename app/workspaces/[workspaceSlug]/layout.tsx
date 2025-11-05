import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { WorkspaceProvider } from "@/providers/workspace-provider";

/**
 * Workspace Layout
 *
 * Wraps all workspace-scoped pages with authentication check and workspace context.
 * Each page uses PageLayout component for consistent admin layout with sidebar.
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
    redirect("/login");
  }

  // Await params (Next.js 15 requirement)
  const { workspaceSlug } = await params;

  // Provide workspace context to all child pages
  return (
    <WorkspaceProvider workspaceId={workspaceSlug}>
      {children}
    </WorkspaceProvider>
  );
}
