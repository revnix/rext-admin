import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { WorkspaceProvider } from "@/providers/workspace-provider";

/**
 * Workspace Layout
 *
 * Wraps all workspace-scoped pages with authentication check and workspace context.
 * Ensures user is authenticated and provides workspace context to all child pages.
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
