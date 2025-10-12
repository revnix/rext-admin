import { redirect } from "next/navigation";

/**
 * Workspace Root Page
 *
 * Redirects to the default workspace view (Overview).
 * Users accessing /w/{workspaceSlug} will be automatically redirected to /w/{workspaceSlug}/overview
 *
 * The overview page serves as the workspace dashboard with statistics, recent activity, and quick actions.
 */
export default async function WorkspaceRootPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  // Await params (Next.js 15 requirement)
  const { workspaceSlug } = await params;

  // Redirect to overview as the default workspace view
  redirect(`/w/${workspaceSlug}/overview`);
}
