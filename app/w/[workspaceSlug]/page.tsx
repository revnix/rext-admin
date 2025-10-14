import { WorkspaceDetail } from "@/components/workspace/workspace-detail";

/**
 * Workspace Detail Page
 *
 * Shows comprehensive workspace information including:
 * - Editable workspace details (name, URL, timezone, etc.)
 * - Knowledge summary with quick stats
 * - Analytics dashboard with metrics
 * - Brand voice configuration
 *
 * For knowledge and members management, use dedicated pages:
 * - Knowledge: /w/[workspaceSlug]/knowledge
 * - Members: /w/[workspaceSlug]/users
 */
export default async function WorkspaceRootPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  // Await params (Next.js 15 requirement)
  const { workspaceSlug } = await params;

  return <WorkspaceDetail workspaceSlug={workspaceSlug} />;
}
